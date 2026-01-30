<template>
	<view class="dianzan-component" :class="{ 'like-animation': isLiked, 'bargain-mode': mode === 'bargain', 'bargain-complete': isBargainComplete }">
		<!-- 砂价成功弹窗 -->
		<bargain-success-popup 
			ref="successPopup"
			:bargainAmount="lastBargainAmount"
			:currentPrice="currentPrice"
			:isComplete="isBargainComplete"
			:successImage="bargainPopupImage || '/static/images/砍价.png'"
			:tipMessage="dynamicMessage"
			:customMessage="bargainSuccessMessage"
			:customAmountLabel="bargainAmountText"
			:isMessageMode="isShowingMessageOnly"
			@continue="handleShareInvite"
			@view-detail="handleViewDetail"
			@close="handlePopupClose"
		></bargain-success-popup>
		
		<!-- 点赞模式 -->
		<template v-if="mode === 'like'">
			<view class="like-wrapper" @click="handleClick">
				<uni-icons 
					:type="isLiked ? 'heart-filled' : 'heart'" 
					:size="iconSize" 
					:color="isLiked ? likedColor : unlikedColor"
				></uni-icons>
				<view class="text" :style="{ color: isLiked ? likedColor : textColor, fontSize: fontSize + 'rpx' }" v-if="showText">
					{{ isLiked ? likedText : unlikedText }}
				</view>
				<view class="text" :style="{ color: isLiked ? likedColor : textColor, fontSize: fontSize + 'rpx' }" v-if="showCount">
					{{ displayCount }}
				</view>
			</view>
		</template>
		
		<!-- 砍价模式 -->
		<template v-else-if="mode === 'bargain'">
			<!-- 右上角倒计时 - 已隐藏 -->
			<!-- <view class="bargain-countdown-corner" v-if="bargainEndTime && bargainEndTime > 0 && !isBargainComplete">
				<uni-icons type="clock-filled" size="16" color="#ffffff"></uni-icons>
				<text class="countdown-text" :class="{ 'expired': isBargainExpired }">{{ remainingTime || '计算中...' }}</text>
			</view> -->
			
			<!-- 第一行：原价 + 已返现金额（独立一行） -->
			<view class="price-first-row" v-if="!isBargainComplete">
				<view class="original-price">
					原价: <text class="price-text">¥{{ initialPrice.toFixed(2) }}</text>
				</view>
				<view class="bargained-amount" v-if="totalBargained > 0 && bargainStats && bargainStats.total_bargained_amount !== null && bargainStats.total_bargained_amount !== undefined">
					已返现: <text class="amount-text">¥{{ bargainStats.total_bargained_amount.toFixed(2) }}</text>
				</view>
			</view>
			
			<!-- 第二行：砍价主内容区（剩余可返现金额 + 按钮） -->
			<view class="bargain-main-content">
				<!-- 剩余可返现金额（砍价图标 + 金额） -->
				<view class="current-price-wrapper">
					<image 
						class="bargain-icon"
						src="/static/images/砍价.png" 
						mode="aspectFit"
					></image>
					<view class="bargain-price" :style="{ color: isBargainComplete ? bargainCompleteColor : likedColor, fontSize: (fontSize + 4) + 'rpx' }">
						剩余: ¥{{ displayPrice }}
					</view>
				</view>
				
			<!-- 购买按钮（紧凑版，在价格后面）- 未购买的用户可以看到 -->
			<view 
				v-if="enableBuyout && !isInitiator && !isBargainComplete && !isBargainExpired"
				class="buyout-button-compact"
				:class="{ 'buyout-clicking': isBuyoutClicking }"
				@click="handleBuyoutClick"
			>
				<text>立即购买</text>
			</view>
				
				<!-- 右侧按钮 - 添加点击事件和动画类 -->
				<view 
					class="bargain-button" 
					:class="{ 
						'complete': isBargainComplete, 
						'expired': isBargainExpired,
						'button-clicking': isButtonClicking
					}"
					@click="handleBargainButtonClick"
				>
					<view class="button-text">{{ isBargainExpired ? '活动已结束' : (isBargainComplete ? bargainCompleteText : bargainText) }}</view>
				</view>
			</view>
			
			<!-- 飘红动画（砍价成功后显示返现金额） -->
			<view class="bargain-float-text" v-if="showFloatText" :class="{ 'float-animation': showFloatText }">
				+¥{{ lastBargainAmount.toFixed(2) }}
			</view>
			
			<!-- 底部进度条区域（最底部，带红色边框标注） -->
			<view class="bargain-progress-section" v-if="!isBargainComplete">
				<view class="bargain-progress">
					<view class="progress-bar" :style="{ width: bargainProgress + '%' }"></view>
				</view>
				<view class="progress-percentage">{{ bargainProgress }}%</view>
			</view>
			
			<!-- 买断功能按钮（在进度条下方） - 已移至价格后面，此处隐藏 -->
			<!-- <view class="buyout-section" v-if="enableBuyout && !isBargainComplete && !isBargainExpired && currentPrice > 0">
				<view class="buyout-price-info">
					<uni-icons type="star" size="16" color="#FFB800"></uni-icons>
					<text class="buyout-label">买断价：</text>
					<text class="buyout-price">￥{{ displayPrice }}</text>
				</view>
				<view 
					class="buyout-button"
					:class="{ 'buyout-clicking': isBuyoutClicking }"
					@click="handleBuyoutClick"
				>
					<uni-icons type="cart-filled" size="18" color="#fff"></uni-icons>
					<text>直接买断</text>
				</view>
			</view> -->
			
			<!-- 砍价统计信息（在进度条下方，只要有参与就显示） -->
			<view class="bargain-stats" v-if="bargainStats && bargainStats.total_participants > 0">
				<!-- 统计文字 -->
				<view class="stats-text">
					我发起的砍价：已有 <text class="stats-number">{{ bargainStats.total_participants }}</text> 人参与：
				</view>
				
				<!-- 参与用户头像列表 -->
				<view class="participants-avatars" v-if="bargainStats.participants && bargainStats.participants.length > 0">
					<!-- 如果参与人数超过显示数量，在左侧显示+N -->
					<view class="more-count" v-if="bargainStats.total_participants > maxDisplayAvatars">
						+{{ bargainStats.total_participants - maxDisplayAvatars }}
					</view>
					<image 
						v-for="(user, index) in displayParticipants" 
						:key="user.user_id"
						:src="user.avatar" 
						class="avatar-item"
						:style="{ zIndex: index + 1 }"
						mode="aspectFill"
					></image>
				</view>
			</view>
		</template>
	</view>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useUserInfoStore } from '@/store/user.js'
import { testLogin } from '@/utils/isLogin'
import BargainSuccessPopup from '@/components/bargain-success-popup/bargain-success-popup.vue'

