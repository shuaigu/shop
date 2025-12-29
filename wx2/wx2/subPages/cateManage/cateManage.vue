<script setup>
	import { ref, onMounted, computed, nextTick } from 'vue'
	import { onShow, onHide } from '@dcloudio/uni-app'
	import { getDefaultImage, fixImageUrl } from '@/utils/domainConfig.js' // 导入默认图片配置函数
	
	// 注意：当前环境中可能存在 SharedArrayBuffer 跨域隔离(COOP/COEP)警告
	// 这个警告是由浏览器引擎产生的，在小程序环境中不影响功能
	// 详情参见：https://developer.chrome.com/blog/enabling-shared-array-buffer/
	
	const cateApi = uniCloud.importObject('cateWx', { customUI: true })
	const qiniuCloud = uniCloud.importObject('qiniuyunCloud', { customUI: true })
	
	// 分类列表数据
	const cateList = ref([])
	const loading = ref(false)
	const dataLoaded = ref(false)
	
	// 当前筛选标签：all-全部，visible-已显示，hidden-已隐藏
	const currentTab = ref('all')
	
	// 是否显示工具菜单
	const showToolMenu = ref(false)
	
	// 滚动相关变量
	const scrollTop = ref(0)
	const oldScrollTop = ref(0)
	const scrollViewId = ref('cateScrollView')
	
	// 批量操作状态
	const batchOperationLoading = ref(false)
	
	// 获取分类列表
	const cateListGet = async () => {
		if (loading.value) return
		
		loading.value = true
		try {
			// 使用 get 方法并传递 showAll=true 来获取所有分类(包括隐藏的)
			const res = await cateApi.get(null, true)
			// 确保 res.data 是数组且不为空
			if (res && res.data && Array.isArray(res.data)) {
				cateList.value = res.data.filter(item => item && typeof item === 'object')
				// 🔍 调试：检查分类图片URL格式
				console.log('📋 获取到的分类数据:', cateList.value.length + '条');
				if (cateList.value.length > 0) {
					console.log('📋 第一条分类数据示例:', {
						name: cateList.value[0].cate_name,
						img: cateList.value[0].cate_img
					});
				}
			} else {
				cateList.value = []
				console.warn('获取到的分类数据不是有效的数组')
			}
			dataLoaded.value = true
			
			// 数据加载完成后，保持滚动位置或滚动到顶部
			nextTick(() => {
				if (oldScrollTop.value > 0) {
					// 如果有之前的滚动位置，恢复到该位置
					scrollToPosition(oldScrollTop.value);
				} else {
					// 否则滚动到顶部
					scrollToTop();
				}
			});
		} catch (error) {
			console.error('获取分类列表失败:', error)
			cateList.value = [] // 确保发生错误时设置为空数组
			uni.showToast({
				title: '获取分类失败',
				icon: 'none'
			})
		} finally {
			loading.value = false
		}
	}
	
	// 滚动到顶部
	const scrollToTop = () => {
		scrollTop.value = 0;
		oldScrollTop.value = 0;
	}
	
	// 滚动到指定位置
	const scrollToPosition = (position) => {
		scrollTop.value = position;
	}
	
	// 滚动事件处理
	const handleScroll = (e) => {
		oldScrollTop.value = e.detail.scrollTop;
	}
	
	// 页面显示时获取数据
	onShow(() => {
		if (!dataLoaded.value) {
			cateListGet()
		}
	})
	
	// 组件挂载时初始化
	onMounted(() => {
		cateListGet()
		// 获取设备信息并计算rpx比例
		try {
			const info = uni.getWindowInfo()
			screenInfo.value = {
				windowWidth: info.windowWidth,
				windowHeight: info.windowHeight,
				rpxRatio: 750 / info.windowWidth
			}
		} catch (error) {
			console.error('获取设备信息失败:', error)
			// 使用备用方法
			try {
				const systemInfo = uni.getSystemInfoSync()
				screenInfo.value = {
					windowWidth: systemInfo.windowWidth,
					windowHeight: systemInfo.windowHeight,
					rpxRatio: 750 / systemInfo.windowWidth
				}
			} catch (e) {
				console.error('获取系统信息失败:', e)
			}
		}
	})
	
	// 弹窗显示状态 - 初始值设为 false
	const showPopup = ref(false)
	// 是否是编辑模式
	const isEdit = ref(false)
	// 编辑时的初始值
	const editValue = ref('')
	// 当前编辑的分类ID
	const currentId = ref('')
	// 分类图片
	const cateImage = ref('')
	// 图片上传状态
	const imageUploading = ref(false)
	// 图片上传进度
	const uploadProgress = ref(0)
	// 分类是否可见
	const isVisible = ref(true)
	// 记录屏幕尺寸信息（用于其他功能）
	const screenInfo = ref({
		windowWidth: 375,
		windowHeight: 667,
		rpxRatio: 2 // 初始默认值，将在挂载时更新
	})
	
	// 序号模式
	const showOrdinalMode = ref(false)
	
	// 是否正在编辑序号
	const editingOrdinal = ref(false)
	
	// 序号编辑值
	const ordinalValues = ref({})
	
	// 序号实时预览
	const previewSortedList = computed(() => {
		if (!showOrdinalMode.value || !cateList.value || cateList.value.length === 0) return []
		
		// 创建带索引的序列，用于排序
		const itemsWithIndex = cateList.value.map((item, index) => {
			return {
				...item,
				originalIndex: index,
				sortValue: ordinalValues.value[item._id] !== undefined 
					? Number(ordinalValues.value[item._id]) 
					: (item.sort_order !== undefined ? Number(item.sort_order) : 0)
			}
		})
		
		// 按sortValue排序
		return [...itemsWithIndex].sort((a, b) => {
			return b.sortValue - a.sortValue // 倒序，大的排前面
		})
	})
	
	// 调整序号值
	const adjustOrdinalValue = (id, amount) => {
		if (!ordinalValues.value[id]) {
			ordinalValues.value[id] = 0
		}
		
		// 转为数字并增加/减少
		let currentValue = Number(ordinalValues.value[id]) || 0
		currentValue += amount
		
		// 确保不小于0
		currentValue = Math.max(0, currentValue)
		
		// 更新值
		ordinalValues.value[id] = currentValue
	}
	
	// 防抖优化 - 输入序号变化时延迟更新
	const debouncedUpdateOrdinal = (id, value) => {
		// 为每个ID创建一个定时器
		if (ordinalUpdateTimers[id]) {
			clearTimeout(ordinalUpdateTimers[id])
		}
		
		// 200ms后更新值
		ordinalUpdateTimers[id] = setTimeout(() => {
			updateOrdinalValue(id, value)
		}, 200)
	}
	
	// 序号更新定时器对象
	const ordinalUpdateTimers = {}
	
	// 计算排序后的列表
	const sortedCateList = computed(() => {
		if (!cateList.value || cateList.value.length === 0) return []
		
		return [...cateList.value].sort((a, b) => {
			// 优先使用sort_order字段排序
			const aSort = a.sort_order !== undefined ? Number(a.sort_order) : 0
			const bSort = b.sort_order !== undefined ? Number(b.sort_order) : 0
			return bSort - aSort // 倒序，让大的排在前面
		})
	})
	
	// 根据当前标签筛选后的列表
	const filteredCateList = computed(() => {
		if (currentTab.value === 'all') {
			return sortedCateList.value
		} else if (currentTab.value === 'visible') {
			return sortedCateList.value.filter(item => item && item.is_visible !== false)
		} else if (currentTab.value === 'hidden') {
			return sortedCateList.value.filter(item => item && item.is_visible === false)
		}
		return sortedCateList.value
	})
	
	// 统计信息
	const statsInfo = computed(() => {
		const total = cateList.value.length
		const visible = cateList.value.filter(item => item && item.is_visible !== false).length
		const hidden = total - visible
		return {
			total,
			visible,
			hidden
		}
	})
	
	// 切换标签
	const switchTab = (tab) => {
		currentTab.value = tab
		showToolMenu.value = false
	}
	
	// 切换工具菜单
	const toggleToolMenu = () => {
		showToolMenu.value = !showToolMenu.value
	}
	
	// 切换序号模式
	const toggleOrdinalMode = () => {
		showOrdinalMode.value = !showOrdinalMode.value
		showToolMenu.value = false
		
		if (showOrdinalMode.value) {
			// 初始化序号编辑值
			ordinalValues.value = {}
			sortedCateList.value.forEach((item, index) => {
				// 使用现有的排序值或根据位置创建新的值（倒序）
				const sortValue = item.sort_order !== undefined ? 
					item.sort_order : 
					sortedCateList.value.length - index
				
				ordinalValues.value[item._id] = sortValue
			})
			
			editingOrdinal.value = false
			
			uni.showToast({
				title: '进入序号排序模式',
				icon: 'none',
				duration: 2000
			})
		} else {
			// 清除所有定时器
			Object.keys(ordinalUpdateTimers).forEach(key => {
				clearTimeout(ordinalUpdateTimers[key])
			})
		}
	}
	
	// 开始编辑序号
	const startEditOrdinal = () => {
		editingOrdinal.value = true
	}
	
	// 保存序号排序
	const saveOrdinalSort = async () => {
		try {
			uni.showLoading({
				title: '保存中...',
				mask: true
			})
			
			// 为每个分类设置排序值
			const updatePromises = Object.entries(ordinalValues.value).map(([id, value]) => {
				return cateApi.updateSort(id, Number(value));
			});
			
			await Promise.all(updatePromises);
			
			// 隐藏加载提示
			uni.hideLoading()
			
			uni.showToast({
				title: '排序已保存',
				icon: 'success'
			});
			
			// 重新获取列表，确保数据一致性
			await cateListGet()
			
			// 退出序号模式
			showOrdinalMode.value = false
		} catch (error) {
			console.error('保存排序失败:', error);
			
			// 隐藏加载提示
			uni.hideLoading()
			
			uni.showToast({
				title: '保存排序失败',
				icon: 'none'
			});
		}
	}
	
	// 取消序号排序
	const cancelOrdinalSort = () => {
		showOrdinalMode.value = false
		editingOrdinal.value = false
		
		uni.showToast({
			title: '已取消序号排序',
			icon: 'none'
		})
	}
	
	// 更新序号值
	const updateOrdinalValue = (id, value) => {
		// 确保是数字
		let numValue = Number(value)
		
		// 检查是否为有效数字
		if (isNaN(numValue)) {
			numValue = 0
		}
		
		// 更新序号值
		ordinalValues.value[id] = numValue
	}
	


	// 添加分类
	const handleAddCate = () => {
		console.log(1)
		// isEdit为false代表此时添加操作
		isEdit.value = false
		// 重置图片和编辑值
		cateImage.value = ''
		editValue.value = ''
		isVisible.value = true
		showPopup.value = true
	}

	// 编辑分类
	const edit = async (id) => {
		if (!id) {
			console.error('编辑分类失败：无效的ID');
			uni.showToast({
				title: '操作失败',
				icon: 'none'
			});
			return;
		}
		
		try {
			isEdit.value = true
			currentId.value = id // 保存当前编辑的ID
			// 根据点击id获取对应分类名称
			const res = await cateApi.get(id)
			if (res && res.data && res.data[0]) {
				console.log(res, '单个获取')
				editValue.value = res.data[0]?.cate_name || ''
				cateImage.value = res.data[0]?.cate_img || ''
				isVisible.value = res.data[0]?.is_visible !== false // 默认为true，除非明确设置为false
				showPopup.value = true
			} else {
				throw new Error('获取分类详情失败');
			}
		} catch (error) {
			console.error('获取分类信息失败:', error);
			uni.showToast({
				title: '获取分类信息失败',
				icon: 'none'
			});
			// 重置编辑状态
			isEdit.value = false;
			currentId.value = '';
		}
	}

	// 删除分类
	const del = async (id) => {
		if (!id) {
			console.error('删除分类失败：无效的ID');
			uni.showToast({
				title: '操作失败',
				icon: 'none'
			});
			return;
		}
		
		// 添加确认框，防止误删
		uni.showModal({
			title: '确认删除',
			content: '是否确认删除该分类？删除后无法恢复',
			confirmText: '删除',
			confirmColor: '#ff0000',
			cancelText: '取消',
			success: async (res) => {
				if (res.confirm) {
					try {
						uni.showLoading({
							title: '删除中...',
							mask: true
						})
						
						const result = await cateApi.del(id)
						
						uni.hideLoading()
						
						if (result && result.deleted === 1) {
							uni.showToast({
								title: '删除成功',
								icon: 'success'
							})
							// 重新获取列表
							await cateListGet()
						} else {
							throw new Error('删除失败')
						}
					} catch (error) {
						uni.hideLoading()
						console.error('删除失败:', error)
						uni.showToast({
							title: '删除失败: ' + (error.message || '未知错误'),
							icon: 'none'
						})
					}
				}
			}
		})
	}
	
	// 选择图片
	const chooseImage = async () => {
		try {
			const res = await uni.chooseImage({
				count: 1,
				sizeType: ['compressed'],
				sourceType: ['album', 'camera']
			})
			
			if (res.tempFilePaths && res.tempFilePaths.length > 0) {
				// 先显示本地临时图片
				const tempPath = res.tempFilePaths[0]
				
				// 上传图片到服务器
				await uploadImage(tempPath)
			}
		} catch (e) {
			console.error('选择图片失败:', e)
			if (e.errMsg !== 'chooseImage:fail cancel') {
				uni.showToast({
					title: '选择图片失败',
					icon: 'none'
				})
			}
		}
	}
	
	// 上传图片到服务器 - 使用与头像上传相同的七牛云逻辑
	const uploadImage = async (filePath) => {
		try {
			imageUploading.value = true
			uploadProgress.value = 0
			
			console.log('📷 开始上传分类图片, filePath:', filePath);
			
			// 获取图片信息（宽高）
			const imageInfo = await uni.getImageInfo({
				src: filePath
			}).catch(err => {
				console.error('获取图片尺寸信息失败:', err)
				return { width: 0, height: 0 } // 失败时使用默认值
			})
			
			console.log('📷 分类图片尺寸:', imageInfo.width, 'x', imageInfo.height);
			
			// 添加缓存控制和唯一文件名
			const timestamp = Date.now()
			const randomStr = Math.random().toString(36).substring(2, 10)
			
			// 使用 fabuWx 云函数获取上传配置（与头像上传相同）
			const extStorageCo = uniCloud.importObject('fabuWx', { customUI: true });
			const uploadOptions = await extStorageCo.getUploadFileOptions({
				cloudPath: `2025/touxiang/cate_${timestamp}_${randomStr}.jpg`, // 使用头像目录
				fileType: 'image',
				isOriginal: true, // 使用原图
				imageWidth: imageInfo.width,
				imageHeight: imageInfo.height
			});
			
			console.log('====== 云函数返回的上传配置 ======');
			console.log('图片尺寸:', imageInfo.width, 'x', imageInfo.height);
			console.log('原图URL:', uploadOptions.fileURL);
			console.log('云路径cloudPath:', uploadOptions.cloudPath);
			console.log('说明: 直接使用原图URL，无压缩处理');
			console.log('===================================');
			
			// 执行上传（与头像上传相同的逻辑）
			return new Promise((resolve, reject) => {
				const uploadTask = uni.uploadFile({
					...uploadOptions.uploadFileOptions,
					filePath: filePath,
					onUploadProgress: (progressEvent) => {
						uploadProgress.value = Math.round((progressEvent.loaded / progressEvent.total) * 100)
					},
					success: (uploadRes) => {
						console.log('📤 上传响应:', uploadRes);
						
						if (uploadRes.statusCode === 200) {
							// 保存纯净的原始URL，不带任何参数
							const originalUrl = uploadOptions.url || uploadOptions.fileURL;
							// 移除URL中的所有参数
							const cleanUrl = originalUrl.includes('?') ? originalUrl.split('?')[0] : originalUrl;
							
							console.log('====== 分类图片上传成功 ======');
							console.log('原始URL:', originalUrl);
							console.log('保存URL:', cleanUrl);
							console.log('包含aly2.jingle0350.cn:', cleanUrl.includes('aly2.jingle0350.cn'));
							console.log('包含2025/touxiang:', cleanUrl.includes('2025/touxiang'));
							console.log('说明: 保存纯净原图URL，不带任何参数');
							console.log('===========================');
							
							// 更新图片URL，保存纯净URL
							cateImage.value = cleanUrl
							
							uni.showToast({
								title: '图片上传成功',
								icon: 'success'
							})
							
							resolve(cleanUrl);
						} else {
							console.error('❌ 上传失败, 状态码:', uploadRes.statusCode);
							reject(new Error(`上传失败: ${uploadRes.statusCode}`));
						}
					},
					fail: (error) => {
						console.error('❌ 上传失败:', error);
						reject(new Error('上传失败: ' + error.errMsg));
					}
				});
			});
		} catch (e) {
			console.error('上传图片错误:', e)
			uni.showToast({
				title: '图片上传失败: ' + (e.message || '未知错误'),
				icon: 'none'
			})
			throw e;
		} finally {
			imageUploading.value = false
		}
	}

	// 确认添加/编辑--弹框确认事件
	const handleConfirm = async (data) => {
		// 检查是否正在上传图片
		if (imageUploading.value) {
			uni.showToast({
				title: '图片正在上传中，请稍候',
				icon: 'none'
			})
			return
		}
		
		// 如果是字符串，则兼容旧版本
		if (typeof data === 'string') {
			data = {
				cate_name: data,
				cate_img: cateImage.value,
				is_visible: isVisible.value
			}
		} else if (!data.cate_img && cateImage.value) {
			// 确保图片URL被包含
			data.cate_img = cateImage.value
		}
		
		if (isEdit.value) {
			// 编辑逻辑
			console.log('编辑', data)
			const upRes = await cateApi.update(currentId.value, data) // 使用保存的ID
			console.log(upRes)
			if (upRes.updated === 1) {
				uni.showToast({
					title: '更新成功',
					icon: 'none'
				})
				cateListGet()
			}
		} else {
			// 添加逻辑
			console.log('添加', data)
			const res = await cateApi.add(data)
			if (res.id) {
				uni.showToast({
					title: '添加成功',
					icon: 'none'
				})
				cateListGet()
			}
		}
		// 重置当前编辑的ID和图片
		currentId.value = ''
		cateImage.value = ''
	}

	// 点击取消
	const handleCanner = () => {
		showPopup.value = false
	}
	
	// 快速切换可见性
	const toggleVisibility = async (id, currentVisibility) => {
		if (!id) {
			console.error('切换可见性失败：无效的ID');
			uni.showToast({
				title: '操作失败',
				icon: 'none'
			});
			return;
		}
		
		// 反转逻辑：当前是可见的，切换后应该隐藏，反之亦然
		const newVisibility = !currentVisibility;
		
		try {
			// 仅更新可见性字段
			const upRes = await cateApi.update(id, {
				is_visible: newVisibility
			});
			
			if (upRes && upRes.updated === 1) {
				uni.showToast({
					title: newVisibility ? '已启用显示' : '已隐藏分类',
					icon: 'none'
				})
				cateListGet()
			} else {
				throw new Error('切换可见性更新失败');
			}
		} catch (error) {
			console.error('切换可见性失败:', error);
			uni.showToast({
				title: '操作失败，请重试',
				icon: 'none'
			});
		}
	}
	


	// 格式化图片URL
	const formatImageUrl = (imageUrl) => {
		// 当imageUrl为空或无效值时返回默认图片
		if (!imageUrl || imageUrl === 'undefined' || imageUrl === 'null') {
			console.warn('⚠️ 分类图片URL为空，返回默认图');
			return getDefaultImage('default'); // 使用domainConfig中的默认图
		}
		
		// 🔍 调试：查看原始URL和转换后的URL
		const fixedUrl = fixImageUrl(imageUrl);
		if (imageUrl !== fixedUrl) {
			console.log('🔄 分类图片URL转换:', {
				原始: imageUrl,
				转换后: fixedUrl
			});
		}
		
		// 使用fixImageUrl统一处理图片URL
		return fixedUrl;
	}
	
	// 图片加载错误处理函数
	const handleImageError = (item, e) => {
		if (!item) return;
		console.warn('图片加载失败:', e);
		// 设置为本地默认图片
		item.cate_img = getDefaultImage('default'); // 使用domainConfig中的默认图
	}

	// 一键隐藏所有分类
	const hideAllCategories = async () => {
		if (batchOperationLoading.value) return;
		if (!cateList.value || cateList.value.length === 0) {
			uni.showToast({
				title: '没有可隐藏的分类',
				icon: 'none'
			});
			return;
		}
		
		// 统计可隐藏的分类数量
		const visibleCategories = cateList.value.filter(item => item && item.is_visible !== false);
		
		if (visibleCategories.length === 0) {
			uni.showToast({
				title: '所有分类已经是隐藏状态',
				icon: 'none'
			});
			return;
		}
		
		// 确认操作
		uni.showModal({
			title: '确认隐藏',
			content: `是否隐藏所有分类？将有 ${visibleCategories.length} 个分类被隐藏，隐藏后分类将不会在前台显示。`,
			confirmText: '隐藏全部',
			confirmColor: '#399bfe',
			cancelText: '取消',
			success: async (res) => {
				if (res.confirm) {
					try {
						batchOperationLoading.value = true;
						
						uni.showLoading({
							title: '处理中...',
							mask: true
						});
						
						// 使用分批处理
						// 每批处理的最大数量
						const BATCH_SIZE = 10;
						let successCount = 0;
						const totalCount = visibleCategories.length;
						
						// 分批处理
						for (let i = 0; i < totalCount; i += BATCH_SIZE) {
							const batch = visibleCategories.slice(i, i + BATCH_SIZE);
							
							// 更新加载提示，显示进度
							uni.showLoading({
								title: `处理中 ${i + 1}-${Math.min(i + BATCH_SIZE, totalCount)}/${totalCount}...`,
								mask: true
							});
							
							// 并行处理一批请求
							const batchPromises = batch.map(item => 
								cateApi.update(item._id, { is_visible: false })
									.then(() => successCount++)
									.catch(error => {
										console.error(`更新分类 ${item._id} 失败:`, error);
										return null;
									})
							);
							
							// 等待当前批次完成
							await Promise.all(batchPromises);
						}
						
						// 隐藏加载提示
						uni.hideLoading();
						
						// 显示操作结果
						if (successCount === totalCount) {
							uni.showToast({
								title: `已隐藏全部 ${successCount} 个分类`,
								icon: 'success',
								duration: 2000
							});
						} else {
							uni.showModal({
								title: '操作结果',
								content: `成功隐藏 ${successCount}/${totalCount} 个分类，部分操作可能失败，请刷新后检查。`,
								showCancel: false,
								confirmText: '确定'
							});
						}
						
						// 重新获取列表
						await cateListGet();
						
					} catch (error) {
						console.error('批量隐藏分类失败:', error);
						uni.hideLoading();
						uni.showToast({
							title: '操作失败，请重试',
							icon: 'none'
						});
					} finally {
						batchOperationLoading.value = false;
					}
				}
			}
		});
	}
	
	// 一键显示所有分类
	const showAllCategories = async () => {
		if (batchOperationLoading.value) return;
		if (!cateList.value || cateList.value.length === 0) {
			uni.showToast({
				title: '没有可显示的分类',
				icon: 'none'
			});
			return;
		}
		
		// 统计可显示的分类数量
		const hiddenCategories = cateList.value.filter(item => item && item.is_visible === false);
		
		if (hiddenCategories.length === 0) {
			uni.showToast({
				title: '所有分类已经是显示状态',
				icon: 'none'
			});
			return;
		}
		
		// 确认操作
		uni.showModal({
			title: '确认显示',
			content: `是否显示所有分类？将有 ${hiddenCategories.length} 个分类被显示，显示后分类将会在前台可见。`,
			confirmText: '显示全部',
			confirmColor: '#399bfe',
			cancelText: '取消',
			success: async (res) => {
				if (res.confirm) {
					try {
						batchOperationLoading.value = true;
						
						uni.showLoading({
							title: '处理中...',
							mask: true
						});
						
						// 使用分批处理
						// 每批处理的最大数量
						const BATCH_SIZE = 10;
						let successCount = 0;
						const totalCount = hiddenCategories.length;
						
						// 分批处理
						for (let i = 0; i < totalCount; i += BATCH_SIZE) {
							const batch = hiddenCategories.slice(i, i + BATCH_SIZE);
							
							// 更新加载提示，显示进度
							uni.showLoading({
								title: `处理中 ${i + 1}-${Math.min(i + BATCH_SIZE, totalCount)}/${totalCount}...`,
								mask: true
							});
							
							// 并行处理一批请求
							const batchPromises = batch.map(item => 
								cateApi.update(item._id, { is_visible: true })
									.then(() => successCount++)
									.catch(error => {
										console.error(`更新分类 ${item._id} 失败:`, error);
										return null;
									})
							);
							
							// 等待当前批次完成
							await Promise.all(batchPromises);
						}
						
						// 隐藏加载提示
						uni.hideLoading();
						
						// 显示操作结果
						if (successCount === totalCount) {
							uni.showToast({
								title: `已显示全部 ${successCount} 个分类`,
								icon: 'success',
								duration: 2000
							});
						} else {
							uni.showModal({
								title: '操作结果',
								content: `成功显示 ${successCount}/${totalCount} 个分类，部分操作可能失败，请刷新后检查。`,
								showCancel: false,
								confirmText: '确定'
							});
						}
						
						// 重新获取列表
						await cateListGet();
						
					} catch (error) {
						console.error('批量显示分类失败:', error);
						uni.hideLoading();
						uni.showToast({
							title: '操作失败，请重试',
							icon: 'none'
						});
					} finally {
						batchOperationLoading.value = false;
					}
				}
			}
		});
	}
	
	// 切换所有分类的可见性状态
	const toggleAllCategoriesVisibility = async () => {
		if (batchOperationLoading.value) return;
		if (!cateList.value || cateList.value.length === 0) {
			uni.showToast({
				title: '没有可操作的分类',
				icon: 'none'
			});
			return;
		}
		
		// 统计当前隐藏和显示的分类数量
		const hiddenCategories = cateList.value.filter(item => item && item.is_visible === false);
		const visibleCategories = cateList.value.filter(item => item && item.is_visible !== false);
		
		// 如果所有分类都是隐藏状态，则切换为显示状态
		// 如果所有分类都是显示状态，则切换为隐藏状态
		// 如果混合状态，则优先隐藏所有分类
		const shouldHideAll = visibleCategories.length > 0;
		const targetCategories = shouldHideAll ? visibleCategories : hiddenCategories;
		const actionText = shouldHideAll ? '隐藏' : '显示';
		const successText = shouldHideAll ? '隐藏' : '显示';
		
		if (targetCategories.length === 0) {
			uni.showToast({
				title: `所有分类已经是${shouldHideAll ? '隐藏' : '显示'}状态`,
				icon: 'none'
			});
			return;
		}
		
		// 确认操作
		uni.showModal({
			title: `确认${actionText}`,
			content: `是否${actionText}所有分类？将有 ${targetCategories.length} 个分类被${actionText}，${actionText}后分类将${shouldHideAll ? '不会在前台显示' : '会在前台显示'}。`,
			confirmText: `${actionText}全部`,
			confirmColor: shouldHideAll ? '#399bfe' : '#666',
			cancelText: '取消',
			success: async (res) => {
				if (res.confirm) {
					try {
						batchOperationLoading.value = true;
						
						uni.showLoading({
							title: '处理中...',
							mask: true
						});
						
						// 使用分批处理
						// 每批处理的最大数量
						const BATCH_SIZE = 10;
						let successCount = 0;
						const totalCount = targetCategories.length;
						
						// 分批处理
						for (let i = 0; i < totalCount; i += BATCH_SIZE) {
							const batch = targetCategories.slice(i, i + BATCH_SIZE);
							
							// 更新加载提示，显示进度
							uni.showLoading({
								title: `处理中 ${i + 1}-${Math.min(i + BATCH_SIZE, totalCount)}/${totalCount}...`,
								mask: true
							});
							
							// 并行处理一批请求
							const batchPromises = batch.map(item => 
								cateApi.update(item._id, { is_visible: !shouldHideAll })
									.then(() => successCount++)
									.catch(error => {
										console.error(`更新分类 ${item._id} 失败:`, error);
										return null;
									})
							);
							
							// 等待当前批次完成
							await Promise.all(batchPromises);
						}
						
						// 隐藏加载提示
						uni.hideLoading();
						
						// 显示操作结果
						if (successCount === totalCount) {
							uni.showToast({
								title: `已${successText}全部 ${successCount} 个分类`,
								icon: 'success',
								duration: 2000
							});
						} else {
							uni.showModal({
								title: '操作结果',
								content: `成功${successText} ${successCount}/${totalCount} 个分类，部分操作可能失败，请刷新后检查。`,
								showCancel: false,
								confirmText: '确定'
							});
						}
						
						// 重新获取列表
						await cateListGet();
						
					} catch (error) {
						console.error(`批量${actionText}分类失败:`, error);
						uni.hideLoading();
						uni.showToast({
							title: '操作失败，请重试',
							icon: 'none'
						});
					} finally {
						batchOperationLoading.value = false;
					}
				}
			}
		});
	}
	
	// 智能批量操作 - 根据当前状态自动判断操作
	const smartBatchOperation = async () => {
		if (batchOperationLoading.value) return;
		if (!cateList.value || cateList.value.length === 0) {
			uni.showToast({
				title: '没有可操作的分类',
				icon: 'none'
			});
			return;
		}
		
		// 统计当前隐藏和显示的分类数量
		const hiddenCategories = cateList.value.filter(item => item && item.is_visible === false);
		const visibleCategories = cateList.value.filter(item => item && item.is_visible !== false);
		
		// 判断主要状态
		let operationType = '';
		let targetCategories = [];
		let actionText = '';
		let successText = '';
		
		// 如果显示的分类更多，则隐藏所有显示的分类
		// 如果隐藏的分类更多，则显示所有隐藏的分类
		// 如果数量相等，则隐藏所有分类
		if (visibleCategories.length > hiddenCategories.length) {
			operationType = 'hide';
			targetCategories = visibleCategories;
			actionText = '隐藏';
			successText = '隐藏';
		} else if (hiddenCategories.length > visibleCategories.length) {
			operationType = 'show';
			targetCategories = hiddenCategories;
			actionText = '显示';
			successText = '显示';
		} else {
			// 数量相等，默认隐藏
			operationType = 'hide';
			targetCategories = visibleCategories;
			actionText = '隐藏';
			successText = '隐藏';
		}
		
		if (targetCategories.length === 0) {
			uni.showToast({
				title: `没有可${actionText}的分类`,
				icon: 'none'
			});
			return;
		}
		
		// 确认操作
		uni.showModal({
			title: `智能${actionText}`,
			content: `检测到当前有 ${targetCategories.length} 个分类${operationType === 'hide' ? '处于显示状态' : '处于隐藏状态'}，是否${actionText}这些分类？`,
			confirmText: `${actionText}选中`,
			confirmColor: operationType === 'hide' ? '#399bfe' : '#666',
			cancelText: '取消',
			success: async (res) => {
				if (res.confirm) {
					try {
						batchOperationLoading.value = true;
						
						uni.showLoading({
							title: '处理中...',
							mask: true
						});
						
						// 使用分批处理
						// 每批处理的最大数量
						const BATCH_SIZE = 10;
						let successCount = 0;
						const totalCount = targetCategories.length;
						
						// 分批处理
						for (let i = 0; i < totalCount; i += BATCH_SIZE) {
							const batch = targetCategories.slice(i, i + BATCH_SIZE);
							
							// 更新加载提示，显示进度
							uni.showLoading({
								title: `处理中 ${i + 1}-${Math.min(i + BATCH_SIZE, totalCount)}/${totalCount}...`,
								mask: true
							});
							
							// 并行处理一批请求
							const batchPromises = batch.map(item => 
								cateApi.update(item._id, { is_visible: operationType === 'show' })
									.then(() => successCount++)
									.catch(error => {
										console.error(`更新分类 ${item._id} 失败:`, error);
										return null;
									})
							);
							
							// 等待当前批次完成
							await Promise.all(batchPromises);
						}
						
						// 隐藏加载提示
						uni.hideLoading();
						
						// 显示操作结果
						if (successCount === totalCount) {
							uni.showToast({
								title: `已${successText} ${successCount} 个分类`,
								icon: 'success',
								duration: 2000
							});
						} else {
							uni.showModal({
								title: '操作结果',
								content: `成功${successText} ${successCount}/${totalCount} 个分类，部分操作可能失败，请刷新后检查。`,
								showCancel: false,
								confirmText: '确定'
							});
						}
						
						// 重新获取列表
						await cateListGet();
						
					} catch (error) {
						console.error(`智能${actionText}分类失败:`, error);
						uni.hideLoading();
						uni.showToast({
							title: '操作失败，请重试',
							icon: 'none'
						});
					} finally {
						batchOperationLoading.value = false;
					}
				}
			}
		});
	}
	
