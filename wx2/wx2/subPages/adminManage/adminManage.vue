<script setup>
	import { ref, onUnmounted } from 'vue';
	import { onShow } from '@dcloudio/uni-app'
	import { useAuthSwitchStore } from '@/store/authSwitch'
	const authSwitchStore = useAuthSwitchStore( )
	const sendOnApi = uniCloud.importObject( 'sendOn' )
	const cateApi = uniCloud.importObject('cateWx')
	
	// 获取权限状态
	const sendOnget = async ( ) => {
		try {
			uni.showLoading({
				title: '获取按钮状态...',
				mask: true
			})
			
			const res = await sendOnApi.get( )
			if (res && res.data && res.data.length > 0) {
				// 设置按钮控制状态
				publishButtonState.value = res.data[0].publishButton !== undefined ? res.data[0].publishButton : false
				floatButtonState.value = res.data[0].floatButton !== undefined ? res.data[0].floatButton : false
				// 设置头像点击控制状态
				avatarClickState.value = res.data[0].avatarClick !== undefined ? res.data[0].avatarClick : false
				// 设置评论显示控制状态
				commentVisibilityState.value = res.data[0].commentVisibility !== undefined ? res.data[0].commentVisibility : false
				// 设置抽奖模块显示控制状态
				lotteryVisibilityState.value = res.data[0].lotteryVisibility !== undefined ? res.data[0].lotteryVisibility : false
				
				// 为了保持兼容性，仍然更新总开关状态
				authSwitchStore.setAuthValue(true)
				
				console.log('发布按钮状态:', publishButtonState.value)
				console.log('悬浮按钮状态:', floatButtonState.value)
				console.log('头像点击状态:', avatarClickState.value)
				console.log('评论显示状态:', commentVisibilityState.value)
				console.log('抽奖模块状态:', lotteryVisibilityState.value)
			} else {
				console.error('获取按钮状态失败: 数据格式不正确')
				uni.showToast({
					icon: 'none',
					title: '获取按钮状态失败'
				})
			}
		} catch (error) {
			console.error('获取按钮状态失败:', error)
			uni.showToast({
				icon: 'none',
				title: '获取按钮状态失败'
			})
		} finally {
			uni.hideLoading()
		}
	}

	// 页面显示时获取最新状态
	onShow( ( ) => {
		sendOnget( )
	} )
	
	// 添加发布按钮和悬浮按钮的状态控制
	const publishButtonState = ref(false)
	const floatButtonState = ref(false)
	// 添加头像点击状态控制
	const avatarClickState = ref(false)
	// 添加评论显示控制状态
	const commentVisibilityState = ref(false)
	// 添加抽奖模块显示控制状态
	const lotteryVisibilityState = ref(false)
	
	// 二级分类管理相关状态
	const showSubCategorySelector = ref(false)
	const subCategories = ref([])
	const selectedMainCategory = ref(null)
	const subCategoryList = [
		// 移除所有预设分类，由用户手动添加
	]
	
	// 快速添加二级标签的状态
	const quickAddCategoryName = ref('')
	const quickAddTags = ref('')
	const quickAddDescription = ref('')
	
	// 切换发布按钮状态
	const togglePublishButton = async (e) => {
		e.stopPropagation()
		const newState = e.detail.value
		
		try {
			uni.showLoading({
				title: '更新中...',
				mask: true
			})
			
			// 先更新本地状态
			publishButtonState.value = newState
			
			// 更新服务器状态，传递所有按钮状态
			const res = await sendOnApi.update(true, newState, floatButtonState.value, avatarClickState.value, commentVisibilityState.value, lotteryVisibilityState.value)
			console.log('发布按钮状态更新结果:', res)
			
			// 广播状态变化事件
			uni.$emit('publishButtonChanged', newState)
			
			uni.showToast({
				icon: "success",
				title: newState ? '发布按钮已开启' : '发布按钮已关闭',
				duration: 2000
			})
		} catch (error) {
			console.error('更新发布按钮状态失败:', error)
			// 出错时回滚本地状态
			publishButtonState.value = !newState
			
			uni.showToast({
				icon: "error",
				title: '操作失败',
				duration: 2000
			})
		} finally {
			uni.hideLoading()
		}
	}
	
	// 切换悬浮按钮状态
	const toggleFloatButton = async (e) => {
		e.stopPropagation()
		const newState = e.detail.value
		
		try {
			uni.showLoading({
				title: '更新中...',
				mask: true
			})
			
			// 先更新本地状态
			floatButtonState.value = newState
			
			// 更新服务器状态，传递所有按钮状态
			const res = await sendOnApi.update(true, publishButtonState.value, newState, avatarClickState.value, commentVisibilityState.value, lotteryVisibilityState.value)
			console.log('悬浮按钮状态更新结果:', res)
			
			// 广播状态变化事件
			uni.$emit('floatButtonChanged', newState)
			
			uni.showToast({
				icon: "success",
				title: newState ? '悬浮按钮已开启' : '悬浮按钮已关闭',
				duration: 2000
			})
		} catch (error) {
			console.error('更新悬浮按钮状态失败:', error)
			// 出错时回滚本地状态
			floatButtonState.value = !newState
			
			uni.showToast({
				icon: "error",
				title: '操作失败',
				duration: 2000
			})
		} finally {
			uni.hideLoading()
		}
	}
	
	// 切换头像点击状态
	const toggleAvatarClick = async (e) => {
		e.stopPropagation()
		const newState = e.detail.value
		
		try {
			uni.showLoading({
				title: '更新中...',
				mask: true
			})
			
			// 先更新本地状态
			avatarClickState.value = newState
			
			// 更新服务器状态，传递所有按钮状态
			const res = await sendOnApi.update(true, publishButtonState.value, floatButtonState.value, newState, commentVisibilityState.value, lotteryVisibilityState.value)
			console.log('头像点击状态更新结果:', res)
			
			// 广播状态变化事件
			uni.$emit('avatarClickChanged', newState)
			
			uni.showToast({
				icon: "success",
				title: newState ? '头像点击已开启' : '头像点击已关闭',
				duration: 2000
			})
		} catch (error) {
			console.error('更新头像点击状态失败:', error)
			// 出错时回滚本地状态
			avatarClickState.value = !newState
			
			uni.showToast({
				icon: "error",
				title: '操作失败',
				duration: 2000
			})
		} finally {
			uni.hideLoading()
		}
	}
	
	// 切换评论显示状态
	const toggleCommentVisibility = async (e) => {
		e.stopPropagation()
		const newState = e.detail.value
		
		try {
			uni.showLoading({
				title: '更新中...',
				mask: true
			})
			
			// 先更新本地状态
			commentVisibilityState.value = newState
			
			// 更新服务器状态，传递所有按钮状态
			const res = await sendOnApi.update(true, publishButtonState.value, floatButtonState.value, avatarClickState.value, newState, lotteryVisibilityState.value)
			console.log('评论显示状态更新结果:', res)
			
			// 广播状态变化事件
			uni.$emit('commentVisibilityChanged', newState)
			
			uni.showToast({
				icon: "success",
				title: newState ? '评论功能已开启' : '评论功能已关闭',
				duration: 2000
			})
		} catch (error) {
			console.error('更新评论显示状态失败:', error)
			// 出错时回滚本地状态
			commentVisibilityState.value = !newState
			
			uni.showToast({
				icon: "error",
				title: '操作失败',
				duration: 2000
			})
		} finally {
			uni.hideLoading()
		}
	}
	
	// 切换抽奖模块显示状态
	const toggleLotteryVisibility = async (e) => {
		e.stopPropagation()
		const newState = e.detail.value
		
		try {
			uni.showLoading({
				title: '更新中...',
				mask: true
			})
			
			// 先更新本地状态
			lotteryVisibilityState.value = newState
			
			// 更新服务器状态，传递所有按钮状态
			const res = await sendOnApi.update(true, publishButtonState.value, floatButtonState.value, avatarClickState.value, commentVisibilityState.value, newState)
			console.log('抽奖模块显示状态更新结果:', res)
			
			// 广播状态变化事件
			uni.$emit('lotteryVisibilityChanged', newState)
			
			uni.showToast({
				icon: "success",
				title: newState ? '抽奖模块已开启' : '抽奖模块已关闭',
				duration: 2000
			})
		} catch (error) {
			console.error('更新抽奖模块显示状态失败:', error)
			// 出错时回滚本地状态
			lotteryVisibilityState.value = !newState
			
			uni.showToast({
				icon: "error",
				title: '操作失败',
				duration: 2000
			})
		} finally {
			uni.hideLoading()
		}
	}
	
	// 监听来自其他页面的状态变化事件
	uni.$on('publishButtonChanged', (newState) => {
		console.log('收到发布按钮状态变化事件:', newState)
		publishButtonState.value = newState
	})
	
	uni.$on('floatButtonChanged', (newState) => {
		console.log('收到悬浮按钮状态变化事件:', newState)
		floatButtonState.value = newState
	})
	
	uni.$on('avatarClickChanged', (newState) => {
		console.log('收到头像点击状态变化事件:', newState)
		avatarClickState.value = newState
	})
	
	uni.$on('commentVisibilityChanged', (newState) => {
		console.log('收到评论显示状态变化事件:', newState)
		commentVisibilityState.value = newState
	})
	
	uni.$on('lotteryVisibilityChanged', (newState) => {
		console.log('收到抽奖模块显示状态变化事件:', newState)
		lotteryVisibilityState.value = newState
	})
	
	// 页面卸载时移除事件监听
	onUnmounted(() => {
		uni.$off('publishButtonChanged')
		uni.$off('floatButtonChanged')
		uni.$off('avatarClickChanged')
		uni.$off('commentVisibilityChanged')
		uni.$off('lotteryVisibilityChanged')
	})
	
	// 获取二级分类数据
	const getSubCategories = async () => {
		try {
			uni.showLoading({
				title: '加载分类中...',
				mask: true
			})
			
			// 获取当前所有分类
			const res = await cateApi.get(null, true) // true 表示包含隐藏的分类
			if (res && res.data) {
				subCategories.value = res.data
				console.log('获取到的分类数据:', subCategories.value)
			} else {
				subCategories.value = []
			}
		} catch (error) {
			console.error('获取分类失败:', error)
			uni.showToast({
				icon: 'none',
				title: '获取分类失败'
			})
			subCategories.value = []
		} finally {
			uni.hideLoading()
		}
	}
	
	// 添加新的二级分类
	const addSubCategory = async (categoryInfo) => {
		try {
			uni.showLoading({
				title: '添加分类中...',
				mask: true
			})
			
			const data = {
				cate_name: categoryInfo.name,
				cate_img: categoryInfo.icon,
				sort: 0,
				is_visible: true
			}
			
			const res = await cateApi.add(data)
			if (res && res.id) {
				uni.showToast({
					icon: 'success',
					title: '添加成功'
				})
				// 重新获取分类列表
				await getSubCategories()
			} else {
				throw new Error(res.message || '添加失败')
			}
		} catch (error) {
			console.error('添加分类失败:', error)
			uni.showToast({
				icon: 'none',
				title: error.message || '添加失败'
			})
		} finally {
			uni.hideLoading()
		}
	}
	
	// 切换分类显示状态
	const toggleCategoryVisibility = async (categoryId, currentVisible) => {
		try {
			const newVisible = !currentVisible
			const res = await cateApi.toggleVisibility(categoryId, newVisible)
			
			if (res && res.updated) {
				uni.showToast({
					icon: 'success',
					title: newVisible ? '已显示' : '已隐藏'
				})
				// 更新本地数据
				const category = subCategories.value.find(cat => cat._id === categoryId)
				if (category) {
					category.is_visible = newVisible
				}
			} else {
				throw new Error('操作失败')
			}
		} catch (error) {
			console.error('切换分类状态失败:', error)
			uni.showToast({
				icon: 'none',
				title: '操作失败'
			})
		}
	}
	
	// 删除分类
	const deleteCategory = async (categoryId, categoryName) => {
		try {
			const confirm = await new Promise((resolve) => {
				uni.showModal({
					title: '确认删除',
					content: `确定要删除分类"${categoryName}"吗？`,
					success: (res) => resolve(res.confirm)
				})
			})
			
			if (!confirm) return
			
			uni.showLoading({
				title: '删除中...',
				mask: true
			})
			
			const res = await cateApi.del(categoryId)
			if (res && res.deleted > 0) {
				uni.showToast({
					icon: 'success',
					title: '删除成功'
				})
				// 重新获取分类列表
				await getSubCategories()
			} else {
				throw new Error('删除失败')
			}
		} catch (error) {
			console.error('删除分类失败:', error)
			uni.showToast({
				icon: 'none',
				title: '删除失败'
			})
		} finally {
			uni.hideLoading()
		}
	}
	
	// 更新数据库Schema
	const updateDatabaseSchema = async () => {
		try {
			uni.showModal({
				title: '更新Schema',
				content: '这将为所有分类添加二级分类字段，解决schema验证错误问题。确定继续吗？',
				success: async (res) => {
					if (res.confirm) {
						uni.showLoading({
							title: '正在更新Schema...',
							mask: true
						})
						
						try {
							const result = await cateApi.updateDatabaseSchema()
							
							if (result.code === 0) {
								uni.showModal({
									title: '更新成功',
									content: result.msg + '\n\n现在可以正常使用二级分类功能了！',
									showCancel: false
								})
								console.log('Schema更新结果:', result.data)
							} else {
								uni.showModal({
									title: '更新失败',
									content: result.errMsg || 'Schema更新失败',
									showCancel: false
								})
							}
						} catch (error) {
							console.error('更新Schema失败:', error)
							uni.showModal({
								title: '更新失败',
								content: '网络错误或服务器异常，请稍后重试',
								showCancel: false
							})
						} finally {
							uni.hideLoading()
						}
					}
			}
		})
		} catch (error) {
			console.error('更新Schema失败:', error)
		}
	}
	
	// 快速添加二级标签
	const quickAddSubCategoryTags = async () => {
		try {
			// 输入验证
			const categoryName = quickAddCategoryName.value.trim()
			const tagsString = quickAddTags.value.trim()
			const description = quickAddDescription.value.trim()
			
			if (!categoryName) {
				uni.showToast({
					title: '请输入分类名称',
					icon: 'none',
					duration: 2000
				})
				return
			}
			
			if (!tagsString) {
				uni.showToast({
					title: '请输入二级标签',
					icon: 'none',
					duration: 2000
				})
				return
			}
			
			// 将标签字符串转换为数组并清理
			const tagsArray = tagsString
				.split(',')
				.map(tag => tag.trim())
				.filter(tag => tag.length > 0)
				.filter((tag, index, self) => self.indexOf(tag) === index) // 去重
			
			if (tagsArray.length === 0) {
				uni.showToast({
					title: '请输入有效的标签，用逗号分隔',
					icon: 'none',
					duration: 2000
				})
				return
			}
			
			// 检查标签数量
			if (tagsArray.length > 20) {
				uni.showToast({
					title: '标签数量不能超过20个',
					icon: 'none',
					duration: 2000
				})
				return
			}
			
			// 检查每个标签的长度
			for (let i = 0; i < tagsArray.length; i++) {
				if (tagsArray[i].length > 10) {
					uni.showToast({
						title: `标签 "${tagsArray[i]}" 过长，最多10个字符`,
						icon: 'none',
						duration: 2000
					})
					return
				}
			}
			
			// 检查描述长度
			if (description.length > 100) {
				uni.showToast({
					title: '描述不能超过100个字符',
					icon: 'none',
					duration: 2000
				})
				return
			}
			
			console.log('将要发送的数据:', {
				categoryName,
				tagsArray,
				description
			})
			
			uni.showLoading({
				title: '正在添加...',
				mask: true
			})
			
			// 调用云函数添加二级标签
			const res = await cateApi.addSubCategoryForSpecificCategory(
				categoryName,
				tagsArray,
				description || `${categoryName}相关信息`
			)
			
			console.log('云函数返回结果:', res)
			
			if (res.code === 0) {
				uni.showToast({
					title: '添加成功！',
					icon: 'success',
					duration: 2000
				})
				
				// 清空输入框
				quickAddCategoryName.value = ''
				quickAddTags.value = ''
				quickAddDescription.value = ''
				
				console.log('添加结果:', res.data)
				
				// 可以设置一个延时关闭弹窗，让用户看到成功消息
				setTimeout(() => {
					closeSubCategorySelector()
				}, 1500)
				
			} else {
				// 显示详细的错误信息
				const errorMsg = res.errMsg || '添加失败'
				uni.showModal({
					title: '添加失败',
					content: errorMsg,
					showCancel: false
				})
			}
			
		} catch (error) {
			console.error('快速添加二级标签失败:', error)
			uni.showModal({
				title: '添加失败',
				content: '网络错误或服务器异常，请稍后重试',
				showCancel: false
			})
		} finally {
			uni.hideLoading()
		}
	}
	
	// 关闭二级分类选择器
	const closeSubCategorySelector = () => {
		showSubCategorySelector.value = false
		selectedMainCategory.value = null
	}
	
	// 批量更新预设分类的二级标签
	const batchUpdateSubCategories = async () => {
		try {
			uni.showLoading({
				title: '批量更新中...',
				mask: true
			})
			
			const res = await cateApi.batchUpdateSubCategories()
			if (res && res.code === 0) {
				uni.showToast({
					icon: 'success',
					title: res.msg || '更新成功'
				})
				// 重新获取分类列表
				await getSubCategories()
			} else {
				throw new Error(res.errMsg || res.msg || '更新失败')
			}
		} catch (error) {
			console.error('批量更新二级分类失败:', error)
			uni.showToast({
				icon: 'none',
				title: error.message || '更新失败'
			})
		} finally {
			uni.hideLoading()
		}
	}
	
	// 后期想做新的功能，直接添加就好
	const data = ref( [ '分类管理', '文章管理', '用户反馈', '公司信息', '悬浮按钮控制', '发布按钮控制', '头像点击控制', '评论功能控制', '抽奖模块控制', '用户信息查询', '抽奖管理', '二级分类管理', '水印管理' ] )
	// 处理点击事件跳转页面
	const handleItem = ( dataItem ) => {
		switch ( dataItem ) {
			case '分类管理':
				console.log( '跳转分类管理' )
				uni.navigateTo( {
					url: "/subPages/cateManage/cateManage"
				} )
				break
			case '文章管理':
				console.log( '跳转文章管理' )
				uni.navigateTo( {
					url: "/subPages/articleManage/articleManage"
				} )
				break
			case '用户反馈':
				console.log( '跳转用户反馈' )
				uni.navigateTo( {
					url: "/subPages/feedManage/feedManage"
				} )
				break
			case '公司信息':
				console.log( '跳转公司信息' )
				uni.navigateTo( {
					url: "/subPages/companyInfo/companyInfo"
				} )
				break
			case '悬浮按钮控制':
				console.log('点击悬浮按钮控制，不执行任何操作')
				break
			case '发布按钮控制':
				console.log('点击发布按钮控制，不执行任何操作')
				break
			case '头像点击控制':
				console.log('点击头像点击控制，不执行任何操作')
				break
			case '评论功能控制':
				console.log('点击评论功能控制，不执行任何操作')
				break
			case '用户信息查询':
				console.log( '跳转用户信息查询' )
				uni.navigateTo( {
					url: "/subPages/userInfoQuery/userInfoQuery"
				} )
				break
			case '抽奖管理':
				console.log( '跳转抽奖管理' )
				uni.navigateTo( {
					url: "/subPages/subChoujiang/subChoujiang"
				} )
				break
			case '二级分类管理':
				console.log('跳转二级分类管理')
				showSubCategorySelector.value = true
				getSubCategories()
				break
			case '水印管理':
				console.log('跳转水印管理')
				uni.navigateTo({
					url: '/subPages/watermarkConfig/watermarkConfig'
				})
				break
		}
	}
