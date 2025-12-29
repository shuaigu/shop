<template>
	<uni-popup ref="popup" type="center" :mask-click="true">
		<view class="bargain-success-container" @click="closePopup">
			<!-- 关闭按钮 -->
			<view class="close-btn" @click.stop="closePopup">
				<uni-icons type="closeempty" size="24" color="#999"></uni-icons>
			</view>
			
			<!-- 砂价金额展示 / 提示信息展示 -->
			<view class="bargain-amount-section">
				<!-- 正常模式：显示砂价金额 -->
				<template v-if="!isMessageMode">
					<text class="amount-label">砂价成功</text>
					<view class="amount-value-wrapper">
						<!-- 自定义提示文字优先显示 -->
						<text class="custom-amount-label" v-if="customAmountLabel">
							{{ customAmountLabel }}
						</text>
						<!-- 默认显示金额 -->
						<template v-else>
							<text class="currency-symbol">¥</text>
							<text class="amount-value">{{ formatAmount(bargainAmount) }}</text>
						</template>
					</view>
				</template>
				<!-- 提示模式：显示提示文本 -->
				<template v-else>
					<text class="message-tip-text">{{ tipMessage || '今天已经砂过价了，明天再来吧！' }}</text>
				</template>
			</view>
			
			<!-- 成功图片 -->
			<view class="success-image-wrapper">
				<image 
					:src="displayImage" 
					class="success-image" 
					mode="widthFix"
					show-menu-by-longpress
					@error="handleImageError"
					@click.stop
				></image>
			</view>
			
			<!-- 自定义话术 -->
			<view class="custom-message" v-if="customMessage">
				<text class="message-text">{{ customMessage }}</text>
			</view>
		</view>
	</uni-popup>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { fixImageUrl } from '@/utils/domainConfig.js'

// 定义属性
const props = defineProps({
	// 砂价金额
	bargainAmount: {
		type: Number,
		default: 0
	},
	// 当前价格
	currentPrice: {
		type: Number,
		default: 0
	},
	// 是否砂价完成
	isComplete: {
		type: Boolean,
		default: false
	},
	// 成功图片
	successImage: {
		type: String,
		default: '/static/images/砍价.png'
	},
	// 自定义话术（底部绿框文本）
	customMessage: {
		type: String,
		default: ''
	},
	// 提示文本（上半部分红字提示）
	tipMessage: {
		type: String,
		default: ''
	},
	// 是否为纯提示模式（隐藏砂价金额）
	isMessageMode: {
		type: Boolean,
		default: false
	},
	// 自定义金额提示文字（显示在金额部分）
	customAmountLabel: {
		type: String,
		default: ''
	}
})

// 监听 successImage 变化
// watch(() => props.successImage, (newVal) => {
// 	console.log('====== 砍价弹窗图片 ======')
// 	console.log('接收到的图片URL:', newVal)
// 	console.log('是否为空:', !newVal)
// 	console.log('是否为默认图:', newVal === '/static/images/砍价.png')
// 	console.log('=========================')
// }, { immediate: true })

// 定义事件
const emit = defineEmits(['continue', 'view-detail', 'close'])

// 弹窗引用
const popup = ref(null)

// 处理后的图片URL
const displayImage = computed(() => {
	// 如果没有传入图片或者传入空字符串，使用默认图片
	const imageUrl = (props.successImage && props.successImage.trim()) ? props.successImage : '/static/images/砍价.png'
	
	// 如果是本地路径，直接返回
	if (imageUrl.startsWith('/static/')) {
		return imageUrl
	}
	
	// 否则使用 fixImageUrl 处理
	const fixedUrl = fixImageUrl(imageUrl, 'image', false) // 不添加参数，保持原图
	return fixedUrl
})

