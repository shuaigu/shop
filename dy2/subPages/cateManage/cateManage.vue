<script setup>
	import { ref } from 'vue'
	import { onShow } from '@dcloudio/uni-app'
	const cateApi = uniCloud.importObject('cateWx', { customUI: true })
	const qiniuCloud = uniCloud.importObject('qiniuyunCloud', { customUI: true })
	
	// 获取分类
	const cateList = ref([])
	const cateListGet = async () => {
		// 使用 get 方法并传递 showAll=true 来获取所有分类(包括隐藏的)
		const res = await cateApi.get(null, true)
		console.log(res)
		cateList.value = res.data
	}
	onShow(() => {
		cateListGet()
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
		isEdit.value = true
		currentId.value = id // 保存当前编辑的ID
		// 根据点击id获取对应分类名称
		const res = await cateApi.get(id)
		console.log(res, '单个获取')
		editValue.value = res.data[0]?.cate_name
		cateImage.value = res.data[0]?.cate_img || ''
		isVisible.value = res.data[0]?.is_visible !== false // 默认为true，除非明确设置为false
		showPopup.value = true
	}

	// 删除分类
	const del = async (id) => {
		const res = await cateApi.del(id)
		if (res.deleted === 1) {
			uni.showToast({
				title: '删除成功',
				icon: 'none'
			})
			cateListGet()
		}
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
	
	// 上传图片到服务器
	const uploadImage = async (filePath) => {
		try {
			imageUploading.value = true
			uploadProgress.value = 0
			
			// 获取文件扩展名
			const fileExt = filePath.substring(filePath.lastIndexOf('.') + 1).toLowerCase()
			
			// 上传到uniCloud云存储
			const result = await uniCloud.uploadFile({
				filePath: filePath,
				cloudPath: `cate_icons/${Date.now()}_${Math.random().toString(36).substring(2, 10)}.${fileExt}`,
				onUploadProgress: (progressEvent) => {
					uploadProgress.value = Math.round((progressEvent.loaded / progressEvent.total) * 100)
				}
			})
			
			console.log('上传结果:', result)
			
			if (result.fileID) {
				// 获取临时访问链接
				const tempUrl = await uniCloud.getTempFileURL({
					fileList: [result.fileID]
				})
				
				console.log('临时链接:', tempUrl)
				
				if (tempUrl.fileList && tempUrl.fileList[0] && tempUrl.fileList[0].tempFileURL) {
					// 更新图片URL
					cateImage.value = result.fileID
					
					uni.showToast({
						title: '图片上传成功',
						icon: 'success'
					})
				} else {
					throw new Error('获取临时链接失败')
				}
			} else {
				throw new Error('上传失败')
			}
		} catch (e) {
			console.error('上传图片错误:', e)
			uni.showToast({
				title: '图片上传失败',
				icon: 'none'
			})
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
		// 反转逻辑：当前是可见的，切换后应该隐藏，反之亦然
		const newVisibility = !currentVisibility;
		
		try {
			// 仅更新可见性字段
			const upRes = await cateApi.update(id, {
				is_visible: newVisibility
			});
			
			if (upRes.updated === 1) {
				uni.showToast({
					title: newVisibility ? '已启用显示' : '已隐藏分类',
					icon: 'none'
				})
				cateListGet()
			}
		} catch (error) {
			console.error('切换可见性失败:', error);
			uni.showToast({
				title: '操作失败，请重试',
				icon: 'none'
			});
		}
	}
</script>

<template>
	<view class="cateManage">
		<view class="cateName">
			<view class="value" v-for="item in cateList" :key="item._id">
				<view class="name-container">
					<image class="cate-image" :src="item.cate_img" mode="aspectFill" @error="item.cate_img = '/static/images/defalut.png'"></image>
					<view class="name" :class="{ 'hidden-category': !item.is_visible }">
						{{item.cate_name}}
						<text class="hidden-label" v-if="!item.is_visible">(已隐藏)</text>
					</view>
				</view>
				<view class="right">
					<switch 
						:checked="item.is_visible === false" 
						@change="() => toggleVisibility(item._id, item.is_visible !== false)" 
						color="#399bfe"
						style="margin-right: 16rpx;"
						scale="0.8"
					/>
					<uni-icons @click="edit(item._id)" style="margin-right: 16rpx;" color="#399bfe"
						type="compose" size="22"></uni-icons>
					<uni-icons @click="del(item._id)" color="#e65c00" custom-prefix="iconfont"
						type="icon-shanchu1" size="20"></uni-icons>
				</view>
			</view>
		</view>
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
	<floatButton icon="plus" :size="100" :position="{ bottom: '120rpx', right: '40rpx' }"
		@click="handleAddCate"></floatButton>
</template>

<style lang="scss" scoped>
	/*防止分包页面公共样式无法读取*/
	@import "@/style/common.scss";

	.cateManage {
		@include pagesBaseStyle;

		.cateName {
			padding: 24rpx;
			border-radius: 24rpx;
			background-color: #fff;

			.value {
				display: flex;
				align-items: center;
				justify-content: space-between;
				padding: 16rpx;
				font-size: 28rpx;
				color: $pyq-text-color-body;
				border-bottom: 1px solid $pyq-border-color-translucent;

				&:nth-last-child(1) {
					border: none;
				}

				.name-container {
					display: flex;
					align-items: center;
					
					.cate-image {
						width: 60rpx;
						height: 60rpx;
						border-radius: 8rpx;
						margin-right: 16rpx;
						background-color: #f5f5f5;
						object-fit: cover;
					}
					
					.name {
						font-size: 28rpx;
						
						&.hidden-category {
							color: #999;
						}
						
						.hidden-label {
							font-size: 24rpx;
							color: #999;
							margin-left: 8rpx;
						}
					}
				}

				.right {
					display: flex;
					align-items: center;
				}
			}
		}
	}
</style>