<template>
	<view class="login-container">
		<view class="logo-section">
			<view class="logo-placeholder">
				<text class="logo-text">🛋️</text>
			</view>
			<text class="app-name">Shop1</text>
		</view>
		
		<view class="form-section">
			<view class="social-login">
				<button class="wx-login-btn" @click="handleWxLogin">
					👋 微信一键登录
				</button>
			</view>
		</view>
		
		<view class="agreement">
			<checkbox-group @change="agreementChange">
				<label class="checkbox-label">
					<checkbox value="agree" :checked="isAgree" style="transform:scale(0.7)" color="#399bfe" />
					<text class="agreement-text">我已阅读并同意<text class="blue">《用户协议》</text>和<text class="blue">《隐私政策》</text></text>
				</label>
			</checkbox-group>
		</view>
	</view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useUserInfoStore } from '@/store/user.js'
import { onLoad } from '@dcloudio/uni-app'

const userStore = useUserInfoStore()
const isAgree = ref(false)
const loading = ref(false)
const redirectUrl = ref('') // 登录后跳转的页面

// 获取跳转参数
onLoad((options) => {
	if (options.redirect) {
		redirectUrl.value = decodeURIComponent(options.redirect)
		console.log('登录后将跳转到:', redirectUrl.value)
	}
})

const agreementChange = (e) => {
	isAgree.value = e.detail.value.length > 0
}

const handleWxLogin = async () => {
	if (!isAgree.value) {
		return uni.showToast({ title: '请先阅读并同意协议', icon: 'none' })
	}
	
	loading.value = true
	try {
		// 1. 获取微信code
		console.log('开始调用 wx.login...')
		const loginRes = await uni.login({ provider: 'weixin' })
		
		if (!loginRes || !loginRes.code) {
			console.error('wx.login 失败:', loginRes)
			uni.showModal({
				title: '登录失败',
				content: '获取微信授权失败，请检查：\n1. 是否在微信开发者工具中\n2. 是否配置了正确的 AppID\n3. 是否开启了“不校验合法域名”',
				showCancel: false
			})
			return
		}
		
		console.log('获取到 code:', loginRes.code)
		
		// 2. 调用PHP后端登录接口
		console.log('开始调用后端登录接口...')
		const res = await uni.request({
			url: 'https://shop.jingle0350.cn/shop1/php1/api.php?path=wx-login',
			method: 'POST',
			data: {
				code: loginRes.code
			}
		})
		
		console.log('后端登录响应:', res.data)
		
		if (res.data && res.data.success) {
			const loginData = res.data.data
			const userData = loginData.userInfo
			
			// 保存用户信息，包括openid
			userStore.setUserInfo({
				uid: userData._id,
				nickName: userData.nickName || '微信用户',
				avatarUrl: userData.avatarUrl || '/static/images/touxiang.png',
				mobile: userData.mobile || '138****8888',
				openid: userData.openid, // 保存openid用于支付
				isLogin: true,
				token: loginData.token,
				role: userData.role || ['user']
			})
			
			console.log('用户信息已保存:', userStore.userInfo)
			
			uni.showToast({ title: '登录成功', icon: 'success' })
			setTimeout(() => {
				// 如果有跳转地址，则跳转到指定页面
				if (redirectUrl.value) {
					uni.redirectTo({ url: redirectUrl.value })
				} else {
					// 否则跳转到首页
					uni.switchTab({ url: '/pages/index/index' })
				}
			}, 1000)
		} else {
			const errorMsg = res.data.message || '登录失败'
			console.error('登录失败:', errorMsg)
			uni.showToast({ title: errorMsg, icon: 'none', duration: 3000 })
		}
	} catch (e) {
		console.error('登录异常:', e)
		uni.showModal({
			title: '登录失败',
			content: '登录过程出现异常：' + (e.errMsg || e.message || JSON.stringify(e)),
			showCancel: false
		})
	} finally {
		loading.value = false
	}
}
</script>

<style>
.login-container {
	padding: 60rpx;
	background-color: #ffffff;
	min-height: 100vh;
	display: flex;
	flex-direction: column;
}

.logo-section {
	display: flex;
	flex-direction: column;
	align-items: center;
	margin-top: 100rpx;
	margin-bottom: 100rpx;
}

