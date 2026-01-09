<script setup>
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'

const pageApi = uniCloud.importObject('customPageKs')

// 页面数据
const pageData = ref(null)
const pageId = ref('')

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
		<!-- 头部：微信图标 + 标题 -->
		<view class="page-header">
			<view class="wechat-icon">
				<image src="https://img.icons8.com/color/96/wechat.png" mode="aspectFit"></image>
			</view>
			<view class="page-title">{{ pageData.title }}</view>
		</view>
		
		<!-- 主体内容卡片 -->
		<view class="content-card">
			<!-- 二维码容器 -->
			<view class="qr-container" v-if="pageData.qr_code_image">
				<view class="qr-box">
					<image 
						:src="pageData.qr_code_image" 
						mode="aspectFit" 
						class="qr-image"
						@click="previewQRCode"
					/>
				</view>
				<view class="qr-text">扫描二维码添加好友</view>
				<view class="qr-subtitle">打开微信扫一扫，即可添加我为好友</view>
			</view>
			
			<!-- 内容说明 -->
			<view class="page-content" v-if="pageData.content">
				{{ pageData.content }}
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
		<view class="bottom-actions" v-if="pageData.qr_code_image">
			<view class="save-btn" @click="saveQRCode">
				<uni-icons type="download-filled" size="22" color="#fff"></uni-icons>
				<text>保存二维码</text>
			</view>
			<view class="save-tip">保存二维码后，可在相册中查看并分享给朋友</view>
		</view>
		
		<!-- 联系方式（如果有） -->
		<view class="contact-info" v-if="pageData.contact_info" @click="copyContact">
			<uni-icons type="contact" size="18" color="#999"></uni-icons>
			<text>联系方式: {{ pageData.contact_info }}</text>
			<text class="copy-hint">（点击复制）</text>
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
	background: linear-gradient(180deg, #f5f7fa 0%, #ffffff 40%);
	padding-bottom: 60rpx;
	
	// 头部：微信图标 + 标题
	.page-header {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 60rpx 40rpx 40rpx;
		
		.wechat-icon {
			width: 120rpx;
			height: 120rpx;
			border-radius: 24rpx;
			overflow: hidden;
			margin-bottom: 24rpx;
			box-shadow: 0 8rpx 24rpx rgba(7, 193, 96, 0.15);
			
			image {
				width: 100%;
				height: 100%;
			}
		}
		
		.page-title {
			font-size: 44rpx;
			font-weight: 600;
			color: #1a1a1a;
			letter-spacing: 1rpx;
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
			}
			
			.qr-text {
				font-size: 36rpx;
				font-weight: 600;
				color: #1a1a1a;
				margin-bottom: 16rpx;
				text-align: center;
			}
			
			.qr-subtitle {
				font-size: 28rpx;
				color: #8c8c8c;
				text-align: center;
				line-height: 1.6;
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
		
		.copy-hint {
			color: #999;
			font-size: 24rpx;
		}
		
		&:active {
			opacity: 0.7;
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
	background: linear-gradient(180deg, #f5f7fa 0%, #ffffff 40%);
	
	text {
		font-size: 28rpx;
		color: #999;
	}
}
</style>
