<template>
	<view class="recommend-container">
		
		<!-- 推荐统计信息 -->
		<view class="stats-bar">
			<text class="stats-title">推荐</text>
			<text class="stats-count">共 {{ memoList.length }} 条推荐</text>
		</view>
		
		<!-- 推荐备忘录列表 -->
		<scroll-view class="memo-list" scroll-y>
			<view v-if="loading" class="loading-state">
				<text class="loading-text">加载中...</text>
			</view>
			
			<view v-else-if="memoList.length === 0" class="empty-state">
				<text class="empty-icon">📝</text>
				<text class="empty-text">暂无推荐备忘录</text>
			</view>
			
			<view v-else class="memo-items">
				<view 
					v-for="(memo, index) in memoList" 
					:key="memo._id"
					class="memo-card"
				>
					<!-- 左侧图片 -->
					<view class="memo-image-container">
						<image 
							v-if="memo.image_url" 
							:src="memo.image_url" 
							class="memo-image"
							mode="aspectFill"
						/>
						<view v-else class="memo-image-placeholder">
							<text class="placeholder-icon">📦</text>
						</view>
					</view>
					
					<!-- 右侧内容区 -->
					<view class="memo-right">
						<!-- 内容信息 -->
						<view class="memo-content">
							<text v-if="memo.title" class="memo-title">{{ memo.title }}</text>
							<text class="memo-desc">{{ memo.content }}</text>
							
							<view class="memo-footer">
								<text class="memo-time">{{ formatTime(memo.create_time) }}</text>
								<text class="memo-sort">排序: {{ memo.sort_order }}</text>
							</view>
						</view>
						
						<!-- 收藏按钮 -->
						<view class="collect-btn" :class="{ collected: collectedMap[memo._id] }" @click="toggleCollect(memo)">
							<text class="collect-text">
								{{ collectedMap[memo._id] ? '已收藏' : '收藏' }}
							</text>
						</view>
					</view>
				</view>
			</view>
		</scroll-view>
	</view>
</template>

<script>
import { useUserInfoStore } from '@/store/user.js'

