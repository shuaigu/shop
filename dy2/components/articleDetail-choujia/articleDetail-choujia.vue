<template>
	<view class="lottery-container">
		<view class="lottery-header">
			<text class="lottery-title">评论区抽大奖</text>
			<view class="lottery-subtitle">
				<text>评论区共 {{commenterCount}} 人参与</text>
			</view>
		</view>
		
		<!-- 九宫格抽奖 -->
		<view class="lottery-grid">
			<view 
				v-for="(prize, index) in prizes" 
				:key="index"
				:class="['prize-cell', {'active': currentIndex === index}]"
				:style="{'animation-delay': isRotating ? `${index * 0.1}s` : '0s'}"
			>
				<view class="prize-content">
					<image 
						class="prize-avatar" 
						:src="prize.avatar" 
						mode="aspectFill"
					></image>
					<text class="prize-name">{{ prize.name }}</text>
				</view>
			</view>
		</view>
		
		<!-- 立即领取按钮 -->
		<view class="lottery-btn" @click="startLottery">
			<text>{{isRotating ? '抽奖中...' : '开始抽奖'}} ></text>
		</view>
		
		<!-- 中奖弹窗 -->
		<view v-if="showResult" class="result-popup">
			<view class="result-content">
				<view class="result-header">抽奖结果</view>
				
				<!-- 显示幸运用户 -->
				<view v-if="luckyUsers.length > 0" class="lucky-users">
					<view class="lucky-users-title">幸运用户:</view>
					<view class="prize-time">{{ currentTime }}</view>
					<view v-for="(user, index) in luckyUsers" :key="index" class="lucky-user-item">
						<image class="lucky-user-avatar" :src="user.avatarUrl" mode="aspectFill"></image>
						<view class="lucky-user-info">
							<view class="name-time-container">
								<text class="lucky-user-name">{{user.nickName}}</text>
								<text class="time" v-if="user.create_time">{{formatTime(user.create_time)}}</text>
							</view>
							<view class="comment-text">
								<view class="content-wrapper">
									<text class="content">评论说：{{user.content}}</text>
								</view>
							</view>
						</view>
					</view>
				</view>
				
				<button class="result-btn" @click="closeResult">确定</button>
				
			</view>
		</view>
	</view>
</template>

<script setup>
import { ref, reactive, onMounted, computed, watch } from 'vue';

// 定义props接收评论者列表
const props = defineProps({
	commenters: {
		type: Array,
		default: () => []
	}
});

// 定义事件
const emit = defineEmits(['lottery-result']);

// 抽奖奖品列表 - 将由云对象提供
const prizes = reactive([]);

// 顺序数组，定义灯光走向 - 将由云对象提供
const sequence = ref([]);

// 当前高亮索引
const currentIndex = ref(-1);

// 抽奖结果
const result = ref('');

// 显示结果弹窗
const showResult = ref(false);

// 抽奖状态
const isRotating = ref(false);

// 获取幸运用户
const luckyUsers = ref([]);

// 计算评论者数量 - 显示实际参与抽奖的人数（最多25人）
const commenterCount = computed(() => Math.min(props.commenters.length, 25));

// 添加当前时间
const currentTime = ref('');

// 监听评论者列表变化
watch(() => props.commenters, (newVal) => {
	if (newVal && newVal.length > 0) {
		// 当评论者列表变化时，清空抽奖结果
		result.value = '';
		showResult.value = false;
		luckyUsers.value = [];
	}
}, { deep: true });

let timer = null;
let times = 0;

// 速度控制 - 定义初始、最快和最终速度
const INITIAL_SPEED = 200; // 开始时较慢
const MAX_SPEED = 50;     // 中间最快速度
const FINAL_SPEED = 300;  // 结束时很慢
let currentSpeed = INITIAL_SPEED;

// 初始化：设置用户展示数据
onMounted(async () => {
	try {
		// 按时间排序评论，确保最新的评论在前
		const sortedCommenters = [...props.commenters].sort((a, b) => {
			// 如果有创建时间，按时间倒序排列（新的在前）
			if (a.create_time && b.create_time) {
				return b.create_time - a.create_time;
			}
			// 没有时间的情况下保持原顺序
			return 0;
		});
		
		// 只使用最新的25个评论者
		const availableCommenters = sortedCommenters.slice(0, 25);
		
		// 构建展示列表
		const prizeList = availableCommenters.map((commenter) => ({
			avatar: commenter.avatarUrl || '/static/images/default-avatar.png',
			name: (commenter.nickName || '匿名用户').slice(0, 5)
		}));
		
		// 更新响应式数据
		Object.assign(prizes, prizeList);
		
		// 设置抽奖动画顺序
		sequence.value = Array.from({length: prizeList.length}, (_, i) => i);
	} catch (error) {
		console.error('初始化用户展示失败:', error);
		uni.showToast({
			title: '初始化失败，请重试',
			icon: 'none'
		});
	}
	
	return () => {
		if (timer) {
			clearTimeout(timer);
			timer = null;
		}
	};
});

