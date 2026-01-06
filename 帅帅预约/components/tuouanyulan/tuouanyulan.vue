<template>
	<view class="custom-preview" v-if="visible" @touchmove.stop.prevent="handleTouchMove">
		<view class="preview-background" @click="handleClose"></view>
		<view class="preview-container">
			<!-- 滑动切换动画层 -->
			<view class="slide-animation-layer" v-if="isSwipingHorizontal && !isZooming" :style="{
				transform: `translateX(${swipeProgress * 100}px)`
			}"></view>
			<swiper 
				class="preview-swiper" 
				:current="currentIndex" 
				@change="handleSwiperChange"
				@animationfinish="handleSwiperAnimationEnd"
				@transition="handleSwiperAnimationStart"
				:indicator-dots="false"
				:autoplay="false"
				:circular="true"
				:vertical="false"
				:disable-touch="isZooming || isSwipingHorizontal"
				:display-multiple-items="1"
				:acceleration="true"
				:skip-hidden-item-layout="true"
				:next-margin="0"
				:previous-margin="0"
				:snap-to-edge="true"
				:duration="swiperDuration"
				:class="swiperAnimationClass"
				:easing-function="'easeInOut'"
			>
				<swiper-item v-for="(item, index) in imageList" :key="index" class="preview-swiper-item">
					<view 
						class="image-wrapper" 
						@touchstart="handleTouchStart"
						@touchmove="handleImageTouchMove"
						@touchend="handleTouchEnd"
						@touchcancel="handleTouchEnd"
						@click="handleImageClick"
						@dblclick="handleImageDoubleClick"
					>
						<image 
							:src="item" 
							mode="aspectFit" 
							class="preview-image"
							:style="{
								transform: getImageTransform(index),
								transition: isTransitioning ? 'transform 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)' : 'none'
							}"
							@error="handleImageError(index)"
							@load="handleImageLoaded(index)"
							:lazy-load="false"
							:fade-show="false"
							:draggable="false"
							:webp="false"
						></image>
						
						<!-- 加载指示器 -->
						<view class="loading-indicator" v-if="!imageLoaded[index]">
							<view class="loading-spinner"></view>
						</view>
						
						<!-- 错误指示器 -->
						<view class="error-indicator" v-if="imageLoadError[index]">
							<text class="error-icon">!</text>
							<text class="error-text">加载失败</text>
						</view>
					</view>
				</swiper-item>
			</swiper>
			
			<!-- 左右切换箭头 - 在图片数量大于1时显示 -->
			<view class="nav-arrows" v-if="imageList.length > 1 && !isZooming">
				<view class="nav-arrow left" @click="goToPrevImage">
					<text class="arrow-icon">‹</text>
				</view>
				<view class="nav-arrow right" @click="goToNextImage">
					<text class="arrow-icon">›</text>
				</view>
			</view>
			
			<!-- 顶部操作栏 -->
			<view class="preview-header" v-show="!isZooming">
				<view class="preview-counter">{{ currentIndex + 1 }}/{{ imageList.length }}</view>
				<view class="preview-close" @click="handleClose">
					<text class="close-icon">×</text>
				</view>
			</view>
			
			<!-- 底部操作栏 -->
			<view class="preview-footer" v-show="!isZooming">
				<view class="preview-action save-action" @click="handleSave">
					<text class="action-text">保存</text>
				</view>
				<view class="preview-action zoom-action" @click="toggleZoom">
					<text class="action-text">{{ imageScale > 1 ? '缩小' : '放大' }}</text>
				</view>
			</view>
			
			<!-- 放大指示器 -->
			<view class="zoom-indicator" v-if="imageScale > 1">
				<text>{{ Math.floor(imageScale * 100) }}%</text>
			</view>
			
			<!-- 双击提示 -->
			<view class="double-tap-hint" v-if="showDoubleTapHint">
				<text>双击可放大/缩小图片</text>
			</view>
		</view>
	</view>
