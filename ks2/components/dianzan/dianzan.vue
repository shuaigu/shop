<template>
	<view class="dianzan-container">
		<view class="dianzan-box" @click="debounceHandleLike" data-action="like" :class="{'like-animation': isLikeAnimating}">
			<view class="dianzan-icon" :class="{ 'dianzan-active': isLiked }">
				<uni-icons :type="isLiked ? 'heart-filled' : 'heart'" :size="size" :color="isLiked ? '#FF5D5B' : color"></uni-icons>
			</view>
			<view v-if="showCount" class="dianzan-count">{{ likeCount }}</view>
			<view v-if="showText" class="dianzan-text">{{ isLiked ? '已点赞' : '点赞' }}</view>
		</view>
		
		<!-- 点赞排名模态框 - 使用v-if确保模态框能正确关闭 -->
		<view v-if="showLikeRankModal" class="like-rank-modal-container" @click.stop="closeLikeRankModal">
			<view class="like-rank-modal" @click.stop :class="{'winner-modal': isWinner}">
				<view class="modal-decoration" v-if="isWinner">
					<view class="decoration-item" v-for="i in 6" :key="i"></view>
				</view>
				<view class="like-rank-title">{{ isWinner ? '恭喜您中奖了！' : '恭喜您' }}</view>
				<view class="like-rank-content">
					<view class="like-rank-text">您是第 <text class="like-rank-number">{{ likeRank || 1 }}</text> 位点赞的用户</view>
					<view v-if="isWinner" class="like-rank-winner-text">您已获得幸运用户奖励！</view>
					<view v-if="isWinner" class="winner-badge">
						<view class="badge-icon">🎁</view>
						<view class="badge-text">幸运用户专属奖励</view>
					</view>
				</view>
				<button class="like-rank-button" @click.stop="closeLikeRankModal">{{ isWinner ? '太棒了' : '我知道了' }}</button>
			</view>
		</view>
	</view>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, computed } from 'vue';

// 定义props
const props = defineProps({
	articleId: {
		type: String,
		required: true
	},
	userId: {
		type: String,
		required: true
	},
	initialLikeCount: {
		type: Number,
		default: 0
	},
	initialIsLiked: {
		type: Boolean,
		default: false
	},
	size: {
		type: [Number, String],
		default: 24
	},
	color: {
		type: String,
		default: '#444444'
	},
	showCount: {
		type: Boolean,
		default: true
	},
	showText: {
		type: Boolean,
		default: false
	},
	userAvatar: {
		type: String,
		default: ''
	},
	userNickname: {
		type: String,
		default: ''
	}
});

// 定义emit
const emit = defineEmits(['likeChange', 'luckyUser']);

// 响应式状态
const isLiked = ref(false);
const likeCount = ref(0);
const isLikeAnimating = ref(false);
const isProcessing = ref(false);
const lastClickTime = ref(0);
const showLikeRankModal = ref(false);
const likeRank = ref(1);
const isWinner = ref(false);

// 检查是否为幸运用户
const checkIfLuckyUser = async () => {
	try {
		// 调用API获取用户点赞排名
		const likeApi = uniCloud.importObject('likeRecord', { customUI: true });
		const result = await likeApi.getLikeRank(props.articleId, props.userId);
		
		if (result.code === 0 && result.like_rank) {
			// 设置点赞排名
			likeRank.value = result.like_rank;
			
			// 获取幸运用户配置
			const configResult = await likeApi.getLuckyConfig();
			
			// 使用配置中的幸运用户排名列表，而不是硬编码的[1, 8, 18]
			let luckyRanks = [1, 8, 18]; // 默认值
			let isEnabled = true;
			
			if (configResult.code === 0 && configResult.data) {
				if (Array.isArray(configResult.data.lucky_ranks) && configResult.data.lucky_ranks.length > 0) {
					luckyRanks = configResult.data.lucky_ranks;
				}
				
				if (typeof configResult.data.is_enabled === 'boolean') {
					isEnabled = configResult.data.is_enabled;
				}
			}
			
			console.log('幸运用户配置:', {
				luckyRanks,
				isEnabled,
				currentRank: likeRank.value
			});
			
			// 判断是否为中奖用户（使用配置中的排名列表）
			isWinner.value = isEnabled && luckyRanks.includes(likeRank.value);
			
			console.log('初始化时检查幸运用户状态:', {
				likeRank: likeRank.value,
				isWinner: isWinner.value,
				nickname: result.nickname,
				avatar: result.avatar
			});
			
			// 如果是幸运用户，发送事件通知父组件
			if (isWinner.value) {
				// 确保 result 对象存在且有效
				const resultData = result || {};
				
				emit('luckyUser', {
					likeRank: likeRank.value,
					isWinner: true,
					// 优先使用服务器返回的用户信息，如果没有则使用传入的信息
					avatar: (resultData.avatar || props.userAvatar || ''),
					nickname: (resultData.nickname || props.userNickname || '')
				});
			}
		}
	} catch (err) {
		console.error('检查幸运用户状态失败:', err);
	}
};

