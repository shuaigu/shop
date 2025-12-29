<template>
	<view class="more-articles">
		<view class="section-divider"></view>
		<view class="section-title">
			{{ cate_id ? '同城推荐' : '更多文章' }}
		</view>
		
		<!-- 文章列表 -->
		<view v-if="articles.length > 0" class="article-list">
			<view 
				v-for="item in articles" 
				:key="item._id" 
				class="article-item"
				@click="handleArticleClick(item._id)"
			>
				<view class="article-content">
					<!-- 左侧图片部分 -->
					<view class="image-wrapper">
						<image 
							class="article-image"
							:src="getProcessedImageUrl(item)" 
							mode="aspectFill"
							@click.stop="item.images && item.images.length ? handleImagePreview(item.images) : null"
							@error="handleImageError"
							:data-article-id="item._id"
						></image>
						<!-- 添加图片计数器，当有多张图片时显示 -->
						<view class="image-counter" v-if="item.images && item.images.length > 1">
							<uni-icons type="image" size="12" color="#fff"></uni-icons>
							<text class="counter-text">{{item.images.length}}</text>
						</view>
					</view>
					
					<!-- 右侧文字部分 -->
					<view class="text-content">
						<view class="content-preview">
							<text class="category-name">{{item.cate_name || '未分类'}}</text>丨
							<template v-for="(part, index) in parseContentWithPhone(item.content)" :key="index">
								<span 
									v-if="part.isPhone" 
									class="phone-link"
									@click.stop="handlePhoneCall(part.text)"
								>
									<span class="icon lishuai-dianhua" style="font-size: 14px; color: #007AFF;"></span>
									<text>{{part.text}}</text>
								</span>
								<text v-else>{{part.text}}</text>
							</template>
						</view>
						<view class="info">
							<text class="time">{{formatTime(item.create_time)}}</text>
							<text class="views">{{item.look_count || 0}}次浏览</text>
						</view>
					</view>
				</view>
			</view>
		</view>
		
		<!-- 加载状态 -->
		<view class="load-more-wrapper">
			<uni-load-more 
				:status="isLoadingMore ? 'loading' : loadMoreStatus"
				:contentText="{
					contentdown: '上拉加载更多',
					contentrefresh: '加载中...',
					contentnomore: cate_id ? '没有更多同城文章了' : '没有更多文章了'
				}"
				iconType="auto"
				color="#cccccc"
			/>
		</view>
	</view>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import formatTime from '@/utils/formatTime.js'
import { addListImageParams, fixImageUrl, getDefaultImage } from '@/utils/domainConfig.js'
import { previewImages as previewImagesUtil } from '@/utils/imagePreview.js'
import { testLogin } from '@/utils/isLogin.js'

// 定义组件的props
const props = defineProps({
	// 当前文章ID
	currentArticleId: {
		type: String,
		required: true
	},
	// 分类ID
	cate_id: {
		type: String,
		default: ''
	}
})

// 定义事件
const emit = defineEmits(['click'])

// 状态变量
const articles = ref([])
const pageNo = ref(1)
const pageSize = ref(8)
const isLoadingMore = ref(false)
const loadMoreStatus = ref('more')
const articleApi = uniCloud.importObject('articleWx', { customUI: true })
const cateApi = uniCloud.importObject('cateWx', { customUI: true })

// 获取分类名称
const getCategoryName = async (cateId) => {
	try {
		if (!cateId) return '未分类'
		const res = await cateApi.get(cateId)
		return res.data && res.data[0] ? res.data[0].cate_name : '未分类'
	} catch (err) {
		console.error('获取分类名称失败:', err)
		return '未分类'
	}
}

// 获取分类图片
const getCategoryImage = async (cateId) => {
	try {
		if (!cateId) return '/static/images/default.png'
		const res = await cateApi.get(cateId)
		return res.data && res.data[0] && res.data[0].cate_img ? res.data[0].cate_img : '/static/images/default.png'
	} catch (err) {
		console.error('获取分类图片失败:', err)
		return '/static/images/default.png'
	}
}

