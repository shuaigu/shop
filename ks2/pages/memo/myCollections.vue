<template>
	<view class="collections-container">
		<!-- 角色提示条 -->
		<view v-if="userRole" class="role-tip" :class="{ 'admin-role': userRole === 'admin', 'sharer-role': userRole === 'sharer' }">
			<text class="role-icon">{{ userRole === 'admin' ? '👑' : '🔗' }}</text>
			<text class="role-text">
				{{ userRole === 'admin' ? '管理员模式：查看所有用户的收藏信息' : '分享者模式：查看通过你分享进入的用户收藏信息' }}
			</text>
		</view>
		
		<!-- 空状态 -->
		<view v-if="!loading && collections.length === 0" class="empty-state">
			<text class="empty-icon">📌</text>
			<text class="empty-text">暂无添加记录</text>
			<text class="empty-hint">{{ userRole === 'admin' ? '还没有用户添加备忘录~' : '还没有用户通过你的分享添加备忘录~' }}</text>
		</view>

		<!-- 按用户分类展示 -->
		<scroll-view 
			v-else
			class="collections-list" 
			scroll-y
		>
			<!-- 一级：遍历每个日期分组 -->
			<view 
				v-for="(dateGroup, dateKey) in groupedCollections" 
				:key="dateKey"
				class="date-group"
			>
				<!-- 日期分组头部 -->
				<view class="date-group-header">
					<text class="date-icon">📅</text>
					<text class="date-label">{{ dateGroup.dateInfo.label }}</text>
				</view>
				
				<!-- 二级：该日期下的所有分享者分组 -->
				<view 
					v-for="(shareGroup, shareUserId) in dateGroup.shareGroups" 
					:key="shareUserId"
					class="user-group"
				>
				<!-- 分享者分组头部 -->
				<view class="user-group-header">
					<view class="user-info-section">
						<view class="share-icon-wrapper">
							<text class="share-icon">🔗</text>
						</view>
						<view class="user-text-info">
							<text class="user-name">{{ shareGroup.userInfo.nickName }}</text>
							<text class="collection-count">分享了 {{ Object.keys(shareGroup.collectors).length }} 位用户的添加</text>
						</view>
					</view>
				</view>
				
				<!-- 二级：该分享者下的所有添加者 -->
				<view class="user-collection-items">
					<view 
						v-for="(collectorGroup, collectorId) in shareGroup.collectors" 
						:key="collectorId"
						class="collector-group"
					>
						<!-- 添加者头部 -->
						<view class="collector-header">
							<image 
								v-if="collectorGroup.collectorInfo.avatarUrl" 
								:src="collectorGroup.collectorInfo.avatarUrl" 
								class="collector-avatar"
								mode="aspectFill"
							/>
							<view class="collector-info">
								<view class="collector-name-row">
									<text class="collector-name">{{ collectorGroup.collectorInfo.nickName }}</text>
								</view>
								<!-- 添加数量和手机号在同一行 -->
								<view class="collector-count-row">
									<text class="collector-count">添加了 {{ collectorGroup.items.length }} 条</text>
									<!-- 手机号显示和拨打功能 -->
									<text 
										v-if="collectorGroup.collectorInfo.phone" 
										class="collector-phone-inline"
										@click.stop="makePhoneCall(collectorGroup.collectorInfo.phone)"
									>
										{{ collectorGroup.collectorInfo.phone }}
									</text>
								</view>
							</view>
						</view>
						
						<!-- 三级：该添加者的具体条目 -->
						<view 
							v-for="item in collectorGroup.items" 
							:key="item._id"
							class="collection-item-card"
						>
							<view class="card-content">
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
								
								<!-- 底部信息行 -->
								<view class="item-footer-with-action">
									<!-- 左侧：添加时间 -->
									<text class="collection-time">
										{{ formatTime(item.collection_time) }}
									</text>
																			
									<!-- 右侧：操作按钮 -->
									<view class="action-btn cancel-btn" @click="cancelCollection(item)">
										<text>取消添加</text>
										</view>
									</view>
								</view>
							</view>
						</view>
					</view>
					</view>
				</view>
			</view>
			
			<!-- 加载状态 -->
			<view v-if="loading" class="loading-state">
				<text>加载中...</text>
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
			noMore: false,
			userRole: '' // 'admin' 或 'sharer'
		}
	},
	
	computed: {
		// 按日期+用户分组的数据（三级结构：日期 → 用户 → 条目）
		groupedCollections() {
			const grouped = {}
			const today = new Date()
			today.setHours(0, 0, 0, 0)
			
			this.collections.forEach(item => {
				// 获取日期分类键
				const dateKey = this.getDateCategory(item.collection_time)
				
				// 一级分组：按日期
				if (!grouped[dateKey]) {
					grouped[dateKey] = {
						dateInfo: {
							label: this.getDateLabel(item.collection_time),
							timestamp: item.collection_time,
							sortKey: dateKey
						},
						shareGroups: {} // 二级分组：分享者（保持原有结构）
					}
				}
				
				// 二级分组：按分享者（或添加者）
				const shareUserId = item.share_user_id || 'direct_add'
				const shareUserNickname = item.share_user_nickname || '直接添加'
				
				if (!grouped[dateKey].shareGroups[shareUserId]) {
					grouped[dateKey].shareGroups[shareUserId] = {
						userInfo: {
							nickName: shareUserNickname,
							avatarUrl: ''
						},
						collectors: {} // 三级分组：添加者
					}
				}
				
				// 三级分组：按添加者分组
				const collectorId = item.user_id || 'unknown'
				const collectorNickname = item.user_info?.nickName || '未知用户'
				const collectorAvatar = item.user_info?.avatarUrl || ''
				const collectorPhone = item.user_info?.mobile || ''
				
				if (!grouped[dateKey].shareGroups[shareUserId].collectors[collectorId]) {
					grouped[dateKey].shareGroups[shareUserId].collectors[collectorId] = {
						collectorInfo: {
							nickName: collectorNickname,
							avatarUrl: collectorAvatar,
							phone: collectorPhone
						},
						items: []
					}
				}
				
				grouped[dateKey].shareGroups[shareUserId].collectors[collectorId].items.push(item)
			})
			
			// 转换为数组并排序（今天 > 昨天 > 更早的日期）
			return Object.entries(grouped)
				.sort((a, b) => {
					const order = { 'today': 0, 'yesterday': 1 }
					const orderA = order[a[0]] !== undefined ? order[a[0]] : 2
					const orderB = order[b[0]] !== undefined ? order[b[0]] : 2
					
					if (orderA !== orderB) return orderA - orderB
					// 对于更早的日期，按时间戳降序排序
					if (orderA === 2) {
						return b[1].dateInfo.timestamp - a[1].dateInfo.timestamp
					}
					return 0
				})
				.reduce((acc, [key, value]) => {
					acc[key] = value
					return acc
				}, {})
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
	
	// 页面显示时保持标签状态
	onShow() {
		// 标签状态会自动保持
	},
	
	methods: {
		// 加载添加列表
		async loadCollections() {
			console.log('=== 加载添加列表 ===');
			
			// 获取用户角色
			const userStore = useUserInfoStore()
			const isAdmin = userStore.userInfo.role && userStore.userInfo.role[0] === 'admin'
			const userId = userStore.userInfo.uid
			
			// 设置用户角色
			this.userRole = isAdmin ? 'admin' : 'sharer'
			
			if (!userId) {
				console.log('用户未登录')
				uni.showToast({
					title: '请先登录',
					icon: 'none',
					duration: 2000
				})
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
				let res
				
				if (isAdmin) {
					// 管理员：获取所有用户的收藏记录
					console.log('管理员模式：获取所有收藏记录');
					res = await memoApi.getAllCollections()
				} else {
					// 分享者：仅获取通过其分享进入的用户的收藏记录
					console.log('分享者模式：获取我分享的用户的收藏记录');
					res = await memoApi.getSharerCollections(userId)
				}
				
				console.log('添加列表结果:', res);
				
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
			console.log('=== 取消添加 ===', item);
			
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
		},
		
		// 拨打电话
		makePhoneCall(phoneNumber) {
			if (!phoneNumber) {
				uni.showToast({
					title: '手机号不可用',
					icon: 'none'
				})
				return
			}
			
			uni.makePhoneCall({
				phoneNumber: phoneNumber,
				fail: (err) => {
					console.error('拨打电话失败:', err)
					uni.showToast({
						title: '拨打失败',
						icon: 'none'
					})
				}
			})
		},
		
		// 获取日期分类键
		getDateCategory(timestamp) {
			if (!timestamp) return 'unknown'
			
			const date = new Date(timestamp)
			const today = new Date()
			today.setHours(0, 0, 0, 0)
			
			const itemDate = new Date(date)
			itemDate.setHours(0, 0, 0, 0)
			
			const diffDays = Math.floor((today - itemDate) / (24 * 60 * 60 * 1000))
			
			if (diffDays === 0) return 'today'
			if (diffDays === 1) return 'yesterday'
			
			// 更早的日期，使用完整日期作为键
			return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
		},
		
		// 获取日期显示标签
		getDateLabel(timestamp) {
			if (!timestamp) return '未知日期'
			
			const date = new Date(timestamp)
			const today = new Date()
			today.setHours(0, 0, 0, 0)
			
			const itemDate = new Date(date)
			itemDate.setHours(0, 0, 0, 0)
			
			const diffDays = Math.floor((today - itemDate) / (24 * 60 * 60 * 1000))
			
			if (diffDays === 0) return '今天'
			if (diffDays === 1) return '昨天'
			
			// 更早的日期
			const year = date.getFullYear()
			const month = date.getMonth() + 1
			const day = date.getDate()
			const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']
			const weekday = weekdays[date.getDay()]
			
			return `${month}月${day}日 ${weekday}`
		}
	}
}
</script>

<style lang="scss" scoped>
.collections-container {
	width: 100%;
	min-height: 100vh;
	background: #f5f5f5;
	display: flex;
	flex-direction: column;
}

/* 角色提示条样式 */
.role-tip {
	padding: 24rpx 32rpx;
	margin: 24rpx;
	border-radius: 16rpx;
	display: flex;
	align-items: center;
	gap: 16rpx;
	box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.08);
	transition: all 0.3s ease;
	
	&.admin-role {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	}
	
	&.sharer-role {
		background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
	}
	
	.role-icon {
		font-size: 40rpx;
		filter: drop-shadow(0 2rpx 4rpx rgba(0, 0, 0, 0.2));
	}
	
	.role-text {
		flex: 1;
		font-size: 28rpx;
		color: #fff;
		font-weight: 600;
		line-height: 1.5;
		text-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.15);
	}
}