// 更新点赞状态
const updateLikeStatus = (data) => {
	if (data.articleId === props.articleId) {
		// 添加调试日志
		console.log('收到点赞状态更新事件:', {
			articleId: data.articleId,
			oldLikeState: isLiked.value,
			newLikeState: data.isLiked,
			oldLikeCount: likeCount.value,
			newLikeCount: data.likeCount
		});
		
		// 更新状态
		isLiked.value = data.isLiked;
		likeCount.value = data.likeCount;
		
		// 如果有排名和中奖信息，也更新
		if (data.likeRank) {
			likeRank.value = data.likeRank;
		}
		
		if (data.isWinner !== undefined) {
			isWinner.value = data.isWinner;
		}
	}
};

// 防抖处理点赞
const debounceHandleLike = () => {
	// 防止重复点击，500ms内不允许再次点击
	const now = Date.now();
	if (now - lastClickTime.value < 500 || isProcessing.value) {
		console.log('点击过于频繁或正在处理中，忽略此次点击');
		return;
	}
	lastClickTime.value = now;
	
	// 触觉反馈（如果平台支持）
	if (uni.vibrateShort) {
		uni.vibrateShort({
			success: () => {}
		});
	}
	
	// 执行点赞操作
	handleLike();
};

// 检查登录状态
const checkLogin = async () => {
	try {
		// 直接使用传入的userId判断是否已登录
		if (props.userId) {
			return true;
		}
		
		// 显示提示
		uni.showToast({
			title: '请先登录',
			icon: 'none',
			duration: 2000
		});
		
		// 延迟跳转到登录页，给用户时间看到提示
		setTimeout(() => {
			const currentRoute = `/pages/article/articleDetail?article_id=${props.articleId}`;
			const redirectUrl = encodeURIComponent(currentRoute);
			uni.navigateTo({
				url: `/pages/login/login?redirect=${redirectUrl}`,
				fail: (err) => {
					console.error('跳转登录页失败:', err);
					// 如果navigateTo失败，尝试redirectTo
					uni.redirectTo({
						url: `/pages/login/login?redirect=${redirectUrl}`
					});
				}
			});
		}, 500);
		
		return false;
	} catch (err) {
		console.error('登录检查失败:', err);
		
		// 显示错误提示
		uni.showToast({
			title: '登录检查失败，请重试',
			icon: 'none',
			duration: 2000
		});
		
		return false;
	}
};

// 处理错误
const handleError = (err, message = '操作失败') => {
	console.error(message, err);
	
	// 显示错误提示
	uni.showToast({
		title: err?.message || message,
		icon: 'none',
		duration: 2000
	});
	
	// 如果是网络错误，提供更具体的提示
	if (err?.message?.includes('request:fail') || err?.message?.includes('网络') || err?.message?.includes('timeout')) {
		uni.showToast({
			title: '网络连接失败，请检查网络设置',
			icon: 'none',
			duration: 2000
		});
	}
};

