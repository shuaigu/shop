<script setup>
	import { computed, onMounted, ref, watch, onUnmounted, onBeforeUnmount, onActivated, nextTick } from 'vue'
	import { useUserInfoStore } from '@/store/user.js'
	import formatTime from '@/utils/formatTime.js'
	import { testLogin } from '@/utils/isLogin'
	import { onReachBottom, onShareAppMessage, onShareTimeline, onLoad, onShow, onHide, onUnload, onReady, onPullDownRefresh } from '@dcloudio/uni-app'
	// 导入推荐组件
	import tuijian from '@/components/tuijian/tuijian.vue'
	// 导入图片处理工具函数
	import { addListImageParams, fixImageUrl, getDefaultImage, processAvatarUrl } from '@/utils/domainConfig.js'
	import { previewImages } from '@/utils/imagePreview.js'
	// 导入点赞组件
	import dianzan from '@/components/dianzan/dianzan.vue'
	// 导入海报生成组件
	import articlePoster from '@/components/article-poster/article-poster.vue'
	// 导入砍价小组列表组件
	import bargainGroups from '@/components/bargain-groups/bargain-groups.vue'

	// 导入uni-load-more组件
	import uniLoadMore from '@/uni_modules/uni-load-more/components/uni-load-more/uni-load-more.vue'
	
	// 导入打赏弹窗组件
	import rewardPopup from '@/components/reward-popup/reward-popup.vue'
	

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

	// 使用统一的图片处理函数替换原有的processCDNImage
	const processImageUrl = (url) => {
		if (!url) return getDefaultImage('default');
		
		// 使用domainConfig中的方法处理图片URL
		const fixedUrl = fixImageUrl(url);
		// 为列表页图片添加750px宽度限制
		return addListImageParams(fixedUrl);
	};
	
	// 添加登录状态跟踪，避免多次显示loading
	const loginLoadingVisible = ref(false);

	// 手机号识别和拨号功能（小程序专用版本）
	// 添加手机号码识别和处理函数
	const processPhoneNumbers = (text) => {
		if (!text) return text;
		
		// 手机号码正则表达式（支持多种格式）
		// 匹配：11位数字、带分隔符的手机号等
		const phoneRegex = /(1[3-9]\d{9}|1[3-9]\d[-\s]?\d{4}[-\s]?\d{4})/g;
		
		// 替换手机号为可点击的链接格式（使用Font Class图标）
		return text.replace(phoneRegex, function(match) {
			// 提取纯数字手机号
			var cleanPhone = match.replace(/[-\s]/g, '');
			// 验证是否为有效的11位手机号
			if (cleanPhone.length === 11 && /^1[3-9]\d{9}$/.test(cleanPhone)) {
				// 使用Font Class图标，添加打电话图标，电话号码也使用蓝色
				return '<span style="cursor: pointer; padding: 2rpx 4rpx; border-radius: 4rpx; display: inline-flex; align-items: center; gap: 4rpx; color: #007AFF;" data-phone="' + cleanPhone + '" class="phone-link"><span class="icon lishuai-dianhua" style="font-size: 14px; color: #007AFF;"></span>' + match + '</span>';
			}
			return match;
		});
	};
	
	// 处理手机号点击事件（小程序环境优化）
	const handlePhoneClick = function(phone) {
		try {
			console.log('准备拨打电话:', phone);
			
			// 验证手机号格式
			if (!phone || phone.length !== 11 || !/^1[3-9]\d{9}$/.test(phone)) {
				uni.showToast({
					title: '手机号格式不正确',
					icon: 'none',
					duration: 2000
				});
				return;
			}
			
			// 检查登录状态
			customTestLogin().then(function(isLoggedIn) {
				if (!isLoggedIn) {
					console.log('用户未登录，无法拨打电话');
					return;
				}
				
				// 添加确认弹窗
				uni.showModal({
					title: '拨打电话',
					content: '是否拨打 ' + phone + '？',
					confirmText: '拨打',
					cancelText: '取消',
					success: function(res) {
						if (res.confirm) {
							console.log('用户确认拨打电话');
							// 用户确认后调用拨号功能
							uni.makePhoneCall({
								phoneNumber: phone,
								success: function() {
									console.log('成功调起拨号界面');
								},
								fail: function(err) {
									console.error('拨打电话失败:', err);
									
									// 根据错误类型给出不同提示
									var errorMsg = '拨打电话失败';
									if (err.errMsg) {
										if (err.errMsg.indexOf('cancel') !== -1) {
											errorMsg = '用户取消拨打';
										} else if (err.errMsg.indexOf('fail') !== -1) {
											errorMsg = '设备不支持拨号功能';
										}
									}
									
									uni.showToast({
										title: errorMsg,
										icon: 'none',
										duration: 2000
									});
								}
							});
						} else {
							console.log('用户取消拨打电话');
						}
					},
					fail: function(err) {
						console.error('显示确认对话框失败:', err);
					}
				});
			}).catch(function(err) {
				console.error('登录检查失败:', err);
			});
			
		} catch (err) {
			console.error('处理电话点击失败:', err);
			uni.showToast({
				title: '操作失败，请重试',
				icon: 'none',
				duration: 2000
			});
		}
	};
	
	// 处理rich-text的点击事件（针对小程序环境优化）
	const handleRichTextTap = function(e) {
		console.log('Rich text tap event:', e);
		
		// 在小程序环境中，rich-text的点击事件处理可能不同
		// 尝试多种方式获取点击的元素信息
		var phoneNumber = null;
		
		// 方式1: 从target获取
		if (e.detail && e.detail.target && e.detail.target.dataset && e.detail.target.dataset.phone) {
			phoneNumber = e.detail.target.dataset.phone;
		}
		// 方式2: 从currentTarget获取
		else if (e.detail && e.detail.currentTarget && e.detail.currentTarget.dataset && e.detail.currentTarget.dataset.phone) {
			phoneNumber = e.detail.currentTarget.dataset.phone;
		}
		// 方式3: 检查是否有data-phone属性（兼容性处理）
		else if (e.detail && e.detail.target) {
			// 在小程序中，可能需要从文本内容中重新提取手机号
			var targetText = e.detail.target.innerText || e.detail.target.textContent || '';
			if (targetText) {
				var phoneMatch = targetText.match(/1[3-9]\d{9}/);
				if (phoneMatch) {
					phoneNumber = phoneMatch[0];
				}
			}
		}
		
		if (phoneNumber) {
			console.log('检测到手机号:', phoneNumber);
			handlePhoneClick(phoneNumber);
		} else {
			console.log('未检测到有效的手机号点击，尝试备用方案');
			// 备用方案：解析整个文本内容中的手机号
			handleTextPhoneDetection();
		}
	};
	
	// 备用的手机号检测方案
	const handleTextPhoneDetection = function() {
		var text = articleDetail.value && articleDetail.value.content ? articleDetail.value.content : '';
		if (!text) return;
		
		var phoneRegex = /1[3-9]\d{9}/g;
		var matches = text.match(phoneRegex);
		
		if (matches && matches.length > 0) {
			if (matches.length === 1) {
				// 只有一个手机号，直接调用handlePhoneClick（内部已有确认机制）
				handlePhoneClick(matches[0]);
			} else {
				// 多个手机号，让用户选择
				uni.showActionSheet({
					itemList: matches.map(function(phone) { return '拨打 ' + phone; }),
					success: function(res) {
						// 选择后直接调用handlePhoneClick，内部已有确认机制
						handlePhoneClick(matches[res.tapIndex]);
					},
					fail: function(err) {
						console.error('显示手机号选择列表失败:', err);
					}
				});
			}
		} else {
			console.log('文本中未找到有效的手机号');
		}
	};
	
	// 处理富文本内容，识别手机号
	const processedContent = computed(() => {
		if (!articleDetail.value || !articleDetail.value.content) return '';
		return processPhoneNumbers(articleDetail.value.content);
	});

	// 处理页面跳转逻辑
	const handlePageNavigation = async () => {
		try {
			// 获取当前页面栈
			const pages = getCurrentPages()
			
			// 如果是直接进入详情页（页面栈长度为1），说明是从分享或朋友圈进入
			// 根据微信小程序规则，此时不允许 switchTab，应该直接加载文章内容
			if (pages.length === 1) {
				console.log('检测到从分享/朋友圈进入，禁止 switchTab 跳转，直接加载文章内容')
				// 返回 false，表示不进行页面跳转，直接加载文章
				return false
			}

			return false // 返回 false 表示无需跳转
		} catch (err) {
			console.error('页面导航错误：', err)
			return false
		}
	}
	// 添加页面停留时长跟踪相关状态
	const pageEnterTime = ref(0) // 页面进入时间
	const pageLeaveTime = ref(0) // 页面离开时间
	const actualViewDuration = ref(0) // 实际浏览时长（秒）
	const isPageVisible = ref(true) // 页面是否可见
	const lastVisibilityChangeTime = ref(0) // 上次可见性变化时间
	const totalVisibleTime = ref(0) // 累计可见时间

	// 添加一个加载状态标记
	const isLoading = ref( true )
	const isSubmitting = ref( false )
	const articleApi = uniCloud.importObject( 'articleWx', { customUI: true } )

	const likeApi = uniCloud.importObject( 'likeRecord', { customUI: true } )
	const userApi = uniCloud.importObject('userWx', { customUI: true }) // 使用userWx代替login
	// const loginApi = uniCloud.importObject('login', { customUI: true })

	// 文章详情
	const articleDetail = ref( {} )



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
	const videoHeight = ref(422) // 默认视频高度(rpx)
	const isMuted = ref(false) // 视频静音状态，默认为有声
	
	// 添加点赞相关状态
	const isArticleLiked = ref(false) // 当前用户是否已点赞
	const likeCount = ref(0) // 文章总点赞数
	const isLikeRequesting = ref(false) // 点赞请求锁，防止重复请求
	
	// 添加砍价倒计时相关状态
	const isBargainExpired = ref(false) // 砍价是否已过期
	const remainingTime = ref('') // 剩余时间字符串
	const remainingSeconds = ref(0) // 剩余秒数（用于特殊显示）
	
	// 切换静音状态
	const toggleMute = () => {
		try {
			const videoElement = uni.createVideoContext('articleVideo')
			if (!videoElement) {
				console.error('视频元素不存在')
				return
			}
			
			// 切换静音状态
			isMuted.value = !isMuted.value
			
			// 显示提示
			uni.showToast({
				title: isMuted.value ? '已静音' : '已开启声音',
				icon: 'none',
				duration: 1500
			})
			
			console.log('音量状态已切换:', isMuted.value ? '静音' : '有声')
		} catch (err) {
			console.error('切换音量失败:', err)
			uni.showToast({
				title: '操作失败',
				icon: 'none'
			})
		}
	}
	
	// 新增导航信息
	const navInfo = ref(null)


	// 添加浏览者相关状态
	const viewersListVisible = ref(false) // 确保初始状态为隐藏
	const viewersList = ref([])
	const viewersLoading = ref(false)
	const viewersRefreshing = ref(false) // 专门的刷新状态
	const viewersPageNo = ref(1)
	const viewersPageSize = ref(20)
	const viewersTotal = ref(0)
	const hasMoreViewers = ref(true)

	// 在script setup顶部添加ref引用
	const likeButtonTop = ref(null)
	const likeButtonBottom = ref(null)
	const isLikeAnimating = ref(false)
	const tuijianRef = ref(null)
	
	// 打赏相关状态
	const rewardPopupRef = ref(null) // 打赏弹窗引用
	const rewardList = ref([]) // 打赏列表
	const rewardStatistics = ref({ // 打赏统计
		totalAmount: 0,
		totalCount: 0,
		userCount: 0
	})

	// 添加一个统一的媒体处理函数
	const processMediaURL = (url, type = 'image') => {
		if (!url) return type === 'image' ? getDefaultImage('default') : '';
		
		// 对于图片类型，使用统一的图片处理函数
		if (type === 'image') {
			return processImageUrl(url);
		}
		
		// 对视频URL的特殊处理
		if (type === 'video') {
			// 视频不需要压缩参数，但需要修复域名问题
			return fixImageUrl(url);
		}
		
		return url;
	};
	
	// 添加验证图片URL的函数
	const isValidImageUrl = (url) => {
		if (!url) return false;
		
		// 检查是否是合法的URL格式
		return url.startsWith('http') || url.startsWith('https') || url.startsWith('/') || url.startsWith('data:image');
	};
	
	// 添加图片加载超时机制
	const imageLoadTimeouts = ref({});
	// 增加加载超时时间，因为模拟器/真机可能较慢
	const IMAGE_LOAD_TIMEOUT = 15000; // 15秒
	// 添加最大重试次数
	const MAX_RETRY_COUNT = 3;
	// 添加图片重试计数
	const imageRetryCount = ref({});
	
	// 添加分享信息
	const shareInfo = ref({
		title: '',
		path: '',
		imageUrl: ''
	});
	
	// 海报图片路径（优先使用海报作为分享封面）
	const posterImagePath = ref('');
	// 海报生成中标志
	const isGeneratingPoster = ref(false);
	// 海报组件引用
	const posterComponentRef = ref(null);
	// 海报是否生成完成（用于控制按钮状态）- 默认禁用，等待后台生成完成后启用
	const isPosterReady = ref(false);
	// 处理后的海报头像URL（用于传给海报组件）
	const processedPosterAvatarUrl = ref('/static/images/touxiang.png');
	
	// 更新分享信息
	const updateShareInfo = () => {
		try {
			// 处理分享标题，使用文章内容的前30个字符
			let title = articleDetail.value.content 
				? articleDetail.value.content.substring(0, 30) 
				: '精彩内容';
			
			// 为所有标题添加分类名
			if (articleDetail.value.cate_name) {
				title = `【${articleDetail.value.cate_name}】 ${title}`;
			}
			
			// 设置分享图片URL（优先级：自定义封面 > 海报 > 文章图片）
			let imageUrl = '';
			
			// 第一优先：使用发布者上传的自定义分享封面
			if (articleDetail.value.share_cover_image) {
				imageUrl = articleDetail.value.share_cover_image;
				console.log('✅ 分享封面：使用自定义封面图片');
			}
			// 第二优先：使用自动生成的海报图片
			else if (posterImagePath.value) {
				imageUrl = posterImagePath.value;
				console.log('✅ 分享封面：使用海报图片');
			}
			// 第三优先：使用文章最后一张图片
			else if (articleDetail.value.images && articleDetail.value.images.length > 0) {
				const lastImage = articleDetail.value.images[articleDetail.value.images.length - 1];
				imageUrl = lastImage.url || lastImage.compressedURL || lastImage.thumbnailURL || '';
				console.log('⚠️ 分享封面：使用文章图片');
			} else {
				console.log('⚠️ 分享封面：无可用图片');
			}
			
			// 设置分享路径（使用 currentArticleId.value 或 props.article_id）
			const articleId = currentArticleId.value || props.article_id;
			if (!articleId) {
				console.warn('⚠️ 无法生成分享链接：缺少 article_id');
				return;
			}
			const path = `/pages/article/articleDetail?article_id=${articleId}`;
			
			// 更新分享信息
			shareInfo.value = {
				title,
				path,
				imageUrl
			};
			
			console.log('分享信息已更新:', shareInfo.value);
		} catch (err) {
			console.error('更新分享信息失败:', err);
		}
	};
	
	// 分享到微信好友
	onShareAppMessage(async (res) => {
		// ✅ 修复：如果有自定义封面图，不需要生成海报
		const hasCustomCover = articleDetail.value && articleDetail.value.share_cover_image;
		
		// 只有在没有自定义封面时，才生成海报
		if (!hasCustomCover && !posterImagePath.value && !isGeneratingPoster.value) {
			console.log('⚠️ 无自定义封面，且未检测到海报，开始生成海报...');
			
			// 显示加载提示
			uni.showLoading({
				title: '生成海报中...',
				mask: true
			});
			
			isGeneratingPoster.value = true;
			
			try {
				// 触发海报生成
				await triggerPosterGeneration();
				
				// 等待海报生成完成（最多等待10秒）
				let waitCount = 0;
				while (!posterImagePath.value && waitCount < 100) {
					await new Promise(resolve => setTimeout(resolve, 100));
					waitCount++;
				}
				
				try {
					uni.hideLoading();
				} catch (e) {
					console.warn('隐藏loading失败:', e);
				}
				
				if (posterImagePath.value) {
					console.log('✅ 海报生成成功，继续分享');
				} else {
					console.warn('⚠️ 海报生成超时，使用默认封面');
				}
			} catch (error) {
				try {
					uni.hideLoading();
				} catch (e) {
					console.warn('隐藏loading失败:', e);
				}
				console.error('生成海报失败:', error);
			} finally {
				isGeneratingPoster.value = false;
			}
		} else if (hasCustomCover) {
			console.log('✅ 检测到自定义封面图，跳过海报生成');
		}
		
		updateShareInfo();
		
		// 构建包含分享者信息的链接
		let sharePath = shareInfo.value.path;
		if (userStore.userInfo && userStore.userInfo.uid) {
			// 添加分享者信息到链接中
			const separator = sharePath.includes('?') ? '&' : '?';
			const sharerName = encodeURIComponent(userStore.userInfo.nickName || '匿名用户');
			const sharerAvatar = encodeURIComponent(userStore.userInfo.avatarUrl || getDefaultImage('avatar'));
			sharePath = `${sharePath}${separator}sharer_id=${userStore.userInfo.uid}&sharer_name=${sharerName}&sharer_avatar=${sharerAvatar}`;
		}
		
		console.log('👉 微信好友分享配置:', {
			title: shareInfo.value.title,
			path: sharePath,
			imageUrl: shareInfo.value.imageUrl
		});
		
		return {
			title: shareInfo.value.title,
			path: sharePath,
			imageUrl: shareInfo.value.imageUrl
		};
	});
	
	// 分享到朋友圈
	onShareTimeline(() => {
		updateShareInfo();
		
		// 构建包含分享者信息的链接
		// 注意：朋友圈分享只需要 query 参数，不需要完整的 path
		let queryString = `article_id=${currentArticleId.value || props.article_id}`;
		
		if (userStore.userInfo && userStore.userInfo.uid) {
			// 添加分享者信息到查询参数
			const sharerName = encodeURIComponent(userStore.userInfo.nickName || '匿名用户');
			const sharerAvatar = encodeURIComponent(userStore.userInfo.avatarUrl || getDefaultImage('avatar'));
			queryString += `&sharer_id=${userStore.userInfo.uid}&sharer_name=${sharerName}&sharer_avatar=${sharerAvatar}`;
		}
		
		console.log('👉 朋友圈分享配置:', {
			title: shareInfo.value.title,
			query: queryString,
			imageUrl: shareInfo.value.imageUrl
		});
		
		return {
			title: shareInfo.value.title,
			query: queryString, // 朋友圈分享使用 query 而不是 path
			imageUrl: shareInfo.value.imageUrl
			// 朋友圈分享使用文章第一张图片作为封面
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
	
	// 触发海报生成（支持静默模式）
	const triggerPosterGeneration = async (silent = false) => {
		return new Promise((resolve, reject) => {
			try {
				// 触发海报组件的生成方法
				// 通过事件系统通知海报组件
				uni.$emit('generatePoster', { silent });
				resolve();
			} catch (error) {
				console.error('触发海报生成失败:', error);
				reject(error);
			}
		});
	};
	
	// 后台静默生成海报（页面加载完成后自动调用）
	const triggerBackgroundPosterGeneration = async () => {
		try {
			if (isPosterReady.value || isGeneratingPoster.value) {
				console.log('海报已生成或正在生成中，跳过');
				return;
			}
			
			console.log('🎨 页面加载完成，立即开始后台静默生成海报...');
			isGeneratingPoster.value = true;
			
			// 立即生成，无延迟
			try {
				await triggerPosterGeneration(true); // 静默模式
			} catch (error) {
				console.error('后台生成海报失败:', error);
				isGeneratingPoster.value = false;
				// 即使生成失败，也启用按钮（降级到无海报状态）
				isPosterReady.value = true;
			}
		} catch (err) {
			console.error('触发后台海报生成异常:', err);
			isGeneratingPoster.value = false;
			isPosterReady.value = true;
		}
	};
	
	// 监听海报生成事件
	const handlePosterGenerated = (tempFilePath) => {
		console.log('🔔 收到海报生成事件, 路径:', tempFilePath);
		console.log('🔹 当前 isPosterReady 状态:', isPosterReady.value);
		console.log('🔹 当前 isGeneratingPoster 状态:', isGeneratingPoster.value);
		
		posterImagePath.value = tempFilePath;
		isGeneratingPoster.value = false;
		
		// 使用 nextTick 确保视图更新
		nextTick(() => {
			isPosterReady.value = true; // 标记海报已生成完成
			console.log('✅ 海报生成成功，路径:', tempFilePath);
			console.log('✅ isPosterReady 已设置为:', isPosterReady.value);
			console.log('✅ 分享和海报按钮已启用');
			
			// 更新分享信息，使用海报作为封面
			updateShareInfo();
		});
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
	
	// 获取当前用户的点赞状态
	const getLikeStatus = async () => {
		try {
			// 检查用户是否登录 - 只检查，不弹出登录提示
			const isLoggedIn = userStore.userInfo && userStore.userInfo.uid;
			if (!isLoggedIn) {
				// 未登录用户显示文章的点赞数，但状态为未点赞
				isArticleLiked.value = false;
				if (articleDetail.value) {
					likeCount.value = articleDetail.value.like_count || 0;
				}
				console.log('用户未登录，点赞状态设置为false');
				return;
			}
			
			// 确保有用户信息
			if (!userStore.userInfo || !userStore.userInfo.uid) {
				isArticleLiked.value = false;
				console.log('用户信息不完整，点赞状态设置为false');
				return;
			}
			
			// 获取文章ID（优先使用 articleDetail._id，再使用 props.article_id）
			const articleId = (articleDetail.value && articleDetail.value._id) || props.article_id;
			
			if (!articleId) {
				isArticleLiked.value = false;
				console.log('文章ID为空，点赞状态设置为false');
				return;
			}
			
			try {
				// 直接查询 likeRecord 数据库集合（优化：使用 count 方法提升性能）
				const db = uniCloud.database();
				const queryParams = {
					article_id: articleId,
					user_id: userStore.userInfo.uid,
					record_type: 'like'
				};
				
				console.log('查询点赞状态参数:', queryParams);
				
				// 使用 count 查询，性能更好
				const result = await db.collection('likeRecord')
					.where(queryParams)
					.count();
				
				const hasLikeRecord = result?.total > 0;
				isArticleLiked.value = hasLikeRecord;
				
				console.log('点赞状态查询完成:', { isLiked: isArticleLiked.value, articleId });
				
				// 重新查询文章详情，确保点赞数是最新的
				try {
					const articleRes = await articleApi.getArticleDetal(articleId);
					if (articleRes?.articleRes?.data?.[0]) {
						const latestArticle = articleRes.articleRes.data[0];
						const latestLikeCount = latestArticle.like_count || 0;
						
						// 更新文章详情中的点赞数
						if (articleDetail.value) {
							articleDetail.value.like_count = latestLikeCount;
						}
						
						// 更新点赞数
						likeCount.value = latestLikeCount;
						
						console.log('最新点赞数已更新:', latestLikeCount);
					} else {
						// 如果无法查询最新数据，使用现有数据
						if (articleDetail.value) {
							likeCount.value = articleDetail.value.like_count || 0;
						}
					}
				} catch (refreshErr) {
					console.error('刷新点赞数失败:', refreshErr);
					// 如果刷新失败，使用现有数据
					if (articleDetail.value) {
						likeCount.value = articleDetail.value.like_count || 0;
					}
				}
				
				// 发送事件通知其他组件更新点赞状态
				uni.$emit('updateArticleLikeStatus', {
					articleId: articleId,
					isLiked: isArticleLiked.value,
					likeCount: likeCount.value
				});
			} catch (err) {
				console.error('查询点赞记录失败:', err);
				// 使用默认值，确保是布尔值
				isArticleLiked.value = false;
				if (articleDetail.value) {
					likeCount.value = articleDetail.value.like_count || 0;
				}
			}
		} catch (err) {
			console.error('获取点赞状态失败:', err);
			isArticleLiked.value = false;
		}
	};
	
	// 处理点赞操作
	const handleLike = async () => {
		try {
			// 防止重复请求
			if (isLikeRequesting.value) {
				return;
			}
			
			// 检查用户登录状态和信息
			const isLoggedIn = await customTestLogin();
			if (!isLoggedIn) {
				return;
			}
			
			if (!userStore.userInfo?.uid) {
				console.error('用户信息不完整，无法点赞');
				uni.showToast({
					title: '登录信息异常，请重新登录',
					icon: 'none'
				});
				return;
			}
			
			// 设置请求锁
			isLikeRequesting.value = true;
			
			// 保存之前的状态（用于回滚）
			const previousLikeStatus = isArticleLiked.value;
			const previousLikeCount = likeCount.value;
			
			console.log('点赞操作开始:', { article_id: props.article_id, previousLikeStatus });
			
			// 乐观更新UI（先改变UI，提升用户体验）
			const newLikeStatus = !previousLikeStatus;
			isArticleLiked.value = newLikeStatus;
			likeCount.value = newLikeStatus ? previousLikeCount + 1 : previousLikeCount - 1;
			
			try {
				// 调用云函数执行点赞操作
				const result = await articleApi.clickLike(
					props.article_id,
					userStore.userInfo.uid,
					previousLikeStatus
				);
				
				console.log('点赞操作返回:', result);
				
				if (result.errCode === 0) {
					// 使用云函数返回的准确状态
					isArticleLiked.value = result.is_liked ?? newLikeStatus;
					
					// 显示操作提示（简洁版）
					uni.showToast({
						title: isArticleLiked.value ? '点赞成功' : '已取消',
						icon: 'success',
						duration: 1200
					});
					
					// 使用云函数返回的点赞数
					if (result.like_count !== undefined) {
						console.log('使用云函数返回的点赞数:', result.like_count);
						articleDetail.value.like_count = result.like_count;
						likeCount.value = result.like_count;
					} else {
						// 如果云函数没有返回点赞数，则重新获取文章详情
						if (articleDetail.value?._id) {
							try {
								const articleRes = await articleApi.getArticleDetal(articleDetail.value._id);
								if (articleRes?.articleRes?.data?.[0]) {
									const updatedArticle = articleRes.articleRes.data[0];
									articleDetail.value.like_count = updatedArticle.like_count || 0;
									likeCount.value = updatedArticle.like_count || 0;
								}
							} catch (refreshErr) {
								console.error('刷新文章详情失败:', refreshErr);
							}
						}
					}
					
					// 发送全局事件，通知其他组件更新
					uni.$emit('updateArticleLikeStatus', {
						articleId: props.article_id,
						isLiked: isArticleLiked.value,
						likeCount: likeCount.value
					});
				} else {
					// 操作失败，回滚UI
					isArticleLiked.value = previousLikeStatus;
					likeCount.value = previousLikeCount;
					
					uni.showToast({
						title: result.errMsg || '操作失败',
						icon: 'none',
						duration: 1500
					});
				}
			} catch (apiError) {
				// API调用失败，回滚UI
				console.error('点赞API调用失败:', apiError);
				isArticleLiked.value = previousLikeStatus;
				likeCount.value = previousLikeCount;
				
				uni.showToast({
					title: '网络异常，请重试',
					icon: 'none'
				});
			}
		} catch (err) {
			console.error('点赞操作失败:', err);
			uni.showToast({
				title: '操作失败',
				icon: 'none'
			});
		} finally {
			// 释放请求锁
			isLikeRequesting.value = false;
		}
	};
	
	// 获取文章详情
	const getArticleDetail = async () => {
		try {
			// 先检查是否需要处理页面导航
			const needRedirect = await handlePageNavigation()
			if (needRedirect) {
				return // 如果需要重定向，直接返回
			}

			// 优先使用 currentArticleId，然后是 props.article_id
			const articleId = currentArticleId.value || props.article_id;
			
			// 检查文章ID是否存在
			if (!articleId) {
				const errorMsg = '文章ID不能为空';
				console.error('❌', errorMsg, '- currentArticleId:', currentArticleId.value, 'props.article_id:', props.article_id);
				throw new Error(errorMsg);
			}
			
			console.log('✅ 准备获取文章详情, article_id:', articleId);

			// 添加轻微延迟，确保页面动画完成
			await new Promise(resolve => setTimeout(resolve, 50));

			// 显示加载提示
			uni.showLoading({ title: '加载中...', mask: true });
			
			const res = await articleApi.getArticleDetal(articleId);
			
			// 隐藏加载提示
			uni.hideLoading();
			
			// 检查返回的数据结构
			if (!res || !res.articleRes || !res.articleRes.data || !Array.isArray(res.articleRes.data)) {
				const errorMsg = '获取文章详情失败：返回数据格式错误';
				console.error('❌', errorMsg, '返回结果:', res);
				throw new Error(errorMsg);
			}
			
			// 检查是否有文章数据
			if (!res.articleRes.data[0]) {
				const errorMsg = '文章不存在或已被删除';
				console.error('❌', errorMsg);
				throw new Error(errorMsg);
			}

			// 更新文章详情
			const articleData = res.articleRes.data[0];
			
			console.log('✅ 文章数据获取成功:', {
				_id: articleData._id,
				content: articleData.content ? articleData.content.substring(0, 50) + '...' : '无内容',
				user_id: articleData.user_id,
				images: articleData.images?.length || 0,
				videoURL: articleData.videoURL ? '有' : '无'
			});
			
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
				
				// 处理图片资源 - 直接使用 compressedURL
				articleData.images = articleData.images.map((img, index) => {
					// 直接使用 compressedURL，如果不存在则使用默认图
					const compressedURL = img.compressedURL || getDefaultImage('default');
					
					// 设置每张图片的初始加载状态
					imageLoadStatus.value[index] = 'loading';
					
					// 为每张图片设置加载超时
					imageLoadTimeouts.value[index] = setTimeout(() => {
						if (imageLoadStatus.value[index] === 'loading') {
							imageLoadStatus.value[index] = 'error';
							checkAllImagesLoaded();
						}
					}, IMAGE_LOAD_TIMEOUT);
					
					return {
						...img,
						compressedURL
					};
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
				address: articleData.address || '', // 添加地址字段
				district: articleData.district || '', // 添加区域字段
				images: articleData.images || [],
				videoURL: articleData.videoURL || null,
				// ✅ 关键修复：添加分享封面图字段
				share_cover_image: articleData.share_cover_image || '',
				// 砍价相关字段
				enable_bargain: articleData.enable_bargain || false,
				bargain_initial_price: articleData.bargain_initial_price || 0,
				bargain_step: articleData.bargain_step || 10,
				bargain_end_time: articleData.bargain_end_time || 0,
				bargain_popup_image: articleData.bargain_popup_image || '', // 砂价弹窗图片
				bargain_popup_text: articleData.bargain_popup_text || '', // 砂价弹窗文字
				bargain_amount_text: articleData.bargain_amount_text || '' // 砂价金额自定义文字
			}
			
			// 添加调试日志
			console.log('文章详情初始化完成:', {
				articleId: articleDetail.value._id,
				originalLikeCount: articleData.like_count,
				finalLikeCount: articleDetail.value.like_count,
				// ✅ 添加分享封面图调试
				share_cover_image: articleDetail.value.share_cover_image,
				originalShareCoverImage: articleData.share_cover_image,
				// 添加砍价状态调试
				bargainEnabled: articleDetail.value.enable_bargain,
				bargainInitialPrice: articleDetail.value.bargain_initial_price,
				bargainStep: articleDetail.value.bargain_step,
				bargainEndTime: articleDetail.value.bargain_end_time,
				// 添加原始数据调试
				originalBargainEndTime: articleData.bargain_end_time,
				bargainEndTimeType: typeof articleData.bargain_end_time,
				// 添加弹窗图片调试
				bargainPopupImage: articleDetail.value.bargain_popup_image,
				originalBargainPopupImage: articleData.bargain_popup_image,
				// 添加弹窗文字调试
				bargainPopupText: articleDetail.value.bargain_popup_text,
				originalBargainPopupText: articleData.bargain_popup_text,
				// 添加金额文字调试
				bargainAmountText: articleDetail.value.bargain_amount_text,
				originalBargainAmountText: articleData.bargain_amount_text
			});
			
			// 初始化点赞数
			likeCount.value = articleDetail.value.like_count || 0;
			console.log('点赞数已初始化为:', likeCount.value);
			
			// 检查砍价是否过期
			if (articleDetail.value.enable_bargain && articleDetail.value.bargain_end_time) {
				checkBargainExpired()
				// 启动定时器更新倒计时（每秒更新）
				setInterval(() => {
					checkBargainExpired()
				}, 1000) // 每秒更新一次
			}
			
			// 获取当前用户的点赞状态
			await getLikeStatus();
			
			// 同步砍价完成状态（延迟执行，确保组件已挂载）
			setTimeout(() => {
				syncBargainCompleteStatus()
			}, 500)
			
			// 🎨 直接使用数据库的头像URL，不做复杂处理
			if (userStore.userInfo && userStore.userInfo.avatarUrl) {
				processedPosterAvatarUrl.value = userStore.userInfo.avatarUrl;
				console.log('🎨[海报] 直接使用数据库头像:', processedPosterAvatarUrl.value);
			} else {
				processedPosterAvatarUrl.value = '/static/images/touxiang.png';
				console.log('🎨[海报] 无头像，使用默认');
			}
			
			// 更新分享信息（确保文章数据加载后更新）
			updateShareInfo();
			
			// 页面加载完成后，静默生成海报
			// 使用 setTimeout 确保海报组件已经挂载
			setTimeout(() => {
				nextTick(() => {
					triggerBackgroundPosterGeneration();
				});
			}, 100);

			// 添加调试信息，检查位置信息是否正确获取
			console.log('文章详情位置信息调试:', {
				originalAddress: articleData.address,
				originalDistrict: articleData.district,
				finalAddress: articleDetail.value.address,
				finalDistrict: articleDetail.value.district,
				getSimplifiedLocationResult: getSimplifiedLocation()
			});

		} catch (err) {
			console.error('❌ 获取文章详情失败：', err)
			
			// 隐藏加载提示
			try {
				uni.hideLoading();
			} catch (e) {
				console.warn('隐藏loading失败:', e);
			}
			
			// 记录详细错误信息
			console.error('🔴 错误详情:', {
				message: err.message || '未知错误',
				code: err.code,
				errCode: err.errCode,
				errMsg: err.errMsg,
				articleId: currentArticleId.value || props.article_id,
				stack: err.stack
			});
			
			// 特别检查是否为抽奖相关错误
			if (err.message && (err.message.includes('lotteryVisibility') || err.message.includes('lottery') || err.message.includes('currentCommentPosition'))) {
				console.warn('检测到抽奖相关错误，已忽略：', err.message);
				uni.showToast({
					title: '请清理缓存后重试',
					icon: 'none',
					duration: 3000
				})
			} else {
				// 根据错误类型显示不同提示
				let errorTitle = '获取文章详情失败';
				if (err.message) {
					if (err.message.includes('文章ID') || err.message.includes('不存在') || err.message.includes('删除')) {
						errorTitle = '文章不存在或已被删除';
					} else if (err.message.includes('网络') || err.message.includes('network') || err.message.includes('timeout')) {
						errorTitle = '网络异常';
					} else if (err.message.includes('权限') || err.message.includes('permission') || err.message.includes('access')) {
						errorTitle = '没有访问权限';
					}
				}
				
				uni.showToast({
					title: errorTitle,
					icon: 'none',
					duration: 2500
				})
			}
			
			// 抛出错误，由 onLoad 处理
			throw err;
		}
	}





	// 添加页面刷新方法
	const refreshPage = async () => {
		try {
			// 设置加载状态
			isLoading.value = true;
			
			// 清除所有图片超时计时器
			Object.keys(imageLoadTimeouts.value).forEach(key => {
				clearTimeout(imageLoadTimeouts.value[key]);
			});
			// 重置图片加载状态
			imageLoadStatus.value = {};
			imageLoadTimeouts.value = {};
			imageRetryCount.value = {};
			isAnyImageLoading.value = true;
			
			// 重新加载文章详情
			await getArticleDetail();
			
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
			
			// 停止下拉刷新动画（如果有）
			uni.stopPullDownRefresh();
		}
	}

	// 添加下拉刷新处理函数
	onPullDownRefresh(() => {
		refreshPage();
	});







	// 跳转到首页
	const goToHome = ( ) => {
		uni.switchTab( {
			url: '/pages/index/index'
		} )
	}

	// 帮砍一刀按钮处理 - 与砍价卡片按钮功能完全一致
	const handleBargainHelp = async () => {
		// 检查砍价是否已启用
		if (!articleDetail.value.enable_bargain) {
			uni.showToast({
				title: '该文章未开启砍价',
				icon: 'none',
				duration: 2000
			})
			return
		}
		
		// 检查砍价是否已过期
		if (isBargainExpired.value) {
			uni.showToast({
				title: '砍价活动已结束',
				icon: 'none',
				duration: 2000
			})
			return
		}
		
		// 检查砍价是否已完成
		if (isBargainComplete.value) {
			uni.showToast({
				title: '您已完成砍价',
				icon: 'none',
				duration: 2000
			})
			return
		}
		
		// 直接触发砍价组件的砍价操作，所有检查逻辑由组件内部统一处理
		if (dianzanBargainRef.value && dianzanBargainRef.value.handleBargain) {
			await dianzanBargainRef.value.handleBargain()
		} else {
			console.error('砍价组件未找到或未挂载')
			uni.showToast({
				title: '砍价功能暂不可用',
				icon: 'none',
				duration: 2000
			})
		}
	}
	
	// 同步砍价组件的完成状态到页面
	const syncBargainCompleteStatus = () => {
		if (dianzanBargainRef.value && dianzanBargainRef.value.isBargainComplete) {
			isBargainComplete.value = dianzanBargainRef.value.isBargainComplete.value
			console.log('已同步砍价完成状态:', isBargainComplete.value)
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
							// 尝试从服务器获取用户信息 - 使用userWx云函数代替userKs
							try {
								// 使用userWx云函数获取用户信息
								const userInfoApi = uniCloud.importObject('userWx', { customUI: true });
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

	// 添加页面浏览量更新状态跟踪变量
	const isUpdatingPageView = ref(false);
	
	// 计算实际浏览时长
	const calculateActualViewDuration = () => {
		const currentTime = Date.now()
		
		if (pageEnterTime.value > 0) {
			// 如果页面当前可见，加上当前可见时段
			if (isPageVisible.value && lastVisibilityChangeTime.value > 0) {
				totalVisibleTime.value += currentTime - lastVisibilityChangeTime.value
			}
			
			// 转换为秒并四舍五入
			actualViewDuration.value = Math.round(totalVisibleTime.value / 1000)
			
			console.log('实际浏览时长计算:', {
				totalVisibleTime: totalVisibleTime.value + 'ms',
				actualDuration: actualViewDuration.value + 's',
				pageEnterTime: new Date(pageEnterTime.value).toLocaleTimeString(),
				currentTime: new Date(currentTime).toLocaleTimeString()
			})
		}
		
		return actualViewDuration.value
	}
	
	// 处理页面可见性变化
	const handleVisibilityChange = (visible) => {
		const currentTime = Date.now()
		
		if (visible) {
			// 页面变为可见
			isPageVisible.value = true
			lastVisibilityChangeTime.value = currentTime
			console.log('页面变为可见:', new Date(currentTime).toLocaleTimeString())
		} else {
			// 页面变为不可见
			if (isPageVisible.value && lastVisibilityChangeTime.value > 0) {
				// 累加本次可见时间
				totalVisibleTime.value += currentTime - lastVisibilityChangeTime.value
				console.log('页面变为不可见，累加时间:', (currentTime - lastVisibilityChangeTime.value) + 'ms')
			}
			isPageVisible.value = false
			lastVisibilityChangeTime.value = currentTime
		}
	}
	
	// 初始化页面进入时间
	const initPageEnterTime = () => {
		const currentTime = Date.now()
		pageEnterTime.value = currentTime
		lastVisibilityChangeTime.value = currentTime
		totalVisibleTime.value = 0
		isPageVisible.value = true
		console.log('页面进入时间初始化:', new Date(currentTime).toLocaleTimeString())
	}
	
	// 向服务器更新浏览时长
	const updateViewDurationOnServer = async (duration) => {
		try {
			if (!props.article_id || duration <= 0) {
				console.log('参数不合法，跳过更新浏览时长')
				return
			}
			
			// 获取用户ID（注册用户或访客）
			let userId = null
			if (userStore.userInfo && userStore.userInfo.uid) {
				userId = userStore.userInfo.uid
			} else {
				userId = uni.getStorageSync('guest_id')
			}
			
			if (!userId) {
				console.log('无法获取用户ID，跳过更新')
				return
			}
			
			// 调用云函数更新最近一条浏览记录的时长
			const result = await articleApi.updateViewDuration(props.article_id, userId, duration)
			
			if (result && result.code === 0) {
				console.log('浏览时长更新成功:', duration + 's')
			} else {
				console.error('浏览时长更新失败:', result?.message || '未知错误')
			}
		} catch (err) {
			console.error('更新浏览时长失败:', err)
		}
	}
	const updatePageView = async () => {
		try {
			// 检查文章ID是否存在
			if (!props.article_id) {
				return;
			}
			
			// 添加锁机制防止重复增加浏览量
			if (isUpdatingPageView.value) {
				console.log('浏览量更新已在进行中，跳过重复操作');
				return;
			}
			
			// 设置锁定状态
			isUpdatingPageView.value = true;
			
			// 从本地存储中获取已浏览文章记录
			const viewedKey = `viewed_${props.article_id}`;
			const lastViewTime = uni.getStorageSync(viewedKey);
			const currentTime = Date.now();
			
			// 如果在3秒钟内已经浏览过，不再增加浏览量
			if (lastViewTime && (currentTime - lastViewTime < 3 * 1000)) {
				console.log('3秒钟内已浏览过此文章，不增加浏览量');
				isUpdatingPageView.value = false;
				return;
			}
			
			// 更新最后浏览时间
			uni.setStorageSync(viewedKey, currentTime);
			
			// 获取设备信息
			const systemInfo = uni.getSystemInfoSync();
			
			// 检测当前平台
			let platformType = 'unknown'
			// #ifdef MP-WEIXIN
			platformType = 'weixin'
			// #endif
			// #ifdef MP-KUAISHOU
			platformType = 'kuaishou'
			// #endif
			
			// 准备浏览者信息 - 无论是否登录都创建记录
			let viewerInfo = {
				view_source: 'direct', // 默认为直接访问
				ip_address: '', // 小程序无法获取IP
				device_info: {
					platform: platformType, // 使用检测到的平台类型
					system: systemInfo.system || '',
					model: systemInfo.model || ''
				}
			};
			
			// 获取用户当前位置的地区信息
			try {
				const locationRes = await uni.getLocation({
					type: 'gcj02'
				});
				
				if (locationRes && locationRes.longitude && locationRes.latitude) {
					// 调用API获取地区信息
					const locationKey = `${locationRes.longitude},${locationRes.latitude}`;
					const addrInfo = await articleApi.addReady(locationKey);
					
					if (addrInfo && addrInfo.district) {
						viewerInfo.user_district = addrInfo.district;
						console.log('浏览者地区信息:', addrInfo.district);
					}
				}
			} catch (locationErr) {
				console.warn('获取地区信息失败:', locationErr);
				// 地区信息获取失败不影响主流程
			}
			
			// 检查是否有分享者信息
			const sharerId = uni.getStorageSync('current_sharer_id');
			const sharerName = uni.getStorageSync('current_sharer_name');
			const sharerAvatar = uni.getStorageSync('current_sharer_avatar');
			
			if (sharerId) {
				// 如果有分享者信息，设置来源为分享
				viewerInfo.view_source = 'share';
				viewerInfo.sharer_id = sharerId;
				viewerInfo.sharer_name = sharerName;
				viewerInfo.sharer_avatar = sharerAvatar;
				console.log('记录分享来源，分享者信息:', {
					id: sharerId,
					name: sharerName,
					avatar: sharerAvatar
				});
				
				// 注意：不在这里清除分享者信息，保留给砍价功能使用
				// 分享者信息将在页面卸载时清除，或者在砍价成功后清除
			}
			
			// 如果用户已登录，使用真实用户信息
			if (userStore.userInfo && userStore.userInfo.uid) {
				viewerInfo.user_id = userStore.userInfo.uid;
				viewerInfo.user_nickName = userStore.userInfo.nickName || '匿名用户';
				viewerInfo.user_avatarUrl = userStore.userInfo.avatarUrl || getDefaultImage('avatar');
			} else {
				// 未登录用户，生成临时标识
				let guestId = uni.getStorageSync('guest_id');
				if (!guestId) {
					// 生成唯一的访客ID
					guestId = 'guest_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
					uni.setStorageSync('guest_id', guestId);
					console.log('新生成访客ID:', guestId);
				} else {
					console.log('使用已存在的访客ID:', guestId);
				}
				
				viewerInfo.user_id = guestId;
				viewerInfo.user_nickName = '匿名访客';
				viewerInfo.user_avatarUrl = getDefaultImage('avatar');
			}
			
				console.log('浏览者信息:', viewerInfo);
			
			// 计算实际浏览时长
			const actualDuration = calculateActualViewDuration();
			// 使用实际浏览时长，不再强制最小值
			viewerInfo.actual_view_duration = actualDuration; // 使用实际浏览时长
			
			console.log('实际浏览时长:', actualDuration + 's', '最终传送:', viewerInfo.actual_view_duration + 's');
			
			// 直接调用API更新浏览量并保存浏览记录
			const result = await articleApi.updateLookCount(props.article_id, viewerInfo);
			
			// 如果更新成功，更新本地的浏览量数据
			if (result && result.code === 0) {
				// 获取服务器返回的浏览量
				const updatedViewCount = result.data?.look_count || (articleDetail.value?.look_count || 0) + 1;
				
				// 更新文章详情中的浏览量
				if (articleDetail.value) {
					articleDetail.value.look_count = updatedViewCount;
					console.log('文章浏览量已更新为:', articleDetail.value.look_count);
				}
				
				// 发送全局浏览量更新事件，以便更新文章列表中的计数
				uni.$emit('articleViewCountUpdated', {
					articleId: props.article_id,
					viewCount: updatedViewCount
				});
			}
		} catch (err) {
			console.error('更新浏览量失败:', err);
			
			// 即使API调用失败，也尝试在本地更新浏览量
			if (articleDetail.value) {
				const localViewCount = (articleDetail.value.look_count || 0) + 1;
				articleDetail.value.look_count = localViewCount;
				
				// 发送全局浏览量更新事件
				uni.$emit('articleViewCountUpdated', {
					articleId: props.article_id,
					viewCount: localViewCount
				});
			}
		} finally {
			// 解除锁定状态
			isUpdatingPageView.value = false;
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
			console.log('onMounted 执行');
			
			// 确保浏览者弹窗初始状态为隐藏
			viewersListVisible.value = false;
			viewersList.value = [];
			viewersLoading.value = false;
			viewersTotal.value = 0;
			hasMoreViewers.value = true;
			
			// 如果 onLoad 已经处理了数据加载，这里不再重复加载
			if (currentArticleId.value && articleDetail.value._id) {
				console.log('数据已在 onLoad 中加载，跳过重复加载');
				
				// 获取视频播放器上下文
				if (articleDetail.value.videoURL) {
					setTimeout(() => {
						videoContext.value = uni.createVideoContext('articleVideo');
						if (videoContext.value) {
							console.log('视频播放器已初始化，默认有声播放');
						}
					}, 300);
				}
				
				// 添加文章到浏览记录
				saveViewedArticle();
				return;
			}
			
			// 如果 onLoad 没有执行或失败，这里作为后备方案
			console.log('onLoad 未加载数据，使用 onMounted 作为后备');
			
			// 初始化加载状态
			isLoading.value = true;
			
			// 从当前页面获取参数
			const pages = getCurrentPages();
			const currentPage = pages[pages.length - 1];
			const options = currentPage.$page?.options || {};
			
			// 使用当前页面的 options 获取 article_id
			const articleId = options.article_id || currentArticleId.value || props.article_id;
			
			if (!articleId) {
				throw new Error('文章ID不能为空');
			}
			
			// 更新 currentArticleId
			if (!currentArticleId.value) {
				currentArticleId.value = articleId;
			}

			// 先获取文章详情，让用户尽快看到内容
			await getArticleDetail();
			
			// 文章详情加载完成后，就可以显示页面了
			isLoading.value = false;
			
			// 获取视频播放器上下文
			if (articleDetail.value.videoURL) {
				setTimeout(() => {
					videoContext.value = uni.createVideoContext('articleVideo');
					if (videoContext.value) {
						console.log('视频播放器已初始化，默认有声播放');
					}
				}, 300);
			}
			
			// 更新浏览量
			updatePageView().catch(err => {
				console.error('更新浏览量失败:', err);
			});
			
			// 获取点赞状态
			await getLikeStatus();
			
			// 添加文章到浏览记录
			saveViewedArticle();
			
		} catch (err) {
			console.error('页面初始化失败:', err);
			uni.showToast({
				title: '加载失败，请重试',
				icon: 'none'
			});
		} finally {
			// 确保在任何情况下都设置加载状态为false
			isLoading.value = false;
			// 再次确保浏览者弹窗隐藏
			viewersListVisible.value = false;
		}
	})

	onUnmounted(() => {
		// 清除定时器（评论相关代码已删除）
	})

	// 添加图片预览方法
	const previewImage = (current) => {
		if (!articleDetail.value.images || !articleDetail.value.images.length) return
		
		// 只提取有效URL的图片，统一使用compressedURL
		const validImages = articleDetail.value.images.filter(img => {
			const url = img.compressedURL;
			return url && (url.startsWith('http') || url.startsWith('/'));
		});
		
		if (validImages.length === 0) {
			console.log('没有有效的图片可以预览');
			uni.showToast({
				title: '图片无法预览',
				icon: 'none'
			});
			return;
		}
		
		const urls = validImages.map(img => img.compressedURL);
		
		// 如果传入的current不是有效URL，则使用第一个有效URL
		let currentIndex = 0;
		if (current && typeof current === 'string') {
			const index = urls.findIndex(url => url === current);
			if (index !== -1) {
				currentIndex = index;
			}
		}
		
		console.log(`准备预览图片，有效图片数: ${urls.length}，当前索引: ${currentIndex}`);
		
		// 使用新的图片预览工具函数
		previewImages(urls, currentIndex);
	}
	
	// 位置信息处理函数
	const getSimplifiedLocation = () => {
		if (!articleDetail.value) return '';
		
		const { address, district } = articleDetail.value;
		
		// 如果有完整地址，优先显示地址
		if (address && address.trim()) {
			// 简化地址显示，去除过长的详细信息
			let simplifiedAddress = address.trim();
			
			// 如果地址过长，进行截取
			if (simplifiedAddress.length > 50) {
				simplifiedAddress = simplifiedAddress.substring(0, 47) + '...';
			}
			
			return simplifiedAddress;
		}
		
		// 如果没有地址但有区域信息，显示区域
		if (district && district.trim()) {
			return district.trim();
		}
		
		// 都没有则返回空字符串
		return '';
	};
	
	// 添加处理轮播图变化的方法
	const handleSwiperChange = (e) => {
		currentImageIndex.value = e.detail.current
	}

	// 添加图片加载完成的处理方法
	const handleImageLoad = (index) => {
		console.log(`图片 ${index} 加载成功`);
		
		// 清除超时计时器
		if (imageLoadTimeouts.value[index]) {
			clearTimeout(imageLoadTimeouts.value[index]);
			delete imageLoadTimeouts.value[index];
		}
		
		// 设置加载状态为已加载
		imageLoadStatus.value[index] = 'loaded';
		
		// 显示所有图片索引的完整URL信息
		if (articleDetail.value?.images?.[index]) {
			const img = articleDetail.value.images[index];
			console.log(`========== 图片${index}已标记为已加载状态 ==========`);
			console.log(`图片${index}完整URL信息:`);
			console.log('  - compressedURL:', img.compressedURL || '无');
			console.log('  - thumbnailURL:', img.thumbnailURL || '无');
			console.log('  - url:', img.url || '无');
			console.log('  - 加载状态:', imageLoadStatus.value[index]);
			console.log('================================================');
		}
		
		// 检查所有图片加载状态
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
			
			try {
				// 尝试不同的加载策略
				if (imageRetryCount.value[index] === 1) {
					// 第一次重试：尝试使用原始URL替代压缩URL
					if (img.compressedURL !== img.url && img.url) {
						console.log('尝试使用原始URL加载图片:', img.url);
						newUrl = img.url;
						shouldRetry = true;
					}
				} else if (imageRetryCount.value[index] === 2) {
					// 第二次重试：添加时间戳避免缓存问题
					const timestamp = new Date().getTime();
					const baseUrl = img.url || img.compressedURL;
					if (baseUrl) {
						newUrl = baseUrl.includes('?') 
							? `${baseUrl}&t=${timestamp}` 
							: `${baseUrl}?t=${timestamp}`;
						shouldRetry = true;
					}
				} else if (imageRetryCount.value[index] === 3) {
					// 第三次重试：尝试使用图片代理服务
					const baseUrl = img.url || img.compressedURL;
					if (baseUrl) {
						// 这里可以使用你自己的图片代理服务URL
						// 例如: newUrl = `https://your-proxy-service.com/proxy?url=${encodeURIComponent(baseUrl)}`;
						// 如果没有代理服务，就再次添加不同的时间戳
						const timestamp = new Date().getTime() + 1000;
						newUrl = baseUrl.includes('?') 
							? `${baseUrl}&t=${timestamp}&retry=final` 
							: `${baseUrl}?t=${timestamp}&retry=final`;
						shouldRetry = true;
					}
				}
				
				if (shouldRetry && newUrl) {
					console.log(`图片 ${index} 重试 (${imageRetryCount.value[index]}/${MAX_RETRY_COUNT}): ${newUrl}`);
					
					// 使用Vue的更新方法确保响应式更新
					articleDetail.value.images[index] = {
						...articleDetail.value.images[index],
							compressedURL: newUrl
					};
					
					// 保持loading状态以允许重试
					imageLoadStatus.value[index] = 'loading';
					
					// 再次设置超时，增加超时时间
					const increasedTimeout = IMAGE_LOAD_TIMEOUT + (imageRetryCount.value[index] * 5000); // 每次重试增加5秒
					console.log(`图片 ${index} 设置加载超时: ${increasedTimeout}ms`);
					
					imageLoadTimeouts.value[index] = setTimeout(() => {
						if (imageLoadStatus.value[index] === 'loading') {
							console.log(`图片 ${index} 重试后依然超时`);
							imageLoadStatus.value[index] = 'error';
							checkAllImagesLoaded();
						}
					}, increasedTimeout);
					
					return;
				}
			} catch (err) {
				console.error('处理图片重试失败:', err);
				// 如果重试过程出错，直接标记为错误状态
				imageLoadStatus.value[index] = 'error';
				checkAllImagesLoaded();
				return;
			}
		}
		
		// 如果多次尝试后仍然失败，标记为错误
		imageLoadStatus.value[index] = 'error';
		console.log(`图片${index}加载失败，已标记为错误状态 (已重试${imageRetryCount.value[index]}次)`);
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
		if (!articleDetail.value || !articleDetail.value.images || !articleDetail.value.images.length) {
			isAnyImageLoading.value = false;
			return;
		}
		
		const imageCount = articleDetail.value.images.length;
		let loadedCount = 0;
		let errorCount = 0;
		
		for (let i = 0; i < imageCount; i++) {
			if (imageLoadStatus.value[i] === 'loaded') {
				loadedCount++;
			} else if (imageLoadStatus.value[i] === 'error') {
				errorCount++;
			}
		}
		
		console.log(`图片加载状态: 已加载 ${loadedCount}, 错误 ${errorCount}, 总数 ${imageCount}`);
		
		// 如果所有图片都已加载完成或标记为错误，显示内容
		if (loadedCount + errorCount >= imageCount) {
			isAnyImageLoading.value = false;
		}
		
		// 如果大部分图片(70%)都已加载，也可以显示内容
		if (loadedCount > imageCount * 0.7) {
			isAnyImageLoading.value = false;
		}
	};

	// 处理关注功能
	const handleFollow = async (followedId) => {
		// ... existing code ...
	}
	
	// 砍价图标加载状态
	const bargainIconError = ref(false);
	
	// 处理砍价图标加载成功
	const handleBargainIconLoad = () => {
		console.log('砍价图标加载成功');
		bargainIconError.value = false;
	};
	
	// 处理砍价图标加载错误
	const handleBargainIconError = (e) => {
		console.error('砍价图标加载失败:', e);
		bargainIconError.value = true;
		// 不显示toast，静默切换到备用图标
		console.warn('已切换到备用uni-icons图标');
	};
	
	// 处理客服会话
	const handleContact = (e) => {
		// 记录客服会话事件
		console.log('客服会话事件:', e)
		
		// 使用新API获取应用基础信息和平台信息
		let appInfo;
		try {
			// 尝试使用新API
			appInfo = uni.getAppBaseInfo();
		} catch (error) {
			// 降级处理：如果新API不可用，使用其他方式判断
			console.warn('getAppBaseInfo不可用，尝试使用替代方法');
			appInfo = {};
			try {
				// 尝试通过环境变量判断
				const envInfo = uni.getEnv ? uni.getEnv() : {};
				appInfo.AppPlatform = envInfo.platform || '';
			} catch (err) {
				console.error('获取环境信息失败', err);
			}
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

	// 监听来自其他页面的点赞状态更新
	uni.$on('updateArticleLikeStatus', (data) => {
		if (data && data.articleId === props.article_id) {
			isArticleLiked.value = data.isLiked;
			likeCount.value = data.likeCount;
			if (articleDetail.value) {
				articleDetail.value.like_count = data.likeCount;
			}
		}
	});
	
	// 页面卸载时移除事件监听
	onBeforeUnmount(() => {
		uni.$off('updateArticleLikeStatus');
		uni.$off('setShareInfo');
		uni.$off('viewCountUpdated');
	});

	// 添加视频事件处理
	const handleVideoLoad = (e) => {
		videoLoadStatus.value = 'loaded';
		// 获取视频原始宽高
		if (e && e.detail) {
			const { width, height } = e.detail;
			if (width && height) {
				// 计算视频高度，基于750rpx全宽
				const aspectRatio = height / width;
				videoHeight.value = Math.round(750 * aspectRatio);
				console.log('视频尺寸:', { width, height, aspectRatio, calculatedHeight: videoHeight.value });
			}
		}
		
		// 视频加载完成
		if (videoContext.value) {
			console.log('视频加载完成，默认有声播放');
		}
	};
	
	const handleVideoError = () => {
		videoLoadStatus.value = 'error';
		uni.showToast({
			title: '视频加载失败',
			icon: 'none'
		});
	};


	
	// 添加页面隐藏事件处理
	onHide(() => {
		// 处理页面不可见
		handleVisibilityChange(false)
		console.log('页面隐藏')
	})
		
	// 添加页面卸载事件处理
	onUnload(() => {
		// 计算最终浏览时长并更新数据库
		const finalDuration = calculateActualViewDuration()
		updateViewDurationOnServer(finalDuration)
			
		// 清除分享者信息（页面卸载时清除）
		uni.removeStorageSync('current_sharer_id');
		uni.removeStorageSync('current_sharer_name');
		uni.removeStorageSync('current_sharer_avatar');
		console.log('已清除分享者信息');
		
		// 清理其他可能的监听器和定时器
		uni.$off('setShareInfo');
		uni.$off('viewCountUpdated');
		uni.$off('updateArticleLikeStatus');
			
		console.log('页面卸载，最终浏览时长:', finalDuration + 's')
	})
	


	// 添加一个全局的文章ID引用
	const currentArticleId = ref('');

	// 页面加载时执行
	onLoad(async (options) => {
		console.log('onLoad 接收到的参数:', options);
		console.log('onLoad 原始 URL:', window?.location?.href || 'URL不可用');
		
		// 定义统一的参数解析函数
		const parseQueryParams = (queryString) => {
			const params = {};
			if (!queryString) return params;
			
			// 处理以 ? 开头的情况
			const cleanQuery = queryString.startsWith('?') ? queryString.substring(1) : queryString;
			
			// 分割参数
			if (cleanQuery) {
				cleanQuery.split('&').forEach(param => {
					if (!param) return; // 跳过空参数
					
					const [key, value] = param.split('=');
					if (key && value !== undefined) {
						try {
							params[decodeURIComponent(key)] = decodeURIComponent(value);
						} catch (e) {
							// 解码失败，使用原始值
							console.warn('参数解码失败:', key, value, e);
							params[key] = value;
						}
					}
				});
			}
			
			return params;
		};
		
		// 尝试多种方式获取 article_id
		let queryParams = {};
		
		// 方式1: 直接从 options.article_id 获取（应用内跳转）
		if (options && options.article_id) {
			currentArticleId.value = options.article_id;
			console.log('✅ 方式1: 从 options.article_id 获取:', currentArticleId.value);
		}
		// 方式1.5: 从小程序码扫码进入（直接从options获取参数）
		else if (options && options.scene) {
			console.log('='.repeat(60));
			console.log('🔍 检测到小程序码扫码进入');
			console.log('🔍 options:', JSON.stringify(options, null, 2));
			
			// 小程序码通过page路径传参，直接从options获取
			if (options.article_id) {
				currentArticleId.value = options.article_id;
				console.log('✅ 从options获取文章ID:', currentArticleId.value);
				
				// 获取分享者信息
				if (options.sharer_id) {
					queryParams.sharer_id = options.sharer_id;
					console.log('✅ 从options获取分享者ID:', options.sharer_id);
					
					// 查询分享者完整信息
					try {
						const userApi = uniCloud.importObject('userWx', { customUI: true });
						const userRes = await userApi.getUser(options.sharer_id);
						if (userRes && userRes.data && userRes.data[0]) {
							queryParams.sharer_name = userRes.data[0].nickName || '匿名用户';
							queryParams.sharer_avatar = userRes.data[0].avatarUrl || getDefaultImage('avatar');
							console.log('✅ 获取到分享者信息:', queryParams.sharer_name);
						}
					} catch (err) {
						console.error('❌ 查询分享者信息失败:', err);
					}
				}
			}
			
			console.log('='.repeat(60));
		} 
		// 方式2: 从 options.query 获取（朋友圈分享等场景）
		else if (options && options.query) {
			console.log('🔍 方式2: 检测到 options.query:', options.query);
			queryParams = parseQueryParams(options.query);
			console.log('🔍 解析后的参数:', queryParams);
			
			if (queryParams.article_id) {
				currentArticleId.value = queryParams.article_id;
				console.log('✅ 方式2: 从 options.query 获取 article_id:', currentArticleId.value);
			} else {
				console.warn('⚠️ 方式2: query 中没有 article_id, queryParams:', queryParams);
			}
		} 
		// 方式3: 从 options 中的其他参数获取（兼容性处理）
		else if (options) {
			// 遍历 options 的所有属性，寻找 article_id
			for (const key in options) {
				if (key === 'article_id' || key.includes('article_id')) {
					currentArticleId.value = options[key];
					console.log(`✅ 从 options.${key} 获取:`, currentArticleId.value);
					break;
				}
			}
		}
		
		// 方式4: 从 props 获取（组件传参）
		if (!currentArticleId.value && props.article_id) {
			currentArticleId.value = props.article_id;
			console.log('✅ 从 props.article_id 获取:', currentArticleId.value);
		}
		
		// 方式5: 从页面栈获取（后备方案）
		if (!currentArticleId.value) {
			try {
				const pages = getCurrentPages();
				const currentPage = pages[pages.length - 1];
				if (currentPage && currentPage.options) {
					console.log('从页面栈获取参数:', currentPage.options);
					
					if (currentPage.options.article_id) {
						currentArticleId.value = currentPage.options.article_id;
						console.log('✅ 从页面栈获取 article_id:', currentArticleId.value);
					} else if (currentPage.options.query) {
						const pageQueryParams = parseQueryParams(currentPage.options.query);
						if (pageQueryParams.article_id) {
							currentArticleId.value = pageQueryParams.article_id;
							console.log('✅ 从页面栈 query 获取 article_id:', currentArticleId.value);
						}
					}
				}
			} catch (e) {
				console.error('从页面栈获取参数失败:', e);
			}
		}
		
		// 如果仍然没有获取到 article_id，显示错误
		if (!currentArticleId.value) {
			console.error('❌ 所有方式都未能获取到 article_id，options:', options);
			uni.showModal({
				title: '提示',
				content: '文章链接无效，请返回重试',
				showCancel: true,
				cancelText: '返回',
				confirmText: '去首页',
				success: (res) => {
					if (res.confirm) {
						// 跳转到首页
						uni.switchTab({
							url: '/pages/index/index'
						});
					} else if (res.cancel) {
						// 返回上一页
						uni.navigateBack({
							delta: 1,
							fail: () => {
								// 如果没有上一页，跳转到首页
								uni.switchTab({
									url: '/pages/index/index'
								});
							}
						});
					}
				}
			});
			return;
		}
		
		console.log('✅ 最终确定的 article_id:', currentArticleId.value);
		
		// 处理分享者信息（从 options 或 queryParams 中获取）
		let sharerInfo = {};
		
		// 优先处理从 App.vue 传递的 sharer_id_suffix（海报扫码场景）
		if (options && options.sharer_id_suffix) {
			console.log('🔍 检测到 sharer_id_suffix 参数:', options.sharer_id_suffix);
			try {
				// 使用云函数查询用户信息
				const result = await userApi.getUserByIdSuffix(options.sharer_id_suffix);
				
				if (result && result.errCode === 0 && result.data) {
					const sharerData = result.data;
					sharerInfo = {
						id: sharerData._id,
						name: sharerData.nickName || '匿名用户',
						avatar: sharerData.avatarUrl || getDefaultImage('avatar')
					};
					console.log('✅ 通过 sharer_id_suffix 解析到分享者:', sharerData.nickName);
				} else {
					console.warn('⚠️ 未找到匹配的分享者');
				}
			} catch (err) {
				console.error('查询分享者信息失败:', err);
			}
		}
		// 尝试从 options 直接获取
		else if (options && options.sharer_id) {
			sharerInfo = {
				id: options.sharer_id,
				name: options.sharer_name ? decodeURIComponent(options.sharer_name) : '匿名用户',
				avatar: options.sharer_avatar ? decodeURIComponent(options.sharer_avatar) : getDefaultImage('avatar')
			};
		} 
		// 如果 queryParams 中有分享者信息（朋友圈分享）
		else if (queryParams.sharer_id) {
			sharerInfo = {
				id: queryParams.sharer_id,
				name: queryParams.sharer_name || '匿名用户',
				avatar: queryParams.sharer_avatar || getDefaultImage('avatar')
			};
		}
		
		// 如果有分享者信息，保存到本地
		if (sharerInfo.id) {
			uni.setStorageSync('current_sharer_id', sharerInfo.id);
			uni.setStorageSync('current_sharer_name', sharerInfo.name);
			uni.setStorageSync('current_sharer_avatar', sharerInfo.avatar);
			console.log('✅ 通过分享进入，分享者信息:', sharerInfo);
			
			// 【调试模式】显示分享者信息弹窗
			uni.showToast({
				title: `检测到分享者: ${sharerInfo.name}`,
				icon: 'none',
				duration: 3000
			});
		} else {
			console.log('⚠️ 未检测到分享者信息');
			
			// 【调试模式】显示未检测到分享者提示
			uni.showToast({
				title: '未检测到分享者信息',
				icon: 'none',
				duration: 2000
			});
		}
		
		// 初始化页面进入时间
		initPageEnterTime()
		
		// 重置图片加载状态
		imageLoadStatus.value = {};
		imageRetryCount.value = {};
		
		// 重置浏览者弹窗状态
		viewersListVisible.value = false;
		viewersList.value = [];
		viewersLoading.value = false;
		viewersTotal.value = 0;
		hasMoreViewers.value = true;
		viewersPageNo.value = 1;
		
		// 清除所有超时计时器
		Object.keys(imageLoadTimeouts.value).forEach(key => {
			clearTimeout(imageLoadTimeouts.value[key]);
		});
		imageLoadTimeouts.value = {};
		
		// 初始化加载状态
		isLoading.value = true;
		isAnyImageLoading.value = true;
		
		// 注意：SharedArrayBuffer警告是Chrome M92+的一项安全措施
		// 在小程序环境中这个警告通常可以忽略，因为小程序有自己的安全机制
		// 详见: https://developer.chrome.com/blog/enabling-shared-array-buffer/
		
			try {
				// 先获取文章详情
				await getArticleDetail();
				
				// 更新浏览计数
				await updatePageView();
				
				// 页面加载完成后，立即在后台生成海报（不阻塞UI）
				console.log('🎨 页面加载完成，开始后台生成海报...');
				setTimeout(() => {
					if (!posterImagePath.value && !isGeneratingPoster.value) {
						isGeneratingPoster.value = true;
						triggerPosterGeneration(true).catch(err => { // 静默模式
							console.error('后台生成海报失败:', err);
							isGeneratingPoster.value = false;
							// 即使生成失败，也启用按钮（降级到无海报状态）
							isPosterReady.value = true;
							console.log('⚠️ 海报生成失败，但按钮已启用（降级模式）');
						});
					}
				}, 500); // 延迟500ms，确保页面渲染完成
				
				console.log('✅ 页面加载成功');
								
				// 加载打赏数据
				if (currentArticleId.value) {
					loadRewardData().catch(err => {
						console.error('加载打赏数据失败:', err)
					})
				}
			} catch (error) {
			console.error('❌ 页面加载失败:', error);
			
			// 更详细的错误信息
			let errorMsg = '加载失败';
			if (error.message) {
				if (error.message.includes('文章ID')) {
					errorMsg = '文章不存在';
				} else if (error.message.includes('网络') || error.message.includes('network')) {
					errorMsg = '网络异常，请检查网络连接';
				} else if (error.message.includes('权限') || error.message.includes('permission')) {
					errorMsg = '没有访问权限';
				}
			}
			
			// 显示错误提示对话框
			uni.showModal({
				title: '加载失败',
				content: errorMsg + '，是否重试？',
				showCancel: true,
				cancelText: '返回',
				confirmText: '重试',
				success: async (res) => {
					if (res.confirm) {
						// 重试加载
						try {
							uni.showLoading({ title: '重新加载中...' });
							await getArticleDetail();
							await updatePageView();
							try {
								uni.hideLoading();
							} catch (e) {
								console.warn('隐藏loading失败:', e);
							}
							uni.showToast({ title: '加载成功', icon: 'success' });
						} catch (retryError) {
							try {
								uni.hideLoading();
							} catch (e) {
								console.warn('隐藏loading失败:', e);
							}
							console.error('重试失败:', retryError);
							uni.showToast({ title: '重试失败', icon: 'none' });
							// 跳转到首页
							setTimeout(() => {
								uni.switchTab({ url: '/pages/index/index' });
							}, 1500);
						}
					} else {
						// 返回上一页或首页
						uni.navigateBack({
							delta: 1,
							fail: () => {
								uni.switchTab({ url: '/pages/index/index' });
							}
						});
					}
				}
			});
		} finally {
			isLoading.value = false;
			// 再次确保浏览者弹窗隐藏
			viewersListVisible.value = false;
		}
	});
	
	// 页面显示时执行
	onShow(async () => {
		// 确保浏览者弹窗在页面显示时隐藏
		viewersListVisible.value = false;
		// 处理页面可见性变化
		handleVisibilityChange(true)
		console.log('页面显示');
		
		// 重新获取点赞状态，确保显示最新状态
		if (articleDetail.value?._id || props.article_id) {
			try {
				await getLikeStatus();
				console.log('页面显示时已刷新点赞状态:', { isLiked: isArticleLiked.value, likeCount: likeCount.value });
			} catch (err) {
				console.error('刷新点赞状态失败:', err);
			}
		}
	});

	// 预加载图片
	const preloadImages = (imageList, startIndex = 0) => {
		if (!imageList || !Array.isArray(imageList) || imageList.length === 0) {
			console.log('无图片可预加载');
			return;
		}
		
		// 计算总数和已加载数
		const totalCount = imageList.length;
		let loadedCount = 0;
		let errorCount = 0;
		
		// 更新加载状态
		const updateLoadingStatus = () => {
			if (loadedCount + errorCount === totalCount) {
				isAnyImageLoading.value = false;
				console.log(`图片加载完成: 成功 ${loadedCount}, 失败 ${errorCount}`);
			} else {
				console.log(`图片加载状态: 已加载 ${loadedCount}, 错误 ${errorCount}, 总数 ${totalCount}`);
			}
		};
		
		// 逐个预加载图片
		const loadNextImage = (index) => {
			if (index >= totalCount) {
				updateLoadingStatus();
				return;
			}
			
			const img = imageList[index];
			if (!img) {
				console.log(`图片 ${index} 为空`);
				errorCount++;
				loadNextImage(index + 1);
				return;
			}
			
			// 获取图片URL
			let url = img.compressedURL || img.thumbnailURL || img.url;
			
			// 如果仍然没有URL，标记为错误并继续
			if (!url) {
				console.log(`图片 ${index} 没有有效URL`);
				errorCount++;
				loadNextImage(index + 1);
				return;
			}
			
			// 直接设置为已加载状态，不进行实际预加载
			// 这样可以避免小程序环境下的getImageInfo错误
			loadedCount++;
			console.log(`标记图片 ${index} 为已加载，URL: ${url.substring(0, 50)}${url.length > 50 ? '...' : ''}`);
			
			// 立即加载下一张图片，不使用延时
			loadNextImage(index + 1);
		};
		
		// 开始预加载
		loadNextImage(startIndex);
	}

	// 处理图片加载完成后的操作
	const handleArticleLoaded = () => {
		// 延迟处理图片，避免与初始渲染冲突
		setTimeout(() => {
			if (articleDetail.value && articleDetail.value.images) {
				// 使用优化后的预加载方式
				preloadImages(articleDetail.value.images);
				
				// 标记图片加载状态
				articleDetail.value.images.forEach((img, index) => {
					imageLoadStatus.value[index] = 'loaded';
				});
				
				// 设置为非加载状态，显示页面内容
				isAnyImageLoading.value = false;
				console.log('文章已加载完成，标记所有图片为已加载状态');
			}
		}, 300);
	};

	// 在文章详情加载完成后处理图片
	watch(() => articleDetail.value._id, (newVal) => {
		if (newVal) {
			// 文章ID变化时触发处理
			nextTick(() => {
				handleArticleLoaded();
			});
		}
	});

	// 监听加载状态变化
	watch(() => isLoading.value, (newVal, oldVal) => {
		if (oldVal === true && newVal === false) {
			// 从加载中变为加载完成时触发
			handleArticleLoaded();
		}
	});

	// 显示浏览者列表
	const showViewersList = async () => {
		try {
			// 检查用户是否登录
			const isLoggedIn = await customTestLogin()
			if (!isLoggedIn) {
				return
			}
			
			// 检查是否是文章作者
			if (!userStore.userInfo || userStore.userInfo.uid !== articleDetail.value.user_id) {
				uni.showToast({
					title: '只有作者才能查看浏览者',
					icon: 'none'
				})
				return
			}
			
			// 禁止背景滚动（小程序环境尽量兼容）
			try {
				// 为了更好地防止滚动穿透，同时设置多个属性
				if (typeof document !== 'undefined') {
					const body = document.body;
					const html = document.documentElement;
					
					// 保存原始状态
					body.dataset.originalOverflow = body.style.overflow || '';
					body.dataset.originalPosition = body.style.position || '';
					body.dataset.originalWidth = body.style.width || '';
					body.dataset.originalHeight = body.style.height || '';
					html.dataset.originalOverflow = html.style.overflow || '';
					
					// 设置防滚动属性
					body.style.overflow = 'hidden';
					body.style.position = 'fixed';
					body.style.width = '100%';
					body.style.height = '100%';
					body.style.top = '0';
					body.style.left = '0';
					html.style.overflow = 'hidden';
				}
			} catch (err) {
				console.warn('设置背景滚动锁定失败:', err)
			}
			
			// 重置状态
			viewersList.value = []
			viewersPageNo.value = 1
			hasMoreViewers.value = true
			viewersTotal.value = 0
			
			// 显示浏览者列表
			viewersListVisible.value = true
			
			// 加载浏览者数据
			await loadViewers(true)
			
		} catch (err) {
			console.error('显示浏览者列表失败:', err)
			uni.showToast({
				title: '操作失败',
				icon: 'none'
			})
		}
	}
	
	// 处理浏览者列表下拉刷新
	const handleViewersRefresh = async () => {
		console.log('浏览者列表下拉刷新开始');
		viewersRefreshing.value = true;
		await loadViewers(true);
		// 延迟停止刷新动画，给用户反馈
		setTimeout(() => {
			viewersRefreshing.value = false;
		}, 500);
	};
	
	// 处理浏览者列表刷新结束
	const handleViewersRefreshRestore = () => {
		console.log('浏览者列表刷新结束');
		viewersRefreshing.value = false;
	};
	
	// 加载浏览者数据
	const loadViewers = async (refresh = false) => {
		try {
			if (viewersLoading.value) {
				console.log('正在加载中，跳过重复请求');
				return;
			}
			
			if (refresh) {
				// 重置分页参数
				viewersPageNo.value = 1;
				viewersList.value = [];
				hasMoreViewers.value = true;
				console.log('刷新浏览者列表');
			} else if (!hasMoreViewers.value) {
				console.log('没有更多数据了');
				return;
			}
			
			viewersLoading.value = true;
			console.log('加载第', viewersPageNo.value, '页数据', '文章ID:', currentArticleId.value);
			
			// 调用云函数获取浏览者列表（使用实际的文章ID）
			const result = await articleApi.getViewers(currentArticleId.value, {
				pageNo: viewersPageNo.value,
				pageSize: viewersPageSize.value
			});
			
			if (result.code === 0) {
				const { viewers, total, totalPages } = result.data;
				console.log('加载成功:', {
					viewers: viewers.length,
					total,
					totalPages,
					currentPage: viewersPageNo.value
				});
				
				if (refresh) {
					viewersList.value = viewers;
				} else {
					// 触底加载，追加新数据
					viewersList.value.push(...viewers);
				}
				
				viewersTotal.value = total;
				hasMoreViewers.value = viewersPageNo.value < totalPages;
				
				// 只有在成功加载后才更新页码
				if (hasMoreViewers.value) {
					viewersPageNo.value++;
				}
				
				console.log('更新后状态:', {
					viewersListLength: viewersList.value.length,
					hasMoreViewers: hasMoreViewers.value,
					nextPageNo: viewersPageNo.value
				});
			} else {
				uni.showToast({
					title: result.message || '获取浏览者列表失败',
					icon: 'none'
				});
			}
			
		} catch (err) {
			console.error('加载浏览者数据失败:', err);
			uni.showToast({
				title: '加载失败',
				icon: 'none'
			});
		} finally {
			viewersLoading.value = false;
			console.log('加载结束，当前列表长度:', viewersList.value.length);
			
			// 确保停止下拉刷新动画
			setTimeout(() => {
				viewersLoading.value = false;
			}, 100);
		}
	}
	
	// 关闭浏览者列表
	const closeViewersList = () => {
		// 恢复背景滚动（小程序环境尽量兼容）
		try {
			if (typeof document !== 'undefined') {
				const body = document.body;
				const html = document.documentElement;
				
				// 恢复原始状态
				body.style.overflow = body.dataset.originalOverflow || '';
				body.style.position = body.dataset.originalPosition || '';
				body.style.width = body.dataset.originalWidth || '';
				body.style.height = body.dataset.originalHeight || '';
				body.style.top = '';
				body.style.left = '';
				html.style.overflow = html.dataset.originalOverflow || '';
				
				// 清理dataset
				delete body.dataset.originalOverflow;
				delete body.dataset.originalPosition;
				delete body.dataset.originalWidth;
				delete body.dataset.originalHeight;
				delete html.dataset.originalOverflow;
			}
		} catch (err) {
			console.warn('恢复背景滚动失败:', err)
		}
		
		viewersListVisible.value = false
		viewersList.value = []
		viewersPageNo.value = 1
		viewersPageSize.value = 20
		viewersTotal.value = 0
		hasMoreViewers.value = true
		viewersLoading.value = false
		// 重置刷新状态
		viewersRefreshing.value = false
	}
	
	// 获取浏览来源文本
	const getSourceText = (source, viewer) => {
		// 如果是分享来源且有分享者信息，不显示任何文本，直接显示分享者信息
		if (source === 'share' && viewer && viewer.sharer_name) {
			return '';
		}
		
		const sourceMap = {
			home: '首页',
			category: '分类',
			search: '搜索',
			share: '分享',
			direct: '直接访问'
		}
		return sourceMap[source] || '未知'
	}
	
	// 处理浏览者头像加载失败
	const handleViewerAvatarError = (index, event) => {
		console.warn(`浏览者 ${index} 头像加载失败:`, viewersList.value[index]?.user_avatarUrl);
		
		// 确保浏览者数据存在
		if (viewersList.value[index]) {
			// 更新为默认头像
			viewersList.value[index].user_avatarUrl = getDefaultImage('avatar');
		}
	};
	
	// 处理分享者头像加载失败（标识头像）
	const handleSharerAvatarError = (index, event) => {
		console.warn(`分享者标识头像 ${index} 加载失败:`, viewersList.value[index]?.sharer_avatar);
		
		// 确保浏览者数据存在
		if (viewersList.value[index]) {
			// 更新为默认头像
			viewersList.value[index].sharer_avatar = getDefaultImage('avatar');
		}
	};
	
	// 处理分享者头像加载失败（优化版显示）
	const handleSharerAvatarErrorOptimized = (index, event) => {
		console.warn(`分享者头像 ${index} 加载失败:`, viewersList.value[index]?.sharer_avatar);
		
		// 确保浏览者数据存在
		if (viewersList.value[index]) {
			// 更新为默认头像
			viewersList.value[index].sharer_avatar = getDefaultImage('avatar');
		}
	};
	
	// ========== 打赏相关方法 ==========
	
	// 打开打赏弹窗
	const openRewardPopup = async () => {
		try {
			// 检查登录状态
			const isLoggedIn = await customTestLogin()
			if (!isLoggedIn) {
				return
			}
			
			// 移除作者身份检查，允许管理员和作者打赏
			
			// 加载打赏统计和列表
			await loadRewardData()
			
			// 打开弹窗
			if (rewardPopupRef.value) {
				rewardPopupRef.value.open()
			}
		} catch (err) {
			console.error('打开打赏弹窗失败:', err)
			uni.showToast({
				title: '操作失败',
				icon: 'none'
			})
		}
	}
	
	// 加载打赏数据
	const loadRewardData = async () => {
		try {
			if (!currentArticleId.value) {
				return
			}
			
			const rewardApi = uniCloud.importObject('rewardWx', { customUI: true })
			
			// 加载统计
			const statsRes = await rewardApi.getRewardStatistics({
				article_id: currentArticleId.value
			})
			
			if (statsRes.code === 0) {
				rewardStatistics.value = statsRes.data
			}
			
			// 加载打赏列表（最近10条）
			const listRes = await rewardApi.getRewardList({
				article_id: currentArticleId.value,
				page: 1,
				pageSize: 10
			})
			
			if (listRes.code === 0) {
				rewardList.value = listRes.data.list || []
			}
		} catch (err) {
			console.error('加载打赏数据失败:', err)
		}
	}
	
	// 打赏成功回调
	const handleRewardSuccess = async (data) => {
		uni.showToast({
			title: '打赏成功',
			icon: 'success'
		})
		
		// 重新加载打赏数据
		await loadRewardData()
	}
	
	// 格式化浏览时长
	const formatDuration = (seconds) => {
		if (!seconds || seconds <= 0) return '刚刚';
		
		// 转换为整数
		const totalSeconds = Math.floor(seconds);
		
		// 统一使用秒作为单位显示
		if (totalSeconds < 5) {
			return '刚刚';
		} else {
			return `${totalSeconds}秒`;
		}
	};
	
	// 获取浏览时长的样式类
	const getDurationStyle = (seconds) => {
		if (!seconds || seconds <= 0) return 'duration-short';
		
		const totalSeconds = Math.floor(seconds);
		
		if (totalSeconds < 30) {
			return 'duration-short'; // 短时浏览
		} else if (totalSeconds < 120) {
			return 'duration-medium'; // 中等时长
		} else {
			return 'duration-long'; // 长时间浏览
		}
	};
	
	// 显示浏览时长详情
	const showDurationDetail = (viewer) => {
		const duration = viewer.view_duration;
		const userName = viewer.user_nickName || '匿名用户';
		const isGuest = viewer.user_id && viewer.user_id.startsWith('guest_');
		
		// 添加调试信息
		console.log('浏览时长详情:', {
			userName,
			isGuest,
			duration,
			formattedDuration: formatDuration(duration),
			rawData: viewer
		});
		
		let category = '';
		let description = '';
		
		if (duration < 30) {
			category = '快速浏览';
			description = '用户快速浏览了您的内容';
		} else if (duration < 120) {
			category = '认真阅读';
			description = '用户认真阅读了您的内容';
		} else {
			category = '深度阅读';
			description = '用户深度阅读了您的内容，显示出很高的兴趣！';
		}
		
		uni.showModal({
			title: '浏览时长详情',
			content: `${userName}${isGuest ? '(访客)' : ''} 的浏览时长为 ${formatDuration(duration)}（${duration}秒），属于“${category}”类型。\n\n${description}`,
			confirmText: '知道了',
			showCancel: false
		});
	};
	
	// 调试：监听浏览者弹窗状态变化
	watch(viewersListVisible, (newVal, oldVal) => {
		console.log('浏览者弹窗状态变化:', { 
			from: oldVal, 
			to: newVal,
			timestamp: new Date().toLocaleTimeString()
		});
	}, { immediate: true });
	
	// 在 script setup 部分添加编辑相关的方法
	const handleEdit = () => {
		// 检查是否是文章作者
		if (!userStore.userInfo || !userStore.userInfo.uid || userStore.userInfo.uid !== articleDetail.value.user_id) {
			uni.showToast({
				title: '只能编辑自己的文章',
				icon: 'none'
			})
			return
		}

		// 跳转到发布页面进行编辑
		uni.navigateTo({
			url: `/pages/fabu/fabu?mode=edit&article_id=${props.article_id}`,
			fail: (err) => {
				console.error('跳转编辑页面失败:', err)
				uni.showToast({
					title: '跳转失败',
					icon: 'none'
				})
			}
		})
	}
	
	// 添加倒计时数据状态
	const countdownDays = ref('00')
	const countdownHours = ref('00')
	const countdownMinutes = ref('00')
	const countdownSeconds = ref('00')
	
	// 检查砍价是否过期
	const checkBargainExpired = () => {
		if (!articleDetail.value.bargain_end_time || articleDetail.value.bargain_end_time === 0) {
			isBargainExpired.value = false
			remainingTime.value = ''
			remainingSeconds.value = 0
			countdownDays.value = '00'
			countdownHours.value = '00'
			countdownMinutes.value = '00'
			countdownSeconds.value = '00'
			return false
		}
		
		const now = Date.now()
		const endTime = articleDetail.value.bargain_end_time
		
		if (now >= endTime) {
			isBargainExpired.value = true
			remainingTime.value = '活动已结束'
			remainingSeconds.value = 0
			countdownDays.value = '00'
			countdownHours.value = '00'
			countdownMinutes.value = '00'
			countdownSeconds.value = '00'
			return true
		}
		
		// 计算剩余时间（精确到秒）
		const diff = endTime - now
		const days = Math.floor(diff / (1000 * 60 * 60 * 24))
		const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
		const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
		const seconds = Math.floor((diff % (1000 * 60)) / 1000)
		
		// 更新倒计时显示（格式化为两位数）
		countdownDays.value = String(days).padStart(2, '0')
		countdownHours.value = String(hours).padStart(2, '0')
		countdownMinutes.value = String(minutes).padStart(2, '0')
		countdownSeconds.value = String(seconds).padStart(2, '0')
		
		// 保存秒数用于特殊显示
		remainingSeconds.value = seconds
		
		if (days > 0) {
			remainingTime.value = `剩余${days}天${hours}小时${minutes}分`
		} else if (hours > 0) {
			remainingTime.value = `剩余${hours}小时${minutes}分`
		} else if (minutes > 0) {
			remainingTime.value = `剩余${minutes}分`
		} else {
			remainingTime.value = `剩余`
		}
		
		isBargainExpired.value = false
		return false
	}
	
	// 砖价成功事件处理
	const handleBargainSuccess = (data) => {
		console.log('砍价成功:', data)
		// 同步状态
		syncBargainCompleteStatus()
		// 刷新砍价小组列表
		if (bargainGroupsRef.value && typeof bargainGroupsRef.value.loadGroups === 'function') {
			setTimeout(() => {
				bargainGroupsRef.value.loadGroups()
				console.log('已刷新砍价小组列表')
			}, 1000) // 延迟1秒刷新，确保数据已更新
		}
	}
	
	// 砍价完成事件处理
	const handleBargainComplete = (data) => {
		console.log('砍价完成:', data)
		// 更新完成状态
		isBargainComplete.value = true
		// 刷新砍价小组列表
		if (bargainGroupsRef.value && typeof bargainGroupsRef.value.loadGroups === 'function') {
			setTimeout(() => {
				bargainGroupsRef.value.loadGroups()
			}, 1000)
		}
			
		// 检查是否是第一个完成的用户
		if (data.article_completed && data.winner_nickname) {
			const isWinner = data.winner_nickname === (userStore.userInfo?.nickName || '')
				
			if (isWinner) {
				// 当前用户是获胜者
				uni.showModal({
					title: '恭喜！',
					content: '您是第一个完成砍价的用户，请联系作者领取奖励！',
					confirmText: '联系作者',
					showCancel: true,
					cancelText: '稍后',
					success: (res) => {
						if (res.confirm && articleDetail.value.user_mobile) {
							// 调用拨号功能
							uni.makePhoneCall({
								phoneNumber: articleDetail.value.user_mobile
							})
						}
					}
				})
			} else {
				// 当前用户不是获胜者，但活动已经结束
				uni.showToast({
					title: `活动已结束，获胜者是：${data.winner_nickname}`,
					icon: 'none',
					duration: 3000
				})
			}
		} else {
			// 显示完成提示
			uni.showModal({
				title: '恭喜！',
				content: '砍价已完成，请联系作者领取奖励！',
				confirmText: '联系作者',
				showCancel: true,
				cancelText: '稍后',
				success: (res) => {
					if (res.confirm && articleDetail.value.user_mobile) {
						// 调用拨号功能
						uni.makePhoneCall({
							phoneNumber: articleDetail.value.user_mobile
						})
					}
				}
			})
		}
	}
	
	// 处理邀请好友砍价（分享）
	const handleShareInvite = () => {
		console.log('用户点击邀请好友砍价')
		// 触发分享功能
		uni.showShareMenu({
			withShareTicket: true,
			success: () => {
				console.log('开启分享成功')
			},
			fail: (err) => {
				console.error('开启分享失败:', err)
				uni.showToast({
					title: '请点击右上角分享给好友',
					icon: 'none',
					duration: 2000
				})
			}
		})
	}
	
	// 处理查看详情
	const handleViewDetail = () => {
		console.log('用户点击查看详情')
		// 可以跳转到砍价记录页面或其他相关页面
		uni.showToast({
			title: '查看详情功能开发中',
			icon: 'none'
		})
	}
	
	// 处理砍价小组卡片点击
	const handleGroupClick = (group) => {
		console.log('点击砍价小组:', group)
		// 可以跳转到小组详情页或展开详细信息
		// 这里简单显示小组信息
		uni.showModal({
			title: '砍价小组详情',
			content: `发起人：${group.initiator_nickname}\n已砍金额：¥${group.total_bargained_amount.toFixed(2)}\n参与人数：${group.total_participants}人\n进度：${group.progress}%`,
			showCancel: false
		})
	}
	
	// 处理加入砍价小组
	const handleJoinGroup = (group) => {
		console.log('==== 父组件接收到 join-group 事件 ====', group)
		
		if (!group) {
			console.error('小组数据为空')
			return
		}
		
		console.log('小组信息:', {
			initiator_id: group.initiator_id,
			initiator_nickname: group.initiator_nickname,
			is_complete: group.is_complete,
			total_participants: group.total_participants
		})
		
		// 检查活动是否已过期
		if (isBargainExpired.value) {
			console.log('砍价活动已过期')
			uni.showToast({
				title: '砍价活动已结束',
				icon: 'none',
				duration: 2000
			})
			return
		}
		
		// 存储当前选择的小组发起人ID，用于砍价时关联到该小组
		try {
			uni.setStorageSync('current_sharer_id', group.initiator_id)
			console.log('已存储砍价小组发起人ID:', group.initiator_id)
		} catch (e) {
			console.error('存储发起人ID失败:', e)
		}
		
		// 提示用户即将参与砍价
		const message = group.is_complete ? '该小组已完成砍价' : '已选择小组，请点击“帮砍一刀”按钮'
		console.log('显示提示:', message)
		
		uni.showToast({
			title: message,
			icon: 'success',
			duration: 2000
		})
		
		// 如果小组未完成，引导用户进行砍价
		if (!group.is_complete) {
			console.log('小组未完成，引导用户砍价')
			// 这里可以添加滚动到砍价操作按钮的逻辑
		}
	}
	
	// 砍价小组列表组件引用
	const bargainGroupsRef = ref(null)
	
	// 砍价组件引用
	const dianzanBargainRef = ref(null)
	// 砍价完成状态
	const isBargainComplete = ref(false)
	
	// 获取砍价成功话术
	const getBargainSuccessMessage = () => {
		// 可以根据不同情况返回不同的话术
		if (!articleDetail.value.enable_bargain) {
			return ''
		}
		
		// 优先使用自定义文字，如果没有则使用默认话术
		return articleDetail.value.bargain_popup_text || '🎉 太棒了！您已成功帮忙砍了一刀！赶快分享给更多好友，让他们一起来砍价吧！'
	}
		
	// 拨打电话功能
	const makePhoneCall = (phoneNumber) => {
		if (!phoneNumber) {
			uni.showToast({
				title: '电话号码为空',
				icon: 'none'
			});
			return;
		}
			
		uni.makePhoneCall({
			phoneNumber: phoneNumber,
			success: () => {
				console.log('拨打电话成功:', phoneNumber);
			},
			fail: (err) => {
				console.error('拨打电话失败:', err);
				uni.showToast({
					title: '拨打电话失败',
					icon: 'none'
				});
			}
		});
	}
</script>

<template>
	<view class="article-detail-container">
		<!-- 加载状态 -->
		<view class="custom-loading-container" v-if="isLoading && !articleDetail._id">
			<view class="loading-spinner">
				<uni-icons type="spinner-cycle" size="48" color="#399bfe"></uni-icons>
			</view>
			<text class="loading-text">内容加载中...</text>
			<!-- 调试信息（仅开发环境） -->
			<!-- #ifdef MP-WEIXIN -->
			<view class="debug-info" style="margin-top: 20rpx; padding: 20rpx; font-size: 24rpx; color: #999; text-align: left; max-width: 600rpx;" v-if="false">
				<text>调试信息：</text>
				<text>article_id: {{ currentArticleId || 'null' }}</text>
				<text>props.article_id: {{ props.article_id || 'null' }}</text>
				<text>是否正在加载: {{ isLoading }}</text>
			</view>
			<!-- #endif -->
		</view>
		
		<!-- 空白状态（加载完成但无数据） -->
		<view class="empty-state" v-if="!isLoading && !articleDetail._id">
			<view class="empty-icon">
				<uni-icons type="info-filled" size="80" color="#CCCCCC"></uni-icons>
			</view>
			<text class="empty-title">文章加载失败</text>
			<text class="empty-desc">请检查网络连接或联系客服</text>
			<view class="empty-actions">
				<button class="action-btn primary" @click="refreshPage">重新加载</button>
				<button class="action-btn" @click="goToHome">返回首页</button>
			</view>
			<!-- 调试信息（默认显示，方便排查问题） -->
			<view class="debug-info" style="margin-top: 40rpx; padding: 20rpx; background: #f5f5f5; border-radius: 8rpx; font-size: 24rpx; color: #999; text-align: left; max-width: 600rpx;">
				<view style="margin-bottom: 10rpx;"><text style="font-weight: bold; color: #333;">调试信息：</text></view>
				<view><text>currentArticleId: {{ currentArticleId || '未设置' }}</text></view>
				<view><text>props.article_id: {{ props.article_id || '未设置' }}</text></view>
				<view><text>articleDetail._id: {{ articleDetail._id || '未加载' }}</text></view>
				<view><text>isLoading: {{ isLoading }}</text></view>
				<view style="margin-top: 10rpx; padding-top: 10rpx; border-top: 1px solid #ddd;">
					<text style="font-size: 22rpx; color: #666;">请截图此信息反馈给开发人员</text>
				</view>
			</view>
		</view>

		<!-- 主内容区域 - 不使用scroll-view以支持原生下拉刷新 -->
		<view class="article-detail-main" v-show="articleDetail._id">
				<view class="article-detail fade-in-animation">
					<!-- 头部文章内容 -->
					<view class="articleHead">
						<!-- 视频和图片区域 -->
						<view class="media-container">
							<!-- 视频区域 - 单独显示，添加动态高度绑定 -->
							<view class="articleVideo" v-if="articleDetail.videoURL" :style="{ height: videoHeight + 'rpx' }">
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
									:muted="isMuted"
									object-fit="contain"
									:poster="articleDetail.images && articleDetail.images[0] ? articleDetail.images[0].compressedURL : ''"
									controls
									@error="handleVideoError"
									@loadedmetadata="handleVideoLoad"
								></video>
														
								<!-- 音量控制按钮 -->
								<view class="volume-control-btn" @click.stop="toggleMute">
									<!-- 使用uni-icons统一图标 -->
									<uni-icons 
										:type="isMuted ? 'micoff-filled' : 'sound-filled'" 
										size="24" 
										color="#ffffff"
									></uni-icons>
								</view>
							</view>
							
							<!-- 砍价信息卡片 - 在视频播放器下方显示 -->
							<view class="bargain-info-card" v-if="articleDetail.enable_bargain">
								<view class="bargain-card-header">
									<!-- 优先显示本地图片，加载失败后显示备用图标 -->
									<image 
										v-if="!bargainIconError"
										class="bargain-header-icon" 
										src="/static/images/砍价2.png" 
										mode="aspectFit"
										@error="handleBargainIconError"
										@load="handleBargainIconLoad"
									></image>
									<!-- 备用方案：uni-icons 图标 -->
									<uni-icons 
										v-else
										type="compose" 
										size="28" 
										color="#ff6b6b"
									></uni-icons>
									<text class="bargain-title">砍价活动</text>
								</view>
								<view class="bargain-card-content">
									<!-- 倒计时显示 - 简洁样式 -->
									<view class="bargain-countdown-top" v-if="articleDetail.bargain_end_time && articleDetail.bargain_end_time > 0 && !isBargainExpired">
										<!-- 天数格子 -->
										<view class="countdown-box">
											<text class="countdown-number">{{ countdownDays }}</text>
										</view>
										<text class="countdown-label">天</text>
																
										<!-- 小时格子 -->
										<view class="countdown-box">
											<text class="countdown-number">{{ countdownHours }}</text>
										</view>
										<text class="countdown-label">小时</text>
																
										<!-- 分钟格子 -->
										<view class="countdown-box">
											<text class="countdown-number">{{ countdownMinutes }}</text>
										</view>
										<text class="countdown-label">分钟</text>
																
										<!-- 秒数格子 -->
										<view class="countdown-box">
											<text class="countdown-number">{{ countdownSeconds }}</text>
										</view>
										<text class="countdown-label">秒</text>
									</view>
									
									<dianzan 
										ref="dianzanBargainRef"
										mode="bargain"
										:articleId="articleDetail._id || props.article_id"
										:initialLiked="isArticleLiked"
										:initialCount="likeCount"
										:initialPrice="articleDetail.bargain_initial_price || 0"
										:bargainStep="articleDetail.bargain_step || 10"
										:bargainEndTime="articleDetail.bargain_end_time || 0"
										:bargainSuccessMessage="getBargainSuccessMessage()"
										:bargainPopupImage="articleDetail.bargain_popup_image"
										:bargainAmountText="articleDetail.bargain_amount_text || ''"
										:showBargainPopup="true"
										:showText="true"
										:showCount="false"
										@update:liked="(val) => isArticleLiked = val"
										@update:count="(val) => likeCount = val"
										@bargain-success="handleBargainSuccess"
										@bargain-complete="handleBargainComplete"
										@share-invite="handleShareInvite"
										@view-detail="handleViewDetail"
									/>

								</view>
							</view>
						
						<!-- 砍价小组列表 - 独立显示在砍价卡片外部 -->
						<bargain-groups 
							v-if="articleDetail.enable_bargain"
							ref="bargainGroupsRef"
							:articleId="articleDetail._id || props.article_id"
							@group-click="handleGroupClick"
						/>
							
							<!-- 图片显示区域 - 在砍价模块后面 -->
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
										@click="previewImage(item.compressedURL || item.thumbnailURL || item.url)"
									>
										<!-- 图片加载失败占位符 -->
										<view class="image-placeholder" v-if="imageLoadStatus[index] === 'error'">
											<uni-icons type="image" size="24" color="#999999"></uni-icons>
											<text>加载失败</text>
										</view>
										
										<!-- 图片加载中占位符 -->
										<view class="image-placeholder loading" v-else-if="imageLoadStatus[index] !== 'loaded'">
											<uni-icons type="spinner-cycle" size="24" color="#666666"></uni-icons>
											<text>加载中</text>
										</view>
										
										<!-- 图片 -->
										<image 
											:src="item.compressedURL || item.thumbnailURL || item.url || getDefaultImage('default')" 
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
					<view class="article-meta-info">
						<view class="meta-item date">
							<uni-icons type="calendar" size="18" color="#666666"></uni-icons>
							<text>{{formatTime(articleDetail.create_time)}}</text>
						</view>
						<view class="meta-divider"></view>
						<view class="meta-item views" @click="showViewersList">
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
							<!-- 使用rich-text组件渲染包含手机号链接的内容（小程序优化版本） -->
							<rich-text 
								class="category-name rich-text-content"
								:nodes="processedContent"
								@tap="handleRichTextTap"
								space="nbsp"
							></rich-text>
							<!-- 备用方案：如果rich-text无法正常工作，提供普通文本点击 -->
							<view class="phone-text-fallback" v-if="!processedContent" @tap="handleTextPhoneDetection">
								<text class="category-name">{{articleDetail.content}}</text>
							</view>
						</view>
					</view>

					
				
				<!-- 详情图展示 - 在文章内容下方重复展示图片 -->
					<view class="article-detail-images" v-if="articleDetail.images && articleDetail.images.length" style="border-top: 0px solid #f5f5f5;">
						<view class="detail-images-title">
							<view class="line"></view>
							<text>详情图片 ({{articleDetail.images.length}}张)</text>
							<view class="line"></view>
						</view>
						<view class="detail-images-container">
							<view class="detail-image-wrapper" v-for="(item, index) in articleDetail.images" :key="index">
								<!-- 加载失败占位符 -->
								<view class="detail-image-placeholder" v-if="imageLoadStatus[index] === 'error'">
									<uni-icons type="image" size="32" color="#cccccc"></uni-icons>
									<text>图片加载失败</text>
								</view>
								
								<!-- 加载中占位符 -->
								<view class="detail-image-placeholder loading" v-else-if="imageLoadStatus[index] !== 'loaded'">
									<uni-icons type="spinner-cycle" size="32" color="#666666"></uni-icons>
									<text>加载中...</text>
								</view>
								
								<image 
									class="detail-image"
									:src="item.compressedURL || getDefaultImage('default')" 
									mode="widthFix"
									@click="previewImage(item.compressedURL || getDefaultImage('default'))"
									@load="handleImageLoad(index)"
									@error="handleImageError(index)"
									:style="{opacity: imageLoadStatus[index] === 'loaded' ? 1 : 0}"
								></image>
							</view>
						</view>
					</view>
					
					<!-- 位置信息显示 - 在详情图片后面 -->
					<view class="location-info-section" v-if="articleDetail.address || articleDetail.district">
						<view class="location-header">
							<uni-icons type="location" size="16" color="#399bfe"></uni-icons>
							<text class="location-title">位置信息</text>
						</view>
						<view class="location-content">
							<text class="location-address">地址：{{ getSimplifiedLocation() }}</text>
						</view>
					</view>
					
					<!-- 打赏模块 -->
					<view class="reward-section" v-if="false">
						<view class="reward-container">
							<view class="reward-header">
								<view class="reward-title-box">
									<uni-icons type="gift" size="20" color="#ff6b35"></uni-icons>
									<text class="reward-title">打赏支持</text>
								</view>
								<view class="reward-stats" v-if="rewardStatistics.totalCount > 0">
									<text class="stats-text">{{ rewardStatistics.userCount }}人已打赏</text>
								</view>
							</view>
							
							<view class="reward-content">
								<view class="reward-desc">
									<text>如果觉得内容对您有帮助，欢迎打赏支持作者</text>
								</view>
								
								<button class="reward-btn" @click="openRewardPopup">
									<uni-icons type="wallet" size="18" color="#fff"></uni-icons>
									<text>打赏作者</text>
								</button>
							</view>
							
							<!-- 打赏列表 -->
							<view class="reward-list" v-if="rewardList.length > 0">
								<view class="reward-list-title">
									<text>最近打赏</text>
								</view>
								<scroll-view class="reward-scroll" scroll-x>
									<view class="reward-item" v-for="(item, index) in rewardList" :key="index">
										<image 
											class="reward-avatar" 
											:src="item.from_user_avatar || getDefaultImage('avatar')" 
											mode="aspectFill"
										></image>
										<view class="reward-info">
											<text class="reward-name">{{ item.from_user_name }}</text>
											<text class="reward-amount">¥{{ (item.amount / 100).toFixed(2) }}</text>
										</view>
									</view>
								</scroll-view>
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
				
				<!-- 点赞按钮 - 隐藏显示，保留功能 -->
				<view class="action-item" style="display: none;">
					<dianzan 
						mode="like"
						:articleId="articleDetail._id || props.article_id"
						:initialLiked="isArticleLiked"
						:initialCount="likeCount"
						:showText="true"
						:showCount="false"
						@update:liked="(val) => isArticleLiked = val"
						@update:count="(val) => likeCount = val"
					/>
				</view>
				
				<!-- 添加编辑按钮 -->
				<view class="action-item" v-if="userStore.userInfo && userStore.userInfo.uid === articleDetail.user_id" @click="handleEdit">
					<uni-icons type="compose" size="24" color="#444444"></uni-icons>
					<view class="text">
						编辑
					</view>
				</view>
				
				<!-- 海报生成按钮 -->
				<view class="action-item" :class="{'disabled': !isPosterReady}">
					<article-poster
						:articleId="articleDetail._id || props.article_id"
						:content="articleDetail.content"
						:category="articleDetail.cate_name"
						:images="articleDetail.images"
						:authorName="userStore.userInfo?.nickName || '匿名用户'"
						:authorAvatar="processedPosterAvatarUrl"
						:publishTime="articleDetail.create_time"
						:viewCount="articleDetail.look_count"
						:disabled="!isPosterReady"
						@posterGenerated="handlePosterGenerated"
					/>
				</view>
				
				<!-- 打赏按钮 -->
				<view 
					class="action-item" 
					v-if="false"
					@click="openRewardPopup"
				>
					<uni-icons type="gift" size="24" color="#ff6b35"></uni-icons>
					<view class="text" style="color: #ff6b35;">
						打赏
					</view>
				</view>
				
				<!-- 转发按钮 -->
				<button open-type="share" class="action-item" :class="{'disabled': !isPosterReady}" :disabled="!isPosterReady">
					<uni-icons custom-prefix="icon" type="lishuai-zhuanfa" size="24" :color="isPosterReady ? '#444444' : '#cccccc'"></uni-icons>
					<view class="text" :style="{color: isPosterReady ? '#444444' : '#cccccc'}">
						转发
					</view>
				</button>
				
				<view 
					class="call-btn" 
					:class="{ 
						'complete': isBargainComplete,
						'disabled': !articleDetail.enable_bargain || isBargainExpired || !dianzanBargainRef
					}"
					@click="handleBargainHelp"
				>
					<image src="/static/images/砍价.png" class="bargain-icon"></image>
					<view class="call-text">{{ isBargainComplete ? '已完成' : (!articleDetail.enable_bargain ? '未开启' : isBargainExpired ? '已结束' : '帮砍一刀') }}</view>
				</view>
			</view>
		</view>
		
		<!-- 浏览者列表弹窗 -->
		<view 
			class="viewers-modal" 
			v-show="viewersListVisible" 
			:data-visible="viewersListVisible.toString()"
			@click="closeViewersList"
			@touchmove.stop.prevent
		>
			<view class="viewers-popup" @click.stop @touchmove.stop.prevent>
				<!-- 弹窗头部 -->
				<view class="popup-header">
					<view class="header-title">
						<text class="title-text">浏览者列表</text>
						<text class="count-text">（共{{viewersTotal}}次）</text>
					</view>
					<view class="close-btn" @click="closeViewersList">
						<uni-icons type="close" size="20" color="#666"></uni-icons>
					</view>
				</view>
				

				
				<!-- 浏览者列表 -->
				<scroll-view 
					class="viewers-list" 
					scroll-y 
					@scrolltolower="() => loadViewers(false)"
					@scroll="(e) => console.log('滚动事件:', e.detail)"
					@touchmove.stop.prevent
					:show-scrollbar="false"
					:enable-flex="true"
					:scroll-with-animation="true"
					:refresher-enabled="true"
					:refresher-triggered="viewersRefreshing"
					@refresherrefresh="handleViewersRefresh"
					@refresherrestore="handleViewersRefreshRestore"
					:lower-threshold="100"
					:upper-threshold="50"
					@click.stop
				>
					<view class="viewer-item" v-for="(viewer, index) in viewersList" :key="index">
						<view class="viewer-avatar">
							<image 
								:src="viewer.user_avatarUrl || getDefaultImage('avatar')" 
								mode="aspectFill"
								@error="handleViewerAvatarError(index, $event)"
							></image>
							<!-- 优化后的分享者头像标识，只在没有分享者信息时显示 -->
							<view class="sharer-badge" v-if="viewer.view_source === 'share' && viewer.sharer_avatar && !viewer.sharer_name">
								<image 
									:src="viewer.sharer_avatar || getDefaultImage('avatar')" 
									mode="aspectFill"
									@error="handleSharerAvatarError(index, $event)"
								></image>
							</view>
						</view>
						<view class="viewer-info">
							<view class="viewer-name">
								<text>{{viewer.user_nickName || '匿名用户'}}</text>
								<!-- 访客用户标识 -->
								<text class="guest-badge" v-if="viewer.user_id && viewer.user_id.startsWith('guest_')">访客</text>
								<!-- 访问时间显示在名字后边 -->
								<text class="viewer-time-inline">{{formatTime(viewer.view_time)}}</text>
							</view>
							<!-- 显示浏览时长（秒数） -->
							<view class="viewer-duration-info" v-if="viewer.view_duration != null && viewer.view_duration >= 0">
								<text>停留{{viewer.view_duration}}秒</text>
							</view>
						</view>
						<!-- 右侧区域：显示电话、地区、来源标签或分享者信息 -->
						<view class="viewer-right-section">
							<!-- 显示电话和地区信息 -->
							<view class="viewer-contact-info" v-if="viewer.user_mobile || viewer.user_district">
								<text class="contact-item contact-phone" v-if="viewer.user_mobile" @click.stop="makePhoneCall(viewer.user_mobile)">
									<uni-icons type="phone" size="14" color="#666"></uni-icons>
									{{viewer.user_mobile}}
								</text>
								<text class="contact-item" v-if="viewer.user_district">
									<uni-icons type="location" size="14" color="#666"></uni-icons>
									{{viewer.user_district}}
								</text>
							</view>
							<!-- 优化：如果是分享来源且有分享者信息，显示分享人信息（头像+昵称） -->
							<view class="sharer-info-optimized" v-if="viewer.view_source === 'share' && viewer.sharer_name">
								<view class="sharer-avatar-only">
									<image 
										:src="viewer.sharer_avatar || getDefaultImage('avatar')" 
										mode="aspectFill"
										@error="handleSharerAvatarErrorOptimized(index, $event)"
									></image>
								</view>
								<text class="sharer-name-display">{{viewer.sharer_name}}</text>
							</view>
							<!-- 显示浏览来源标签 -->
							<view class="viewer-source" v-else-if="viewer.view_source && getSourceText(viewer.view_source, viewer)">
								<text class="source-tag">{{getSourceText(viewer.view_source, viewer)}}</text>
							</view>
						</view>
					</view>
					
					<!-- 加载更多 -->
					<view class="load-more" v-if="viewersLoading">
						<uni-load-more status="loading" :contentText="{contentrefresh: '加载中...'}"></uni-load-more>
					</view>
					
					<!-- 没有更多数据 -->
					<view class="no-more" v-if="!hasMoreViewers && viewersList.length > 0">
						<text>没有更多数据了</text>
					</view>
					
					<!-- 空状态 -->
					<view class="empty-state" v-if="viewersList.length === 0 && !viewersLoading">
						<uni-icons type="eye-slash" size="48" color="#ccc"></uni-icons>
						<text class="empty-text">暂无浏览记录</text>
					</view>
				</scroll-view>
			</view>
		</view>
		
		<!-- 打赏弹窗 -->
		<reward-popup
			v-if="false"
			ref="rewardPopupRef"
			:articleId="currentArticleId"
			:authorId="articleDetail.user_id"
			:authorName="articleDetail.user_nickName"
			:authorAvatar="articleDetail.user_avatarUrl"
			@success="handleRewardSuccess"
		/>

	</view>
</template>

<style lang="scss" scoped>
	.article-detail-container {
		display: flex;
		flex-direction: column;
		min-height: 100vh; // 改为最小高度，允许内容撑开
		// 添加从上到下的渐变透明背景
		background: linear-gradient(to bottom, 
			rgb(227, 227, 227, 0.8) 0%, 
			rgba(232, 232, 232, 0.8) 30%, 
			rgba(226, 226, 226, 0.5) 60%, 
			rgba(226, 226, 226, 0.8) 85%, 
			rgba(226, 226, 226, 0.5) 100%
		);
		padding-bottom: 150rpx; // 优化底部padding，适配底部导航栏
		border: none;
		box-sizing: border-box;
	}

	.article-detail-scroll {
		flex: 1;
		height: calc(100vh - 120rpx - env(safe-area-inset-bottom));
		-webkit-overflow-scrolling: touch;
		// 保持透明，让父容器的渐变背景显示出来
		background-color: transparent;
	}

	.article-detail {
		padding-top: 0;
		padding-bottom: calc(120rpx + env(safe-area-inset-bottom));
		// 保持透明，让父容器的渐变背景显示出来
		background-color: transparent;
	}

	.articleHead {
		.media-container {
			display: flex;
			flex-direction: column;
			padding: 0; // 移除所有padding，让视频占满宽度
			// 保持透明，让父容器的渐变背景显示出来
			background-color: transparent;
			border-radius: 0; // 移除圆角
			
			// 视频播放区域
			.articleVideo {
				position: relative;
				width: 100%;
				// min-height: 422rpx; // 改为最小高度
				// border-radius: 0; // 移除圆角
				// background-color: #000; // 改为黑色背景，更适合视频
				margin-bottom: 0; // 移除底部边距
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
				
				// 音量控制按钮
				.volume-control-btn {
					position: absolute;
					bottom: 130rpx; // 避免被播放进度条遮挡
					right: 20rpx;
					width: 80rpx;
					height: 80rpx;
					background-color: rgba(0, 0, 0, 0.6);
					border-radius: 50%;
					display: flex;
					align-items: center;
					justify-content: center;
					z-index: 10;
					box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.3);
					transition: all 0.3s ease;
					
					&:active {
						background-color: rgba(0, 0, 0, 0.8);
						transform: scale(0.95);
					}
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
				width: calc(100% - 40rpx); // 减去左右边距20rpx
				margin: 20rpx 20rpx 0rpx 20rpx; // 顶部10rpx，左右20rpx
				border-radius: 8rpx;
				overflow: hidden;
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
							width: calc(50% - 8rpx);
							height: 300rpx;
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
					z-index: 1;
				}
			}
		}
	}

	.articleContent {
		padding: 32rpx;
		font-size: 30rpx;
		line-height: 1.9;
		background-color: #fff;
		margin: 0rpx 20rpx; // 改为20rpx左右边距
		border-radius: 12rpx;
		
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
							
			/* 手机号链接样式（使用蓝色显示） */
			:deep(.phone-link) {
				color: #007AFF !important; /* 使用蓝色显示电话号码 */
				text-decoration: none !important; /* 去除下划线 */
				padding: 2rpx 4rpx !important;
				border-radius: 4rpx !important;
				transition: all 0.2s ease !important;
				cursor: pointer !important;
								
				/* 点击时的反馈效果 */
				&:active {
					background-color: rgba(0, 122, 255, 0.1) !important; /* 蓝色背景 */
					transform: scale(0.98) !important;
				}
			}
							
			/* rich-text组件样式优化 */
			.rich-text-content {
				word-break: break-word;
				line-height: 1.6;
				/* 小程序中确保点击事件能正常触发 */
				pointer-events: auto;
								
				/* 确保span元素可以正常点击 */
				:deep(span) {
					-webkit-tap-highlight-color: rgba(57, 155, 254, 0.2);
					tap-highlight-color: rgba(57, 155, 254, 0.2);
					pointer-events: auto;
				}
			}
							
			/* 备用方案样式 */
			.phone-text-fallback {
				cursor: pointer;
				padding: 4rpx;
				border-radius: 4rpx;
								
				&:active {
					background-color: rgba(57, 155, 254, 0.1);
					opacity: 0.8;
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
		border-top: 1px solid $pyq-border-color-translucent;
		padding-bottom: env(safe-area-inset-bottom);
		z-index: 999;

		.footer-content {
			display: flex;
			align-items: center;
			justify-content: space-between;
			padding: 16rpx 32rpx;
			height: 120rpx;
			font-size: 24rpx;
			color: $pyq-text-color-body;
			
			.footer-item {
				flex: 1;
				display: flex;
				flex-direction: column;
				align-items: center;
				justify-content: center;
				gap: 4rpx;
				position: relative;
				
				.icon-wrapper {
					display: flex;
					align-items: center;
					justify-content: center;
					transition: transform 0.2s ease;
					
					&.like-animation {
						animation: heartBeat 0.5s ease;
					}
				}
				
				.footer-text {
					font-size: 24rpx;
					color: #666;
					transition: color 0.2s ease;
				}
				
				.share-button {
					background: transparent;
					border: none;
					padding: 0;
					margin: 0;
					line-height: 1;
					display: flex;
					flex-direction: column;
					align-items: center;
					gap: 4rpx;
					
					&::after {
						border: none;
					}
				}
				
				&:active {
					opacity: 0.7;
					transform: scale(0.95);
				}
			}
			
			.footer-publish {
				flex: 0 0 auto;
				margin-left: 20rpx;
				
				.publish-button {
					display: flex;
					align-items: center;
					justify-content: center;
					gap: 8rpx;
					background: linear-gradient(135deg, #399bfe 0%, #1976d2 100%);
					color: #fff;
					border: none;
					border-radius: 40rpx;
					padding: 16rpx 32rpx;
					font-size: 28rpx;
					font-weight: 500;
					box-shadow: 0 4rpx 12rpx rgba(57, 155, 254, 0.3);
					
					&::after {
						border: none;
					}
					
					&:active {
						opacity: 0.8;
						transform: scale(0.98);
					}
				}
			}

			.action-item {
				display: flex;
				flex-direction: column;
				align-items: center;
				//左边间距
				margin-left: 16rpx;
				// 添加宽度和高度，确保组件正常显示
				min-width: 0rpx;
				min-height: 80rpx;
				justify-content: center;

				.text {
					margin-top: 4rpx;
					font-size: 26rpx;
				}

				&:active {
					opacity: 0.7;
				}
			}
			
			/* 添加组件之间的间距 */
			:deep(fenxiang-zujian) {
				margin-right: 48rpx;
			}

			.call-btn {
				flex: 1;
				height: 80rpx;
				line-height: 80rpx;
				text-align: center;
				background-color: $pyq-vi-color;
				color: #fff;
				border-radius: 8rpx;
				font-size: 30rpx;
				font-weight: 600;
				display: flex;
				align-items: center;
				justify-content: center;
				gap: 12rpx;
				margin: auto 0; /* 添加上下外边距为auto，实现垂直居中 */

				.bargain-icon {
					width: 34rpx;
					height: 34rpx;
					vertical-align: middle;
				}

				.call-text {
					color: #ffffff;
					font-size: 30rpx;
					font-weight: 600;
				}

				&:active {
					opacity: 0.8;
				}
			}
		}
	}
	
	// 点赞心跳动画
	@keyframes heartBeat {
		0% { transform: scale(1); }
		14% { transform: scale(1.3); }
		28% { transform: scale(1); }
		42% { transform: scale(1.2); }
		56% { transform: scale(1); }
		100% { transform: scale(1); }
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
		padding: 0rpx 24rpx 16rpx;
		background-color: #fff;
		margin: 0;
		border-radius: 0;
		box-shadow: none;
		justify-content: flex-start; /* 修改为靠左对齐 */
		flex-wrap: wrap; /* 添加换行显示 */
		
		.info-item {
			display: flex;
			align-items: center;
			margin-right: 24rpx; /* 统一使用margin-right */
			
			&:first-child {
				margin-left: 0;
			}
			
			&:last-child {
				margin-right: 0;
			}
			
			.info-text {
				margin-left: 10rpx;
				font-size: 28rpx;
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
					padding: 10rpx 22rpx;
					border-radius: 30rpx;
					font-size: 26rpx;
					z-index: 1;
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



	/* 添加类目信息样式 */
	.category-info {
		padding: 20rpx 24rpx 18rpx;
		background-color: #fff;
		
		.category-tag {
			display: inline-flex;
			align-items: center;
			padding: 10rpx 24rpx;
			background-color: rgba(57, 155, 254, 0.1);
			border-radius: 28rpx;
			
			text {
				font-size: 28rpx;
				color: #399bfe;
				margin-left: 10rpx;
				font-weight: 600;
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
		background: linear-gradient(135deg, #ff6b6b, #ff8787); // 与砍价卡片按钮颜色一致
		color: #fff;
		padding: 10rpx 30rpx;
		border-radius: 30rpx;
		font-size: 28rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8rpx;
		box-shadow: 0 4rpx 12rpx rgba(255, 107, 107, 0.3); // 添加与砍价按钮一致的阴影
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); // 添加过渡动画
		
		// 添加按下效果，与砍价按钮一致
		&:active {
			transform: scale(0.95);
			box-shadow: 0 2rpx 8rpx rgba(255, 107, 107, 0.2);
		}
		
		// 砍价完成状态：灰色背景 + 禁止点击
		&.complete {
			background: linear-gradient(135deg, #999, #bbb); // 灰色渐变
			box-shadow: 0 4rpx 12rpx rgba(153, 153, 153, 0.3);
			pointer-events: none; // 禁止点击
			opacity: 0.6; // 降低不透明度
			cursor: not-allowed; // 显示禁止光标
			
			&:active {
				transform: none; // 移除按下效果
				box-shadow: 0 4rpx 12rpx rgba(153, 153, 153, 0.3);
			}
		}
		
		// 禁用状态：灰色背景 + 禁止点击
		&.disabled {
			background: linear-gradient(135deg, #ccc, #ddd); // 浅灰色渐变
			box-shadow: 0 4rpx 12rpx rgba(204, 204, 204, 0.3);
			pointer-events: none; // 禁止点击
			opacity: 0.5; // 降低不透明度
			cursor: not-allowed; // 显示禁止光标
			
			&:active {
				transform: none; // 移除按下效果
				box-shadow: 0 4rpx 12rpx rgba(204, 204, 204, 0.3);
			}
			
			.bargain-icon {
				opacity: 0.5; // 图标也变淡
			}
			
			.call-text {
				opacity: 0.7; // 文字也变淡
			}
		}
		
		.bargain-icon {
			width: 32rpx;
			height: 32rpx;
			flex-shrink: 0;
			// 将斧子图标变成白色
			filter: brightness(0) invert(1);
		}
		
		.call-text {
			color: #ffffff;
			font-size: 28rpx;
			font-weight: 600; // 添加字体加粗，与砍价按钮一致
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
		background-color: #fff;
		border-bottom: 1px solid #eaeaea;
		position: relative;
		justify-content: flex-start;
		align-items: center;
		overflow-x: auto;
		-webkit-overflow-scrolling: touch;
		margin: 20rpx 20rpx 0rpx 20rpx; // 改为20rpx左右边距
		border-radius: 12rpx;
		
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
			padding: 0 18rpx;
			flex-shrink: 0;
			height: 52rpx;
			line-height: 52rpx; /* 添加行高确保文字垂直居中 */
			
			uni-icons {
				display: flex;
				align-items: center;
				justify-content: center;
				height: 38rpx; /* 固定图标容器高度 */
			}
			
			text {
				font-size: 28rpx;
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
				padding: 0 18rpx;
				border-radius: 26rpx;
				height: 46rpx; /* 调整高度与其他项一致 */
				margin-left: 8rpx;
				align-self: center;
				border: 1px solid rgba(57, 155, 254, 0.2);
				
				text {
					color: #399bfe;
					font-weight: 600;
					font-size: 26rpx;
					line-height: 46rpx; /* 确保文本在分类标签中居中 */
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
		margin: 20rpx; // 改为20rpx左右边距
		background-color: #fff;
		border-radius: 12rpx;
		
		.detail-images-title {
			display: flex;
			align-items: center;
			justify-content: center;
			padding: 24rpx;
			background-color: #fff;
			border-radius: 12rpx;
			
			text {
				font-size: 32rpx;
				color: #333;
				margin: 0 32rpx;
				font-weight: 600;
				letter-spacing: 0.5rpx;
			}
			
			.line {
				height: 1px;
				flex: 0.8;
				max-width: 120rpx;
				background-color: #ccc;
			}
		}
		
		.detail-images-container {
			display: flex;
			flex-direction: column;
			
			.detail-image-wrapper {
				margin-bottom: 1rpx;
				position: relative;
				background-color: #f9f9f9;
				border-radius: 0; /* Changed from 8rpx to 0 */
				overflow: hidden;
				
				&:last-child {
					margin-bottom: 0;
				}
				
				.detail-image {
					width: 100%;
					border-radius: 0; /* Changed from 8rpx to 0 */
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
		background-color: #e2e2e2;
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
	
	/* 空白状态样式 */
	.empty-state {
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
		padding: 40rpx;
		z-index: 9999;
		
		.empty-icon {
			margin-bottom: 30rpx;
		}
		
		.empty-title {
			font-size: 32rpx;
			color: #333;
			font-weight: 500;
			margin-bottom: 16rpx;
		}
		
		.empty-desc {
			font-size: 26rpx;
			color: #999;
			margin-bottom: 40rpx;
			text-align: center;
			line-height: 1.6;
		}
		
		.empty-actions {
			display: flex;
			gap: 20rpx;
			
			.action-btn {
				padding: 24rpx 48rpx;
				border-radius: 8rpx;
				font-size: 28rpx;
				border: 1px solid #ddd;
				background-color: #fff;
				color: #333;
				transition: all 0.3s ease;
				
				&.primary {
					background-color: #399bfe;
					color: #fff;
					border-color: #399bfe;
				}
				
				&:active {
					opacity: 0.8;
					transform: scale(0.98);
				}
			}
		}
		
		.debug-info {
			view {
				margin-bottom: 8rpx;
				line-height: 1.6;
			}
		}
	}



	.image-grid .image-grid-item .image-placeholder {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background-color: #f5f5f5;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		border-radius: 8rpx;
		z-index: 2;
	}

	.image-grid .image-grid-item .image-placeholder.loading uni-icons {
		animation: spin 1.5s linear infinite;
	}

	@keyframes spin {
		0% { transform: rotate(0deg); }
		100% { transform: rotate(360deg); }
	}

	.image-grid .image-grid-item .image-placeholder text {
		font-size: 22rpx;
		color: #999;
		margin-top: 8rpx;
	}

	.detail-image-placeholder {
		width: 100%;
		min-height: 300rpx;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		background-color: #f5f5f5;
		border-radius: 0; /* Changed from 8rpx to 0 */
		
		text {
			margin-top: 20rpx;
			color: #999;
			font-size: 26rpx;
		}
		
		&.loading {
			uni-icons {
				animation: spin 1.5s linear infinite;
			}
		}
	}

	/* 浏览者列表弹窗样式 */
	.viewers-modal {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-color: rgba(0, 0, 0, 0.5);
		z-index: 1000;
		display: flex;
		align-items: flex-end;
		justify-content: center;
		/* 确保初始状态为隐藏 */
		visibility: hidden;
		opacity: 0;
		transition: opacity 0.3s ease, visibility 0.3s ease;
		/* 防止背景滚动 */
		overflow: hidden;
		-webkit-overflow-scrolling: auto;
		touch-action: none;
		/* 强制阻止滚动穿透 */
		overscroll-behavior: none;
		/* 固定定位，防止被滚动影响 */
		position: fixed !important;
		
		/* 显示状态 */
		&[data-visible="true"] {
			visibility: visible;
			opacity: 1;
		}
	}
	
	.viewers-popup {
		width: 100%;
		height: 80vh;
		max-height: 80vh;
		background-color: #ffffff;
		border-radius: 24rpx 24rpx 0 0;
		overflow: hidden;
		box-shadow: 0 -8rpx 32rpx rgba(0, 0, 0, 0.1);
		/* 修复滚动冲突问题 */
		display: flex;
		flex-direction: column;
		position: relative;
		/* 确保内容区域可以正常滚动 */
		min-height: 0;
		/* 防止滚动穿透 */
		overscroll-behavior: contain;
		touch-action: pan-y;
		/* 隔离滚动上下文 */
		isolation: isolate;
	}
	
	.popup-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 40rpx 30rpx 30rpx;
		border-bottom: 1px solid #f0f0f0;
		background-color: #fafafa;
		/* 确保头部固定不影响滚动 */
		flex-shrink: 0;
		position: relative;
		z-index: 10;
		height: auto;
		min-height: 120rpx;
		
		.header-title {
			display: flex;
			align-items: center;
			
			.title-text {
				font-size: 34rpx;
				font-weight: 600;
				color: #333;
			}
			
			.count-text {
				font-size: 26rpx;
				color: #666;
				margin-left: 12rpx;
				font-weight: normal;
			}
		}
		
		.close-btn {
			padding: 16rpx;
			cursor: pointer;
			border-radius: 50%;
			transition: background-color 0.2s ease;
			
			&:active {
				background-color: rgba(0, 0, 0, 0.05);
			}
		}
	}
	

	
	.viewers-list {
		/* 固定高度，确保滚动区域稳定 */
		height: 60vh;
		max-height: 60vh;
		min-height: 200rpx;
		padding: 20rpx 0;
		background-color: #fff;
		/* 确保滚动正常工作 */
		overflow-y: auto;
		-webkit-overflow-scrolling: touch;
		position: relative;
		flex: 1;
		/* 强制创建滚动上下文 */
		contain: layout;
		/* 防止滚动穿透 */
		overscroll-behavior: contain;
		/* 防止触摸事件穿透 */
		touch-action: pan-y;
	}
	
	.viewer-item {
		display: flex;
		align-items: center;
		padding: 24rpx 30rpx;
		border-bottom: 1px solid #f8f8f8;
		transition: background-color 0.2s ease;
		position: relative;
		
		&:last-child {
			border-bottom: none;
		}
		
		&:active {
			background-color: rgba(57, 155, 254, 0.02);
		}
		
		.viewer-avatar {
			width: 88rpx;
			height: 88rpx;
			border-radius: 50%;
			overflow: hidden;
			margin-right: 24rpx;
			flex-shrink: 0;
			box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.06);
			position: relative;
			
			&::after {
				content: '';
				position: absolute;
				top: 0;
				left: 0;
				right: 0;
				bottom: 0;
				border: 2rpx solid rgba(255, 255, 255, 0.8);
				border-radius: 50%;
				pointer-events: none;
			}
			
			image {
				width: 100%;
				height: 100%;
				object-fit: cover;
				background-color: #f5f5f5;
			}
			
			/* 单独添加的分享者头像标识样式 */
			.sharer-badge {
				position: absolute;
				bottom: -4rpx;
				right: -4rpx;
				width: 32rpx;
				height: 32rpx;
				border-radius: 50%;
				overflow: hidden;
				border: 3rpx solid #ffffff;
				box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.15);
				z-index: 10;
				
				image {
					width: 100%;
					height: 100%;
					object-fit: cover;
					background-color: #f5f5f5;
				}
			}
		}
		
		.viewer-info {
			flex: 1;
			display: flex;
			flex-direction: column;
			min-width: 0;
			margin-right: 16rpx;
			
			.viewer-name {
				font-size: 32rpx;
				color: #333;
				font-weight: 500;
				margin-bottom: 8rpx;
				overflow: hidden;
				text-overflow: ellipsis;
				white-space: nowrap;
				line-height: 1.2;
				display: flex;
				align-items: center;
				gap: 8rpx;
				
				.guest-badge {
					font-size: 22rpx;
					color: #ff6b35;
					background-color: rgba(255, 107, 53, 0.1);
					padding: 2rpx 8rpx;
					border-radius: 6rpx;
					border: 1px solid rgba(255, 107, 53, 0.2);
					flex-shrink: 0;
					font-weight: normal;
				}
				
				.viewer-time-inline {
					font-size: 24rpx;
					color: #999;
					font-weight: normal;
					margin-left: 4rpx;
					flex-shrink: 0;
				}
			}
			
			.viewer-time {
				font-size: 26rpx;
				color: #999;
				line-height: 1.2;
				margin-bottom: 4rpx;
			}
			
			.viewer-duration-info {
				font-size: 24rpx;
				color: #666;
				background-color: #f0f2f5;
				padding: 4rpx 8rpx;
				border-radius: 10rpx;
				margin-top: 4rpx;
				width: fit-content;
				font-weight: 500;
			}
			
			/* 浏览来源内联标签样式 */
			.viewer-source-inline {
				margin-top: 8rpx;
				
				.source-tag-inline {
					background: #f5f5f5;
					color: #999;
					padding: 4rpx 12rpx;
					border-radius: 12rpx;
					font-size: 22rpx;
					font-weight: 400;
					border: 1px solid #e8e8e8;
					letter-spacing: 0rpx;
					opacity: 0.8;
					display: inline-block;
					line-height: 1.2;
				}
			}
			
			/* 优化后的分享者信息样式，显示头像和昵称 */
			.sharer-info-optimized {
				display: flex;
				flex-direction: row;
				align-items: center;
				gap: 8rpx;
				margin-left: auto;
				flex-shrink: 0;
				padding: 6rpx 12rpx;
				background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
				border-radius: 20rpx;
				border: 1rpx solid rgba(108, 117, 125, 0.15);
				box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.08);
				transition: all 0.2s ease;
				
				&:active {
					transform: scale(0.98);
					box-shadow: 0 1rpx 4rpx rgba(0, 0, 0, 0.12);
				}
				
				.sharer-avatar-only {
					position: relative;
					width: 48rpx;
					height: 48rpx;
					border-radius: 50%;
					overflow: hidden;
					flex-shrink: 0;
					box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.12);
					border: 2rpx solid #ffffff;
					transition: all 0.2s ease;
					
					/* 突出头像的微妙光环 */
					&::before {
						content: '';
						position: absolute;
						top: -1rpx;
						left: -1rpx;
						right: -1rpx;
						bottom: -1rpx;
						border-radius: 50%;
						background: linear-gradient(45deg, #4CAF50, #2196F3);
						z-index: -1;
						opacity: 0.2;
					}
					
					image {
						width: 100%;
						height: 100%;
						object-fit: cover;
						border-radius: 50%;
						z-index: 1;
					}
				}
				
				/* 分享者昵称样式 */
				.sharer-name-display {
					font-size: 26rpx;
					color: #495057;
					font-weight: 600;
					letter-spacing: 0.2rpx;
					white-space: nowrap;
					max-width: 100rpx;
					overflow: hidden;
					text-overflow: ellipsis;
					line-height: 1.2;
				}
			}
			
			.viewer-duration {
				font-size: 22rpx;
				line-height: 1.2;
				display: inline-flex;
				align-items: center;
				gap: 4rpx;
				padding: 4rpx 8rpx;
				border-radius: 12rpx;
				margin-top: 6rpx;
				font-weight: 500;
				transition: all 0.2s ease;
				box-shadow: 0 1rpx 3rpx rgba(0, 0, 0, 0.1);
				cursor: pointer;
				position: relative;
				max-width: 140rpx;
				min-width: auto;
				width: fit-content;
				
				// 添加点击提示
				&::after {
					content: '点击查看详情';
					position: absolute;
					top: -40rpx;
					left: 50%;
					transform: translateX(-50%);
					background-color: rgba(0, 0, 0, 0.8);
					color: white;
					padding: 6rpx 12rpx;
					border-radius: 6rpx;
					font-size: 20rpx;
					white-space: nowrap;
					opacity: 0;
					pointer-events: none;
					transition: opacity 0.2s ease;
					z-index: 1000;
				}
				
				&:hover::after {
					opacity: 1;
				}
				
				// 短时浏览（小于30秒）
				&.duration-short {
					background: linear-gradient(135deg, #f0f2f5 0%, #e8eaed 100%);
					color: #666;
					border: 1px solid rgba(0, 0, 0, 0.05);
					min-width: 60rpx;
					padding: 4rpx 12rpx;
					justify-content: center;
				}
				
				// 中等时长（30秒-2分钟）
				&.duration-medium {
					background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
					color: #1976d2;
					border: 1px solid rgba(25, 118, 210, 0.2);
					min-width: 70rpx;
				}
				
				// 长时间浏览（超过2分钟）
				&.duration-long {
					background: linear-gradient(135deg, #f3e5f5 0%, #e1bee7 100%);
					color: #7b1fa2;
					border: 1px solid rgba(123, 31, 162, 0.2);
					position: relative;
					min-width: 70rpx;
					
					// 添加微光效果
					&::before {
						content: '';
						position: absolute;
						top: 0;
						left: 0;
						right: 0;
						bottom: 0;
						background: linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, 0.3) 50%, transparent 70%);
						border-radius: 12rpx;
						pointer-events: none;
					}
				}
				
				// 添加按下效果
				&:active {
					transform: scale(0.95);
					opacity: 0.8;
				}
				
				// 图标样式
				:deep(.uni-icons) {
					display: flex;
					align-items: center;
					justify-content: center;
					color: inherit;
				}
				
				text {
					font-size: inherit;
					color: inherit;
					font-weight: inherit;
					white-space: nowrap;
					overflow: hidden;
					text-overflow: ellipsis;
					flex-shrink: 1;
					max-width: 100rpx;
				}
			}
		}
		
		/* 右侧区域样式 */
		.viewer-right-section {
			flex-shrink: 0;
			margin-left: auto;
			display: flex;
			flex-direction: column;
			align-items: flex-end;
			gap: 8rpx;
			
			/* 电话和地区信息样式 */
			.viewer-contact-info {
				display: flex;
				flex-direction: column;
				align-items: flex-end;
				gap: 6rpx;
				
				.contact-item {
					font-size: 24rpx;
					color: #666;
					display: flex;
					align-items: center;
					gap: 6rpx;
					line-height: 1.2;
					
					&.contact-phone {
						color: #399bfe;
						cursor: pointer;
						transition: all 0.2s ease;
						padding: 4rpx 8rpx;
						border-radius: 8rpx;
						margin: -4rpx -8rpx;
						
						&:active {
							background-color: rgba(57, 155, 254, 0.1);
							transform: scale(0.98);
						}
						
						:deep(.uni-icons) {
							color: #399bfe;
						}
					}
				}
			}
		}
		
		.viewer-source {
			flex-shrink: 0;
			
			.source-tag {
				background: #f5f5f5;
				color: #999;
				padding: 4rpx 12rpx;
				border-radius: 12rpx;
				font-size: 22rpx;
				font-weight: 400;
				border: 1px solid #e8e8e8;
				letter-spacing: 0rpx;
				opacity: 0.8;
				transition: opacity 0.2s ease;
				
				&:active {
					opacity: 0.6;
				}
						
				/* 禁用状态样式 */
				&.disabled {
					opacity: 0.4;
					pointer-events: none;
					cursor: not-allowed;
							
					.text {
						color: #cccccc !important;
					}
				}
			}
		}
	}
	
	.load-more {
		padding: 20rpx 0;
		display: flex;
		justify-content: center;
		align-items: center;
	}
	
	.no-more {
		padding: 20rpx 0;
		text-align: center;
		
		text {
			font-size: 24rpx;
			color: #999;
		}
	}
	
	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 60rpx 0;
		
		.empty-text {
			font-size: 28rpx;
			color: #999;
			margin-top: 20rpx;
		}
	}
	
	/* 浏览量点击样式 */
	.meta-item.views {
		cursor: pointer;
		transition: all 0.2s ease;
		
		&:active {
			opacity: 0.7;
			transform: scale(0.98);
		}
		
		/* 添加微妙的阴影效果，提示可点击 */
		&:hover {
			background-color: rgba(57, 155, 254, 0.05);
			border-radius: 8rpx;
		}
	}

	.detail-image {
		width: 100%;
		border-radius: 0; /* Changed from 8rpx to 0 */
		display: block;
		box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.1);
	}
	
	/* 位置信息显示样式 */
	.location-info-section {
		margin: 20rpx 20rpx; // 改为20rpx左右边距
		padding: 24rpx 30rpx;
		background-color: #fff;
		border-radius: 12rpx;
		box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
		
		.location-header {
			display: flex;
			align-items: center;
			margin-bottom: 12rpx;
			
			.location-title {
				font-size: 30rpx;
				color: #333;
				font-weight: 600;
				margin-left: 8rpx;
			}
		}
		
		.location-content {
			.location-address {
				font-size: 28rpx;
				color: #666;
				line-height: 1.6;
				word-break: break-all;
			}
		}
	}
	
	/* 砍价信息卡片样式 */
	.bargain-info-card {
		background-color: #fff;
		margin: 20rpx;
		border-radius: 12rpx;
		padding: 30rpx 30rpx 0rpx 30rpx;
		box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.08);
		border: 2rpx solid rgba(255, 107, 107, 0.15);
		
		.bargain-card-header {
			display: flex;
			flex-direction: row;
			align-items: center;
			justify-content: flex-start;
			gap: 10rpx;
			margin-bottom: 24rpx;
			
			.bargain-header-icon {
				width: 32rpx;
				height: 32rpx;
				flex-shrink: 0;
				display: block;
				transform: translateY(-4rpx);
			}
			
			.bargain-title {
				font-size: 36rpx;
				font-weight: 700;
				color: #333;
				flex: 0 0 auto;
				letter-spacing: 0.5rpx;
			}
		}
		
		.bargain-card-content {
			display: flex;
			flex-direction: column;
			align-items: center;
			justify-content: center;
			padding: 24rpx 24rpx 0rpx 24rpx;
			gap: 20rpx;
			
			/* 内容区域顶部居中倒计时 - 简洁样式 */
			.bargain-countdown-top {
				display: flex;
				align-items: center;
				justify-content: center;
				gap: 8rpx;
				padding: 0;
				background: transparent;
				
				/* 倒计时盒子样式 */
				.countdown-box {
					display: inline-flex;
					align-items: center;
					justify-content: center;
					min-width: 64rpx;
					height: 64rpx;
					background-color: #ffffff;
					border: 3rpx solid #333333;
					border-radius: 8rpx;
					
					.countdown-number {
						font-size: 40rpx;
						color: #000000;
						font-weight: 700;
						line-height: 1;
						padding: 0 8rpx;
					}
				}
				
				.countdown-label {
					font-size: 24rpx;
					color: #333333;
					font-weight: 500;
					margin-left: 4rpx;
				}
			}
			
			// 确保 dianzan 组件占满宽度
			:deep(.dianzan-component) {
				width: 100%;
				min-height: 200rpx;
			}
		}
	}
	
	/* 打赏模块样式 */
	.reward-section {
		margin: 20rpx 0;
		padding: 0;
		
		.reward-container {
			background: #fff;
			margin: 0 24rpx;
			border-radius: 16rpx;
			padding: 32rpx 24rpx;
			box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
		}
		
		.reward-header {
			display: flex;
			justify-content: space-between;
			align-items: center;
			margin-bottom: 24rpx;
			
			.reward-title-box {
				display: flex;
				align-items: center;
				gap: 8rpx;
			}
			
			.reward-title {
				font-size: 32rpx;
				font-weight: 600;
				color: #333;
			}
			
			.reward-stats {
				.stats-text {
					font-size: 24rpx;
					color: #999;
				}
			}
		}
		
		.reward-content {
			display: flex;
			flex-direction: column;
			gap: 20rpx;
			
			.reward-desc {
				text {
					font-size: 26rpx;
					color: #666;
					line-height: 1.6;
				}
			}
			
			.reward-btn {
				display: flex;
				align-items: center;
				justify-content: center;
				gap: 8rpx;
				background: linear-gradient(135deg, #ff6b35 0%, #ff8c42 100%);
				color: #fff;
				border-radius: 44rpx;
				height: 88rpx;
				font-size: 30rpx;
				font-weight: 600;
				border: none;
				box-shadow: 0 8rpx 16rpx rgba(255, 107, 53, 0.3);
				transition: all 0.3s;
				
				&::after {
					border: none;
				}
				
				&:active {
					transform: scale(0.98);
					box-shadow: 0 4rpx 12rpx rgba(255, 107, 53, 0.4);
				}
			}
		}
		
		.reward-list {
			margin-top: 24rpx;
			
			.reward-list-title {
				margin-bottom: 16rpx;
				
				text {
					font-size: 26rpx;
					color: #666;
					font-weight: 500;
				}
			}
			
			.reward-scroll {
				white-space: nowrap;
				display: flex;
				gap: 16rpx;
				padding: 8rpx 0;
			}
			
			.reward-item {
				display: inline-flex;
				flex-direction: column;
				align-items: center;
				gap: 8rpx;
				min-width: 120rpx;
				padding: 12rpx;
				background: #f9f9f9;
				border-radius: 12rpx;
				
				.reward-avatar {
					width: 60rpx;
					height: 60rpx;
					border-radius: 30rpx;
				}
				
				.reward-info {
					display: flex;
					flex-direction: column;
					align-items: center;
					gap: 4rpx;
					
					.reward-name {
						font-size: 24rpx;
						color: #333;
						max-width: 100rpx;
						overflow: hidden;
						text-overflow: ellipsis;
						white-space: nowrap;
					}
					
					.reward-amount {
						font-size: 22rpx;
						color: #ff6b35;
						font-weight: 600;
					}
				}
			}
		}
	}
	
	/* 秒数脉冲动画 */
	@keyframes pulse {
		0%, 100% {
			transform: scale(1);
			opacity: 1;
		}
		50% {
			transform: scale(1.1);
			opacity: 0.9;
		}
	}
</style>