</template>

<script setup>
import { ref, computed, watch, reactive, onMounted, onUnmounted, nextTick } from 'vue';

// 定义组件props
const props = defineProps({
	// 图片列表
	images: {
		type: Array,
		default: () => []
	},
	// 当前显示的图片索引
	current: {
		type: [Number, String],
		default: 0
	},
	// 是否可见
	visible: {
		type: Boolean,
		default: false
	}
});

// 定义事件
const emit = defineEmits(['close', 'change']);

// 当前显示的图片索引
const currentIndex = ref(Number(props.current) || 0);

// 图片缩放比例
const imageScale = ref(1);
const minScale = 0.8;  // 允许略微缩小
const maxScale = 5;    // 允许放大到5倍

// 图片偏移量
const imageOffset = reactive({
	x: 0,
	y: 0
});

// 双击时间计数
const lastClickTime = ref(0);
const doubleClickInterval = 300; // 毫秒

// 触摸相关状态
const touchStartX = ref(0);
const touchStartY = ref(0);
const touchDistance = ref(0);
const lastTouchDistance = ref(0);
const startScale = ref(1);
const isZooming = ref(false);
const isTransitioning = ref(false);

// 图片加载状态
const imageLoaded = ref({});
const imageLoadError = ref({});
const preloadedImages = ref({});  // 用于跟踪预加载的图片

// 双击提示
const showDoubleTapHint = ref(false);

// 轮播相关状态
const swiperDuration = ref(300); // 轮播切换动画时长
const isLoopAnimating = ref(false); // 是否正在执行循环动画
const swiperAnimationClass = ref(''); // 轮播动画类名

// 手势滑动相关
const swipeThreshold = 80; // 滑动阈值，超过这个距离触发切换
const initialTouchX = ref(0); // 初始触摸位置X
const currentTouchX = ref(0); // 当前触摸位置X
const swipeProgress = ref(0); // 滑动进度，-1到1之间
const isSwipingHorizontal = ref(false); // 是否正在水平滑动

// 计算图片列表
const imageList = computed(() => {
	if (!props.images || !Array.isArray(props.images)) return [];
	return props.images.map(item => {
		if (typeof item === 'string') return item;
		if (item.url) return item.url;
		if (item.compressedURL) return item.compressedURL;
		return '';
	}).filter(url => url);
});

// 监听props变化
watch(() => props.current, (newVal) => {
	currentIndex.value = Number(newVal) || 0;
	// 预加载当前图片相邻的图片
	preloadAdjacentImages(currentIndex.value);
});

// 当组件可见时显示双击提示
watch(() => props.visible, (newVal) => {
	if (newVal) {
		// 重置缩放和位置
		resetZoom();
		
		// 显示双击提示，并在3秒后自动隐藏
		showDoubleTapHint.value = true;
		setTimeout(() => {
			showDoubleTapHint.value = false;
		}, 3000);
		
		// 预加载所有图片，让切换更丝滑
		nextTick(() => {
			preloadAllImages();
		});
	}
});

// 使用平台兼容的方法来禁止/允许页面滚动
const disablePageScroll = () => {
	// 使用uni-app的API
	uni.pageScrollTo({
		scrollTop: 0,
		duration: 0
	});
};

// 确保在组件挂载和卸载时处理页面滚动
onMounted(() => {
	if (props.visible) {
		disablePageScroll();
	}
});

onUnmounted(() => {
	// 组件卸载时，确保重置所有状态
	resetZoom();
});

