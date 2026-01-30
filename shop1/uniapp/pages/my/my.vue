<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useUserInfoStore } from '@/store/user.js'

const userStore = useUserInfoStore()

// 点击登录
const clickLogin = () => {
	uni.navigateTo({
		url: "/pages/login/login"
	})
}

// 处理手机号显示
const maskedMobile = computed(() => {
	if (!userStore.userInfo.mobile) return '';
	const mobile = userStore.userInfo.mobile;
	if (mobile.length !== 11) return mobile;
	return mobile.substring(0, 3) + '****' + mobile.substring(7);
})

// 处理头像URL
const displayAvatarUrl = ref('/static/images/touxiang.png')

// 监听头像变化
const updateDisplayAvatar = () => {
	const avatarUrl = userStore.userInfo.avatarUrl
	if (!avatarUrl || avatarUrl.startsWith('/')) {
		displayAvatarUrl.value = avatarUrl || '/static/images/touxiang.png'
	} else if (avatarUrl.startsWith('http://') || avatarUrl.startsWith('https://')) {
		displayAvatarUrl.value = avatarUrl
	} else {
		displayAvatarUrl.value = '/static/images/touxiang.png'
	}
}

onMounted(() => {
	updateDisplayAvatar()
	watch(() => userStore.userInfo.avatarUrl, () => {
		updateDisplayAvatar()
	})
})

// 点击退出登录
const loginOut = () => {
	uni.showModal({
		title: '提示',
		content: '确定要退出登录吗',
		success(res) {
			if (res.confirm) {
				userStore.cleanUserInfo()
			}
		}
	})
}
</script>

<template>
	<view class="my">
		<view class="myHead">
			<view class="avatar">
				<image :src="displayAvatarUrl" mode="aspectFill"></image>
			</view>
			
			<view class="userInfo" v-if="userStore.userInfo.isLogin">
				<view class="nickname">{{userStore.userInfo.nickName || '未设置昵称'}}</view>
				<view class="mobile">手机号：{{maskedMobile}}</view>
			</view>
			
			<view class="login-btn" @click="clickLogin" v-else>
				点击登录
			</view>
		</view>
		
		<view class="myContent">
			<view class="logout-section" v-if="userStore.userInfo.isLogin">
				<view class="menu-item logout" @click="loginOut">
					<view class="left">
						<text class="value">退出登录</text>
					</view>
				</view>
			</view>
		</view>
	</view>
</template>

<style lang="scss" scoped>
.my {
	min-height: 100vh;
	background-color: #f7f7f7;

	.myHead {
		display: flex;
		align-items: center;
		padding: 40rpx 30rpx;
		height: 320rpx;
		color: #fff;
		background: linear-gradient(135deg, #46b0fe, #6385ff);

		.avatar {
			margin-right: 30rpx;
			width: 140rpx;
			height: 140rpx;
			border-radius: 50%;
			overflow: hidden;
			border: 4rpx solid rgba(255, 255, 255, 0.6);
			
			image {
				width: 100%;
				height: 100%;
			}
		}

		.login-btn {
			font-size: 36rpx;
			font-weight: 500;
			background-color: rgba(255, 255, 255, 0.2);
			padding: 16rpx 40rpx;
			border-radius: 40rpx;
		}

		.userInfo {
			flex: 1;
			
			.nickname {
				font-size: 36rpx;
				font-weight: 600;
				margin-bottom: 16rpx;
			}

			.mobile {
				font-size: 28rpx;
				opacity: 0.9;
			}
		}
	}

	.myContent {
		padding: 30rpx;
		
		.logout-section {
			background-color: #fff;
			border-radius: 16rpx;
			overflow: hidden;
			
			.logout .value {
				color: #ff6b6b;
			}
		}

		.menu-item {
			display: flex;
			justify-content: space-between;
			align-items: center;
			padding: 32rpx 30rpx;
		}

		.left {
			display: flex;
			align-items: center;

			.value {
				font-size: 32rpx;
				color: #333;
			}
		}
	}
}
</style>
