<template>
	<view class="container">
		<!-- 背景和头部 -->
		<view class="header-bg">
			<view class="header-content">
				<view class="title-line1">我们帮您把业务/产品推广出去</view>
				<view class="title-line2">收下福利，开始精准获客之旅</view>
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
				
				<!-- 正在输入提示（在所有消息之后） -->
				<view class="message-item left" v-if="isTyping">
					<image class="avatar" :src="robotAvatarDisplay" mode="aspectFill"></image>
					<view class="bubble typing">
						<view class="dot"></view>
						<view class="dot"></view>
						<view class="dot"></view>
					</view>
				</view>
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
	import {
		testLogin
	} from '@/utils/isLogin.js'

	const userStore = useUserInfoStore()
	const lastMessageId = ref('')
	const isFinished = ref(false)
	const isTyping = ref(false)
	const robotAvatarDisplay = ref('/static/images/touxiang.png')
	const userAvatarDisplay = ref('/static/images/touxiang.png')

	// 用户是否选择了收下福利
	const wantsReward = ref(false)

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

	const chatList = ref([])
	const questions = ref([])
	const chatConfig = ref(null)
	const rewardAmount = ref(0.1)

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
		}, 100)
	}

	const typeMessage = async (text, options, isEnd) => {
		isTyping.value = true
		scrollToBottom()

		// 模拟思考时间（根据文字长度稍微变动）
		const thinkingTime = Math.min(1500, 800 + text.length * 10)
		await new Promise(resolve => setTimeout(resolve, thinkingTime))

		isTyping.value = false
		const newMessage = {
			type: 'system',
			text: '',
			options: []
		}
		chatList.value.push(newMessage)

		const msgIndex = chatList.value.length - 1
		for (let i = 0; i <= text.length; i++) {
			chatList.value[msgIndex].text = text.slice(0, i)
			
			// 模拟真实打字：遇到标点符号停顿稍长
			const char = text[i - 1]
			let delay = 30 + Math.random() * 40 // 基础速度 30-70ms
			if (['，', '。', '！', '？', ',', '.', '!', '?'].includes(char)) {
				delay += 200 // 标点停顿
			}
			
			if (i % 2 === 0) scrollToBottom() 
			await new Promise(resolve => setTimeout(resolve, delay))
		}

		// 打字结束后显示选项
		if (options) {
			await new Promise(resolve => setTimeout(resolve, 300)) // 选项弹出前微调
			chatList.value[msgIndex].options = options
		}

		if (isEnd) {
			isFinished.value = true
			// 移除结束时的红包提示，因为已经在用户点击“愿意”时实时转账了
		}

		scrollToBottom()
	}

	const startConversation = async () => {
		if (!questions.value || questions.value.length === 0) {
			console.error('问题配置为空，无法开始对话')
			return
		}
		const firstQ = questions.value[currentQuestionIdx.value]
		await typeMessage(firstQ.text, firstQ.options)
		currentQuestionIdx.value++

		if (!firstQ.options) {
			setTimeout(showNextMessage, 1000)
		}
	}

	const showNextMessage = async () => {
		const nextQ = questions.value[currentQuestionIdx.value]
		if (nextQ) {
			await typeMessage(nextQ.text, nextQ.options, nextQ.isEnd)
			currentQuestionIdx.value++

			if (!nextQ.options && !nextQ.isEnd) {
				setTimeout(showNextMessage, 1000)
			}
		}
	}

	const handleSelect = async (answer) => {
		// 检查用户是否登录
		if (!testLogin()) {
			return
		}
		
		// 添加用户回答
		chatList.value.push({
			type: 'user',
			text: answer
		})
		scrollToBottom()

		// 处理特殊逻辑：是否愿意收下福利
		const prevQ = questions.value[currentQuestionIdx.value - 1]
		if (prevQ && prevQ.isReward && answer === '愿意') {
			wantsReward.value = true
			
			// 立即调用云函数进行转账
			try {
				console.log('用户选择愿意收下福利，开始转账...')
				console.log('userStore.userInfo:', userStore.userInfo)
				
				// 检查用户ID（兼容uid和_id两种字段）
				const userId = userStore.userInfo?._id || userStore.userInfo?.uid
				if (!userId) {
					console.error('用户ID不存在，请先登录')
					uni.showModal({
						title: '提示',
						content: '请先登录后再领取奖励',
						confirmColor: '#399bfe',
						confirmText: '去登录',
						showCancel: true,
						cancelText: '稍后再说',
						success: (res) => {
							if (res.confirm) {
								// 跳转到登录页
								uni.navigateTo({
									url: '/pages/login/login?redirect=/pages/liaotian/liaotian'
								})
							}
						}
					})
					await typeMessage('抱歉，系统检测到您未登录，请先登录后再领取奖励。')
					setTimeout(showNextMessage, 500)
					return
				}
				
				console.log('用户ID:', userId)
				
				// 显示加载提示
				uni.showLoading({
					title: '正在处理...'
				})
				
				// 调用聊天配置云函数进行转账
				const chatApi = uniCloud.importObject('chatConfig')
				const result = await chatApi.processChatReward(
					userId,
					rewardAmount.value,
					'问卷调查奖励'
				)
				
				uni.hideLoading()
				
				console.log('转账结果:', result)
				
				if (result && result.errCode === 0) {
					// 转账成功
					console.log('✅ 转账成功！金额:', result.data.amount)
					await typeMessage(`太棒了！¥${result.data.amount.toFixed(2)} 元已成功转账到您的微信零钱，请注意查收！请继续回答以下问题。`)
				} else {
					// 转账失败
					const errorMsg = result?.errMsg || '转账失败'
					console.error('❌ 转账失败:', errorMsg)
					
					if (result?.already_received) {
						// 已经领取过
						await typeMessage('您已经领取过这个奖励了哦！请继续回答以下问题。')
					} else if (result?.no_openid) {
						// 未绑定openid
						uni.showModal({
							title: '提示',
							content: '您当前账号未绑定微信，无法领取奖励。请使用微信登录后再试。',
							confirmColor: '#399bfe',
							confirmText: '知道了',
							showCancel: false
						})
						await typeMessage('抱歉，检测到您未绑定微信，无法领取奖励。请继续回答以下问题。')
					} else {
						// 其他错误
						await typeMessage(`抱歉，系统处理失败：${errorMsg}。请继续回答以下问题。`)
					}
				}
			} catch (err) {
				console.error('转账调用异常:', err)
				uni.hideLoading()
				// 即使出错也继续流程
				await typeMessage('抱歉，系统出现异常，请稍后再试。请继续回答以下问题。')
			}
		} else {
			// 非奖励问题，继续正常流程
			setTimeout(showNextMessage, 500)
			return
		}

		setTimeout(showNextMessage, 500)
	}

	// 加载聊天配置
	const loadChatConfig = async () => {
		try {
			uni.showLoading({ title: '加载中...' })
			const chatApi = uniCloud.importObject('chatConfig')
			const result = await chatApi.getChatConfig()
			
			if (result && result.errCode === 0 && result.data) {
				chatConfig.value = result.data
				questions.value = result.data.questions || []
				rewardAmount.value = result.data.reward_amount || 0.1
				console.log('聊天配置加载成功:', result.data)
			} else {
				console.error('加载聊天配置失败:', result)
				// 使用默认配置
				questions.value = getDefaultQuestions()
			}
			uni.hideLoading()
		} catch (error) {
			console.error('加载聊天配置异常:', error)
			uni.hideLoading()
			// 使用默认配置
			questions.value = getDefaultQuestions()
		}
	}

	// 获取默认问题配置（作为后备方案）
	const getDefaultQuestions = () => {
		return [{
				text: '我们是做全行业获客的专业团队，能够帮助您精准获取客户；意向客户会主动添加您，全行业均可做；若您有需求，请认真回答以下问题。'
			},
			{
				text: '您是否愿意收下0.1元？',
				options: ['愿意', '不愿意'],
				isReward: true
			},
			{
				text: '您是否整面临获客难、成本高的问题？',
				options: ['是', '否']
			},
			{
				text: '您想要获取哪里的客户？',
				options: ['本地客户', '全国客户']
			},
			{
				text: '我们提供精准客户，您是否接受1000-3000/年的合作费用？',
				options: ['是', '否']
			},
			{
				text: '您是否愿意换电瓶？',
				options: ['愿意', '不愿意']
			},
			{
				text: '感谢您的回答！我们会根据您的需求为您匹配最优质的推广方案，稍后会有专业顾问为您提供咨询服务。',
				isEnd: true
			}
		]
	}

	onMounted(async () => {
		updateDisplayAvatar()
		await loadChatConfig()
		startConversation()
	})
