<script setup>
	import { ref, onMounted, computed } from 'vue'
	import { privacyAgreement, vipServer } from '@/utils/ag.js'
	import { useUserInfoStore } from '@/store/user.js'
	import { uploadAvatar, updateUserProfile } from '@/utils/profileHelper.js' // 引入工具函数
	// userStore
	const userStore = useUserInfoStore( )
	// 用户云对象
	const userApi = uniCloud.importObject( 'userWx' )
	//授权同意
	const aloneChecked = ref( false )
	// checkbox组的值
	const checkboxValue = ref([])
	// 弹框
	const modelShow = ref( false )
	// 完善信息弹框
	const profileSetupShow = ref( false )
	// 昵称
	const nickName = ref('')
	// 是否已获取微信用户信息
	const hasWechatInfo = ref(false)
	// 头像（fileID格式）
	const avatarUrl = ref('/static/images/touxiang.png')
	// 显示用的头像URL（转换后的HTTPS链接）
	const displayAvatarUrl = ref('/static/images/touxiang.png')
	// 重定向URL
	const redirectUrl = ref('')
	// 手机号授权数据（临时存储）
	const phoneAuthData = ref(null)
	// 是否需要手机号授权（用于控制按钮的open-type）
	const needPhoneAuth = ref(false)

	// 计算属性：判断是否可以完成登录（头像和昵称都设置完成）
	const canCompleteLogin = computed(() => {
		// 头像必须已设置且不是默认头像
		const hasValidAvatar = hasWechatInfo.value && avatarUrl.value && avatarUrl.value !== '/static/images/touxiang.png'
		// 昵称必须已输入且长度不超过限制
		const hasValidNickname = nickName.value && nickName.value.trim().length > 0 && nickName.value.trim().length <= 20
	
		return hasValidAvatar && hasValidNickname
	})

	// 页面加载时获取重定向参数
	onMounted(() => {
		// 获取当前页面参数
		const pages = getCurrentPages()
		const currentPage = pages[pages.length - 1]
		const options = currentPage.options || {}
		
		// 检查是否有重定向参数
		if (options.redirect) {
			redirectUrl.value = decodeURIComponent(options.redirect)
			console.log('获取到重定向URL:', redirectUrl.value)
		}
	})
	
	// 转换头像URL（将cloud://格式转换为可显示的链接）
	const updateDisplayAvatar = async () => {
		const url = avatarUrl.value
		
		if (!url) {
			displayAvatarUrl.value = '/static/images/touxiang.png'
			return
		}
		
		// 如果是本地路径，直接使用
		if (url.startsWith('/') || url.startsWith('./')) {
			displayAvatarUrl.value = url
			return
		}
		
		// 如果是HTTPS链接，直接使用
		if (url.startsWith('http://') || url.startsWith('https://')) {
			displayAvatarUrl.value = url
			return
		}
		
		// 如果是cloud://格式，转换为临时链接
		if (url.startsWith('cloud://')) {
			try {
				const result = await uniCloud.getTempFileURL({
					fileList: [url]
				})
				
				if (result.fileList && result.fileList[0] && result.fileList[0].tempFileURL) {
					displayAvatarUrl.value = result.fileList[0].tempFileURL
					console.log('登录页头像转换成功:', displayAvatarUrl.value)
				} else {
					console.warn('无法获取临时链接，使用默认头像')
					displayAvatarUrl.value = '/static/images/touxiang.png'
				}
			} catch (error) {
				console.error('转换fileID失败:', error)
				displayAvatarUrl.value = '/static/images/touxiang.png'
			}
			return
		}
		
		// 其他情况，使用默认头像
		displayAvatarUrl.value = '/static/images/touxiang.png'
	}
	
	// 服务和隐私协议
	const navigateToAgreement = ( type ) => {
		console.log( type )
		let url = ''
		if ( type === 'vipServer' ) {
			url = vipServer // 服务协议链接
			console.log( '服务协议' )
		} else if ( type === 'privacyAgreement' ) {
			url = privacyAgreement // 隐私权政策链接
			console.log( '隐私' )
		}

		// 使用 `web-view` 打开协议页面
		uni.navigateTo( {
			url: `/pages/webview/webview?url=${encodeURIComponent(url)}`
		} )
	}

	let codeRes
	// 点击登录
	const clickLogin = async ( ) => {
		if ( !aloneChecked.value ) {
			// 自动勾选同意协议
			aloneChecked.value = true
			// 延迟一下再继续登录流程，让用户有时间看到勾选动作
			await new Promise(resolve => setTimeout(resolve, 100))
		}
		const res = await uni.login( )
		codeRes = res.code
		
		// 先检查用户是否已经存在完整信息
		try {
			// 显示加载提示
			uni.showLoading({
				title: '检查用户信息...'
			})
			
			// 调用云函数检查用户是否已存在且信息完整
			const checkRes = await userApi.checkUserInfoExists({ code: codeRes })
			console.log('检查用户信息结果:', checkRes)
			
			// 隐藏加载提示
			uni.hideLoading()
			
			// 如果用户已存在且信息完整，直接登录，无需手机号授权
			if (checkRes && checkRes.code === 0 && checkRes.data && checkRes.data.hasCompleteInfo) {
				// 构建用户数据
				userInfoData.value = {
					uid: checkRes.data.userInfo._id,
					nickName: checkRes.data.userInfo.nickName,
					avatarUrl: checkRes.data.userInfo.avatarUrl,
					mobile: checkRes.data.userInfo.mobile,
					isLogin: true,
					role: checkRes.data.userInfo.role || ['user'],
					openid_wx: checkRes.data.userInfo.openid_wx
				}
				
				console.log(userInfoData.value, '已登录用户，直接登录')
				// 储存用户信息
				userStore.setUserInfo(userInfoData.value)
				uni.showToast({
					icon: "success",
					title: '登录成功'
				})
				
				// 调用登录成功跳转
				setTimeout(() => {
					loginSuccess()
				}, 500)
				
				// 确保不触发手机号授权
				needPhoneAuth.value = false
			} else {
				// 用户不存在或信息不完整，需要手机号授权
				console.log('用户信息不完整，需要授权手机号')
				needPhoneAuth.value = true
			}
		} catch (error) {
			// 隐藏加载提示
			uni.hideLoading()
			console.error('检查用户信息失败:', error)
			// 出错时也尝试进行手机号授权
			needPhoneAuth.value = true
		}
	}

	let userData

	// 用户登录构建数据 类型声明
	const userInfoData = ref( {
		uid: '', //本地平台ID
		nickName: "", //昵称
		avatarUrl: "/static/images/touxiang.png", //头像地址
		mobile: "", //手机号码
		isLogin: false, //登录状态
		role: [ ], //默认角色
		openid_wx: ''
	} )

	// 手机号授权（登录按钮触发）
	const getMobile = async ( e ) => {
		console.log('手机号授权回调', e )
		
		// 手机号授权失败
		if ( e.detail.errMsg !== 'getPhoneNumber:ok' ) {
			if (e.detail.errMsg === 'getPhoneNumber:fail user deny') {
				uni.showToast({
					title: '需要授权手机号才能登录',
					icon: 'none'
				})
			} else {
				uni.showToast({
					title: '获取手机号失败，请重试',
					icon: 'none'
				})
			}
			return
		}

		// 手机号授权成功
		try {
			uni.showLoading({
				title: '验证手机号...'
			})
			
			// 获取新的code
			const res = await uni.login( )
			const newCode = res.code
			
			// 临时存储手机号授权数据
			phoneAuthData.value = {
				code: newCode,
				encryptedData: e.detail.encryptedData,
				iv: e.detail.iv
			}
			
			uni.hideLoading()
			
			// 手机号授权成功后，显示完善信息弹窗
			profileSetupShow.value = true
			console.log('手机号授权成功，显示头像昵称设置弹窗')
			
		} catch (error) {
			uni.hideLoading()
			console.error('处理手机号授权失败:', error)
			uni.showToast({
				title: '登录失败，请重试',
				icon: 'none'
			})
		}
	}
	
	// 选择头像（使用官方推荐方式）
	const onChooseAvatar = async (e) => {
		console.log('选择头像', e)
		// 检查用户是否取消了选择
		if (!e.detail || !e.detail.avatarUrl) {
			console.log('用户取消了头像选择')
			// 不显示错误提示，因为这是用户的正常操作
			return
		}
		
		// 检查头像URL是否是临时链接（http://tmp 或 wxfile://）
		if (e.detail.avatarUrl.startsWith('http://tmp') || e.detail.avatarUrl.startsWith('wxfile://')) {
			// 使用uploadAvatar上传到七牛云获取永久链接
			uni.showLoading({
				title: '上传头像中...'
			})
			
			console.log('检测到临时文件，开始上传到七牛云:', e.detail.avatarUrl);
			
			try {
				// 使用uploadAvatar函数上传到七牛云
				const qiniuAvatarUrl = await uploadAvatar(e.detail.avatarUrl, 'temp_user');
				
				console.log('头像上传成功，七牛云URL:', qiniuAvatarUrl);
				
				// 使用七牛云URL
				avatarUrl.value = qiniuAvatarUrl;
				// 立即转换并显示
				await updateDisplayAvatar();
				
				hasWechatInfo.value = true;
				uni.hideLoading();
				uni.showToast({
					title: '头像设置成功',
					icon: 'success'
				});
			} catch (error) {
				uni.hideLoading();
				console.error('头像上传失败:', error);
				// 如果上传失败，使用默认头像
				avatarUrl.value = '/static/images/touxiang.png';
				hasWechatInfo.value = false;
				uni.showToast({
					title: '头像上传失败，请重试',
					icon: 'none'
				});
			}
		} else {
			// 直接使用链接
			avatarUrl.value = e.detail.avatarUrl
			console.log('使用直接链接:', e.detail.avatarUrl);
			// 立即转换并显示
			await updateDisplayAvatar()
			hasWechatInfo.value = true
			uni.showToast({
				title: '头像设置成功',
				icon: 'success'
			})
		}
	}
	
	// 昵称输入（使用官方推荐方式）
	const onNicknameInput = (e) => {
		console.log('昵称输入', e)
		nickName.value = e.detail.value
		// 检查昵称是否有内容，更新验证状态
		if (nickName.value.trim()) {
			// 如果昵称有内容且已设置头像，则认为信息完善
			if (hasWechatInfo.value) {
				// 可以在这里添加额外的完善状态逻辑
			}
		}
	}
	
	// 取消设置（关闭弹窗）
	const skipSetup = () => {
		profileSetupShow.value = false
	}

	// 确定按钮处理逻辑 - 完成登录
	const handleConfirm = async () => {
		console.log('点击确定按钮，开始验证头像和昵称')
		
		// 第一步：验证头像是否已设置
		if (!hasWechatInfo.value || !avatarUrl.value || avatarUrl.value === '/static/images/touxiang.png') {
			uni.showToast({
				title: '请先点击头像按钮选择头像',
				icon: 'none',
				duration: 2000
			})
			return
		}
		
		// 第二步：验证昵称是否已输入
		if (!nickName.value || !nickName.value.trim()) {
			uni.showToast({
				title: '请输入昵称后再继续',
				icon: 'none',
				duration: 2000
			})
			return
		}
		
		// 第三步：验证昵称长度不超过限制
		if (nickName.value.trim().length > 20) {
			uni.showToast({
				title: '昵称不能超过20个字符',
				icon: 'none',
				duration: 2000
			})
			return
		}
		
		// 第四步：验证是否已完成手机号授权
		if (!phoneAuthData.value) {
			uni.showToast({
				title: '请先完成手机号授权',
				icon: 'none',
				duration: 2000
			})
			return
		}
		
		// 所有验证通过，开始登录
		try {
			uni.showLoading({
				title: '登录中...'
			})
			
			// 构建请求参数
			const params = {
				code: phoneAuthData.value.code,
				encryptedData: phoneAuthData.value.encryptedData,
				iv: phoneAuthData.value.iv,
				nickName: nickName.value.trim(),
				avatarUrl: avatarUrl.value
			}
			console.log('请求登录参数', params)
			
			// 请求服务器手机号登录
			const response = await userApi.loginByPhoneWx(params)
			console.log('服务器返回', response)
			
			uni.hideLoading()
			
			// 登录成功
			if (response.data && response.data._id) {
				// 构建用户数据
				userInfoData.value = {
					uid: response.data._id,
					nickName: nickName.value.trim(),
					avatarUrl: avatarUrl.value,
					mobile: response.data.mobile,
					isLogin: true,
					role: response.data.role || ['user'],
					openid_wx: response.data.openid_wx
				}
				
				console.log(userInfoData.value, '用户登录成功')
				// 储存用户信息
				userStore.setUserInfo(userInfoData.value)
				uni.showToast({
					icon: "success",
					title: '登录成功'
				})
				
				// 关闭弹窗
				profileSetupShow.value = false
				// 清空临时数据
				phoneAuthData.value = null
			
				// 调用登录成功跳转
				setTimeout(() => {
					loginSuccess()
				}, 500)
			} else {
				throw new Error('登录失败')
			}
		} catch (error) {
			uni.hideLoading()
			console.error('登录错误:', error)
			uni.showToast({
				title: '登录失败，请重试',
				icon: 'none',
				duration: 2000
			})
		}
	}

	// 此函数已废弃，改为在登录按钮上直接使用 open-type="getPhoneNumber"
	// 保留用于兼容性
	const triggerPhoneAuth = () => {
		console.log('triggerPhoneAuth 已废弃')
	}

	// 此函数已废弃，手机号授权改为在登录按钮上处理
	// 保留用于兼容性
	const getPhoneNumber = async (e) => {
		console.log('getPhoneNumber 已废弃，应使用 getMobile')
	}
	
	// 关闭完善信息弹窗
	const closeProfileSetup = () => {
		profileSetupShow.value = false
		// 清空临时数据
		phoneAuthData.value = null
		nickName.value = ''
		avatarUrl.value = '/static/images/touxiang.png'
		displayAvatarUrl.value = '/static/images/touxiang.png'
		hasWechatInfo.value = false
		console.log('关闭完善信息弹窗并清空数据')
	}
	// 登录成功后的处理
	const loginSuccess = ( ) => {
		// 发送登录成功事件
		uni.$emit( 'loginSuccess' )
		
		// 直接执行跳转逻辑，不再显示引导弹窗
		handleRedirect()
	}
	
	// 处理页面跳转的通用方法
	const handleRedirect = () => {
		// 如果有重定向URL，则跳转到该URL
		if (redirectUrl.value) {
			console.log('正在重定向到:', redirectUrl.value)
			uni.redirectTo({
				url: redirectUrl.value,
				fail: (err) => {
					console.error('重定向失败:', err)
					// 如果重定向失败，返回上一页
					uni.navigateBack({
						delta: 1,
						fail: () => {
							// 如果返回失败（没有上一页），则跳转到首页
							uni.switchTab({
								url: '/pages/index/index'
							})
						}
					})
				}
			})
		} else {
			// 如果没有重定向URL，返回上一页
			uni.navigateBack({
				delta: 1,
				fail: () => {
					// 如果返回失败（没有上一页），则跳转到首页
					uni.switchTab({
						url: '/pages/index/index'
					})
				}
			})
		}
	}
