<script setup>
	import {
		computed,
		onMounted,
		onUnmounted,
		ref,
		watch
	} from 'vue'
	import {
		useUserInfoStore
	} from '@/store/user.js'
	import {
		handleWxAvatarChoose,
		handleWxNicknameChange,
		uploadAvatar,
		updateUserProfile
	} from '@/utils/profileHelper.js'
	// 导入用户信息store
	const userStore = useUserInfoStore()
	// 用户云对象
	const userApi = uniCloud.importObject('userWx', { customUI: true })

	// 点击登录
	const clickLogin = async () => {
		uni.navigateTo({
			url: "/pages/login/login"
		})
	}

	// 修改头像
	const changeAvatar = () => {
		// 判断是否已登录
		if (!userStore.userInfo.isLogin) {
			uni.showToast({
				title: '请先登录',
				icon: 'none'
			})
			return
		}
		
		// 非微信小程序环境使用通用的chooseImage
		uni.chooseImage({
			count: 1,
			sizeType: ['compressed'],
			sourceType: ['album', 'camera'],
			success: async (res) => {
				try {
					uni.showLoading({ title: '上传头像中...' })
					
					// 上传到七牛云，返回七牛云URL
					const qiniuAvatarUrl = await uploadAvatar(res.tempFilePaths[0], userStore.userInfo.uid)
					console.log('📷 头像上传成功，七牛云URL:', qiniuAvatarUrl);
					
					// 保存七牛云URL到数据库
					const result = await updateUserProfile({ avatarUrl: qiniuAvatarUrl }, userStore.userInfo.uid)
					
					if (result.code === 0) {
						console.log('💾 数据库更新成功，开始更新store');
						console.log('💾 更新前 userStore.userInfo.avatarUrl:', userStore.userInfo.avatarUrl);
						userStore.updateUserAvatar(qiniuAvatarUrl)
						console.log('💾 更新后 userStore.userInfo.avatarUrl:', userStore.userInfo.avatarUrl);
						// 立即手动调用更新显示
						await updateDisplayAvatar()
						console.log('💾 更新显示URL后 displayAvatarUrl.value:', displayAvatarUrl.value);
						uni.showToast({
							title: '头像更新成功',
							icon: 'success'
						})
					} else {
						throw new Error(result.message || '头像更新失败')
					}
				} catch (error) {
					console.error('更新头像失败:', error)
					uni.showToast({
						title: error.message || '头像更新失败',
						icon: 'none'
					})
				} finally {
					uni.hideLoading()
				}
			}
		})
	}
	
	// 处理微信头像选择回调
	const onChooseAvatar = async (e) => {
		if (!userStore.userInfo.isLogin) {
			uni.showToast({
				title: '请先登录',
				icon: 'none'
			})
			return
		}
		
		const { avatarUrl } = e.detail
		if (!avatarUrl) {
			uni.showToast({
				title: '未选择头像',
				icon: 'none'
			})
			return
		}
		
		try {
			uni.showLoading({ title: '上传头像中...' })
			
			// 检查是否为临时文件，如果是则先上传到七牛云
			let finalAvatarUrl = avatarUrl;
			if (avatarUrl.startsWith('http://tmp/') || avatarUrl.startsWith('wxfile://')) {
				console.log('检测到临时文件，开始上传:', avatarUrl);
				
				// 使用 uploadAvatar 函数上传到七牛云
				finalAvatarUrl = await uploadAvatar(avatarUrl, userStore.userInfo.uid);
				console.log('头像上传成功，七牛云URL:', finalAvatarUrl);
			} else {
				console.log('使用非临时文件:', avatarUrl);
			}
			
			// 使用云函数更新头像（使用七牛云URL）
			const result = await userApi.updateWxUserInfo({
				uid: userStore.userInfo.uid,
				avatarUrl: finalAvatarUrl
			})
			
			if (result.code === 0) {
				// 使用永久链接更新本地状态
				userStore.updateUserAvatar(finalAvatarUrl)
				// 立即更新显示的头像
				await updateDisplayAvatar()
				uni.showToast({
					title: '头像更新成功',
					icon: 'success'
				})
			} else {
				throw new Error(result.message || '头像更新失败')
			}
		} catch (error) {
			console.error('更新头像失败:', error)
			uni.showToast({
				title: error.message || '头像更新失败',
				icon: 'none'
			})
		} finally {
			uni.hideLoading()
		}
	}

	
	// 修改昵称 - 微信原生昵称输入框的值改变事件
	const onNicknameChange = async (e) => {
		if (!userStore.userInfo.isLogin) {
			uni.showToast({
				title: '请先登录',
				icon: 'none'
			})
			return
		}
		
		const nickName = e.detail.value
		if (!nickName || nickName === userStore.userInfo.nickName) {
			return
		}
		
		try {
			uni.showLoading({ title: '更新昵称中...' })
			
			// 使用新的云函数方法更新微信信息
			const result = await userApi.updateWxUserInfo({
				uid: userStore.userInfo.uid,
				nickName: nickName
			})
			
			if (result.code === 0) {
				userStore.updateUserNickName(nickName)
				uni.showToast({
					title: '昵称更新成功',
					icon: 'success'
				})
			} else {
				throw new Error(result.message || '昵称更新失败')
			}
		} catch (error) {
			console.error('更新昵称失败:', error)
			uni.showToast({
				title: error.message || '昵称更新失败',
				icon: 'none'
			})
		} finally {
			uni.hideLoading()
		}
	}


	
	// 修改昵称
	const changeNickName = () => {
		// 判断是否已登录
		if (!userStore.userInfo.isLogin) {
			uni.showToast({
				title: '请先登录',
				icon: 'none'
			})
			return
		}
		
		// 非微信小程序环境使用对话框
		uni.showModal({
			title: '修改昵称',
			editable: true,
			placeholderText: '请输入新昵称',
			content: userStore.userInfo.nickName,
			success: async (res) => {
				if (res.confirm && res.content) {
					try {
						const result = await updateUserProfile({ nickName: res.content }, userStore.userInfo.uid)
						if (result.code === 0) {
							userStore.updateUserNickName(res.content)
						} else {
							throw new Error(result.message || '昵称更新失败')
						}
					} catch (error) {
						console.error('更新昵称失败:', error)
						uni.showToast({
							title: error.message || '昵称更新失败',
							icon: 'none'
						})
					}
				}
			}
		})
	}

	// 信息公示跳转
	const contarct = () => {
		uni.navigateTo({
			url: "/subPages/contarct/contarct"
		})
	}

	// 意见反馈跳转
	const feedBack = () => {
		uni.navigateTo({
			url: "/subPages/feedBack/feedBack"
		})
	}

	// 角色判断
	const isAdmin = computed(() => userStore.userInfo.role[0] === 'admin')
	// 后台管理
	const adminManage = () => {
		if (isAdmin.value) {
			// 检查页面是否存在
			try {
				uni.navigateTo({
					url: "/subPages/adminManage/adminManage",
					fail: (err) => {
						console.error('跳转到管理页面失败:', err)
						uni.showToast({
							title: '页面不存在或配置错误',
							icon: 'none',
							duration: 2000
						})
					}
				})
			} catch (e) {
				console.error('导航异常:', e)
				uni.showToast({
					title: '跳转异常，请重试',
					icon: 'none',
					duration: 2000
				})
			}
		} else {
			uni.showToast({
				title: '您没有管理员权限',
				icon: 'none',
				duration: 2000
			})
		}
	}

	// 处理手机号显示，中间4位用8代替
	const maskedMobile = computed(() => {
		if (!userStore.userInfo.mobile) return '';
		const mobile = userStore.userInfo.mobile;
		if (mobile.length !== 11) return mobile;
		return mobile.substring(0, 3) + '****' + mobile.substring(7);
	})
	
	// 处理头像URL，将cloud://格式转换为可显示的链接
	const displayAvatarUrl = ref('/static/images/touxiang.png')
	
	// 监听头像变化，自动转换fileID
	const updateDisplayAvatar = async () => {
		const avatarUrl = userStore.userInfo.avatarUrl
		
		console.log('👤 updateDisplayAvatar 被调用, avatarUrl:', avatarUrl);
		
		if (!avatarUrl) {
			displayAvatarUrl.value = '/static/images/touxiang.png'
			console.log('👤 没有头像，使用默认头像');
			return
		}
		
		// 如果是本地路径，直接使用
		if (avatarUrl.startsWith('/') || avatarUrl.startsWith('./')) {
			displayAvatarUrl.value = avatarUrl
			console.log('👤 本地路径，直接使用:', avatarUrl);
			return
		}
		
		// 如果是HTTPS链接，直接使用
		if (avatarUrl.startsWith('http://') || avatarUrl.startsWith('https://')) {
			displayAvatarUrl.value = avatarUrl
			console.log('👤 HTTPS链接，直接使用:', avatarUrl);
			console.log('👤 包含aly2.jingle0350.cn:', avatarUrl.includes('aly2.jingle0350.cn'));
			console.log('👤 包含2025/touxiang:', avatarUrl.includes('2025/touxiang'));
			return
		}
		
		// 如果是cloud://格式，转换为临时链接
		if (avatarUrl.startsWith('cloud://')) {
			try {
				const result = await uniCloud.getTempFileURL({
					fileList: [avatarUrl]
				})
				
				if (result.fileList && result.fileList[0] && result.fileList[0].tempFileURL) {
					displayAvatarUrl.value = result.fileList[0].tempFileURL
					console.log('头像转换成功:', displayAvatarUrl.value)
				} else {
					console.warn('无法获取临时链接，使用默认头像')
					displayAvatarUrl.value = '/static/images/touxiang.png'
				}
			} catch (error) {
				console.error('头像转换失败:', error)
				displayAvatarUrl.value = '/static/images/touxiang.png'
			}
			return
		}
		
		// 其他情况，使用默认头像
		displayAvatarUrl.value = '/static/images/touxiang.png'
	}

	onMounted(() => {
		if (userStore.userInfo.uid) {
			// userOrderGet() 函数未定义，暂时注释掉
			// userOrderGet()
		}
		// 初始化时转换头像
		updateDisplayAvatar()
		
		// 监听头像变化，使用Vue 3的watch API
		watch(
			() => userStore.userInfo.avatarUrl,
			() => {
				updateDisplayAvatar()
			}
		)
	})

	// 点击退出登录
	const loginOut = () => {
		uni.showModal({
			title: '提示',
			content: '确定要退出登录吗',
			success(res) {
				if (res.confirm) {
					userStore.cleanUserInfo()
				}
			}
		})
	}
	
	// 处理头像加载错误
	const onAvatarError = (e) => {
		console.error('❌ 头像加载失败:', displayAvatarUrl.value);
		console.error('❌ 错误详情:', e);
		// 使用默认头像
		displayAvatarUrl.value = '/static/images/touxiang.png';
	}
	
	// 处理头像加载成功
	const onAvatarLoad = () => {
		console.log('✅ 头像加载成功:', displayAvatarUrl.value);
	}
	
	// 跳转到商品详情页
	const goToProductDetail = () => {
		uni.navigateTo({
			url: '/pages/productDetail/productDetail'
		})
	}
