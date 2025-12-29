<script setup>
	import { ref, watch } from 'vue'

	const props = defineProps( {
		show: {
			type: Boolean,
			default: false
		},
		title: {
			type: String,
			default: '添加分类'
		},
		editValue: {
			type: String,
			default: ''
		},
		editImg: {
			type: String,
			default: ''
		},
		editSort: {
			type: Number,
			default: 0
		},
		editVisible: {
			type: Boolean,
			default: true
		}
	} )

	const emit = defineEmits( [ 'update:show', 'confirm' ] )

	// 输入内容
	const inputValue = ref( '' )
	// 图片URL
	const imageUrl = ref( '' )
	// 默认图片
	const defaultImg = '/static/images/defalut.png'
	// 上传状态
	const isUploading = ref(false)
	// 文件列表
	const fileList = ref([])
	// 排序值
	const sortValue = ref(0)
	// 可见性
	const isVisible = ref(true)

	// 监听 show 和 editValue 的组合变化
	watch( [() => props.show, () => props.editValue, () => props.editImg, () => props.editSort, () => props.editVisible], 
		([showVal, editVal, editImgVal, editSortVal, editVisibleVal]) => {
		if (showVal) {
			if (editVal) {
				// 当弹窗显示且有编辑值时，设置输入值
				inputValue.value = editVal
			}
			
			if (editImgVal) {
				// 当有编辑图片时，设置图片URL
				imageUrl.value = editImgVal
				
				// 如果是云存储图片，设置文件列表
				if (editImgVal.startsWith('cloud://')) {
					fileList.value = [{
						url: editImgVal,
						extname: 'png',
						name: 'category-image.png'
					}]
				} else if (editImgVal !== defaultImg) {
					// 如果是其他非默认图片，也添加到文件列表
					fileList.value = [{
						url: editImgVal,
						extname: 'png',
						name: 'category-image.png'
					}]
				} else {
					// 默认图片，清空文件列表
					fileList.value = []
				}
			} else {
				// 否则使用默认图片
				imageUrl.value = defaultImg
				fileList.value = []
			}
			
			// 设置排序值
			sortValue.value = editSortVal || 0
			
			// 设置可见性
			isVisible.value = editVisibleVal !== false
		} else {
			// 当弹窗关闭时，清空输入值和图片
			inputValue.value = ''
			imageUrl.value = ''
			fileList.value = []
			sortValue.value = 0
			isVisible.value = true
		}
	} )

	// 输入事件处理
	const handleInput = ( e ) => {
		inputValue.value = e.detail.value
	}
	
	// 文件上传成功
	const onFileUploadSuccess = (e) => {
		console.log('文件上传成功:', e)
		
		try {
			// 获取上传后的文件信息
			if (e && e.tempFiles && e.tempFiles.length > 0) {
				const fileInfo = e.tempFiles[0]
				
				// 设置图片URL为云存储路径
				if (fileInfo.url) {
					console.log('设置新的图片URL:', fileInfo.url)
					imageUrl.value = fileInfo.url
					
					// 上传完成，重置上传状态
					isUploading.value = false
					
					uni.showToast({
						title: '上传成功',
						icon: 'success'
					})
				} else {
					console.error('上传成功但未获取到文件URL')
					uni.showToast({
						title: '上传异常，请重试',
						icon: 'none'
					})
				}
			} else {
				console.error('上传成功但未获取到文件信息')
				uni.showToast({
					title: '上传异常，请重试',
					icon: 'none'
				})
			}
		} catch (error) {
			console.error('处理上传结果时出错:', error)
			uni.showToast({
				title: '上传异常，请重试',
				icon: 'none'
			})
		}
		
		isUploading.value = false
	}
	
	// 文件上传失败
	const onFileUploadFail = (e) => {
		console.error('文件上传失败:', e)
		isUploading.value = false
		uni.showToast({
			title: '上传失败，请重试',
			icon: 'none'
		})
	}
	
	// 文件状态改变
	const onFileStatusChange = (e) => {
		console.log('文件状态改变:', e)
		// 简单处理，只关注是否正在上传
		isUploading.value = true
	}
	
	// 文件被删除
	const onFileRemove = () => {
		imageUrl.value = defaultImg
		fileList.value = []
	}

	// 确认
	const handleConfirm = ( ) => {
		if ( !inputValue.value.trim( ) ) {
			uni.showToast( {
				title: '请输入分类名称',
				icon: 'none'
			} )
			return
		}
		
		// 如果正在上传，提示等待
		if (isUploading.value) {
			uni.showToast({
				title: '图片上传中，请稍候',
				icon: 'none'
			})
			return
		}
		
		// 发送分类名称和图片URL
		emit( 'confirm', {
			name: inputValue.value,
			img: imageUrl.value || defaultImg,
			sort: sortValue.value,
			is_visible: isVisible.value
		})
		emit( 'update:show', false )
		inputValue.value = ''
		imageUrl.value = ''
		fileList.value = []
		sortValue.value = 0
	}

	// 取消
	const handleCancel = ( ) => {
		emit( 'update:show', false )
	}
	
	// 选择默认图片
	const selectDefaultImage = () => {
		// 触发文件选择器
		if (fileList.value.length === 0) {
			// 如果没有文件，则使用系统选择器
			uni.chooseImage({
				count: 1,
				sizeType: ['compressed'],
				sourceType: ['album', 'camera'],
				success: (res) => {
					if (res.tempFilePaths && res.tempFilePaths.length > 0) {
						// 手动上传文件
						isUploading.value = true
						
						uni.showLoading({
							title: '上传中...',
							mask: true
						})
						
						// 使用简单的方式上传文件
						const tempFilePath = res.tempFilePaths[0]
						const cloudPath = `cate_images/${Date.now()}.png`
						
						console.log('开始上传文件:', {
							tempFilePath,
							cloudPath
						})
						
						// 上传文件到云存储
						uniCloud.uploadFile({
							filePath: tempFilePath,
							cloudPath: cloudPath,
							success: (uploadRes) => {
								console.log('手动上传成功:', uploadRes)
								
								// 设置图片URL
								imageUrl.value = uploadRes.fileID
								
								// 更新文件列表
								fileList.value = [{
									url: uploadRes.fileID,
									extname: 'png',
									name: 'category-image.png'
								}]
								
								uni.showToast({
									title: '上传成功',
									icon: 'success'
								})
							},
							fail: (err) => {
								console.error('手动上传失败:', err)
								uni.showToast({
									title: '上传失败，请重试',
									icon: 'none'
								})
							},
							complete: () => {
								isUploading.value = false
								uni.hideLoading()
							}
						})
					}
				}
			})
		}
	}