// 定义组件属性
const props = defineProps({
	// 文章ID
	articleId: {
		type: String,
		required: true
	},
	// 组件模式: 'like' 点赞模式 | 'bargain' 砍价模式
	mode: {
		type: String,
		default: 'like',
		validator: (value) => ['like', 'bargain'].includes(value)
	},
	// 是否显示文字
	showText: {
		type: Boolean,
		default: true
	},
	// 是否显示数量
	showCount: {
		type: Boolean,
		default: false
	},
	// 图标大小
	iconSize: {
		type: [Number, String],
		default: 24
	},
	// 字体大小(rpx)
	fontSize: {
		type: Number,
		default: 24
	},
	// 已点赞颜色
	likedColor: {
		type: String,
		default: '#ff6b6b'
	},
	// 未点赞颜色
	unlikedColor: {
		type: String,
		default: '#444444'
	},
	// 文字颜色
	textColor: {
		type: String,
		default: '#333'
	},
	// 已点赞文字
	likedText: {
		type: String,
		default: '已赞'
	},
	// 未点赞文字
	unlikedText: {
		type: String,
		default: '点赞'
	},
	// 初始点赞状态
	initialLiked: {
		type: Boolean,
		default: false
	},
	// 初始点赞数
	initialCount: {
		type: Number,
		default: 0
	},
	// === 砍价模式相关属性 ===
	// 初始价格(砍价模式)
	initialPrice: {
		type: Number,
		default: 1000
	},
	// 每次砍价金额
	bargainStep: {
		type: Number,
		default: 10
	},
	// 砍价完成文字
	bargainCompleteText: {
		type: String,
		default: '返现完成'
	},
	// 砍价按钮文字
	bargainText: {
		type: String,
		default: '帮砍一刀'
	},
	// 砍价完成颜色
	bargainCompleteColor: {
		type: String,
		default: '#52c41a'
	},
	// 砍价成功弹窗相关属性
	// 砍价成功话术（支持自定义）
	bargainSuccessMessage: {
		type: String,
		default: '恭喜！小组长获得返现！'
	},
	// 是否显示砍价成功弹窗
	showBargainPopup: {
		type: Boolean,
		default: true
	},
	// 砂价弹窗图片（新增）
	bargainPopupImage: {
		type: String,
		default: ''
	},
	// 砂价弹窗金额提示文字（新增）
	bargainAmountText: {
		type: String,
		default: ''
	},
	// 砂价结束时间(timestamp)
	bargainEndTime: {
		type: Number,
		default: 0
	},
	// 买断功能相关属性
	// 是否启用买断
	enableBuyout: {
		type: Boolean,
		default: false
	},
	// 是否是小组长（发起人）- 只有小组长才能看到买断按钮
	isInitiator: {
		type: Boolean,
		default: false
	}
})

// 定义事件
const emit = defineEmits([
	'update:liked', 
	'update:count', 
	'update:price', // 价格更新事件（用于买断功能）
	'like-success', 
	'like-error',
	// 砍价相关事件
	'bargain-success', // 砍价成功事件 { currentPrice, isComplete, step }
	'bargain-complete', // 砍价完成事件 { finalPrice }
	'bargain-error', // 砍价失败事件
	// 弹窗相关事件
	'share-invite', // 邀请好友砍价事件
	'view-detail', // 查看详情事件
	// 买断相关事件
	'buyout-click', // 买断按钮点击事件
	'buyout-success', // 买断成功事件
	'buyout-error' // 买断失败事件
])

// 用户信息
const userStore = useUserInfoStore()

// 云函数实例
const articleApi = uniCloud.importObject('articleWx', { customUI: true })

// 监听 bargainPopupImage 变化
// watch(() => props.bargainPopupImage, (newVal) => {
// 	console.log('====== dianzan 组件接收到弹窗图片 ======')
// 	console.log('bargainPopupImage:', newVal)
// 	console.log('是否为空:', !newVal)
// 	console.log('===========================================')
// }, { immediate: true })

// 监听 currentPrice 变化，触发 update:price 事件供 articleDetail 使用
watch(() => currentPrice.value, (newPrice) => {
	emit('update:price', newPrice)
	console.log('🔔 发出价格更新事件:', newPrice)
}, { immediate: true })

// 点赞状态
const isLiked = ref(props.initialLiked)
const likeCount = ref(props.initialCount)
const isLikeRequesting = ref(false)
// 标记是否已经查询过点赞状态
const hasQueriedStatus = ref(false)

// 弹窗引用
const successPopup = ref(null)

// 砍价状态
const currentPrice = ref(props.initialPrice)
const isBargainComplete = ref(false)
const isBargainRequesting = ref(false)
const lastBargainAmount = ref(0) // 最后一次砍价的金额
const showFloatText = ref(false) // 是否显示飘红文字
const bargainStats = ref(null) // 砍价统计数据

// 买断状态
const isBuyoutClicking = ref(false) // 买断按钮点击动画
const maxDisplayAvatars = ref(5) // 动态计算的最大显示头像数
const isBargainExpired = ref(false) // 砍价是否已过期
const remainingTime = ref('') // 剩余时间字符串
const isButtonClicking = ref(false) // 按钮点击状态
const isShowingMessageOnly = ref(false) // 是否为纯提示模式
const dynamicMessage = ref('') // 动态提示消息（用于错误提示等）

// 开发环境日志输出（简化版，小程序环境兼容）
const devLog = (...args) => {
	// 在小程序开发环境中输出日志，生产环境可通过条件编译控制
	// #ifdef MP-WEIXIN
	console.log(...args)
	// #endif
	// #ifdef H5
	console.log(...args)
	// #endif
}

// 显示的点赞数
const displayCount = computed(() => {
	if (likeCount.value >= 10000) {
		return (likeCount.value / 10000).toFixed(1) + 'w'
	}
	if (likeCount.value >= 1000) {
		return (likeCount.value / 1000).toFixed(1) + 'k'
	}
	return likeCount.value
})

// 显示的价格(格式化为两位小数)
const displayPrice = computed(() => {
	if (currentPrice.value <= 0) {
		return '0.00'
	}
	return currentPrice.value.toFixed(2)
})

// 砍价进度百分比（基于总砍价金额计算）
const bargainProgress = computed(() => {
	if (props.initialPrice <= 0) return '100.00'
	
	// 优先使用统计数据中的总砍价金额
	if (bargainStats.value && bargainStats.value.total_bargained_amount !== null && bargainStats.value.total_bargained_amount !== undefined) {
		const progress = (bargainStats.value.total_bargained_amount / props.initialPrice) * 100
		return Math.min(100, Math.max(0, progress)).toFixed(2)
	}
	
	// 备用方案：使用价格差计算
	const progress = ((props.initialPrice - currentPrice.value) / props.initialPrice) * 100
	return Math.min(100, Math.max(0, progress)).toFixed(2)
})

// 总共砍掉的金额
const totalBargained = computed(() => {
	return props.initialPrice - currentPrice.value
})

// 显示的参与用户头像列表（根据容器宽度动态计算）
const displayParticipants = computed(() => {
	if (!bargainStats.value || !bargainStats.value.participants) {
		return []
	}
	// 取前 maxDisplayAvatars 个最新用户，然后反转顺序：从左到右：旧 -> 新
	const latest = bargainStats.value.participants.slice(0, maxDisplayAvatars.value)
	return latest.reverse()
})