// 预加载相邻图片
const preloadAdjacentImages = (index) => {
	const totalImages = imageList.value.length;
	if (totalImages <= 1) return;
	
	// 预加载当前图片
	preloadImage(imageList.value[index]);
	
	// 预加载下一张图片
	const nextIndex = (index + 1) % totalImages;
	preloadImage(imageList.value[nextIndex]);
	
	// 预加载上一张图片
	const prevIndex = (index - 1 + totalImages) % totalImages;
	preloadImage(imageList.value[prevIndex]);
	
	// 对于首尾图片的无缝衔接，还要预加载首图和尾图
	if (index === 0) {
		// 如果是第一张，预加载最后一张
		preloadImage(imageList.value[totalImages - 1]);
	} else if (index === totalImages - 1) {
		// 如果是最后一张，预加载第一张
		preloadImage(imageList.value[0]);
	}
};

// 预加载单张图片
const preloadImage = (url) => {
	if (!url || preloadedImages.value[url]) return;
	
	// 使用一个隐藏的Image对象来预加载
	const img = new Image();
	img.src = url;
	img.onload = () => {
		preloadedImages.value[url] = true;
	};
	img.onerror = () => {
		console.warn('预加载图片失败:', url);
	};
	
	// 同时使用uni-app的API进行预加载
	uni.getImageInfo({
		src: url,
		success: () => {
			preloadedImages.value[url] = true;
		},
		fail: () => {
			console.warn('预加载图片失败:', url);
		}
	});
};

// 预加载所有图片
const preloadAllImages = () => {
	if (!imageList.value.length) return;
	
	imageList.value.forEach(url => {
		preloadImage(url);
	});
};

// 计算图片变换样式
const getImageTransform = (index) => {
	if (index !== currentIndex.value) return 'scale(1)';
	
	const scale = `scale(${imageScale.value})`;
	const translate = `translate(${imageOffset.x}px, ${imageOffset.y}px)`;
	
	return `${translate} ${scale}`;
};

// 处理图片加载完成
const handleImageLoaded = (index) => {
	imageLoaded.value[index] = true;
	imageLoadError.value[index] = false;
	
	// 图片加载完成后，预加载相邻图片
	if (index === currentIndex.value) {
		preloadAdjacentImages(index);
	}
};

// 处理轮播图变化前
const handleSwiperAnimationStart = (e) => {
	// 检测是否是首尾循环切换
	const total = imageList.value.length;
	if (total <= 1) return;
	
	const from = e.detail.from;
	const to = e.detail.to;
	
	// 从最后一张到第一张（向右滑动）
	if (from === total - 1 && to === 0) {
		swiperAnimationClass.value = 'loop-right';
		isLoopAnimating.value = true;
	} 
	// 从第一张到最后一张（向左滑动）
	else if (from === 0 && to === total - 1) {
		swiperAnimationClass.value = 'loop-left';
		isLoopAnimating.value = true;
	}
	else {
		swiperAnimationClass.value = '';
		isLoopAnimating.value = false;
	}
};

// 处理轮播图变化完成
const handleSwiperAnimationEnd = () => {
	// 清除动画类
	setTimeout(() => {
		swiperAnimationClass.value = '';
		isLoopAnimating.value = false;
	}, 50);
};

// 处理轮播图变化
const handleSwiperChange = (e) => {
	const newIndex = e.detail.current;
	currentIndex.value = newIndex;
	emit('change', newIndex);
	
	// 重置缩放和位置
	resetZoom();
	
	// 预加载相邻图片
	preloadAdjacentImages(newIndex);
	
	// 动画结束后清除类
	setTimeout(() => {
		handleSwiperAnimationEnd();
	}, swiperDuration.value);
};

// 手动切换到下一张
const goToNextImage = () => {
	if (isZooming.value || isLoopAnimating.value) return;
	
	const total = imageList.value.length;
	if (total <= 1) return;
	
	const nextIndex = (currentIndex.value + 1) % total;
	currentIndex.value = nextIndex;
	emit('change', nextIndex);
	
	// 如果是从最后一张到第一张，添加特殊动画类
	if (nextIndex === 0) {
		swiperAnimationClass.value = 'loop-right';
		isLoopAnimating.value = true;
		
		setTimeout(() => {
			handleSwiperAnimationEnd();
		}, swiperDuration.value);
	}
};

