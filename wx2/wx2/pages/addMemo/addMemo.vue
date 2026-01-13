<template>
	<view class="add-memo-container">
		<!-- 表单区域 -->
		<view class="form-wrapper">
			<!-- 标题输入 -->
			<view class="form-item">
				<view class="item-label">
					<text class="label-text">标题</text>
					<text class="label-hint">(选填)</text>
				</view>
				<input 
					v-model="formData.title"
					class="form-input"
					placeholder="请输入标题"
					maxlength="50"
					placeholder-style="color: #999;"
				/>
			</view>
			
			<!-- 内容输入 -->
			<view class="form-item">
				<view class="item-label">
					<text class="label-text">推荐内容</text>
					<text class="label-required">*</text>
				</view>
				<textarea 
					v-model="formData.content"
					class="form-textarea"
					placeholder="请输入推荐内容"
					maxlength="500"
					placeholder-style="color: #999;"
					:auto-height="true"
					:show-confirm-bar="false"
				/>
				<view class="char-count">{{ formData.content.length }}/500</view>
			</view>
			
			<!-- 图片上传 -->
			<view class="form-item">
				<view class="item-label">
					<text class="label-text">配图</text>
					<text class="label-hint">(选填)</text>
				</view>
				<view class="image-upload-wrapper">
					<view v-if="formData.image_url" class="preview-image-box">
						<image :src="formData.image_url" mode="aspectFill" class="preview-image"></image>
						<view class="delete-image-btn" @tap="deleteImage">
							<uni-icons type="close" size="20" color="#fff"></uni-icons>
						</view>
					</view>
					<view v-else class="upload-box" @tap="uploadImage">
						<uni-icons type="camera-filled" size="48" color="#ccc"></uni-icons>
						<text class="upload-text">点击上传配图</text>
					</view>
				</view>
			</view>
			
			<!-- 排序设置 -->
			<view class="form-item">
				<view class="item-label">
					<text class="label-text">排序</text>
					<text class="label-hint">(数字越小越靠前)</text>
				</view>
				<input 
					v-model.number="formData.sort_order"
					class="form-input"
					type="number"
					placeholder="默认为0"
					placeholder-style="color: #999;"
				/>
			</view>
		</view>
		
		<!-- 底部按钮 -->
		<view class="bottom-actions">
			<view class="action-btn cancel-btn" @tap="handleCancel">
				<text>取消</text>
			</view>
			<view class="action-btn submit-btn" @tap="handleSubmit" :class="{ disabled: isSubmitting }">
				<text>{{ isSubmitting ? '提交中...' : '添加' }}</text>
			</view>
		</view>
		
		<!-- 已添加列表 -->
		<view class="memo-list" v-if="memoList.length > 0">
			<view class="list-header">
				<text class="header-title">已添加 ({{ memoList.length }})</text>
			</view>
			
			<view class="memo-item" v-for="(item, index) in memoList" :key="item._id || index">
				<view class="memo-content">
					<view class="memo-header">
						<text class="memo-title">{{ item.title || '无标题' }}</text>
						<text class="memo-sort">排序: {{ item.sort_order }}</text>
					</view>
					<text class="memo-text">{{ item.content }}</text>
					<image v-if="item.image_url" :src="item.image_url" mode="aspectFill" class="memo-image"></image>
				</view>
			</view>
		</view>
	</view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { useUserInfoStore } from '@/store/user.js'

const userStore = useUserInfoStore()

// 表单数据
const formData = ref({
	title: '',
	content: '',
	image_url: '',
	sort_order: 0
})

// 提交状态
const isSubmitting = ref(false)

// 已添加的备忘录列表
const memoList = ref([])

// 检查管理员权限
const checkAdmin = () => {
	const isAdmin = userStore.userInfo?.role?.[0] === 'admin'
	if (!isAdmin) {
		uni.showModal({
			title: '提示',
			content: '仅管理员可添加推荐备忘录',
			showCancel: false,
			success: () => {
				uni.navigateBack()
			}
		})
		return false
	}
	return true
}

// 页面加载时检查权限
onLoad(() => {
	checkAdmin()
})