</script>

<template>
	<view class="adminManage">
		<view class="content">
			<view class="item" v-for="item in data" :key="item" @click="handleItem(item)">
				<view class="left">
					<!-- 占位 -->
					<view class="box">

					</view>
					<view class="value">
						{{item}}
					</view>
				</view>
				<template v-if="item === '发布按钮控制'">
					<view class="switch-container" @click.stop>
						<switch :checked="publishButtonState" @change="togglePublishButton" />
					</view>
				</template>
				<template v-else-if="item === '悬浮按钮控制'">
					<view class="switch-container" @click.stop>
						<switch :checked="floatButtonState" @change="toggleFloatButton" />
					</view>
				</template>
				<template v-else-if="item === '头像点击控制'">
					<view class="switch-container" @click.stop>
						<switch :checked="avatarClickState" @change="toggleAvatarClick" />
					</view>
				</template>
				<template v-else-if="item === '评论功能控制'">
					<view class="switch-container" @click.stop>
						<switch :checked="commentVisibilityState" @change="toggleCommentVisibility" />
					</view>
				</template>
				<template v-else-if="item === '抽奖模块控制'">
					<view class="switch-container" @click.stop>
						<switch :checked="lotteryVisibilityState" @change="toggleLotteryVisibility" />
					</view>
				</template>
				<uni-icons color="#cccccc" custom-prefix="iconfont" type="icon-arrow-drop-right-line"
					size="30"></uni-icons>
			</view>
		</view>
		
		<!-- 二级分类管理弹窗 -->
		<view v-if="showSubCategorySelector" class="sub-category-overlay" @click="closeSubCategorySelector">
			<view class="sub-category-panel" @click.stop>
				<view class="panel-header">
					<text class="panel-title">二级分类管理</text>
					<view class="header-actions">
						<view class="schema-update-btn" @click="updateDatabaseSchema">
							<uni-icons type="settings" size="16" color="#ff9800"></uni-icons>
							<text>更新Schema</text>
						</view>
						<view class="batch-update-btn" @click="batchUpdateSubCategories">
							<uni-icons type="refresh" size="16" color="#2196F3"></uni-icons>
							<text>批量更新</text>
						</view>
						<view class="close-btn" @click="closeSubCategorySelector">
							<uni-icons type="close" size="20" color="#666"></uni-icons>
						</view>
					</view>
				</view>
				
				<view class="panel-content">
					<!-- 快速添加二级标签区域 -->
					<view class="section quick-add-section">
						<text class="section-title">快速添加二级标签</text>
						<view class="quick-add-form">
							<view class="form-item">
								<text class="form-label">分类名称：</text>
								<input 
									v-model="quickAddCategoryName" 
									type="text" 
									placeholder="请输入分类名称（如：静乐）" 
									class="form-input"
									maxlength="20"
								/>
							</view>
							<view class="form-item">
								<text class="form-label">二级标签：</text>
								<input 
									v-model="quickAddTags" 
									type="text" 
									placeholder="请输入标签，用逗号分隔（如：美食,旅游,休闲）" 
									class="form-input"
								/>
								<view class="form-tip">
									<text>最多20个标签，每个标签不超过10个字符</text>
								</view>
							</view>
							<view class="form-item">
								<text class="form-label">描述（可选）：</text>
								<input 
									v-model="quickAddDescription" 
									type="text" 
									placeholder="请输入分类描述（不超过100字）" 
									class="form-input"
									maxlength="100"
								/>
							</view>
							<view class="form-actions">
								<button class="quick-add-btn" @click="quickAddSubCategoryTags">添加标签</button>
							</view>
							<view class="form-example">
								<text class="example-title">示例：</text>
								<text class="example-text">分类名称：静乐 | 标签：美食,旅游,休闲,购物 | 描述：静乐县本地生活信息</text>
							</view>
						</view>
					</view>

				</view>
			</view>
		</view>
	</view>
