<script setup>
	import { ref, watch, computed, onUnmounted, shallowRef } from 'vue'
	import { useUserInfoStore } from '@/store/user.js'
	import '@/static/styles/iconfont.scss'  // 确保路径正确
	const userStore = useUserInfoStore()

	// 定义组件属性
	const props = defineProps({
		item: {
			type: Object,
			require: true,
			default: () => ({
				user_nickName: '未知用户',
				user_avatarUrl: '/static/images/default-avatar.png',
				user_mobile: '未填写',
				images: [],
				look_count: 0  // 添加浏览量默认值
			})
		},
		// 是否显示评论区
		showComments: {
			type: Boolean,
			default: false
		}
	})

	// 定义事件
	const emit = defineEmits(['delete', 'contact', 'comment', 'like', 'userList', 'update:comments', 'navigateToDetail'])

	// 处理用户列表点击
	const handleUserList = (userId) => emit('userList', userId)

	// 处理删除
	const handleDelete = (id) => emit('delete', id)

	// 处理联系
	const handleContact = (mobile) => emit('contact', mobile)

	// 处理评论
	const handleComment = (id) => {
		if (props.showComments) {
			// 在详情页中，触发评论事件
			emit('comment')
		} else {
			// 在其他页面中，跳转到详情页，同时传递必要的用户信息
			uni.navigateTo({
				url: `/pages/article/articleDetail/articleDetail?article_id=${id}&user_id=${props.item.user_id}`
			})
		}
	}

	// 处理点赞
	const handleLove = (id) => emit('like', id)

	// 处理评论更新
	const handleCommentsUpdate = (newComments) => emit('update:comments', newComments)

	// 跳转到文章详情
	const goToDetail = (item) => {
		if (!props.showComments) {
			uni.navigateTo({
				url: `/pages/article/articleDetail?article_id=${item._id}&user_id=${item.user_id}`
			})
		}
	}

	// 计算用户信息
	const userInfo = computed(() => {
		if (!props.item) {
			return {
				user_nickName: '未知用户',
				user_avatarUrl: '/static/images/default-avatar.png',
				user_mobile: '未填写'
			}
		}
		const info = {
			user_nickName: props.item.user_nickName || '未知用户',
			user_avatarUrl: props.item.user_avatarUrl || '/static/images/default-avatar.png',
			user_mobile: props.item.user_mobile || '未填写'
		}
		return info
	})

	const onAvatarError = (e) => {
		e.target.src = '/static/images/default-avatar.png'
	}

	// 使用 ref 来跟踪图标加载状态
	const locationIconError = ref(false)

	const onLocationIconError = () => {
		locationIconError.value = true
	}

	// 修改图片处理相关的计算属性
	const processedImages = computed(() => {
		if (!props.item?.images) return []
		
		// 获取所有有效图片
		const allImages = props.item.images.map(img => {
			if (!img) return null
			
			// 如果是对象格式
			if (typeof img === 'object') {
				return {
					// 缩略图优先使用 thumbnailURL
					thumbnail: img.thumbnailURL || img.url || '',
					// 原图优先使用 compressedURL，其次是 url，最后是 thumbnailURL
					original: img.compressedURL || img.url || img.thumbnailURL || ''
				}
			}
			// 如果是字符串格式（兼容旧数据）
			return {
				thumbnail: img,
				original: img
			}
		}).filter(Boolean)
		
		// 返回最多9张图片
		return allImages.slice(0, 9)
	})

	// 计算额外图片数量
	const extraImagesCount = computed(() => {
		if (!props.item?.images) return 0
		const totalImages = props.item.images.filter(img => img).length
		return totalImages > 9 ? totalImages - 9 : 0
	})

	// 修改图片错误处理，确保使用正确的属性
	const onImageError = (index) => {
		if (props.item.images?.[index]) {
			// 如果是对象格式
			if (typeof props.item.images[index] === 'object') {
				props.item.images[index].thumbnailURL = '/static/images/image-error.png'
			} else {
				// 如果是字符串格式
				props.item.images[index] = '/static/images/image-error.png'
			}
		}
	}

	// 预加载指定图片
	const preloadImage = (url) => {
		if (!url) return
		return new Promise((resolve, reject) => {
			uni.getImageInfo({
				src: url,
				success: resolve,
				fail: reject
			})
		})
	}

	// 修改预览图片方法，添加跳转详情页逻辑
	const previewImage = async (index, event) => {
		event.stopPropagation()
		
		// 如果是在详情页，只执行图片预览
		if (props.showComments) {
			const urls = processedImages.value.map(img => img.original)
			if (!urls.length || !urls[index]) return
			
			uni.previewImage({
				current: urls[index],
				urls: urls,
				success: () => {
					// 监听图片切换事件，处理循环逻辑
					const loadNextImage = (currentUrl) => {
						const currentIndex = urls.indexOf(currentUrl)
						if (currentIndex === urls.length - 1) {
							// 如果是最后一张，预加载第一张
							preloadImage(urls[0])
						} else if (currentIndex === 0) {
							// 如果是第一张，预加载最后一张
							preloadImage(urls[urls.length - 1])
						}
						// 预加载相邻图片
						const prevIndex = (currentIndex - 1 + urls.length) % urls.length
						const nextIndex = (currentIndex + 1) % urls.length
						Promise.all([
							preloadImage(urls[prevIndex]),
							preloadImage(urls[nextIndex])
						]).catch(() => {
							// 忽略预加载错误
						})
					}

					// 初始加载当前图片的相邻图片
					loadNextImage(urls[index])
				},
				fail: (err) => {
					console.error('预览失败:', err)
					uni.showToast({
						title: '预览失败',
						icon: 'none'
					})
				}
			})
		} else {
			// 如果不在详情页，跳转到详情页
			goToDetail(props.item)
		}
	}

	// 修改点击文章的处理函数
	const handleArticleClick = () => {
		emit('navigateToDetail', props.item._id)
	}
