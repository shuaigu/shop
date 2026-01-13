<script setup>
	import { computed, ref, onMounted, onUnmounted } from 'vue'
	import { useUserInfoStore } from '@/store/user.js'
	// 导入用户信息store
	const userStore = useUserInfoStore( )
	
	// 自定义页面入口显示控制
	const showCustomPageEntry = ref(false)  // 默认关闭
	
	// 我的页面显示控制
	const showMyPage = ref(true)  // 默认显示
	
	// 配置 API
	const configApi = uniCloud.importObject('config', { customUI: true })

	// 手机号中间4位用*代替
	const maskedMobile = computed(() => {
		const mobile = userStore.userInfo.mobile
		if (!mobile) return ''
		return mobile.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
	})

	// 点击登录
	const clickLogin = async ( ) => {
		uni.navigateTo( {
			url: "/pages/login/login"
		} )
	}

	// 信息公示跳转
	const contarct = ( ) => {
		uni.navigateTo( {
			url: "/subPages/contarct/contarct"
		} )
	}

	// 意见反馈跳转
	const feedBack = ( ) => {
		uni.navigateTo( {
			url: "/subPages/feedBack/feedBack"
		} )
	}

	// 更多服务跳转（自定义页面列表）
	const moreServices = () => {
		uni.navigateTo({
			url: "/subPages/customPageList/customPageList"
		})
	}
	
	// 获取自定义页面入口显示状态
	const getCustomPageEntryStatus = async () => {
		try {
			const res = await configApi.getConfig('customPageEntry')
			if (res && res.data) {
				showCustomPageEntry.value = res.data.isVisible !== false
			} else {
				showCustomPageEntry.value = false  // 默认关闭
			}
		} catch (err) {
			console.error('获取自定义页面入口配置失败:', err)
			showCustomPageEntry.value = false  // 出错时默认关闭
		}
	}
	
	// 获取我的页面显示状态
	const getMyPageDisplayStatus = async () => {
		try {
			const res = await configApi.getConfig('myPageDisplay')
			if (res && res.data) {
				showMyPage.value = res.data.isVisible !== false
			} else {
				showMyPage.value = true  // 默认显示
			}
		} catch (err) {
			console.error('获取我的页面配置失败:', err)
			showMyPage.value = true  // 出错时默认显示
		}
	}
	
	// 监听全局事件，更新自定义页面入口状态
	const handleCustomPageEntryUpdate = (e) => {
		showCustomPageEntry.value = e.isVisible
		console.log('收到自定义页面入口状态更新:', e.isVisible)
	}
	
	// 监听全局事件，更新我的页面显示状态
	const handleMyPageDisplayUpdate = (e) => {
		showMyPage.value = e.isVisible
		console.log('收到我的页面状态更新:', e.isVisible)
	}
	
	// 页面加载时获取配置
	onMounted(async () => {
		await Promise.all([
			getCustomPageEntryStatus(),
			getMyPageDisplayStatus()
		])
		
		// 监听全局事件
		uni.$on('updateCustomPageEntry', handleCustomPageEntryUpdate)
		uni.$on('updateMyPageDisplay', handleMyPageDisplayUpdate)
	})
	
	// 页面销毁时移除事件监听
	onUnmounted(() => {
		uni.$off('updateCustomPageEntry', handleCustomPageEntryUpdate)
		uni.$off('updateMyPageDisplay', handleMyPageDisplayUpdate)
	})

	// 角色判断
	const isAdmin = computed( ( ) => userStore.userInfo.role[ 0 ] === 'admin' )
	// 后台管理
	const adminManage = ( ) => {
		if ( isAdmin ) {
			uni.navigateTo( {
				url: "/subPages/adminManage/adminManage"
			} )
		}
	}
	
	// 收藏管理
	const collectionManage = ( ) => {
		if ( isAdmin.value ) {
			uni.navigateTo( {
				url: "/pages/memo/myCollections"
			} )
		}
	}

	// 点击退出登录
	const loginOut = ( ) => {
		uni.showModal( {
			title: '提示',
			content: '确定要退出登录吗',
			success( res ) {
				if ( res.confirm ) {
					userStore.cleanUserInfo( )
				}
			}
		} )
	}
</script>