</script>

<template>
	<view class="my">
		<!-- 头部 -->
		<view class="myHead">
			<!-- 头像区域 -->
			<!-- #ifdef MP-WEIXIN -->
			<button open-type="chooseAvatar" @chooseavatar="onChooseAvatar" class="avatar-button">
				<view class="avatar">
					<image :src="displayAvatarUrl" mode="aspectFill" @error="onAvatarError" @load="onAvatarLoad"></image>
					<view class="edit-icon" v-if="userStore.userInfo.isLogin">
						<uni-icons type="camera-filled" color="#fff" size="20"></uni-icons>
					</view>
				</view>
			</button>
			<!-- #endif -->
			
			<!-- #ifndef MP-WEIXIN -->
			<view class="avatar" @click="changeAvatar">
				<image :src="displayAvatarUrl" mode="aspectFill" @error="onAvatarError" @load="onAvatarLoad"></image>
				<view class="edit-icon" v-if="userStore.userInfo.isLogin">
					<uni-icons type="camera-filled" color="#fff" size="20"></uni-icons>
				</view>
			</view>
			<!-- #endif -->
			
			<!-- 已经登录 -->
			<view class="userInfo" v-if="userStore.userInfo.isLogin">
				<!-- 昵称区域 -->
				<!-- #ifdef MP-WEIXIN -->
				<view class="nickname">
					<input type="nickname" @change="onNicknameChange" :value="userStore.userInfo.nickName" class="nickname-input" placeholder="点击输入昵称"/>
				</view>
				<!-- #endif -->
				
				<!-- #ifndef MP-WEIXIN -->
				<view class="nickname" @click="changeNickName">
					<text class="nickname-text" :class="{placeholder: !userStore.userInfo.nickName}">{{userStore.userInfo.nickName || '点击输入昵称'}}</text>
				</view>
				<!-- #endif -->
				
				<view class="mobile">
					手机号：{{maskedMobile}}
				</view>
				
			</view>
			<!-- 未登录 -->
			<view class="login-btn" @click="clickLogin" v-else>
				点击登录
			</view>

		</view>
		<!-- 内容 -->
		<view class="myContent">
			<!-- 菜单列表 -->
			<view class="menu-list">
				<!-- 联系我们 -->
				<view class="menu-item" @click="contarct">
					<view class="left">
						<uni-icons color="#46b0fe" type="wallet" size="22"></uni-icons>
						<text class="value">信息公示</text>
					</view>
					<uni-icons color="#cccccc" custom-prefix="iconfont" type="icon-arrow-drop-right-line" size="30"></uni-icons>
				</view>
				<!-- 商品详情页示例 -->
				<view class="menu-item" @click="goToProductDetail">
					<view class="left">
						<uni-icons color="#ff6b6b" type="cart" size="22"></uni-icons>
						<text class="value">商品详情页示例</text>
					</view>
					<uni-icons color="#cccccc" custom-prefix="iconfont" type="icon-arrow-drop-right-line" size="30"></uni-icons>
				</view>
				<!-- 意见反馈 -->
				<view class="menu-item" @click="feedBack">
					<view class="left">
						<uni-icons color="#46b0fe" type="chatbubble" size="22"></uni-icons>
						<text class="value">意见反馈</text>
					</view>
					<uni-icons color="#cccccc" custom-prefix="iconfont" type="icon-arrow-drop-right-line" size="30"></uni-icons>
				</view>
				<!-- 后台管理 -->
				<view class="menu-item" @click="adminManage" v-if="userStore.userInfo.role[0]=='admin'">
					<view class="left">
						<uni-icons color="#46b0fe" type="gear" size="22"></uni-icons>
						<text class="value">后台管理</text>
					</view>
					<uni-icons color="#cccccc" custom-prefix="iconfont" type="icon-arrow-drop-right-line" size="30"></uni-icons>
				</view>
			</view>
			
			<!-- 退出登录 -->
			<view class="logout-section" v-if="userStore.userInfo.isLogin">
				<view class="menu-item logout" @click="loginOut">
					<view class="left">
						<uni-icons color="#ff6b6b" custom-prefix="iconfont" type="icon-tuichudenglu" size="22"></uni-icons>
						<text class="value">退出登录</text>
					</view>
					<uni-icons color="#cccccc" custom-prefix="iconfont" type="icon-arrow-drop-right-line" size="30"></uni-icons>
				</view>
			</view>

			<!-- 版本信息 -->
			<view class="version-info">
				<text>酒旅圈圈 v1.0.0</text>
			</view>
		</view>
	</view>
