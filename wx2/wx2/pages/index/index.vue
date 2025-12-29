<script setup>
	import { nextTick, onMounted, ref, onUnmounted, computed, watch, onActivated } from 'vue';
	import { testLogin } from '@/utils/isLogin'
	import { useUserInfoStore } from '@/store/user.js'
	import { onPullDownRefresh, onReachBottom, onPageScroll, onShow, onBackPress, onLoad } from '@dcloudio/uni-app'
	import { fixImageUrl, getDefaultImage, addListImageParams, processAvatarUrl } from '@/utils/domainConfig.js'
	import { previewImages } from '@/utils/imagePreview.js'
	import cacheManager, { getCachedData } from '@/utils/cacheManager.js'
	
	// 优化后的加载状态管理器 - 减少不必要的动画
	const loadingManager = {
		isLoading: false,
		showLoading(title = '加载中...', mask = false) {
			// 只记录状态，不显示加载动画（提升性能）
			this.isLoading = true;
			console.log('加载中:', title);
		},
		hideLoading() {
			this.isLoading = false;
			console.log('加载完成');
		}
	};
	
	// 头像点击状态控制
	const avatarClickState = ref(true)
	
	// 获取权限状态
	const getSendOnState = async () => {
		try {
			console.log('首页正在获取按钮状态...');
			
			const sendOnApi = uniCloud.importObject('sendOn', { customUI: true });
			const res = await sendOnApi.get();
			
			if (res && res.data && res.data.length > 0) {
				// 获取头像点击状态
				const serverAvatarClickState = res.data[0].avatarClick !== undefined ? res.data[0].avatarClick : true;
				
				// 更新头像点击状态
				avatarClickState.value = serverAvatarClickState;
				
				console.log('首页头像点击状态:', avatarClickState.value);
			} else {
				console.error('获取按钮状态失败: 数据格式不正确');
			}
		} catch (err) {
			console.error('获取按钮状态失败:', err);
		}
	}
	
	// 用户状态管理
	const userStore = useUserInfoStore()
	const paging = ref(null)
	// 分类
	const cateList = ref([])
	const activeIndex = ref(0)
	// 移除排序相关变量
	const currentCateId = ref('');  // 当前选中的分类ID
	
	// 添加刷新标记
	const shouldRefreshAfterLoad = ref(false);
	
	// 分类api
	const cateApi = uniCloud.importObject('cateWx', { customUI: true })
	// 文章api
	const articleApi = uniCloud.importObject('articleWx', { customUI: true })
	// 扩展存储api
	const extStorageCo = uniCloud.importObject('fabuWx', { customUI: true })
	
	// 位置相关信息
	const locationInfo = ref(null)
	
	// 每页加载数据条数
	const pageSize = 8

	// GPS检查标记
	const gpsChecked = ref(false)

	// 检查GPS是否开启（静默检查，不打断用户）
	const checkGPS = async () => {
		try {
			// 尝试获取GPS定位
			await uni.getLocation({
				type: 'gcj02',
				isHighAccuracy: true,
				highAccuracyExpireTime: 5000
			})
			
			// GPS检测成功
			gpsChecked.value = true
			return true
		} catch (error) {
			console.error('GPS定位权限检测失败:', error)
			// GPS未开启或权限未授予，静默处理，不弹窗打断用户
			console.warn('提示：应用需要获取您的位置信息才能正常使用。请在手机设置中开启GPS定位功能，并授予小程序定位权限。')
			gpsChecked.value = false
			// 清空分类列表，不显示任何默认分类
			cateList.value = []
			articleList.value = []
			return false
		}
	}

	// 超级优化的数据初始化 - 最大化并行,减少等待时间
	const initializePageData = async () => {
		// 先检查GPS
		const gpsEnabled = await checkGPS()
		if (!gpsEnabled) {
			// GPS未授权,清空所有数据并阻止加载
			cateList.value = []
			articleList.value = []
			isLoading.value = false
			console.log('GPS定位权限未授予，分类列表保持为空')
			return
		}
		
		try {
			isLoading.value = true;
			
			// 三合一并行：位置、分类、首屏文章一起加载
			const [locationRes, cateRes, firstArticlesRes] = await Promise.all([
				// 1. 获取用户位置(不使用缓存，确保实时准确)
				uni.getLocation({ type: 'gcj02' }).catch(err => {
					console.error('获取位置失败:', err);
					throw err; // 抛出错误，不使用默认位置
				}),
				
				// 2. 获取分类数据(带缓存)
				getCachedData('categories', 
					() => cateApi.get(null, false).catch(err => {
						console.error('获取分类失败:', err);
						return { data: [] };
					}), 'categories'),
				
				// 3. 预加载首屏文章(不等分类,直接加载全部)
				getCachedData('articles_all_1', 
					() => articleApi.getArticle('', 1, pageSize).catch(err => {
						console.error('预加载文章失败:', err);
						return { data: [] };
					}), 'articles')
			]);
			
			// 快速处理文章数据,优先展示内容
			const processedArticles = await processArticleImages(firstArticlesRes.data || []);
			articleList.value = processedArticles;
			
			// 检查分类数据
			if (!cateRes || !cateRes.data) {
				console.error('分类数据格式错误,使用空数组');
				cateList.value = [];
			} else {
				// 异步获取地址信息,不阻塞UI
				const locationKey = `${locationRes.longitude},${locationRes.latitude}`;
				getCachedData(`address_${locationKey}`, 
					() => articleApi.addReady(locationKey), 'userInfo')
					.then(addrInfo => {
						// 存储位置信息
						locationInfo.value = {
							address: addrInfo.address || '未知地址',
							district: addrInfo.district || '未知区域',
							longitude: locationRes.longitude,
							latitude: locationRes.latitude
						};
						
						// 处理分类数据
						const processedCateList = processCategoryData(cateRes.data, addrInfo);
						cateList.value = processedCateList;
						
						// 设置默认选中分类 - 优先选中当前地区的分类
						if (processedCateList.length > 0) {
							// 查找当前地区的分类
							const locationCateIndex = processedCateList.findIndex(cate => cate.isLocationCategory);
							
							if (locationCateIndex !== -1) {
								// 找到当前地区的分类，自动选中
								currentCateId.value = processedCateList[locationCateIndex]._id;
								activeIndex.value = locationCateIndex;
								tempCateId = processedCateList[locationCateIndex]._id;
								console.log('自动选中当前地区分类:', processedCateList[locationCateIndex].cate_name);
								
								// 加载当前地区的文章
								getArticleList(processedCateList[locationCateIndex]._id);
							} else {
								// 没有找到匹配的地区，选中第一个
								currentCateId.value = processedCateList[0]._id;
								activeIndex.value = 0;
								tempCateId = processedCateList[0]._id;
								
								// 如果只有一个分类，默认选中并加载该分类的文章
								if (processedCateList.length === 1) {
									console.log('只有一个分类，自动选中:', processedCateList[0].cate_name);
									getArticleList(processedCateList[0]._id);
								}
							}
						}
					})
					.catch(err => {
						console.error('获取地址信息失败:', err);
						// 降级处理:不等地址,直接显示分类
						const addrInfo = { address: '未知地址', district: '未知区域' };
						const processedCateList = processCategoryData(cateRes.data, addrInfo);
						cateList.value = processedCateList;
						
						if (processedCateList.length > 0) {
							// 查找当前地区的分类
							const locationCateIndex = processedCateList.findIndex(cate => cate.isLocationCategory);
							
							if (locationCateIndex !== -1) {
								// 找到当前地区的分类，自动选中
								currentCateId.value = processedCateList[locationCateIndex]._id;
								activeIndex.value = locationCateIndex;
								tempCateId = processedCateList[locationCateIndex]._id;
								console.log('自动选中当前地区分类:', processedCateList[locationCateIndex].cate_name);
								
								// 加载当前地区的文章
								getArticleList(processedCateList[locationCateIndex]._id);
							} else {
								// 没有找到匹配的地区，选中第一个
								currentCateId.value = processedCateList[0]._id;
								activeIndex.value = 0;
								tempCateId = processedCateList[0]._id;
								
								// 如果只有一个分类，默认选中并加载该分类的文章
								if (processedCateList.length === 1) {
									console.log('只有一个分类，自动选中:', processedCateList[0].cate_name);
									getArticleList(processedCateList[0]._id);
								}
							}
						}
					});
			}
			
			// 重置分页参数
			pageNo.value = 1;
			status.value = 'more';
			
		} catch (err) {
			console.error('初始化页面数据失败:', err);
			try {
				uni.showToast({
					title: '加载失败,请下拉刷新',
					icon: 'none',
					duration: 2000
				});
			} catch (e) {
				console.warn('显示提示失败:', e);
			}
		} finally {
			// 最快速度隐藏加载状态
			isLoading.value = false;
		}
	};
	
	// 处理分类数据的纯函数
	const processCategoryData = (categories, addrInfo) => {
		if (!categories || !Array.isArray(categories)) return [];
		
		const processedList = categories.map(cate => {
			const isLocationCategory = cate.cate_name && addrInfo.district && 
				(cate.cate_name.includes(addrInfo.district) || addrInfo.district.includes(cate.cate_name));
			
			return {
				...cate,
				cate_img: getCategoryIcon(cate),
				isLocationCategory: isLocationCategory,
				district: isLocationCategory ? addrInfo.district : ''
			};
		});
		
		// 根据是否为当前区域排序
		processedList.sort((a, b) => {
			if (a.isLocationCategory && !b.isLocationCategory) return -1;
			if (!a.isLocationCategory && b.isLocationCategory) return 1;
			return 0;
		});
		
		return processedList;
	};
	
	// 独立的文章加载函数 - 添加缓存支持
	const loadArticleData = async (cate_id = '') => {
		try {
			const cacheKey = `articles_${cate_id || 'all'}_${pageNo.value}`;
			
			// 对于第一页数据，使用短时间缓存提升体验
			const res = await getCachedData(cacheKey, 
				() => articleApi.getArticle(cate_id, pageNo.value, pageSize), 
				'articles');
			
			console.log('文章加载成功:', res.data?.length || 0, '篇文章');
			
			// 处理图片URL，添加七牛云参数
			const processedArticles = await processArticleImages(res.data || []);
			articleList.value = processedArticles;
			return res;
		} catch (err) {
			console.error('加载文章失败:', err);
			throw err;
		}
	};
	
	// 保留原有的获取分类函数供兼容性使用
	const cateListGet = initializePageData;
	const pageNo = ref(1)
	
	// 优化后的切换分类 - 清理相关缓存
	const hanleHeadTab = (index, id) => {
		activeIndex.value = index;
		pageNo.value = 1;
		status.value = 'more';
		
		// 设置当前分类ID
		currentCateId.value = id;
		
		// 清理旧文章缓存（切换分类时）
		cacheManager.clearByType('articles');
		
		getArticleList(id);
	};
	
	// 初始文章数据
	const articleList = ref([])
	let tempCateId = ''
	// 加载状态
	const isLoading = ref(true);
	
	// 优化后的获取文章函数
	const getArticleList = async (cate_id) => {
		// 避免重复请求
		if (loadingManager.isLoading) return;
		
		try {
			tempCateId = cate_id || '';
			console.log('加载文章列表:', tempCateId, '页码:', pageNo.value);
			
			// 只在第一页时显示加载状态
			if (pageNo.value === 1) {
				loadingManager.showLoading('加载中...', false);
				isLoading.value = true;
			}
			
			// 调用API时传递分类ID参数，始终按最新排序
			const res = await articleApi.getArticle(cate_id || '', pageNo.value, pageSize);
			console.log('文章加载结果:', res.data?.length || 0, '篇');
			
			// 处理图片URL，添加七牛云参数
			const processedArticles = await processArticleImages(res.data || []);
			
			// 更新文章列表
			articleList.value = processedArticles;
			
		} catch (err) {
			console.error('获取文章失败:', err);
			try {
				uni.showToast({
					title: '加载失败，请重试',
					icon: 'none',
					duration: 2000
				});
			} catch (e) {
				console.warn('显示提示失败:', e);
			}
		} finally {
			// 确保请求完成后隐藏加载动画
			loadingManager.hideLoading();
			isLoading.value = false;
		}
	};

	// 监听下拉刷新
	onPullDownRefresh(async () => {
		// 避免重复请求
		if (loadingManager.isLoading) {
			uni.stopPullDownRefresh();
			return;
		}
		
		pageNo.value = 1
		status.value = 'more'
		
		try {
			// 下拉刷新时检查GPS权限
			const gpsEnabled = await checkGPS()
			if (!gpsEnabled) {
				// GPS未授权，清空数据并停止刷新
				cateList.value = []
				articleList.value = []
				console.log('下拉刷新：GPS定位权限未授予，分类列表保持为空')
				return
			}
			
			// GPS已授权，重新加载数据
			await initializePageData()
		} catch (err) {
			console.error('下拉刷新失败:', err)
			try {
				uni.showToast({
					title: '刷新失败，请重试',
					icon: 'none'
				})
			} catch (e) {
				console.warn('显示提示失败:', e);
			}
		} finally {
			// 无论成功或失败，都停止下拉刷新
			try {
				uni.stopPullDownRefresh()
			} catch (e) {
				console.warn('停止下拉刷新失败:', e);
			}
		}
	})

	// 加载更多
	const status = ref('more') // 初始状态为 'more'

	// 文章列表触底时触发
	onReachBottom(async () => {
		console.log('触底')
		// 如果已经是 'noMore' 状态或正在加载中，直接返回
		if (status.value === 'noMore' || loadingManager.isLoading) return
		
		// 'loading' 状态
		status.value = 'loading'

		try {
			// 显示加载提示
			loadingManager.showLoading('加载更多...', false)
			
			// 加载更多数据
			pageNo.value++
			const res = await articleApi.getArticle(tempCateId, pageNo.value, pageSize)

			// 处理图片URL，添加七牛云参数
			const processedNewArticles = await processArticleImages(res.data || []);

			// 拼接新老数据
			articleList.value = [...articleList.value, ...processedNewArticles]

			// 根据数据情况设置状态
			if (res.data.length > 0) {
				status.value = 'more' // 还有更多数据
			} else {
				status.value = 'noMore' // 没有更多数据了
			}
		} catch (err) {
			console.error('加载更多失败:', err)
			try {
				uni.showToast({
					title: '加载失败，请重试',
					icon: 'none'
				})
			} catch (e) {
				console.warn('显示提示失败:', e);
			}
			status.value = 'more' // 失败时恢复为 'more' 状态
		} finally {
			// 确保请求完成后隐藏加载动画
			loadingManager.hideLoading()
		}
	})


	// 优化后的删除操作 - 减少加载动画
	const handleDelete = async (articleId) => {
		try {
			// 添加确认提示
			const modalRes = await new Promise((resolve) => {
				uni.showModal({
					title: '确认删除',
					content: '确定要删除这篇文章吗？',
					success: resolve
				});
			});
			
			if (!modalRes.confirm) return;
			
			console.log('删除文章ID:', articleId, '用户ID:', userStore.userInfo.uid);
			
			// 确保用户已登录
			if (!userStore.userInfo.uid) {
				uni.showToast({
					title: '请先登录',
					icon: 'none',
					duration: 2000
				});
				return;
			}
			
			// 记录加载状态但不显示动画
			loadingManager.isLoading = true;
			
			// 调用接口删除文章
			const res = await articleApi.del(articleId, userStore.userInfo.uid);
			console.log('删除结果:', res);
			
			if (res && res.deleted) {
				// 删除成功，从列表中移除该文章
				const index = articleList.value.findIndex(item => item._id === articleId);
				if (index !== -1) {
					articleList.value.splice(index, 1);
				}
				
				uni.showToast({
					title: '删除成功',
					icon: 'success',
					duration: 1500
				});
			} else {
				throw new Error(res.message || '删除失败，请重试');
			}
			
		} catch (err) {
			console.error('删除文章失败:', err);
			try {
				uni.showToast({
					title: err.message || '删除失败，请重试',
					icon: 'none',
					duration: 2000
				});
			} catch (e) {
				console.warn('显示提示失败:', e);
			}
		} finally {
			loadingManager.isLoading = false;
		}
	};

	// 联系电话
	const handelContact = (mobile) => {
		console.log(mobile)
		if ( !userStore.userInfo.isLogin ) {
			return testLogin()
		}

		if ( mobile === '未填写' ) {
			return uni.showToast({
				icon: 'none',
				title: '他并不想让人联系'
			})
		}

		uni.makePhoneCall({
			phoneNumber: mobile
		})
	}



	// 跳转用户列表
	const handelGoUserList = (user_id) => {
		// 检查头像点击功能是否启用
		if (!avatarClickState.value) {
			console.log('头像点击功能已禁用')
			uni.showToast({
				title: '联系管理员',
				icon: 'none',
				duration: 2000
			})
			return
		}
		
		uni.navigateTo({
			url: `/pages/userArticleList/userArticleList?userId=${user_id}`
		})
	}
	
	

	// 页面加载时接收参数
	onLoad((options) => {
		console.log('首页加载参数:', options);
		
		// 检查是否有刷新参数
		if (options && options.refresh === 'true') {
			console.log('检测到刷新参数，将在页面加载后刷新数据');
			// 设置一个标记，在 onMounted 后触发刷新
			shouldRefreshAfterLoad.value = true;
		}
	});

	// 页面加载完毕 - 超级优化的加载策略
	onMounted(async () => {
		// 页面初始化时尝试加载数据
		// 如果GPS未授权，会自动保持空状态并提示
		await initializePageData();
		
		// 延迟获取权限状态,完全不阻塞主流程
		setTimeout(() => {
			getSendOnState().catch(err => {
				console.error('获取权限状态失败:', err);
			});
		}, 1000); // 延迟1秒再获取
		
		// 监听文章发布成功事件
		uni.$on('articlePublished', (articleId) => {
			console.log('收到文章发布成功事件，文章ID:', articleId);
			// 重新获取文章列表
			pageNo.value = 1;
			status.value = 'more';
			getArticleList(tempCateId);
			
			// 显示发布成功提示
			uni.showToast({
				title: '发布成功，内容已更新',
				icon: 'success',
				duration: 2000
			});
		});
		
		// 监听一次性刷新事件 - 从发布页面跳转回来时只刷新一次
		uni.$on('refreshIndexOnce', (articleId) => {
			console.log('收到一次性刷新事件，文章ID:', articleId);
			// 重置页码并刷新文章列表
			pageNo.value = 1;
			status.value = 'more';
			
			// 延迟一点执行，确保页面已完全加载
			setTimeout(() => {
				getArticleList(tempCateId).then(() => {
					// 如果有文章ID，尝试滚动到该文章
					if (articleId && articleList.value.length > 0) {
						const index = articleList.value.findIndex(item => item._id === articleId);
						if (index !== -1) {
							console.log('找到新发布的文章，位置:', index);
						}
					}
				}).catch(err => {
					console.error('刷新文章列表失败:', err);
				});
			}, 300);
		});
		
		// 监听浏览量更新事件
		uni.$on('viewCountUpdated', (articleId) => {
			updateLocalViewCount(articleId);
		});
		
		// 添加新的全局事件监听器，从详情页更新浏览量
		uni.$on('articleViewCountUpdated', (data) => {
			console.log('收到文章浏览量更新事件:', data);
			if (data && data.articleId) {
				// 调用更新本地浏览量的方法
				updateLocalViewCount(data);
			}
		});
		
		// 开启平台原生页面分享
		uni.showShareMenu({
			withShareTicket: true
		});
		
		// 监听头像点击状态变化事件
		uni.$on('avatarClickChanged', (newState) => {
			console.log('首页收到头像点击状态变化事件:', newState);
			avatarClickState.value = newState;
		});
		
		// 检查是否需要刷新（从发布页跳转过来）
		if (shouldRefreshAfterLoad.value) {
			console.log('检测到刷新标记，延迟1秒后刷新数据');
			setTimeout(() => {
				pageNo.value = 1;
				status.value = 'more';
				getArticleList(tempCateId).then(() => {
					console.log('页面数据刷新完成');
					shouldRefreshAfterLoad.value = false; // 重置标记
				}).catch(err => {
					console.error('刷新数据失败:', err);
				});
			}, 1000); // 延迟1秒
		}
	});

	// 在页面卸载时移除事件监听
	onUnmounted(() => {
		uni.$off('articlePublished')
		uni.$off('refreshIndexOnce') // 移除一次性刷新事件监听
		uni.$off('viewCountUpdated')
		uni.$off('articleViewCountUpdated') // 移除新的浏览量更新事件监听
		uni.$off('avatarClickChanged') // 移除头像点击状态监听
	})
	
	// 使用正确的页面滚动生命周期函数
	onPageScroll(() => {
		// 确保滚动时隐藏加载动画
		loadingManager.hideLoading()
	})

	// 添加返回事件处理
	let lastRefreshTime = 0;
	onBackPress((e) => {
		console.log('检测到返回按钮事件', e);
		
		// 获取当前时间
		const now = Date.now();
		
		// 如果距离上次刷新时间不足1秒，不重复刷新
		if (now - lastRefreshTime < 1000) {
			console.log('距离上次刷新时间不足1秒，跳过刷新');
			return false;
		}
		
		// 记录本次刷新时间
		lastRefreshTime = now;
		
		// 检查是否从发布页面返回
		const pages = getCurrentPages();
		const currentPage = pages[pages.length - 1];
		
		if (currentPage && currentPage.route === 'pages/index/index') {
			console.log('当前在首页，检查是否需要刷新');
			
			// 延迟执行刷新，避免与页面切换冲突
			setTimeout(() => {
				// 重置页码并刷新文章列表
				pageNo.value = 1;
				status.value = 'more';
				getArticleList(tempCateId);
			}, 300);
		}
		
		// 返回false表示不拦截返回事件
		return false;
	});

	// 添加页面激活事件处理（用于处理页面从后台切回前台的情况）
	onActivated(() => {
		console.log('首页被激活');
		
		// 获取当前时间
		const now = Date.now();
		
		// 如果距离上次刷新时间超过5秒，自动刷新
		if (now - lastRefreshTime > 5000) {
			console.log('页面激活，自动刷新内容');
			lastRefreshTime = now;
			
			// 重置页码并刷新文章列表
			pageNo.value = 1;
			status.value = 'more';
			getArticleList(tempCateId);
		}
	});

	// 添加这个函数来获取分类图标
	const getCategoryIcon = (category) => {
		// 如果分类对象有cate_img字段且不为空，使用域名修复后的URL
		if (category && category.cate_img) {
			return fixImageUrl(category.cate_img);
		}
		
		// 如果没有图标，返回默认图标
		return getDefaultImage('default');
	}

	// 更新本地文章浏览量
	const updateLocalViewCount = (data) => {
		// 检查数据有效性
		if (!data || !data.articleId || !articleList.value.length) {
			console.log('更新浏览量失败：无效的文章数据或文章列表为空');
			return;
		}
		
		const index = articleList.value.findIndex(item => item._id === data.articleId);
		if (index !== -1) {
			// 如果有具体的浏览量数据，直接使用
			if (data.viewCount !== undefined) {
				articleList.value[index].look_count = data.viewCount;
				// 同时保持兼容性更新view_count字段
				if (articleList.value[index].view_count !== undefined) {
					articleList.value[index].view_count = data.viewCount;
				}
			} else {
				// 否则，自增浏览量
				if (articleList.value[index].look_count !== undefined) {
					articleList.value[index].look_count++;
				} else {
					articleList.value[index].look_count = 1;
				}
				
				// 同时保持兼容性更新view_count字段
				if (articleList.value[index].view_count !== undefined) {
					articleList.value[index].view_count = articleList.value[index].look_count;
				}
			}
			
			console.log(`文章[${data.articleId}]浏览量已更新为: ${articleList.value[index].look_count}`);
		} else {
			console.log(`未找到文章: ${data.articleId}`);
		}
	};

	// 处理文章数据中的图片URL（使用统一工具函数）
	const processArticleImages = async (articles) => {
		if (!articles || !Array.isArray(articles)) return articles;
		
		// 🔥 第一步：收集所有需要转换的 cloud:// 头像URL
		const cloudAvatarUrls = [];
		const cloudAvatarMap = new Map(); // 映射关系：cloud:// -> 文章索引列表
		
		articles.forEach((article, index) => {
			let avatarUrl = null;
			
			if (article.author && article.author.avatar_file && article.author.avatar_file.url) {
				avatarUrl = article.author.avatar_file.url;
			} else if (article.user_avatarUrl) {
				avatarUrl = article.user_avatarUrl;
			} else if (article.avatarUrl) {
				avatarUrl = article.avatarUrl;
			}
			
			// 如果是 cloud:// 格式，记录下来
			if (avatarUrl && avatarUrl.startsWith('cloud://')) {
				if (!cloudAvatarUrls.includes(avatarUrl)) {
					cloudAvatarUrls.push(avatarUrl);
					cloudAvatarMap.set(avatarUrl, []);
				}
				cloudAvatarMap.get(avatarUrl).push(index);
			}
		});
		
		// 🔥 第二步：批量转换所有 cloud:// URL
		const convertedAvatarMap = new Map();
		if (cloudAvatarUrls.length > 0) {
			console.log('📦 批量转换头像 cloud:// URL，数量:', cloudAvatarUrls.length);
			try {
				const result = await uniCloud.getTempFileURL({
					fileList: cloudAvatarUrls
				});
				
				if (result.fileList && result.fileList.length > 0) {
					result.fileList.forEach((file, index) => {
						if (file.tempFileURL) {
							// 应用 fixImageUrl 处理
							const processedUrl = fixImageUrl(file.tempFileURL, 'avatar');
							convertedAvatarMap.set(cloudAvatarUrls[index], processedUrl);
							console.log('✅ cloud:// 转换成功:', cloudAvatarUrls[index], '->', processedUrl);
						} else {
							console.warn('⚠️ cloud:// 转换失败:', cloudAvatarUrls[index]);
							convertedAvatarMap.set(cloudAvatarUrls[index], '/static/images/touxiang.png');
						}
					});
				}
			} catch (error) {
				console.error('❌ 批量转换 cloud:// 失败:', error);
				// 失败时使用默认头像
				cloudAvatarUrls.forEach(url => {
					convertedAvatarMap.set(url, '/static/images/touxiang.png');
				});
			}
		}
		
		// 🔥 第三步：并行处理所有文章
		const processedArticles = await Promise.all(articles.map(async (article) => {
			// 处理文章封面图
			if (article.article_img && Array.isArray(article.article_img)) {
				article.article_img = article.article_img.map(img => {
					if (typeof img === 'string') {
						// 字符串格式：只修复URL，不添加水印参数
						return fixImageUrl(img);
					} else if (img && img.url) {
						// 对象格式：处理url、thumbnailURL等字段，不添加水印参数
						return {
							...img,
							url: fixImageUrl(img.url),
							thumbnailURL: img.thumbnailURL ? fixImageUrl(img.thumbnailURL) : undefined,
							compressedURL: img.compressedURL ? fixImageUrl(img.compressedURL) : undefined
						};
					}
					return img;
				});
			}
			
			// 🔥 使用批量转换的结果或直接处理非 cloud:// 头像
			let avatarUrl = null;
			
			if (article.author && article.author.avatar_file && article.author.avatar_file.url) {
				avatarUrl = article.author.avatar_file.url;
			} else if (article.user_avatarUrl) {
				avatarUrl = article.user_avatarUrl;
			} else if (article.avatarUrl) {
				avatarUrl = article.avatarUrl;
			}
			
			if (avatarUrl) {
				let processedAvatarUrl;
				
				// 如果是 cloud:// 格式，使用批量转换的结果
				if (avatarUrl.startsWith('cloud://')) {
					processedAvatarUrl = convertedAvatarMap.get(avatarUrl) || '/static/images/touxiang.png';
				} else {
					// 其他格式，使用 processAvatarUrl 处理
					try {
						processedAvatarUrl = await processAvatarUrl(avatarUrl);
						// 如果processAvatarUrl返回空字符串（旧数据），使用默认头像
						if (!processedAvatarUrl) {
							processedAvatarUrl = '/static/images/touxiang.png';
							console.log('👤 旧头像URL，使用默认头像:', avatarUrl);
						}
					} catch (error) {
						console.error('处理头像失败:', error);
						processedAvatarUrl = '/static/images/touxiang.png';
					}
				}
				
				// 更新所有可能的字段
				if (article.author && article.author.avatar_file) {
					article.author.avatar_file.url = processedAvatarUrl;
				}
				if (article.user_avatarUrl) {
					article.user_avatarUrl = processedAvatarUrl;
				}
				if (article.avatarUrl) {
					article.avatarUrl = processedAvatarUrl;
				}
			}
			
			return article;
		}));
		
		return processedArticles;
	};

	// 添加图片预览方法
	const previewImage = (urls, current) => {
		// 检查参数
		if (!urls || !urls.length) {
			console.error('预览图片缺少URLs参数');
			return;
		}
		
		// 获取预览URL列表 - 使用域名修复后的URL
		let previewUrls = urls;
		let currentIndex = 0;
		
		// 如果当前URL和URLs数组是对象数组，仅在预览时提取compressedURL（如果有）或url
		if (typeof current === 'object' && current !== null) {
			current = fixImageUrl(current.compressedURL || current.thumbnailURL || current.url);
		} else if (typeof current === 'string') {
			current = fixImageUrl(current);
		}
		
		// 如果URLs数组是对象数组，仅在预览时提取compressedURL（如果有）或url
		if (urls.length > 0 && typeof urls[0] === 'object') {
			previewUrls = urls.map(img => fixImageUrl(img.compressedURL || img.thumbnailURL || img.url));
		} else {
			// 如果是字符串数组，直接处理URL
			previewUrls = urls.map(url => fixImageUrl(url));
		}
		
		// 找到当前图片的索引
		if (current) {
			currentIndex = previewUrls.findIndex(url => url === current);
			if (currentIndex === -1) currentIndex = 0;
		}
		
		// 使用新的图片预览工具函数
		previewImages(previewUrls, currentIndex);
	};

	// 页面显示时获取最新权限状态
	onShow(() => {
		// 获取最新的权限状态
		getSendOnState();
	})

	const getCurrentCateName = () => {
		// 查找当前选中分类的名称
		if (!currentCateId.value) return '';
		
		const category = cateList.value.find(item => item._id === currentCateId.value);
		return category ? category.cate_name : '';
	}

	// 根据位置名称生成兼容的图标信息
	const generateLocationIconUniapp = (locationName) => {
		if (!locationName || locationName === '未知区域') {
			return {
				text: '位',
				bgColor: '#4cb0f9',
				type: 'text'
			};
		}
		
		// 获取位置的第一个字符
		const firstChar = locationName.trim().charAt(0);
		
		// 使用图标字典或颜色字典根据首字符生成一致的颜色
		const colorMap = {
			'北': '#FF5722', '南': '#2196F3', '东': '#4CAF50', '西': '#9C27B0',
			'中': '#FFEB3B', '河': '#03A9F4', '山': '#8BC34A', '海': '#00BCD4',
			'天': '#673AB7', '朝': '#FFC107', '新': '#E91E63', '广': '#3F51B5',
			'大': '#009688', '小': '#795548', '长': '#607D8B', '金': '#FF9800'
		};
		
		// 根据字符获取颜色，如果没有预设则使用哈希算法生成
		let bgColor = colorMap[firstChar] || '#4cb0f9';
		
		// 如果没有预设颜色，根据字符生成一个确定的颜色
		if (!colorMap[firstChar]) {
			// 简单的哈希算法将字符转换为颜色
			let hash = 0;
			for (let i = 0; i < firstChar.length; i++) {
				hash = firstChar.charCodeAt(i) + ((hash << 5) - hash);
			}
			
			const c = (hash & 0x00FFFFFF)
				.toString(16)
				.toUpperCase();
			
			bgColor = '#' + '00000'.substring(0, 6 - c.length) + c;
		}
		
		return {
			text: firstChar,
			bgColor: bgColor,
			type: 'text'
		};
	}

	// 跳转文章详情
	const handelGoArticleDetail = (id) => {
		// 检查头像点击功能是否启用（同时控制文章跳转）
		if (!avatarClickState.value) {
			console.log('头像点击控制已禁用，文章跳转功能也被禁用')
			uni.showToast({
				title: '联系管理员',
				icon: 'none',
				duration: 2000
			})
			return
		}
		
		uni.navigateTo({
			url: `/pages/article/articleDetail?article_id=${id}`,
			animationType: 'slide-in-right', // 添加滑入动画
			animationDuration: 300 // 设置动画持续时间为300ms
		})
	}

