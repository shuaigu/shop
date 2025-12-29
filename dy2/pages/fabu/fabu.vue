<script setup>
	import { ref, onMounted, nextTick } from 'vue'
	import { useUserInfoStore } from '@/store/user.js'

	// Store & API
	const userStore = useUserInfoStore( )
	const articleApi = uniCloud.importObject( 'articleDy', { customUI: true })
	const extStorageCo = uniCloud.importObject('fabuWx', { customUI: true })
	// 页面初始数据
	const articleData = ref( null )
	const categoryList = ref( [ ] )
	const cateIndex = ref( 0 )
	const imageList = ref([])
	const uploadingCount = ref(0)
	const locationInfo = ref( null )
	const content = ref( '' )
	const selectedCategory = ref( null )
	const videoInfo = ref(null)
	const textareaFocus = ref(false)
	const contentTextarea = ref(null)
	const payAmount = ref(0)
	const videoLink = ref('')
	const inputHeight = ref(170)
	const selectionStart = ref(0)
	const selectionEnd = ref(0)

	// 图标生成相关
	const iconCustomizing = ref(false)
	const textOffsetX = ref(0)  // 文字X轴偏移量
	const textOffsetY = ref(0)  // 文字Y轴偏移量
	const textSize = ref(100)   // 文字大小百分比
	const previewImageUrl = ref('') // 预览图URL

	// 当前正在编辑的分类
	let currentEditingCategory = null;

	// 获取位置和分类
	const getLocaAndCate = async ( ) => {
		try {
			// 显示加载提示
			uni.showLoading({
				title: '加载中...',
				mask: false
			})
			
			// 获取位置信息
			let locationRes = await uni.getLocation({
				type: 'gcj02'
			}).catch(err => {
				console.error('获取位置失败:', err)
				// 如果获取位置失败，使用默认坐标
				return { longitude: 116.397428, latitude: 39.90923 }
			})
			
			// 调用API获取分类和地址信息
			const res = await articleApi.addReady(`${locationRes.longitude},${locationRes.latitude}`)
			console.log('获取分类和地址信息成功:', res)
			
			// 设置位置信息
			locationInfo.value = {
				address: res.address || '未知地址',
				district: res.district || '未知区域'
			}
			
			// 如果获取到了区域信息，则尝试根据区域创建或获取分类
			if (res.district && res.district !== '未知区域') {
				try {
					// 调用云函数创建或获取基于区域的分类
					const categoryResult = await extStorageCo.processCategoryFromDistrict(res.district)
					console.log('区域分类处理结果:', categoryResult)
					
					// 如果成功创建或获取了基于位置的分类，重新获取分类列表
					if (categoryResult.code === 0 && categoryResult.data) {
						// 重新获取最新的分类列表
						const updatedCateRes = await articleApi.addReady(`${locationRes.longitude},${locationRes.latitude}`)
						if (updatedCateRes.cateList && updatedCateRes.cateList.length > 0) {
							res.cateList = updatedCateRes.cateList
						}
					}
				} catch (categoryError) {
					console.error('处理区域分类失败:', categoryError)
					// 继续使用原有分类列表，不中断流程
				}
			}
			
			// 设置分类列表 - 只保留当前位置的分类
			if (res.cateList && res.cateList.length > 0) {
				// 筛选出当前区域的位置分类
				const locationBasedCategories = res.cateList.filter(cate => 
					cate.is_location_based && cate.location_district === res.district
				)
				
				// 如果有本地区分类，则只显示它们
				if (locationBasedCategories.length > 0) {
					categoryList.value = locationBasedCategories.map(cate => {
						return {
							...cate,
							icon: cate.cate_img || getDefaultCategoryIcon(cate.cate_name)
						}
					})
					
					// 选择第一个位置分类
					selectedCategory.value = categoryList.value[0]._id
					cateIndex.value = 0
					
					// 自动为位置分类生成图标（如果需要）
					const firstCategory = categoryList.value[0]
					if (!firstCategory.cate_img || firstCategory.cate_img.includes('default')) {
						try {
							console.log('为位置分类自动生成图标:', firstCategory.cate_name)
							const iconResult = await generateCategoryIcon(firstCategory.cate_name, firstCategory._id)
							if (iconResult && iconResult.iconURL) {
								// 更新UI中的图标
								firstCategory.icon = iconResult.iconURL
								// 确保分类列表中的图标也被更新
								categoryList.value[0].icon = iconResult.iconURL
								categoryList.value[0].cate_img = iconResult.iconURL
							}
						} catch (iconError) {
							console.error('自动生成位置分类图标失败:', iconError)
						}
					}
				} else {
					// 如果没有位置分类，尝试创建一个
					try {
						if (res.district && res.district !== '未知区域') {
							// 创建当前位置的分类
							const createResult = await extStorageCo.createLocationCategory({
								district: res.district,
								address: res.address
							})
							
							if (createResult && createResult.categoryId) {
								// 创建成功，添加到分类列表
								const newCategory = {
									_id: createResult.categoryId,
									cate_name: res.district,
									is_location_based: true,
									location_district: res.district,
									icon: getDefaultCategoryIcon(res.district)
								}
								
								categoryList.value = [newCategory]
								selectedCategory.value = newCategory._id
								cateIndex.value = 0
								
								// 为新分类生成图标
								handleGenerateIcon(newCategory)
							} else {
								// 创建失败，使用默认分类
								setDefaultCategory()
							}
						} else {
							// 没有位置信息，使用默认分类
							setDefaultCategory()
						}
					} catch (e) {
						console.error('创建位置分类失败:', e)
						setDefaultCategory()
					}
				}
			} else {
				console.warn('未获取到分类列表或分类列表为空')
				setDefaultCategory()
			}
		} catch (error) {
			console.error('获取位置和分类失败:', error)
			uni.showToast({
				title: '获取分类失败，请重试',
				icon: 'none',
				duration: 2000
			})
			
			// 设置默认值
			locationInfo.value = {
				address: '未知地址',
				district: '未知区域'
			}
			setDefaultCategory()
		} finally {
			uni.hideLoading()
		}
	}
	
	// 设置默认分类的辅助函数
	const setDefaultCategory = () => {
		categoryList.value = [{ 
			_id: 'default', 
			cate_name: '默认分类',
			icon: '/static/images/category/default.png'
		}]
		selectedCategory.value = 'default'
		cateIndex.value = 0
	}

	// 根据分类名称获取默认图标
	const getDefaultCategoryIcon = (cateName) => {
		// 定义常见分类的默认图标映射
		const iconMap = {
			'宠物用品': '/static/images/category/pet.png',
			'水杯餐具': '/static/images/category/tableware.png',
			'日用百货': '/static/images/category/daily.png',
			'清洁工具': '/static/images/category/cleaning.png',
			'收纳整理': '/static/images/category/storage.png',
			'文具教具': '/static/images/category/stationery.png',
			'畜牧农资': '/static/images/category/agriculture.png',
			'纸品湿巾': '/static/images/category/tissue.png',
			'个人护理': '/static/images/category/personal.png',
			'厨房烹饪': '/static/images/category/kitchen.png',
			'节庆礼品': '/static/images/category/gift.png',
			'图书乐器': '/static/images/category/book.png',
			'家庭清洁': '/static/images/category/home.png',
			'花卉园艺': '/static/images/category/garden.png',
			'锅具水壶': '/static/images/category/pot.png'
		}
		
		// 返回对应的图标，如果没有匹配项则返回默认图标
		return iconMap[cateName] || '/static/images/default.png' // 使用schema中定义的默认图片路径
	}

	// 修改图片选择和上传方法
	const chooseAndUploadImage = async () => {
		try {
			// 移除图片数量限制检查
			// 选择图片，设置 sizeType 只包含 original 来选择原图
			const chooseRes = await uni.chooseImage({
				count: 9, // 保留此参数但不再做前置检查
				sizeType: ['original'], // 只使用原图
				sourceType: ['album', 'camera'],
				mediaType: ['image'] // 只选择图片，隐藏视频
			})

			// 上传所有选中的图片
			const uploadPromises = chooseRes.tempFilePaths.map(async (filePath, index) => {
				// 创建临时图片对象并添加到预览列表
				const newIndex = imageList.value.length
				imageList.value.push({
					fileURL: '',
					thumbnailURL: filePath,
					progress: 0
				})
				
				try {
					// 获取上传配置
					const uploadOptions = await extStorageCo.getUploadFileOptions({
						cloudPath: `images/${userStore.userInfo.uid}/${Date.now()}-${newIndex}.jpg`,
						fileType: 'image',
						isOriginal: true
					})
					
					// 创建备用进度定时器（如果onProgressUpdate不工作）
					let fallbackTimer = null;
					let fallbackActive = true;
					
					// 启动备用进度动画 - 仅当实际进度回调未工作时使用
					fallbackTimer = setTimeout(function setupFallback() {
						if (!fallbackActive) return;
						
						// 获取当前进度
						const currentProgress = imageList.value[newIndex]?.progress || 0;
						if (currentProgress >= 98) {
							fallbackActive = false;
							return;
						}
						
						// 计算下一个进度值 - 缓慢上升，避免超过实际进度过多
						let nextProgress;
						if (currentProgress < 30) {
							nextProgress = currentProgress + 5;
						} else if (currentProgress < 70) {
							nextProgress = currentProgress + 3;
						} else if (currentProgress < 90) {
							nextProgress = currentProgress + 1;
						} else {
							nextProgress = currentProgress + 0.5;
						}
						
						// 更新进度，最大98%
						imageList.value[newIndex].progress = Math.min(98, nextProgress);
						
						// 继续下一个更新
						fallbackTimer = setTimeout(setupFallback, 800);
					}, 500);
					
					// 执行上传
					return new Promise((resolve, reject) => {
						const uploadTask = uni.uploadFile({
							...uploadOptions.uploadFileOptions,
							filePath: filePath,
							success: () => {
								// 取消备用定时器
								fallbackActive = false;
								clearTimeout(fallbackTimer);
								
								// 更新上传成功后的文件信息
								imageList.value[newIndex].progress = 100;
								imageList.value[newIndex].fileURL = uploadOptions.fileURL;
								imageList.value[newIndex].compressedURL = uploadOptions.compressedURL;
								imageList.value[newIndex].thumbnailURL = uploadOptions.thumbnailURL;
								resolve(true);
							},
							fail: (err) => {
								// 取消备用定时器
								fallbackActive = false;
								clearTimeout(fallbackTimer);
								
								console.error("上传失败", err);
								imageList.value.splice(newIndex, 1);
								reject(err);
							}
						});
						
						// 尝试使用实际上传进度更新（如果平台支持）
						try {
							uploadTask.onProgressUpdate((res) => {
								if (res && typeof res.progress === 'number') {
									// 收到实际进度，停用备用进度
									fallbackActive = false;
									clearTimeout(fallbackTimer);
									
									// 更新实际进度，最大99%（保留1%给服务器处理阶段）
									const actualProgress = Math.min(99, res.progress);
									imageList.value[newIndex].progress = actualProgress;
								}
							});
						} catch (progressErr) {
							console.log('进度更新回调不可用，使用备用进度显示', progressErr);
							// 继续使用备用进度定时器
						}
					});
				} catch (err) {
					// 处理单个图片上传错误
					imageList.value.splice(newIndex, 1);
					console.error('上传图片错误:', err);
					return Promise.reject(err);
				}
			});
			
			// 等待所有上传完成
			await Promise.all(uploadPromises);
		} catch (err) {
			// 仅在出错时显示提示
			uni.showToast({
				title: '上传失败',
				icon: 'none'
			});
			console.error('图片上传过程错误:', err);
		}
	}

	// 删除图片方法
	const deleteImage = (index) => {
		imageList.value.splice(index, 1)
	}

	// 修改视频选择方法，改为填写链接
	const validateVideoLink = () => {
		if (!videoLink.value.trim()) {
			uni.showToast({
				title: '请输入视频链接',
				icon: 'none',
				duration: 2000
			})
			return false
		}
		
		// 验证链接长度不超过500个字符
		if (videoLink.value.trim().length > 5000) {
			uni.showToast({
				title: '视频链接过长，请不要超过500个字符',
				icon: 'none',
				duration: 2000
			})
			return false
		}
		
		// 简单验证链接格式
		const urlPattern = /^(https?:\/\/)?([\w-]+\.)+[\w-]+(\/[\w- ./?%&=]*)?$/;
		if (!urlPattern.test(videoLink.value.trim())) {
			uni.showToast({
				title: '请输入有效的视频链接',
				icon: 'none',
				duration: 2000
			})
			return false
		}
		
		return true
	}

	// 添加视频链接
	const addVideoLink = () => {
		if (!validateVideoLink()) return
		
		// 如果已有视频，不允许再次添加
		if (videoInfo.value) {
			uni.showToast({
				title: '只能添加一个视频',
				icon: 'none',
				duration: 2000
			})
			return
		}
		
		// 设置视频链接
		videoInfo.value = videoLink.value.trim()
		
		// 清空输入框
		videoLink.value = ''
		
		uni.showToast({
			title: '视频链接已添加',
			icon: 'success',
			duration: 1500
		})
	}

	// 添加删除视频的方法
	const deleteVideo = () => {
		videoInfo.value = null
	}

	// 修改提交表单方法
	const submitForm = async () => {
		if (!content.value.trim()) {
			uni.showToast({
				title: '请输入内容',
				icon: 'none'
			})
			return
		}

		if (!selectedCategory.value) {
			uni.showToast({
				title: '请选择分类',
				icon: 'none'
			})
			// 如果没有分类，尝试重新获取
			if (!categoryList.value.length || categoryList.value[0]._id === 'default') {
				uni.showModal({
					title: '提示',
					content: '未能获取到分类信息，是否重新获取？',
					success: (res) => {
						if (res.confirm) {
							retryGetCategories()
						}
					}
				})
			}
			return
		}

		if (!locationInfo.value || !locationInfo.value.address) {
			uni.showToast({
				title: '未能获取位置信息',
				icon: 'none'
			})
			return
		}

		uni.showLoading({
			title: '发布中...',
			mask: false
		})

		try {
			// 获取所有已上传完成的图片URL
			const uploadedImages = imageList.value
				.filter(img => img.fileURL && img.progress === 100)
				.map(img => ({
					url: img.fileURL,
					compressedURL: img.compressedURL,
					thumbnailURL: img.thumbnailURL
				}))

			// 直接使用videoURL字段
			const videoURL = videoInfo.value || null
			
			// 获取选中的分类信息
			const selectedCategoryInfo = categoryList.value.find(cate => cate._id === selectedCategory.value) || null
			// 检查是否是基于位置的分类
			const isLocationBasedCategory = selectedCategoryInfo && selectedCategoryInfo.is_location_based === true

			const params = {
				user_id: userStore.userInfo.uid,
				content: content.value.trim(),
				images: uploadedImages,
				videoURL: videoURL,
				cate_id: selectedCategory.value,
				address: locationInfo.value.address || '未知地址',
				district: locationInfo.value.district || '未知区域',
				user_nickName: userStore.userInfo.nickName,
				user_avatarUrl: userStore.userInfo.avatarUrl,
				user_mobile: userStore.userInfo.mobile,
				pay_amount: payAmount.value || 0, // 确保即使没有选择支付金额也能发布，默认为0
				is_location_based_category: isLocationBasedCategory, // 添加标识，指示是否使用位置分类
				category_info: selectedCategoryInfo ? {
					name: selectedCategoryInfo.cate_name,
					is_location_based: selectedCategoryInfo.is_location_based || false,
					location_district: selectedCategoryInfo.location_district || null,
					icon: selectedCategoryInfo.icon || null,
					cate_img: selectedCategoryInfo.cate_img || selectedCategoryInfo.icon || null
				} : null // 添加更多分类相关信息，包括图标URL
			}

			// 修改发布数据的打印部分
			console.log('发布数据:', {
				基础信息: {
					用户ID: params.user_id,
					文章内容: params.content,
					分类ID: params.cate_id,
					分类信息: params.category_info,
					是否位置分类: params.is_location_based_category
				},
				用户信息: {
					昵称: params.user_nickName,
					头像: params.user_avatarUrl,
					手机: params.user_mobile
				},
				位置信息: {
					完整地址: params.address,
					所在区域: params.district
				},
				图片信息: params.images.map((img, index) => ({
					序号: index + 1,
					原图URL: img.url,
					压缩图URL: img.compressedURL,
					缩略图URL: img.thumbnailURL
				})),
				视频信息: params.videoURL ? params.videoURL : '无视频'
			})

			const res = await articleApi.addArticle(params)
			if (res.id) {
				uni.showToast({
					title: '发布成功',
					icon: 'success'
				})
				
				
				
				// 添加延迟，确保事件被处理
				uni.showToast({
					title: '发布成功',
					icon: 'success',
					duration: 1500,
					success: () => {
						setTimeout(() => {
							uni.navigateBack({
								delta: 1,
								success: () => {
									uni.$emit('globalRefresh', { 
										timestamp: Date.now(),
										pages: ['index', 'userArticleList']
									});
									console.log('触发全局刷新事件');
								}
							});
						}, 1500);
					}
				})
			} else {
				throw new Error(res.message || '发布失败')
			}
		} catch (err) {
			console.error('发布失败:', err)
			uni.showToast({
				title: err.message || '发布失败，请重试',
				icon: 'none'
			})
		} finally {
			uni.hideLoading()
		}
	}

	// 选择分类
	const bindPickerChange = ( e ) => {
		console.log( e, '分类' )
		cateIndex.value = e.detail.value
		selectedCategory.value = categoryList.value[ e.detail.value ]._id
	}

	// 直接选择分类
	const selectCategory = (index) => {
		cateIndex.value = index
		selectedCategory.value = categoryList.value[index]._id
		console.log('选择分类:', categoryList.value[index].cate_name)
	}

	// 使用 uni-app API 控制键盘
	const focusTextarea = () => {
		// 使用 uni.hideKeyboard 和 uni.showKeyboard 来控制键盘
		uni.hideKeyboard()
		
		setTimeout(() => {
			// 延迟显示键盘，避免闪烁
			textareaFocus.value = true
			
			// 如果平台支持，可以直接调用 showKeyboard
			// uni.showKeyboard()
		}, 50)
	}

	// 选择支付金额
	const onSelectPayAmount = (e) => {
		payAmount.value = e.target.dataset.amount
	}

	// 生成分类图标
	const handleGenerateIcon = async (category) => {
		try {
			uni.showLoading({
				title: '生成图标中...',
				mask: false
			})
			
			// 生成临时图标
			const tempResult = await generateTempCategoryIcon(category.cate_name)
			if (tempResult && tempResult.tempFilePath) {
				// 直接上传和保存图标，跳过自定义调整面板
				currentEditingCategory = category
				previewImageUrl.value = tempResult.tempFilePath
				
				// 直接保存图标
				await saveCustomIcon()
			} else {
				throw new Error('生成临时图标失败')
			}
		} catch (error) {
			console.error('生成图标失败:', error)
			uni.showToast({
				title: '生成图标失败',
				icon: 'none'
			})
		} finally {
			uni.hideLoading()
		}
	}
	
	// 生成临时预览图标
	const generateTempCategoryIcon = async (categoryName) => {
		try {
			// 显示加载中提示
			uni.showLoading({
				title: '生成预览中...',
				mask: false
			})
			
			// 1. 根据分类名称生成背景色和前景色（保持原有代码）
			const getColorFromName = (name) => {
				// 简单哈希算法生成颜色
				let hash = 0;
				for (let i = 0; i < name.length; i++) {
					hash = name.charCodeAt(i) + ((hash << 5) - hash);
				}
				
				// 生成柔和的背景色 - 使用HSL颜色模型，保持较高亮度和低饱和度
				const h = Math.abs(hash) % 360; // 色相
				const s = 40 + (Math.abs(hash) % 30); // 饱和度 40-70%
				const l = 75 + (Math.abs(hash) % 15); // 亮度 75-90%
				
				// 前景色 - 根据背景色明暗程度选择黑或白文本
				const foregroundColor = l > 65 ? '#333333' : '#FFFFFF';
				
				return {
					background: `hsl(${h}, ${s}%, ${l}%)`,
					foreground: foregroundColor
				};
			}
			
			// 2. 创建Canvas绘制图标
			const colors = getColorFromName(categoryName);
			const canvasSize = 200; // 画布大小
			const iconSize = canvasSize;
			
			// 创建离屏Canvas (App和小程序)
			const canvas = uni.createOffscreenCanvas({
				type: '2d',
				width: iconSize, 
				height: iconSize
			})
			const ctx = canvas.getContext('2d');
			
			// 绘制背景
			ctx.fillStyle = colors.background;
			ctx.fillRect(0, 0, iconSize, iconSize);
			
			// 绘制边框
			ctx.strokeStyle = 'rgba(0,0,0,0.1)';
			ctx.lineWidth = 2;
			ctx.strokeRect(2, 2, iconSize-4, iconSize-4);
			
			// 绘制文字 - 应用当前偏移和大小设置
			const firstChar = categoryName.charAt(0);
			ctx.fillStyle = colors.foreground;
			const fontSize = iconSize/2 * (textSize.value / 100);
			ctx.font = `bold ${fontSize}px sans-serif`;
			ctx.textAlign = 'center';
			ctx.textBaseline = 'middle';
			
			// 应用偏移量，默认位置是中心点(iconSize/2, iconSize/2)
			const textX = iconSize/2 + (textOffsetX.value * iconSize / 100);
			const textY = iconSize/2 + (textOffsetY.value * iconSize / 100);
			ctx.fillText(firstChar, textX, textY);
			
			// 3. 将Canvas转为临时图片
			const tempFilePath = await new Promise((resolve, reject) => {
				// 导出图片
				const buffer = canvas.toDataURL('image/png')
				
				// 将Base64转为本地临时文件
				const fs = uni.getFileSystemManager();
				const tempFilePath = `${uni.env.USER_DATA_PATH}/temp_category_icon_${Date.now()}.png`;
				
				// 保存Base64为临时文件
				const base64Data = buffer.replace(/^data:image\/\w+;base64,/, '');
				fs.writeFile({
					filePath: tempFilePath,
					data: base64Data,
					encoding: 'base64',
					success: () => resolve(tempFilePath),
					fail: (err) => reject(new Error(`保存临时文件失败: ${JSON.stringify(err)}`))
				});
			});
			
			uni.hideLoading();
			
			// 返回临时文件路径和颜色信息
			return { 
				tempFilePath,
				colors
			};
			
		} catch (error) {
			uni.hideLoading();
			console.error('生成临时图标失败:', error);
			return null;
		}
	}

	// 添加重试获取分类的方法
	const retryGetCategories = () => {
		uni.showToast({
			title: '正在重新获取分类...',
			icon: 'loading',
			duration: 2000
		})
		setTimeout(() => {
			getLocaAndCate()
		}, 1000)
	}

	// 组件加载时获取位置
	onMounted(() => {
		getLocaAndCate().catch(err => {
			console.error('onMounted获取分类失败:', err)
			uni.showModal({
				title: '提示',
				content: '获取分类失败，是否重试？',
				success: (res) => {
					if (res.confirm) {
						retryGetCategories()
					}
				}
			})
		})
	})

	// 添加创建新分类图标的方法
	const createNewCategoryIcon = () => {
		if (categoryList.value.length === 0) {
			uni.showToast({
				title: '没有可用分类',
				icon: 'none',
				duration: 2000
			})
			return
		}
		
		// 如果已选择分类，为该分类生成图标
		if (categoryList.value[cateIndex.value]) {
			handleGenerateIcon(categoryList.value[cateIndex.value])
		} else {
			uni.showToast({
				title: '请先选择一个分类',
				icon: 'none',
				duration: 2000
			})
		}
	}

	// 检查URL是否有效图片URL
	const isValidImageUrl = (url) => {
		// 如果URL为空或为空字符串，不是有效URL
		if (!url || url.trim() === '') return false;
		
		// 检查是否是默认图片
		if (url.includes('defalut.png')) return false;
		
		// 检查是否是本地静态资源路径（非有效的远程URL）
		if (url.startsWith('/static/')) return false;
		
		try {
			// 尝试解析URL，检查是否有效
			const parsedUrl = new URL(url);
			// 检查是否是HTTP/HTTPS协议
			return parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:';
		} catch (e) {
			// 解析失败，不是有效URL
			return false;
		}
	}

	// 处理文本框行数变化
	const handleLineChange = (e) => {
		// 获取当前行数
		const lineCount = e.detail.lineCount || 0;
		
		// 根据行数动态调整高度，最小高度170rpx
		inputHeight.value = Math.max(170, lineCount * 40);
		
		// 确保视图滚动到合适位置，防止键盘遮挡输入内容
		adjustScrollPosition();
	}
	
	// 启用光标拖动模式
	const enableCursorDrag = (e) => {
		// 长按后启用光标拖动模式，通过selectionStart和selectionEnd来控制光标位置
		// 这个功能在各平台实现可能有所不同
		console.log('启用光标拖动模式');
		
		try {
			// 尝试调用系统的文本选择功能
			if (contentTextarea.value) {
				// 保持焦点
				textareaFocus.value = true;
				
				// 一些平台可能需要特定的API来触发光标拖动
				// 以下是一种通用方法
				setTimeout(() => {
					// 触发系统光标选择UI
					uni.showActionSheet({
						itemList: ['选择', '全选', '复制', '粘贴'],
						success: (res) => {
							switch(res.tapIndex) {
								case 0: // 选择
									// 已经在长按时触发了选择模式
									break;
								case 1: // 全选
									selectionStart.value = 0;
									selectionEnd.value = content.value.length;
									break;
								case 2: // 复制
									uni.setClipboardData({
										data: content.value.substring(selectionStart.value, selectionEnd.value),
										success: () => {
											uni.showToast({
												title: '已复制',
												icon: 'success',
												duration: 1500
											});
										}
									});
									break;
								case 3: // 粘贴
									uni.getClipboardData({
										success: (res) => {
											if (res.data) {
												insertTextAtCursor(res.data);
												uni.showToast({
													title: '已粘贴',
													icon: 'success',
													duration: 1500
												});
											}
										}
									});
									break;
							}
						}
					});
				}, 200);
			}
		} catch (error) {
			console.error('启用光标拖动失败:', error);
		}
	}

	// 更新图标预览
	const updateIconPreview = async () => {
		if (!currentEditingCategory) return;
		
		try {
			const tempResult = await generateTempCategoryIcon(currentEditingCategory.cate_name);
			if (tempResult && tempResult.tempFilePath) {
				previewImageUrl.value = tempResult.tempFilePath;
			}
		} catch (error) {
			console.error('更新预览失败:', error);
		}
	}
	
	// 保存自定义图标
	const saveCustomIcon = async () => {
		if (!currentEditingCategory || !previewImageUrl.value) {
			uni.showToast({
				title: '没有可保存的图标',
				icon: 'none'
			});
			return;
		}
		
		try {
			uni.showLoading({
				title: '保存中...',
				mask: false
			});
			
			// 上传到云存储
			const uploadResult = await extStorageCo.getUploadFileOptions({
				cloudPath: `categories/${currentEditingCategory._id || Date.now()}.png`,
				fileType: 'image',
				isOriginal: true
			});
			
			// 执行上传
			const uploadRes = await uni.uploadFile({
				...uploadResult.uploadFileOptions,
				filePath: previewImageUrl.value,
				name: 'file'
			});
			
			if (uploadRes.statusCode !== 200) {
				throw new Error(`上传失败: ${uploadRes.statusCode}`);
			}
			
			// 获取图片URL
			const iconURL = uploadResult.fileURL;
			const thumbnailURL = uploadResult.thumbnailURL;
			
			// 更新数据库中的分类图标URL
			if (currentEditingCategory._id) {
				try {
					// 尝试调用云函数更新图标
					const updateResult = await extStorageCo.updateCategoryIcon({
						categoryId: currentEditingCategory._id, 
						iconURL,
						thumbnailURL
					}).catch(err => {
						console.warn('云函数updateCategoryIcon可能未部署或不可用:', err);
						return { updated: false, error: err.message };
					});
					
					// 如果云函数调用成功
					if (updateResult && updateResult.updated) {
						console.log('更新分类图标结果:', updateResult);
						
						// 更新本地分类图标
						currentEditingCategory.icon = iconURL;
						currentEditingCategory.cate_img = iconURL;
						currentEditingCategory.cate_img_thumbnail = thumbnailURL;
						
						// 关闭自定义面板
						iconCustomizing.value = false;
						
						uni.showToast({
							title: '图标保存成功',
							icon: 'success'
						});
					} else {
						// 云函数未能正确执行，但我们仍然更新本地图标
						console.warn('更新分类图标未成功，但图标已生成:', {iconURL, thumbnailURL});
						
						// 更新本地分类图标
						currentEditingCategory.icon = iconURL;
						currentEditingCategory.cate_img = iconURL;
						currentEditingCategory.cate_img_thumbnail = thumbnailURL;
						
						// 关闭自定义面板
						iconCustomizing.value = false;
						
						uni.showToast({
							title: '图标已生成',
							icon: 'success'
						});
					}
				} catch (updateError) {
					// 更新数据库失败，但图标已上传成功
					console.error('更新分类图标数据库记录失败:', updateError);
					
					// 更新本地分类图标
					currentEditingCategory.icon = iconURL;
					currentEditingCategory.cate_img = iconURL;
					currentEditingCategory.cate_img_thumbnail = thumbnailURL;
					
					// 关闭自定义面板
					iconCustomizing.value = false;
					
					uni.showToast({
						title: '图标已生成，但未更新数据库',
						icon: 'none'
					});
				}
			}
		} catch (error) {
			console.error('保存图标失败:', error);
			uni.showToast({
				title: '保存图标失败',
				icon: 'none'
			});
		} finally {
			uni.hideLoading();
		}
	}
	
	// 取消自定义
	const cancelCustomize = () => {
		iconCustomizing.value = false;
		currentEditingCategory = null;
		previewImageUrl.value = '';
	}

	// 调整滚动位置
	const adjustScrollPosition = () => {
		nextTick(() => {
			// 计算合适的滚动位置
			const screenHeight = uni.getWindowInfo().windowHeight;
			const targetPosition = inputHeight.value + 200; // 额外偏移量确保视图在键盘上方
			
			uni.pageScrollTo({
				scrollTop: targetPosition,
				duration: 100
			});
		});
	}

	// 插入文本到光标位置
	const insertTextAtCursor = (textToInsert) => {
		if (!content.value) content.value = '';
		
		const before = content.value.substring(0, selectionStart.value);
		const after = content.value.substring(selectionEnd.value);
		
		// 更新内容
		content.value = before + textToInsert + after;
		
		// 更新光标位置
		nextTick(() => {
			const newPosition = selectionStart.value + textToInsert.length;
			selectionStart.value = newPosition;
			selectionEnd.value = newPosition;
			
			// 重新获取焦点
			if (contentTextarea.value) {
				textareaFocus.value = true;
			}
		});
	}
	
	// 添加一个保存光标位置的处理函数
	const handleSelectionChange = (e) => {
		// 获取当前选择范围
		selectionStart.value = e.detail.selectionStart || 0;
		selectionEnd.value = e.detail.selectionEnd || 0;
	}
