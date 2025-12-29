<script>
export default {
	name: 'Fabu'
}
</script>

<script setup>
	import { ref, onMounted, nextTick, computed } from 'vue'
	import { useUserInfoStore } from '@/store/user.js'
	import { onLoad } from '@dcloudio/uni-app'  // 添加这一行
	import { fixImageUrl, getDefaultImage, getCurrentDomain } from '@/utils/domainConfig.js'  // 添加域名配置

	// Store & API 修改发布的版本
	const userStore = useUserInfoStore( )
	const articleApi = uniCloud.importObject( 'articleWx', { customUI: true })
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
	// 砍价相关变量
	const enableBargain = ref(false) // 是否启用砍价
	const bargainInitialPrice = ref(0) // 砍价起始金额
	const bargainStep = ref(10) // 每次砍价金额
	// 砍价策略配置
	const bargainMode = ref('random') // 砍价模式：'fixed'固定金额、'random'随机金额、'decrease'递减金额、'percentage'百分比模式
	const bargainMinAmount = ref(1) // 随机模式最小金额
	const bargainMaxAmount = ref(5) // 随机模式最大金额
	const bargainPercentage = ref(1) // 百分比模式的百分比（1%）
	const bargainDecreaseRate = ref(0.8) // 递减模式的递减比例（每次递减20%）
	const bargainPopupImage = ref('') // 砂价弹窗图片
	const bargainPopupText = ref('') // 砂价弹窗文字
	const bargainAmountText = ref('') // 砂价金额自定义文字
	const bargainEndTime = ref('') // 砍价结束时间（显示用）
	const bargainEndTimeValue = ref('') // 砍价结束时间（picker标准格式）
	// 自定义时间选择弹窗相关变量
	const showCustomTimePicker = ref(false)
	const selectedDateIndex = ref(0) // 选中的日期索引
	const selectedTimeSlot = ref('') // 选中的时间段
	const selectionStart = ref(0)
	const selectionEnd = ref(0)
	const textareaElement = ref(null) // 记录DOM元素
	const isInSelectionMode = ref(false) // 文本选择模式状态
	// 添加图片预览相关变量
	const showImagePreview = ref(false)
	const currentPreviewImage = ref('')
	const previewImageIndex = ref(0)
	
	// 域名状态显示相关变量
	const showDomainInfo = ref(false)
	const domainStatus = ref({
		currentDomain: '',
		imageCount: 0,
		fixedCount: 0
	})
	
	// 分享封面图相关变量
	const shareCoverImage = ref('') // 分享封面图URL
	const shareCoverImageUploading = ref(false) // 封面图上传中
	const shareCoverImageProgress = ref(0) // 封面图上传进度

	// GPS权限检查相关变量
	const gpsChecked = ref(false)
	const showGpsGuide = ref(false)

	// 添加精确位置信息变量
	const preciseLocationInfo = ref({
		latitude: null,
		longitude: null,
		accuracy: null,
		altitude: null,
		speed: null,
		timestamp: null,
		province: '',
		city: '',
		district: '',
		street: '',
		streetNumber: '',
		poiName: ''
	})

	// 计算选择的字符数
	const selectedCharsCount = computed(() => {
		return selectionEnd.value - selectionStart.value
	})

	// 判断是否为管理员
	const isAdmin = computed(() => {
		return userStore.userInfo.role && userStore.userInfo.role[0] === 'admin'
	})

	// 图标生成相关
	const iconCustomizing = ref(false)
	const textOffsetX = ref(0)  // 文字X轴偏移量
	const textOffsetY = ref(0)  // 文字Y轴偏移量
	const textSize = ref(100)   // 文字大小百分比
	const previewImageUrl = ref('') // 预览图URL



	// 添加以下常用文本功能相关的变量
	const commonPhrases = ref([
		'欢迎咨询',
		'全新产品',
		'限时优惠',
		'诚信交易',
		'支持自提'
	])

	// 添加表情符号相关的变量
	const showEmojiPanel = ref(false)
	const emojiGroups = ref([
		{
			name: '常用',
			emojis: ['😊', '👍', '❤️', '👋', '🙏', '🔥', '💯', '👏', '🎉', '✨', '🌹', '💪', '🤝']
		},
		{
			name: '表情',
			emojis: ['😀', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '😉', '😌', '😍']
		},
		{
			name: '手势',
			emojis: ['👍', '👎', '👌', '✌️', '🤞', '🤟', '🤙', '🤛', '🤜', '👊', '✊', '🤝', '👏']
		}
	])
	const currentEmojiGroupIndex = ref(0)

	// 添加快捷输入常用词功能
	// 删除以下内容
	// const quickPhrases = ref([
	//   '欢迎咨询',
	//   '有现货',
	//   '支持自提',
	//   '全新正品',
	//   '包邮到家'
	// ])
	// const showQuickPhrases = ref(false)
	// const toggleQuickPhrases = () => {...}
	// const insertQuickPhrase = (phrase) => {...}

	// 显示快捷短语面板的状态
	// 删除以下内容
	// const showQuickPhrases = ref(false)

	// 切换快捷短语面板
	// 删除以下内容
	// const toggleQuickPhrases = () => {...}

	// 插入快捷短语
	// 删除以下内容
	// const insertQuickPhrase = (phrase) => {...}

	// 检查GPS权限（静默检查）
	const checkGPSPermission = async () => {
		console.log('=== checkGPSPermission: 开始执行 ===')
		console.log('检查前状态:', { gpsChecked: gpsChecked.value, showGpsGuide: showGpsGuide.value })
		
		try {
			console.log('尝试获取GPS定位...')
			// 尝试获取GPS定位
			await uni.getLocation({
				type: 'gcj02',
				isHighAccuracy: true,
				highAccuracyExpireTime: 5000
			})
			
			// GPS检测成功
			console.log('GPS定位成功！')
			gpsChecked.value = true
			showGpsGuide.value = false
			console.log('更新后状态:', { gpsChecked: gpsChecked.value, showGpsGuide: showGpsGuide.value })
			return true
		} catch (error) {
			console.error('GPS定位权限检测失败:', error)
			// GPS未开启或权限未授予，显示引导
			gpsChecked.value = false
			showGpsGuide.value = true
			console.log('更新后状态:', { gpsChecked: gpsChecked.value, showGpsGuide: showGpsGuide.value })
			return false
		}
	}

	// 获取位置和分类
	const getLocaAndCate = async ( ) => {
		console.log('=== getLocaAndCate: 开始执行 ===')
		console.log('GPS当前状态:', { gpsChecked: gpsChecked.value, showGpsGuide: showGpsGuide.value })
		
		// 先检查GPS权限
		console.log('=== 步雤1: 调用checkGPSPermission() ===')
		const hasGPS = await checkGPSPermission()
		console.log('GPS权限检查结果:', hasGPS)
		
		if (!hasGPS) {
			// GPS未授权，不继续获取位置和分类
			console.log('=== GPS权限未授予，终止执行 ===')
			console.log('GPS最终状态:', { gpsChecked: gpsChecked.value, showGpsGuide: showGpsGuide.value })
			return
		}
		
		console.log('=== GPS权限已授予，继续获取位置和分类 ===')
		
		try {
			// 显示加载提示
			uni.showLoading({
				title: '加载中...',
				mask: false
			})
			
			// 获取高精度位置信息
			let locationRes = await uni.getLocation({
				type: 'gcj02',
				highAccuracyExpireTime: 10000, // 10秒超时
				isHighAccuracy: true, // 启用高精度定位
				altitude: true // 获取高度信息
			}).catch(err => {
				console.error('获取位置失败:', err)
				// GPS权限问题，显示引导
				gpsChecked.value = false
				showGpsGuide.value = true
				throw err
			})
			
			// 保存精确位置信息
			preciseLocationInfo.value = {
				latitude: locationRes.latitude,
				longitude: locationRes.longitude,
				accuracy: locationRes.accuracy || 0,
				altitude: locationRes.altitude || 0,
				speed: locationRes.speed || 0,
				timestamp: Date.now(),
				province: '',
				city: '',
				district: '',
				street: '',
				streetNumber: '',
				poiName: ''
			}
			
			// 调用API获取分类和地址信息
			const res = await articleApi.addReady(`${locationRes.longitude},${locationRes.latitude}`)
			console.log('获取分类和地址信息成功:', res)
			
			// 设置位置信息
			locationInfo.value = {
				address: res.address || '未知地址',
				district: res.district || '未知区域'
			}
			
			// 解析详细地址信息
			if (res.address && res.address !== '未知地址') {
				parseDetailedAddress(res.address, res.district)
			}
			
			// 设置分类列表 - 显示管理员已添加的地区分类
			if (res.cateList && res.cateList.length > 0) {
				// 筛选出当前区域的位置分类（由管理员后台添加）
				const locationBasedCategories = res.cateList.filter(cate => 
					cate.is_location_based && cate.location_district === res.district && cate.is_visible !== false
				)
				
				// 如果管理员已添加本地区分类，则显示它们
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
				} else {
					// 如果管理员未添加本地区分类，允许直接发布，不携带地区信息
					uni.showToast({
						title: '该地区暂无分类，可直接发布',
						icon: 'none',
						duration: 2000
					})
					setDefaultCategory()
					// 清空地区信息，表示无地区限制
					locationInfo.value = {
						address: '',
						district: ''
					}
				}
			} else {
				console.warn('未获取到分类列表或分类列表为空')
				uni.showToast({
					title: '暂无可用分类，可直接发布',
					icon: 'none',
					duration: 2000
				})
				setDefaultCategory()
				// 清空地区信息，表示无地区限制
				locationInfo.value = {
					address: '',
					district: ''
				}
			}
		} catch (error) {
			console.error('获取位置和分类失败:', error)
			
			// 检查是否是GPS权限问题
			if (error && (error.errMsg?.includes('auth') || error.errMsg?.includes('permission'))) {
				// GPS权限问题，显示引导界面
				gpsChecked.value = false
				showGpsGuide.value = true
			} else {
				// 其他错误，显示提示
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
			}
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

	// 解析详细地址信息
	const parseDetailedAddress = (address, district) => {
		try {
			// 使用正则表达式解析地址
			const addressParts = {
				province: '',
				city: '',
				district: district || '',
				street: '',
				streetNumber: '',
				poiName: ''
			}
			
			// 提取省份信息
			const provinceMatch = address.match(/(中国)?(.+?省|中国.+?自治区|中国.+?市)/)
			if (provinceMatch) {
				addressParts.province = provinceMatch[2] || provinceMatch[1]
			}
			
			// 提取城市信息
			const cityMatch = address.match(/(省|市|自治区)(.+?市)/)
			if (cityMatch) {
				addressParts.city = cityMatch[2]
			}
			
			// 提取街道信息
			const streetMatch = address.match(/(区|县)(.+?)(街道|镇|乡)/)
			if (streetMatch) {
				addressParts.street = streetMatch[2] + streetMatch[3]
			}
			
			// 提取POI信息（具体地名）
			const poiMatch = address.match(/(街道|镇|乡)(.+)/)
			if (poiMatch) {
				addressParts.poiName = poiMatch[2].trim()
			}
			
			// 更新精确位置信息
			preciseLocationInfo.value = {
				...preciseLocationInfo.value,
				...addressParts
			}
			
			console.log('解析的详细地址信息:', addressParts)
		} catch (error) {
			console.error('解析地址信息失败:', error)
		}
	}

	// 重新定位
	const relocate = async () => {
		uni.showToast({
			title: '正在重新定位...',
			icon: 'loading'
		})
		
		try {
			await getLocaAndCate()
			uni.showToast({
				title: '定位成功',
				icon: 'success'
			})
		} catch (error) {
			uni.showToast({
				title: '定位失败',
				icon: 'error'
			})
		}
	}

	// 简化地址显示
	const getSimplifiedAddress = (address) => {
		if (!address || address === '未知地址') {
			return ''
		}
		
		// 移除省份信息，保留主要地名
		let simplified = address
		
		// 移除省份前缀
		simplified = simplified.replace(/^.*?省/, '')
		simplified = simplified.replace(/^.*?市/, '')
		simplified = simplified.replace(/^.*?自治区/, '')
		
		// 如果地址过长，只保留前部分
		if (simplified.length > 20) {
			// 找到适合的截断点（按照行政区划或地标截断）
			const breakPoints = ['县', '区', '镇', '街道', '乡']
			for (const breakPoint of breakPoints) {
				const index = simplified.indexOf(breakPoint)
				if (index !== -1 && index < 15) {
					simplified = simplified.substring(0, index + breakPoint.length)
					break
				}
			}
			
			// 如果仍然过长，直接截断
			if (simplified.length > 20) {
				simplified = simplified.substring(0, 18) + '...'
			}
		}
		
		return simplified
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
		return iconMap[cateName] || getDefaultImage('default') // 使用域名配置中的默认图片路径
	}

	// 修改图片选择和上传方法
	const chooseAndUploadImage = async () => {
		try {
			console.log('=== 开始选择图片 ===')
			
			// 移除图片数量限制检查
			// 选择图片，设置 sizeType 只包含 original 来选择原图
			const chooseRes = await uni.chooseImage({
				count: 9, // 保留此参数但不再做前置检查
				sizeType: ['original'], // 只使用原图
				sourceType: ['album', 'camera'],
				// mediaType参数在某些平台不支持，移除它
			}).catch(err => {
				console.error('选择图片失败:', err)
				// 检查是否是权限问题
				if (err.errMsg && err.errMsg.includes('auth')) {
					uni.showModal({
						title: '需要相册权限',
						content: '请在小程序设置中开启相册权限，以便选择图片发布',
						showCancel: true,
						confirmText: '去设置',
						success: (res) => {
							if (res.confirm) {
								uni.openSetting()
							}
						}
					})
				} else {
					uni.showToast({
						title: '选择图片失败: ' + (err.errMsg || '未知错误'),
						icon: 'none',
						duration: 3000
					})
				}
				throw err
			})
			
			if (!chooseRes || !chooseRes.tempFilePaths || chooseRes.tempFilePaths.length === 0) {
				console.warn('未选择任何图片')
				return
			}
			
			console.log('选择了', chooseRes.tempFilePaths.length, '张图片')

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
					console.log(`开始上传第 ${newIndex + 1} 张图片`)
					
					// 获取图片信息（宽高）用于水印大小调整
					const imageInfo = await uni.getImageInfo({
						src: filePath
					}).catch(err => {
						console.error('获取图片尺寸信息失败:', err)
						return { width: 0, height: 0 } // 失败时使用默认值
					})
					
					console.log(`图片 ${newIndex + 1} 尺寸:`, imageInfo.width, 'x', imageInfo.height)
					
					// 获取上传配置
					const uploadOptions = await extStorageCo.getUploadFileOptions({
						cloudPath: `images/${userStore.userInfo.uid}/${Date.now()}-${newIndex}.jpg`,
						fileType: 'image',
						isOriginal: true,
						userNickName: userStore.userInfo.nickName,
						imageWidth: imageInfo.width, // 传递图片宽度
						imageHeight: imageInfo.height // 传递图片高度
					}).catch(err => {
						console.error('获取上传配置失败:', err)
						uni.showToast({
							title: '云存储配置失败: ' + (err.message || '请检查网络'),
							icon: 'none',
							duration: 3000
						})
						throw err
					})
					
					console.log('====== 云函数返回的上传配置 ======');
					console.log('图片尺寸:', imageInfo.width, 'x', imageInfo.height);
					console.log('原图URL:', uploadOptions.fileURL);
					console.log('说明: 直接使用原图URL，无压缩处理');
					console.log('===================================');
					
					// 创建备用进度定时器（如果onProgressUpdate不工作）
					let fallbackTimer = null;
					let fallbackActive = true;
					
					// 启动备用进度动画 - 仅当实际进度回调未工作时使用
					fallbackTimer = setTimeout(function setupFallback() {
						if (!fallbackActive) return;
						
						// 安全检查：确保索引位置仍然存在
						if (!imageList.value[newIndex]) {
							fallbackActive = false;
							return;
						}
						
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
								
								// 安全检查：确保索引位置仍然存在
								if (!imageList.value[newIndex]) {
									console.warn(`图片索引 ${newIndex} 已不存在，可能已被删除`);
									resolve(true);
									return;
								}
								
								// 更新上传成功后的文件信息
								imageList.value[newIndex].progress = 100;
								// 保存纯净的原始URL，不带任何参数
								const originalUrl = uploadOptions.url || uploadOptions.fileURL;
								// 移除URL中的所有参数
								const cleanUrl = originalUrl.includes('?') ? originalUrl.split('?')[0] : originalUrl;
								// 同时保存url和fileURL字段，确保兼容性
								imageList.value[newIndex].url = cleanUrl;
								imageList.value[newIndex].fileURL = cleanUrl;
								imageList.value[newIndex].compressedURL = cleanUrl;
								
								console.log('====== 图片上传成功 ======');
								console.log('图片索引:', newIndex + 1);
								console.log('原始URL:', originalUrl);
								console.log('保存URL:', cleanUrl);
								console.log('说明: 保存纯净原图URL，不带任何参数');
								console.log('===========================');
								
								resolve(true);
													
								// 解析并显示处理参数详情
								if (uploadOptions.compressedURL && uploadOptions.compressedURL.includes('?')) {
									const params = uploadOptions.compressedURL.split('?')[1];
									const paramParts = params.split('|');
									console.log('\n处理链详情:');
									paramParts.forEach((part, index) => {
										if (part.includes('thumbnail')) {
											const match = part.match(/thumbnail\/(\d+x?)/);
											if (match) {
												console.log(`  ✓ 压缩${index + 1}: ${match[1]} 限制`);
											}
										} else if (part.includes('watermark')) {
											// 提取水印关键参数
											const fontSizeMatch = part.match(/fontsize\/(\d+)/);
											const dissolveMatch = part.match(/dissolve\/(\d+)/);
											const dxMatch = part.match(/dx\/(\d+)/);
											const dyMatch = part.match(/dy\/(\d+)/);
											const wsMatch = part.match(/ws\/([\d.]+)/); // 匹配水印缩放比例
														
											console.log(`  ✓ 水印参数:`);
											if (wsMatch) console.log(`    - 缩放比例: ${wsMatch[1]} (${(parseFloat(wsMatch[1]) * 100).toFixed(0)}%)`);
											if (fontSizeMatch) console.log(`    - 字号: ${fontSizeMatch[1]}px`);
											if (dissolveMatch) console.log(`    - 透明度: ${dissolveMatch[1]}%`);
											if (dxMatch) console.log(`    - 右边距: ${dxMatch[1]}px`);
											if (dyMatch) console.log(`    - 上边距: ${dyMatch[1]}px`);
										}
									});
								}
								console.log('===========================');
								
								resolve(true);
							},
							fail: (err) => {
								// 取消备用定时器
								fallbackActive = false;
								clearTimeout(fallbackTimer);
								
								console.error("上传失败", err);
								
								// 显示详细错误信息
								uni.showModal({
									title: '图片上传失败',
									content: `第${newIndex + 1}张图片上传失败：${err.errMsg || '未知错误'}

请检查：
1. 网络连接是否正常
2. 图片大小是否过大
3. 云存储配置是否正常`,
									showCancel: true,
									confirmText: '重试',
									cancelText: '取消',
									success: (res) => {
										if (res.confirm) {
											// 重试上传
											chooseAndUploadImage()
										}
									}
								})
								
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
									
									// 安全检查：确保索引位置仍然存在
									if (imageList.value[newIndex]) {
										// 更新实际进度，最大99%（保留1%给服务器处理阶段）
										const actualProgress = Math.min(99, res.progress);
										imageList.value[newIndex].progress = actualProgress;
									}
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

	// 修改视频选择方法，添加自动保存功能
	const handleVideoLinkInput = async (e) => {
	  // 在输入时自动验证并保存链接
	  const currentLink = videoLink.value.trim();
	  
	  // 如果链接为空，则清空视频信息
	  if (!currentLink) {
	    videoInfo.value = null;
	    return;
	  }
	  
	  // 简单验证链接格式
	  const urlPattern = /^(https?:\/\/)?([\w-]+\.)+[\w-]+(\/[\w- ./?%&=]*)?$/;
	  if (!urlPattern.test(currentLink)) {
	    return; // 不符合链接格式，不保存
	  }
	  
	  // 只检测快手平台视频链接
	  const isKuaishouVideo = currentLink.includes('kwimgs.com') || currentLink.includes('kuaishou.com');
	  
	  if (isKuaishouVideo) {
	    try {
	      uni.showLoading({
	        title: '处理中...',
	        mask: true
	      });
	      
	      // 调用云函数解析链接（去除参数）
	      const result = await extStorageCo.parseKuaishouVideoLink(currentLink);
	      
	      if (result.code === 0 && result.data && result.data.videoUrl) {
	        // 解析成功，保存纯净链接
	        videoInfo.value = result.data.videoUrl;
	        videoLink.value = result.data.videoUrl; // 更新输入框显示
	        
	        uni.hideLoading();
	        uni.showToast({
	          title: '快手视频链接处理成功',
	          icon: 'success',
	          duration: 1500
	        });
	        
	        // 提供轻微的反馈
	        uni.vibrateShort && uni.vibrateShort({ type: 'light' });
	      } else {
	        // 解析失败，显示错误信息
	        uni.hideLoading();
	        uni.showToast({
	          title: result.message || '处理失败',
	          icon: 'none',
	          duration: 2500
	        });
	      }
	    } catch (error) {
	      console.error('处理视频链接失败:', error);
	      uni.hideLoading();
	      uni.showToast({
	        title: '处理失败，请检查链接',
	        icon: 'none',
	        duration: 2500
	      });
	    }
	  } else {
	    // 普通链接，直接保存
	    videoInfo.value = currentLink;
	    
	    // 提供轻微的反馈
	    uni.vibrateShort && uni.vibrateShort({ type: 'light' });
	  }
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
	
	// 选择并上传分享封面图
	const chooseAndUploadShareCover = async () => {
		try {
			console.log('=== 开始选择分享封面图 ===')
			
			// 选择图片
			const chooseRes = await uni.chooseImage({
				count: 1, // 只选择一张
				sizeType: ['original'], // 使用原图
				sourceType: ['album', 'camera']
			}).catch(err => {
				console.error('选择图片失败:', err)
				if (err.errMsg && err.errMsg.includes('auth')) {
					uni.showModal({
						title: '需要相册权限',
						content: '请在小程序设置中开启相册权限',
						showCancel: true,
						confirmText: '去设置',
						success: (res) => {
							if (res.confirm) {
								uni.openSetting()
							}
						}
					})
				}
				throw err
			})
			
			if (!chooseRes || !chooseRes.tempFilePaths || chooseRes.tempFilePaths.length === 0) {
				console.warn('未选择任何图片')
				return
			}
			
			const filePath = chooseRes.tempFilePaths[0]
			console.log('选择了分享封面图:', filePath)
			
			// 开始上传
			shareCoverImageUploading.value = true
			shareCoverImageProgress.value = 0
			
			try {
				// 获取图片信息（宽高）
				const imageInfo = await uni.getImageInfo({
					src: filePath
				}).catch(err => {
					console.error('获取图片尺寸信息失败:', err)
					return { width: 0, height: 0 }
				})
				
				console.log(`分享封面图尺寸:`, imageInfo.width, 'x', imageInfo.height)
				
				// 获取上传配置
				const uploadOptions = await extStorageCo.getUploadFileOptions({
					cloudPath: `share_cover/${userStore.userInfo.uid}/${Date.now()}.jpg`,
					fileType: 'image',
					isOriginal: true,
					userNickName: userStore.userInfo.nickName,
					imageWidth: imageInfo.width,
					imageHeight: imageInfo.height
				}).catch(err => {
					console.error('获取上传配置失败:', err)
					uni.showToast({
						title: '云存储配置失败',
						icon: 'none'
					})
					throw err
				})
				
				// 执行上传
				return new Promise((resolve, reject) => {
					const uploadTask = uni.uploadFile({
						...uploadOptions.uploadFileOptions,
						filePath: filePath,
						success: () => {
							// 更新上传成功后的文件信息
							shareCoverImageProgress.value = 100
							// 保存纯净的原始URL
							const originalUrl = uploadOptions.url || uploadOptions.fileURL
							const cleanUrl = originalUrl.includes('?') ? originalUrl.split('?')[0] : originalUrl
							shareCoverImage.value = cleanUrl
							
							console.log('====== 分享封面图上传成功 ======')
							console.log('保存URL:', cleanUrl)
							console.log('===========================')
							
							uni.showToast({
								title: '封面图上传成功',
								icon: 'success'
							})
							
							shareCoverImageUploading.value = false
							resolve(true)
						},
						fail: (err) => {
							console.error("上传失败", err)
							uni.showToast({
								title: '上传失败',
								icon: 'none'
							})
							shareCoverImageUploading.value = false
							reject(err)
						}
					})
					
					// 尝试使用实际上传进度更新
					try {
						uploadTask.onProgressUpdate((res) => {
							if (res && typeof res.progress === 'number') {
								shareCoverImageProgress.value = Math.min(99, res.progress)
							}
						})
					} catch (progressErr) {
						console.log('进度更新回调不可用', progressErr)
					}
				})
			} catch (err) {
				shareCoverImageUploading.value = false
				console.error('上传分享封面图错误:', err)
				return Promise.reject(err)
			}
		} catch (err) {
			uni.showToast({
				title: '上传失败',
				icon: 'none'
			})
			console.error('分享封面图上传过程错误:', err)
		}
	}
	
	// 删除分享封面图
	const deleteShareCover = () => {
		shareCoverImage.value = ''
		shareCoverImageProgress.value = 0
	}

	// 处理砍价开关变化
	const handleBargainSwitch = (e) => {
		enableBargain.value = e.detail.value
		
		// 开启时，设置默认值
		if (e.detail.value && bargainInitialPrice.value === 0) {
			// 默认选中随机金额模式
			bargainMode.value = 'random'
			
			bargainInitialPrice.value = 100
			bargainStep.value = 10
			bargainMinAmount.value = 1
			bargainMaxAmount.value = 5
			bargainPercentage.value = 1
			bargainDecreaseRate.value = 0.2 // 递减比例：20%递减
			// 设置默认结束时间为7天后
			const defaultEndDate = new Date()
			defaultEndDate.setDate(defaultEndDate.getDate() + 7)
			bargainEndTime.value = formatDateTime(defaultEndDate)
			bargainEndTimeValue.value = formatDateTimeForPicker(defaultEndDate)
		}
		
		// 关闭时清空
		if (!e.detail.value) {
			bargainMode.value = 'random' // 重置为随机金额模式
			bargainInitialPrice.value = 0
			bargainStep.value = 10
			bargainEndTime.value = ''
			bargainEndTimeValue.value = ''
		}
	}
	
	// 格式化日期时间（显示用）
	const formatDateTime = (date) => {
		const year = date.getFullYear()
		const month = String(date.getMonth() + 1).padStart(2, '0')
		const day = String(date.getDate()).padStart(2, '0')
		const hours = String(date.getHours()).padStart(2, '0')
		const minutes = String(date.getMinutes()).padStart(2, '0')
		return `${year}-${month}-${day} ${hours}:${minutes}`
	}
	
	// 格式化日期时间（picker用，标准格式）
	const formatDateTimeForPicker = (date) => {
		const year = date.getFullYear()
		const month = String(date.getMonth() + 1).padStart(2, '0')
		const day = String(date.getDate()).padStart(2, '0')
		const hours = String(date.getHours()).padStart(2, '0')
		const minutes = String(date.getMinutes()).padStart(2, '0')
		return `${year}-${month}-${day} ${hours}:${minutes}`
	}
	
	// 获取当前日期时间（用于picker的start属性）- 使用计算属性优化性能
	const pickerStartTime = computed(() => {
		return formatDateTimeForPicker(new Date())
	})
	
	// 获取最大可选时间（不限制，允许选择任意未来时间）
	const pickerEndTime = computed(() => {
		// 不设置上限，返回空字符串表示不限制
		return ''
	})
	
	// 生成预设日期选项（今天、明天、后天等）
	const dateOptions = computed(() => {
		const today = new Date()
		const options = []
		
		for (let i = 0; i < 7; i++) {
			const date = new Date(today)
			date.setDate(today.getDate() + i)
			
			let label = ''
			if (i === 0) label = '今天'
			else if (i === 1) label = '明天'
			else if (i === 2) label = '后天'
			else label = `${date.getMonth() + 1}月${date.getDate()}日`
			
			options.push({
				label,
				date,
				value: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
			})
		}
		
		return options
	})
	
	// 预设时间段
	const timeSlots = [
		'08:00-09:00',
		'09:00-10:00',
		'10:00-11:00',
		'11:00-12:00',
		'12:00-13:00',
		'13:00-14:00',
		'14:00-15:00',
		'15:00-16:00',
		'16:00-17:00',
		'17:00-18:00',
		'18:00-19:00',
		'19:00-20:00',
		'20:00-21:00',
		'21:00-22:00'
	]
	
	// 打开自定义时间选择器
	const openCustomTimePicker = () => {
		console.log('=== 打开自定义时间选择器 ===')
		showCustomTimePicker.value = true
		// 默认选中明天
		selectedDateIndex.value = 1
		selectedTimeSlot.value = ''
	}
	
	// 关闭自定义时间选择器
	const closeCustomTimePicker = () => {
		showCustomTimePicker.value = false
	}
	
	// 选择日期
	const selectDate = (index) => {
		selectedDateIndex.value = index
		console.log('选择日期:', dateOptions.value[index].label)
	}
	
	// 选择时间段
	const selectTimeSlot = (slot) => {
		selectedTimeSlot.value = slot
		console.log('选择时间段:', slot)
		
		// 自动确认
		confirmCustomTime()
	}
	
	// 确认时间选择
	const confirmCustomTime = () => {
		if (!selectedTimeSlot.value) {
			uni.showToast({
				title: '请选择时间段',
				icon: 'none'
			})
			return
		}
		
		const selectedDate = dateOptions.value[selectedDateIndex.value]
		const [startTime] = selectedTimeSlot.value.split('-')
		
		// 生成完整日期时间
		const dateTimeStr = `${selectedDate.value} ${startTime}`
		bargainEndTimeValue.value = dateTimeStr
		bargainEndTime.value = `${selectedDate.label} ${selectedTimeSlot.value}`
		
		console.log('✅ 自定义时间选择成功:', {
			displayValue: bargainEndTime.value,
			pickerValue: bargainEndTimeValue.value,
			timestamp: new Date(dateTimeStr.replace(' ', 'T')).getTime(),
			selectedDate: selectedDate,
			selectedTimeSlot: selectedTimeSlot.value
		})
		
		closeCustomTimePicker()
		
		uni.showToast({
			title: '结束时间已设置',
			icon: 'success',
			duration: 1500
		})
	}
	
	// 处理点击时间选择器
	const handlePickerTap = () => {
		console.log('=== 时间选择器 - 点击触发 ===', {
			currentPickerValue: bargainEndTimeValue.value,
			currentDisplayValue: bargainEndTime.value,
			pickerRange: {
				start: pickerStartTime.value,
				end: '不限制（任意未来时间）'
			},
			enableBargain: enableBargain.value,
			timestamp: Date.now()
		})
	}
	
	// 处理结束时间选择
	const handleEndTimeChange = (e) => {
		const dateValue = e.detail.value
		console.log('=== 时间选择器 - 确认选择触发 ===', {
			eventValue: dateValue,
			eventDetail: e.detail,
			currentPickerValue: bargainEndTimeValue.value,
			pickerRange: {
				start: pickerStartTime.value,
				end: pickerEndTime.value
			},
			timestamp: Date.now()
		})
		
		if (!dateValue) {
			console.warn('⚠️ 未选择时间,取消操作')
			return
		}
		
		// 验证时间格式：必须符合 YYYY-MM-DD HH:mm 格式
		const dateTimePattern = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/
		if (!dateTimePattern.test(dateValue)) {
			console.error('❌ 日期时间格式不符合规范:', dateValue)
			uni.showToast({
				title: '时间格式错误',
				icon: 'none'
			})
			return
		}
		
		// 保存picker的标准格式
		bargainEndTimeValue.value = dateValue
		
		// 转换为显示格式
		const date = new Date(dateValue.replace(' ', 'T')) // 兼容处理
		bargainEndTime.value = formatDateTime(date)
		
		console.log('✅ 时间设置成功:', {
			pickerValue: bargainEndTimeValue.value,
			displayValue: bargainEndTime.value,
			timestamp: date.getTime(),
			formatted: date.toLocaleString('zh-CN')
		})
		
		uni.showToast({
			title: '结束时间已设置',
			icon: 'success',
			duration: 1500
		})
	}
	
	// 处理取消选择时间
	const handleEndTimeCancel = (e) => {
		console.log('=== 时间选择器 - 取消选择 ===', {
			currentValue: bargainEndTimeValue.value,
			currentDisplay: bargainEndTime.value,
			eventDetail: e.detail,
			timestamp: Date.now()
		})
	}
	
	// 清除结束时间
	const clearEndTime = () => {
		console.log('=== 时间选择器 - 清除时间 ===', {
			beforeClear: {
				displayValue: bargainEndTime.value,
				pickerValue: bargainEndTimeValue.value
			},
			timestamp: Date.now()
		})
		
		bargainEndTime.value = ''
		bargainEndTimeValue.value = ''
		
		console.log('✅ 时间已清除')
		
		uni.showToast({
			title: '已清除结束时间',
			icon: 'success',
			duration: 1500
		})
	}
	
	// 切换砍价模式
	const handleBargainModeChange = (e) => {
		bargainMode.value = e.detail.value
		// 根据不同模式设置默认值
		switch(bargainMode.value) {
			case 'fixed':
				bargainStep.value = bargainStep.value || 10
				break
			case 'random':
				bargainMinAmount.value = bargainMinAmount.value || 1
				bargainMaxAmount.value = bargainMaxAmount.value || 5
				break
			case 'percentage':
				bargainPercentage.value = bargainPercentage.value || 1
				break
			case 'decrease':
				bargainStep.value = bargainStep.value || 10
				bargainDecreaseRate.value = bargainDecreaseRate.value || 0.8
				break
		}
	}
	
	// 计算预览砍价金额（用于UI展示）
	const getPreviewBargainAmount = computed(() => {
		switch(bargainMode.value) {
			case 'fixed':
				return `每次固定砍掉 ¥${(bargainStep.value || 10).toFixed(2)}`
			case 'random':
				return `每次随机砍掉 ¥${(bargainMinAmount.value || 1).toFixed(2)} ~ ¥${(bargainMaxAmount.value || 5).toFixed(2)}`
			case 'percentage':
				const percentAmount = bargainInitialPrice.value * (bargainPercentage.value || 1) / 100
				return `每次砍掉原价的 ${bargainPercentage.value}%（约¥${percentAmount.toFixed(2)}）`
			case 'decrease':
				return `首次砍掉 ¥${(bargainStep.value || 10).toFixed(2)}，之后每次递减 ${((1 - bargainDecreaseRate.value) * 100).toFixed(0)}% 并在区间内随机`
			default:
				return ''
		}
	})
	
	// 选择弹窗图片
	const handleChooseImage = async () => {
		try {
			console.log('=== 开始选择弹窗图片 ===')
			
			// 选择图片
			const chooseRes = await uni.chooseImage({
				count: 1,
				sizeType: ['original'],
				sourceType: ['album', 'camera']
			}).catch(err => {
				console.error('选择图片失败:', err)
				if (err.errMsg && err.errMsg.includes('auth')) {
					uni.showModal({
						title: '需要相册权限',
						content: '请在小程序设置中开启相册权限',
						confirmText: '去设置',
						success: (res) => {
							if (res.confirm) {
								uni.openSetting()
							}
						}
					})
				} else {
					uni.showToast({
						title: '选择图片失败',
						icon: 'none'
					})
				}
				throw err
			})
			
			if (!chooseRes || !chooseRes.tempFilePaths || chooseRes.tempFilePaths.length === 0) {
				console.warn('未选择任何图片')
				return
			}
			
			const filePath = chooseRes.tempFilePaths[0]
			console.log('选择了图片:', filePath)
			
			// 显示上传中
			uni.showLoading({
				title: '上传中...'
			})
			
			try {
				// 获取图片信息
				const imageInfo = await uni.getImageInfo({
					src: filePath
				}).catch(err => {
					console.error('获取图片尺寸信息失败:', err)
					return { width: 400, height: 400 }
				})
				
				console.log('图片尺寸:', imageInfo.width, 'x', imageInfo.height)
				
				// 获取上传配置
				const uploadOptions = await extStorageCo.getUploadFileOptions({
					cloudPath: `bargain-popup/${userStore.userInfo.uid}/${Date.now()}.jpg`,
					fileType: 'image',
					isOriginal: true,
					userNickName: userStore.userInfo.nickName,
					imageWidth: imageInfo.width,
					imageHeight: imageInfo.height
				}).catch(err => {
					console.error('获取上传配置失败:', err)
					uni.hideLoading()
					uni.showToast({
						title: '云存储配置失败',
						icon: 'none'
					})
					throw err
				})
				
				console.log('====== 云函数返回的上传配置 ======')
				console.log('原图URL:', uploadOptions.fileURL)
				console.log('======================================')
				
				// 执行上传
				await new Promise((resolve, reject) => {
					uni.uploadFile({
						...uploadOptions.uploadFileOptions,
						filePath: filePath,
						success: () => {
							// 获取纯净的URL（不带参数）
							const originalUrl = uploadOptions.url || uploadOptions.fileURL
							const cleanUrl = originalUrl.includes('?') ? originalUrl.split('?')[0] : originalUrl
							
							// 保存图片URL
							bargainPopupImage.value = cleanUrl
							
							console.log('====== 图片上传成功 ======')
							console.log('原始URL:', originalUrl)
							console.log('保存URL:', cleanUrl)
							console.log('============================')
							
							uni.hideLoading()
							uni.showToast({
								title: '上传成功',
								icon: 'success'
							})
							
							resolve()
						},
						fail: (err) => {
							console.error('上传失败:', err)
							uni.hideLoading()
							uni.showToast({
								title: '上传失败',
								icon: 'none'
							})
							reject(err)
						}
					})
				})
			} catch (err) {
				uni.hideLoading()
				console.error('上传图片失败:', err)
				uni.showToast({
					title: '上传失败，请重试',
					icon: 'none'
				})
			}
		} catch (err) {
			console.error('选择图片失败:', err)
		}
	}
	
	// 预览弹窗图片
	const handleImagePreview = () => {
		if (bargainPopupImage.value) {
			uni.previewImage({
				urls: [bargainPopupImage.value],
				current: 0
			})
		}
	}
	
	// 删除弹窗图片
	const handleDeleteImage = () => {
		uni.showModal({
			title: '提示',
			content: '确定要删除这张图片吗？',
			success: (res) => {
				if (res.confirm) {
					bargainPopupImage.value = ''
					uni.showToast({
						title: '已删除',
						icon: 'success'
					})
				}
			}
		})
	}

	// 添加编辑模式相关变量
	const isEditMode = ref(false)
	const editArticleId = ref('')

	// 打开手机GPS设置
	const openGPSSettings = () => {
		uni.showModal({
			title: '需要开启GPS定位',
			content: '请在手机设置中开启GPS定位功能，然后返回小程序重新授权定位权限。',
			showCancel: false,
			confirmText: '我知道了'
		})
	}

	// 重新授权GPS权限
	const reauthorizeGPS = async () => {
		try {
			uni.showLoading({
				title: '检查权限中...',
				mask: true
			})
			
			// 尝试重新获取GPS定位
			const hasGPS = await checkGPSPermission()
			
			uni.hideLoading()
			
			if (hasGPS) {
				// 权限授予成功，重新加载位置和分类
				await getLocaAndCate()
				uni.showToast({
					title: '定位成功',
					icon: 'success',
					duration: 1500
				})
			} else {
				// 仍然没有权限
				uni.showModal({
					title: '定位权限未授予',
					content: '发布内容需要获取您的位置信息。请点击"去设置"开启定位权限。',
					confirmText: '去设置',
					cancelText: '取消',
					success: (res) => {
						if (res.confirm) {
							uni.openSetting()
						}
					}
				})
			}
		} catch (error) {
			console.error('重新授权GPS失败:', error)
			uni.hideLoading()
		}
	}

	// 返回首页
	const goToHome = () => {
		uni.reLaunch({
			url: '/pages/index/index'
		})
	}

	// 刷新当前页面
	const refreshPage = async () => {
		try {
			uni.showLoading({
				title: '刷新中...',
				mask: true
			})
			
			// 重新获取位置和分类数据
			await getLocaAndCate()
			
			uni.hideLoading()
			uni.showToast({
				title: '刷新成功',
				icon: 'success',
				duration: 1500
			})
		} catch (error) {
			console.error('刷新页面失败:', error)
			uni.hideLoading()
			uni.showToast({
				title: '刷新失败',
				icon: 'none',
				duration: 2000
			})
		}
	}

	// 添加onLoad生命周期
	onLoad((options) => {
		console.log('页面加载参数:', options)
		
		// ===== 每次进入页面都重置GPS检查状态，强制重新检查 =====
		console.log('=== 重置GPS状态，准备重新检查 ===')
		gpsChecked.value = false
		showGpsGuide.value = false
		
		// 检查是否是编辑模式
		if (options.mode === 'edit' && options.article_id) {
			isEditMode.value = true
			editArticleId.value = options.article_id
			// 先获取分类（内部会检查GPS），再加载文章数据
			getLocaAndCate().then(() => {
				loadArticleData()
			}).catch(err => {
				console.error('获取分类失败:', err)
				// 如果不GPS权限问题，显示提示
				if (!showGpsGuide.value) {
					uni.showToast({
						title: '获取分类失败',
						icon: 'none'
					})
				}
			})
		} else {
			// 非编辑模式，获取分类（getLocaAndCate内部会检查GPS）
			getLocaAndCate().catch(err => {
				console.error('获取分类失败:', err)
				// 如果不GPS权限问题，显示提示
				if (!showGpsGuide.value) {
					uni.showToast({
						title: '获取分类失败',
						icon: 'none'
					})
				}
			})
		}
	})

	// 加载文章数据
	const loadArticleData = async () => {
		try {
			uni.showLoading({
				title: '加载中...',
				mask: true
			})
			
			const res = await articleApi.getArticleDetal(editArticleId.value)
			
			if (!res || !res.articleRes || !res.articleRes.data || !res.articleRes.data[0]) {
				throw new Error('获取文章数据失败')
			}
			
			const articleData = res.articleRes.data[0]
			
			// 设置文章内容
			content.value = articleData.content || ''
			
			// 设置分类
			if (articleData.cate_id) {
				selectedCategory.value = articleData.cate_id
				const categoryIndex = categoryList.value.findIndex(cate => cate._id === articleData.cate_id)
				if (categoryIndex !== -1) {
					cateIndex.value = categoryIndex
				}
			}
			
			// 设置图片列表，加载时不添加参数，保持原始数据
			if (articleData.images && articleData.images.length > 0) {
				imageList.value = articleData.images.map(img => {
					// 兼容不同的图片数据格式，使用原始URL
					const imageUrl = img.url || img.fileURL || img;
					// 移除URL中的所有参数，保持纯净
					const cleanUrl = imageUrl.includes('?') ? imageUrl.split('?')[0] : imageUrl;
					return {
						url: cleanUrl,
						fileURL: cleanUrl,
						thumbnailURL: cleanUrl,
						compressedURL: cleanUrl,
						progress: 100
					};
				});
			}
			
			// 设置视频信息
			if (articleData.videoURL) {
				videoInfo.value = articleData.videoURL
			}
			
			// 设置位置信息
			locationInfo.value = {
				address: articleData.address || '未知地址',
				district: articleData.district || '未知区域'
			}
			
			// ✅ 修复：加载分享封面图
			if (articleData.share_cover_image) {
				shareCoverImage.value = articleData.share_cover_image
				console.log('✅ 加载到分享封面图:', shareCoverImage.value)
			} else {
				shareCoverImage.value = ''
				console.log('⚠️ 未找到分享封面图')
			}
			
				// 设置砍价配置
			if (articleData.enable_bargain) {
				console.log('====== 加载砂价配置 ======')
				console.log('数据库中的 bargain_popup_image:', articleData.bargain_popup_image)
				console.log('数据库中的 bargain_popup_text:', articleData.bargain_popup_text)
				console.log('数据库中的 bargain_amount_text:', articleData.bargain_amount_text)
				console.log('==========================')
						
				enableBargain.value = true
				bargainInitialPrice.value = articleData.bargain_initial_price || 0
				bargainStep.value = articleData.bargain_step || 10
				// 加载砍价策略配置
				bargainMode.value = articleData.bargain_mode || 'fixed'
				bargainMinAmount.value = articleData.bargain_min_amount || 5
				bargainMaxAmount.value = articleData.bargain_max_amount || 20
				bargainPercentage.value = articleData.bargain_percentage || 1
				bargainDecreaseRate.value = articleData.bargain_decrease_rate || 0.8
				bargainPopupImage.value = articleData.bargain_popup_image || ''
				bargainPopupText.value = articleData.bargain_popup_text || ''
				bargainAmountText.value = articleData.bargain_amount_text || ''
						
				console.log('加载后 bargainPopupImage.value:', bargainPopupImage.value)
				console.log('加载后 bargainPopupText.value:', bargainPopupText.value)
				console.log('加载后 bargainAmountText.value:', bargainAmountText.value)
						
				// 加载结束时间
				if (articleData.bargain_end_time) {
					const endDate = new Date(articleData.bargain_end_time)
					bargainEndTime.value = formatDateTime(endDate)
					bargainEndTimeValue.value = formatDateTimeForPicker(endDate)
					console.log('编辑模式加载结束时间:', {
						originalTimestamp: articleData.bargain_end_time,
						display: bargainEndTime.value,
						pickerValue: bargainEndTimeValue.value
					})
				}
			}
			
			// 设置已选择的标签
			// if (articleData.selected_tags && Array.isArray(articleData.selected_tags)) {
			//		selectedTags.value = [...articleData.selected_tags]
			// }
			
		} catch (err) {
			console.error('加载文章数据失败:', err)
			uni.showToast({
				title: '加载文章数据失败',
				icon: 'none'
			})
		} finally {
			uni.hideLoading()
		}
	}

	// 添加提交状态控制
	const isSubmitting = ref(false)

	// ===== 辅助函数：准备图片数据 =====
	const prepareImageData = () => {
		return imageList.value
			.filter(img => img.progress === 100 && (img.url || img.fileURL))
			.map(img => {
				const imageUrl = img.url || img.fileURL
				const cleanUrl = imageUrl.includes('?') ? imageUrl.split('?')[0] : imageUrl
				return {
					url: cleanUrl,
					compressedURL: cleanUrl
				}
			})
	}

	// ===== 辅助函数：构建提交参数 =====
	const buildSubmitParams = (uploadedImages, videoURL) => {
		// 获取选中的分类信息
		const selectedCategoryInfo = categoryList.value.find(cate => cate._id === selectedCategory.value) || null
		const isLocationBasedCategory = selectedCategoryInfo?.is_location_based === true
		const isDefaultCategory = selectedCategory.value === 'default'

		// 验证并处理用户头像URL
		let userAvatarUrl = userStore.userInfo.avatarUrl || '/static/images/touxiang.png'
		if (userAvatarUrl.startsWith('http://tmp/') || userAvatarUrl.startsWith('wxfile://')) {
			console.warn('检测到临时头像文件，使用默认头像')
			userAvatarUrl = '/static/images/touxiang.png'
		}

		// 构建基础参数
		const params = {
			user_id: userStore.userInfo.uid,
			content: content.value.trim(),
			images: uploadedImages,
			videoURL: videoURL || null,
			cate_id: isDefaultCategory ? null : selectedCategory.value,
			address: isDefaultCategory ? null : (locationInfo.value?.address || null),
			district: isDefaultCategory ? null : (locationInfo.value?.district || null),
			user_nickName: userStore.userInfo.nickName,
			user_avatarUrl: userAvatarUrl,
			user_mobile: userStore.userInfo.mobile,
			pay_amount: payAmount.value || 0,
			is_location_based_category: isDefaultCategory ? false : isLocationBasedCategory,
			share_cover_image: shareCoverImage.value || '', // 添加分享封面图
			category_info: isDefaultCategory ? null : (selectedCategoryInfo ? {
				name: selectedCategoryInfo.cate_name,
				is_location_based: selectedCategoryInfo.is_location_based || false,
				location_district: selectedCategoryInfo.location_district || null,
				icon: selectedCategoryInfo.icon || null,
				cate_img: selectedCategoryInfo.cate_img || selectedCategoryInfo.icon || null
			} : null)
		}

		// 添加砍价参数（如果启用）
		if (enableBargain.value) {
			console.log('====== 保存砂价配置 ======')
			console.log('bargainPopupImage.value:', bargainPopupImage.value)
			console.log('bargainPopupText.value:', bargainPopupText.value)
			console.log('bargainAmountText.value:', bargainAmountText.value)
			console.log('==========================')
			
			Object.assign(params, {
				enable_bargain: true,
				bargain_initial_price: bargainInitialPrice.value || 0,
				bargain_step: bargainStep.value || 10,
				bargain_mode: bargainMode.value,
				bargain_min_amount: bargainMinAmount.value || 5,
				bargain_max_amount: bargainMaxAmount.value || 20,
				bargain_percentage: bargainPercentage.value || 1,
				bargain_decrease_rate: bargainDecreaseRate.value || 0.8,
				bargain_popup_image: bargainPopupImage.value || '',
				bargain_popup_text: bargainPopupText.value || '',
				bargain_amount_text: bargainAmountText.value || '',
				bargain_end_time: bargainEndTimeValue.value 
					? new Date(bargainEndTimeValue.value.replace(' ', 'T')).getTime()
					: null
			})
			
			console.log('砂价参数:', {
				enable_bargain: true,
				bargain_popup_image: bargainPopupImage.value || '',
				bargain_popup_text: bargainPopupText.value || '',
				bargain_amount_text: bargainAmountText.value || ''
			})
		} else {
			Object.assign(params, {
				enable_bargain: false,
				bargain_initial_price: 0,
				bargain_step: 10,
				bargain_mode: 'fixed',
				bargain_min_amount: 5,
				bargain_max_amount: 20,
				bargain_percentage: 1,
				bargain_decrease_rate: 0.8,
				bargain_popup_image: '',
				bargain_popup_text: '',
				bargain_amount_text: '',
				bargain_end_time: null
			})
		}

		return params
	}

	// 修改提交表单方法
	const submitForm = async () => {
		// ===== 立即给予触觉和视觉反馈 =====
		uni.vibrateShort && uni.vibrateShort({ type: 'light' })
		
		// 防止重复提交
		if (isSubmitting.value) {
			console.log('正在提交中，忽略重复点击')
			uni.showToast({
				title: isEditMode.value ? '正在更新中，请稍候...' : '正在发布中，请稍候...',
				icon: 'loading',
				duration: 1500
			})
			return
		}
		
		// 设置提交状态（在验证前设置，确保按钮立即变为禁用状态）
		isSubmitting.value = true
		
		// ===== 第一时间显示模态提示 =====
		uni.showLoading({
			title: isEditMode.value ? '正在更新中，请稍候...' : '正在发布中，请稍候...',
			mask: true // 使用mask防止用户再次点击
		})
		
		// 基础验证（快速失败）
		if (!content.value.trim()) {
			uni.hideLoading()
			isSubmitting.value = false
			uni.showToast({
				title: '请输入内容',
				icon: 'none'
			})
			return
		}
		
		// 检查GPS状态（使用缓存的状态，不重新获取定位）
		if (!gpsChecked.value) {
			uni.hideLoading()
			isSubmitting.value = false
			uni.showModal({
				title: '需要定位权限',
				content: '发布内容需要获取位置信息，请授权定位权限',
				confirmText: '去授权',
				cancelText: '取消',
				success: async (res) => {
					if (res.confirm) {
						showGpsGuide.value = true
					}
				}
			})
			return
		}

		try {
			// ===== 优化1：提前准备图片数据（减少计算时间）=====
			const uploadedImages = prepareImageData()
			
			// 验证图片上传状态
			const uploadingImages = imageList.value.filter(img => img.progress < 100)
			if (uploadingImages.length > 0) {
				uni.showToast({
					title: `还有${uploadingImages.length}张图片正在上传`,
					icon: 'none',
					duration: 2000
				})
				isSubmitting.value = false
				uni.hideLoading()
				return
			}

			
			// ===== 优化2：简化数据构建逻辑 =====
			const params = buildSubmitParams(
				uploadedImages,
				videoInfo.value
			)
					
			console.log('=== 提交表单参数 ===', {
				enableBargain: params.enable_bargain,
				bargainEndTime: params.bargain_end_time,
				bargainEndTimeValue: bargainEndTimeValue.value,
				bargainInitialPrice: params.bargain_initial_price,
				share_cover_image: params.share_cover_image // 添加封面图日志
			})
			
			// 🔍 关键调试：打印完整params对象
			console.log('====== 完整提交参数 ======')
			console.log('shareCoverImage.value:', shareCoverImage.value)
			console.log('params.share_cover_image:', params.share_cover_image)
			console.log('完整params:', JSON.stringify(params, null, 2))
			console.log('==========================')

			// ===== 优化3：添加请求超时处理 =====
			const res = await Promise.race([
				isEditMode.value 
					? articleApi.updateArticle(editArticleId.value, params)
					: articleApi.addArticle(params),
				new Promise((_, reject) => 
					setTimeout(() => reject(new Error('请求超时，请检查网络')), 30000)
				)
			])

			if (res.id || res.code === 0) {
				// ===== 优化：先关闭loading，再显示成功提示，最后跳转 =====
				// 1. 先关闭loading
				uni.hideLoading()
				
				// 2. 显示成功提示（保持在屏幕上1.5秒）
				uni.showToast({
					title: isEditMode.value ? '更新成功' : '发布成功',
					icon: 'success',
					duration: 1500,
					mask: true // 防止用户在跳转前再次点击
				})
				
				// 3. 等待成功提示显示完整后再跳转
				setTimeout(() => {
					// 发布成功后跳转到首页并刷新
					uni.reLaunch({
						url: `/pages/index/index?refresh=true&timestamp=${Date.now()}`,
						success: () => {
							console.log('跳转到首页并刷新')
							// 重置提交状态
							isSubmitting.value = false
						}
					})
				}, 1500)
			} else {
				// 发布失败，关闭loading
				uni.hideLoading()
				// 重置提交状态
				isSubmitting.value = false
				throw new Error(res.message || (isEditMode.value ? '更新失败' : '发布失败'))
			}
		} catch (err) {
			console.error(isEditMode.value ? '更新失败:' : '发布失败:', err)
			
			// 确保loading已关闭
			uni.hideLoading()
			
			// 更友好的错误提示
			let errorMsg = err.message || (isEditMode.value ? '更新失败' : '发布失败')
			if (errorMsg.includes('timeout') || errorMsg.includes('超时')) {
				errorMsg = '网络请求超时，请检查网络后重试'
			} else if (errorMsg.includes('network') || errorMsg.includes('网络')) {
				errorMsg = '网络连接失败，请检查网络设置'
			}
			
			uni.showToast({
				title: errorMsg,
				icon: 'none',
				duration: 3000
			})
			
			// 重置提交状态
			isSubmitting.value = false
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
		// 先隐藏键盘，再延迟显示，避免闪烁问题
		uni.hideKeyboard && uni.hideKeyboard()
		
		setTimeout(() => {
			textareaFocus.value = true
			
			// 添加光标位置设置 - 默认光标移到内容末尾
			if (content.value) {
				selectionStart.value = content.value.length
				selectionEnd.value = content.value.length
			}
			
			// 滚动到可视区域，确保输入区域在键盘上方
			adjustScrollPosition()
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
		console.log('组件已挂载')
		isInSelectionMode.value = false
		
		// 如果不是编辑模式，则获取分类
		if (!isEditMode.value) {
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
		}
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
		if (url.includes('default.png')) return false;
		
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

	// 处理文本框焦点事件
	const handleTextareaFocus = () => {
		textareaFocus.value = true
		// 调整滚动位置确保输入区域可见
		adjustScrollPosition()
	}

	// 处理文本框行数变化
	const handleLineChange = (e) => {
		// 获取当前行数
		const lineCount = e.detail.lineCount || 1;
		const minHeight = 170; // 最小高度 170rpx
		const lineHeight = 40; // 每行大约40rpx
		const maxHeight = 800; // 最大高度限制
		
		// 计算理想高度：每行40rpx，加上上下padding各20rpx
		let idealHeight = Math.max(minHeight, (lineCount * lineHeight) + 40);
		
		// 限制最大高度
		idealHeight = Math.min(idealHeight, maxHeight);
		
		// 只有当高度变化显著时才调整位置
		if (Math.abs(inputHeight.value - idealHeight) > 10) {
			inputHeight.value = idealHeight;
			
			// 使用节流函数延迟调用adjustScrollPosition
			clearTimeout(window.scrollAdjustTimer);
			window.scrollAdjustTimer = setTimeout(() => {
				adjustScrollPosition();
			}, 100);
		}
	}
	
	// 启用光标拖动模式
	const enableCursorDrag = (e) => {
		// 确保文本区域获得焦点
		textareaFocus.value = true
		
		// 设置为选择模式
		isInSelectionMode.value = true
		
		// 简单提示用户
		uni.showToast({
			title: '长按选择文本进行编辑',
			icon: 'none',
			duration: 1500
		})
		
		// 阻止默认行为，防止虚拟键盘弹出
		setTimeout(() => {
			uni.hideKeyboard && uni.hideKeyboard()
		}, 100)
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
			
					// 获取图片URL，使用域名修复函数
			const iconURL = fixImageUrl(uploadResult.fileURL);
			
			// 更新数据库中的分类图标URL（只保存一个url字段）
			if (currentEditingCategory._id) {
				try {
					// 尝试调用云函数更新图标
					const updateResult = await extStorageCo.updateCategoryIcon({
						categoryId: currentEditingCategory._id, 
						iconURL
					}).catch(err => {
						console.warn('云函数updateCategoryIcon可能未部署或不可用:', err);
						return { updated: false, error: err.message };
					});
					
					// 如果云函数调用成功
					if (updateResult && updateResult.updated) {
						console.log('更新分类图标结果:', updateResult);
						
						// 更新本地分类图标，使用域名修复函数
						currentEditingCategory.icon = fixImageUrl(iconURL);
						currentEditingCategory.cate_img = fixImageUrl(iconURL);
					
						// 关闭自定义面板
						iconCustomizing.value = false;
						
						uni.showToast({
							title: '图标保存成功',
							icon: 'success'
						});
					} else {
						// 云函数未能正确执行，但我们仍然更新本地图标
						console.warn('更新分类图标未成功，但图标已生成:', {iconURL, thumbnailURL});
						
						// 更新本地分类图标，使用域名修复函数
						currentEditingCategory.icon = fixImageUrl(iconURL);
						currentEditingCategory.cate_img = fixImageUrl(iconURL);
						currentEditingCategory.cate_img_thumbnail = fixImageUrl(thumbnailURL);
						
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
					
					// 更新本地分类图标，使用域名修复函数
					currentEditingCategory.icon = fixImageUrl(iconURL);
					currentEditingCategory.cate_img = fixImageUrl(iconURL);
					currentEditingCategory.cate_img_thumbnail = fixImageUrl(thumbnailURL);
					
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
			try {
				// 使用新的API获取设备信息
				const windowInfo = uni.getWindowInfo();
				const windowHeight = windowInfo.windowHeight;
				const windowWidth = windowInfo.windowWidth;
				const keyboardHeight = windowHeight * 0.4; // 键盘高度约为屏幕高度的40%
				
				// 获取输入区域信息
				uni.createSelectorQuery()
					.select('.content-area')
					.boundingClientRect(rect => {
						if (!rect) return;
						
						// 计算输入区域底部到屏幕顶部的距离
						const inputBottom = rect.top + rect.height;
						
						// 计算理想的输入区域位置
						// 让输入区域底部位于键盘上方，留出一定空间(100rpx)
						const idealPosition = inputBottom - (windowHeight - keyboardHeight) + (100 * (windowWidth / 750));
						
						// 只有当输入区域被键盘遮挡时才滚动
						if (idealPosition > 0) {
							// 获取当前页面滚动位置
							let currentScrollTop = 0;
							const pages = getCurrentPages();
							const currentPage = pages[pages.length - 1];
							if (currentPage && currentPage.$page) {
								currentScrollTop = currentPage.$page.scrollTop || 0;
							}
							
							// 计算新的滚动位置，确保平滑过渡
							const newScrollTop = currentScrollTop + idealPosition;
							
							// 执行滚动，使用较短的动画时间
							uni.pageScrollTo({
								scrollTop: newScrollTop,
								duration: 200, // 减少动画时间提高响应速度
								success: () => {
									// 滚动完成后，确保光标可见
									nextTick(() => {
										// 如果需要，微调滚动位置
										const finalAdjustment = 50; // 额外的微调距离
										if (idealPosition > windowHeight / 3) {
											uni.pageScrollTo({
												scrollTop: newScrollTop + finalAdjustment,
												duration: 100
											});
										}
									});
								}
							});
						}
					})
					.exec();
				
			} catch (err) {
				console.error('调整滚动位置失败:', err);
			}
		});
	}

	// 插入文本到光标位置
	const insertTextAtCursor = (textToInsert) => {
		if (!content.value) content.value = ''
		
		// 插入文本
		const before = content.value.substring(0, selectionStart.value)
		const after = content.value.substring(selectionEnd.value)
		content.value = before + textToInsert + after
		
		// 更新光标位置 - 移动到插入的文本之后
		const newPosition = selectionStart.value + textToInsert.length
		
		// 延迟更新光标位置，确保内容已更新
		nextTick(() => {
			selectionStart.value = newPosition
			selectionEnd.value = newPosition
			
			// 确保文本区域仍然具有焦点
			textareaFocus.value = true
	  
			// 触发输入高度变化检测
			handleLineChange({ detail: { lineCount: content.value.split('\n').length } })
		})
	}
	
	// 添加一个保存光标位置的处理函数
	const handleSelectionChange = (e) => {
		if (e.detail) {
			// 记录选区位置
			selectionStart.value = e.detail.selectionStart || 0
			selectionEnd.value = e.detail.selectionEnd || 0
			
			// 如果有选中内容，显示字数
			if (selectionStart.value !== selectionEnd.value) {
				// 已经显示在界面中
			}
		}
	}
	
	// 应用自定义选择样式 - 例如在选择的文本下方添加细线
	const applyCustomSelectionStyle = () => {
		// 为了更好地兼容性，这只是一个占位函数
		// 实际样式通过CSS和class控制
		
		// 在微信小程序环境中，可以考虑使用覆盖层或其他视觉指示
		
		// 注意：某些平台可能不支持复杂的DOM操作或CSS自定义
		
		// 在这里，我们主要依赖于CSS和类来添加视觉区分
		console.log('应用自定义选择样式')
	}

	// 插入常用短语
	const insertCommonPhrase = (phrase) => {
		insertTextAtCursor(phrase)
		// 插入后自动关闭工具栏
		showFormatToolbar.value = false
	}

	// 清空全部内容
	const clearContent = () => {
		uni.showModal({
			title: '提示',
			content: '确定要清空全部内容吗？',
			success: (res) => {
				if (res.confirm) {
					content.value = ''
					// 聚焦到输入框
					textareaFocus.value = true
				}
			}
		})
	}

	// 切换表情面板显示
	const toggleEmojiPanel = () => {
		showEmojiPanel.value = !showEmojiPanel.value
		if (showEmojiPanel.value) {
			// 关闭格式工具栏
			showFormatToolbar.value = false
		}
	}

	// 插入表情符号
	const insertEmoji = (emoji) => {
		insertTextAtCursor(emoji)
	}

	// 选择表情分组
	const selectEmojiGroup = (index) => {
		currentEmojiGroupIndex.value = index
	}

	// 增强文本选择的焦点和选择控制
	const enhanceTextareaSelection = (e) => {
	  try {
	    // 确保内容区域可见
	    adjustScrollPosition()
	    
	    // 判断是否需要显示键盘
	    const shouldShowKeyboard = e && e.type === 'click'
	    
	    if (shouldShowKeyboard) {
	      textareaFocus.value = true
	    }
	    
	    // 记录文本区域位置用于后续精确选择
	    if (e && (e.type === 'touchstart' || e.type === 'click')) {
	      // 在小程序中获取元素信息
	      uni.createSelectorQuery()
	        .select('.content-input')
	        .boundingClientRect(data => {
	          if (data) {
	            // 记录文本区域的位置和尺寸信息
	            textAreaRect.value = {
	              left: data.left,
	              top: data.top,
	              width: data.width,
	              height: data.height
	            }
	          }
	        })
	        .exec()
	    }
	  } catch (err) {
	    console.log('增强文本选择失败', err)
	  }
	}

	// 将长按变成精确选择模式
	const enablePreciseSelection = (e) => {
	  // 防止默认长按菜单
	  e.preventDefault && e.preventDefault()
	  
	  // 显示自定义菜单
	  uni.showActionSheet({
	    itemList: ['全选', '复制', '粘贴', '清空'],
	    success: (res) => {
	      switch(res.tapIndex) {
	        case 0: // 全选
	          // 选择全部文本
	          selectionStart.value = 0
	          selectionEnd.value = content.value.length
	          
	          // 确保文本区域获得焦点
	          textareaFocus.value = true
	          
	          uni.showToast({
	            title: '已全选',
	            icon: 'none',
	            duration: 1000
	          })
	          break
	          
	        case 1: // 复制
	          if (selectionStart.value !== selectionEnd.value) {
	            // 复制选中内容到剪贴板
	            const selectedText = content.value.substring(selectionStart.value, selectionEnd.value)
	            uni.setClipboardData({
	              data: selectedText,
	              success: () => {
	                uni.showToast({
	                  title: '已复制',
	                  icon: 'success',
	                  duration: 1000
	                })
	              }
	            })
	          } else if (content.value) {
	            // 全部复制
	            uni.setClipboardData({
	              data: content.value,
	              success: () => {
	                uni.showToast({
	                  title: '已复制全部内容',
	                  icon: 'success',
	                  duration: 1000
	                })
	              }
	            })
	          } else {
	            uni.showToast({
	              title: '无内容可复制',
	              icon: 'none',
	              duration: 1000
	            })
	          }
	          break
	          
	        case 2: // 粘贴
	          // 从剪贴板获取内容并粘贴
	          uni.getClipboardData({
	            success: (res) => {
	              if (res.data) {
	                // 在当前光标位置插入剪贴板内容
	                insertTextAtCursor(res.data)
	                
	                uni.showToast({
	                  title: '已粘贴',
	                  icon: 'success',
	                  duration: 1000
	                })
	              } else {
	                uni.showToast({
	                  title: '剪贴板为空',
	                  icon: 'none',
	                  duration: 1000
	                })
	              }
	            }
	          })
	          break
	          
	        case 3: // 清空
	          // 清空确认
	          uni.showModal({
	            title: '提示',
	            content: '确定要清空全部内容吗？',
	            success: (res) => {
	              if (res.confirm) {
	                content.value = ''
	                
	                // 重新获取焦点
	                setTimeout(() => {
	                  textareaFocus.value = true
	                }, 100)
	              }
	            }
	          })
	          break
	      }
	    }
	  })
	}

	// 退出选择模式
	const exitSelectionMode = () => {
	  // 清除选择模式标志
	  isInSelectionMode.value = false
	  
	  // 通知用户
	  uni.showToast({
	    title: '选择已完成',
	    icon: 'none',
	    duration: 1500
	  })
	}

	// 根据点击位置计算光标位置
	const getCursorPositionFromPoint = (x, y, text) => {
	  // uni-app环境中可能没有直接访问document对象
	  // 创建临时元素来估算光标位置
	  try {
	    // 通过selectQuery获取textarea元素
	    uni.createSelectorQuery()
	      .select('.content-input')
	      .node(res => {
	        if (!res || !res.node) return 0
	        
	        // 获取容器节点作为参考
	        const textNode = res.node
	        
	        // 创建临时文本计算工具
	        const getPositionFromText = (text, relX, relY) => {
	          // 文本不存在则返回0
	          if (!text) return 0
	          
	          // 使用字符平均宽度进行估算
	          const avgCharWidth = 14 // 假设的平均字符宽度，28rpx约等于14px
	          const lineHeight = 21 // 1.5行高 * 14px
	          
	          // 计算点击位置大致对应的字符索引
	          const approxLine = Math.floor(relY / lineHeight)
	          const lineWidth = textNode.offsetWidth || 300 // 假设宽度
	          const charsPerLine = Math.floor(lineWidth / avgCharWidth)
	          
	          // 基于行数和相对X位置计算索引
	          let approxIndex = (approxLine * charsPerLine) + Math.floor(relX / avgCharWidth)
	          
	          // 确保索引在有效范围内
	          approxIndex = Math.max(0, Math.min(approxIndex, text.length))
	          
	          // 尝试找到最接近的字符边界
	          // 特别是对于CJK文字，可能需要更复杂的逻辑
	          return approxIndex
	        }
	        
	        // 获取相对于文本区的坐标
	        uni.createSelectorQuery()
	          .select('.content-input')
	          .boundingClientRect(data => {
	            if (data) {
	              const relX = x - data.left
	              const relY = y - data.top
	              
	              // 计算估算位置
	              const position = getPositionFromText(text, relX, relY)
	              
	              // 设置选中位置
	              selectionStart.value = position
	              selectionEnd.value = position
	              
	              // 直接应用到文本区
	              if (textNode.setSelectionRange) {
	                textNode.setSelectionRange(position, position)
	                // 保存引用
	                textareaElement.value = textNode
	              }
	            }
	          })
	          .exec()
	      })
	      .exec()
	    
	    // 如果没法获取到正确位置，返回一个估计值
	    return Math.min(text.length, Math.max(0, selectionStart.value))
	  } catch (e) {
	    console.error('光标位置计算失败:', e)
	    return 0 // 失败时返回开始位置
	  }
	}

	// 打开文本精确选择模式
	const openPreciseTextSelection = () => {
	  try {
	    // 使用微信小程序/uni提供的可能API
	    uni.showActionSheet({
	      itemList: ['精确选择文本'],
	      success: () => {
	        // 启用精确选择模式
	        uni.showToast({
	          title: '已启用精确选择',
	          icon: 'none',
	          duration: 1500
	        })
	        
	        // 设置系统选择模式为可选择
	        setTimeout(() => {
	          textareaFocus.value = true
	          
	          // 使用更专业的方法设置光标可选择模式
	          if (typeof plus !== 'undefined' && plus.webview) {
	            const currentWebview = plus.webview.currentWebview()
	            if (currentWebview.setStyle) {
	              currentWebview.setStyle({
	                softinputMode: 'adjustResize', // 确保软键盘不遮挡
	                userSelect: 'text' // 允许用户选择文本
	              })
	            }
	          }
	        }, 100)
	      }
	    })
	  } catch (e) {
	    console.error('无法启用精确文本选择:', e)
	    // 回退到基本选择方式
	    textareaFocus.value = true
	  }
	}

	// 记录文本区域位置的响应式变量
	const textAreaRect = ref({ left: 0, top: 0, width: 0, height: 0 })

	// 添加图片预览方法，使用域名修复
	const previewImage = (index) => {
		if (!imageList.value[index]) return
		
		// 使用域名修复函数处理图片URL - 优先使用url字段
		const images = imageList.value.map(img => {
			const imageUrl = img.url || img.fileURL || img.thumbnailURL;
			return fixImageUrl(imageUrl);
		});
		previewImageIndex.value = index
		
		// 使用uni-app的预览图片API
		uni.previewImage({
			current: index,
			urls: images,
			indicator: 'number',
			loop: true,
			success: () => {
				console.log('图片预览成功')
			},
			fail: (err) => {
				console.error('图片预览失败', err)
				// 预览失败时的备选方案，使用域名修复
				showImagePreview.value = true
				currentPreviewImage.value = fixImageUrl(images[index])
			}
		})
	}
	
	
		
	// 关闭图片预览
	const closeImagePreview = () => {
		showImagePreview.value = false
		currentPreviewImage.value = ''
	}
	
	// 刷新分类数据（包括二级标签）
	const refreshCategoryData = async () => {
		try {
			console.log('刷新分类数据...')
			
			uni.showLoading({
				title: '刷新中...',
				mask: true
			})
			
			// 获取当前位置
			const currentLng = preciseLocationInfo.value?.longitude || 112.5
			const currentLat = preciseLocationInfo.value?.latitude || 37.5
			
			// 重新获取分类数据
			const res = await articleApi.addReady(`${currentLng},${currentLat}`)
			console.log('刷新分类数据成功:', res)
			
			if (res && res.cateList) {
				// 更新分类列表
				categoryList.value = res.cateList.map(cate => {
					return {
						...cate,
						icon: fixImageUrl(cate.cate_img || getDefaultCategoryIcon(cate.cate_name))
					}
				})
				
				// 如果当前选中的分类仍然存在，保持选中状态
				if (selectedCategory.value) {
					const currentSelectedIndex = categoryList.value.findIndex(cate => cate._id === selectedCategory.value)
					if (currentSelectedIndex !== -1) {
						cateIndex.value = currentSelectedIndex
					} else {
						// 如果原选中的分类不存在了，选中第一个
						cateIndex.value = 0
						selectedCategory.value = categoryList.value[0]?._id
					}
				}
				
				console.log('分类数据刷新完成，当前选中分类:', categoryList.value[cateIndex.value])
				
				uni.showToast({
					title: '刷新成功',
					icon: 'success',
					duration: 1500
				})
				
				return true
			} else {
				uni.showToast({
					title: '没有获取到分类数据',
					icon: 'none'
				})
				return false
			}
			
		} catch (error) {
			console.error('刷新分类数据失败:', error)
			uni.showToast({
				title: '刷新失败',
				icon: 'none'
			})
			return false
		} finally {
			uni.hideLoading()
		}
	}
	

</script>

<template>
	<view class="add">
		<!-- GPS权限引导界面 -->
		<view class="gps-guide-overlay" v-if="showGpsGuide">
			<view class="gps-guide-content">
				<view class="guide-icon">
					<uni-icons type="location-filled" size="80" color="#ff9800"></uni-icons>
				</view>
				<view class="guide-title">需要开启GPS定位权限</view>
				<view class="guide-desc">
					发布内容需要获取您的位置信息，请下拉手机打开GPS权限再试。
				</view>
				<!-- 按钮区域：放置在弹窗内部 -->
				<view class="guide-actions">
					<view class="action-btn home-btn" @click="goToHome">
						<uni-icons type="home" size="20" color="#fff"></uni-icons>
						<text>返回首页</text>
					</view>
					<view class="action-btn refresh-btn" @click="refreshPage">
						<uni-icons type="refreshempty" size="20" color="#fff"></uni-icons>
						<text>刷新页面</text>
					</view>
				</view>
			</view>
		</view>

		<!-- 分类选择，仅在有真实分类时显示 -->
		<view class="category" v-if="categoryList.length > 0 && categoryList[0]._id !== 'default'">
			<view class="category-header">
				<text class="label">所属地区</text>
				<text class="location-address-inline" v-if="locationInfo && locationInfo.address">({{ getSimplifiedAddress(locationInfo.address) }})</text>
				<view class="refresh-category-btn" @click="refreshCategoryData" title="刷新分类数据">
					<uni-icons type="refresh" size="14" color="#2196F3"></uni-icons>
				</view>
			</view>
			
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
			<view class="category-selection-wrapper">
				<view class="category-grid">
					
					<view 
						v-for="(item, index) in categoryList" 
						:key="index" 
						class="category-item" 
						:class="{ 'active': index === cateIndex, 'location-based': item.is_location_based }"
						@click="selectCategory(index)"
					>
						<view class="category-icon">
							<!-- 使用分类图标，应用域名修复 -->
							<image :src="fixImageUrl(item.icon)" mode="aspectFit" class="category-image"></image>
							<!-- 选中状态指示器 -->
							<view class="selected-indicator" v-if="index === cateIndex">
								<uni-icons type="checkmarkempty" size="16" color="#fff"></uni-icons>
							</view>
						</view>
						<view class="category-name-container">
							
							<!-- 修改位置标记，移除图标只显示文本 -->
							<view class="location-badge" v-if="item.is_location_based">
								<!-- 移除图标 -->
							</view>
							<text class="category-name">{{ item.cate_name }}</text>
						</view>
					</view>
				</view>
				</view>
			
			

			
		</view>

		<!-- 重试按钮，位于页面中间位置 -->
		<view v-if="categoryList.length === 0 || categoryList[0]._id === 'default'" 
			  class="retry-btn-center" @click="retryGetCategories">
			<uni-icons type="refresh" size="18" color="#2196F3"></uni-icons>
			<text class="retry-text">默认未知区域</text>
		</view>

		<!-- 优化文本输入区域 -->
		<view class="content-wrapper">
			<view class="content-area" :style="{ minHeight: inputHeight + 'rpx' }">
				
				<textarea 
					v-model="content" 
					placeholder="分享新鲜事..." 
					class="content-input"
					maxlength="2000"
					auto-height
					:adjust-position="false"
					show-confirm-bar="false"
					confirm-type="done"
					cursor-spacing="120"
					:focus="textareaFocus"
					ref="contentTextarea"
					@blur="textareaFocus = false"
					@focus="handleTextareaFocus"
					:disable-default-padding="true"
					:hold-keyboard="false"
					:selection-start="selectionStart"
					:selection-end="selectionEnd"
					@confirm="() => {}"
					@linechange="handleLineChange"
					@input="handleLineChange"
					@selectionchange="handleSelectionChange"
					@longpress="enablePreciseSelection"
					@touchstart="enhanceTextareaSelection"
					@click="enhanceTextareaSelection"
				/>
				
				<!-- 底部字数统计和功能按钮 -->
				<view class="content-footer">
					<text class="word-count">{{ content.length }}/2000</text>
					
					<!-- 文本操作工具栏 -->
					<view class="text-toolbar">
						<view class="toolbar-btn" @click="enablePreciseSelection">
							<uni-icons type="more-filled" size="16" color="#666"></uni-icons>
							
						</view>
					</view>
				</view>
			</view>
		</view>

		<!-- 修改媒体上传区域 -->
		<view class="media-section">
			<!-- 图片上传区域 -->
			<view class="images">
				
				<view class="image-list">
					<view v-for="(image, index) in imageList" :key="index" class="image-item">
						<image 
							:src="fixImageUrl(image.url || image.fileURL || image.thumbnailURL)" 
							mode="aspectFill" 
							@click="previewImage(index)"
							@error="() => deleteImage(index)"
						/>
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
				<text class="tip">可无限上传图片，点击图片可放大查看</text>
			</view>
		</view>

		<!-- 视频链接区域 -->
		<view class="video-section">
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
							placeholder="输入视频链接后自动保存" 
							class="link-input"
							confirm-type="done"
							maxlength="5000"
							@input="handleVideoLinkInput"
						/>
					</view>
				</view>
				<text class="tip">支持快手平台视频链接，粘贴后自动去除URL参数，保存纯净地址</text>
			</view>
		</view>
		
		<!-- 分享封面图上传区域 -->
		<view class="share-cover-section">
			<view class="section-header">
				<text class="section-title">分享封面图（可选）</text>
				<text class="section-desc">上传后分享时优先使用</text>
			</view>
			
			<view class="share-cover-content">
				<!-- 已上传的封面图 -->
				<view v-if="shareCoverImage" class="cover-preview">
					<image 
						:src="fixImageUrl(shareCoverImage)" 
						mode="aspectFill" 
						class="cover-image"
						@click="() => { uni.previewImage({ current: 0, urls: [fixImageUrl(shareCoverImage)] }) }"
					/>
					<view class="delete-btn" @click="deleteShareCover">
						<uni-icons type="close" size="20" color="#fff"></uni-icons>
					</view>
					<view class="cover-badge">
						<uni-icons type="checkmarkempty" size="14" color="#fff"></uni-icons>
						<text>已设置</text>
					</view>
				</view>
				
				<!-- 上传按钮 -->
				<view v-else class="upload-cover-btn" @click="chooseAndUploadShareCover">
					<view v-if="shareCoverImageUploading" class="uploading-state">
						<view class="progress-ring">
							<text class="progress-text">{{shareCoverImageProgress.toFixed(0)}}%</text>
						</view>
						<text class="uploading-tip">上传中...</text>
					</view>
					<view v-else class="upload-placeholder">
						<uni-icons type="image" size="40" color="#999"></uni-icons>
						<text class="upload-text">点击上传封面图</text>
						<text class="upload-tip">建议尺寸 750x600</text>
					</view>
				</view>
			</view>
			
			<text class="tip">不上传封面图则自动生成海报作为分享封面</text>
		</view>

		<!-- 砍价设置区域（仅管理员可见） -->
		<view class="bargain-section" v-if="isAdmin">
			<view class="section-header">
				<text class="section-title">砍价活动</text>
				<switch :checked="enableBargain" @change="handleBargainSwitch" color="#2196F3" />
			</view>
			
			<view class="bargain-settings" v-if="enableBargain">
				<!-- 起始金额设置 -->
				<view class="setting-item">
					<text class="setting-label">起始金额（元）</text>
					<input 
						v-model.number="bargainInitialPrice" 
						type="digit" 
						placeholder="请输入起始金额" 
						class="setting-input"
						maxlength="10"
					/>
				</view>
				
				<!-- 结束时间设置 -->
				<view class="setting-item time-setting">
					<text class="setting-label">结束时间</text>
					<view class="time-picker-wrapper">
						<!-- 自定义时间选择显示区域 -->
						<view class="custom-time-display" @tap="openCustomTimePicker">
							<view class="time-content">
								<uni-icons type="calendar" size="18" color="#667eea"></uni-icons>
								<text v-if="bargainEndTime" class="time-text">{{ bargainEndTime }}</text>
								<text v-else class="placeholder-text">点击选择结束时间</text>
							</view>
							<uni-icons type="forward" size="14" color="#999"></uni-icons>
						</view>
						<!-- 清除按钮 -->
						<view class="clear-time-btn" v-if="bargainEndTime" @tap.stop="clearEndTime">
							<uni-icons type="close-filled" size="20" color="#999"></uni-icons>
						</view>
					</view>
				</view>
				
				<!-- 砍价策略选择 -->
				<view class="setting-item mode-selector">
					<text class="setting-label">砍价模式</text>
					<view class="mode-tabs">
						<view 
							class="mode-tab" 
							:class="{ 'active': bargainMode === 'fixed' }"
							@click="handleBargainModeChange({ detail: { value: 'fixed' } })"
						>
							<text>固定金额</text>
						</view>
						<view 
							class="mode-tab" 
							:class="{ 'active': bargainMode === 'random' }"
							@click="handleBargainModeChange({ detail: { value: 'random' } })"
						>
							<text>随机金额</text>
						</view>
						<view 
							class="mode-tab" 
							:class="{ 'active': bargainMode === 'decrease' }"
							@click="handleBargainModeChange({ detail: { value: 'decrease' } })"
						>
							<text>递减模式</text>
						</view>
						<view 
							class="mode-tab" 
							:class="{ 'active': bargainMode === 'percentage' }"
							@click="handleBargainModeChange({ detail: { value: 'percentage' } })"
						>
							<text>百分比模式</text>
						</view>
					</view>
				</view>
				
				<!-- 固定金额模式配置 -->
				<view class="mode-config" v-if="bargainMode === 'fixed'">
					<view class="setting-item">
						<text class="setting-label">每次砍价（元）</text>
						<input 
							v-model.number="bargainStep" 
							type="digit" 
							placeholder="默认10元" 
							class="setting-input"
							maxlength="10"
						/>
					</view>
					<view class="mode-description">
						<uni-icons type="info" size="14" color="#999"></uni-icons>
						<text>每人每次砍价的金额固定不变，简单明确</text>
					</view>
				</view>
				
				<!-- 随机金额模式配置 -->
				<view class="mode-config" v-if="bargainMode === 'random'">
					<view class="setting-item">
						<text class="setting-label">最小金额（元）</text>
						<input 
							v-model.number="bargainMinAmount" 
							type="digit" 
							placeholder="默认1元" 
							class="setting-input"
							maxlength="10"
						/>
					</view>
					<view class="setting-item">
						<text class="setting-label">最大金额（元）</text>
						<input 
							v-model.number="bargainMaxAmount" 
							type="digit" 
							placeholder="默认5元" 
							class="setting-input"
							maxlength="10"
						/>
					</view>
					<view class="mode-description">
						<uni-icons type="info" size="14" color="#999"></uni-icons>
						<text>每次砍价金额在设定范围内随机生成，增加趣味性</text>
					</view>
				</view>
				
				<!-- 递减模式配置 -->
				<view class="mode-config" v-if="bargainMode === 'decrease'">
					<view class="setting-item">
						<text class="setting-label">首次砍价（元）</text>
						<input 
							v-model.number="bargainStep" 
							type="digit" 
							placeholder="首次砍价金额" 
							class="setting-input"
							maxlength="10"
						/>
					</view>
					<view class="setting-item">
						<text class="setting-label">递减比例</text>
						<picker mode="selector" :range="[0.9, 0.85, 0.8, 0.75, 0.7]" :value="[0.9, 0.85, 0.8, 0.75, 0.7].indexOf(bargainDecreaseRate)" @change="(e) => bargainDecreaseRate = [0.9, 0.85, 0.8, 0.75, 0.7][e.detail.value]">
							<view class="picker-display">
								<text>{{ ((1 - bargainDecreaseRate) * 100).toFixed(0) }}% 递减</text>
								<uni-icons type="bottom" size="14" color="#999"></uni-icons>
							</view>
						</picker>
					</view>
					<view class="mode-description">
						<uni-icons type="info" size="14" color="#999"></uni-icons>
						<text>每次在递减后的基准金额±30%范围内随机，既有递减趋势又有惊喜</text>
					</view>
				</view>
				
				<!-- 百分比模式配置 -->
				<view class="mode-config" v-if="bargainMode === 'percentage'">
					<view class="setting-item">
						<text class="setting-label">砍价百分比（%）</text>
						<input 
							v-model.number="bargainPercentage" 
							type="digit" 
							placeholder="每次砍掉原价的X%" 
							class="setting-input"
							maxlength="5"
						/>
					</view>
					<view class="mode-description">
						<uni-icons type="info" size="14" color="#999"></uni-icons>
						<text>每次砍掉原价的固定百分比，适合不同价位商品</text>
					</view>
				</view>
				
				<!-- 弹窗图片设置 -->
				<view class="setting-item image-upload-item">
					<text class="setting-label">弹窗图片</text>
					<view class="image-upload-section">
						<view class="image-preview" v-if="bargainPopupImage" @click="handleImagePreview">
							<image :src="bargainPopupImage" mode="aspectFit" class="preview-img"></image>
							<view class="image-actions">
								<view class="action-icon" @click.stop="handleChooseImage">
									<uni-icons type="images" size="20" color="#fff"></uni-icons>
								</view>
								<view class="action-icon" @click.stop="handleDeleteImage">
									<uni-icons type="trash" size="20" color="#fff"></uni-icons>
								</view>
							</view>
						</view>
						<view class="upload-btn" v-else @click="handleChooseImage">
							<uni-icons type="camera" size="32" color="#999"></uni-icons>
							<text class="upload-text">上传弹窗图片</text>
							<text class="upload-tip">建议尺寸 400x400</text>
						</view>
					</view>
				</view>
				
				<!-- 弹窗文字设置 -->
				<view class="setting-item text-input-item">
					<text class="setting-label">弹窗文字</text>
					<textarea 
						v-model="bargainPopupText" 
						placeholder="请输入弹窗底部文字内容，例如：恭喜你成功砂价，快分享给好友吧！" 
						class="text-input"
						maxlength="100"
						auto-height
					></textarea>
					<text class="text-count">{{ bargainPopupText.length }}/100</text>
				</view>
								
				<!-- 弹窗金额提示文字设置 -->
				<view class="setting-item text-input-item">
					<text class="setting-label">金额提示文字</text>
					<textarea 
						v-model="bargainAmountText" 
						placeholder="可自定义金额部分显示的文字，留空则显示默认金额" 
						class="text-input"
						maxlength="50"
						auto-height
					></textarea>
					<text class="text-count">{{ bargainAmountText.length }}/50</text>
					<text class="field-tip">例如：恭喜发财、大吉大利、财运亨通等</text>
				</view>
				
				<!-- 预览提示 -->
				<view class="bargain-preview" v-if="bargainInitialPrice > 0">
					<view class="preview-header">
						<uni-icons type="eye" size="16" color="#2196F3"></uni-icons>
						<text class="preview-title">预览效果</text>
					</view>
					<text class="preview-text">起始价：¥{{ bargainInitialPrice.toFixed(2) }}</text>
					<text class="preview-text highlight">{{ getPreviewBargainAmount }}</text>
				</view>
				
				<text class="tip">开启砍价后，用户可帮忙砍价，每人每天最多砍3次</text>
			</view>
		</view>

		<!-- 发布按钮 -->
		<view class="publish">
			<button 
				class="publish-btn" 
				:class="{ 'disabled': isSubmitting }"
				:disabled="isSubmitting"
				@click="submitForm"
			>
				<text v-if="!isSubmitting">{{ isEditMode ? '更新' : '发布' }}</text>
				<text v-else>
					<uni-icons type="spinner-cycle" size="16" color="#fff" class="loading-icon"></uni-icons>
					{{ isEditMode ? '更新中...' : '发布中...' }}
				</text>
			</button>
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
					<image 
						:src="fixImageUrl(previewImageUrl)" 
						mode="aspectFit" 
						class="preview-image"
						@error="() => { uni.showToast({ title: '图片加载失败', icon: 'none' }); cancelCustomize(); }"
					></image>
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
		
		<!-- 表情符号面板 -->
		<view class="emoji-panel" v-if="showEmojiPanel">
			<view class="emoji-header">
				<text class="emoji-title">插入表情</text>
				<view class="emoji-close" @click="showEmojiPanel = false">
					<uni-icons type="close" size="20" color="#666"></uni-icons>
				</view>
			</view>
			
			<view class="emoji-tabs">
				<view 
					v-for="(group, index) in emojiGroups" 
					:key="index" 
					class="emoji-tab" 
					:class="{'active': currentEmojiGroupIndex === index}"
					@click="selectEmojiGroup(index)"
				>
					{{ group.name }}
				</view>
			</view>
			
			<view class="emoji-content">
				<view class="emoji-list">
					<view 
						v-for="emoji in emojiGroups[currentEmojiGroupIndex].emojis" 
						:key="emoji" 
						class="emoji-item"
						@click.stop="insertEmoji(emoji)"
					>
						{{ emoji }}
					</view>
				</view>
			</view>
		</view>

		<!-- 添加图片预览弹窗 (备用方案) -->
		<view class="image-preview-overlay" v-if="showImagePreview" @click="closeImagePreview">
			<view class="image-preview-container" @click.stop>
				<image 
					:src="fixImageUrl(currentPreviewImage)" 
					mode="widthFix" 
					class="preview-image"
					@error="() => { uni.showToast({ title: '图片加载失败', icon: 'none' }); closeImagePreview(); }"
				/>
				<view class="preview-close" @click="closeImagePreview">
					<uni-icons type="close" size="24" color="#fff"></uni-icons>
				</view>
			</view>
		</view>
		
		<!-- 自定义时间选择弹窗 -->
		<view class="custom-time-picker-overlay" v-if="showCustomTimePicker" @tap="closeCustomTimePicker">
			<view class="custom-time-picker-panel" @tap.stop>
				<!-- 头部 -->
				<view class="picker-header">
					<text class="header-title">期望结束时间</text>
					<view class="close-btn" @tap="closeCustomTimePicker">
						<uni-icons type="close" size="24" color="#333"></uni-icons>
					</view>
				</view>
				
				<!-- 日期选择区域 -->
				<view class="date-selector">
					<view 
						v-for="(dateOption, index) in dateOptions" 
						:key="index"
						class="date-item"
						:class="{ 'active': selectedDateIndex === index }"
						@tap="selectDate(index)"
					>
						<text>{{ dateOption.label }}</text>
					</view>
				</view>
				
				<!-- 时间段选择区域 -->
				<view class="time-slots-container">
					<view 
						v-for="(slot, index) in timeSlots" 
						:key="index"
						class="time-slot-item"
						:class="{ 'selected': selectedTimeSlot === slot }"
						@tap="selectTimeSlot(slot)"
					>
						<text>{{ slot }}</text>
						<view class="check-icon" v-if="selectedTimeSlot === slot">
							<uni-icons type="checkmarkempty" size="20" color="#ee0a24"></uni-icons>
						</view>
					</view>
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

		// GPS权限引导界面样式
		.gps-guide-overlay {
			position: fixed;
			top: 0;
			left: 0;
			right: 0;
			bottom: 0;
			background-color: rgba(0, 0, 0, 0.7);
			z-index: 9999;
			display: flex;
			align-items: center;
			justify-content: center;
			padding: 40rpx;
			
			.gps-guide-content {
				background-color: #fff;
				border-radius: 24rpx;
				padding: 60rpx 40rpx 40rpx;
				max-width: 600rpx;
				width: 100%;
				box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.2);
				
				.guide-icon {
					display: flex;
					justify-content: center;
					margin-bottom: 32rpx;
					animation: pulse 2s ease-in-out infinite;
				}
				
				.guide-title {
					font-size: 36rpx;
					font-weight: 600;
					color: #333;
					text-align: center;
					margin-bottom: 24rpx;
				}
				
				.guide-desc {
					font-size: 28rpx;
					color: #666;
					line-height: 1.6;
					text-align: center;
					margin-bottom: 40rpx;
				}
				
				// 按钮区域样式 - 在弹窗内部
				.guide-actions {
					display: flex;
					gap: 16rpx;
					width: 100%;
					
					.action-btn {
						flex: 1;
						display: flex;
						align-items: center;
						justify-content: center;
						gap: 8rpx;
						padding: 24rpx;
						border-radius: 12rpx;
						font-size: 28rpx;
						font-weight: 500;
						transition: all 0.3s;
						box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);
						
						&.home-btn {
							background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
							color: #fff;
							
							&:active {
								opacity: 0.8;
								transform: scale(0.98);
							}
						}
						
						&.refresh-btn {
							background: linear-gradient(135deg, #2196F3 0%, #21CBF3 100%);
							color: #fff;
							
							&:active {
								opacity: 0.8;
								transform: scale(0.98);
							}
						}
					}
				}
			}
		}
		
		@keyframes pulse {
			0%, 100% {
				transform: scale(1);
				opacity: 1;
			}
			50% {
				transform: scale(1.1);
				opacity: 0.8;
			}
		}

		// 位置信息显示区域样式
		// 已移除位置信息显示相关样式

		.category {
			display: flex;
			flex-direction: column;

			.category-header {
				display: flex;
				align-items: center;
				margin-bottom: 16rpx;
				flex-wrap: wrap;
				gap: 8rpx;
				
				.refresh-category-btn {
					margin-left: auto;
					padding: 8rpx;
					border-radius: 50%;
					display: flex;
					align-items: center;
					justify-content: center;
					transition: all 0.3s;
					
					&:active {
						background-color: rgba(33, 150, 243, 0.1);
						transform: rotate(180deg);
					}
				}
			}

			.label {
				font-size: 28rpx;
				color: $pyq-text-color-body;
			}
			
			.location-address-inline {
				font-size: 24rpx;
				color: #666;
				margin-left: 8rpx;
				font-weight: normal;
				line-height: 1.3;
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
			
			/* 分类选择包装器 */
			.category-selection-wrapper {
				display: flex;
				gap: 20rpx;
				align-items: flex-start;
				justify-content: center; /* 水平居中 */
				margin: 40rpx auto; /* 垂直居中 */
				max-width: 100%;
			}
			
			/* 分类网格布局样式 */
			.category-grid {
				display: flex;
				flex-wrap: wrap;
				margin: 0 -10rpx;
				padding: 10rpx 0;
				flex: 1;
				min-width: 0;
				justify-content: center; /* 分类项居中排列 */
			}
			

			
			.category-item {
				width: auto; /* 改为自适应宽度 */
				min-width: 120rpx; /* 设置最小宽度 */
				max-width: 200rpx; /* 设置最大宽度 */
				padding: 12rpx 16rpx; /* 优化内边距 */
				box-sizing: border-box;
				display: flex;
				flex-direction: row;
				align-items: center;
				margin: 8rpx;
				background: linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 250, 252, 0.8) 100%); /* 添加渐变背景 */
				border-radius: 20rpx; /* 增加圆角 */
				border: 1px solid rgba(226, 232, 240, 0.8); /* 添加边框 */
				box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04), 0 1rpx 3rpx rgba(0, 0, 0, 0.08); /* 添加阴影 */
				transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); /* 优化过渡效果 */
				
				.category-icon {
					width: 76rpx; /* 微调尺寸 */
					height: 76rpx;
					background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%); /* 渐变背景 */
					border-radius: 18rpx;
					display: flex;
					align-items: center;
					justify-content: center;
					margin-right: 12rpx;
					margin-bottom: 0;
					border: 1.5px solid rgba(226, 232, 240, 0.6); /* 优化边框 */
					transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
					position: relative;
					overflow: hidden;
					box-shadow: 0 2rpx 6rpx rgba(0, 0, 0, 0.06), inset 0 1rpx 0 rgba(255, 255, 255, 0.8); /* 内阴影效果 */
					flex-shrink: 0;
					
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
					justify-content: flex-start; /* 左对齐 */
					flex: 1; /* 占据剩余空间 */
					flex-wrap: nowrap; /* 不换行 */
					gap: 4rpx;
					
					.category-name {
						font-size: 26rpx; /* 微调字体大小 */
						color: #475569; /* 优化文字颜色 */
						text-align: left;
						line-height: 1.3;
						white-space: nowrap;
						overflow: hidden;
						text-overflow: ellipsis;
						font-weight: 500; /* 增加字重 */
						letter-spacing: 0.5px; /* 添加字符间距 */
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
					background: linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(147, 197, 253, 0.05) 100%); /* 选中状态渐变 */
					border-color: rgba(59, 130, 246, 0.3);
					box-shadow: 0 4rpx 16rpx rgba(59, 130, 246, 0.15), 0 2rpx 6rpx rgba(59, 130, 246, 0.1); /* 增强阴影 */
					transform: translateY(-2rpx); /* 轻微上移 */
					
					.category-icon {
						background: linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(147, 197, 253, 0.08) 100%);
						border-color: rgba(59, 130, 246, 0.4);
						box-shadow: 0 3rpx 12rpx rgba(59, 130, 246, 0.2), inset 0 1rpx 0 rgba(255, 255, 255, 0.9);
					}
					
					.category-name {
						color: #3b82f6; /* 选中时的蓝色文字 */
						font-weight: 600;
					}
				}
				
				/* 添加点击效果 */
				&:active {
					transform: translateY(1rpx) scale(0.98);
					box-shadow: 0 1rpx 4rpx rgba(0, 0, 0, 0.08);
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
						white-space: nowrap;
					}
					
					&:active {
						opacity: 0.7;
						transform: scale(0.95);
					}
				}
			}
			
		}

		// 重试按钮样式
		.retry-btn {
			display: flex;
			align-items: center;
			justify-content: center;
			padding: 24rpx 32rpx;
			margin-top: 24rpx;
			background-color: rgba(33, 150, 243, 0.08);
			border-radius: 16rpx;
			border: 1px solid rgba(33, 150, 243, 0.2);

			.retry-text {
				font-size: 28rpx;
				color: #2196F3;
				margin-left: 12rpx;
				font-weight: 500;
			}

			&:active {
				background-color: rgba(33, 150, 243, 0.15);
				opacity: 0.8;
			}
		}

		// 页面中间位置的重试按钮样式
		.retry-btn-center {
			display: flex;
			align-items: center;
			justify-content: center;
			padding: 32rpx 40rpx;
			margin: 60rpx auto;
			max-width: 400rpx;
			background-color: rgba(33, 150, 243, 0.08);
			border-radius: 20rpx;
			border: 1px solid rgba(33, 150, 243, 0.2);
			box-shadow: 0 4rpx 16rpx rgba(33, 150, 243, 0.08);

			.retry-text {
				font-size: 30rpx;
				color: #2196F3;
				margin-left: 16rpx;
				font-weight: 500;
			}

			&:active {
				background-color: rgba(33, 150, 243, 0.15);
				transform: scale(0.98);
				opacity: 0.9;
			}
		}

		.content-wrapper {
			position: relative;
			margin-bottom: 20rpx;
		}

		.format-toolbar {
			position: absolute;
			top: 0;
			left: 0;
			right: 0;
			background-color: #fff;
			border-radius: 12rpx;
			box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.1);
			padding: 20rpx;
			z-index: 100;
			transform: translateY(-10rpx);
			opacity: 0;
			pointer-events: none;
			transition: all 0.3s ease;
			
			&.format-toolbar-visible {
				opacity: 1;
				transform: translateY(0);
				pointer-events: auto;
			}
			
			.toolbar-section {
				padding-bottom: 20rpx;
				margin-bottom: 20rpx;
				border-bottom: 1px solid #f0f0f0;
				
				&:last-child {
					margin-bottom: 0;
					padding-bottom: 0;
					border-bottom: none;
				}
			}
			
			.toolbar-title {
				font-size: 24rpx;
				color: #999;
				margin-bottom: 12rpx;
			}
			
			.format-actions {
				display: flex;
				gap: 20rpx;
				
				.format-btn {
					display: flex;
					flex-direction: column;
					align-items: center;
					justify-content: center;
					padding: 10rpx;
					border-radius: 8rpx;
					background-color: #f5f5f5;
					
					&:active {
						background-color: #e0e0e0;
					}
					
					.format-icon {
						font-size: 28rpx;
						color: #333;
						margin-bottom: 4rpx;
					}
					
					.format-label {
						font-size: 22rpx;
						color: #666;
					}
				}
			}
			
			.phrase-list {
				display: flex;
				flex-wrap: wrap;
				gap: 16rpx;
				
				.phrase-item {
					background-color: #f5f5f5;
					border-radius: 30rpx;
					padding: 8rpx 20rpx;
					font-size: 24rpx;
					color: #666;
					
					&:active {
						background-color: #e0e0e0;
					}
				}
			}
			
			.clear-btn {
				display: flex;
				align-items: center;
				justify-content: center;
				background-color: rgba(255, 59, 48, 0.1);
				border-radius: 8rpx;
				padding: 12rpx;
				
				text {
					color: #ff3b30;
					font-size: 26rpx;
					margin-left: 8rpx;
				}
				
				&:active {
					background-color: rgba(255, 59, 48, 0.2);
				}
			}
			
			.toolbar-close {
				position: absolute;
				top: 12rpx;
				right: 12rpx;
				width: 40rpx;
				height: 40rpx;
				display: flex;
				align-items: center;
				justify-content: center;
				border-radius: 50%;
				
				&:active {
					background-color: #f0f0f0;
				}
			}
			
			.action-btns {
				display: flex;
				gap: 20rpx;
				
				.action-btn {
					flex: 1;
					display: flex;
					align-items: center;
					justify-content: center;
					padding: 16rpx;
					border-radius: 8rpx;
					
					text {
						margin-left: 8rpx;
						font-size: 26rpx;
						color: #fff;
					}
					
					&.primary {
						background-color: $pyq-vi-color;
						
						&:active {
							opacity: 0.8;
						}
					}
					
					&.danger {
						background-color: #ff3b30;
						
						&:active {
							opacity: 0.8;
						}
					}
				}
			}
		}

		.content-area {
			position: relative;
			border: 1px solid #e0e0e0;
			border-radius: 12rpx;
			background-color: #fff;
			min-height: 170rpx;
			max-height: 800rpx;
			padding: 0;
			box-sizing: border-box;
			overflow: hidden;
			box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
			transition: height 0.2s ease-out;
			
			.content-input {
				width: 100%;
				min-height: 120rpx;
				font-size: 28rpx;
				line-height: 1.5;
				color: #333;
				padding: 20rpx;
				background-color: transparent;
				border: none;
				box-sizing: border-box;
				word-break: break-word;
				white-space: pre-wrap;
				overflow-wrap: break-word;
				text-align: left;
				user-select: text;
				caret-color: $pyq-vi-color;
				letter-spacing: 0.5px;
				touch-action: manipulation;
				-webkit-user-select: text;
				transition: all 0.2s ease-out;
				z-index: 1;
				position: relative;
				
				&:focus {
					outline: none;
				}
			}
			
			.content-footer {
				display: flex;
				justify-content: space-between;
				align-items: center;
				padding: 8rpx 16rpx;
				background-color: #f9f9f9;
				border-top: 1px solid #eee;
				
				.word-count {
					font-size: 24rpx;
					color: #999;
				}
				
				.text-toolbar {
					display: flex;
					align-items: center;
					gap: 20rpx;
					
					.toolbar-btn {
						display: flex;
						align-items: center;
						// background-color: #f0f0f0;
						padding: 6rpx 12rpx;
						border-radius: 30rpx;
						
						text {
							font-size: 24rpx;
							color: #666;
							margin-left: 4rpx;
						}
						
						&:active {
							background-color: #e0e0e0;
						}
					}
				}
			}
			
			&:focus-within {
				border-color: $pyq-vi-color;
				box-shadow: 0 0 0 2px rgba($pyq-vi-color, 0.1);
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
					padding: 10rpx 20rpx;
					
					.link-input {
						flex: 1;
						height: 70rpx;
						font-size: 28rpx;
						padding: 0 20rpx;
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
				transition: all 0.3s ease;
				display: flex;
				align-items: center;
				justify-content: center;
				gap: 8rpx;

				&:active:not(.disabled) {
					opacity: 0.8;
					transform: scale(0.98);
				}
				
				// 禁用状态样式
				&.disabled {
					opacity: 0.6;
					background: linear-gradient(to right, #ccc, #999);
					cursor: not-allowed;
					pointer-events: none;
				}
				
				// 加载动画
				.loading-icon {
					animation: rotate 1s linear infinite;
				}
			}
		}
		
		// 加载动画
		@keyframes rotate {
			from {
				transform: rotate(0deg);
			}
			to {
				transform: rotate(360deg);
			}
		}
	
		// 砍价设置区域样式
		.bargain-section {
			padding: 30rpx;
			background-color: #fff;
			border-radius: 20rpx;
			margin-bottom: 20rpx;
			
			.section-header {
				display: flex;
				align-items: center;
				justify-content: space-between;
				margin-bottom: 20rpx;
				
				.section-title {
					font-size: 32rpx;
					font-weight: 600;
					color: #333;
				}
			}
			
			.bargain-settings {
				margin-top: 20rpx;
				
				.setting-item {
					display: flex;
					align-items: center;
					justify-content: space-between;
					margin-bottom: 20rpx;
					padding: 20rpx;
					background-color: #f7f7f7;
					border-radius: 12rpx;
					
					.setting-label {
						font-size: 28rpx;
						color: #666;
						flex-shrink: 0;
						width: 200rpx;
					}
					
					.setting-input {
						flex: 1;
						height: 60rpx;
						padding: 0 20rpx;
						background-color: #fff;
						border-radius: 8rpx;
						font-size: 28rpx;
						text-align: right;
					}
					
					.picker-display {
						flex: 1;
						display: flex;
						align-items: center;
						justify-content: space-between;
						padding: 0 20rpx;
						background-color: #fff;
						border-radius: 8rpx;
						height: 60rpx;
						
						text {
							font-size: 28rpx;
							color: #333;
						}
						
						.time-text {
							color: #333;
							font-weight: 500;
						}
						
						.placeholder-text {
							color: #999;
						}
					}
					
					// 时间选择器特殊样式
					.time-picker-display {
						padding: 12rpx 16rpx;
						background: linear-gradient(135deg, #f8f9ff, #fff);
						border: 2rpx solid #e0e4ff;
						box-shadow: 0 2rpx 8rpx rgba(102, 126, 234, 0.08);
						transition: all 0.3s ease;
						cursor: pointer;
						display: flex;
						align-items: center;
						justify-content: space-between;
						
						&:active {
							background: linear-gradient(135deg, #eef0ff, #f8f9ff);
							transform: scale(0.98);
						}
						
						.time-content {
							display: flex;
							align-items: center;
							gap: 12rpx;
							flex: 1;
							
							.time-text {
								color: #667eea;
								font-weight: 600;
								font-size: 26rpx;
							}
							
							.placeholder-text {
								color: #999;
								font-size: 26rpx;
							}
						}
					}
					
					.datetime-picker {
						flex: 1;
					}
					
					// 时间选择器包装器
					.time-picker-wrapper {
						flex: 1;
						display: flex;
						align-items: center;
						gap: 12rpx;
						position: relative;
						
						.clear-time-btn {
							width: 48rpx;
							height: 48rpx;
							display: flex;
							align-items: center;
							justify-content: center;
							background-color: rgba(0, 0, 0, 0.04);
							border-radius: 50%;
							transition: all 0.2s;
							flex-shrink: 0;
							
							&:active {
								background-color: rgba(0, 0, 0, 0.1);
								transform: scale(0.9);
							}
						}
					}
					
					// 时间设置项特殊样式
					&.time-setting {
						background: linear-gradient(135deg, #fff5f7, #fff);
						border-left: 4rpx solid #667eea;
						box-shadow: 0 2rpx 12rpx rgba(102, 126, 234, 0.1);
					}
					
					&.mode-selector {
						flex-direction: column;
						align-items: flex-start;
						gap: 16rpx;
						padding: 24rpx;
						
						.setting-label {
							width: auto;
							font-weight: 500;
							color: #333;
						}
					}
					
					&.image-upload-item {
						flex-direction: column;
						align-items: flex-start;
						gap: 12rpx;
						
						.setting-label {
							width: auto;
							margin-bottom: 8rpx;
						}
						
						.image-upload-section {
							width: 100%;
							
							.image-preview {
								position: relative;
								width: 200rpx;
								height: 200rpx;
								border-radius: 12rpx;
								overflow: hidden;
								background-color: #fff;
								box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);
								
								.preview-img {
									width: 100%;
									height: 100%;
								}
								
								.image-actions {
									position: absolute;
									bottom: 0;
									left: 0;
									right: 0;
									display: flex;
									justify-content: space-around;
									padding: 12rpx;
									background: linear-gradient(to top, rgba(0, 0, 0, 0.6), transparent);
									
									.action-icon {
										width: 48rpx;
										height: 48rpx;
										display: flex;
										align-items: center;
										justify-content: center;
										background-color: rgba(0, 0, 0, 0.3);
										border-radius: 50%;
										transition: all 0.3s;
										
										&:active {
											background-color: rgba(0, 0, 0, 0.5);
											transform: scale(0.9);
										}
									}
								}
							}
							
							.upload-btn {
								width: 200rpx;
								height: 200rpx;
								display: flex;
								flex-direction: column;
								align-items: center;
								justify-content: center;
								gap: 8rpx;
								background-color: #fff;
								border: 2rpx dashed #d9d9d9;
								border-radius: 12rpx;
								cursor: pointer;
								transition: all 0.3s;
								
								&:active {
									border-color: #667eea;
									background-color: rgba(102, 126, 234, 0.05);
								}
								
								.upload-text {
									font-size: 26rpx;
									color: #666;
								}
								
								.upload-tip {
									font-size: 22rpx;
									color: #999;
								}
							}
						}
					}
					
					&.text-input-item {
						flex-direction: column;
						align-items: flex-start;
						gap: 12rpx;
						position: relative;
						
						.setting-label {
							width: auto;
							margin-bottom: 8rpx;
						}
						
						.text-input {
							width: 100%;
							min-height: 120rpx;
							padding: 20rpx;
							background-color: #fff;
							border: 2rpx solid #e0e0e0;
							border-radius: 12rpx;
							font-size: 28rpx;
							color: #333;
							line-height: 1.6;
							box-sizing: border-box;
							
							&:focus {
								border-color: #667eea;
							}
						}
						
						.text-count {
							font-size: 24rpx;
							color: #999;
							text-align: right;
						}
						
						.field-tip {
							display: block;
							font-size: 22rpx;
							color: #999;
							margin-top: 8rpx;
							line-height: 1.4;
						}
					}
				}
				
				.mode-tabs {
					display: flex;
					gap: 12rpx;
					width: 100%;
					flex-wrap: wrap;
					
					.mode-tab {
						flex: 1;
						min-width: 140rpx;
						height: 60rpx;
						display: flex;
						align-items: center;
						justify-content: center;
						background-color: #fff;
						border: 2rpx solid #e0e0e0;
						border-radius: 8rpx;
						transition: all 0.3s;
						
						text {
							font-size: 26rpx;
							color: #666;
							font-weight: 400;
						}
						
						&.active {
							background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
							border-color: #667eea;
							box-shadow: 0 4rpx 12rpx rgba(102, 126, 234, 0.3);
							
							text {
								color: #fff;
								font-weight: 600;
							}
						}
					}
				}
				
				.mode-config {
					margin-top: 12rpx;
					padding: 20rpx;
					background-color: #fafafa;
					border-radius: 12rpx;
					border-left: 4rpx solid #667eea;
					
					.mode-description {
						display: flex;
						align-items: center;
						gap: 8rpx;
						padding: 16rpx;
						background-color: rgba(102, 126, 234, 0.08);
						border-radius: 8rpx;
						margin-top: 12rpx;
						
						text {
							font-size: 24rpx;
							color: #666;
							line-height: 1.5;
						}
					}
				}
				
				.bargain-preview {
					padding: 24rpx;
					background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
					border-radius: 12rpx;
					margin: 20rpx 0;
					box-shadow: 0 8rpx 16rpx rgba(102, 126, 234, 0.25);
					
					.preview-header {
						display: flex;
						align-items: center;
						gap: 8rpx;
						margin-bottom: 12rpx;
						
						.preview-title {
							font-size: 26rpx;
							color: rgba(255, 255, 255, 0.9);
							font-weight: 500;
						}
					}
					
					.preview-text {
						display: block;
						font-size: 26rpx;
						color: rgba(255, 255, 255, 0.85);
						line-height: 1.6;
						margin-bottom: 8rpx;
						
						&.highlight {
							font-size: 28rpx;
							color: #fff;
							font-weight: 600;
							margin-top: 4rpx;
						}
					}
				}
				
				.tip {
					display: block;
					font-size: 24rpx;
					color: #999;
					line-height: 1.5;
					padding: 10rpx 20rpx;
					background-color: #f0f9ff;
					border-left: 4rpx solid #2196F3;
					border-radius: 4rpx;
					margin-top: 12rpx;
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

	/* 移除文本选择样式的全局样式 - 会影响所有textarea */
	:deep(page) {
		/* 微信小程序文本选择样式 */
		/* stylelint-disable-next-line */
		text::selection,
		textarea::selection {
			background-color: rgba(255, 102, 0, 0.2) !important; /* 更明显的选择背景色 */
		}
	}

	/* 覆盖小程序默认的选中样式 */
	.selecting {
		/* 针对微信小程序特定选择样式的覆盖 */
		position: relative;
		user-select: auto;
		-webkit-user-select: auto; /* 增加WebKit支持 */
		
		&::before {
			content: '';
			position: absolute;
			top: 0;
			left: 0;
			right: 0;
			bottom: 0;
			pointer-events: none;
			z-index: 5;
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
				// 添加样式表明图片可点击
				&:active {
					opacity: 0.8;
				}
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

	// 表情符号面板样式
	.emoji-panel {
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		background-color: #fff;
		border-radius: 20rpx 20rpx 0 0;
		padding: 20rpx;
		box-shadow: 0 -4rpx 12rpx rgba(0, 0, 0, 0.1);
		z-index: 999;
		display: flex;
		flex-direction: column;
		max-height: 50vh;
		
		.emoji-header {
			display: flex;
			justify-content: space-between;
			align-items: center;
			padding-bottom: 16rpx;
			margin-bottom: 16rpx;
			border-bottom: 1px solid #f0f0f0;
			
			.emoji-title {
				font-size: 28rpx;
				color: #333;
				font-weight: bold;
			}
			
			.emoji-close {
				padding: 8rpx;
				border-radius: 50%;
				background-color: #f5f5f5;
				
				&:active {
					background-color: #e0e0e0;
				}
			}
		}
		
		.emoji-tabs {
			display: flex;
			border-bottom: 1px solid #f0f0f0;
			margin-bottom: 16rpx;
			
			.emoji-tab {
				padding: 12rpx 24rpx;
				font-size: 26rpx;
				color: #666;
				
				&.active {
					color: $pyq-vi-color;
					border-bottom: 2px solid $pyq-vi-color;
				}
			}
		}
		
		.emoji-content {
			flex: 1;
			overflow-y: auto;
			
			.emoji-list {
				display: flex;
				flex-wrap: wrap;
				padding: 10rpx;
				
				.emoji-item {
					width: 70rpx;
					height: 70rpx;
					display: flex;
					align-items: center;
					justify-content: center;
					font-size: 36rpx;
					margin: 10rpx;
					
					&:active {
						background-color: #f5f5f5;
						border-radius: 8rpx;
					}
				}
			}
		}
	}

	// 模板面板样式
	.template-panel {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-color: rgba(0, 0, 0, 0.6);
		z-index: 999;
		display: flex;
		align-items: center;
		justify-content: center;
		
		.template-container {
			width: 80%;
			max-width: 600rpx;
			background-color: #fff;
			border-radius: 12rpx;
			overflow: hidden;
			max-height: 70vh;
			display: flex;
			flex-direction: column;
			
			.template-header {
				display: flex;
				justify-content: space-between;
				align-items: center;
				padding: 20rpx;
				background-color: #f9f9f9;
				border-bottom: 1px solid #eee;
				
				.template-title {
					font-size: 30rpx;
					font-weight: bold;
					color: #333;
				}
				
				.close-btn {
					padding: 10rpx;
					border-radius: 50%;
					
					&:active {
						background-color: #e0e0e0;
					}
				}
			}
			
			.template-list {
				flex: 1;
				overflow-y: auto;
				padding: 20rpx;
				
				.template-item {
					padding: 16rpx;
					border-radius: 12rpx;
					background-color: #f9f9f9;
					margin-bottom: 16rpx;
					border: 1px solid #eee;
					
					&:active {
						background-color: rgba($pyq-vi-color, 0.1);
						border-color: rgba($pyq-vi-color, 0.3);
					}
					
					.template-item-header {
						display: flex;
						justify-content: space-between;
						align-items: center;
						margin-bottom: 8rpx;
						
						.template-item-title {
							font-size: 28rpx;
							font-weight: bold;
							color: #333;
						}
					}
					
					.template-preview {
						font-size: 24rpx;
						color: #666;
						line-height: 1.4;
					}
				}
			}
		}
	}

	// 添加图片预览样式
	.image-preview-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-color: rgba(0, 0, 0, 0.9);
		z-index: 9999;
		display: flex;
		align-items: center;
		justify-content: center;
		
		.image-preview-container {
			position: relative;
			width: 100%;
			height: 100%;
			display: flex;
			align-items: center;
			justify-content: center;
			
			.preview-image {
				max-width: 100%;
				max-height: 100%;
			}
			
			.preview-close {
				position: absolute;
				top: 40rpx;
				right: 40rpx;
				width: 80rpx;
				height: 80rpx;
				background-color: rgba(0, 0, 0, 0.5);
				border-radius: 50%;
				display: flex;
				align-items: center;
				justify-content: center;
			}
		}
	}
	
	// 自定义时间选择弹窗样式
	.custom-time-picker-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-color: rgba(0, 0, 0, 0.5);
		z-index: 9998;
		display: flex;
		align-items: flex-end;
		justify-content: center;
		
		.custom-time-picker-panel {
			width: 100%;
			max-height: 80vh;
			background-color: #fff;
			border-radius: 32rpx 32rpx 0 0;
			overflow: hidden;
			animation: slideUp 0.3s ease-out;
			
			.picker-header {
				position: relative;
				padding: 32rpx 48rpx;
				border-bottom: 1px solid #f0f0f0;
				display: flex;
				align-items: center;
				justify-content: center;
				
				.header-title {
					font-size: 32rpx;
					font-weight: 600;
					color: #333;
				}
				
				.close-btn {
					position: absolute;
					right: 32rpx;
					top: 50%;
					transform: translateY(-50%);
					padding: 8rpx;
				}
			}
			
			.date-selector {
				display: flex;
				padding: 24rpx 32rpx;
				gap: 16rpx;
				overflow-x: auto;
				border-bottom: 1px solid #f0f0f0;
				
				.date-item {
					flex-shrink: 0;
					padding: 16rpx 32rpx;
					background-color: #f5f5f5;
					border-radius: 12rpx;
					font-size: 28rpx;
					color: #666;
					transition: all 0.3s;
					
					&.active {
						background-color: #ee0a24;
						color: #fff;
						font-weight: 600;
					}
				}
			}
			
			.time-slots-container {
				max-height: 60vh;
				overflow-y: auto;
				padding: 24rpx 32rpx;
				
				.time-slot-item {
					display: flex;
					align-items: center;
					justify-content: space-between;
					padding: 32rpx 24rpx;
					margin-bottom: 16rpx;
					background-color: #f8f8f8;
					border-radius: 12rpx;
					font-size: 30rpx;
					color: #333;
					transition: all 0.3s;
					
					&.selected {
						background-color: #fff;
						border: 2px solid #ee0a24;
						color: #ee0a24;
						font-weight: 600;
					}
					
					.check-icon {
						display: flex;
						align-items: center;
					}
				}
			}
		}
	}
	
	// 添加动画
	@keyframes slideUp {
		from {
			transform: translateY(100%);
		}
		to {
			transform: translateY(0);
		}
	}
	
	// 自定义时间显示区域样式
	.custom-time-display {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 24rpx 32rpx;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		border-radius: 16rpx;
		flex: 1;
		cursor: pointer;
		transition: all 0.3s;
		
		&:active {
			opacity: 0.8;
			transform: scale(0.98);
		}
		
		.time-content {
			display: flex;
			align-items: center;
			gap: 12rpx;
			
			.time-text {
				font-size: 28rpx;
				color: #fff;
				font-weight: 500;
			}
			
			.placeholder-text {
				font-size: 28rpx;
				color: rgba(255, 255, 255, 0.7);
			}
		}
	}
	
	// 分享封面图区域样式
	.share-cover-section {
		margin-top: 30rpx;
		padding: 30rpx;
		background-color: #fff;
		border-radius: 16rpx;
		box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.05);
		
		.section-header {
			display: flex;
			align-items: center;
			justify-content: space-between;
			margin-bottom: 24rpx;
			
			.section-title {
				font-size: 30rpx;
				font-weight: 600;
				color: #333;
			}
			
			.section-desc {
				font-size: 24rpx;
				color: #999;
			}
		}
		
		.share-cover-content {
			margin-bottom: 20rpx;
			
			.cover-preview {
				position: relative;
				width: 100%;
				height: 400rpx;
				border-radius: 12rpx;
				overflow: hidden;
				
				.cover-image {
					width: 100%;
					height: 100%;
					object-fit: cover;
				}
				
				.delete-btn {
					position: absolute;
					top: 20rpx;
					right: 20rpx;
					width: 60rpx;
					height: 60rpx;
					background: rgba(255, 0, 0, 0.8);
					border-radius: 50%;
					display: flex;
					align-items: center;
					justify-content: center;
					box-shadow: 0 4rpx 12rpx rgba(255, 0, 0, 0.3);
					z-index: 10;
					
					&:active {
						opacity: 0.8;
						transform: scale(0.95);
					}
				}
				
				.cover-badge {
					position: absolute;
					bottom: 20rpx;
					left: 20rpx;
					display: flex;
					align-items: center;
					gap: 8rpx;
					background: rgba(76, 175, 80, 0.9);
					color: #fff;
					padding: 8rpx 16rpx;
					border-radius: 20rpx;
					font-size: 24rpx;
					backdrop-filter: blur(10rpx);
					box-shadow: 0 2rpx 8rpx rgba(76, 175, 80, 0.3);
				}
			}
			
			.upload-cover-btn {
				width: 100%;
				height: 400rpx;
				border: 2rpx dashed #ddd;
				border-radius: 12rpx;
				display: flex;
				align-items: center;
				justify-content: center;
				background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
				transition: all 0.3s;
				cursor: pointer;
				
				&:active {
					opacity: 0.8;
					transform: scale(0.98);
				}
				
				.uploading-state {
					display: flex;
					flex-direction: column;
					align-items: center;
					gap: 20rpx;
					
					.progress-ring {
						width: 100rpx;
						height: 100rpx;
						border: 6rpx solid rgba(33, 150, 243, 0.2);
						border-top-color: #2196F3;
						border-radius: 50%;
						display: flex;
						align-items: center;
						justify-content: center;
						animation: spin 1s linear infinite;
						
						.progress-text {
							font-size: 24rpx;
							font-weight: 600;
							color: #2196F3;
						}
					}
					
					.uploading-tip {
						font-size: 26rpx;
						color: #666;
					}
				}
				
				.upload-placeholder {
					display: flex;
					flex-direction: column;
					align-items: center;
					gap: 16rpx;
					
					.upload-text {
						font-size: 28rpx;
						color: #666;
						font-weight: 500;
					}
					
					.upload-tip {
						font-size: 24rpx;
						color: #999;
					}
				}
			}
		}
		
		.tip {
			display: block;
			font-size: 24rpx;
			color: #999;
			line-height: 1.6;
			padding: 12rpx 20rpx;
			background-color: #f0f9ff;
			border-left: 4rpx solid #2196F3;
			border-radius: 4rpx;
		}
	}
</style>