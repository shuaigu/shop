<template>
	<view class="recommend-container">
		<!-- 顶部操作栏 -->
		<view class="top-bar">
			<text class="page-title">推荐</text>
			<text class="memo-count">共 {{ memoList.length }} 条推荐</text>
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
							<text class="placeholder-icon">📝</text>
						</view>
					</view>
					
					<!-- 中间内容 -->
					<view class="memo-content">
						<text v-if="memo.title" class="memo-title">{{ memo.title }}</text>
						<text class="memo-text">{{ memo.content }}</text>
						
						<view class="memo-footer">
							<text class="memo-time">{{ formatTime(memo.create_time) }}</text>
							<text class="memo-sort">排序: {{ memo.sort_order }}</text>
						</view>
					</view>
					
					<!-- 收藏按钮（卡片右侧垂直居中） -->
					<view class="collect-btn" :class="{ collected: collectedMap[memo._id] }" @click="toggleCollect(memo)">
						<text class="collect-text">
							{{ collectedMap[memo._id] ? '已收藏' : '收藏' }}
						</text>
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
			pendingCollectMemo: null // 待收藏的备忘录
		}
	},
	
	onLoad(options) {
		console.log('=== 推荐备忘录管理页面加载 ===')
		
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

/* 顶部操作栏 */
.top-bar {
	background: #fff;
	padding: 32rpx 24rpx;
	box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
	display: flex;
	align-items: center;
	justify-content: space-between;
	
	.page-title {
		font-size: 36rpx;
		font-weight: bold;
		color: #333;
	}
	
	.memo-count {
		font-size: 26rpx;
		color: #999;
	}
}

/* 备忘录列表 */
.memo-list {
	flex: 1;
	padding: 24rpx;
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
	padding-bottom: 40rpx;
}

.memo-card {
	background: #fff;
	border-radius: 16rpx;
	padding: 24rpx;
	padding-right: 110rpx;
	margin-bottom: 24rpx;
	box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.06);
	display: flex;
	align-items: center;
	gap: 24rpx;
	position: relative;
	
	// 左侧图片
	.memo-image-container {
		flex-shrink: 0;
		width: 33.33%;
		height: 200rpx;
		border-radius: 12rpx;
		overflow: hidden;
		
		.memo-image {
			width: 100%;
			height: 100%;
		}
		
		.memo-image-placeholder {
			width: 100%;
			height: 100%;
			background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
			display: flex;
			align-items: center;
			justify-content: center;
			
			.placeholder-icon {
				font-size: 60rpx;
			}
		}
	}
	// 中间内容
	.memo-content {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 12rpx;
		min-width: 0;
		
		.memo-title {
			font-size: 30rpx;
			font-weight: bold;
			color: #333;
			overflow: hidden;
			text-overflow: ellipsis;
			white-space: nowrap;
		}
		
		.memo-text {
			font-size: 26rpx;
			color: #666;
			line-height: 1.6;
			display: -webkit-box;
			-webkit-box-orient: vertical;
			-webkit-line-clamp: 3;
			overflow: hidden;
			text-overflow: ellipsis;
		}
		
		.memo-footer {
			display: flex;
			align-items: center;
			gap: 24rpx;
			margin-top: 8rpx;
			
			.memo-time {
				font-size: 24rpx;
				color: #999;
			}
			
			.memo-sort {
				font-size: 24rpx;
				color: #999;
			}
		}
	}
	
	// 收藏按钮（卡片右侧垂直居中）
	.collect-btn {
		position: absolute;
		right: 24rpx;
		top: 50%;
		transform: translateY(-50%);
		padding: 10rpx 24rpx;
		height: 56rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		background: #f5f5f5;
		border-radius: 28rpx;
		transition: all 0.3s;
		box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.08);
		
		&.collected {
			background: #ffe5e6;
		}
		
		&:active {
			transform: translateY(-50%) scale(0.95);
		}
		
		.collect-text {
			font-size: 26rpx;
			color: #666;
			transition: all 0.3s;
		}
		
		&.collected .collect-text {
			color: #ff5a5f;
			font-weight: bold;
		}
	}
}
</style>