/* 日期分组样式 */
.date-group {
	margin-bottom: 40rpx;
	
	.date-group-header {
		display: flex;
		align-items: center;
		gap: 12rpx;
		padding: 16rpx 32rpx;
		margin: 0 24rpx 16rpx;
		background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
		border-radius: 12rpx;
		box-shadow: 0 4rpx 16rpx rgba(240, 147, 251, 0.3);
		
		.date-icon {
			font-size: 32rpx;
			filter: drop-shadow(0 2rpx 4rpx rgba(0, 0, 0, 0.2));
		}
		
		.date-label {
			font-size: 32rpx;
			color: #fff;
			font-weight: 700;
			text-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.15);
		}
	}
}

/* 用户分组样式 */
.user-group {
	margin-bottom: 32rpx;
	
	.user-group-header {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		padding: 32rpx 24rpx;
		margin: 0 24rpx;
		margin-top: 24rpx;
		border-radius: 16rpx 16rpx 0 0;
		box-shadow: 0 4rpx 16rpx rgba(102, 126, 234, 0.3);
		
		.user-info-section {
			display: flex;
			align-items: center;
			gap: 20rpx;
			
			.share-icon-wrapper {
				width: 80rpx;
				height: 80rpx;
				border-radius: 50%;
				background: rgba(255, 255, 255, 0.25);
				display: flex;
				align-items: center;
				justify-content: center;
				box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.15);
				
				.share-icon {
					font-size: 48rpx;
				}
			}
			
			.user-avatar {
				width: 80rpx;
				height: 80rpx;
				border-radius: 50%;
				border: 4rpx solid rgba(255, 255, 255, 0.5);
				box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.15);
			}
			
			.user-text-info {
				flex: 1;
				display: flex;
				flex-direction: column;
				gap: 8rpx;
				
				.user-name {
					font-size: 36rpx;
					color: #fff;
					font-weight: 700;
					text-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.1);
				}
				
				.collection-count {
					font-size: 26rpx;
					color: rgba(255, 255, 255, 0.9);
					font-weight: 500;
				}
			}
		}
	}
	
	.user-collection-items {
		padding: 0 24rpx;
		background: #fff;
		margin: 0 24rpx;
		border-radius: 0 0 16rpx 16rpx;
		box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.06);
		overflow: hidden;
	}
}

