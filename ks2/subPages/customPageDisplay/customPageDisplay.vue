<script setup>
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { useUserInfoStore } from '@/store/user.js'

const pageApi = uniCloud.importObject('customPageKs')
const userStore = useUserInfoStore()

// 页面数据
const pageData = ref(null)
const pageId = ref('')
const isEditing = ref(false)
const editForm = ref({
	avatarUrl: '',
	title: '',
	content: '',
	contact_info: '',
	qr_code_image: ''
})

// 判断是否是管理员
const isAdmin = computed(() => {
	return userStore.userInfo.role && userStore.userInfo.role[0] === 'admin'
})

onLoad((options) => {
	if (options.id) {
		pageId.value = options.id
		loadPageData()
	}
})

// 加载页面数据
const loadPageData = async () => {
	try {
		uni.showLoading({
			title: '加载中...'
		})
		
		const res = await pageApi.get(pageId.value)
		
		if (res.data && res.data.length > 0) {
			pageData.value = res.data[0]
			
			// 增加浏览次数（异步，不影响页面显示）
			try {
				const viewRes = await pageApi.increaseViewCount(pageId.value)
				// 如果更新成功，同步更新本地显示
				if (viewRes && viewRes.code === 0 && viewRes.view_count !== undefined) {
					pageData.value.view_count = viewRes.view_count
				}
			} catch (viewErr) {
				console.error('更新浏览次数失败:', viewErr)
				// 不显示错误提示，不影响用户体验
			}
		} else {
			uni.showToast({
				title: '页面不存在',
				icon: 'none'
			})
		}
		
		uni.hideLoading()
	} catch (error) {
		console.error('加载页面失败:', error)
		uni.hideLoading()
		uni.showToast({
			title: '加载失败',
			icon: 'none'
		})
	}
}

// 复制联系方式
const copyContact = () => {
	if (!pageData.value || !pageData.value.contact_info) {
		return
	}
	
	uni.setClipboardData({
		data: pageData.value.contact_info,
		success: () => {
			uni.showToast({
				title: '已复制到剪贴板',
				icon: 'success'
			})
		}
	})
}

// 保存二维码
const saveQRCode = () => {
	if (!pageData.value || !pageData.value.qr_code_image) {
		return
	}
	
	uni.showLoading({
		title: '保存中...'
	})
	
	// 先下载图片到本地
	uni.downloadFile({
		url: pageData.value.qr_code_image,
		success: (res) => {
			if (res.statusCode === 200) {
				// 保存到相册
				uni.saveImageToPhotosAlbum({
					filePath: res.tempFilePath,
					success: () => {
						uni.hideLoading()
						uni.showToast({
							title: '保存成功',
							icon: 'success'
						})
					},
					fail: (err) => {
						uni.hideLoading()
						console.error('保存失败:', err)
						uni.showToast({
							title: '保存失败',
							icon: 'none'
						})
					}
				})
			}
		},
		fail: (err) => {
			uni.hideLoading()
			console.error('下载失败:', err)
			uni.showToast({
				title: '下载失败',
				icon: 'none'
			})
		}
	})
}

// 预览二维码
const previewQRCode = () => {
	if (!pageData.value || !pageData.value.qr_code_image) {
		return
	}
	
	uni.previewImage({
		urls: [pageData.value.qr_code_image],
		current: pageData.value.qr_code_image
	})
}

// 切换编辑模式
const toggleEdit = () => {
	if (isEditing.value) {
		// 退出编辑，恢复原始数据
		isEditing.value = false
	} else {
		// 进入编辑，复制当前数据
		editForm.value = {
			avatarUrl: pageData.value.avatar_url || '',
			title: pageData.value.title || '',
			content: pageData.value.content || '',
			contact_info: pageData.value.contact_info || '',
			qr_code_image: pageData.value.qr_code_image || ''
		}
		isEditing.value = true
	}
}

// 上传头像
const uploadAvatar = () => {
	uni.chooseImage({
		count: 1,
		sizeType: ['compressed'],
		sourceType: ['album', 'camera'],
		success: (res) => {
			const tempFilePath = res.tempFilePaths[0]
			uni.showLoading({ title: '上传中...' })
			
			// 上传到云存储
			uniCloud.uploadFile({
				filePath: tempFilePath,
				cloudPath: `custom-page-avatar/${Date.now()}_${Math.random().toString(36).slice(2)}.jpg`,
				success: (uploadRes) => {
					uni.hideLoading()
					editForm.value.avatarUrl = uploadRes.fileID
					uni.showToast({
						title: '上传成功',
						icon: 'success'
					})
				},
				fail: (err) => {
					uni.hideLoading()
					console.error('上传失败:', err)
					uni.showToast({
						title: '上传失败',
						icon: 'none'
					})
				}
			})
		}
	})
}

