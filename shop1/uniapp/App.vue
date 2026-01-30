<script setup>
import { onLaunch, onShow, onHide } from '@dcloudio/uni-app'
import { useUserInfoStore } from '@/store/user.js'

const userStore = useUserInfoStore()

onLaunch((options) => {
	console.log('App Launch')
	console.log('启动参数:', options)
	
	// 检查登录状态
	checkLoginStatus()
	
	// 开启平台原生页面分享
	uni.showShareMenu({
		withShareTicket: true
	})
})

onShow(() => {
	console.log('App Show')
	// 每次应用显示时也检查登录状态
	checkLoginStatus()
})

onHide(() => {
	console.log('App Hide')
})

// 检查登录状态函数
const checkLoginStatus = () => {
	// 检查 store 中是否有用户信息
	if (userStore.userInfo && userStore.userInfo.uid && userStore.userInfo.isLogin) {
		console.log('用户已登录:', userStore.userInfo.nickName)
		return true
	}
	
	// 检查本地存储
	const storageUserInfo = uni.getStorageSync('userInfo')
	if (storageUserInfo && storageUserInfo.uid && storageUserInfo.isLogin) {
		console.log('从本地存储恢复登录状态:', storageUserInfo.nickName)
		userStore.setUserInfo(storageUserInfo)
		return true
	}
	
	console.log('用户未登录')
	return false
}
</script>

<style>
	/* 每个页面公共css */
	body {
		background-color: #f5f5f5;
	}
</style>
