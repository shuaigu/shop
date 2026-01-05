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

	// 导航API
	const daohangApi = uniCloud.importObject('daohang', { customUI: true });
	
	// 配置API
	const configApi = uniCloud.importObject('config', { customUI: true });

	// 幸运用户配置
	const luckyUserConfig = ref({
		lucky_ranks: [1, 8, 18],
		rewards: '幸运用户专属奖励',
		is_enabled: true
	});

	// 新增幸运用户排名输入
	const newLuckyRank = ref('');

	// 点赞API
	const likeApi = uniCloud.importObject('likeRecord', { customUI: true });

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
	
	// 获取幸运用户配置
	const getLuckyUserConfig = async () => {
		try {
			uni.showLoading({ title: '加载中...' });
			const res = await likeApi.getLuckyConfig();
			if (res.code === 0 && res.data) {
				luckyUserConfig.value = res.data;
			} else {
				uni.showToast({ title: '获取幸运用户配置失败', icon: 'none' });
			}
		} catch (err) {
			console.error('获取幸运用户配置异常:', err);
			uni.showToast({ title: '获取幸运用户配置失败', icon: 'none' });
		} finally {
			uni.hideLoading();
		}
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
				uni.showToast({ title: res.message || '更新失败', icon: 'none' });
			}
		} catch (err) {
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
				uni.showToast({ title: res?.message || '更新失败', icon: 'none' });
			}
		} catch (err) {
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
				uni.showToast({ title: res?.message || '更新失败', icon: 'none' });
			}
		} catch (err) {
			console.error('更新备忘录首页显示设置失败:', err);
			uni.showToast({ title: '更新失败，请重试', icon: 'none' });
		} finally {
			uni.hideLoading();
		}
	};
	
	// 处理幸运用户功能启用状态变化
	const handleLuckyUserEnabledChange = async (e) => {
		try {
			uni.showLoading({ title: '更新中...' });
			const isEnabled = e.detail.value;
			
			// 调用云函数更新
			const res = await likeApi.updateLuckyConfig({
				is_enabled: isEnabled
			});
			
			if (res.code === 0) {
				luckyUserConfig.value.is_enabled = isEnabled;
				uni.showToast({ 
					title: isEnabled ? '幸运用户功能已启用' : '幸运用户功能已禁用', 
					icon: 'success' 
				});
			} else {
				uni.showToast({ title: res.message || '更新失败', icon: 'none' });
			}
		} catch (err) {
			console.error('更新幸运用户设置失败:', err);
			uni.showToast({ title: '更新失败，请重试', icon: 'none' });
		} finally {
			uni.hideLoading();
		}
	};
	
	// 添加幸运用户排名
	const addLuckyRank = () => {
		// 验证输入
		const rank = parseInt(newLuckyRank.value);
		if (isNaN(rank) || rank <= 0) {
			return uni.showToast({ title: '请输入有效的排名数字', icon: 'none' });
		}
		
		// 检查是否已存在
		if (luckyUserConfig.value.lucky_ranks.includes(rank)) {
			return uni.showToast({ title: '该排名已存在', icon: 'none' });
		}
		
		// 添加排名
		luckyUserConfig.value.lucky_ranks.push(rank);
		// 排序
		luckyUserConfig.value.lucky_ranks.sort((a, b) => a - b);
		// 清空输入
		newLuckyRank.value = '';
		
		// 显示成功提示
		uni.showToast({ title: `已添加第${rank}位`, icon: 'success' });
	};

	// 删除幸运用户排名
	const removeLuckyRank = (rank) => {
		luckyUserConfig.value.lucky_ranks = luckyUserConfig.value.lucky_ranks.filter(r => r !== rank);
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
	
	// 保存幸运用户配置
	const saveLuckyUserConfig = async () => {
		try {
			// 验证输入
			if (!luckyUserConfig.value.lucky_ranks || luckyUserConfig.value.lucky_ranks.length === 0) {
				return uni.showToast({ title: '请至少添加一个幸运用户排名', icon: 'none' });
			}
			
			if (!luckyUserConfig.value.rewards || !luckyUserConfig.value.rewards.trim()) {
				return uni.showToast({ title: '请输入奖励描述', icon: 'none' });
			}
			
			uni.showLoading({ title: '保存中...' });
			
			// 调用云函数更新
			const res = await likeApi.updateLuckyConfig({
				lucky_ranks: luckyUserConfig.value.lucky_ranks,
				rewards: luckyUserConfig.value.rewards,
				is_enabled: luckyUserConfig.value.is_enabled
			});
			
			if (res.code === 0) {
				uni.showToast({ title: '保存成功', icon: 'success' });
			} else {
				uni.showToast({ title: res.message || '保存失败', icon: 'none' });
			}
		} catch (err) {
			console.error('保存幸运用户配置失败:', err);
			uni.showToast({ title: '保存失败，请重试', icon: 'none' });
		} finally {
			uni.hideLoading();
		}
	};
	
	// 后期想做新的功能，直接添加就好
	const data = ref( [ '信息页面', '分类管理', '文章管理', '用户反馈', '公司信息', '文章权限' ] )
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
			getLuckyUserConfig(),
			getMemoHomeDisplayStatus()
		]);
		
		// 确保评论区状态通知发送
		uni.$emit('updateCommentVisibility', {
			isVisible: commentDisplay.value.isVisible
		});
		
		console.log('初始化完成，评论区显示状态:', commentDisplay.value.isVisible);
		console.log('初始化完成，备忘录首页显示状态:', memoHomeDisplay.value.isEnabled);
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
				
				<view class="settings-section">
					<view class="section-title">备忘录首页设置</view>
					<view class="setting-item">
						<text class="setting-label">开启备忘录首页显示</text>
						<switch :checked="memoHomeDisplay.isEnabled" @change="handleMemoHomeDisplayChange" color="#007AFF" />
					</view>
					<view class="setting-tip">
						<text class="tip-text">开启后，所有用户访问首页时将直接显示备忘录页面</text>
					</view>
				</view>
				
				<view class="settings-section">
					<view class="section-title">幸运用户配置</view>
					<view class="setting-item">
						<text class="setting-label">启用幸运用户功能</text>
						<switch :checked="luckyUserConfig.is_enabled" @change="handleLuckyUserEnabledChange" color="#007AFF" />
					</view>
					
					<view class="setting-item">
						<text class="setting-label">奖励描述</text>
						<input class="setting-input" v-model="luckyUserConfig.rewards" placeholder="请输入奖励描述" />
					</view>
					
					<view class="setting-item">
						<text class="setting-label">幸运用户排名</text>
						<view class="lucky-ranks-container">
							<view class="lucky-rank-tag" v-for="rank in luckyUserConfig.lucky_ranks" :key="rank">
								<text>第{{ rank }}位</text>
								<text class="rank-delete" @click="removeLuckyRank(rank)">×</text>
							</view>
						</view>
					</view>
					
					<view class="setting-item">
						<text class="setting-label">添加排名</text>
						<view class="add-rank-container">
							<input 
								class="rank-input" 
								v-model="newLuckyRank" 
								type="number" 
								placeholder="输入排名数字" 
								@confirm="addLuckyRank"
								:maxlength="5"
							/>
							<button class="add-rank-btn" @click="addLuckyRank">添加</button>
						</view>
					</view>
					
					<button class="save-btn" @click="saveLuckyUserConfig">保存幸运用户配置</button>
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
				border-left-color: #5856D6; /* 备忘录首页设置 - 紫色 */
			}
			
			&:nth-child(4) {
				border-left-color: #FF2D55; /* 幸运用户配置 - 红色 */
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
</style>