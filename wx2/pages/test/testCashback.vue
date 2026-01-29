<template>
	<view class="test-page">
		<view class="header">
			<text class="title">💰 商家转账测试</text>
		</view>
		
		<view class="test-section">
			<view class="section-title">测试参数</view>
			
			<view class="form-item">
				<text class="label">转账金额（元）：</text>
				<input 
					class="input" 
					type="digit" 
					v-model="testAmount" 
					placeholder="输入金额，如：0.3"
				/>
			</view>
			
			<view class="form-item">
				<text class="label">转账备注：</text>
				<input 
					class="input" 
					v-model="testDesc" 
					placeholder="砍价返现测试"
				/>
			</view>
			
			<view class="info-box">
				<text class="info-text">📝 说明：</text>
				<text class="info-text">• 将转账到当前登录用户的微信零钱</text>
				<text class="info-text">• 用户必须已完成微信实名认证</text>
				<text class="info-text">• 金额范围：0.10元 - 500元</text>
				<text class="info-text">• 测试前请确保商户余额充足</text>
			</view>
		</view>
		
		<view class="button-section">
			<button 
				class="test-button" 
				:disabled="testing"
				@click="handleTestTransfer"
			>
				{{ testing ? '转账中...' : '🚀 立即测试转账' }}
			</button>
		</view>
		
		<view class="result-section" v-if="testResult">
			<view class="section-title">测试结果</view>
			<view 
				class="result-box" 
				:class="testResult.success ? 'success' : 'error'"
			>
				<text class="result-icon">{{ testResult.success ? '✅' : '❌' }}</text>
				<text class="result-text">{{ testResult.message }}</text>
				
				<view v-if="testResult.success && testResult.data" class="result-detail">
					<text class="detail-item">交易单号：{{ testResult.data.transaction_id || '-' }}</text>
					<text class="detail-item">转账金额：¥{{ testResult.data.amount || testAmount }}</text>
					<text class="detail-item">处理时间：{{ testResult.data.process_time || '-' }}</text>
				</view>
				
				<view v-if="!testResult.success && testResult.error" class="error-detail">
					<text class="error-text">{{ testResult.error }}</text>
				</view>
			</view>
		</view>
		
		<view class="log-section" v-if="logs.length > 0">
			<view class="section-title">执行日志</view>
			<view class="log-box">
				<text 
					v-for="(log, index) in logs" 
					:key="index" 
					class="log-item"
				>{{ log }}</text>
			</view>
		</view>
	</view>
</template>

<script setup>
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'

const testAmount = ref('0.3')
const testDesc = ref('砍价返现测试')
const testing = ref(false)
const testResult = ref(null)
const logs = ref([])

const addLog = (message) => {
	const timestamp = new Date().toLocaleTimeString()
	logs.value.push(`[${timestamp}] ${message}`)
}

const handleTestTransfer = async () => {
	try {
		// 清空之前的结果
		testResult.value = null
		logs.value = []
		
		// 验证金额
		const amount = parseFloat(testAmount.value)
		if (isNaN(amount) || amount < 0.1 || amount > 500) {
			uni.showToast({
				title: '金额范围：0.10-500元',
				icon: 'none'
			})
			return
		}
		
		testing.value = true
		addLog('开始测试转账...')
		
		uni.showLoading({
			title: '转账中...',
			mask: true
		})
		
		addLog(`转账金额：¥${amount}`)
		addLog(`转账备注：${testDesc.value}`)
		
		// 调用云函数测试转账
		const articleWx = uniCloud.importObject('articleWx')
		addLog('正在调用云函数...')
		
		const result = await articleWx.testCashbackTransfer({
			amount: amount,
			desc: testDesc.value || '砍价返现测试'
		})
		
		addLog('云函数调用完成')
		
		uni.hideLoading()
		
		if (result.errCode === 0) {
			addLog('✅ 转账成功！')
			testResult.value = {
				success: true,
				message: '转账成功！请查看微信零钱',
				data: result.data
			}
			
			uni.showModal({
				title: '转账成功！',
				content: `已向您的微信零钱转账 ¥${amount}\n\n请打开微信查看到账通知`,
				showCancel: false,
				confirmText: '我知道了'
			})
		} else {
			addLog(`❌ 转账失败：${result.errMsg}`)
			testResult.value = {
				success: false,
				message: '转账失败',
				error: result.errMsg
			}
			
			uni.showModal({
				title: '转账失败',
				content: result.errMsg,
				showCancel: false,
				confirmText: '我知道了'
			})
		}
		
	} catch (err) {
		console.error('测试转账失败:', err)
		addLog(`❌ 异常：${err.message}`)
		
		uni.hideLoading()
		
		testResult.value = {
			success: false,
			message: '测试失败',
			error: err.message
		}
		
		uni.showToast({
			title: '测试失败：' + err.message,
			icon: 'none',
			duration: 3000
		})
	} finally {
		testing.value = false
	}
}

