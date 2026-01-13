<template>
	<view class="memo-manage-container">
		<!-- 顶部操作栏 -->
		<view class="top-bar">
			<text class="title">推荐备忘录管理</text>
			<view class="add-btn" @click="openAddDialog">
				<uni-icons type="plusempty" size="20" color="#fff"></uni-icons>
				<text class="btn-text">新增</text>
			</view>
		</view>
		
		<!-- 备忘录列表 -->
		<view v-if="memoList.length > 0" class="memo-list">
			<view 
				v-for="(item, index) in memoList" 
				:key="item._id"
				class="memo-item"
			>
				<!-- 左侧图片 -->
				<view class="item-image-container">
					<image 
						v-if="item.image_url" 
						:src="item.image_url" 
						class="item-image"
						mode="aspectFill"
					/>
					<view v-else class="item-image-placeholder">
						<text class="placeholder-icon">📝</text>
					</view>
				</view>
				
				<!-- 右侧内容 -->
				<view class="item-content">
					<text v-if="item.title" class="item-title">{{ item.title }}</text>
					<text class="item-text">{{ item.content }}</text>
					<view class="item-footer">
						<text class="item-time">{{ formatTime(item.create_time) }}</text>
						<text class="item-order">排序: {{ item.sort_order }}</text>
						<text class="item-status" :class="{ disabled: !item.is_enabled }">
							{{ item.is_enabled ? '已启用' : '已禁用' }}
						</text>
					</view>
				</view>
				
				<!-- 操作按钮 -->
				<view class="item-actions">
					<view class="action-btn edit-btn" @click="editMemo(item)">
						<uni-icons type="compose" size="18" color="#399bfe"></uni-icons>
					</view>
					<view class="action-btn toggle-btn" @click="toggleStatus(item)">
						<uni-icons :type="item.is_enabled ? 'eye-slash' : 'eye'" size="18" :color="item.is_enabled ? '#ff9800' : '#4caf50'"></uni-icons>
					</view>
					<view class="action-btn delete-btn" @click="deleteMemo(item)">
						<uni-icons type="trash" size="18" color="#f44336"></uni-icons>
					</view>
				</view>
			</view>
		</view>
		
		<!-- 空状态 -->
		<view v-else class="empty-state">
			<text class="empty-icon">📝</text>
			<text class="empty-text">暂无推荐备忘录</text>
			<text class="empty-hint">点击右上角新增按钮添加</text>
		</view>
		
		<!-- 添加/编辑弹窗 -->
		<view v-if="showDialog" class="dialog-mask" @tap="closeDialog">
			<view class="dialog-content" @tap.stop>
				<view class="dialog-header">
					<text class="dialog-title">{{ isEdit ? '编辑备忘录' : '新增备忘录' }}</text>
					<view class="close-btn" @tap="closeDialog">×</view>
				</view>
				
				<view class="dialog-body">
					<!-- 标题输入 -->
					<view class="form-item">
						<text class="form-label">标题</text>
						<input 
							v-model="formData.title"
							class="form-input"
							placeholder="请输入标题(选填)"
							maxlength="50"
						/>
					</view>
					
					<!-- 内容输入 -->
					<view class="form-item">
						<text class="form-label">内容 <text class="required">*</text></text>
						<textarea 
							v-model="formData.content"
							class="form-textarea"
							placeholder="请输入推荐内容"
							maxlength="500"
							auto-height
						/>
						<view class="char-count">{{ formData.content.length }}/500</view>
					</view>
					
					<!-- 图片上传 -->
					<view class="form-item">
						<text class="form-label">配图(选填)</text>
						<view class="image-upload-wrapper">
							<view v-if="formData.image_url" class="preview-image">
								<image :src="formData.image_url" mode="aspectFill"></image>
								<view class="delete-icon" @tap="deleteImage">×</view>
							</view>
							<view v-else class="upload-btn" @tap="uploadImage">
								<uni-icons type="camera" size="40" color="#999"></uni-icons>
								<text class="upload-text">点击上传</text>
							</view>
						</view>
					</view>
					
					<!-- 排序设置 -->
					<view class="form-item">
						<text class="form-label">排序</text>
						<input 
							v-model.number="formData.sort_order"
							class="form-input"
							type="number"
							placeholder="数字越小越靠前,默认0"
						/>
					</view>
					
					<!-- 启用状态 -->
					<view class="form-item">
						<text class="form-label">状态</text>
						<view class="switch-wrapper">
							<switch :checked="formData.is_enabled" @change="handleSwitchChange" color="#399bfe"/>
							<text class="switch-text">{{ formData.is_enabled ? '已启用' : '已禁用' }}</text>
						</view>
					</view>
				</view>
				
				<view class="dialog-footer">
					<view class="dialog-btn cancel-btn" @tap="closeDialog">取消</view>
					<view class="dialog-btn confirm-btn" @tap="submitMemo" :class="{ disabled: isSubmitting }">保存</view>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
