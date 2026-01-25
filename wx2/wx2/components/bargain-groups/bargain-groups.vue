<template>
	<view class="bargain-groups-container">
		<!-- 标题区域 -->
		<view class="groups-header">
			<view class="header-title">
				<image class="title-icon" src="/static/images/砍价2.png" mode="aspectFit"></image>
				<text class="title-text">砍价小组</text>
				<text class="winner-hint">最先砍价完者得</text>
			</view>
			<text class="groups-count">共{{ totalGroups }}个小组</text>
		</view>
		
		<!-- 获胜者提示 -->
		<view class="winner-banner" v-if="articleCompleted && winnerNickname">
			<uni-icons type="checkmarkempty" size="20" color="#52c41a"></uni-icons>
			<text class="winner-text">活动已结束！获胜者：{{ winnerNickname }}</text>
		</view>
		
		<!-- 小组列表 -->
		<view class="groups-list" v-if="groupsList && groupsList.length > 0">
			<view 
				class="group-card" 
				v-for="(group, index) in groupsList" 
				:key="group.initiator_id"
				@click="handleGroupClick(group)"
			>
				<!-- 小组头部：发起人信息 -->
				<view class="group-header">
					<image class="initiator-avatar" :src="group.initiator_avatar" mode="aspectFill"></image>
					<view class="initiator-info">
						<text class="initiator-name">{{ group.initiator_nickname }}</text>
						<text class="create-time">{{ formatTime(group.create_time) }}</text>
					</view>
					<view class="group-badge" :class="{ 
						'complete': group.is_complete, 
						'buyout': group.is_buyout,
						'rank-1': !group.is_complete && !group.is_buyout && index === 0, 
						'rank-2': !group.is_complete && !group.is_buyout && index === 1, 
						'rank-3': !group.is_complete && !group.is_buyout && index === 2 
					}">
						<text>{{ group.is_buyout ? '买断' : (group.is_complete ? '已完成' : index + 1) }}</text>
					</view>
				</view>
				
				<!-- 砍价进度 -->
				<view class="group-progress">
					<view class="progress-info">
						<view class="price-info">
							<text class="label">当前价格</text>
							<text class="current-price">¥{{ group.current_price.toFixed(2) }}</text>
						</view>
						<view class="bargain-info">
							<text class="label">已砍</text>
							<text class="bargained-amount">¥{{ group.total_bargained_amount.toFixed(2) }}</text>
						</view>
					</view>
					
					<!-- 进度条 -->
					<view class="progress-bar-wrapper">
						<view class="progress-bar">
							<view class="progress-fill" :style="{ width: group.progress + '%' }"></view>
						</view>
						<text class="progress-text">{{ group.progress }}%</text>
					</view>
				</view>
				
				<!-- 参与人数和头像 -->
				<view class="group-participants">
					<view class="participants-count">
						<uni-icons type="person-filled" size="16" color="#ff6b6b"></uni-icons>
						<text>{{ group.total_participants }}人参与</text>
					</view>
					
					<!-- 参与者头像列表 -->
					<view class="participants-avatars" v-if="group.participants && group.participants.length > 0">
						<view class="more-count" v-if="group.total_participants > 5">
							+{{ group.total_participants - 5 }}
						</view>
						<image 
							v-for="(user, idx) in group.participants.slice(0, 5)" 
							:key="user.user_id"
							:src="user.avatar" 
							class="avatar-item"
							mode="aspectFill"
						></image>
					</view>
				</view>
			</view>
		</view>
		
		<!-- 空状态 -->
		<view class="empty-state" v-else-if="!isLoading">
			<uni-icons type="info" size="60" color="#cccccc"></uni-icons>
			<text class="empty-text">还没有人发起砍价</text>
			<text class="empty-hint">快来成为第一个！</text>
		</view>
		
		<!-- 加载状态 -->
		<view class="loading-state" v-if="isLoading">
			<uni-load-more status="loading" :contentText="{ contentrefresh: '加载中...' }"></uni-load-more>
		</view>
	</view>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'

const props = defineProps({
	articleId: {
		type: String,
		required: true
	}
})

const emit = defineEmits(['group-click'])

const articleApi = uniCloud.importObject('articleWx', { customUI: true })