onLoad(() => {
	addLog('测试页面加载完成')
	addLog('请输入测试金额并点击测试按钮')
})
</script>

<style scoped>
.test-page {
	min-height: 100vh;
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	padding: 40rpx 30rpx;
}

.header {
	text-align: center;
	margin-bottom: 60rpx;
}

.title {
	font-size: 48rpx;
	font-weight: bold;
	color: #fff;
	text-shadow: 2rpx 2rpx 4rpx rgba(0, 0, 0, 0.2);
}

.test-section {
	background: #fff;
	border-radius: 20rpx;
	padding: 40rpx;
	margin-bottom: 30rpx;
	box-shadow: 0 10rpx 30rpx rgba(0, 0, 0, 0.1);
}

.section-title {
	font-size: 32rpx;
	font-weight: bold;
	color: #333;
	margin-bottom: 30rpx;
}

.form-item {
	margin-bottom: 30rpx;
}

.label {
	display: block;
	font-size: 28rpx;
	color: #666;
	margin-bottom: 15rpx;
}

.input {
	width: 100%;
	height: 80rpx;
	background: #f5f5f5;
	border-radius: 10rpx;
	padding: 0 20rpx;
	font-size: 30rpx;
	box-sizing: border-box;
}

.info-box {
	background: #f0f9ff;
	border-left: 4rpx solid #3b82f6;
	padding: 20rpx;
	margin-top: 30rpx;
	border-radius: 10rpx;
}

.info-text {
	display: block;
	font-size: 24rpx;
	color: #1e40af;
	line-height: 40rpx;
}

.button-section {
	margin-bottom: 30rpx;
}

.test-button {
	width: 100%;
	height: 90rpx;
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	color: #fff;
	border-radius: 45rpx;
	font-size: 32rpx;
	font-weight: bold;
	border: none;
	box-shadow: 0 10rpx 30rpx rgba(102, 126, 234, 0.4);
}

.test-button[disabled] {
	opacity: 0.6;
}

.result-section {
	background: #fff;
	border-radius: 20rpx;
	padding: 40rpx;
	margin-bottom: 30rpx;
	box-shadow: 0 10rpx 30rpx rgba(0, 0, 0, 0.1);
}

.result-box {
	padding: 30rpx;
	border-radius: 15rpx;
	border: 2rpx solid #e5e7eb;
}

.result-box.success {
	background: #f0fdf4;
	border-color: #22c55e;
}

.result-box.error {
	background: #fef2f2;
	border-color: #ef4444;
}

.result-icon {
	font-size: 40rpx;
	margin-right: 15rpx;
}

.result-text {
	font-size: 30rpx;
	font-weight: bold;
	color: #333;
}

.result-detail {
	margin-top: 20rpx;
	padding-top: 20rpx;
	border-top: 1rpx solid #e5e7eb;
}

.detail-item {
	display: block;
	font-size: 26rpx;
	color: #666;
	line-height: 40rpx;
}

.error-detail {
	margin-top: 15rpx;
}

.error-text {
	display: block;
	font-size: 24rpx;
	color: #dc2626;
	line-height: 36rpx;
}

.log-section {
	background: #1f2937;
	border-radius: 20rpx;
	padding: 40rpx;
	box-shadow: 0 10rpx 30rpx rgba(0, 0, 0, 0.2);
}

.log-box {
	max-height: 400rpx;
	overflow-y: auto;
}

.log-item {
	display: block;
	font-size: 24rpx;
	color: #9ca3af;
	font-family: 'Courier New', monospace;
	line-height: 40rpx;
	margin-bottom: 10rpx;
}
</style>