import { useUserInfoStore } from '@/store/user.js'

export default {
	data() {
		return {
			memoList: [],
			showDialog: false,
			isEdit: false,
			isSubmitting: false,
			formData: {
				id: '',
				title: '',
				content: '',
				image_url: '',
				sort_order: 0,
				is_enabled: true
			}
		}
	},
	
	onLoad() {
		this.checkAdmin()
		this.loadMemoList()
	},
	
	methods: {
		// 检查管理员权限
		checkAdmin() {
			const userStore = useUserInfoStore()
			const isAdmin = userStore.userInfo?.role?.[0] === 'admin'
			
			if (!isAdmin) {
				uni.showModal({
					title: '提示',
					content: '无权限访问此页面',
					showCancel: false,
					success: () => {
						uni.navigateBack()
					}
				})
			}
		},
		
		// 加载备忘录列表
		async loadMemoList() {
			try {
				const memoApi = uniCloud.importObject('memoList', { customUI: true })
				const res = await memoApi.getAllDefaultMemos()
				
				if (res && res.code === 0) {
					this.memoList = res.data || []
				} else {
					uni.showToast({
						title: res?.message || '加载失败',
						icon: 'none'
					})
				}
			} catch (err) {
				console.error('加载备忘录列表失败:', err)
				uni.showToast({
					title: '加载失败',
					icon: 'none'
				})
			}
		},
		
		// 打开添加对话框
		openAddDialog() {
			this.isEdit = false
			this.resetForm()
			this.showDialog = true
		},
		
		// 编辑备忘录
		editMemo(item) {
			this.isEdit = true
			this.formData = {
				id: item._id,
				title: item.title || '',
				content: item.content || '',
				image_url: item.image_url || '',
				sort_order: item.sort_order || 0,
				is_enabled: item.is_enabled !== false
			}
			this.showDialog = true
		},
		
		// 切换启用状态
		async toggleStatus(item) {
			try {
				const memoApi = uniCloud.importObject('memoList', { customUI: true })
				const res = await memoApi.updateDefaultMemo({
					id: item._id,
					data: {
						is_enabled: !item.is_enabled
					}
				})
				
				if (res && res.code === 0) {
					item.is_enabled = !item.is_enabled
					uni.showToast({
						title: item.is_enabled ? '已启用' : '已禁用',
						icon: 'success'
					})
				} else {
					uni.showToast({
						title: res?.message || '操作失败',
						icon: 'none'
					})
				}
			} catch (err) {
				console.error('切换状态失败:', err)
				uni.showToast({
					title: '操作失败',
					icon: 'none'
				})
			}
		},
		
		// 删除备忘录
		deleteMemo(item) {
			uni.showModal({
				title: '提示',
				content: '确定要删除这条备忘录吗?',
				success: async (res) => {
					if (res.confirm) {
						try {
							const memoApi = uniCloud.importObject('memoList', { customUI: true })
							const result = await memoApi.deleteDefaultMemo(item._id)
							
							if (result && result.code === 0) {
								uni.showToast({
									title: '删除成功',
									icon: 'success'
								})
								this.loadMemoList()
							} else {
								uni.showToast({
									title: result?.message || '删除失败',
									icon: 'none'
								})
							}
						} catch (err) {
							console.error('删除失败:', err)
							uni.showToast({
								title: '删除失败',
								icon: 'none'
							})
						}
					}
				}
			})
		},
		
		// 上传图片
		uploadImage() {
			uni.chooseImage({
				count: 1,
				sizeType: ['compressed'],
				sourceType: ['album', 'camera'],
				success: (res) => {
					const tempFilePath = res.tempFilePaths[0]
					
					uniCloud.uploadFile({
						filePath: tempFilePath,
						cloudPath: `memo/${Date.now()}_${Math.random().toString(36).substr(2)}.jpg`,
						success: (uploadRes) => {
							this.formData.image_url = uploadRes.fileID
							uni.showToast({
								title: '上传成功',
								icon: 'success'
							})
						},
						fail: (err) => {
							console.error('上传失败:', err)
							uni.showToast({
								title: '上传失败',
								icon: 'none'
							})
						}
					})
				}
			})
		},
		
		// 删除图片
		deleteImage() {
			this.formData.image_url = ''
		},
		
		// 处理开关变化
		handleSwitchChange(e) {
			this.formData.is_enabled = e.detail.value
		},
		
		// 提交备忘录
		async submitMemo() {
			if (!this.formData.content.trim()) {
				uni.showToast({
					title: '请输入推荐内容',
					icon: 'none'
				})
				return
			}
			
			if (this.isSubmitting) return
			
			this.isSubmitting = true
			
			try {
				const memoApi = uniCloud.importObject('memoList', { customUI: true })
				
				if (this.isEdit) {
					// 编辑
					const res = await memoApi.updateDefaultMemo({
						id: this.formData.id,
						data: {
							title: this.formData.title.trim(),
							content: this.formData.content.trim(),
							image_url: this.formData.image_url,
							sort_order: this.formData.sort_order || 0,
							is_enabled: this.formData.is_enabled
						}
					})
					
					if (res && res.code === 0) {
						uni.showToast({
							title: '更新成功',
							icon: 'success'
						})
						this.closeDialog()
						this.loadMemoList()
					} else {
						uni.showToast({
							title: res?.message || '更新失败',
							icon: 'none'
						})
					}
				} else {
					// 新增
					const res = await memoApi.addDefaultMemo({
						title: this.formData.title.trim(),
						content: this.formData.content.trim(),
						image_url: this.formData.image_url,
						sort_order: this.formData.sort_order || 0
					})
					
					if (res && res.code === 0) {
						uni.showToast({
							title: '添加成功',
							icon: 'success'
						})
						this.closeDialog()
						this.loadMemoList()
					} else {
						uni.showToast({
							title: res?.message || '添加失败',
							icon: 'none'
						})
					}
				}
			} catch (err) {
				console.error('操作失败:', err)
				uni.showToast({
					title: '操作失败',
					icon: 'none'
				})
			} finally {
				this.isSubmitting = false
			}
		},
		
		// 关闭对话框
		closeDialog() {
			this.showDialog = false
			this.resetForm()
		},
		
		// 重置表单
		resetForm() {
			this.formData = {
				id: '',
				title: '',
				content: '',
				image_url: '',
				sort_order: 0,
				is_enabled: true
			}
		},
		
		// 格式化时间
		formatTime(timestamp) {
			if (!timestamp) return ''
			const date = new Date(timestamp)
			const year = date.getFullYear()
			const month = String(date.getMonth() + 1).padStart(2, '0')
			const day = String(date.getDate()).padStart(2, '0')
			const hour = String(date.getHours()).padStart(2, '0')
			const minute = String(date.getMinutes()).padStart(2, '0')
			return `${year}-${month}-${day} ${hour}:${minute}`
		}
	}
}
</script>