// 处理点赞
const handleLike = async () => {
	if (isProcessing.value) return;
	
	try {
		isProcessing.value = true;
		
		// 添加调试日志
		console.log('点赞操作开始:', {
			articleId: props.articleId,
			userId: props.userId,
			currentLikeState: isLiked.value,
			currentLikeCount: likeCount.value
		});
		
		// 检查登录状态
		const isLoggedIn = await checkLogin();
		if (!isLoggedIn) {
			isProcessing.value = false;
			return;
		}
		
		// 保存当前状态，用于回滚
		const previousLikeState = isLiked.value;
		const previousLikeCount = likeCount.value;
		
		// 显示加载提示
		uni.showLoading({
			title: '处理中...',
			mask: true
		});
		
		// 调用点赞接口
		try {
			const likeApi = uniCloud.importObject('likeRecord', { customUI: true });
			console.log('调用服务器点赞接口:', {
				articleId: props.articleId,
				userId: props.userId
			});
			
			const result = await likeApi.toggleLike(props.articleId, props.userId);
			console.log('服务器点赞结果:', result);
			
			// 隐藏加载提示
			uni.hideLoading();
			
			if (result.code === 0) {
				// 服务器操作成功，根据服务器返回的状态更新UI
				isLiked.value = result.isLiked;
				likeCount.value = result.like_count;
				
				console.log('已更新到服务器状态:', {
					isLiked: isLiked.value,
					likeCount: likeCount.value
				});
				
				// 如果是点赞操作且服务器返回了点赞排名
				if (isLiked.value && !previousLikeState && result.like_rank) {
					// 设置点赞排名
					likeRank.value = result.like_rank || 1;
					
					// 获取幸运用户配置
					try {
						const configResult = await likeApi.getLuckyConfig();
						
						// 使用配置中的幸运用户排名列表，而不是硬编码的[1, 8, 18]
						let luckyRanks = [1, 8, 18]; // 默认值
						let isEnabled = true;
						
						if (configResult.code === 0 && configResult.data) {
							if (Array.isArray(configResult.data.lucky_ranks) && configResult.data.lucky_ranks.length > 0) {
								luckyRanks = configResult.data.lucky_ranks;
							}
							
							if (typeof configResult.data.is_enabled === 'boolean') {
								isEnabled = configResult.data.is_enabled;
							}
						}
						
						console.log('点赞时获取幸运用户配置:', {
							luckyRanks,
							isEnabled,
							currentRank: likeRank.value
						});
						
						// 判断是否为中奖用户（使用配置中的排名列表）
						isWinner.value = isEnabled && luckyRanks.includes(likeRank.value);
					} catch (err) {
						console.error('获取幸运用户配置失败:', err);
						// 使用默认判断逻辑
						isWinner.value = [1, 8, 18].includes(likeRank.value);
					}
					
					console.log('点赞排名信息:', {
						likeRank: likeRank.value,
						isWinner: isWinner.value
					});
					
					// 如果是幸运用户，添加震动反馈
					if (isWinner.value) {
						// 使用长震动提供更强的反馈
						if (uni.vibrateLong) {
							uni.vibrateLong({
								success: () => {
									console.log('震动反馈成功');
								}
							});
						}
					}
				}
				
				// 播放点赞动画（仅当点赞时）
				if (isLiked.value && !previousLikeState) {
					isLikeAnimating.value = true;
					
					// 设置定时器移除动画类
					setTimeout(() => {
						isLikeAnimating.value = false;
					}, 400); // 动画持续时间
				}
				
				// 通知更新
				emit('likeChange', {
					isLiked: isLiked.value,
					likeCount: likeCount.value,
					likeRank: likeRank.value,
					isWinner: isWinner.value
				});
				
				// 如果是幸运用户，发送特殊事件通知父组件
				if (isWinner.value && isLiked.value) {
					// 确保 result 对象存在且有效
					const resultData = result || {};
					
					emit('luckyUser', {
						likeRank: likeRank.value,
						isWinner: true,
						// 优先使用服务器返回的用户信息，如果没有则使用传入的信息
						avatar: (resultData.avatar || props.userAvatar || ''),
						nickname: (resultData.nickname || props.userNickname || '')
					});
					
					// 显示祝贺提示
					uni.showToast({
						title: '恭喜您成为幸运用户！',
						icon: 'none',
						duration: 2000,
						mask: true
					});
				}
				
				uni.$emit('updateArticleLikeStatus', {
					articleId: props.articleId,
					isLiked: isLiked.value,
					likeCount: likeCount.value,
					likeRank: likeRank.value,
					isWinner: isWinner.value
				});
				
				// 显示轻量级提示
				if (!isWinner.value || !isLiked.value) {
					uni.showToast({
						title: isLiked.value ? '已点赞' : '已取消点赞',
						icon: 'none',
						duration: 1000,
						mask: false
					});
				}
				
				// 如果是点赞操作且服务器返回了点赞排名，显示排名模态框
				if (result.isLiked && !previousLikeState && result.like_rank) {
					// 隐藏之前的轻量级提示
					uni.hideToast();
					
					// 使用延时确保UI更新完成后再显示模态框
					setTimeout(() => {
						// 显示模态框
						showLikeRankModal.value = true;
						
						console.log('显示点赞排名模态框:', {
							likeRank: likeRank.value,
							showModal: showLikeRankModal.value,
							isWinner: isWinner.value
						});
					}, 100);
				}
			} else {
				// 服务器操作失败
				console.warn('服务器操作失败:', result);
				throw new Error(result.message || '操作失败');
			}
		} catch (err) {
			// 服务器请求失败
			console.error('服务器请求失败:', err);
			
			// 使用错误处理方法
			handleError(err, '点赞操作失败');
		}
	} catch (err) {
		// 使用错误处理方法
		console.error('点赞处理失败:', err);
		handleError(err, '点赞处理失败');
	} finally {
		// 隐藏可能存在的加载提示
		uni.hideLoading();
		isProcessing.value = false;
		console.log('点赞操作结束，当前状态:', {
			isLiked: isLiked.value,
			likeCount: likeCount.value,
			isProcessing: isProcessing.value
		});
	}
};

