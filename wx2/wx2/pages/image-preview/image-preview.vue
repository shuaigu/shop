<template>
	<view class="image-preview-page">
		<!-- 顶部指示器区域 -->
		<view class="preview-top-bar">
			<view class="preview-indicator" v-if="imageList.length > 1">
				{{ currentIndex + 1 }}/{{ imageList.length }}
			</view>
		</view>
		
		<!-- 图片容器 -->
		<swiper 
			class="preview-swiper" 
			:current="currentIndex"
			@change="handleSwiperChange"
			@animationfinish="handleAnimationFinish"
			:circular="imageList.length > 1"
			:duration="300"
			easing-function="easeOut">
			<swiper-item v-for="(imgUrl, idx) in imageList" :key="idx">
				<view class="preview-item">
					<!-- 加载状态 -->
					<view v-if="!imageLoadStatus[idx]" class="preview-loading">
						<uni-icons type="spinner-cycle" size="40" color="#ffffff"></uni-icons>
						<text class="loading-text">加载中...</text>
					</view>
					
					<!-- 错误状态 -->
					<view v-if="imageErrorStatus[idx]" class="preview-error">
						<uni-icons type="close-filled" size="40" color="#ffffff"></uni-icons>
						<text class="error-text">图片加载失败</text>
					</view>
					
					<!-- 图片 -->
					<view 
						class="image-container"
						@tap="toggleToolbar">
						<image 
							v-show="!imageErrorStatus[idx]"
							:src="imgUrl" 
							mode="aspectFit"
							class="preview-image"
							:show-menu-by-longpress="false"
							@load="handleImageLoad(idx)"
							@error="handleImageError(idx)">
						</image>
					</view>
				</view>
			</swiper-item>
		</swiper>
		
		<!-- 底部进度指示器（仅多图时显示，始终可见） -->
		<view class="preview-progress-bar" v-if="imageList.length > 1">
			<view class="progress-track">
				<view 
					class="progress-item"
					v-for="(item, idx) in imageList" 
					:key="idx"
					:class="{ 'active': idx === currentIndex }">
				</view>
			</view>
		</view>
		
		<!-- 底部工具栏 -->
		<view class="preview-bottom-bar" v-show="showToolbar">
			<!-- 关闭按钮 -->
			<view class="toolbar-btn" @click="handleClose">
				<uni-icons type="closeempty" size="28" color="#ffffff"></uni-icons>
			</view>
		</view>
	</view>
</template>

<script setup>
	import { ref, reactive, onMounted } from 'vue';
	
	// 响应式状态
	const currentIndex = ref(0);
	const imageList = ref([]);
	const imageLoadStatus = ref({});
	const imageErrorStatus = ref({});
	const showToolbar = ref(true); // 工具栏显示状态
	const isChanging = ref(false); // 是否正在切换图片
	const preloadedImages = ref(new Set()); // 记录已预加载的图片索引
	
	/**
	 * 预加载图片资源
	 * @param {number} centerIndex - 中心索引（当前显示的图片）
	 * @param {number} range - 预加载范围（前后各加载几张）
	 */
	const preloadImages = (centerIndex, range = 2) => {
		if (!imageList.value || imageList.value.length === 0) return;
		
		// 计算需要预加载的图片索引范围
		const startIndex = Math.max(0, centerIndex - range);
		const endIndex = Math.min(imageList.value.length - 1, centerIndex + range);
		
		// 异步预加载图片
		for (let i = startIndex; i <= endIndex; i++) {
			// 跳过已经预加载或已加载成功的图片
			if (preloadedImages.value.has(i) || imageLoadStatus.value[i]) {
				continue;
			}
			
			// 标记为已预加载
			preloadedImages.value.add(i);
			
			// 使用Image对象预加载（不阻塞主线程）
			const img = new Image();
			img.src = imageList.value[i];
			
			// 预加载成功回调（可选）
			img.onload = () => {
				console.log(`图片 ${i} 预加载成功`);
			};
			
			// 预加载失败回调（可选）
			img.onerror = () => {
				console.warn(`图片 ${i} 预加载失败`);
				preloadedImages.value.delete(i); // 移除失败标记，允许重试
			};
		}
	};
	
	// 页面加载时获取参数
	onMounted(() => {
		const pages = getCurrentPages();
		const currentPage = pages[pages.length - 1];
		const options = currentPage.options;
		
		// 获取图片列表和当前索引
		if (options.images) {
			try {
				imageList.value = JSON.parse(decodeURIComponent(options.images));
			} catch (e) {
				console.error('解析图片列表失败:', e);
				imageList.value = [];
			}
		}
		
		if (options.current !== undefined) {
			currentIndex.value = parseInt(options.current) || 0;
		}
		
		console.log('图片预览页面加载，当前索引:', currentIndex.value);
		
		// 页面加载完成后，延迟启动预加载（避免阻塞当前图片）
		setTimeout(() => {
			preloadImages(currentIndex.value);
		}, 300);
	});
	
	// 关闭预览
	const handleClose = () => {
		uni.navigateBack({
			delta: 1
		});
	};
	
	// 切换工具栏显示状态
	const toggleToolbar = () => {
		showToolbar.value = !showToolbar.value;
	};
	
	// Swiper切换开始
	const handleSwiperChange = (e) => {
		isChanging.value = true; // 标记正在切换
		currentIndex.value = e.detail.current;
		
		// 切换图片时触发预加载
		preloadImages(currentIndex.value);
	};
	
	// Swiper动画完成
	const handleAnimationFinish = (e) => {
		// 延迟解除切换状态，确保动画完全结束
		setTimeout(() => {
			isChanging.value = false;
		}, 50);
	};
	
	// 图片加载成功
	const handleImageLoad = (index) => {
		imageLoadStatus.value[index] = true;
		console.log('图片加载成功，索引:', index);
	};
	
	// 图片加载错误
	const handleImageError = (index) => {
		imageErrorStatus.value[index] = true;
		console.error('图片加载失败，索引:', index, 'URL:', imageList.value[index]);
	};
