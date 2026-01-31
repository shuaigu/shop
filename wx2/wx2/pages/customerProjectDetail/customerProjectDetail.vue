<template>
	<view class="detail-container">
		<!-- 加载中 -->
		<view v-if="loading" class="loading-container">
			<uni-icons type="spinner-cycle" size="40" color="#399bfe"></uni-icons>
			<text class="loading-text">加载中...</text>
		</view>

		<!-- 详情内容 -->
		<view v-else-if="project" class="detail-content">
			<!-- 封面图 -->
			<image v-if="project.cover_image" class="cover-image" :src="project.cover_image" mode="aspectFill"></image>

			<!-- 基本信息 -->
			<view class="info-section">
				<view class="project-title">{{project.title}}</view>
				<view class="project-desc">{{project.description}}</view>

				<!-- 标签 -->
				<view class="tags" v-if="project.tags && project.tags.length > 0">
					<text class="tag" v-for="(tag, index) in project.tags" :key="index">{{tag}}</text>
				</view>

				<!-- 统计信息 -->
				<view class="meta-info">
					<view class="meta-item">
						<uni-icons type="eye" size="16" color="#999"></uni-icons>
						<text>浏览 {{project.view_count || 0}}</text>
					</view>
					<view class="meta-item" v-if="project.category">
						<uni-icons type="list" size="16" color="#999"></uni-icons>
						<text>{{project.category}}</text>
					</view>
				</view>
			</view>

			<!-- 详细内容 -->
			<view class="content-section" v-if="project.content">
				<view class="section-title">项目详情</view>
				<rich-text class="rich-content" :nodes="project.content"></rich-text>
			</view>

			<!-- 图片列表 -->
			<view class="images-section" v-if="project.images && project.images.length > 0">
				<view class="section-title">项目图片</view>
				<view class="image-grid">
					<image 
						v-for="(img, index) in project.images" 
						:key="index" 
						class="grid-image" 
						:src="img" 
						mode="aspectFill"
						@click="previewImage(index)">
					</image>
				</view>
			</view>

			<!-- 其他信息 -->
			<view class="other-info-section">
				<view class="info-item" v-if="project.price_range">
					<text class="label">价格区间：</text>
					<text class="value">{{project.price_range}}</text>
				</view>
				<view class="info-item" v-if="project.service_area">
					<text class="label">服务区域：</text>
					<text class="value">{{project.service_area}}</text>
				</view>
			</view>

			<!-- 联系信息 -->
			<view class="contact-section">
				<view class="section-title">联系方式</view>
				<view class="contact-item" v-if="project.contact_name">
					<uni-icons type="person" size="20" color="#399bfe"></uni-icons>
					<text>{{project.contact_name}}</text>
				</view>
				<view class="contact-item" v-if="project.contact_phone" @click="callPhone(project.contact_phone)">
					<uni-icons type="phone" size="20" color="#399bfe"></uni-icons>
					<text>{{project.contact_phone}}</text>
				</view>
				<view class="contact-item" v-if="project.contact_wechat" @click="copyWechat(project.contact_wechat)">
					<uni-icons type="weixin" size="20" color="#399bfe"></uni-icons>
					<text>{{project.contact_wechat}}</text>
				</view>
				<view class="contact-item" v-if="project.contact_address">
					<uni-icons type="location" size="20" color="#399bfe"></uni-icons>
					<text>{{project.contact_address}}</text>
				</view>
			</view>
		</view>

		<!-- 错误状态 -->
		<view v-else class="error-container">
			<uni-icons type="info" size="80" color="#ddd"></uni-icons>
			<text class="error-text">项目不存在或已下架</text>
			<button class="back-btn" @click="goBack">返回列表</button>
		</view>
	</view>
</template>

