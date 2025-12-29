<script setup>
	import { ref } from 'vue'
	import { onShow, onLoad } from '@dcloudio/uni-app'
	// 确保导入 manage-popup 组件
	import managePopup from '@/components/manage-popup/manage-popup.vue'
	
	const cateApi = uniCloud.importObject( 'cateKs' )
	// 获取分类
	const cateList = ref( [ ] )
	
	// 分类全局可见性状态
	const globalCategoryVisibility = ref(true)
	
	const cateListGet = async ( ) => {
		console.log('开始获取分类列表')
		try {
			const res = await cateApi.get( )
			console.log( '获取分类列表成功:', res )
			// 确保按照sort降序排列
			if (res.data && Array.isArray(res.data)) {
				res.data.sort((a, b) => (b.sort || 0) - (a.sort || 0));
			}
			cateList.value = res.data
			console.log('分类列表数据已更新，当前列表长度:', cateList.value.length)
			
			// 检查分类的可见性状态，如果所有分类都可见或都不可见，则更新全局状态
			if(cateList.value.length > 0) {
				// 检查是否所有分类都可见
				const allVisible = cateList.value.every(item => item.is_visible !== false);
				// 检查是否所有分类都不可见
				const allHidden = cateList.value.every(item => item.is_visible === false);
				
				if(allVisible) {
					globalCategoryVisibility.value = true;
				} else if(allHidden) {
					globalCategoryVisibility.value = false;
				}
				// 如果有些可见有些不可见，保持现状
			}
		} catch (error) {
			console.error('获取分类列表失败:', error)
		}
	}
	
	// 切换所有分类的可见性
	const toggleAllCategoriesVisibility = async (e) => {
		const isVisible = e.detail.value;
		
		try {
			// 显示加载提示
			uni.showLoading({
				title: isVisible ? '显示分类中...' : '隐藏分类中...',
				mask: true
			});
			
			// 调用云函数更新所有分类的可见性
			const res = await cateApi.updateVisibility(isVisible);
			console.log('更新所有分类可见性结果:', res);
			
			// 隐藏加载提示
			uni.hideLoading();
			
			if(res.code === 0) {
				// 更新本地状态
				globalCategoryVisibility.value = isVisible;
				
				// 显示成功提示
				uni.showToast({
					title: isVisible ? '所有分类已显示' : '所有分类已隐藏',
					icon: 'success'
				});
				
				// 刷新分类列表
				await cateListGet();
				
				// 获取最新的分类列表数据
				const cateRes = await cateApi.get();
				const hiddenCategoryIds = cateRes.data.filter(item => item.is_visible === false).map(item => item._id);
				
				// 发送全局事件，通知首页刷新数据
				uni.$emit('categoryVisibilityChanged', {
					isVisible: isVisible,
					hiddenCategoryIds: hiddenCategoryIds,
					allCategories: cateRes.data
				});
			} else {
				// 显示错误提示
				uni.showToast({
					title: res.errMsg || '操作失败',
					icon: 'none'
				});
			}
		} catch (error) {
			// 隐藏加载提示
			uni.hideLoading();
			
			console.error('切换分类可见性失败:', error);
			uni.showToast({
				title: '操作失败: ' + (error.message || '未知错误'),
				icon: 'none'
			});
		}
	};
	
	// 页面加载和显示时获取数据
	onLoad(() => {
		console.log('页面加载完成')
		cateListGet()
	})
	
	onShow( ( ) => {
		console.log('页面显示，开始获取分类列表')
		cateListGet( )
	} )
	
	// 弹窗显示状态 - 初始值设为 false
	const showPopup = ref( false )
	// 是否是编辑模式
	const isEdit = ref( false )
	// 编辑时的初始值
	const editValue = ref( '' )
	// 编辑时的图片
	const editImg = ref( '' )
	// 编辑时的排序
	const editSort = ref( 0 )
	// 编辑时的可见性 - 移除
	// const editVisible = ref( true )

	// 当前编辑的分类ID
	const currentId = ref( '' )
	
	// 批量删除相关状态
	const isSelectMode = ref(false)
	const selectedItems = ref([])
	
	// 切换选择模式
	const toggleSelectMode = () => {
		isSelectMode.value = !isSelectMode.value
		// 清空已选项
		selectedItems.value = []
	}
	
	// 选择/取消选择项目
	const toggleSelectItem = (id) => {
		const index = selectedItems.value.indexOf(id)
		if (index === -1) {
			// 添加到选中列表
			selectedItems.value.push(id)
		} else {
			// 从选中列表移除
			selectedItems.value.splice(index, 1)
		}
	}
	
	// 全选/取消全选
	const toggleSelectAll = () => {
		if (selectedItems.value.length === cateList.value.length) {
			// 如果已全选，则取消全选
			selectedItems.value = []
		} else {
			// 否则全选
			selectedItems.value = cateList.value.map(item => item._id)
		}
	}
	
	// 批量删除
	const batchDelete = () => {
		if (selectedItems.value.length === 0) {
			uni.showToast({
				title: '请先选择要删除的分类',
				icon: 'none'
			})
			return
		}
		
		// 显示确认对话框
		uni.showModal({
			title: '⚠️ 批量删除',
			content: `确定要删除选中的 ${selectedItems.value.length} 个分类吗？\n删除后无法恢复。`,
			confirmColor: '#e65c00',
			confirmText: '删除',
			cancelText: '取消',
			success: async (res) => {
				if (res.confirm) {
					// 用户确认删除
					try {
						// 显示加载提示
						uni.showLoading({
							title: '删除中...',
							mask: true
						})
						
						// 记录成功删除的数量
						let successCount = 0
						
						// 逐个删除
						for (const id of selectedItems.value) {
							try {
								const res = await cateApi.del(id)
								if (res.deleted === 1) {
									successCount++
								}
							} catch (error) {
								console.error(`删除分类 ${id} 失败:`, error)
							}
						}
						
						// 隐藏加载提示
						uni.hideLoading()
						
						// 显示结果
						uni.showToast({
							title: `成功删除 ${successCount} 个分类`,
							icon: 'none'
						})
						
						// 重新获取分类列表
						cateListGet()
						
						// 退出选择模式
						isSelectMode.value = false
						selectedItems.value = []
						
					} catch (error) {
						// 隐藏加载提示
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

	// 添加分类
	const handleAddCate = ( ) => {
		console.log('点击添加分类按钮')
		// isEdit为false代表此时添加操作
		isEdit.value = false
		// 清空编辑值
		editValue.value = ''
		editImg.value = ''
		// 确保在下一个事件循环中打开弹窗
		setTimeout(() => {
			showPopup.value = true
			console.log('打开添加分类弹窗，showPopup值:', showPopup.value)
		}, 0)
	}

	// 编辑分类
	const edit = async ( id ) => {
		console.log('开始编辑分类，ID:', id)
		isEdit.value = true
		currentId.value = id // 保存当前编辑的ID
		// 根据点击id获取对应分类名称
		try {
			const res = await cateApi.get( id )
			console.log( '获取单个分类数据成功:', res )
			// 修复数据获取方式，根据返回的数据结构正确获取分类名称和图片
			if (res.data && res.data.length > 0) {
				console.log('使用数组格式的数据:', res.data[0])
				editValue.value = res.data[0].cate_name
				// 保存排序和可见性
				editSort.value = res.data[0].sort || 0
				// editVisible.value = res.data[0].is_visible !== false
				editImg.value = res.data[0].cate_img || '/static/images/defalut.png'
			} else if (res.data) {
				// 如果直接返回单个对象
				console.log('使用对象格式的数据:', res.data)
				editValue.value = res.data.cate_name
				// 保存排序和可见性
				editSort.value = res.data.sort || 0
				// editVisible.value = res.data.is_visible !== false
				editImg.value = res.data.cate_img || '/static/images/defalut.png'
			}
			console.log('设置编辑值为:', editValue.value, '排序为:', editSort.value)
			
			// 直接设置弹窗显示，不使用setTimeout
			showPopup.value = true
			console.log('打开编辑分类弹窗，showPopup值:', showPopup.value)
		} catch (error) {
			console.error('获取单个分类数据失败:', error)
			uni.showToast({
				title: '获取分类数据失败',
				icon: 'none'
			})
		}
	}

	// 删除分类
	const del = async ( id ) => {
		console.log('开始删除分类，ID:', id)
		
		// 获取分类名称
		const category = cateList.value.find(item => item._id === id);
		const cateName = category ? category.cate_name : '此分类';
		
		// 添加确认对话框
		uni.showModal({
			title: '⚠️ 确认删除',
			content: `确定要删除"${cateName}"吗？\n删除后无法恢复。`,
			confirmColor: '#e65c00',
			confirmText: '删除',
			cancelText: '取消',
			success: async (res) => {
				if (res.confirm) {
					// 用户点击确定，执行删除操作
					try {
						// 显示加载提示
						uni.showLoading({
							title: '删除中...',
							mask: true
						})
						
						const res = await cateApi.del( id )
						console.log('删除分类结果:', res)
						
						// 隐藏加载提示
						uni.hideLoading()
						
						if ( res.deleted === 1 ) {
							uni.showToast( {
								title: '删除成功',
								icon: 'none'
							} )
							console.log('删除成功，重新获取分类列表')
							cateListGet( )
						} else {
							console.warn('删除失败，返回结果:', res)
							uni.showToast( {
								title: '删除失败',
								icon: 'none'
							} )
						}
					} catch (error) {
						console.error('删除分类出错:', error)
						// 隐藏加载提示
						uni.hideLoading()
						
						// 显示错误信息
						uni.showToast( {
							title: '删除失败: ' + (error.message || '未知错误'),
							icon: 'none'
						} )
					}
				} else {
					// 用户点击取消，不执行任何操作
					console.log('用户取消删除操作')
				}
			}
		})
	}

	// 确认添加/编辑--弹框确认事件
	const handleConfirm = async ( value ) => {
		console.log('确认按钮点击，输入值:', value)
		
		// 解构获取名称和图片
		const { name, img, sort, is_visible } = value
		
		// 验证名称
		if (!name || !name.trim()) {
			uni.showToast({
				title: '请输入分类名称',
				icon: 'none'
			})
			return
		}
		
		// 显示加载提示
		uni.showLoading({
			title: '处理中...',
			mask: true
		})
		
		try {
			// 确保图片路径有效
			const imgPath = img || '/static/images/defalut.png'
			// 确保排序值有效
			const sortValue = sort !== undefined ? parseInt(sort) : (isEdit.value ? editSort.value : 0)
			// 确保可见性有效
			const visibleValue = is_visible !== undefined ? is_visible : true
			
			console.log('使用的参数:', {
				name,
				imgPath,
				sortValue,
				visibleValue
			})
			
			if ( isEdit.value ) {
				// 编辑逻辑
				console.log( '执行编辑操作，ID:', currentId.value, '新值:', name, '图片:', imgPath, '排序:', sortValue, '可见性:', visibleValue )
				
				const upRes = await cateApi.update( currentId.value, name, imgPath, sortValue, visibleValue ) // 使用保存的ID
				console.log( '更新分类结果:', upRes )
				
				// 隐藏加载提示
				uni.hideLoading()
				
				if ( upRes.updated === 1 ) {
					uni.showToast( {
						title: '更新成功',
						icon: 'success'
					} )
					console.log('更新成功，重新获取分类列表')
					cateListGet( )
					// 关闭弹窗
					showPopup.value = false
					// 清空编辑值
					editValue.value = ''
					editImg.value = ''
					editSort.value = 0
					console.log('弹窗已关闭，编辑值已清空')
				} else {
					console.warn('更新失败，返回结果:', upRes)
					uni.showToast( {
						title: upRes.errMsg || '更新失败',
						icon: 'none'
					} )
				}
			} else {
				// 添加逻辑
				console.log( '执行添加操作，值:', name, '图片:', imgPath, '排序:', sortValue )
				
				const res = await cateApi.add( name, imgPath, sortValue )
				console.log('添加分类结果:', res)
				
				// 隐藏加载提示
				uni.hideLoading()
				
				if ( res.id ) {
					uni.showToast( {
						title: '添加成功',
						icon: 'success'
					} )
					console.log('添加成功，重新获取分类列表')
					cateListGet( )
					// 关闭弹窗
					showPopup.value = false
					// 清空编辑值
					editValue.value = ''
					editImg.value = ''
					editSort.value = 0
					console.log('弹窗已关闭，编辑值已清空')
				} else {
					console.warn('添加失败，返回结果:', res)
					uni.showToast( {
						title: res.errMsg || '添加失败',
						icon: 'none'
					} )
				}
			}
		} catch (error) {
			// 隐藏加载提示
			uni.hideLoading()
			
			console.error('操作失败:', error)
			uni.showToast( {
				title: '操作失败: ' + (error.message || '未知错误'),
				icon: 'none'
			} )
		}
		
		// 重置当前编辑的ID
		currentId.value = ''
		console.log('当前编辑ID已重置')
	}
	
	// 监听弹窗状态变化
	const watchPopupState = (val) => {
		console.log('弹窗状态变化:', val)
	}
	
	// 手动关闭弹窗的方法
	const closePopup = () => {
		showPopup.value = false
		console.log('手动关闭弹窗')
	}

	// 处理图片加载错误
	const handleImageError = (item) => {
		console.error(`图片加载失败，分类ID: ${item._id}, 图片路径: ${item.cate_img}`)
		
		// 如果图片路径不是默认图片，则尝试更新为默认图片
		if (item.cate_img && item.cate_img !== '/static/images/defalut.png') {
			console.log(`尝试将分类 ${item._id} 的图片更新为默认图片`)
			
			// 先在本地更新当前项的图片路径，提高用户体验
			item.cate_img = '/static/images/defalut.png'
			
			// 然后在后台更新数据库
			setTimeout(() => {
				cateApi.update(item._id, item.cate_name, '/static/images/defalut.png')
					.then(res => {
						console.log('更新为默认图片成功:', res)
					})
					.catch(err => {
						console.error('更新为默认图片失败:', err)
					})
			}, 500)
		}
	}

	// 添加一个函数来重新计算所有项的排序值
	const recalculateAllSorts = async () => {
		// 显示加载提示
		uni.showLoading({
			title: '优化排序...',
			mask: true
		});
		
		try {
			// 获取当前列表
			const currentList = [...cateList.value];
			
			// 按照当前显示顺序重新计算排序值
			// 使用较大的间隔，以便将来可以在中间插入项
			const sortStep = 1000;
			let startSort = currentList.length * sortStep;
			
			// 逐个更新排序值
			for (let i = 0; i < currentList.length; i++) {
				const item = currentList[i];
				const newSort = startSort - (i * sortStep);
				
				// 如果排序值已经不同，则更新
				if (item.sort !== newSort) {
					await cateApi.updateSort(item._id, newSort);
				}
			}
			
			// 重新获取列表
			await cateListGet();
			
			uni.showToast({
				title: '排序已优化',
				icon: 'success'
			});
		} catch (error) {
			console.error('优化排序失败:', error);
			uni.showToast({
				title: '优化排序失败',
				icon: 'none'
			});
		} finally {
			uni.hideLoading();
		}
	};
	
	// 交换两个项的位置
	const swapItems = async (index1, index2) => {
		// 显示加载提示
		uni.showLoading({
			title: '更新排序...',
			mask: true
		});
		
		try {
			const item1 = cateList.value[index1];
			const item2 = cateList.value[index2];
			
			// 交换排序值
			const tempSort = item1.sort;
			
			// 更新数据库
			await cateApi.updateSort(item1._id, item2.sort);
			await cateApi.updateSort(item2._id, tempSort);
			
			// 重新获取列表
			await cateListGet();
		} catch (error) {
			console.error('交换位置失败:', error);
			uni.showToast({
				title: '更新排序失败',
				icon: 'none'
			});
		} finally {
			uni.hideLoading();
		}
	};
	
	// 添加上移和下移函数
	const moveUp = async (index, item) => {
		if (index === 0) {
			uni.showToast({
				title: '已经是第一项',
				icon: 'none'
			});
			return;
		}
		
		// 直接交换当前项与上一项的位置
		await swapItems(index, index - 1);
		
		uni.showToast({
			title: '上移成功',
			icon: 'success'
		});
	};
	
	const moveDown = async (index, item) => {
		if (index === cateList.value.length - 1) {
			uni.showToast({
				title: '已经是最后一项',
				icon: 'none'
			});
			return;
		}
		
		// 直接交换当前项与下一项的位置
		await swapItems(index, index + 1);
		
		uni.showToast({
			title: '下移成功',
			icon: 'success'
		});
	};

	// 切换单个分类的可见性
	const toggleCategoryVisibility = async (id, currentVisibility) => {
		try {
			// 显示加载提示
			uni.showLoading({
				title: '更新中...',
				mask: true
			});
			
			// 找到当前分类项目
			const category = cateList.value.find(item => item._id === id);
			if (!category) {
				uni.showToast({
					title: '未找到分类信息',
					icon: 'none'
				});
				uni.hideLoading();
				return;
			}
			
			// 切换可见性状态
			const newVisibility = !currentVisibility;
			
			// 调用云函数更新可见性
			const upRes = await cateApi.update(
				id, 
				category.cate_name, 
				category.cate_img, 
				category.sort, 
				newVisibility
			);
			
			// 隐藏加载提示
			uni.hideLoading();
			
			if (upRes.updated === 1) {
				uni.showToast({
					title: newVisibility ? '已设为显示' : '已设为隐藏',
					icon: 'success'
				});
				
				// 重新获取分类列表
				await cateListGet();
				
				// 获取最新的分类列表数据
				const cateRes = await cateApi.get();
				const hiddenCategoryIds = cateRes.data.filter(item => item.is_visible === false).map(item => item._id);
				
				// 发送全局事件，通知首页刷新数据
				uni.$emit('categoryVisibilityChanged', {
					categoryId: id,
					isVisible: newVisibility,
					hiddenCategoryIds: hiddenCategoryIds,
					allCategories: cateRes.data
				});
			} else {
				uni.showToast({
					title: upRes.errMsg || '更新失败',
					icon: 'none'
				});
			}
		} catch (error) {
			console.error('切换分类可见性失败:', error);
			uni.hideLoading();
			uni.showToast({
				title: '操作失败: ' + (error.message || '未知错误'),
				icon: 'none'
			});
		}
	};
</script>

<template>
	<view class="cateManage">
		<!-- 添加操作栏 -->
		<view class="operation-bar">
			<view class="left">
				<view class="title">分类管理</view>
				<view class="count">共 {{cateList.length}} 项</view>
			</view>
			<view class="right">
				<!-- 添加分类可见性开关 -->
				<view class="visibility-toggle">
					<text class="label">全部{{ globalCategoryVisibility ? '显示' : '隐藏' }}</text>
					<switch 
						:checked="globalCategoryVisibility" 
						color="#399bfe" 
						@change="toggleAllCategoriesVisibility"
						style="transform: scale(0.8);"
					/>
				</view>
				<view class="optimize-btn" @click="recalculateAllSorts" v-if="!isSelectMode">
					优化排序
				</view>
				<view class="batch-btn" @click="toggleSelectMode">
					{{ isSelectMode ? '取消' : '批量删除' }}
				</view>
			</view>
		</view>
		
		<!-- 排序提示 -->
		<view class="sort-tip" v-if="!isSelectMode">
			<uni-icons type="info" size="16" color="#399bfe"></uni-icons>
			<text>点击上下箭头可调整排序</text>
		</view>
		
		<!-- 批量操作工具栏 -->
		<view class="batch-toolbar" v-if="isSelectMode">
			<view class="select-all" @click="toggleSelectAll">
				<text class="checkbox" :class="{ checked: selectedItems.length === cateList.length }">
					<text class="iconfont icon-duihao" v-if="selectedItems.length === cateList.length"></text>
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
		
		<view class="cateName">
			<view class="value" 
				v-for="(item, index) in cateList" 
				:key="item._id"
			>
				<!-- 添加选择框 -->
				<view class="checkbox-wrapper" v-if="isSelectMode" @click.stop="toggleSelectItem(item._id)">
					<view class="checkbox" :class="{ checked: selectedItems.includes(item._id) }">
						<text class="iconfont icon-duihao" v-if="selectedItems.includes(item._id)"></text>
					</view>
				</view>
				
				<view class="cate-info">
					<image 
						:src="item.cate_img || '/static/images/defalut.png'" 
						mode="aspectFill" 
						class="cate-image"
						@error="handleImageError(item)"
					/>
					<view class="name-info">
						<view class="name">
							{{item.cate_name}}
						</view>
						<view class="meta-info">
							<text class="sort-tag">排序: {{item.sort || 0}}</text>
							<text class="visibility-tag" 
								:class="{ 'visible': item.is_visible !== false, 'hidden': item.is_visible === false }"
								@click.stop="toggleCategoryVisibility(item._id, item.is_visible !== false)"
							>
								{{ item.is_visible === false ? '隐藏' : '显示' }}
							</text>
						</view>
					</view>
				</view>
				<view class="right">
					<!-- 添加上下移动按钮 -->
					<view class="sort-buttons" v-if="!isSelectMode">
						<view class="sort-btn up" @click="moveUp(index, item)">
							<uni-icons type="arrow-up" size="18" color="#399bfe"></uni-icons>
						</view>
						<view class="sort-btn down" @click="moveDown(index, item)">
							<uni-icons type="arrow-down" size="18" color="#399bfe"></uni-icons>
						</view>
					</view>
					<view class="edit-icon" @click="edit(item._id)" v-if="!isSelectMode">
						<uni-icons color="#399bfe"
							type="compose" size="22"></uni-icons>
					</view>
					<view class="delete-icon" @click="del(item._id)" v-if="!isSelectMode">
						<uni-icons color="#e65c00" custom-prefix="iconfont"
							type="icon-shanchu1" size="20"></uni-icons>
						<text class="delete-text">删除</text>
					</view>
				</view>
			</view>
		</view>
	</view>
	
	<!-- 弹框 -->
	<manage-popup 
		v-model:show="showPopup" 
		:title="isEdit ? '编辑分类' : '添加分类'" 
		:edit-value="editValue"
		:edit-img="editImg"
		:edit-sort="editSort"
		@confirm="handleConfirm" 
		@update:show="watchPopupState"
	/>
	
	<!-- 悬浮按钮 -->
	<floatButton 
		icon="plus" 
		:size="100" 
		:position="{ bottom: '120rpx', right: '40rpx' }"
		@click="handleAddCate"
	></floatButton>
</template>

<style lang="scss" scoped>
	/*防止分包页面公共样式无法读取*/
	@import "@/style/common.scss";

	.cateManage {
		padding: 24rpx;
		height: 100vh;
		overflow-y: auto;
		background-color: $pyq-pages-bg-color;
		-webkit-overflow-scrolling: touch; /* 增强iOS滚动体验 */
		padding-bottom: 200rpx; /* 添加底部内边距，避免内容被悬浮按钮遮挡 */
		
		// 操作栏样式
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
				display: flex;
				align-items: center;
				
				.visibility-toggle {
					display: flex;
					align-items: center;
					margin-right: 16rpx;
					background-color: rgba(57, 155, 254, 0.1);
					padding: 6rpx 16rpx;
					border-radius: 8rpx;
					
					.label {
						font-size: 26rpx;
						color: #399bfe;
						margin-right: 10rpx;
					}
				}
				
				.optimize-btn {
					font-size: 28rpx;
					color: #4CD964;
					padding: 10rpx 20rpx;
					border-radius: 8rpx;
					background-color: rgba(76, 217, 100, 0.1);
					margin-right: 16rpx;
					
					&:active {
						background-color: rgba(76, 217, 100, 0.2);
					}
				}
				
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
		
		// 排序提示样式
		.sort-tip {
			display: flex;
			align-items: center;
			justify-content: center;
			padding: 16rpx;
			margin-bottom: 20rpx;
			background-color: rgba(57, 155, 254, 0.1);
			border-radius: 8rpx;
			
			text {
				font-size: 24rpx;
				color: #399bfe;
				margin-left: 8rpx;
			}
		}
		
		// 批量操作工具栏
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
				box-shadow: 0 2rpx 8rpx rgba(230, 92, 0, 0.2);
				border: 1px solid rgba(230, 92, 0, 0.8);
				
				&:active {
					opacity: 0.8;
					transform: translateY(2rpx);
					box-shadow: 0 1rpx 4rpx rgba(230, 92, 0, 0.1);
				}
				
				&.disabled {
					background-color: #ccc;
					color: #fff;
					border-color: #bbb;
					box-shadow: none;
				}
			}
		}

		.cateName {
			padding: 24rpx;
			border-radius: 24rpx;
			background-color: #fff;
			box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.05);

			.value {
				display: flex;
				align-items: center;
				justify-content: space-between;
				padding: 20rpx 16rpx;
				font-size: 28rpx;
				color: $pyq-text-color-body;
				border-bottom: 1px solid $pyq-border-color-translucent;
				transition: background-color 0.2s ease;
				
				&:hover {
					background-color: rgba(0, 0, 0, 0.01);
				}

				&:nth-last-child(1) {
					border: none;
				}
				
				// 选择框样式
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

				.cate-info {
					display: flex;
					align-items: center;
					flex: 1;
					
					.cate-image {
						width: 70rpx;
						height: 70rpx;
						border-radius: 12rpx;
						margin-right: 20rpx;
						background-color: #f7f7f7;
						object-fit: cover;
						border: 1px solid rgba(0, 0, 0, 0.05);
						box-shadow: 0 2rpx 6rpx rgba(0, 0, 0, 0.05);
					}
					
					.name-info {
						.name {
							font-size: 30rpx;
							font-weight: 500;
							color: $pyq-text-color-body;
						}
						
						.meta-info {
							font-size: 24rpx;
							color: $pyq-text-color-helper;
							margin-top: 4rpx;
							
							.sort-tag {
								margin-right: 16rpx;
							}
							
							.visibility-tag {
								font-size: 24rpx;
								padding: 2rpx 10rpx;
								border-radius: 4rpx;
								
								&.visible {
									color: #4CD964;
									background-color: rgba(76, 217, 100, 0.1);
								}
								
								&.hidden {
									color: #FF9500;
									background-color: rgba(255, 149, 0, 0.1);
								}
							}
						}
					}
				}

				.right {
					display: flex;
					align-items: center;
					
					// 添加排序按钮样式
					.sort-buttons {
						display: flex;
						margin-right: 10rpx;
						
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
							
							&.up {
								margin-right: 4rpx;
							}
						}
					}
					
					.edit-icon {
						margin-right: 10rpx;
						background-color: rgba(57, 155, 254, 0.1);
						border-radius: 8rpx;
						padding: 8rpx 16rpx;
						transition: all 0.3s;
						
						&:active {
							background-color: rgba(57, 155, 254, 0.2);
						}
					}
					
					.delete-icon {
						display: flex;
						align-items: center;
						background-color: rgba(230, 92, 0, 0.15);
						border-radius: 8rpx;
						padding: 8rpx 16rpx;
						transition: all 0.3s;
						border: 1px solid rgba(230, 92, 0, 0.2);
						box-shadow: 0 2rpx 6rpx rgba(230, 92, 0, 0.1);
						
						.delete-text {
							font-size: 24rpx;
							color: #e65c00;
							margin-left: 4rpx;
							font-weight: 500;
						}
						
						&:active {
							background-color: rgba(230, 92, 0, 0.25);
							transform: translateY(2rpx);
							box-shadow: 0 1rpx 3rpx rgba(230, 92, 0, 0.1);
						}
					}
				}
			}
		}
	}
</style>