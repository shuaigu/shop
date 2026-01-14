<template>
	<view class="collections-container">
		<!-- 空状态 -->
		<view v-if="!loading && collections.length === 0" class="empty-state">
			<text class="empty-icon">📌</text>
			<text class="empty-text">暂无添加记录</text>
			<text class="empty-hint">还没有用户添加备忘录~</text>
		</view>

		<!-- 添加列表 -->
		<scroll-view v-else class="collections-list" scroll-y @scrolltolower="loadMore">
			<view 
				v-for="item in collections" 
				:key="item._id"
				class="collection-item"
			>
				<view class="item-content">
					<!-- 左侧图片 -->
					<view class="item-image-container">
						<image 
							v-if="item.memo_info && item.memo_info.image_url" 
							:src="item.memo_info.image_url" 
							class="item-image"
							mode="aspectFill"
						/>
						<view v-else class="item-image-placeholder">
							<text class="placeholder-icon">📝</text>
						</view>
					</view>
					
					<!-- 右侧内容 -->
					<view class="item-info">
						<!-- 添加者信息 -->
						<view class="collector-info">
							<image 
								v-if="item.user_info && item.user_info.avatarUrl" 
								:src="item.user_info.avatarUrl" 
								class="collector-avatar"
								mode="aspectFill"
							/>
							<text class="collector-name">
								{{ item.user_info ? item.user_info.nickName : '未知用户' }}
							</text>
							<text class="collector-label">添加了</text>
						</view>
						
						<!-- 标题 -->
						<text v-if="item.memo_info && item.memo_info.title" class="item-title">
							{{ item.memo_info.title }}
						</text>
						
						<!-- 内容 -->
						<text v-if="item.memo_info" class="item-content-text">
							{{ item.memo_info.content }}
						</text>
						<text v-else class="item-content-text unavailable">
							备忘录内容已不可用
						</text>
						
						<!-- 底部信息：分享关系链 -->
						<view class="item-footer">
							<!-- 分享关系链 -->
							<view class="share-chain">
								<view v-if="item.share_user_nickname" class="share-info">
									<text class="share-icon">🔗</text>
									<text class="share-text">来自 @{{ item.share_user_nickname }}</text>
								</view>
								<view v-else class="share-info">
									<text class="share-icon">📝</text>
									<text class="share-text">直接添加</text>
								</view>
							</view>
							
							<!-- 添加时间 -->
							<text class="collection-time">
								{{ formatTime(item.collection_time) }}
							</text>
						</view>
					</view>
				</view>
				
				<!-- 操作按钮 -->
				<view class="item-actions">
					<view class="action-btn cancel-btn" @click="cancelCollection(item)">
						<text>取消添加</text>
					</view>
				</view>
			</view>
			
			<!-- 加载状态 -->
			<view v-if="loading" class="loading-state">
				<text>加载中...</text>
			</view>
			
			<!-- 没有更多 -->
			<view v-if="!loading && noMore && collections.length > 0" class="no-more">
				<text>没有更多了</text>
			</view>
		</scroll-view>
	</view>
</template>

<script>
import { useUserInfoStore } from '@/store/user.js'

export default {
	data() {
		return {
			collections: [],
			loading: false,
			noMore: false
		}
	},
	
	onLoad() {
		this.loadCollections()
	},
	
	// 下拉刷新
	onPullDownRefresh() {
		this.collections = []
		this.noMore = false
		this.loadCollections().then(() => {
			uni.stopPullDownRefresh()
		})
	},
	
	methods: {
		// 加载添加列表
		async loadCollections() {
			console.log('=== 管理员加载所有添加列表 ===');
			
			// 获取用户角色
			const userStore = useUserInfoStore()
			const isAdmin = userStore.userInfo.role && userStore.userInfo.role[0] === 'admin'
			
			if (!isAdmin) {
				console.log('非管理员用户')
				uni.showToast({
					title: '无权限访问',
					icon: 'none',
					duration: 2000
				})
				// 跳转到首页
				setTimeout(() => {
					uni.switchTab({
						url: '/pages/memo/memo'
					})
				}, 2000)
				return
			}
			
			this.loading = true
			
			try {
				const memoApi = uniCloud.importObject('memoList', { customUI: true })
				const res = await memoApi.getAllCollections()
				
				console.log('所有添加列表结果:', res);
				
				if (res && res.code === 0) {
					this.collections = res.data || []
					this.noMore = true
					console.log('加载成功，共', this.collections.length, '条添加记录');
				} else {
					uni.showToast({
						title: res?.message || '获取添加列表失败',
						icon: 'none'
					})
				}
			} catch (e) {
				console.error('加载添加列表失败:', e);
				uni.showToast({
					title: '加载失败，请重试',
					icon: 'none'
				})
			} finally {
				this.loading = false
			}
		},
		
		// 取消添加
		async cancelCollection(item) {
			console.log('=== 管理员取消添加 ===', item);
			
			// 二次确认
			const confirmRes = await new Promise((resolve) => {
				uni.showModal({
					title: '提示',
					content: `确定要删除用户“${item.user_info?.nickName || '未知用户'}”的添加吗？`,
					success: (res) => resolve(res.confirm)
				})
			})
			
			if (!confirmRes) return
			
			try {
				const memoApi = uniCloud.importObject('memoList', { customUI: true })
				const res = await memoApi.uncollectMemo(item.memo_id, item.user_id)
				
				if (res && res.code === 0) {
					// 从列表中移除
					const index = this.collections.findIndex(c => c._id === item._id)
					if (index !== -1) {
						this.collections.splice(index, 1)
					}
					
					uni.showToast({
						title: '已删除添加记录',
						icon: 'success',
						duration: 1500
					})
				} else {
					uni.showToast({
						title: res?.message || '删除失败',
						icon: 'none'
					})
				}
			} catch (e) {
				console.error('删除添加失败:', e);
				uni.showToast({
					title: '操作失败，请重试',
					icon: 'none'
				})
			}
		},
		
		// 加载更多（预留）
		loadMore() {
			if (this.loading || this.noMore) return
			// 后续可以实现分页加载
		},
		
		// 跳转到备忘录页面
		goToMemo() {
			uni.switchTab({
				url: '/pages/memo/memo'
			})
		},
		
		// 格式化时间
		formatTime(timestamp) {
			if (!timestamp) return ''
			
			const date = new Date(timestamp)
			const now = new Date()
			const diff = now - date
			
			// 1分钟内
			if (diff < 60000) {
				return '刚刚'
			}
			// 1小时内
			if (diff < 3600000) {
				return Math.floor(diff / 60000) + '分钟前'
			}
			// 24小时内
			if (diff < 86400000) {
				return Math.floor(diff / 3600000) + '小时前'
			}
			// 昨天
			if (diff < 172800000) {
				return '昨天 ' + date.getHours() + ':' + String(date.getMinutes()).padStart(2, '0')
			}
			// 更早
			return `${date.getMonth() + 1}-${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`
		}
	}
}
</script>