<template>
	<!-- 页面关闭提示 -->
	<view class="page-closed" v-if="!showMyPage">
		<view class="closed-content">
			<uni-icons type="info-filled" size="80" color="#999"></uni-icons>
			<view class="closed-title">页面维护中</view>
			<view class="closed-desc">“我的”页面暂时关闭，请稍后再试</view>
		</view>
	</view>
	
	<!-- 正常页面 -->
	<view class="my" v-else>
		<!-- 头部 -->
		<view class="myHead">
			<view class="avatar">
				<image :src="userStore.userInfo.avatarUrl" mode="aspectFill"></image>
			</view>
			<!-- 已经登录 -->
			<view class="userInfo" v-if="userStore.userInfo.isLogin">
				<view class="nickname">
					{{userStore.userInfo.nickName}}
				</view>
				<view class="mobile">
					手机号：{{maskedMobile}}
				</view>
			</view>
			<!-- 未登录 -->
			<view class="login" @click="clickLogin" v-else>
				点击登录
			</view>

		</view>
		<!-- 内容 -->
		<view class="myContent">
			<!-- 联系我们 -->
			<view class="contract" @click="contarct">
				<view class="left">
					<uni-icons style="padding-top: 2px;" color="#999999" type="wallet" size="22"></uni-icons>
					<text class="value">信息公示</text>
				</view>
				<uni-icons color="#cccccc" custom-prefix="iconfont" type="icon-arrow-drop-right-line"
					size="30"></uni-icons>
			</view>
			<!-- 意见反馈 -->
			<view class="feedBack" @click="feedBack">
				<view class="left">
					<uni-icons style="padding-top: 2px;" color="#999999" custom-prefix="iconfont"
						type="icon-yijianfankui" size="22"></uni-icons>
					<text class="value">意见反馈</text>
				</view>
				<uni-icons color="#cccccc" custom-prefix="iconfont" type="icon-arrow-drop-right-line"
					size="30"></uni-icons>
			</view>
			<!-- 更多服务 -->
			<view class="moreServices" @click="moreServices" v-if="showCustomPageEntry">
				<view class="left">
					<uni-icons style="padding-top: 2px;" color="#999999" type="star" size="22"></uni-icons>
					<text class="value">更多服务</text>
				</view>
				<uni-icons color="#cccccc" custom-prefix="iconfont" type="icon-arrow-drop-right-line"
					size="30"></uni-icons>
			</view>
			<!-- 收藏管理 -->
			<view class="collectionManage" @click="collectionManage" v-if="userStore.userInfo.role[0]=='admin'">
				<view class="left">
					<uni-icons style="padding-top: 2px;" color="#999999" type="heart" size="22"></uni-icons>
					<text class="value">收藏管理</text>
				</view>
				<uni-icons color="#cccccc" custom-prefix="iconfont" type="icon-arrow-drop-right-line"
					size="30"></uni-icons>
			</view>
			<!-- 后台管理 -->
			<view class="adminManage" @click="adminManage" v-if="userStore.userInfo.role[0]=='admin'">
				<view class="left">
					<uni-icons style="padding-top: 2px;" color="#999999" custom-prefix="iconfont"
						type="icon-houtaiguanli" size="22"></uni-icons>
					<text class="value">后台管理</text>
				</view>
				<uni-icons color="#cccccc" custom-prefix="iconfont" type="icon-arrow-drop-right-line"
					size="30"></uni-icons>
			</view>
			<!-- 退出登录 -->
			<view class="loginOut" v-if="userStore.userInfo.isLogin" @click="loginOut">
				<view class="left">
					<uni-icons style="padding-top: 2px;" color="#999999" custom-prefix="iconfont"
						type="icon-tuichudenglu" size="22"></uni-icons>
					<text class="value">退出登录</text>
				</view>
				<uni-icons color="#cccccc" custom-prefix="iconfont" type="icon-arrow-drop-right-line"
					size="30"></uni-icons>
			</view>
		</view>
	</view>
</template>


<style lang="scss" scoped>
	// 页面关闭提示
	.page-closed {
		height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		background: linear-gradient(to bottom, #f5f7fa 0%, #ffffff 50%);
		
		.closed-content {
			display: flex;
			flex-direction: column;
			align-items: center;
			padding: 60rpx 40rpx;
			
			.closed-title {
				font-size: 40rpx;
				font-weight: 600;
				color: #333;
				margin: 40rpx 0 20rpx;
			}
			
			.closed-desc {
				font-size: 28rpx;
				color: #999;
				text-align: center;
				line-height: 1.6;
			}
		}
	}
	
	.my {
		height: 100vh;
		overflow: hidden;

		/*头部*/
		.myHead {
			display: flex;
			align-items: center;
			padding: 24rpx;
			height: 300rpx;
			color: #fff;
			background: linear-gradient(to right, #d0d5db, #a3c4d3, #d0d5db);

			/*头像*/
			.avatar {
				margin-right: 16rpx;
				width: 120rpx;
				height: 120rpx;
				border-radius: 50%;
				overflow: hidden;
			}

			/*未登录*/
			.login {
				font-size: 32rpx;
			}

			/*已登录*/
			.userInfo {
				.nickname {
					font-size: 32rpx;
					font-weight: 600;
				}

				.mobile {
					font-size: 24rpx;
				}
			}
		}

		/*内容*/
		.myContent {
			position: relative;
			padding: 24rpx;
			height: calc(100vh - 360rpx);
			transform: translateY(-60rpx);
			border-radius: 32rpx 32rpx 0 0;
			background-color: #fff;
			color: $pyq-text-color-helper;

			/*功能区域*/
			.contract {
				@include optionalCommon;
				border: none;
			}

			/*icon的公共样式*/
			.left {
				display: flex;
				align-items: center;

				.value {
					margin-left: 8rpx;
					font-size: 32rpx;
				}
			}

			/*意见反馈*/
			.feedBack {
				@include optionalCommon;
			}

			/*更多服务*/
			.moreServices {
				@include optionalCommon;
			}

			/*收藏管理*/
			.collectionManage {
				@include optionalCommon;
			}
			
			/*后台管理*/
			.adminManage {
				@include optionalCommon;
			}

			.loginOut {
				@include optionalCommon;
			}

			/*分割线提示信息*/
			.bottom-line {
				position: absolute;
				left: 50%;
				bottom: 0;
			}
		}
	}
</style>