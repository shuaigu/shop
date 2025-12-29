<script setup>
	import { ref, watch } from 'vue'
	import { uploadAvatar, updateUserProfile, getWxUserProfile } from '@/utils/profileHelper.js' // 引入工具函数

	const props = defineProps({
		show: {
			type: Boolean,
			default: false
		},
		userInfo: {
			type: Object,
			default: () => ({})
		}
	})

	const emit = defineEmits(['update:show', 'profile-updated'])

	// 本地状态
	const isUpdating = ref(false)
	const currentNickname = ref('')
	const currentAvatarUrl = ref('')

	// 监听弹窗显示状态
	watch(() => props.show, (newVal, oldVal) => {
		console.log('弹窗显示状态变化:', { 旧值: oldVal, 新值: newVal })
		if (newVal) {
			// 弹窗打开时，初始化当前信息
			currentNickname.value = props.userInfo.nickName || '未设置'
			currentAvatarUrl.value = props.userInfo.avatarUrl || '/static/images/default.png'
			console.log('初始化弹窗信息:', { 
				昵称: currentNickname.value, 
				头像: currentAvatarUrl.value 
			})
		}
	})

	// 检查登录状态
	const checkLogin = () => {
		if (!props.userInfo || !props.userInfo.isLogin || !props.userInfo.uid) {
			uni.showModal({
				title: '需要登录',
				content: '请先登录后再操作',
				confirmText: '去登录',
				cancelText: '取消',
				success: (res) => {
					if (res.confirm) {
						// 关闭当前弹窗
						emit('update:show', false)
						// 跳转到登录页
						uni.navigateTo({
							url: '/pages/login/login'
						})
					}
				}
			})
			return false
		}
		return true
	}

	// 获取头像
	const handleGetAvatar = async () => {
		if (!checkLogin()) return
		
		try {
			console.log('开始获取头像')
			
			// #ifdef MP-WEIXIN
			// 使用微信头像选择组件
			uni.showModal({
				title: '获取头像',
				content: '请在个人中心页面点击头像直接修改，这样可以使用微信的头像选择功能。',
				confirmText: '知道了',
				showCancel: false,
				success: () => {
					emit('update:show', false)
				}
			})
			// #endif
			
			// #ifndef MP-WEIXIN
			// 非微信环境使用通用头像选择
			uni.chooseImage({
				count: 1,
				sizeType: ['compressed'],
				sourceType: ['album', 'camera'],
				success: async (res) => {
					try {
						uni.showLoading({ title: '上传头像中...' })
						
						// 使用 uploadAvatar 上传到七牛云
						const qiniuAvatarUrl = await uploadAvatar(res.tempFilePaths[0], props.userInfo.uid)
						console.log('📷 头像上传成功，七牛云URL:', qiniuAvatarUrl)
						
						// 更新用户信息
						const result = await updateUserProfile({ avatarUrl: qiniuAvatarUrl }, props.userInfo.uid)
						
						if (result.code === 0) {
							currentAvatarUrl.value = qiniuAvatarUrl
							emit('profile-updated', { avatarUrl: qiniuAvatarUrl })
							uni.showToast({
								title: '头像更新成功',
								icon: 'success'
							})
						} else {
							throw new Error(result.message || '头像更新失败')
						}
					} catch (error) {
						console.error('头像处理失败:', error)
						uni.showToast({
							title: error.message || '头像处理失败',
							icon: 'none'
						})
					} finally {
						uni.hideLoading()
					}
				}
			})
			// #endif
			
		} catch (error) {
			console.error('获取头像失败:', error)
			uni.showToast({
				title: '获取头像失败: ' + error.message,
				icon: 'none'
			})
		}
	}

	// 获取昵称
	const handleGetNickname = async () => {
		if (!checkLogin()) return
		
		try {
			console.log('开始获取昵称')
			
			// #ifdef MP-WEIXIN
			// 使用微信昵称填写组件
			uni.showModal({
				title: '获取昵称',
				content: '请在个人中心页面点击昵称输入框直接修改，这样可以使用微信的昵称填写功能。',
				confirmText: '知道了',
				showCancel: false,
				success: () => {
					emit('update:show', false)
				}
			})
			// #endif
			
			// #ifndef MP-WEIXIN
			// 非微信环境使用输入框
			uni.showModal({
				title: '修改昵称',
				content: '请输入新昵称',
				placeholderText: props.userInfo.nickName || '',
				editable: true,
				success: async (res) => {
					if (res.confirm && res.content && res.content.trim()) {
						try {
							uni.showLoading({ title: '更新昵称中...' })
							
							const userApi = uniCloud.importObject('userWx', { customUI: true })
							const result = await userApi.updateUserProfile({
								uid: props.userInfo.uid,
								nickName: res.content.trim()
							})
							
							if (result.code === 0) {
								currentNickname.value = res.content.trim()
								emit('profile-updated', { nickName: res.content.trim() })
								uni.showToast({
									title: '昵称更新成功',
									icon: 'success'
								})
							} else {
								throw new Error(result.message || '昵称更新失败')
							}
						} catch (error) {
							console.error('昵称更新失败:', error)
							uni.showToast({
								title: error.message || '昵称更新失败',
								icon: 'none'
							})
						} finally {
							uni.hideLoading()
						}
					}
				}
			})
			// #endif
			
		} catch (error) {
			console.error('获取昵称失败:', error)
			uni.showToast({
				title: '获取昵称失败: ' + error.message,
				icon: 'none'
			})
		}
	}

	// 关闭弹窗
	const handleClose = () => {
		console.log('点击关闭弹窗')
		emit('update:show', false)
	}