const groupsList = ref([])
const totalGroups = ref(0)
const initialPrice = ref(0)
const isLoading = ref(false)
const articleCompleted = ref(false) // 文章是否已经有人完成砍价
const winnerNickname = ref('') // 获胜者昵称

// 格式化时间
const formatTime = (timestamp) => {
	if (!timestamp) return ''
	
	const now = Date.now()
	const diff = now - timestamp
	const minute = 60 * 1000
	const hour = 60 * minute
	const day = 24 * hour
	
	if (diff < minute) {
		return '刚刚'
	} else if (diff < hour) {
		return Math.floor(diff / minute) + '分钟前'
	} else if (diff < day) {
		return Math.floor(diff / hour) + '小时前'
	} else if (diff < 7 * day) {
		return Math.floor(diff / day) + '天前'
	} else {
		const date = new Date(timestamp)
		return `${date.getMonth() + 1}-${date.getDate()}`
	}
}

// 获取砍价小组列表
const loadGroups = async () => {
	try {
		if (!props.articleId) {
			console.log('articleId 为空，无法加载小组列表')
			return
		}
		
		isLoading.value = true
		console.log('开始加载砍价小组列表...', props.articleId)
		
		const result = await articleApi.getBargainGroupsList(props.articleId)
		
		console.log('砍价小组列表结果:', result)
		
		if (result.errCode === 0) {
			let groups = result.data.groups || []
			
			// 按已砍金额排序，金额最多的排在前面
			groups.sort((a, b) => {
				// 首先按已砍金额降序排序
				const amountDiff = b.total_bargained_amount - a.total_bargained_amount
				if (amountDiff !== 0) {
					return amountDiff
				}
				// 如果已砍金额相同，按进度降序排序
				const progressDiff = b.progress - a.progress
				if (progressDiff !== 0) {
					return progressDiff
				}
				// 如果进度也相同，按创建时间降序排序（最新的在前）
				return b.create_time - a.create_time
			})
			
			groupsList.value = groups
			totalGroups.value = result.data.total_groups || 0
			initialPrice.value = result.data.initial_price || 0
			
			// 设置文章完成状态和获胜者信息
			articleCompleted.value = result.data.article_completed || false
			winnerNickname.value = result.data.winner_nickname || ''
			
			console.log('加载成功，已按砍价金额排序:', {
				groups: groupsList.value.length,
				total: totalGroups.value,
				topGroup: groupsList.value[0] ? {
					name: groupsList.value[0].initiator_nickname,
					amount: groupsList.value[0].total_bargained_amount
				} : null
			})
		} else {
			console.error('获取小组列表失败:', result.errMsg)
			uni.showToast({
				title: '加载失败',
				icon: 'none'
			})
		}
	} catch (err) {
		console.error('加载砍价小组列表失败:', err)
		uni.showToast({
			title: '加载失败',
			icon: 'none'
		})
	} finally {
		isLoading.value = false
	}
}

// 点击小组卡片
const handleGroupClick = (group) => {
	console.log('点击小组:', group)
	emit('group-click', group)
}

// 监听 articleId 变化
watch(() => props.articleId, (newVal) => {
	if (newVal) {
		loadGroups()
	}
}, { immediate: true })

// 暴露方法供外部调用
defineExpose({
	loadGroups
})

onMounted(() => {
	if (props.articleId) {
		loadGroups()
	}
})
</script>

<style lang="scss" scoped>
.bargain-groups-container {
	width: 100%;
	margin-top: 32rpx;
	padding: 40rpx 0 32rpx;
	background: #ffffff;
	position: relative;
}

.groups-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: 28rpx;
	padding: 0 24rpx;
	position: relative;
	z-index: 1;
	
	.header-title {
		display: flex;
		align-items: center;
		gap: 14rpx;
		padding: 10rpx 20rpx;
		background: #fff5f5;
		border-radius: 28rpx;
		border: 2rpx solid #ffe0e0;
		transition: all 0.3s ease;
		
		&:active {
			transform: scale(0.98);
		}
		
		.title-icon {
			width: 36rpx;
			height: 36rpx;
		}
		
		.title-text {
			font-size: 34rpx;
			font-weight: 700;
			color: #d94545;
			letter-spacing: 1rpx;
		}
		
		.winner-hint {
			font-size: 22rpx;
			font-weight: 500;
			color: #ff6b6b;
			margin-left: 4rpx;
			padding: 4rpx 12rpx;
			background: linear-gradient(135deg, rgba(255, 107, 107, 0.12), rgba(255, 107, 107, 0.08));
			border-radius: 16rpx;
			border: 1rpx solid rgba(255, 107, 107, 0.2);
			white-space: nowrap;
			animation: pulse 2s ease-in-out infinite;
		}
	}
	
	.groups-count {
		font-size: 24rpx;
		font-weight: 600;
		color: #ff6b6b;
		background: #fff5f5;
		padding: 6rpx 16rpx;
		border-radius: 20rpx;
		border: 1rpx solid #ffe0e0;
	}
}