// 开始抽奖
const startLottery = async () => {
	// 检查是否正在抽奖中
	if (isRotating.value) {
		return;
	}
	
	// 检查是否有评论者参与
	if (props.commenters.length === 0) {
		uni.showToast({
			title: '暂无评论者参与',
			icon: 'none'
		});
		return;
	}
	
	// 设置抽奖状态
	isRotating.value = true;
	
	// 清空上次抽奖结果
	result.value = '';
	luckyUsers.value = [];
	
	try {
		// 限制最多25个参与者
		const participantCount = Math.min(props.commenters.length, 25);
		
		// 调用云函数执行抽奖
		const choujiangWx = uniCloud.importObject('choujiangWx');
		const lotteryResult = await choujiangWx.doLottery({
			userId: uni.getStorageSync('userId') || '', // 记录抽奖操作者
			commentCount: participantCount
		});
		
		if (!lotteryResult.success) {
			throw new Error('抽奖失败');
		}
		
		// 获取抽奖结果
		const { selectedIndex, targetPosition } = lotteryResult;
		
		// 重置抽奖动画参数
		currentSpeed = INITIAL_SPEED;
		times = 0;
		
		// 设置动画总圈数
		const totalRounds = 4; // 转4圈
		const targetTimes = totalRounds * sequence.value.length + targetPosition + 1;
		
		// 开始抽奖动画
		runLottery(targetPosition, targetTimes, lotteryResult.prize);
		
	} catch (error) {
		console.error('抽奖执行失败:', error);
		uni.showToast({
			title: '抽奖失败，请重试',
			icon: 'none'
		});
		isRotating.value = false;
	}
};

// 运行抽奖动画 - 实现先慢后快再慢的效果
const runLottery = (targetPosition, targetTimes, finalPrize) => {
	timer = setTimeout(() => {
		// 计算当前应该高亮的格子序号
		let index = times % sequence.value.length;
		currentIndex.value = index; // 直接使用索引，不需要通过sequence映射
		
		times++;
		
		// 动态调整速度
		const accelerationPhase = Math.floor(targetTimes * 0.3);
		const decelerationPhase = Math.floor(targetTimes * 0.7);
		
		if (times < accelerationPhase) {
			currentSpeed = INITIAL_SPEED - Math.floor((INITIAL_SPEED - MAX_SPEED) * (times / accelerationPhase));
		} else if (times > decelerationPhase) {
			const slowDownProgress = (times - decelerationPhase) / (targetTimes - decelerationPhase);
			currentSpeed = MAX_SPEED + Math.floor((FINAL_SPEED - MAX_SPEED) * slowDownProgress);
		} else {
			currentSpeed = MAX_SPEED;
		}
		
		// 判断是否需要停止
		if (times >= targetTimes) {
			clearTimeout(timer);
			isRotating.value = false;
			result.value = finalPrize.name;
			currentIndex.value = targetPosition; // 确保最终位置准确
			
			// 设置当前时间
			const now = new Date();
			const year = now.getFullYear();
			const month = (now.getMonth() + 1).toString().padStart(2, '0');
			const day = now.getDate().toString().padStart(2, '0');
			const hours = now.getHours().toString().padStart(2, '0');
			const minutes = now.getMinutes().toString().padStart(2, '0');
			currentTime.value = `${year}年${month}月${day}日 ${hours}:${minutes}`;
			
			setTimeout(() => {
				// 选择中奖用户时使用实际位置
				selectLuckyUsers(result.value, targetPosition);
				showResult.value = true;
				emit('lottery-result', result.value);
			}, 2000);
		} else {
			runLottery(targetPosition, targetTimes, finalPrize);
		}
	}, currentSpeed);
};

