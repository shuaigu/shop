<template>
	<!-- 自定义弹窗遮罩 -->
	<view class="reward-mask" v-if="visible" @click="closePopup">
		<view class="reward-popup" @click.stop>
			<!-- 头部 -->
			<view class="reward-header">
				<text class="reward-title">打赏支持</text>
				<view class="close-btn" @click="closePopup">
					<text class="close-icon">×</text>
				</view>
			</view>

			<!-- 作者信息 -->
			<view class="author-info">
				<image 
					class="author-avatar" 
					:src="authorAvatar || '/static/images/default-avatar.png'" 
					mode="aspectFill"
				></image>
				<text class="author-name">{{ authorName || '匿名用户' }}</text>
			</view>

			<!-- 说明文字 -->
			<view class="reward-desc">
				<text>感谢作者的精彩分享，您的支持是作者创作的最大动力</text>
			</view>

			<!-- 金额选择 -->
			<view class="amount-section">
				<text class="section-title">选择金额</text>
				<view class="amount-options">
					<view 
						v-for="(item, index) in amountOptions" 
						:key="index"
						class="amount-item"
						:class="{ active: selectedAmount === item }"
						@click="selectAmount(item)"
					>
						<text class="amount-text">{{ item / 100 }}元</text>
					</view>
				</view>
			</view>

			<!-- 自定义金额 -->
			<view class="custom-amount">
				<text class="section-title">自定义金额</text>
				<view class="custom-input-wrapper">
					<text class="currency-symbol">¥</text>
					<input 
						class="custom-input" 
						type="digit"
						:value="customAmountYuan"
						@input="onCustomAmountInput"
						placeholder="请输入金额"
						placeholder-style="color: #999;"
					/>
					<text class="unit-text">元</text>
				</view>
			</view>

			<!-- 打赏留言 -->
			<view class="message-section">
				<text class="section-title">留言（选填）</text>
				<textarea 
					class="message-input"
					v-model="message"
					placeholder="说点什么吧..."
					placeholder-style="color: #999;"
					maxlength="100"
					:show-confirm-bar="false"
				></textarea>
				<text class="message-count">{{ message.length }}/100</text>
			</view>

			<!-- 打赏统计 -->
			<view class="reward-stats" v-if="statistics.totalCount > 0">
				<text class="stats-text">已有{{ statistics.userCount }}人打赏，共{{ (statistics.totalAmount / 100).toFixed(2) }}元</text>
			</view>

			<!-- 按钮组 -->
			<view class="button-group">
				<button class="cancel-btn" @click="closePopup">取消</button>
				<button class="confirm-btn" @click="handleReward" :disabled="!canReward">
					立即打赏{{ currentAmount > 0 ? `（¥${(currentAmount / 100).toFixed(2)}）` : '' }}
				</button>
			</view>
		</view>
	</view>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { testLogin } from '@/utils/isLogin'
import { useUserInfoStore } from '@/store/user.js'

const userStore = useUserInfoStore()

const props = defineProps({
	articleId: {
		type: String,
		required: true
	},
	authorId: {
		type: String,
		required: true
	},
	authorName: {
		type: String,
		default: ''
	},
	authorAvatar: {
		type: String,
		default: ''
	}
})

const emit = defineEmits(['success', 'close'])

// 弹窗显示状态
const visible = ref(false)

// 预设金额选项（分）
const amountOptions = ref([100, 500, 1000, 2000, 5000])

// 选中的预设金额
const selectedAmount = ref(0)

// 自定义金额（元，字符串形式）
const customAmountYuan = ref('')

// 打赏留言
const message = ref('')

// 打赏统计
const statistics = ref({
	totalAmount: 0,
	totalCount: 0,
	userCount: 0
})

// 当前选择的金额（分）
const currentAmount = computed(() => {
	if (customAmountYuan.value) {
		const yuan = parseFloat(customAmountYuan.value)
		return Math.floor(yuan * 100)
	}
	return selectedAmount.value
})

// 是否可以打赏
const canReward = computed(() => {
	return currentAmount.value >= 100 && currentAmount.value <= 100000
})

