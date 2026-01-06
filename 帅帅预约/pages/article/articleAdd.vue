<script setup>
	import { ref, onMounted, nextTick } from 'vue'
	import { useUserInfoStore } from '@/store/user.js'

	// Store & API
	const userStore = useUserInfoStore( )
	const articleApi = uniCloud.importObject( 'articleKs' )
	const extStorageCo = uniCloud.importObject('ext-storage-co')
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

	// 获取位置和分类
	const getLocaAndCate = async ( ) => {
		let locationRes = await uni.getLocation( {
			type: 'gcj02'
		} )
		const res = await articleApi.addReady( `${locationRes.longitude},${locationRes.latitude}` )
		console.log( res )
		locationInfo.value = {
			address: res.address,
			district: res.district
		}
		categoryList.value = res.cateList
		if ( categoryList.value.length > 0 ) {
			selectedCategory.value = categoryList.value[ 0 ]._id
		}
	}

	// 修改图片选择和上传方法
	const chooseAndUploadImage = async () => {
		try {
			// 检查是否达到最大图片数量限制(9张)
			if (imageList.value.length >= 9) {
				uni.showToast({
					title: '最多只能上传9张图片',
					icon: 'none'
				})
				return
			}

			// 选择图片，设置 sizeType 只包含 original 来选择原图
			const chooseRes = await uni.chooseImage({
				count: 9 - imageList.value.length,
				sizeType: ['original'], // 只使用原图
				sourceType: ['album', 'camera']
			})

			// 为每个选中的图片创建临时对象
			const tempFiles = chooseRes.tempFilePaths.map(filePath => ({
				fileURL: '',
				thumbnailURL: filePath,
				progress: 0
			}))
			
			// 添加到预览列表
			const startIndex = imageList.value.length
			imageList.value.push(...tempFiles)
			
			// 逐个上传文件
			for (let i = 0; i < tempFiles.length; i++) {
				const filePath = chooseRes.tempFilePaths[i]
				await uploadFile(filePath, startIndex + i)
			}
		} catch (err) {
			uni.showToast({
				title: '选择图片失败',
				icon: 'none'
			})
			console.error('选择图片错误:', err)
		}
	}

	// 修改上传文件方法
	const uploadFile = async (filePath, index) => {
		try {
			uni.showLoading({ title: "上传中...", mask: true })
			
			// 设置初始进度
			imageList.value[index] = {
				...imageList.value[index],
				progress: 0
			}
			
			// 获取上传配置
			const uploadFileOptionsRes = await extStorageCo.getUploadFileOptions({
				cloudPath: `images/${userStore.userInfo.uid}/${Date.now()}-${index}.jpg`,
				fileType: 'image',
				isOriginal: true
			})

			// 创建平滑进度动画
			startImageProgressAnimation(index)
			
			const uploadTask = uni.uploadFile({
				...uploadFileOptionsRes.uploadFileOptions,
				filePath: filePath,
				success: () => {
					// 更新上传成功后的文件信息
					imageList.value[index] = {
						...imageList.value[index],
						fileURL: uploadFileOptionsRes.fileURL,
						compressedURL: uploadFileOptionsRes.compressedURL,
						thumbnailURL: uploadFileOptionsRes.thumbnailURL,
						progress: 100
					}
					console.log('上传成功:', {
						原图: uploadFileOptionsRes.fileURL,
						压缩图: uploadFileOptionsRes.compressedURL,
						缩略图: uploadFileOptionsRes.thumbnailURL
					})
				},
				fail: (err) => {
					console.error("上传失败", err)
					uni.showToast({
						title: '上传失败',
						icon: 'error'
					})
					imageList.value.splice(index, 1)
				},
				complete: () => {
					uni.hideLoading()
				}
			})

			// 实际进度监听
			uploadTask.onProgressUpdate((res) => {
				if (imageList.value[index]) {
					// 将进度值保留2位小数
					const progress = parseFloat(res.progress.toFixed(2))
					// 只有当实际进度大于当前显示进度时才更新
					if (progress > imageList.value[index].progress) {
						imageList.value[index].progress = progress
					}
				}
			})

		} catch (e) {
			console.error(e)
			uni.hideLoading()
			uni.showToast({
				title: '上传失败',
				icon: 'error'
			})
			imageList.value.splice(index, 1)
		}
	}

	// 添加图片平滑进度动画函数
	const startImageProgressAnimation = (index) => {
		// 初始进度
		let currentProgress = 0
		// 目标进度（最大95%，留5%给实际完成时）
		const targetProgress = 95
		// 总动画时间（毫秒）
		const totalDuration = 20000 // 20秒
		// 更新间隔（毫秒）
		const updateInterval = 200
		// 每次更新增加的进度
		const progressIncrement = (targetProgress / (totalDuration / updateInterval)) * (1 + Math.random() * 0.5)
		
		// 创建进度更新定时器
		const progressTimer = setInterval(() => {
			// 如果图片信息不存在或已经上传完成，清除定时器
			if (!imageList.value[index] || imageList.value[index].progress >= 100) {
				clearInterval(progressTimer)
				return
			}
			
			// 计算新进度，确保不超过实际进度和目标进度
			currentProgress += progressIncrement
			const newProgress = Math.min(currentProgress, targetProgress)
			
			// 只有当新进度大于当前显示进度时才更新
			if (newProgress > imageList.value[index].progress) {
				imageList.value[index].progress = parseFloat(newProgress.toFixed(2))
			}
			
			// 如果达到目标进度，清除定时器
			if (newProgress >= targetProgress) {
				clearInterval(progressTimer)
			}
		}, updateInterval)
	}

	// 删除图片方法
	const deleteImage = (index) => {
		imageList.value.splice(index, 1)
	}

	// 修改视频选择方法，适配快手小程序
	const chooseAndUploadVideo = async () => {
		try {
			// 如果已有视频，不允许再次上传
			if (videoInfo.value) {
				uni.showToast({
					title: '只能上传一个视频',
					icon: 'none',
					duration: 2000
				})
				return
			}

			// #ifdef MP-KUAISHOU
			// 快手小程序专用视频选择
			const ksChooseRes = await uni.chooseMedia({
				count: 1,
				mediaType: ['video'],
				maxDuration: 60,
				camera: 'back',
				sourceType: ['album', 'camera']
			})
			
			if (!ksChooseRes.tempFiles || ksChooseRes.tempFiles.length === 0) {
				return
			}
			
			const videoFile = ksChooseRes.tempFiles[0]
			
			// 检查视频大小（限制为500MB）
			if (videoFile.size > 500 * 1024 * 1024) {
				uni.showToast({
					title: '视频大小不能超过500MB',
					icon: 'none',
					duration: 2000
				})
				return
			}
			
			// 创建临时视频对象
			videoInfo.value = {
				fileURL: '',
				thumbnailURL: videoFile.thumbTempFilePath || '',
				tempFilePath: videoFile.tempFilePath,
				duration: videoFile.duration || 0,
				size: videoFile.size,
				progress: 0
			}
			// #endif
			
			// #ifndef MP-KUAISHOU
			// 其他平台的视频选择
			const defaultChooseRes = await uni.chooseVideo({
				sourceType: ['album', 'camera'],
				maxDuration: 60,
				camera: 'back',
				compressed: false
			})
			
			// 检查视频大小（限制为500MB）
			if (defaultChooseRes.size > 500 * 1024 * 1024) {
				uni.showToast({
					title: '视频大小不能超过500MB',
					icon: 'none',
					duration: 2000
				})
				return
			}
			
			// 创建临时视频对象
			videoInfo.value = {
				fileURL: '',
				thumbnailURL: defaultChooseRes.thumbTempFilePath,
				tempFilePath: defaultChooseRes.tempFilePath,
				duration: defaultChooseRes.duration,
				size: defaultChooseRes.size,
				progress: 0
			}
			// #endif

			// 上传视频
			await uploadVideo(videoInfo.value.tempFilePath)
		} catch (err) {
			console.error('选择视频错误:', err)
			uni.showToast({
				title: '选择视频失败',
				icon: 'none',
				duration: 2000
			})
		}
	}

	// 修改视频上传方法，适配快手小程序
	const uploadVideo = async (filePath) => {
		try {
			uni.showLoading({ title: "上传中...", mask: true })
			
			// 设置初始进度
			videoInfo.value.progress = 0
			
			// 创建平滑进度动画（仅用于UI显示）
			const progressTimer = startProgressAnimation()
			
			// 获取上传配置
			const uploadFileOptionsRes = await extStorageCo.getUploadFileOptions({
				cloudPath: `videos/${userStore.userInfo.uid}/${Date.now()}.mp4`,
				fileType: 'video',
				isOriginal: true
			})
			
			// #ifdef MP-KUAISHOU
			const ksUploadTask = uni.uploadFile({
				url: uploadFileOptionsRes.uploadFileOptions.url,
				filePath: filePath,
				name: 'file',
				formData: uploadFileOptionsRes.uploadFileOptions.formData || {},
				timeout: 600000, // 增加超时时间到10分钟
				success: (res) => {
					try {
						// 确保进度为100%
						videoInfo.value.progress = 100
						
						// 解析返回结果
						let result = res.data
						if (typeof result === 'string') {
							result = JSON.parse(result)
						}
						
						// 更新视频信息
						videoInfo.value = {
							...videoInfo.value,
							fileURL: uploadFileOptionsRes.fileURL,
							compressedURL: uploadFileOptionsRes.compressedURL,
							thumbnailURL: uploadFileOptionsRes.thumbnailURL,
							progress: 100,
							converting: true
						}
						
						console.log('视频上传成功:', {
							原视频: uploadFileOptionsRes.fileURL,
							压缩视频: uploadFileOptionsRes.compressedURL,
							封面图: uploadFileOptionsRes.thumbnailURL
						})
						
						// 模拟视频转换过程
						setTimeout(() => {
							if (videoInfo.value) {
								videoInfo.value.converting = false
							}
						}, 2000)
					} catch (parseError) {
						console.error('解析上传结果失败', parseError)
						handleUploadError()
					}
				},
				fail: (err) => {
					console.error("视频上传失败", err)
					handleUploadError()
				},
				complete: () => {
					uni.hideLoading()
				}
			})
			
			// 使用简化的进度监听，避免类型错误
			if (ksUploadTask && typeof ksUploadTask.onProgressUpdate === 'function') {
				ksUploadTask.onProgressUpdate(function(res) {
					if (videoInfo.value && res && typeof res.progress === 'number') {
						// 只在进度增加时更新
						if (res.progress > videoInfo.value.progress) {
							videoInfo.value.progress = res.progress
						}
					}
				})
			}
			// #endif
			
			// #ifndef MP-KUAISHOU
			// 其他平台的上传方法保持不变
			const defaultUploadTask = uni.uploadFile({
				...uploadFileOptionsRes.uploadFileOptions,
				filePath: filePath,
				success: () => {
					// 上传成功后，确保进度为100%
					videoInfo.value = {
						...videoInfo.value,
						fileURL: uploadFileOptionsRes.fileURL,
						compressedURL: uploadFileOptionsRes.compressedURL,
						thumbnailURL: uploadFileOptionsRes.thumbnailURL,
						progress: 100,
						converting: true
					}
					
					console.log('视频上传成功:', {
						原视频: uploadFileOptionsRes.fileURL,
						压缩视频: uploadFileOptionsRes.compressedURL,
						封面图: uploadFileOptionsRes.thumbnailURL
					})
					
					// 模拟视频转换过程
					setTimeout(() => {
						if (videoInfo.value) {
							videoInfo.value.converting = false
						}
					}, 2000)
				},
				fail: (err) => {
					console.error("视频上传失败", err)
					handleUploadError()
				},
				complete: () => {
					uni.hideLoading()
				}
			})
			
			// 实际进度监听
			defaultUploadTask.onProgressUpdate((res) => {
				if (videoInfo.value) {
					// 将进度值保留2位小数
					const progress = parseFloat(res.progress.toFixed(2))
					// 只有当实际进度大于当前显示进度时才更新
					if (progress > videoInfo.value.progress) {
						videoInfo.value.progress = progress
					}
				}
			})
			// #endif

		} catch (e) {
			console.error(e)
			handleUploadError()
		}
	}

	// 统一处理上传错误
	const handleUploadError = () => {
		uni.hideLoading()
		uni.showToast({
			title: '上传失败，请重试',
			icon: 'none',
			duration: 2000
		})
		videoInfo.value = null
	}

	// 优化进度动画函数
	const startProgressAnimation = () => {
		// 初始进度
		let currentProgress = 0
		// 目标进度（最大95%，留5%给实际完成时）
		const targetProgress = 95
		// 总动画时间（毫秒）
		const totalDuration = 30000 // 30秒
		// 更新间隔（毫秒）
		const updateInterval = 300
		// 每次更新增加的进度
		const progressIncrement = (targetProgress / (totalDuration / updateInterval)) * (1 + Math.random() * 0.3)
		
		// 创建进度更新定时器
		const progressTimer = setInterval(() => {
			// 如果视频信息不存在或已经上传完成，清除定时器
			if (!videoInfo.value || videoInfo.value.progress >= 100) {
				clearInterval(progressTimer)
				return
			}
			
			try {
				// 计算新进度，确保不超过实际进度和目标进度
				currentProgress += progressIncrement
				const newProgress = Math.min(currentProgress, targetProgress)
				
				// 只有当新进度大于当前显示进度时才更新
				if (newProgress > videoInfo.value.progress) {
					videoInfo.value.progress = parseFloat(newProgress.toFixed(2))
				}
				
				// 如果达到目标进度，清除定时器
				if (newProgress >= targetProgress) {
					clearInterval(progressTimer)
				}
			} catch (e) {
				console.error('更新进度出错', e)
				clearInterval(progressTimer)
			}
		}, updateInterval)
		
		// 返回定时器ID，以便需要时可以清除
		return progressTimer
	}

	// 添加删除视频的方法
	const deleteVideo = () => {
		videoInfo.value = null
	}

	// 组件加载时获取位置
	onMounted( ( ) => {
		getLocaAndCate( )
	} )

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
			return
		}

		if (payAmount.value === 0) {
			uni.showToast({
				title: '请选择支付金额',
				icon: 'none'
			})
			return
		}

		uni.showLoading({
			title: '发布中...',
			mask: true
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

			// 准备视频数据
			const videoData = videoInfo.value && videoInfo.value.fileURL ? {
				url: videoInfo.value.fileURL,
				compressedURL: videoInfo.value.compressedURL,
				thumbnailURL: videoInfo.value.thumbnailURL,
				duration: videoInfo.value.duration
			} : null

			const params = {
				user_id: userStore.userInfo.uid,
				content: content.value.trim(),
				images: uploadedImages,
				video: videoData,
				cate_id: selectedCategory.value,
				address: locationInfo.value.address,
				district: locationInfo.value.district,
				user_nickName: userStore.userInfo.nickName,
				user_avatarUrl: userStore.userInfo.avatarUrl,
				user_mobile: userStore.userInfo.mobile,
				pay_amount: payAmount.value
			}

			// 修改打印发布数据的部分
			console.log('发布数据:', {
				基础信息: {
					用户ID: params.user_id,
					文章内容: params.content,
					分类ID: params.cate_id,
					状态: params.status
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
				视频信息: params.video ? {
					原始视频: params.video.url,
					压缩视频: params.video.compressedURL,
					视频封面: params.video.thumbnailURL,
					视频时长: params.video.duration + '秒',
					视频大小: (params.video.size / 1024 / 1024).toFixed(2) + 'MB'
				} : '无视频'
			})

			const res = await articleApi.addArticle(params)
			if (res.id) {
				uni.showToast({
					title: '发布成功',
					icon: 'success'
				})
				
				// 发射刷新事件
				uni.$emit('articleAdded', {
					cateId: selectedCategory.value
				})
				
				setTimeout(() => {
					uni.navigateBack()
				}, 1500)
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
</script>

<template>
	<view class="add">
		<!-- 分类选择 -->
		<view class="category">
			<text class="label">所属分类</text>
			<picker @change="bindPickerChange" :range="categoryList" :value="cateIndex"
				range-key="cate_name">
				<view class="picker">
					<text>
						{{categoryList[cateIndex]?.cate_name}}
					</text>
					<uni-icons type="bottom" size="14" color="#999999"></uni-icons>
				</view>
			</picker>
		</view>

		<!-- 修改为支持换行的文本输入框，并调整内边距 -->
		<view class="content-area" @click="focusTextarea">
			<textarea 
				v-model="content" 
				placeholder="分享新鲜事..." 
				class="content-input" 
				maxlength="1000"
				auto-height
				show-confirm-bar="false"
				confirm-type="done"
				cursor-spacing="10"
				:focus="textareaFocus"
				ref="contentTextarea"
				@blur="textareaFocus = false"
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
					<view v-if="imageList.length < 9" class="upload-btn" @click="chooseAndUploadImage">
						<uni-icons type="plusempty" size="30" color="#999"></uni-icons>
					</view>
				</view>
				<text class="tip">最多上传9张图片</text>
			</view>

			<!-- 视频上传区域 -->
			<view class="video">
				<view v-if="videoInfo" class="video-preview">
					<video 
						:src="videoInfo.tempFilePath"
						:poster="videoInfo.thumbnailURL"
						class="video-player"
					></video>
					<view class="delete-btn" @click="deleteVideo">
						<uni-icons type="close" size="20" color="#fff"></uni-icons>
					</view>
					
					<!-- 上传进度显示 -->
					<view class="progress-overlay" v-if="videoInfo.progress < 100">
						<view class="progress-text">{{videoInfo.progress.toFixed(0)}}%</view>
						<view class="progress-bar">
							<view class="progress" :style="{width: videoInfo.progress + '%'}"></view>
						</view>
					</view>
					
					<!-- 视频转换中动画 -->
					<view class="converting-overlay" v-if="videoInfo.progress === 100 && videoInfo.converting">
						<view class="converting-spinner"></view>
						<view class="converting-text">视频处理中...</view>
					</view>
					
					<!-- 上传成功标识 -->
					<view class="success-icon" v-if="videoInfo.progress === 100 && !videoInfo.converting">
						<uni-icons type="checkmarkempty" size="24" color="#fff"></uni-icons>
					</view>
				</view>
				<view v-else class="upload-btn" @click="chooseAndUploadVideo">
					<uni-icons type="videocam-filled" size="30" color="#999"></uni-icons>
					<text class="upload-text">上传视频</text>
				</view>
				<text class="tip">支持60秒以内的视频</text>
			</view>
		</view>

		<!-- 发布按钮 -->
		<view class="publish">
			<button class="publish-btn" @click="submitForm">发布</button>
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
			align-items: center;
			margin-bottom: 32rpx;

			.label {
				font-size: 28rpx;
				color: $pyq-text-color-body;
				margin-right: 16rpx;
			}

			.picker {
				flex: 1;
				display: flex;
				align-items: center;
				justify-content: space-between;
				padding: 16rpx 24rpx;
				background-color: #f7f7f7;
				border-radius: 8rpx;
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
				padding: 8rpx;
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

			.tip {
				display: block;
				margin-top: 16rpx;
				font-size: 24rpx;
				color: $pyq-text-color-helper;
			}
		}

		.video {
			.video-preview {
				position: relative;
				width: 100%;
				aspect-ratio: 16/9;
				margin-bottom: 16rpx;
				overflow: hidden;

				.video-player {
					width: 100%;
					height: 100%;
					object-fit: contain;
					border-radius: 8rpx;
					background-color: #000;
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
					z-index: 5;

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

				.success-icon {
					position: absolute;
					bottom: 10rpx;
					right: 10rpx;
					background: rgba(0, 128, 0, 0.7);
					border-radius: 50%;
					width: 40rpx;
					height: 40rpx;
					display: flex;
					align-items: center;
					justify-content: center;
					z-index: 5;
				}
			}

			.upload-btn {
				width: 100%;
				aspect-ratio: 16/9;
				display: flex;
				flex-direction: column;
				align-items: center;
				justify-content: center;
				background-color: #f7f7f7;
				border-radius: 8rpx;
				margin-bottom: 16rpx;
				overflow: hidden;

				.upload-text {
					margin-top: 16rpx;
					font-size: 28rpx;
					color: #999;
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
</style>