</script>

<template>
	<view class="popup-wrapper" v-if="props.show">
		<!-- 遮罩层 -->
		<view class="mask" @click="handleCancel"></view>
		<!-- 弹窗内容 -->
		<view class="popup-content">
			<view class="popup-title">{{ title }}</view>
			<view class="popup-body">
				<!-- 分类名称输入 -->
				<input type="text" :value="inputValue" @input="handleInput" placeholder="请输入分类名称"
					class="input" />
				
				<!-- 分类图片选择 -->
				<view class="image-section">
					<view class="image-title">分类图片</view>
					
					<!-- 使用uni-file-picker组件 -->
					<uni-file-picker
						v-model:value="fileList"
						fileMediatype="image"
						mode="grid"
						:limit="1"
						:image-styles="{ width: '200rpx', height: '200rpx' }"
						:auto-upload="true"
						:del-icon="true"
						return-type="object"
						file-extname="jpg,png,webp"
						@success="onFileUploadSuccess"
						@fail="onFileUploadFail"
						@delete="onFileRemove"
					></uni-file-picker>
					
					<!-- 当没有选择图片时显示默认图片 -->
					<view class="default-image-container" v-if="fileList.length === 0">
						<view class="default-image-wrapper" @click="selectDefaultImage">
							<image :src="defaultImg" mode="aspectFill" class="default-image" />
							<view class="default-image-text">点击选择图片</view>
						</view>
					</view>
					
					<!-- 上传状态提示 -->
					<view class="image-tip" v-if="isUploading">
						<text>上传中...</text>
					</view>
					<view class="image-tip" v-else-if="fileList.length === 0">
						<text>未选择图片，将使用默认图片</text>
					</view>
					<view class="image-tip" v-else-if="imageUrl && imageUrl.startsWith('cloud://')">
						<text>已上传到云存储</text>
					</view>
				</view>
				
				<!-- 排序设置 -->
				<view class="setting-section">
					<view class="setting-item">
						<text class="setting-label">排序值</text>
						<input type="number" v-model.number="sortValue" placeholder="请输入排序值" class="setting-input" />
					</view>
					<view class="setting-tip">数字越大排序越靠前</view>
				</view>
				
				<!-- 添加分类可见性设置 -->
				<view class="form-item">
					<view class="label">是否显示</view>
					<view class="input-wrapper">
						<switch 
							:checked="isVisible" 
							@change="isVisible = $event.detail.value"
							color="#399bfe"
							class="visibility-switch"
						/>
						<text class="visibility-state">{{ isVisible ? '显示' : '隐藏' }}</text>
					</view>
				</view>
			</view>
			<view class="popup-footer">
				<button class="btn cancel-btn" @click="handleCancel">取消</button>
				<button class="btn confirm-btn" @click="handleConfirm" :disabled="isUploading">确定</button>
			</view>
		</view>
	</view>