</script>

<template>
	<view class="add">
		<!-- 分类选择 -->
		<view class="category">
			<text class="label">所属分类</text>
			
			<picker @change="bindPickerChange" :range="categoryList" :value="cateIndex"
				range-key="cate_name" v-if="false">
				<view class="picker">
					<text>
						{{categoryList[cateIndex]?.cate_name}}
					</text>
					<uni-icons type="bottom" size="14" color="#999999"></uni-icons>
				</view>
			</picker>
			
			<!-- 添加网格布局的分类选择 -->
			<view class="category-grid">
				<!-- 生成图标按钮，仅在当前选择的分类没有缩略图时显示 -->
				<view 
					v-if="categoryList.length > 0 && categoryList[cateIndex] && !categoryList[cateIndex].cate_img_thumbnail" 
					class="category-item generate-icon-item" 
					@click="createNewCategoryIcon"
				>
					<view class="category-icon">
						<uni-icons type="plus" size="30" color="#2196F3"></uni-icons>
					</view>
					<view class="category-name-container">
						<text class="category-name">生成图标</text>
					</view>
				</view>
				
				<view 
					v-for="(item, index) in categoryList" 
					:key="index" 
					class="category-item" 
					:class="{ 'active': index === cateIndex, 'location-based': item.is_location_based }"
					@click="selectCategory(index)"
				>
					<view class="category-icon">
						<!-- 使用分类图标 -->
						<image :src="item.icon" mode="aspectFit" class="category-image"></image>
						<!-- 选中状态指示器 -->
						<view class="selected-indicator" v-if="index === cateIndex">
							<uni-icons type="checkmarkempty" size="16" color="#fff"></uni-icons>
						</view>
					</view>
					<view class="category-name-container">
						
						<!-- 添加位置标记 -->
						<view class="location-badge" v-if="item.is_location_based">
							<uni-icons type="location" size="12" color="#2196F3"></uni-icons>
						</view>
						<text class="category-name">{{ item.cate_name }}</text>
					</view>
				</view>
			</view>
			
			<!-- 添加重试按钮 -->
			<view v-if="categoryList.length === 0 || categoryList[0]._id === 'default'" 
				  class="retry-btn" @click="retryGetCategories">
				<uni-icons type="refresh" size="16" color="#ff6600"></uni-icons>
				<text class="retry-text">重试</text>
			</view>
			
		</view>

		<!-- 简化为纯文本输入区域，移除工具栏和表情面板 -->
		<view class="content-area" :style="{ minHeight: inputHeight + 'rpx' }" @click="focusTextarea">
			<textarea 
				v-model="content" 
				placeholder="分享新鲜事..." 
				class="content-input" 
				maxlength="2000"
				auto-height
				show-confirm-bar="false"
				confirm-type="done"
				cursor-spacing="30"
				:focus="textareaFocus"
				ref="contentTextarea"
				@blur="textareaFocus = false"
				:fixed="false"
				:adjust-position="true"
				:show-count="true"
				:disable-default-padding="false"
				:hold-keyboard="true"
				:selection-start="selectionStart"
				:selection-end="selectionEnd"
				@confirm="() => {}"
				@linechange="handleLineChange"
				@input="handleLineChange"
				@selectionchange="handleSelectionChange"
				@longpress="enableCursorDrag"
			/>
		</view>

		<!-- 修改媒体上传区域 -->
		<view class="media-section">
			<!-- 图片上传区域 -->
			<view class="images">
				
				<view class="image-list">
					<view v-for="(image, index) in imageList" :key="index" class="image-item">
						<image :src="image.thumbnailURL" mode="aspectFill" />
						<view class="delete-btn" @click="deleteImage(index)">
							<uni-icons type="close" size="20" color="#fff"></uni-icons>
						</view>
						<view class="progress-overlay" v-if="image.progress < 100">
							<view class="progress-text">{{image.progress.toFixed(0)}}%</view>
							<view class="progress-bar">
								<view class="progress" :style="{width: image.progress + '%'}"></view>
							</view>
						</view>
					</view>
					<view class="upload-btn" @click="chooseAndUploadImage">
						<uni-icons type="plusempty" size="30" color="#999"></uni-icons>
					</view>
				</view>
				<text class="tip">可无限上传图片</text>
			</view>

			<!-- 视频链接区域 -->
			<view class="video">
				<view v-if="videoInfo" class="video-link-preview">
					<view class="link-container">
						<text class="link-text">{{videoInfo}}</text>
					</view>
					<view class="delete-btn" @click="deleteVideo">
						<uni-icons type="close" size="20" color="#fff"></uni-icons>
					</view>
				</view>
				<view v-else class="video-link-input">
					<view class="input-container">
						<input 
							v-model="videoLink" 
							type="text" 
							placeholder="视频链接无需添加https://" 
							class="link-input"
							confirm-type="done"
							maxlength="5000"
						/>
						<button class="add-link-btn" @click="addVideoLink">添加</button>
					</view>
				</view>
				<text class="tip">输入.mp4格式的链接，在详情页显示视频</text>
			</view>
		</view>

		<!-- 发布按钮 -->
		<view class="publish">
			<button class="publish-btn" @click="submitForm">发布</button>
		</view>

		<!-- 图标自定义面板 -->
		<view class="icon-customize-overlay" v-if="iconCustomizing">
			<view class="icon-customize-panel">
				<view class="icon-customize-header">
					<text class="panel-title">调整图标</text>
					<view class="close-btn" @click="cancelCustomize">
						<uni-icons type="close" size="20" color="#666"></uni-icons>
					</view>
				</view>
				
				<view class="icon-preview">
					<image :src="previewImageUrl" mode="aspectFit" class="preview-image"></image>
				</view>
				
				<view class="customize-controls">
					<!-- 文字X轴位置调整 -->
					<view class="control-item">
						<text class="control-label">水平位置</text>
						<slider 
							:value="textOffsetX + 50" 
							min="0" 
							max="100" 
							show-value 
							@change="(e) => { textOffsetX = e.detail.value - 50; updateIconPreview(); }"
						/>
					</view>
					
					<!-- 文字Y轴位置调整 -->
					<view class="control-item">
						<text class="control-label">垂直位置</text>
						<slider 
							:value="textOffsetY + 50" 
							min="0" 
							max="100" 
							show-value 
							@change="(e) => { textOffsetY = e.detail.value - 50; updateIconPreview(); }"
						/>
					</view>
					
					<!-- 文字大小调整 -->
					<view class="control-item">
						<text class="control-label">文字大小</text>
						<slider 
							:value="textSize" 
							min="50" 
							max="150" 
							show-value 
							@change="(e) => { textSize = e.detail.value; updateIconPreview(); }"
						/>
					</view>
				</view>
				
				<view class="customize-buttons">
					<button class="cancel-btn" @click="cancelCustomize">取消</button>
					<button class="save-btn" @click="saveCustomIcon">保存</button>
				</view>
			</view>
		</view>
	</view>