// 上传二维码
const uploadQRCode = () => {
	uni.chooseImage({
		count: 1,
		sizeType: ['compressed'],
		sourceType: ['album', 'camera'],
		success: (res) => {
			const tempFilePath = res.tempFilePaths[0]
			uni.showLoading({ title: '上传中...' })
			
			// 上传到云存储
			uniCloud.uploadFile({
				filePath: tempFilePath,
				cloudPath: `custom-page-qrcode/${Date.now()}_${Math.random().toString(36).slice(2)}.jpg`,
				success: (uploadRes) => {
					uni.hideLoading()
					editForm.value.qr_code_image = uploadRes.fileID
					uni.showToast({
						title: '上传成功',
						icon: 'success'
					})
				},
				fail: (err) => {
					uni.hideLoading()
					console.error('上传失败:', err)
					uni.showToast({
						title: '上传失败',
						icon: 'none'
					})
				}
			})
		}
	})
}

// 保存编辑
const saveEdit = async () => {
	try {
		uni.showLoading({ title: '保存中...' })
		
		const updateData = {
			avatar_url: editForm.value.avatarUrl,
			title: editForm.value.title,
			content: editForm.value.content,
			contact_info: editForm.value.contact_info,
			qr_code_image: editForm.value.qr_code_image
		}
		
		const res = await pageApi.update(pageId.value, updateData)
		
		if (res.code === 0) {
			// 更新本地数据
			pageData.value = {
				...pageData.value,
				...updateData
			}
			isEditing.value = false
			uni.hideLoading()
			uni.showToast({
				title: '保存成功',
				icon: 'success'
			})
		} else {
			uni.hideLoading()
			uni.showToast({
				title: res.msg || '保存失败',
				icon: 'none'
			})
		}
	} catch (error) {
		console.error('保存失败:', error)
		uni.hideLoading()
		uni.showToast({
			title: '保存失败',
			icon: 'none'
		})
	}
}

// 计算样式
const containerStyle = computed(() => {
	if (!pageData.value) return {}
	return {
		backgroundColor: pageData.value.background_color || '#ffffff',
		color: pageData.value.text_color || '#333333'
	}
})
</script>