// 上传图片
const uploadImage = () => {
	uni.chooseImage({
		count: 1,
		sizeType: ['compressed'],
		sourceType: ['album', 'camera'],
		success: (res) => {
			const tempFilePath = res.tempFilePaths[0]
			
			uni.showLoading({
				title: '上传中...',
				mask: true
			})
			
			uniCloud.uploadFile({
				filePath: tempFilePath,
				cloudPath: `memo/${Date.now()}_${Math.random().toString(36).substr(2)}.jpg`,
				success: (uploadRes) => {
					formData.value.image_url = uploadRes.fileID
					uni.hideLoading()
					uni.showToast({
						title: '上传成功',
						icon: 'success',
						duration: 1500
					})
				},
				fail: (err) => {
					console.error('上传失败:', err)
					uni.hideLoading()
					uni.showToast({
						title: '上传失败,请重试',
						icon: 'none',
						duration: 2000
					})
				}
			})
		}
	})
}

// 删除图片
const deleteImage = () => {
	uni.showModal({
		title: '提示',
		content: '确定要删除这张图片吗?',
		success: (res) => {
			if (res.confirm) {
				formData.value.image_url = ''
				uni.showToast({
					title: '已删除',
					icon: 'success',
					duration: 1500
				})
			}
		}
	})
}

// 取消操作
const handleCancel = () => {
	if (formData.value.content.trim() || formData.value.title.trim() || formData.value.image_url) {
		uni.showModal({
			title: '提示',
			content: '确定要放弃编辑吗?',
			success: (res) => {
				if (res.confirm) {
					// 如果已有添加记录，清空表单即可
					if (memoList.value.length > 0) {
						formData.value = {
							title: '',
							content: '',
							image_url: '',
							sort_order: 0
						}
					} else {
						// 如果没有记录，返回上一页
						uni.navigateBack()
					}
				}
			}
		})
	} else {
		// 如果表单为空且有记录，什么也不做
		if (memoList.value.length === 0) {
			uni.navigateBack()
		}
	}
}

// 提交表单
const handleSubmit = async () => {
	// 验证
	if (!formData.value.content.trim()) {
		uni.showToast({
			title: '请输入推荐内容',
			icon: 'none',
			duration: 2000
		})
		return
	}
	
	if (isSubmitting.value) return
	
	isSubmitting.value = true
	
	try {
		uni.showLoading({
			title: '提交中...',
			mask: true
		})
		
		// 调用云函数
		const memoApi = uniCloud.importObject('memoList', { customUI: true })
		const res = await memoApi.addDefaultMemo({
			title: formData.value.title.trim(),
			content: formData.value.content.trim(),
			image_url: formData.value.image_url,
			sort_order: formData.value.sort_order || 0
		})
		
		uni.hideLoading()
		
		if (res && res.code === 0) {
			uni.showToast({
				title: '添加成功',
				icon: 'success',
				duration: 1500
			})
			
			// 添加到列表顶部
			const newMemo = {
				_id: res.id || Date.now().toString(),
				title: formData.value.title.trim(),
				content: formData.value.content.trim(),
				image_url: formData.value.image_url,
				sort_order: formData.value.sort_order || 0,
				create_time: new Date().getTime()
			}
			memoList.value.unshift(newMemo)
			
			// 清空表单，允许继续添加
			formData.value = {
				title: '',
				content: '',
				image_url: '',
				sort_order: 0
			}
			
			// 滚动到顶部
			uni.pageScrollTo({
				scrollTop: 0,
				duration: 300
			})
		} else {
			uni.showToast({
				title: res?.message || '添加失败',
				icon: 'none',
				duration: 2000
			})
		}
	} catch (err) {
		console.error('添加推荐备忘录失败:', err)
		uni.hideLoading()
		uni.showToast({
			title: err.message || '添加失败,请重试',
			icon: 'none',
			duration: 2000
		})
	} finally {
		isSubmitting.value = false
	}
}
</script>

<style lang="scss" scoped>
.add-memo-container {
	min-height: 100vh;
	background: #f5f5f5;
	padding-bottom: 120rpx;
}

