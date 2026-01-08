<script setup>
	import { ref, onMounted } from 'vue'
	import { onLoad } from '@dcloudio/uni-app'
	import { privacyAgreement, vipServer } from '@/utils/ag.js'
	import { useUserInfoStore } from '@/store/user.js'
	// userStore
	const userStore = useUserInfoStore( )
	// 用户云对象
	const userApi = uniCloud.importObject( 'userKs' )
	//授权同意
	const aloneChecked = ref( false )
	// 弹框
	const modelShow = ref( false )
	// 保存 redirect 参数
	const redirectUrl = ref('')
	
	// 页面加载时获取 redirect 参数
	onLoad((options) => {
		if (options.redirect) {
			redirectUrl.value = decodeURIComponent(options.redirect)
			console.log('登录成功后将跳转到:', redirectUrl.value)
		}
	})
	// 服务和隐私协议
	const navigateToAgreement = ( type ) => {
		console.log( type )
		let url = ''
		if ( type === 'vipServer' ) {
			url = vipServer // 会员服务协议链接
			console.log( '服务' )
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
	const clickLogin = async () => {
		// 如果没有同意协议，自动勾选
		if (!aloneChecked.value) {
			aloneChecked.value = true
		}

		try {
			uni.showLoading({
				title: '登录中...',
				mask: true
			})

			// 检查本地是否有上次登录的手机号
			const lastLoginMobile = uni.getStorageSync('lastLoginMobile')
			console.log('检测到上次登录手机号:', lastLoginMobile)

			// 获取登录code
			const loginResult = await uni.login({
				provider: 'kuaishou'  // 指定快手登录
			}).catch(err => {
				throw new Error('获取登录code失败: ' + (err.errMsg || err.message))
			})
			
			if (!loginResult || !loginResult.code) {
				throw new Error('获取登录code失败')
			}
			
			codeRes = loginResult

			// 如果有上次登录的手机号，获取用户信息后直接登录
			if (lastLoginMobile) {
				console.log('检测到已登录过，先获取用户信息')
				try {
					await getKsAuthInfo()
					console.log('使用手机号直接登录:', lastLoginMobile)
					await loginWithStoredMobile(lastLoginMobile)
				} catch (error) {
					console.error('获取用户信息失败:', error)
					throw new Error('获取用户信息失败，请重试')
				}
			} else {
				// 新用户：先显示手机号授权弹窗
				console.log('首次登录，先授权手机号')
				uni.hideLoading()
				modelShow.value = true
			}
			
		} catch (err) {
			console.error('登录失败:', err)
			uni.showToast({
				title: err.message || '登录失败，请重试',
				icon: 'none',
				duration: 2000
			})
		} finally {
			// 注意：这里不要关闭loading，因为新用户需要显示弹窗
			if (!modelShow.value) {
				uni.hideLoading()
			}
		}
	}

	let userData
	// 封装用户信息授权
	const getKsAuthInfo = async () => {
		try {
			// 先进行授权
			await new Promise((resolve, reject) => {
				ks.authorize({
					scope: 'scope.userInfo',
					success: resolve,
					fail: (err) => reject(new Error('用户信息授权失败: ' + err.errMsg))
				})
			})

			// 获取用户信息
			const result = await new Promise((resolve, reject) => {
				ks.getUserInfo({
					success: resolve,
					fail: (err) => reject(new Error('获取用户信息失败: ' + err.errMsg))
				})
			})

			// 先获取快手返回的用户信息
			const ksNickName = result.userInfo.nickName
			const ksAvatarUrl = result.userInfo.avatarUrl

			// 获取当前存储的用户信息（需要判断是否存在）
			const currentNickName = userStore.userInfo?.nickName || '未登录'
			
			console.log('当前存储信息:', {
				nickName: currentNickName,
				isLogin: !!userStore.userInfo?.uid
			})
			console.log('快手返回信息:', {
				nickName: ksNickName,
				avatarUrl: ksAvatarUrl
			})

			// 更新 userData
			userData = {
				nickName: ksNickName,
				avatarUrl: ksAvatarUrl
			}
			
			console.log('用户信息获取成功:', userData)
		} catch (error) {
			console.error('获取用户信息失败:', error)
			throw error
		}
	}

	// 用户登录构建数据 类型声明
	const userInfoData = ref( {
		uid: '', //本地平台ID
		nickName: "", //昵称
		avatarUrl: "/static/defalut.png", //头像地址
		mobile: "", //手机号码
		isLogin: false, //登录状态
		role: [ ], //默认角色
	} )

	// 快手手机号登录
	const getMobile = async (e) => {
		try {
			if (e.detail.errMsg !== 'getPhoneNumber:ok') {
				throw new Error('未授权获取手机号')
			}

			uni.showLoading({
				title: '登录中...',
				mask: true
			})

			// 新用户流程：先获取手机号，再获取头像和昵称
			console.log('手机号授权成功，现在获取用户信息')
			
			// 先获取用户信息（头像和昵称）
			try {
				await getKsAuthInfo()
			} catch (error) {
				console.error('获取用户信息失败:', error)
				// 即使获取用户信息失败，也继续登录，使用默认值
				userData = {
					nickName: '用户' + Math.floor(Math.random() * 10000),
					avatarUrl: '/static/images/defalut.png'
				}
			}

			const params = {
				code: codeRes.code,
				encryptedData: e.detail.encryptedData,
				iv: e.detail.iv,
				nickName: userData.nickName,
				avatarUrl: userData.avatarUrl
			}

			// 调用登录API
			const res = await userApi.loginByPhoneKs(params)
			
			if (!res.data?._id) {
				throw new Error('登录失败，请重试')
			}

			// 关闭弹窗
			modelShow.value = false
			
			try {
				// 尝试序列化返回的数据确保可存储
				console.log('登录返回数据:', JSON.stringify(res.data))
				
				// 构建用户信息，只提取安全的字段
				const safeUserData = {
					uid: res.data._id || '',
					nickName: res.data.nickName || '',
					avatarUrl: res.data.avatarUrl || "/static/images/defalut.png",
					mobile: res.data.mobile || '',
					isLogin: true,
					role: Array.isArray(res.data.role) ? res.data.role : ['user'],
				}
				
				// 保存用户信息到状态管理
				userStore.setUserInfo(safeUserData)
				
				// 保存手机号到本地存储
				uni.setStorageSync('lastLoginMobile', res.data.mobile)
				
				uni.showToast({
					icon: "success",
					title: res.message || '登录成功'
				})

				// 直接跳转首页改为延迟跳转，让用户看到成功提示
				setTimeout(() => {
					handleLoginSuccess()
				}, 1500)
			} catch (serializeError) {
				console.error('处理用户数据失败:', serializeError)
				
				// 创建基本用户信息对象
				const basicUserInfo = {
					uid: res.data._id || '',
					nickName: res.data.nickName || '',
					avatarUrl: res.data.avatarUrl || "/static/images/defalut.png",
					mobile: res.data.mobile || '',
					isLogin: true,
					role: Array.isArray(res.data.role) ? res.data.role : ['user']
				}
				
				// 使用安全数据保存
				userStore.setUserInfo(basicUserInfo)
				uni.setStorageSync('lastLoginMobile', res.data.mobile || '')
				
				uni.showToast({
					icon: "success",
					title: '登录成功'
				})
				
				// 跳转到首页改为延迟跳转
				setTimeout(() => {
					handleLoginSuccess()
				}, 1500)
			}
		} catch (err) {
			console.error('手机号登录失败:', err)
			uni.showToast({
				title: '手机号登录失败: ' + (err.message || '请重试'),
				icon: 'none',
				duration: 2000
			})
		} finally {
			uni.hideLoading()
		}
	}

	// 使用存储的手机号直接登录（跳过手机号授权步骤）
	const loginWithStoredMobile = async (mobile) => {
		try {
			// 构建登录参数，使用存储的手机号
			const params = {
				code: codeRes.code,
				mobile: mobile,  // 使用存储的手机号
				nickName: userData.nickName,
				avatarUrl: userData.avatarUrl
			}

			// 调用新的登录接口（不需要解密手机号）
			const res = await userApi.loginByStoredMobile(params)
			
			if (!res.data?._id) {
				throw new Error('登录失败，请重试')
			}
			
			try {
				console.log('使用存储手机号登录成功:', JSON.stringify(res.data))
				
				// 构建用户信息
				const safeUserData = {
					uid: res.data._id || '',
					nickName: res.data.nickName || '',
					avatarUrl: res.data.avatarUrl || "/static/images/defalut.png",
					mobile: res.data.mobile || mobile,
					isLogin: true,
					role: Array.isArray(res.data.role) ? res.data.role : ['user'],
				}
				
				// 保存用户信息到状态管理
				userStore.setUserInfo(safeUserData)
				
				uni.showToast({
					icon: "success",
					title: res.message || '欢迎回来！'
				})

				// 延迟跳转
				setTimeout(() => {
					handleLoginSuccess()
				}, 1500)
			} catch (serializeError) {
				console.error('处理用户数据失败:', serializeError)
				
				// 创建基本用户信息对象
				const basicUserInfo = {
					uid: res.data._id || '',
					nickName: res.data.nickName || '',
					avatarUrl: res.data.avatarUrl || "/static/images/defalut.png",
					mobile: res.data.mobile || mobile,
					isLogin: true,
					role: Array.isArray(res.data.role) ? res.data.role : ['user']
				}
				
				userStore.setUserInfo(basicUserInfo)
				
				uni.showToast({
					icon: "success",
					title: '欢迎回来！'
				})
				
				setTimeout(() => {
					handleLoginSuccess()
				}, 1500)
			}
		} catch (err) {
			console.error('使用存储手机号登录失败:', err)
			// 如果使用存储手机号登录失败，清除存储的手机号，并显示授权弹窗
			uni.removeStorageSync('lastLoginMobile')
			console.log('清除存储的手机号，显示授权弹窗')
			modelShow.value = true
			uni.hideLoading()
		}
	}

	// 修改 handleLoginSuccess 函数，根据 redirect 参数跳转
	function handleLoginSuccess() {
		// 如果有 redirect 参数，跳转回原页面
		if (redirectUrl.value) {
			console.log('跳转回原页面:', redirectUrl.value)
			// 判断是否是 tabBar 页面
			const tabBarPages = ['/pages/memo/memo', '/pages/my/my']
			const redirectPath = redirectUrl.value.split('?')[0] // 去掉参数
			
			if (tabBarPages.includes(redirectPath)) {
				// 如果是 tabBar 页面，使用 switchTab
				uni.switchTab({
					url: redirectPath
				})
			} else {
				// 普通页面使用 redirectTo
				uni.redirectTo({
					url: redirectUrl.value
				})
			}
		} else {
			// 没有 redirect 参数，跳转到默认页面（备忘录）
			uni.switchTab({
				url: '/pages/memo/memo'
			})
		}
	}

	// 优化登录方法
	const login = async () => {
		try {
			uni.showLoading({
				title: '登录中...',
				mask: true
			})
			
			// 修改为调用userKs云函数
			const res = await uniCloud.callFunction({
				name: 'userKs',
				data: {
					action: 'loginByPhoneKs',
					params: {} // 由于是快手小程序内部使用token登录，不需要参数
				}
			})
			
			if (res.result.code === 0) {
				// 确保用户数据可序列化
				try {
					console.log("登录返回数据:", JSON.stringify(res.result.data))
					userStore.setUserInfo(res.result.data)
					
					// 添加登录成功的提示
					uni.showToast({
						title: '登录成功',
						icon: 'success',
						duration: 2000
					})
					
					// 短暂延迟后跳转，让用户看到成功提示
					setTimeout(() => {
						handleLoginSuccess()
					}, 1500)
				} catch (serializeError) {
					console.error("存储用户信息失败:", serializeError)
					// 创建基本用户信息对象
					const basicUserInfo = {
						uid: res.result.data._id || res.result.data.uid || '',
						nickName: res.result.data.nickName || '',
						avatarUrl: res.result.data.avatarUrl || '/static/images/defalut.png',
						mobile: res.result.data.mobile || '未填写',
						isLogin: true,
						role: Array.isArray(res.result.data.role) ? res.result.data.role : ['user']
					}
					userStore.setUserInfo(basicUserInfo)
					
					// 即使序列化失败也显示登录成功的提示
					uni.showToast({
						title: '登录成功',
						icon: 'success',
						duration: 2000
					})
					
					// 短暂延迟后跳转，让用户看到成功提示
					setTimeout(() => {
						handleLoginSuccess()
					}, 1500)
				}
			} else {
				throw new Error(res.result.message || '登录失败')
			}
		} catch (err) {
			console.error('登录失败:', err)
			uni.showToast({
				title: '登录失败，请检查网络后重试',
				icon: 'none'
			})
		} finally {
			uni.hideLoading()
		}
	}

	// 添加页面返回监听
	onMounted(() => {
		// 如果已经登录，直接跳转
		if (userStore.userInfo.uid) {
			// 延迟一下，等待 onLoad 获取 redirect 参数
			setTimeout(() => {
				handleLoginSuccess()
			}, 100)
		}
	})

	// 修改关闭弹窗处理函数
	const closeModel = () => {
		modelShow.value = false
		// 返回上一页
		uni.navigateBack()
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
				<up-checkbox activeColor="#46b0fe" class="checkbox" name="agree" usedAlone
					v-model:checked="aloneChecked" shape="circle">
				</up-checkbox>
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
				<button class="btn" @click="clickLogin">一键登录</button>
			</view>
		</view>
		<!-- 手机号登录弹框 -->
		<view class="mobileLoginModel" v-if="modelShow">
			<view class="model">
				<!-- 添加关闭按钮 -->
				<view class="close-btn" @click="closeModel">
					<text class="close-icon">×</text>
				</view>
				<!-- 图标区域 -->
				<view class="icon-wrapper">
					<image src="/static/images/auth-icon.png" mode="aspectFit"></image>
				</view>
				<!-- 文字区域 -->
				<view class="textValue">
					<view class="titleModel">
						提示
					</view>
					<view class="contentModel">
						授权协议并登录
					</view>
				</view>
				<!-- 按钮区域改动 -->
				<view class="caozuo">
					<button class="confirm" open-type="getPhoneNumber" @getphonenumber="getMobile">
						<text class="btn-text">手机号一键登录</text>
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
					width: 70%;
					margin: 0 auto;
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
			background: rgba(0, 0, 0, 0.2);

			.model {
				display: flex;
				flex-direction: column;
				width: 560rpx;
				background-color: #fff;
				border-radius: 32rpx;
				margin: 300rpx auto;
				overflow: hidden;

				// 添加关闭按钮样式
				.close-btn {
					position: absolute;
					right: 20rpx;
					top: 20rpx;
					width: 90rpx;
					height: 90rpx;
					display: flex;
					align-items: center;
					justify-content: center;
					
					.close-icon {
						font-size: 48rpx;
						color: #999;
					}
					
					&:active {
						opacity: 0.7;
					}
				}

				.icon-wrapper {
					display: flex;
					justify-content: center;
					padding: 60rpx 0 20rpx;
					
					image {
						width: 120rpx;
						height: 120rpx;
					}
				}

				.textValue {
					display: flex;
					flex-direction: column;
					align-items: center;
					padding: 40rpx 40rpx 40rpx;

					.titleModel {
						font-size: 32rpx;
						font-weight: 500;
						color: $pyq-text-color-title;
					}

					.contentModel {
						margin-top: 20rpx;
						font-size: 28rpx;
						color: $pyq-text-color-helper;
					}
				}

				/*按钮*/
				.caozuo {
					display: flex;
					padding: 0 40rpx 40rpx;

					.confirm {
						flex: 1;
						height: 88rpx;
						line-height: 88rpx;
						background-color: $pyq-vi-color;
						border-radius: 44rpx;
						font-size: 32rpx;
						color: #fff;
						border: none;
						
						&::after {
							border: none;
						}

						.btn-text {
							font-weight: 500;
						}

						&:active {
							opacity: 0.9;
						}
					}
				}
			}
		}
	}
</style>