// 关闭点赞排名模态框
const closeLikeRankModal = () => {
	console.log('关闭点赞排名模态框');
	
	// 直接设置状态为false
	showLikeRankModal.value = false;
	
	// 添加调试日志
	console.log('模态框已关闭:', showLikeRankModal.value);
	
	// 防止事件冒泡
	return false;
};

// 生命周期钩子
onMounted(() => {
	// 初始化点赞状态和数量
	isLiked.value = props.initialIsLiked;
	likeCount.value = props.initialLikeCount;
	
	// 监听点赞状态更新事件
	uni.$on('updateArticleLikeStatus', updateLikeStatus);
	
	// 添加调试日志
	console.log('点赞组件创建:', {
		articleId: props.articleId,
		userId: props.userId,
		initialIsLiked: props.initialIsLiked,
		initialLikeCount: props.initialLikeCount
	});
	
	// 如果已经点赞，检查是否为幸运用户
	if (isLiked.value) {
		checkIfLuckyUser();
	}
});

onBeforeUnmount(() => {
	// 移除事件监听
	uni.$off('updateArticleLikeStatus', updateLikeStatus);
});
</script>

<style lang="scss" scoped>
	.dianzan-container {
		display: flex;
		flex-direction: column;
		align-items: center;
	}
	
	.dianzan-box {
		cursor: pointer;
		transition: all 0.2s;
		position: relative;
		display: flex;
		flex-direction: column;
		align-items: center;
		
		&:active {
			transform: scale(1.1);
		}
	}
	
	.dianzan-icon {
		margin-bottom: 4rpx;
		
		&.dianzan-active {
			color: #FF5D5B;
		}
	}
	
	.dianzan-count {
		font-size: 24rpx;
		color: #999;
		transition: color 0.3s ease, transform 0.3s ease;
	}
	
	.dianzan-text {
		font-size: 24rpx;
		color: #999;
		transition: color 0.3s ease, transform 0.3s ease;
	}
	
	/* 点赞排名模态框样式 */
	.like-rank-modal-container {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-color: rgba(0, 0, 0, 0.6);
		display: flex;
		justify-content: center;
		align-items: center;
		z-index: 9999;
		animation: fade-in 0.3s ease;
	}
	
	.like-rank-modal {
		width: 80%;
		max-width: 600rpx;
		background-color: #fff;
		border-radius: 20rpx;
		padding: 40rpx 30rpx;
		display: flex;
		flex-direction: column;
		align-items: center;
		box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.1);
		position: relative;
		overflow: hidden;
		animation: modal-in 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
		
		&.winner-modal {
			background: linear-gradient(135deg, #fff8f8, #fff);
			border: 2rpx solid #ff6b6b;
		}
	}
	
	.modal-decoration {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		overflow: hidden;
		pointer-events: none;
		
		.decoration-item {
			position: absolute;
			width: 20rpx;
			height: 80rpx;
			background-color: rgba(255, 107, 107, 0.2);
			border-radius: 10rpx;
			
			&:nth-child(1) {
				top: -20rpx;
				left: 10%;
				transform: rotate(30deg);
				animation: float 3s infinite ease-in-out;
			}
			
			&:nth-child(2) {
				top: 30%;
				right: 5%;
				width: 15rpx;
				height: 60rpx;
				transform: rotate(-20deg);
				animation: float 2.5s infinite ease-in-out 0.2s;
			}
			
			&:nth-child(3) {
				bottom: 10%;
				left: 20%;
				width: 25rpx;
				height: 70rpx;
				transform: rotate(15deg);
				animation: float 3.5s infinite ease-in-out 0.5s;
			}
			
			&:nth-child(4) {
				top: 20%;
				left: 5%;
				width: 18rpx;
				height: 50rpx;
				transform: rotate(-40deg);
				animation: float 3s infinite ease-in-out 0.7s;
			}
			
			&:nth-child(5) {
				bottom: 5%;
				right: 15%;
				width: 22rpx;
				height: 65rpx;
				transform: rotate(25deg);
				animation: float 2.8s infinite ease-in-out 0.3s;
			}
			
			&:nth-child(6) {
				top: 40%;
				left: 80%;
				width: 16rpx;
				height: 55rpx;
				transform: rotate(-15deg);
				animation: float 3.2s infinite ease-in-out 0.1s;
			}
		}
	}
	
	.like-rank-title {
		font-size: 36rpx;
		font-weight: bold;
		color: #333;
		margin-bottom: 20rpx;
	}
	
	.like-rank-content {
		margin-bottom: 30rpx;
		text-align: center;
		width: 100%;
	}
	
	.like-rank-text {
		font-size: 30rpx;
		color: #666;
	}
	
	.like-rank-number {
		font-size: 40rpx;
		font-weight: bold;
		color: #ff6b6b;
	}
	
	.like-rank-button {
		width: 80%;
		height: 80rpx;
		line-height: 80rpx;
		background-color: #ff6b6b;
		color: #fff;
		border: none;
		border-radius: 40rpx;
		font-size: 28rpx;
		font-weight: 500;
		margin-top: 20rpx;
		text-align: center;
		padding: 0;
		box-shadow: 0 4rpx 12rpx rgba(255, 107, 107, 0.3);
		transition: all 0.2s ease;
		
		&:active {
			transform: scale(0.95);
			box-shadow: 0 2rpx 8rpx rgba(255, 107, 107, 0.2);
		}
	}
	
	.like-rank-winner-text {
		font-size: 32rpx;
		color: #ff6b6b;
		margin-top: 20rpx;
		font-weight: bold;
		animation: winner-pulse 1.5s infinite;
	}
	
	.winner-badge {
		margin-top: 30rpx;
		background-color: rgba(255, 107, 107, 0.1);
		border: 1rpx dashed #ff6b6b;
		border-radius: 12rpx;
		padding: 16rpx 24rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 90%;
		
		.badge-icon {
			font-size: 36rpx;
			margin-right: 12rpx;
			animation: bounce 1.5s infinite;
		}
		
		.badge-text {
			font-size: 28rpx;
			color: #ff6b6b;
			font-weight: 500;
		}
	}
	
	@keyframes winner-pulse {
		0% {
			transform: scale(1);
			opacity: 1;
		}
		50% {
			transform: scale(1.1);
			opacity: 0.8;
		}
		100% {
			transform: scale(1);
			opacity: 1;
		}
	}
	
	@keyframes fade-in {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}
	
	@keyframes modal-in {
		from {
			transform: scale(0.8);
			opacity: 0;
		}
		to {
			transform: scale(1);
			opacity: 1;
		}
	}
	
	@keyframes float {
		0%, 100% {
			transform: translateY(0) rotate(var(--rotation, 0deg));
		}
		50% {
			transform: translateY(-10rpx) rotate(var(--rotation, 0deg));
		}
	}
	
	@keyframes bounce {
		0%, 100% {
			transform: translateY(0);
		}
		50% {
			transform: translateY(-5rpx);
		}
	}
	
	/* 点赞动画 */
	@keyframes like-animation {
		0% {
			transform: scale(1);
		}
		25% {
			transform: scale(1.2);
		}
		50% {
			transform: scale(0.95);
		}
		75% {
			transform: scale(1.1);
		}
		100% {
			transform: scale(1);
		}
	}
	
	.like-animation {
		animation: like-animation 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
	}
	
	/* 点赞图标动画 */
	@keyframes heart-beat {
		0% {
			transform: scale(1);
		}
		15% {
			transform: scale(1.3);
		}
		30% {
			transform: scale(1);
		}
		45% {
			transform: scale(1.2);
		}
		60% {
			transform: scale(1);
		}
		100% {
			transform: scale(1);
		}
	}
	
	.dianzan-box[data-action="like"] uni-icons {
		transition: transform 0.2s ease, color 0.3s ease;
	}
	
	.dianzan-box[data-action="like"]:active uni-icons {
		transform: scale(1.2);
	}
	
	.dianzan-box[data-action="like"].like-animation uni-icons {
		animation: heart-beat 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275);
	}
</style>