// 手动切换到上一张
const goToPrevImage = () => {
	if (isZooming.value || isLoopAnimating.value) return;
	
	const total = imageList.value.length;
	if (total <= 1) return;
	
	const prevIndex = (currentIndex.value - 1 + total) % total;
	currentIndex.value = prevIndex;
	emit('change', prevIndex);
	
	// 如果是从第一张到最后一张，添加特殊动画类
	if (prevIndex === total - 1 && currentIndex.value === 0) {
		swiperAnimationClass.value = 'loop-left';
		isLoopAnimating.value = true;
		
		setTimeout(() => {
			handleSwiperAnimationEnd();
		}, swiperDuration.value);
	}
};

// 重置缩放和位置
const resetZoom = () => {
	imageScale.value = 1;
	imageOffset.x = 0;
	imageOffset.y = 0;
	isZooming.value = false;
	transitionTemp();
};

// 临时开启过渡动画
const transitionTemp = () => {
	isTransitioning.value = true;
	setTimeout(() => {
		isTransitioning.value = false;
	}, 300);
};

// 处理关闭预览
const handleClose = () => {
	// 先重置缩放状态
	resetZoom();
	emit('close');
};

// 处理图片保存
const handleSave = () => {
	if (imageList.value.length === 0 || currentIndex.value >= imageList.value.length) {
		uni.showToast({
			title: '没有可保存的图片',
			icon: 'none'
		});
		return;
	}
	
	const currentImage = imageList.value[currentIndex.value];
	
	// 显示加载提示
	uni.showLoading({
		title: '保存中...'
	});
	
	// 下载图片
	uni.downloadFile({
		url: currentImage,
		success: (res) => {
			if (res.statusCode === 200) {
				// 保存到相册
				uni.saveImageToPhotosAlbum({
					filePath: res.tempFilePath,
					success: () => {
						uni.hideLoading();
						uni.showToast({
							title: '保存成功',
							icon: 'success'
						});
					},
					fail: (err) => {
						uni.hideLoading();
						console.error('保存图片失败:', err);
						
						// 检查是否是权限问题
						if (err.errMsg && err.errMsg.indexOf('authorize') > -1) {
							uni.showModal({
								title: '提示',
								content: '需要您授权保存图片到相册',
								success: (res) => {
									if (res.confirm) {
										// 打开设置页面
										uni.openSetting({
											success: (settingRes) => {
												console.log('设置页面打开成功');
											}
										});
									}
								}
							});
						} else {
							uni.showToast({
								title: '保存失败',
								icon: 'none'
							});
						}
					}
				});
			} else {
				uni.hideLoading();
				uni.showToast({
					title: '下载图片失败',
					icon: 'none'
				});
			}
		},
		fail: (err) => {
			uni.hideLoading();
			console.error('下载图片失败:', err);
			uni.showToast({
				title: '下载图片失败',
				icon: 'none'
			});
		}
	});
};

// 处理图片加载错误
const handleImageError = (index) => {
	console.error('图片加载失败:', index);
	imageLoaded.value[index] = true;
	imageLoadError.value[index] = true;
};

// 计算两点之间的距离
const getDistance = (touches) => {
	if (touches.length < 2) return 0;
	
	const x1 = touches[0].pageX || touches[0].clientX;
	const y1 = touches[0].pageY || touches[0].clientY;
	const x2 = touches[1].pageX || touches[1].clientX;
	const y2 = touches[1].pageY || touches[1].clientY;
	
	return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
};

// 计算两点的中心点
const getMidpoint = (touches) => {
	if (touches.length < 2) {
		return { x: 0, y: 0 };
	}
	
	const x1 = touches[0].pageX || touches[0].clientX;
	const y1 = touches[0].pageY || touches[0].clientY;
	const x2 = touches[1].pageX || touches[1].clientX;
	const y2 = touches[1].pageY || touches[1].clientY;
	
	return {
		x: (x1 + x2) / 2,
		y: (y1 + y2) / 2
	};
};

