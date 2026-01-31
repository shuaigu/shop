<template>
	<view class="container">
		<!-- 背景和头部 -->
		<view class="header-bg">
			<view class="header-content">
				<view class="title-line1">我们帮您把业务/产品推广出去</view>
				<view class="title-line2">您只需要等着客户主动找上门</view>
			</view>
			<view class="close-btn" @click="goBack">
				<uni-icons type="closeempty" size="24" color="#fff"></uni-icons>
			</view>
		</view>

		<!-- 聊天区域 -->
		<scroll-view class="chat-list" scroll-y="true" :scroll-into-view="lastMessageId">
			<view class="chat-content">
				<block v-for="(item, index) in chatList" :key="index">
					<!-- 系统消息 -->
					<view :id="'msg-' + index" class="message-item left" v-if="item.type === 'system'">
						<image class="avatar" :src="robotAvatarDisplay" @error="onRobotAvatarError" mode="aspectFill"></image>
						<view class="bubble">
							{{item.text}}
							<!-- 选项按钮（仅在最后一条且未回答时显示） -->
							<view class="options" v-if="item.options && index === chatList.length - 1 && !isFinished">
								<view class="option-btn" v-for="(opt, optIdx) in item.options" :key="optIdx" @click="handleSelect(opt)">
									{{opt}}
								</view>
							</view>
						</view>
					</view>

					<!-- 用户消息 -->
					<view :id="'msg-' + index" class="message-item right" v-if="item.type === 'user'">
						<view class="bubble">{{item.text}}</view>
						<image class="avatar" :src="userAvatarDisplay" mode="aspectFill"></image>
					</view>
				</block>
			</view>
		</scroll-view>

		<!-- 底部标识 -->
		<view class="footer-info">
			页面信息及服务由湖北客聚多企业管理有限公司提供
		</view>
	</view>
</template>

<script setup>
	import {
		ref,
		onMounted,
		computed
	} from 'vue'
	import {
		useUserInfoStore
	} from '@/store/user.js'

	const userStore = useUserInfoStore()
	const lastMessageId = ref('')
	const isFinished = ref(false)
	const robotAvatarDisplay = ref('https://aly2.jingle0350.cn/2025/touxiang/robot-avatar.png')
	const userAvatarDisplay = ref('/static/images/touxiang.png')

	// 处理用户头像显示逻辑（参考 my.vue）
	const updateDisplayAvatar = async () => {
		const avatarUrl = userStore.userInfo.avatarUrl
		if (!avatarUrl) {
			userAvatarDisplay.value = '/static/images/touxiang.png'
			return
		}

		// 确保是字符串
		if (typeof avatarUrl !== 'string') {
			console.warn('avatarUrl 不是字符串:', avatarUrl)
			userAvatarDisplay.value = '/static/images/touxiang.png'
			return
		}

		if (avatarUrl.startsWith('/') || avatarUrl.startsWith('./') || avatarUrl.startsWith('http://') ||
			avatarUrl.startsWith('https://')) {
			userAvatarDisplay.value = avatarUrl
			return
		}

		if (avatarUrl.startsWith('cloud://')) {
			try {
				const result = await uniCloud.getTempFileURL({
					fileList: [avatarUrl]
				})
				if (result.fileList && result.fileList[0] && result.fileList[0].tempFileURL) {
					userAvatarDisplay.value = result.fileList[0].tempFileURL
				}
			} catch (error) {
				userAvatarDisplay.value = '/static/images/touxiang.png'
			}
			return
		}
		userAvatarDisplay.value = '/static/images/touxiang.png'
	}

	const chatList = ref([{
			type: 'system',
			text: '我们是做全行业获客的专业团队，能够帮助您精准获取客户；意向客户会主动添加您，全行业均可做；若您有需求，请认真回答以下问题。'
		},
		{
			type: 'system',
			text: '您是否整面临获客难、成本高的问题？',
			options: ['是', '否']
		}
	])

	const questions = [{
			text: '您想要获取哪里的客户？',
			options: ['本地客户', '全国客户']
		},
		{
			text: '我们提供精准客户，您是否接受1000-3000/年的合作费用？',
			options: ['是', '否']
		},
		{
			text: '感谢您的回答！我们会根据您的需求为您匹配最优质的推广方案，稍后会有专业顾问为您提供咨询服务。',
			isEnd: true
		}
	]

	const currentQuestionIdx = ref(0)

	const goBack = () => {
		uni.navigateBack()
	}

	const onRobotAvatarError = () => {
		robotAvatarDisplay.value = '/static/images/touxiang.png'
	}

	const scrollToBottom = () => {
		setTimeout(() => {
			lastMessageId.value = 'msg-' + (chatList.value.length - 1)
		}, 200)
	}

	const handleSelect = (answer) => {
		// 添加用户回答
		chatList.value.push({
			type: 'user',
			text: answer
		})

		// 获取下一条系统消息
		const nextQ = questions[currentQuestionIdx.value]
		if (nextQ) {
			setTimeout(() => {
				chatList.value.push({
					type: 'system',
					text: nextQ.text,
					options: nextQ.options
				})
				if (nextQ.isEnd) {
					isFinished.value = true
				}
				currentQuestionIdx.value++
				scrollToBottom()
			}, 500)
		}
		scrollToBottom()
	}

	onMounted(() => {
		updateDisplayAvatar()
		scrollToBottom()
	})
