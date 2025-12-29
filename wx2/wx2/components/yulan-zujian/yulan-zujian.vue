<template>
	<view class="image-preview-mask" v-if="visible" @click="handleClose" :style="{ zIndex: zIndex }">
		<!-- 关闭按钮 -->
		<view class="preview-close" @click.stop="handleClose">
			<uni-icons type="closeempty" size="30" color="#ffffff"></uni-icons>
		</view>
		
		<!-- 图片指示器 -->
		<view class="preview-indicator" v-if="images.length > 1">
			{{ currentIndex + 1 }} / {{ images.length }}
		</view>
		
		<!-- 图片容器 -->
		<swiper 
			class="preview-swiper" 
			:current="currentIndex"
			@change="handleSwiperChange"
			@animationfinish="handleAnimationFinish"
			:circular="circular"
			@click.stop>
			<swiper-item v-for="(imgUrl, idx) in processedImages" :key="idx">
				<view class="preview-item" @click.stop>
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
					<image 
						v-show="!imageErrorStatus[idx]"
						:src="imgUrl" 
						mode="aspectFit"
						class="preview-image"
						:show-menu-by-longpress="enableSaveImage"
						@load="handleImageLoad(idx)"
						@error="handleImageError(idx)">
					</image>
				</view>
			</swiper-item>
		</swiper>
		
		<!-- 左右切换按钮（仅多张图时显示）-->
		<view class="preview-prev" @click.stop="handlePrev" v-if="showArrows && images.length > 1">
			<uni-icons type="left" size="40" color="#ffffff"></uni-icons>
		</view>
		<view class="preview-next" @click.stop="handleNext" v-if="showArrows && images.length > 1">
			<uni-icons type="right" size="40" color="#ffffff"></uni-icons>
		</view>
		
		<!-- 下载按钮（可选）-->
		<view v-if="enableDownload" class="preview-download" @click.stop="handleDownload">
			<uni-icons type="download" size="24" color="#ffffff"></uni-icons>
		</view>
	</view>
</template>

<script>
export default {
	onBackPress() {
		// 小程序返回键拦截
		if (this.visible && this.visible.value) {
			this.handleClose();
			return true; // 阻止默认返回行为
		}
		return false;
	}
}
</script>

