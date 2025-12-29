<script setup>
	import { ref, watch, computed, onUnmounted, onMounted } from 'vue'
	import { useUserInfoStore } from '@/store/user.js'
	const userStore = useUserInfoStore( )

	// 抖音小程序判断
	const isToutiao = ref(false)
	
	// 在组件挂载时检测平台
	onMounted(() => {
		// #ifdef MP-TOUTIAO
		isToutiao.value = true
		console.log('运行在抖音小程序环境')
		// #endif
	})

	// 定义组件属性
	const props = defineProps( {
		item: {
			type: Object,
			require: true,
			default: ( ) => ( {
				user_info: {
					nickName: '未知用户',
					avatarUrl: '/static/images/default-avatar.png',
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

	// 自定义格式化日期函数
	const formatDate = (timestamp) => {
		if (!timestamp) return '未知时间'
		
		const now = Date.now()
		const diff = now - timestamp
		
		// 转换为秒
		const seconds = Math.floor(diff / 1000)
		// 转换为分钟
		const minutes = Math.floor(seconds / 60)
		// 转换为小时
		const hours = Math.floor(minutes / 60)
		// 转换为天
		const days = Math.floor(hours / 24)
		
		// 获取日期对象
		const date = new Date(timestamp)
		const year = date.getFullYear()
		const month = date.getMonth() + 1
		const day = date.getDate()
		const hour = date.getHours()
		const minute = date.getMinutes()
		
		// 格式化为两位数
		const formattedMonth = month < 10 ? `0${month}` : month
		const formattedDay = day < 10 ? `0${day}` : day
		const formattedHour = hour < 10 ? `0${hour}` : hour
		const formattedMinute = minute < 10 ? `0${minute}` : minute
		const timeStr = `${formattedHour}:${formattedMinute}`
		
		// 在地址栏显示的时间格式：始终显示年份
		if (days < 1) {
			return `${year}年 今天${timeStr}`
		} else if (days < 2) {
			return `${year}年 昨天${timeStr}`
		} else if (days < 10) {
			return `${year}年 ${days}天前${timeStr}`
		} else {
			return `${year}年${formattedMonth}月${formattedDay}日 ${timeStr}`
		}
	}

	// 定义事件
	const emit = defineEmits( [ 'delete', 'contact', 'comment', 'like', 'preview', 'userList',
		'update:comments'
	] )

	// 处理用户列表点击
	const handleUserList = ( user_id ) => {
		// 检查头像点击功能是否启用
		if (!props.avatarClickEnabled) {
			console.log('头像点击功能已禁用')
			uni.showToast({
				title: '此功能开发中',
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

	// 处理评论更新
	const handleCommentsUpdate = ( newComments ) => {
		emit( 'update:comments', newComments )
	}

	// 点击详情
	const handleDetail = ( article_id ) => {
		console.log( article_id, '跳转文章详情' )
		uni.navigateTo( {
			url: `/pages/article/articleDetail?article_id=${article_id}`,
			animationType: 'slide-in-right', // 添加滑入动画
			animationDuration: 300 // 设置动画持续时间为300ms
		} )
	}

	// 跳转到文章详情
	const goToDetail = ( item ) => {
		if ( !props.showComments ) { // 如果不是在详情页中
			// 防止快速多次点击
			if (isNavigating.value) return;
			isNavigating.value = true;
			
			try {
				uni.navigateTo({
					url: `/pages/article/articleDetail?article_id=${item._id}&user_id=${item.user_id}`,
					animationType: 'slide-in-right', // 添加滑入动画
					animationDuration: 300, // 设置动画持续时间为300ms
					success: () => {
						console.log('跳转到文章详情成功');
					},
					fail: (err) => {
						console.error('跳转到文章详情失败:', err);
						
						// 抖音小程序特定错误处理
						// #ifdef MP-TOUTIAO
						// 如果是因为跳转过于频繁导致的错误，可以延迟重试
						if (err.errMsg && err.errMsg.includes('too frequent')) {
							setTimeout(() => {
								uni.navigateTo({
									url: `/pages/article/articleDetail?article_id=${item._id}&user_id=${item.user_id}`
								});
							}, 500);
						} else {
							uni.showToast({
								title: '页面跳转失败',
								icon: 'none'
							});
						}
						// #endif
						
						// 非抖音小程序环境
						// #ifndef MP-TOUTIAO
						uni.showToast({
							title: '页面跳转失败',
							icon: 'none'
						});
						// #endif
					},
					complete: () => {
						// 防抖处理，500ms后重置状态
						setTimeout(() => {
							isNavigating.value = false;
						}, 500);
					}
				});
			} catch (e) {
				console.error('跳转异常:', e);
				isNavigating.value = false;
				uni.showToast({
					title: '操作异常，请重试',
					icon: 'none'
				});
			}
		}
	}

	// 防抖变量
	const isNavigating = ref(false);

	// 计算用户信息
	const userInfo = computed( ( ) => {
		return props.item || {
			nickName: '未知用户',
			avatarUrl: '/static/images/default-avatar.png',
			mobile: '未填写'
		}
	} )

	const onAvatarError = ( e ) => {
		e.target.src = '/static/images/default-avatar.png'
	}

	const handlePreview = (url, index) => {
		if (!url) return
		console.log('Preview URL:', url)
		
		// 获取有效图片列表
		const validImages = props.item.images.filter(img => img.thumbnailURL || img.compressedURL || img.url)
		if (validImages.length) {
			// 图片超过9张时，只预览前8张
			const maxPreviewImages = validImages.length > 9 ? 8 : 9
			// 提取图片URL列表 - 优先使用compressedURL，最多显示maxPreviewImages张
			const limitedImages = validImages.slice(0, maxPreviewImages)
			let urls = limitedImages.map(img => img.compressedURL || img.thumbnailURL || img.url)
			
			// 抖音小程序图片处理
			// #ifdef MP-TOUTIAO
			// 确保所有图片URL都是https
			urls = urls.map(imgUrl => {
				// 修复协议为https
				if (imgUrl && imgUrl.startsWith('http://')) {
					return imgUrl.replace('http://', 'https://');
				}
				return imgUrl;
			});
			// #endif
			
			// 确保索引不超过限制后的图片数量
			const previewIndex = Math.min(index, urls.length - 1)
			
			// 使用uni.previewImage实现图片预览和左右滑动功能
			uni.previewImage({
				urls: urls,           // 需要预览的图片链接列表
				current: urls[previewIndex], // 当前显示图片的链接
				indicator: 'number',  // 显示页码指示器
				loop: true,           // 循环预览
				// 抖音小程序特殊处理
				// #ifdef MP-TOUTIAO
				longPressActions: {
					itemList: ['保存图片', '分享'],
					success: function(data) {
						console.log('选中了第' + (data.tapIndex + 1) + '个按钮');
					},
					fail: function(err) {
						console.log(err.errMsg);
					}
				},
				// #endif
				success: () => {
					console.log('图片预览成功');
				},
				fail: (err) => {
					console.error('预览图片失败:', err);
					uni.showToast({
						title: '预览图片失败',
						icon: 'none'
					});
				}
			});
		}
	}

	// Add a new function for image preview on long press
	const handleLongPressPreview = (url, index) => {
		if (!url) return
		console.log('Original URL:', url)
		
		// 获取有效图片列表
		const validImages = props.item.images.filter(img => img.thumbnailURL || img.compressedURL || img.url)
		if (validImages.length) {
			// 图片超过9张时，只预览前8张
			const maxPreviewImages = validImages.length > 9 ? 8 : 9
			// 提取图片URL列表 - 优先使用compressedURL，最多显示maxPreviewImages张
			const limitedImages = validImages.slice(0, maxPreviewImages)
			let urls = limitedImages.map(img => img.compressedURL || img.thumbnailURL || img.url)
			
			// 抖音小程序图片处理
			// #ifdef MP-TOUTIAO
			// 确保所有图片URL都是https
			urls = urls.map(imgUrl => {
				// 修复协议为https
				if (imgUrl && imgUrl.startsWith('http://')) {
					return imgUrl.replace('http://', 'https://');
				}
				return imgUrl;
			});
			// #endif
			
			// 传递所有图片URL到父组件进行预览
			// 确保索引不超过限制后的图片数量
			const previewIndex = Math.min(index, urls.length - 1)
			emit('preview', urls[previewIndex], urls)
		}
	}
</script>

<template>
	<view class="pyqContent">
		<!-- 
			抖音小程序适配说明：
			1. 图片事件：使用@longpress替代@longtap
			2. 图片属性：添加show-menu-by-longpress支持长按菜单
			3. 链接处理：确保所有外部链接和图片链接使用https协议
			4. 样式优化：添加will-change和transform:translateZ(0)提升渲染性能
			5. 添加防抖处理：避免快速点击导致的页面跳转问题
		-->
		<!-- 动态头部 -->
		<view class="pyq-head">
			<view class="left" @click="handleUserList(item.user_id)" :class="{'disabled': !avatarClickEnabled}">
				<view class="userAvatar">
					<image class="avatar-image" :src="userInfo.user_avatarUrl" mode="aspectFill" @error="onAvatarError"></image>
				</view>
				<view class="info">
					<view class="top">
						<view class="nickName">
							{{userInfo.user_nickName}}
						</view>
						<!-- 审核状态样式 -->
						<view class="examine">
							<slot></slot>
						</view>
					</view>
					<view class="address">
						<uni-icons custom-prefix="icon" type="lishuai-dingwei" size="12" color="#8a8a8a"></uni-icons>
						<text class="address-text">{{item.district || '未知位置'}}</text>
						<!-- 在地区后面添加时间和浏览次数 -->
						<text class="time-text" v-if="item.create_time">{{ formatDate(item.create_time) }}</text>
						<!-- <text class="view-count-text" v-if="item.look_count !== undefined">{{ item.look_count || 0 }}次浏览</text/> -->
					</view>
				</view>
			</view>

			<!-- 文章的功能操作 -->
			<view class="right">
				<view class="operation">
					<!-- 统一根据用户ID判断显示按钮 -->
					<view class="action-btn" v-if="item.user_id === userStore.userInfo.uid"
						@click="handleDelete(item._id)">
						<uni-icons color="#999999" custom-prefix="icon" type="lishuai-shanchu" size="18"></uni-icons>
					</view>
					<view class="action-btn" v-else @click="handleContact(item.user_mobile)">
						<uni-icons color="#5cb85c" custom-prefix="icon" type="lishuai-dianhua" size="18"></uni-icons>
					</view>
				</view>
			</view>
		</view>
		<!-- 动态发布的内容 -->
		<view class="pyq-c" @click="goToDetail(item)">
			<view class="text-content">{{item.content}}</view>
		</view>
		<!-- 动态照片 -->
		<view class="pyq-img" v-if="item.images?.length">
			<!-- 单张图片显示 -->
			<view class="single-img" v-if="item.images.length === 1">
				<image class="single-img-item" :lazy-load="true" :src="item.images[0].compressedURL || item.images[0].thumbnailURL || item.images[0].url" mode="widthFix"
					@click="goToDetail(item)"
					@longpress="() => handleLongPressPreview(item.images[0].compressedURL || item.images[0].thumbnailURL || item.images[0].url, 0)"
					show-menu-by-longpress></image>
			</view>
			<!-- 多张图片显示 -->
			<view class="multi-img" v-else>
				<view :class="['img-grid', `grid-${Math.min(item.images.length, 9)}`]">
					<!-- 如果超过9张图片，只显示8张+更多按钮；否则显示全部图片 -->
					<template v-if="item.images.length > 9">
						<image class="grid-item" :lazy-load="true" v-for="(img, index) in item.images.slice(0, 8)" :key="index" :src="img.compressedURL || img.thumbnailURL || img.url"
							mode="aspectFill" 
							@click="goToDetail(item)"
							@longpress="() => handleLongPressPreview(img.compressedURL || img.thumbnailURL || img.url, index)"
							show-menu-by-longpress></image>
						
						<!-- 第9个位置显示"更多"提示，使用第9张图片作为背景 -->
						<view class="grid-item more-images-indicator" @click="goToDetail(item)">
							<image class="more-background-image" :src="item.images[8].compressedURL || item.images[8].thumbnailURL || item.images[8].url" mode="aspectFill"></image>
							<view class="more-overlay">
								<text>+{{item.images.length - 8}}</text>
							</view>
						</view>
					</template>
					
					<!-- 数量小于等于9张时，正常显示 -->
					<template v-else>
						<image class="grid-item" :lazy-load="true" v-for="(img, index) in item.images" :key="index" :src="img.compressedURL || img.thumbnailURL || img.url"
							mode="aspectFill" 
							@click="goToDetail(item)"
							@longpress="() => handleLongPressPreview(img.compressedURL || img.thumbnailURL || img.url, index)"
							show-menu-by-longpress></image>
					</template>
				</view>
			</view>
		</view>
		
		<!-- 动态操作功能 -->
		<view class="pyq-gn">
			<!-- 左侧区域，可以放置其他内容或保留空白 -->
			<view class="left-area">
				<!-- 视频标识图标 -->
				<uni-icons v-if="item.videoURL || item.video?.videoURL" custom-prefix="icon" type="lishuai-shipin" size="14" color="#999999"></uni-icons>
			</view>
			
			<!-- 右侧功能区 - 时间和浏览量一起显示 -->
			<view class="right">
				<!-- 发布时间 -->
				<view class="publicTime time-info">
					{{ formatDate(item.create_time) }}
				</view>
				
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
					width: 80rpx;
					height: 80rpx;
					border-radius: 8rpx;
					overflow: hidden;
					
					.avatar-image {
						width: 100%;
						height: 100%;
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
						flex-wrap: wrap; /* 小屏幕上允许换行 */
						margin-top: 4rpx; /* 添加顶部间距 */
						
						.address-text {
							margin-left: 4rpx;
							margin-right: 8rpx; /* 右侧添加间距 */
						}
						
						/* 时间文本样式 */
						.time-text {
							color: #999;
							font-size: 24rpx;
							position: relative; /* 用于定位分隔符 */
							padding-left: 12rpx; /* 为分隔符留出空间 */
							margin-right: 8rpx; /* 右侧添加间距 */
							
							/* 使用伪元素添加分隔符 */
							&:before {
								content: '|';
								position: absolute;
								left: 0;
								color: #ddd;
							}
						}
						
						/* 浏览次数文本样式 */
						.view-count-text {
							color: #999;
							font-size: 24rpx;
							position: relative; /* 用于定位分隔符 */
							padding-left: 12rpx; /* 为分隔符留出空间 */
							
							/* 使用伪元素添加分隔符 */
							&:before {
								content: '|';
								position: absolute;
								left: 0;
								color: #ddd;
							}
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
				/* 抖音小程序兼容性优化 */
				position: relative;
				font-size: 0;

				.single-img-item {
					width: 100%;
					height: auto;
					vertical-align: top;
					/* 抖音小程序图片优化 */
					will-change: transform;
					transform: translateZ(0);
				}
			}

			// 多张图片样式
			.multi-img {
				width: 100%; // 确保容器宽度占满父元素
				
				.img-grid {
					display: flex;
					flex-wrap: wrap;
					position: relative;
					width: 100%;
					max-width: 630rpx; // 设置最大宽度，防止在大屏上过宽
					
					// 使用统一间距
					margin: -5rpx;
					padding: 5rpx;

					.grid-item {
						position: relative;
						width: calc(33.333% - 10rpx); // 3等分减去间距
						height: 180rpx; // 恢复固定高度
						margin: 5rpx;
						border-radius: 8rpx;
						overflow: hidden;
						
						/* 抖音小程序图片优化 */
						will-change: transform;
						transform: translateZ(0);
						box-sizing: border-box;
					}
					
					// 更多图片指示器样式
					.more-images-indicator {
						position: relative;
						width: calc(33.333% - 10rpx); // 与普通图片保持一致的宽度
						height: 180rpx; // 恢复固定高度
						margin: 5rpx;
						border-radius: 8rpx;
						overflow: hidden;
						display: flex;
						justify-content: center;
						align-items: center;
						box-sizing: border-box;
						
						// 抖音小程序兼容性优化
						z-index: 1;
						
						// 背景图片样式
						.more-background-image {
							position: absolute;
							width: 100%;
							height: 100%;
							left: 0;
							top: 0;
							z-index: 1;
							object-fit: cover;
						}
						
						// 半透明遮罩层
						.more-overlay {
							position: absolute;
							width: 100%;
							height: 100%;
							left: 0;
							top: 0;
							background-color: rgba(0, 0, 0, 0.5);
							display: flex;
							justify-content: center;
							align-items: center;
							z-index: 2;
						}
						
						text {
							// 确保文字在抖音小程序中正确显示
							display: inline-block;
							text-align: center;
							position: relative;
							z-index: 3;
							font-size: 32rpx;
							color: #fff;
							font-weight: bold;
						}
					}

					// 特殊处理特定数量的图片
					&.grid-1 {
						// 单图样式特殊处理
						.grid-item {
							width: 300rpx; // 单图固定宽度
							height: 300rpx; // 单图固定高度
						}
					}
					
					// 4张图片特殊处理 - 2x2布局
					&.grid-4 {
						max-width: 420rpx; // 4张图特殊宽度
						
						.grid-item {
							width: calc(50% - 10rpx); // 二等分宽度减去间隙
							height: 180rpx; // 保持固定高度
						}
					}

					// 5-9张图片使用3x3网格布局
					&.grid-5, &.grid-6, &.grid-7, &.grid-8, &.grid-9 {
						/* 抖音小程序网格布局优化 */
						max-width: 630rpx;
						
						.grid-item {
							width: calc(33.333% - 10rpx);
							height: 180rpx; // 保持固定高度
						}
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
				// 视频标识图标
				.uni-icons {
					margin-right: 8rpx;
					position: relative;
					top: 2rpx;
				}
			}

			/*右侧功能区 - 时间和浏览量一起显示 */
			.right {
				display: flex;
				align-items: center;

				/*发布时间*/
				.publicTime {
					font-size: 24rpx;
					color: $pyq-text-color-placeholder;
					display: flex;
					align-items: center;
				}
				
				/* 分隔符 */
				.time-info:after {
					content: '|';
					margin: 0 10rpx;
					color: #ddd;
				}
			}
		}
	}
</style>