</script>

<style lang="scss" scoped>
	.container {
		display: flex;
		flex-direction: column;
		height: 100vh;
		background-color: #f5f5f5;
	}

	.header-bg {
		position: relative;
		height: 350rpx;
		background: linear-gradient(180deg, #3a7bd5 0%, #00d2ff 100%);
		padding-top: 100rpx;
		text-align: center;
		color: #fff;

		.header-content {
			.title-line1 {
				font-size: 40rpx;
				font-weight: bold;
				margin-bottom: 20rpx;
				text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
			}

			.title-line2 {
				font-size: 32rpx;
				opacity: 0.9;
			}
		}

		.close-btn {
			position: absolute;
			left: 30rpx;
			top: 60rpx;
			z-index: 10;
		}
	}

	.chat-list {
		flex: 1;
		margin-top: -50rpx;
		background-color: #f5f5f5;
		border-radius: 40rpx 40rpx 0 0;
		padding: 40rpx 20rpx;
		box-sizing: border-box;

		.chat-content {
			padding-bottom: 40rpx;
		}
	}

	.message-item {
		display: flex;
		margin-bottom: 40rpx;
		align-items: flex-start;

		.avatar {
			width: 80rpx;
			height: 80rpx;
			border-radius: 50%;
			flex-shrink: 0;
		}

		.bubble {
			max-width: 70%;
			padding: 24rpx 30rpx;
			border-radius: 12rpx;
			font-size: 28rpx;
			line-height: 1.6;
			position: relative;
		}

		&.left {
			.avatar {
				margin-right: 20rpx;
			}

			.bubble {
				background-color: #fff;
				color: #333;
				border-top-left-radius: 0;
			}
		}

		&.right {
			justify-content: flex-end;

			.avatar {
				margin-left: 20rpx;
			}

			.bubble {
				background-color: #fff;
				color: #333;
				border-top-right-radius: 0;
			}
		}
	}

	.options {
		display: flex;
		justify-content: space-between;
		margin-top: 30rpx;
		gap: 20rpx;

		.option-btn {
			flex: 1;
			height: 80rpx;
			line-height: 80rpx;
			text-align: center;
			background-color: #e6a23c;
			color: #fff;
			border-radius: 10rpx;
			font-size: 30rpx;

			&:active {
				opacity: 0.8;
			}
		}
	}

	.footer-info {
		background-color: #000;
		color: #999;
		font-size: 24rpx;
		text-align: center;
		padding: 30rpx 20rpx;
		padding-bottom: calc(30rpx + env(safe-area-inset-bottom));
	}
</style>