// 计算默认话术
const defaultMessage = computed(() => {
	if (props.isComplete) {
		return '🎉 太棒了！您已成功将价格砍到0元！赶快分享给好友，让更多人参与吧！'
	} else {
		return `💪 继续加油！还差 ¥${formatAmount(props.currentPrice)} 就成功了！快邀请好友帮忙砍一刀吧！`
	}
})

// 格式化金额（保留两位小数）
const formatAmount = (amount) => {
	return Number(amount).toFixed(2)
}

// 图片加载失败处理
const handleImageError = (e) => {
	console.error('砍价弹窗图片加载失败:', props.successImage, e)
}

// 打开弹窗
const open = () => {
	if (popup.value) {
		popup.value.open()
	}
}

// 关闭弹窗
const closePopup = () => {
	if (popup.value) {
		popup.value.close()
	}
	emit('close')
}

// 继续砍价
const handleContinue = () => {
	emit('continue')
	closePopup()
}

// 查看详情
const handleViewDetail = () => {
	emit('view-detail')
	closePopup()
}

// 暴露方法
defineExpose({
	open,
	close: closePopup
})
</script>

<style lang="scss" scoped>
.bargain-success-container {
	position: relative;
	width: 620rpx;
	background: linear-gradient(180deg, #fff 0%, #f8f9ff 100%);
	border-radius: 24rpx;
	padding: 48rpx 40rpx;
	box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.15);
	margin-top: -180rpx; // 弹窗位置靠上一些
	
	.close-btn {
		position: absolute;
		top: 20rpx;
		right: 20rpx;
		width: 48rpx;
		height: 48rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		z-index: 10;
		
		&:active {
			opacity: 0.6;
		}
	}
	
	.bargain-amount-section {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 12rpx;
		margin-bottom: 32rpx;
		
		.amount-label {
			font-size: 28rpx;
			color: #666;
			font-weight: 400;
		}
		
		.amount-value-wrapper {
			display: flex;
			align-items: baseline;
			gap: 8rpx;
			
			.currency-symbol {
				font-size: 48rpx;
				color: #ff6b6b;
				font-weight: 700;
			}
			
			.amount-value {
				font-size: 80rpx;
				color: #ff6b6b;
				font-weight: 700;
				line-height: 1;
				animation: numberPulse 0.6s ease-out;
			}
			
			// 自定义金额提示文字样式
			.custom-amount-label {
				font-size: 48rpx;
				color: #ff6b6b;
				font-weight: 700;
				line-height: 1.4;
				text-align: center;
				animation: numberPulse 0.6s ease-out;
				max-width: 480rpx;
				word-wrap: break-word;
			}
		}
	}
	
	.success-image-wrapper {
		display: flex;
		align-items: center;
		justify-content: center;
		margin-bottom: 32rpx;
		overflow: hidden;
		border-radius: 12rpx;
		
		.success-image {
			width: 480rpx; // 图片放大以显示更多细节（原来320rpx）
			max-height: 480rpx;
			animation: scaleIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
		}
	}
	
	.custom-message {
		padding: 24rpx;
		background: #fff;
		border-radius: 16rpx;
		border: 2rpx solid #f0f0f0;
		
		.message-text {
			font-size: 28rpx;
			color: #333;
			line-height: 1.6;
			text-align: center;
			display: block;
		}
	}
	
	// 提示文本样式（在金额区域显示）
	.message-tip-text {
		font-size: 32rpx;
		color: #ff6b6b;
		font-weight: 600;
		line-height: 1.5;
		text-align: center;
		display: block;
		padding: 0 20rpx;
	}
}

// 动画定义

// 动画定义
@keyframes scaleIn {
	0% {
		transform: scale(0);
		opacity: 0;
	}
	50% {
		transform: scale(1.2);
	}
	100% {
		transform: scale(1);
		opacity: 1;
	}
}

@keyframes numberPulse {
	0%, 100% {
		transform: scale(1);
	}
	50% {
		transform: scale(1.1);
	}
}
</style>