// 监听自定义金额输入，清除预设选择
watch(customAmountYuan, (newVal) => {
	if (newVal) {
		selectedAmount.value = 0
	}
})

// 选择预设金额
const selectAmount = (amount) => {
	selectedAmount.value = amount
	customAmountYuan.value = ''
}

// 自定义金额输入
const onCustomAmountInput = (e) => {
	let value = e.detail.value
	// 只保留数字和小数点
	value = value.replace(/[^\d.]/g, '')
	// 只保留一个小数点
	const parts = value.split('.')
	if (parts.length > 2) {
		value = parts[0] + '.' + parts.slice(1).join('')
	}
	// 小数点后最多2位
	if (parts.length === 2 && parts[1].length > 2) {
		value = parts[0] + '.' + parts[1].substring(0, 2)
	}
	// 最大金额1000元
	const numValue = parseFloat(value)
	if (numValue > 1000) {
		value = '1000'
	}
	customAmountYuan.value = value
}

// 打开弹窗
const open = async () => {
	// 检查登录状态
	const isLoggedIn = await testLogin()
	if (!isLoggedIn) {
		return
	}
	
	// 移除作者身份检查，允许管理员和作者打赏
	// 如果需要限制，可以在云函数中处理
	
	// 加载打赏统计
	await loadStatistics()
	
	// 显示弹窗
	visible.value = true
}

// 关闭弹窗
const closePopup = () => {
	visible.value = false
	// 重置数据
	selectedAmount.value = 0
	customAmountYuan.value = ''
	message.value = ''
	emit('close')
}

// 加载打赏统计
const loadStatistics = async () => {
	try {
		const rewardApi = uniCloud.importObject('rewardWx', { customUI: true })
		const res = await rewardApi.getRewardStatistics({
			article_id: props.articleId
		})
		
		if (res.code === 0) {
			statistics.value = res.data
		}
	} catch (err) {
		console.error('加载打赏统计失败:', err)
	}
}

// 处理打赏
const handleReward = async () => {
	if (!canReward.value) {
		uni.showToast({
			title: '请选择打赏金额',
			icon: 'none'
		})
		return
	}
	
	// 二次确认
	uni.showModal({
		title: '确认打赏',
		content: `确认打赏 ¥${(currentAmount.value / 100).toFixed(2)} 元吗？`,
		success: async (res) => {
			if (res.confirm) {
				await submitReward()
			}
		}
	})
}

// 提交打赏
const submitReward = async () => {
	uni.showLoading({
		title: '处理中...',
		mask: true
	})
	
	try {
		// 创建打赏订单
		const rewardApi = uniCloud.importObject('rewardWx', { customUI: true })
		
		// 获取当前用户ID
		const userId = userStore.userInfo?.uid || userStore.userInfo?._id
		
		if (!userId) {
			throw new Error('用户信息不存在，请先登录')
		}
		
		const orderRes = await rewardApi.createRewardOrder({
			article_id: props.articleId,
			amount: currentAmount.value,
			message: message.value.trim(),
			from_user_id: userId  // 测试模式：直接传递用户ID
		})
		
		if (orderRes.code !== 0) {
			throw new Error(orderRes.message || '创建订单失败')
		}
		
		// 启用真实支付流程
		await processPayment(orderRes.data)
		
	} catch (err) {
		console.error('打赏失败:', err)
		uni.hideLoading()
		uni.showToast({
			title: err.message || '打赏失败，请重试',
			icon: 'none'
		})
	}
}

