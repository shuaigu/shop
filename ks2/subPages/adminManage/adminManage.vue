<script setup>
	import { ref, onMounted } from 'vue';
	import { onShow } from '@dcloudio/uni-app'
	// import { useAuthSwitchStore } from '@/store/authSwitch';
	// 权限开关
	// const authSwitchStore = useAuthSwitchStore( )
	// const sendOnApi = uniCloud.importObject( 'sendOn' )
	// const sendOnget = async ( ) => {
	// 	const res = await sendOnApi.get( )
	// 	authSwitchStore.setAuthValue( res.data[ 0 ].state )
	// }

	// onShow( ( ) => {
	// 	sendOnget( )
	// } )

	// const showSendUpdate = async ( ) => {
	// 	authSwitchStore.setAuth( )

	// 	const res = await sendOnApi.update( authSwitchStore.authSwitch )
	// 	console.log( res, '结果' )

	// 	if ( authSwitchStore.authSwitch ) {
	// 		return uni.showToast( {
	// 			icon: "none",
	// 			title: '开'
	// 		} )
	// 	} else {
	// 		return uni.showToast( {
	// 			icon: "none",
	// 			title: '关'
	// 		} )
	// 	}
	// }
	
	// 导航信息
	const navInfo = ref({
		title: '',
		url: '',
		isVisible: false
	});
	
	// 评论区显示控制
	const commentDisplay = ref({
		isVisible: false
	});
	
	// 备忘录首页显示控制
	const memoHomeDisplay = ref({
		isEnabled: false
	});
	
	// 自定义页面入口显示控制
	const customPageEntryDisplay = ref({
		isVisible: false
	});
	
	// 我的页面显示控制
	const myPageDisplay = ref({
		isVisible: true  // 默认显示
	});
	
	// 备忘录管理
	const memoList = ref([]);
	const showMemoDialog = ref(false);
	const memoForm = ref({
		id: '',
		title: '',
		content: '',
		image_url: '',
		sort_order: 0,
		is_enabled: true
	});
	const isEditMemo = ref(false);

	// 导航API
	const daohangApi = uniCloud.importObject('daohang', { customUI: true });
	
	// 配置API
	const configApi = uniCloud.importObject('config', { customUI: true });
	
	// 备忘录API
	const memoApi = uniCloud.importObject('memoList', { customUI: true });

	// 获取导航信息
	const getNavInfo = async () => {
		try {
			uni.showLoading({ title: '加载中...' });
			const res = await daohangApi.getNavInfo();
			if (res.code === 0 && res.data) {
				navInfo.value = res.data;
			} else {
				uni.showToast({ title: '获取导航信息失败', icon: 'none' });
			}
		} catch (err) {
			console.error('获取导航信息异常:', err);
			uni.showToast({ title: '获取导航信息失败', icon: 'none' });
		} finally {
			uni.hideLoading();
		}
	};
	
	// 获取评论区显示状态
	const getCommentDisplayStatus = async () => {
		try {
			const res = await configApi.getConfig('commentDisplay');
			if (res && res.data) {
				// 如果有配置数据，使用配置的值
				commentDisplay.value = res.data;
			} else {
				// 如果没有配置数据，默认为不显示
				commentDisplay.value = { isVisible: false };
				
				// 创建默认配置
				try {
					await configApi.updateConfig({
						key: 'commentDisplay',
						data: {
							isVisible: false
						}
					});
					console.log('已创建默认评论区配置：不显示');
				} catch (createErr) {
					console.error('创建默认评论区配置失败:', createErr);
				}
			}
		} catch (err) {
			console.error('获取评论区显示状态失败:', err);
			// 出错时也默认为不显示
			commentDisplay.value = { isVisible: false };
			uni.showToast({ title: '获取评论区设置失败', icon: 'none' });
		}
	};
	
	// 获取备忘录首页显示状态
	const getMemoHomeDisplayStatus = async () => {
		try {
			const res = await configApi.getConfig('memoHomeDisplay');
			if (res && res.data) {
				memoHomeDisplay.value = res.data;
			} else {
				memoHomeDisplay.value = { isEnabled: false };
			}
		} catch (err) {
			console.error('获取备忘录首页显示状态失败:', err);
			memoHomeDisplay.value = { isEnabled: false };
		}
	};
	
	// 获取自定义页面入口显示状态
	const getCustomPageEntryStatus = async () => {
		try {
			const res = await configApi.getConfig('customPageEntry');
			if (res && res.data) {
				customPageEntryDisplay.value = res.data;
			} else {
				// 默认关闭
				customPageEntryDisplay.value = { isVisible: false };
				
				// 创建默认配置
				try {
					await configApi.updateConfig({
						key: 'customPageEntry',
						data: {
							isVisible: false
						}
					});
					console.log('已创建默认自定义页面入口配置：关闭');
				} catch (createErr) {
					console.error('创建默认自定义页面入口配置失败:', createErr);
				}
			}
		} catch (err) {
			console.error('获取自定义页面入口显示状态失败:', err);
			customPageEntryDisplay.value = { isVisible: false };
		}
	};
	
	// 获取我的页面显示状态
	const getMyPageDisplayStatus = async () => {
		try {
			const res = await configApi.getConfig('myPageDisplay');
			if (res && res.data) {
				myPageDisplay.value = res.data;
			} else {
				// 默认显示
				myPageDisplay.value = { isVisible: true };
				
				// 创建默认配置
				try {
					await configApi.updateConfig({
						key: 'myPageDisplay',
						data: {
							isVisible: true
						}
					});
					console.log('已创建默认我的页面配置：显示');
				} catch (createErr) {
					console.error('创建默认我的页面配置失败:', createErr);
				}
			}
		} catch (err) {
			console.error('获取我的页面显示状态失败:', err);
			myPageDisplay.value = { isVisible: true };
		}
	};
	
	// 获取备忘录列表
	const getMemoList = async () => {
		try {
			const res = await memoApi.getAllDefaultMemos();
			if (res && res.code === 0) {
				memoList.value = res.data || [];
			} else {
				memoList.value = [];
			}
		} catch (err) {
			console.error('获取备忘录列表失败:', err);
			memoList.value = [];
		}
	};
	
	// 打开添加备忘录对话框
	const openAddMemoDialog = () => {
		isEditMemo.value = false;
		memoForm.value = {
			id: '',
			title: '',
			content: '',
			image_url: '',
			sort_order: 0,
			is_enabled: true
		};
		showMemoDialog.value = true;
	};
	
	// 打开编辑备忘录对话框
	const openEditMemoDialog = (memo) => {
		isEditMemo.value = true;
		memoForm.value = {
			id: memo._id,
			title: memo.title || '',
			content: memo.content,
			image_url: memo.image_url || '',
			sort_order: memo.sort_order || 0,
			is_enabled: memo.is_enabled
		};
		showMemoDialog.value = true;
	};
	
	// 保存备忘录
	const saveMemo = async () => {
		try {
			// 验证：标题和内容至少有一个不为空
			if (!memoForm.value.title.trim() && !memoForm.value.content.trim()) {
				return uni.showToast({ title: '请输入标题或内容', icon: 'none' });
			}
			
			uni.showLoading({ title: '保存中...' });
			
			let res;
			if (isEditMemo.value) {
				// 更新
				res = await memoApi.updateDefaultMemo({
					id: memoForm.value.id,
					data: {
						title: memoForm.value.title,
						content: memoForm.value.content,
						image_url: memoForm.value.image_url,
						sort_order: parseInt(memoForm.value.sort_order) || 0,
						is_enabled: memoForm.value.is_enabled
					}
				});
			} else {
				// 新增
				res = await memoApi.addDefaultMemo({
					title: memoForm.value.title,
					content: memoForm.value.content,
					image_url: memoForm.value.image_url,
					sort_order: parseInt(memoForm.value.sort_order) || 0
				});
			}
			
			if (res && res.code === 0) {
				uni.showToast({ title: '保存成功', icon: 'success' });
				showMemoDialog.value = false;
				await getMemoList();
			} else {
				uni.showToast({ title: res?.message || '保存失败', icon: 'none' });
			}
		} catch (err) {
			console.error('保存备忘录失败:', err);
			uni.showToast({ title: '保存失败，请重试', icon: 'none' });
		} finally {
			uni.hideLoading();
		}
	};
	
	// 删除备忘录
	const deleteMemo = async (id) => {
		uni.showModal({
			title: '确认删除',
			content: '确定要删除这条备忘录吗？',
			success: async (res) => {
				if (res.confirm) {
					try {
						uni.showLoading({ title: '删除中...' });
						const result = await memoApi.deleteDefaultMemo(id);
						if (result && result.code === 0) {
							uni.showToast({ title: '删除成功', icon: 'success' });
							await getMemoList();
						} else {
							uni.showToast({ title: result?.message || '删除失败', icon: 'none' });
						}
					} catch (err) {
						console.error('删除备忘录失败:', err);
						uni.showToast({ title: '删除失败，请重试', icon: 'none' });
					} finally {
						uni.hideLoading();
					}
				}
			}
		});
	};
	
	// 切换备忘录启用状态
	const toggleMemoEnabled = async (memo) => {
		try {
			uni.showLoading({ title: '更新中...' });
			const res = await memoApi.updateDefaultMemo({
				id: memo._id,
				data: {
					is_enabled: !memo.is_enabled
				}
			});
			
			if (res && res.code === 0) {
				uni.showToast({ title: '更新成功', icon: 'success' });
				await getMemoList();
			} else {
				uni.showToast({ title: res?.message || '更新失败', icon: 'none' });
			}
		} catch (err) {
			console.error('更新备忘录状态失败:', err);
			uni.showToast({ title: '更新失败，请重试', icon: 'none' });
		} finally {
			uni.hideLoading();
		}
	};
	
	// 处理备忘录内容输入
	const handleMemoContentInput = (e) => {
		memoForm.value.content = e.detail.value;
	};
	

	
	// 处理导航显示状态变化
	const handleNavVisibilityChange = async (e) => {
		try {
			uni.showLoading({ title: '更新中...' });
			const isVisible = e.detail.value;
			
			// 调用云函数更新
			const res = await daohangApi.updateNavInfo({
				isVisible: isVisible
			});
			
			if (res.code === 0) {
				navInfo.value.isVisible = isVisible;
				
				// 发送全局事件，通知前端页面更新导航条状态
				uni.$emit('updateNavVisibility', {
					isVisible: isVisible,
					navInfo: {
						title: navInfo.value.title,
						url: navInfo.value.url,
						isVisible: isVisible
					}
				});
				
				uni.showToast({ 
					title: isVisible ? '导航已显示' : '导航已隐藏', 
					icon: 'success' 
				});
			} else {
				// 更新失败，恢复原来的状态
				navInfo.value.isVisible = !isVisible;
				uni.showToast({ title: res.message || '更新失败', icon: 'none' });
			}
		} catch (err) {
			// 出错时恢复原来的状态
			navInfo.value.isVisible = !e.detail.value;
			console.error('更新导航设置失败:', err);
			uni.showToast({ title: '更新失败，请重试', icon: 'none' });
		} finally {
			uni.hideLoading();
		}
	};
	
	// 处理评论区显示状态变化
	const handleCommentVisibilityChange = async (e) => {
		try {
			uni.showLoading({ title: '更新中...' });
			const isVisible = e.detail.value;
			
			// 调用云函数更新
			const res = await configApi.updateConfig({
				key: 'commentDisplay',
				data: {
					isVisible: isVisible
				}
			});
			
			if (res && res.code === 0) {
				commentDisplay.value.isVisible = isVisible;
				
				// 发送全局事件，通知前端页面更新评论区状态
				uni.$emit('updateCommentVisibility', {
					isVisible: isVisible
				});
				
				uni.showToast({ 
					title: isVisible ? '评论区已显示' : '评论区已隐藏', 
					icon: 'success' 
				});
			} else {
				// 更新失败，恢复原来的状态
				commentDisplay.value.isVisible = !isVisible;
				uni.showToast({ title: res?.message || '更新失败', icon: 'none' });
			}
		} catch (err) {
			// 出错时恢复原来的状态
			commentDisplay.value.isVisible = !e.detail.value;
			console.error('更新评论区设置失败:', err);
			uni.showToast({ title: '更新失败，请重试', icon: 'none' });
		} finally {
			uni.hideLoading();
		}
	};
	
	// 处理备忘录首页显示状态变化
	const handleMemoHomeDisplayChange = async (e) => {
		try {
			uni.showLoading({ title: '更新中...' });
			const isEnabled = e.detail.value;
			
			// 调用云函数更新
			const res = await configApi.updateConfig({
				key: 'memoHomeDisplay',
				data: {
					isEnabled: isEnabled
				}
			});
			
			if (res && res.code === 0) {
				memoHomeDisplay.value.isEnabled = isEnabled;
				uni.showToast({ 
					title: isEnabled ? '已开启备忘录首页显示' : '已关闭备忘录首页显示', 
					icon: 'success' 
				});
			} else {
				// 更新失败，恢复原来的状态
				memoHomeDisplay.value.isEnabled = !isEnabled;
				uni.showToast({ title: res?.message || '更新失败', icon: 'none' });
			}
		} catch (err) {
			// 出错时恢复原来的状态
			memoHomeDisplay.value.isEnabled = !e.detail.value;
			console.error('更新备忘录首页显示设置失败:', err);
			uni.showToast({ title: '更新失败，请重试', icon: 'none' });
		} finally {
			uni.hideLoading();
		}
	};
	
	// 处理自定义页面入口显示状态变化
	const handleCustomPageEntryChange = async (e) => {
		try {
			uni.showLoading({ title: '更新中...' });
			const isVisible = e.detail.value;
			
			// 调用云函数更新
			const res = await configApi.updateConfig({
				key: 'customPageEntry',
				data: {
					isVisible: isVisible
				}
			});
			
			if (res && res.code === 0) {
				customPageEntryDisplay.value.isVisible = isVisible;
				
				// 发送全局事件，通知前端页面更新自定义页面入口状态
				uni.$emit('updateCustomPageEntry', {
					isVisible: isVisible
				});
				
				uni.showToast({ 
					title: isVisible ? '入口已显示' : '入口已隐藏', 
					icon: 'success' 
				});
			} else {
				// 更新失败，恢复原来的状态
				customPageEntryDisplay.value.isVisible = !isVisible;
				uni.showToast({ title: res?.message || '更新失败', icon: 'none' });
			}
		} catch (err) {
			// 出错时恢复原来的状态
			customPageEntryDisplay.value.isVisible = !e.detail.value;
			console.error('更新自定义页面入口设置失败:', err);
			uni.showToast({ title: '更新失败，请重试', icon: 'none' });
		} finally {
			uni.hideLoading();
		}
	};
	
	// 处理我的页面显示状态变化
	const handleMyPageDisplayChange = async (e) => {
		try {
			uni.showLoading({ title: '更新中...' });
			const isVisible = e.detail.value;
			
			// 调用云函数更新
			const res = await configApi.updateConfig({
				key: 'myPageDisplay',
				data: {
					isVisible: isVisible
				}
			});
			
			if (res && res.code === 0) {
				myPageDisplay.value.isVisible = isVisible;
				
				// 发送全局事件，通知前端页面更新我的页面状态
				uni.$emit('updateMyPageDisplay', {
					isVisible: isVisible
				});
				
				uni.showToast({ 
					title: isVisible ? '我的页面已开启' : '我的页面已关闭', 
					icon: 'success' 
				});
			} else {
				// 更新失败，恢复原来的状态
				myPageDisplay.value.isVisible = !isVisible;
				uni.showToast({ title: res?.message || '更新失败', icon: 'none' });
			}
		} catch (err) {
			// 出错时恢复原来的状态
			myPageDisplay.value.isVisible = !e.detail.value;
			console.error('更新我的页面设置失败:', err);
			uni.showToast({ title: '更新失败，请重试', icon: 'none' });
		} finally {
			uni.hideLoading();
		}
	};
	

	


	// 保存导航设置
	const saveNavSettings = async () => {
		try {
			// 验证输入
			if (!navInfo.value.title.trim()) {
				return uni.showToast({ title: '请输入导航标题', icon: 'none' });
			}
			
			if (!navInfo.value.url.trim()) {
				return uni.showToast({ title: '请输入导航链接', icon: 'none' });
			}
			
			uni.showLoading({ title: '保存中...' });
			
			// 调用云函数更新
			const res = await daohangApi.updateNavInfo({
				title: navInfo.value.title,
				url: navInfo.value.url,
				isVisible: navInfo.value.isVisible
			});
			
			if (res.code === 0) {
				// 发送全局事件，通知前端页面更新导航条信息
				uni.$emit('updateNavVisibility', {
					isVisible: navInfo.value.isVisible,
					navInfo: {
						title: navInfo.value.title,
						url: navInfo.value.url,
						isVisible: navInfo.value.isVisible
					}
				});
				
				uni.showToast({ title: '保存成功', icon: 'success' });
			} else {
				uni.showToast({ title: res.message || '保存失败', icon: 'none' });
			}
		} catch (err) {
			console.error('保存导航设置失败:', err);
			uni.showToast({ title: '保存失败，请重试', icon: 'none' });
		} finally {
			uni.hideLoading();
		}
	};
	

	
	// 后期想做新的功能，直接添加就好
	const data = ref( [ '信息页面', '分类管理', '文章管理', '用户反馈', '公司信息', '自定义页面管理', '文章权限' ] )
	// 处理点击事件跳转页面
	const handleItem = ( dataItem ) => {
		switch ( dataItem ) {
			case '信息页面':
				console.log( '跳转信息页面' )
				uni.redirectTo( {
					url: "/pages/index/index"
				} )
				break
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
			case '自定义页面管理':
				console.log( '跳转自定义页面管理' )
				uni.navigateTo( {
					url: "/subPages/customPageManage/customPageManage"
				} )
				break
			case '文章权限':
				showSendUpdate( )
				break
		}
	}
	
	// 页面加载时获取导航信息
	onMounted(async () => {
		// 先获取各项配置
		await Promise.all([
			getNavInfo(),
			getCommentDisplayStatus(),
			getMemoHomeDisplayStatus(),
			getCustomPageEntryStatus(),
			getMyPageDisplayStatus(),
			getMemoList()
		]);
		
		// 确保评论区状态通知发送
		uni.$emit('updateCommentVisibility', {
			isVisible: commentDisplay.value.isVisible
		});
		
		console.log('初始化完成，评论区显示状态:', commentDisplay.value.isVisible);
		console.log('初始化完成，备忘录首页显示状态:', memoHomeDisplay.value.isEnabled);
		console.log('初始化完成，备忘录列表:', memoList.value.length);
	});