</script>
<template>
	<view class="home">
		<!-- 顶部分类导航 -->
		<view class="category-container">
			<!-- 动态分类 -->
			<scroll-view class="category-scroll" scroll-x="true" scroll-with-animation="true" show-scrollbar="false">
				<view class="category-list">
					<view class="category-item" 
						v-for="(item, index) in cateList" 
						:key="item._id" 
						:class="{ active: currentCateId === item._id, 'location-category': item.isLocationCategory }" 
						@click="hanleHeadTab(index, item._id)">
						<view class="category-content">
							<image v-if="item.cate_img" :src="fixImageUrl(item.cate_img)" class="cate-icon" mode="aspectFit" @error="(e) => e.target.src = getDefaultImage('default')"></image>
							<text class="cate-text">{{ item.cate_name }}</text>
							<!-- 位置图标指示器 -->
							<view class="location-badge" v-if="item.isLocationCategory">当前</view>
						</view>
					</view>
					
					<!-- 加载中显示 -->
					<view class="category-item loading-item" v-if="cateList.length == 0 && gpsChecked && isLoading">
						<view class="category-content">
							<uni-icons type="spinner-cycle" size="24" color="#399bfe"></uni-icons>
							<text class="loading-text">加载中...</text>
						</view>
					</view>
					
					<!-- GPS未授权提示 -->
					<view class="category-item gps-hint-item" v-if="cateList.length == 0 && !gpsChecked && !isLoading">
						<view class="category-content">
							<uni-icons type="location" size="24" color="#ff9800"></uni-icons>
							<text class="gps-hint-text">请授予定位权限</text>
						</view>
					</view>
				</view>
			</scroll-view>
		</view>

		<!-- 文章列表 -->
		<view class="view-article">
			<!-- 添加加载中动画 -->
			<view class="loading-container" v-if="articleList.length === 0 && isLoading">
				<view class="loading-spinner">
					<uni-icons type="spinner-cycle" size="48" color="#399bfe"></uni-icons>
				</view>
				<text class="loading-text">内容加载中...</text>
			</view>
			
			<!-- 空数据提示 -->
			<view class="empty-container" v-if="articleList.length === 0 && !isLoading">
				<!-- GPS权限未授予提示 -->
				<template v-if="!gpsChecked">
					<view class="empty-icon">
						<uni-icons type="location" size="80" color="#ff9800"></uni-icons>
					</view>
					<text class="empty-text">需要开启GPS定位权限</text>
					<text class="empty-subtext">请在手机设置中开启GPS定位功能，并授予小程序定位权限后，下拉刷新页面</text>
				</template>
				<!-- 正常空数据提示 -->
				<template v-else>
					<view class="empty-icon">
						<uni-icons color="#5cb85c" custom-prefix="icon" type="lishuai-a-00jichuiconkongzhuangtaiwuneirong" size="58"></uni-icons>
					</view>
					<text class="empty-text">暂无内容</text>
					<text class="empty-subtext">该分类下还没有数据，去看看其他分类吧</text>
				</template>
			</view>
			
			<articleItem v-for="item in articleList" :key="item._id" :item="item" @contact="handelContact"
				@preview="(url, urls) => previewImage(urls, url)" @userList="handelGoUserList"
				@delete="handleDelete" :avatarClickEnabled="avatarClickState">
			</articleItem>
			
			<!-- 加载更多 -->
			<view class="loading">
				<uni-load-more v-if="!articleList.length==0" color="#cccccc" iconType="auto"
					:status="status" />
			</view>
		</view>
		
	
	</view>
	
	