// 处理支付
const processPayment = async (orderData) => {
	try {
		console.log('=== 开始支付流程 ===', orderData)
		
		// 获取uni-pay组件实例
		const uniPayCo = uniCloud.importObject('uni-pay-co', { customUI: true })
		console.log('1. uni-pay-co 实例创建成功')
		
		// 获取用户的openid
		let openid = ''
		try {
			// 先尝试从缓存获取openid
			openid = uni.getStorageSync('wx_openid')
			console.log('从缓存获取的openid:', openid)
			
			if (!openid) {
				console.log('缓存中没有openid，开始获取...')
				// 如果缓存中没有，则通过code获取
				const loginRes = await new Promise((resolve, reject) => {
					uni.login({
						provider: 'weixin',
						success: (res) => {
							console.log('uni.login success:', res)
							resolve(res)
						},
						fail: (err) => {
							console.error('uni.login fail:', err)
							reject(err)
						}
					})
				})
				
				if (loginRes && loginRes.code) {
					console.log('获取到code:', loginRes.code)
					
					const openidRes = await uniPayCo.getOpenid({
						provider: 'wxpay',
						code: loginRes.code
					})
					
					console.log('getOpenid返回结果:', openidRes)
					
					if (openidRes.errCode === 0 && openidRes.openid) {
						openid = openidRes.openid
						// 缓存openid
						uni.setStorageSync('wx_openid', openid)
						console.log('获取openid成功:', openid)
					} else {
						const errMsg = openidRes.errMsg || '获取openid失败'
						console.error('获取openid失败:', errMsg)
						throw new Error(errMsg)
					}
				} else {
					throw new Error('获取登录code失败')
				}
			} else {
				console.log('使用缓存的openid')
			}
		} catch (err) {
			console.error('获取openid过程出错:', err)
			throw new Error(err.message || '获取用户openid失败，请重试')
		}
		
		if (!openid) {
			throw new Error('获取用户openid失败，openid为空')
		}
		
		// 创建支付订单
		const payParams = {
			provider: 'wxpay',
			total_fee: orderData.amount,
			order_no: orderData.order_no,
			description: '文章打赏',
			type: 'recharge',
			openid: openid,  // 传入openid
			custom: {
				reward_id: orderData.reward_id
			}
		}
		console.log('2. 支付参数:', payParams)
		
		console.log('3. 开始调用 createOrder...')
		const payRes = await uniPayCo.createOrder(payParams)
		console.log('4. createOrder 返回结果:', payRes)
		console.log('4.1 payRes 完整结构:', JSON.stringify(payRes))
		
		if (payRes.errCode !== 0) {
			throw new Error(payRes.errMsg || '创建支付订单失败')
		}
		
		// 提取支付参数（uni-pay 返回的支付参数在 order 字段中）
		const paymentParams = payRes.order
		console.log('5. 实际支付参数:', paymentParams)
		
		if (!paymentParams) {
			throw new Error('支付参数为空，请检查配置')
		}
		
		// 调起微信支付
		uni.hideLoading()
		
		uni.requestPayment({
			provider: 'wxpay',
			...paymentParams,
			success: async () => {
				// 支付成功，更新订单状态
				await updateRewardStatus(orderData.order_no, 1)
				
				uni.showToast({
					title: '打赏成功',
					icon: 'success'
				})
				
				// 关闭弹窗
				closePopup()
				
				// 触发成功事件
				emit('success', {
					amount: orderData.amount,
					message: message.value
				})
			},
			fail: (err) => {
				console.error('支付失败:', err)
				if (err.errMsg && err.errMsg.indexOf('cancel') === -1) {
					uni.showToast({
						title: '支付失败',
						icon: 'none'
					})
				}
			}
		})
		
	} catch (err) {
		console.error('支付处理失败:', err)
		uni.hideLoading()
		uni.showToast({
			title: err.message || '支付失败',
			icon: 'none'
		})
	}
}

// 更新打赏订单状态
const updateRewardStatus = async (order_no, status) => {
	try {
		const rewardApi = uniCloud.importObject('rewardWx', { customUI: true })
		await rewardApi.updateRewardStatus({
			order_no,
			status
		})
	} catch (err) {
		console.error('更新订单状态失败:', err)
	}
}

// 暴露方法
defineExpose({
	open
})
</script>

<style lang="scss" scoped>
// 遮罩层
.reward-mask {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(0, 0, 0, 0.5);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 9999;
}

.reward-popup {
	width: 600rpx;
	background: #fff;
	border-radius: 24rpx;
	overflow: hidden;
	max-height: 90vh;
	overflow-y: auto;
}