// 双击时间跟踪
let touchStartTime = 0;
let touchEndTime = 0;
let touchMoveCount = 0;

// 处理触摸开始
const handleTouchStart = (e) => {
	// 如果正在放大状态，处理图片拖动
	if (imageScale.value > 1) {
		// 隐藏双击提示
		showDoubleTapHint.value = false;
		
		// 记录触摸开始时间
		touchStartTime = Date.now();
		touchMoveCount = 0;
		
		if (e.touches.length === 1) {
			// 单点触摸，记录起始位置
			touchStartX.value = e.touches[0].pageX || e.touches[0].clientX;
			touchStartY.value = e.touches[0].pageY || e.touches[0].clientY;
			lastTouchDistance.value = 0;
		} else if (e.touches.length === 2) {
			// 双指触摸，准备缩放
			touchDistance.value = getDistance(e.touches);
			lastTouchDistance.value = touchDistance.value;
			startScale.value = imageScale.value;
		}
		return;
	}
	
	// 未放大状态，处理图片滑动切换
	if (e.touches.length === 1 && !isZooming.value) {
		initialTouchX.value = e.touches[0].pageX || e.touches[0].clientX;
		currentTouchX.value = initialTouchX.value;
		isSwipingHorizontal.value = false;
		swipeProgress.value = 0;
	}
};

// 处理图片触摸移动
const handleImageTouchMove = (e) => {
	// 增加移动计数
	touchMoveCount++;
	
	// 如果正在放大状态，处理图片拖动
	if (imageScale.value > 1 || isZooming.value) {
		if (e.touches.length === 1) {
			// 单指拖动图片
			const currentX = e.touches[0].pageX || e.touches[0].clientX;
			const currentY = e.touches[0].pageY || e.touches[0].clientY;
			const moveX = currentX - touchStartX.value;
			const moveY = currentY - touchStartY.value;
			
			// 更新起始位置
			touchStartX.value = currentX;
			touchStartY.value = currentY;
			
			// 计算最大偏移量，放大倍数越大，可移动范围越大
			const maxOffsetX = (imageScale.value - 1) * 200;
			const maxOffsetY = (imageScale.value - 1) * 200;
			
			// 限制拖动范围
			imageOffset.x = Math.min(maxOffsetX, Math.max(-maxOffsetX, imageOffset.x + moveX));
			imageOffset.y = Math.min(maxOffsetY, Math.max(-maxOffsetY, imageOffset.y + moveY));
			
			// 开启缩放模式
			isZooming.value = true;
			
			// 阻止事件冒泡
			e.stopPropagation();
			e.preventDefault();
		} else if (e.touches.length === 2) {
			// 双指缩放
			const newDistance = getDistance(e.touches);
			
			if (lastTouchDistance.value > 0) {
				// 计算缩放比例
				const scale = newDistance / lastTouchDistance.value;
				let newScale = imageScale.value * scale;
				
				// 限制缩放范围
				newScale = Math.min(maxScale, Math.max(minScale, newScale));
				
				// 获取双指中心点
				const midpoint = getMidpoint(e.touches);
				
				// 更新缩放比例
				imageScale.value = newScale;
				
				// 开启缩放模式
				isZooming.value = true;
			}
			
			lastTouchDistance.value = newDistance;
			
			// 阻止事件冒泡
			e.stopPropagation();
			e.preventDefault();
		}
		return;
	}
	
	// 未放大状态，处理图片滑动切换
	if (e.touches.length === 1 && !isZooming.value) {
		const currentX = e.touches[0].pageX || e.touches[0].clientX;
		const currentY = e.touches[0].pageY || e.touches[0].clientY;
		
		// 计算水平和垂直移动距离
		const deltaX = currentX - initialTouchX.value;
		const deltaY = Math.abs(currentY - touchStartY.value);
		
		// 如果水平移动大于垂直移动，认为是水平滑动
		if (Math.abs(deltaX) > deltaY && Math.abs(deltaX) > 10) {
			isSwipingHorizontal.value = true;
			currentTouchX.value = currentX;
			
			// 计算滑动进度，范围在-1到1之间
			swipeProgress.value = Math.max(-1, Math.min(1, deltaX / 300));
			
			// 防止页面滚动
			e.preventDefault();
			e.stopPropagation();
		}
	}
};

