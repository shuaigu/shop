<script setup>
	import {
		ref,
		onMounted
	} from 'vue'
	import { useUserInfoStore } from '@/store/user.js'
	
	const userStore = useUserInfoStore()
	const dyLogin = uniCloud.importObject('userDy')
	const modelShow = ref(false)
	const code = ref()
	const aloneChecked = ref(true)
	
	// 页面加载时自动勾选
	onMounted(() => {
		aloneChecked.value = true
	})
	
	const clickLogin = async () => {
		// 自动勾选协议
		aloneChecked.value = true
		
		// 直接进行登录逻辑，不再需要协议检查
		const res = await tt.login({
			success(result) {
				code.value = result.code
				modelShow.value = true
			}
		})
	}

	const closeModel = () => {
		modelShow.value = false
	}
	
	const navigateToAgreement = (type) => {
		// 处理协议跳转
		uni.navigateTo({
			url: `/pages/agreement/${type}`
		})
	}

	const getMobile = async (e) => {
		if (e.detail.errMsg !== 'getPhoneNumber:ok') {
			uni.showToast({
				title: '获取手机号失败',
				icon: 'none'
			})
			return
		}
		
		const params = {
			code: code.value,
			encryptedData: e.detail.encryptedData,
			iv: e.detail.iv
		}
		
		try {
			// 显示加载提示
			uni.showLoading({
				title: '登录中...',
				mask: true
			})
			
			const res = await dyLogin.loginByPhoneDy(params)
			console.log(res)
			
			// 隐藏加载提示
			uni.hideLoading()
			
			if (res.code === 0) {
				// 登录成功，保存用户信息
				userStore.login({
					uid: res.data.uid || '',
					nickName: res.data.nickName || '',
					avatarUrl: res.data.avatarUrl || '/static/images/defalut.png',
					mobile: res.data.mobile || '',
					role: res.data.role || []
				})
				
				uni.showToast({
					title: '登录成功',
					icon: 'success'
				})
				
				// 获取当前页面栈
				const pages = getCurrentPages()
				
				if (pages.length > 1) {
					// 如果有上一页，延迟返回上一页
					setTimeout(() => {
						uni.navigateBack({
							delta: 1,
							success: () => {
								console.log('成功返回上一页')
							},
							fail: (err) => {
								console.error('返回上一页失败:', err)
								// 返回失败就跳转到首页
								uni.switchTab({
									url: '/pages/index/index'
								})
							}
						})
					}, 1500)
				} else {
					// 如果没有上一页（比如通过分享直接进入登录页），跳转到首页
					setTimeout(() => {
						uni.switchTab({
							url: '/pages/index/index'
						})
					}, 1500)
				}
				
				// 触发全局登录成功事件，通知其他页面
				uni.$emit('loginSuccess', userStore.userInfo)
			} else {
				uni.showToast({
					title: res.message || '登录失败',
					icon: 'none'
				})
			}
		} catch (error) {
			console.error(error)
			uni.hideLoading()
			uni.showToast({
				title: '登录失败，请稍后再试',
				icon: 'none'
			})
		}
	}
</script>

<template>
	<view class="loginPages">
		<view class="bg">
		</view>
		<!-- 标题 -->
		<view class="title">
			<view class="logo">
				<image src="/static/images/logo.png" mode="aspectFit"></image>
			</view>
			<!-- 提示词 -->
			<view class="wenben">
				欢迎登录进行使用
			</view>
		</view>
		<!-- 隐私协议 -->
		<view class="authLogin">
			<view class="agree">
				<up-checkbox activeColor="#46b0fe" class="checkbox" name="agree" usedAlone
					v-model:checked="aloneChecked" shape="circle">
				</up-checkbox>
				<view class="text-wrapper">
					<text class="normal-text">我已阅读并同意</text>
					<view class="link-text" @click="navigateToAgreement('vipServer')">
						服务协议
					</view>
					<text class="normal-text">和</text>
					<view class="link-text" @click="navigateToAgreement('privacyAgreement')">
						隐私政策
					</view>
				</view>
			</view>
			<!-- 登录按钮 -->
			<view class="login">
				<button class="btn" @click="clickLogin">一键登录</button>
			</view>
		</view>
		<!-- 手机号登录弹框 -->
		<view class="mobileLoginModel" v-if="modelShow">
			<view class="model">
				<!-- 添加关闭按钮 -->
				<view class="close-btn" @click="closeModel">
					<text class="close-icon">×</text>
				</view>
				<!-- 图标区域 -->
				<view class="icon-wrapper">
					<image class="default-avatar" src="/static/images/defalut.png" mode="aspectFill"></image>
				</view>
				<!-- 文字区域 -->
				<view class="textValue">
					<view class="titleModel">
						登录确认
					</view>
					<view class="contentModel">
						登录即表示同意服务协议和隐私政策
					</view>
				</view>
				<!-- 按钮区域改动 -->
				<view class="caozuo">
					<button class="confirm" open-type="getPhoneNumber" @getphonenumber="getMobile">
						<text class="btn-text">手机号一键登录</text>
					</button>
				</view>
			</view>
		</view>
	</view>
