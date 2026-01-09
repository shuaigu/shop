<script setup>
import { ref, onMounted } from 'vue'

const pageApi = uniCloud.importObject('customPageKs')

// 页面列表
const pageList = ref([])
const loading = ref(true)

// 获取可见的自定义页面列表
const getPageList = async () => {
	try {
		loading.value = true
		const res = await pageApi.get()
		
		if (res.data && Array.isArray(res.data)) {
			// 只显示可见的页面，按排序降序排列
			pageList.value = res.data
				.filter(item => item.is_visible !== false)
				.sort((a, b) => (b.sort || 0) - (a.sort || 0))
		} else {
			pageList.value = []
		}
	} catch (error) {
		console.error('获取页面列表失败:', error)
		uni.showToast({
			title: '加载失败',
			icon: 'none'
		})
		pageList.value = []
	} finally {
		loading.value = false
	}
}

// 跳转到页面详情
const goToPage = (id) => {
	uni.navigateTo({
		url: `/subPages/customPageDisplay/customPageDisplay?id=${id}`
	})
}

onMounted(() => {
	getPageList()
})
</script>

<template>
	<view class="page-list-container">
		<!-- 加载中 -->
		<view class="loading-state" v-if="loading">
			<uni-icons type="spinner-cycle" size="60" color="#399bfe"></uni-icons>
			<text>加载中...</text>
		</view>
		
		<!-- 页面列表 -->
		<view class="list-content" v-else-if="pageList.length > 0">
			<view 
				class="page-item" 
				v-for="item in pageList" 
				:key="item._id"
				@click="goToPage(item._id)"
			>
				<view class="item-icon">
					<uni-icons type="star-filled" size="24" color="#FFD700"></uni-icons>
				</view>
				<view class="item-content">
					<view class="item-title">{{ item.title }}</view>
					<view class="item-desc" v-if="item.content">
						{{ item.content.substring(0, 30) }}{{ item.content.length > 30 ? '...' : '' }}
					</view>
					<view class="item-meta">
						<text class="view-count">👁 {{ item.view_count || 0 }} 次浏览</text>
					</view>
				</view>
				<view class="item-arrow">
					<uni-icons type="arrow-right" size="20" color="#ccc"></uni-icons>
				</view>
			</view>
		</view>
		
		<!-- 空状态 -->
		<view class="empty-state" v-else>
			<uni-icons type="info-filled" size="80" color="#ccc"></uni-icons>
			<text class="empty-text">暂无服务</text>
			<text class="empty-tip">敬请期待更多精彩内容</text>
		</view>
	</view>
</template>

<style lang="scss" scoped>
@import "@/style/common.scss";

.page-list-container {
	min-height: 100vh;
	background-color: $pyq-pages-bg-color;
	padding: 24rpx;
	
	.loading-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding-top: 200rpx;
		gap: 20rpx;
		
		text {
			font-size: 28rpx;
			color: $pyq-text-color-helper;
		}
	}
	
	.list-content {
		.page-item {
			display: flex;
			align-items: center;
			background-color: #fff;
			border-radius: 24rpx;
			padding: 32rpx 24rpx;
			margin-bottom: 20rpx;
			box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.05);
			transition: all 0.3s;
			
			&:active {
				transform: scale(0.98);
				box-shadow: 0 1rpx 5rpx rgba(0, 0, 0, 0.1);
			}
			
			.item-icon {
				margin-right: 20rpx;
			}
			
			.item-content {
				flex: 1;
				
				.item-title {
					font-size: 32rpx;
					font-weight: 600;
					color: $pyq-text-color-body;
					margin-bottom: 8rpx;
				}
				
				.item-desc {
					font-size: 26rpx;
					color: $pyq-text-color-helper;
					line-height: 1.5;
					margin-bottom: 12rpx;
				}
				
				.item-meta {
					display: flex;
					align-items: center;
					gap: 16rpx;
					
					.view-count {
						font-size: 24rpx;
						color: $pyq-text-color-placeholder;
					}
				}
			}
			
			.item-arrow {
				margin-left: 16rpx;
			}
		}
	}
	
	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding-top: 200rpx;
		gap: 20rpx;
		
		.empty-text {
			font-size: 32rpx;
			color: $pyq-text-color-body-secondary;
			margin-top: 10rpx;
		}
		
		.empty-tip {
			font-size: 26rpx;
			color: $pyq-text-color-helper;
		}
	}
}
</style>