// 检查砍价是否过期
const checkBargainExpired = () => {
	console.log('=== checkBargainExpired 调试 ===', {
		bargainEndTime: props.bargainEndTime,
		bargainEndTimeType: typeof props.bargainEndTime,
		isBargainComplete: isBargainComplete.value
	})
	
	if (!props.bargainEndTime || props.bargainEndTime === 0) {
		isBargainExpired.value = false
		remainingTime.value = ''
		console.log('bargainEndTime 为空或为0，不显示倒计时')
		return false
	}
	
	const now = Date.now()
	const endTime = props.bargainEndTime
	
	console.log('倒计时计算:', {
		now,
		endTime,
		diff: endTime - now,
		isExpired: now >= endTime
	})
	
	if (now >= endTime) {
		isBargainExpired.value = true
		remainingTime.value = '活动已结束'
		console.log('活动已过期')
		return true
	}
	
	// 计算剩余时间
	const diff = endTime - now
	const days = Math.floor(diff / (1000 * 60 * 60 * 24))
	const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
	const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
	
	if (days > 0) {
		remainingTime.value = `剩余${days}天${hours}小时`
	} else if (hours > 0) {
		remainingTime.value = `剩余${hours}小时${minutes}分钟`
	} else {
		remainingTime.value = `剩余${minutes}分钟`
	}
	
	console.log('倒计时结果:', remainingTime.value)
	
	isBargainExpired.value = false
	return false
}

// 自定义登录检查函数
const customTestLogin = async () => {
	try {
		// 直接检查store中的登录状态，避免弹出多个登录提示
		if (userStore.userInfo && userStore.userInfo.uid) {
			return true;
		}
		
		// 检查本地存储
		const userInfo = uni.getStorageSync('userInfo');
		if (userInfo && userInfo.uid) {
			userStore.setUserInfo(userInfo);
			return true;
		}
		
		// 只在需要时才调用testLogin弹出登录提示
		const isLoggedIn = await testLogin();
		return isLoggedIn;
	} catch (err) {
		console.error('登录检查失败:', err);
		return false;
	}
}

// 获取砍价状态
const getBargainStatus = async (silent = true) => {
	try {
		devLog('=== 开始获取砍价状态 ===')
		
		if (!props.articleId) {
			devLog('获取砍价状态失败: articleId 为空')
			return
		}
		
		// 静默检查用户登录状态（不触发登录弹窗）
		if (!userStore.userInfo?.uid) {
			const userInfo = uni.getStorageSync('userInfo');
			if (userInfo && userInfo.uid) {
				userStore.setUserInfo(userInfo);
			} else {
				devLog('用户未登录，使用初始状态')
				currentPrice.value = props.initialPrice
				isBargainComplete.value = false
				return
			}
		}
		
		try {
			// 调用云函数获取砍价状态
			const result = await articleApi.getBargainStatus(
				props.articleId,
				userStore.userInfo.uid,
				props.initialPrice
			)
			
			devLog('砍价状态查询结果:', result)
			
			if (result.errCode === 0) {
				currentPrice.value = result.current_price
				isBargainComplete.value = result.is_complete
				
				devLog('砍价状态已更新:', {
					currentPrice: currentPrice.value,
					isComplete: isBargainComplete.value,
					progress: bargainProgress.value
				})
				
				// 每次砍价后都获取统计数据
				await getBargainStats()
				
				// 显示提示
				if (isBargainComplete.value) {
					uni.showToast({
						title: props.bargainCompleteText,
						icon: 'success'
					})
				}
				
				// 发送全局事件
				uni.$emit('updateBargainStatus', {
					articleId: props.articleId,
					currentPrice: currentPrice.value,
					isComplete: isBargainComplete.value
				})
			} else {
				currentPrice.value = props.initialPrice
				isBargainComplete.value = false
			}
		} catch (err) {
			console.error('查询砍价状态失败:', err)
			currentPrice.value = props.initialPrice
			isBargainComplete.value = false
		}
	} catch (err) {
		console.error('获取砍价状态失败:', err)
		currentPrice.value = props.initialPrice
		isBargainComplete.value = false
	}
}

// 获取砍价统计数据
const getBargainStats = async () => {
	try {
		if (!props.articleId) {
			return
		}
		
		// 获取发起人ID（从本地存储中获取分享者ID，如果没有则当前用户是发起人）
		const sharerId = uni.getStorageSync('current_sharer_id')
		const initiatorId = sharerId || (userStore.userInfo?.uid || null)
		
		devLog('开始获取砍价统计数据...', { initiatorId })
		
		const result = await articleApi.getBargainStats(props.articleId, initiatorId)
		
		if (result.errCode === 0) {
			bargainStats.value = result.data
			devLog('砍价统计数据:', bargainStats.value)
			devLog('participants 数组:', bargainStats.value.participants)
			devLog('participants 长度:', bargainStats.value.participants?.length)
		} else {
			console.error('获取砍价统计失败:', result.errMsg)
		}
	} catch (err) {
		console.error('获取砍价统计失败:', err)
	}
}

// 获取点赞状态
const getLikeStatus = async (silent = true) => {
	try {
		devLog('=== 开始获取点赞状态 ===')
		
		// 检查 articleId 是否存在
		if (!props.articleId) {
			devLog('获取点赞状态失败: articleId 为空')
			isLiked.value = false
			return
		}
		
		devLog('文章ID:', props.articleId)
		
		// 静默检查用户登录状态（不触发登录弹窗）
		if (!userStore.userInfo?.uid) {
			const userInfo = uni.getStorageSync('userInfo');
			if (userInfo && userInfo.uid) {
				userStore.setUserInfo(userInfo);
			} else {
				isLiked.value = false
				devLog('用户未登录，点赞状态设置为false')
				return
			}
		}
		
		devLog('用户ID:', userStore.userInfo.uid)
		
		try {
			// 直接查询 kanjia 数据库集合（优化：使用 count 方法提升性能）
			const db = uniCloud.database()
			const queryParams = {
				article_id: props.articleId,
				user_id: userStore.userInfo.uid,
				record_type: 'like'
			}
			
			devLog('查询点赞记录参数:', queryParams)
			
			// 使用 count 查询，性能更好
			const result = await db.collection('kanjia')
				.where(queryParams)
				.count()
			
			const hasLikeRecord = result?.total > 0
			isLiked.value = hasLikeRecord
			// 标记已经查询过状态
			hasQueriedStatus.value = true
			
			devLog('点赞状态查询完成:', {
				isLiked: isLiked.value,
				articleId: props.articleId,
				color: isLiked.value ? props.likedColor : props.unlikedColor
			})
			
			// 发送事件通知父组件更新点赞状态
			emit('update:liked', isLiked.value)
			
			// 发送全局事件
			uni.$emit('updateArticleLikeStatus', {
				articleId: props.articleId,
				isLiked: isLiked.value,
				likeCount: likeCount.value
			})
		} catch (err) {
			console.error('查询点赞记录失败:', err)
			// 使用默认值，确保是布尔值
			isLiked.value = false
		}
	} catch (err) {
		console.error('获取点赞状态失败:', err)
		isLiked.value = false
	}
}

// 处理砍价按钮点击（新增）
const handleBargainButtonClick = async (e) => {
	// 阻止事件冒泡
	if (e && e.stopPropagation) {
		e.stopPropagation()
	}
	
	// 添加点击动画效果
	isButtonClicking.value = true
	setTimeout(() => {
		isButtonClicking.value = false
	}, 300)
	
	// 执行砍价操作
	await handleBargain()
}