// 获胜者横幅样式
.winner-banner {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 12rpx;
	margin: 0 24rpx 24rpx;
	padding: 20rpx 24rpx;
	background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
	border-radius: 16rpx;
	border: 2rpx solid #86efac;
	box-shadow: 0 4rpx 12rpx rgba(34, 197, 94, 0.1);
	animation: slideDown 0.5s ease-out;
	
	.winner-text {
		font-size: 28rpx;
		font-weight: 600;
		color: #16a34a;
		letter-spacing: 0.5rpx;
	}
}

@keyframes slideDown {
	from {
		opacity: 0;
		transform: translateY(-20rpx);
	}
	to {
		opacity: 1;
		transform: translateY(0);
	}
}

.groups-list {
	display: grid;
	grid-template-columns: repeat(2, 1fr);
	gap: 20rpx;
	padding: 0 24rpx;
}

.group-card {
	background: #ffffff;
	border-radius: 20rpx;
	padding: 20rpx;
	box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.06);
	border: 2rpx solid #f0f0f0;
	transition: all 0.3s ease;
	position: relative;
	overflow: hidden;
	
	&:active {
		transform: scale(0.98);
		box-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.08);
		border-color: #ff6b6b;
	}
}

.group-header {
	display: flex;
	align-items: center;
	margin-bottom: 16rpx;
	position: relative;
	z-index: 1;
	padding-bottom: 12rpx;
	border-bottom: 1rpx solid #f0f0f0;
	
	.initiator-avatar {
		width: 52rpx;
		height: 52rpx;
		border-radius: 50%;
		border: 2rpx solid #ff6b6b;
		box-shadow: 0 2rpx 6rpx rgba(0, 0, 0, 0.1);
	}
	
	.initiator-info {
		flex: 1;
		margin-left: 14rpx;
		display: flex;
		flex-direction: column;
		gap: 4rpx;
		min-width: 0;
		
		.initiator-name {
			font-size: 26rpx;
			font-weight: 700;
			color: #d94545;
			overflow: hidden;
			text-overflow: ellipsis;
			white-space: nowrap;
			letter-spacing: 0.5rpx;
		}
		
		.create-time {
			font-size: 22rpx;
			color: #ff9999;
			font-weight: 500;
		}
	}
	
	.group-badge {
		padding: 4rpx 12rpx;
		border-radius: 50%;
		background: #ff6b6b;
		font-size: 24rpx;
		color: #fff;
		font-weight: 800;
		flex-shrink: 0;
		transition: all 0.3s ease;
		min-width: 48rpx;
		height: 48rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		
		&.complete {
			background: #52c41a;
			border-radius: 24rpx;
			padding: 6rpx 14rpx;
			font-size: 22rpx;
			min-width: auto;
			height: auto;
		}
		
		// 买断徽章
		&.buyout {
			background: linear-gradient(135deg, #FFB800 0%, #FF8C00 100%);
			color: #fff;
			border-radius: 24rpx;
			padding: 6rpx 14rpx;
			font-size: 22rpx;
			min-width: auto;
			height: auto;
			box-shadow: 0 2rpx 8rpx rgba(255, 184, 0, 0.4);
		}
		
		// 第1名 - 金色
		&.rank-1 {
			background: linear-gradient(135deg, #ffd700 0%, #ffed4e 100%);
			color: #d97706;
			box-shadow: 0 2rpx 8rpx rgba(255, 215, 0, 0.4);
		}
		
		// 第2名 - 银色
		&.rank-2 {
			background: linear-gradient(135deg, #c0c0c0 0%, #e8e8e8 100%);
			color: #666;
			box-shadow: 0 2rpx 8rpx rgba(192, 192, 192, 0.4);
		}
		
		// 第3名 - 铜色
		&.rank-3 {
			background: linear-gradient(135deg, #cd7f32 0%, #e9a66c 100%);
			color: #fff;
			box-shadow: 0 2rpx 8rpx rgba(205, 127, 50, 0.4);
		}
	}
}

.group-progress {
	margin-bottom: 14rpx;
	position: relative;
	z-index: 1;
	padding: 12rpx;
	background: #fafafa;
	border-radius: 12rpx;
	border: 1rpx solid #f0f0f0;
	
	.progress-info {
		display: flex;
		justify-content: space-between;
		margin-bottom: 10rpx;
		
		.price-info, .bargain-info {
			display: flex;
			flex-direction: column;
			gap: 4rpx;
			padding: 4rpx 8rpx;
			border-radius: 8rpx;
			background: rgba(255, 255, 255, 0.5);
			
			.label {
				font-size: 20rpx;
				color: #ff9999;
				font-weight: 500;
			}
			
			.current-price {
				font-size: 28rpx;
				font-weight: 800;
				color: #d94545;
				letter-spacing: 0.5rpx;
			}
			
			.bargained-amount {
				font-size: 26rpx;
				font-weight: 700;
				color: #52c41a;
			}
		}
	}
	
	.progress-bar-wrapper {
		display: flex;
		align-items: center;
		gap: 10rpx;
		
		.progress-bar {
			flex: 1;
			height: 14rpx;
			background: #f0f0f0;
			border-radius: 7rpx;
			overflow: hidden;
			position: relative;
			
			.progress-fill {
				height: 100%;
				background: #ff6b6b;
				border-radius: 7rpx;
				transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
				position: relative;
				overflow: hidden;
				
				// 进度条动画光效
				&::before {
					content: '';
					position: absolute;
					top: 0;
					left: -100%;
					width: 100%;
					height: 100%;
					background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
					animation: shimmer 2s infinite;
				}
			}
		}
		
		.progress-text {
			font-size: 22rpx;
			font-weight: 700;
			color: #d94545;
			min-width: 60rpx;
			text-align: right;
		}
	}
}

@keyframes shimmer {
	0% {
		left: -100%;
	}
	100% {
		left: 200%;
	}
}

.group-participants {
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: 0;
	margin-top: 8rpx;
	padding-top: 12rpx;
	border-top: 1rpx solid #f0f0f0;
	position: relative;
	z-index: 1;
	
	.participants-count {
		display: flex;
		align-items: center;
		gap: 8rpx;
		font-size: 22rpx;
		font-weight: 600;
		color: #ff6b6b;
		background: #fff5f5;
		padding: 6rpx 12rpx;
		border-radius: 16rpx;
		border: 1rpx solid #ffe0e0;
	}
	
	.participants-avatars {
		display: flex;
		align-items: center;
		direction: rtl;
		gap: 0;
		
		.more-count {
			display: flex;
			align-items: center;
			justify-content: center;
			width: 40rpx;
			height: 40rpx;
			border-radius: 50%;
			background: #ff6b6b;
			color: #fff;
			font-size: 20rpx;
			font-weight: 800;
			border: 3rpx solid #fff;
			box-shadow: 0 2rpx 6rpx rgba(0, 0, 0, 0.1);
			margin-right: -14rpx;
			position: relative;
			z-index: 1;
		}
		
		.avatar-item {
			width: 40rpx;
			height: 40rpx;
			border-radius: 50%;
			border: 3rpx solid #fff;
			box-shadow: 0 2rpx 6rpx rgba(0, 0, 0, 0.1);
			margin-right: -14rpx;
			position: relative;
			transition: transform 0.3s ease;
			
			&:last-child {
				margin-right: 0;
			}
			
			&:hover {
				transform: scale(1.1);
				z-index: 2;
			}
		}
	}
}

.empty-state {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 80rpx 40rpx;
	
	.empty-text {
		margin-top: 24rpx;
		font-size: 28rpx;
		color: #ff9999;
	}
	
	.empty-hint {
		margin-top: 12rpx;
		font-size: 24rpx;
		color: #ffbbbb;
	}
}

.loading-state {
	padding: 40rpx 0;
}

// 脉冲动画
@keyframes pulse {
	0%, 100% {
		opacity: 1;
		transform: scale(1);
	}
	50% {
		opacity: 0.85;
		transform: scale(1.02);
	}
}
</style>
