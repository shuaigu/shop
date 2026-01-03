<template>
	<view class="bargain-groups-container">
		<!-- 标题区域 -->
		<view class="groups-header">
			<view class="header-title">
				<image class="title-icon" src="/static/images/砍价2.png" mode="aspectFit"></image>
				<text class="title-text">砍价小组</text>
				<text class="winner-hint">最先砍价完的小组得</text>
			</view>
			<text class="groups-count">共{{ totalGroups }}个小组</text>
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
					<view class="group-badge" :class="{ 'complete': group.is_complete }">
						<text>{{ group.is_complete ? '已完成' : '进行中' }}</text>
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
						<uni-icons type="person-filled" size="16" color="#1890ff"></uni-icons>
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
			groupsList.value = result.data.groups || []
			totalGroups.value = result.data.total_groups || 0
			initialPrice.value = result.data.initial_price || 0
			
			console.log('加载成功:', {
				groups: groupsList.value.length,
				total: totalGroups.value
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
	background: linear-gradient(180deg, #f0f8ff 0%, #fafcff 50%, #ffffff 100%);
	position: relative;
	
	// 顶部分隔线
	&::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 20rpx;
		background: linear-gradient(180deg, rgba(24, 144, 255, 0.12) 0%, rgba(24, 144, 255, 0.06) 50%, transparent 100%);
		border-bottom: 1rpx solid rgba(24, 144, 255, 0.08);
	}
	
	// 顶部装饰线
	&::after {
		content: '';
		position: absolute;
		top: 20rpx;
		left: 50%;
		transform: translateX(-50%);
		width: 160rpx;
		height: 8rpx;
		background: linear-gradient(90deg, transparent 0%, rgba(24, 144, 255, 0.3) 30%, #1890ff 50%, rgba(24, 144, 255, 0.3) 70%, transparent 100%);
		border-radius: 4rpx;
		box-shadow: 0 2rpx 8rpx rgba(24, 144, 255, 0.2);
	}
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
		padding: 14rpx 24rpx;
		background: linear-gradient(135deg, rgba(24, 144, 255, 0.12) 0%, rgba(24, 144, 255, 0.06) 100%);
		border-radius: 28rpx;
		border: 2rpx solid rgba(24, 144, 255, 0.25);
		box-shadow: 0 4rpx 12rpx rgba(24, 144, 255, 0.08);
		transition: all 0.3s ease;
		
		&:active {
			transform: scale(0.98);
			box-shadow: 0 2rpx 8rpx rgba(24, 144, 255, 0.12);
		}
		
		.title-icon {
			width: 36rpx;
			height: 36rpx;
			filter: drop-shadow(0 2rpx 4rpx rgba(24, 144, 255, 0.3));
		}
		
		.title-text {
			font-size: 34rpx;
			font-weight: 700;
			color: #0066cc;
			letter-spacing: 1rpx;
			text-shadow: 0 1rpx 2rpx rgba(24, 144, 255, 0.1);
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
		color: #1890ff;
		background: linear-gradient(135deg, rgba(24, 144, 255, 0.1), rgba(24, 144, 255, 0.15));
		padding: 6rpx 16rpx;
		border-radius: 20rpx;
		border: 1rpx solid rgba(24, 144, 255, 0.2);
		box-shadow: 0 2rpx 6rpx rgba(24, 144, 255, 0.08);
	}
}

.groups-list {
	display: grid;
	grid-template-columns: repeat(2, 1fr);
	gap: 20rpx;
	padding: 0 24rpx;
}

.group-card {
	background: linear-gradient(135deg, #e8f4ff 0%, #f5faff 50%, #ffffff 100%);
	border-radius: 20rpx;
	padding: 20rpx;
	box-shadow: 0 6rpx 20rpx rgba(24, 144, 255, 0.1), 0 2rpx 8rpx rgba(24, 144, 255, 0.06);
	border: 2rpx solid rgba(186, 231, 255, 0.8);
	transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
	position: relative;
	overflow: hidden;
	
	// 渐变光晕背景
	&::before {
		content: '';
		position: absolute;
		top: -60%;
		right: -60%;
		width: 120%;
		height: 120%;
		background: radial-gradient(circle at center, rgba(24, 144, 255, 0.06) 0%, rgba(24, 144, 255, 0.02) 40%, transparent 70%);
		pointer-events: none;
		opacity: 0.8;
	}
	
	// 顶部装饰条
	&::after {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 4rpx;
		background: linear-gradient(90deg, transparent 0%, #1890ff 50%, transparent 100%);
		opacity: 0.6;
	}
	
	&:active {
		transform: translateY(2rpx) scale(0.98);
		box-shadow: 0 3rpx 12rpx rgba(24, 144, 255, 0.15), 0 1rpx 4rpx rgba(24, 144, 255, 0.1);
		border-color: #1890ff;
	}
}

.group-header {
	display: flex;
	align-items: center;
	margin-bottom: 16rpx;
	position: relative;
	z-index: 1;
	padding-bottom: 12rpx;
	border-bottom: 1rpx solid rgba(24, 144, 255, 0.08);
	
	.initiator-avatar {
		width: 52rpx;
		height: 52rpx;
		border-radius: 50%;
		border: 3rpx solid #1890ff;
		box-shadow: 0 3rpx 10rpx rgba(24, 144, 255, 0.25), inset 0 1rpx 3rpx rgba(255, 255, 255, 0.5);
		position: relative;
		
		&::after {
			content: '';
			position: absolute;
			top: -3rpx;
			left: -3rpx;
			right: -3rpx;
			bottom: -3rpx;
			border-radius: 50%;
			background: linear-gradient(135deg, rgba(24, 144, 255, 0.3), transparent);
			z-index: -1;
			filter: blur(2rpx);
		}
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
			color: #0050b3;
			overflow: hidden;
			text-overflow: ellipsis;
			white-space: nowrap;
			letter-spacing: 0.5rpx;
		}
		
		.create-time {
			font-size: 22rpx;
			color: #69b1ff;
			font-weight: 500;
		}
	}
	
	.group-badge {
		padding: 6rpx 14rpx;
		border-radius: 24rpx;
		background: linear-gradient(135deg, #40a9ff 0%, #1890ff 50%, #096dd9 100%);
		font-size: 22rpx;
		color: #fff;
		font-weight: 700;
		flex-shrink: 0;
		box-shadow: 0 3rpx 8rpx rgba(24, 144, 255, 0.35), inset 0 1rpx 2rpx rgba(255, 255, 255, 0.3);
		text-shadow: 0 1rpx 2rpx rgba(0, 0, 0, 0.2);
		transition: all 0.3s ease;
		
		&.complete {
			background: linear-gradient(135deg, #73d13d 0%, #52c41a 50%, #389e0d 100%);
			box-shadow: 0 3rpx 8rpx rgba(82, 196, 26, 0.35), inset 0 1rpx 2rpx rgba(255, 255, 255, 0.3);
		}
	}
}

.group-progress {
	margin-bottom: 14rpx;
	position: relative;
	z-index: 1;
	padding: 12rpx;
	background: rgba(24, 144, 255, 0.03);
	border-radius: 12rpx;
	border: 1rpx solid rgba(24, 144, 255, 0.08);
	
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
				color: #69b1ff;
				font-weight: 500;
			}
			
			.current-price {
				font-size: 28rpx;
				font-weight: 800;
				color: #0050b3;
				text-shadow: 0 1rpx 2rpx rgba(24, 144, 255, 0.1);
				letter-spacing: 0.5rpx;
			}
			
			.bargained-amount {
				font-size: 26rpx;
				font-weight: 700;
				color: #52c41a;
				text-shadow: 0 1rpx 2rpx rgba(82, 196, 26, 0.1);
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
			background: linear-gradient(180deg, #e6f4ff 0%, #d6ebff 100%);
			border-radius: 7rpx;
			overflow: hidden;
			box-shadow: inset 0 2rpx 4rpx rgba(24, 144, 255, 0.1), 0 1rpx 2rpx rgba(0, 0, 0, 0.05);
			border: 1rpx solid rgba(24, 144, 255, 0.2);
			position: relative;
			
			// 进度条光泽效果
			&::after {
				content: '';
				position: absolute;
				top: 0;
				left: 0;
				right: 0;
				height: 50%;
				background: linear-gradient(180deg, rgba(255, 255, 255, 0.4) 0%, transparent 100%);
				pointer-events: none;
			}
			
			.progress-fill {
				height: 100%;
				background: linear-gradient(90deg, #40a9ff 0%, #1890ff 50%, #096dd9 100%);
				border-radius: 7rpx;
				transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
				box-shadow: 0 0 12rpx rgba(24, 144, 255, 0.5), inset 0 1rpx 2rpx rgba(255, 255, 255, 0.3);
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
			color: #0050b3;
			min-width: 60rpx;
			text-align: right;
			text-shadow: 0 1rpx 2rpx rgba(24, 144, 255, 0.1);
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
	border-top: 1rpx solid rgba(24, 144, 255, 0.08);
	position: relative;
	z-index: 1;
	
	.participants-count {
		display: flex;
		align-items: center;
		gap: 8rpx;
		font-size: 22rpx;
		font-weight: 600;
		color: #1890ff;
		background: linear-gradient(135deg, rgba(24, 144, 255, 0.1), rgba(24, 144, 255, 0.06));
		padding: 6rpx 12rpx;
		border-radius: 16rpx;
		border: 1rpx solid rgba(24, 144, 255, 0.15);
		box-shadow: 0 2rpx 6rpx rgba(24, 144, 255, 0.08);
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
			background: linear-gradient(135deg, #40a9ff 0%, #1890ff 50%, #096dd9 100%);
			color: #fff;
			font-size: 20rpx;
			font-weight: 800;
			border: 3rpx solid #fff;
			box-shadow: 0 3rpx 10rpx rgba(24, 144, 255, 0.3), inset 0 1rpx 2rpx rgba(255, 255, 255, 0.3);
			margin-right: -14rpx;
			position: relative;
			z-index: 1;
		}
		
		.avatar-item {
			width: 40rpx;
			height: 40rpx;
			border-radius: 50%;
			border: 3rpx solid #fff;
			box-shadow: 0 3rpx 10rpx rgba(24, 144, 255, 0.2), inset 0 1rpx 3rpx rgba(0, 0, 0, 0.1);
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
		color: #69b1ff;
	}
	
	.empty-hint {
		margin-top: 12rpx;
		font-size: 24rpx;
		color: #91d5ff;
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