<style lang="scss" scoped>
.collections-container {
	width: 100%;
	min-height: 100vh;
	background: #f5f5f5;
}

/* 空状态 */
.empty-state {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 200rpx 60rpx;
	
	.empty-icon {
		font-size: 120rpx;
		margin-bottom: 32rpx;
	}
	
	.empty-text {
		font-size: 32rpx;
		color: #333;
		margin-bottom: 16rpx;
		font-weight: 500;
	}
	
	.empty-hint {
		font-size: 26rpx;
		color: #999;
		margin-bottom: 48rpx;
	}
	
	.empty-btn {
		padding: 20rpx 60rpx;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		border-radius: 50rpx;
		
		text {
			font-size: 28rpx;
			color: #fff;
		}
	}
}

/* 添加列表 */
.collections-list {
	height: 100vh;
	padding: 24rpx;
	box-sizing: border-box;
}

.collection-item {
	background: #fff;
	border-radius: 16rpx;
	margin-bottom: 24rpx;
	overflow: hidden;
	box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.06);
	
	.item-content {
		display: flex;
		padding: 24rpx;
		gap: 24rpx;
		
		.item-image-container {
			flex-shrink: 0;
			width: 160rpx;
			height: 160rpx;
			border-radius: 12rpx;
			overflow: hidden;
			
			.item-image {
				width: 100%;
				height: 100%;
			}
			
			.item-image-placeholder {
				width: 100%;
				height: 100%;
				background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
				display: flex;
				align-items: center;
				justify-content: center;
				
				.placeholder-icon {
					font-size: 80rpx;
				}
			}
		}
		
		.item-info {
			flex: 1;
			display: flex;
			flex-direction: column;
			min-width: 0;
						
			.collector-info {
				display: flex;
				align-items: center;
				gap: 12rpx;
				margin-bottom: 12rpx;
				padding: 8rpx 16rpx;
				background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 50%);
				border-radius: 8rpx;
							
				.collector-avatar {
					width: 40rpx;
					height: 40rpx;
					border-radius: 50%;
					border: 2rpx solid #fff;
				}
							
				.collector-name {
					font-size: 26rpx;
					color: #1976d2;
					font-weight: 600;
				}
							
				.collector-label {
					font-size: 24rpx;
					color: #666;
				}
			}
						
			.item-title {
				font-size: 32rpx;
				font-weight: bold;
				color: #333;
				margin-bottom: 12rpx;
				overflow: hidden;
				text-overflow: ellipsis;
				white-space: nowrap;
			}
			
			.item-content-text {
				font-size: 28rpx;
				color: #666;
				line-height: 1.6;
				margin-bottom: 16rpx;
				display: -webkit-box;
				-webkit-box-orient: vertical;
				-webkit-line-clamp: 2;
				overflow: hidden;
				text-overflow: ellipsis;
				flex: 1;
				
				&.unavailable {
					color: #999;
					font-style: italic;
				}
			}
			
			.item-footer {
				display: flex;
				align-items: center;
				justify-content: space-between;
				gap: 16rpx;
				
				.share-chain {
					flex: 1;
					min-width: 0;
				}
									
				.share-info {
					display: flex;
					align-items: center;
					gap: 8rpx;
					flex: 1;
					min-width: 0;
					
										
					.share-icon {
						font-size: 24rpx;
					}
										
					.share-text {
						font-size: 24rpx;
						color: #ff6b6b;
						font-weight: 500;
						overflow: hidden;
						text-overflow: ellipsis;
						white-space: nowrap;
					}
				}
				
				.collection-time {
					font-size: 24rpx;
					color: #999;
					flex-shrink: 0;
				}
			}
		}
	}
	
	.item-actions {
		padding: 0 24rpx 24rpx;
		display: flex;
		justify-content: flex-end;
		
		.action-btn {
			padding: 12rpx 32rpx;
			border-radius: 8rpx;
			font-size: 26rpx;
			
			&.cancel-btn {
				background: #fff;
				color: #ff5a5f;
				border: 1rpx solid #ff5a5f;
				
				&:active {
					background: #fff5f5;
				}
			}
		}
	}
}

/* 加载状态 */
.loading-state {
	text-align: center;
	padding: 40rpx 0;
	font-size: 28rpx;
	color: #999;
}

/* 没有更多 */
.no-more {
	text-align: center;
	padding: 40rpx 0;
	font-size: 26rpx;
	color: #ccc;
}
</style>
