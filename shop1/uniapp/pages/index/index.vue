<template>
	<view class="index">
		<view class="header">
			<text class="title">首页</text>
		</view>
		
		<view class="content">
			<view class="article-list">
				<view class="article-item" v-for="item in articleList" :key="item.id">
					<view class="article-title">{{ item.title }}</view>
					<view class="article-content">{{ item.content }}</view>
					<view class="article-author">作者：{{ item.author }}</view>
				</view>
			</view>
			
			<view class="tips" v-if="!userStore.userInfo.isLogin">
				<button @click="goLogin">请先登录</button>
			</view>
			
			<!-- 支付按钮 -->
			<view class="pay-section">
				<button class="pay-btn" @click="handlePay" :disabled="payLoading">
					{{ payLoading ? '支付中...' : '立即支付' }}
				</button>
			</view>
		</view>
	</view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useUserInfoStore } from '@/store/user.js'
import { testLogin } from '@/utils/isLogin'
import { onPullDownRefresh, onShow } from '@dcloudio/uni-app'

const userStore = useUserInfoStore()

// 文章列表
const articleList = ref([])
const loading = ref(false)
const pageNo = ref(1)
const pageSize = 10

// 支付相关
const payLoading = ref(false)

// 加载文章列表（调用PHP后端）
const loadArticles = async () => {
	if (loading.value) return
	
	loading.value = true
	try {
		const res = await uni.request({
			url: 'https://shop.jingle0350.cn/shop1/php1/api.php?path=articles',
			method: 'GET',
			data: {
				page: pageNo.value,
				pageSize: pageSize
			}
		})
		
		if (res.data && res.data.code === 0) {
			articleList.value = res.data.data || []
		} else {
			console.error('获取文章失败:', res.data)
			uni.showToast({ title: res.data.message || '加载失败', icon: 'none' })
		}
	} catch (err) {
		console.error('加载文章失败:', err)
		uni.showToast({ title: '加载失败', icon: 'none' })
	} finally {
		loading.value = false
	}
}

onMounted(() => {
	console.log('首页加载')
	loadArticles()
})

onPullDownRefresh(async () => {
	pageNo.value = 1
	await loadArticles()
	uni.stopPullDownRefresh()
})

// 跳转到登录页
const goLogin = () => {
	uni.navigateTo({ url: '/pages/login/login' })
}

// 处理支付
const handlePay = async () => {
	// 检查登录状态
	if (!userStore.userInfo.isLogin || !userStore.userInfo.uid) {
		// 未登录，弹出登录提示
		uni.showModal({
			title: '提示',
			content: '请先登录后再进行支付',
			confirmText: '去登录',
			cancelText: '取消',
			success: (res) => {
				if (res.confirm) {
					goLogin()
				}
			}
		})
		return
	}
	
	payLoading.value = true
	
	try {
		// 生成订单号
		const out_trade_no = 'ORDER_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
		
		// 获取用户openid
		const openid = userStore.userInfo.openid
		
		if (!openid) {
			uni.showModal({
				title: '提示',
				content: '用户信息异常，请重新登录',
				confirmText: '重新登录',
				success: (res) => {
					if (res.confirm) {
						// 清除旧的登录信息
						userStore.cleanUserInfo()
						uni.removeStorageSync('userInfo')
						goLogin()
					}
				}
			})
			return
		}
		
		// 调用云函数生成支付参数
		const wxpay = uniCloud.importObject('wxpay')
		const payResult = await wxpay.wxpay({
			openid: openid,
			out_trade_no: out_trade_no,
			total_fee: 1 // 金额（分），这里设置为0.01元作为测试
		})
		
		console.log('支付参数:', payResult)
		
		// 调用微信支付
		uni.requestPayment({
			provider: 'wxpay',
			timeStamp: payResult.timeStamp,
			nonceStr: payResult.nonceStr,
			package: payResult.package,
			signType: payResult.signType,
			paySign: payResult.paySign,
			success: (res) => {
				console.log('支付成功:', res)
				uni.showToast({ title: '保存成功', icon: 'success' })
				// 这里可以进行后续业务处理
			},
			fail: (err) => {
				console.error('支付失败:', err)
				if (err.errMsg.includes('cancel')) {
					uni.showToast({ title: '取消支付', icon: 'none' })
				} else {
					uni.showToast({ title: '支付失败', icon: 'none' })
				}
			}
		})
		
	} catch (err) {
		console.error('支付错误:', err)
		uni.showToast({ title: err.message || '支付异常', icon: 'none' })
	} finally {
		payLoading.value = false
	}
}
</script>

<style>
.index {
	min-height: 100vh;
	background-color: #f5f5f5;
}

.header {
	padding: 30rpx;
	background: linear-gradient(135deg, #46b0fe, #6385ff);
	color: #fff;
}

.header .title {
	font-size: 40rpx;
	font-weight: bold;
}

.content {
	padding: 30rpx;
}

.article-list {
	margin-bottom: 30rpx;
}

.article-item {
	background: #fff;
	padding: 30rpx;
	border-radius: 16rpx;
	margin-bottom: 20rpx;
	box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.05);
}

.article-title {
	font-size: 32rpx;
	font-weight: bold;
	color: #333;
	margin-bottom: 20rpx;
}

.article-content {
	font-size: 28rpx;
	color: #666;
	margin-bottom: 20rpx;
}

.article-author {
	font-size: 24rpx;
	color: #999;
}

.tips {
	text-align: center;
	padding: 40rpx 0;
}

.tips button {
	background: linear-gradient(135deg, #46b0fe, #6385ff);
	color: #fff;
	border: none;
	padding: 20rpx 60rpx;
	border-radius: 40rpx;
}

/* 支付按钮样式 */
.pay-section {
	margin-top: 40rpx;
	padding: 20rpx;
}

.pay-btn {
	width: 100%;
	background: linear-gradient(135deg, #ff6b6b, #ff8e53);
	color: #fff;
	font-size: 32rpx;
	font-weight: bold;
	border: none;
	padding: 30rpx 0;
	border-radius: 50rpx;
	box-shadow: 0 8rpx 20rpx rgba(255, 107, 107, 0.3);
}

.pay-btn[disabled] {
	opacity: 0.6;
	background: linear-gradient(135deg, #ccc, #999);
}
</style>