// 获取更多文章
const getMoreArticles = async (refresh = false) => {
	try {
		if (refresh) {
			pageNo.value = 1
			loadMoreStatus.value = 'loading'
		}
		
		isLoadingMore.value = true
		
		// 使用分类ID获取相关文章
		const res = await articleApi.getArticle(
			props.cate_id || '01', // 如果没有分类ID，则获取最新文章
			pageNo.value, 
			pageSize.value
		)
		
		if (res.code === 0 && res.data) {
			// 过滤掉当前文章
			const filteredData = res.data.filter(item => item._id !== props.currentArticleId)
			
			// 为每篇文章获取分类名称和分类图片
			const articlesWithCategory = await Promise.all(
				filteredData.map(async (article) => {
					if (!article.cate_name) {
						article.cate_name = await getCategoryName(article.cate_id)
					}
					
					// 如果文章没有图片，获取分类图片作为默认图片
					if (!article.images || article.images.length === 0) {
						const categoryImage = await getCategoryImage(article.cate_id)
						// 使用addListImageParams处理分类图片的域名问题并添加宽度限制
						article.category_image = addListImageParams(categoryImage)
					}
					
					return article
				})
			)
			
			// 更新文章列表
			if (refresh || pageNo.value === 1) {
				articles.value = articlesWithCategory
			} else {
				articles.value = [...articles.value, ...articlesWithCategory]
			}
			
			// 设置加载状态
			if (filteredData.length === 0) {
				loadMoreStatus.value = 'noMore'
			} else if (filteredData.length < pageSize.value && pageNo.value > 1) {
				loadMoreStatus.value = 'noMore'
			} else {
				loadMoreStatus.value = 'more'
			}
		} else {
			throw new Error(res.message || '获取更多文章失败')
		}
	} catch (err) {
		console.error('获取更多文章失败:', err)
		loadMoreStatus.value = 'more'
	} finally {
		isLoadingMore.value = false
	}
}

// 加载更多文章
const loadMore = async () => {
	if (isLoadingMore.value || loadMoreStatus.value === 'noMore') return
	
	pageNo.value++
	await getMoreArticles(false)
}

// 处理文章点击
const handleArticleClick = (articleId) => {
	emit('click', articleId)
}

// 获取处理后的图片URL - 统一使用compressedURL
const getProcessedImageUrl = (item) => {
	if (item.images && item.images.length > 0) {
		const imageUrl = item.images[0].compressedURL
		
		if (!imageUrl) {
			console.warn('文章图片URL为空:', item._id);
			return getDefaultImage('default');
		}
		
		// 先修复URL（HTTP转HTTPS、清理错误参数）
		const fixedUrl = fixImageUrl(imageUrl);
		
		// 如果URL已经包含处理参数，直接返回，不再添加
		if (fixedUrl.includes('?imageMogr2') || fixedUrl.includes('?imageView2')) {
			console.log('图片URL已包含处理参数，直接使用:', fixedUrl);
			return fixedUrl;
		}
		
		// 如果没有参数，添加750px宽度限制
		return addListImageParams(fixedUrl);
	}
	
	// 使用分类图片或默认图片
	if (item.category_image) {
		const fixedCategoryImg = fixImageUrl(item.category_image);
		if (fixedCategoryImg.includes('?imageMogr2') || fixedCategoryImg.includes('?imageView2')) {
			return fixedCategoryImg;
		}
		return addListImageParams(fixedCategoryImg);
	}
	
	return getDefaultImage('default');
}

// 处理图片加载错误
const handleImageError = (e) => {
	console.warn('图片加载失败，使用默认图片:', e)
	
	// 获取失败的图片元素
	const target = e.target || e.detail
	if (target && target.src) {
		// 替换为默认图片
		target.src = getDefaultImage('default')
		console.log('已替换为默认图片:', getDefaultImage('default'))
	}
}

