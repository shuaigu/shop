<script setup>
	import { nextTick, onMounted, ref, onUnmounted } from 'vue';
	import { testLogin } from '@/utils/isLogin'
	import { useUserInfoStore } from '@/store/user.js'
	import { onPullDownRefresh } from '@dcloudio/uni-app'
	// 用户状态管理
	const userStore = useUserInfoStore( )
	const paging = ref( null )
	// 分类
	const cateList = ref( [ ] )
	const activeIndex = ref( 0 )
	const headList = [
		{ _id: '01', cate_name: '最新' },
		{ _id: '02', cate_name: '最热' }
	]
	// 分类api
	const cateApi = uniCloud.importObject( 'cateKs', { customUI: true } )
	// 文章api
	const articleApi = uniCloud.importObject( 'articleKs', { customUI: true } )
	// 导航api
	const daohangApi = uniCloud.importObject( 'daohang', { customUI: true } )

	// 添加加载状态变量
	const isLoading = ref(true)
	
	// 导航信息
	const navInfo = ref(null)
	const isNavLoading = ref(true)

	// 获取分类
	const cateListGet = async ( ) => {
		try {
			console.log('=== 开始获取分类 ===');
			const res = await cateApi.get( )
			console.log('分类获取成功:', res);
			
			if (!res || !res.data) {
				throw new Error('分类数据为空')
			}
			
			// 过滤掉隐藏的分类（is_visible为false的项），并记录隐藏的分类ID
			const hiddenCategoryIds = res.data.filter(item => item.is_visible === false).map(item => item._id)
			const visibleCategories = res.data.filter(item => item.is_visible !== false)
			cateList.value = [ ...headList, ...visibleCategories ]
			pageNo.value = 1
			console.log('开始获取文章列表...');
			await getArticleList( '01', pageNo.value, 8, hiddenCategoryIds )
		} catch (err) {
			console.error('=== 获取分类失败 ===', err);
			console.error('错误详情:', JSON.stringify(err));
			
			uni.showToast({
				title: '加载失败: ' + (err.message || err.errMsg || '网络错误'),
				icon: 'none',
				duration: 5000
			})
			
			// 即使失败也尝试加载默认分类
			cateList.value = headList
			await getArticleList( '01', 1, 8, [] )
		} finally {
			isLoading.value = false
		}
	}
	const pageNo = ref( 1 )
	// 切换分类
	const hanleHeadTab = ( index, id ) => {
		activeIndex.value = index
		pageNo.value = 1
		status.value = 'more'
		isLoading.value = true // 切换分类时显示加载状态
		
		// 获取当前隐藏的分类ID
		cateApi.get().then(res => {
			const hiddenCategoryIds = res.data.filter(item => item.is_visible === false).map(item => item._id)
			getArticleList(id, pageNo.value, 8, hiddenCategoryIds)
		}).catch(err => {
			console.error('获取分类失败:', err)
			getArticleList(id, pageNo.value, 8, [])
		})
	}
	// 初始文章数据
	const articleList = ref( [ ] )
	const currentCateId = ref( '01' )
	// 获取文章
	const getArticleList = async ( cate_id, pageNo = 1, pageSize = 8, hiddenCategoryIds = [] ) => {
		try {
			isLoading.value = true
			currentCateId.value = cate_id
			console.log('=== 开始获取文章 ===');
			console.log('分类ID:', cate_id, '页码:', pageNo);
			
			// 传递隐藏的分类ID数组
			const res = await articleApi.getArticle( cate_id, pageNo, pageSize, hiddenCategoryIds )
			console.log( '文章列表数据:', res )
			
			if (!res || !res.data) {
				throw new Error('文章数据为空')
			}
			
			articleList.value = res.data
			console.log('文章加载成功, 数量:', res.data.length);
		} catch ( err ) {
			console.error('=== 获取文章失败 ===', err);
			console.error('错误详情:', JSON.stringify(err));
			
			uni.showToast({
				title: '加载失败: ' + (err.message || err.errMsg || '网络错误'),
				icon: 'none',
				duration: 5000
			})
			
			articleList.value = []
		} finally {
			isLoading.value = false
		}
	}

	// 获取导航信息
	const getNavInfo = async () => {
		try {
			isNavLoading.value = true
			const res = await daohangApi.getNavInfo()
			if (res.code === 0) {
				navInfo.value = res.data
			} else {
				console.error('获取导航信息失败:', res.message)
			}
		} catch (err) {
			console.error('获取导航信息异常:', err)
		} finally {
			isNavLoading.value = false
		}
	}

	// 打开导航链接
	const openNavLink = async () => {
		try {
			// 检查用户是否已登录
			if (!userStore.userInfo.isLogin) {
				return testLogin() // 未登录时调用testLogin函数
			}

			// 直接从云对象获取导航信息
			const res = await daohangApi.getNavInfo()
			
			if (res.code === 0 && res.data && res.data.url) {
				// 小程序环境直接打开webview页面
				uni.navigateTo({
					url: `/pages/webview/webview?url=${encodeURIComponent(res.data.url)}`
				})
			}
		} catch (error) {
			console.error('打开链接失败', error)
		}
	}

	// 监听下拉刷新
	onPullDownRefresh( async ( ) => {
		pageNo.value = 1
		status.value = 'more'
		try {
			// 获取当前隐藏的分类ID
			const res = await cateApi.get()
			const hiddenCategoryIds = res.data.filter(item => item.is_visible === false).map(item => item._id)
			
			// 下拉刷新时，获取当前分类下的文章
			await getArticleList(currentCateId.value, pageNo.value, 8, hiddenCategoryIds)
			// 同时刷新导航信息
			await getNavInfo()
		} catch ( err ) {
			console.error( '下拉刷新失败:', err )
			uni.showToast( {
				title: '刷新失败，请重试',
				icon: 'none'
			} )
		} finally {
			// 无论成功或失败，都停止下拉刷新
			uni.stopPullDownRefresh( )
		}
	} )

	// 加载更多
	const status = ref( 'more' ) // 初始状态为 'more'

	// 文章列表触底时触发
	const scrolltolower = async ( ) => {
		// 如果已经是 'noMore' 状态，直接返回
		if ( status.value === 'noMore' ) return

		// 'loading' 状态
		status.value = 'loading'

		try {
			// 获取当前隐藏的分类ID
			const res = await cateApi.get()
			const hiddenCategoryIds = res.data.filter(item => item.is_visible === false).map(item => item._id)
			
			// 加载更多数据
			pageNo.value++
			const articleRes = await articleApi.getArticle(currentCateId.value, pageNo.value, 8, hiddenCategoryIds)

			// 拼接新老数据
			articleList.value = [ ...articleList.value, ...articleRes.data ]

			// 根据数据情况设置状态
			if ( articleRes.data.length > 0 ) {
				status.value = 'more' // 还有更多数据
			} else {
				status.value = 'noMore' // 没有更多数据了
			}
		} catch ( err ) {
			console.error( '加载更多失败:', err )
			uni.showToast( {
				title: '加载失败，请重试',
				icon: 'none'
			} )
			status.value = 'more' // 失败时恢复为 'more' 状态
		}
	}

	// 处理删除
	const handleDelete = async (articleId) => {
		try {
			// 1. 显示加载提示
			uni.showLoading({ title: '删除中...', mask: true })
			
			// 2. 调用云函数删除文章
			const res = await articleApi.del(articleId, userStore.userInfo.uid)

			// 3. 删除成功后的处理
			if (res.deleted) {
				uni.hideLoading()
				uni.showToast({ title: '删除成功', icon: 'success' })
				// 4. 直接从列表中移除被删除的文章
				articleList.value = articleList.value.filter(item => item._id !== articleId)
			}
		} catch (err) {
			// 5. 错误处理
			uni.hideLoading()
			uni.showToast({ title: err.message || '删除失败', icon: 'none' })
		}
	}

	// 联系电话
	const handelContact = ( mobile ) => {
		console.log( mobile )
		if ( !userStore.userInfo.isLogin ) {
			return testLogin( )
		}

		if ( mobile === '未填写' ) {
			return uni.showToast( {
				icon: 'none',
				title: '他并不想让人联系'
			} )
		}

		uni.makePhoneCall( {
			phoneNumber: mobile
		} )
	}

	// 发布
	const handleAdd = ( ) => {
		if ( !userStore.userInfo.isLogin ) {
			return testLogin( )
		}
		uni.navigateTo( {
			url: "/pages/article/articleAdd"
		} )
	}

	// 跳转用户列表
	const handelGoUserList = (user_id) => {
		uni.navigateTo({
			url: `/pages/userArticleList/userArticleList?userId=${user_id}`
		})
	}

	// 优化预加载函数
	const preloadArticleDetail = (articleId) => {
		// 使用setTimeout确保预加载不阻塞主线程
		setTimeout(() => {
			try {
				// 预加载文章详情数据
				const articleCloud = uniCloud.importObject('articleKs', {
					customUI: true  // 禁用默认UI
				})
				
				// 预加载文章详情和评论数据
				Promise.all([
					articleCloud.getArticleDetal(articleId),
					uniCloud.importObject('commentList', { customUI: true }).getCommentList(articleId)
				]).catch(err => {
					// 静默失败，不影响用户体验
					console.warn('文章预加载失败:', err)
				})
			} catch (err) {
				console.warn('预加载初始化失败:', err)
			}
		}, 200) // 延迟200ms执行，避免与其他操作竞争资源
	}

	// 修改 articleItem 组件,添加 hover 时预加载
	const handleItemHover = (articleId) => {
		preloadArticleDetail(articleId)
	}

	// 修改跳转到文章详情页的函数
	const navigateToArticleDetail = (articleId) => {
		if (!articleId) {
			uni.showToast({
				title: '文章ID不能为空',
				icon: 'none'
			})
			return
		}

		// 添加过渡动画设置
		uni.navigateTo({
			url: `/pages/article/articleDetail?article_id=${articleId}`,
			animationType: 'slide-in-right',
			animationDuration: 300
		})
	}

	// 页面加载完毕
	onMounted( ( ) => {
		console.log('=== 页面开始加载 ===');
		
		// 输出环境信息
		try {
			const systemInfo = uni.getSystemInfoSync();
			console.log('系统信息:', systemInfo);
			console.log('uniCloud 配置:', uniCloud.config);
		} catch(e) {
			console.error('获取系统信息失败:', e);
		}
		
		// 测试云函数连接
		console.log('cateApi:', cateApi);
		console.log('articleApi:', articleApi);
		
		cateListGet( )
		// 获取导航信息
		getNavInfo()
		// 开启平台原生页面分享
		uni.showShareMenu( {
			withShareTicket: true
		} )
		
		// 监听文章添加事件
		uni.$on('articleAdded', ({cateId}) => {
			pageNo.value = 1
			articleList.value = []
			getArticleList(cateId)
		})
		
		// 监听浏览量更新事件
		uni.$on('updateArticleLookCount', ({articleId, lookCount}) => {
			// 查找并更新对应文章的浏览量
			const article = articleList.value.find(item => item._id === articleId)
			if (article) {
				article.look_count = lookCount
			}
		})
		
		// 监听导航条显示状态更新事件
		uni.$on('updateNavVisibility', ({isVisible, navInfo: updatedNavInfo}) => {
			console.log('收到导航条状态更新:', isVisible);
			if (navInfo.value) {
				navInfo.value.isVisible = isVisible;
				// 如果有其他导航信息也一并更新
				if (updatedNavInfo) {
					if (updatedNavInfo.title) navInfo.value.title = updatedNavInfo.title;
					if (updatedNavInfo.url) navInfo.value.url = updatedNavInfo.url;
				}
			}
		});
		
		// 监听分类可见性变化事件
		uni.$on('categoryVisibilityChanged', async (data) => {
			console.log('收到分类可见性变化事件，开始刷新数据', data);
			
			try {
				// 使用事件中传递的数据，如果有的话
				let hiddenCategoryIds = [];
				let allCategories = [];
				
				if (data && data.hiddenCategoryIds) {
					// 使用事件中传递的隐藏分类ID
					hiddenCategoryIds = data.hiddenCategoryIds;
				} else {
					// 否则重新获取分类列表
					const res = await cateApi.get();
					hiddenCategoryIds = res.data.filter(item => item.is_visible === false).map(item => item._id);
					allCategories = res.data;
				}
				
				if (data && data.allCategories) {
					allCategories = data.allCategories;
				} else if (!allCategories.length) {
					// 如果没有从事件获取且还没有获取过
					const res = await cateApi.get();
					allCategories = res.data;
				}
				
				// 过滤掉隐藏的分类
				const visibleCategories = allCategories.filter(item => item.is_visible !== false);
				cateList.value = [ ...headList, ...visibleCategories ];
				
				// 检查当前选中的分类是否还可见
				if (activeIndex.value >= 2) { // 跳过"最新"和"最热"
					const currentCategoryId = cateList.value[activeIndex.value]?._id;
					if (!currentCategoryId) {
						// 如果当前选中的分类不再可见，切换到"最新"
						activeIndex.value = 0;
						currentCateId.value = '01';
					}
				}
				
				// 重新获取当前分类的文章
				pageNo.value = 1;
				await getArticleList(currentCateId.value, pageNo.value, 8, hiddenCategoryIds);
				
				console.log('分类可见性变更处理完成，当前显示分类:', cateList.value.length, '隐藏分类:', hiddenCategoryIds.length);
			} catch (error) {
				console.error('处理分类可见性变化事件失败:', error);
				uni.showToast({
					title: '刷新数据失败，请手动刷新',
					icon: 'none'
				});
			}
		});

		// 添加拦截器
		uniCloud.addInterceptor('callObject', {
			invoke(param) {
				// 不显示loading
				param.options = param.options || {}
				param.options.customUI = true
				return param
			}
		})
	} )

	// 在组件卸载时移除事件监听
	onUnmounted(() => {
		uni.$off('articleAdded')
		uni.$off('updateArticleLookCount') // 移除浏览量更新事件监听
		uni.$off('updateNavVisibility') // 移除导航条状态更新事件监听
		uni.$off('categoryVisibilityChanged') // 移除分类可见性变化事件监听
	})
