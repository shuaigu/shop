<template>
	<view class="page-container">
		<!-- 固定在顶部的视频容器 -->
		<view 
			class="fixed-video-container" 
			:style="{ 
				height: '600rpx',
				transform: `translateY(${isHidden ? '-600rpx' : '0'})`
			}"
		>
			<video 
				id="myVideo"
				:src="videoUrl"
				:poster="videoInfo.thumbnailURL"
				:duration="videoInfo.duration"
				class="video-player"
				controls
				autoplay
				@error="handleVideoError"
				ref="videoPlayer"
			></video>
		</view>

		<!-- 可滚动的内容区域 -->
		<scroll-view 
			class="scroll-content" 
			scroll-y 
			@scroll="handleScroll"
			:style="{ paddingTop: '600rpx' }"
		>
			<!-- 新增的文字，重复 100 次 -->
			<view class="video-caption" v-for="n in 100" :key="n">
				<text>这是视频下方的一句话。</text>
			</view>
		</scroll-view>
	</view>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'

// 响应式状态
const isHidden = ref(false)
const videoPlayer = ref(null)
const videoContext = ref(null)

const article = ref({
	user_avatarUrl: '',
	user_nickName: '',
	content: '',
	look_count: 0,
	like_count: 0,
	comment_count: 0,
	video: {
		compressedURL: '',
		thumbnailURL: '',
		duration: 0
	}
})

const videoUrl = ref('https://aly2.jingle0350.cn/2025/20250224/1740356982395_cwhfnlzb.mp4')

// 计算属性
const videoInfo = computed(() => {
	console.log('Computed videoInfo:', article.value.video)
	console.log('Video URL:', article.value.video.compressedURL)
	return article.value.video || {}
})

// 初始化视频上下文
const initVideoContext = () => {
	nextTick(() => {
		videoContext.value = uni.createVideoContext('myVideo')
	})
}

// 方法
const getVideoArticle = async (id) => {
	try {
		console.log('Fetching video article with ID:', id)
		const db = uniCloud.database()
		const res = await db.collection('articleList').get()
		console.log('Database response:', res)

		if (res.result.data && res.result.data.length > 0) {
			article.value = res.result.data[0]
			console.log('Fetched article data:', article.value)
			// 增加观看次数
			updateLookCount(id)
		} else {
			console.warn('No data found for the given ID')
		}
	} catch (e) {
		console.error('Error fetching video article:', e)
		uni.showToast({
			title: '获取视频信息失败',
			icon: 'none'
		})
	}
}

const updateLookCount = async (id) => {
	try {
		console.log('Updating look count for ID:', id)
		const db = uniCloud.database()
		await db.collection('articleList')
			.doc(id)
			.update({
				look_count: article.value.look_count + 1
			})
		console.log('Look count updated successfully')
	} catch (e) {
		console.error('Error updating look count:', e)
	}
}

const handleVideoError = (err) => {
	console.error('Video playback error:', err)
	uni.showToast({
		title: '视频加载失败',
		icon: 'none'
	})
}

const handleScroll = (e) => {
	const scrollTop = e.detail.scrollTop
	const threshold = 600 // 视频高度

	// 当滚动超过视频高度时隐藏视频并暂停播放
	if (scrollTop >= threshold && !isHidden.value) {
		isHidden.value = true
		videoContext.value?.pause()
	} 
	// 当视频重新出现在视图中时显示视频并开始播放
	else if (scrollTop < threshold && isHidden.value) {
		isHidden.value = false
		videoContext.value?.play()
	}
}

// 生命周期钩子
onMounted(() => {
	initVideoContext() // 初始化视频上下文
	
	const pages = getCurrentPages()
	const currentPage = pages[pages.length - 1]
	if (currentPage && currentPage.$page && currentPage.$page.options) {
		const options = currentPage.$page.options
		if (options.id) {
			console.log('Page loaded with ID:', options.id)
			getVideoArticle(options.id)
		}
	}
})
</script>

<style lang="scss" scoped>
.page-container {
	height: 100vh;
	position: relative;
	background-color: #000;
}

.fixed-video-container {
	position: fixed;
	top: 0;
	left: 0;
	width: 100%;
	z-index: 100;
	transition: transform 0.3s ease;
	background-color: #000;

	.video-player {
		width: 100%;
		height: 100%;
	}
}

.scroll-content {
	height: 100vh;
	box-sizing: border-box;
	background-color: #fff;
}

.video-caption {
	padding: 20rpx;
	text-align: center;
	color: #9800ac;
	font-size: 28rpx;
	background-color: #fff;
}
</style> 