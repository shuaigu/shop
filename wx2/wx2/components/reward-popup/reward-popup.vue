<template>
	<!-- 自定义弹窗遮罩 -->
	<view class="reward-mask" v-if="visible" @click="closePopup">
		<!-- 抽奖样式界面 -->
		<view class="lottery-popup" @click.stop v-if="currentStep === 'lottery'">
			<!-- 礼物盒图标 -->
			<view class="gift-icon">
				<text class="gift-emoji">🎁</text>
			</view>
			
			<!-- 标题 -->
			<view class="lottery-title">
				<text class="title-main">幸运大抽奖</text>
				<text class="title-sub">一元参与，赢取大奖！</text>
			</view>
			
			<!-- 统计信息卡片 -->
			<view class="stats-cards">
				<view class="stats-card stats-card-left">
					<text class="card-label">参与人数</text>
					<text class="card-value card-value-red">{{ statistics.userCount || 0 }}人</text>
				</view>
				<view class="stats-card stats-card-right">
					<text class="card-label">奖池金额</text>
					<text class="card-value card-value-gold">¥{{ (statistics.totalAmount / 100 || 0).toFixed(0) }}</text>
				</view>
			</view>
			
			<!-- 编号选择区域 -->
			<view class="number-select-section">
				<view class="number-select-title">
					<text class="select-label">选择你的幸运编号</text>
					<text class="select-range">（1-100）</text>
				</view>
				
				<view class="number-input-wrapper" @click="showNumberPicker">
					<text class="number-display" :class="{ 'placeholder': !selectedNumber }">
						{{ selectedNumber ? `编号：${selectedNumber}` : '点击选择编号' }}
					</text>
					<text class="arrow-icon">▼</text>
				</view>
				
				<text class="number-hint" v-if="!selectedNumber">请选择一个1-100之间的编号</text>
			</view>
			
			<!-- 参与按钮 -->
			<button 
				class="lottery-btn" 
				:class="{ 'disabled': !selectedNumber }"
				:disabled="!selectedNumber"
				@click="goToConfirm"
			>
				参与抽奖（¥1）
			</button>
		</view>
		
		<!-- 确认支付界面 -->
		<view class="confirm-popup" @click.stop v-if="currentStep === 'confirm'">
			<!-- 标题 -->
			<view class="confirm-title">
				<text>确认支付</text>
			</view>
			
			<!-- 礼物盒图标 -->
			<view class="confirm-gift-icon">
				<text class="gift-emoji">🎁</text>
			</view>
			
			<!-- 活动名称 -->
			<view class="confirm-activity">
				<text>幸运大抽奖</text>
			</view>
			
			<!-- 选中的编号 -->
			<view class="confirm-number">
				<text>幸运编号：{{ selectedNumber }}</text>
			</view>
			
			<!-- 金额 -->
			<view class="confirm-amount">
				<text>¥1.00</text>
			</view>
			
			<!-- 按钮组 -->
			<view class="confirm-buttons">
				<button class="confirm-pay-btn" @click="handleReward">
					确认支付
				</button>
				<button class="confirm-cancel-btn" @click="backToLottery">
					取消
				</button>
			</view>
		</view>
		
		<!-- 编号选择器弹窗 -->
		<view class="number-picker-mask" v-if="showPicker" @click="hidePicker">
			<view class="number-picker-popup" @click.stop>
				<view class="picker-header">
					<text class="picker-title">选择幸运编号</text>
					<view class="picker-close" @click="hidePicker">
						<text>×</text>
					</view>
				</view>
				
				<scroll-view class="number-grid-scroll" scroll-y>
					<view class="number-grid">
						<view 
							v-for="num in 100" 
							:key="num"
							class="number-item"
							:class="{ 'selected': selectedNumber === num }"
							@click="selectNumber(num)"
						>
							<text>{{ num }}</text>
						</view>
					</view>
				</scroll-view>
				
				<view class="picker-footer">
					<button class="picker-confirm-btn" @click="confirmNumber">
						确认选择
					</button>
				</view>
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

// 当前步骤：lottery(抽奖页面) 或 confirm(确认支付页面)
const currentStep = ref('lottery')

// 预设金额选项（分）- 固定为1元
const amountOptions = ref([100])

// 选中的预设金额 - 固定为1元
const selectedAmount = ref(100)

// 自定义金额（元，字符串形式）- 不再使用
const customAmountYuan = ref('')

// 打赏留言 - 不再使用
const message = ref('')

// 选中的编号（1-100）
const selectedNumber = ref(0)

// 是否显示编号选择器
const showPicker = ref(false)

// 打赏统计
const statistics = ref({
	totalAmount: 0,
	totalCount: 0,
	userCount: 0
})

// 当前选择的金额（分）- 固定为1元
const currentAmount = computed(() => {
	return 100 // 固定1元 = 100分
})