</script>
<template>
	<view class="home">
		<!-- 顶部分类导航：横向滚动 -->
		<scroll-view :scroll-x="true" class="scroll-view">
			<view class="head">
				<view class="head-item" :class="{active: activeIndex === index}"
					v-for="(item, index) in cateList" :key="item._id" @click="hanleHeadTab(index, item._id)">
					{{ item.cate_name }}
				</view>
			</view>
		</scroll-view>

		<!-- 文章列表 -->
		<scroll-view @scrolltolower="scrolltolower" :scroll-y="true" class="scroll-view-article">
			<!-- 导航条 - 放在内容顶部随内容滚动 -->
			<view v-if="navInfo && navInfo.isVisible" class="nav-banner" @click="openNavLink">
				<text class="nav-text">{{ navInfo.title }}</text>
				<uni-icons type="right" size="16" color="#FFFFFF"></uni-icons>
			</view>
			
			<!-- 加载动画 -->
			<view v-if="isLoading" class="loading-container">
				<view class="custom-loading">
					<view class="loading-icon">
						<!-- 放置您的加载图标 -->
						<uni-icons type="spinner-cycle" size="24" color="#666666"></uni-icons>
					</view>
					<text class="loading-text" style="margin-left: 10rpx;">正在加载...</text>
				</view>
			</view>
			
			<!-- 无数据提示 -->
			<view v-else-if="articleList.length === 0" class="empty-container">
				<image src="/static/images/logo.png" mode="aspectFit" class="empty-image"></image>
				<text class="empty-text">暂无数据</text>
			</view>
			
			<!-- 文章列表内容 -->
			<template v-else>
				<articleItem 
					v-for="item in articleList" 
					:key="item._id" 
					:item="item"
					@mouseenter="handleItemHover(item._id)"
					@contact="handelContact"
					@userList="handelGoUserList" 
					@delete="handleDelete"
					@navigateToDetail="navigateToArticleDetail">
				</articleItem>
			</template>
			
			<!-- 加载更多 -->
			<view class="a1">
				<view v-if="!isLoading && articleList.length > 0" style="flex: 1;">
					<uni-load-more color="#666666" iconType="auto" :status="status" />
				</view>
			</view>
		</scroll-view>
	</view>