</script>

<style lang="scss" scoped>
	.image-preview-page {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		width: 100vw;
		height: 100vh;
		background-color: #000000;
		display: flex;
		flex-direction: column;
		z-index: 9999;
		
		// 顶部指示器区域
		.preview-top-bar {
			position: absolute;
			top: 0;
			left: 0;
			right: 0;
			height: 100rpx;
			display: flex;
			align-items: center;
			justify-content: center;
			background: linear-gradient(to bottom, rgba(0, 0, 0, 0.5), transparent);
			z-index: 10001;
			padding-top: env(safe-area-inset-top);
		}
		
		.preview-indicator {
			color: #ffffff;
			font-size: 32rpx;
			font-weight: 400;
			text-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.5);
		}
		
		// 图片容器
		.preview-swiper {
			flex: 1;
			width: 100%;
			height: 100%;
			background-color: #000000;
		}
		
		.preview-item {
			position: relative;
			width: 100%;
			height: 100%;
			display: flex;
			align-items: center;
			justify-content: center;
			background-color: #000000;
		}
		
		// 图片容器
		.image-container {
			width: 100vw;
			height: 100vh;
			display: flex;
			align-items: center;
			justify-content: center;
		}
		
		.preview-image {
			width: 100vw;
			height: 100vh;
			pointer-events: auto;
			user-select: none;
			-webkit-user-drag: none;
		}
		
		// 底部进度指示器
		.preview-progress-bar {
			position: absolute;
			bottom: 140rpx;
			left: 50%;
			transform: translateX(-50%);
			z-index: 10002;
			padding: 20rpx 0;
		}
		
		.progress-track {
			display: flex;
			align-items: center;
			gap: 12rpx;
			justify-content: center;
		}
		
		.progress-item {
			width: 80rpx;
			height: 6rpx;
			background-color: rgba(255, 255, 255, 0.3);
			border-radius: 3rpx;
			transition: all 0.3s;
			
			&.active {
				background-color: rgba(255, 255, 255, 0.9);
				box-shadow: 0 0 8rpx rgba(255, 255, 255, 0.5);
			}
		}
		
		// 底部工具栏
		.preview-bottom-bar {
			position: absolute;
			bottom: 0;
			left: 0;
			right: 0;
			height: 160rpx;
			display: flex;
			align-items: center;
			justify-content: space-between;
			padding: 0 40rpx calc(env(safe-area-inset-bottom) + 20rpx);
			background: linear-gradient(to top, rgba(0, 0, 0, 0.6), transparent);
			z-index: 10001;
		}
		
		.toolbar-right {
			display: flex;
			align-items: center;
			gap: 40rpx;
		}
		
		.toolbar-btn {
			width: 80rpx;
			height: 80rpx;
			display: flex;
			align-items: center;
			justify-content: center;
			background-color: rgba(255, 255, 255, 0.1);
			border-radius: 50%;
			transition: all 0.3s;
			
			&:active {
				background-color: rgba(255, 255, 255, 0.2);
				transform: scale(0.95);
			}
		}
		
		// 加载和错误状态
		.preview-loading,
		.preview-error {
			position: absolute;
			top: 50%;
			left: 50%;
			transform: translate(-50%, -50%);
			display: flex;
			flex-direction: column;
			align-items: center;
			justify-content: center;
			color: #ffffff;
			z-index: 10000;
		}
		
		.loading-text,
		.error-text {
			margin-top: 20rpx;
			font-size: 28rpx;
			color: rgba(255, 255, 255, 0.8);
		}
	}
</style>
