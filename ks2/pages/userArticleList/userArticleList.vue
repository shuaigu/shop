<script setup>
	import { computed, onMounted, ref, onUnmounted } from 'vue'
	import { useUserInfoStore } from '@/store/user.js'
	import { testLogin } from '@/utils/isLogin'
	import { onReachBottom, onPullDownRefresh } from '@dcloudio/uni-app'

	const props = defineProps( {
		userId: String
	} )

	const userStore = useUserInfoStore( )

	// 发帖总数
	const articleTotal = computed( ( ) => {
		return userArticleData.value.length
	} )

	// 总点赞
	const likesTotal = computed( ( ) => {
		let likeArray = userArticleData.value.map( item => item.like_count ) || [ ]
		return likeArray.reduce( ( sum, item ) => sum + item, 0 )
	} )

	// 文章api
	const articleApi = uniCloud.importObject( 'articleKs', { customUI: true } )
	const pageNo = ref( 1 )
	const pageSize = ref( 8 )
	// 获取用户信息和文章列表
	const userArticleData = ref( [ ] )
	const userArticleInfo = ref( {} )
	// 添加加载状态变量
	const isLoading = ref(true)

	const getArticelList = async (refresh = false) => {
		try {
			isLoading.value = true
			const res = await articleApi.getArticleList(props.userId, pageNo.value, pageSize.value)
			console.log(res)
			
			if (refresh || pageNo.value === 1) {
				userArticleData.value = res.data
			} else {
				userArticleData.value = [...userArticleData.value, ...res.data]
			}
			
			userArticleInfo.value = res.userInfo
			
			// 根据数据情况设置状态
			if (res.data.length < pageSize.value) {
				status.value = 'noMore'
			} else {
				status.value = 'more'
			}
		} catch (err) {
			console.error('获取文章列表失败:', err)
			uni.showToast({
				title: '加载失败，请重试',
				icon: 'none'
			})
			status.value = 'more'
		} finally {
			isLoading.value = false
			if (refresh) {
				uni.stopPullDownRefresh()
			}
		}
	}

	// 监听下拉刷新
	onPullDownRefresh(async () => {
		pageNo.value = 1
		await getArticelList(true)
	})

	// 处理删除
	const handleDelete = async (article_id) => {
		try {
			// 显示加载提示
			uni.showLoading({ title: '删除中...', mask: true })
			
			// 调用云函数删除文章
			const res = await articleApi.del(article_id, userStore.userInfo.uid)

			// 删除成功后的处理
			if (res.deleted) {
				uni.hideLoading()
				uni.showToast({ title: '删除成功', icon: 'success' })
				// 直接从列表中移除被删除的文章
				userArticleData.value = userArticleData.value.filter(item => item._id !== article_id)
			}
		} catch (err) {
			// 错误处理
			uni.hideLoading()
			uni.showToast({ title: err.message || '删除失败', icon: 'none' })
		}
	}

	// 图片预览
	const previewImage = (urls, current) => {
		uni.previewImage( {
			urls,
			current
		} )
	}

	// 处理联系方式
	const handleContact = ( ) => {
		if ( !userStore.userInfo.isLogin ) {
			return testLogin( )
		}

		if ( userArticleInfo.value.mobile === '未填写' ) {
			return uni.showToast( {
				icon: 'none',
				title: '他并不想让人联系'
			} )
		}
		uni.makePhoneCall( {
			phoneNumber: userArticleInfo.value.mobile
		} )
	}

	// 加载更多
	const status = ref( 'more' ) // 初始状态为 'more'
	// 文章列表触底时触发
	const scrolltolower = async () => {
		// 如果已经是 'noMore' 状态或正在加载，直接返回
		if (status.value === 'noMore' || isLoading.value) return

		// 设置为 'loading' 状态
		status.value = 'loading'
		
		// 加载更多数据
		pageNo.value++
		await getArticelList()
	}

	// 页面加载时获取数据
	onMounted( ( ) => {
		console.log( props.userId, '传递过来的id' )
		getArticelList( )
		// 开启平台原生页面分享
		uni.showShareMenu( {
			withShareTicket: true
		} )
		
		// 监听浏览量更新事件
		uni.$on('updateArticleLookCount', ({articleId, lookCount}) => {
			// 查找并更新对应文章的浏览量
			const article = userArticleData.value.find(item => item._id === articleId)
			if (article) {
				article.look_count = lookCount
			}
		})
	} )
	
	// 在组件卸载时移除事件监听
	onUnmounted(() => {
		uni.$off('updateArticleLookCount') // 移除浏览量更新事件监听
	})

	// 开启平台原生页面分享
	uni.showShareMenu( {
		withShareTicket: true
	} )
</script>

<template>
	<view class="userArticleList">
		<scroll-view @scrolltolower="scrolltolower" :scroll-y="true" class="scroll-view-article">
			<view class="content">
				<!-- 用户信息头部 -->
				<view class="head">
					<user-header @contact="handleContact" :articleTotal="articleTotal"
						:likesTotal="likesTotal" :userInfo="userArticleInfo"></user-header>
				</view>
				
				<!-- 加载动画 -->
				<view v-if="isLoading && userArticleData.length === 0" class="loading-container">
					<uni-load-more status="loading" iconType="snow"></uni-load-more>
				</view>
				
				<!-- 无数据提示 -->
				<view v-else-if="userArticleData.length === 0" class="empty-container">
					<image src="/static/images/logo.png" mode="aspectFit" class="empty-image"></image>
					<text class="empty-text">暂无数据</text>
				</view>
				
				<!-- 文章列表 -->
				<template v-else>
					<articleItem @preview="(url, urls) => previewImage(urls, url)" @contact="handleContact"
						@delete="handleDelete" v-for="item in userArticleData" :item="item" :key="item._id">
					</articleItem>
				</template>
				
				<!-- 加载更多 -->
				<uni-load-more v-if="userArticleData.length > 0" color="#cccccc" iconType="auto" :status="status" />
			</view>
		</scroll-view>
	</view>
</template>

<style lang="scss" scoped>
	.userArticleList {
		height: 100vh;
		background-color: $pyq-pages-bg-color;

		.content {
			padding-bottom: 32rpx;

			.head {
				margin-bottom: 32rpx;
			}
			
			/* 加载中样式 */
			.loading-container {
				display: flex;
				justify-content: center;
				align-items: center;
				padding: 100rpx 0;
				width: 100%;
			}
			
			/* 空数据样式 */
			.empty-container {
				display: flex;
				flex-direction: column;
				justify-content: center;
				align-items: center;
				padding: 100rpx 0;
				
				.empty-image {
					width: 200rpx;
					height: 200rpx;
					margin-bottom: 20rpx;
				}
				
				.empty-text {
					color: $pyq-text-color-placeholder;
					font-size: 28rpx;
				}
			}
		}
	}
</style>