// 处理砍价操作
const handleBargain = async () => {
	try {
		// 防止重复请求
		if (isBargainRequesting.value) {
			devLog('砍价请求进行中，请稍候')
			return
		}
		
		// 检查是否已过期
		if (checkBargainExpired()) {
			uni.showToast({
				title: '活动已结束',
				icon: 'none',
				duration: 2000
			})
			return
		}
		
		// 如果已经返现完成，不允许继续砍价
		if (isBargainComplete.value) {
			uni.showToast({
				title: '返现已达上限',
				icon: 'success'
			})
			return
		}
		
		// 检查用户登录状态
		const isLoggedIn = await customTestLogin()
		if (!isLoggedIn) {
			devLog('用户未登录，无法砍价')
			return
		}
		
		if (!userStore.userInfo?.uid) {
			console.error('用户信息不完整，无法砍价')
			uni.showToast({
				title: '登录信息异常，请重新登录',
				icon: 'none'
			})
			return
		}
		
		// 获取发起人ID（从本地存储中获取分享者ID，如果没有则当前用户是发起人）
		const sharerId = uni.getStorageSync('current_sharer_id')
		
		// 检查是否扫自己的码
		if (sharerId && sharerId === userStore.userInfo.uid) {
			// 扫自己的码，作为发起人查看状态，不能点击砍价
			uni.showToast({
				title: '这是您自己的返现活动，请分享给好友帮砍！',
				icon: 'none',
				duration: 2500
			})
			isBargainRequesting.value = false
			return
		}
		
		const initiatorId = sharerId || userStore.userInfo.uid
		
		// 获取发起人信息
		let initiatorInfo = {
			nickName: userStore.userInfo.nickName || '匿名用户',
			avatarUrl: userStore.userInfo.avatarUrl || '/static/images/touxiang.png'
		}
		
		// 如果有分享者信息，使用分享者信息作为发起人
		if (sharerId) {
			const sharerName = decodeURIComponent(uni.getStorageSync('current_sharer_name') || '匿名发起人')
			const sharerAvatar = decodeURIComponent(uni.getStorageSync('current_sharer_avatar') || '/static/images/touxiang.png')
			initiatorInfo = {
				nickName: sharerName,
				avatarUrl: sharerAvatar
			}
		}
		
		// 设置请求锁
		isBargainRequesting.value = true
		
		// 保存之前的价格
		const previousPrice = currentPrice.value
		
		devLog('砍价操作开始:', {
			article_id: props.articleId,
			initiator_id: initiatorId,
			user_id: userStore.userInfo.uid,
			previousPrice,
			bargainStep: props.bargainStep
		})
		
		// 乐观更新UI
		const newPrice = Math.max(0, previousPrice - props.bargainStep)
		currentPrice.value = newPrice
		
		// 检查是否完成砍价
		const isComplete = newPrice <= 0
		if (isComplete) {
			isBargainComplete.value = true
		}
		
			try {
				// 调用云函数执行砍价操作
				const result = await articleApi.bargain(
					props.articleId,
					userStore.userInfo.uid,
					props.bargainStep,
					props.initialPrice,
					{
						nickName: userStore.userInfo.nickName || '匿名用户',
						avatarUrl: userStore.userInfo.avatarUrl || '/static/images/touxiang.png'
					},
					initiatorId,
					initiatorInfo
				)
				
				devLog('砍价操作返回:', result)
			
				if (result.errCode === 0) {
					// 使用云函数返回的准确状态
					currentPrice.value = result.current_price
					isBargainComplete.value = result.is_complete
			
					// 设置最后一次砍价金额
					lastBargainAmount.value = result.bargain_amount
					
					// 检查文章是否已经有人完成砍价
					if (result.article_completed && result.winner_nickname) {
						// 如果活动已经有人完成，提示用户
						if (result.is_complete) {
							// 当前用户是获胜者
							console.log('恭喜！您是第一个完成砍价的用户！')
						} else {
							// 当前用户不是获胜者，但活动已经结束
							console.log(`活动已结束，获胜者是：${result.winner_nickname}`)
						}
					}
		
					// 立即更新本地统计数据（提供即时反馈）
					if (!bargainStats.value) {
						// 如果统计数据还未初始化，先创建基础结构
						bargainStats.value = {
							total_participants: 0,
							total_bargained_amount: 0,
							participants: []
						}
					}
					
					// 更新已砍总额（立即增加本次砍价金额）
					if (bargainStats.value.total_bargained_amount !== null && bargainStats.value.total_bargained_amount !== undefined) {
						bargainStats.value.total_bargained_amount += result.bargain_amount
					} else {
						bargainStats.value.total_bargained_amount = result.bargain_amount
					}
					
					devLog('本地统计数据已更新:', {
						total_bargained_amount: bargainStats.value.total_bargained_amount,
						bargain_amount: result.bargain_amount
					})
		
					// 显示飘红动画
					showFloatText.value = true
					setTimeout(() => {
						showFloatText.value = false
					}, 2000) // 延长到2秒
					
					devLog('砍价状态已更新:', {
						currentPrice: currentPrice.value,
						isComplete: isBargainComplete.value,
						progress: bargainProgress.value
					})
					
					// 每次砍价成功后都获取最新统计数据（异步更新，确保数据准确性）
					getBargainStats().catch(err => {
						console.error('获取砍价统计数据失败:', err)
					})
					
					// 显示砍价成功弹窗：在飘红动画进行到一半时展现
					if (props.showBargainPopup) {
						// 延迟1秒显示弹窗（飘红动画总时長2秒，一半时弹出）
						setTimeout(() => {
							nextTick(() => {
								if (successPopup.value) {
									successPopup.value.open()
								}
							})
						}, 1000) // 飘红动画进行到1秒后弹出
					} else {
					// 不显示弹窗时，显示原有的Toast提示
					if (isBargainComplete.value) {
						// 返现完成 - 使用图标提示
						uni.showToast({
							title: result.errMsg || props.bargainCompleteText,
							image: '/static/images/砍价.png',
							duration: 3000 // 延长到3秒
						})
					} else {
						// 砍价成功，小组长获得返现 - 使用图标提示
						uni.showToast({
							title: `返现成功¥${result.bargain_amount.toFixed(2)}`,
							image: '/static/images/砍价3.png',
							duration: 4000 // 延长到4秒
						})
					}
					}
					
					// 触发砍价完成事件
					if (isBargainComplete.value) {
						emit('bargain-complete', { 
							finalPrice: currentPrice.value,
							reward_points: result.reward_points || 0
						})
					}
					
					// 触发砍价成功事件
					emit('bargain-success', {
						currentPrice: currentPrice.value,
						isComplete: isBargainComplete.value,
						step: result.bargain_amount,
						progress: result.progress,
						reward_points: result.reward_points || 0
					})
					
					// 发送全局事件
					uni.$emit('updateBargainStatus', {
						articleId: props.articleId,
						currentPrice: currentPrice.value,
						isComplete: isBargainComplete.value
					})
				} else {
					// 操作失败,回滚 UI
					currentPrice.value = previousPrice
					isBargainComplete.value = false
				
					// 检查是否为"今天已经砍过价了"错误或新的错误信息
					if (result.errMsg && (result.errMsg.includes('已经帮TA砍过价了') || result.errMsg.includes('不能帮自己砍价'))) {
						// 显示弹窗提示
						isShowingMessageOnly.value = true
						dynamicMessage.value = result.errMsg
						
						if (props.showBargainPopup) {
							setTimeout(() => {
								nextTick(() => {
									if (successPopup.value) {
										successPopup.value.open()
									}
								})
							}, 300)
						} else {
							uni.showToast({
								title: result.errMsg,
								icon: 'none',
								duration: 2000
							})
						}
					} else {
						// 其他错误，显示 Toast
						uni.showToast({
							title: result.errMsg || '操作失败',
							icon: 'none',
							duration: 2000
						})
					}
					
					emit('bargain-error', result)
				}
		
		} catch (apiError) {
			// API调用失败，回滚 UI
			console.error('砍价API调用失败:', apiError)
			currentPrice.value = previousPrice
			isBargainComplete.value = false
			
			// 优先显示云函数返回的错误信息
			let errorMsg = '操作失败';
			
			// 尝试从不同的错误对象结构中提取错误信息
			if (apiError && apiError.errMsg) {
				errorMsg = apiError.errMsg;
			} else if (apiError && apiError.message) {
				errorMsg = apiError.message;
			} else if (typeof apiError === 'string') {
				errorMsg = apiError;
			}
			
			// 检查是否为新的错误信息
			if (errorMsg.includes('已经帮TA砍过价了') || errorMsg.includes('不能帮自己砍价')) {
				// 显示弹窗提示
				isShowingMessageOnly.value = true
				dynamicMessage.value = errorMsg
				
				if (props.showBargainPopup) {
					setTimeout(() => {
						nextTick(() => {
							if (successPopup.value) {
								successPopup.value.open()
							}
						})
					}, 300)
				} else {
					uni.showToast({
						title: errorMsg,
						icon: 'none',
						duration: 2500
					})
				}
			} else {
				// 其他错误，显示 Toast
				uni.showToast({
					title: errorMsg,
					icon: 'none',
					duration: 2500
				})
			}
			
			emit('bargain-error', apiError)
		}
	} catch (err) {
		console.error('砍价操作失败:', err)
		uni.showToast({
			title: '操作失败',
			icon: 'none'
		})
		emit('bargain-error', err)
	} finally {
		// 释放请求锁
		isBargainRequesting.value = false
	}
}