</template>

<style lang="scss" scoped>
	.home {
		display: flex;
		flex-direction: column;
		height: 100vh;
		background-color: #f7f7f7;

		/* 导航条样式 */
		.nav-banner {
			display: flex;
			align-items: center;
			justify-content: center;
			height: 70rpx;
			background: linear-gradient(to right, #FF9500, #FF5E3A);
			color: #FFFFFF;
			font-size: 28rpx;
			padding: 0 20rpx;
			
			.nav-text {
				margin-right: 10rpx;
			}
		}

		/* 顶部分类导航样式 */
		.scroll-view {
			width: 100%;
			height: 80rpx;
			line-height: 80rpx;
			white-space: nowrap;
			background-color: #fff;
			border-bottom: 1px solid $pyq-border-color-translucent;

			/* 分类列表容器 */
			.head {
				display: flex;
				align-items: center;

				/* 分类项样式 */
				.head-item {
					padding: 0 24rpx;
					margin-right: 8rpx;
					font-size: 28rpx;
					color: $pyq-text-color-placeholder;
				}

				/* 激活状态样式 */
				.active {
					font-size: 32rpx;
					color: $pyq-text-color-title;
					font-weight: bold;
				}
			}
		}

		/* 文章列表 */
		.scroll-view-article {
			display: flex;
			flex-direction: column;
			flex: 1;
			
			/* 加载中样式 */
			.loading-container {
				display: flex;
				justify-content: center;
				align-items: center;
				height: calc(100vh - 80rpx); /* 减去顶部导航的高度 */
				width: 100%;
				background-color: #f7f7f7;
				padding: 30rpx 10rpx; /* 上下添加边距 */
			}
			
			/* 自定义加载动画样式 */
			.custom-loading {
				display: flex;
				align-items: center; /* 确保垂直居中对齐 */
				justify-content: center;
				padding: 30rpx;
				background-color: rgba(255, 255, 255, 0.9);
				border-radius: 12rpx;
				box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.05);
				
				.loading-icon {
					display: flex; /* 确保图标容器是flex布局 */
					align-items: center; /* 确保图标垂直居中 */
					justify-content: center;
					animation: rotate 1.5s linear infinite;
				}
				
				.loading-text {
					color: #666666;
					font-size: 28rpx;
					line-height: 1; /* 调整文字行高 */
					display: flex;
					align-items: center; /* 确保文字垂直居中 */
				}
				
				@keyframes rotate {
					from { transform: rotate(0deg); }
					to { transform: rotate(360deg); }
				}
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
			
			.a1{
				height: 200rpx;
				padding: 20rpx 0;
			}
		}
	}

	/* 对uni-load-more组件样式的调整 */
	:deep(.uni-load-more) {
		align-items: center; /* 确保子元素垂直居中 */
	}

	:deep(.uni-load-more__text) {
		margin-left: 8rpx; /* 增加文字与图标的距离，默认是8px */
		line-height: 1; /* 调整文字行高 */
	}

	:deep(.uni-load-more__img) {
		display: flex;
		align-items: center;
		justify-content: center;
	}
</style>