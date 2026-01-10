<script setup>
import { ref } from 'vue'
import { onShow, onLoad } from '@dcloudio/uni-app'

const pageApi = uniCloud.importObject('customPageKs')
const configApi = uniCloud.importObject('config', { customUI: true })

// 获取页面列表
const pageList = ref([])
const activeTab = ref('all') // 当前激活的标签：all-全部，visible-已显示，hidden-已隐藏

// 总开关状态
const globalSwitch = ref(false)

// 弹窗ref
const popupRef = ref(null)

// 打开弹窗
const openPopup = () => {
	if (popupRef.value) {
		popupRef.value.open()
	}
}

// 关闭弹窗
const closePopup = () => {
	if (popupRef.value) {
		popupRef.value.close()
	}
}

const getPageList = async () => {
	try {
		const res = await pageApi.get()
		console.log('获取页面列表成功:', res)
		// 按照sort降序排列
		if (res.data && Array.isArray(res.data)) {
			res.data.sort((a, b) => (b.sort || 0) - (a.sort || 0))
		}
		pageList.value = res.data || []
	} catch (error) {
		console.error('获取页面列表失败:', error)
		pageList.value = []
		uni.showToast({
			title: '请先上传云函数 customPageKs',
			icon: 'none',
			duration: 3000
		})
	}
}

// 获取总开关状态
const getGlobalSwitchStatus = async () => {
	try {
		const res = await configApi.getConfig('customPageEntry')
		if (res && res.data) {
			globalSwitch.value = res.data.isVisible !== false
		} else {
			globalSwitch.value = false
		}
	} catch (err) {
		console.error('获取总开关状态失败:', err)
		globalSwitch.value = false
	}
}

// 切换总开关
const toggleGlobalSwitch = async (e) => {
	try {
		uni.showLoading({ title: '更新中...' })
		
		const newValue = e.detail.value
		const res = await configApi.updateConfig({
			key: 'customPageEntry',
			data: {
				isVisible: newValue
			}
		})
		
		if (res && res.code === 0) {
			globalSwitch.value = newValue
			
			// 发送全局事件通知前端
			uni.$emit('updateCustomPageEntry', {
				isVisible: newValue
			})
			
			uni.hideLoading()
			uni.showToast({
				title: newValue ? '已开启入口' : '已关闭入口',
				icon: 'success'
			})
		} else {
			// 更新失败,恢复原来的状态
			globalSwitch.value = !newValue
			uni.hideLoading()
			uni.showToast({
				title: '更新失败',
				icon: 'none'
			})
		}
	} catch (error) {
		// 出错时恢复原来的状态
		const oldValue = e.detail.value
		globalSwitch.value = !oldValue
		uni.hideLoading()
		console.error('切换总开关失败:', error)
		uni.showToast({
			title: '操作失败',
			icon: 'none'
		})
	}
}

// 页面加载和显示时获取数据
onLoad(() => {
	getPageList()
	getGlobalSwitchStatus()
})

onShow(() => {
	getPageList()
	getGlobalSwitchStatus()
})

// 弹窗显示状态
const showPopup = ref(false)
const isEdit = ref(false)
const currentId = ref('')

// 编辑时的初始值
const editData = ref({
	title: '',
	content: '',
	contact_info: '',
	qr_code_image: '',
	background_color: '#ffffff',
	text_color: '#333333',
	sort: 0
})

// 批量删除相关状态
const isSelectMode = ref(false)
const selectedItems = ref([])

// 切换标签
const switchTab = (tab) => {
	activeTab.value = tab
}

// 根据标签过滤显示的列表
const filteredPageList = () => {
	if (activeTab.value === 'visible') {
		return pageList.value.filter(item => item.is_visible !== false)
	} else if (activeTab.value === 'hidden') {
		return pageList.value.filter(item => item.is_visible === false)
	}
	return pageList.value
}

// 切换选择模式
const toggleSelectMode = () => {
	isSelectMode.value = !isSelectMode.value
	selectedItems.value = []
}