// 处理买断按钮点击
// 处理买断按钮点击 - 发出事件，由父组件处理
const handleBuyoutClick = () => {
	// 添加点击动画效果
	isBuyoutClicking.value = true
	setTimeout(() => {
		isBuyoutClicking.value = false
	}, 300)
	
	// 发出买断点击事件，由父组件 articleDetail.vue 处理具体的买断逻辑
	emit('buyout-click', {
		currentPrice: currentPrice.value
	})
}

// 统一的点击处理函数
const handleClick = async () => {
	if (props.mode === 'bargain') {
		await handleBargain()
	} else {
		await handleLike()
	}
}

// 处理点赞操作
const handleLike = async () => {
	try {
		// 防止重复请求
		if (isLikeRequesting.value) {
			devLog('点赞请求进行中，请稍候')
			return
		}
		
		// 检查用户登录状态和信息
		const isLoggedIn = await customTestLogin()
		if (!isLoggedIn) {
			devLog('用户未登录，无法点赞')
			return
		}
		
		if (!userStore.userInfo?.uid) {
			console.error('用户信息不完整，无法点赞')
			uni.showToast({
				title: '登录信息异常，请重新登录',
				icon: 'none'
			})
			return
		}
		
		// 设置请求锁
		isLikeRequesting.value = true
		
		// 保存之前的状态（用于回滚）
		const previousLikeStatus = isLiked.value
		const previousLikeCount = likeCount.value
		
		devLog('点赞操作开始:', {
			article_id: props.articleId,
			previousLikeStatus,
			previousLikeCount
		})
		
		// 乐观更新UI（先改变UI，提升用户体验）
		const newLikeStatus = !previousLikeStatus
		isLiked.value = newLikeStatus
		likeCount.value = newLikeStatus ? previousLikeCount + 1 : previousLikeCount - 1
		
		try {
			// 调用云函数执行点赞操作
			const result = await articleApi.clickLike(
				props.articleId,
				userStore.userInfo.uid,
				previousLikeStatus
			)
			
			devLog('点赞操作返回:', result)
			
			if (result.errCode === 0) {
				// 使用云函数返回的准确状态
				isLiked.value = result.is_liked ?? newLikeStatus
				likeCount.value = result.like_count ?? likeCount.value
				// 标记已更新状态
				hasQueriedStatus.value = true
				
				devLog('点赞状态已更新:', { 
					isLiked: isLiked.value, 
					likeCount: likeCount.value,
					color: isLiked.value ? props.likedColor : props.unlikedColor
				})
				
				// 显示操作提示（简洁版）
				uni.showToast({
					title: isLiked.value ? '点赞成功' : '已取消',
					icon: 'success',
					duration: 1200
				})
				
				// 发送事件通知
				emit('update:liked', isLiked.value)
				emit('update:count', likeCount.value)
				emit('like-success', { isLiked: isLiked.value, likeCount: likeCount.value })
				
				// 发送全局事件，通知其他组件更新
				uni.$emit('updateArticleLikeStatus', {
					articleId: props.articleId,
					isLiked: isLiked.value,
					likeCount: likeCount.value
				})
			} else {
				// 操作失败，回滚UI
				isLiked.value = previousLikeStatus
				likeCount.value = previousLikeCount
				
				uni.showToast({
					title: result.errMsg || '操作失败',
					icon: 'none',
					duration: 1500
				})
				
				emit('like-error', result)
			}
		} catch (apiError) {
			// API调用失败，回滚UI
			console.error('点赞API调用失败:', apiError)
			isLiked.value = previousLikeStatus
			likeCount.value = previousLikeCount
			
			uni.showToast({
				title: '网络异常',
				icon: 'none',
				duration: 1500
			})
			
			emit('like-error', apiError)
		}
	} catch (err) {
		console.error('点赞操作失败:', err)
		uni.showToast({
			title: '操作失败',
			icon: 'none'
		})
		emit('like-error', err)
	} finally {
		// 释放请求锁
		isLikeRequesting.value = false
	}
}

// 监听全局点赞状态更新事件
const handleGlobalLikeUpdate = (data) => {
	if (data && data.articleId === props.articleId) {
		isLiked.value = data.isLiked
		likeCount.value = data.likeCount
		// 标记已更新状态
		hasQueriedStatus.value = true
		devLog('全局事件更新点赞状态:', { isLiked: isLiked.value, likeCount: likeCount.value })
	}
}

// 监听全局砍价状态更新事件
const handleGlobalBargainUpdate = (data) => {
	if (data && data.articleId === props.articleId) {
		currentPrice.value = data.currentPrice
		isBargainComplete.value = data.isComplete
		devLog('全局事件更新砍价状态:', { currentPrice: currentPrice.value, isComplete: isBargainComplete.value })
	}
}

// 监听 props 变化（优化：避免覆盖已查询的状态）
watch(() => props.initialLiked, (newVal) => {
	// 只在未查询过状态时同步初始值
	if (!hasQueriedStatus.value) {
		isLiked.value = newVal
	}
})

watch(() => props.initialCount, (newVal) => {
	likeCount.value = newVal
})

watch(() => props.initialPrice, (newVal) => {
	currentPrice.value = newVal
	isBargainComplete.value = newVal <= 0
})

