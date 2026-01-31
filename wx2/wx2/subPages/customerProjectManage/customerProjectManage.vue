<template>
	<view class="manage-container">
		<!-- 顶部操作栏 -->
		<view class="toolbar">
			<button class="add-btn" @click="showAddDialog">
				<uni-icons type="plus" size="20" color="#fff"></uni-icons>
				<text>添加项目</text>
			</button>
		</view>

		<!-- 项目列表 -->
		<view class="project-list">
			<!-- 加载中 -->
			<view v-if="loading && projectList.length === 0" class="loading-container">
				<uni-icons type="spinner-cycle" size="40" color="#399bfe"></uni-icons>
				<text class="loading-text">加载中...</text>
			</view>

			<!-- 列表 -->
			<view v-else-if="projectList.length > 0" class="list-content">
				<view class="project-card" v-for="item in projectList" :key="item._id">
					<!-- 卡片头部 -->
					<view class="card-header">
						<view class="title-row">
							<text class="project-title">{{item.title}}</text>
							<view class="status-badge" :class="item.status === 1 ? 'online' : 'offline'">
								{{item.status === 1 ? '上架' : '下架'}}
							</view>
						</view>
						<text class="project-desc">{{item.description}}</text>
					</view>

					<!-- 卡片信息 -->
					<view class="card-info">
						<view class="info-item">
							<uni-icons type="eye" size="14" color="#999"></uni-icons>
							<text>{{item.view_count || 0}}</text>
						</view>
						<view class="info-item" v-if="item.category">
							<uni-icons type="list" size="14" color="#999"></uni-icons>
							<text>{{item.category}}</text>
						</view>
						<view class="info-item">
							<text>排序: {{item.sort_order || 0}}</text>
						</view>
					</view>

					<!-- 操作按钮 -->
					<view class="card-actions">
						<button class="action-btn edit" @click="showEditDialog(item)">编辑</button>
						<button class="action-btn toggle" @click="toggleStatus(item)">
							{{item.status === 1 ? '下架' : '上架'}}
						</button>
						<button class="action-btn delete" @click="deleteProject(item)">删除</button>
					</view>
				</view>

				<!-- 加载更多 -->
				<uni-load-more :status="loadMoreStatus" @clickLoadMore="loadMore"></uni-load-more>
			</view>

			<!-- 空状态 -->
			<view v-else class="empty-container">
				<uni-icons type="inbox" size="80" color="#ddd"></uni-icons>
				<text class="empty-text">暂无项目</text>
			</view>
		</view>

		<!-- 编辑/添加弹窗 -->
		<uni-popup ref="editPopup" type="center">
			<view class="edit-dialog">
				<view class="dialog-title">{{isEdit ? '编辑项目' : '添加项目'}}</view>
				<scroll-view class="dialog-content" scroll-y="true">
					<!-- 标题 -->
					<view class="form-item">
						<text class="label required">标题</text>
						<input class="input" v-model="formData.title" placeholder="请输入项目标题" />
					</view>

					<!-- 描述 -->
					<view class="form-item">
						<text class="label required">简介</text>
						<textarea class="textarea" v-model="formData.description" placeholder="请输入项目简介" maxlength="200"></textarea>
					</view>

					<!-- 详细内容 -->
					<view class="form-item">
						<text class="label">详细内容</text>
						<textarea class="textarea large" v-model="formData.content" placeholder="请输入项目详细内容" maxlength="5000"></textarea>
					</view>

					<!-- 封面图片 -->
					<view class="form-item">
						<text class="label">封面图片</text>
						<view class="image-upload">
							<image v-if="formData.cover_image" class="preview-image" :src="formData.cover_image" mode="aspectFill" @click="previewCover"></image>
							<view v-else class="upload-placeholder" @click="uploadCover">
								<uni-icons type="camera" size="40" color="#ccc"></uni-icons>
								<text>上传封面</text>
							</view>
							<button v-if="formData.cover_image" class="remove-btn" @click="removeCover">删除</button>
						</view>
					</view>

					<!-- 类型 -->
					<view class="form-item">
						<text class="label">项目类型</text>
						<input class="input" v-model="formData.category" placeholder="如：家政服务、电商推广等" />
					</view>

					<!-- 标签 -->
					<view class="form-item">
						<text class="label">标签</text>
						<input class="input" v-model="tagsInput" placeholder="多个标签用逗号分隔" />
					</view>

					<!-- 价格区间 -->
					<view class="form-item">
						<text class="label">价格区间</text>
						<input class="input" v-model="formData.price_range" placeholder="如：1000-3000元" />
					</view>

					<!-- 服务区域 -->
					<view class="form-item">
						<text class="label">服务区域</text>
						<input class="input" v-model="formData.service_area" placeholder="如：全国、湖北省等" />
					</view>

					<!-- 联系人 -->
					<view class="form-item">
						<text class="label">联系人</text>
						<input class="input" v-model="formData.contact_name" placeholder="请输入联系人姓名" />
					</view>

					<!-- 联系电话 -->
					<view class="form-item">
						<text class="label">联系电话</text>
						<input class="input" v-model="formData.contact_phone" placeholder="请输入联系电话" type="number" />
					</view>

					<!-- 微信号 -->
					<view class="form-item">
						<text class="label">微信号</text>
						<input class="input" v-model="formData.contact_wechat" placeholder="请输入微信号" />
					</view>

					<!-- 联系地址 -->
					<view class="form-item">
						<text class="label">联系地址</text>
						<input class="input" v-model="formData.contact_address" placeholder="请输入联系地址" />
					</view>

					<!-- 排序权重 -->
					<view class="form-item">
						<text class="label">排序权重</text>
						<input class="input" v-model.number="formData.sort_order" placeholder="数字越大越靠前" type="number" />
					</view>

					<!-- 状态 -->
					<view class="form-item">
						<text class="label">状态</text>
						<radio-group @change="onStatusChange">
							<label class="radio-item">
								<radio :value="1" :checked="formData.status === 1" />
								<text>上架</text>
							</label>
							<label class="radio-item">
								<radio :value="0" :checked="formData.status === 0" />
								<text>下架</text>
							</label>
						</radio-group>
					</view>
				</scroll-view>

				<!-- 按钮 -->
				<view class="dialog-footer">
					<button class="dialog-btn cancel" @click="closeDialog">取消</button>
					<button class="dialog-btn confirm" @click="submitForm">确定</button>
				</view>
			</view>
		</uni-popup>
	</view>
