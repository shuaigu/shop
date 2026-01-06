<script setup>
	import { computed, ref, } from 'vue'
	import { useUserInfoStore } from '@/store/user.js'
	// 导入用户信息store
	const userStore = useUserInfoStore( )

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
	<view class="my">
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