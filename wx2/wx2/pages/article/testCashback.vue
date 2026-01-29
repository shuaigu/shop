<template>
	<view class="container">
		<view class="title">💰 商家转账测试</view>
		
		<!-- 用户信息卡片 -->
		<view class="card user-card">
			<view class="card-title">👤 用户信息</view>
			<view v-if="currentUser._id" class="user-info">
				<view class="info-item">
					<text class="label">用户ID:</text>
					<text class="value">{{ currentUser._id }}</text>
				</view>
				<view class="info-item" v-if="currentUser.nickName">
					<text class="label">昵称:</text>
					<text class="value">{{ currentUser.nickName }}</text>
				</view>
				<view class="info-item" v-if="currentUser.openid">
					<text class="label">OpenID:</text>
					<text class="value">{{ currentUser.openid }}</text>
				</view>
			</view>
			<view v-else class="no-user">
				<text>未检测到登录信息</text>
				<button class="small-btn" @click="refreshUser">刷新用户信息</button>
			</view>
		</view>
		
		<!-- 转账参数 -->
		<view class="card">
			<view class="card-title">💸 转账参数</view>
			
			<!-- 用户ID输入（可手动修改） -->
			<text class="label">用户ID（数据库_id）</text>
			<input 
				class="input" 
				v-model="userId" 
				placeholder="自动获取或手动输入"
			/>
			
			<text class="label">转账金额（元）</text>
			<input 
				class="input" 
				type="digit" 
				v-model="amount" 
				placeholder="0.10 ~ 500.00"
			/>
			<text class="hint">限额：0.10-500元，低于100元免密</text>
			
			<text class="label">转账备注</text>
			<input 
				class="input" 
				v-model="desc" 
				placeholder="砍价返现"
			/>
			
			<button 
				class="btn" 
				:class="{ disabled: testing }"
				@click="doTest"
				:disabled="testing"
			>
				{{ testing ? '转账中...' : '🚀 开始测试转账' }}
			</button>
		</view>
		
		<!-- 转账结果 -->
		<view v-if="result" class="card result-card" :class="resultClass">
			<view class="card-title">{{ resultSuccess ? '✅ 转账成功' : '❌ 转账失败' }}</view>
			<view class="result-content">
				<text class="result-text">{{ result }}</text>
			</view>
		</view>
		
		<!-- 日志 -->
		<view v-if="logs.length" class="card logs-card">
			<view class="card-title">📋 执行日志</view>
			<view class="logs">
				<text v-for="(log, i) in logs" :key="i" class="log">{{ log }}</text>
			</view>
		</view>
		
		<!-- 帮助说明 -->
		<view class="card help-card">
			<view class="card-title">❓ 使用说明</view>
			<view class="help-content">
				<text class="help-text">1. 确保已登录小程序</text>
				<text class="help-text">2. 系统会自动获取用户ID</text>
				<text class="help-text">3. 输入转账金额（建议先测试0.3元）</text>
				<text class="help-text">4. 点击"开始测试转账"按钮</text>
				<text class="help-text">5. 等待转账完成，查看微信通知</text>
				<text class="help-text">6. 如果失败，查看日志中的错误信息</text>
			</view>
		</view>
	</view>
</template>

<script setup>
import { ref, onMounted } from 'vue'

// 当前用户信息
const currentUser = ref({
	_id: '',
	nickName: '',
	openid: ''
})

// 表单数据
const userId = ref('')
const amount = ref('0.3')
const desc = ref('砍价返现测试')

// 状态
const testing = ref(false)
const result = ref('')
const resultSuccess = ref(false)
const resultClass = ref('')
const logs = ref([])

// 日志函数
const log = (msg) => {
	const time = new Date().toLocaleTimeString()
	logs.value.push(`[${time}] ${msg}`)
}

// 清空日志
const clearLogs = () => {
	logs.value = []
	result.value = ''
}