// 选择/取消选择项目
const toggleSelectItem = (id) => {
	const index = selectedItems.value.indexOf(id)
	if (index === -1) {
		selectedItems.value.push(id)
	} else {
		selectedItems.value.splice(index, 1)
	}
}

// 全选/取消全选
const toggleSelectAll = () => {
	const currentList = filteredPageList()
	if (selectedItems.value.length === currentList.length) {
		selectedItems.value = []
	} else {
		selectedItems.value = currentList.map(item => item._id)
	}
}

// 批量删除
const batchDelete = () => {
	if (selectedItems.value.length === 0) {
		uni.showToast({
			title: '请先选择要删除的页面',
			icon: 'none'
		})
		return
	}
	
	uni.showModal({
		title: '⚠️ 批量删除',
		content: `确定要删除选中的 ${selectedItems.value.length} 个页面吗？\n删除后无法恢复。`,
		confirmColor: '#e65c00',
		confirmText: '删除',
		cancelText: '取消',
		success: async (res) => {
			if (res.confirm) {
				try {
					uni.showLoading({
						title: '删除中...',
						mask: true
					})
					
					let successCount = 0
					for (const id of selectedItems.value) {
						try {
							const res = await pageApi.del(id)
							if (res.deleted === 1) {
								successCount++
							}
						} catch (error) {
							console.error(`删除页面 ${id} 失败:`, error)
						}
					}
					
					uni.hideLoading()
					uni.showToast({
						title: `成功删除 ${successCount} 个页面`,
						icon: 'none'
					})
					
					getPageList()
					isSelectMode.value = false
					selectedItems.value = []
				} catch (error) {
					uni.hideLoading()
					console.error('批量删除出错:', error)
					uni.showToast({
						title: '删除失败: ' + (error.message || '未知错误'),
						icon: 'none'
					})
				}
			}
		}
	})
}

// 添加页面
const handleAddPage = () => {
	isEdit.value = false
	editData.value = {
		title: '',
		content: '',
		contact_info: '',
		qr_code_image: '',
		background_color: '#ffffff',
		text_color: '#333333',
		sort: 0
	}
	openPopup()
}

// 编辑页面
const edit = async (id) => {
	isEdit.value = true
	currentId.value = id
	try {
		const res = await pageApi.get(id)
		if (res.data && res.data.length > 0) {
			const data = res.data[0]
			editData.value = {
				title: data.title || '',
				content: data.content || '',
				contact_info: data.contact_info || '',
				qr_code_image: data.qr_code_image || '',
				background_color: data.background_color || '#ffffff',
				text_color: data.text_color || '#333333',
				sort: data.sort || 0
			}
		}
		openPopup()
	} catch (error) {
		console.error('获取页面数据失败:', error)
		uni.showToast({
			title: '获取页面数据失败',
			icon: 'none'
		})
	}
}

// 删除页面
const del = async (id) => {
	const page = pageList.value.find(item => item._id === id)
	const pageName = page ? page.title : '此页面'
	
	uni.showModal({
		title: '⚠️ 确认删除',
		content: `确定要删除"${pageName}"吗？\n删除后无法恢复。`,
		confirmColor: '#e65c00',
		confirmText: '删除',
		cancelText: '取消',
		success: async (res) => {
			if (res.confirm) {
				try {
					uni.showLoading({
						title: '删除中...',
						mask: true
					})
					
					const res = await pageApi.del(id)
					uni.hideLoading()
					
					if (res.deleted === 1) {
						uni.showToast({
							title: '删除成功',
							icon: 'none'
						})
						getPageList()
					} else {
						uni.showToast({
							title: '删除失败',
							icon: 'none'
						})
					}
				} catch (error) {
					uni.hideLoading()
					console.error('删除页面出错:', error)
					uni.showToast({
						title: '删除失败: ' + (error.message || '未知错误'),
						icon: 'none'
					})
				}
			}
		}
	})
}