</script>

<template>
	<view class="popup-wrapper" v-show="props.show">
		<!-- 遮罩层 -->
		<view class="mask" @click="() => { console.log('点击遮罩层'); handleClose(); }"></view>
		
		<!-- 弹窗内容 -->
		<view class="popup-content" @click.stop="">
			<view class="popup-title">获取头像跟昵称</view>
			
			<!-- 当前信息显示 -->
			<view class="info-display">
				<view class="info-item">
					<text class="info-label">当前头像：</text>
					<image :src="currentAvatarUrl" mode="aspectFill" class="current-avatar"></image>
				</view>
				<view class="info-item">
					<text class="info-label">当前昵称：</text>
					<text class="current-nickname">{{ currentNickname }}</text>
				</view>
			</view>
			
			<!-- 提示说明 -->
			<view class="tip-text">
				点击下方按钮可以分别获取头像和昵称信息。
				<text class="highlight-text">\n\n🎯 操作说明：</text>
				<text class="highlight-text">\n• 点击"获取头像"可以选择或更新头像</text>
				<text class="highlight-text">\n• 点击"获取昵称"可以修改昵称信息</text>
				<text class="highlight-text">\n• 微信环境下会使用微信原生组件</text>
				\n\n也可以在个人中心页面直接点击头像或昵称区域进行修改。
			</view>
			
			<!-- 按钮区域 -->
			<view class="button-section">
				<view class="action-buttons">
					<button 
						class="btn avatar-btn" 
						@click="handleGetAvatar"
						:disabled="isUpdating"
					>
						<uni-icons type="camera-filled" color="#fff" size="18"></uni-icons>
						<text class="btn-text">获取头像</text>
					</button>
					<button 
						class="btn nickname-btn" 
						@click="handleGetNickname"
						:disabled="isUpdating"
					>
						<uni-icons type="compose" color="#fff" size="18"></uni-icons>
						<text class="btn-text">获取昵称</text>
					</button>
				</view>
				<button class="btn close-btn" @click="handleClose">关闭</button>
			</view>
		</view>
	</view>
</template>

<style lang="scss" scoped>
	.popup-wrapper {
		position: fixed;
		left: 0;
		right: 0;
		top: 0;
		bottom: 0;
		z-index: 9999;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.mask {
		position: fixed;
		left: 0;
		right: 0;
		top: 0;
		bottom: 0;
		background-color: rgba(0, 0, 0, 0.5);
		z-index: 9998;
	}

	.popup-content {
		position: relative;
		width: 550rpx;
		background-color: #fff;
		border-radius: 20rpx;
		padding: 40rpx;
		z-index: 10000;
		box-shadow: 0 10rpx 30rpx rgba(0, 0, 0, 0.2);
	}
	
	.popup-title {
		text-align: center;
		font-size: 32rpx;
		font-weight: 600;
		color: #333;
		margin-bottom: 30rpx;
	}
	
	// 信息显示区域
	.info-display {
		background-color: #f8f9fa;
		border-radius: 12rpx;
		padding: 25rpx;
		margin-bottom: 25rpx;
	}
	
	.info-item {
		display: flex;
		align-items: center;
		margin-bottom: 20rpx;
		
		&:last-child {
			margin-bottom: 0;
		}
	}
	
	.info-label {
		font-size: 26rpx;
		color: #666;
		width: 140rpx;
		flex-shrink: 0;
	}
	
	.current-avatar {
		width: 60rpx;
		height: 60rpx;
		border-radius: 30rpx;
		border: 2rpx solid #e0e0e0;
	}
	
	.current-nickname {
		font-size: 28rpx;
		color: #333;
		flex: 1;
	}
	
	// 提示文字
	.tip-text {
		font-size: 24rpx;
		color: #666;
		text-align: left;
		margin-bottom: 30rpx;
		line-height: 1.6;
		padding: 20rpx;
		background-color: #f8f9fa;
		border-radius: 8rpx;
		border-left: 4rpx solid #52c41a;
		
		.highlight-text {
			color: #52c41a;
			font-weight: 500;
		}
	}
	
	// 按钮区域
	.button-section {
		display: flex;
		flex-direction: column;
		gap: 15rpx;
	}
	
	.action-buttons {
		display: flex;
		gap: 15rpx;
		margin-bottom: 15rpx;
	}
	
	.btn {
		height: 80rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 12rpx;
		font-size: 28rpx;
		margin: 0;
		padding: 0 20rpx;
		transition: all 0.3s;
		flex: 1;
		
		&::after {
			border: none;
		}
		
		&:disabled {
			opacity: 0.6;
		}
		
		.btn-text {
			margin-left: 8rpx;
		}
	}

	.avatar-btn {
		background: linear-gradient(135deg, #ff7875, #ff4d4f);
		color: #fff;
		font-weight: 500;
		
		&:active:not(:disabled) {
			opacity: 0.8;
		}
	}

	.nickname-btn {
		background: linear-gradient(135deg, #52c41a, #389e0d);
		color: #fff;
		font-weight: 500;
		
		&:active:not(:disabled) {
			opacity: 0.8;
		}
	}

	.close-btn {
		background-color: #f5f5f5;
		color: #666;
		height: 80rpx;
		line-height: 80rpx;
		text-align: center;
		
		&:active {
			background-color: #e8e8e8;
		}
	}
</style>