</script>

<template>
	<view class="loginPages">
		<view class="bg">
		</view>
		<!-- 标题 -->
		<view class="title">
			<view class="logo">
				<image src="/static/images/logo.png" mode="aspectFit"></image>
			</view>
			<!-- 提示词 -->
			<view class="wenben">
				欢迎登录进行使用
			</view>
		</view>
		<!-- 隐私协议 -->
		<view class="authLogin">
			<view class="agree">
				<u-checkbox-group v-model="checkboxValue">
					<u-checkbox activeColor="#46b0fe" class="checkbox" name="agree" :checked="aloneChecked" @change="(e) => { aloneChecked = e }" shape="circle">
					</u-checkbox>
				</u-checkbox-group>
				<view class="text-wrapper">
					<text class="normal-text">我已阅读并同意</text>
					<view class="link-text" @click="navigateToAgreement('vipServer')">
						服务协议
					</view>
					<text class="normal-text">和</text>
					<view class="link-text" @click="navigateToAgreement('privacyAgreement')">
						隐私政策
					</view>
				</view>
			</view>
			<!-- 登录按钮 -->
			<view class="login">
				<button 
					class="btn" 
					:open-type="needPhoneAuth ? 'getPhoneNumber' : ''"
					@getphonenumber="getMobile" 
					@click="clickLogin"
				>一键登录</button>
			</view>
		</view>
		<!-- 完善个人信息弹窗 -->
		<view class="profileSetupModel" v-if="profileSetupShow">
			<view class="profile-modal">
				<!-- 关闭按钮 -->
				<view class="close-btn" @click="closeProfileSetup">×</view>
				
				<!-- 顶部提示 -->
				<view class="top-tip">
					<view class="star-icon">完善个人信息</view>
					<view class="tip-text">手机号验证成功，请设置您的头像和昵称</view>
					<view class="divider"></view>
				</view>
				
				<!-- 头像设置 -->
				<view class="avatar-section">
					<button class="avatar-container" :class="{ 'has-wechat-info': hasWechatInfo }" open-type="chooseAvatar" @chooseavatar="onChooseAvatar">
						<image :src="displayAvatarUrl" mode="aspectFill" class="avatar-img"></image>
						<view class="camera-icon" v-if="!hasWechatInfo">
							<text class="iconfont icon-camera">📷</text>
							<text class="upload-text">点击选择头像</text>
						</view>
						<view class="success-icon" v-if="hasWechatInfo">
							<text>✓</text>
						</view>
					</button>
					<view class="required-text" :class="{ 'success-text': hasWechatInfo }">
						{{ hasWechatInfo ? '已设置头像' : '选择头像' }}
					</view>
				</view>
				
				<!-- 昵称设置 -->
				<view class="nickname-section">
					<view class="label">设置昵称<text class="required-star">*</text></view>
					<view class="input-container" :class="{ 'input-success': nickName.trim() }">
						<input 
							v-model="nickName" 
							class="nickname-input" 
							type="nickname"
							placeholder="点击选择昵称"
							placeholder-class="placeholder-style"
							maxlength="20"
							@input="onNicknameInput"
						/>
					</view>
				</view>
				
				<!-- 底部按钮 -->
				<view class="bottom-buttons">
					<button class="skip-btn" @click="skipSetup">取消</button>
					<button 
						class="complete-btn" 
						:class="{ 'active-btn': canCompleteLogin }"
						@click="handleConfirm"
					>
						完成登录
					</button>
				</view>
			</view>
		</view>
	</view>
