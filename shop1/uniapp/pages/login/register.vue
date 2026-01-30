<template>
	<view class="login-container">
		<view class="back-btn" @click="goBack">
			<text class="iconfont icon-back">返回</text>
		</view>
		
		<view class="logo-section">
			<text class="app-name">创建账号</text>
			<text class="sub-title">加入我们的聊天社区</text>
		</view>
		
		<view class="form-section">
			<view class="input-group">
				<input class="input" v-model="username" placeholder="设置用户名 (3-20位)" placeholder-style="color:#999" />
			</view>
			
			<view class="input-group">
				<input class="input" v-model="nickname" placeholder="设置昵称" placeholder-style="color:#999" />
			</view>
			
			<view class="input-group">
				<input class="input" v-model="password" password placeholder="设置密码 (至少6位)" placeholder-style="color:#999" />
			</view>
			
			<view class="input-group">
				<input class="input" v-model="confirmPassword" password placeholder="确认密码" placeholder-style="color:#999" />
			</view>
			
			<button class="login-btn" :loading="loading" @click="handleRegister">立即注册</button>
		</view>
	</view>
</template>

<script setup>
import { ref, getCurrentInstance } from 'vue'

const username = ref('')
const nickname = ref('')
const password = ref('')
const confirmPassword = ref('')
const loading = ref(false)

const { proxy } = getCurrentInstance()

const goBack = () => {
	uni.navigateBack()
}

const handleRegister = async () => {
	if (!username.value || !password.value || !confirmPassword.value) {
		return uni.showToast({ title: '请填写完整信息', icon: 'none' })
	}
	if (password.value !== confirmPassword.value) {
		return uni.showToast({ title: '两次密码输入不一致', icon: 'none' })
	}
	if (username.value.length < 3) {
		return uni.showToast({ title: '用户名太短', icon: 'none' })
	}
	if (password.value.length < 6) {
		return uni.showToast({ title: '密码至少6位', icon: 'none' })
	}
	
	loading.value = true
	try {
		const res = await proxy.$request({
			url: '/register',
			method: 'POST',
			data: {
				username: username.value,
				nickname: nickname.value || username.value,
				password: password.value
			}
		})
		
		if (res.success) {
			uni.showToast({ title: '注册成功，请登录', icon: 'success' })
			setTimeout(() => {
				uni.navigateBack()
			}, 1500)
		} else {
			uni.showToast({ title: res.message || '注册失败', icon: 'none' })
		}
	} catch (e) {
		uni.showToast({ title: '网络请求错误', icon: 'none' })
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
	}
	
	.back-btn {
		margin-top: 20rpx;
		padding: 20rpx 0;
	}
	
	.logo-section {
		margin-top: 60rpx;
		margin-bottom: 80rpx;
	}
	
	.app-name {
		font-size: 48rpx;
		font-weight: bold;
		color: #333;
		display: block;
	}
	
	.sub-title {
		font-size: 28rpx;
		color: #999;
		margin-top: 10rpx;
		display: block;
	}
	
	.input-group {
		height: 110rpx;
		border-bottom: 1px solid #eeeeee;
		margin-bottom: 30rpx;
		display: flex;
		align-items: center;
	}
	
	.input {
		flex: 1;
		height: 80rpx;
		font-size: 30rpx;
		color: #333;
	}
	
	.login-btn {
		width: 100%;
		height: 94rpx;
		line-height: 94rpx;
		background: linear-gradient(to right, #007AFF, #00aaff);
		color: #ffffff;
		font-size: 34rpx;
		border-radius: 47rpx;
		margin-top: 80rpx;
	}
</style>