// 选择幸运用户
const selectLuckyUsers = (prizeResult, targetPosition) => {
	if (!props.commenters || props.commenters.length === 0) {
		return;
	}
	
	// 按时间排序评论，确保最新的评论在前
	const sortedCommenters = [...props.commenters].sort((a, b) => {
		// 如果有创建时间，按时间倒序排列（新的在前）
		if (a.create_time && b.create_time) {
			return b.create_time - a.create_time;
		}
		// 没有时间的情况下保持原顺序
		return 0;
	});
	
	// 限制为最新25个评论用户
	const limitedCommenters = sortedCommenters.slice(0, 25);
	
	// 直接使用目标位置的用户
	const selectedUser = limitedCommenters[targetPosition];
	if (selectedUser) {
		luckyUsers.value = [selectedUser];
	}
	
	// 展示中奖提示
	if (!prizeResult.includes('谢谢参与')) {
		uni.showToast({
			title: '恭喜你抽中奖品！',
			icon: 'success',
			duration: 2000
		});
	}
};

// 关闭结果弹窗
const closeResult = () => {
	showResult.value = false;
};

// 格式化时间
const formatTime = (timestamp) => {
	if (!timestamp) return '';
	
	const now = Date.now();
	const diff = now - timestamp;
	
	// 小于1分钟
	if (diff < 60000) {
		return '刚刚';
	}
	// 小于1小时
	if (diff < 3600000) {
		return Math.floor(diff / 60000) + '分钟前';
	}
	// 小于24小时
	if (diff < 86400000) {
		return Math.floor(diff / 3600000) + '小时前';
	}
	// 小于30天
	if (diff < 2592000000) {
		return Math.floor(diff / 86400000) + '天前';
	}
	// 其他情况显示具体日期
	const date = new Date(timestamp);
	const month = date.getMonth() + 1;
	const day = date.getDate();
	return `${month}月${day}日`;
};
</script>

<style lang="scss">
.lottery-container {
	display: flex;
	flex-direction: column;
	align-items: center;
	padding: 40rpx 30rpx;
	background-color: #FF5500; // 更强烈的橙红色背景
	position: relative;
	border-radius: 20rpx;
	min-height: auto; // 改为auto使其自适应内容高度
	height: auto; // 确保高度能够自适应
	overflow: hidden; // 防止内容溢出
	transition: height 0.3s ease; // 添加高度变化的过渡效果
}

.lottery-header {
	width: 100%;
	text-align: center;
	margin-bottom: 40rpx;
	display: contents;
	
}

.lottery-title {
	font-size: 56rpx;
	font-weight: bold;
	color: #FFFFFF;
	text-shadow: 0 2rpx 6rpx rgba(0, 0, 0, 0.2);
	margin-bottom: 10rpx;
}

.lottery-subtitle {
	background-color: #FFFFFF;
	border-radius: 30rpx;
	padding: 10rpx 30rpx;
	display: inline-block;
	margin-top: 10rpx;
	margin-bottom: 20rpx;
	text {
		font-size: 28rpx;
		color: #FF5500;
		font-weight: 500;
	}
}



// 添加响应式布局支持
@media screen and (max-width: 375px) {
	.lottery-grid {
		grid-template-columns: repeat(4, 1fr); // 小屏幕设备每行4个
	}
}

@media screen and (min-width: 768px) {
	.lottery-grid {
		max-width: 650rpx; // 在大屏幕上限制最大宽度
		margin: 0 auto;
	}
}

.lottery-grid {
	width: 100%;
	background-color: #FFFFFF;
	border-radius: 20rpx;
	display: grid;
	grid-template-columns: repeat(5, 1fr); // 每行5个头像，最多支持5*5=25个用户
	gap: 15rpx;
	padding: 20rpx;
	position: relative;
	box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);
	max-height: 700rpx; // 设置最大高度
	overflow-y: auto; // 超出部分可滚动
}

.prize-cell {
	background-color: #FFFFFF;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	position: relative;
	overflow: hidden;
	transition: all 0.15s ease;
	padding: 5rpx;
	border-radius: 8rpx;
	
	&.active {
		transform: scale(1.1);
		z-index: 5;
		background-color: #FFD700; // 添加黄色背景
		box-shadow: 0 0 10rpx rgba(255, 215, 0, 0.5);
		
		.prize-avatar {
			border: 2rpx solid #FF5500;
			transform: scale(1.1);
		}
		
		.prize-name {
			color: #FF5500;
			font-weight: bold;
		}
	}
}

.prize-content {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	width: 100%;
}

.prize-avatar {
	width: 80rpx;
	height: 80rpx;
	border-radius: 50%;
	margin-bottom: 8rpx;
	background-color: #f5f5f5;
}

