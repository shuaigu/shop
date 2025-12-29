<script setup>
	import { ref, watch, computed, onUnmounted } from 'vue'
	import { useUserInfoStore } from '@/store/user.js'
	import { fixImageUrl, getDefaultImage, addListImageParams } from '@/utils/domainConfig.js'
	import { processAvatarUrl } from '@/utils/domainConfig.js'
	import { previewImages } from '@/utils/imagePreview.js'
	const userStore = useUserInfoStore( )

	// 定义组件属性
	const props = defineProps( {
		item: {
			type: Object,
			require: true,
			default: ( ) => ( {
				user_info: {
					nickName: '未知用户',
					avatarUrl: '/static/images/touxiang.png',
					mobile: '未填写'
				}
			} )
		},
		// 是否显示评论区
		showComments: {
			type: Boolean,
			default: false
		},
		// 是否启用头像点击功能
		avatarClickEnabled: {
			type: Boolean,
			default: true
		}
	} )

	// 视频默认缩略图
	const defaultVideoThumbnail = '/static/images/video-thumbnail.png'
	
	// 获取视频缩略图
	const getVideoThumbnail = (video) => {
		if (!video) return defaultVideoThumbnail
		
		if (video.thumbnailURL) {
			return video.thumbnailURL
		}
		
		return defaultVideoThumbnail
	}

	// 超级优化的时间格式化 - 加强缓存机制
	const timeFormatCache = new Map();
	const CACHE_CLEANUP_INTERVAL = 300000; // 5分钟清理一次缓存
	let cacheCleanupTimer = null;
	
	// 定期清理缓存
	if (!cacheCleanupTimer) {
		cacheCleanupTimer = setInterval(() => {
			if (timeFormatCache.size > 100) {
				timeFormatCache.clear();
			}
		}, CACHE_CLEANUP_INTERVAL);
	}
	
	const formatDate = (timestamp) => {
		if (!timestamp) return '未知时间';
		
		// 检查缓存
		const cacheKey = `${timestamp}`;
		if (timeFormatCache.has(cacheKey)) {
			return timeFormatCache.get(cacheKey);
		}
		
		const now = Date.now();
		const diff = now - timestamp;
		const seconds = Math.floor(diff / 1000);
		
		let result;
		if (seconds < 60) {
			result = '刚刚';
		} else if (seconds < 3600) {
			result = `${Math.floor(seconds / 60)}分钟前`;
		} else if (seconds < 86400) {
			result = `${Math.floor(seconds / 3600)}小时前`;
		} else if (seconds < 15552000) { // 180天
			result = `${Math.floor(seconds / 86400)}天前`;
		} else {
			// 具体日期
			const date = new Date(timestamp);
			const year = date.getFullYear();
			const month = String(date.getMonth() + 1).padStart(2, '0');
			const day = String(date.getDate()).padStart(2, '0');
			const hour = String(date.getHours()).padStart(2, '0');
			const minute = String(date.getMinutes()).padStart(2, '0');
			
			const nowYear = new Date().getFullYear();
			if (year === nowYear) {
				result = `${month}月${day}日 ${hour}:${minute}`;
			} else {
				result = `${year}年${month}月${day}日 ${hour}:${minute}`;
			}
		}
		
		// 缓存结果
		timeFormatCache.set(cacheKey, result);
		
		// 限制缓存大小
		if (timeFormatCache.size > 200) {
			const firstKey = timeFormatCache.keys().next().value;
			timeFormatCache.delete(firstKey);
		}
		
		return result;
	};

	// 定义事件
	const emit = defineEmits( [ 'delete', 'contact', 'comment', 'like', 'preview', 'userList',
		'update:comments', 'edit'
	] )

	// 处理用户列表点击
	const handleUserList = ( user_id ) => {
		// 检查头像点击功能是否启用
		if (!props.avatarClickEnabled) {
			console.log('头像点击功能已禁用')
			uni.showToast({
				title: '管理员审核中',
				icon: 'none',
				duration: 2000
			})
			return
		}
		
		emit( 'userList', user_id )
	}

	// 处理删除
	const handleDelete = ( id ) => {
		emit( 'delete', id )
	}

	// 处理联系
	const handleContact = ( mobile ) => {
		emit( 'contact', mobile )
	}

	// 处理评论
	const handleComment = ( id ) => {
		// 检查头像点击功能是否启用（同时控制文章跳转）
		if (!props.avatarClickEnabled) {
			console.log('头像点击控制已禁用，评论跳转功能也被禁用')
			uni.showToast({
				title: '管理员审核中',
				icon: 'none',
				duration: 2000
			})
			return
		}
		
		if ( props.showComments ) {
			// 在详情页中，触发评论事件
			emit( 'comment' )
		} else {
			// 在其他页面中，跳转到详情页，同时传递必要的用户信息
			uni.navigateTo( {
				url: `/pages/article/articleDetail?article_id=${id}&user_id=${props.item.user_id}`,
				animationType: 'slide-in-right', // 添加滑入动画
				animationDuration: 300 // 设置动画持续时间为300ms
			} )
		}
	}

	// 处理点赞
	const handleLove = ( id ) => {
		emit( 'like', id )
	}

	// 处理编辑
	const handleEdit = ( id ) => {
		emit( 'edit', id )
	}

	// 判断是否是管理员
	const isAdmin = computed(() => {
		return userStore.userInfo.role && userStore.userInfo.role.includes('admin')
	})

	// 处理评论更新
	const handleCommentsUpdate = ( newComments ) => {
		emit( 'update:comments', newComments )
	}

	// 点击详情
	const handleDetail = ( article_id ) => {
		// 检查头像点击功能是否启用（同时控制文章跳转）
		if (!props.avatarClickEnabled) {
			console.log('头像点击控制已禁用，文章跳转功能也被禁用')
			uni.showToast({
				title: '管理员审核中',
				icon: 'none',
				duration: 2000
			})
			return
		}
		
		console.log( article_id, '跳转文章详情' )
		uni.navigateTo( {
			url: `/pages/article/articleDetail?article_id=${article_id}`,
			animationType: 'slide-in-right', // 添加滑入动画
			animationDuration: 300 // 设置动画持续时间为300ms
		} )
	}

	// 跳转到文章详情
	const goToDetail = ( item ) => {
		// 检查头像点击功能是否启用（同时控制文章跳转）
		if (!props.avatarClickEnabled) {
			console.log('头像点击控制已禁用，文章跳转功能也被禁用')
			uni.showToast({
				title: '管理员审核中',
				icon: 'none',
				duration: 2000
			})
			return
		}
		
		if ( !props.showComments ) { // 如果不是在详情页中
			uni.navigateTo( {
				url: `/pages/article/articleDetail?article_id=${item._id}&user_id=${item.user_id}`,
				animationType: 'slide-in-right', // 添加滑入动画
				animationDuration: 300 // 设置动画持续时间为300ms
			} )
		}
	}

	// 超级优化的图片URL处理 - 增强缓存策略
	const imageUrlCache = new Map();
	const MAX_CACHE_SIZE = 500; // 最大缓存500个图片URL
	
	// 处理用户头像URL - 使用ref代曾computed，防止频繁重新计算导致闪烁
	const userAvatarUrl = ref('/static/images/touxiang.png');
	const avatarLoaded = ref(false); // 头像加载状态
	
	// 处理头像URL的函数（异步版本）
	const processAvatarUrlLocal = async () => {
		const userInfo = props.item || {};
		let avatarUrl = userInfo.user_avatarUrl || userInfo.avatarUrl || (userInfo.author && userInfo.author.avatar_file && userInfo.author.avatar_file.url);
		
		// 如果没有头像URL，返回默认头像
		if (!avatarUrl) {
			return '/static/images/touxiang.png';
		}
		
		// 如果是默认头像，直接返回
		if (avatarUrl === getDefaultImage('avatar') || avatarUrl === '/static/images/touxiang.png') {
			return '/static/images/touxiang.png';
		}
		
		// 检测并过滤临时文件路径
		if (avatarUrl.includes('tmp_') || avatarUrl.includes('tmp/') || avatarUrl.startsWith('http://tmp/') || avatarUrl.startsWith('wxfile://')) {
			console.warn('检测到临时文件路径，使用默认头像:', avatarUrl);
			return '/static/images/touxiang.png';
		}
		
		// 检查缓存
		const cacheKey = `avatar_${avatarUrl}`;
		if (imageUrlCache.has(cacheKey)) {
			return imageUrlCache.get(cacheKey);
		}
		
		// 使用新的processAvatarUrl处理，自动转换cloud://格式
		let processedUrl;
		try {
			processedUrl = await processAvatarUrl(avatarUrl);
			
			// 二次校验：确保处理后的URL不是临时文件
			if (processedUrl && (processedUrl.includes('tmp_') || processedUrl.includes('tmp/') || processedUrl.startsWith('http://tmp/') || processedUrl.startsWith('wxfile://'))) {
				console.warn('处理后仍为临时文件，使用默认头像:', processedUrl);
				processedUrl = '/static/images/touxiang.png';
			}
		} catch (error) {
			console.error('处理头像URL失败:', error);
			processedUrl = '/static/images/touxiang.png';
		}
		
		// 缓存结果
		imageUrlCache.set(cacheKey, processedUrl);
		
		// 限制缓存大小
		if (imageUrlCache.size > MAX_CACHE_SIZE) {
			const firstKey = imageUrlCache.keys().next().value;
			imageUrlCache.delete(firstKey);
		}
		
		return processedUrl;
	};
	
	// 初始化头像（异步）
	processAvatarUrlLocal().then(url => {
		userAvatarUrl.value = url;
	});
	
	// 处理头像加载成功
	const handleAvatarLoad = () => {
		avatarLoaded.value = true;
	};
	
	// 监听props变化，只在头像真正改变时才更新
	watch(() => props.item, async (newItem) => {
		if (newItem) {
			const newAvatarUrl = await processAvatarUrlLocal();
			// 只有当头像URL真正发生变化时才更新，避免不必要的重渲染
			if (newAvatarUrl !== userAvatarUrl.value) {
				avatarLoaded.value = false; // 重置加载状态
				userAvatarUrl.value = newAvatarUrl;
			}
		}
	}, { deep: false }); // 使用浅层监听，提升性能
	
	// 图片加载状态管理
	const imageLoadStates = ref(new Map());
	
	// 获取占位图
	const placeholderImage = getDefaultImage('default');
	
	// 文章图片处理 - 使用addListImageParams自动添加水印
	const processedImages = computed(() => {
		if (!props.item.images || !props.item.images.length) {
			return [];
		}
		
		// 最多只处理9张图片
		return props.item.images.slice(0, 9).map((img, index) => {
			// 先修复URL，再添加图片参数和水印
			const rawUrl = img.url || getDefaultImage('default');
			const fixedUrl = fixImageUrl(rawUrl);
			const processedUrl = addListImageParams(fixedUrl); // 会自动添加水印（如果全局启用）
			
			// 初始化加载状态
			if (!imageLoadStates.value.has(index)) {
				imageLoadStates.value.set(index, false);
			}
			
			return {
				...img,
				processedUrl: processedUrl,
				index: index,
				loaded: imageLoadStates.value.get(index) || false
			};
		});
	});
	
	// 处理图片加载成功
	const handleImageLoad = (index) => {
		imageLoadStates.value.set(index, true);
	};
	
	// 处理图片加载错误
	const handleImageError = (e, index) => {
		e.target.src = getDefaultImage('default');
		imageLoadStates.value.set(index, true);
	};

	// 处理头像加载失败，使用默认头像
	const onAvatarError = (e) => {
		// 微信小程序使用不同的属性名
		// #ifdef MP-WEIXIN
		e.target.src = '/static/images/touxiang.png';
		// #endif
		// #ifndef MP-WEIXIN
		e.target.src = getDefaultImage('avatar');
		// #endif
	}

	// 图片预览
	const handlePreview = (url, index) => {
		if (!processedImages.value.length) return;
		
		// 收集所有图片URL
		const images = processedImages.value.map(img => img.url);
		
		// 使用新的图片预览工具函数
		previewImages(images, index);
	};
	
	// 长按预览
	const handleLongPressPreview = (url, index) => {
		if (!processedImages.value.length) return;
		
		const images = processedImages.value.map(img => img.url);
		previewImages(images, index);
	};
	
	// 组件卸载时清理缓存
	onUnmounted(() => {
		// 清理定时器
		if (cacheCleanupTimer) {
			clearInterval(cacheCleanupTimer);
			cacheCleanupTimer = null;
		}
		
		// 如果缓存过大,清理部分缓存
		if (imageUrlCache.size > MAX_CACHE_SIZE) {
			imageUrlCache.clear();
		}
		if (timeFormatCache.size > 100) {
			timeFormatCache.clear();
		}
	});