export default {
	data() {
		return {
			memoList: [],
			collectedMap: {},
			loading: true,
			shareUserId: '',
			shareUserNickname: '',
			pendingCollectMemo: null, // 待收藏的备忘录
			statusBarHeight: 0, // 状态栏高度
			navBarHeight: 44 // 导航栏内容高度
		}
	},
	
	onLoad(options) {
		console.log('=== 推荐备忘录管理页面加载 ===')
		
		// 获取系统信息
		const systemInfo = uni.getSystemInfoSync()
		this.statusBarHeight = systemInfo.statusBarHeight || 0
		
		// 获取分享用户信息
		if (options && options.shareUserId) {
			this.shareUserId = options.shareUserId
			this.shareUserNickname = options.shareUserNickname || ''
		} else {
			// 尝试从本地存储获取
			try {
				const shareUserInfo = uni.getStorageSync('memo_share_user')
				if (shareUserInfo) {
					this.shareUserId = shareUserInfo.id || ''
					this.shareUserNickname = shareUserInfo.nickname || ''
				}
			} catch (e) {
				console.error('获取本地分享用户信息失败:', e)
			}
		}
		
		this.loadRecommendMemos()
	},
	
	onShow() {
		console.log('=== 页面显示 onShow ===')
		// 检查是否有待收藏的备忘录
		if (this.pendingCollectMemo) {
			console.log('检测到待收藏的备忘录，尝试自动收藏')
			const memo = this.pendingCollectMemo
			this.pendingCollectMemo = null
			// 延迟执行，确保用户信息已更新
			setTimeout(() => {
				this.toggleCollect(memo)
			}, 500)
		}
	},
	
	onPullDownRefresh() {
		this.loadRecommendMemos().then(() => {
			uni.stopPullDownRefresh()
		})
	},
	
	// 分享配置
	onShareAppMessage(options) {
		console.log('=== 触发分享 ===')
		const userStore = useUserInfoStore()
		const userId = userStore.userInfo.uid || ''
		const userNickname = userStore.userInfo.nickName || '用户'
		
		return {
			title: `${userNickname}分享了系统推荐备忘录`,
			path: `/subPages/recommendMemoList/recommendMemoList?shareUserId=${userId}&shareUserNickname=${encodeURIComponent(userNickname)}`,
			imageUrl: '' // 可选：自定义分享图片
		}
	},
	
	methods: {
		// 更多操作
		handleMore() {
			uni.showActionSheet({
				itemList: ['分享', '刷新'],
				success: (res) => {
					if (res.tapIndex === 0) {
						// 触发分享
						uni.showShareMenu()
					} else if (res.tapIndex === 1) {
						// 刷新页面
						this.loadRecommendMemos()
					}
				}
			})
		},
		
		// 关闭页面
		handleClose() {
			uni.navigateBack({
				delta: 1
			})
		},
		
		// 加载推荐备忘录列表
		async loadRecommendMemos() {
			console.log('=== 加载推荐备忘录列表 ===')
			this.loading = true
			
			try {
				const memoApi = uniCloud.importObject('memoList', { customUI: true })
				const res = await memoApi.getDefaultMemos()
				
				if (res && res.code === 0) {
					this.memoList = res.data || []
					console.log('加载推荐备忘录成功:', this.memoList.length, '条')
					
					// 加载收藏状态
					await this.loadCollectionStatus()
				} else {
					console.log('加载推荐备忘录失败:', res?.message)
					this.memoList = []
					uni.showToast({
						title: res?.message || '加载失败',
						icon: 'none'
					})
				}
			} catch (e) {
				console.error('加载推荐备忘录失败:', e)
				this.memoList = []
				uni.showToast({
					title: '加载失败，请重试',
					icon: 'none'
				})
			} finally {
				this.loading = false
			}
		},
		
		// 加载收藏状态
		async loadCollectionStatus() {
			console.log('=== 加载收藏状态 ===')
			try {
				const userStore = useUserInfoStore()
				const userId = userStore.userInfo.uid
				
				if (!userId) {
					console.log('用户未登录，跳过加载收藏状态')
					return
				}
				
				const memoApi = uniCloud.importObject('memoList', { customUI: true })
				
				// 检查每个备忘录的收藏状态
				for (const memo of this.memoList) {
					try {
						const res = await memoApi.checkCollected(memo._id, userId)
						if (res && res.code === 0) {
							this.collectedMap[memo._id] = res.data.collected
						}
					} catch (e) {
						console.error('检查收藏状态失败:', e)
					}
				}
				console.log('收藏状态加载完成:', this.collectedMap)
			} catch (e) {
				console.error('加载收藏状态失败:', e)
			}
		},
		
		// 切换收藏状态
		async toggleCollect(memo) {
			console.log('=== 切换收藏状态 ===', memo._id)
			
			// 获取用户登录状态
			const userStore = useUserInfoStore()
			const isLogin = userStore.userInfo.isLogin
			const userId = userStore.userInfo.uid
			
			// 检查登录状态
			if (!isLogin || !userId) {
				console.log('用户未登录，唤起登录')
				// 保存待收藏的备忘录
				this.pendingCollectMemo = memo
						
				uni.showModal({
					title: '提示',
					content: '收藏功能需要登录，是否前往登录？',
					success: (res) => {
						if (res.confirm) {
							// 获取当前页面路径
							const currentPath = '/subPages/recommendMemoList/recommendMemoList'
							uni.navigateTo({
								url: '/pages/login/login?redirect=' + encodeURIComponent(currentPath),
								fail: () => {
									uni.reLaunch({
										url: '/pages/login/login?redirect=' + encodeURIComponent(currentPath)
									})
								}
							})
						} else {
							// 用户取消，清除待收藏的备忘录
							this.pendingCollectMemo = null
						}
					}
				})
				return
			}
			
			try {
				const memoApi = uniCloud.importObject('memoList', { customUI: true })
				
				if (this.collectedMap[memo._id]) {
					// 取消收藏
					console.log('执行取消收藏操作...')
					const res = await memoApi.uncollectMemo(memo._id, userId)
					
					if (res && res.code === 0) {
						this.collectedMap[memo._id] = false
						this.$forceUpdate()
						uni.showToast({
							title: '已取消收藏',
							icon: 'success',
							duration: 1500
						})
					} else {
						uni.showToast({
							title: res?.message || '取消收藏失败',
							icon: 'none'
						})
					}
				} else {
					// 收藏
					console.log('执行收藏操作...')
					const res = await memoApi.collectMemo({
						memo_id: memo._id,
						user_id: userId,
						share_user_id: this.shareUserId,
						share_user_nickname: this.shareUserNickname
					})
					
					if (res && res.code === 0) {
						this.collectedMap[memo._id] = true
						this.$forceUpdate()
						uni.showToast({
							title: '收藏成功',
							icon: 'success',
							duration: 1500
						})
					} else {
						uni.showToast({
							title: res?.message || '收藏失败',
							icon: 'none'
						})
					}
				}
			} catch (e) {
				console.error('收藏操作失败:', e)
				const errorMsg = e.message || e.errMsg || '操作失败，请重试'
				uni.showToast({
					title: errorMsg,
					icon: 'none'
				})
			}
		},
		
		// 格式化时间
		formatTime(timestamp) {
			if (!timestamp) return ''
			const date = new Date(timestamp)
			const now = new Date()
			const diff = now - date
			
			if (diff < 60000) {
				return '刚刚'
			} else if (diff < 3600000) {
				return Math.floor(diff / 60000) + '分钟前'
			} else if (diff < 86400000) {
				return Math.floor(diff / 3600000) + '小时前'
			} else if (diff < 172800000) {
				return '昨天'
			} else {
				return `${date.getMonth() + 1}-${date.getDate()}`
			}
		}
	}
}
</script>

<style lang="scss" scoped>
.recommend-container {
	width: 100%;
	height: 100vh;
	background: #f5f5f5;
	display: flex;
	flex-direction: column;
}