</template>


<style lang="scss" scoped>
	.my {
		min-height: 100vh;
		background-color: #f7f7f7;

		/*头部*/
		.myHead {
			display: flex;
			align-items: center;
			padding: 40rpx 30rpx;
			height: 320rpx;
			color: #fff;
			background: linear-gradient(135deg, #46b0fe, #6385ff);
			position: relative;
			overflow: hidden;
			box-shadow: 0 3px 10px rgba(0, 0, 0, 0.1);
			
			&::before {
				content: '';
				position: absolute;
				top: -100rpx;
				right: -100rpx;
				width: 400rpx;
				height: 400rpx;
				border-radius: 50%;
				background: rgba(255, 255, 255, 0.1);
				z-index: 0;
			}
			
			&::after {
				content: '';
				position: absolute;
				bottom: -150rpx;
				left: -100rpx;
				width: 300rpx;
				height: 300rpx;
				border-radius: 50%;
				background: rgba(255, 255, 255, 0.08);
				z-index: 0;
			}

			/*头像*/
			.avatar {
				margin-right: 30rpx;
				width: 140rpx;
				height: 140rpx;
				border-radius: 50%;
				overflow: hidden;
				position: relative;
				border: 4rpx solid rgba(255, 255, 255, 0.6);
				z-index: 1;
				box-shadow: 0 4rpx 10rpx rgba(0, 0, 0, 0.15);
				
				image {
					width: 100%;
					height: 100%;
				}
				
				.edit-icon {
					position: absolute;
					bottom: 0;
					left: 0;
					right: 0;
					height: 40rpx;
					background-color: rgba(0, 0, 0, 0.4);
					display: flex;
					justify-content: center;
					align-items: center;
				}
			}
			
			/* 微信头像选择按钮样式 */
			.avatar-button {
				padding: 0;
				width: 140rpx;
				height: 140rpx;
				margin-right: 30rpx;
				background-color: transparent;
				border: none;
				z-index: 1;
				
				&::after {
					border: none;
				}
			}

			/*未登录*/
			.login-btn {
				font-size: 36rpx;
				font-weight: 500;
				background-color: rgba(255, 255, 255, 0.2);
				padding: 16rpx 40rpx;
				border-radius: 40rpx;
				z-index: 1;
				transition: all 0.3s;
				
				&:active {
					background-color: rgba(255, 255, 255, 0.3);
				}
			}

			/*已登录*/
			.userInfo {
				z-index: 1;
				flex: 1;
				position: relative;
				
				.nickname {
					font-size: 36rpx;
					font-weight: 600;
					display: flex;
					align-items: center;
					margin-bottom: 16rpx;
					max-width: 450rpx;
					
					.nickname-text {
						max-width: 340rpx;
						overflow: hidden;
						text-overflow: ellipsis;
						white-space: nowrap;
						
						&.placeholder {
							color: #ff4d4f;
						}
					}
					
					.nickname-input {
						font-size: 36rpx;
						font-weight: 600;
						color: #fff;
						background-color: transparent;
						max-width: 340rpx;
						min-width: 140rpx;
						overflow: hidden;
						text-overflow: ellipsis;
						white-space: nowrap;
						padding-right: 10rpx;
						
						&::placeholder {
							color: #ff4d4f;
							font-size: 32rpx;
						}
					}
				}

				.mobile {
					font-size: 28rpx;
					opacity: 0.9;
				}
				
				.edit-profile-btn {
					position: absolute;
					top: 0;
					right: 0;
					display: flex;
					align-items: center;
					background-color: rgba(255, 255, 255, 0.2);
					padding: 8rpx 16rpx;
					border-radius: 20rpx;
					transition: all 0.3s;
					z-index: 10;
					cursor: pointer;
					
					&:active {
						background-color: rgba(255, 255, 255, 0.3);
						transform: scale(0.95);
					}
					
					.edit-text {
						color: #fff;
						font-size: 24rpx;
						margin-left: 6rpx;
					}
				}
			}
		}

		/*内容*/
		.myContent {
			position: relative;
			padding: 30rpx;
			margin-top: -40rpx;
			border-radius: 32rpx 32rpx 0 0;
			background-color: #f7f7f7;
			min-height: calc(100vh - 320rpx + 40rpx);
			z-index: 2;

			.menu-list {
				background-color: #fff;
				border-radius: 16rpx;
				overflow: hidden;
				box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
				margin-bottom: 30rpx;
			}
			
			.logout-section {
				background-color: #fff;
				border-radius: 16rpx;
				overflow: hidden;
				box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
				margin-bottom: 30rpx;
				
				.logout {
					.value {
						color: #ff6b6b;
					}
				}
			}

			/*菜单项*/
			.menu-item {
				display: flex;
				justify-content: space-between;
				align-items: center;
				padding: 32rpx 30rpx;
				position: relative;
				transition: all 0.3s;
				
				&:active {
					background-color: #f9f9f9;
				}
				
				&:not(:last-child)::after {
					content: '';
					position: absolute;
					left: 30rpx;
					right: 30rpx;
					bottom: 0;
					height: 1px;
					background-color: #f0f0f0;
				}
			}

			/*icon的公共样式*/
			.left {
				display: flex;
				align-items: center;

				.value {
					margin-left: 20rpx;
					font-size: 32rpx;
					color: #333;
				}
			}
			
			/*版本信息*/
			.version-info {
				text-align: center;
				font-size: 24rpx;
				color: #999;
				margin-top: 60rpx;
				padding: 20rpx 0;
			}
		}
	}
</style>