<style lang="scss" scoped>
.memo-manage-container {
	min-height: 100vh;
	background: #f5f5f5;
	padding: 24rpx;
}

// 顶部操作栏
.top-bar {
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: 24rpx;
	padding: 0 8rpx;
	
	.title {
		font-size: 36rpx;
		font-weight: bold;
		color: #333;
	}
	
	.add-btn {
		display: flex;
		align-items: center;
		gap: 8rpx;
		padding: 16rpx 32rpx;
		background: #399bfe;
		border-radius: 32rpx;
		
		.btn-text {
			font-size: 28rpx;
			color: #fff;
			font-weight: 500;
		}
		
		&:active {
			opacity: 0.8;
		}
	}
}

// 备忘录列表
.memo-list {
	.memo-item {
		background: #fff;
		border-radius: 16rpx;
		padding: 24rpx;
		margin-bottom: 24rpx;
		display: flex;
		gap: 24rpx;
		box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.06);
		
		.item-image-container {
			flex-shrink: 0;
			width: 160rpx;
			height: 160rpx;
			border-radius: 12rpx;
			overflow: hidden;
			
			.item-image {
				width: 100%;
				height: 100%;
			}
			
			.item-image-placeholder {
				width: 100%;
				height: 100%;
				background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
				display: flex;
				align-items: center;
				justify-content: center;
				
				.placeholder-icon {
					font-size: 80rpx;
				}
			}
		}
		
		.item-content {
			flex: 1;
			display: flex;
			flex-direction: column;
			gap: 12rpx;
			min-width: 0;
			
			.item-title {
				font-size: 32rpx;
				font-weight: bold;
				color: #333;
				overflow: hidden;
				text-overflow: ellipsis;
				white-space: nowrap;
			}
			
			.item-text {
				font-size: 28rpx;
				color: #666;
				line-height: 1.6;
				display: -webkit-box;
				-webkit-box-orient: vertical;
				-webkit-line-clamp: 2;
				overflow: hidden;
			}
			
			.item-footer {
				display: flex;
				align-items: center;
				gap: 16rpx;
				font-size: 24rpx;
				color: #999;
				
				.item-status {
					color: #4caf50;
					
					&.disabled {
						color: #ff9800;
					}
				}
			}
		}
		
		.item-actions {
			flex-shrink: 0;
			display: flex;
			flex-direction: column;
			gap: 16rpx;
			justify-content: center;
			
			.action-btn {
				width: 64rpx;
				height: 64rpx;
				display: flex;
				align-items: center;
				justify-content: center;
				background: #f5f5f5;
				border-radius: 12rpx;
				transition: all 0.3s;
				
				&:active {
					transform: scale(0.9);
				}
			}
		}
	}
}

