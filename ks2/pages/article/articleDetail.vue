<script setup>
	import { computed, onMounted, ref, watch, onUnmounted, onBeforeUnmount, onActivated, nextTick } from 'vue'
	import { useUserInfoStore } from '@/store/user.js'
	import formatTime from '@/utils/formatTime.js'
	import { testLogin } from '@/utils/isLogin'
	import { onReachBottom } from '@dcloudio/uni-app'
	// 导入推荐组件
	import tuijian from '@/components/tuijian/tuijian.vue'
	// 导入幸运用户横幅组件
	import LuckyUserBanner from '@/components/lucky-user/lucky-user-banner.vue'
	// 导入自定义图片预览组件
	import Tuouanyulan from '@/components/tuouanyulan/tuouanyulan.vue'
	// 导入点赞组件
	import Dianzan from '@/components/dianzan/dianzan.vue'
	// 接受传递过来的数据
	const props = defineProps( {
		article_id: String,
		user_id: String
	} )

	// 处理页面跳转逻辑
	const handlePageNavigation = async () => {
		try {
			// 获取当前页面栈
			const pages = getCurrentPages()
			
			// 如果是直接进入详情页（页面栈长度为1）
			if (pages.length === 1) {
				// 先跳转到首页
				uni.switchTab({
					url: '/pages/index/index',
					success: () => {
						// 首页加载完成后，再跳转回文章详情页
						setTimeout(() => {
							uni.navigateTo({
								url: `/pages/article/articleDetail?article_id=${props.article_id}`,
								fail: (err) => {
									console.error('跳转回文章详情页失败:', err)
								}
							})
						}, 500) // 给首页一些加载时间
					},
					fail: (err) => {
						console.error('跳转到首页失败:', err)
						// 如果跳转失败，仍然尝试加载首页数据
						try {
							const cateApi = uniCloud.importObject('cateKs', { customUI: true })
							cateApi.get().catch(err => {
								console.warn('预加载首页数据失败', err)
							})
						} catch (err) {
							console.warn('初始化首页数据失败', err)
						}
					}
				})
				return true // 返回 true 表示需要跳转
			}

			return false // 返回 false 表示无需跳转
		} catch (err) {
			console.error('页面导航错误：', err)
			return false
		}
	}
	// 添加一个加载状态标记
	const isLoading = ref( true )
	const isSubmitting = ref( false )
	const commentContent = ref( '' )
	// 添加评论加载状态变量
	const isCommentsLoading = ref( true )
	const userStore = useUserInfoStore( )
	const articleApi = uniCloud.importObject( 'articleKs', { customUI: true } )
	const commentApi = uniCloud.importObject( 'commentList', { customUI: true } )
	const likeApi = uniCloud.importObject( 'likeRecord', { customUI: true } )
	const loginApi = uniCloud.importObject('login', { customUI: true })

	// 文章详情
	const articleDetail = ref( {} )
	const articleComment = ref( [ ] )

	// 总评论数
	const commentCount = computed( ( ) => {
		return articleComment.value.length
	} )

	// 增加一个标志位，避免重复登录检查
	const isCheckingLogin = ref(false)

	// 添加当前图片索引的状态
	const currentImageIndex = ref(0)

	// 添加视频预加载状态
	const isVideoPreloaded = ref(false)
	const isVideoLoading = ref(true)

	// 添加图片懒加载状态跟踪
	const imageLoadStatus = ref({})
	const isAnyImageLoading = ref(true)
	
	// 新增导航信息
	const navInfo = ref(null)

	// 添加推荐组件的ref
	const tuijianRef = ref(null)

	// 在script setup顶部添加ref引用
	const likeButtonTop = ref(null)
	const likeButtonBottom = ref(null)
	const isLikeAnimating = ref(false)

	// 在script setup部分添加新的状态变量
	const isSwiperAutoplay = ref(true)
	const swiperInterval = ref(1000) // 添加轮播间隔时间变量

	// 添加预览图片相关的状态
	const previewVisible = ref(false);
	const previewImages = ref([]);
	const previewCurrent = ref(0);

	// 添加视频相关状态
	const videoContext = ref(null)
	const videoLoadStatus = ref('loading')
	const isPlaying = ref(true)

	// 获取文章详情
	const getArticleDetail = async () => {
		try {
			// 先检查是否需要处理页面导航
			const needRedirect = await handlePageNavigation()
			if (needRedirect) {
				return // 如果需要重定向，直接返回
			}

			// 检查文章ID是否存在
			if (!props.article_id) {
				throw new Error('文章ID不能为空')
			}

			const res = await articleApi.getArticleDetal(
				props.article_id, 
				userStore.userInfo?.uid || null
			)
			
			// 检查返回的数据结构
			if (!res || !res.articleRes || !res.articleRes.data || !Array.isArray(res.articleRes.data)) {
				throw new Error('获取文章详情失败：返回数据格式错误')
			}

			// 更新文章详情
			const articleData = res.articleRes.data[0]
			
			// 确保文章内容不为空
			if (!articleData.content) {
				articleData.content = '暂无内容'
			}
			
			// 处理视频URL
			if (articleData.video && articleData.video.url) {
				// 确保视频使用 compressedURL
				if (!articleData.video.compressedURL) {
					articleData.video.compressedURL = articleData.video.url.startsWith('http') 
						? articleData.video.url 
						: `https://aly2.jingle0350.cn${articleData.video.url}`
				}
				
				articleData.videoURL = articleData.video.compressedURL || articleData.video.url;
				videoLoadStatus.value = 'loading';
			}

			// 初始化点赞状态
			isLiked.value = articleData.is_liked || false
			likeCount.value = articleData.like_count || 0
			console.log('初始化点赞状态:', {
				isLiked: isLiked.value,
				likeCount: likeCount.value,
				articleData_is_liked: articleData.is_liked,
				userId: userStore.userInfo?.uid
			})

			// 获取分类名称
			if (articleData.cate_id) {
				try {
					const cateApi = uniCloud.importObject('cateKs', { customUI: true })
					const cateRes = await cateApi.get(articleData.cate_id)
					if (cateRes.data && cateRes.data[0]) {
						articleData.cate_name = cateRes.data[0].cate_name
					}
				} catch (err) {
					console.error('获取分类名称失败:', err)
				}
			}
			
			// 添加用户信息处理
			if (articleData.user_id) {
				try {
					// 直接使用文章中已有的用户信息
					articleData.user = {
						nickName: articleData.user_nickName || '未知用户',
						avatarUrl: articleData.user_avatarUrl || '/static/images/default-avatar.png',
						mobile: articleData.user_mobile || '未填写'
					}
					console.log('使用文章中的用户信息:', articleData.user)
				} catch (err) {
					console.error('处理用户信息失败:', err)
					// 发生错误时使用默认值
					articleData.user = {
						nickName: '未知用户',
						avatarUrl: '/static/images/default-avatar.png',
						mobile: '未填写'
					}
				}
			}
			
			articleDetail.value = articleData
			articleComment.value = res.comment || []
			
			// 初始化图片加载状态
			if (articleData.images && articleData.images.length) {
				articleData.images.forEach((_, index) => {
					imageLoadStatus.value[index] = 'loading';
				});
				isAnyImageLoading.value = true;
			} else {
				isAnyImageLoading.value = false;
			}
			
			// 获取评论区显示状态
			try {
				// 从后台获取评论区显示状态
				const configApi = uniCloud.importObject('config', { customUI: true })
				const configRes = await configApi.getConfig('commentDisplay')
				
				// 设置评论区显示状态
				navInfo.value = {
					isVisible: configRes?.data?.isVisible ?? true, // 默认显示
					title: '评论区'
				}
			} catch (err) {
				console.error('获取评论区显示状态失败:', err)
				// 默认显示评论区
				navInfo.value = {
					isVisible: true,
					title: '评论区'
				}
			}

			// 处理视频资源
			if (articleData.videoURL) {
				articleData.videoURL = processMediaURL(articleData.videoURL, 'video');
				videoLoadStatus.value = 'loading';
			}

			// 获取视频播放器上下文
			if (articleDetail.value.videoURL) {
				setTimeout(() => {
					videoContext.value = uni.createVideoContext('articleVideo');
				}, 300);
			}

		} catch (err) {
			console.error('获取文章详情失败：', err)
			uni.showToast({
				title: '获取文章详情失败',
				icon: 'none'
			})
		}
	}

	// 获取评论列表
	const getCommentList = async () => {
		try {
			// 检查文章ID是否存在
			if (!props.article_id) {
				throw new Error('文章ID不能为空')
			}

			// 获取评论列表
			const result = await commentApi.getCommentList(props.article_id)
			
			// 检查返回的数据结构
			if (!result || result.code !== 0 || !Array.isArray(result.data)) {
				throw new Error(result.message || '获取评论列表失败')
			}

			// 获取文章详情以获取点赞信息
			const articleDetail = await articleApi.getArticleDetal(props.article_id)
			const commentLikes = articleDetail.articleRes.data[0]?.comment_likes || []

			// 处理评论数据，添加点赞信息
			const processedComments = result.data.map(comment => ({
				...comment,
				isLiked: commentLikes.some(like => 
					like.comment_id === comment._id && 
					like.user_id === userStore.userInfo.uid
				),
				likeCount: commentLikes.filter(like => 
					like.comment_id === comment._id
				).length,
				formatted_time: formatTime(comment.create_time)
			}))

			// 更新评论列表
			articleComment.value = processedComments
			// 按时间倒序排序
			articleComment.value.sort((a, b) => b.create_time - a.create_time)

		} catch (err) {
			console.error('获取评论列表失败:', err)
			uni.showToast({
				title: '获取评论列表失败',
				icon: 'none',
				duration: 2000
			})
		}
	}

	// 监听评论数量变化
	watch(() => articleComment.value.length, (newCount, oldCount) => {
		console.log('评论数量变化:', {
			oldCount,
			newCount
		})
	})

	// 提交评论
	const commentSubmit = async () => {
		if (isSubmitting.value) {
			console.log('[前端] 评论提交中，请勿重复提交')
			return
		}

		try {
			// 检查用户信息是否完整
			if (!userStore.userInfo.uid || !userStore.userInfo.nickName) {
				throw new Error('用户信息不完整，请重新登录')
			}

			const content = commentContent.value.trim()
			if (!content) {
				console.log('[前端] 评论内容为空')
				return uni.showToast({
					title: '评论内容不能为空',
					icon: 'none',
					duration: 2000
				})
			}

			console.log('[前端] 开始提交评论')
			isSubmitting.value = true

			// 显示加载提示
			uni.showLoading({
				title: '提交中...',
				mask: true
			})

			// 构建评论数据
			const commentData = {
				article_id: articleDetail.value._id,
				user_id: userStore.userInfo.uid,
				content: content,
				nickName: userStore.userInfo.nickName || '匿名用户',
				avatarUrl: userStore.userInfo.avatarUrl || ''
			}
			console.log('[前端] 评论数据:', commentData)

			// 提交评论
			const result = await commentApi.addComment(commentData)
			console.log('[前端] 评论提交结果:', result)

			if (result.code === 0) {
				console.log('[前端] 评论成功')
				// 清空评论内容
				commentContent.value = ''
				// 刷新评论列表
				await getCommentList()
				uni.showToast({
					title: '评论成功',
					icon: 'success',
					duration: 2000
				})
			} else {
				throw new Error(result.message || '评论失败')
			}
		} catch (err) {
			console.error('[前端] 评论失败:', {
				error: err,
				message: err.message,
				stack: err.stack
			})
			uni.showToast({
				title: err.message || '评论失败，请稍后重试',
				icon: 'none',
				duration: 2000
			})
		} finally {
			// 隐藏加载提示
			uni.hideLoading()
			isSubmitting.value = false
			console.log('[前端] 评论提交完成')
		}
	}

	// 处理删除评论
	const handelDelComment = async (commentId) => {
		try {
			const confirmRes = await uni.showModal({
				title: '提示',
				content: '确定要删除这条评论吗？',
				confirmText: '删除',
				confirmColor: '#ff0000'
			})
			
			if (!confirmRes.confirm) return

			uni.showLoading({
				title: '删除中...',
				mask: true
			})

			const result = await articleApi.deleteComment(commentId)
			
			if (result.code === 0) {
				await getCommentList()
				uni.showToast({
					title: '删除成功',
					icon: 'success'
				})
			} else {
				throw new Error(result.message || '删除失败')
			}
		} catch (err) {
			console.error('删除失败:', err)
			uni.showToast({
				title: typeof err === 'string' ? err : (err.message || '删除失败'),
				icon: 'none'
			})
		} finally {
			uni.hideLoading()
		}
	}

	// 发布评论按钮点击
	const handleCommentClick = async () => {
		try {
			// 检查登录状态
			const isLoggedIn = await customTestLogin()
			if (!isLoggedIn) {
				// customTestLogin 已经处理了登录跳转
				return
			}

			// 显示评论输入框
			uni.showModal({
				title: '发表评论',
				editable: true,
				placeholderText: '评论点什么...',
				success: (res) => {
					if (res.confirm && res.content.trim()) {
						commentContent.value = res.content.trim()
						setTimeout(() => {
							commentSubmit().catch(err => {
								console.error('评论提交失败:', err)
								uni.showToast({
									title: '评论失败，请重试',
									icon: 'none'
								})
							})
						}, 100)
					}
				}
			})
		} catch (err) {
			console.error('评论点击处理失败:', err)
			uni.showToast({
				title: '操作失败，请重试',
				icon: 'none'
			})
		}
	}

	// 跳转到首页
	const goToHome = ( ) => {
		uni.switchTab( {
			url: '/pages/index/index'
		} )
	}

	// 修改处理打电话的方法
	const handleCall = async () => {
		try {
			// 检查登录状态
			const isLoggedIn = await customTestLogin()
			if (!isLoggedIn) {
				// customTestLogin 已经处理了登录跳转
				return
			}

			// 如果没有就给与提示
			if (articleDetail.value.user_mobile === '未填写') {
				return uni.showToast({
					icon: 'none',
					title: '没有联系方式'
				})
			}

			// 如果有就拨打电话
			uni.makePhoneCall({
				phoneNumber: articleDetail.value.user_mobile,
				fail: (err) => {
					uni.showToast({
						title: '拨打电话失败',
						icon: 'none'
					})
				}
			})
		} catch (err) {
			console.error('拨打电话失败:', err)
			uni.showToast({
				title: '操作失败，请重试',
				icon: 'none'
			})
		}
	}

	// 修改 customTestLogin 方法
	const customTestLogin = async () => {
		if (isCheckingLogin.value) return false
		isCheckingLogin.value = true

		try {
			// 如果已登录，直接返回true
			if (userStore.userInfo.uid) {
				return true
			}
			
			// 使用云对象方式调用
			const res = await loginApi.login()
			
			if (res.code === 0) {
				userStore.setUserInfo(res.data)
				return true
			}

			// 如果登录失败，跳转到登录页
			const currentRoute = `/pages/article/articleDetail?article_id=${props.article_id}`
			const redirectUrl = encodeURIComponent(currentRoute)
			uni.redirectTo({  // 改用 redirectTo 替代 navigateTo
				url: `/pages/login/login?redirect=${redirectUrl}`
			})
			return false
		} catch (err) {
			console.error('登录检查失败:', err)
			// 发生错误时也跳转到登录页
			const currentRoute = `/pages/article/articleDetail?article_id=${props.article_id}`
			const redirectUrl = encodeURIComponent(currentRoute)
			uni.redirectTo({  // 改用 redirectTo 替代 navigateTo
				url: `/pages/login/login?redirect=${redirectUrl}`
			})
			return false
		} finally {
			uni.hideLoading()
			isCheckingLogin.value = false
		}
	}

	// 添加一个方法来更新浏览量
	const updatePageView = async () => {
		try {
			if (!articleDetail.value._id) return
			
			// 记录浏览开始时间
			viewStartTime.value = Date.now()
			
			// 准备浏览者信息
			const viewerInfo = {
				user_id: userStore.userInfo.uid || `guest_${Date.now()}`,
				user_nickName: userStore.userInfo.nickName || '访客',
				user_avatarUrl: userStore.userInfo.avatarUrl || '/static/images/touxiang.png',
				view_source: 'direct',
				actual_view_duration: 0
			}
			
			const result = await articleApi.updateLookCount(articleDetail.value._id, viewerInfo)
			if (result.code === 0) {
				// 更新本地浏览量显示
				articleDetail.value.look_count = result.data.look_count
				console.log('浏览量更新成功')
				
				// 立即发送事件通知其他页面更新浏览量
				uni.$emit('updateArticleLookCount', {
					articleId: articleDetail.value._id,
					lookCount: articleDetail.value.look_count
				})
			}
		} catch (err) {
			console.error('更新浏览量失败:', err)
		}
	}

	// 修改页面加载逻辑
	onMounted(async () => {
		try {
			// 设置页面切换动画
			uni.pageScrollTo({
				scrollTop: 0,
				duration: 0
			});
			
			// 初始化加载状态
			isLoading.value = true
			isCommentsLoading.value = true
			
			// 从当前页面获取参数
			const pages = getCurrentPages()
			const currentPage = pages[pages.length - 1]
			const options = currentPage.$page?.options || {}
			
			// 使用当前页面的 options 获取 article_id
			const articleId = options.article_id || props.article_id
			
			if (!articleId) {
				throw new Error('文章ID不能为空')
			}

			// 先获取文章详情，让用户尽快看到内容
			await getArticleDetail()
			
			// 文章详情加载完成后，就可以显示页面了
			isLoading.value = false
			
			// 后台加载评论和更新浏览量，不阻塞UI显示
			getCommentList().catch(err => {
				console.error('获取评论失败:', err)
			}).finally(() => {
				isCommentsLoading.value = false
			})
			
			updatePageView().catch(err => {
				console.error('更新浏览量失败:', err)
			})

		} catch (err) {
			console.error('页面初始化失败:', err)
			uni.showToast({
				title: '加载失败，请重试',
				icon: 'none'
			})
			// 如果获取文章ID失败，返回上一页
			setTimeout(() => {
				uni.navigateBack()
			}, 1500)
		} finally {
			// 确保在任何情况下都设置加载状态为false
			isLoading.value = false
			isCommentsLoading.value = false
		}
		
		// 开启平台原生页面分享
		uni.showShareMenu({
			withShareTicket: true
		})

		// 延迟创建视频上下文
		setTimeout(() => {
			if (articleDetail.value && articleDetail.value.videoURL) {
				videoContext.value = uni.createVideoContext('articleVideo');
			}
		}, 500);
		
		// 监听评论区显示状态变化
		uni.$on('updateCommentVisibility', (data) => {
			if (navInfo.value) {
				navInfo.value.isVisible = data.isVisible;
			} else {
				navInfo.value = {
					isVisible: data.isVisible,
					title: '评论区'
				};
			}
		});
	})

	// 定期刷新评论列表（可选）
	let commentRefreshTimer
	onMounted(() => {
		// 每60秒刷新一次评论列表
		commentRefreshTimer = setInterval(async () => {
			await getCommentList()
		}, 60000)
	})

	onUnmounted(() => {
		// 清除定时器
		if (commentRefreshTimer) {
			clearInterval(commentRefreshTimer)
		}
		
		// 离开页面时更新浏览时长
		if (viewStartTime.value > 0 && userStore.userInfo.uid) {
			const duration = Math.floor((Date.now() - viewStartTime.value) / 1000)
			if (duration > 0 && articleDetail.value._id) {
				articleApi.updateViewDuration(
					articleDetail.value._id,
					userStore.userInfo.uid || `guest_${Date.now()}`,
					duration
				).catch(err => {
					console.error('更新浏览时长失败:', err)
				})
			}
		}
		
		// 在离开详情页时，再次发送事件通知其他页面更新浏览量
		if (articleDetail.value && articleDetail.value._id) {
			uni.$emit('updateArticleLookCount', {
				articleId: articleDetail.value._id,
				lookCount: articleDetail.value.look_count || 0
			})
		}
		
		// 移除评论区显示状态变化监听
		uni.$off('updateCommentVisibility');
	})

	// 添加图片预览方法
	const previewImage = (current) => {
		if (!articleDetail.value.images || !articleDetail.value.images.length) return
		
		// 设置预览图片列表
		previewImages.value = articleDetail.value.images.map(img => img.compressedURL);
		
		// 确定当前显示的图片索引
		if (typeof current === 'number') {
			previewCurrent.value = current;
		} else {
			// 如果传入的是图片URL，查找对应的索引
			const index = previewImages.value.findIndex(url => url === current);
			previewCurrent.value = index >= 0 ? index : 0;
		}
		
		// 显示预览组件
		previewVisible.value = true;
	}

	// 关闭图片预览
	const closePreview = () => {
		previewVisible.value = false;
	}
	
	// 图片预览索引变化
	const handlePreviewChange = (index) => {
		previewCurrent.value = index;
	}

	// 添加视频错误处理
	const handleVideoError = (err) => {
		console.error('视频播放错误:', err)
		videoLoadStatus.value = 'error'
		uni.showToast({
			title: '视频加载失败',
			icon: 'none'
		})
	}

	// 视频加载完成事件处理
	const handleVideoLoaded = () => {
		videoLoadStatus.value = 'loaded'
		isVideoLoading.value = false
	}
	
	// 视频加载中事件处理
	const handleVideoWaiting = () => {
		isVideoLoading.value = true
	}
	
	// 视频可以播放事件处理
	const handleVideoCanPlay = () => {
		isVideoLoading.value = false
	}
	
	// 切换视频播放状态
	const toggleVideoPlay = () => {
		if (videoContext.value) {
			if (isPlaying.value) {
				videoContext.value.pause()
			} else {
				videoContext.value.play()
			}
			isPlaying.value = !isPlaying.value
		} else {
			// 如果上下文丢失，尝试重新创建
			videoContext.value = uni.createVideoContext('articleVideo')
		}
	}

	// 添加一个计算属性来检查是否有视频
	const hasVideo = computed(() => {
		return articleDetail.value && articleDetail.value.videoURL;
	})

	// 添加处理轮播图变化的方法
	const handleSwiperChange = (e) => {
		currentImageIndex.value = e.detail.current
	}

	// 添加图片加载完成的处理方法
	const handleImageLoad = (index) => {
		imageLoadStatus.value[index] = 'loaded';
		checkAllImagesLoaded();
	};
	
	// 添加图片加载失败的处理方法
	const handleImageError = (index) => {
		console.error('Image loading failed for index:', index);
		imageLoadStatus.value[index] = 'error';
		checkAllImagesLoaded();
	};
	
	// 检查所有图片是否已加载
	const checkAllImagesLoaded = () => {
		if (!articleDetail.value || !articleDetail.value.images) {
			isAnyImageLoading.value = false;
			return;
		}
		
		const imageCount = articleDetail.value.images.length;
		let loadedCount = 0;
		
		for (let i = 0; i < imageCount; i++) {
			if (imageLoadStatus.value[i] === 'loaded' || imageLoadStatus.value[i] === 'error') {
				loadedCount++;
			}
		}
		
		isAnyImageLoading.value = loadedCount < imageCount;
	};
	
	// 文章点击跳转
	const handleArticleClick = (articleId) => {
		// 如果点击的是当前文章，不做任何操作
		if (articleId === props.article_id) {
			return
		}
		
		// 跳转到新的文章详情页
		uni.navigateTo({
			url: `/pages/article/articleDetail?article_id=${articleId}`,
			animationType: 'slide-in-right',
			animationDuration: 300,
			success: () => {
				console.log('跳转到文章详情页成功:', articleId)
			},
			fail: (err) => {
				console.error('跳转到文章详情页失败:', err)
				uni.showToast({
					title: '跳转失败',
					icon: 'none'
				})
			}
		})
	}

	// 修改触底事件处理
	onReachBottom(() => {
		console.log('触发页面触底事件')
		// 调用推荐组件的加载更多方法
		if (tuijianRef.value) {
			tuijianRef.value.loadMore()
		}
	})

	// 添加触摸控制方法
	const handleSwiperTouchStart = () => {
		isSwiperAutoplay.value = false
	}

	const handleSwiperTouchEnd = () => {
		// 延迟一小段时间再恢复自动播放，确保用户完成操作
		setTimeout(() => {
			isSwiperAutoplay.value = true
			// 用户干预后，将轮播间隔改为4000毫秒
			swiperInterval.value = 4000
		}, 500)
	}

	const handleSwiperTouchMove = () => {
		// 确保在滑动过程中保持暂停状态
		isSwiperAutoplay.value = false
	}

	// 添加幸运用户横幅相关的状态和方法
	const showLuckyUserBanner = ref(false)
	const luckyUserRank = ref(1)
	const luckyUserInfo = ref({
		avatar: '',
		nickname: '用户'
	})

	// 添加点赞相关状态
	const isLiked = ref(false)
	const likeCount = ref(0)

	// 浏览者列表相关状态
	const viewersListVisible = ref(false)
	const viewersList = ref([])
	const viewersPageNo = ref(1)
	const viewersPageSize = ref(20)
	const viewersTotal = ref(0)
	const hasMoreViewers = ref(true)
	const viewersLoading = ref(false)
	const viewersRefreshing = ref(false)
	const viewStartTime = ref(0) // 浏览开始时间

	// 处理点赞状态变化
	const handleLikeChange = (data) => {
		console.log('点赞状态变化:', data)
		isLiked.value = data.isLiked
		likeCount.value = data.likeCount
		
		// 更新文章详情中的点赞信息
		if (articleDetail.value) {
			articleDetail.value.like_count = data.likeCount
			articleDetail.value.is_liked = data.isLiked
		}
	}

	// 处理幸运用户横幅的方法
	const handleLuckyUser = (data) => {
		console.log('收到幸运用户事件:', data);
		
		// 确保数据有效
		if (!data) {
			console.error('收到无效的幸运用户数据');
			return;
		}
		
		// 只有当用户真正中奖时才显示横幅
		if (data.isWinner === true) {
			showLuckyUserBanner.value = true;
			
			// 确保 rank 是数字类型
			luckyUserRank.value = typeof data === 'object' ? (Number(data.likeRank) || 1) : (Number(data) || 1);
			
			// 如果有用户信息，使用接收到的用户信息
			if (data && typeof data === 'object') {
				// 临时存储用户信息
				const tempUserInfo = {
					avatar: data.avatar || '/static/images/default-avatar.png',
					nickname: data.nickname || '幸运用户'
				};
				
				// 更新用户信息
				luckyUserInfo.value = tempUserInfo;
				
				console.log('更新幸运用户信息:', tempUserInfo);
			}
		}
	}

	// 显示浏览者列表
	const showViewersList = async () => {
		try {
			const isLoggedIn = await customTestLogin()
			if (!isLoggedIn) return
			
			if (!userStore.userInfo || userStore.userInfo.uid !== articleDetail.value.user_id) {
				uni.showToast({ title: '只有作者才能查看浏览者', icon: 'none' })
				return
			}
			
			// 显示加载提示
			uni.showLoading({ title: '加载中...', mask: true })
			
			viewersList.value = []
			viewersPageNo.value = 1
			hasMoreViewers.value = true
			viewersTotal.value = 0
			viewersListVisible.value = true
			
			await loadViewers(true)
			uni.hideLoading()
		} catch (err) {
			console.error('显示浏览者列表失败:', err)
			uni.hideLoading()
			uni.showToast({ title: '操作失败', icon: 'none' })
		}
	}
	
	const loadViewers = async (refresh = false) => {
		try {
			if (viewersLoading.value) return
			if (refresh) {
				viewersPageNo.value = 1
				viewersList.value = []
				hasMoreViewers.value = true
			} else if (!hasMoreViewers.value) return
			
			viewersLoading.value = true
			const result = await articleApi.getViewers(props.article_id, {
				pageNo: viewersPageNo.value,
				pageSize: viewersPageSize.value
			})
			
			if (result.code === 0) {
				const { viewers, total, totalPages } = result.data
				if (refresh) {
					viewersList.value = viewers
				} else {
					viewersList.value.push(...viewers)
				}
				viewersTotal.value = total
				hasMoreViewers.value = viewersPageNo.value < totalPages
				if (hasMoreViewers.value) viewersPageNo.value++
			} else {
				uni.showToast({ title: result.message || '获取失败', icon: 'none' })
			}
		} catch (err) {
			console.error('加载失败:', err)
			uni.showToast({ title: '加载失败', icon: 'none' })
		} finally {
			viewersLoading.value = false
			viewersRefreshing.value = false
		}
	}
	
	const closeViewersList = () => {
		viewersListVisible.value = false
		viewersList.value = []
		viewersPageNo.value = 1
		hasMoreViewers.value = true
	}
	
	const handleViewersRefresh = async () => {
		viewersRefreshing.value = true
		await loadViewers(true)
	}
	
	const formatDuration = (seconds) => {
		if (!seconds || seconds <= 0) return '0秒'
		const totalSeconds = Math.floor(seconds)
		if (totalSeconds < 60) return `${totalSeconds}秒`
		const minutes = Math.floor(totalSeconds / 60)
		const secs = totalSeconds % 60
		return `${minutes}分${secs}秒`
	}

	// 添加分享文章方法
	const shareArticle = () => {
		// 配置分享参数
		let shareOptions = {
			title: articleDetail.value.content?.substring(0, 30) || '分享文章',
			path: `/pages/article/articleDetail?article_id=${articleDetail.value._id}`,
			imageUrl: articleDetail.value.images && articleDetail.value.images.length > 0 
				? articleDetail.value.images[0].compressedURL
				: '/static/images/share-default.png',
			success: (res) => {
				console.log('分享成功', res);
				uni.showToast({
					title: '分享成功',
					icon: 'success'
				});
			},
			fail: (err) => {
				console.error('分享失败', err);
			}
		};
		
		// 调用系统分享
		uni.share({
			provider: 'weixin',
			scene: 'WXSceneSession',
			type: 0,
			...shareOptions
		});
	}

	// 添加一个统一的媒体处理函数
	const processMediaURL = (url, type = 'image') => {
		if (!url) return '';
		
		// 处理CDN域名
		if (url.includes('jingle0350.cn')) {
			if (type === 'image') {
				return processCDNImage(url);
			}
		}
		
		// 处理可能的防盗链问题
		if (url.includes('ixigua.com') || url.includes('aly2.')) {
			return url.includes('?') ? `${url}&referer=no_referer` : `${url}?referer=no_referer`;
		}
		
		// 对视频URL的特殊处理
		if (type === 'video' && url.includes('baidu.com')) {
			// 百度视频链接可能需要特殊处理
			return url;
		}
		
		return url;
	};

	// 添加视频事件处理
	const handleVideoPlay = () => {
		isPlaying.value = true
	}

	const handleVideoPause = () => {
		isPlaying.value = false
	}

	// 处理视频URL函数
	const processCDNImage = (url) => {
		if (!url) return '';
		
		// 检查图片URL是否已经包含CDN参数
		if (url.includes('imageMogr2') || url.includes('watermark')) {
			// 已经有CDN参数，直接返回
			return url;
		}
		
		// 为图片添加CDN参数，根据实际情况修改
		if (url.includes('?')) {
			return `${url}&imageMogr2/thumbnail/!300x300r/format/webp/quality/70`;
		} else {
			return `${url}?imageMogr2/thumbnail/!300x300r/format/webp/quality/70`;
		}
	};

	// 获取文章详情后，立即初始化视频
	watch(() => articleDetail.value._id, (newVal) => {
		if (newVal && articleDetail.value.videoURL) {
			// 延迟初始化视频上下文，确保DOM已渲染
			nextTick(() => {
				setTimeout(() => {
					videoContext.value = uni.createVideoContext('articleVideo');
					console.log('视频上下文已创建');
				}, 300);
			});
		}
	});
