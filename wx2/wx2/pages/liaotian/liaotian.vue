<template>
	<view class="container">
		<!-- 背景和头部 -->
		<view class="header-bg">
			<view class="header-content">
				<view class="title-line1">帮您找客户</view>
				<view class="title-line2">精选优质项目，助力业务增长</view>
			</view>
			<view class="close-btn" @click="goBack">
				<uni-icons type="closeempty" size="24" color="#fff"></uni-icons>
			</view>
		</view>

		<!-- 项目列表区域 -->
		<view class="project-list">
			<!-- 加载中 -->
			<view v-if="loading && projectList.length === 0" class="loading-container">
				<uni-icons type="spinner-cycle" size="40" color="#399bfe"></uni-icons>
				<text class="loading-text">加载中...</text>
			</view>

			<!-- 项目列表 -->
			<view v-else-if="projectList.length > 0" class="list-content">
				<view class="project-item" v-for="(item, index) in projectList" :key="item._id" @click="goToDetail(item._id)">
					<!-- 封面图 -->
					<image v-if="item.cover_image" class="cover-image" :src="item.cover_image" mode="aspectFill"></image>
					<view v-else class="cover-placeholder">
						<uni-icons type="image" size="60" color="#ccc"></uni-icons>
					</view>

					<!-- 项目信息 -->
					<view class="project-info">
						<view class="project-title">{{item.title}}</view>
						<view class="project-desc">{{item.description}}</view>
						
						<!-- 标签和浏览量 -->
						<view class="project-meta">
							<view class="tags" v-if="item.tags && item.tags.length > 0">
								<text class="tag" v-for="(tag, tagIdx) in item.tags.slice(0, 2)" :key="tagIdx">{{tag}}</text>
							</view>
							<view class="view-count">
								<uni-icons type="eye" size="14" color="#999"></uni-icons>
								<text>{{item.view_count || 0}}</text>
							</view>
						</view>
					</view>

					<!-- 箭头 -->
					<uni-icons type="arrowright" size="20" color="#ccc"></uni-icons>
				</view>

				<!-- 加载更多 -->
				<uni-load-more :status="loadMoreStatus" @clickLoadMore="loadMore"></uni-load-more>
			</view>

			<!-- 空状态 -->
			<view v-else class="empty-container">
				<uni-icons type="inbox" size="80" color="#ddd"></uni-icons>
				<text class="empty-text">暂无项目</text>
			</view>
		</view>

		<!-- 底部标识 -->
		<view class="footer-info">
			页面信息及服务由湖北客聚多企业管理有限公司提供
		</view>
	</view>
</template>

<script setup>
	import {
		ref,
		onMounted
	} from 'vue'

	// 项目列表数据
	const projectList = ref([])
	const loading = ref(false)
	const pageNum = ref(1)
	const pageSize = ref(10)
	const total = ref(0)
	const loadMoreStatus = ref('more')

	// 返回上一页
	const goBack = () => {
		uni.navigateBack()
	}

	// 跳转到详情页
	const goToDetail = (projectId) => {
		uni.navigateTo({
			url: `/pages/customerProjectDetail/customerProjectDetail?id=${projectId}`
		})
	}

	// 加载项目列表
	const loadProjectList = async (isLoadMore = false) => {
		try {
			if (!isLoadMore) {
				loading.value = true
			}

			const projectApi = uniCloud.importObject('customerProject')
			const result = await projectApi.getList({
				pageNum: pageNum.value,
				pageSize: pageSize.value,
				status: 1 // 只显示上架的项目
			})

			if (result && result.errCode === 0) {
				const list = result.data.list || []
				total.value = result.data.total || 0

				if (isLoadMore) {
					// 加载更多，追加数据
					projectList.value = [...projectList.value, ...list]
				} else {
					// 首次加载
					projectList.value = list
				}

				// 更新加载更多状态
				if (projectList.value.length >= total.value) {
					loadMoreStatus.value = 'noMore'
				} else {
					loadMoreStatus.value = 'more'
				}
			} else {
				console.error('加载项目列表失败:', result)
				uni.showToast({
					title: result?.errMsg || '加载失败',
					icon: 'none'
				})
				loadMoreStatus.value = 'noMore'
			}
		} catch (error) {
			console.error('加载项目列表异常:', error)
			uni.showToast({
				title: '加载失败',
				icon: 'none'
			})
			loadMoreStatus.value = 'noMore'
		} finally {
			loading.value = false
		}
	}

	// 加载更多
	const loadMore = () => {
		if (loadMoreStatus.value === 'more' && !loading.value) {
			loadMoreStatus.value = 'loading'
			pageNum.value++
			loadProjectList(true)
		}
	}

	onMounted(async () => {
		await loadProjectList()
	})