// 监听 bargainEndTime 变化
watch(() => props.bargainEndTime, (newVal, oldVal) => {
	console.log('=== bargainEndTime 监听变化 ===', {
		oldVal,
		newVal,
		newValType: typeof newVal,
		currentTime: Date.now()
	})
	if (newVal && newVal > 0) {
		checkBargainExpired()
	}
})

// 监听 articleId 变化,重新获取点赞状态
watch(() => props.articleId, async (newVal, oldVal) => {
	if (newVal && newVal !== oldVal) {
		devLog('articleId 变化,重新获取点赞状态:', newVal)
		// 重置查询标志
		hasQueriedStatus.value = false
		await getLikeStatus()
	}
})

// 计算容器可以容纳的头像数量
const calculateMaxAvatars = () => {
	try {
		// 获取系统信息
		const systemInfo = uni.getSystemInfoSync()
		const screenWidth = systemInfo.screenWidth || 375 // 默认375px
		
		// 头像宽度: 56rpx ≈ 28px (750rpx设计稿)
		// 头像重叠: -20rpx ≈ -10px
		// 实际每个头像占用: 56 - 20 = 36rpx ≈ 18px
		// +N标记占用: 56rpx ≈ 28px
		// 容器左右padding: 32rpx * 2 ≈ 32px
		// 留出一些余量
		
		const avatarWidth = 28 // 头像实际宽度
		const avatarOverlap = 10 // 重叠部分
		const avatarEffectiveWidth = avatarWidth - avatarOverlap // 每个头像实际占用宽度
		const moreCountWidth = 28 // +N标记宽度
		const containerPadding = 64 // 容器内边距
		const reservedSpace = 20 // 预留空间
		
		// 可用宽度
		const availableWidth = screenWidth - containerPadding - reservedSpace
		
		// 计算可以显示的头像数量
		// 至少显示1个头像 + +N标记
		let maxCount = Math.floor((availableWidth - moreCountWidth) / avatarEffectiveWidth)
		
		// 限制在合理范围内（最少3个，最多20个）
		maxCount = Math.max(3, Math.min(20, maxCount))
		
		maxDisplayAvatars.value = maxCount
		
		devLog('动态计算头像数量:', {
			screenWidth,
			availableWidth,
			maxCount
		})
	} catch (err) {
		console.error('计算头像数量失败:', err)
		// 出错时使用默认值
		maxDisplayAvatars.value = 5
	}
}

// 组件挂载时获取点赞状态
onMounted(async () => {
	// 计算可显示的头像数量
	calculateMaxAvatars()
	
	// 设置初始值
	isLiked.value = props.initialLiked
	likeCount.value = props.initialCount
	currentPrice.value = props.initialPrice
	isBargainComplete.value = props.initialPrice <= 0
	
	// 如果有 articleId
	if (props.articleId) {
		devLog('组件挂载,articleId:', props.articleId)
		
		// 根据模式获取状态
		if (props.mode === 'bargain') {
			// 调试：输出砍价结束时间
			console.log('=== 砍价组件挂载调试 ===', {
				bargainEndTime: props.bargainEndTime,
				bargainEndTimeType: typeof props.bargainEndTime,
				currentTime: Date.now(),
				isBargainComplete: isBargainComplete.value
			})
			
			// 检查砍价是否过期
			checkBargainExpired()
			// 如果有结束时间，启动定时器更新倒计时
			if (props.bargainEndTime && props.bargainEndTime > 0) {
				setInterval(() => {
					checkBargainExpired()
				}, 60000) // 每分钟更新一次
			}
			await getBargainStatus()
		} else {
			await getLikeStatus()
		}
	} else {
		devLog('组件挂载时 articleId 为空')
	}
	
	// 监听全局点赞更新事件
	uni.$on('updateArticleLikeStatus', handleGlobalLikeUpdate)
	
	// 监听全局砍价更新事件
	uni.$on('updateBargainStatus', handleGlobalBargainUpdate)
})

// 组件卸载时移除事件监听
onBeforeUnmount(() => {
	uni.$off('updateArticleLikeStatus', handleGlobalLikeUpdate)
	uni.$off('updateBargainStatus', handleGlobalBargainUpdate)
})

// 暴露给父组件的方法和状态
defineExpose({
	// 砍价相关
	handleBargain, // 砍价方法
	isBargainComplete, // 砍价完成状态
	currentPrice, // 当前价格
	getBargainStatus, // 获取砍价状态方法
	bargainProgress, // 砍价进度
	// 点赞相关
	getLikeStatus, // 获取点赞状态方法
	handleClick, // 点赞方法
	handleLike, // 点赞方法（别名）
	isLiked, // 点赞状态
	likeCount // 点赞数
})

// 弹窗相关处理方法
// 处理继续邀请（分享给好友）
const handleShareInvite = () => {
	console.log('用户点击了邀请好友砍价')
	// 触发分享事件，由父组件处理分享逻辑
	emit('share-invite')
}

// 处理查看详情
const handleViewDetail = () => {
	console.log('用户点击了查看详情')
	// 触发查看详情事件，由父组件处理
	emit('view-detail')
}

// 处理弹窗关闭
const handlePopupClose = () => {
	console.log('砍价成功弹窗已关闭')
	// 重置提示模式
	isShowingMessageOnly.value = false
	dynamicMessage.value = ''
}
</script>