</script>

<template>
	<view class="article-detail-container">
		<!-- 只在完全没有数据时显示加载页面 -->
		<up-loading-page :loading="isLoading && !articleDetail._id"></up-loading-page>

		<view class="article-detail-container" v-show="articleDetail._id">
			<!-- 作者信息区域 -->
			<view class="author-info-section">
				<view class="author-avatar">
					<image :src="articleDetail.user && articleDetail.user.avatarUrl || articleDetail.user_avatarUrl || articleDetail.avatarUrl || '/static/images/default-avatar.png'" mode="aspectFill"></image>
				</view>
				<view class="author-details">
					<view class="author-name">{{ articleDetail.user && articleDetail.user.nickName || articleDetail.user_nickName || articleDetail.nickName || articleDetail.user_name || '匿名用户' }}</view>
					<view 
						class="post-time"
						@click="userStore.userInfo && userStore.userInfo.uid === articleDetail.user_id ? showViewersList() : null"
					>
						{{ formatTime(articleDetail.create_time) }} | {{ articleDetail.look_count || 0 }}浏览
					</view>
				</view>
				<view class="contact-btn" @click="handleCall">
					<uni-icons type="phone-filled" size="24" color="#07C160"></uni-icons>
				</view>
			</view>
			
			<scroll-view 
				class="article-detail-scroll" 
				scroll-y 
				@scrolltolower="tuijianRef?.loadMore()"
				:show-scrollbar="false"
				refresher-enabled
				:refresher-triggered="isLoading"
				@refresherrefresh="getArticleDetail"
				:lower-threshold="150"
				enable-back-to-top
			>
				<view class="article-detail" :class="{ 'no-video': !hasVideo }">
					<!-- 将视频组件放在最顶部，与参考代码中一致 -->
					<view class="articleVideo" v-if="articleDetail.videoURL">
						<!-- 视频加载状态 -->
						<view class="video-loading" v-if="videoLoadStatus === 'loading'">
							<uni-load-more status="loading" :contentText="{ contentrefresh: '视频加载中...' }"></uni-load-more>
						</view>
						
						<!-- 视频错误状态 -->
						<view class="video-error" v-if="videoLoadStatus === 'error'">
							<uni-icons type="videocam-slash" size="50" color="#CCCCCC"></uni-icons>
							<text>视频加载失败</text>
						</view>
						
						<video
							id="articleVideo"
							class="video-player"
							:src="articleDetail.videoURL"
							autoplay
							object-fit="cover"
							:poster="articleDetail.images && articleDetail.images[0] ? articleDetail.images[0].compressedURL : ''"
							controls
							@error="handleVideoError"
							@loadedmetadata="handleVideoLoaded"
							@waiting="handleVideoWaiting"
							@canplay="handleVideoCanPlay"
							@play="handleVideoPlay"
							@pause="handleVideoPause"
							:enable-progress-gesture="true"
							:vslide-gesture="true"
							:vslide-gesture-in-fullscreen="true"
							show-center-play-btn="true"
							show-play-btn="true"
							show-fullscreen-btn="true"
						></video>
						
						<!-- 中间播放按钮，在没有原生按钮时才显示 -->
						<view class="center-play-btn" v-if="!isPlaying && videoLoadStatus === 'loaded'" @click.stop="toggleVideoPlay">
							<view class="play-icon">
								<uni-icons type="videocam-filled" size="36" color="#FFFFFF"></uni-icons>
							</view>
						</view>
					</view>
					
					<!-- 图片网格显示在内容上方 -->
					<view class="image-grid" v-if="articleDetail.images && articleDetail.images.length">
						<view class="grid-container" :class="[`grid-${articleDetail.images.length > 9 ? 9 : articleDetail.images.length}`]">
							<!-- 将图片计数显示在网格右上角 -->
							<view class="image-count" v-if="articleDetail.images.length > 1">
								<uni-icons type="image" size="16" color="#FFFFFF"></uni-icons>
								<text>{{ articleDetail.images.length }}张图片</text>
							</view>
							<view 
								v-for="(item, index) in articleDetail.images.length > 9 ? articleDetail.images.slice(0, 9) : articleDetail.images" 
								:key="index" 
								class="grid-item"
								@click="previewImage(index)"
							>
								<image 
									:src="item.compressedURL" 
									mode="aspectFill"
									@load="handleImageLoad(index)"
									@error="handleImageError(index)"
								></image>
								<!-- 在第9张图片上显示"更多"标记，如果总数超过9张 -->
								<view class="image-count more-images" v-if="index === 8 && articleDetail.images.length > 9">
									<text>+{{ articleDetail.images.length - 9 }}</text>
								</view>
							</view>
						</view>
					</view>
					
					<!-- 文章内容区域 -->
					<view class="articleContent">
						<view class="articleText" v-if="articleDetail.content">
							{{articleDetail.content}}
						</view>
						<view class="articleText" v-else>
							<!-- 空容器 -->
						</view>
					</view>
					
					<!-- 灰色分隔条和详情图保持原样 -->
					
					<!-- 添加灰色分隔间隔 -->
					<view class="gray-separator"></view>
					
					<!-- 添加详情图片分隔线 -->
					<view class="detail-images-divider" v-if="articleDetail.images && articleDetail.images.length">
						<text>详情图片 ({{articleDetail.images.length}}张)</text>
					</view>
					
					<!-- 大图详情展示 -->
					<view class="detail-images" v-if="articleDetail.images && articleDetail.images.length">
						<image 
							v-for="(item, index) in articleDetail.images" 
							:key="index"
							:src="item.compressedURL" 
							mode="widthFix"
							@click="previewImage(index)"
							class="detail-image"
						></image>
					</view>
					
					<!-- 评论 -->
					<view class="comment-section" v-if="navInfo && navInfo.isVisible">
						<!-- 评论加载中提示 -->
						<view v-if="isCommentsLoading && !articleComment.length" class="comment-loading">
							<view class="loading-spinner"></view>
							<text>评论加载中...</text>
						</view>
						
						<!-- 添加空状态提示 -->
						<view v-else-if="commentCount === 0" class="empty-comment">
							<uni-icons type="chat" size="50" color="#CCCCCC"></uni-icons>
							<text>暂无评论</text>
						</view>
						
						<!-- 评论标题栏 -->
						<view class="comment-header-bar">
							<view class="comment-title">评论 ({{commentCount}})</view>
						</view>
						
						<!-- 评论输入框 -->
						<view class="comment-input" @click="handleCommentClick">
							<view class="input-box">
								<text>评论点什么...</text>
								<uni-icons type="chat" size="20" color="#999"></uni-icons>
							</view>
						</view>
					</view>
					
					<!-- 评论列表组件 -->
					<comment-list 
						v-if="navInfo && navInfo.isVisible"
						:comments="articleComment" 
						@delComment="handelDelComment"
					></comment-list>

					<!-- 替换原有的推荐部分为新组件 -->
					<tuijian 
						ref="tuijianRef"
						:current-article-id="article_id"
						:cate_id="articleDetail.cate_id"
						@click="handleArticleClick"
					/>
				</view>
			</scroll-view>

			<!-- 底部栏 -->
			<view class="footer">
				<view class="footer-content">
					<view class="action-item" @click="goToHome">
						<uni-icons type="home" size="24" color="#444444"></uni-icons>
						<view class="text">
							首页
						</view>
					</view>
					
					<!-- 点赞组件 -->
					<view class="action-item like-item">
						<Dianzan
							:articleId="article_id"
							:userId="userStore.userInfo.uid"
							:initialLikeCount="likeCount"
							:initialIsLiked="isLiked"
							:size="24"
							:showCount="true"
							:showText="false"
							:userAvatar="userStore.userInfo.avatarUrl"
							:userNickname="userStore.userInfo.nickName"
							@likeChange="handleLikeChange"
							@luckyUser="handleLuckyUser"
						/>
					</view>
					
					<view class="call-btn phone-btn" @click="handleCall">
						打电话
					</view>
				</view>
			</view>
			
			<!-- 幸运用户横幅 -->
			<LuckyUserBanner
				v-if="showLuckyUserBanner"
				:rank="luckyUserRank"
				:avatar="luckyUserInfo.avatar"
				:nickname="luckyUserInfo.nickname"
				@close="showLuckyUserBanner = false"
			/>
		</view>

		<!-- 添加自定义图片预览组件 -->
		<Tuouanyulan
			:visible="previewVisible"
			:images="previewImages"
			:current="previewCurrent"
			@close="closePreview"
			@change="handlePreviewChange"
		/>
		
		<!-- 浏览者列表弹窗 -->
		<view v-if="viewersListVisible" class="viewers-modal" @click="closeViewersList">
			<view class="viewers-container" @click.stop>
				<view class="viewers-header">
					<text class="viewers-title">浏览者列表 ({{ viewersTotal }})</text>
					<view class="close-btn" @click="closeViewersList">
						<uni-icons type="closeempty" size="24" color="#666"></uni-icons>
					</view>
				</view>
				<scroll-view 
					class="viewers-list" 
					scroll-y 
					@scrolltolower="() => loadViewers(false)"
					:refresher-enabled="true"
					:refresher-triggered="viewersRefreshing"
					@refresherrefresh="handleViewersRefresh"
					:lower-threshold="100"
				>
					<view class="viewer-item" v-for="(viewer, index) in viewersList" :key="index">
						<view class="viewer-avatar">
							<image 
								:src="viewer.user_avatarUrl || '/static/images/touxiang.png'" 
								mode="aspectFill"
							></image>
						</view>
						<view class="viewer-info">
							<view class="viewer-name">
								<text>{{ viewer.user_nickName || '匿名用户' }}</text>
								<text class="guest-badge" v-if="viewer.user_id && viewer.user_id.startsWith('guest_')">访客</text>
							</view>
							<view class="viewer-detail">
								<text class="viewer-time">{{ formatTime(viewer.view_time) }}</text>
								<text class="viewer-duration" v-if="viewer.view_duration > 0">浏览 {{ formatDuration(viewer.view_duration) }}</text>
							</view>
						</view>
						<view class="viewer-contact" v-if="viewer.user_mobile">
							<uni-icons type="phone" size="20" color="#07C160"></uni-icons>
						</view>
					</view>
					
					<!-- 加载中提示 -->
					<view v-if="viewersLoading" class="loading-more">
						<text>加载中...</text>
					</view>
					
					<!-- 没有更多数据 -->
					<view v-if="!hasMoreViewers && viewersList.length > 0" class="no-more">
						<text>没有更多了</text>
					</view>
					
					<!-- 空状态 -->
					<view v-if="viewersList.length === 0 && !viewersLoading" class="empty-viewers">
						<uni-icons type="eye-slash" size="50" color="#CCCCCC"></uni-icons>
						<text>暂无浏览记录</text>
					</view>
				</scroll-view>
			</view>
		</view>
	</view>