</template>

<script setup>
	import { ref, computed, onMounted } from 'vue'

	// 数据
	const projectList = ref([])
	const loading = ref(false)
	const pageNum = ref(1)
	const pageSize = ref(20)
	const total = ref(0)
	const loadMoreStatus = ref('more')
	
	const editPopup = ref(null)
	const isEdit = ref(false)
	const currentEditId = ref('')
	
	// 表单数据
	const formData = ref({
		title: '',
		description: '',
		content: '',
		cover_image: '',
		category: '',
		tags: [],
		price_range: '',
		service_area: '',
		contact_name: '',
		contact_phone: '',
		contact_wechat: '',
		contact_address: '',
		sort_order: 0,
		status: 1
	})
	
	const tagsInput = computed({
		get: () => formData.value.tags ? formData.value.tags.join(',') : '',
		set: (val) => {
			formData.value.tags = val ? val.split(',').map(t => t.trim()).filter(t => t) : []
		}
	})
	
	// 加载项目列表
	const loadProjectList = async (isLoadMore = false) => {
		try {
			if (!isLoadMore) {
				loading.value = true
			}
			
			const projectApi = uniCloud.importObject('customerProject')
			const result = await projectApi.getAdminList({
				pageNum: pageNum.value,
				pageSize: pageSize.value
			})
			
			if (result && result.errCode === 0) {
				const list = result.data.list || []
				total.value = result.data.total || 0
				
				if (isLoadMore) {
					projectList.value = [...projectList.value, ...list]
				} else {
					projectList.value = list
				}
				
				// 更新加载更多状态
				if (projectList.value.length >= total.value) {
					loadMoreStatus.value = 'noMore'
				} else {
					loadMoreStatus.value = 'more'
				}
			} else {
				console.error('加载项目列表失败:', result)
				uni.showToast({
					title: result?.errMsg || '加载失败',
					icon: 'none'
				})
				loadMoreStatus.value = 'noMore'
			}
		} catch (error) {
			console.error('加载项目列表异常:', error)
			uni.showToast({
				title: '加载失败',
				icon: 'none'
			})
			loadMoreStatus.value = 'noMore'
		} finally {
			loading.value = false
		}
	}
	
	// 加载更多
	const loadMore = () => {
		if (loadMoreStatus.value === 'more' && !loading.value) {
			loadMoreStatus.value = 'loading'
			pageNum.value++
			loadProjectList(true)
		}
	}
	
	// 显示添加弹窗
	const showAddDialog = () => {
		isEdit.value = false
		currentEditId.value = ''
		resetForm()
		editPopup.value?.open()
	}
	
	// 显示编辑弹窗
	const showEditDialog = (item) => {
		isEdit.value = true
		currentEditId.value = item._id
		formData.value = {
			title: item.title || '',
			description: item.description || '',
			content: item.content || '',
			cover_image: item.cover_image || '',
			category: item.category || '',
			tags: item.tags || [],
			price_range: item.price_range || '',
			service_area: item.service_area || '',
			contact_name: item.contact_name || '',
			contact_phone: item.contact_phone || '',
			contact_wechat: item.contact_wechat || '',
			contact_address: item.contact_address || '',
			sort_order: item.sort_order || 0,
			status: item.status !== undefined ? item.status : 1
		}
		editPopup.value?.open()
	}
	
	// 关闭弹窗
	const closeDialog = () => {
		editPopup.value?.close()
	}
	
	// 重置表单
	const resetForm = () => {
		formData.value = {
			title: '',
			description: '',
			content: '',
			cover_image: '',
			category: '',
			tags: [],
			price_range: '',
			service_area: '',
			contact_name: '',
			contact_phone: '',
			contact_wechat: '',
			contact_address: '',
			sort_order: 0,
			status: 1
		}
	}
	
	// 提交表单
	const submitForm = async () => {
		// 验证必填项
		if (!formData.value.title) {
			uni.showToast({
				title: '请输入项目标题',
				icon: 'none'
			})
			return
		}
		
		if (!formData.value.description) {
			uni.showToast({
				title: '请输入项目简介',
				icon: 'none'
			})
			return
		}
		
		try {
			uni.showLoading({ title: '提交中...' })
			const projectApi = uniCloud.importObject('customerProject')
			
			let result
			if (isEdit.value) {
				// 编辑
				result = await projectApi.update(currentEditId.value, formData.value)
			} else {
				// 添加
				result = await projectApi.create(formData.value)
			}
			
			uni.hideLoading()
			
			if (result && result.errCode === 0) {
				uni.showToast({
					title: isEdit.value ? '更新成功' : '添加成功',
					icon: 'success'
				})
				closeDialog()
				// 刷新列表
				pageNum.value = 1
				loadProjectList()
			} else {
				uni.showToast({
					title: result?.errMsg || '操作失败',
					icon: 'none'
				})
			}
		} catch (error) {
			console.error('提交表单异常:', error)
			uni.hideLoading()
			uni.showToast({
				title: '操作失败',
				icon: 'none'
			})
		}
	}
	
	// 切换状态
	const toggleStatus = async (item) => {
		try {
			uni.showLoading({ title: '处理中...' })
			const projectApi = uniCloud.importObject('customerProject')
			const newStatus = item.status === 1 ? 0 : 1
			const result = await projectApi.update(item._id, { status: newStatus })
			
			uni.hideLoading()
			
			if (result && result.errCode === 0) {
				uni.showToast({
					title: newStatus === 1 ? '已上架' : '已下架',
					icon: 'success'
				})
				// 刷新列表
				pageNum.value = 1
				loadProjectList()
			} else {
				uni.showToast({
					title: result?.errMsg || '操作失败',
					icon: 'none'
				})
			}
		} catch (error) {
			console.error('切换状态异常:', error)
			uni.hideLoading()
			uni.showToast({
				title: '操作失败',
				icon: 'none'
			})
		}
	}
	
	// 删除项目
	const deleteProject = (item) => {
		uni.showModal({
			title: '确认删除',
			content: `确定要删除项目"${item.title}"吗？`,
			success: async (res) => {
				if (res.confirm) {
					try {
						uni.showLoading({ title: '删除中...' })
						const projectApi = uniCloud.importObject('customerProject')
						const result = await projectApi.delete(item._id)
						
						uni.hideLoading()
						
						if (result && result.errCode === 0) {
							uni.showToast({
								title: '删除成功',
								icon: 'success'
							})
							// 刷新列表
							pageNum.value = 1
							loadProjectList()
						} else {
							uni.showToast({
								title: result?.errMsg || '删除失败',
								icon: 'none'
							})
						}
					} catch (error) {
						console.error('删除项目异常:', error)
						uni.hideLoading()
						uni.showToast({
							title: '删除失败',
							icon: 'none'
						})
					}
				}
			}
		})
	}
	
	// 上传封面
	const uploadCover = () => {
		uni.chooseImage({
			count: 1,
			sizeType: ['compressed'],
			sourceType: ['album', 'camera'],
			success: (res) => {
				const tempFilePath = res.tempFilePaths[0]
				// 上传到云存储
				uploadToCloud(tempFilePath, (url) => {
					formData.value.cover_image = url
				})
			}
		})
	}
	
	// 删除封面
	const removeCover = () => {
		formData.value.cover_image = ''
	}
	
	// 预览封面
	const previewCover = () => {
		if (formData.value.cover_image) {
			uni.previewImage({
				urls: [formData.value.cover_image],
				current: 0
			})
		}
	}
	
	// 上传到云存储
	const uploadToCloud = (filePath, callback) => {
		uni.showLoading({ title: '上传中...' })
		uniCloud.uploadFile({
			filePath: filePath,
			cloudPath: `customer_projects/${Date.now()}_${Math.random().toString(36).substr(2)}.jpg`,
			success: (res) => {
				uni.hideLoading()
				if (res.fileID) {
					// 获取临时URL
					uniCloud.getTempFileURL({
						fileList: [res.fileID]
					}).then(result => {
						if (result.fileList && result.fileList[0]) {
							callback(result.fileList[0].tempFileURL)
						}
					})
				}
			},
			fail: (error) => {
				console.error('上传失败:', error)
				uni.hideLoading()
				uni.showToast({
					title: '上传失败',
					icon: 'none'
				})
			}
		})
	}
	
	// 状态改变
	const onStatusChange = (e) => {
		formData.value.status = parseInt(e.detail.value)
	}
	
	onMounted(() => {
		loadProjectList()
	})