/* 添加者分组样式 */
.collector-group {
	margin-bottom: 24rpx;
	
	&:last-child {
		margin-bottom: 0;
	}
	
	.collector-header {
		display: flex;
		align-items: center;
		gap: 16rpx;
		padding: 16rpx 0;
		background: linear-gradient(to right, #f5f7fa 0%, #ffffff 100%);
		border-radius: 8rpx;
		margin-bottom: 12rpx;
		
		.collector-avatar {
			width: 48rpx;
			height: 48rpx;
			border-radius: 50%;
			border: 2rpx solid #e0e0e0;
			flex-shrink: 0;
		}
		
		.collector-info {
			flex: 1;
			display: flex;
			flex-direction: column;
			gap: 4rpx;
			
			.collector-name-row {
				display: flex;
				align-items: center;
				gap: 8rpx;
			}
			
			.collector-name {
				font-size: 28rpx;
				color: #1976d2;
				font-weight: 600;
			}
			
			.collector-count {
				font-size: 22rpx;
				color: #666;
				flex-shrink: 0;
			}
			
			/* 添加数量和手机号同一行 */
			.collector-count-row {
				display: flex;
				align-items: center;
				gap: 12rpx;
				flex-wrap: wrap;
			}
			
			/* 内联手机号样式 */
			.collector-phone-inline {
				font-size: 22rpx;
				color: #1976d2;
				font-weight: 600;
				cursor: pointer;
				flex-shrink: 0;
				
				&:active {
					opacity: 0.6;
				}
			}
		}
	}
}

/* 分组内的卡片样式 */
.collection-item-card {
	padding: 16rpx 0;
	border-bottom: 1rpx solid #f0f0f0;
	
	&:last-child {
		border-bottom: none;
	}
	
	.card-content {
		display: flex;
		gap: 16rpx;
		
		.item-image-container {
			flex-shrink: 0;
			width: 100rpx;
			height: 100rpx;
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
					font-size: 50rpx;
				}
			}
		}
		
		.item-info {
			flex: 1;
			display: flex;
			flex-direction: column;
			min-width: 0;
			
			.item-title {
				font-size: 28rpx;
				font-weight: bold;
				color: #333;
				margin-bottom: 4rpx;
				overflow: hidden;
				text-overflow: ellipsis;
				white-space: nowrap;
				line-height: 1.3;
			}
			
			.item-content-text {
				font-size: 24rpx;
				color: #666;
				line-height: 1.4;
				margin-bottom: 6rpx;
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
			
			// 底部信息行（简化版）
			.item-footer-with-action {
				display: flex;
				align-items: center;
				justify-content: space-between;
				gap: 12rpx;
				margin-top: 4rpx;
				
				.collection-time {
					font-size: 20rpx;
					color: #999;
					flex-shrink: 0;
					white-space: nowrap;
				}
				
				.action-btn {
					padding: 8rpx 24rpx;
					border-radius: 8rpx;
					font-size: 22rpx;
					flex-shrink: 0;
					
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
	}
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
	flex: 1;
	height: 100vh;
	padding: 24rpx;
	box-sizing: border-box;
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