</script>

<template>
	<view class="cateManage page-scroll">
		<!-- 顶部栏：统计信息 + 工具按钮 -->
		<view class="top-bar">
			<view class="stats-info">
				<view class="stats-item">
					<text class="stats-number">{{ statsInfo.total }}</text>
					<text class="stats-label">总数</text>
				</view>
				<view class="stats-divider"></view>
				<view class="stats-item">
					<text class="stats-number success">{{ statsInfo.visible }}</text>
					<text class="stats-label">已显示</text>
				</view>
				<view class="stats-divider"></view>
				<view class="stats-item">
					<text class="stats-number muted">{{ statsInfo.hidden }}</text>
					<text class="stats-label">已隐藏</text>
				</view>
			</view>
			<view class="tool-btn" @click="toggleToolMenu">
				<uni-icons type="gear-filled" size="24" color="#399bfe"></uni-icons>
			</view>
		</view>
		
		<!-- 工具菜单 -->
		<view class="tool-menu" v-if="showToolMenu">
			<view class="menu-overlay" @click="toggleToolMenu"></view>
			<view class="menu-content">
				<view class="menu-title">工具菜单</view>
				<view class="menu-section">
					<text class="section-title">排序方式</text>
					<view class="menu-item" @click="toggleOrdinalMode">
						<uni-icons type="numberleft" size="20" color="#399bfe"></uni-icons>
						<text>序号排序</text>
						<uni-icons v-if="showOrdinalMode" type="checkbox-filled" size="20" color="#399bfe"></uni-icons>
					</view>

				</view>
				<view class="menu-section">
					<text class="section-title">批量操作</text>
					<view class="menu-item" @click="showAllCategories">
						<uni-icons type="eye-filled" size="20" color="#399bfe"></uni-icons>
						<text>全部显示</text>
					</view>
					<view class="menu-item" @click="hideAllCategories">
						<uni-icons type="eye-slash-filled" size="20" color="#666"></uni-icons>
						<text>全部隐藏</text>
					</view>
					<view class="menu-item" @click="toggleAllCategoriesVisibility">
						<uni-icons type="loop" size="20" color="#ff9900"></uni-icons>
						<text>切换状态</text>
					</view>
				</view>
			</view>
		</view>
		
		<!-- 批量操作按钮 -->
		<view class="batch-operation-bar" v-if="!showOrdinalMode">
			<view class="batch-btn show-all-btn" @click="showAllCategories" :disabled="batchOperationLoading">
				<uni-icons type="eye-filled" size="20" color="#52c41a"></uni-icons>
				<text>一键开启所有分类</text>
			</view>
			<view class="batch-btn hide-all-btn" @click="hideAllCategories" :disabled="batchOperationLoading">
				<uni-icons type="eye-slash-filled" size="20" color="#999"></uni-icons>
				<text>一键关闭所有分类</text>
			</view>
		</view>
		
		<!-- 标签栏 -->
		<view class="tab-bar" v-if="!showOrdinalMode">
			<view 
				class="tab-item" 
				:class="{ 'active': currentTab === 'all' }"
				@click="switchTab('all')"
			>
				<text>全部</text>
				<text class="tab-count">{{ statsInfo.total }}</text>
			</view>
			<view 
				class="tab-item" 
				:class="{ 'active': currentTab === 'visible' }"
				@click="switchTab('visible')"
			>
				<text>已显示</text>
				<text class="tab-count">{{ statsInfo.visible }}</text>
			</view>
			<view 
				class="tab-item" 
				:class="{ 'active': currentTab === 'hidden' }"
				@click="switchTab('hidden')"
			>
				<text>已隐藏</text>
				<text class="tab-count">{{ statsInfo.hidden }}</text>
			</view>
		</view>
		
		<!-- 加载状态 -->
		<view class="loading-container" v-if="loading">
			<uni-icons type="spinner-cycle" size="30" color="#399bfe"></uni-icons>
			<text class="loading-text">加载中...</text>
		</view>
		
		<!-- 空状态提示 -->
		<view class="empty-container" v-else-if="cateList.length === 0">
			<uni-icons type="info" size="50" color="#999"></uni-icons>
			<text class="empty-text">暂无分类数据</text>
		</view>
		
		<scroll-view 
			class="cateName" 
			:class="{'ordinal-mode': showOrdinalMode}" 
			v-else
			scroll-y="true"
			:enable-back-to-top="true"
			:scroll-with-animation="true"
			:bounces="true"
			:show-scrollbar="true"
			:scroll-top="scrollTop"
			@scroll="handleScroll"
			:id="scrollViewId"
		>
			<!-- 序号排序模式 -->
			<view class="ordinal-list" v-if="showOrdinalMode">
				<view class="ordinal-header">
					<text class="ordinal-title">通过修改序号进行排序 (数字越大排越前)</text>
					<view class="ordinal-actions">
						<button class="btn cancel-btn" @click="cancelOrdinalSort">取消</button>
						<button class="btn save-btn" @click="saveOrdinalSort">保存</button>
					</view>
				</view>
				
				<!-- 排序预览标题 -->
				<view class="preview-header" v-if="previewSortedList.length > 0">
					<text class="preview-title">排序预览</text>
				</view>
				
				<!-- 序号排序项 -->
				<view class="ordinal-item" v-for="item in previewSortedList" :key="item._id">
					<view class="name-container">
						<image 
							class="cate-image" 
							:src="formatImageUrl(item && item.cate_img)" 
							mode="aspectFill" 
							@error="(e) => handleImageError(item, e)"
							@load="() => {}"
						></image>
						<view class="name" :class="{ 'hidden-category': !item.is_visible }">
							{{item ? item.cate_name : ''}}
							<text class="hidden-label" v-if="item && !item.is_visible">(已隐藏)</text>
							<text class="visible-label" v-else-if="item">(已显示)</text>
						</view>
					</view>
					<view class="ordinal-controls">
						<view class="ordinal-btn decrease" @click="adjustOrdinalValue(item._id, -1)">
							<uni-icons type="minus" size="20" color="#666"></uni-icons>
						</view>
						<view class="ordinal-input-wrapper">
							<input 
								type="number" 
								class="ordinal-input" 
								:value="ordinalValues[item._id]" 
								@input="e => debouncedUpdateOrdinal(item._id, e.detail.value)"
								maxlength="5"
							/>
						</view>
						<view class="ordinal-btn increase" @click="adjustOrdinalValue(item._id, 1)">
							<uni-icons type="plus" size="20" color="#399bfe"></uni-icons>
						</view>
					</view>
				</view>
			</view>
			
			<!-- 普通模式 -->
			<view class="normal-list" v-else>
				<view class="cate-card" v-for="(item, index) in filteredCateList" :key="item._id">
					<view class="card-header">
						<view class="order-badge">{{item.sort_order || (sortedCateList.length - index)}}</view>
						<view class="cate-info">
							<image 
								class="cate-image" 
								:src="formatImageUrl(item && item.cate_img)" 
								mode="aspectFill" 
								@error="(e) => handleImageError(item, e)"
							></image>
							<view class="cate-text">
								<text class="cate-name" :class="{ 'hidden-category': !item.is_visible }">
									{{item ? item.cate_name : ''}}
								</text>
								<view class="cate-status">
									<view class="status-tag" :class="item.is_visible !== false ? 'visible' : 'hidden'">
										<uni-icons 
											:type="item.is_visible !== false ? 'eye-filled' : 'eye-slash-filled'" 
											size="14" 
											:color="item.is_visible !== false ? '#52c41a' : '#999'"
										></uni-icons>
										<text>{{ item.is_visible !== false ? '已显示' : '已隐藏' }}</text>
									</view>
								</view>
							</view>
						</view>
						<switch 
							:checked="item && item.is_visible !== false" 
							@change="() => toggleVisibility(item._id, item && item.is_visible !== false)" 
							color="#52c41a"
							style="transform: scale(0.9);"
						/>
					</view>
					<view class="card-actions">
						<view class="action-btns">
							<view class="action-btn edit" @click="edit(item._id)">
								<uni-icons type="compose" size="20" color="#399bfe"></uni-icons>
							</view>
							<view class="action-btn delete" @click="del(item._id)">
								<uni-icons type="trash" size="20" color="#ff4d4f"></uni-icons>
							</view>
						</view>
					</view>
				</view>
			</view>
			
			<!-- 添加底部空白区域确保有滚动空间 -->
			<view class="bottom-space"></view>
		</scroll-view>
	</view>
	<!-- 弹框 -->
	<manage-popup 
		:show="showPopup" 
		:title="isEdit ? '编辑分类' : '添加分类'" 
		:edit-value="editValue"
		:image-url="cateImage"
		:image-uploading="imageUploading"
		:upload-progress="uploadProgress"
		:is-visible="isVisible"
		@choose-image="chooseImage"
		@confirm="handleConfirm" 
		@update:show="handleCanner" 
	/>
	<!-- 悬浮按钮 -->
	<floatButton icon="plus" :size="100" :position="{bottom: '120rpx', right: '40rpx'}"
		@click="handleAddCate"></floatButton>