/* 顶部导航栏（快手风格） */
.top-nav {
	background: linear-gradient(135deg, #4A9FF5 0%, #4A9FF5 100%);
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	z-index: 1000;
	box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
	
	.nav-content {
		height: 88rpx;
		padding: 0 24rpx;
		display: flex;
		align-items: center;
		justify-content: space-between;
	}
	
	.nav-left {
		display: flex;
		align-items: center;
		
		.nav-title {
			font-size: 34rpx;
			font-weight: 600;
			color: #fff;
		}
	}
	
	.nav-right {
		display: flex;
		align-items: center;
		gap: 12rpx;
		
		.nav-btn {
			min-width: 56rpx;
			height: 56rpx;
			border-radius: 28rpx;
			display: flex;
			align-items: center;
			justify-content: center;
			padding: 0 16rpx;
			transition: all 0.3s;
			
			&:active {
				opacity: 0.7;
				transform: scale(0.95);
			}
		}
		
		.feedback-btn {
			background: rgba(255, 255, 255, 0.25);
			border: 1rpx solid rgba(255, 255, 255, 0.3);
			
			.btn-text {
				font-size: 26rpx;
				color: #fff;
			}
		}
		
		.more-btn,
		.close-btn {
			background: transparent;
			
			.btn-icon {
				font-size: 32rpx;
				color: #fff;
				font-weight: bold;
			}
		}
	}
}

/* 推荐统计信息 */
.stats-bar {
	background: #fff;
	padding: 24rpx 32rpx;
	display: flex;
	align-items: center;
	justify-content: space-between;
	border-bottom: 1rpx solid #f0f0f0;
	margin-top: calc(88rpx + var(--status-bar-height, 0px));
	
	.stats-title {
		font-size: 32rpx;
		font-weight: 600;
		color: #333;
	}
	
	.stats-count {
		font-size: 24rpx;
		color: #999;
	}
}

/* 备忘录列表 */
.memo-list {
	flex: 1;
	padding: 0;
	background: #f5f5f5;
}

/* 加载状态 */
.loading-state {
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 120rpx 0;
	
	.loading-text {
		font-size: 28rpx;
		color: #999;
	}
}

/* 空状态 */
.empty-state {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 120rpx 0;
	
	.empty-icon {
		font-size: 120rpx;
		margin-bottom: 24rpx;
	}
	
	.empty-text {
		font-size: 28rpx;
		color: #999;
	}
}

/* 备忘录项 */
.memo-items {
	padding: 24rpx;
	padding-bottom: 40rpx;
}

.memo-card {
	background: #fff;
	border-radius: 16rpx;
	margin-bottom: 24rpx;
	box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
	display: flex;
	gap: 20rpx;
	padding: 24rpx;
	position: relative;
	overflow: hidden;
	
	// 左侧图片
	.memo-image-container {
		flex-shrink: 0;
		width: 200rpx;
		height: 200rpx;
		border-radius: 12rpx;
		overflow: hidden;
		background: #f5f5f5;
		
		.memo-image {
			width: 100%;
			height: 100%;
		}
		
		.memo-image-placeholder {
			width: 100%;
			height: 100%;
			background: linear-gradient(135deg, #FF6B6B 0%, #FFB347 100%);
			display: flex;
			align-items: center;
			justify-content: center;
			
			.placeholder-icon {
				font-size: 72rpx;
			}
		}
	}
	
	// 右侧区域
	.memo-right {
		flex: 1;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		min-width: 0;
		min-height: 200rpx;
		
		// 内容信息
		.memo-content {
			flex: 1;
			display: flex;
			flex-direction: column;
			gap: 8rpx;
			
			.memo-title {
				font-size: 32rpx;
				font-weight: 600;
				color: #333;
				overflow: hidden;
				text-overflow: ellipsis;
				white-space: nowrap;
				margin-bottom: 4rpx;
			}
			
			.memo-desc {
				font-size: 26rpx;
				color: #666;
				line-height: 1.5;
				display: -webkit-box;
				-webkit-box-orient: vertical;
				-webkit-line-clamp: 2;
				overflow: hidden;
				text-overflow: ellipsis;
			}
			
			.memo-footer {
				display: flex;
				align-items: center;
				gap: 16rpx;
				margin-top: 8rpx;
				
				.memo-time {
					font-size: 22rpx;
					color: #999;
				}
				
				.memo-sort {
					font-size: 22rpx;
					color: #999;
				}
			}
		}
		
		// 收藏按钮
		.collect-btn {
			align-self: flex-end;
			padding: 12rpx 28rpx;
			height: 56rpx;
			display: flex;
			align-items: center;
			justify-content: center;
			background: #f7f7f7;
			border-radius: 28rpx;
			transition: all 0.2s;
			border: 1rpx solid #e0e0e0;
			
			&.collected {
				background: #fff5f5;
				border-color: #ffcdd2;
			}
			
			&:active {
				transform: scale(0.95);
			}
			
			.collect-text {
				font-size: 26rpx;
				color: #666;
			}
			
			&.collected .collect-text {
				color: #ff5252;
				font-weight: 600;
			}
		}
	}
}
</style>