// 处理触摸结束
const handleTouchEnd = (e) => {
	// 记录触摸结束时间
	touchEndTime = Date.now();
	const touchDuration = touchEndTime - touchStartTime;
	
	// 如果是缩放状态，处理图片缩放结束
	if (imageScale.value > 1) {
		// 如果超出了允许的范围，使用过渡动画回弹
		const maxOffsetX = (imageScale.value - 1) * 200;
		const maxOffsetY = (imageScale.value - 1) * 200;
		
		// 检查是否需要回弹
		const needBounce = Math.abs(imageOffset.x) > maxOffsetX || Math.abs(imageOffset.y) > maxOffsetY;
		
		if (needBounce) {
			// 启用过渡动画
			isTransitioning.value = true;
			
			// 限制偏移值
			imageOffset.x = Math.min(maxOffsetX, Math.max(-maxOffsetX, imageOffset.x));
			imageOffset.y = Math.min(maxOffsetY, Math.max(-maxOffsetY, imageOffset.y));
			
			// 延迟关闭过渡动画
			setTimeout(() => {
				isTransitioning.value = false;
			}, 300);
		}
	} 
	// 如果缩放比例小于等于1，可能是滑动切换
	else {
		// 处理水平滑动结束
		if (isSwipingHorizontal.value) {
			const deltaX = currentTouchX.value - initialTouchX.value;
			
			// 如果滑动距离超过阈值，触发切换
			if (Math.abs(deltaX) > swipeThreshold) {
				if (deltaX > 0) {
					// 右滑，切换到上一张
					goToPrevImage();
				} else {
					// 左滑，切换到下一张
					goToNextImage();
				}
			}
			
			// 重置滑动状态
			isSwipingHorizontal.value = false;
			swipeProgress.value = 0;
		}
		// 如果不是水平滑动且移动很少，可能是点击
		else if (touchMoveCount < 5 && touchDuration < 200) {
			// 检测是否是双击
			if (touchDuration < doubleClickInterval && Date.now() - lastClickTime.value < doubleClickInterval) {
				// 双击放大
				handleImageDoubleClick(e);
			} else {
				// 单击
				handleImageClick(e);
			}
			
			// 更新上次点击时间
			lastClickTime.value = Date.now();
		}
	}
	
	lastTouchDistance.value = 0;
};

// 处理图片点击
const handleImageClick = (e) => {
	const now = Date.now();
	
	// 检测双击
	if (now - lastClickTime.value < doubleClickInterval) {
		// 双击处理由 handleImageDoubleClick 处理
		return;
	}
	
	lastClickTime.value = now;
	
	// 如果已经放大，点击一次重置
	if (imageScale.value > 1) {
		resetZoom();
	}
};

// 处理图片双击
const handleImageDoubleClick = (e) => {
	// 获取点击坐标 - 兼容不同平台
	const x = e.detail.x || e.touches?.[0]?.pageX || 0;
	const y = e.detail.y || e.touches?.[0]?.pageY || 0;
	
	if (imageScale.value > 1) {
		// 已经放大，缩小
		resetZoom();
	} else {
		// 未放大，放大到2.5倍
		imageScale.value = 2.5;
		isZooming.value = true;
		transitionTemp();
	}
};

// 手动切换缩放
const toggleZoom = () => {
	if (imageScale.value > 1) {
		resetZoom();
	} else {
		imageScale.value = 2.5;
		isZooming.value = true;
		transitionTemp();
	}
};