// 获取用户信息
const getUserInfo = () => {
	try {
		// 尝试从多个来源获取用户信息
		const userInfo = uni.getStorageSync('userInfo')
		const uniIdToken = uni.getStorageSync('uni_id_token')
		const uniIdTokenParsed = uni.getStorageSync('uni_id_token_expired')
		
		log('=== 查找用户信息 ===')
		log('userInfo存在: ' + (userInfo ? '是' : '否'))
		
		if (userInfo) {
			log('userInfo完整内容:')
			log(JSON.stringify(userInfo, null, 2))
			
			// 提取各个字段
			const extracted_id = userInfo._id
			const extracted_uid = userInfo.uid  
			const extracted_id_str = userInfo.id
			const extracted_dcloud_appid = userInfo.dcloud_appid
			const extracted_openid = userInfo.wx_openid?.[0]
			
			log('--- 提取的字段（查找数据库ID） ---')
			log('userInfo._id: ' + extracted_id)
			log('userInfo.uid: ' + extracted_uid)
			log('userInfo.id: ' + extracted_id_str)
			log('userInfo.dcloud_appid: ' + JSON.stringify(extracted_dcloud_appid))
			log('nickName: ' + (userInfo.nickName || userInfo.nickname))
			log('wx_openid[0]: ' + extracted_openid)
			
			// 🔑 正确的数据库_id: 67b0b5993f1a473be2a16789
			// 需要找到userInfo中哪个字段存储的是这个值
			
			// 检查所有可能的字段
			log('--- 匹配数据库ID ---')
			const correctDbId = '67b0b5993f1a473be2a16789'
			
			let finalUserId = ''
			let matchedField = ''
			
			// 检查各个字段
			if (extracted_id === correctDbId) {
				finalUserId = extracted_id
				matchedField = '_id'
			} else if (extracted_uid === correctDbId) {
				finalUserId = extracted_uid
				matchedField = 'uid'
			} else if (extracted_id_str === correctDbId) {
				finalUserId = extracted_id_str
				matchedField = 'id'
			} else if (Array.isArray(extracted_dcloud_appid) && extracted_dcloud_appid.includes(correctDbId)) {
				finalUserId = correctDbId
				matchedField = 'dcloud_appid[x]'
			} else {
				// 如果都不匹配，尝试使用_id
				finalUserId = extracted_id || extracted_uid || extracted_id_str || correctDbId
				matchedField = '未找到匹配，使用默认'
			}
			
			log('匹配字段: ' + matchedField)
			log('最终用户ID: ' + finalUserId)
			
			currentUser.value = {
				_id: finalUserId,
				uid: extracted_uid,
				nickName: userInfo.nickName || userInfo.nickname || '',
				openid: extracted_openid || ''
			}
			
			userId.value = finalUserId
			
			log('--- 最终使用 ---')
			log('用户ID: ' + finalUserId)
			log('===================')
			
			return true
		} else {
			log('❌ 未找到userInfo，请先登录')
			return false
		}
	} catch (err) {
		log('❌ 获取用户信息异常: ' + err.message)
		return false
	}
}

// 刷新用户信息
const refreshUser = () => {
	clearLogs()
	log('刷新用户信息...')
	getUserInfo()
}

// 测试转账
const doTest = async () => {
	try {
		clearLogs()
		testing.value = true
		resultSuccess.value = false
		resultClass.value = ''
		
		log('=== 开始商家转账测试 ===')
		
		// 1. 验证用户ID
		if (!userId.value || userId.value.trim() === '') {
			result.value = '❌ 用户ID不能为空\n\n请先登录或手动输入用户ID'
			resultClass.value = 'error'
			log('❌ 用户ID为空')
			uni.showToast({ title: '用户ID不能为空', icon: 'none' })
			testing.value = false
			return
		}
		
		log('✓ 用户ID: ' + userId.value)
		
		// 2. 验证金额
		const amt = parseFloat(amount.value)
		if (isNaN(amt) || amt < 0.1 || amt > 500) {
			result.value = '❌ 金额必须在 0.10-500.00 元之间'
			resultClass.value = 'error'
			log('❌ 金额不合法: ' + amount.value)
			uni.showToast({ title: '金额不合法', icon: 'none' })
			testing.value = false
			return
		}
		
		log('✓ 转账金额: ¥' + amt.toFixed(2))
		log('✓ 转账备注: ' + desc.value)
		
		// 3. 调用云函数
		log('→ 正在调用云函数...')
		uni.showLoading({ title: '转账中...' })
		
		const startTime = Date.now()
		const api = uniCloud.importObject('articleWx')
		
		const res = await api.testCashbackTransfer({
			user_id: userId.value,
			amount: amt,
			desc: desc.value
		})
		
		const duration = Date.now() - startTime
		uni.hideLoading()
		
		log('← 云函数返回 (耗时: ' + duration + 'ms)')
		log('返回数据: ' + JSON.stringify(res, null, 2))
		
		// 4. 处理结果
		if (res.errCode === 0) {
			// 成功
			resultSuccess.value = true
			resultClass.value = 'success'
			
			const data = res.data || {}
			result.value = `转账成功！\n\n` +
				`批次单号: ${data.transaction_id || '无'}\n` +
				`转账金额: ¥${amt.toFixed(2)}\n` +
				`处理耗时: ${data.process_time || duration + 'ms'}\n` +
				`用户OpenID: ${data.openid || '***'}\n\n` +
				`请查看微信是否收到转账通知`
			
			log('✅ 转账成功!')
			log('   批次单号: ' + (data.transaction_id || '无'))
			log('   处理耗时: ' + (data.process_time || duration + 'ms'))
			
			uni.showToast({ 
				title: '转账成功', 
				icon: 'success',
				duration: 2000
			})
			
		} else {
			// 失败
			resultSuccess.value = false
			resultClass.value = 'error'
			
			result.value = `转账失败\n\n` +
				`错误信息: ${res.errMsg || '未知错误'}\n` +
				`错误代码: ${res.errCode}\n\n` +
				`请查看下方日志了解详情`
			
			log('❌ 转账失败: ' + res.errMsg)
			
			uni.showToast({ 
				title: res.errMsg || '转账失败', 
				icon: 'none',
				duration: 3000
			})
		}
		
	} catch (err) {
		uni.hideLoading()
		
		resultSuccess.value = false
		resultClass.value = 'error'
		
		result.value = `系统异常\n\n` +
			`错误信息: ${err.message}\n` +
			`错误类型: ${err.errCode || '未知'}\n\n` +
			`请检查:\n` +
			`1. 云函数是否已上传\n` +
			`2. 网络连接是否正常\n` +
			`3. 配置参数是否正确`
		
		log('❌ 系统异常: ' + err.message)
		log('   错误详情: ' + JSON.stringify(err))
		
		uni.showToast({ 
			title: '系统异常: ' + err.message, 
			icon: 'none',
			duration: 3000
		})
		
	} finally {
		testing.value = false
		log('=== 测试结束 ===')
	}
}