<script setup>
	import {
		ref,
		onMounted
	} from 'vue'
	import {
		onLoad
	} from '@dcloudio/uni-app'

	const project = ref(null)
	const loading = ref(true)
	const projectId = ref('')

	// 页面加载
	onLoad((options) => {
		if (options.id) {
			projectId.value = options.id
		}
	})

	// 加载项目详情
	const loadProjectDetail = async () => {
		try {
			loading.value = true
			const projectApi = uniCloud.importObject('customerProject')
			const result = await projectApi.getDetail(projectId.value)

			if (result && result.errCode === 0) {
				project.value = result.data
			} else {
				console.error('加载项目详情失败:', result)
				uni.showToast({
					title: result?.errMsg || '加载失败',
					icon: 'none'
				})
			}
		} catch (error) {
			console.error('加载项目详情异常:', error)
			uni.showToast({
				title: '加载失败',
				icon: 'none'
			})
		} finally {
			loading.value = false
		}
	}

	// 预览图片
	const previewImage = (index) => {
		if (project.value?.images && project.value.images.length > 0) {
			uni.previewImage({
				urls: project.value.images,
				current: index
			})
		}
	}

	// 拨打电话
	const callPhone = (phone) => {
		uni.makePhoneCall({
			phoneNumber: phone
		})
	}

	// 复制微信号
	const copyWechat = (wechat) => {
		uni.setClipboardData({
			data: wechat,
			success: () => {
				uni.showToast({
					title: '微信号已复制',
					icon: 'success'
				})
			}
		})
	}

	// 返回
	const goBack = () => {
		uni.navigateBack()
	}

	onMounted(() => {
		if (projectId.value) {
			loadProjectDetail()
		} else {
			uni.showToast({
				title: '项目ID不能为空',
				icon: 'none'
			})
			setTimeout(() => {
				uni.navigateBack()
			}, 1500)
		}
	})
</script>

<style lang="scss" scoped>
	.detail-container {
		min-height: 100vh;
		background-color: #f8f9fa;
	}

	.loading-container,
	.error-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 200rpx 0;

		.loading-text,
		.error-text {
			margin-top: 20rpx;
			font-size: 28rpx;
			color: #999;
		}

		.back-btn {
			margin-top: 40rpx;
			padding: 20rpx 60rpx;
			background-color: #399bfe;
			color: #fff;
			border-radius: 40rpx;
			font-size: 28rpx;
		}
	}

	.detail-content {
		padding-bottom: 40rpx;
	}

	.cover-image {
		width: 100%;
		height: 500rpx;
		display: block;
	}

	.info-section {
		background-color: #fff;
		padding: 30rpx;
		margin-bottom: 20rpx;

		.project-title {
			font-size: 36rpx;
			font-weight: 600;
			color: #333;
			margin-bottom: 20rpx;
		}

		.project-desc {
			font-size: 28rpx;
			color: #666;
			line-height: 1.6;
			margin-bottom: 20rpx;
		}

		.tags {
			display: flex;
			flex-wrap: wrap;
			gap: 16rpx;
			margin-bottom: 20rpx;

			.tag {
				padding: 10rpx 20rpx;
				background-color: rgba(57, 155, 254, 0.1);
				color: #399bfe;
				border-radius: 8rpx;
				font-size: 24rpx;
			}
		}

		.meta-info {
			display: flex;
			gap: 40rpx;
			font-size: 24rpx;
			color: #999;

			.meta-item {
				display: flex;
				align-items: center;
				gap: 8rpx;
			}
		}
	}

	.content-section,
	.images-section,
	.other-info-section,
	.contact-section {
		background-color: #fff;
		padding: 30rpx;
		margin-bottom: 20rpx;

		.section-title {
			font-size: 32rpx;
			font-weight: 600;
			color: #333;
			margin-bottom: 20rpx;
			padding-bottom: 20rpx;
			border-bottom: 1rpx solid #f0f0f0;
		}
	}

	.rich-content {
		font-size: 28rpx;
		line-height: 1.8;
		color: #666;
	}

	.image-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 16rpx;

		.grid-image {
			width: 100%;
			height: 200rpx;
			border-radius: 12rpx;
		}
	}

	.other-info-section {
		.info-item {
			display: flex;
			align-items: center;
			padding: 20rpx 0;
			font-size: 28rpx;
			border-bottom: 1rpx solid #f0f0f0;

			&:last-child {
				border-bottom: none;
			}

			.label {
				color: #999;
				min-width: 180rpx;
			}

			.value {
				color: #333;
				flex: 1;
			}
		}
	}

	.contact-section {
		.contact-item {
			display: flex;
			align-items: center;
			gap: 16rpx;
			padding: 24rpx 0;
			font-size: 28rpx;
			color: #333;
			border-bottom: 1rpx solid #f0f0f0;

			&:last-child {
				border-bottom: none;
			}

			&:active {
				background-color: #f5f5f5;
			}
		}
	}
</style>