</script>

<template>
	<view class="pyqContent">
		<!-- 动态头部 -->
		<view class="pyq-head">
			<view class="left" @click="handleUserList(item.user_id)" :class="{'disabled': !avatarClickEnabled}">
				<view class="userAvatar">
					<!-- 占位图层 -->
					<image 
						class="avatar-placeholder" 
						src="/static/images/touxiang.png" 
						mode="aspectFill"
						v-if="!avatarLoaded">
					</image>
					<!-- 实际头像层 -->
					<image 
						class="avatar-image" 
						:class="{'avatar-loaded': avatarLoaded}"
						:src="userAvatarUrl" 
						mode="aspectFill" 
						@load="handleAvatarLoad"
						@error="onAvatarError">
					</image>
				</view>
				<view class="info">
					<view class="top">
						<view class="nickName">
							{{item.user_nickName || '未知用户'}}
						</view>
						<!-- 审核状态样式 -->
						<view class="examine">
							<slot></slot>
						</view>
					</view>
					<view class="address">
						<uni-icons custom-prefix="icon" type="lishuai-dingwei" size="12" color="#8a8a8a"></uni-icons>
						<text class="address-text">{{item.district || '未知位置'}}</text>
						<text class="time-divider">|</text>
						<text class="time-text">{{ formatDate(item.create_time) }}</text>
					</view>
				</view>
			</view>

			<!-- 文章的功能操作 -->
			<view class="right">
				<view class="operation">
					<!-- 管理员权限时显示编辑按钮 -->
					<view class="action-btn" v-if="isAdmin" @click="handleEdit(item._id)">
						<uni-icons color="#1890ff" custom-prefix="icon" type="lishuai-bianji" size="18"></uni-icons>
					</view>
					<!-- 统一根据用户ID判断显示按钮 -->
					<view class="action-btn" v-if="item.user_id === userStore.userInfo.uid"
						@click="handleDelete(item._id)">
						<uni-icons color="#999999" custom-prefix="icon" type="lishuai-shanchu" size="18"></uni-icons>
					</view>
					<view class="action-btn" v-else-if="!isAdmin" @click="handleContact(item.user_mobile || '未填写')">
						<uni-icons color="#5cb85c" custom-prefix="icon" type="lishuai-dianhua" size="18"></uni-icons>
					</view>
				</view>
			</view>
		</view>
		<!-- 动态发布的内容 -->
		<view class="pyq-c" @click="goToDetail(item)">
			<view class="text-content">{{item.content}}</view>
		</view>
		<!-- 动态照片 - 使用占位图机制 -->
		<view class="pyq-img" v-if="processedImages.length">
			<!-- 单张图片显示 -->
			<template v-if="processedImages.length === 1">
				<view class="single-img">
					<view class="img-wrapper">
						<!-- 占位图层 -->
						<image 
							class="single-img-placeholder" 
							:src="placeholderImage" 
							mode="widthFix"
							v-if="!imageLoadStates.get(processedImages[0].index)">
						</image>
						<!-- 实际图片层 -->
						<image 
							class="single-img-item" 
							:class="{'img-loaded': imageLoadStates.get(processedImages[0].index)}"
							:src="processedImages[0].processedUrl" 
							mode="widthFix"
							@load="() => handleImageLoad(processedImages[0].index)"
							@error="(e) => handleImageError(e, processedImages[0].index)"
							@click.stop="() => handlePreview(processedImages[0].processedUrl, 0)"
							@longtap="() => handleLongPressPreview(processedImages[0].processedUrl, 0)">
						</image>
					</view>
				</view>
			</template>
			<!-- 多张图片显示 -->
			<template v-else>
				<view class="multi-img">
					<view :class="['img-grid', `grid-${processedImages.length}`]">
						<view 
							v-for="(img, index) in processedImages" 
							:key="index" 
							class="grid-item-wrapper">
							<!-- 占位图层 -->
							<image 
								class="grid-item-placeholder" 
								:src="placeholderImage" 
								mode="aspectFill"
								v-if="!imageLoadStates.get(img.index)">
							</image>
							<!-- 实际图片层 -->
							<image 
								class="grid-item" 
								:class="{'img-loaded': imageLoadStates.get(img.index)}"
								:src="img.processedUrl"
								mode="aspectFill" 
								@load="() => handleImageLoad(img.index)"
								@error="(e) => handleImageError(e, img.index)"
								@click.stop="() => handlePreview(img.processedUrl, index)"
								@longtap="() => handleLongPressPreview(img.processedUrl, index)">
							</image>
						</view>
					</view>
				</view>
			</template>
		</view>
		
		<!-- 动态操作功能 -->
		<view class="pyq-gn">
			<!-- 左侧区域，可以放置其他内容或保留空白 -->
			<view class="left-area">
				<!-- 视频标识图标 -->
				<view v-if="item.videoURL || item.video?.videoURL" class="video-info">
					<uni-icons custom-prefix="icon" type="lishuai-shipin" size="14" color="#999999"></uni-icons>
				</view>
			</view>
			
			<!-- 右侧功能区 - 只显示浏览量 -->
			<view class="right">
				<!-- 浏览次数 -->
				<view class="publicTime view-info">
					{{ item.look_count || 0 }}次浏览
				</view>
			</view>
		</view>
	</view>