// 页面加载时获取用户信息
onMounted(() => {
	log('页面加载...')
	getUserInfo()
})
</script>

<style scoped>
.container {
	padding: 30rpx;
	background: #f5f7fa;
	min-height: 100vh;
}

.title {
	font-size: 44rpx;
	font-weight: bold;
	text-align: center;
	margin-bottom: 30rpx;
	color: #333;
}

.card {
	background: #fff;
	border-radius: 16rpx;
	padding: 30rpx;
	margin-bottom: 20rpx;
	box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.05);
}

.card-title {
	font-size: 32rpx;
	font-weight: bold;
	color: #333;
	margin-bottom: 20rpx;
	padding-bottom: 15rpx;
	border-bottom: 2rpx solid #f0f0f0;
}

/* 用户信息卡片 */
.user-card {
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.user-card .card-title {
	color: #fff;
	border-bottom-color: rgba(255,255,255,0.2);
}

.user-info {
	color: #fff;
}

.info-item {
	display: flex;
	align-items: center;
	margin-bottom: 15rpx;
	font-size: 26rpx;
}

.info-item .label {
	width: 160rpx;
	opacity: 0.8;
}

.info-item .value {
	flex: 1;
	word-break: break-all;
	font-weight: 500;
}

.no-user {
	text-align: center;
	color: #fff;
	padding: 20rpx 0;
}

.small-btn {
	margin-top: 20rpx;
	padding: 10rpx 30rpx;
	background: rgba(255,255,255,0.2);
	color: #fff;
	border: 1rpx solid rgba(255,255,255,0.3);
	border-radius: 20rpx;
	font-size: 26rpx;
}

/* 表单 */
.label {
	display: block;
	font-size: 28rpx;
	color: #666;
	margin-bottom: 10rpx;
	margin-top: 20rpx;
}

.input {
	width: 100%;
	height: 80rpx;
	background: #f8f8f8;
	border-radius: 10rpx;
	padding: 0 20rpx;
	font-size: 28rpx;
	border: 2rpx solid #e0e0e0;
	box-sizing: border-box;
}

.hint {
	display: block;
	font-size: 24rpx;
	color: #999;
	margin-top: 10rpx;
}

.btn {
	width: 100%;
	height: 88rpx;
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	color: #fff;
	border-radius: 44rpx;
	font-size: 32rpx;
	font-weight: bold;
	margin-top: 40rpx;
	border: none;
	box-shadow: 0 4rpx 12rpx rgba(102, 126, 234, 0.4);
}

.btn.disabled {
	opacity: 0.6;
	box-shadow: none;
}

/* 结果卡片 */
.result-card {
	border: 2rpx solid #e0e0e0;
}

.result-card.success {
	background: #f0f9ff;
	border-color: #67c23a;
}

.result-card.success .card-title {
	color: #67c23a;
}

.result-card.error {
	background: #fef0f0;
	border-color: #f56c6c;
}

.result-card.error .card-title {
	color: #f56c6c;
}

.result-content {
	padding: 20rpx 0;
}

.result-text {
	font-size: 28rpx;
	color: #333;
	line-height: 44rpx;
	white-space: pre-wrap;
	word-break: break-all;
}

/* 日志卡片 */
.logs-card {
	background: #2d3748;
}

.logs-card .card-title {
	color: #fff;
	border-bottom-color: rgba(255,255,255,0.1);
}

.logs {
	max-height: 800rpx;
	overflow-y: auto;
}

.log {
	display: block;
	font-size: 24rpx;
	color: #a0aec0;
	line-height: 40rpx;
	font-family: 'Courier New', monospace;
	padding: 5rpx 0;
	word-break: break-all;
}

/* 帮助卡片 */
.help-card {
	background: #fffbf0;
	border: 2rpx solid #ffe58f;
}

.help-card .card-title {
	color: #faad14;
}

.help-content {
	padding: 10rpx 0;
}

.help-text {
	display: block;
	font-size: 26rpx;
	color: #666;
	line-height: 40rpx;
	margin-bottom: 10rpx;
}
</style>