</template>

<style lang="scss" scoped>
	.loginPages {
		height: 100vh;
		background: linear-gradient(to top, #ccd8f7, #fff);

		.bg {
			position: fixed;
			top: 0;
			left: 0;
			width: 100%;
			height: 600rpx;
			background: linear-gradient(to right, #ccd8f7, #fce1e2);
			-webkit-mask-image: linear-gradient(to bottom, rgba(0, 0, 0, 1) 30%, rgba(0, 0, 0, 0) 70%);
			mask-image: linear-gradient(to bottom, rgba(0, 0, 0, 1) 30%, rgba(0, 0, 0, 0) 70%);
		}

		/*标题*/
		.title {
			position: fixed;
			left: 50%;
			top: 20%;
			transform: translateX(-50%);

			.logo {
				margin-bottom: 40rpx;
				height: 100rpx;
				width: 400rpx;
			}

			.wenben {
				text-align: center;
				font-size: 36rpx;
				color: $pyq-text-color-body-secondary;
			}
		}

		/*授权登录*/
		.authLogin {
			width: 100%;

			/*同意*/
			.agree {
				display: flex;
				align-items: center;
				padding-top: 600rpx;
				margin: auto;
				width: fit-content;
				font-size: 24rpx;
				color: $pyq-text-color-helper;

				.checkbox {
					margin-right: 8rpx;
					// 确保复选框始终显示为选中状态
					:deep(.u-checkbox__icon-wrap--checked) {
						opacity: 1;
					}
				}

				.text-wrapper {
					flex: 1;
					display: flex;
					align-items: center;
					flex-wrap: wrap;

					.normal-text {
						font-size: 24rpx;
						color: $pyq-text-color-helper;
						padding: 0 4rpx;
					}

					.link-text {
						color: $pyq-vi-color;
						font-size: 28rpx;
						padding: 4rpx 8rpx;
						text-decoration: underline;

						&:active {
							opacity: 0.7;
						}
					}
				}
			}

			/*登录*/
			.login {
				padding: 40rpx;
				background: rgba(0, 0, 0, 0);

				.btn {
					background-color: $pyq-vi-color;
					border: none;
					color: #fff;
					border-radius: 64rpx;
					width: 70%;
					margin: 0 auto;
				}
			}
		}

		/*授权弹框*/
		.mobileLoginModel {
			position: fixed;
			left: 0;
			top: 0;
			height: 100vh;
			width: 100%;
			background: rgba(0, 0, 0, 0.2);

			.model {
				display: flex;
				flex-direction: column;
				width: 560rpx;
				background-color: #fff;
				border-radius: 32rpx;
				margin: 300rpx auto;
				overflow: hidden;

				// 添加关闭按钮样式
				.close-btn {
					position: absolute;
					right: 20rpx;
					top: 20rpx;
					width: 90rpx;
					height: 90rpx;
					display: flex;
					align-items: center;
					justify-content: center;

					.close-icon {
						font-size: 48rpx;
						color: #999;
					}

					&:active {
						opacity: 0.7;
					}
				}

				.icon-wrapper {
					display: flex;
					justify-content: center;
					padding: 60rpx 0 20rpx;

					.default-avatar {
						width: 120rpx;
						height: 120rpx;
						border-radius: 50%;
						border: 4rpx solid #f0f0f0;
						box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);
					}
				}

				.textValue {
					display: flex;
					flex-direction: column;
					align-items: center;
					padding: 40rpx 40rpx 40rpx;

					.titleModel {
						font-size: 32rpx;
						font-weight: 500;
						color: $pyq-text-color-title;
					}

					.contentModel {
						margin-top: 20rpx;
						font-size: 28rpx;
						color: $pyq-text-color-helper;
					}
				}

				/*按钮*/
				.caozuo {
					display: flex;
					padding: 0 40rpx 40rpx;

					.confirm {
						flex: 1;
						height: 88rpx;
						line-height: 88rpx;
						background-color: $pyq-vi-color;
						border-radius: 44rpx;
						font-size: 32rpx;
						color: #fff;
						border: none;

						&::after {
							border: none;
						}

						.btn-text {
							font-weight: 500;
						}

						&:active {
							opacity: 0.9;
						}
					}
				}
			}
		}
	}
</style>