<style lang="scss" scoped>
.dianzan-component {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 4rpx;
	position: relative;
	transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
	// 与 articleDetail.vue 中的 action-item 保持一致
	// 修复：不再使用 100% 宽高，避免父容器没有尺寸时崩溃
	min-width: 60rpx;
	min-height: 60rpx;
	user-select: none;
	-webkit-tap-highlight-color: transparent;
	
	// 点赞模式 - 添加点击样式
	.like-wrapper {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 4rpx;
		cursor: pointer;
		transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
		padding: 8rpx;
		border-radius: 8rpx;
		
		&:active {
			opacity: 0.65;
			transform: scale(0.92);
			background-color: rgba(0, 0, 0, 0.05);
		}
	}
	
	&.like-animation {
		animation: heartBeat 0.45s cubic-bezier(0.4, 0, 0.2, 1);
	}
	
	// 砍价模式样式
	&.bargain-mode {
		min-width: 100%;
		width: 100%;
		gap: 12rpx;
		padding: 24rpx 32rpx; // 增加内边距，从 20rpx 24rpx 增加到 24rpx 32rpx
		align-items: stretch;
		position: relative; // 添加相对定位，供倒计时绝对定位使用
	}
	
	// 砍价完成样式
	&.bargain-complete {
		animation: bargainSuccess 0.6s cubic-bezier(0.4, 0, 0.2, 1);
	}
	
	.text {
		margin-top: 8rpx;
		font-size: 24rpx;
		transition: color 0.25s ease;
		font-weight: 400;
	}
	
	// 第一行：原价 + 已砍金额（独立一行，居中对齐）
	.price-first-row {
		display: flex;
		flex-direction: row;
		align-items: center;
		justify-content: center; // 修改：居中对齐
		gap: 40rpx; // 添加：两个元素之间的间距
		width: 100%;
		margin-bottom: 12rpx; // 与下一行的间距
		
		.original-price {
			font-size: 34rpx;
			color: #999;
			white-space: nowrap;
			
			.price-text {
				text-decoration: line-through;
				color: #999;
			}
		}
		
		.bargained-amount {
			font-size: 34rpx;
			color: #666;
			font-weight: 500;
			white-space: nowrap;
			
			.amount-text {
				color: #ff6b6b;
				font-weight: 600;
				font-size: 36rpx;
			}
		}
	}
	
	// 倒计时显示（原样式，保留作为备用）
	.bargain-countdown {
		display: flex;
		align-items: center;
		gap: 8rpx;
		padding: 8rpx 16rpx;
		background: linear-gradient(135deg, #fff5f5, #ffe8e8);
		border-radius: 20rpx;
		margin-bottom: 12rpx;
		width: fit-content;
		
		.countdown-text {
			font-size: 24rpx;
			color: #ff6b6b;
			font-weight: 500;
			
			&.expired {
				color: #999;
			}
		}
	}
	
	// 右上角倒计时 - 增强视觉效果
	.bargain-countdown-corner {
		position: absolute;
		top: 12rpx;
		right: 12rpx;
		display: flex;
		align-items: center;
		gap: 8rpx;
		padding: 10rpx 18rpx;
		background: linear-gradient(135deg, #ff6b6b 0%, #ff8787 100%);
		border-radius: 24rpx;
		box-shadow: 0 4rpx 12rpx rgba(255, 107, 107, 0.35),
		            0 2rpx 6rpx rgba(255, 107, 107, 0.25);
		z-index: 10;
		transition: all 0.3s ease;
		
		// 添加光晕效果
		&::before {
			content: '';
			position: absolute;
			top: -2rpx;
			left: -2rpx;
			right: -2rpx;
			bottom: -2rpx;
			background: linear-gradient(135deg, rgba(255, 107, 107, 0.3), rgba(255, 135, 135, 0.3));
			border-radius: 26rpx;
			z-index: -1;
			opacity: 0.6;
			filter: blur(4rpx);
		}
		
		.countdown-text {
			font-size: 24rpx;
			color: #ffffff;
			font-weight: 600;
			white-space: nowrap;
			text-shadow: 0 1rpx 3rpx rgba(0, 0, 0, 0.2);
			letter-spacing: 0.5rpx;
			
			&.expired {
				color: #ffffff;
				opacity: 0.9;
			}
		}
	}
	
	// 砍价统计信息区域（在进度条下方）
	.bargain-stats {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		justify-content: flex-start;
		gap: 12rpx;
		width: 100%;
		margin-top: 16rpx;
		
		// 参与用户头像列表
		.participants-avatars {
			display: flex;
			flex-direction: row;
			align-items: center;
			position: relative;
			width: auto;
			white-space: nowrap;
			overflow: visible;
			direction: ltr;
			flex-shrink: 0;
			justify-content: flex-start;
			
			.avatar-item {
				width: 56rpx;
				height: 56rpx;
				border-radius: 50%;
				border: 3rpx solid #fff;
				box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
				margin-left: -20rpx;
				transition: all 0.3s ease;
				background-color: #f5f5f5;
				position: relative;
				
				&:first-child {
					margin-left: 0;
				}
				
				&:hover {
					transform: translateX(4rpx);
					box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.15);
				}
			}
			
			.more-count {
				display: flex;
				align-items: center;
				justify-content: center;
				width: 56rpx;
				height: 56rpx;
				border-radius: 50%;
				background: linear-gradient(135deg, #ff9800, #ff6b6b);
				color: #fff;
				font-size: 22rpx;
				font-weight: 700;
				margin-left: 0;
				border: 3rpx solid #fff;
				box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
				position: relative;
				z-index: 0;
			}
		}
		
		.stats-text {
			width: 100%;
			font-size: 28rpx;
			color: #666;
			line-height: 1.5;
			white-space: nowrap;
			overflow: hidden;
			text-overflow: ellipsis;
			direction: ltr;
			
			.stats-number {
				color: #ff9800;
				font-weight: 700;
				font-size: 32rpx;
				margin: 0 4rpx;
			}
			
			.stats-amount {
				color: #ff6b6b;
				font-weight: 700;
				font-size: 32rpx;
				margin: 0 4rpx;
			}
		}
	}
	
	// 第二行：砍价主内容区（当前价格 + 按钮）
	.bargain-main-content {
		display: flex;
		flex-direction: row;
		align-items: center;
		justify-content: space-between;
		width: 100%;
		gap: 24rpx;
		
		.current-price-wrapper {
			display: flex;
			align-items: center;
			justify-content: center; // 水平居中
			gap: 8rpx;
			flex: 1; // 占据剩余空间
			
			// 添加底色和样式
			background: linear-gradient(135deg, #fff5f5, #ffe8e8);
			padding: 20rpx 24rpx;
			border-radius: 16rpx;
			box-shadow: 0 2rpx 8rpx rgba(255, 107, 107, 0.1);
			border: 2rpx solid #ffdddd;
			transition: all 0.3s ease;
			
			&:active {
				transform: scale(0.98);
				box-shadow: 0 1rpx 4rpx rgba(255, 107, 107, 0.15);
			}
			
			.bargain-icon {
				width: 32rpx;
				height: 32rpx;
				flex-shrink: 0;
			}
		}
		
		// 紧凑版买断按钮（在价格后面）
		.buyout-button-compact {
			display: flex;
			align-items: center;
			justify-content: center;
			padding: 16rpx 28rpx;
			background: linear-gradient(135deg, #FFB800 0%, #FF8C00 100%);
			border-radius: 50rpx;
			box-shadow: 0 4rpx 12rpx rgba(255, 184, 0, 0.3);
			transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
			cursor: pointer;
			position: relative;
			overflow: hidden;
			flex-shrink: 0;
			
			// 添加光晕效果
			&::before {
				content: '';
				position: absolute;
				top: 50%;
				left: 50%;
				width: 0;
				height: 0;
				border-radius: 50%;
				background: rgba(255, 255, 255, 0.3);
				transform: translate(-50%, -50%);
				transition: width 0.6s ease, height 0.6s ease;
			}
			
			&:hover {
				box-shadow: 0 6rpx 16rpx rgba(255, 184, 0, 0.4);
				transform: translateY(-2rpx);
			}
			
			&:active {
				transform: scale(0.95) translateY(0);
				box-shadow: 0 2rpx 8rpx rgba(255, 184, 0, 0.2);
				
				&::before {
					width: 300rpx;
					height: 300rpx;
				}
			}
			
			// 按钮点击动画类
			&.buyout-clicking {
				animation: buttonPulse 0.3s cubic-bezier(0.4, 0, 0.2, 1);
			}
			
			text {
				font-size: 26rpx;
				color: #fff;
				font-weight: 600;
				white-space: nowrap;
				position: relative;
				z-index: 1;
			}
		}
	}
	
	// 右侧按钮 - 增强动画效果
	.bargain-button {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 16rpx 32rpx;
		background: linear-gradient(135deg, #ff6b6b, #ff8787);
		border-radius: 50rpx;
		box-shadow: 0 4rpx 12rpx rgba(255, 107, 107, 0.3);
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		min-width: 140rpx;
		cursor: pointer;
		position: relative;
		overflow: hidden;
		
		// 添加光晕效果
		&::before {
			content: '';
			position: absolute;
			top: 50%;
			left: 50%;
			width: 0;
			height: 0;
			border-radius: 50%;
			background: rgba(255, 255, 255, 0.3);
			transform: translate(-50%, -50%);
			transition: width 0.6s ease, height 0.6s ease;
		}
		
		// 悬停效果
		&:hover {
			box-shadow: 0 6rpx 16rpx rgba(255, 107, 107, 0.4);
			transform: translateY(-2rpx);
		}
		
		// 点击效果
		&:active {
			transform: scale(0.95) translateY(0);
			box-shadow: 0 2rpx 8rpx rgba(255, 107, 107, 0.2);
			
			&::before {
				width: 300rpx;
				height: 300rpx;
			}
		}
		
		// 按钮点击动画类
		&.button-clicking {
			animation: buttonPulse 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		}
		
		&.complete {
			background: linear-gradient(135deg, #52c41a, #73d13d);
			box-shadow: 0 4rpx 12rpx rgba(82, 196, 26, 0.3);
			
			&:hover {
				box-shadow: 0 6rpx 16rpx rgba(82, 196, 26, 0.4);
			}
		}
		
		&.expired {
			background: linear-gradient(135deg, #999, #bbb);
			box-shadow: 0 4rpx 12rpx rgba(153, 153, 153, 0.3);
			pointer-events: none;
			opacity: 0.6;
			cursor: not-allowed;
		}
		
		.button-text {
			font-size: 26rpx;
			color: #fff;
			font-weight: 600;
			white-space: nowrap;
			position: relative;
			z-index: 1;
		}
	}
	
	// 砍价价格样式
	.bargain-price {
		font-size: 32rpx;
		font-weight: 600;
		transition: all 0.25s ease;
	}
	
	// 底部进度条区域（最底部）
	.bargain-progress-section {
		display: flex;
		flex-direction: row;
		align-items: center;
		gap: 16rpx; // 增加间距
		width: 100%;
		min-width: 550rpx;
		max-width: 100%;
		height: 44rpx; // 高度增加
		margin-top: 16rpx;
		padding: 8rpx 0; // 去除左右边距，让进度条更宽
		box-sizing: border-box;
		
		.progress-percentage {
			font-size: 32rpx;
			color: #ff6b6b;
			font-weight: 700;
			min-width: 70rpx;
			max-width: 80rpx;
			flex-shrink: 0;
			text-align: right;
		}
	}
	
	// 砍价进度条
	.bargain-progress {
		flex: 1;
		min-width: 200rpx; // 增加最小宽度，从 180rpx 增加到 200rpx
		height: 22rpx; // 高度增加，从 20rpx 增加到 22rpx
		max-height: 22rpx;
		background-color: #f0f0f0;
		border-radius: 11rpx;
		overflow: hidden;
		box-shadow: inset 0 1rpx 3rpx rgba(0, 0, 0, 0.1);
		flex-shrink: 0;
		
		.progress-bar {
			height: 100%;
			background: linear-gradient(90deg, #ff6b6b, #ff8787);
			transition: width 0.3s ease;
			border-radius: 11rpx;
			position: relative;
			min-height: 22rpx;
		}
	}
	
	// 飘红动画文字
	.bargain-float-text {
		position: absolute;
		top: -60rpx;
		left: 50%;
		transform: translateX(-50%);
		font-size: 32rpx;
		font-weight: 700;
		color: #ff6b6b;
		pointer-events: none;
		opacity: 0;
		text-shadow: 0 2rpx 8rpx rgba(255, 107, 107, 0.3);
		
		&.float-animation {
			animation: floatUp 1.5s ease-out forwards;
		}
	}
		
	// 买断功能样式
	.buyout-section {
		display: flex;
		flex-direction: row;
		align-items: center;
		justify-content: space-between;
		width: 100%;
		margin-top: 16rpx;
		padding: 16rpx 20rpx;
		background: linear-gradient(135deg, #fffbf0 0%, #fff9e6 100%);
		border-radius: 16rpx;
		border: 2rpx solid #ffe5a0;
		box-shadow: 0 2rpx 8rpx rgba(255, 184, 0, 0.1);
			
		.buyout-price-info {
			display: flex;
			align-items: center;
			gap: 8rpx;
			flex: 1;
				
			.buyout-label {
				font-size: 26rpx;
				color: #856404;
				font-weight: 500;
			}
				
			.buyout-price {
				font-size: 32rpx;
				color: #FF8C00;
				font-weight: 700;
			}
		}
			
		.buyout-button {
			display: flex;
			align-items: center;
			justify-content: center;
			gap: 8rpx;
			padding: 12rpx 24rpx;
			background: linear-gradient(135deg, #FFB800 0%, #FF8C00 100%);
			border-radius: 50rpx;
			box-shadow: 0 4rpx 12rpx rgba(255, 184, 0, 0.3);
			transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
			min-width: 130rpx;
			cursor: pointer;
			position: relative;
			overflow: hidden;
				
			// 添加光晕效果
			&::before {
				content: '';
				position: absolute;
				top: 50%;
				left: 50%;
				width: 0;
				height: 0;
				border-radius: 50%;
				background: rgba(255, 255, 255, 0.3);
				transform: translate(-50%, -50%);
				transition: width 0.6s ease, height 0.6s ease;
			}
				
			&:active {
				transform: scale(0.95);
				box-shadow: 0 2rpx 8rpx rgba(255, 184, 0, 0.2);
					
				&::before {
					width: 300rpx;
					height: 300rpx;
				}
			}
				
			// 按钮点击动画类
			&.buyout-clicking {
				animation: buttonPulse 0.3s cubic-bezier(0.4, 0, 0.2, 1);
			}
				
			text {
				font-size: 26rpx;
				color: #fff;
				font-weight: 600;
				white-space: nowrap;
				position: relative;
				z-index: 1;
			}
		}
	}
}

// 点赞心跳动画（优化版）
@keyframes heartBeat {
	0%, 100% { 
		transform: scale(1); 
	}
	15% { 
		transform: scale(1.25); 
	}
	30% { 
		transform: scale(1); 
	}
	45% { 
		transform: scale(1.15); 
	}
	60% { 
		transform: scale(1); 
	}
}

// 砍价成功动画
@keyframes bargainSuccess {
	0% { 
		transform: scale(1) rotate(0deg); 
	}
	25% { 
		transform: scale(1.15) rotate(-5deg); 
	}
	50% { 
		transform: scale(1.25) rotate(5deg); 
	}
	75% { 
		transform: scale(1.1) rotate(-3deg); 
	}
	100% { 
		transform: scale(1) rotate(0deg); 
	}
}

// 飘红动画
@keyframes floatUp {
	0% {
		opacity: 1;
		transform: translateX(-50%) translateY(0);
	}
	100% {
		opacity: 0;
		transform: translateX(-50%) translateY(-80rpx);
	}
}

// 按钮脉冲动画
@keyframes buttonPulse {
	0% {
		transform: scale(1);
		box-shadow: 0 4rpx 12rpx rgba(255, 107, 107, 0.3);
	}
	50% {
		transform: scale(1.05);
		box-shadow: 0 6rpx 16rpx rgba(255, 107, 107, 0.5);
	}
	100% {
		transform: scale(1);
		box-shadow: 0 4rpx 12rpx rgba(255, 107, 107, 0.3);
	}
}
</style>