// 表单区域
.form-wrapper {
	background: #fff;
	padding: 24rpx;
	
	.form-item {
		margin-bottom: 40rpx;
		
		&:last-child {
			margin-bottom: 0;
		}
		
		.item-label {
			display: flex;
			align-items: baseline;
			margin-bottom: 16rpx;
			
			.label-text {
				font-size: 30rpx;
				color: #333;
				font-weight: 500;
			}
			
			.label-hint {
				font-size: 24rpx;
				color: #999;
				margin-left: 8rpx;
			}
			
			.label-required {
				font-size: 30rpx;
				color: #ff5a5f;
				margin-left: 4rpx;
			}
		}
		
		.form-input {
			width: 100%;
			height: 88rpx;
			padding: 0 24rpx;
			background: #f8f8f8;
			border-radius: 12rpx;
			font-size: 28rpx;
			color: #333;
			border: 2rpx solid transparent;
			transition: all 0.3s;
			
			&:focus {
				background: #fff;
				border-color: #399bfe;
			}
		}
		
		.form-textarea {
			width: 100%;
			min-height: 280rpx;
			padding: 24rpx;
			background: #f8f8f8;
			border-radius: 12rpx;
			font-size: 28rpx;
			color: #333;
			line-height: 1.8;
			border: 2rpx solid transparent;
			transition: all 0.3s;
			
			&:focus {
				background: #fff;
				border-color: #399bfe;
			}
		}
		
		.char-count {
			text-align: right;
			font-size: 24rpx;
			color: #999;
			margin-top: 12rpx;
		}
		
		.image-upload-wrapper {
			.preview-image-box {
				position: relative;
				width: 240rpx;
				height: 240rpx;
				border-radius: 16rpx;
				overflow: hidden;
				
				.preview-image {
					width: 100%;
					height: 100%;
				}
				
				.delete-image-btn {
					position: absolute;
					top: 12rpx;
					right: 12rpx;
					width: 56rpx;
					height: 56rpx;
					background: rgba(0, 0, 0, 0.6);
					border-radius: 50%;
					display: flex;
					align-items: center;
					justify-content: center;
					transition: all 0.3s;
					
					&:active {
						transform: scale(0.9);
					}
				}
			}
			
			.upload-box {
				width: 240rpx;
				height: 240rpx;
				background: #f8f8f8;
				border: 2rpx dashed #ddd;
				border-radius: 16rpx;
				display: flex;
				flex-direction: column;
				align-items: center;
				justify-content: center;
				gap: 16rpx;
				transition: all 0.3s;
				
				&:active {
					background: #f0f0f0;
					border-color: #399bfe;
				}
				
				.upload-text {
					font-size: 24rpx;
					color: #999;
				}
			}
		}
	}
}

// 底部按钮
.bottom-actions {
	position: fixed;
	bottom: 0;
	left: 0;
	right: 0;
	display: flex;
	gap: 24rpx;
	padding: 24rpx;
	background: #fff;
	box-shadow: 0 -4rpx 12rpx rgba(0, 0, 0, 0.06);
	z-index: 100;
	
	.action-btn {
		flex: 1;
		height: 88rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 16rpx;
		font-size: 32rpx;
		font-weight: 500;
		transition: all 0.3s;
		
		&.cancel-btn {
			background: #f5f5f5;
			color: #666;
			
			&:active {
				background: #e8e8e8;
			}
		}
		
		&.submit-btn {
			background: linear-gradient(135deg, #399bfe 0%, #0c7bde 100%);
			color: #fff;
			box-shadow: 0 4rpx 12rpx rgba(57, 155, 254, 0.3);
			
			&:active {
				transform: translateY(2rpx);
				box-shadow: 0 2rpx 8rpx rgba(57, 155, 254, 0.3);
			}
			
			&.disabled {
				opacity: 0.6;
				pointer-events: none;
			}
		}
	}
}

// 已添加列表
.memo-list {
	margin-top: 24rpx;
	padding: 24rpx;
	background: #fff;
	
	.list-header {
		padding-bottom: 24rpx;
		border-bottom: 2rpx solid #f0f0f0;
		margin-bottom: 24rpx;
		
		.header-title {
			font-size: 32rpx;
			font-weight: 600;
			color: #333;
		}
	}
	
	.memo-item {
		margin-bottom: 24rpx;
		padding: 24rpx;
		background: #f8f8f8;
		border-radius: 16rpx;
		transition: all 0.3s;
		
		&:last-child {
			margin-bottom: 0;
		}
		
		&:active {
			background: #f0f0f0;
		}
		
		.memo-content {
			.memo-header {
				display: flex;
				justify-content: space-between;
				align-items: center;
				margin-bottom: 16rpx;
				
				.memo-title {
					flex: 1;
					font-size: 30rpx;
					font-weight: 600;
					color: #333;
					overflow: hidden;
					text-overflow: ellipsis;
					white-space: nowrap;
					margin-right: 16rpx;
				}
				
				.memo-sort {
					font-size: 24rpx;
					color: #999;
					background: #e8e8e8;
					padding: 4rpx 12rpx;
					border-radius: 8rpx;
				}
			}
			
			.memo-text {
				font-size: 28rpx;
				color: #666;
				line-height: 1.6;
				display: block;
				margin-bottom: 16rpx;
			}
			
			.memo-image {
				width: 200rpx;
				height: 200rpx;
				border-radius: 12rpx;
				display: block;
			}
		}
	}
}
</style>