<template>
	<view class="custom-page" v-if="pageData">
		<!-- 顶部操作栏（仅管理员可见） -->
		<view class="top-actions" v-if="isAdmin">
			<view class="back-btn" @click="uni.navigateBack()">
				<uni-icons type="back" size="20" color="#333"></uni-icons>
				<text>返回</text>
			</view>
			<view class="edit-btn" @click="toggleEdit">
				<uni-icons :type="isEditing ? 'close' : 'compose'" size="20" :color="isEditing ? '#f56c6c' : '#07C160'"></uni-icons>
				<text :style="{color: isEditing ? '#f56c6c' : '#07C160'}">{{ isEditing ? '取消' : '编辑' }}</text>
			</view>
		</view>
		
		<!-- 头部：头像 + 标题（横排显示） -->
		<view class="page-header" :style="{paddingTop: isAdmin ? '40rpx' : '80rpx'}">
			<view class="avatar-section">
				<view class="avatar-wrapper" @click="isAdmin && isEditing ? uploadAvatar() : null">
					<image 
						:src="isEditing ? (editForm.avatarUrl || '/static/default-avatar.png') : (pageData.avatar_url || '/static/default-avatar.png')" 
						mode="aspectFill"
						class="avatar-image"
					></image>
					<view class="avatar-edit" v-if="isAdmin && isEditing">
						<uni-icons type="camera-filled" size="16" color="#fff"></uni-icons>
					</view>
				</view>
			</view>
			<view class="title-section">
				<input 
					v-if="isAdmin && isEditing" 
					v-model="editForm.title" 
					class="title-input" 
					placeholder="请输入标题"
				/>
				<view v-else class="page-title">{{ pageData.title }}</view>
			</view>
		</view>
		
		<!-- 主体内容卡片 -->
		<view class="content-card">
			<!-- 二维码容器 -->
			<view class="qr-container" v-if="isEditing ? editForm.qr_code_image : pageData.qr_code_image">
				<view class="qr-box" @click="isAdmin && isEditing ? uploadQRCode() : previewQRCode()">
					<image 
						:src="isEditing ? editForm.qr_code_image : pageData.qr_code_image" 
						mode="aspectFit" 
						class="qr-image"
					/>
					<view class="qr-edit" v-if="isAdmin && isEditing">
						<uni-icons type="camera-filled" size="20" color="#fff"></uni-icons>
						<text>点击更换</text>
					</view>
				</view>
				
				<!-- 保存二维码按钮 -->
				<view class="save-qr-btn" @click="saveQRCode">
					<uni-icons type="download-filled" size="22" color="#fff"></uni-icons>
					<text>保存二维码</text>
				</view>
			</view>
			
			<!-- 内容说明 -->
			<view class="page-content">
				<textarea 
					v-if="isAdmin && isEditing" 
					v-model="editForm.content" 
					class="content-textarea" 
					placeholder="请输入内容说明"
					auto-height
				></textarea>
				<view v-else-if="pageData.content">
					{{ pageData.content }}
				</view>
			</view>
			
			<!-- 服务特点 -->
			<view class="service-section">
				<view class="service-title">添加好友，享受更多服务</view>
				<view class="service-list">
					<view class="service-item">
						<view class="service-icon chat">
							<uni-icons type="chat" size="24" color="#07C160"></uni-icons>
						</view>
						<text class="service-text">随时在线交流，解答您的疑问</text>
					</view>
					<view class="service-item">
						<view class="service-icon bell">
							<uni-icons type="notification" size="24" color="#07C160"></uni-icons>
						</view>
						<text class="service-text">第一时间获取最新资讯和活动</text>
					</view>
					<view class="service-item">
						<view class="service-icon star">
							<uni-icons type="star" size="24" color="#07C160"></uni-icons>
						</view>
						<text class="service-text">专属福利和优惠，不容错过</text>
					</view>
				</view>
			</view>
		</view>
		
		<!-- 底部保存按钮 -->
		<view class="bottom-actions" v-if="false">
			<!-- 已移动到二维码下方 -->
		</view>
		
		<!-- 联系方式 -->
		<view class="contact-info" v-if="(isAdmin && isEditing) || pageData.contact_info">
			<uni-icons type="contact" size="18" color="#999"></uni-icons>
			<input 
				v-if="isAdmin && isEditing" 
				v-model="editForm.contact_info" 
				class="contact-input" 
				placeholder="请输入联系方式"
			/>
			<template v-else>
				<text @click="copyContact">联系方式: {{ pageData.contact_info }}</text>
				<text class="copy-hint" @click="copyContact">（点击复制）</text>
			</template>
		</view>
		
		<!-- 保存按钮（仅管理员编辑时显示） -->
		<view class="save-section" v-if="isAdmin && isEditing">
			<view class="save-edit-btn" @click="saveEdit">
				<uni-icons type="checkmarkempty" size="22" color="#fff"></uni-icons>
				<text>保存修改</text>
			</view>
		</view>
		
		<!-- 浏览次数 -->
		<view class="view-count">
			<uni-icons type="eye" size="16" color="#b3b3b3"></uni-icons>
			<text>已有 {{ pageData.view_count || 0 }} 人浏览</text>
		</view>
	</view>
	
	<!-- 加载中 -->
	<view class="loading-state" v-else>
		<uni-icons type="spinner-cycle" size="60" color="#07C160"></uni-icons>
		<text>加载中...</text>
	</view>
</template>

<style lang="scss" scoped>
@import "@/style/common.scss";