<script setup>
	import { ref, watch, onMounted, onUnmounted, getCurrentInstance } from 'vue';
	
	// Props定义
	const props = defineProps({
		// 是否显示预览
		modelValue: {
			type: Boolean,
			default: false
		},
		// 图片URL数组
		images: {
			type: Array,
			default: () => []
		},
		// 当前显示的图片索引
		current: {
			type: Number,
			default: 0
		},
		// 是否循环切换
		circular: {
			type: Boolean,
			default: true
		},
		// 是否显示切换箭头
		showArrows: {
			type: Boolean,
			default: true
		},
		// 是否启用长按保存图片
		enableSaveImage: {
			type: Boolean,
			default: true
		},
		// 是否显示下载按钮
		enableDownload: {
			type: Boolean,
			default: false
		},
		// 是否使用原图（不添加压缩参数）
		useOriginal: {
			type: Boolean,
			default: false
		},
		// z-index层级
		zIndex: {
			type: Number,
			default: 9999
		}
	});
	
	// Emits定义
	const emit = defineEmits(['update:modelValue', 'close', 'change']);
	
	// 响应式状态
	const visible = ref(false);
	const currentIndex = ref(0);
	const imageLoadStatus = ref({}); // 图片加载状态
	const imageErrorStatus = ref({}); // 图片错误状态
	const processedImages = ref([]); // 处理后的图片数组
	
	// 获取组件实例
	const instance = getCurrentInstance();
	
	// 将visible暴露给options API，以便 onBackPress 可以访问
	if (instance) {
		instance.proxy.visible = visible;
		instance.proxy.handleClose = () => handleClose();
	}
	
	// 监听modelValue变化
	watch(() => props.modelValue, (newVal) => {
		visible.value = newVal;
		
		// 同步更新 instance.proxy.visible
		if (instance && instance.proxy) {
			instance.proxy.visible = visible;
		}
		
		if (newVal) {
			// 打开预览时设置当前索引
			currentIndex.value = props.current;
			
			// 处理图片URL
			processImages();
			
			// 重置加载状态
			resetLoadStatus();
			
			console.log('打开图片预览，当前索引:', currentIndex.value);
			console.log('图片列表:', props.images);
		}
	});
	
	// 监听current变化
	watch(() => props.current, (newVal) => {
		if (visible.value) {
			currentIndex.value = newVal;
		}
	});
	
	// 监听图片数组变化
	watch(() => props.images, () => {
		if (visible.value) {
			processImages();
			resetLoadStatus();
		}
	}, { deep: true });
	
	// 关闭预览
	const handleClose = () => {
		visible.value = false;
		emit('update:modelValue', false);
		emit('close');
	};
	
	// 切换到上一张
	const handlePrev = () => {
		if (currentIndex.value > 0) {
			currentIndex.value--;
		} else {
			currentIndex.value = props.images.length - 1;
		}
		emit('change', currentIndex.value);
	};
	
	// 切换到下一张
	const handleNext = () => {
		if (currentIndex.value < props.images.length - 1) {
			currentIndex.value++;
		} else {
			currentIndex.value = 0;
		}
		emit('change', currentIndex.value);
	};
	
	// Swiper切换事件
	const handleSwiperChange = (e) => {
		currentIndex.value = e.detail.current;
		emit('change', currentIndex.value);
	};
	
	// Swiper动画结束事件
	const handleAnimationFinish = (e) => {
		// 动画结束后的额外处理（如预加载下一张图片）
		console.log('Swiper动画结束，当前索引:', e.detail.current);
	};
	
	// 下载图片
	const handleDownload = () => {
		const currentUrl = processedImages.value[currentIndex.value];
		if (!currentUrl) {
			uni.showToast({
				title: '图片不存在',
				icon: 'none'
			});
			return;
		}
		
		uni.showLoading({ title: '下载中...' });
		
		uni.downloadFile({
			url: currentUrl,
			success: (res) => {
				if (res.statusCode === 200) {
					uni.saveImageToPhotosAlbum({
						filePath: res.tempFilePath,
						success: () => {
							uni.hideLoading();
							uni.showToast({
								title: '保存成功',
								icon: 'success'
							});
						},
						fail: () => {
							uni.hideLoading();
							uni.showToast({
								title: '保存失败',
								icon: 'none'
							});
						}
					});
				}
			},
			fail: () => {
				uni.hideLoading();
				uni.showToast({
					title: '下载失败',
					icon: 'none'
				});
			}
		});
	};
	
	// 处理图片URL数组
	const processImages = () => {
		if (!props.useOriginal) {
			// 如果不使用原图，移除压缩参数以获取更清晰的预览
			processedImages.value = props.images.map(url => {
				if (typeof url === 'string' && url.includes('?')) {
					// 移除URL参数，使用原图
					return url.split('?')[0];
				}
				return url;
			});
		} else {
			processedImages.value = [...props.images];
		}
	};
	
	// 重置加载状态
	const resetLoadStatus = () => {
		imageLoadStatus.value = {};
		imageErrorStatus.value = {};
	};
	
	// 图片加载成功
	const handleImageLoad = (index) => {
		imageLoadStatus.value[index] = true;
		console.log('图片加载成功，索引:', index);
	};
	
	// 图片加载错误
	const handleImageError = (index) => {
		imageErrorStatus.value[index] = true;
		console.error('图片加载失败，索引:', index, 'URL:', processedImages.value[index]);
		
		// 可选：触发错误事件，让父组件知道
		emit('error', { index, url: processedImages.value[index] });
	};
</script>

<style lang="scss" scoped>
	.image-preview-mask {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		width: 100vw;
		height: 100vh;
		background-color: #000000;
		display: flex;
		align-items: center;
		justify-content: center;
		animation: fadeIn 0.3s ease;
		
		.preview-close {
			position: absolute;
			top: 40rpx;
			right: 40rpx;
			z-index: 10001;
			padding: 20rpx;
			background-color: rgba(0, 0, 0, 0.5);
			border-radius: 50%;
			transition: opacity 0.3s;
			
			&:active {
				opacity: 0.7;
			}
		}
		
		.preview-indicator {
			position: absolute;
			top: 40rpx;
			left: 50%;
			transform: translateX(-50%);
			z-index: 10001;
			color: #ffffff;
			font-size: 28rpx;
			padding: 10rpx 30rpx;
			background-color: rgba(0, 0, 0, 0.5);
			border-radius: 40rpx;
		}
		
		.preview-swiper {
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
			padding: 0 40rpx;
			background-color: #000000;
		}
		
		.preview-image {
			width: 100%;
			height: 100%;
		}
		
		.preview-prev,
		.preview-next {
			position: absolute;
			top: 50%;
			transform: translateY(-50%);
			z-index: 10001;
			padding: 20rpx;
			background-color: rgba(0, 0, 0, 0.5);
			border-radius: 50%;
			transition: opacity 0.3s;
			
			&:active {
				opacity: 0.7;
			}
		}
		
		.preview-prev {
			left: 40rpx;
		}
		
		.preview-next {
			right: 40rpx;
		}
		
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
		
		.preview-download {
			position: absolute;
			bottom: 60rpx;
			right: 40rpx;
			z-index: 10001;
			padding: 20rpx;
			background-color: rgba(0, 0, 0, 0.5);
			border-radius: 50%;
			transition: opacity 0.3s;
			
			&:active {
				opacity: 0.7;
			}
		}
	}
	
	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}
</style>