</template>
<style lang="scss" scoped>
	.popup-wrapper {
		position: fixed;
		left: 0;
		right: 0;
		top: 0;
		bottom: 0;
		z-index: 9999;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.mask {
		position: fixed;
		left: 0;
		right: 0;
		top: 0;
		bottom: 0;
		background-color: rgba(0, 0, 0, 0.5);
		z-index: 9998;
	}

	.popup-content {
		position: relative;
		width: 560rpx;
		background-color: #fff;
		border-radius: 16rpx;
		padding: 48rpx 32rpx;
		z-index: 10000;
		max-height: 90vh;
		overflow-y: auto;

		.popup-title {
			text-align: center;
			font-size: 32rpx;
			font-weight: bold;
			color: $pyq-text-color-body;
			margin-bottom: 48rpx;
		}

		.popup-body {
			position: relative;
			margin-bottom: 48rpx;
			z-index: 10001;

			.input {
				position: relative;
				width: 100%;
				height: 88rpx;
				padding: 0 24rpx;
				background-color: #f7f7f7;
				border-radius: 8rpx;
				font-size: 28rpx;
				box-sizing: border-box;
				z-index: 10002;
				margin-bottom: 24rpx;
			}
			
			.image-section {
				margin-top: 24rpx;
				margin-bottom: 32rpx;
				
				.image-title {
					font-size: 28rpx;
					color: $pyq-text-color-body;
					margin-bottom: 16rpx;
					font-weight: 500;
				}
				
				.default-image-container {
					display: flex;
					justify-content: center;
					margin-top: 16rpx;
					
					.default-image-wrapper {
						position: relative;
						width: 200rpx;
						height: 200rpx;
						border-radius: 8rpx;
						overflow: hidden;
						background-color: #f7f7f7;
						border: 1px dashed #ddd;
						transition: all 0.3s ease;
						
						&:active {
							transform: scale(0.98);
							border-color: #007AFF;
						}
						
						.default-image {
							width: 100%;
							height: 100%;
							object-fit: cover;
						}
						
						.default-image-text {
							position: absolute;
							bottom: 0;
							left: 0;
							right: 0;
							background-color: rgba(0, 0, 0, 0.5);
							color: #fff;
							font-size: 24rpx;
							padding: 8rpx 0;
							text-align: center;
						}
						
						&::before {
							content: "+";
							position: absolute;
							top: 50%;
							left: 50%;
							transform: translate(-50%, -70%);
							font-size: 40rpx;
							color: rgba(0, 0, 0, 0.2);
							z-index: 1;
						}
					}
				}
				
				.image-tip {
					font-size: 24rpx;
					color: $pyq-text-color-helper;
					margin-top: 8rpx;
					text-align: right;
				}
			}
			
			.setting-section {
				margin-top: 24rpx;
				margin-bottom: 32rpx;
				
				.setting-title {
					font-size: 28rpx;
					color: $pyq-text-color-body;
					margin-bottom: 16rpx;
					font-weight: 500;
				}
				
				.setting-item {
					display: flex;
					justify-content: space-between;
					align-items: center;
					padding: 16rpx 0;
					border-bottom: 1px solid rgba(0, 0, 0, 0.05);
					
					.setting-label {
						font-size: 28rpx;
						color: $pyq-text-color-body;
					}
					
					.setting-input {
						flex: 1;
						max-width: 200rpx;
						height: 70rpx;
						padding: 0 16rpx;
						background-color: #f7f7f7;
						border-radius: 8rpx;
						font-size: 28rpx;
						text-align: center;
					}
				}
				
				.setting-tip {
					font-size: 24rpx;
					color: $pyq-text-color-helper;
					margin-top: 8rpx;
					text-align: right;
				}
			}
			
			.form-item {
				margin-top: 24rpx;
				margin-bottom: 32rpx;
				
				.label {
					font-size: 28rpx;
					color: $pyq-text-color-body;
					margin-bottom: 16rpx;
					font-weight: 500;
				}
				
				.input-wrapper {
					display: flex;
					align-items: center;
				}
			}
			
			.visibility-item {
				margin-top: 16rpx;
				margin-bottom: 24rpx;
				
				.visibility-switch {
					transform: scale(0.9);
				}
				
				.visibility-state {
					font-size: 28rpx;
					color: $pyq-text-color-body;
					margin-left: 16rpx;
				}
			}
		}

		.popup-footer {
			display: flex;
			gap: 24rpx;

			.btn {
				flex: 1;
				height: 88rpx;
				line-height: 88rpx;
				text-align: center;
				border-radius: 44rpx;
				font-size: 32rpx;
				margin: 0;
				padding: 0;
			}

			.cancel-btn {
				background-color: #f7f7f7;
				color: $pyq-text-color-body;

				&:active {
					opacity: 0.8;
				}
			}

			.confirm-btn {
				background: linear-gradient(to right, $pyq-vi-color, rgba($pyq-vi-color, 0.6));
				color: #fff;

				&:active {
					opacity: 0.8;
				}
				
				&[disabled] {
					opacity: 0.6;
					background: #cccccc;
				}
			}
		}
	}
</style>