.custom-page {
	min-height: 100vh;
	background: linear-gradient(180deg, 
		rgba(7, 193, 96, 0.15) 0%, 
		rgba(6, 174, 86, 0.08) 20%,
		rgba(255, 255, 255, 0.95) 40%,
		#ffffff 60%
	);
	backdrop-filter: blur(10px);
	-webkit-backdrop-filter: blur(10px);
	padding-bottom: 60rpx;
	position: relative;
	
	// 添加背景装饰
	&::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 500rpx;
		background: radial-gradient(circle at 30% 20%, 
			rgba(7, 193, 96, 0.1) 0%, 
			transparent 50%
		),
		radial-gradient(circle at 70% 40%, 
			rgba(6, 174, 86, 0.08) 0%, 
			transparent 50%
		);
		filter: blur(40px);
		pointer-events: none;
		z-index: 0;
	}
	
	// 确保内容在背景之上
	> * {
		position: relative;
		z-index: 1;
	}
	
	// 顶部操作栏
	.top-actions {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 20rpx 30rpx;
		background: #fff;
		border-bottom: 1rpx solid #f0f0f0;
		
		.back-btn,
		.edit-btn {
			display: flex;
			align-items: center;
			gap: 8rpx;
			padding: 10rpx 20rpx;
			font-size: 28rpx;
			color: #333;
			
			&:active {
				opacity: 0.7;
			}
		}
	}
	
	// 头部：头像 + 标题（横排显示）
	.page-header {
		display: flex;
		align-items: center;
		padding: 40rpx 30rpx;
		background: #fff;
		gap: 30rpx;
		
		.avatar-section {
			flex-shrink: 0;
			
			.avatar-wrapper {
				position: relative;
				width: 120rpx;
				height: 120rpx;
				border-radius: 50%;
				overflow: hidden;
				box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);
				
				.avatar-image {
					width: 100%;
					height: 100%;
				}
				
				.avatar-edit {
					position: absolute;
					bottom: 0;
					left: 0;
					right: 0;
					height: 40rpx;
					background: rgba(0, 0, 0, 0.5);
					display: flex;
					align-items: center;
					justify-content: center;
				}
			}
		}
		
		.title-section {
			flex: 1;
			
			.page-title {
				font-size: 36rpx;
				font-weight: 600;
				color: #1a1a1a;
				line-height: 1.5;
			}
			
			.title-input {
				width: 100%;
				font-size: 36rpx;
				font-weight: 600;
				color: #1a1a1a;
				padding: 10rpx 20rpx;
				border: 2rpx solid #07C160;
				border-radius: 8rpx;
				background: #f0fff4;
			}
		}
	}
	
	// 主体内容卡片
	.content-card {
		margin: 0 30rpx 40rpx;
		background: #ffffff;
		border-radius: 24rpx;
		box-shadow: 0 4rpx 30rpx rgba(0, 0, 0, 0.06);
		overflow: hidden;
		
		// 二维码容器
		.qr-container {
			padding: 60rpx 40rpx 50rpx;
			display: flex;
			flex-direction: column;
			align-items: center;
			
			.qr-box {
				width: 500rpx;
				height: 500rpx;
				background: #ffffff;
				border-radius: 24rpx;
				padding: 30rpx;
				box-shadow: 0 0 0 2rpx #f0f0f0;
				margin-bottom: 40rpx;
				position: relative;
				
				.qr-image {
					width: 100%;
					height: 100%;
				}
				
				.qr-edit {
					position: absolute;
					top: 0;
					left: 0;
					right: 0;
					bottom: 0;
					background: rgba(0, 0, 0, 0.5);
					display: flex;
					flex-direction: column;
					align-items: center;
					justify-content: center;
					gap: 10rpx;
					color: #fff;
					font-size: 24rpx;
					border-radius: 24rpx;
				}
			}
			
			.qr-text {
				font-size: 36rpx;
				font-weight: 600;
				color: #1a1a1a;
				margin-bottom: 16rpx;
				text-align: center;
				display: none; // 隐藏
			}
			
			.qr-subtitle {
				font-size: 28rpx;
				color: #8c8c8c;
				text-align: center;
				line-height: 1.6;
				display: none; // 隐藏
			}
			
			// 保存二维码按钮（移到二维码下方）
			.save-qr-btn {
				width: 100%;
				max-width: 500rpx;
				height: 88rpx;
				margin-top: 40rpx;
				background: linear-gradient(135deg, #07C160 0%, #06AE56 100%);
				border-radius: 44rpx;
				display: flex;
				align-items: center;
				justify-content: center;
				gap: 12rpx;
				color: #ffffff;
				font-size: 32rpx;
				font-weight: 600;
				box-shadow: 0 8rpx 24rpx rgba(7, 193, 96, 0.3);
				
				&:active {
					opacity: 0.9;
					transform: scale(0.98);
				}
			}
		}
		
		// 内容说明
		.page-content {
			padding: 0 40rpx 40rpx;
			font-size: 28rpx;
			color: #666;
			line-height: 1.8;
			text-align: center;
			white-space: pre-wrap;
			border-bottom: 1px solid #f0f0f0;
			
			.content-textarea {
				width: 100%;
				min-height: 150rpx;
				padding: 20rpx;
				font-size: 28rpx;
				color: #333;
				line-height: 1.8;
				border: 2rpx solid #07C160;
				border-radius: 8rpx;
				background: #f0fff4;
				box-sizing: border-box;
			}
		}
		
		// 服务特点
		.service-section {
			padding: 50rpx 40rpx 40rpx;
			
			.service-title {
				font-size: 32rpx;
				font-weight: 600;
				color: #1a1a1a;
				text-align: center;
				margin-bottom: 40rpx;
			}
			
			.service-list {
				display: flex;
				flex-direction: column;
				gap: 30rpx;
				
				.service-item {
					display: flex;
					align-items: center;
					gap: 24rpx;
					
					.service-icon {
						width: 70rpx;
						height: 70rpx;
						border-radius: 16rpx;
						display: flex;
						align-items: center;
						justify-content: center;
						flex-shrink: 0;
						
						&.chat {
							background: rgba(7, 193, 96, 0.1);
						}
						
						&.bell {
							background: rgba(7, 193, 96, 0.1);
						}
						
						&.star {
							background: rgba(7, 193, 96, 0.1);
						}
					}
					
					.service-text {
						font-size: 28rpx;
						color: #4d4d4d;
						line-height: 1.5;
						flex: 1;
					}
				}
			}
		}
	}
	
	// 底部保存按钮
	.bottom-actions {
		padding: 0 40rpx;
		margin-bottom: 30rpx;
		
		.save-btn {
			width: 100%;
			height: 96rpx;
			background: linear-gradient(135deg, #07C160 0%, #06AE56 100%);
			border-radius: 48rpx;
			display: flex;
			align-items: center;
			justify-content: center;
			gap: 12rpx;
			color: #ffffff;
			font-size: 32rpx;
			font-weight: 600;
			box-shadow: 0 8rpx 24rpx rgba(7, 193, 96, 0.3);
			margin-bottom: 20rpx;
			
			&:active {
				opacity: 0.9;
				transform: scale(0.98);
			}
		}
		
		.save-tip {
			font-size: 24rpx;
			color: #b3b3b3;
			text-align: center;
			line-height: 1.6;
		}
	}
	
	// 联系方式
	.contact-info {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8rpx;
		padding: 24rpx 40rpx;
		margin: 0 40rpx 20rpx;
		background: #f7f8fa;
		border-radius: 16rpx;
		font-size: 26rpx;
		color: #666;
		
		.contact-input {
			flex: 1;
			padding: 10rpx 20rpx;
			font-size: 26rpx;
			color: #333;
			border: 2rpx solid #07C160;
			border-radius: 8rpx;
			background: #fff;
		}
		
		.copy-hint {
			color: #999;
			font-size: 24rpx;
			cursor: pointer;
		}
		
		&:active {
			opacity: 0.7;
		}
	}
	
	// 保存按钮区域
	.save-section {
		padding: 30rpx 40rpx;
		
		.save-edit-btn {
			width: 100%;
			height: 96rpx;
			background: linear-gradient(135deg, #07C160 0%, #06AE56 100%);
			border-radius: 48rpx;
			display: flex;
			align-items: center;
			justify-content: center;
			gap: 12rpx;
			color: #ffffff;
			font-size: 32rpx;
			font-weight: 600;
			box-shadow: 0 8rpx 24rpx rgba(7, 193, 96, 0.3);
			
			&:active {
				opacity: 0.9;
				transform: scale(0.98);
			}
		}
	}
	
	// 浏览次数
	.view-count {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8rpx;
		padding: 20rpx 40rpx;
		font-size: 24rpx;
		color: #b3b3b3;
	}
}

.loading-state {
	min-height: 100vh;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 20rpx;
	background: linear-gradient(180deg, 
		rgba(7, 193, 96, 0.15) 0%, 
		rgba(6, 174, 86, 0.08) 20%,
		rgba(255, 255, 255, 0.95) 40%,
		#ffffff 60%
	);
	backdrop-filter: blur(10px);
	-webkit-backdrop-filter: blur(10px);
	
	text {
		font-size: 28rpx;
		color: #999;
	}
}
</style>