</template>

<style lang="scss" scoped>
	/*防止分包页面公共样式无法读取*/
	@import "@/style/common.scss";

	.page-scroll {
		min-height: 100vh;
		height: 100vh;
		overflow-y: scroll;
		position: relative;
		-webkit-overflow-scrolling: touch; /* 增强iOS滚动体验 */
		padding-bottom: 150rpx; /* 为悬浮按钮预留空间 */
		box-sizing: border-box;
	}

	.cateManage {
		@include pagesBaseStyle;
		height: auto;
		overflow: visible;
		padding-bottom: 100rpx;
		display: flex;
		flex-direction: column;
		background: linear-gradient(to bottom, #f0f9ff 0%, #ffffff 300rpx);
		
		// 顶部栏样式
		.top-bar {
			display: flex;
			justify-content: space-between;
			align-items: center;
			padding: 24rpx;
			background-color: #fff;
			border-radius: 0 0 32rpx 32rpx;
			box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.04);
			margin-bottom: 20rpx;
			position: sticky;
			top: 0;
			z-index: 100;
			
			.stats-info {
				display: flex;
				align-items: center;
				gap: 24rpx;
				
				.stats-item {
					display: flex;
					flex-direction: column;
					align-items: center;
					
					.stats-number {
						font-size: 36rpx;
						font-weight: 600;
						color: #333;
						line-height: 1;
						margin-bottom: 8rpx;
						
						&.success {
							color: #52c41a;
						}
						
						&.muted {
							color: #999;
						}
					}
					
					.stats-label {
						font-size: 24rpx;
						color: #999;
					}
				}
				
				.stats-divider {
					width: 2rpx;
					height: 40rpx;
					background-color: #f0f0f0;
				}
			}
			
			.tool-btn {
				width: 72rpx;
				height: 72rpx;
				display: flex;
				align-items: center;
				justify-content: center;
				background-color: #f0f9ff;
				border-radius: 50%;
				transition: all 0.3s;
				
				&:active {
					transform: scale(0.95);
					background-color: #e6f4ff;
				}
			}
		}
		
		// 工具菜单样式
		.tool-menu {
			position: fixed;
			top: 0;
			left: 0;
			right: 0;
			bottom: 0;
			z-index: 1000;
			
			.menu-overlay {
				position: absolute;
				top: 0;
				left: 0;
				right: 0;
				bottom: 0;
				background-color: rgba(0, 0, 0, 0.4);
				animation: fadeIn 0.3s ease;
			}
			
			.menu-content {
				position: absolute;
				top: 120rpx;
				right: 24rpx;
				width: 360rpx;
				background-color: #fff;
				border-radius: 24rpx;
				box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.12);
				padding: 24rpx;
				animation: slideIn 0.3s ease;
				
				.menu-title {
					font-size: 32rpx;
					font-weight: 600;
					color: #333;
					margin-bottom: 24rpx;
					padding-bottom: 16rpx;
					border-bottom: 2rpx solid #f0f0f0;
				}
				
				.menu-section {
					margin-bottom: 20rpx;
					
					&:last-child {
						margin-bottom: 0;
					}
					
					.section-title {
						font-size: 24rpx;
						color: #999;
						margin-bottom: 12rpx;
						display: block;
					}
					
					.menu-item {
						display: flex;
						align-items: center;
						gap: 12rpx;
						padding: 16rpx;
						border-radius: 12rpx;
						margin-bottom: 8rpx;
						transition: all 0.2s;
						cursor: pointer;
						
						text {
							flex: 1;
							font-size: 28rpx;
							color: #333;
						}
						
						&:active {
							background-color: #f5f5f5;
						}
					}
				}
			}
		}
		
		// 批量操作按钮栏样式
		.batch-operation-bar {
			display: flex;
			gap: 16rpx;
			padding: 0 24rpx 20rpx;
			
			.batch-btn {
				flex: 1;
				display: flex;
				align-items: center;
				justify-content: center;
				gap: 8rpx;
				padding: 20rpx;
				border-radius: 16rpx;
				font-size: 28rpx;
				font-weight: 500;
				transition: all 0.3s;
				box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.06);
				
				&.show-all-btn {
					background: linear-gradient(135deg, #52c41a 0%, #73d13d 100%);
					color: #fff;
					
					&:active {
						transform: scale(0.98);
						box-shadow: 0 1rpx 8rpx rgba(82, 196, 26, 0.4);
					}
				}
				
				&.hide-all-btn {
					background: linear-gradient(135deg, #8c8c8c 0%, #bfbfbf 100%);
					color: #fff;
					
					&:active {
						transform: scale(0.98);
						box-shadow: 0 1rpx 8rpx rgba(140, 140, 140, 0.4);
					}
				}
				
				&[disabled] {
					opacity: 0.6;
					pointer-events: none;
				}
			}
		}
		
		// 标签栏样式
		.tab-bar {
			display: flex;
			align-items: center;
			padding: 8rpx;
			background-color: #f5f5f5;
			border-radius: 48rpx;
			margin: 0 24rpx 24rpx;
			
			.tab-item {
				flex: 1;
				display: flex;
				align-items: center;
				justify-content: center;
				gap: 8rpx;
				padding: 16rpx 24rpx;
				border-radius: 40rpx;
				font-size: 28rpx;
				color: #666;
				transition: all 0.3s;
				
				.tab-count {
					min-width: 36rpx;
					height: 36rpx;
					padding: 0 8rpx;
					display: flex;
					align-items: center;
					justify-content: center;
					background-color: rgba(0, 0, 0, 0.08);
					border-radius: 18rpx;
					font-size: 22rpx;
					line-height: 1;
				}
				
				&.active {
					background-color: #fff;
					color: #399bfe;
					font-weight: 600;
					box-shadow: 0 2rpx 12rpx rgba(57, 155, 254, 0.15);
					
					.tab-count {
						background-color: #e6f4ff;
						color: #399bfe;
					}
				}
			}
		}
		
		.header-actions {
			display: flex;
			justify-content: flex-end;
			padding: 20rpx 24rpx;
			position: sticky;
			top: 0;
			z-index: 10;
			background-color: #f7f7f7;
			border-bottom: 1rpx solid #eee;
			
			.action-buttons {
				display: flex;
				gap: 16rpx;
				
				.action-btn {
					background-color: #399bfe;
					color: #fff;
					font-size: 26rpx;
					padding: 12rpx 24rpx;
					border-radius: 30rpx;
					box-shadow: 0 2rpx 8rpx rgba(57, 155, 254, 0.3);
					transition: all 0.3s;
					
					&.active {
						background-color: #fff;
						color: #399bfe;
						border: 1px solid #399bfe;
					}
				}
			}
		}
		
		.batch-actions {
			display: flex;
			justify-content: space-between;
			align-items: center;
			padding: 20rpx 24rpx;
			position: relative;
			z-index: 9;
			background-color: #fff;
			border-bottom: 1rpx solid #eee;
			margin-bottom: 16rpx;
			
			.batch-title {
				font-size: 28rpx;
				color: #666;
			}
			
			.batch-buttons {
				display: flex;
				gap: 16rpx;
				
				.batch-btn {
					display: flex;
					align-items: center;
					justify-content: center;
					gap: 8rpx;
					font-size: 26rpx;
					padding: 10rpx 20rpx;
					border-radius: 30rpx;
					transition: all 0.3s;
					white-space: nowrap;
					
					&.show-all {
						background-color: #eef9ff;
						color: #399bfe;
						border: 1px solid #399bfe;
					}
					
					&.hide-all {
						background-color: #f7f7f7;
						color: #666;
						border: 1px solid #ddd;
					}
					
					&.toggle-all {
						background-color: #fff9e6;
						color: #ff9900;
						border: 1px solid #ffcc66;
					}
					
					&.smart-batch {
						background-color: #f0e6ff;
						color: #9966ff;
						border: 1px solid #cc99ff;
					}
					
					&:active {
						transform: scale(0.98);
						opacity: 0.9;
					}
				}
			}
		}
		
		.loading-container,
		.empty-container {
			display: flex;
			flex-direction: column;
			align-items: center;
			justify-content: center;
			padding: 120rpx 0;
			background-color: #fff;
			border-radius: 24rpx;
			margin: 0 24rpx 40rpx;
			box-shadow: 0 2rpx 16rpx rgba(0, 0, 0, 0.04);
			
			.loading-text,
			.empty-text {
				font-size: 28rpx;
				color: #999;
				margin-top: 24rpx;
			}
		}
		
		.bottom-space {
			height: 150rpx;
		}
	}
	
	// 动画
	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}
	
	@keyframes slideIn {
		from {
			transform: translateY(-20rpx);
			opacity: 0;
		}
		to {
			transform: translateY(0);
			opacity: 1;
		}
	}

		.cateName {
			padding: 0 24rpx 24rpx;
			flex: 1;
			overflow-y: visible;
			
			.normal-list {
				height: auto;
				overflow-y: visible;
				
				.cate-card {
					background-color: #fff;
					border-radius: 20rpx;
					margin-bottom: 20rpx;
					padding: 24rpx;
					box-shadow: 0 2rpx 16rpx rgba(0, 0, 0, 0.04);
					transition: all 0.3s;
					
					&:active {
						transform: scale(0.98);
					}
					
					.card-header {
						display: flex;
						align-items: center;
						gap: 16rpx;
						margin-bottom: 20rpx;
						position: relative;
						
						.order-badge {
							min-width: 56rpx;
							height: 56rpx;
							display: flex;
							align-items: center;
							justify-content: center;
							background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
							color: #fff;
							font-size: 24rpx;
							font-weight: 600;
							border-radius: 12rpx;
							box-shadow: 0 4rpx 12rpx rgba(102, 126, 234, 0.3);
						}
						
						.cate-info {
							flex: 1;
							display: flex;
							align-items: center;
							gap: 16rpx;
							
							.cate-image {
								width: 88rpx;
								height: 88rpx;
								border-radius: 16rpx;
								background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
								object-fit: cover;
								box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.08);
							}
							
							.cate-text {
								flex: 1;
								display: flex;
								flex-direction: row;
								align-items: center;
								gap: 16rpx;
								
								.cate-name {
									font-size: 32rpx;
									font-weight: 600;
									color: #333;
									line-height: 1.4;
									white-space: nowrap;
									
									&.hidden-category {
										color: #999;
										text-decoration: line-through;
									}
								}
								
								.cate-status {
									flex-shrink: 0;
									
									.status-tag {
										display: inline-flex;
										align-items: center;
										gap: 6rpx;
										padding: 6rpx 16rpx;
										border-radius: 20rpx;
										font-size: 22rpx;
										line-height: 1;
										white-space: nowrap;
										
										&.visible {
											background-color: #f6ffed;
											color: #52c41a;
											border: 1px solid #b7eb8f;
										}
										
										&.hidden {
											background-color: #f5f5f5;
											color: #999;
											border: 1px solid #d9d9d9;
										}
									}
								}
							}
						}
					}
					
					.card-actions {
						display: flex;
						align-items: center;
						justify-content: flex-end;
						padding-top: 16rpx;
						border-top: 2rpx solid #f0f0f0;
						
						.action-btns {
							display: flex;
							align-items: center;
							gap: 12rpx;
							
							.action-btn {
								width: 64rpx;
								height: 64rpx;
								display: flex;
								align-items: center;
								justify-content: center;
								border-radius: 50%;
								transition: all 0.2s;
								
								&.edit {
									background-color: #e6f4ff;
									
									&:active {
										background-color: #bae0ff;
									}
								}
								
								&.delete {
									background-color: #fff2f0;
									
									&:active {
										background-color: #ffccc7;
									}
								}
							}
						}
					}
				}
			}
			

			
			&.ordinal-mode {
				.ordinal-list {
					width: 100%;
					height: auto;
					position: relative;
					
					.ordinal-header {
						display: flex;
						flex-direction: column;
						justify-content: center;
						padding: 16rpx;
						margin-bottom: 16rpx;
						border-bottom: 1px solid #eee;
						position: sticky;
						top: 0;
						z-index: 9;
						background-color: #fff;
						
						.ordinal-title {
							font-size: 28rpx;
							color: $pyq-text-color-body;
							margin-bottom: 16rpx;
							text-align: center;
						}
						
						.ordinal-actions {
							display: flex;
							justify-content: space-between;
							gap: 16rpx;
							
							.btn {
								margin: 0;
								padding: 0;
								height: 70rpx;
								line-height: 70rpx;
								flex: 1;
								font-size: 28rpx;
								border-radius: 35rpx;
							}
							
							.cancel-btn {
								background-color: #f5f5f5;
								color: #666;
							}
							
							.save-btn {
								background-color: #399bfe;
								color: #fff;
							}
						}
					}
					
					.preview-header {
						padding: 12rpx 16rpx;
						background-color: #f7f9fc;
						margin-bottom: 10rpx;
						border-radius: 8rpx;
						
						.preview-title {
							font-size: 26rpx;
							color: #666;
							text-align: center;
						}
					}
					
					.ordinal-item {
						display: flex;
						align-items: center;
						justify-content: space-between;
						padding: 16rpx;
						border-bottom: 1px solid $pyq-border-color-translucent;
						
						&:nth-last-child(1) {
							border: none;
						}
						
						.name-container {
							display: flex;
							align-items: center;
							flex: 1;
							
							.cate-image {
								width: 60rpx;
								height: 60rpx;
								border-radius: 8rpx;
								margin-right: 16rpx;
								background-color: #f5f5f5;
								object-fit: cover;
								box-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.1);
								flex-shrink: 0;
							}
							
							.name {
								font-size: 28rpx;
								white-space: nowrap;
								overflow: hidden;
								text-overflow: ellipsis;
								
								&.hidden-category {
									color: #999;
								}
								
								.hidden-label,
								.visible-label {
									font-size: 24rpx;
									margin-left: 8rpx;
									white-space: nowrap;
								}
								
								.hidden-label {
									color: #999;
								}
								
								.visible-label {
									color: #399bfe;
								}
							}
						}
						
						.ordinal-controls {
							display: flex;
							align-items: center;
							
							.ordinal-btn {
								width: 70rpx;
								height: 70rpx;
								display: flex;
								align-items: center;
								justify-content: center;
								background-color: #f5f5f5;
								border-radius: 8rpx;
								
								&.decrease {
									margin-right: 8rpx;
									border: 1px solid #ddd;
								}
								
								&.increase {
									margin-left: 8rpx;
									background-color: #eef8ff;
									border: 1px solid #c0e0ff;
								}
								
								&:active {
									opacity: 0.8;
									transform: scale(0.95);
								}
							}
							
							.ordinal-input-wrapper {
								min-width: 80rpx;
								width: 80rpx;
								height: 70rpx;
								border: 1px solid #ddd;
								border-radius: 8rpx;
								display: flex;
								align-items: center;
								justify-content: center;
								background-color: #fcfcfc;
								
								.ordinal-input {
									width: 100%;
									height: 100%;
									border: none;
									outline: none;
									text-align: center;
									font-size: 28rpx;
									background-color: transparent;
									color: #399bfe;
								}
							}
						}
					}
				}
			}
		}
</style>