</template>

<style lang="scss" scoped>
	/*防止分包页面公共样式无法读取*/
	@import "@/style/common.scss";

	.adminManage {
		@include pagesBaseStyle;

		.content {
			border-radius: 24rpx;
			background-color: #fff;

			.item {
				display: flex;
				justify-content: space-between;
				align-items: center;
				padding: 24rpx;
				width: 100%;
				box-sizing: border-box;
				border-bottom: 1px solid $pyq-border-color-translucent;

				&:nth-last-child(1) {
					border: none;
				}

				.left {
					display: flex;
					align-items: center;

					.box {
						margin-right: 16rpx;
						height: 24rpx;
						width: 8rpx;
						background-color: $pyq-vi-color;
						border-radius: 4rpx;
					}

					.value {
						font-size: 28rpx;
						color: $pyq-text-color-body;
					}
				}
				
				.switch-container {
					padding: 0 10rpx;
				}
			}
		}
	}
	
	// 二级分类管理弹窗样式
	.sub-category-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-color: rgba(0, 0, 0, 0.5);
		z-index: 999;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 40rpx;
		
		.sub-category-panel {
			width: 100%;
			max-width: 800rpx;
			max-height: 80vh;
			background-color: #fff;
			border-radius: 20rpx;
			overflow: hidden;
			display: flex;
			flex-direction: column;
			
			.panel-header {
				display: flex;
				justify-content: space-between;
				align-items: center;
				padding: 30rpx;
				border-bottom: 1px solid #f0f0f0;
				background-color: #fafafa;
				
				.panel-title {
					font-size: 32rpx;
					font-weight: bold;
					color: #333;
				}
				
				.header-actions {
					display: flex;
					align-items: center;
					gap: 16rpx;
					
					.schema-update-btn {
						display: flex;
						align-items: center;
						gap: 8rpx;
						padding: 12rpx 16rpx;
						background-color: rgba(255, 152, 0, 0.1);
						border: 1px solid rgba(255, 152, 0, 0.3);
						border-radius: 6rpx;
						
						text {
							font-size: 24rpx;
							color: #ff9800;
						}
						
						&:active {
							background-color: rgba(255, 152, 0, 0.2);
						}
					}
					
					.batch-update-btn {
						display: flex;
						align-items: center;
						gap: 8rpx;
						padding: 12rpx 16rpx;
						background-color: rgba(33, 150, 243, 0.1);
						border: 1px solid rgba(33, 150, 243, 0.3);
						border-radius: 6rpx;
						
						text {
							font-size: 24rpx;
							color: #2196F3;
						}
						
						&:active {
							background-color: rgba(33, 150, 243, 0.2);
						}
					}
				}
				
				.close-btn {
					padding: 10rpx;
					border-radius: 50%;
					
					&:active {
						background-color: #e0e0e0;
					}
				}
			}
			
			.panel-content {
				flex: 1;
				overflow-y: auto;
				padding: 20rpx;
				
				.section {
					margin-bottom: 40rpx;
					
					.section-title {
						font-size: 28rpx;
						font-weight: bold;
						color: #333;
						margin-bottom: 20rpx;
						display: block;
					}
					
					// 快速添加区域样式
					&.quick-add-section {
						background-color: #f8f9ff;
						padding: 30rpx;
						border-radius: 12rpx;
						border: 1px solid #e3f2fd;
						
						.quick-add-form {
							.form-item {
								margin-bottom: 24rpx;
								
								.form-label {
									font-size: 26rpx;
									color: #666;
									margin-bottom: 12rpx;
									display: block;
								}
								
								.form-input {
									width: 100%;
									padding: 20rpx;
									border: 1px solid #e0e0e0;
									border-radius: 8rpx;
									font-size: 26rpx;
									background-color: #fff;
									box-sizing: border-box;
									
									&:focus {
										border-color: #2196F3;
									}
								}
							}
							
							.form-actions {
								margin-top: 20rpx;
								
								.quick-add-btn {
									width: 100%;
									padding: 24rpx;
									background-color: #2196F3;
									color: #fff;
									border: none;
									border-radius: 8rpx;
									font-size: 28rpx;
									font-weight: bold;
									
									&:active {
										background-color: #1976D2;
									}
								}
							}
						}
					}
					
					.empty-tip {
						text-align: center;
						padding: 60rpx 20rpx;
						color: #999;
						font-size: 26rpx;
					}
					
					.available-categories,
					.existing-categories {
						display: flex;
						flex-direction: column;
						gap: 16rpx;
					}
					
					.category-card {
						display: flex;
						align-items: center;
						padding: 20rpx;
						background-color: #f8f9fa;
						border-radius: 12rpx;
						border: 1px solid #e9ecef;
						transition: all 0.3s;
						
						&.available {
							cursor: pointer;
							
							&:active {
								background-color: rgba(33, 150, 243, 0.1);
								border-color: #2196F3;
								transform: translateY(-2rpx);
							}
						}
						
						&.existing {
							&.hidden {
								opacity: 0.6;
								background-color: #f5f5f5;
							}
						}
						
						.category-icon {
							width: 80rpx;
							height: 80rpx;
							margin-right: 20rpx;
							border-radius: 12rpx;
							overflow: hidden;
							background-color: #fff;
							display: flex;
							align-items: center;
							justify-content: center;
							
							.icon-image {
								width: 60rpx;
								height: 60rpx;
							}
						}
						
						.category-info {
							flex: 1;
							display: flex;
							flex-direction: column;
							
							.category-name {
								font-size: 28rpx;
								font-weight: bold;
								color: #333;
								margin-bottom: 6rpx;
							}
							
							.category-desc {
								font-size: 24rpx;
								color: #666;
								line-height: 1.4;
							}
							
							.category-status {
								font-size: 22rpx;
								padding: 4rpx 12rpx;
								border-radius: 12rpx;
								align-self: flex-start;
								
								&.visible {
									background-color: rgba(76, 175, 80, 0.1);
									color: #4CAF50;
								}
								
								&.hidden {
									background-color: rgba(158, 158, 158, 0.1);
									color: #9e9e9e;
								}
							}
						}
						
						.add-btn {
							width: 60rpx;
							height: 60rpx;
							border-radius: 50%;
							background-color: rgba(33, 150, 243, 0.1);
							display: flex;
							align-items: center;
							justify-content: center;
						}
						
						.category-actions {
							display: flex;
							gap: 12rpx;
							
							.action-btn {
								width: 60rpx;
								height: 60rpx;
								border-radius: 50%;
								background-color: #f0f0f0;
								display: flex;
								align-items: center;
								justify-content: center;
								transition: all 0.3s;
								
								&:active {
									background-color: #e0e0e0;
									transform: scale(0.95);
								}
								
								&.delete {
									background-color: rgba(245, 108, 108, 0.1);
									
									&:active {
										background-color: rgba(245, 108, 108, 0.2);
									}
								}
							}
						}
					}
				}
			}
		}
	}
</style>