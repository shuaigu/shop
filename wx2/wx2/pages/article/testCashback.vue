<template>
	<view class="container">
		<view class="title">💰 商家转账测试</view>
		
		<view class="card">
			<text class="label">转账金额（元）</text>
			<input 
				class="input" 
				type="digit" 
				v-model="amount" 
				placeholder="0.3"
			/>
			
			<text class="label">转账备注</text>
			<input 
				class="input" 
				v-model="desc" 
				placeholder="测试转账"
			/>
			
			<button 
				class="btn" 
				@click="doTest"
			>
				{{ testing ? '转账中...' : '测试转账' }}
			</button>
		</view>
		
		<view v-if="result" class="result">
			<text>{{ result }}</text>
		</view>
		
		<view v-if="logs.length" class="logs">
			<text v-for="(log, i) in logs" :key="i" class="log">{{ log }}</text>
		</view>
	</view>
</template>

<script setup>
import { ref } from 'vue'

const amount = ref('0.3')
const desc = ref('测试转账')
const testing = ref(false)
const result = ref('')
const logs = ref([])

const log = (msg) => {
	logs.value.push(`[${new Date().toLocaleTimeString()}] ${msg}`)
}

const doTest = async () => {
	try {
		result.value = ''
		logs.value = []
		testing.value = true
		
		log('开始测试')
		
		const amt = parseFloat(amount.value)
		if (isNaN(amt) || amt < 0.1) {
			result.value = '金额必须 >= 0.1元'
			testing.value = false
			return
		}
		
		log(`金额: ${amt}`)
		log('调用云函数...')
		
		uni.showLoading({ title: '转账中...' })
		
		const api = uniCloud.importObject('articleWx')
		const res = await api.testCashbackTransfer({
			amount: amt,
			desc: desc.value
		})
		
		uni.hideLoading()
		
		log('调用完成')
		
		if (res.errCode === 0) {
			result.value = '✅ 转账成功！\n' + JSON.stringify(res.data, null, 2)
			uni.showToast({ title: '转账成功', icon: 'success' })
		} else {
			result.value = '❌ 转账失败: ' + res.errMsg
			uni.showToast({ title: res.errMsg, icon: 'none' })
		}
		
	} catch (err) {
		uni.hideLoading()
		log('异常: ' + err.message)
		result.value = '❌ 异常: ' + err.message
		uni.showToast({ title: err.message, icon: 'none' })
	} finally {
		testing.value = false
	}
}
</script>

<style scoped>
.container {
	padding: 30rpx;
	background: #f5f5f5;
	min-height: 100vh;
}

.title {
	font-size: 40rpx;
	font-weight: bold;
	text-align: center;
	margin-bottom: 30rpx;
	color: #333;
}

.card {
	background: #fff;
	border-radius: 20rpx;
	padding: 30rpx;
	margin-bottom: 20rpx;
}

.label {
	display: block;
	font-size: 28rpx;
	color: #666;
	margin-bottom: 10rpx;
	margin-top: 20rpx;
}

.input {
	width: 100%;
	height: 70rpx;
	background: #f8f8f8;
	border-radius: 10rpx;
	padding: 0 20rpx;
	font-size: 28rpx;
	border: 1rpx solid #e0e0e0;
}

.btn {
	width: 100%;
	height: 80rpx;
	background: #667eea;
	color: #fff;
	border-radius: 40rpx;
	font-size: 30rpx;
	margin-top: 30rpx;
	line-height: 80rpx;
}

.result {
	background: #fff;
	border-radius: 20rpx;
	padding: 30rpx;
	margin-bottom: 20rpx;
}

.result text {
	font-size: 26rpx;
	color: #333;
	white-space: pre-wrap;
	word-break: break-all;
}

.logs {
	background: #2d3748;
	border-radius: 20rpx;
	padding: 20rpx;
}

.log {
	display: block;
	font-size: 24rpx;
	color: #a0aec0;
	line-height: 40rpx;
	font-family: monospace;
}
</style>