</script>

<template>
	<view class="adminManage">
		<scroll-view class="scroll-container" scroll-y>
			<view class="content">
				<view class="settings-section">
					<view class="section-title">导航条设置</view>
					<view class="setting-item">
						<text class="setting-label">导航条标题</text>
						<input class="setting-input" v-model="navInfo.title" placeholder="请输入导航条标题" />
					</view>
					<view class="setting-item">
						<text class="setting-label">导航条链接</text>
						<input class="setting-input" v-model="navInfo.url" placeholder="请输入导航条链接" />
					</view>
					<view class="setting-item">
						<text class="setting-label">显示导航条</text>
						<switch :checked="navInfo.isVisible" @change="handleNavVisibilityChange" color="#007AFF" />
					</view>
					<button class="save-btn" @click="saveNavSettings">保存导航条设置</button>
				</view>
				
				<view class="settings-section">
					<view class="section-title">评论区设置</view>
					<view class="setting-item">
						<text class="setting-label">显示评论区</text>
						<switch :checked="commentDisplay.isVisible" @change="handleCommentVisibilityChange" color="#007AFF" />
					</view>
				</view>
				
				<view class="settings-section memo-section">
					<view class="section-title">默认备忘录管理</view>
					<view class="memo-list-container">
						<view v-if="memoList.length === 0" class="empty-memo">
							<text class="empty-text">暂无备忘录，点击下方按钮添加</text>
						</view>
						<view v-else class="memo-list">
							<view v-for="(memo, index) in memoList" :key="memo._id" class="memo-item">
								<view class="memo-item-header">
									<view class="memo-title-row">
										<text class="memo-index">{{ index + 1 }}</text>
										<text class="memo-title">{{ memo.title || '(无标题)' }}</text>
										<switch :checked="memo.is_enabled" @change="toggleMemoEnabled(memo)" color="#4CD964" class="memo-switch" />
									</view>
								</view>
								<view class="memo-content">{{ memo.content }}</view>
								<view v-if="memo.image_url" class="memo-image">
									<text class="image-label">配图：</text>
									<text class="image-url">{{ memo.image_url }}</text>
								</view>
								<view class="memo-actions">
									<text class="action-btn edit" @click="openEditMemoDialog(memo)">编辑</text>
									<text class="action-btn delete" @click="deleteMemo(memo._id)">删除</text>
								</view>
							</view>
						</view>
					</view>
					<button class="add-memo-btn" @click="openAddMemoDialog">添加默认备忘录</button>
				</view>
				

				
				
				
				<view class="section">
					<view class="header">
						<view class="title">管理</view>
					</view>
					<view class="item" v-for="item in data" :key="item" @click="handleItem(item)">
						<view class="left">
							<!-- 占位 -->
							<view class="box">
							</view>
							<view class="value">
								{{item}}
							</view>
						</view>
						<uni-icons color="#cccccc" custom-prefix="iconfont" type="icon-arrow-drop-right-line"
							size="30"></uni-icons>
					</view>
				</view>
			</view>
		</scroll-view>
		
		<!-- 备忘录编辑对话框 -->
		<view v-if="showMemoDialog" class="dialog-mask" @tap="showMemoDialog = false">
			<view class="dialog-content" @tap.stop>
				<view class="dialog-header">
					<text class="dialog-title">{{ isEditMemo ? '编辑备忘录' : '添加备忘录' }}</text>
					<view class="close-btn" @tap="showMemoDialog = false">×</view>
				</view>
				<view class="dialog-body">
					<view class="form-item">
						<text class="form-label">标题</text>
						<input 
							class="form-input" 
							v-model="memoForm.title" 
							placeholder="请输入标题（可选）"
						/>
					</view>
					<view class="form-item">
						<text class="form-label">内容（可选）</text>
						<textarea 
							v-model="memoForm.content" 
							placeholder="待输入" 
							class="form-textarea"
							:maxlength="500"
							auto-height
							:adjust-position="false"
							show-confirm-bar="false"
							confirm-type="done"
							:disable-default-padding="true"
							@input="handleMemoContentInput"
							@confirm="() => {}"
						/>
						<view class="char-count">{{ memoForm.content ? memoForm.content.length : 0 }}/500</view>
					</view>
					<view class="form-item">
						<text class="form-label">配图URL</text>
						<input 
							class="form-input" 
							v-model="memoForm.image_url" 
							placeholder="请输入图片地址（可选）"
						/>
					</view>
					<view class="form-item">
						<text class="form-label">排序</text>
						<input 
							class="form-input" 
							v-model="memoForm.sort_order" 
							type="number" 
							placeholder="数字越小越靠前"
						/>
					</view>
					<view class="form-item form-item-switch">
						<text class="form-label">启用</text>
						<switch 
							:checked="memoForm.is_enabled" 
							@change="memoForm.is_enabled = $event.detail.value" 
							color="#4CD964" 
						/>
					</view>
				</view>
				<view class="dialog-footer">
					<view class="dialog-btn cancel-btn" @tap="showMemoDialog = false">取消</view>
					<view class="dialog-btn confirm-btn" @tap="saveMemo">保存</view>
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
		height: 100vh;
		overflow: hidden;
		display: flex;
		flex-direction: column;
	}
	
	.scroll-container {
		flex: 1;
		height: 100%;
		overflow-y: auto;
		-webkit-overflow-scrolling: touch; /* 增强iOS滚动体验 */
	}

	.content {
		border-radius: 24rpx;
		background-color: #fff;
		padding-bottom: 50rpx; /* 添加底部内边距，确保最后的内容可见 */
		
		.settings-section {
			margin: 20rpx;
			padding: 24rpx;
			background-color: #fff;
			border-radius: 12rpx;
			box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.08);
			margin-bottom: 30rpx;
			border-left: 8rpx solid;
			
			&:nth-child(1) {
				border-left-color: #007AFF; /* 导航条设置 - 蓝色 */
			}
			
			&:nth-child(2) {
				border-left-color: #FF9500; /* 评论区设置 - 橙色 */
			}
			
			&:nth-child(3) {
				border-left-color: #5856D6; /* 备忘录管理 - 紫色 */
			}
			
			.section-title {
				font-size: 32rpx;
				font-weight: 600;
				color: #333;
				margin-bottom: 24rpx;
				padding-bottom: 16rpx;
				border-bottom: 1px solid $pyq-border-color-translucent;
				display: flex;
				align-items: center;
				
				&::before {
					content: "";
					display: inline-block;
					width: 8rpx;
					height: 32rpx;
					margin-right: 16rpx;
					border-radius: 4rpx;
					background-color: currentColor;
				}
			}
			
			.setting-item {
				display: flex;
				justify-content: space-between;
				align-items: center;
				padding: 24rpx 0;
				border-bottom: 1px solid rgba(0, 0, 0, 0.05);
				
				&:last-child {
					border-bottom: none;
				}
				
				&:hover {
					background-color: rgba(0, 0, 0, 0.01);
				}
				
				.setting-label {
					font-size: 28rpx;
					color: #333;
					flex-shrink: 0; /* 防止标签被压缩 */
					margin-right: 20rpx; /* 确保与输入框有间距 */
					font-weight: 500;
				}
				
				.setting-input {
					flex: 1;
					margin-left: 20rpx;
					height: 70rpx;
					padding: 0 20rpx;
					background-color: #f5f5f5;
					border-radius: 8rpx;
					font-size: 28rpx;
					border: 1px solid rgba(0, 0, 0, 0.05);
					transition: all 0.3s ease;
					
					&:focus {
						border-color: #007AFF;
						background-color: rgba(0, 122, 255, 0.05);
					}
				}
				
				.lucky-ranks-container {
					flex: 1;
					display: flex;
					flex-wrap: wrap;
					margin-left: 20rpx;
					
					.lucky-rank-tag {
						display: flex;
						align-items: center;
						background-color: #f0f8ff;
						border: 1px solid #d0e6ff;
						border-radius: 8rpx;
						padding: 8rpx 16rpx;
						margin-right: 16rpx;
						margin-bottom: 16rpx;
						transition: all 0.2s ease;
						
						&:active {
							transform: scale(0.95);
						}
						
						.rank-delete {
							margin-left: 8rpx;
							color: #ff5d5b;
							font-size: 32rpx;
							font-weight: bold;
							width: 40rpx;
							height: 40rpx;
							display: flex;
							align-items: center;
							justify-content: center;
							
							&:active {
								opacity: 0.7;
								transform: scale(1.2);
							}
						}
					}
				}
				
				.add-rank-container {
					flex: 1;
					display: flex;
					margin-left: 20rpx;
					
					.rank-input {
						flex: 1;
						height: 70rpx;
						padding: 0 20rpx;
						background-color: #f5f5f5;
						border-radius: 8rpx;
						font-size: 28rpx;
						text-align: left;
						min-width: 120rpx; /* 确保输入框有最小宽度 */
					}
					
					.add-rank-btn {
						margin-left: 16rpx;
						height: 70rpx;
						line-height: 70rpx;
						padding: 0 30rpx;
						background-color: #007AFF;
						color: #fff;
						border-radius: 8rpx;
						font-size: 28rpx;
						white-space: nowrap; /* 防止文字换行 */
						box-shadow: 0 4rpx 12rpx rgba(0, 122, 255, 0.2);
						transition: all 0.3s ease;
						
						&:active {
							transform: translateY(2rpx);
							box-shadow: 0 2rpx 6rpx rgba(0, 122, 255, 0.1);
							opacity: 0.9;
						}
					}
				}
			}
			
			.setting-tip {
				padding: 16rpx 0 0 0;
				
				.tip-text {
					font-size: 24rpx;
					color: #999;
					line-height: 1.5;
				}
			}
			
			.save-btn {
				margin-top: 30rpx;
				background-color: $pyq-vi-color;
				color: #fff;
				border: none;
				border-radius: 8rpx;
				font-size: 28rpx;
				padding: 20rpx 0;
				font-weight: 500;
				box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);
				transition: all 0.3s ease;
				
				&:active {
					transform: translateY(2rpx);
					box-shadow: 0 2rpx 6rpx rgba(0, 0, 0, 0.1);
					opacity: 0.9;
				}
			}
		}

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
		}
		
		.section {
			padding: 24rpx;
			margin: 20rpx;
			background-color: #fff;
			border-radius: 12rpx;
			box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.08);
			margin-bottom: 30rpx;
			border-left: 8rpx solid #4CD964; /* 管理部分 - 绿色 */
			
			.header {
				margin-bottom: 20rpx;
				padding-bottom: 10rpx;
				border-bottom: 1px solid $pyq-border-color-translucent;
				
				.title {
					font-size: 32rpx;
					font-weight: 600;
					color: $pyq-text-color-title;
					display: flex;
					align-items: center;
					
					&::before {
						content: "";
						display: inline-block;
						width: 8rpx;
						height: 32rpx;
						margin-right: 16rpx;
						border-radius: 4rpx;
						background-color: #4CD964;
					}
				}
			}
		}
	}
	
	// 对话框样式
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
		z-index: 9999;
		padding: 40rpx;
		box-sizing: border-box;
		
		.dialog-content {
			width: 100%;
			max-width: 600rpx;
			max-height: 85vh;
			background: #fff;
			border-radius: 16rpx;
			display: flex;
			flex-direction: column;
			overflow: hidden;
		}
		
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
				width: 48rpx;
				height: 48rpx;
				display: flex;
				align-items: center;
				justify-content: center;
				font-size: 48rpx;
				color: #999;
				line-height: 1;
			}
		}
		
		.dialog-body {
			padding: 24rpx;
			max-height: 60vh;
			overflow-y: auto;
			flex: 1;
			-webkit-overflow-scrolling: touch;
			
			.form-item {
				margin-bottom: 24rpx;
				
				&.form-item-switch {
					display: flex;
					justify-content: space-between;
					align-items: center;
				}
				
				.form-label {
					display: block;
					font-size: 28rpx;
					color: #333;
					margin-bottom: 12rpx;
					font-weight: bold;
				}
				
				.form-input {
					width: 100%;
					height: 70rpx;
					padding: 0 20rpx;
					background: #f5f5f5;
					border-radius: 8rpx;
					border: 1rpx solid #ddd;
					font-size: 28rpx;
					box-sizing: border-box;
				}
				
				.form-textarea {
					width: 100%;
					min-height: 200rpx;
					padding: 16rpx;
					background: #f5f5f5;
					border: 1rpx solid #ddd;
					border-radius: 8rpx;
					font-size: 28rpx;
					box-sizing: border-box;
					line-height: 1.6;
				}
				
				.char-count {
					margin-top: 8rpx;
					text-align: right;
					font-size: 24rpx;
					color: #999;
				}
			}
		}
		
		.dialog-footer {
			display: flex;
			border-top: 1rpx solid #f0f0f0;
			
			.dialog-btn {
				flex: 1;
				padding: 28rpx;
				text-align: center;
				font-size: 30rpx;
				
				&.cancel-btn {
					color: #666;
					border-right: 1rpx solid #f0f0f0;
				}
				
				&.confirm-btn {
					color: #5856D6;
					font-weight: bold;
				}
			}
		}
	}
</style>