</template>

<style lang="scss" scoped>
	.home {
		display: flex;
		flex-direction: column;
		height: 100vh;
		background-color: $pyq-pages-bg-color;

		/* 分类导航容器 */
		.category-container {
			width: 100%;
			background-color: #fff;
			box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
		}
		
		/* 分类导航样式 */
		.category-scroll {
			width: 100%;
			height: 160rpx; /* 固定高度 */
			white-space: nowrap;
			border-bottom: 1px solid $pyq-border-color-translucent;
			
			.category-list {
				display: flex;
				align-items: center;
				padding: 20rpx;
				flex-wrap: nowrap;
				
				.category-item {
					flex-shrink: 0;
					padding: 16rpx 24rpx;
					margin: 0 10rpx;
					font-size: 26rpx;
					color: $pyq-text-color-placeholder;
					height: 120rpx;
					width: 120rpx;
					border-radius: 12rpx;
					background-color: #f8f8f8;
					position: relative;
					transition: all 0.3s ease;
					
					&:active {
						transform: scale(0.95);
					}
					
					.category-content {
						display: flex;
						flex-direction: column;
						align-items: center;
						justify-content: center;
						height: 100%;
						position: relative;
						
						.loading-text {
							font-size: 22rpx;
							margin-top: 8rpx;
							color: #399bfe;
						}
						
						.gps-hint-text {
							font-size: 22rpx;
							margin-top: 8rpx;
							color: #ff9800;
							text-align: center;
							line-height: 1.3;
						}
					}
					
					.cate-icon {
						width: 50rpx;
						height: 50rpx;
						margin-bottom: 8rpx;
						object-fit: contain;
					}
					
					.cate-text {
						font-size: 24rpx;
						text-align: center;
						overflow: hidden;
						text-overflow: ellipsis;
						white-space: nowrap;
						max-width: 100%;
						padding: 0 4rpx;
						line-height: 1.2;
					}
					
					&.active {
						color: #399bfe;
						font-weight: bold;
						background-color: rgba(57, 155, 254, 0.1);
						transform: scale(1.05);
						box-shadow: 0 4rpx 12rpx rgba(57, 155, 254, 0.15);
						z-index: 1;
					}
					
					&.location-category {
						background-color: rgba(76, 176, 249, 0.1);
						
						&.active {
							background-color: rgba(76, 176, 249, 0.2);
						}
						
						.location-badge {
							position: absolute;
							top: 6rpx;
							right: 6rpx;
							background-color: #4cb0f9;
							color: white;
							font-size: 18rpx;
							padding: 2rpx 6rpx;
							border-radius: 6rpx;
							z-index: 2;
						}
					}
					
					&.gps-hint-item {
						background-color: rgba(255, 152, 0, 0.1);
						width: auto;
						min-width: 180rpx;
						padding: 16rpx 24rpx;
					}
				}
			}
		}

		/* 文章列表 */
		.view-article {
			background-color: $pyq-pages-bg-color;
			padding-bottom: 120rpx; /* 增加底部间距 */
			
			/* 加载中动画容器 */
			.loading-container {
				display: flex;
				flex-direction: column;
				align-items: center;
				justify-content: center;
				height: 60vh;
				width: 100%;
				
				.loading-spinner {
					animation: rotate 1.5s linear infinite;
				}
				
				.loading-text {
					margin-top: 30rpx;
					color: #666;
					font-size: 28rpx;
				}
				
				@keyframes rotate {
					from { transform: rotate(0deg); }
					to { transform: rotate(360deg); }
				}
			}
			
			/* 空数据提示 */
			.empty-container {
				display: flex;
				flex-direction: column;
				align-items: center;
				justify-content: center;
				height: 70vh;
				width: 100%;
				padding: 0 50rpx;
				
				.empty-icon {
					opacity: 0.7;
					margin-bottom: 30rpx;
					transform: scale(1.2);
				}
				
				.empty-text {
					font-size: 34rpx;
					color: #888;
					margin-bottom: 16rpx;
					font-weight: 500;
				}
				
				.empty-subtext {
					font-size: 28rpx;
					color: #aaaaaa;
					text-align: center;
					line-height: 1.5;
				}
			}

			.loading {
				height: 100rpx; /* 增加加载区域高度 */
				padding-bottom: 30rpx; /* 额外底部间距 */
			}
		}
		
		/* 测试按钮样式 */
		.test-buttons {
			position: fixed;
			left: 40rpx;
			bottom: 120rpx;
			z-index: 999;
			
			.test-btn {
				background-color: #007AFF;
				color: #fff;
				font-size: 28rpx;
				padding: 10rpx 30rpx;
				border-radius: 50rpx;
				box-shadow: 0 4rpx 10rpx rgba(0, 122, 255, 0.3);
			}
		}
		
		/* 美化后的发布按钮 */
		.publish-button {
			position: fixed;
			right: 40rpx;
			bottom: 120rpx;
			z-index: 999;
			display: flex;
			align-items: center;
			background: linear-gradient(135deg, #3c7dff, #399bfe);
			padding: 16rpx 32rpx;
			border-radius: 50rpx;
			box-shadow: 0 6rpx 16rpx rgba(60, 125, 255, 0.3);
			transition: all 0.3s ease;
			
			.publish-icon {
				display: flex;
				align-items: center;
				justify-content: center;
				margin-right: 12rpx;
			}
			
			.publish-text {
				color: #FFFFFF;
				font-size: 30rpx;
				font-weight: 500;
				letter-spacing: 2rpx;
			}
			
			&:active {
				transform: scale(0.95);
				box-shadow: 0 3rpx 8rpx rgba(60, 125, 255, 0.3);
			}
		}
		
		/* 七牛云上传按钮样式 */
		.qiniu-button {
			position: fixed;
			right: 40rpx;
			bottom: 220rpx;
			z-index: 999;
			display: flex;
			align-items: center;
			background: linear-gradient(135deg, #ff7043, #ff5722);
			padding: 16rpx 32rpx;
			border-radius: 50rpx;
			box-shadow: 0 6rpx 16rpx rgba(255, 87, 34, 0.3);
			transition: all 0.3s ease;
			
			.qiniu-icon {
				display: flex;
				align-items: center;
				justify-content: center;
				margin-right: 12rpx;
			}
			
			.qiniu-text {
				color: #FFFFFF;
				font-size: 30rpx;
				font-weight: 500;
				letter-spacing: 2rpx;
			}
			
			&:active {
				transform: scale(0.95);
				box-shadow: 0 3rpx 8rpx rgba(255, 87, 34, 0.3);
			}
		}
	}
</style>

<!-- 添加全局样式，覆盖组件中的问题样式 -->
<style lang="scss">
/* 修复uni-load-more组件样式问题 */
.uni-load-more {
	.uni-load-more__img--android-MP {
		.uni-load-more__img-icon {
			border-top-style: solid;
			border-color: #777777;
			border-width: 2px;
		}
	}
	
	.uni-load-more__img--ios-H5 {
		.uni-load-more__img-icon {
			width: 100%;
			height: 100%;
		}
	}
}

/* 修复articleItem组件样式问题 */
.pyqContent {
	.pyq-img {
		.multi-img {
			.img-grid {
				.grid-item {
					width: 180rpx;
					height: 180rpx;
					border-radius: 8rpx;
				}
			}
		}
		
		.single-img {
			.single-img-item {
				width: 100%;
				height: auto;
			}
		}
	}
}
</style>