</template>

<style lang="scss" scoped>
	.add {
		min-height: 100vh;
		padding: 20rpx 30rpx;
		background-color: #fff;

		.category {
			display: flex;
			flex-direction: column;

			.label {
				font-size: 28rpx;
				color: $pyq-text-color-body;
				margin-bottom: 16rpx;
			}

			.picker {
				flex: 1;
				display: flex;
				align-items: center;
				justify-content: space-between;
				padding: 16rpx 24rpx;
				background-color: #f7f7f7;
				border-radius: 3rpx;
			}
			
			/* 分类网格布局样式 */
			.category-grid {
				display: flex;
				flex-wrap: wrap;
				margin: 0 -10rpx;
				padding: 10rpx 0;
			}
			
			.category-item {
				width: 20%; /* 每行5个 */
				padding: 10rpx;
				box-sizing: border-box;
				display: flex;
				flex-direction: column;
				align-items: center;
				margin-bottom: 20rpx;
				
				.category-icon {
					width: 100rpx;
					height: 100rpx;
					background-color: #f8f8f8;
					border-radius: 20rpx;
					display: flex;
					align-items: center;
					justify-content: center;
					margin-bottom: 10rpx;
					border: 2rpx solid transparent;
					transition: all 0.3s;
					position: relative;
					overflow: hidden;
					box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
					
					.category-image {
						width: 70%;
						height: 70%;
						object-fit: contain;
					}
					
					.selected-indicator {
						position: absolute;
						right: 0;
						bottom: 0;
						background-color: $pyq-vi-color;
						width: 36rpx;
						height: 36rpx;
						display: flex;
						align-items: center;
						justify-content: center;
						border-top-left-radius: 12rpx;
					}
				}
				
				.category-name-container {
					display: flex;
					align-items: center;
					justify-content: center;
					flex-wrap: wrap;
					gap: 4rpx;
					
					.category-name {
						font-size: 24rpx;
						color: #666;
						text-align: center;
						line-height: 1.2;
						height: 2.4em;
						display: flex;
						align-items: center;
						justify-content: center;
					}
					
					.location-badge {
						margin-left: 4rpx;
						display: flex;
						align-items: center;
						justify-content: center;
						
						.uni-icons {
							width: 16rpx;
							height: 16rpx;
						}
					}
				}
				
				&.active {
					.category-icon {
						background-color: rgba(255, 102, 0, 0.08);
						border-color: $pyq-vi-color;
						box-shadow: 0 6rpx 16rpx rgba(255, 102, 0, 0.25);
						transform: translateY(-4rpx);
					}
					
					.category-name {
						color: $pyq-vi-color;
						font-weight: bold;
					}
				}
				
				&.location-based {
					.category-icon {
						background-color: rgba(33, 150, 243, 0.05);
						border: 2rpx dashed #2196F3;
					}
					
					.category-name {
						color: #2196F3;
					}
					
					&.active {
						.category-icon {
							background-color: rgba(33, 150, 243, 0.1);
							border: 2rpx solid #2196F3;
							box-shadow: 0 6rpx 16rpx rgba(33, 150, 243, 0.25);
							transform: translateY(-4rpx);
						}
						
						.category-name {
							color: #2196F3;
							font-weight: bold;
						}
					}
				}
				
				&.generate-icon-item {
					.category-icon {
						background-color: rgba(33, 150, 243, 0.05);
						border: 2rpx dashed #2196F3;
						
						&:active {
							background-color: rgba(33, 150, 243, 0.2);
						}
					}
					
					.category-name {
						color: #2196F3;
						font-weight: bold;
					}
					
					&:active {
						opacity: 0.7;
						transform: scale(0.95);
					}
				}
			}
			
		}

		.content-area {
			margin-bottom: 20rpx;
			border: 1px solid #e0e0e0;
			border-radius: 5rpx;
			background-color: #f5f5f5;
			min-height: 170rpx;
			padding: 0;
			box-sizing: border-box;
			
			.content-input {
				width: 100%;
				min-height: 170rpx;
				font-size: 28rpx;
				line-height: 1.5;
				color: #333;
				padding: 16rpx;
				background-color: transparent;
				border: none;
				box-sizing: border-box;
				word-break: break-word;
				white-space: pre-wrap;
				overflow-wrap: break-word;
				text-align: left;
			}
		}

		.media-section {
			margin-bottom: 32rpx;
		}

		.images {
			margin-bottom: 32rpx;

			.upload-notice {
				display: flex;
				align-items: center;
				background-color: rgba(33, 150, 243, 0.08);
				padding: 12rpx 16rpx;
				border-radius: 8rpx;
				margin-bottom: 16rpx;
				
				text {
					font-size: 24rpx;
					color: #2196F3;
					margin-left: 8rpx;
				}
			}

			.tip {
				display: block;
				margin-top: 16rpx;
				font-size: 24rpx;
				color: $pyq-text-color-helper;
			}
		}

		.video {
			.video-link-preview {
				position: relative;
				width: 100%;
				padding: 20rpx;
				margin-bottom: 16rpx;
				background-color: #f7f7f7;
				border-radius: 8rpx;
				overflow: hidden;

				.link-container {
					padding-right: 60rpx; // 为删除按钮留出空间
					word-break: break-all;
				}

				.link-text {
					font-size: 28rpx;
					color: #333;
					line-height: 1.5;
				}

				.delete-btn {
					position: absolute;
					top: 15rpx;
					right: 15rpx;
					background: rgba(255, 0, 0, 0.7);
					border-radius: 50%;
					padding: 8rpx;
					z-index: 10;
					width: 40rpx;
					height: 40rpx;
					display: flex;
					align-items: center;
					justify-content: center;
				}
			}

			.video-link-input {
				width: 100%;
				margin-bottom: 16rpx;
				
				.input-container {
					display: flex;
					align-items: center;
					background-color: #f7f7f7;
					border-radius: 8rpx;
					padding: 10rpx;
					
					.link-input {
						flex: 1;
						height: 70rpx;
						font-size: 28rpx;
						padding: 0 20rpx;
					}
					
					.add-link-btn {
						width: 120rpx;
						height: 70rpx;
						line-height: 70rpx;
						font-size: 28rpx;
						color: #fff;
						background-color: $pyq-vi-color;
						border-radius: 8rpx;
						margin: 0;
						padding: 0;
					}
				}
			}

			.tip {
				display: block;
				font-size: 24rpx;
				color: $pyq-text-color-helper;
			}
		}

		.publish {
			.publish-btn {
				width: 100%;
				height: 88rpx;
				line-height: 88rpx;
				background: linear-gradient(to right, $pyq-vi-color, rgba($pyq-vi-color, 0.6));
				color: #fff;
				font-size: 32rpx;
				border-radius: 44rpx;

				&:active {
					opacity: 0.8;
				}
			}
		}
	
		// 图标自定义面板样式
		.icon-customize-overlay {
			position: fixed;
			top: 0;
			left: 0;
			right: 0;
			bottom: 0;
			background-color: rgba(0, 0, 0, 0.6);
			z-index: 9999;
			display: flex;
			align-items: center;
			justify-content: center;
			
			.icon-customize-panel {
				width: 80%;
				max-width: 600rpx;
				background-color: #fff;
				border-radius: 20rpx;
				padding: 30rpx;
				box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.15);
				
				.icon-customize-header {
					display: flex;
					align-items: center;
					justify-content: space-between;
					margin-bottom: 30rpx;
					
					.panel-title {
						font-size: 32rpx;
						font-weight: bold;
						color: #333;
					}
					
					.close-btn {
						padding: 10rpx;
					}
				}
				
				.icon-preview {
					width: 200rpx;
					height: 200rpx;
					margin: 0 auto 30rpx;
					border: 1px solid #eee;
					border-radius: 20rpx;
					overflow: hidden;
					display: flex;
					align-items: center;
					justify-content: center;
					
					.preview-image {
						width: 100%;
						height: 100%;
						object-fit: contain;
					}
				}
				
				.customize-controls {
					margin-bottom: 30rpx;
					
					.control-item {
						margin-bottom: 20rpx;
						
						.control-label {
							font-size: 28rpx;
							color: #666;
							margin-bottom: 10rpx;
							display: block;
						}
					}
				}
				
				.customize-buttons {
					display: flex;
					justify-content: space-between;
					gap: 20rpx;
					
					button {
						flex: 1;
						height: 80rpx;
						line-height: 80rpx;
						font-size: 28rpx;
						border-radius: 40rpx;
					}
					
					.cancel-btn {
						background-color: #f5f5f5;
						color: #666;
					}
					
					.save-btn {
						background-color: $pyq-vi-color;
						color: #fff;
					}
				}
			}
		}
	}

	/* 修改 picker 确认按钮的颜色 */
	:deep(.uni-picker-container) {
		.uni-picker-action {
			color: $pyq-vi-color !important;
		}
	}

	.image-list {
		display: flex;
		flex-wrap: wrap;
		gap: 20rpx;
		
		.image-item {
			position: relative;
			width: 200rpx;
			height: 200rpx;
			
			image {
				width: 100%;
				height: 100%;
				border-radius: 8rpx;
			}
			
			.delete-btn {
				position: absolute;
				top: 15rpx;
				right: 15rpx;
				background: rgba(255, 0, 0, 0.7);
				border-radius: 50%;
				padding: 8rpx;
				z-index: 10;
				width: 40rpx;
				height: 40rpx;
				display: flex;
				align-items: center;
				justify-content: center;
			}

			.progress-overlay {
				position: absolute;
				top: 0;
				left: 0;
				right: 0;
				bottom: 0;
				background: rgba(0, 0, 0, 0.5);
				display: flex;
				flex-direction: column;
				align-items: center;
				justify-content: center;
				border-radius: 8rpx;

				.progress-text {
					color: #fff;
					font-size: 28rpx;
					margin-bottom: 10rpx;
					font-weight: bold;
					text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
				}

				.progress-bar {
					width: 80%;
					height: 4rpx;
					background: rgba(255, 255, 255, 0.3);
					border-radius: 2rpx;
					overflow: hidden;
					
					.progress {
						height: 100%;
						background: linear-gradient(to right, #fff, #2196F3);
						border-radius: 2rpx;
						transition: width 0.3s ease;
					}
				}
			}
		}
		
		.upload-btn {
			width: 200rpx;
			height: 200rpx;
			display: flex;
			align-items: center;
			justify-content: center;
			background-color: #f7f7f7;
			border-radius: 8rpx;
		}
	}

	// 添加视频转换中的动画样式
	.converting-overlay {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.7);
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		border-radius: 8rpx;
		z-index: 5;
		
		.converting-spinner {
			width: 60rpx;
			height: 60rpx;
			border: 4rpx solid rgba(255, 255, 255, 0.3);
			border-top: 4rpx solid #fff;
			border-radius: 50%;
			animation: spin 1s linear infinite;
			margin-bottom: 20rpx;
		}
		
		.converting-text {
			color: #fff;
			font-size: 28rpx;
		}
	}

	// 添加旋转动画
	@keyframes spin {
		0% { transform: rotate(0deg); }
		100% { transform: rotate(360deg); }
	}

	// 优化整体布局
	.article-add {
		padding: 20rpx 30rpx; // 减小整体内边距
		
		.form-item {
			margin-bottom: 20rpx; // 减小表单项之间的间距
		}
		
		.section-title {
			font-size: 28rpx; // 减小标题字体大小
			margin-bottom: 10rpx; // 减小标题底部边距
		}
	}

	/* 添加当前仅显示本地分类的提示样式 */
	.location-only-tip {
		display: flex;
		align-items: center;
		background-color: rgba(33, 150, 243, 0.08);
		padding: 8rpx 16rpx;
		border-radius: 8rpx;
		margin-bottom: 16rpx;
		
		text {
			font-size: 24rpx;
			color: #2196F3;
			margin-left: 8rpx;
		}
	}

	/* 文本输入区域样式 */
	.content-area {
		position: relative;
		margin-bottom: 20rpx;
		border: 1px solid #e0e0e0;
		border-radius: 5rpx;
		background-color: #f5f5f5;
		padding: 0;
		box-sizing: border-box;
		
		.content-input {
			width: 100%;
			min-height: 170rpx;
			font-size: 28rpx;
			line-height: 1.5;
			color: #333;
			padding: 16rpx;
			background-color: transparent;
			border: none;
			box-sizing: border-box;
			word-break: break-word;
			white-space: pre-wrap;
			overflow-wrap: break-word;
			text-align: left;
		}
	}
</style>