// 确认添加/编辑
const handleConfirm = async () => {
	if (!editData.value.title || !editData.value.title.trim()) {
		uni.showToast({
			title: '请输入页面标题',
			icon: 'none'
		})
		return
	}
	
	uni.showLoading({
		title: '处理中...',
		mask: true
	})
	
	try {
		if (isEdit.value) {
			const upRes = await pageApi.update(currentId.value, editData.value)
			uni.hideLoading()
			
			if (upRes.updated === 1) {
				uni.showToast({
					title: '更新成功',
					icon: 'success'
				})
				getPageList()
				closePopup()
			} else {
				uni.showToast({
					title: upRes.errMsg || '更新失败',
					icon: 'none'
				})
			}
		} else {
			const res = await pageApi.add(editData.value)
			uni.hideLoading()
			
			if (res.id) {
				uni.showToast({
					title: '添加成功',
					icon: 'success'
				})
				getPageList()
				closePopup()
			} else {
				uni.showToast({
					title: res.errMsg || '添加失败',
					icon: 'none'
				})
			}
		}
	} catch (error) {
		uni.hideLoading()
		console.error('操作失败:', error)
		uni.showToast({
			title: '操作失败: ' + (error.message || '未知错误'),
			icon: 'none'
		})
	}
	
	currentId.value = ''
}

// 上移和下移
const swapItems = async (index1, index2) => {
	uni.showLoading({
		title: '更新排序...',
		mask: true
	})
	
	try {
		const currentList = filteredPageList()
		const item1 = currentList[index1]
		const item2 = currentList[index2]
		
		const tempSort = item1.sort
		await pageApi.updateSort(item1._id, item2.sort)
		await pageApi.updateSort(item2._id, tempSort)
		
		await getPageList()
		uni.hideLoading()
	} catch (error) {
		console.error('交换位置失败:', error)
		uni.hideLoading()
		uni.showToast({
			title: '更新排序失败',
			icon: 'none'
		})
	}
}

const moveUp = async (index) => {
	if (index === 0) {
		uni.showToast({
			title: '已经是第一项',
			icon: 'none'
		})
		return
	}
	await swapItems(index, index - 1)
	uni.showToast({
		title: '上移成功',
		icon: 'success'
	})
}

const moveDown = async (index) => {
	const currentList = filteredPageList()
	if (index === currentList.length - 1) {
		uni.showToast({
			title: '已经是最后一项',
			icon: 'none'
		})
		return
	}
	await swapItems(index, index + 1)
	uni.showToast({
		title: '下移成功',
		icon: 'success'
	})
}

// 切换页面可见性
const togglePageVisibility = async (id, currentVisibility) => {
	try {
		uni.showLoading({
			title: '更新中...',
			mask: true
		})
		
		const newVisibility = !currentVisibility
		const upRes = await pageApi.updateVisibility(id, newVisibility)
		
		uni.hideLoading()
		
		if (upRes.updated === 1 || upRes.code === 0) {
			uni.showToast({
				title: newVisibility ? '已设为显示' : '已设为隐藏',
				icon: 'success'
			})
			await getPageList()
		} else {
			uni.showToast({
				title: upRes.errMsg || '更新失败',
				icon: 'none'
			})
		}
	} catch (error) {
		console.error('切换页面可见性失败:', error)
		uni.hideLoading()
		uni.showToast({
			title: '操作失败: ' + (error.message || '未知错误'),
			icon: 'none'
		})
	}
}

// 选择图片
const chooseImage = async () => {
	uni.chooseImage({
		count: 1,
		sizeType: ['compressed'],
		sourceType: ['album', 'camera'],
		success: async (res) => {
			const tempFilePath = res.tempFilePaths[0]
			
			uni.showLoading({
				title: '上传中...',
				mask: true
			})
			
			try {
				const uploadRes = await uniCloud.uploadFile({
					filePath: tempFilePath,
					cloudPath: `customPage/${Date.now()}_${Math.random().toString(36).substr(2)}.jpg`
				})
				
				editData.value.qr_code_image = uploadRes.fileID
				uni.hideLoading()
				uni.showToast({
					title: '上传成功',
					icon: 'success'
				})
			} catch (error) {
				uni.hideLoading()
				console.error('上传图片失败:', error)
				uni.showToast({
					title: '上传失败',
					icon: 'none'
				})
			}
		}
	})
}