</script>

<template>
	<view class="pyqContent">
		<!-- 动态头部 -->
		<view class="pyq-head">
			<view class="left" @click="handleUserList(item.user_id)">
				<view class="userAvatar">
					<image :src="userInfo.user_avatarUrl" mode="aspectFill" @error="onAvatarError" show-loading="false"></image>
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
						<text class="iconfont icon-ditu-dibiao"></text>
						{{item.district || '未知位置'}}
					</view>
				</view>
			</view>

			<!-- 文章的功能操作 -->
			<view class="right">
				<view class="operation">
					<!-- 修改删除图标 -->
					<view class="action-btn" v-if="item.user_id === userStore.userInfo.uid"
						@click="handleDelete(item._id)">
						<text class="icon">✕</text>
					</view>
					<!-- 修改电话图标 -->
					<view class="action-btn" v-else @click="handleContact(item.user_mobile)">
						<text class="iconfont icon-dianhua"></text>
					</view>
				</view>
			</view>
		</view>
		<!-- 动态发布的内容 -->
		<view class="pyq-c" @click="handleArticleClick">
			<view class="text-content">{{item.content}}</view>
		</view>
		<!-- 在 text-content 后添加图片展示部分 -->
		<view class="pyq-img" v-if="processedImages.length">
			<view class="single-img" v-if="processedImages.length === 1">
				<image 
					:src="processedImages[0].thumbnail" 
					mode="aspectFit"
					@error="() => onImageError(0)"
					:lazy-load="true"
					show-loading="false"
					@click.stop="goToDetail(item)"
				/>
			</view>
			<view class="multi-img" v-else>
				<view class="img-grid" :class="`grid-${processedImages.length}`">
					<view class="img-wrapper" 
						v-for="(img, index) in processedImages" 
						:key="index"
						:class="{'last-image': index === 8 && extraImagesCount > 0}"
					>
						<image 
							:src="img.thumbnail" 
							mode="aspectFill"
							@error="() => onImageError(index)"
							:lazy-load="true"
							show-loading="false"
							@click.stop="goToDetail(item)"
						/>
						<!-- 如果是最后一张且有额外图片，显示+N -->
						<view class="extra-count" v-if="index === 8 && extraImagesCount > 0">
							<text>+{{extraImagesCount}}</text>
						</view>
					</view>
				</view>
			</view>
		</view>
		<!-- 修改功能区布局 -->
		<view class="pyq-gn">
			<view class="left-info">
				<!-- 发布时间 -->
				<view class="publicTime">
					<uni-dateformat 
						:date="Number(item.create_time)"
						:threshold="[0]"
						:before="''"
						:pattern="{
							year: '年前',
							month: '个月前',
							day: '天前',
							hour: '小时前',
							minute: '分钟前',
							second: '刚刚'
						}">
					</uni-dateformat>
				</view>
			</view>
			<!-- 浏览量移到这里 -->
			<view class="view-count">
				<text class="iconfont icon-liulan"></text>
				<text>浏览:{{item.look_count || 0}}次</text>
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

		/*头部-用户基本信息*/
		.pyq-head {
			display: flex;
			justify-content: space-between;
			align-items: center;

			/*左侧用户信息*/
			.left {
				display: flex;
				align-items: center;

				/*头像*/
				.userAvatar {
					width: 80rpx;
					height: 80rpx;
					border-radius: 8rpx;
					overflow: hidden;
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
						display: flex;
						align-items: center;
						font-size: 28rpx;
						color: $pyq-text-color-helper;
						line-height: 1;
						margin-top: 12rpx;
						.icon-ditu-dibiao {
							font-size: 26rpx;
							color: $pyq-text-color-helper;
							line-height: 1;
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

						.icon {
							font-size: 36rpx;
							color: #999999;
						}

						.contact-icon {
							font-size: 40rpx;
							color: #5cb85c;
							line-height: 1;
						}

						&:first-child .icon {
							color: #999999;  // 删除图标颜色
						}

						&:active {
							opacity: 0.7;
						}
					}
				}
			}
		}

		/*内容-发布文字内容*/
		.pyq-c {
			margin-left: 90rpx;
			font-size: 32rpx;
			color: $pyq-text-color-body;
			cursor: pointer;

			&:active {
				opacity: 0.9;
			}
		}

		/*文字内容*/
		.text-content {
			@include textShenglue(5);
			margin: 10rpx 0rpx 16rpx 0rpx;
		}

		/*发布的图片*/
		.pyq-img {
			margin-left: 90rpx;
			margin-bottom: 16rpx;

			// 单张图片样式
			.single-img {
				width: 300rpx;
				height: auto;
				max-height: 500rpx;
				border-radius: 8rpx;
				overflow: hidden;
				background-color: #f5f5f5;

				image {
					width: 100%;
					height: auto;
					min-height: 200rpx;
					object-fit: contain;
					display: block;
				}
			}

			// 多张图片样式
			.multi-img {
				.img-grid {
					display: flex;
					flex-wrap: wrap;
					gap: 8rpx;
					width: 500rpx;

					.img-wrapper {
						width: calc((500rpx - 16rpx) / 3);
						height: calc((500rpx - 16rpx) / 3);
						position: relative; /* 添加相对定位 */
						
						image {
							width: 100%;
							height: 100%;
							border-radius: 8rpx;
							background-color: #f5f5f5;
							object-fit: cover;
						}
						
						/* 添加额外图片计数样式 */
						.extra-count {
							position: absolute;
							top: 0;
							left: 0;
							width: 100%;
							height: 100%;
							background-color: rgba(0, 0, 0, 0.5);
							display: flex;
							justify-content: center;
							align-items: center;
							border-radius: 8rpx;
							
							text {
								color: #FFFFFF;
								font-size: 36rpx;
								font-weight: bold;
							}
						}
					}

					&.grid-2 .img-wrapper {
						width: calc((500rpx - 8rpx) / 2);
						height: calc((500rpx - 8rpx) / 2);
					}

					&.grid-4 .img-wrapper {
						width: calc((500rpx - 8rpx) / 2);
						height: calc((500rpx - 8rpx) / 2);
					}
				}
			}
		}

		/*功能区*/
		.pyq-gn {
			display: flex;
			margin-top: 24rpx;
			padding-left: 90rpx;
			padding-right: 20rpx;
			justify-content: space-between;

			.left-info {
				display: flex;
				align-items: center;
				gap: 16rpx;

				/*发布时间*/
				.publicTime {
					font-size: 28rpx;
					color: $pyq-text-color-placeholder;
				}
			}

			/*浏览量 - 移到右侧*/
			.view-count {
				display: flex;
				align-items: center;
				font-size: 28rpx;
				color: $pyq-text-color-placeholder;
				margin-left: auto;
				
				.iconfont {
					font-size: 28rpx;
					margin-right: 8rpx;
				}
			}
		}
	}

	/* 电话图标特殊样式 */
	.operation .action-btn:last-child .icon {
		color: #5cb85c;
	}
</style>