</template>

<style lang="scss" scoped>
	/*朋友圈动态*/
	.pyqContent {
		flex: 1;
		margin-bottom: 2rpx;
		padding: 24rpx;
		background-color: #fff;

		/* 显示详情按钮 */
		.detail-btn {
			padding: 8rpx 20rpx;
			background-color: #1890ff;
			color: #ffffff;
			border-radius: 8rpx;
			font-size: 24rpx;
		}
		
		/*头部-用户基本信息*/
		.pyq-head {
			display: flex;
			justify-content: space-between;
			align-items: center;

			/*左侧用户信息*/
			.left {
				display: flex;
				align-items: center;

				&.disabled {
					cursor: not-allowed;
					opacity: 0.9;
				}

				/*头像*/
				.userAvatar {
					position: relative;
					width: 80rpx;
					height: 80rpx;
					border-radius: 8rpx;
					overflow: hidden;
					flex-shrink: 0; /* 防止头像被压缩 */
					
					.avatar-placeholder,
					.avatar-image {
						width: 100%;
						height: 100%;
					}
					
					.avatar-placeholder {
						position: absolute;
						top: 0;
						left: 0;
						z-index: 1;
						opacity: 1; /* 占位图显示 */
					}
					
					.avatar-image {
						position: absolute;
						top: 0;
						left: 0;
						z-index: 2;
						opacity: 0; /* 默认隐藏 */
						transition: opacity 0.3s ease;
						
						&.avatar-loaded {
							opacity: 1; /* 加载成功后显示 */
						}
					}
				}

				.info {
					margin: 0 16rpx;

					.top {
						display: flex;

						/*昵称*/
						.nickName {
							@include gradientText;
							font-size: 28rpx;
						}

						/*审核样式*/
						.examine {
							margin-left: 16rpx;
							color: #fa8c16;
						}
					}

					/*定位*/
					.address {
						font-size: 28rpx;
						color: $pyq-text-color-helper;
						display: flex;
						align-items: center;
						
						.address-text {
							margin-left: 4rpx;
						}

						.time-divider {
							margin: 0 8rpx;
							color: $pyq-text-color-helper;
						}

						.time-text {
							color: $pyq-text-color-helper;
						}
					}
				}
			}

			/*顶部右侧功能*/
			.right {
				display: flex;
				align-items: center;

				.operation {
					position: relative;
					display: flex;
					align-items: center;

					.action-btn {
						padding: 20rpx;
						cursor: pointer;

						&:active {
							opacity: 0.7;
						}
					}
				}
			}
		}

		/*内容-发布文字内容*/
		.pyq-c {
			margin-left: 96rpx;
			font-size: 32rpx;
			color: $pyq-text-color-body;
			cursor: pointer;

			&:active {
				opacity: 0.7;
			}
		}

		/*文字内容*/
		.text-content {
			@include textShenglue(5);
			margin-bottom: 16rpx;
		}

		/*发布的图片*/
		.pyq-img {
			margin-left: 96rpx;

			// 单张图片样式
			.single-img {
				width: 300rpx;
				min-height: 100rpx;
				max-height: 600rpx;
				border-radius: 8rpx;
				overflow: hidden;

				.img-wrapper {
					position: relative;
					width: 100%;
					height: 100%;
				}

				.single-img-placeholder,
				.single-img-item {
					width: 100%;
					height: auto;
					vertical-align: top;
				}

				.single-img-placeholder {
					position: absolute;
					top: 0;
					left: 0;
					z-index: 1;
					opacity: 0.2;
				}

				.single-img-item {
					position: relative;
					z-index: 2;
					opacity: 0;
					transition: opacity 0.3s ease;
					
					&.img-loaded {
						opacity: 1;
					}
				}
			}

			// 多张图片样式
			.multi-img {
				.img-grid {
					display: flex;
					flex-wrap: wrap;
					gap: 8rpx;

					.grid-item-wrapper {
						position: relative;
						width: 180rpx;
						height: 180rpx;
						border-radius: 8rpx;
						overflow: hidden;
					}

					.grid-item-placeholder,
					.grid-item {
						width: 180rpx;
						height: 180rpx;
						border-radius: 8rpx;
					}

					.grid-item-placeholder {
						position: absolute;
						top: 0;
						left: 0;
						z-index: 1;
						opacity: 0.2;
					}

					.grid-item {
						position: absolute;
						top: 0;
						left: 0;
						z-index: 2;
						opacity: 0;
						transition: opacity 0.3s ease;
						
						&.img-loaded {
							opacity: 1;
						}
					}

					// 4张图片特殊处理
					&.grid-4 {
						width: 420rpx;
					}

					&.grid-9 {
						width: 630rpx;
					}
				}
			}
		}

		/*朋友圈动态操作功能区*/
		.pyq-gn {
			display: flex;
			justify-content: space-between;
			align-items: center;
			margin-top: 24rpx;
			padding-left: 96rpx;

			/*左侧区域，可以放置其他内容或保留空白 */
			.left-area {
				// 视频信息样式
				.video-info {
					display: flex;
					align-items: center;
					
					.uni-icons {
						position: relative;
						top: 2rpx;
					}
				}
			}

			/*右侧功能区 - 只显示浏览量 */
			.right {
				display: flex;
				align-items: center;

				/*浏览量*/
				.publicTime {
					font-size: 24rpx;
					color: $pyq-text-color-placeholder;
					display: flex;
					align-items: center;
				}
			}
		}
	}
</style>