// 预览页面
const previewPage = (id) => {
	uni.navigateTo({
		url: `/subPages/customPageDisplay/customPageDisplay?id=${id}`
	})
}
</script>

<template>
	<view class="pageManage">
		<!-- 操作栏 -->
		<view class="operation-bar">
			<view class="left">
				<view class="title">自定义页面</view>
				<view class="count">共 {{pageList.length}} 个</view>
			</view>
			<view class="right">
				<view class="batch-btn" @click="toggleSelectMode">
					{{ isSelectMode ? '取消' : '批量删除' }}
				</view>
			</view>
		</view>
		
		<!-- 标签栏 -->
		<view class="tab-bar">
			<view 
				class="tab-item" 
				:class="{ active: activeTab === 'all' }"
				@click="switchTab('all')"
			>
				<text>全部</text>
				<view class="badge">{{pageList.length}}</view>
			</view>
			<view 
				class="tab-item" 
				:class="{ active: activeTab === 'visible' }"
				@click="switchTab('visible')"
			>
				<text>已显示</text>
				<view class="badge">{{pageList.filter(item => item.is_visible !== false).length}}</view>
			</view>
			<view 
				class="tab-item" 
				:class="{ active: activeTab === 'hidden' }"
				@click="switchTab('hidden')"
			>
				<text>已隐藏</text>
				<view class="badge">{{pageList.filter(item => item.is_visible === false).length}}</view>
			</view>
		</view>
		
		<!-- 批量操作工具栏 -->
		<view class="batch-toolbar" v-if="isSelectMode">
			<view class="select-all" @click="toggleSelectAll">
				<text class="checkbox" :class="{ checked: selectedItems.length === filteredPageList().length && filteredPageList().length > 0 }">
					<text class="iconfont icon-duihao" v-if="selectedItems.length === filteredPageList().length && filteredPageList().length > 0"></text>
				</text>
				<text>全选</text>
			</view>
			<view class="selected-count">
				已选择 {{selectedItems.length}} 项
			</view>
			<view class="batch-delete-btn" @click="batchDelete" :class="{ disabled: selectedItems.length === 0 }">
				<uni-icons color="#fff" custom-prefix="iconfont" type="icon-shanchu1" size="18"></uni-icons>
				<text>删除</text>
			</view>
		</view>
		
		<!-- 页面列表 -->
		<view class="pageList">
			<view class="page-item" 
				v-for="(item, index) in filteredPageList()" 
				:key="item._id"
			>
				<!-- 选择框 -->
				<view class="checkbox-wrapper" v-if="isSelectMode" @click.stop="toggleSelectItem(item._id)">
					<view class="checkbox" :class="{ checked: selectedItems.includes(item._id) }">
						<text class="iconfont icon-duihao" v-if="selectedItems.includes(item._id)"></text>
					</view>
				</view>
				
				<view class="page-info" @click="previewPage(item._id)">
					<view class="title-row">
						<text class="title">{{item.title}}</text>
						<view class="meta-info">
							<text class="sort-tag">排序: {{item.sort || 0}}</text>
							<text class="view-tag">浏览: {{item.view_count || 0}}</text>
						</view>
					</view>
					<view class="content-preview" v-if="item.content">
						{{item.content.substring(0, 50)}}{{item.content.length > 50 ? '...' : ''}}
					</view>
					<view class="contact-info" v-if="item.contact_info">
						<uni-icons type="phone" size="14" color="#999"></uni-icons>
						<text>{{item.contact_info}}</text>
					</view>
				</view>
				
				<view class="actions">
					<view class="sort-buttons" v-if="!isSelectMode">
						<view class="sort-btn up" @click="moveUp(index)">
							<uni-icons type="arrow-up" size="18" color="#399bfe"></uni-icons>
						</view>
						<view class="sort-btn down" @click="moveDown(index)">
							<uni-icons type="arrow-down" size="18" color="#399bfe"></uni-icons>
						</view>
					</view>
					<view class="edit-icon" @click="edit(item._id)" v-if="!isSelectMode">
						<uni-icons color="#399bfe" type="compose" size="22"></uni-icons>
					</view>
					<view class="delete-icon" @click="del(item._id)" v-if="!isSelectMode">
						<uni-icons color="#e65c00" custom-prefix="iconfont" type="icon-shanchu1" size="20"></uni-icons>
					</view>
				</view>
			</view>
			
			<!-- 空状态 -->
			<view class="empty-state" v-if="filteredPageList().length === 0">
				<uni-icons type="info" size="60" color="#ccc"></uni-icons>
				<text>暂无页面</text>
			</view>
		</view>
		
		<!-- 编辑弹窗 -->
		<uni-popup ref="popupRef" type="bottom">
			<view class="popup-content">
				<view class="popup-header">
					<text class="popup-title">{{ isEdit ? '编辑页面' : '添加页面' }}</text>
					<view class="close-btn" @click="closePopup">
						<uni-icons type="close" size="24" color="#666"></uni-icons>
					</view>
				</view>
				
				<view class="form-content">
					<view class="form-item">
						<text class="label">页面标题</text>
						<input 
							class="input" 
							v-model="editData.title" 
							placeholder="请输入页面标题"
							maxlength="50"
						/>
					</view>
					
					<view class="form-item">
						<text class="label">页面内容</text>
						<textarea 
							class="textarea" 
							v-model="editData.content" 
							placeholder="请输入页面内容"
							maxlength="500"
						/>
					</view>
					
					<view class="form-item">
						<text class="label">联系方式</text>
						<input 
							class="input" 
							v-model="editData.contact_info" 
							placeholder="请输入联系方式（微信号、电话等）"
						/>
					</view>
					
					<view class="form-item">
						<text class="label">二维码图片</text>
						<view class="image-upload" @click="chooseImage">
							<image v-if="editData.qr_code_image" :src="editData.qr_code_image" mode="aspectFit" class="preview-image" />
							<view v-else class="upload-placeholder">
								<uni-icons type="camera" size="40" color="#999"></uni-icons>
								<text>点击上传二维码</text>
							</view>
						</view>
					</view>
					
					<view class="form-item">
						<text class="label">背景颜色</text>
						<input 
							class="input color-input" 
							v-model="editData.background_color" 
							type="text"
							placeholder="#ffffff"
						/>
					</view>
					
					<view class="form-item">
						<text class="label">文字颜色</text>
						<input 
							class="input color-input" 
							v-model="editData.text_color" 
							type="text"
							placeholder="#333333"
						/>
					</view>
					
					<view class="form-item">
						<text class="label">排序值</text>
						<input 
							class="input" 
							v-model.number="editData.sort" 
							type="number"
							placeholder="数字越大越靠前"
						/>
					</view>
				</view>
				
				<view class="popup-footer">
					<view class="btn cancel-btn" @click="closePopup">取消</view>
					<view class="btn confirm-btn" @click="handleConfirm">确定</view>
				</view>
			</view>
		</uni-popup>
	</view>
	
	<!-- 总开关 -->
	<view class="global-switch-panel">
		<switch :checked="globalSwitch" @change="toggleGlobalSwitch" color="#4CD964" />
	</view>
	
	<!-- 悬浮按钮 -->
	<floatButton 
		icon="plus" 
		:size="100" 
		:position="{ bottom: '120rpx', right: '40rpx' }"
		@click="handleAddPage"
	></floatButton>