// 解析内容，将电话号码分离出来
const parseContentWithPhone = (content) => {
	if (!content) return [{ text: '', isPhone: false }]
	
	const phoneRegex = /(?:\+?86[-\s]*)?(?:1[3-9]\d{9}|0\d{2,3}[-\s]*\d{7,8}|\d{3,4}[-\s]*\d{3,4}[-\s]*\d{3,4})/g
	const parts = []
	let lastIndex = 0
	let match
	
	while ((match = phoneRegex.exec(content)) !== null) {
		const phone = match[0]
		const cleanPhone = phone.replace(/[-\s]/g, '')
		
		if (isValidPhoneNumber(cleanPhone)) {
			// 添加电话前的文本
			if (match.index > lastIndex) {
				parts.push({
					text: content.substring(lastIndex, match.index),
					isPhone: false
				})
			}
			
			// 添加电话号码
			parts.push({
				text: cleanPhone,
				isPhone: true
			})
			
			lastIndex = match.index + match[0].length
		}
	}
	
	// 添加最后一部分文本
	if (lastIndex < content.length) {
		parts.push({
			text: content.substring(lastIndex),
			isPhone: false
		})
	}
	
	// 如果没有电话号码，返回原文本
	if (parts.length === 0) {
		return [{ text: content, isPhone: false }]
	}
	
	return parts
}

// 电话号码识别函数
const extractPhoneNumber = (content) => {
	if (!content) return null
	
	// 匹配多种电话号码格式
	const phoneRegex = /(?:(?:\+?86[-\s]*)?(?:1[3-9]\d{9})|(?:0\d{2,3}[-\s]*\d{7,8})|(?:\d{3,4}[-\s]*\d{3,4}[-\s]*\d{3,4}))/g
	const matches = content.match(phoneRegex)
	
	// 返回第一个匹配的电话号码
	if (matches && matches.length > 0) {
		// 格式化电话号码，去除空格和连字符
		const cleanPhone = matches[0].replace(/[-\s]/g, '')
		// 验证是否是有效的电话号码
		if (isValidPhoneNumber(cleanPhone)) {
			return cleanPhone
		}
	}
	
	return null
}

// 验证电话号码有效性
const isValidPhoneNumber = (phone) => {
	if (!phone) return false
	
	// 手机号验证（11位，1开头）
	const mobileRegex = /^1[3-9]\d{9}$/
	// 座机号验证（7-8位数字，可能带区号）
	const landlineRegex = /^(?:0\d{2,3})?\d{7,8}$/
	// 400电话等
	const serviceRegex = /^(?:400|800)\d{7,8}$/
	
	return mobileRegex.test(phone) || landlineRegex.test(phone) || serviceRegex.test(phone)
}

// 处理电话拨号
const handlePhoneCall = (phoneNumber) => {
	console.log('=== 开始拨号流程 ===');
	console.log('电话号码:', phoneNumber);
	
	// 检查登录状态
	const isLoggedIn = testLogin();
	console.log('登录检查结果:', isLoggedIn);
	
	if (!isLoggedIn) {
		console.log('用户未登录，终止拨号');
		return
	}
	
	console.log('用户已登录，继续拨号流程');
	
	if (!phoneNumber) {
		uni.showToast({
			title: '电话号码无效',
			icon: 'none'
		})
		return
	}
	
	// 格式化电话号码（确保没有特殊字符）
	const cleanPhone = phoneNumber.replace(/[^\d]/g, '')
	
	uni.showModal({
		title: '拨打电话',
		content: `是否拨打电话：${cleanPhone}`,
		success: (res) => {
			if (res.confirm) {
				// 拨打电话
				uni.makePhoneCall({
					phoneNumber: cleanPhone,
					success: () => {
						console.log('拨号成功')
					},
					fail: (err) => {
						console.error('拨号失败:', err)
						uni.showToast({
							title: '拨号失败',
							icon: 'none'
						})
					}
				})
			}
		}
	})
}

// 处理图片预览 - 使用新的页面跳转方式
const handleImagePreview = (images) => {
	if (!images || !images.length) return
	
	// 提取所有图片的URL，统一使用compressedURL
	const urls = images.map(img => {
		const imageUrl = img.compressedURL
		return fixImageUrl(imageUrl)
	})
	
	// 过滤掉无效的URL
	const validUrls = urls.filter(url => url && !url.includes('/static/images/'))
	
	if (validUrls.length === 0) {
		uni.showToast({
			title: '暂无可预览的图片',
			icon: 'none'
		})
		return
	}
	
	console.log('同城推荐预览图片URL:', validUrls)
	
	// 使用新的图片预览工具函数
	previewImagesUtil(validUrls, 0)
}

// 监听分类ID变化
watch(() => props.cate_id, (newVal, oldVal) => {
	if (newVal !== oldVal) {
		getMoreArticles(true)
	}
})

// 组件挂载时获取数据
onMounted(() => {
	getMoreArticles(true)
})

