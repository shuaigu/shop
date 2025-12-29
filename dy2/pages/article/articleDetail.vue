<script setup>
	import { computed, onMounted, ref, watch, onUnmounted, onBeforeUnmount, onActivated, nextTick } from 'vue'
	import { useUserInfoStore } from '@/store/user.js'
	import formatTime from '@/utils/formatTime.js'
	import { testLogin } from '@/utils/isLogin'
	import { onReachBottom, onShareAppMessage, onShareTimeline, onLoad, onShow, onHide, onUnload, onReady, onPullDownRefresh } from '@dcloudio/uni-app'
	// 导入推荐组件
	import tuijian from '@/components/tuijian/tuijian.vue'
	import commentList from '@/components/comment-list/comment-list.vue'
	import LotteryDraw from '@/components/articleDetail-choujia/articleDetail-choujia.vue' // Import lottery component
	// 导入uni-load-more组件
	import uniLoadMore from '@/uni_modules/uni-load-more/components/uni-load-more/uni-load-more.vue'
	
	// 设置默认粉丝群ID，如果从数据库获取失败，则使用此值
	const FANS_GROUP_ID = ref("CgYIASAHKAESTgpMPxsfnWvXJ61q6Eun6E6R/pZOQXqOK93pt9RbaamdIKv8hWML07CE8p7UrP6JX+XO7emnzmu+LFuaNy62FR6ye20jDcp/UPy2SaOrbBoA")

	// 获取粉丝群ID
	const fetchFansGroupId = async () => {
		try {
			const sendOnApi = uniCloud.importObject('sendOn', { customUI: true })
			const res = await sendOnApi.get()
			
			if (res && res.data && res.data.length > 0 && res.data[0].fans_group_id) {
				FANS_GROUP_ID.value = res.data[0].fans_group_id
				console.log('从数据库获取粉丝群ID:', FANS_GROUP_ID.value)
			} else {
				console.log('未从数据库获取到粉丝群ID，使用默认ID')
			}
		} catch (err) {
			console.error('获取粉丝群ID失败:', err)
		}
	}

	// 接受传递过来的数据 - 不需要导入 defineProps
	const props = defineProps( {
		article_id: {
			type: String,
			default: ''
		},
		
		user_id: String
	} )

	// 在setup部分顶部添加userStore引用
	const userStore = useUserInfoStore()

	// 在script setup顶部添加图片CDN处理函数
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
	
	// 添加登录状态跟踪，避免多次显示loading
	const loginLoadingVisible = ref(false);

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
								animationType: 'slide-in-right', // 添加右侧滑入动画
								animationDuration: 300, // 设置动画持续时间为300ms
								fail: (err) => {
									console.error('跳转回文章详情页失败:', err)
								}
							})
						}, 300) // 减少首页加载时间，增加流畅度
					},
					fail: (err) => {
						console.error('跳转到首页失败:', err)
						// 如果跳转失败，仍然尝试加载首页数据
						try {
							const cateApi = uniCloud.importObject('cateWx', { customUI: true })
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
	const isCommentsLoading = ref( true ) // 添加这个变量定义
	const isLoadingComments = ref( true ) // 添加这个变量定义
	const articleApi = uniCloud.importObject( 'articleDy', { customUI: true } )
	const commentApi = uniCloud.importObject( 'commentList', { customUI: true } )
	const likeApi = uniCloud.importObject( 'likeRecord', { customUI: true } )
	const userApi = uniCloud.importObject('userDy', { customUI: true }) // 使用userDy代替login
	// const loginApi = uniCloud.importObject('login', { customUI: true })

	// 添加评论刷新定时器变量
	const commentRefreshTimer = ref(null);

	// 评论展示控制
	const displayCommentsCount = ref(5) // 默认显示5条评论
	const showAllComments = ref(false) // 控制是否显示全部评论
	
	// 幸运抽奖相关变量
	const showLottery = ref(false) // 控制抽奖组件的显示
	const selectedWinner = ref(null) // 选中的幸运用户
	const canDrawLottery = computed(() => articleComment.value.length >= 3) // 至少需要3条评论才能抽奖
	
	// 文章详情
	const articleDetail = ref( {} )
	const articleComment = ref( [ ] )

	// 计算实际显示的评论
	const displayedComments = computed(() => {
		if (articleComment.value.length <= 5) {
			return articleComment.value;
		} else {
			// 显示指定数量的评论
			return articleComment.value.slice(0, displayCommentsCount.value);
		}
	});
	
	// 加载更多评论
	const loadMoreComments = () => {
		// 每次增加5条评论
		displayCommentsCount.value += 5;
		
		// 如果显示数量超过了总评论数，设置为全部显示
		if (displayCommentsCount.value >= articleComment.value.length) {
			displayCommentsCount.value = articleComment.value.length;
			showAllComments.value = true;
		}
	};
	
	// 收起评论
	const foldComments = () => {
		displayCommentsCount.value = 5;
		showAllComments.value = false;
	};

	// 总评论数
	const commentCount = computed( ( ) => {
		return articleComment.value.length
	} )

	// 增加一个标志位，避免重复登录检查
	const isCheckingLogin = ref(false)

	// 添加当前图片索引的状态
	const currentImageIndex = ref(0)

	// 添加图片懒加载状态跟踪
	const imageLoadStatus = ref({})
	const isAnyImageLoading = ref(true)
	
	// 添加视频相关状态
	const videoLoadStatus = ref('loading')
	const videoContext = ref(null)
	
	// 新增导航信息
	const navInfo = ref(null)
	// 新增抽奖模块显示状态
	const lotteryVisibility = ref(false)  // 默认关闭

	// 添加推荐组件的ref
	const tuijianRef = ref(null)

	// 在script setup顶部添加ref引用
	const likeButtonTop = ref(null)
	const likeButtonBottom = ref(null)
	const isLikeAnimating = ref(false)

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
	
	// 添加图片加载超时机制
	const imageLoadTimeouts = ref({});
	// 添加最大加载时间，单位毫秒
	const IMAGE_LOAD_TIMEOUT = 8000; // 8秒
	// 添加最大重试次数
	const MAX_RETRY_COUNT = 2;
	// 添加图片重试计数
	const imageRetryCount = ref({});
	
	// 添加分享信息
	const shareInfo = ref({
		title: '',
		path: '',
		imageUrl: ''
	});
	
	// 更新分享信息
	const updateShareInfo = () => {
		try {
			// 处理分享标题，使用文章内容的前30个字符
			let title = articleDetail.value.content 
				? articleDetail.value.content.substring(0, 30) 
				: '精彩内容';
			
			// 如果标题太短，尝试添加分类名
			if (title.length < 15 && articleDetail.value.cate_name) {
				title
			}
			
			// 设置分享图片URL为空值
			let imageUrl = '';
			
			// 设置分享路径
			const path = `/pages/article/articleDetail?article_id=${props.article_id}`;
			
			// 更新分享信息
			shareInfo.value = {
				title,
				path,
				imageUrl
			};
		} catch (err) {
			console.error('更新分享信息失败:', err);
		}
	};
	
	// 分享到微信好友
	onShareAppMessage((res) => {
		updateShareInfo();
		return {
			title: shareInfo.value.title,
			path: shareInfo.value.path,
			imageUrl: shareInfo.value.imageUrl
		};
	});
	
	// 分享到朋友圈
	onShareTimeline(() => {
		updateShareInfo();
		return {
			title: shareInfo.value.title,
			path: shareInfo.value.path,
			imageUrl: shareInfo.value.imageUrl
		};
	});
	
	// 自定义按钮分享
	const handleShareButtonClick = () => {
		updateShareInfo();
		
		// 检查环境是否支持uni.share API
		if (typeof uni.share === 'function') {
			uni.share({
				provider: 'weixin',
				title: shareInfo.value.title,
				scene: 'WXSceneSession', // WXSceneSession 微信好友，WXSceneTimeline 朋友圈
				summary: shareInfo.value.title,
				href: shareInfo.value.path,
				imageUrl: shareInfo.value.imageUrl,
				success: () => {
					console.log('分享成功');
					uni.showToast({
						title: '分享成功',
						icon: 'success'
					});
				},
				fail: (err) => {
					console.error('分享失败:', err);
					uni.showToast({
						title: '分享失败',
						icon: 'none'
					});
				}
			});
		} else {
			// 对于不支持 uni.share 的平台，提示用户使用右上角菜单分享
			uni.showToast({
				title: '请使用右上角菜单分享',
				icon: 'none'
			});
		}
	};
	
	// 监听分享信息设置事件
	uni.$on('setShareInfo', (data) => {
		if (data) {
			shareInfo.value = {
				title: data.title || shareInfo.value.title,
				path: data.path || shareInfo.value.path,
				imageUrl: data.imageUrl || shareInfo.value.imageUrl
			};
		}
	});

	// 页面卸载时移除事件监听
	onBeforeUnmount(() => {
		uni.$off('setShareInfo');
	});
	
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

			// 添加轻微延迟，确保页面动画完成
			await new Promise(resolve => setTimeout(resolve, 50));

			const res = await articleApi.getArticleDetal(props.article_id)
			
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
			
			// 处理视频资源
			if (articleData.videoURL) {
				articleData.videoURL = processMediaURL(articleData.videoURL, 'video');
				videoLoadStatus.value = 'loading';
			}
			
			// 处理图片资源，优化图片处理
			if (articleData.images && articleData.images.length) {
				// 清空之前的加载状态
				imageLoadStatus.value = {};
				imageRetryCount.value = {};
				
				// 清除之前的超时计时器
				Object.keys(imageLoadTimeouts.value).forEach(key => {
					clearTimeout(imageLoadTimeouts.value[key]);
				});
				imageLoadTimeouts.value = {};
				
				// 处理图片资源，添加必要的处理逻辑
				articleData.images = articleData.images.map((img, index) => {
					// 确保图片有压缩地址
					if (!img.compressedURL && img.url) {
						img.compressedURL = img.url;
					}
					
					// 处理图片URL，使用统一的媒体处理函数
					if (img.compressedURL) {
						img.compressedURL = processMediaURL(img.compressedURL, 'image');
					}
					
					// 设置每张图片的初始加载状态
					imageLoadStatus.value[index] = 'loading';
					
					// 为每张图片设置加载超时
					imageLoadTimeouts.value[index] = setTimeout(() => {
						if (imageLoadStatus.value[index] === 'loading') {
							console.log(`图片 ${index} 加载超时`);
							imageLoadStatus.value[index] = 'error';
							checkAllImagesLoaded();
						}
					}, IMAGE_LOAD_TIMEOUT);
					
					return img;
				});
				
				// 设置加载状态
				isAnyImageLoading.value = true;
				
				// 设置全局超时，确保即使所有图片都加载失败，也能看到内容
				setTimeout(() => {
					if (isAnyImageLoading.value) {
						console.log('图片加载全局超时，强制显示内容');
						isAnyImageLoading.value = false;
					}
				}, IMAGE_LOAD_TIMEOUT + 2000);
			} else {
				isAnyImageLoading.value = false;
			}
			
			// 获取分类名称
			if (articleData.cate_id) {
				try {
					const cateApi = uniCloud.importObject('cateWx', { customUI: true })
					const cateRes = await cateApi.get(articleData.cate_id)
					if (cateRes.data && cateRes.data[0]) {
						articleData.cate_name = cateRes.data[0].cate_name
						}
					} catch (err) {
					console.error('获取分类名称失败:', err)
				}
			}
			
			// 确保文章对象有所有必要的属性
			articleDetail.value = {
				_id: articleData._id || '',
				content: articleData.content || '',
				user_id: articleData.user_id || '',
				user_nickName: articleData.user_nickName || '',
				user_avatarUrl: articleData.user_avatarUrl || '',
				user_mobile: articleData.user_mobile || '',
				cate_id: articleData.cate_id || '',
				cate_name: articleData.cate_name || '',
				create_time: articleData.create_time || Date.now(),
				look_count: articleData.look_count || 0,
				like_count: articleData.like_count || 0,
				comment_count: articleData.comment_count || 0,
				images: articleData.images || [],
				videoURL: articleData.videoURL || null
			}
			
			articleComment.value = res.comment || []
			
			// 获取评论区显示状态
			try {
				// 从sendOn集合获取显示状态
				const sendOnApi = uniCloud.importObject('sendOn', { customUI: true })
				const sendOnRes = await sendOnApi.get()
				
				// 设置评论区显示状态
				if (sendOnRes && sendOnRes.data && sendOnRes.data.length > 0) {
					navInfo.value = {
						isVisible: sendOnRes.data[0].commentVisibility !== undefined ? 
							sendOnRes.data[0].commentVisibility : true, // 默认显示
						title: '评论区'
					}
					// 设置抽奖模块显示状态
					lotteryVisibility.value = sendOnRes.data[0].lotteryVisibility !== undefined ? 
						sendOnRes.data[0].lotteryVisibility : false // 默认关闭
					console.log('评论区显示状态:', navInfo.value.isVisible)
					console.log('抽奖模块显示状态:', lotteryVisibility.value)
				} else {
					// 如果没有获取到数据，默认显示评论区，关闭抽奖
					navInfo.value = {
						isVisible: true,
						title: '评论区'
					}
					lotteryVisibility.value = false
				}
			} catch (err) {
				console.error('获取显示状态失败:', err)
				// 默认显示评论区，关闭抽奖
				navInfo.value = {
					isVisible: true,
					title: '评论区'
				}
				lotteryVisibility.value = false
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
		isLoadingComments.value = true
		isCommentsLoading.value = true
		
		try {
			// 使用articleApi.getCommentList获取评论列表
			const result = await articleApi.getCommentList(props.article_id)
			
			// 检查结果是否有效
			if (result && result.code === 0 && Array.isArray(result.data)) {
				
				// 创建一个用户ID到手机号的映射
				const userIdToMobileMap = {}
				
				// 如果文章详情中有作者手机号，先添加到映射中
				if (articleDetail.value && articleDetail.value.user_id && articleDetail.value.user_mobile) {
					userIdToMobileMap[articleDetail.value.user_id] = articleDetail.value.user_mobile
				}
				
				// 如果当前用户已登录且有手机号，添加到映射中
				if (userStore.userInfo && userStore.userInfo.uid && userStore.userInfo.mobile) {
					userIdToMobileMap[userStore.userInfo.uid] = userStore.userInfo.mobile
				}
				
				// 处理评论数据，确保每条评论都有必要的字段
				const processedComments = result.data.map(comment => {
					// 确保评论有基本字段
					const processedComment = {
						...comment,
						_id: comment._id || comment.id,
						nickName: comment.nickName || '匿名用户',
						avatarUrl: comment.avatarUrl || '/static/images/default-avatar.png',
						content: comment.content || '',
						create_time: comment.create_time || new Date().getTime(),
						likeCount: comment.like_count || 0,
						isLiked: comment.is_liked || false
					}
					
					// 如果评论中已有手机号，添加到映射中
					if (comment.mobile) {
						userIdToMobileMap[comment.user_id] = comment.mobile
					}
					
					return processedComment
				})
				
				// 获取缺少手机号的用户ID列表
				const userIdsWithoutMobile = processedComments
					.filter(comment => comment.user_id && !userIdToMobileMap[comment.user_id])
					.map(comment => comment.user_id)
				
				// 如果有没有手机号的用户，尝试从数据库获取
				if (userIdsWithoutMobile.length > 0) {
					try {
						// 直接从数据库查询用户信息
						const db = uniCloud.database();
						const userCollection = db.collection('user');
						
						// 查询这些用户ID的用户信息
						const userResult = await userCollection.where({
							_id: db.command.in(userIdsWithoutMobile)
						}).field({
							_id: true,
							mobile: true
						}).get();
						
						if (userResult && userResult.data && userResult.data.length > 0) {
							// 更新映射
							userResult.data.forEach(user => {
								if (user._id && user.mobile) {
									userIdToMobileMap[user._id] = user.mobile;
								}
							});
						} else {
							// 修改：使用userDy云对象的getUserInfo方法逐个获取用户信息，而不是使用不存在的getUsersByIds方法
							try {
								// 逐个查询用户信息
								for (const userId of userIdsWithoutMobile) {
									try {
										const userInfoResult = await userApi.getUserInfo(userId);
										if (userInfoResult && userInfoResult.data && userInfoResult.data.mobile) {
											userIdToMobileMap[userId] = userInfoResult.data.mobile;
										}
									} catch (singleUserError) {
										console.warn(`获取用户 ${userId} 信息失败:`, singleUserError);
									}
								}
							} catch (userApiError) {
								console.error('获取用户信息失败:', userApiError);
							}
						}
					} catch (dbError) {
						console.error('从数据库获取用户手机号失败:', dbError);
					}
				}
				
				// 更新评论中的手机号
				const finalComments = processedComments.map(comment => {
					if (comment.user_id && userIdToMobileMap[comment.user_id]) {
						comment.mobile = userIdToMobileMap[comment.user_id];
					} else if (comment.mobile === '无手机号') {
						// 如果已经设置为"无手机号"，则清空它
						comment.mobile = '';
					}
					// 如果没有手机号，保持原样，不设置为"无手机号"
					return comment;
				})
				
				// 更新评论列表
				articleComment.value = finalComments
				
				// 重置评论显示状态
				showAllComments.value = finalComments.length <= 5;
				displayCommentsCount.value = Math.min(5, finalComments.length);
			} else {
				console.error('获取评论列表失败: 返回结果无效', result)
				articleComment.value = []
				// 重置评论显示状态
				showAllComments.value = true;
				displayCommentsCount.value = 0;
			}
		} catch (error) {
			console.error('获取评论列表出错:', error)
			uni.showToast({
				title: '获取评论失败，请稍后再试',
				icon: 'none'
			})
			articleComment.value = []
			// 重置评论显示状态
			showAllComments.value = true;
			displayCommentsCount.value = 0;
		} finally {
			// 无论是否有评论，都结束加载状态
			isLoadingComments.value = false
			isCommentsLoading.value = false
		}
	}

	// 监听评论数量变化
	watch(() => articleComment.value.length, (newCount, oldCount) => {
	})

	// 添加页面刷新方法
	const refreshPage = async () => {
		try {
			// 设置加载状态
			isLoading.value = true;
			isCommentsLoading.value = true;
			
			// 重新加载文章详情
			await getArticleDetail();
			
			// 重新加载评论列表
			await getCommentList();
			
			// 更新浏览计数
			await updatePageView();
			
			console.log('页面数据已刷新');
		} catch (error) {
			console.error('刷新页面数据失败:', error);
			uni.showToast({
				title: '刷新数据失败',
				icon: 'none'
			});
		} finally {
			// 重置加载状态
			isLoading.value = false;
			isCommentsLoading.value = false;
			
			// 停止下拉刷新动画（如果有）
			uni.stopPullDownRefresh();
		}
	}

	// 添加下拉刷新处理函数
	onPullDownRefresh(() => {
		refreshPage();
	});

	// 提交评论
	const commentSubmit = async () => {
		if (isSubmitting.value) {
			return
		}

		try {
			// 检查用户信息是否完整
			if (!userStore.userInfo.uid || !userStore.userInfo.nickName) {
				throw new Error('用户信息不完整，请重新登录')
			}

			const content = commentContent.value.trim()
			if (!content) {
				return uni.showToast({
					title: '评论内容不能为空',
					icon: 'none',
					duration: 2000
				})
			}

			isSubmitting.value = true

			// 显示加载提示
			uni.showLoading({
				title: '提交中...',
				mask: true
			})

			// 获取用户手机号
			let userMobile = userStore.userInfo.mobile || '';
			if (!userMobile) {
				try {
					const localUserInfo = uni.getStorageSync('userInfo');
					if (localUserInfo && localUserInfo.mobile) {
						userMobile = localUserInfo.mobile;
					}
					} catch (err) {
					console.error('[前端] 获取本地存储的用户信息失败:', err);
				}
			}

			// 构建评论数据
			const commentData = {
				article_id: articleDetail.value._id,
				user_id: userStore.userInfo.uid,
				content: content,
				nickName: userStore.userInfo.nickName || '匿名用户',
				avatarUrl: userStore.userInfo.avatarUrl || '',
				mobile: userMobile || '',
				user_mobile: userMobile || ''
			}

			// 提交评论
			const result = await commentApi.addComment(commentData)

			if (result.code === 0) {
				// 清空评论内容
				commentContent.value = ''
				
				// 显示成功消息
				uni.showToast({
					title: '评论成功',
					icon: 'success',
					duration: 1500,
					success: () => {
						// 等待提示显示完毕后刷新页面
						setTimeout(() => {
							// 刷新整个页面以确保所有数据同步
							refreshPage();
						}, 1000);
					}
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
				// 显示成功消息
				uni.showToast({
					title: '删除成功',
					icon: 'success',
					duration: 1500,
					success: () => {
						// 等待提示显示完毕后刷新页面
						setTimeout(() => {
							// 刷新整个页面以确保所有数据同步
							refreshPage();
						}, 1000);
					}
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

	// 添加常用评论词汇数组
	const commonComments = ref([
		'不错',
		'支持一下',
		'有用',
		'谢谢分享',
		'学习了',
		'点赞',
		'期待更多',
		'很好',
		'厉害',
		'喜欢',
		'太棒了',
		'赞一个',
		'非常好',
		'实用',
		'感谢楼主',
		'分享给朋友',
		'楼主辛苦了',
		'收藏了',
		'关注了',
		'顶一下'
	])
	
	// 随机推荐词汇
	const recommendedComments = ref([])
	
	// 生成随机推荐词汇
	const generateRecommendedComments = () => {
		// 清空原有推荐
		recommendedComments.value = []
		
		// 从常用评论中随机选择4个不重复的词汇
		const tempArray = [...commonComments.value]
		const count = Math.min(4, tempArray.length)
		
		for (let i = 0; i < count; i++) {
			const randomIndex = Math.floor(Math.random() * tempArray.length)
			recommendedComments.value.push(tempArray[randomIndex])
			tempArray.splice(randomIndex, 1)
		}
	}
	
	// 选择推荐词汇
	const selectRecommendedComment = (comment) => {
		commentContent.value = comment
		// 不再自动提交评论
	}
	
	// 打开评论弹窗时生成推荐词汇
	const handleCommentClick = async () => {
		try {
			// 检查登录状态
			const isLoggedIn = await customTestLogin()
			if (!isLoggedIn) {
				// customTestLogin 已经处理了登录跳转
				return
			}

			// 生成推荐词汇
			generateRecommendedComments()
			
			// 显示自定义弹窗
			showCommentPopup.value = true
		} catch (err) {
			console.error('评论点击处理失败:', err)
			uni.showToast({
				title: '操作失败，请重试',
				icon: 'none'
			})
		}
	}
	
	// 添加评论弹窗状态
	const showCommentPopup = ref(false);
	// 弹窗提交评论
	const submitPopupComment = () => {
		if (commentContent.value.trim()) {
			commentSubmit()
			showCommentPopup.value = false
		} else {
			uni.showToast({
				title: '评论内容不能为空',
				icon: 'none'
			})
		}
	}
	
	// 关闭评论弹窗
	const closeCommentPopup = () => {
		showCommentPopup.value = false
		commentContent.value = ''
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

	// 修改 customTestLogin 方法，解决showLoading/hideLoading配对问题
	const customTestLogin = async () => {
		if (isCheckingLogin.value) return false;
		isCheckingLogin.value = true;

		try {
			// 如果已登录，直接返回true
			if (userStore.userInfo && userStore.userInfo.uid) {
				
				// 如果用户已登录但没有手机号，尝试获取手机号
				if (!userStore.userInfo.mobile) {
					
					try {
						// 尝试从本地存储获取
						const localUserInfo = uni.getStorageSync('userInfo');
						if (localUserInfo && localUserInfo.mobile) {
							// 更新用户信息
							userStore.setUserInfo({
								...userStore.userInfo,
								mobile: localUserInfo.mobile
							});
						} else {
							// 尝试从服务器获取用户信息 - 使用userDy云函数代替userKs
							try {
								// 使用userDy云函数获取用户信息
								const userInfoApi = uniCloud.importObject('userDy', { customUI: true });
								const userResult = await userInfoApi.getUserInfo(userStore.userInfo.uid);
								
								if (userResult && userResult.data && userResult.data.mobile) {
									// 更新用户信息
									userStore.setUserInfo({
										...userStore.userInfo,
										mobile: userResult.data.mobile
									});
									// 保存到本地存储
									uni.setStorageSync('userInfo', {
										...userStore.userInfo,
										mobile: userResult.data.mobile
									});
								}
							} catch (err) {
								// 继续执行，不阻止用户操作
							}
						}
					} catch (err) {
						console.error('获取用户手机号失败:', err);
						// 继续执行，不阻止用户操作
					}
				}
				
				isCheckingLogin.value = false;
				return true;
			}
			
			// 检查是否已经显示loading，避免重复显示
			if (!loginLoadingVisible.value) {
				loginLoadingVisible.value = true;
				// 显示加载提示
				uni.showLoading({
					title: '登录中...',
					mask: true
				});
			}
			
			// 不再使用 loginApi.login()，直接跳转到登录页面
			// 获取当前页面路径和参数
			const pages = getCurrentPages();
			const currentPage = pages[pages.length - 1];
			const currentRoute = currentPage.route;
			const currentOptions = currentPage.options || {};
			
			// 构建完整的当前页面URL（包含参数）
			// 确保路径以斜杠开头
			let redirectUrl = '/' + currentRoute;
			const queryParams = [];
			
			for (const key in currentOptions) {
				if (currentOptions.hasOwnProperty(key)) {
					queryParams.push(`${key}=${encodeURIComponent(currentOptions[key])}`);
				}
			}
			
			if (queryParams.length > 0) {
				redirectUrl += '?' + queryParams.join('&');
			}
			
			// 隐藏加载提示
			if (loginLoadingVisible.value) {
				uni.hideLoading();
				loginLoadingVisible.value = false;
			}
			
			// 跳转到登录页面，并传递当前页面作为重定向参数
			uni.navigateTo({
				url: `/pages/login/login?redirect=${encodeURIComponent(redirectUrl)}`,
				complete: () => {
					isCheckingLogin.value = false;
				}
			});
			
			return false;
		} catch (err) {
			console.error('登录检查失败:', err);
			
			// 隐藏加载提示
			if (loginLoadingVisible.value) {
				uni.hideLoading();
				loginLoadingVisible.value = false;
			}
			
			// 显示提示
			uni.showToast({
				title: '登录检查失败，请重试',
				icon: 'none',
				duration: 2000
			});
			
			// 发生错误时也跳转到登录页
			const currentRoute = `/pages/article/articleDetail?article_id=${props.article_id}`;
			const redirectUrl = encodeURIComponent(currentRoute);
			
			// 延迟跳转，让用户看到提示
			setTimeout(() => {
				uni.navigateTo({
					url: `/pages/login/login?redirect=${redirectUrl}`,
					complete: () => {
						isCheckingLogin.value = false;
					}
				});
			}, 1500);
			
			return false;
		} finally {
			isCheckingLogin.value = false;
		}
	};

	// 确保updatePageView函数正确使用uni.$emit发送浏览量更新事件
	const updatePageView = async () => {
		try {
			if (!articleDetail.value._id) {
				return;
			}
			
			const result = await articleApi.updateLookCount(articleDetail.value._id);
			
			if (result && result.code === 0) {
				// 更新本地浏览量显示
				articleDetail.value.look_count = (articleDetail.value.look_count || 0) + 1;
				
				// 使用uni.$emit发送浏览量更新事件，修改为正确的事件名称
				// 发送事件通知其他页面更新浏览量
				uni.$emit('viewCountUpdated', articleDetail.value._id);
				
				console.log('发送浏览量更新事件:', articleDetail.value._id, '浏览量:', articleDetail.value.look_count);
			} else {
				console.error('更新浏览量失败:', result);
			}
		} catch (err) {
			console.error('更新浏览量出错:', err);
			throw err; // 重新抛出错误，让调用者可以捕获
		}
	}

	// 添加保存浏览记录的方法
	const saveViewedArticle = () => {
		try {
			if (!articleDetail.value || !articleDetail.value._id) return
			
			// 获取当前文章的基本信息
			const article = {
				_id: articleDetail.value._id,
				title: articleDetail.value.content ? articleDetail.value.content.substring(0, 30) : '无标题',
				content: articleDetail.value.content || '',
				cate_name: articleDetail.value.cate_name || '未分类',
				create_time: articleDetail.value.create_time,
				view_time: Date.now(), // 浏览时间
				images: articleDetail.value.images && articleDetail.value.images.length > 0 
					? [articleDetail.value.images[0]] // 只保存第一张图片信息
					: []
			}
			
			// 从本地存储获取已浏览文章列表
			let viewedArticles = uni.getStorageSync('viewedArticles') || []
			
			// 检查是否已存在该文章
			const existingIndex = viewedArticles.findIndex(item => item._id === article._id)
			
			if (existingIndex !== -1) {
				// 如果已存在，更新浏览时间并移到列表最前面
				viewedArticles.splice(existingIndex, 1)
			}
			
			// 将当前文章添加到列表最前面
			viewedArticles.unshift(article)
			
			// 限制保存的数量，最多保存50篇
			if (viewedArticles.length > 50) {
				viewedArticles = viewedArticles.slice(0, 50)
			}
			
			// 保存到本地存储
			uni.setStorageSync('viewedArticles', viewedArticles)
		} catch (err) {
			console.error('保存浏览记录失败:', err)
		}
	}

	// 修改页面加载逻辑
	onMounted(async () => {
		try {
			// 获取粉丝群ID
			await fetchFansGroupId()
			
			// 初始化加载状态
			isLoading.value = true;
			isCommentsLoading.value = true;
			
			// 从当前页面获取参数
			const pages = getCurrentPages();
			const currentPage = pages[pages.length - 1];
			const options = currentPage.$page?.options || {};
			
			// 使用当前页面的 options 获取 article_id
			const articleId = options.article_id || props.article_id;
			
			if (!articleId) {
				throw new Error('文章ID不能为空');
			}

			// 先获取文章详情，让用户尽快看到内容
			await getArticleDetail();
			
			// 文章详情加载完成后，就可以显示页面了
			isLoading.value = false;
			
			// 获取视频播放器上下文
			if (articleDetail.value.videoURL) {
				setTimeout(() => {
					videoContext.value = uni.createVideoContext('articleVideo');
				}, 300);
			}
			
			// 获取评论列表
			getCommentList().catch(err => {
				console.error('获取评论列表失败:', err);
				// 确保评论加载状态被重置
				isCommentsLoading.value = false;
				isLoadingComments.value = false;
			});
			
			// 更新浏览量
			updatePageView().catch(err => {
				console.error('更新浏览量失败:', err);
			});
			
			// 添加文章到浏览记录
			saveViewedArticle();
			
			// 显示加群引导弹窗
			setTimeout(() => {
				showGroupGuide.value = true;
			}, 1000);
			
		} catch (err) {
			console.error('页面初始化失败:', err);
			uni.showToast({
				title: '加载失败，请重试',
				icon: 'none'
			});
		} finally {
			// 确保在任何情况下都设置加载状态为false
			isLoading.value = false;
		}
	})

	onUnmounted(() => {
		// 清除定时器
		if (commentRefreshTimer.value) {
			clearInterval(commentRefreshTimer.value)
		}
	})

	// 添加图片预览方法
	const previewImage = (current) => {
		if (!articleDetail.value.images || !articleDetail.value.images.length) return
		
		const urls = articleDetail.value.images.map(img => img.compressedURL || img.url)
		uni.previewImage({
			current: current, // 当前显示图片的索引
			urls: urls, // 需要预览的图片链接列表
			indicator: 'number',
			loop: true,
			fail: (err) => {
				console.error('预览图片失败:', err)
				uni.showToast({
					title: '预览图片失败',
					icon: 'none'
				})
			}
		})
	}

	// 修改点赞处理方法
	const handleCommentLike = (comment_id) => {
		return new Promise(async (resolve, reject) => {
			try {
				// 检查登录状态
				const isLoggedIn = await customTestLogin()
				if (!isLoggedIn) {
					throw new Error('请先登录')
				}

				// 检查参数
				if (!props.article_id || !userStore.userInfo.uid) {
					throw new Error('参数错误')
				}

				// 调用点赞方法
				const params = {
					article_id: props.article_id,
					comment_id: comment_id,
					user_id: userStore.userInfo.uid
				}

				const result = await articleApi.likeComment(params)
				
				if (result.code === 0) {
					resolve(result)
				} else {
					throw new Error(result.message || '操作失败')
				}
			} catch (err) {
				reject(err)
			}
		})
	}

	// 添加文章点赞状态
	const isArticleLiked = ref(false)
	const likeCount = ref(0)
	
	// 获取文章点赞状态
	const getArticleLikeStatus = async () => {
		try {
			if (!props.article_id || !userStore.userInfo.uid) {
				return;
			}
			
			// 先设置默认状态，确保即使请求失败也有基本显示
			if (articleDetail.value) {
				likeCount.value = articleDetail.value.like_count || 0;
			}
			
			try {
				const result = await likeApi.getLikeRecord(props.article_id, userStore.userInfo.uid);
				
				// 更新点赞状态
				isArticleLiked.value = result.res.data && result.res.data.length > 0;
				
				// 更新点赞数
				if (articleDetail.value) {
					likeCount.value = articleDetail.value.like_count || 0;
				} else {
					likeCount.value = result.like_count || 0;
				}
			} catch (err) {
				console.error('获取点赞记录失败:', err);
				// 使用默认值继续执行
				isArticleLiked.value = false;
			}
			
			// 发送事件通知其他组件更新点赞状态
			uni.$emit('updateArticleLikeStatus', {
				articleId: props.article_id,
				isLiked: isArticleLiked.value,
				likeCount: likeCount.value
			});
		} catch (err) {
			console.error('获取点赞状态失败:', err);
			// 使用默认值
			isArticleLiked.value = false;
			if (articleDetail.value) {
				likeCount.value = articleDetail.value.like_count || 0;
			}
		}
	};
	
	// 添加处理轮播图变化的方法
	const handleSwiperChange = (e) => {
		currentImageIndex.value = e.detail.current
	}

	// 添加图片加载完成的处理方法
	const handleImageLoad = (index) => {
		imageLoadStatus.value[index] = 'loaded';
		checkAllImagesLoaded();
	};
	
	// 修改图片加载失败的处理方法
	const handleImageError = (index) => {
		console.error('图片加载失败:', index, articleDetail.value.images && articleDetail.value.images[index]);
		
		// 清除超时计时器
		if (imageLoadTimeouts.value[index]) {
			clearTimeout(imageLoadTimeouts.value[index]);
			delete imageLoadTimeouts.value[index];
		}
		
		// 初始化或增加重试计数
		if (!imageRetryCount.value[index]) {
			imageRetryCount.value[index] = 1;
		} else {
			imageRetryCount.value[index]++;
		}
		
		// 确保文章详情和图片数组存在
		if (!articleDetail.value || !articleDetail.value.images || !articleDetail.value.images[index]) {
			imageLoadStatus.value[index] = 'error';
			checkAllImagesLoaded();
			return;
		}
		
		// 检查图片是否存在且未超过最大重试次数
		if (imageRetryCount.value[index] <= MAX_RETRY_COUNT) {
			const img = articleDetail.value.images[index];
			let shouldRetry = false;
			let newUrl = '';
			
			// 尝试使用原始URL替代压缩URL
			if (img.compressedURL !== img.url && img.url) {
				console.log('尝试使用原始URL加载图片:', img.url);
				newUrl = img.url;
				shouldRetry = true;
			}
			// 尝试添加时间戳避免缓存问题
			else if (img.compressedURL) {
				const timestamp = new Date().getTime();
				newUrl = img.compressedURL.includes('?') 
					? `${img.compressedURL}&t=${timestamp}` 
					: `${img.compressedURL}?t=${timestamp}`;
				shouldRetry = true;
			}
			
			if (shouldRetry && newUrl) {
				// 使用Vue的更新方法确保响应式更新
				articleDetail.value.images[index] = {
					...articleDetail.value.images[index],
					compressedURL: newUrl
				};
				
				// 保持loading状态以允许重试
				imageLoadStatus.value[index] = 'loading';
				
				// 再次设置超时
				imageLoadTimeouts.value[index] = setTimeout(() => {
					if (imageLoadStatus.value[index] === 'loading') {
						imageLoadStatus.value[index] = 'error';
						checkAllImagesLoaded();
					}
				}, IMAGE_LOAD_TIMEOUT);
				
				return;
			}
		}
		
		// 如果多次尝试后仍然失败，标记为错误
		imageLoadStatus.value[index] = 'error';
		console.log(`图片${index}加载失败，已标记为错误状态`);
		checkAllImagesLoaded();
		
		// 如果第一张图片加载失败，立即隐藏加载状态显示界面内容
		if (index === 0) {
			setTimeout(() => {
				isAnyImageLoading.value = false;
			}, 300);
		}
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

	// 处理关注功能
	const handleFollow = async (followedId) => {
		// ... existing code ...
	}
	
	// 处理客服会话
	const handleContact = (e) => {
		// 记录客服会话事件
		console.log('客服会话事件:', e)
		
		// 使用新API获取应用基础信息
		let appInfo;
		try {
			// 尝试使用新API
			appInfo = uni.getAppBaseInfo();
		} catch (error) {
			// 降级处理：如果新API不可用，使用旧API
			console.warn('getAppBaseInfo不可用，使用getSystemInfoSync降级');
			appInfo = uni.getSystemInfoSync();
		}
		
		const isKuaishou = appInfo.AppPlatform === 'kwaishop' || 
						   appInfo.host === 'Kuaishou' || 
						   appInfo.hostName === 'Kuaishou'
		
		// 如果不在快手环境中，提供备选方案
		if (!isKuaishou) {
			// 检查是否支持客服会话
			if (e.detail && e.detail.errMsg && e.detail.errMsg.includes('fail')) {
				// 显示提示
				uni.showModal({
					title: '联系客服',
					content: '请添加客服微信: customer_service_wx',
					confirmText: '复制微信号',
					success: (res) => {
						if (res.confirm) {
							uni.setClipboardData({
								data: 'customer_service_wx',
								success: () => {
									uni.showToast({
										title: '微信号已复制',
										icon: 'success'
									})
								}
							})
						}
					}
				})
			}
		}
	}

	// 文章点击跳转
	const handleArticleClick = (articleId) => {
		// 如果点击的是当前文章，不做任何操作
		if (articleId === props.article_id) {
			return
		}
		
		// 跳转到新的文章详情页
		uni.navigateTo({
			url: `/pages/article/articleDetail?article_id=${articleId}`,
			success: () => {
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
		// 调用推荐组件的加载更多方法
		if (tuijianRef.value) {
			tuijianRef.value.loadMore()
		}
	})

	// 处理点赞变化
	const handleLikeChange = async (data) => {
		// 检查用户是否登录
		const isLoggedIn = await customTestLogin();
		if (!isLoggedIn) {
			console.log('用户未登录，无法点赞');
			return;
		}
		
		// 确保有用户信息
		if (!userStore.userInfo || !userStore.userInfo.uid) {
			console.error('用户信息不完整，无法点赞');
			uni.showToast({
				title: '登录信息异常，请重新登录',
				icon: 'none'
			});
			return;
		}
		
		// 获取用户信息
		const userInfo = {
			uid: userStore.userInfo.uid,
			nickName: userStore.userInfo.nickName || '匿名用户',
			avatarUrl: userStore.userInfo.avatarUrl || '/static/images/default-avatar.png'
		};
		
		console.log('点赞用户信息:', userInfo);
		
		// 更新文章详情中的点赞数
		if (articleDetail.value) {
			articleDetail.value.like_count = data.likeCount;
		}
		
		// 更新点赞状态
		isArticleLiked.value = data.isLiked;
		likeCount.value = data.likeCount;
	}

	// 添加视频事件处理
	const handleVideoLoad = () => {
		videoLoadStatus.value = 'loaded';
	};
	
	const handleVideoError = () => {
		videoLoadStatus.value = 'error';
		uni.showToast({
			title: '视频加载失败',
			icon: 'none'
		});
	};

	// 监听来自其他页面的状态变化事件
	uni.$on('commentVisibilityChanged', (newState) => {
		console.log('收到评论显示状态变化事件:', newState)
		if (navInfo.value) {
			navInfo.value.isVisible = newState
		}
	})
	
	uni.$on('lotteryVisibilityChanged', (newState) => {
		console.log('收到抽奖模块显示状态变化事件:', newState)
		lotteryVisibility.value = newState
	})
	
	// 页面卸载时移除事件监听
	onUnmounted(() => {
		// 移除评论显示状态变化事件监听
		uni.$off('commentVisibilityChanged')
		uni.$off('lotteryVisibilityChanged')
		
		// 清除其他可能的监听器和定时器
		uni.$off('setShareInfo');
		uni.$off('viewCountUpdated');
		uni.$off('updateArticleLikeStatus');
		
		// 移除粉丝群ID变化事件监听
		uni.$off('fansGroupIdChanged')
	})

	// 切换抽奖组件显示状态
	const toggleLotteryDraw = () => {
		if (!canDrawLottery.value) {
			uni.showToast({
				title: '至少需要3条评论才能抽奖',
				icon: 'none'
			})
			return
		}
		showLottery.value = !showLottery.value
	}
	
	// 从评论中选择幸运用户
	const selectLuckyUser = (commentIndex) => {
		if (!articleComment.value || articleComment.value.length === 0) {
			return null
		}
		
		// 如果指定了索引，使用该索引，否则随机选择
		if (commentIndex !== undefined) {
			return articleComment.value[commentIndex % articleComment.value.length]
		}
		
		// 随机选择一个评论
		const randomIndex = Math.floor(Math.random() * articleComment.value.length)
		return articleComment.value[randomIndex]
	}
	
	// 处理抽奖结果
	const handleLotteryResult = (result) => {
		// 根据结果类型选择不同数量的幸运用户
		let winnerCount = 1
		
		if (result.includes('8元')) {
			winnerCount = 1
		} else if (result.includes('2元')) {
			winnerCount = 1
		} else if (result.includes('20元')) {
			winnerCount = 1
		} else if (result.includes('谢谢参与')) {
			winnerCount = 1
		}
		
		// 随机选择用户并获取该用户的所有评论
		const winners = []
		const commentsCopy = [...articleComment.value]
		
		// 确保有足够的评论用户
		if (commentsCopy.length > 0) {
			// 随机选择一个用户
			const randomIndex = Math.floor(Math.random() * commentsCopy.length)
			const selectedUser = commentsCopy[randomIndex]
			
			// 获取所有相同用户的评论
			const sameUsers = articleComment.value.filter(comment => comment.nickName === selectedUser.nickName)
			winners.push(...sameUsers)
		}
		
		selectedWinner.value = winners
		
		
	}

	// 处理加入粉丝群事件
	const handleJoinGroup = (e) => {
		console.log('加入群聊回调', e.detail);
		
		// 检查回调消息
		if (e.detail) {
			// 成功情况：有errMsg为"onJoinGroup:ok"或errNo为0
			if ((e.detail.errMsg && e.detail.errMsg === "onJoinGroup:ok") || 
			    (e.detail.errNo !== undefined && e.detail.errNo === 0)) {
				uni.showToast({
					title: '加入群聊成功',
					icon: 'success'
				});
				return;
			}
			
			// 失败情况：有错误消息
			if (e.detail.errMsg && e.detail.errMsg !== "onJoinGroup:ok") {
				uni.showToast({
					title: '加入失败: ' + e.detail.errMsg,
					icon: 'none'
				});
				return;
			}
			
			// 失败情况：有错误码但不为0
			if (e.detail.errNo !== undefined && e.detail.errNo !== 0) {
				uni.showToast({
					title: '加入失败: ' + (e.detail.errMsg || '错误码: ' + e.detail.errNo),
					icon: 'none'
				});
				return;
			}
		}
		
		// 未知情况
		console.log('未知的群聊回调结果', e);
	}

	// 添加引导加群弹窗状态
	const showGroupGuide = ref(false)
	
	// 关闭加群引导弹窗
	const closeGroupGuide = () => {
		showGroupGuide.value = false;
		// 记录用户已关闭过弹窗，避免重复显示
		try {
			uni.setStorageSync('hasClosedGroupGuide', 'true');
		} catch (e) {
			console.error('保存弹窗关闭状态失败', e);
		}
	}
	
	// 处理加群引导点击
	const handleGuideJoinGroup = () => {
		closeGroupGuide();
		// 标记已查看引导
		try {
			uni.setStorageSync('hasSeenGroupGuide', 'true');
		} catch (e) {
			console.error('保存引导状态失败', e);
		}
	}

	// 监听来自其他页面的粉丝群ID变化事件
	uni.$on('fansGroupIdChanged', (newId) => {
		console.log('收到粉丝群ID变化事件:', newId)
		FANS_GROUP_ID.value = newId
	})
</script>

<template>
	<view class="article-detail-container">
		<!-- 替换原有的加载页面，使用与首页相同的加载样式 -->
		<view class="custom-loading-container" v-if="isLoading && !articleDetail._id">
			<view class="loading-spinner">
				<uni-icons type="spinner-cycle" size="48" color="#399bfe"></uni-icons>
			</view>
			<text class="loading-text">内容加载中...</text>
		</view>

		<view class="article-detail-container" v-show="articleDetail._id">
			<scroll-view 
				class="article-detail-scroll" 
				scroll-y 
				@scrolltolower="tuijianRef?.loadMore()"
				:show-scrollbar="false"
				:lower-threshold="150"
				enable-back-to-top
			>
				<view class="article-detail fade-in-animation">
					<!-- 头部文章内容 -->
					<view class="articleHead">
						<!-- 用户信息区域 -->
						<view class="article-user-info">
							<view class="user-avatar-container">
								<image class="user-avatar" :src="articleDetail.user_avatarUrl || '/static/images/default-avatar.png'" mode="aspectFill"></image>
							</view>
							<view class="user-info-container">
								<view class="user-name">{{articleDetail.user_nickName || '未知用户'}}</view>
								<view class="user-meta">
									<view class="meta-row">
										<text class="time-text">{{formatTime(articleDetail.create_time)}}</text>
										<view class="view-count">
											<text class="view-separator">|</text>
											<text class="view-text">{{articleDetail.look_count || 0}}浏览</text>
										</view>
									</view>
								</view>
							</view>
							<view class="contact-button" @click="handleCall">
								<uni-icons color="#5cb85c" custom-prefix="icon" type="lishuai-dianhua" size="22"></uni-icons>
							</view>
						</view>
						
						<!-- 时间和浏览信息区域 -->
						<view class="time-views-container" style="display:none;">
							<text class="time-text">{{formatTime(articleDetail.create_time)}}</text>
							<text class="views-text">{{articleDetail.look_count || 0}}浏览</text>
						</view>
						
						<!-- 视频和图片区域 -->
						<view class="media-container">
							<!-- 视频区域 - 单独显示 -->
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
									@loadedmetadata="handleVideoLoad"
								></video>
							</view>
							
							<!-- 图片显示区域 - 单独显示 -->
							<view class="articleImages" v-if="articleDetail.images && articleDetail.images.length">
								<!-- 图片网格 -->
								<view class="image-grid">
									<view 
										v-for="(item, index) in articleDetail.images.slice(0, articleDetail.images.length > 9 ? 9 : articleDetail.images.length)" 
										:key="index"
										:class="[
											'image-grid-item',
											{
												'single-image': articleDetail.images.length === 1,
												'double-image': articleDetail.images.length === 2,
												'triple-image': articleDetail.images.length === 3,
												'grid-image': articleDetail.images.length > 3
											}
										]"
										@click="previewImage(item.compressedURL || item.url)"
									>
										<!-- 图片加载失败占位符 -->
										<view class="image-placeholder" v-if="imageLoadStatus[index] === 'error'">
											<uni-icons type="image" size="24" color="#999999"></uni-icons>
											<text>加载失败</text>
										</view>
										
										<!-- 图片 -->
										<image 
											:src="item.compressedURL || item.url" 
											mode="aspectFill" 
											@load="handleImageLoad(index)"
											@error="handleImageError(index)"
											:style="{opacity: imageLoadStatus[index] === 'loaded' ? 1 : 0}"
										></image>
										
										<!-- 更多图片提示 -->
										<view class="more-images" v-if="index === 8 && articleDetail.images.length > 9">
											<text>+{{articleDetail.images.length - 9}}</text>
										</view>
									</view>
								</view>
								
								<!-- 图片计数器 -->
								<view class="image-counter" v-if="articleDetail.images.length > 1">
									{{articleDetail.images.length}}张图片
								</view>
							</view>
						</view>
					</view>
					
					<!-- 操作功能区 - 移除了重复的时间和浏览量 -->
					<view class="article-info" style="display: none;">
					</view>
					
					<!-- 新的元信息显示区域 -->
					<view class="article-meta-info" style="display: none;">
						<view class="meta-item date">
							<uni-icons type="calendar" size="18" color="#666666"></uni-icons>
							<text>{{formatTime(articleDetail.create_time)}}</text>
						</view>
						<view class="meta-divider"></view>
						<view class="meta-item views">
							<uni-icons type="eye" size="18" color="#666666"></uni-icons>
							<text>{{articleDetail.look_count || 0}}浏览</text>
						</view>
						<view class="meta-divider"></view>
						<view class="meta-item category" v-if="articleDetail.cate_name">
							<uni-icons type="tag" size="18" color="#399bfe"></uni-icons>
							<text>{{articleDetail.cate_name}}</text>
						</view>
					</view>
					
					<!-- 文章内容区域 -->
					<view class="articleContent">
						<view class="articleText" v-if="articleDetail.content">
							<text class="category-name">{{articleDetail.content}}</text>
						</view>
					</view>

					<!-- 评论 -->
					<view class="comment-container" v-if="navInfo && navInfo.isVisible">
						<view class="comment-section">
							
							<!-- 评论加载中提示 -->
							<view v-if="isCommentsLoading && !articleComment.length" class="comment-loading">
								<uni-load-more status="loading" :contentText="{ contentrefresh: '评论加载中...' }"></uni-load-more>
							</view>
							
							<!-- 添加空状态提示 -->
							<view v-else-if="!isCommentsLoading && articleComment.length === 0" class="empty-comment">
								<uni-icons type="chat" size="50" color="#CCCCCC"></uni-icons>
								<text>暂无评论</text>
							</view>
							
							<!-- 评论输入框 -->
							<view class="comment-input" @click="handleCommentClick">
								<uni-icons type="chat" size="20" color="#999"></uni-icons>
								<text class="comment-placeholder">写评论...</text>
							</view>
						
							<!-- 评论列表组件 -->
							<comment-list 
								:comments="displayedComments" 
								:articleId="article_id"
								:articleUserId="articleDetail.user_id"
								:showMobile="true"
								@delComment="handelDelComment"
							></comment-list>
							
							<!-- 添加查看更多评论按钮 -->
							<view 
								v-if="articleComment.length > displayCommentsCount && !showAllComments" 
								class="load-more-comments" 
								@click="loadMoreComments"
							>
								<text>查看更多评论 ({{displayCommentsCount}}/{{articleComment.length}})</text>
								<uni-icons type="bottom" size="12" color="#666"></uni-icons>
							</view>
							
							<!-- 添加收起评论按钮 -->
							<view 
								v-if="articleComment.length > 5 && showAllComments" 
								class="load-more-comments fold" 
								@click="foldComments"
							>
								<text>收起</text>
								<uni-icons type="top" size="12" color="#666"></uni-icons>
							</view>
							
							<!-- 评论区域 -->
							<view class="comment-container" v-if="navInfo && navInfo.isVisible">
								<view class="comment-section">
									<!-- 评论相关内容 -->
								</view>
							</view>

							<!-- 抽奖模块 -->
							<view class="lottery-container" v-if="lotteryVisibility">
								<view class="lottery-section">
									
									<view class="lottery-content">
										<LotteryDraw 
											:commenters="articleComment" 
											@lottery-result="handleLotteryResult"
										/>
									</view>
								</view>
							</view>
						</view>
					</view>
					
					<!-- 详情图展示 - 在文章内容下方重复展示图片 -->
					<view class="article-detail-images" v-if="articleDetail.images && articleDetail.images.length" style="border-top: 10px solid #f5f5f5;">
						<view class="detail-images-title">
							<view class="line"></view>
							<text>详情图片 ({{articleDetail.images.length}}张)</text>
							<view class="line"></view>
						</view>
						<view class="detail-images-container">
							
							<view v-for="(item, index) in articleDetail.images" :key="index" class="detail-image-wrapper">
								<image 
									class="detail-image"
									:src="item.compressedURL || item.url" 
									mode="widthFix"
									@click="previewImage(item.compressedURL || item.url)"
								></image>
							</view>
						</view>
					</view>
					
					<!-- 替换原有的推荐部分为新组件 -->
					<tuijian 
						ref="tuijianRef"
						:current-article-id="article_id"
						:cate_id="articleDetail.cate_id"
						@click="handleArticleClick"
					/>
				</view>
			</scroll-view>

			
		</view>

		<!-- 底部栏 -->
		<view class="footer">
			<view class="footer-content">
				<view class="action-item" @click="goToHome">
					<uni-icons type="home" size="24" color="#444444"></uni-icons>
					<view class="text">
						首页
					</view>
				</view>
				
				<button open-type="share" class="action-item share-btn">
					<text class="icon lishuai-zhuanfa" style="font-size: 24px; color: #444444;"></text>
					<view class="text">
						转发
					</view>
				</button>
				
				<!-- 添加间隔元素 -->
				<view class="spacer"></view>
				
				<button 
					open-type="joinGroup" 
					:group-id="FANS_GROUP_ID"
					@joingroup="handleJoinGroup"
					class="group-btn"
				>
					粉丝群
				</button>
				
				<view class="call-btn" @click="handleCall">
					打电话
				</view>
			</view>
		</view>
		
		<!-- 自定义评论弹窗 -->
		<view class="comment-popup" v-if="showCommentPopup">
			<view class="comment-popup-mask" @click="closeCommentPopup"></view>
			<view class="comment-popup-content">
				<view class="comment-popup-header">
					<text class="comment-popup-title">发表评论</text>
					<view class="comment-popup-close" @click="closeCommentPopup">
						<uni-icons type="close" size="20" color="#999"></uni-icons>
					</view>
				</view>
				
				<!-- 快速评论词汇 -->
				<view class="quick-comments">
					<view 
						v-for="(comment, index) in recommendedComments" 
						:key="index"
						class="quick-comment-item"
						@click="selectRecommendedComment(comment)"
					>
						{{comment}}
					</view>
				</view>
				
				<view class="comment-popup-body">
					<textarea 
						class="comment-textarea" 
						v-model="commentContent" 
						placeholder="评论点什么..." 
						auto-focus 
						maxlength="200"
						auto-height
					></textarea>
					<view class="comment-length">{{commentContent.length}}/200</view>
				</view>
				<view class="comment-popup-footer">
					<view class="comment-cancel-btn" @click="closeCommentPopup">取消</view>
					<view class="comment-submit-btn" @click="submitPopupComment">发布</view>
				</view>
			</view>
		</view>

		<!-- 加群引导弹窗 -->
		<view class="group-guide-popup" v-if="showGroupGuide">
			<view class="group-guide-mask" @click="closeGroupGuide"></view>
			<view class="group-guide-content">
				<view class="group-guide-close" @click="closeGroupGuide">
					<!-- 移除uni-icons，使用CSS创建的X图标 -->
				</view>
				<view class="group-guide-title">加入粉丝群</view>
				<view class="group-guide-desc">加入我们的粉丝群，获取更多优质内容和互动机会！</view>
				
				<!-- 使用文章图片代替静态图片 -->
				<view class="group-guide-image-grid" v-if="articleDetail.images && articleDetail.images.length">
					<view class="grid-item" v-for="(item, index) in articleDetail.images.slice(0, 6)" :key="index">
						<image :src="item.compressedURL || item.url" mode="aspectFill" @click="previewImage(item.compressedURL || item.url)"></image>
					</view>
				</view>
				<!-- 无图片时的备用显示 -->
				<view class="group-guide-image-grid" v-else>
					<view class="grid-item" v-for="index in 6" :key="index">
						<image :src="`/static/images/${index}.png`" mode="aspectFill"></image>
					</view>
				</view>
				
				<!-- 加群引导弹窗的按钮修改 -->
				<button 
					class="group-guide-button"
					open-type="joinGroup" 
					:group-id="FANS_GROUP_ID"
					@joingroup="handleJoinGroup"
					@click="handleGuideJoinGroup"
				>
					点击加入粉丝群
				</button>
			</view>
		</view>
	</view>
</template>

<style lang="scss" scoped>
	.article-detail-container {
		display: flex;
		flex-direction: column;
		height: 100vh;
		background-color: #fff;
		padding-bottom: 160rpx;
		border: none;
		box-sizing: border-box;
	}

	.article-detail-scroll {
		flex: 1;
		height: calc(100vh - 120rpx);
		-webkit-overflow-scrolling: touch;
	}

	.article-detail {
		padding-top: 128rpx; /* 移除 calc(128rpx + env(safe-area-inset-top)) */
		padding-bottom: 120rpx;
		background-color: #fff;
	}

	.articleHead {
		.media-container {
			display: flex;
			flex-direction: column;
			padding: 24rpx 24rpx 0rpx 24rpx;
			
			// 视频播放区域
			.articleVideo {
				position: relative;
				width: 100%;
				height: 422rpx;
				border-radius: 8rpx;
				background-color: #f5f5f5;
				margin-bottom: 20rpx;
				overflow: hidden;
				
				.video-player {
					position: absolute;
					top: 0;
					left: 0;
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
			}
			
			.articleImages {
				position: relative;
				width: 100%;
				border-radius: 8rpx;
				overflow: hidden;
				margin-bottom: 20rpx;
				background-color: #f5f5f5;
				
				.image-grid {
					display: flex;
					flex-wrap: wrap;
					padding: 4rpx;
					box-sizing: border-box;
					
					.image-grid-item {
						position: relative;
						overflow: hidden;
						border-radius: 8rpx;
						margin: 4rpx;
						
						// 单张图片
						&.single-image {
							width: calc(100% - 8rpx);
							height: 400rpx;
						}
						
						// 两张图片
						&.double-image {
							width: calc(50% - 8rpx);
							height: 300rpx;
						}
						
						// 三张图片
						&.triple-image {
							width: calc(33.33% - 8rpx);
							height: 200rpx;
						}
						
						// 九宫格布局
						&.grid-image {
							width: calc(33.33% - 8rpx);
							height: 200rpx;
						}
						
						image {
							width: 100%;
							height: 100%;
							object-fit: cover;
							transition: opacity 0.3s ease;
						}
						
						.image-placeholder {
							position: absolute;
							top: 0;
							left: 0;
							width: 100%;
							height: 100%;
							display: flex;
							flex-direction: column;
							justify-content: center;
							align-items: center;
							background-color: #f5f5f5;
							
							text {
								margin-top: 10rpx;
								font-size: 24rpx;
								color: #999;
							}
						}
						
						.more-images {
							position: absolute;
							top: 0;
							left: 0;
							width: 100%;
							height: 100%;
							background-color: rgba(0, 0, 0, 0.5);
							display: flex;
							justify-content: center;
							align-items: center;
							
							text {
								color: #fff;
								font-size: 32rpx;
								font-weight: bold;
							}
						}
					}
				}
				
				.image-counter {
					position: absolute;
					right: 20rpx;
					background-color: rgba(0, 0, 0, 0.5);
					color: #fff;
					padding: 4rpx 12rpx;
					border-radius: 20rpx;
					font-size: 24rpx;
				}
			}
		}
	}

	.articleContent {
		padding: 30rpx;
		font-size: 28rpx;
		line-height: 1.8;
		background-color: #fff;
		
		min-height: 24rpx; /* 添加最小高度，确保即使内容为空也有高度 */
		display: block; /* 确保始终显示 */
		
		.articleText {
			padding: 0;
			color: #333;
			word-break: break-word;
			min-height: 1.8em; /* 添加最小高度 */
			padding: 0 24rpx;
			
			.call-text-button {
				color: #0066cc;
				margin-left: 10rpx;
				cursor: pointer;
				display: inline-flex;
				align-items: center;
				justify-content: center;
				vertical-align: middle;
				gap: 4rpx;
			}
		}
	}

	.comment-container {
		margin: 20rpx;
		border: 1px solid #f3f3f361;
		border-radius: 12rpx;
		background-color: #ffffff;
		overflow: hidden;
	}

	.comment-input {
		margin-top: 30rpx;
		padding: 20rpx 30rpx;
		background: #f8f8f8;
		border-radius: 40rpx;
		color: #999;
		font-size: 28rpx;
		display: flex;
		align-items: center;
		border: 1px solid #eee;
		box-shadow: 0 2rpx 6rpx rgba(0, 0, 0, 0.05);
		
		.comment-placeholder {
			margin-left: 15rpx;
		}
		
		&:active {
			background: #f0f0f0;
		}
	}

	.comment-loading, .empty-comment {
		padding: 40rpx 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
	}

	.comment-popup-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 20rpx;
		
		.comment-popup-title {
			font-size: 32rpx;
			font-weight: 600;
			color: #333;
			letter-spacing: 2rpx;
		}
		
		.comment-popup-close {
			padding: 10rpx;
			border-radius: 50%;
			
			&:active {
				background-color: #f5f5f5;
			}
		}
	}
	
	.comment-popup-body {
		position: relative;
		margin-bottom: 30rpx;
		
		.comment-textarea {
			width: 100%;
			min-height: 180rpx;
			padding: 20rpx;
			box-sizing: border-box;
			background-color: #f9f9f9;
			border-radius: 12rpx;
			font-size: 28rpx;
			line-height: 1.6;
			letter-spacing: 1rpx;
			color: #333;
		}
		
		.comment-length {
			position: absolute;
			right: 20rpx;
			bottom: 10rpx;
			font-size: 24rpx;
			color: #999;
		}
	}
	
	.comment-popup-footer {
		display: flex;
		justify-content: flex-end;
		
		.comment-cancel-btn, .comment-submit-btn {
			padding: 16rpx 40rpx;
			border-radius: 40rpx;
			font-size: 28rpx;
			margin-left: 20rpx;
			letter-spacing: 2rpx;
			font-weight: 500;
			
			&:active {
				opacity: 0.8;
			}
		}
		
		.comment-cancel-btn {
			color: #666;
			background-color: #f5f5f5;
		}
		
		.comment-submit-btn {
			color: #fff;
			background-color: #399bfe;
			box-shadow: 0 4rpx 8rpx rgba(57, 155, 254, 0.3);
		}
	}

	.footer {
		position: fixed;
		left: 0;
		right: 0;
		bottom: 0;
		background-color: #fff;
		border-top: 1px solid #f0f0f0;

		.footer-content {
			display: flex;
			padding: 20rpx 30rpx;
			height: 120rpx;
			align-items: center;
			justify-content: space-between;
			
			/* 间隔元素样式 */
			.spacer {
				width: 40rpx;
				flex: 0 0 80rpx;
			}
			
			/* 重置按钮样式 */
			.footer .footer-content button.action-item,
			.footer .footer-content button.share-btn {
				background: none;
				margin: 0;
				padding: 0;
				border: none;
				overflow: visible;
				-webkit-appearance: none;
				-moz-appearance: none;
				appearance: none;
				display: flex;
				flex-direction: column;
				align-items: center;
				width: 40rpx;
				font-size: 24rpx;
				color: #666;
				
				&::after {
					display: none;
					border: none;
				}
			}
			
			.action-item, button.action-item {
				display: flex;
				flex-direction: column;
				align-items: center;
				background: transparent;
				border: none;
				padding: 0;
				margin: 0;
				font-size: 24rpx;
				color: #666;
				width: 80rpx !important;
				flex: 0 0 80rpx;
				box-sizing: border-box;
				
				&::after {
					border: none;
				}
				
				.text {
					margin-top: 8rpx;
					font-size: 24rpx;
					width: 100%;
					text-align: center;
				}
				
				&:active {
					opacity: 0.7;
				}
			}
			
			.group-btn {
				background-color: #FF4757;
				color: #FFFFFF;
				height: 76rpx;
				line-height: 76rpx;
				font-size: 28rpx;
				border-radius: 5rpx; // 将圆角调整为5rpx
				padding: 0 40rpx;
				margin: 0;
				border: none;
				flex-shrink: 0;
				box-shadow: 0 4rpx 8rpx rgba(255, 71, 87, 0.3);
				text-align: center; // 确保文字居中显示
				
				&::after {
					border: none;
				}
				
				&:active {
					opacity: 0.9;
					transform: scale(0.98);
				}
			}
			
			.call-btn {
				flex: 1;
				max-width: 240rpx;
				height: 76rpx;
				line-height: 76rpx;
				text-align: center; // 确保文字居中显示
				background-color: #399bfe;
				color: #fff;
				border-radius: 5rpx;
				font-size: 28rpx;
				padding-left: 10rpx;
				
				&:active {
					opacity: 0.9;
					transform: scale(0.98);
				}
			}
			
			/* 转发按钮特殊样式 */
			.share-btn {
				line-height: normal !important;
				width: 80rpx !important;
				box-sizing: border-box;
				
				.text {
					margin-top: 8rpx;
					font-size: 24rpx;
					text-align: center;
					width: 100%;
				}
			}
		}
	}

	.custom-play-pause {
		position: absolute;
					top: 20rpx;
		right: 20rpx;
		background-color: rgba(0, 0, 0, 0.6);
		color: white;
		z-index: 10;
		width: auto;
		min-width: 120rpx;
		padding: 8rpx 20rpx;
		border-radius: 30rpx;
		font-size: 26rpx;
		text-align: center;
		border: 1px solid rgba(255,255,255,0.2);
		
		&:active {
			background-color: rgba(0, 0, 0, 0.8);
		}
	}

	.article-info {
		display: flex;
		align-items: center;
		padding: 0rpx 24rpx 15rpx;
		background-color: #fff;
		margin: 0;
		border-radius: 0;
		box-shadow: none;
		justify-content: flex-start; /* 修改为靠左对齐 */
		flex-wrap: wrap; /* 添加换行显示 */
		
		.info-item {
			display: flex;
			align-items: center;
			margin-right: 20rpx; /* 统一使用margin-right */
			
			&:first-child {
				margin-left: 0;
			}
			
			&:last-child {
				margin-right: 0;
			}
			
			.info-text {
				margin-left: 8rpx;
				font-size: 26rpx;
				color: #999;
			}
		}
	}

	.caozuo {
		display: none;
	}

	.image-counter {
		position: absolute;
		right: 20rpx;
		top: 20rpx;
		background-color: rgba(0, 0, 0, 0.6);
					color: #fff;
					padding: 8rpx 20rpx;
					border-radius: 30rpx;
					font-size: 24rpx;
					z-index: 2;
		display: flex;
		align-items: center;
		box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.2);
		
		&::before {
			content: '';
			display: inline-block;
			width: 24rpx;
			height: 24rpx;
			background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white"><path d="M0 0h24v24H0z" fill="none"/><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg>');
			background-size: contain;
			margin-right: 8rpx;
		}
	}

	.manual-mode-indicator {
		position: absolute;
		left: 20rpx;
		top: 20rpx;
		background-color: rgba(0, 0, 0, 0.5);
		color: #fff;
		padding: 6rpx 16rpx;
		border-radius: 20rpx;
		font-size: 24rpx;
		z-index: 2;
		display: none; /* 隐藏手动模式提示 */
		align-items: center;
		gap: 6rpx;
		animation: pulse 1.5s infinite;
	}
	
	@keyframes pulse {
		0% {
			opacity: 0.7;
		}
		50% {
			opacity: 1;
		}
		100% {
			opacity: 0.7;
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
	
	// 客服按钮样式
	.customer-service-btn {
		position: fixed;
		right: 30rpx;
		bottom: 180rpx;
		z-index: 100;
		background-color: #FF4D4F; // 红色背景
		color: #ffffff;
		border-radius: 50rpx;
		padding: 16rpx 30rpx;
		font-size: 28rpx;
					display: flex;
					align-items: center;
					justify-content: center;
		box-shadow: 0 4rpx 12rpx rgba(255, 77, 79, 0.3);
		border: none;
		line-height: 1.5;
		
		&::after {
			border: none;
		}
		
		text {
			margin-left: 10rpx;
		}
		
		&:active {
			transform: scale(0.95);
			opacity: 0.9;
		}
	}

	.comment-header-bar {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 20rpx 0;
		
		.comment-title {
			font-size: 32rpx;
			font-weight: 500;
			color: #333;
		}
	}

	/* 添加类目信息样式 */
	.category-info {
		padding: 20rpx 24rpx 16rpx;
		background-color: #fff;
		
		.category-tag {
			display: inline-flex;
			align-items: center;
			padding: 8rpx 20rpx;
			background-color: rgba(57, 155, 254, 0.1);
			border-radius: 24rpx;
			
			text {
				font-size: 26rpx;
				color: #399bfe;
				margin-left: 8rpx;
				font-weight: 500;
			}
		}
	}

	

	.category-name {
		font-size: 32rpx;
	}

	.category-name1 {
		color: #399bfe;
	}

	.load-more {
		padding: 20rpx 0;
		display: flex;
		justify-content: center;
		align-items: center;
	}
	
	/* 点赞相关样式 */
	.like-item {
		cursor: pointer;
		transition: all 0.2s;
		position: relative;
		
		&:active {
			transform: scale(1.1);
		}
	}
	
	.info-text.liked {
		color: #ff6b6b;
	}
	
	.liked-text {
		color: #ff6b6b;
	}
	
	/* 点赞动画 */
	@keyframes like-animation {
		0% {
			transform: scale(1);
		}
		25% {
			transform: scale(1.2);
		}
		50% {
			transform: scale(0.95);
		}
		75% {
			transform: scale(1.1);
		}
		100% {
			transform: scale(1);
		}
	}
	
	.like-animation {
		animation: like-animation 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
	}
	
	/* 点赞图标动画 */
	@keyframes heart-beat {
		0% {
			transform: scale(1);
		}
		15% {
			transform: scale(1.3);
		}
		30% {
			transform: scale(1);
		}
		45% {
			transform: scale(1.2);
		}
		60% {
			transform: scale(1);
		}
		100% {
			transform: scale(1);
		}
	}
	
	.action-item[data-action="like"] uni-icons,
	.like-item uni-icons {
		transition: transform 0.2s ease;
	}
	
	.action-item[data-action="like"]:active uni-icons,
	.like-item:active uni-icons {
		transform: scale(1.2);
	}
	
	.action-item[data-action="like"].like-animation uni-icons,
	.like-item.like-animation uni-icons {
		animation: heart-beat 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275);
	}

	.custom-rate-control {
		position: absolute;
		top: 20rpx;
		left: 20rpx;
		background-color: rgba(0, 0, 0, 0.6);
		color: white;
		z-index: 10;
		width: auto;
		min-width: 120rpx;
		padding: 8rpx 20rpx;
		border-radius: 30rpx;
		font-size: 26rpx;
		text-align: center;
		border: 1px solid rgba(255,255,255,0.2);
		
		&:active {
			background-color: rgba(0, 0, 0, 0.8);
		}
	}

	/* 底部操作栏样式 */
	.article-actions {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 20rpx 30rpx;
		border-top: 1px solid #f0f0f0;
		background-color: #fff;
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		z-index: 100;
		box-shadow: 0 -2rpx 10rpx rgba(0, 0, 0, 0.05);
	}

	.left-actions, .right-actions {
		display: flex;
		align-items: center;
	}

	.left-actions {
		flex: 1;
	}

	.info-item {
		display: flex;
		align-items: center;
		margin-right: 0rpx;
		color: #999;
	}

	.info-text {
		font-size: 24rpx;
		margin-left: 8rpx;
	}

	.right-actions {
		display: flex;
		align-items: center;
	}

	.action-item {
		margin-right: 20rpx;
	}

	.call-btn {
		flex: 1;
		max-width: 240rpx;
		height: 76rpx;
		line-height: 76rpx;
		text-align: center; // 确保文字居中显示
		background-color: #399bfe;
		color: #fff;
		border-radius: 5rpx;
		font-size: 28rpx;
		
		&:active {
			opacity: 0.9;
			transform: scale(0.98);
		}
	}

	/* 在组件的<style>部分的末尾添加 */
	:deep(.icon) {
		font-family: "icon" !important;
	}

	/* 添加图片底部信息栏样式 */
	.image-info-bar {
		position: absolute;
		bottom: 20rpx;
		right: 20rpx;
		background-color: rgba(0, 0, 0, 0.5);
		display: inline-table;
		width: auto;
		text-align: right;
		padding: 10rpx 20rpx;
		color: #fff;
		z-index: 2;
		border-radius: 8rpx;
		
		.info-item {
			display: flex;
			align-items: center;
			justify-content: flex-end;
			margin-bottom: 10rpx;
			
			&:last-child {
				margin-bottom: 0;
			}
			
			.info-label {
				font-size: 22rpx;
				color: #ffffff;
				margin-right: 4rpx;
			}
			
			.info-text {
				font-size: 22rpx;
				color: #ffffff;
			}
		}
	}

	/* 添加图片网格样式 */
	.image-grid {
		display: flex;
		flex-wrap: wrap;
		width: 100%;
		z-index: 1;
		position: relative;
		
		.image-grid-item {
			position: relative;
			width: calc(33.33% - 4rpx);
			height: 240rpx;
			margin: 2rpx;
			overflow: hidden;
			background-color: #f5f5f5;
			
			// 特殊处理单图的情况
			&:first-child:last-child {
				width: 100%;
				height: 500rpx;
				margin: 0;
			}
			
			image {
				width: 100%;
				height: 100%;
				transition: opacity 0.5s ease;
			}
			
			.image-placeholder {
				position: absolute;
				top: 0;
				left: 0;
				width: 100%;
				height: 100%;
				display: flex;
				flex-direction: column;
				justify-content: center;
				align-items: center;
				background-color: #f5f5f5;
				
				text {
					margin-top: 20rpx;
					color: #999999;
					font-size: 24rpx;
				}
			}
			
			/* 更多图片指示器 */
			.more-images {
				position: absolute;
				top: 0;
				left: 0;
				width: 100%;
				height: 100%;
				display: flex;
				justify-content: center;
				align-items: center;
				background-color: rgba(0, 0, 0, 0.5);
				
				text {
					color: #fff;
					font-size: 40rpx;
					font-weight: bold;
				}
			}
		}
	}

	/* 新的元信息显示区域 */
	.article-meta-info {
		display: flex;
		flex-wrap: nowrap;
		padding: 24rpx 24rpx 24rpx 24rpx;
		background-color: #f9f9f9;
		border-bottom: 1px solid #eaeaea;
		position: relative;
		justify-content: flex-start;
		align-items: center; /* 垂直居中对齐 */
		overflow-x: auto;
		-webkit-overflow-scrolling: touch;
		
		/* 左侧蓝色指示条 */
		&::before {
			content: '';
			position: absolute;
			left: 0;
			top: 50%;
			transform: translateY(-50%);
			width: 6rpx;
			height: 32rpx;
			background-color: #399bfe;
			border-radius: 0 4rpx 4rpx 0;
			margin-left: 20rpx;
		}
		
		.meta-item {
			display: flex;
			align-items: center;
			white-space: nowrap;
			padding: 0 16rpx;
			flex-shrink: 0;
			height: 50rpx;
			line-height: 50rpx; /* 添加行高确保文字垂直居中 */
			
			uni-icons {
				display: flex;
				align-items: center;
				justify-content: center;
				height: 36rpx; /* 固定图标容器高度 */
			}
			
			text {
				font-size: 26rpx;
				color: #666;
				margin-left: 10rpx;
				display: inline-block;
				vertical-align: middle; /* 确保文本垂直居中 */
				line-height: 1; /* 重置文本行高 */
			}
			
			&.date {
				padding-left: 20rpx;
			}
			
			&.category {
				background-color: rgba(57, 155, 254, 0.1);
				padding: 0 16rpx;
				border-radius: 24rpx;
				height: 44rpx; /* 调整高度与其他项一致 */
				margin-left: 8rpx;
				align-self: center;
				border: 1px solid rgba(57, 155, 254, 0.2);
				
				text {
					color: #399bfe;
					font-weight: 500;
					font-size: 24rpx;
					line-height: 44rpx; /* 确保文本在分类标签中居中 */
				}
			}
		}
		
		/* 添加分隔符 */
		.meta-divider {
			width: 1px;
			height: 24rpx;
			background-color: #ddd;
			flex-shrink: 0;
			margin: 0 8rpx; /* 增加左右间距 */
		}
		
		/* 添加滚动条样式 */
		&::-webkit-scrollbar {
			display: none; /* 隐藏滚动条 */
		}
	}

	/* 详情图样式 */
	.article-detail-images {
		margin-top: 20rpx;
		padding: 30rpx 30rpx 40rpx;
		background-color: #fff;
		
		.detail-images-title {
			display: flex;
			align-items: center;
			justify-content: center;
			margin-bottom: 30rpx;
			
			text {
				font-size: 30rpx;
				color: #333;
				margin: 0 20rpx;
			}
			
			.line {
				height: 1px;
				flex: 1;
				background-color: #ddd;
			}
		}
		
		.detail-images-container {
			display: flex;
			flex-direction: column;
			
			.detail-image-wrapper {
				margin-bottom: 20rpx;
				position: relative;
				background-color: #f9f9f9;
				border-radius: 8rpx;
				overflow: hidden;
				
				&:last-child {
					margin-bottom: 0;
				}
				
				.detail-image {
					width: 100%;
					border-radius: 8rpx;
					display: block;
					box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.1);
				}
			}
		}
	}

	/* 浮动分享按钮 */
	.float-share-btn {
		display: none;
	}
	
	/* 分享面板 */
	.float-share-panel {
		display: none;
	}

	/* 添加分享按钮样式 */
	.share-button {
		display: flex;
		flex-direction: column;
		align-items: center;
		margin-right: 48rpx;
		background: transparent;
		border: none;
		padding: 0;
		line-height: normal;
		height: auto;
		font-size: inherit;
		color: inherit;

		&::after {
			border: none;
		}

		.text {
			margin-top: 8rpx;
			font-size: 24rpx;
		}

		&:active {
			opacity: 0.7;
		}
	}
	
	/* 更新action-item按钮样式，适用于普通按钮和open-type按钮 */
	button.action-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		flex: 1;
		margin-right: 30rpx;
		background: transparent;
		border: none;
		padding: 0;
		line-height: normal;
		height: auto;
		font-size: inherit;
		color: inherit;
		
		&::after {
			border: none;
		}
		
		.text {
			margin-top: 8rpx;
			font-size: 24rpx;
		}
		
		&:active {
			opacity: 0.7;
		}
	}

	/* 加载更多评论按钮样式 */
	.load-more-comments {
		padding: 20rpx 0;
		display: flex;
		justify-content: center;
		align-items: center;
		color: #666;
		font-size: 26rpx;
		
		&.fold {
			border-top: 1rpx solid #f5f5f5;
		}
		
		text {
			margin-right: 10rpx;
		}
		
		&:active {
			background-color: #f5f5f5;
		}
	}

	/* 增强评论列表样式 */
	.enhanced-comment-list {
		:deep(.comment-list) {
			padding: 0 40rpx;
			background-color: #fff;
			margin: 0 40rpx;
			box-shadow: none;
			
			.comment-item {
				padding: 24rpx 0;
				
				&:last-child {
					border-bottom: none;
				}
				
				.comment-content {
					.username {
						letter-spacing: 1rpx;
					}
					
					.comment-text {
						.content {
							font-size: 28rpx;
							line-height: 1.6;
							letter-spacing: 0.5rpx;
							color: #333;
							word-break: break-all;
							word-wrap: break-word;
						}
						
						.time {
							margin-left: 12rpx;
							color: #999;
							font-size: 24rpx;
						}
					}
				}
			}
		}
	}
	
	/* 自定义评论弹窗样式 */
	.comment-popup {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		z-index: 999;
		display: flex;
		flex-direction: column;
		justify-content: flex-end;
		
		.comment-popup-mask {
			position: absolute;
			top: 0;
			left: 0;
			right: 0;
			bottom: 0;
			background-color: rgba(0, 0, 0, 0.5);
			z-index: -1;
		}
		
		.comment-popup-content {
			background-color: #fff;
			border-radius: 24rpx 24rpx 0 0;
			padding: 30rpx;
			animation: slideUp 0.3s ease;
			
			/* 快速评论样式 */
			.quick-comments {
				display: flex;
				flex-wrap: wrap;
				padding: 20rpx 0;
				
				.quick-comment-item {
					background-color: #f5f5f7;
					color: #333;
					padding: 12rpx 24rpx;
					border-radius: 30rpx;
					margin: 10rpx;
					font-size: 24rpx;
					border: 1px solid #eee;
					transition: all 0.2s ease;
					
					&:active {
						background-color: #e1e1e3;
						transform: scale(0.95);
					}
				}
			}
			
			.comment-popup-header {
				display: flex;
				justify-content: space-between;
				
				.comment-popup-title {
					font-size: 32rpx;
					font-weight: 600;
					color: #333;
					letter-spacing: 2rpx;
				}
				
				.comment-popup-close {
					padding: 10rpx;
					border-radius: 50%;
					
					&:active {
						background-color: #f5f5f5;
					}
				}
			}
			
			.comment-popup-body {
				position: relative;
				margin-bottom: 30rpx;
				
				.comment-textarea {
					width: 100%;
					min-height: 180rpx;
					padding: 20rpx;
					box-sizing: border-box;
					background-color: #f9f9f9;
					border-radius: 12rpx;
					font-size: 28rpx;
					line-height: 1.6;
					letter-spacing: 1rpx;
					color: #333;
				}
				
				.comment-length {
					position: absolute;
					right: 20rpx;
					bottom: 10rpx;
					font-size: 24rpx;
					color: #999;
				}
			}
			
			.comment-popup-footer {
				display: flex;
				justify-content: flex-end;
				
				.comment-cancel-btn, .comment-submit-btn {
					padding: 16rpx 40rpx;
					border-radius: 40rpx;
					font-size: 28rpx;
					margin-left: 20rpx;
					letter-spacing: 2rpx;
					font-weight: 500;
					
					&:active {
						opacity: 0.8;
					}
				}
				
				.comment-cancel-btn {
					color: #666;
					background-color: #f5f5f5;
				}
				
				.comment-submit-btn {
					color: #fff;
					background-color: #399bfe;
					box-shadow: 0 4rpx 8rpx rgba(57, 155, 254, 0.3);
				}
			}
		}
	}
	
	@keyframes slideUp {
		from {
			transform: translateY(100%);
		}
		to {
			transform: translateY(0);
		}
	}

	/* 幸运抽奖按钮样式 */
	.lottery-button-container {
		margin: 30rpx 0;
		display: flex;
		justify-content: center;
	}
	
	.lottery-button {
		background-color: #FF5500;
		color: #FFFFFF;
		border: none;
		border-radius: 40rpx;
		padding: 20rpx 40rpx;
		font-size: 28rpx;
		display: flex;
		align-items: center;
		box-shadow: 0 6rpx 20rpx rgba(255, 85, 0, 0.3);
	}
	
	.lottery-button text {
		margin-left: 10rpx;
	}
	
	.lottery-button[disabled] {
		background-color: #CCCCCC;
		color: #999999;
	}
	

	
	.lottery-button-small text {
		margin-left: 6rpx;
	}
	
	.lottery-button-small[disabled] {
		background-color: #CCCCCC;
		color: #999999;
	}
	
	.comment-input {
		margin-top: 50rpx;  /* 给抽奖按钮留出空间 */
		padding: 20rpx;
		background: #f5f5f5;
		border-radius: 8rpx;
		color: #999;
		font-size: 28rpx;
	}
	
	.comment-loading, .empty-comment {
		padding: 40rpx 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
	}
	
	.comment-loading :deep(.uni-load-more) {
		height: auto;
		padding: 20rpx 0;
	}

	.comment-loading :deep(.uni-load-more__text) {
		font-size: 28rpx;
		color: #666;
	}

	.lottery-component-container {
		margin: 20rpx 0;
		border-radius: 20rpx;
		overflow: hidden;
	}

	// 添加补充的加载组件样式
	.video-loading :deep(.uni-load-more) {
		background-color: transparent;
	}

	.video-loading :deep(.uni-load-more__text) {
		color: #fff;
		text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
	}

	/* 添加渐显动画 */
	.fade-in-animation {
		animation: fadeIn 0.4s ease-in-out;
	}
	
	@keyframes fadeIn {
		from { opacity: 0; }
		to { opacity: 1; }
	}

	/* 添加自定义加载动画样式与首页一致 */
	.custom-loading-container {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-color: #f8f8f8;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		z-index: 9999;
		
		.loading-spinner {
			animation: rotate 1.5s linear infinite;
		}
		
		.loading-text {
			margin-top: 30rpx;
			color: #666;
			font-size: 28rpx;
		}
	}
	
	@keyframes rotate {
		from { transform: rotate(0deg); }
		to { transform: rotate(360deg); }
	}

	/* 用户信息区域样式 */
	.article-user-info {
		display: flex;
		align-items: center;
		padding: 24rpx;
		background-color: #fff;
		border-bottom: 1px solid #eaeaea;
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		z-index: 100;
		
		.user-avatar-container {
			flex-shrink: 0;
			width: 80rpx;
			height: 80rpx;
			margin-right: 16rpx;
			
			.user-avatar {
				width: 100%;
				height: 100%;
				border-radius: 8rpx;
			}
		}
		
		.user-info-container {
			flex: 1;
			overflow: hidden;
			
			.user-name {
				font-size: 32rpx;
				font-weight: 500;
				color: #333;
				margin-bottom: 8rpx;
				@include textShenglue(1);
			}
			
			.user-meta {
				display: flex;
				flex-direction: column;
				
				.meta-row {
					display: flex;
					align-items: center;
					font-size: 24rpx;
					color: #999;
					
					.time-text {
						margin-right: 0;
					}
					
					.view-count {
						display: flex;
						align-items: center;
						
						.view-separator {
							margin: 0 8rpx;
							color: #ddd;
						}
						
						.view-text {
							font-size: 24rpx;
						}
					}
				}
			}
		}
		
		.contact-button {
			flex-shrink: 0;
			width: 80rpx;
			height: 80rpx;
			display: flex;
			justify-content: center;
			align-items: center;
			
			&:active {
				opacity: 0.7;
			}
		}
	}

	.time-views-container {
		display: flex;
		align-items: center;
		padding: 0 24rpx 16rpx;
		color: #999;
		font-size: 24rpx;
		background-color: #fff;
		
		.time-text {
			position: relative;
			padding-right: 16rpx;
			margin-right: 16rpx;
			
			&::after {
				content: "|";
				position: absolute;
				right: 0;
				color: #ddd;
			}
		}
		
		.views-text {
			display: flex;
			align-items: center;
			
			&::before {
				content: "";
				display: inline-block;
				width: 24rpx;
				height: 24rpx;
				margin-right: 4rpx;
				background: url('data:image/svg+xml;base64,PHN2ZyB0PSIxNjg4NDAwMDk1NjY3IiBjbGFzcz0iaWNvbiIgdmlld0JveD0iMCAwIDEwMjQgMTAyNCIgdmVyc2lvbj0iMS4xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHAtaWQ9IjIxOTgiIHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIj48cGF0aCBkPSJNNTEyIDI0Ny40NjdjLTE0Ny4yIDAtMjY4LjggMTIxLjYtMjY4LjggMjY4Ljh2MC4wNjdDMjQzLjIgNjYzLjQ2NyAzNjQuOCA3ODUuMDY3IDUxMiA3ODUuMDY3YzE0Ny4yIDAgMjY4LjgtMTIxLjYgMjY4LjgtMjY4LjggMC0xNDcuMi0xMjEuNi0yNjguOC0yNjguOC0yNjguOHoiIGZpbGw9IiNlNmU2ZTYiIHAtaWQ9IjIxOTkiPjwvcGF0aD48cGF0aCBkPSJNNTEyIDc4NS4wNjdjLTE0Ny4yIDAtMjY4LjgtMTIxLjYtMjY4LjgtMjY4LjggMC0xNDcuMiAxMjEuNi0yNjguOCAyNjguOC0yNjguOCAxNDcuMiAwIDI2OC44IDEyMS42IDI2OC44IDI2OC44IDAgMTQ3LjItMTIxLjYgMjY4LjgtMjY4LjggMjY4Ljh6IG0wLTQ3MC40Yy0xMTEuMSAwLTIwMS42IDkwLjUtMjAxLjYgMjAxLjYgMCAxMTEuMSA5MC41IDIwMS42IDIwMS42IDIwMS42IDExMS4xIDAgMjAxLjYtOTAuNSAyMDEuNi0yMDEuNiAwLTExMS4xLTkwLjUtMjAxLjYtMjAxLjYtMjAxLjZ6IiBmaWxsPSIjOTk5OTk5IiBwLWlkPSIyMjAwIj48L3BhdGg+PHBhdGggZD0iTTUxMiA1ODMuNDY3Yy0zNi44IDAtNjcuMi0zMC40LTY3LjItNjcuMnMzMC40LTY3LjIgNjcuMi02Ny4yIDY3LjIgMzAuNCA2Ny4yIDY3LjItMzAuNCA2Ny4yLTY3LjIgNjcuMnogbTAtNjcuMnYwIDBjMC4wMDEgMCAwLjAwMSAwIDAgMHoiIGZpbGw9IiM5OTk5OTkiIHAtaWQ9IjIyMDEiPjwvcGF0aD48cGF0aCBkPSJNNTEyIDk0MC44Yy0yMDkuNiAwLTM4NC42NCAxNTAuMDgtNDIzLjA4IDM0OC4xNkMyMy4wNCA4NDguNjQgNzEuMDQgMzkwLjcyIDIxMi40OCAyMTIuOCA0MDguNjQtNDMuODQgNzU4LjA4LTY5LjYgOTgwLjQ4IDEzNS4yYzE4OC4xNiAxNzMuNDQgMjUwLjg4IDQ0Mi4yNCAxNTYuOCA2NzguNEMxMDMzLjI4IDU3My40NCA3OTQuNTYgMzg0IDUxMiAzODQgMzAxLjQ0IDM4NCAxMzAuODggNTUzLjkyIDEzMC44OCA3NjQuMTZjMCAyMTAuMjQgMTcwLjU2IDM4MC4xNiAzODEuMTIgMzgwLjE2IDIxMC4yNCAwIDM4MC44LTE2OS45MiAzODAuOC0zODAuMTYgMC03My42LTIxLjEyLTE0NC0zMi02NC45NlY1MzIuOGMwLTM2LjQ4LTI5LjQ0LTY2LjU2LTY1LjkyLTY2LjU2cy02NS45MiAyOS40NC02NS45MiA2NS45MnYxNTkuNjhjMjMuMDQgMjQuOTYgMzguNCA1Ny42IDM4LjQgOTMuNDQgMCA3NC4yNC02MC4xNiAxMzMuNzYtMTM0LjQgMTMzLjc2cy0xMzQuNC01OS41Mi0xMzQuNC0xMzMuNzYgNjAuMTYtMTMzLjc2IDEzNC40LTEzMy43NmMxMy40NCAwIDI2LjI0IDEuOTIgMzcuNzYgNS43NlY1MzIuOGMwLTU3LjYgMzMuOTItMTA2Ljg4IDgyLjU2LTEyOS45MiA2MS40NC0yOS40NCAxMzUuMDQtMTAuODggMTcxLjUyIDQ0LjE2IDEuMjgtMS45MiAyLjU2LTMuODQgNC40OC01Ljc2IDQ3LjM2LTQ3LjM2IDEyMy41Mi00Ni43MiAxNjkuNiAwIDQ3LjM2IDQ2LjA4IDQ3LjM2IDEyMS42IDAgMTY5LjYtNDcuMzYgNDcuMzYtMTIzLjUyIDQ2LjcyLTE2OS42IDAtMS4yOCAxLjI4LTEuOTIgMi41Ni0zLjIgMy44NEM3NzMuMTIgODQ5LjI4IDY1My4xMiA5NDAuOCA1MTIgOTQwLjh6IG0xNzYuNjQtMTc1LjM2YzUzLjc2IDUzLjEyIDE0MS40NCA1My4xMiAxOTUuMiAwIDUzLjc2LTUzLjEyIDUzLjc2LTEzOS41MiAwLTE5My4yOC01My43Ni01My4xMi0xNDEuNDQtNTMuMTItMTk1LjIgMC01My43NiA1My43Ni01My43NiAxNDAuMTYgMCAxOTMuMjh6IG0tMTc2IDExLjUyYy0xMC4yNCAyLjU2LTIxLjEyIDMuODQtMzIgMy44NC05Mi44IDAtMTY3LjY4LTc1LjUyLTE2Ny42OC0xNjguMzJzNzQuODgtMTY4LjMyIDE2Ny42OC0xNjguMzIgMTY4LjMyIDc1LjUyIDE2OC4zMiAxNjguMzJjMCAxMC44OC0xLjI4IDIxLjc2LTMuODQgMzJoMGMtMTUuMzYgNzQuODgtODEuMjggMTMyLjQ4LTE2MS40OCAxMzIuNDhIODUuMTJDMTI4IDUxNy40NCAzMDYuNTYgMzUwLjcyIDUxMiAzNTAuNzJjMjkxLjg0IDAgNTI5LjI4IDE5Ni40OCA2MDYuMDggNDY0IDEwLjg4IDMzLjkyIDEwLjg4IDcwLjQgMTAuODggMTA2Ljg4QzEwNTguODggNTk2LjQ4IDgyNS42IDI5NC40IDUxMiAyOTQuNGMtMjI5LjQ0IDAtNDE1LjM2IDE4NS45Mi00MTUuMzYgNDE2IDAgMjI5LjQ0IDE4NS45MiA0MTYgNDE1LjM2IDQxNiAyMDkuNiAwIDM4MS43Ni0xNTUuMiA0MDkuNi0zNTcuNDQtMzcuMTIgNDAuOTYtOTAuMjQgNjcuODQtMTQ4LjQ4IDcwLjRDNzQyLjA4IDg0MC45NiA2NDIuNTYgODIzLjY4IDU2OS4yOCA3NTIuNjRjLTIuNTYtMi41Ni00LjQ4LTUuMTItNi40LTcuNjh2MzIuNjR6IG0wLTEyOGMwLTM2LjQ4IDMwLjA4LTY1LjkyIDY2LjU2LTY1LjkyIDM2LjQ4IDAgNjYuNTYgMjkuNDQgNjYuNTYgNjUuOTJzLTMwLjA4IDY2LjU2LTY2LjU2IDY2LjU2Yy0zNi40OCAwLTY2LjU2LTMwLjA4LTY2LjU2LTY2LjU2eiIgZmlsbD0iIzk5OTk5OSIgcC1pZD0iMjIwMiI+PC9wYXRoPjwvc3ZnPg==') no-repeat;
				background-size: contain;
			}
		}
	}

	// 删除不再需要的粉丝群按钮样式
	.fans-group-btn {
		// 样式已被替换
	}

	/* 加群引导弹窗样式 */
	.group-guide-popup {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		z-index: 1000;
		display: flex;
		justify-content: center;
		align-items: center;
		
		.group-guide-mask {
			position: absolute;
			top: 0;
			left: 0;
			right: 0;
			bottom: 0;
			background-color: rgba(0, 0, 0, 0.7);
			backdrop-filter: blur(6rpx);
			z-index: -1;
		}
		
		.group-guide-content {
			width: 620rpx;
			background-color: #fff;
			border-radius: 24rpx;
			padding: 60rpx 40rpx 50rpx;
			position: relative;
			box-shadow: 0 20rpx 40rpx rgba(0, 0, 0, 0.15);
			animation: popIn 0.4s cubic-bezier(0.22, 0.61, 0.36, 1);
			
			.group-guide-close {
				position: absolute;
				top: 20rpx;
				right: 20rpx;
				width: 60rpx;
				height: 60rpx;
				display: flex;
				justify-content: center;
				align-items: center;
				border-radius: 50%;
				background-color: rgba(0, 0, 0, 0.05);
				z-index: 10;
				transition: all 0.2s ease;
				
				&:active {
					background-color: rgba(0, 0, 0, 0.15);
					transform: scale(0.9);
				}
				
				/* 添加X图标样式 */
				&::before, &::after {
					content: '';
					position: absolute;
					width: 24rpx;
					height: 4rpx;
					background-color: #999;
					border-radius: 2rpx;
					transition: all 0.2s;
				}
				
				&::before {
					transform: rotate(45deg);
				}
				
				&::after {
					transform: rotate(-45deg);
				}
				
				&:active::before, &:active::after {
					background-color: #666;
				}
			}
			
			.group-guide-title {
				font-size: 44rpx;
				font-weight: bold;
				text-align: center;
				color: #FF4757;
				margin-bottom: 20rpx;
				padding: 16rpx 0;
				position: relative;
				border-radius: 12rpx;
				background: linear-gradient(135deg, rgba(255, 71, 87, 0.12), rgba(255, 71, 87, 0.06));
				width: 70%;
				margin: 0 auto 30rpx auto;
				
				&::after {
					content: '';
					position: absolute;
					bottom: -8rpx;
					left: 50%;
					transform: translateX(-50%);
					width: 80rpx;
					height: 4rpx;
					background-color: #FF4757;
					border-radius: 4rpx;
				}
			}
			
			.group-guide-desc {
				font-size: 30rpx;
				color: #333;
				text-align: center;
				margin-bottom: 40rpx;
				line-height: 1.5;
				letter-spacing: 1rpx;
			}
			
			/* 替换单张图片样式为6宫格样式 */
			.group-guide-image-grid {
				display: flex;
				flex-wrap: wrap;
				margin-bottom: 50rpx;
				border-radius: 16rpx;
				overflow: hidden;
				box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.1);
				border: 1px solid #f0f0f0;
				
				.grid-item {
					width: calc(33.33% - 6rpx);
					height: 160rpx;
					margin: 3rpx;
					
					&::after {
						content: '';
						position: absolute;
						top: 0;
						left: 0;
						right: 0;
						bottom: 0;
						background: linear-gradient(to bottom, transparent 70%, rgba(0, 0, 0, 0.2));
						opacity: 0;
						transition: opacity 0.3s ease;
					}
					
					&:active::after {
						opacity: 1;
					}
					
					image {
						width: 100%;
						height: 100%;
						object-fit: cover;
						transition: transform 0.3s ease;
						
						&:active {
							transform: scale(1.05);
						}
					}
				}
			}
			
			.group-guide-button {
				background: linear-gradient(135deg, #FF6B6B, #FF4757);
				color: #FFFFFF;
				height: 88rpx;
				line-height: 88rpx;
				font-size: 32rpx;
				font-weight: bold;
				letter-spacing: 2rpx;
				border-radius: 44rpx;
				text-align: center;
				box-shadow: 0 8rpx 16rpx rgba(255, 71, 87, 0.3);
				margin: 0;
				border: none;
				position: relative;
				overflow: hidden;
				animation: pulse 1.2s ease-in-out infinite alternate;
				
				&::after {
					border: none;
				}
				
				&:active {
					opacity: 0.9;
					transform: scale(0.98);
					animation-play-state: paused;
				}
				
				/* 添加闪光动画 */
				&::before {
					content: '';
					position: absolute;
					top: -50%;
					left: -50%;
					width: 200%;
					height: 200%;
					background: linear-gradient(
						to right,
						rgba(255, 255, 255, 0) 0%,
						rgba(255, 255, 255, 0.5) 50%,
						rgba(255, 255, 255, 0) 100%
					);
					transform: rotate(30deg);
					animation: shine 3s infinite;
				}
			}
		}
	}
	
	@keyframes popIn {
		0% {
			opacity: 0;
			transform: scale(0.8) translateY(30rpx);
		}
		100% {
			opacity: 1;
			transform: scale(1) translateY(0);
		}
	}
	
	@keyframes shine {
		0% {
			left: -100%;
		}
		20% {
			left: 100%;
		}
		100% {
			left: 100%;
		}
	}

	// 优化脉动动画效果
	@keyframes pulse {
		0% {
			transform: scale(1);
			box-shadow: 0 8rpx 16rpx rgba(255, 71, 87, 0.3);
		}
		100% {
			transform: scale(1.03);
			box-shadow: 0 12rpx 24rpx rgba(255, 71, 87, 0.4);
		}
	}
</style>
