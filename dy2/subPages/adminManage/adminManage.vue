<script setup>
	import { ref, onUnmounted } from 'vue';
	import { onShow } from '@dcloudio/uni-app'
	import { useAuthSwitchStore } from '@/store/authSwitch'
	const authSwitchStore = useAuthSwitchStore( )
	const sendOnApi = uniCloud.importObject( 'sendOn' )
	const indexYunApi = uniCloud.importObject( 'indexYun' )
	
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
				// 设置粉丝群ID状态
				fansGroupId.value = res.data[0].fans_group_id !== undefined ? res.data[0].fans_group_id : "CgYIASAHKAESTgpMPxsfnWvXJ61q6Eun6E6R/pZOQXqOK93pt9RbaamdIKv8hWML07CE8p7UrP6JX+XO7emnzmu+LFuaNy62FR6ye20jDcp/UPy2SaOrbBoA"
				
				// 为了保持兼容性，仍然更新总开关状态
				authSwitchStore.setAuthValue(true)
				
				console.log('发布按钮状态:', publishButtonState.value)
				console.log('悬浮按钮状态:', floatButtonState.value)
				console.log('头像点击状态:', avatarClickState.value)
				console.log('评论显示状态:', commentVisibilityState.value)
				console.log('抽奖模块状态:', lotteryVisibilityState.value)
				console.log('粉丝群ID:', fansGroupId.value)
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
		getHomeButtonState( )
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
	
	// 添加粉丝群ID管理状态
	const fansGroupId = ref('')
	const showFansGroupModal = ref(false)
	const editingFansGroupId = ref('')
	
	// 添加首页按钮状态控制
	const homeButtonState = ref(false)
	const homeButtonText = ref('返回首页')
	const homeButtonIcon = ref('🏠')
	
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
	
	// 获取首页按钮状态
	const getHomeButtonState = async () => {
		try {
			const res = await indexYunApi.getIndexSettings()
			if (res.code === 0) {
				homeButtonState.value = res.showHomeButton
				homeButtonText.value = res.homeButtonText
				homeButtonIcon.value = res.homeButtonIcon
			}
		} catch (error) {
			console.error('获取首页按钮状态失败:', error)
		}
	}
	
	// 切换首页按钮状态
	const toggleHomeButton = async (e) => {
		e.stopPropagation()
		const newState = e.detail.value
		
		try {
			uni.showLoading({
				title: '更新中...',
				mask: true
			})
			
			// 先更新本地状态
			homeButtonState.value = newState
			
			// 更新服务器状态
			const res = await indexYunApi.updateIndexSettings({
				showHomeButton: newState,
				homeButtonText: homeButtonText.value,
				homeButtonIcon: homeButtonIcon.value
			})
			
			if (res.code === 0) {
				// 广播状态变化事件
				uni.$emit('homeButtonChanged', newState)
				
				uni.showToast({
					icon: "success",
					title: newState ? '首页按钮已开启' : '首页按钮已关闭',
					duration: 2000
				})
			} else {
				throw new Error(res.message)
			}
		} catch (error) {
			console.error('更新首页按钮状态失败:', error)
			// 出错时回滚本地状态
			homeButtonState.value = !newState
			
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
	
	// 添加修改粉丝群ID的方法
	const openFansGroupModal = () => {
		editingFansGroupId.value = fansGroupId.value
		showFansGroupModal.value = true
	}

	// 保存粉丝群ID
	const saveFansGroupId = async () => {
		try {
			if (!editingFansGroupId.value.trim()) {
				return uni.showToast({
					icon: 'none',
					title: '粉丝群ID不能为空'
				})
			}
			
			uni.showLoading({
				title: '保存中...',
				mask: true
			})
			
			// 先保存旧的ID值，以便在出错时恢复
			const oldFansGroupId = fansGroupId.value
			// 更新本地状态
			fansGroupId.value = editingFansGroupId.value
			
			// 更新服务器状态，传递所有状态
			const res = await sendOnApi.updateFansGroupId(
				true, 
				publishButtonState.value, 
				floatButtonState.value, 
				avatarClickState.value, 
				commentVisibilityState.value, 
				lotteryVisibilityState.value,
				editingFansGroupId.value
			)
			
			console.log('粉丝群ID更新结果:', res)
			
			// 广播状态变化事件
			uni.$emit('fansGroupIdChanged', editingFansGroupId.value)
			
			showFansGroupModal.value = false
			
			uni.showToast({
				icon: "success",
				title: '粉丝群ID已更新',
				duration: 2000
			})
		} catch (error) {
			console.error('更新粉丝群ID失败:', error)
			// 出错时回滚本地状态
			fansGroupId.value = oldFansGroupId
			
			uni.showToast({
				icon: "error",
				title: '操作失败',
				duration: 2000
			})
		} finally {
			uni.hideLoading()
		}
	}

	// 取消编辑
	const cancelFansGroupEdit = () => {
		showFansGroupModal.value = false
	}

	// 复制粉丝群ID
	const copyFansGroupId = () => {
		uni.setClipboardData({
			data: fansGroupId.value,
			success: () => {
				uni.showToast({
					title: '已复制到剪贴板'
				})
			}
		})
	}

	// 修改事件监听
	uni.$on('fansGroupIdChanged', (newId) => {
		console.log('收到粉丝群ID变化事件:', newId)
		fansGroupId.value = newId
	})

	// 修改页面卸载事件
	onUnmounted(() => {
		uni.$off('publishButtonChanged')
		uni.$off('floatButtonChanged')
		uni.$off('avatarClickChanged')
		uni.$off('commentVisibilityChanged')
		uni.$off('lotteryVisibilityChanged')
		uni.$off('fansGroupIdChanged')
	})
	
	// 后期想做新的功能，直接添加就好
	const data = ref( [ '分类管理', '文章管理', '用户反馈', '公司信息', '悬浮按钮控制', '发布按钮控制', '头像点击控制', '评论功能控制', '抽奖模块控制', '首页按钮控制', '粉丝群ID管理', '用户信息查询', '抽奖管理' ] )
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
			case '粉丝群ID管理':
				console.log('打开粉丝群ID管理弹窗')
				openFansGroupModal()
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
			case '首页按钮控制':
				console.log('点击首页按钮控制，不执行任何操作')
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
				<template v-else-if="item === '粉丝群ID管理'">
					<view class="id-preview" @click.stop="copyFansGroupId">
						{{fansGroupId.substring(0, 10)}}...
					</view>
				</template>
				<template v-else-if="item === '首页按钮控制'">
					<view class="switch-container" @click.stop>
						<switch :checked="homeButtonState" @change="toggleHomeButton" color="#2196F3" />
					</view>
				</template>
				<uni-icons color="#cccccc" custom-prefix="iconfont" type="icon-arrow-drop-right-line"
					size="30"></uni-icons>
			</view>
		</view>
		
		<!-- 添加粉丝群ID编辑弹窗 -->
		<view class="modal-container" v-if="showFansGroupModal">
			<view class="modal-mask" @click="cancelFansGroupEdit"></view>
			<view class="modal-content">
				<view class="modal-header">
					<text class="modal-title">设置粉丝群ID</text>
					<view class="modal-close" @click="cancelFansGroupEdit">
						<uni-icons type="closeempty" size="22" color="#666"></uni-icons>
					</view>
				</view>
				<view class="modal-body">
					<view class="input-group">
						<textarea 
							class="input-textarea"
							v-model="editingFansGroupId"
							placeholder="请输入粉丝群ID"
							auto-height
						></textarea>
					</view>
					<view class="id-tip">注意：修改ID可能会影响用户加入粉丝群的功能，请确保ID正确</view>
				</view>
				<view class="modal-footer">
					<button class="btn-cancel" @click="cancelFansGroupEdit">取消</button>
					<button class="btn-save" @click="saveFansGroupId">保存</button>
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
				
				.id-preview {
					font-size: 24rpx;
					color: #666;
					background-color: #f5f5f5;
					padding: 4rpx 20rpx;
					border-radius: 30rpx;
					max-width: 200rpx;
					overflow: hidden;
					text-overflow: ellipsis;
					white-space: nowrap;
					
					&:active {
						background-color: #e9e9e9;
					}
				}
			}
		}
		
		.modal-container {
			position: fixed;
			top: 0;
			left: 0;
			right: 0;
			bottom: 0;
			z-index: 9999;
			display: flex;
			align-items: center;
			justify-content: center;
			
			.modal-mask {
				position: absolute;
				top: 0;
				left: 0;
				right: 0;
				bottom: 0;
				background-color: rgba(0, 0, 0, 0.5);
				z-index: -1;
			}
			
			.modal-content {
				width: 600rpx;
				background-color: #fff;
				border-radius: 20rpx;
				overflow: hidden;
				box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.15);
				
				.modal-header {
					padding: 30rpx;
					display: flex;
					justify-content: space-between;
					align-items: center;
					border-bottom: 1px solid #eee;
					
					.modal-title {
						font-size: 32rpx;
						font-weight: 500;
						color: #333;
					}
					
					.modal-close {
						width: 44rpx;
						height: 44rpx;
						display: flex;
						align-items: center;
						justify-content: center;
						border-radius: 50%;
						
						&:active {
							background-color: #f5f5f5;
						}
					}
				}
				
				.modal-body {
					padding: 30rpx;
					
					.input-group {
						margin-bottom: 20rpx;
						
						.input-textarea {
							width: 100%;
							min-height: 160rpx;
							background-color: #f8f8f8;
							border-radius: 12rpx;
							padding: 20rpx;
							box-sizing: border-box;
							font-size: 28rpx;
							line-height: 1.5;
							border: 1px solid #eee;
						}
					}
					
					.id-tip {
						font-size: 24rpx;
						color: #ff9900;
						line-height: 1.5;
					}
				}
				
				.modal-footer {
					padding: 20rpx 30rpx 40rpx;
					display: flex;
					justify-content: flex-end;
					
					button {
						padding: 16rpx 40rpx;
						margin-left: 20rpx;
						font-size: 28rpx;
						border-radius: 40rpx;
						background-color: transparent;
						
						&::after {
							border: none;
						}
					}
					
					.btn-cancel {
						color: #666;
						background-color: #f5f5f5;
						
						&:active {
							opacity: 0.8;
						}
					}
					
					.btn-save {
						color: #fff;
						background-color: #399bfe;
						box-shadow: 0 4rpx 8rpx rgba(57, 155, 254, 0.3);
						
						&:active {
							opacity: 0.8;
						}
					}
				}
			}
		}
	}
</style>