</template>

<style lang="scss" scoped>
	.article-detail-container {
		display: flex;
		flex-direction: column;
		height: 100vh;
		background-color: #f7f7f7;
		padding-bottom: 140rpx; /* 90rpx + 50rpx安全区域 */
		border: none;
		box-sizing: border-box;
		animation: fade-in 0.3s ease-in-out;
	}

	@keyframes fade-in {
		from { opacity: 0; }
		to { opacity: 1; }
	}
	
	/* 添加作者信息区域样式 */
	.author-info-section {
		display: flex;
		align-items: center;
		padding: 20rpx 24rpx;
		background-color: #FFFFFF;
		border-bottom: 1px solid #dedcdc;
		box-shadow: 0 2rpx 6rpx rgba(0, 0, 0, 0.05);
		position: relative;
		z-index: 1;
		
		.author-avatar {
			width: 70rpx;
			height: 70rpx;
			border-radius: 5rpx;
			overflow: hidden;
			margin-right: 16rpx;
			
			image {
				width: 100%;
				height: 100%;
				object-fit: cover;
			}
		}
		
		.author-details {
			flex: 1;
			
			.author-name {
				font-size: 30rpx;
				font-weight: 500;
				color: #333333;
				margin-bottom: 4rpx;
			}
			
			.post-time {
				font-size: 22rpx;
				color: #999999;
			}
		}
		
		.contact-btn {
			margin-left: 16rpx;
		}
	}

	.article-detail-scroll {
		flex: 1;
		height: calc(100vh - 110rpx - 150rpx); /* 100rpx + 50rpx安全区域 */
		-webkit-overflow-scrolling: touch;
	}

	.article-detail {
		padding-top: 0;
		padding-bottom: calc(100rpx + env(safe-area-inset-bottom));
		background-color: #FFFFFF;
		
		&.no-video {
			padding-top: 0;
		}
		
		/* 视频播放器样式 */
		.articleVideo {
			position: relative;
			width: 100%;
			height: 422rpx;
			border-radius: 0; /* 修改为0，使视频与页面边缘无间隙 */
			background-color: #000;
			margin: 5rpx 0 20rpx; /* 修改顶部margin为0 */
			overflow: hidden;
			
			.video-player {
				width: 100%;
				height: 100%;
				object-fit: contain;
				z-index: 1;
			}
			
			// 视频加载状态
			.video-loading {
				position: absolute;
				top: 0;
				left: 0;
				width: 100%;
				height: 100%;
				display: flex;
				flex-direction: column;
				justify-content: center;
				align-items: center;
				z-index: 2;
				background-color: rgba(0, 0, 0, 0.1);
			}
			
			// 视频错误状态
			.video-error {
				position: absolute;
				top: 0;
				left: 0;
				width: 100%;
				height: 100%;
				display: flex;
				flex-direction: column;
				justify-content: center;
				align-items: center;
				z-index: 2;
				background-color: #f5f5f5;
				
				text {
					margin-top: 20rpx;
					color: #999999;
					font-size: 28rpx;
				}
			}
			
			/* 中间播放按钮 */
			.center-play-btn {
				position: absolute;
				top: 50%;
				left: 50%;
				transform: translate(-50%, -50%);
				z-index: 3;
				
				.play-icon {
					width: 100rpx;
					height: 100rpx;
					border-radius: 50%;
					background-color: rgba(0,0,0,0.5);
					display: flex;
					align-items: center;
					justify-content: center;
				}
			}
		}

		.articleContent {
			padding: 0rpx 10rpx 20rpx 10rpx;
			margin-bottom: 20rpx;
			font-size: 30rpx;
			line-height: 1.6;
			background-color: #fff;
			min-height: 24rpx;
			display: block;
			margin: 0;
			word-break: break-all;
			
			.articleText {
				padding: 0 30rpx;
				color: #333;
				word-break: break-word;
				min-height: 1.6em;
				white-space: pre-wrap;
			}
		}
		
		/* 添加图片网格布局 */
		.image-grid {
			padding: 0 20rpx 20rpx;
			background-color: #FFFFFF;
			
			.grid-container {
				display: flex;
				flex-wrap: wrap;
				gap: 3rpx;
				background-color: #f0f0f0;
				padding: 8rpx;
				border-radius: 3rpx;
				margin: 5rpx 0;
				position: relative;
				
				.image-count {
					position: absolute;
					top: 20rpx;
					right: 20rpx;
					background-color: rgba(0, 0, 0, 0.6);
					display: flex;
					align-items: center;
					justify-content: center;
					gap: 4rpx;
					padding: 4rpx 10rpx;
					border-radius: 4rpx;
					z-index: 2;
					
					text {
						color: #FFFFFF;
						font-size: 24rpx;
						font-weight: 500;
					}
				}
				
				&.grid-1 {
					.grid-item {
						width: 100%;
						height: 450rpx;
					}
				}
				
				&.grid-2 {
					display: grid;
					grid-template-columns: 1fr 1fr;
					grid-template-rows: 320rpx;
					gap: 3rpx;
					
					.grid-item {
						width: 100%;
						height: 100%;
					}
				}
				
				&.grid-3 {
					display: grid;
					grid-template-columns: 1fr 1fr 1fr;
					grid-template-rows: 210rpx;
					gap: 3rpx;
					
					.grid-item {
						width: 100%;
						height: 100%;
					}
				}
				
				&.grid-4 {
					display: grid;
					grid-template-columns: 1fr 1fr;
					grid-template-rows: 210rpx 210rpx;
					gap: 3rpx;
					
					.grid-item {
						width: 100%;
						height: 100%;
					}
				}
				
				&.grid-5 {
					display: grid;
					grid-template-columns: 1fr 1fr 1fr;
					grid-template-rows: 210rpx 210rpx;
					gap: 3rpx;
					
					.grid-item {
						width: 100%;
						height: 100%;
						
						&:nth-child(4) {
							grid-column: 1 / span 1;
							grid-row: 2;
						}
						&:nth-child(5) {
							grid-column: 2 / span 1;
							grid-row: 2;
						}
					}
				}
				
				&.grid-6 {
					display: grid;
					grid-template-columns: 1fr 1fr 1fr;
					grid-template-rows: 210rpx 210rpx;
					gap: 3rpx;
					
					.grid-item {
						width: 100%;
						height: 100%;
					}
				}
				
				/* 7-9张图片的布局 */
				&.grid-7, &.grid-8, &.grid-9 {
					display: grid;
					grid-template-columns: 1fr 1fr 1fr;
					grid-template-rows: 210rpx 210rpx 210rpx;
					gap: 3rpx;
					
					.grid-item {
						width: 100%;
						height: 100%;
					}
				}
				
				.grid-item {
					overflow: hidden;
					border-radius: 5rpx;
					position: relative;
					background-color: #f7f7f7;
					
					image {
						width: 100%;
						height: 100%;
						object-fit: cover;
					}
				}
			}
		}
		
		/* 添加灰色分隔间隔样式 */
		.gray-separator {
			height: 16rpx;
			background-color: #f7f7f7;
			margin-top: 10rpx;
			width: 100%;
		}
		
		/* 添加详情图片分隔线样式 */
		.detail-images-divider {
			display: flex;
			align-items: center;
			justify-content: center;
			padding: 30rpx 0;
			position: relative;
			margin: 10rpx 0;
			width: 100%;
			
			&::before, &::after {
				content: '';
				width: 80rpx; /* 设置固定宽度替代flex: 1 */
				height: 1rpx;
				background-color: #E0E0E0;
			}
			
			text {
				padding: 0 24rpx;
				font-size: 26rpx;
				color: #999999;
				white-space: nowrap;
			}
		}
		
		/* 添加详情大图样式 */
		.detail-images {
			padding: 0 24rpx;
			
			.detail-image {
				width: 100%;
				margin-bottom: 5rpx;
				border-radius: 2rpx;
			}
		}

		.comment-section {
			padding: 16rpx 24rpx;
			margin: 16rpx 0 0;
			background-color: #FFFFFF;
			border-radius: 0;
			box-shadow: none;
			animation: fade-in-delay 0.5s ease-out;
			
			// 添加评论加载中样式
			.comment-loading {
				display: flex;
				flex-direction: column;
				align-items: center;
				justify-content: center;
				padding: 30rpx 0;
				
				.loading-spinner {
					width: 50rpx;
					height: 50rpx;
					border: 3rpx solid rgba(0, 0, 0, 0.1);
					border-top-color: #666;
					border-radius: 50%;
					animation: spin 1s linear infinite;
				}
				
				text {
					margin-top: 16rpx;
					font-size: 26rpx;
					color: #666;
				}
			}
			
			.comment-input {
				margin: 16rpx 0;
				
				.input-box {
					display: flex;
					justify-content: space-between;
					align-items: center;
					padding: 16rpx;
					background: #f5f5f5;
					border-radius: 6rpx;
					border: none;
					transition: all 0.2s ease;
					
					&:active {
						background: #eeeeee;
					}
					
					text {
						color: #999;
						font-size: 26rpx;
					}
				}
			}
			
			.empty-comment {
				display: flex;
				flex-direction: column;
				align-items: center;
				padding: 40rpx 0;
				
				text {
					margin-top: 16rpx;
					font-size: 26rpx;
					color: #999;
				}
			}
			
			.comment-header-bar {
				display: flex;
				justify-content: space-between;
				align-items: center;
				padding: 8rpx 0;
				
				.comment-title {
					font-size: 30rpx;
					font-weight: 500;
					color: #333;
				}
			}
		}
	}

	.footer {
		position: fixed;
		left: 0;
		right: 0;
		bottom: 0;
		background-color: #fff;
		border-top: 1px solid #eee;
		padding-bottom: 30rpx; /* 快手小程序固定安全区域高度 */
		z-index: 99;
		
		.footer-content {
			display: flex;
			align-items: center;
			padding: 12rpx 20rpx;
			height: 90rpx;
			font-size: 24rpx;
			color: $pyq-text-color-body;

			.action-item {
				display: flex;
				flex-direction: column;
				align-items: center;
				justify-content: center;
				margin-right: 36rpx;
				padding: 6rpx;
				width: 120rpx;

				.text {
					margin-top: 6rpx;
					font-size: 22rpx;
				}

				&:active {
					opacity: 0.7;
				}
				
				&.like-item {
					width: auto;
					min-width: 80rpx;
				}
			}

			.call-btn {
				flex: 1;
				height: 70rpx;
				line-height: 70rpx;
				text-align: center;
				background-color: #4e9bfe;
				color: #fff;
				border-radius: 6rpx;
				font-size: 28rpx;
				font-weight: 500;
				margin-left: auto;

				&:active {
					opacity: 0.8;
				}
			}
		}
	}
	
	// 添加旋转动画
	@keyframes spin {
		0% {
			transform: rotate(0deg);
		}
		100% {
			transform: rotate(360deg);
		}
	}

	@keyframes fade-in-delay {
		0% {
			opacity: 0;
		}
		50% {
			opacity: 0;
		}
		100% {
			opacity: 1;
		}
	}

	/* 添加更多图片提示的样式 */
	.more-images {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background-color: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		
		text {
			color: #FFFFFF;
			font-size: 36rpx;
			font-weight: bold;
		}
	}

	/* 添加补充的加载组件样式 */
	.video-loading :deep(.uni-load-more) {
		background-color: transparent;
	}

	.video-loading :deep(.uni-load-more__text) {
		color: #fff;
		text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
	}
	
	/* 浏览者列表样式 */
	.viewers-modal {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-color: rgba(0, 0, 0, 0.6);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 9999;
		animation: fadeIn 0.3s ease;
	}
	
	@keyframes fadeIn {
		from { opacity: 0; }
		to { opacity: 1; }
	}
	
	.viewers-container {
		width: 90%;
		max-width: 650rpx;
		height: 75vh;
		max-height: 1200rpx;
		background-color: #fff;
		border-radius: 24rpx;
		display: flex;
		flex-direction: column;
		overflow: hidden;
		box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.2);
		animation: slideUp 0.3s ease;
	}
	
	@keyframes slideUp {
		from { 
			transform: translateY(100rpx);
			opacity: 0;
		}
		to { 
			transform: translateY(0);
			opacity: 1;
		}
	}
	
	.viewers-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 32rpx 30rpx;
		border-bottom: 2rpx solid #F0F0F0;
		background: linear-gradient(to bottom, #ffffff, #fafafa);
		
		.viewers-title {
			font-size: 34rpx;
			font-weight: 600;
			color: #333;
			display: flex;
			align-items: center;
			gap: 8rpx;
			
			&::before {
				content: '👁️';
				font-size: 32rpx;
			}
		}
		
		.close-btn {
			padding: 8rpx;
			cursor: pointer;
			transition: transform 0.2s ease;
			
			&:active {
				transform: scale(0.9);
			}
		}
	}
	
	.viewers-list {
		flex: 1;
		padding: 8rpx 0;
		background-color: #fafafa;
	}
	
	.viewer-item {
		display: flex;
		align-items: center;
		padding: 24rpx 30rpx;
		background-color: #fff;
		margin: 0 16rpx 8rpx;
		border-radius: 12rpx;
		box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
		transition: all 0.3s ease;
		
		&:active {
			transform: scale(0.98);
			box-shadow: 0 1rpx 4rpx rgba(0, 0, 0, 0.06);
		}
		
		.viewer-avatar {
			width: 88rpx;
			height: 88rpx;
			border-radius: 50%;
			overflow: hidden;
			margin-right: 24rpx;
			border: 3rpx solid #F0F0F0;
			
			image {
				width: 100%;
				height: 100%;
			}
		}
		
		.viewer-info {
			flex: 1;
			min-width: 0;
			
			.viewer-name {
				display: flex;
				align-items: center;
				margin-bottom: 8rpx;
				
				text {
					font-size: 30rpx;
					color: #333;
					font-weight: 500;
					overflow: hidden;
					text-overflow: ellipsis;
					white-space: nowrap;
				}
				
				.guest-badge {
					margin-left: 12rpx;
					font-size: 20rpx;
					color: #FF9800;
					background-color: #FFF3E0;
					padding: 4rpx 12rpx;
					border-radius: 6rpx;
					flex-shrink: 0;
				}
			}
			
			.viewer-detail {
				display: flex;
				align-items: center;
				gap: 16rpx;
				flex-wrap: wrap;
				
				.viewer-time {
					font-size: 24rpx;
					color: #999;
				}
				
				.viewer-duration {
					font-size: 24rpx;
					color: #666;
					background-color: #F0F8FF;
					padding: 2rpx 10rpx;
					border-radius: 4rpx;
				}
			}
		}
		
		.viewer-contact {
			margin-left: 16rpx;
			flex-shrink: 0;
		}
	}
	
	.loading-more {
		text-align: center;
		padding: 30rpx;
		color: #999;
		font-size: 26rpx;
	}
	
	.no-more {
		text-align: center;
		padding: 30rpx;
		color: #CCCCCC;
		font-size: 24rpx;
	}
	
	.empty-viewers {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 120rpx 0;
		
		text {
			margin-top: 24rpx;
			color: #999;
			font-size: 28rpx;
		}
	}
</style>