</script>

<style lang="scss" scoped>
	.container {
		display: flex;
		flex-direction: column;
		height: 100vh;
		background-color: #f8f9fa;
	}

	.header-bg {
		position: relative;
		height: 380rpx;
		background: linear-gradient(135deg, #399bfe 0%, #4facfe 100%);
		padding-top: 100rpx;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		color: #fff;
		overflow: hidden;

		&::after {
			content: '';
			position: absolute;
			width: 200%;
			height: 200%;
			top: -50%;
			left: -50%;
			background: radial-gradient(circle at center, rgba(255, 255, 255, 0.1) 0%, transparent 70%);
			animation: rotate 20s linear infinite;
		}

		.header-content {
			position: relative;
			z-index: 2;
			text-align: center;

			.title-line1 {
				font-size: 42rpx;
				font-weight: 600;
				margin-bottom: 16rpx;
				letter-spacing: 2rpx;
			}

			.title-line2 {
				font-size: 28rpx;
				opacity: 0.85;
				font-weight: 300;
			}
		}

		.close-btn {
			position: absolute;
			left: 30rpx;
			top: 60rpx;
			z-index: 10;
			width: 64rpx;
			height: 64rpx;
			display: flex;
			align-items: center;
			justify-content: center;
			background: rgba(255, 255, 255, 0.2);
			border-radius: 50%;
			backdrop-filter: blur(4px);
		}
	}

	.chat-list {
		flex: 1;
		margin-top: -40rpx;
		background-color: #f8f9fa;
		border-radius: 40rpx 40rpx 0 0;
		padding: 30rpx 24rpx;
		box-sizing: border-box;
		position: relative;
		z-index: 5;

		.chat-content {
			padding-bottom: 60rpx;
		}
	}

	.message-item {
		display: flex;
		margin-bottom: 48rpx;
		align-items: flex-start;

		.avatar {
			width: 84rpx;
			height: 84rpx;
			border-radius: 20rpx;
			flex-shrink: 0;
			box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
		}

		.bubble {
			max-width: 72%;
			padding: 24rpx 32rpx;
			font-size: 30rpx;
			line-height: 1.6;
			position: relative;
			box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.04);
		}

		&.left {
			.avatar {
				margin-right: 20rpx;
			}

			.bubble {
				background-color: #fff;
				color: #2c3e50;
				border-radius: 4rpx 28rpx 28rpx 28rpx;
			}
		}

		&.right {
			justify-content: flex-end;

			.avatar {
				margin-left: 20rpx;
			}

			.bubble {
				background-color: #399bfe;
				color: #fff;
				border-radius: 28rpx 4rpx 28rpx 28rpx;
				box-shadow: 0 6rpx 20rpx rgba(57, 155, 254, 0.2);
			}
		}

		.typing {
			display: flex;
			gap: 8rpx;
			padding: 24rpx 32rpx;
			align-items: center;
			height: 40rpx;

			.dot {
				width: 10rpx;
				height: 10rpx;
				background-color: #399bfe;
				border-radius: 50%;
				animation: typing-dot 1.4s infinite ease-in-out;

				&:nth-child(2) {
					animation-delay: 0.2s;
				}

				&:nth-child(3) {
					animation-delay: 0.4s;
				}
			}
		}
	}

	.options {
		display: flex;
		flex-wrap: wrap;
		gap: 20rpx;
		margin-top: 24rpx;

		.option-btn {
			padding: 18rpx 36rpx;
			background-color: #fff;
			color: #399bfe;
			border-radius: 36rpx;
			font-size: 28rpx;
			border: 2rpx solid rgba(57, 155, 254, 0.3);
			transition: all 0.2s ease;

			&:active {
				background-color: #399bfe;
				color: #fff;
				transform: scale(0.96);
			}
		}
	}

	.footer-info {
		background-color: #fff;
		color: #adb5bd;
		font-size: 22rpx;
		text-align: center;
		padding: 30rpx 24rpx;
		padding-bottom: calc(30rpx + env(safe-area-inset-bottom));
		border-top: 1rpx solid #f1f3f5;
	}

	@keyframes rotate {
		from { transform: rotate(0deg); }
		to { transform: rotate(360deg); }
	}

	@keyframes typing-dot {
		0%, 80%, 100% { transform: scale(0); opacity: 0.3; }
		40% { transform: scale(1); opacity: 1; }
	}
</style>