</template>

<style lang="scss" scoped>
	.loginPages {
		height: 100vh;
		background: linear-gradient(to top, #ccd8f7, #fff);

		.bg {
			position: fixed;
			top: 0;
			left: 0;
			width: 100%;
			height: 600rpx;
			background: linear-gradient(to right, #ccd8f7, #fce1e2);
			-webkit-mask-image: linear-gradient(to bottom, rgba(0, 0, 0, 1) 30%, rgba(0, 0, 0, 0) 70%);
			mask-image: linear-gradient(to bottom, rgba(0, 0, 0, 1) 30%, rgba(0, 0, 0, 0) 70%);
		}

		/*标题*/
		.title {
			position: fixed;
			left: 50%;
			top: 20%;
			transform: translateX(-50%);

			.logo {
				margin-bottom: 40rpx;
				height: 100rpx;
				width: 400rpx;
			}

			.wenben {
				text-align: center;
				font-size: 36rpx;
				color: $pyq-text-color-body-secondary;
			}
		}

		/*授权登录*/
		.authLogin {
			width: 100%;

			/*同意*/
			.agree {
				display: flex;
				align-items: center;
				padding-top: 600rpx;
				margin: auto;
				width: fit-content;
				font-size: 24rpx;
				color: $pyq-text-color-helper;

				.checkbox {
					margin-right: 8rpx;
				}

				.text-wrapper {
					flex: 1;
					display: flex;
					align-items: center;
					flex-wrap: wrap;

					.normal-text {
						font-size: 24rpx;
						color: $pyq-text-color-helper;
						padding: 0 4rpx;
					}

					.link-text {
						color: $pyq-vi-color;
						font-size: 28rpx;
						padding: 4rpx 8rpx;

						&:active {
							opacity: 0.7;
						}
					}
				}
			}

			/*登录*/
			.login {
				padding: 40rpx;
				background: rgba(0, 0, 0, 0);

				.btn {
					background-color: $pyq-vi-color;
					border: none;
					color: #fff;
					border-radius: 64rpx;
					transition: all 0.3s;
				}
			}
		}

		/*授权弹框*/
		.mobileLoginModel {
			position: fixed;
			left: 0;
			top: 0;
			height: 100vh;
			width: 100%;
			background: rgba(0, 0, 0, 0.5);
			display: flex;
			align-items: center;
			justify-content: center;
			z-index: 1000;

			.model {
				display: flex;
				flex-direction: column;
				width: 560rpx;
				background-color: #fff;
				border-radius: 24rpx;
				box-shadow: 0 10rpx 30rpx rgba(0, 0, 0, 0.1);
				overflow: hidden;
				
				.icon-area {
					display: flex;
					justify-content: center;
					padding: 40rpx 0 20rpx;
					
					.auth-icon {
						width: 120rpx;
						height: 120rpx;
						border-radius: 60rpx;
					}
				}

				.textValue {
					display: flex;
					flex-direction: column;
					align-items: center;
					padding: 20rpx 40rpx 40rpx;

					.titleModel {
						font-size: 34rpx;
						font-weight: 500;
						color: $pyq-text-color-title;
						margin-bottom: 16rpx;
					}

					.contentModel {
						font-size: 28rpx;
						color: $pyq-text-color-helper;
						text-align: center;
					}
				}

				/*按钮*/
				.caozuo {
					display: flex;
					border-top: 1px solid rgba(0, 0, 0, 0.05);

					button {
						font-size: 28rpx;
						border: none;
						outline: none;
						height: 90rpx;
						line-height: 90rpx;
						transition: all 0.3s;
					}

					.cannal {
						flex: 1;
						border: none;
						background-color: #fff;
						color: #999;
						
						&:active {
							background-color: #f5f5f5;
						}
					}

					.confirm {
						flex: 1;
						border: none;
						background-color: #fff;
						color: $pyq-vi-color;
						font-weight: 500;
						position: relative;
						
						&::before {
							content: '';
							position: absolute;
							left: 0;
							top: 20rpx;
							bottom: 20rpx;
							width: 1px;
							background-color: rgba(0, 0, 0, 0.05);
						}
						
						&:active {
							background-color: #f5f5f5;
						}
					}
				}
			}
		}
	}
			
	/* 完善个人信息弹窗 */
	.profileSetupModel {
		position: fixed;
		left: 0;
		top: 0;
		height: 100vh;
		width: 100%;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1001;
		padding: 40rpx;
			
		.profile-modal {
			position: relative;
			width: 90%;
			max-width: 650rpx;
			min-width: 500rpx;
			background-color: #fff;
			border-radius: 24rpx;
			box-shadow: 0 10rpx 30rpx rgba(0, 0, 0, 0.1);
			overflow: hidden;
			padding: 50rpx 40rpx 40rpx;
			max-height: 90vh;
			overflow-y: auto;
					
			.close-btn {
				position: absolute;
				top: 20rpx;
				right: 30rpx;
				font-size: 40rpx;
				color: #999;
				width: 60rpx;
				height: 60rpx;
				display: flex;
				align-items: center;
				justify-content: center;
				cursor: pointer;
						
				&:active {
					opacity: 0.7;
				}
			}
					
			.top-tip {
				text-align: center;
				margin-bottom: 40rpx;
						
				.star-icon {
					font-size: 36rpx;
					font-weight: 600;
					color: #333;
					margin-bottom: 20rpx;
					line-height: 1.2;
				}
						
				.tip-text {
					font-size: 26rpx;
					color: #666;
					line-height: 1.5;
					margin-bottom: 30rpx;
					padding: 0 10rpx;
					word-wrap: break-word;
				}
						
				.divider {
					height: 2rpx;
					width: 100rpx;
					background: linear-gradient(to right, transparent, #ddd, transparent);
					margin: 0 auto;
				}
			}
					
			.avatar-section {
				display: flex;
				flex-direction: column;
				align-items: center;
				margin-bottom: 40rpx;
						
				.avatar-container {
					position: relative;
					width: 160rpx;
					height: 160rpx;
					border-radius: 80rpx;
					border: 4rpx solid #ff6b6b;
					overflow: hidden;
					transition: all 0.3s;
					background: transparent;
					padding: 0;
					margin: 0;
					outline: none;
					
					&.has-wechat-info {
						border-color: #4CAF50;
					}
						
					.avatar-img {
						width: 100%;
						height: 100%;
						pointer-events: none;
					}
						
					.camera-icon {
						position: absolute;
						bottom: 0;
						left: 50%;
						transform: translateX(-50%);
						background: rgba(0, 0, 0, 0.7);
						color: white;
						width: 100%;
						height: 50rpx;
						display: flex;
						align-items: center;
						justify-content: center;
						font-size: 20rpx;
						pointer-events: none;
							
						.upload-text {
							margin-left: 8rpx;
						}
					}
					
					.success-icon {
						position: absolute;
						bottom: 0;
						right: 0;
						width: 40rpx;
						height: 40rpx;
						background: #4CAF50;
						border-radius: 50%;
						display: flex;
						align-items: center;
						justify-content: center;
						color: white;
						font-size: 24rpx;
						font-weight: bold;
						border: 2rpx solid white;
						pointer-events: none;
					}
						
					&:active {
						opacity: 0.8;
					}
					
					&::after {
						border: none;
					}
				}
					
				.required-text {
					color: #ff6b6b;
					font-size: 24rpx;
					margin-top: 16rpx;
					transition: all 0.3s;
					text-align: center;
					line-height: 1.4;
					word-wrap: break-word;
					white-space: normal;
					
					&.success-text {
						color: #4CAF50;
					}
				}
			}
					
			.nickname-section {
				margin-bottom: 50rpx;
						
				.label {
					font-size: 28rpx;
					color: #333;
					margin-bottom: 20rpx;
					line-height: 1.3;
					word-wrap: break-word;
				
					.required-star {
						color: #ff6b6b;
						margin-left: 4rpx;
					}
				}
						
				.input-container {
					border: 2rpx solid #ff6b6b;
					border-radius: 16rpx;
					padding: 6rpx;
					transition: all 0.3s;
					overflow: hidden;
					display: flex;
					justify-content: center;
					align-items: center;

					&.input-success {
						border-color: #4CAF50;
					}
				
					.nickname-input {
						background-color: #f7f7f7;
						border: none;
						border-radius: 8px;
						padding: 20rpx 24rpx;
						font-size: 32rpx;
						width: calc(100% - 48rpx);
						text-align: center !important;
						caret-color: transparent;
						outline: none;
						-webkit-appearance: none;
						line-height: 80rpx;
						height: 80rpx;
						color: #333;
						margin: 0 auto;
						vertical-align: middle;
					}
				}
			}
					
			.bottom-buttons {
				display: flex;
				gap: 20rpx;
						
				button {
					flex: 1;
					height: 80rpx;
					border-radius: 40rpx;
					font-size: 28rpx;
					border: none;
					outline: none;
					transition: all 0.3s;
					display: flex;
					align-items: center;
					justify-content: center;
					text-align: center;
										
					&::after {
						border: none;
					}
				}
						
				.skip-btn {
					background-color: #fff;
					color: #666;
					border: 2rpx solid #ddd;
							
					&:active {
						background-color: #f5f5f5;
					}
				}
						
				.complete-btn {
					background-color: #999;
					color: white;
					transition: all 0.3s;
					
					&.active-btn {
						background-color: #46b0fe;
					}
							
					&:active {
						opacity: 0.8;
					}
				}
			}
		}
	}
</style>