// 阻止触摸移动事件，防止下拉关闭
const handleTouchMove = (e) => {
	// 如果正在缩放，允许所有触摸事件
	if (isZooming.value) return;
	
	// 阻止默认行为
	e.preventDefault();
	e.stopPropagation();
};
</script>

<style lang="scss" scoped>
.custom-preview {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	z-index: 999;
	display: flex;
	flex-direction: column;
	justify-content: center;
	align-items: center;
	-webkit-touch-callout: none;
	-webkit-user-select: none;
	user-select: none;
	
	.preview-background {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-color: rgba(0, 0, 0, 0.9);
		z-index: -1;
	}
	
	.preview-container {
		width: 100%;
		height: 100%;
		position: relative;
		overflow: hidden;
		
		// 滑动切换动画层
		.slide-animation-layer {
			position: absolute;
			top: 0;
			left: 0;
			right: 0;
			bottom: 0;
			z-index: 15;
			background: linear-gradient(
				to right,
				rgba(0, 0, 0, 0) 0%,
				rgba(255, 255, 255, 0.1) 50%,
				rgba(0, 0, 0, 0) 100%
			);
			opacity: 0.8;
			pointer-events: none;
			will-change: transform;
		}
		
		.preview-swiper {
			width: 100%;
			height: 100%;
			will-change: transform;
			
			// 循环切换的特殊动画类
			&.loop-left {
				animation: slide-left 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
			}
			
			&.loop-right {
				animation: slide-right 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
			}
			
			@keyframes slide-left {
				0% { transform: translateX(0); opacity: 1; }
				49% { opacity: 1; }
				50% { opacity: 0.8; }
				100% { transform: translateX(-100%); opacity: 1; }
			}
			
			@keyframes slide-right {
				0% { transform: translateX(0); opacity: 1; }
				49% { opacity: 1; }
				50% { opacity: 0.8; }
				100% { transform: translateX(100%); opacity: 1; }
			}
			
			// 解决轮播图在某些平台上的白屏问题
			:deep(.uni-swiper-dot) {
				width: 8rpx;
				height: 8rpx;
				border-radius: 50%;
				background-color: rgba(255, 255, 255, 0.5);
				
				&.uni-swiper-dot-active {
					background-color: #FFFFFF;
				}
			}
			
			// 解决轮播图过渡动画问题
			:deep(.uni-swiper-item) {
				transition-timing-function: cubic-bezier(0.25, 0.46, 0.45, 0.94) !important;
			}
			
			.preview-swiper-item {
				display: flex;
				justify-content: center;
				align-items: center;
				will-change: transform;
				
				.image-wrapper {
					width: 100%;
					height: 100%;
					display: flex;
					justify-content: center;
					align-items: center;
					overflow: hidden;
					position: relative;
					
					.preview-image {
						max-width: 100%;
						max-height: 100%;
						will-change: transform;
						
						// 解决图片拖影问题
						backface-visibility: hidden;
						-webkit-backface-visibility: hidden;
						transform-style: preserve-3d;
						
						// 防止闪烁 - 修复单位问题
						-webkit-transform-style: preserve-3d;
						-webkit-perspective: 1000px;
						perspective: 1000px;
					}
					
					.loading-indicator {
						position: absolute;
						top: 50%;
						left: 50%;
						transform: translate(-50%, -50%);
						
						.loading-spinner {
							width: 60rpx;
							height: 60rpx;
							border: 6rpx solid rgba(255, 255, 255, 0.3);
							border-radius: 50%;
							border-top: 6rpx solid #ffffff;
							animation: spin 1s linear infinite;
						}
						
						@keyframes spin {
							0% { transform: rotate(0deg); }
							100% { transform: rotate(360deg); }
						}
					}
					
					.error-indicator {
						position: absolute;
						top: 50%;
						left: 50%;
						transform: translate(-50%, -50%);
						display: flex;
						flex-direction: column;
						align-items: center;
						
						.error-icon {
							width: 80rpx;
							height: 80rpx;
							line-height: 80rpx;
							text-align: center;
							border-radius: 50%;
							background-color: rgba(255, 255, 255, 0.2);
							color: #ffffff;
							font-size: 40rpx;
							font-weight: bold;
							margin-bottom: 20rpx;
						}
						
						.error-text {
							color: #ffffff;
							font-size: 28rpx;
						}
					}
				}
			}
		}
		
		// 左右导航箭头
		.nav-arrows {
			position: absolute;
			top: 0;
			left: 0;
			right: 0;
			bottom: 0;
			pointer-events: none;
			z-index: 5;
			
			.nav-arrow {
				position: absolute;
				top: 50%;
				transform: translateY(-50%);
				width: 80rpx;
				height: 80rpx;
				background-color: rgba(0, 0, 0, 0.3);
				border-radius: 50%;
				display: flex;
				justify-content: center;
				align-items: center;
				pointer-events: auto;
				opacity: 0.7;
				transition: opacity 0.3s ease;
				
				&:active {
					opacity: 1;
				}
				
				.arrow-icon {
					color: #fff;
					font-size: 50rpx;
					font-weight: bold;
				}
				
				&.left {
					left: 30rpx;
				}
				
				&.right {
					right: 30rpx;
				}
			}
		}
		
		.zoom-indicator {
			position: absolute;
			bottom: 200rpx;
			left: 50%;
			transform: translateX(-50%);
			background-color: rgba(0, 0, 0, 0.5);
			color: #fff;
			padding: 10rpx 20rpx;
			border-radius: 30rpx;
			font-size: 24rpx;
			z-index: 20;
		}
		
		.double-tap-hint {
			position: absolute;
			bottom: 250rpx;
			left: 50%;
			transform: translateX(-50%);
			background-color: rgba(0, 0, 0, 0.5);
			color: #fff;
			padding: 10rpx 20rpx;
			border-radius: 30rpx;
			font-size: 24rpx;
			z-index: 20;
			animation: fadeOut 3s forwards;
			
			@keyframes fadeOut {
				0% { opacity: 1; }
				70% { opacity: 1; }
				100% { opacity: 0; }
			}
		}
		
		.preview-header {
			position: absolute;
			top: var(--status-bar-height, 0);
			left: 0;
			right: 0;
			height: 90rpx;
			display: flex;
			justify-content: space-between;
			align-items: center;
			padding: 0 30rpx;
			background: linear-gradient(to bottom, rgba(0, 0, 0, 0.5), transparent);
			z-index: 10;
			transition: opacity 0.3s ease;
			
			.preview-counter {
				color: #fff;
				font-size: 28rpx;
			}
			
			.preview-close {
				width: 60rpx;
				height: 60rpx;
				display: flex;
				justify-content: center;
				align-items: center;
				
				.close-icon {
					color: #fff;
					font-size: 50rpx;
					font-weight: bold;
				}
			}
		}
		
		.preview-footer {
			position: absolute;
			bottom: 0;
			left: 0;
			right: 0;
			height: 120rpx;
			display: flex;
			justify-content: center;
			align-items: center;
			padding: 0 30rpx;
			padding-bottom: var(--window-bottom, 0);
			background: linear-gradient(to top, rgba(0, 0, 0, 0.5), transparent);
			z-index: 10;
			transition: opacity 0.3s ease;
			
			.preview-action {
				padding: 15rpx 40rpx;
				border-radius: 40rpx;
				margin: 0 20rpx;
				
				.action-text {
					color: #fff;
					font-size: 28rpx;
				}
			}
			
			.save-action, .zoom-action {
				background-color: rgba(255, 255, 255, 0.2);
				backdrop-filter: blur(10px);
				
				&:active {
					background-color: rgba(255, 255, 255, 0.3);
				}
			}
		}
	}
}
</style>