// 空状态
.empty-state {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 200rpx 60rpx;
	
	.empty-icon {
		font-size: 120rpx;
		margin-bottom: 32rpx;
	}
	
	.empty-text {
		font-size: 32rpx;
		color: #333;
		margin-bottom: 16rpx;
		font-weight: 500;
	}
	
	.empty-hint {
		font-size: 26rpx;
		color: #999;
	}
}

// 弹窗样式
.dialog-mask {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(0, 0, 0, 0.5);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 999;
	
	.dialog-content {
		width: 640rpx;
		max-height: 80vh;
		background: #fff;
		border-radius: 24rpx;
		overflow: hidden;
		display: flex;
		flex-direction: column;
		
		.dialog-header {
			display: flex;
			align-items: center;
			justify-content: space-between;
			padding: 32rpx 24rpx;
			border-bottom: 1rpx solid #f0f0f0;
			
			.dialog-title {
				font-size: 32rpx;
				font-weight: bold;
				color: #333;
			}
			
			.close-btn {
				width: 60rpx;
				height: 60rpx;
				display: flex;
				align-items: center;
				justify-content: center;
				font-size: 48rpx;
				color: #999;
			}
		}
		
		.dialog-body {
			flex: 1;
			overflow-y: auto;
			padding: 24rpx;
			
			.form-item {
				margin-bottom: 32rpx;
				
				.form-label {
					display: block;
					font-size: 28rpx;
					color: #333;
					margin-bottom: 16rpx;
					font-weight: 500;
					
					.required {
						color: #ff5a5f;
					}
				}
				
				.form-input {
					width: 100%;
					height: 80rpx;
					padding: 0 24rpx;
					background: #f5f5f5;
					border-radius: 12rpx;
					font-size: 28rpx;
					color: #333;
				}
				
				.form-textarea {
					width: 100%;
					min-height: 200rpx;
					padding: 24rpx;
					background: #f5f5f5;
					border-radius: 12rpx;
					font-size: 28rpx;
					color: #333;
					line-height: 1.6;
				}
				
				.char-count {
					text-align: right;
					font-size: 24rpx;
					color: #999;
					margin-top: 8rpx;
				}
				
				.image-upload-wrapper {
					.preview-image {
						position: relative;
						width: 200rpx;
						height: 200rpx;
						border-radius: 12rpx;
						overflow: hidden;
						
						image {
							width: 100%;
							height: 100%;
						}
						
						.delete-icon {
							position: absolute;
							top: 8rpx;
							right: 8rpx;
							width: 48rpx;
							height: 48rpx;
							background: rgba(0, 0, 0, 0.6);
							border-radius: 50%;
							color: #fff;
							display: flex;
							align-items: center;
							justify-content: center;
							font-size: 36rpx;
						}
					}
					
					.upload-btn {
						width: 200rpx;
						height: 200rpx;
						background: #f5f5f5;
						border-radius: 12rpx;
						display: flex;
						flex-direction: column;
						align-items: center;
						justify-content: center;
						gap: 16rpx;
						
						.upload-text {
							font-size: 24rpx;
							color: #999;
						}
					}
				}
				
				.switch-wrapper {
					display: flex;
					align-items: center;
					gap: 16rpx;
					
					.switch-text {
						font-size: 28rpx;
						color: #666;
					}
				}
			}
		}
		
		.dialog-footer {
			display: flex;
			gap: 24rpx;
			padding: 24rpx;
			border-top: 1rpx solid #f0f0f0;
			
			.dialog-btn {
				flex: 1;
				height: 80rpx;
				display: flex;
				align-items: center;
				justify-content: center;
				border-radius: 12rpx;
				font-size: 28rpx;
				
				&.cancel-btn {
					background: #f5f5f5;
					color: #666;
				}
				
				&.confirm-btn {
					background: #399bfe;
					color: #fff;
					
					&.disabled {
						opacity: 0.6;
						pointer-events: none;
					}
				}
				
				&:active {
					opacity: 0.8;
				}
			}
		}
	}
}
</style>
