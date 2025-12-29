<script setup>
	import { nextTick, onMounted, ref, onUnmounted, computed, watch, onActivated } from 'vue';
	import { testLogin } from '@/utils/isLogin'
	import { useUserInfoStore } from '@/store/user.js'
	import { onPullDownRefresh, onReachBottom, onPageScroll, onShow, onBackPress } from '@dcloudio/uni-app'
	
	// 加载状态管理器
	const loadingManager = {
		isLoading: false,
		showLoading(title = '加载中...', mask = true) {
			// 只设置状态，不显示加载动画
			this.isLoading = true;
			// 注释掉显示加载动画的代码
			// uni.showLoading({
			// 	title: title,
			// 	mask: mask
			// });
		},
		hideLoading() {
			this.isLoading = false;
			// 注释掉隐藏加载动画的代码
			// uni.hideLoading();
		}
	};
	
	// 头像点击状态控制
	const avatarClickState = ref(true)
	
	// 获取权限状态
	const getSendOnState = async () => {
		try {
			console.log('首页正在获取按钮状态...');
			
			// 添加请求控制器和超时控制
			const controller = new AbortController();
			const timeoutId = setTimeout(() => controller.abort(), 5000); // 5秒超时
			
			// 标记请求状态
			const requestInProgress = ref(true);
			
			// 使用Promise.race同时进行请求和超时控制
			const sendOnApi = uniCloud.importObject('sendOn', { customUI: true });
			const res = await Promise.race([
				sendOnApi.get(),
				new Promise((_, reject) => {
					// 监听页面销毁事件，如果页面被销毁，则中断请求
					uni.$once('index-page-destroyed', () => {
						console.log('页面销毁，中断请求');
						reject(new Error('页面已销毁，请求被中断'));
					});
				})
			]).finally(() => {
				clearTimeout(timeoutId);
				requestInProgress.value = false;
			});
			
			if (res && res.data && res.data.length > 0) {
				// 获取头像点击状态
				const serverAvatarClickState = res.data[0].avatarClick !== undefined ? res.data[0].avatarClick : true;
				
				// 更新头像点击状态
				avatarClickState.value = serverAvatarClickState;
				
				console.log('首页头像点击状态:', avatarClickState.value);
			} else {
				console.log('获取按钮状态返回空数据，使用默认值');
				// 使用默认值
				avatarClickState.value = true;
			}
		} catch (err) {
			// 判断是否为请求中断错误
			if (err.message && (err.message.includes('abort') || err.message.includes('中断'))) {
				console.log('获取按钮状态请求被中断，使用默认值');
			} else {
				console.error('获取按钮状态失败:', err);
			}
			
			// 无论什么错误，确保使用默认值
			avatarClickState.value = true;
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
	
	// 分类api
	const cateApi = uniCloud.importObject('cateDy', { customUI: true })
	// 文章api
	const articleApi = uniCloud.importObject('articleDy', { customUI: true })
	// 扩展存储api
	const extStorageCo = uniCloud.importObject('fabuWx', { customUI: true })
	
	// 每页加载数据条数
	const pageSize = 8

	// 获取分类
	const cateListGet = async () => {
		try {
			
			console.log('开始获取分类数据...');
			
			// 直接使用云数据库获取分类
			const db = uniCloud.database();
			// 使用正确的集合名称：cateList
			const collection = db.collection('cateList');
			
			// 查询所有可见的分类，按排序权重降序排列
			const res = await collection.where({
				is_visible: true
			}).orderBy("sort", "desc").get();
			
			console.log('分类数据获取结果:', res);
			
			// 检查返回结果
			if (res && res.data && res.data.length > 0) {
				// 处理分类数据，确保每个分类都有图标
				let processedCateList = res.data.map(cate => {
					return {
						...cate,
						cate_img: cate.cate_img || getCategoryIcon(cate)
					};
				});
				
				// 添加"全部"分类到第一个位置
				const allCategory = {
					_id: 'all',
					cate_name: '全部',
					cate_img: '/static/images/defalut.png',
					sort: 9999 // 确保排序权重最高
				};
				
				// 检查是否已经有"全部"分类
				const hasAllCategory = processedCateList.some(cate => 
					cate.cate_name === '全部' || cate._id === 'all'
				);
				
				// 如果没有"全部"分类，添加到列表开头
				if (!hasAllCategory) {
					processedCateList.unshift(allCategory);
				} else {
					// 如果有"全部"分类，确保它在第一位
					const allIndex = processedCateList.findIndex(cate => 
						cate.cate_name === '全部' || cate._id === 'all'
					);
					if (allIndex > 0) {
						const allCate = processedCateList.splice(allIndex, 1)[0];
						processedCateList.unshift(allCate);
					}
				}
				
				// 设置分类列表
				cateList.value = processedCateList;
				
				// 缓存分类数据，以便下次加载失败时使用
				try {
					uni.setStorageSync('cachedCategories', processedCateList);
				} catch (cacheErr) {
					console.warn('缓存分类数据失败:', cacheErr);
				}
				
				// 默认选中第一个分类（全部）
				currentCateId.value = processedCateList[0]._id;
				activeIndex.value = 0;
				
				// 重置页码并获取文章
				pageNo.value = 1;
				getArticleList(currentCateId.value);
				
			} else {
				console.warn('数据库中没有找到分类数据，尝试使用API方式获取');
				
				// 尝试使用API方式获取
				const apiRes = await cateApi.get();
				
				if (apiRes && apiRes.data && apiRes.data.length > 0) {
					console.log('API获取分类成功:', apiRes.data.length, '个分类');
					
					// 处理分类数据
					let processedCateList = apiRes.data.map(cate => {
						return {
							...cate,
							cate_img: getCategoryIcon(cate)
						};
					});
					
					// 添加"全部"分类到第一个位置
					const allCategory = {
						_id: 'all',
						cate_name: '全部',
						cate_img: '/static/images/defalut.png',
						sort: 9999 // 确保排序权重最高
					};
					
					// 检查是否已经有"全部"分类
					const hasAllCategory = processedCateList.some(cate => 
						cate.cate_name === '全部' || cate._id === 'all'
					);
					
					// 如果没有"全部"分类，添加到列表开头
					if (!hasAllCategory) {
						processedCateList.unshift(allCategory);
					} else {
						// 如果有"全部"分类，确保它在第一位
						const allIndex = processedCateList.findIndex(cate => 
							cate.cate_name === '全部' || cate._id === 'all'
						);
						if (allIndex > 0) {
							const allCate = processedCateList.splice(allIndex, 1)[0];
							processedCateList.unshift(allCate);
						}
					}
					
					// 设置分类列表
					cateList.value = processedCateList;
					
					// 缓存分类数据
					try {
						uni.setStorageSync('cachedCategories', processedCateList);
					} catch (cacheErr) {
						console.warn('缓存分类数据失败:', cacheErr);
					}
					
					// 默认选中第一个分类
					currentCateId.value = processedCateList[0]._id;
					activeIndex.value = 0;
					
					// 重置页码并获取文章
					pageNo.value = 1;
					getArticleList(currentCateId.value);
				} else {
					// 如果API也没有返回数据，尝试从缓存加载
					try {
						const cachedCates = uni.getStorageSync('cachedCategories');
						if (cachedCates && cachedCates.length > 0) {
							cateList.value = cachedCates;
							console.log('使用缓存的分类数据');
							
							// 默认选中第一个分类
							if (cachedCates.length > 0) {
								currentCateId.value = cachedCates[0]._id;
								activeIndex.value = 0;
							}
							
							// 获取文章数据
							getArticleList(currentCateId.value);
						} else {
							// 如果缓存中也没有数据，使用默认分类
							console.log('使用默认分类数据');
							const defaultCategories = [
								{ _id: 'all', cate_name: '全部', cate_img: '/static/images/defalut.png' },
								{ _id: 'default2', cate_name: '餐饮', cate_img: '/static/images/defalut.png' },
								{ _id: 'default3', cate_name: '购物', cate_img: '/static/images/defalut.png' },
								{ _id: 'default4', cate_name: '服务', cate_img: '/static/images/defalut.png' }
							];
							
							cateList.value = defaultCategories;
							currentCateId.value = defaultCategories[0]._id;
							activeIndex.value = 0;
							
							// 获取所有文章
							getArticleList();
						}
					} catch (cacheErr) {
						console.error('读取缓存分类失败:', cacheErr);
						// 获取所有文章
						getArticleList();
					}
				}
			}
		} catch (err) {
			console.error('获取分类失败:', err);
			
			// 尝试从缓存加载
			try {
				const cachedCates = uni.getStorageSync('cachedCategories');
				if (cachedCates && cachedCates.length > 0) {
					cateList.value = cachedCates;
					console.log('使用缓存的分类数据');
					
					// 默认选中第一个分类
					if (cachedCates.length > 0) {
						currentCateId.value = cachedCates[0]._id;
						activeIndex.value = 0;
					}
					
					// 获取文章数据
					getArticleList(currentCateId.value);
				} else {
					// 使用默认分类
					const defaultCategories = [
						{ _id: 'all', cate_name: '全部', cate_img: '/static/images/defalut.png' },
						{ _id: 'default2', cate_name: '餐饮', cate_img: '/static/images/defalut.png' },
						{ _id: 'default3', cate_name: '购物', cate_img: '/static/images/defalut.png' },
						{ _id: 'default4', cate_name: '服务', cate_img: '/static/images/defalut.png' }
					];
					
					cateList.value = defaultCategories;
					currentCateId.value = defaultCategories[0]._id;
					activeIndex.value = 0;
					
					// 获取所有文章
					getArticleList();
				}
			} catch (cacheErr) {
				console.error('读取缓存分类失败:', cacheErr);
				// 获取所有文章
				getArticleList();
			}
		} finally {
			uni.hideLoading();
		}
	}
	const pageNo = ref(1)
	
	// 切换分类
	const hanleHeadTab = (index, id) => {
		activeIndex.value = index
		pageNo.value = 1
		status.value = 'more'
		
		// 设置当前分类ID
		currentCateId.value = id;
		getArticleList(id);
	}
	
	// 初始文章数据
	const articleList = ref([])
	let tempCateId = ''
	// 加载状态
	const isLoading = ref(true);
	
	// 获取文章
	const getArticleList = async (cate_id) => {
		// 避免重复请求
		if (loadingManager.isLoading) return;
		
		try {
			// 保存临时分类ID，如果是"全部"分类则传空字符串
			tempCateId = (cate_id === 'all') ? '' : (cate_id || '');
			console.log(tempCateId, '临时id')
			
			// 显示加载提示
			loadingManager.showLoading('加载文章列表...', true)
			isLoading.value = true;
			
			// 调用API时传递分类ID参数，始终按最新排序
			const res = await articleApi.getArticle(tempCateId, pageNo.value, pageSize)
			console.log(res)
			articleList.value = res.data
		} catch (err) {
			console.log(err)
			uni.showToast({
				title: '加载失败，请重试',
				icon: 'none',
				duration: 2000
			})
		} finally {
			// 确保请求完成后隐藏加载动画
			loadingManager.hideLoading()
			isLoading.value = false;
		}
	}

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
			// 下拉刷新时，获取当前分类下的文章
			await getArticleList(tempCateId)
		} catch (err) {
			console.error('下拉刷新失败:', err)
			uni.showToast({
				title: '刷新失败，请重试',
				icon: 'none'
			})
		} finally {
			// 无论成功或失败，都停止下拉刷新
			uni.stopPullDownRefresh()
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

			// 拼接新老数据
			articleList.value = [...articleList.value, ...res.data]

			// 根据数据情况设置状态
			if (res.data.length > 0) {
				status.value = 'more' // 还有更多数据
			} else {
				status.value = 'noMore' // 没有更多数据了
			}
		} catch (err) {
			console.error('加载更多失败:', err)
			uni.showToast({
				title: '加载失败，请重试',
				icon: 'none'
			})
			status.value = 'more' // 失败时恢复为 'more' 状态
		} finally {
			// 确保请求完成后隐藏加载动画
			loadingManager.hideLoading()
		}
	})


	// 处理删除
	const handleDelete = async (articleId) => {
		try {
			// 添加确认提示
			uni.showModal({
				title: '确认删除',
				content: '确定要删除这篇文章吗？',
				success: async (res) => {
					if (res.confirm) {
						// 显示加载提示
						loadingManager.showLoading('删除中...')
						
						console.log('正在删除文章ID:', articleId, '用户ID:', userStore.userInfo.uid)
						
						// 确保用户已登录
						if (!userStore.userInfo.uid) {
							uni.showToast({
								title: '请先登录',
								icon: 'none',
								duration: 2000
							})
							loadingManager.hideLoading()
							return
						}
						
						// 调用接口删除文章
						const res = await articleApi.del(articleId, userStore.userInfo.uid)
						console.log('删除接口返回结果:', res)
						
						if (res && res.deleted) {
							// 删除成功，从列表中移除该文章
							const index = articleList.value.findIndex(item => item._id === articleId)
							if (index !== -1) {
								articleList.value.splice(index, 1)
							}
							
							loadingManager.hideLoading()
							uni.showToast({
								title: '删除成功',
								icon: 'success',
								duration: 2000
							})
						} else {
							throw new Error(res.message || '删除失败，请重试')
						}
					}
				}
			})
		} catch (err) {
			console.error('删除文章失败:', err)
			loadingManager.hideLoading()
			uni.showToast({
				title: err.message || '删除失败，请重试',
				icon: 'none',
				duration: 2000
			})
		}
	}

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

		// 抖音小程序环境下
		// #ifdef MP-TOUTIAO
		console.log('运行在抖音小程序环境');
		
		try {
			// 直接尝试拨打，如果失败会触发fail回调
			uni.makePhoneCall({
				phoneNumber: mobile,
				success: function() {
					console.log('拨打电话成功');
				},
				fail: function(err) {
					console.error('拨打电话失败:', err);
					
					// 如果是权限问题，显示带复制功能的提示框
					if (err.errNo === 10202 || err.errNo === 10101 || err.errMsg.includes('auth deny') || err.errMsg.includes('not declared in the privacy')) {
						uni.showModal({
							title: '提示',
							content: `由于平台限制，无法直接拨打电话。您可以复制此号码(${mobile})后手动拨打。`,
							confirmText: '复制号码',
							cancelText: '取消',
							success: (res) => {
								if (res.confirm) {
									// 复制到剪贴板
									uni.setClipboardData({
										data: mobile,
										success: () => {
											uni.showToast({
												title: '电话号码已复制',
												icon: 'success'
											});
										}
									});
								}
							}
						});
					} else {
						// 其他错误
						uni.showToast({
							icon: 'none',
							title: '拨打电话失败，请手动拨打'
						});
					}
				}
			});
		} catch (error) {
			console.error('拨打电话异常:', error);
			// 异常情况下，提供复制号码的选项
			uni.showModal({
				title: '无法拨打电话',
				content: `您可以复制此号码(${mobile})后手动拨打`,
				confirmText: '复制号码',
				cancelText: '取消',
				success: (res) => {
					if (res.confirm) {
						uni.setClipboardData({
							data: mobile,
							success: () => {
								uni.showToast({
									title: '电话号码已复制',
									icon: 'success'
								});
							}
						});
					}
				}
			});
		}
		// #endif
		
		// 非抖音小程序环境
		// #ifndef MP-TOUTIAO
		uni.makePhoneCall({
			phoneNumber: mobile
		});
		// #endif
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
	
	

	// 页面加载完毕
	onMounted(() => {
		// 直接获取分类和文章列表
		cateListGet();
		
		// 监听文章发布成功事件
		uni.$on('articlePublished', (articleId) => {
			console.log('收到文章发布成功事件，文章ID:', articleId)
			// 重新获取文章列表
			pageNo.value = 1
			status.value = 'more'
			getArticleList(tempCateId)
			
			// 显示发布成功提示
			uni.showToast({
				title: '发布成功，内容已更新',
				icon: 'success',
				duration: 2000
			})
		})
		
		// 监听一次性刷新事件 - 从发布页面跳转回来时只刷新一次
		uni.$on('refreshIndexOnce', (articleId) => {
			console.log('收到一次性刷新事件，文章ID:', articleId)
			// 重置页码并刷新文章列表
			pageNo.value = 1
			status.value = 'more'
			
			// 显示加载提示
			// uni.showLoading({
			//	title: '正在刷新内容...',
			//	mask: true
			// })
			
			// 延迟一点执行，确保页面已完全加载
			setTimeout(() => {
				getArticleList(tempCateId).then(() => {
					// 刷新完成后隐藏加载提示
					// uni.hideLoading()
					
					// 如果有文章ID，尝试滚动到该文章
					if (articleId && articleList.value.length > 0) {
						// 查找新发布的文章在列表中的位置
						const index = articleList.value.findIndex(item => item._id === articleId)
						if (index !== -1) {
							console.log('找到新发布的文章，位置:', index)
							// 可以在这里添加滚动到该文章的逻辑
						}
					}
				}).catch(err => {
					console.error('刷新文章列表失败:', err)
					// uni.hideLoading()
				})
			}, 300)
		})
		
		// 监听浏览量更新事件
		uni.$on('viewCountUpdated', (articleId) => {
			updateLocalViewCount(articleId)
		})
		
		// 开启平台原生页面分享
		uni.showShareMenu({
			withShareTicket: true
		})
		
		// 监听头像点击状态变化事件
		uni.$on('avatarClickChanged', (newState) => {
			console.log('首页收到头像点击状态变化事件:', newState);
			avatarClickState.value = newState;
		})
	})

	// 在页面卸载时移除事件监听
	onUnmounted(() => {
		uni.$off('articlePublished')
		uni.$off('refreshIndexOnce') // 移除一次性刷新事件监听
		uni.$off('viewCountUpdated')
		uni.$off('avatarClickChanged') // 移除头像点击状态监听
		
		// 发出页面销毁事件，用于中断正在进行的请求
		uni.$emit('index-page-destroyed')
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

	// 添加这个函数来获取分类图标，移除位置相关代码
	const getCategoryIcon = (category) => {
		// 如果分类对象有cate_img字段且不为空，直接使用
		if (category && category.cate_img && category.cate_img.length > 4) {
			// 确保图标URL格式正确
			if (category.cate_img.startsWith('http') || category.cate_img.startsWith('/')) {
				return category.cate_img;
			}
		}
		
		// 根据分类名称选择默认图标 - 可以根据关键字提供特定图标
		if (category && category.cate_name) {
			// 分类名称关键词映射
			const iconMapping = {
				'餐饮': '/static/images/category/food.png',
				'美食': '/static/images/category/food.png',
				'购物': '/static/images/category/shopping.png',
				'商场': '/static/images/category/shopping.png',
				'教育': '/static/images/category/education.png',
				'学校': '/static/images/category/education.png',
				'医疗': '/static/images/category/medical.png',
				'医院': '/static/images/category/medical.png',
				'交通': '/static/images/category/transportation.png',
				'旅游': '/static/images/category/tourism.png',
				'景点': '/static/images/category/tourism.png',
				'住宿': '/static/images/category/accommodation.png',
				'酒店': '/static/images/category/accommodation.png',
				'娱乐': '/static/images/category/entertainment.png',
				'运动': '/static/images/category/sports.png',
				'健身': '/static/images/category/sports.png',
				'服务': '/static/images/category/service.png',
				'房产': '/static/images/category/real_estate.png',
				'招聘': '/static/images/category/recruitment.png',
				'求职': '/static/images/category/recruitment.png',
				'金融': '/static/images/category/finance.png',
				'科技': '/static/images/category/technology.png',
				'办公': '/static/images/category/office.png',
				'公司': '/static/images/category/company.png',
				'企业': '/static/images/category/company.png',
			};
			
			// 检查分类名称中是否包含关键词
			for (const [keyword, iconPath] of Object.entries(iconMapping)) {
				if (category.cate_name.includes(keyword)) {
					return iconPath;
				}
			}
		}
		
		// 如果没有图标，返回默认图标
		return '/static/images/defalut.png';
	}

	// 更新本地文章浏览量
	const updateLocalViewCount = (articleId) => {
		if (!articleId || !articleList.value.length) return;
		
		const index = articleList.value.findIndex(item => item._id === articleId);
		if (index !== -1) {
			// 增加浏览量 - 同时兼容view_count和look_count两个字段名
			if (articleList.value[index].view_count !== undefined) {
				articleList.value[index].view_count++;
				console.log(`文章 ${articleId} view_count已更新为:`, articleList.value[index].view_count);
			}
			
			// 同时更新look_count字段(如果存在)
			if (articleList.value[index].look_count !== undefined) {
				articleList.value[index].look_count++;
				console.log(`文章 ${articleId} look_count已更新为:`, articleList.value[index].look_count);
			} else if (articleList.value[index].view_count !== undefined) {
				// 如果只有view_count，创建look_count并赋值
				articleList.value[index].look_count = articleList.value[index].view_count;
			} else {
				// 如果两者都不存在，初始化为1
				articleList.value[index].view_count = 1;
				articleList.value[index].look_count = 1;
				console.log(`文章 ${articleId} 浏览量已初始化为:1`);
			}
		}
	};

	// 添加图片预览方法
	const previewImage = (urls, current) => {
		// 检查参数
		if (!urls || !urls.length) {
			console.error('预览图片缺少URLs参数');
			return;
		}
		
		// 获取预览URL列表 - 使用原始URL，不使用压缩URL
		let previewUrls = urls;
		
		// 如果当前URL和URLs数组是对象数组，仅在预览时提取compressedURL（如果有）或url
		if (typeof current === 'object' && current !== null) {
			current = current.compressedURL;
		}
		
		// 如果URLs数组是对象数组，仅在预览时提取compressedURL（如果有）或url
		if (urls.length > 0 && typeof urls[0] === 'object') {
			previewUrls = urls.map(img => img.compressedURL);
		}
		
		// 使用uni.previewImage实现图片预览和左右滑动功能
		uni.previewImage({
			urls: previewUrls,           // 需要预览的图片链接列表（此时已是压缩URL或原始URL）
			current: current || previewUrls[0], // 当前显示图片的链接
			indicator: 'number',  // 显示页码指示器
			loop: true,           // 循环预览
			success: () => {
				console.log('图片预览成功');
			},
			fail: (err) => {
				console.error('预览图片失败:', err);
				uni.showToast({
					title: '预览图片失败',
					icon: 'none'
				});
			},
			complete: () => {
				// 预览完成后可以做一些清理工作
			}
		});
		
		
	};

	// 页面显示时获取最新权限状态
	onShow(() => {
		// 获取最新的权限状态
		getSendOnState();
		
		// 检查是否需要重新加载分类（比如从后台切回前台时）
		if (lastActiveTime && (Date.now() - lastActiveTime > 60000)) { // 如果离开超过1分钟
			console.log('应用从后台恢复，重新获取分类');
			// 重新获取分类数据
			cateListGet();
		}
		
		// 更新最后活跃时间
		lastActiveTime = Date.now();
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
		uni.navigateTo({
			url: `/pages/article/articleDetail?article_id=${id}`,
			animationType: 'slide-in-right', // 添加滑入动画
			animationDuration: 300 // 设置动画持续时间为300ms
		})
	}

	// 记录最后活跃时间
	let lastActiveTime = Date.now();

</script>
<template>
	<view class="home">
		<!-- 顶部分类导航 -->
		<view class="category-container">
			<!-- 动态分类 -->
			<scroll-view class="category-scroll" scroll-y="true" scroll-with-animation="true">
				<view class="category-list">
					<view class="category-item" 
						v-for="(item, index) in cateList" 
						:key="item._id" 
						:class="{ active: currentCateId === item._id }" 
						@click="hanleHeadTab(index, item._id)">
						<view class="category-content">
							<image v-if="item.cate_img" :src="item.cate_img" class="cate-icon" mode="aspectFit"></image>
							<text class="cate-text">{{ item.cate_name }}</text>
						</view>
					</view>
					
					<!-- 加载中显示 -->
					<view class="category-item loading-item" v-if="cateList.length == 0">
						<view class="category-content">
							<uni-icons type="spinner-cycle" size="24" color="#399bfe"></uni-icons>
							<text class="loading-text">加载中...</text>
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
				<view class="empty-icon">
					<uni-icons color="#5cb85c" custom-prefix="icon" type="lishuai-a-00jichuiconkongzhuangtaiwuneirong" size="58"></uni-icons>
				</view>
				<text class="empty-text">暂无内容</text>
				<text class="empty-subtext">该分类下还没有数据，去看看其他分类吧</text>
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
		padding-top: 160rpx; /* 减少顶部间距，因为移除了最新最热筛选 */
		height: 100vh;
		background-color: $pyq-pages-bg-color;

		/* 分类导航容器 */
		.category-container {
			position: fixed;
			left: 0;
			top: 0;
			width: 100%;
			z-index: 999;
			background-color: #fff;
			box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
		}
		
		/* 分类垂直导航样式 */
		.category-scroll {
			width: 100%;
			height: 160rpx; /* 增加高度以适应垂直布局 */
			white-space: nowrap;
			border-bottom: 1px solid $pyq-border-color-translucent;
			
			.category-list {
				display: flex;
				align-items: center;
				padding: 12rpx;
				flex-wrap: wrap;
				
				.category-item {
					padding: 8rpx 8rpx;
					margin: 6rpx;
					font-size: 26rpx;
					color: $pyq-text-color-placeholder;
					height: 120rpx; /* 增加高度 */
					width: 120rpx; /* 固定宽度 */
					border-radius: 3rpx;
					background-color: #f8f8f8;
					overflow: hidden;
					position: relative;
					
					.category-content {
						display: flex;
						flex-direction: column;
						align-items: center;
						justify-content: center;
						height: 100%;
						position: relative;
						
						.loading-text {
							font-size: 22rpx;
							margin-top: 10rpx;
							color: #399bfe;
						}
					}
					
					.cate-icon {
						width: 50rpx;
						height: 50rpx;
						margin-bottom: 10rpx; /* 图标与文字的间距 */
					}
					
					.cate-text {
						font-size: 24rpx;
						text-align: center;
						/* 文本溢出显示省略号 */
						overflow: hidden;
						text-overflow: ellipsis;
						white-space: nowrap;
						max-width: 100%;
						/* 限制最多显示4个字符 */
						display: inline-block;
						
					}
					
					&.active {
						color: #399bfe;
						font-weight: bold;
						background-color: rgba(57, 155, 254, 0.1);
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