</script>

<style lang="scss" scoped>
	.container {
		display: flex;
		flex-direction: column;
		height: 100vh;
		background-color: #f8f9fa;
	}

	.header-bg {
		position: relative;
		height: 380rpx;
		background: linear-gradient(135deg, #399bfe 0%, #4facfe 100%);
		padding-top: 100rpx;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		color: #fff;
		overflow: hidden;

		&::after {
			content: '';
			position: absolute;
			width: 200%;
			height: 200%;
			top: -50%;
			left: -50%;
			background: radial-gradient(circle at center, rgba(255, 255, 255, 0.1) 0%, transparent 70%);
			animation: rotate 20s linear infinite;
		}

		.header-content {
			position: relative;
			z-index: 2;
			text-align: center;

			.title-line1 {
				font-size: 48rpx;
				font-weight: 600;
				margin-bottom: 16rpx;
				letter-spacing: 2rpx;
			}

			.title-line2 {
				font-size: 28rpx;
				opacity: 0.85;
				font-weight: 300;
			}
		}

		.close-btn {
			position: absolute;
			left: 30rpx;
			top: 60rpx;
			z-index: 10;
			width: 64rpx;
			height: 64rpx;
			display: flex;
			align-items: center;
			justify-content: center;
			background: rgba(255, 255, 255, 0.2);
			border-radius: 50%;
			backdrop-filter: blur(4px);
		}
	}

	.project-list {
		flex: 1;
		margin-top: -40rpx;
		background-color: #f8f9fa;
		border-radius: 40rpx 40rpx 0 0;
		padding: 30rpx 24rpx;
		box-sizing: border-box;
		position: relative;
		z-index: 5;
		overflow-y: auto;
	}

	.loading-container,
	.empty-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 100rpx 0;

		.loading-text,
		.empty-text {
			margin-top: 20rpx;
			font-size: 28rpx;
			color: #999;
		}
	}

	.list-content {
		padding-bottom: 40rpx;
	}

	.project-item {
		background-color: #fff;
		border-radius: 20rpx;
		margin-bottom: 24rpx;
		padding: 24rpx;
		display: flex;
		align-items: center;
		box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.04);
		transition: all 0.3s;

		&:active {
			transform: scale(0.98);
			box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.08);
		}

		.cover-image,
		.cover-placeholder {
			width: 160rpx;
			height: 160rpx;
			border-radius: 12rpx;
			flex-shrink: 0;
			margin-right: 20rpx;
		}

		.cover-placeholder {
			background-color: #f5f5f5;
			display: flex;
			align-items: center;
			justify-content: center;
		}

		.project-info {
			flex: 1;
			min-width: 0;
			margin-right: 20rpx;

			.project-title {
				font-size: 32rpx;
				font-weight: 600;
				color: #333;
				margin-bottom: 12rpx;
				overflow: hidden;
				text-overflow: ellipsis;
				white-space: nowrap;
			}

			.project-desc {
				font-size: 26rpx;
				color: #666;
				margin-bottom: 16rpx;
				overflow: hidden;
				text-overflow: ellipsis;
				display: -webkit-box;
				-webkit-line-clamp: 2;
				-webkit-box-orient: vertical;
				line-height: 1.5;
			}

			.project-meta {
				display: flex;
				align-items: center;
				justify-content: space-between;
				font-size: 24rpx;

				.tags {
					display: flex;
					gap: 12rpx;
					flex: 1;

					.tag {
						padding: 6rpx 16rpx;
						background-color: rgba(57, 155, 254, 0.1);
						color: #399bfe;
						border-radius: 8rpx;
						font-size: 22rpx;
					}
				}

				.view-count {
					display: flex;
					align-items: center;
					gap: 6rpx;
					color: #999;
					flex-shrink: 0;
				}
			}
		}
	}

	.footer-info {
		background-color: #fff;
		color: #adb5bd;
		font-size: 22rpx;
		text-align: center;
		padding: 30rpx 24rpx;
		padding-bottom: calc(30rpx + env(safe-area-inset-bottom));
		border-top: 1rpx solid #f1f3f5;
	}

	@keyframes rotate {
		from { transform: rotate(0deg); }
		to { transform: rotate(360deg); }
	}
</style>