</template>

<style lang="scss" scoped>
@import "@/style/common.scss";

.pageManage {
	padding: 24rpx;
	min-height: 100vh;
	background-color: $pyq-pages-bg-color;
	padding-bottom: 200rpx;
	
	.operation-bar {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 24rpx;
		margin-bottom: 20rpx;
		background-color: #fff;
		border-radius: 24rpx;
		box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.05);
		
		.left {
			display: flex;
			align-items: center;
			
			.title {
				font-size: 32rpx;
				font-weight: bold;
				color: $pyq-text-color-title;
			}
			
			.count {
				font-size: 24rpx;
				color: $pyq-text-color-helper;
				margin-left: 16rpx;
			}
		}
		
		.right {
			.batch-btn {
				font-size: 28rpx;
				color: #399bfe;
				padding: 10rpx 20rpx;
				border-radius: 8rpx;
				background-color: rgba(57, 155, 254, 0.1);
				
				&:active {
					background-color: rgba(57, 155, 254, 0.2);
				}
			}
		}
	}
	
	.tab-bar {
		display: flex;
		background-color: #fff;
		border-radius: 24rpx;
		padding: 10rpx;
		margin-bottom: 20rpx;
		box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.05);
		
		.tab-item {
			flex: 1;
			display: flex;
			align-items: center;
			justify-content: center;
			padding: 20rpx;
			border-radius: 16rpx;
			font-size: 28rpx;
			color: $pyq-text-color-helper;
			position: relative;
			transition: all 0.3s;
			
			.badge {
				margin-left: 8rpx;
				background-color: #f0f0f0;
				color: $pyq-text-color-helper;
				font-size: 22rpx;
				padding: 2rpx 10rpx;
				border-radius: 10rpx;
			}
			
			&.active {
				background-color: #399bfe;
				color: #fff;
				
				.badge {
					background-color: rgba(255, 255, 255, 0.3);
					color: #fff;
				}
			}
		}
	}
	
	.batch-toolbar {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 20rpx 24rpx;
		margin-bottom: 20rpx;
		background-color: #fff;
		border-radius: 24rpx;
		box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.05);
		
		.select-all {
			display: flex;
			align-items: center;
			font-size: 28rpx;
			color: $pyq-text-color-body;
			
			.checkbox {
				display: flex;
				justify-content: center;
				align-items: center;
				width: 36rpx;
				height: 36rpx;
				border: 2rpx solid #ddd;
				border-radius: 6rpx;
				margin-right: 10rpx;
				
				&.checked {
					background-color: #399bfe;
					border-color: #399bfe;
					
					.icon-duihao {
						color: #fff;
						font-size: 24rpx;
					}
				}
			}
		}
		
		.selected-count {
			font-size: 28rpx;
			color: $pyq-text-color-helper;
		}
		
		.batch-delete-btn {
			font-size: 28rpx;
			color: #fff;
			background-color: #e65c00;
			padding: 10rpx 30rpx;
			border-radius: 8rpx;
			display: flex;
			align-items: center;
			gap: 8rpx;
			
			&.disabled {
				background-color: #ccc;
			}
		}
	}
	
	.pageList {
		background-color: #fff;
		border-radius: 24rpx;
		padding: 24rpx;
		box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.05);
		
		.page-item {
			display: flex;
			align-items: center;
			padding: 20rpx 0;
			border-bottom: 1px solid $pyq-border-color-translucent;
			
			&:last-child {
				border-bottom: none;
			}
			
			.checkbox-wrapper {
				margin-right: 16rpx;
				
				.checkbox {
					display: flex;
					justify-content: center;
					align-items: center;
					width: 36rpx;
					height: 36rpx;
					border: 2rpx solid #ddd;
					border-radius: 6rpx;
					
					&.checked {
						background-color: #399bfe;
						border-color: #399bfe;
						
						.icon-duihao {
							color: #fff;
							font-size: 24rpx;
						}
					}
				}
			}
			
			.page-info {
				flex: 1;
				
				.title-row {
					display: flex;
					justify-content: space-between;
					align-items: center;
					margin-bottom: 8rpx;
					
					.title {
						font-size: 30rpx;
						font-weight: 500;
						color: $pyq-text-color-body;
					}
					
					.meta-info {
						display: flex;
						gap: 16rpx;
						font-size: 24rpx;
						color: $pyq-text-color-helper;
						
						.sort-tag, .view-tag {
							white-space: nowrap;
						}
					}
				}
				
				.content-preview {
					font-size: 26rpx;
					color: $pyq-text-color-helper;
					margin-bottom: 8rpx;
					line-height: 1.5;
				}
				
				.contact-info {
					display: flex;
					align-items: center;
					gap: 8rpx;
					font-size: 24rpx;
					color: $pyq-text-color-helper;
				}
			}
			
			.actions {
				display: flex;
				align-items: center;
				gap: 10rpx;
				margin-left: 16rpx;
				
				.visibility-btn {
					font-size: 24rpx;
					padding: 6rpx 16rpx;
					border-radius: 6rpx;
					
					&.visible {
						color: #4CD964;
						background-color: rgba(76, 217, 100, 0.1);
					}
					
					&.hidden {
						color: #FF9500;
						background-color: rgba(255, 149, 0, 0.1);
					}
				}
				
				.sort-buttons {
					display: flex;
					
					.sort-btn {
						width: 60rpx;
						height: 60rpx;
						display: flex;
						align-items: center;
						justify-content: center;
						background-color: rgba(57, 155, 254, 0.1);
						border-radius: 8rpx;
						margin-right: 6rpx;
						
						&:active {
							background-color: rgba(57, 155, 254, 0.2);
						}
					}
				}
				
				.edit-icon {
					background-color: rgba(57, 155, 254, 0.1);
					border-radius: 8rpx;
					padding: 8rpx 16rpx;
					
					&:active {
						background-color: rgba(57, 155, 254, 0.2);
					}
				}
				
				.delete-icon {
					background-color: rgba(230, 92, 0, 0.15);
					border-radius: 8rpx;
					padding: 8rpx 16rpx;
					
					&:active {
						background-color: rgba(230, 92, 0, 0.25);
					}
				}
			}
		}
		
		.empty-state {
			display: flex;
			flex-direction: column;
			align-items: center;
			justify-content: center;
			padding: 100rpx 0;
			
			text {
				margin-top: 20rpx;
				font-size: 28rpx;
				color: $pyq-text-color-helper;
			}
		}
	}
	
	.popup-content {
		background-color: #fff;
		border-radius: 24rpx 24rpx 0 0;
		max-height: 80vh;
		display: flex;
		flex-direction: column;
		
		.popup-header {
			display: flex;
			justify-content: space-between;
			align-items: center;
			padding: 24rpx;
			border-bottom: 1px solid $pyq-border-color-translucent;
			
			.popup-title {
				font-size: 32rpx;
				font-weight: bold;
				color: $pyq-text-color-title;
			}
		}
		
		.form-content {
			flex: 1;
			overflow-y: auto;
			padding: 24rpx;
			
			.form-item {
				margin-bottom: 30rpx;
				
				.label {
					display: block;
					font-size: 28rpx;
					color: $pyq-text-color-body;
					margin-bottom: 12rpx;
				}
				
				.input, .textarea {
					width: 100%;
					padding: 20rpx;
					border: 1px solid $pyq-border-color-translucent;
					border-radius: 12rpx;
					font-size: 28rpx;
					background-color: #f7f7f7;
				}
				
				.textarea {
					min-height: 200rpx;
				}
				
				.image-upload {
					width: 100%;
					height: 400rpx;
					border: 2rpx dashed #ddd;
					border-radius: 12rpx;
					display: flex;
					align-items: center;
					justify-content: center;
					background-color: #f7f7f7;
					
					.preview-image {
						width: 100%;
						height: 100%;
						border-radius: 12rpx;
					}
					
					.upload-placeholder {
						display: flex;
						flex-direction: column;
						align-items: center;
						color: #999;
						
						text {
							margin-top: 16rpx;
							font-size: 26rpx;
						}
					}
				}
			}
		}
		
		.popup-footer {
			display: flex;
			padding: 24rpx;
			gap: 20rpx;
			border-top: 1px solid $pyq-border-color-translucent;
			
			.btn {
				flex: 1;
				padding: 24rpx;
				text-align: center;
				border-radius: 12rpx;
				font-size: 30rpx;
				
				&.cancel-btn {
					background-color: #f7f7f7;
					color: $pyq-text-color-body;
				}
				
				&.confirm-btn {
					background-color: #399bfe;
					color: #fff;
				}
			}
		}
	}
}

// 总开关面板
.global-switch-panel {
	position: fixed;
	bottom: 250rpx;
	right: 40rpx;
	background: #ffffff;
	border-radius: 40rpx;
	box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.15);
	padding: 12rpx 16rpx;
	z-index: 999;
	display: flex;
	align-items: center;
	justify-content: center;
}
</style>