.logo-placeholder {
	width: 160rpx;
	height: 160rpx;
	border-radius: 30rpx;
	margin-bottom: 20rpx;
	background: linear-gradient(135deg, #46b0fe, #6385ff);
	display: flex;
	align-items: center;
	justify-content: center;
}

.logo-text {
	font-size: 80rpx;
}

.app-name {
	font-size: 40rpx;
	font-weight: bold;
	color: #333;
	letter-spacing: 4rpx;
}

.form-section {
	flex: 1;
	display: flex;
	flex-direction: column;
	justify-content: center;
}

.social-login {
	margin-top: 80rpx;
}

.wx-login-btn {
	width: 100%;
	height: 94rpx;
	line-height: 94rpx;
	background: linear-gradient(to right, #46b0fe, #6385ff);
	color: #ffffff;
	font-size: 34rpx;
	border-radius: 47rpx;
	box-shadow: 0 10rpx 20rpx rgba(70, 176, 254, 0.3);
	border: none;
}

.agreement {
	margin-bottom: 60rpx;
	display: flex;
	justify-content: center;
}

.checkbox-label {
	display: flex;
	align-items: center;
}

.agreement-text {
	font-size: 24rpx;
	color: #999;
}

.blue {
	color: #399bfe;
}
</style>

<style>
	.login-container {
		padding: 60rpx;
		background-color: #ffffff;
		min-height: 100vh;
		display: flex;
		flex-direction: column;
	}
	
	.logo-section {
		display: flex;
		flex-direction: column;
		align-items: center;
		margin-top: 100rpx;
		margin-bottom: 100rpx;
	}
	
	.logo-placeholder {
		width: 160rpx;
		height: 160rpx;
		border-radius: 30rpx;
		margin-bottom: 20rpx;
		background: linear-gradient(135deg, #007AFF, #00aaff);
		display: flex;
		align-items: center;
		justify-content: center;
	}
	
	.logo-text {
		font-size: 80rpx;
	}
	
	.logo {
		width: 160rpx;
		height: 160rpx;
		border-radius: 30rpx;
		margin-bottom: 20rpx;
		background-color: #f0f0f0; /* 占位色 */
	}
	
	.app-name {
		font-size: 40rpx;
		font-weight: bold;
		color: #333;
		letter-spacing: 4rpx;
	}
	
	.form-section {
		flex: 1;
	}
	
	.input-group {
		display: flex;
		align-items: center;
		height: 110rpx;
		border-bottom: 1px solid #eeeeee;
		margin-bottom: 40rpx;
		padding: 0 10rpx;
	}
	
	.input {
		flex: 1;
		height: 80rpx;
		font-size: 32rpx;
		color: #333;
	}
	
	.eye-toggle {
		padding: 0 20rpx;
		font-size: 40rpx;
	}
	
	.login-btn {
		width: 100%;
		height: 94rpx;
		line-height: 94rpx;
		background: linear-gradient(to right, #007AFF, #00aaff);
		color: #ffffff;
		font-size: 34rpx;
		border-radius: 47rpx;
		margin-top: 60rpx;
		box-shadow: 0 10rpx 20rpx rgba(0, 122, 255, 0.2);
	}
	
	.action-footer {
		display: flex;
		justify-content: center;
		align-items: center;
		margin-top: 40rpx;
	}
	
	.link {
		font-size: 28rpx;
		color: #666;
	}
	
	.sep {
		margin: 0 30rpx;
		color: #eee;
	}

	.social-login {
		margin-top: 80rpx;
	}

	.divider {
		display: flex;
		align-items: center;
		justify-content: center;
		margin-bottom: 40rpx;
	}

	.divider::before,
	.divider::after {
		content: '';
		flex: 1;
		height: 1px;
		background-color: #eee;
	}

	.divider-text {
		padding: 0 20rpx;
		font-size: 24rpx;
		color: #999;
	}

	.login-options {
		display: flex;
		justify-content: center;
	}

	.wx-login-item {
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.wx-text {
		width: 80rpx;
		height: 80rpx;
		background-color: #07c160;
		color: #fff;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 24rpx;
		margin-bottom: 10rpx;
	}

	.wx-label {
		font-size: 24rpx;
		color: #666;
	}
	
	.agreement {
		margin-bottom: 60rpx;
		display: flex;
		justify-content: center;
	}
	
	.checkbox-label {
		display: flex;
		align-items: center;
	}
	
	.agreement-text {
		font-size: 24rpx;
		color: #999;
	}
	
	.blue {
		color: #007AFF;
	}
</style>