// 是否可以打赏 - 必须选择编号
const canReward = computed(() => {
	return selectedNumber.value > 0 && selectedNumber.value <= 100
})

// 显示编号选择器
const showNumberPicker = () => {
	showPicker.value = true
}

// 隐藏编号选择器
const hidePicker = () => {
	showPicker.value = false
}

// 选择编号
const selectNumber = (num) => {
	selectedNumber.value = num
}

// 确认选择编号
const confirmNumber = () => {
	if (selectedNumber.value > 0) {
		showPicker.value = false
	} else {
		uni.showToast({
			title: '请选择一个编号',
			icon: 'none'
		})
	}
}

// 前往确认支付页面
const goToConfirm = () => {
	if (!selectedNumber.value) {
		uni.showToast({
			title: '请先选择幸运编号',
			icon: 'none'
		})
		return
	}
	currentStep.value = 'confirm'
}

// 返回抽奖页面
const backToLottery = () => {
	currentStep.value = 'lottery'
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
	
	// 重置步骤为抽奖页面
	currentStep.value = 'lottery'
	
	// 显示弹窗
	visible.value = true
}

// 关闭弹窗
const closePopup = () => {
	visible.value = false
	// 重置数据
	selectedAmount.value = 100
	customAmountYuan.value = ''
	message.value = ''
	selectedNumber.value = 0
	showPicker.value = false
	currentStep.value = 'lottery'
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
	
	// 直接提交，不再二次确认（已在确认页面确认）
	await submitReward()
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
			from_user_id: userId,  // 测试模式：直接传递用户ID
			lucky_number: selectedNumber.value  // 传递选中的幸运编号
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

// ==================== 抽奖样式界面 ====================
.lottery-popup {
	width: 650rpx;
	background: linear-gradient(135deg, #ffe8f0 0%, #ffd4e5 100%);
	border-radius: 32rpx;
	border: 4rpx solid #ffb3cc;
	padding: 60rpx 40rpx 50rpx;
	display: flex;
	flex-direction: column;
	align-items: center;
	box-shadow: 0 8rpx 32rpx rgba(255, 107, 107, 0.3);
}

.gift-icon {
	margin-bottom: 30rpx;
	
	.gift-emoji {
		font-size: 120rpx;
		line-height: 1;
	}
}

.lottery-title {
	display: flex;
	flex-direction: column;
	align-items: center;
	margin-bottom: 40rpx;
	
	.title-main {
		font-size: 52rpx;
		font-weight: bold;
		color: #333;
		margin-bottom: 16rpx;
		letter-spacing: 2rpx;
	}
	
	.title-sub {
		font-size: 28rpx;
		color: #666;
		line-height: 1.5;
	}
}

.stats-cards {
	width: 100%;
	display: flex;
	gap: 20rpx;
	margin-bottom: 50rpx;
}

.stats-card {
	flex: 1;
	background: rgba(255, 255, 255, 0.9);
	border-radius: 20rpx;
	padding: 32rpx 20rpx;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
	
	.card-label {
		font-size: 26rpx;
		color: #666;
		margin-bottom: 12rpx;
	}
	
	.card-value {
		font-size: 48rpx;
		font-weight: bold;
		line-height: 1.2;
	}
	
	.card-value-red {
		color: #ff4757;
	}
	
	.card-value-gold {
		color: #ffa502;
	}
}

.stats-card-left {
	background: linear-gradient(135deg, #fff5f5 0%, #ffe5e5 100%);
}

.stats-card-right {
	background: linear-gradient(135deg, #fffbf0 0%, #fff3d4 100%);
}

// 编号选择区域
.number-select-section {
	width: 100%;
	margin-bottom: 40rpx;
}

.number-select-title {
	display: flex;
	align-items: baseline;
	margin-bottom: 20rpx;
	
	.select-label {
		font-size: 30rpx;
		font-weight: 600;
		color: #333;
		margin-right: 8rpx;
	}
	
	.select-range {
		font-size: 24rpx;
		color: #999;
	}
}

.number-input-wrapper {
	width: 100%;
	height: 80rpx;
	background: rgba(255, 255, 255, 0.9);
	border-radius: 16rpx;
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 0 24rpx;
	box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.08);
	border: 2rpx solid rgba(255, 107, 107, 0.2);
	
	.number-display {
		font-size: 28rpx;
		color: #333;
		font-weight: 500;
		
		&.placeholder {
			color: #999;
			font-weight: 400;
		}
	}
	
	.arrow-icon {
		font-size: 20rpx;
		color: #666;
	}
}

.number-hint {
	font-size: 22rpx;
	color: #ff6b6b;
	margin-top: 12rpx;
	display: block;
}

.lottery-btn {
	width: 100%;
	height: 100rpx;
	background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%);
	border-radius: 50rpx;
	font-size: 36rpx;
	color: #fff;
	font-weight: bold;
	border: none;
	box-shadow: 0 8rpx 24rpx rgba(238, 90, 111, 0.4);
	letter-spacing: 2rpx;
	
	&.disabled {
		background: #cccccc;
		box-shadow: none;
		opacity: 0.6;
	}
	
	&::after {
		border: none;
	}
	
	&:active {
		opacity: 0.9;
		transform: scale(0.98);
	}
}

// ==================== 确认支付界面 ====================
.confirm-popup {
	width: 600rpx;
	background: #fff;
	border-radius: 32rpx;
	overflow: hidden;
	box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.15);
}

.confirm-title {
	padding: 40rpx 0;
	text-align: center;
	border-bottom: 1rpx solid #f0f0f0;
	
	text {
		font-size: 36rpx;
		font-weight: bold;
		color: #333;
	}
}

.confirm-gift-icon {
	padding: 60rpx 0 30rpx;
	text-align: center;
	
	.gift-emoji {
		font-size: 140rpx;
		line-height: 1;
	}
}

.confirm-activity {
	text-align: center;
	margin-bottom: 16rpx;
	
	text {
		font-size: 36rpx;
		font-weight: bold;
		color: #333;
	}
}

.confirm-number {
	text-align: center;
	margin-bottom: 20rpx;
	
	text {
		font-size: 28rpx;
		color: #ff6b6b;
		font-weight: 600;
		background: linear-gradient(135deg, #ffe8f0 0%, #ffd4e5 100%);
		padding: 12rpx 32rpx;
		border-radius: 20rpx;
		display: inline-block;
	}
}

.confirm-amount {
	text-align: center;
	margin-bottom: 60rpx;
	
	text {
		font-size: 72rpx;
		font-weight: bold;
		color: #ff4757;
	}
}

.confirm-buttons {
	padding: 0 40rpx 50rpx;
	display: flex;
	flex-direction: column;
	gap: 20rpx;
	
	button {
		width: 100%;
		height: 90rpx;
		border-radius: 45rpx;
		font-size: 32rpx;
		border: none;
		font-weight: 600;
		
		&::after {
			border: none;
		}
	}
}

.confirm-pay-btn {
	background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%);
	color: #fff;
	box-shadow: 0 6rpx 20rpx rgba(238, 90, 111, 0.3);
	
	&:active {
		opacity: 0.9;
	}
}

.confirm-cancel-btn {
	background: #f5f5f5;
	color: #666;
	
	&:active {
		background: #e8e8e8;
	}
}

// ==================== 编号选择器弹窗 ====================
.number-picker-mask {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(0, 0, 0, 0.6);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 10000;
}

.number-picker-popup {
	width: 660rpx;
	max-height: 80vh;
	background: #fff;
	border-radius: 24rpx;
	overflow: hidden;
	display: flex;
	flex-direction: column;
	box-shadow: 0 12rpx 48rpx rgba(0, 0, 0, 0.2);
}

.picker-header {
	padding: 32rpx 40rpx;
	border-bottom: 1rpx solid #f0f0f0;
	display: flex;
	align-items: center;
	justify-content: space-between;
	background: linear-gradient(135deg, #ffe8f0 0%, #ffd4e5 100%);
	
	.picker-title {
		font-size: 32rpx;
		font-weight: bold;
		color: #333;
	}
	
	.picker-close {
		padding: 8rpx;
		
		text {
			font-size: 48rpx;
			color: #666;
			line-height: 1;
		}
	}
}

.number-grid-scroll {
	flex: 1;
	padding: 30rpx 20rpx;
	max-height: 500rpx;
}

.number-grid {
	display: flex;
	flex-wrap: wrap;
	gap: 16rpx;
	justify-content: space-between;
}

.number-item {
	width: calc((100% - 80rpx) / 5);
	height: 80rpx;
	background: #f5f5f5;
	border-radius: 12rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	border: 2rpx solid transparent;
	transition: all 0.3s;
	
	text {
		font-size: 28rpx;
		color: #333;
		font-weight: 500;
	}
	
	&.selected {
		background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%);
		border-color: #ff6b6b;
		box-shadow: 0 4rpx 12rpx rgba(238, 90, 111, 0.3);
		
		text {
			color: #fff;
			font-weight: bold;
		}
	}
	
	&:active {
		transform: scale(0.95);
	}
}

.picker-footer {
	padding: 20rpx 40rpx 40rpx;
	border-top: 1rpx solid #f0f0f0;
}

.picker-confirm-btn {
	width: 100%;
	height: 88rpx;
	background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%);
	border-radius: 44rpx;
	font-size: 32rpx;
	color: #fff;
	font-weight: bold;
	border: none;
	box-shadow: 0 6rpx 20rpx rgba(238, 90, 111, 0.3);
	
	&::after {
		border: none;
	}
	
	&:active {
		opacity: 0.9;
	}
}
</style>