</script>

<style lang="scss" scoped>
	.manage-container {
		min-height: 100vh;
		background-color: #f8f9fa;
		padding-bottom: 20rpx;
	}
	
	.toolbar {
		background-color: #fff;
		padding: 20rpx;
		margin-bottom: 20rpx;
		
		.add-btn {
			display: flex;
			align-items: center;
			justify-content: center;
			gap: 12rpx;
			background-color: #399bfe;
			color: #fff;
			border-radius: 8rpx;
			padding: 20rpx;
			font-size: 28rpx;
		}
	}
	
	.loading-container,
	.empty-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 200rpx 0;
		
		.loading-text,
		.empty-text {
			margin-top: 20rpx;
			font-size: 28rpx;
			color: #999;
		}
	}
	
	.list-content {
		padding: 0 20rpx;
	}
	
	.project-card {
		background-color: #fff;
		border-radius: 16rpx;
		padding: 24rpx;
		margin-bottom: 20rpx;
		box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.06);
		
		.card-header {
			margin-bottom: 20rpx;
			
			.title-row {
				display: flex;
				align-items: center;
				justify-content: space-between;
				margin-bottom: 12rpx;
				
				.project-title {
					flex: 1;
					font-size: 32rpx;
					font-weight: 600;
					color: #333;
				}
				
				.status-badge {
					padding: 6rpx 16rpx;
					border-radius: 8rpx;
					font-size: 22rpx;
					margin-left: 12rpx;
					
					&.online {
						background-color: rgba(82, 196, 26, 0.1);
						color: #52c41a;
					}
					
					&.offline {
						background-color: rgba(0, 0, 0, 0.06);
						color: #999;
					}
				}
			}
			
			.project-desc {
				font-size: 26rpx;
				color: #666;
				line-height: 1.5;
				display: -webkit-box;
				-webkit-line-clamp: 2;
				-webkit-box-orient: vertical;
				overflow: hidden;
			}
		}
		
		.card-info {
			display: flex;
			gap: 30rpx;
			margin-bottom: 20rpx;
			font-size: 24rpx;
			color: #999;
			
			.info-item {
				display: flex;
				align-items: center;
				gap: 6rpx;
			}
		}
		
		.card-actions {
			display: flex;
			gap: 16rpx;
			
			.action-btn {
				flex: 1;
				padding: 16rpx;
				border-radius: 8rpx;
				font-size: 26rpx;
				
				&.edit {
					background-color: rgba(57, 155, 254, 0.1);
					color: #399bfe;
				}
				
				&.toggle {
					background-color: rgba(250, 173, 20, 0.1);
					color: #faad14;
				}
				
				&.delete {
					background-color: rgba(255, 77, 79, 0.1);
					color: #ff4d4f;
				}
			}
		}
	}
	
	.edit-dialog {
		width: 650rpx;
		max-height: 80vh;
		background-color: #fff;
		border-radius: 16rpx;
		display: flex;
		flex-direction: column;
		
		.dialog-title {
			padding: 30rpx;
			font-size: 32rpx;
			font-weight: 600;
			color: #333;
			border-bottom: 1rpx solid #f0f0f0;
		}
		
		.dialog-content {
			flex: 1;
			padding: 30rpx;
			max-height: 900rpx;
		}
		
		.form-item {
			margin-bottom: 30rpx;
			
			.label {
				display: block;
				margin-bottom: 12rpx;
				font-size: 28rpx;
				color: #333;
				
				&.required::before {
					content: '* ';
					color: #ff4d4f;
				}
			}
			
			.input,
			.textarea {
				width: 100%;
				padding: 16rpx;
				border: 1rpx solid #e0e0e0;
				border-radius: 8rpx;
				font-size: 28rpx;
				box-sizing: border-box;
			}
			
			.textarea {
				height: 150rpx;
				
				&.large {
					height: 300rpx;
				}
			}
			
			.image-upload {
				position: relative;
				
				.preview-image {
					width: 100%;
					height: 300rpx;
					border-radius: 8rpx;
				}
				
				.upload-placeholder {
					width: 100%;
					height: 300rpx;
					border: 2rpx dashed #d9d9d9;
					border-radius: 8rpx;
					display: flex;
					flex-direction: column;
					align-items: center;
					justify-content: center;
					gap: 12rpx;
					color: #999;
					font-size: 26rpx;
				}
				
				.remove-btn {
					margin-top: 12rpx;
					padding: 12rpx 24rpx;
					background-color: #ff4d4f;
					color: #fff;
					border-radius: 8rpx;
					font-size: 24rpx;
				}
			}
			
			.radio-item {
				display: inline-flex;
				align-items: center;
				margin-right: 30rpx;
				font-size: 28rpx;
			}
		}
		
		.dialog-footer {
			display: flex;
			gap: 20rpx;
			padding: 30rpx;
			border-top: 1rpx solid #f0f0f0;
			
			.dialog-btn {
				flex: 1;
				padding: 20rpx;
				border-radius: 8rpx;
				font-size: 28rpx;
				
				&.cancel {
					background-color: #f5f5f5;
					color: #666;
				}
				
				&.confirm {
					background-color: #399bfe;
					color: #fff;
				}
			}
		}
	}
</style>