// 暴露方法给父组件
defineExpose({
	loadMore,
	refresh: () => getMoreArticles(true)
})
</script>

<style lang="scss" scoped>
.more-articles {
	margin-top: 32rpx;
	padding: 0 24rpx 120rpx 24rpx;
	background-color: #fff;
	
	.section-divider {
		height: 16rpx;
		background-color: #f5f5f5;
		margin: 0 -24rpx;
	}
	
	.section-title {
		font-size: 32rpx;
		font-weight: 500;
		color: #333;
		margin: 32rpx 0 16rpx;
	}
	
	.article-list {
		.article-item {
			padding: 24rpx;
			background: #fff;
			border-radius: 12rpx;
			margin-bottom: 24rpx;
			border-bottom: 1px solid #eee;
			min-height: 280rpx;
			
			&:last-child {
				border-bottom: none;
			}
			
			.article-content {
				display: flex;
				align-items: flex-start;
				height: 280rpx;
				position: relative;
				
				.image-wrapper {
					width: 260rpx;
					height: 260rpx;
					border-radius: 8rpx;
					overflow: hidden;
					flex-shrink: 0;
					margin-right: 24rpx;
					background-color: #f5f5f5;
					position: relative;
					
					// 添加加载动画效果
					&::before {
						content: '';
						position: absolute;
						top: 50%;
						left: 50%;
						transform: translate(-50%, -50%);
						width: 40rpx;
						height: 40rpx;
						border: 2px solid #ddd;
						border-top-color: #399bfe;
						border-radius: 50%;
						animation: loading 1s linear infinite;
						z-index: 1;
						opacity: 0;
						transition: opacity 0.3s ease;
					}
					
					.article-image {
						width: 100%;
						height: 100%;
						object-fit: cover;
						transition: transform 0.3s ease, opacity 0.3s ease;
						
						// 图片加载中时显示加载动画
						&:not([src]),
						&[src=""] {
							opacity: 0;
							
							+ .image-wrapper::before {
								opacity: 1;
							}
						}
						
						// 图片悬停效果
						&:hover {
							transform: scale(1.05);
						}
					}
					
					.image-counter {
						position: absolute;
						right: 8rpx;
						bottom: 8rpx;
						background-color: rgba(0, 0, 0, 0.6);
						color: #fff;
						padding: 4rpx 10rpx;
						border-radius: 12rpx;
						font-size: 20rpx;
						display: flex;
						align-items: center;
						z-index: 0;
						
						.counter-text {
							margin-left: 4rpx;
						}
					}
				}
				
				.text-content {
					flex: 1;
					display: flex;
					flex-direction: column;
					height: 90%;
					position: relative;
					
					.content-preview {
						// font-size: 26rpx;
						color: #666;
						line-height: 1.5;
						margin-bottom: 44rpx;
						display: -webkit-box;
						-webkit-box-orient: vertical;
						-webkit-line-clamp: 4;
						overflow: hidden;
						word-break: break-all;
						flex: 1;
						
						.category-name {
							color: #399bfe;
							font-weight: 500;
						}
						
						// 内嵌电话样式
						.phone-link {
							cursor: pointer;
							padding: 2rpx 4rpx;
							border-radius: 4rpx;
							display: inline-flex;
							align-items: center;
							gap: 4rpx;
							color: #007AFF;
							transition: all 0.2s ease;
							
							&:active {
								opacity: 0.6;
								transform: scale(0.95);
							}
						}
					}
					
					.info {
						position: absolute;
						bottom: 0;
						left: 0;
						right: 0;
						display: flex;
						align-items: center;
						font-size: 22rpx;
						color: #999;
						height: 32rpx;
						line-height: 32rpx;
						
						.time {
							margin-right: 24rpx;
						}
						
						.views {
							margin-right: 16rpx;
						}
					}
				}
			}
			
			// 移除点击特效动画
		}
	}
}

// 添加加载动画关键帧
@keyframes loading {
	0% {
		transform: translate(-50%, -50%) rotate(0deg);
	}
	100% {
		transform: translate(-50%, -50%) rotate(360deg);
	}
}

.load-more-wrapper {
	padding: 20rpx 0;
	display: flex;
	justify-content: center;
	align-items: center;
}
</style>