.reward-header {
	display: flex;
	align-items: center;
	justify-content: center;
	position: relative;
	padding: 32rpx 24rpx 24rpx;
	border-bottom: 1px solid #f5f5f5;
	
	.reward-title {
		font-size: 32rpx;
		font-weight: 600;
		color: #333;
	}
	
	.close-btn {
		position: absolute;
		right: 24rpx;
		top: 32rpx;
		padding: 8rpx;
		
		.close-icon {
			font-size: 48rpx;
			color: #999;
			line-height: 1;
		}
	}
}

.author-info {
	display: flex;
	flex-direction: column;
	align-items: center;
	padding: 32rpx 24rpx 24rpx;
	
	.author-avatar {
		width: 120rpx;
		height: 120rpx;
		border-radius: 60rpx;
		margin-bottom: 16rpx;
	}
	
	.author-name {
		font-size: 28rpx;
		color: #333;
		font-weight: 500;
	}
}

.reward-desc {
	padding: 0 24rpx 24rpx;
	text-align: center;
	
	text {
		font-size: 24rpx;
		color: #999;
		line-height: 1.6;
	}
}

.amount-section {
	padding: 24rpx;
	
	.section-title {
		display: block;
		font-size: 28rpx;
		color: #333;
		font-weight: 500;
		margin-bottom: 20rpx;
	}
	
	.amount-options {
		display: flex;
		flex-wrap: wrap;
		gap: 16rpx;
	}
	
	.amount-item {
		flex: 0 0 calc(33.333% - 11rpx);
		height: 80rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		background: #f5f5f5;
		border-radius: 12rpx;
		border: 2rpx solid transparent;
		transition: all 0.3s;
		
		&.active {
			background: #fff5f0;
			border-color: #ff6b35;
			
			.amount-text {
				color: #ff6b35;
				font-weight: 600;
			}
		}
		
		.amount-text {
			font-size: 28rpx;
			color: #333;
		}
	}
}

.custom-amount {
	padding: 0 24rpx 24rpx;
	
	.section-title {
		display: block;
		font-size: 28rpx;
		color: #333;
		font-weight: 500;
		margin-bottom: 20rpx;
	}
	
	.custom-input-wrapper {
		display: flex;
		align-items: center;
		background: #f5f5f5;
		border-radius: 12rpx;
		padding: 0 24rpx;
		height: 80rpx;
		
		.currency-symbol {
			font-size: 32rpx;
			color: #333;
			margin-right: 8rpx;
			font-weight: 600;
		}
		
		.custom-input {
			flex: 1;
			font-size: 32rpx;
			color: #333;
			height: 100%;
		}
		
		.unit-text {
			font-size: 24rpx;
			color: #999;
			margin-left: 8rpx;
		}
	}
}

.message-section {
	padding: 0 24rpx 24rpx;
	position: relative;
	
	.section-title {
		display: block;
		font-size: 28rpx;
		color: #333;
		font-weight: 500;
		margin-bottom: 20rpx;
	}
	
	.message-input {
		width: 100%;
		min-height: 120rpx;
		background: #f5f5f5;
		border-radius: 12rpx;
		padding: 16rpx 20rpx;
		font-size: 26rpx;
		color: #333;
		line-height: 1.6;
		box-sizing: border-box;
	}
	
	.message-count {
		position: absolute;
		right: 36rpx;
		bottom: 36rpx;
		font-size: 22rpx;
		color: #999;
	}
}

.reward-stats {
	padding: 16rpx 24rpx;
	background: #f9f9f9;
	margin: 0 24rpx 24rpx;
	border-radius: 12rpx;
	
	.stats-text {
		font-size: 24rpx;
		color: #666;
		line-height: 1.6;
	}
}

.button-group {
	display: flex;
	gap: 16rpx;
	padding: 0 24rpx 32rpx;
	
	button {
		flex: 1;
		height: 88rpx;
		border-radius: 44rpx;
		font-size: 30rpx;
		border: none;
		
		&::after {
			border: none;
		}
	}
	
	.cancel-btn {
		background: #f5f5f5;
		color: #666;
	}
	
	.confirm-btn {
		background: linear-gradient(135deg, #ff6b35 0%, #ff8c42 100%);
		color: #fff;
		font-weight: 600;
		
		&[disabled] {
			opacity: 0.5;
		}
	}
}
</style>