.prize-name {
	font-size: 20rpx;
	color: #333333;
	text-align: center;
	width: 90rpx;
	line-height: 1.2;
	transform: scale(0.9);
	transform-origin: center top;
	margin: 0 auto;
	
	&.active {
		transform: scale(0.9);
		color: #FF5500;
		font-weight: bold;
	}
}

.lottery-btn {
	margin-top: 60rpx;
	background-color: #FFD700; // 更亮的按钮
	color: #FF3300;
	padding: 20rpx 60rpx;
	border-radius: 40rpx;
	font-size: 32rpx;
	font-weight: bold;
	box-shadow: 0 6rpx 20rpx rgba(255, 215, 0, 0.5);
	
	&:active {
		transform: scale(0.98);
	}
}

.result-popup {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background-color: rgba(0, 0, 0, 0.6);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 100;
}

.result-content {
	width: 580rpx;
	background-color: #FFFFFF;
	border-radius: 20rpx;
	padding: 40rpx 30rpx;
	text-align: center;
	box-shadow: 0 10rpx 30rpx rgba(0, 0, 0, 0.2);
}

.result-header {
	font-size: 40rpx;
	font-weight: bold;
	margin-bottom: 30rpx;
	color: #FF3300;
	text-shadow: 0 1rpx 2rpx rgba(255, 51, 0, 0.2);
}

.result-prize {
	font-size: 48rpx;
	color: #FF3300;
	font-weight: bold;
	margin-bottom: 30rpx;
	background-color: #FFFAF0;
	padding: 20rpx;
	border-radius: 15rpx;
	box-shadow: 0 2rpx 6rpx rgba(255, 51, 0, 0.15);
	
	.prize-text {
		font-size: 48rpx;
		margin-bottom: 10rpx;
	}
	
	.prize-time {
		font-size: 24rpx;
		color: #999;
		margin-top: 10rpx;
	}
}

.result-empty {
	color: #999999;
}

/* 幸运用户列表样式 */
.lucky-users {
	margin-bottom: 30rpx;
	padding: 20rpx;
	background-color: #FFF4E8;
	border-radius: 15rpx;
	border: 2rpx dashed #FF5500;
	
	.prize-time {
		font-size: 24rpx;
		color: #999;
		margin: 10rpx 0 20rpx;
		text-align: center;
	}
}

.lucky-users-title {
	font-size: 32rpx;
	color: #FF3300;
	margin-bottom: 20rpx;
	font-weight: bold;
	text-align: center;
}

.lucky-user-item {
	display: flex;
	align-items: flex-start;
	padding: 15rpx;
	margin-bottom: 15rpx;
	background-color: #FFFFFF;
	border-radius: 12rpx;
	box-shadow: 0 4rpx 8rpx rgba(255, 85, 0, 0.1);
	text-align: left;
}

.lucky-user-avatar {
	width: 80rpx;
	height: 80rpx;
	border-radius: 50%;
	margin-right: 15rpx;
	background-color: #EEEEEE;
	flex-shrink: 0;
	border: 2rpx solid #FFD700;
}

.lucky-user-info {
	flex: 1;
	display: flex;
	flex-direction: column;
	overflow: hidden;
	justify-content: center;
}

.name-time-container {
	display: flex;
	align-items: center;
	margin-bottom: 8rpx;
}

.lucky-user-name {
	font-size: 30rpx;
	color: #333333;
}

.time {
	font-size: 22rpx;
	color: #999;
	margin-left: 10rpx;
	vertical-align: baseline;
}

.comment-text {
	font-size: 28rpx;
	color: #666666;
}

.content-wrapper {
	line-height: 1.5;
	display: block;
	
	.content {
		font-size: 28rpx;
		color: #666666;
	}
}

.content-time-wrapper {
	margin-top: 4rpx;
	line-height: 1.5;
	display: block;
	
	.content {
		font-size: 28rpx;
		color: #666666;
	}
}

.lucky-user-comment {
	font-size: 26rpx;
	color: #666666;
	line-height: 1.4;
	word-break: break-all;
	display: -webkit-box;
	-webkit-line-clamp: 2;
	-webkit-box-orient: vertical;
	overflow: hidden;
	text-overflow: ellipsis;
}

.result-btn {
	background-color: #FF3300; // 更鲜艳的按钮
	color: #FFFFFF;
	padding: 15rpx 0;
	border-radius: 40rpx;
	font-size: 32rpx;
	border: none;
	width: 80%;
	margin: 0 auto;
}

.result-remaining-times {
	margin-top: 25rpx;
	font-size: 26rpx;
	color: #FF5500;
	font-weight: 500;
}
</style>
