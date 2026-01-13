<template>
	<view class="memo-container">
		<!-- 顶部分类筛选 -->
		<view class="category-tabs">
			<view 
				v-for="(tab, index) in tabs" 
				:key="index"
				class="tab-item"
				:class="{ active: activeTab === tab.value }"
				@click="switchTab(tab.value)"
			>
				{{ tab.label }}
			</view>
		</view>
			
		<!-- 系统推荐入口 -->
		<view class="recommend-entry" @click="goToRecommendList">
			<view class="entry-left">
				<text class="entry-icon">🌟</text>
				<text class="entry-text">系统推荐备忘</text>
			</view>
			<view class="entry-right">
				<text class="entry-hint">查看全部</text>
				<text class="entry-arrow">›</text>
			</view>
		</view>
		

		<!-- 备忘录列表 -->
		<scroll-view class="memo-list" scroll-y>
			<view v-if="filteredMemos.length === 0" class="empty-state">
				<text class="empty-icon">📝</text>
				<text class="empty-text">{{ emptyText }}</text>
			</view>
			
			<view v-else class="memo-items">
				<view 
					v-for="(memo, index) in filteredMemos" 
					:key="memo.id"
					class="memo-card"
					:class="{ completed: memo.is_completed }"
				>
					<!-- 卡片头部 -->
					<view class="card-header">
						<view class="header-left">
							<view 
								class="checkbox" 
								:class="{ checked: memo.is_completed }"
								@click="toggleComplete(memo.id)"
							>
								<text v-if="memo.is_completed" class="check-icon">✓</text>
							</view>
							<text class="memo-title" :class="{ completed: memo.is_completed }">
								{{ getFirstLine(memo.content) }}
							</text>
						</view>
						<view class="priority-badge" :class="'priority-' + memo.priority">
							{{ memo.priority }}
						</view>
					</view>

					<!-- 卡片内容 -->
					<view class="card-content">
						<text class="memo-content">{{ memo.content }}</text>
					</view>

					<!-- 卡片底部 -->
					<view class="card-footer">
						<view class="footer-left">
							<text class="category-tag">{{ memo.category }}</text>
							<text class="time-text">{{ formatTime(memo.create_time) }}</text>
						</view>
						<view class="action-buttons">
							<view 
								class="action-btn"
								:class="memo.is_completed ? 'completed-btn' : 'complete-btn'"
								@tap="toggleComplete(memo.id)"
							>
								<text>{{ memo.is_completed ? '已完成' : '完成' }}</text>
							</view>
							<view class="action-btn edit-btn" @tap="editMemo(memo)">
								<text>编辑</text>
							</view>
							<view class="action-btn delete-btn" @tap="deleteMemo(memo.id)">
								<text>删除</text>
							</view>
						</view>
					</view>
				</view>
			</view>
		</scroll-view>

		<!-- 底部按钮组 -->
		<view class="bottom-buttons">
			<!-- 添加按钮 -->
			<view class="add-button" @click="openAddDialog">
				<text class="add-icon">+</text>
			</view>
		</view>

		<!-- 添加/编辑弹窗 -->
		<view v-if="showAddDialog" class="dialog-mask" @tap="handleMaskClick">
			<view class="dialog-content" @tap.stop>
				<view class="dialog-header">
					<text class="dialog-title">{{ isEdit ? '编辑备忘录' : '新建备忘录' }}</text>
					<view class="close-btn" @tap="closeDialog">×</view>
				</view>

				<view class="dialog-body">
					<!-- 内容输入 -->
					<view class="form-item">
						<text class="form-label">备忘内容</text>
						<textarea 
							value="{{formData.content}}"
							class="form-textarea"
							placeholder="请输入备忘内容"
							placeholder-style="color: #999; font-size: 28rpx;"
							maxlength="500"
							auto-height="{{false}}"
							adjust-position="{{true}}"
							cursor-spacing="20"
							show-confirm-bar="{{false}}"
							focus="{{contentFocus}}"
							@input="handleContentInput"
							@focus="handleContentFocus"
							@blur="handleContentBlur"
							@confirm="handleContentConfirm"
						/>
						<view class="char-count">{{ formData.content.length }}/500</view>
					</view>

					<!-- 分类选择 -->
					<view class="form-item">
						<text class="form-label">分类</text>
						<view class="radio-group">
							<view 
								v-for="cat in categories" 
								:key="cat"
								class="radio-item"
								:class="{ active: formData.category === cat }"
								@click="selectCategory(cat)"
							>
								{{ cat }}
							</view>
						</view>
					</view>

					<!-- 优先级选择 -->
					<view class="form-item">
						<text class="form-label">优先级</text>
						<view class="radio-group">
							<view 
								v-for="pri in priorities" 
								:key="pri"
								class="radio-item priority-item"
								:class="[{ active: formData.priority === pri }, 'priority-' + pri]"
								@click="selectPriority(pri)"
							>
								{{ pri }}
							</view>
						</view>
					</view>
				</view>

				<view class="dialog-footer">
					<view class="dialog-btn cancel-btn" @tap="closeDialog">取消</view>
					<view class="dialog-btn confirm-btn" @tap="saveMemo">保存</view>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
import { useUserInfoStore } from '@/store/user.js'

export default {
	data() {
		const userStore = useUserInfoStore()
		return {
			// 标签页
			tabs: [
				{ label: '全部', value: 'all' },
				{ label: '未完成', value: 'pending' },
				{ label: '已完成', value: 'completed' }
			],
			activeTab: 'all',
			
			// 分类和优先级
			categories: ['工作', '生活', '学习', '其他'],
			priorities: ['低', '中', '高'],
			
			// 备忘录列表
			memos: [],
			
			// 默认备忘录列表
			defaultMemos: [],
			
			// 收藏状态映射（memo_id -> boolean）
			collectedMap: {},
			
			// 分享用户信息
			shareUserId: '',
			shareUserNickname: '',
			
			// 弹窗控制
			showAddDialog: false,
			isEdit: false,
			
			// 输入框焦点控制
			contentFocus: false,
			
			// 表单数据
			formData: {
				id: '',
				content: '',
				category: '其他',
				priority: '中',
				is_completed: false,
				create_time: 0
			}
		};
	},
	
	computed: {
		// 筛选后的备忘录列表
		filteredMemos() {
			if (this.activeTab === 'all') {
				return this.memos;
			} else if (this.activeTab === 'pending') {
				return this.memos.filter(m => !m.is_completed);
			} else {
				return this.memos.filter(m => m.is_completed);
			}
		},
		
		// 空状态提示文本
		emptyText() {
			if (this.activeTab === 'all') {
				return '暂无备忘录，点击下方按钮添加';
			} else if (this.activeTab === 'pending') {
				return '暂无未完成的备忘录';
			} else {
				return '暂无已完成的备忘录';
			}
		}
	},
	
	onLoad(options) {
		console.log('=== 页面加载 onLoad ===');
		
		// 获取分享用户信息
		if (options && options.shareUserId) {
			this.shareUserId = options.shareUserId;
			this.shareUserNickname = options.shareUserNickname || '';
			console.log('获取到分享用户:', this.shareUserId, this.shareUserNickname);
			
			// 保存到本地存储
			try {
				uni.setStorageSync('memo_share_user', {
					id: this.shareUserId,
					nickname: this.shareUserNickname
				});
			} catch (e) {
				console.error('保存分享用户信息失败:', e);
			}
		} else {
			// 尝试从本地存储获取
			try {
				const shareUserInfo = uni.getStorageSync('memo_share_user');
				if (shareUserInfo) {
					this.shareUserId = shareUserInfo.id || '';
					this.shareUserNickname = shareUserInfo.nickname || '';
					console.log('从本地获取分享用户:', this.shareUserId, this.shareUserNickname);
				}
			} catch (e) {
				console.error('获取本地分享用户信息失败:', e);
			}
		}
		
		this.loadMemos();
		this.loadDefaultMemos();
	},
	
	methods: {
		// 加载默认备忘录
		async loadDefaultMemos() {
			console.log('=== 开始加载默认备忘录 ===');
			try {
				const memoApi = uniCloud.importObject('memoList', { customUI: true });
				const res = await memoApi.getDefaultMemos();
				if (res && res.code === 0) {
					this.defaultMemos = res.data || [];
					console.log('加载默认备忘录成功:', this.defaultMemos.length, '条');
					
					// 加载收藏状态
					await this.loadCollectionStatus();
				} else {
					console.log('加载默认备忘录失败:', res?.message);
					this.defaultMemos = [];
				}
			} catch (e) {
				console.error('加载默认备忘录失败:', e);
				this.defaultMemos = [];
			}
		},
		
		// 加载收藏状态
		async loadCollectionStatus() {
			console.log('=== 加载收藏状态 ===');
			try {
				const userStore = useUserInfoStore();
				const userId = userStore.userInfo.uid;
				
				if (!userId) {
					console.log('用户未登录，跳过加载收藏状态');
					return;
				}
				
				const memoApi = uniCloud.importObject('memoList', { customUI: true });
				
				// 检查每个默认备忘录的收藏状态
				for (const memo of this.defaultMemos) {
					try {
						const res = await memoApi.checkCollected(memo._id, userId);
						if (res && res.code === 0) {
							this.collectedMap[memo._id] = res.data.collected;
						}
					} catch (e) {
						console.error('检查收藏状态失败:', e);
					}
				}
				console.log('收藏状态加载完成:', this.collectedMap);
			} catch (e) {
				console.error('加载收藏状态失败:', e);
			}
		},
		
		// 收藏备忘录
		async collectMemo(memo) {
			console.log('=== 收藏备忘录 ===');
			console.log('memo 对象:', JSON.stringify(memo));
			console.log('memo._id:', memo._id);
			console.log('当前收藏状态:', this.collectedMap[memo._id]);
			
			if (!memo || !memo._id) {
				console.error('备忘录对象无效，缺少_id');
				uni.showToast({
					title: '备忘录信息错误',
					icon: 'none',
					duration: 2000
				});
				return;
			}
			
			// 获取用户登录状态
			const userStore = useUserInfoStore();
			const isLogin = userStore.userInfo.isLogin;
			const userId = userStore.userInfo.uid;
			
			// 检查登录状态
			if (!isLogin || !userId) {
				console.log('用户未登录，唤起登录');
				uni.showModal({
					title: '提示',
					content: '收藏功能需要登录，是否前往登录？',
					success: (res) => {
						if (res.confirm) {
							// 获取当前页面路径
							const currentPath = '/pages/memo/memo';
							// 使用 redirectTo 避免页面栈溢出
							uni.redirectTo({
								url: '/pages/login/login?redirect=' + encodeURIComponent(currentPath),
								fail: (err) => {
									console.error('跳转登录页失败:', err);
									// 如果 redirectTo 失败,尝试 reLaunch
									uni.reLaunch({
										url: '/pages/login/login?redirect=' + encodeURIComponent(currentPath)
									});
								}
							});
						}
					}
				});
				return;
			}
			
			try {
				const memoApi = uniCloud.importObject('memoList', { customUI: true });
				
				if (this.collectedMap[memo._id]) {
					// 取消收藏
					console.log('执行取消收藏操作...');
					const res = await memoApi.uncollectMemo(memo._id, userId);
					console.log('取消收藏结果:', res);
					
					if (res && res.code === 0) {
						this.collectedMap[memo._id] = false;
						this.$forceUpdate();
						uni.showToast({
							title: '已取消收藏',
							icon: 'success',
							duration: 1500
						});
					} else {
						uni.showToast({
							title: res?.message || '取消收藏失败',
							icon: 'none'
						});
					}
				} else {
					// 收藏
					console.log('执行收藏操作...');
					console.log('收藏参数:', {
						memo_id: memo._id,
						user_id: userId,
						share_user_id: this.shareUserId,
						share_user_nickname: this.shareUserNickname
					});
					
					const res = await memoApi.collectMemo({
						memo_id: memo._id,
						user_id: userId,
						share_user_id: this.shareUserId,
						share_user_nickname: this.shareUserNickname
					});
					
					console.log('收藏结果:', res);
					
					if (res && res.code === 0) {
						this.collectedMap[memo._id] = true;
						this.$forceUpdate();
						uni.showToast({
							title: '收藏成功',
							icon: 'success',
							duration: 1500
						});
					} else {
						uni.showToast({
							title: res?.message || '收藏失败',
							icon: 'none',
							duration: 2000
						});
					}
				}
			} catch (e) {
				console.error('收藏操作失败:', e);
				console.error('错误堆栈:', e.stack);
				// 显示更详细的错误信息
				const errorMsg = e.message || e.errMsg || '操作失败，请重试';
				uni.showToast({
					title: errorMsg,
					icon: 'none',
					duration: 2000
				});
			}
		},
		
		// 加载备忘录
		loadMemos() {
			console.log('=== 开始加载备忘录 ===');
			try {
				const data = uni.getStorageSync('memo_list');
				console.log('从存储读取的数据:', data);
				if (data) {
					this.memos = JSON.parse(data);
					console.log('解析后的备忘录列表:', this.memos.length, '条');
				} else {
					console.log('存储中没有数据');
				}
			} catch (e) {
				console.error('加载备忘录失败:', e);
				this.memos = [];
			}
		},
		
		// 保存到本地存储
		saveMemos() {
			console.log('=== 开始保存备忘录 ===');
			console.log('准备保存的备忘录数量:', this.memos.length);
			try {
				uni.setStorageSync('memo_list', JSON.stringify(this.memos));
				console.log('保存成功');
			} catch (e) {
				console.error('保存备忘录失败:', e);
				uni.showToast({
					title: '保存失败',
					icon: 'none'
				});
			}
		},
		
		// 切换标签页
		switchTab(value) {
			console.log('=== 切换标签页 ===', value);
			this.activeTab = value;
		},
		
		// 打开添加对话框
		openAddDialog() {
			console.log('=== 打开添加对话框 ===');
			console.log('当前 showAddDialog:', this.showAddDialog);
			console.log('当前 formData:', JSON.stringify(this.formData));
			this.showAddDialog = true;
			console.log('设置 showAddDialog = true');
			// 延迟设置焦点，确保弹窗已经渲染
			setTimeout(() => {
				console.log('延迟后设置 contentFocus = true');
				this.contentFocus = true;
			}, 500);
		},
		
		// 切换完成状态
		toggleComplete(id) {
			console.log('=== 切换完成状态 ===', id);
			try {
				const memo = this.memos.find(m => m.id === id);
				if (memo) {
					console.log('找到备忘录, 当前状态:', memo.is_completed);
					memo.is_completed = !memo.is_completed;
					console.log('切换后状态:', memo.is_completed);
					this.saveMemos();
					uni.showToast({
						title: memo.is_completed ? '已标记完成' : '已标记未完成',
						icon: 'success',
						duration: 1500
					});
				} else {
					console.log('未找到备忘录');
				}
			} catch (e) {
				console.error('切换状态失败:', e);
			}
		},
		
		// 编辑备忘录
		editMemo(memo) {
			console.log('=== 编辑备忘录 ===');
			console.log('备忘录数据:', JSON.stringify(memo));
			this.isEdit = true;
			this.formData = { ...memo };
			console.log('设置 isEdit = true, formData =', JSON.stringify(this.formData));
			this.showAddDialog = true;
			// 编辑时自动聚焦到内容
			setTimeout(() => {
				console.log('延迟后设置 contentFocus = true (编辑模式)');
				this.contentFocus = true;
			}, 500);
		},
		
		// 删除备忘录
		deleteMemo(id) {
			console.log('=== 删除备忘录 ===', id);
			uni.showModal({
				title: '确认删除',
				content: '确定要删除这条备忘录吗？',
				success: (res) => {
					if (res.confirm) {
						console.log('用户确认删除');
						const beforeCount = this.memos.length;
						this.memos = this.memos.filter(m => m.id !== id);
						console.log('删除前数量:', beforeCount, '删除后数量:', this.memos.length);
						this.saveMemos();
						uni.showToast({
							title: '删除成功',
							icon: 'success',
							duration: 1500
						});
					} else {
						console.log('用户取消删除');
					}
				}
			});
		},
		
		// 保存备忘录
		saveMemo() {
			console.log('=== 保存备忘录 ===');
			console.log('isEdit:', this.isEdit);
			console.log('formData:', JSON.stringify(this.formData));
			
			// 验证
			if (!this.formData.content.trim()) {
				console.log('验证失败: 内容为空');
				uni.showToast({
					title: '请输入内容',
					icon: 'none'
				});
				return;
			}
			
			console.log('验证通过');
			
			if (this.isEdit) {
				// 编辑模式
				console.log('编辑模式 - 查找备忘录 id:', this.formData.id);
				const index = this.memos.findIndex(m => m.id === this.formData.id);
				console.log('找到索引:', index);
				if (index !== -1) {
					this.memos[index] = { ...this.formData };
					console.log('更新备忘录成功');
				}
			} else {
				// 新增模式
				console.log('新增模式');
				const newMemo = {
					...this.formData,
					id: Date.now().toString(),
					create_time: Date.now(),
					is_completed: false
				};
				console.log('新建备忘录:', JSON.stringify(newMemo));
				this.memos.unshift(newMemo);
				console.log('添加到列表成功, 当前总数:', this.memos.length);
			}
			
			this.saveMemos();
			this.closeDialog();
			
			uni.showToast({
				title: this.isEdit ? '修改成功' : '添加成功',
				icon: 'success',
				duration: 1500
			});
		},
		
		// 关闭弹窗
		closeDialog() {
			console.log('=== 关闭弹窗 ===');
			console.log('当前 showAddDialog:', this.showAddDialog);
			this.showAddDialog = false;
			this.isEdit = false;
			// 重置焦点状态
			this.contentFocus = false;
			console.log('重置焦点状态');
			// 重置表单
			this.formData = {
				id: '',
				content: '',
				category: '其他',
				priority: '中',
				is_completed: false,
				create_time: 0
			};
			console.log('表单已重置');
		},
		
		// 处理遮罩层点击
		handleMaskClick() {
			console.log('=== 点击遮罩层 ===');
			// 不关闭弹窗，避免误操作
		},

		
		// 选择分类
		selectCategory(cat) {
			console.log('=== 选择分类 ===', cat);
			this.formData.category = cat;
		},
		
		// 选择优先级
		selectPriority(pri) {
			console.log('=== 选择优先级 ===', pri);
			this.formData.priority = pri;
		},
		
		// 内容输入事件
		handleContentInput(e) {
			console.log('=== 内容输入 ===', '长度:', e.detail.value.length);
			console.log('输入内容:', e.detail.value);
			this.formData.content = e.detail.value;
			this.$forceUpdate(); // 强制更新视图
		},
		
		// 内容获取焦点
		handleContentFocus(e) {
			console.log('=== 内容获取焦点 ===');
			this.contentFocus = true;
		},
		
		// 内容失去焦点
		handleContentBlur(e) {
			console.log('=== 内容失去焦点 ===');
			this.contentFocus = false;
		},
		
		// 内容确认
		handleContentConfirm(e) {
			console.log('=== 内容确认 ===');
			this.formData.content = e.detail.value;
		},
		
		// 获取第一行内容作为标题
		getFirstLine(content) {
			if (!content) return '无标题';
			const firstLine = content.split('\n')[0];
			return firstLine.length > 20 ? firstLine.substring(0, 20) + '...' : firstLine;
		},
		
		// 格式化时间
		formatTime(timestamp) {
			if (!timestamp) return '';
			const date = new Date(timestamp);
			const now = new Date();
			const diff = now - date;
			
			if (diff < 60000) {
				return '刚刚';
			} else if (diff < 3600000) {
				return Math.floor(diff / 60000) + '分钟前';
			} else if (diff < 86400000) {
				return Math.floor(diff / 3600000) + '小时前';
			} else if (diff < 172800000) {
				return '昨天';
			} else {
				return `${date.getMonth() + 1}-${date.getDate()}`;
			}
		},
		
		// 跳转到系统推荐页面
		goToRecommendList() {
			console.log('=== 跳转到系统推荐页面 ===');
			uni.navigateTo({
				url: '/subPages/recommendMemoList/recommendMemoList',
				fail: (err) => {
					console.error('跳转失败:', err);
					uni.showToast({
						title: '跳转失败',
						icon: 'none'
					});
				}
			});
		}
	}
};
</script>

<style lang="scss" scoped>
.memo-container {
	width: 100%;
	height: 100vh;
	background: #f5f5f5;
	display: flex;
	flex-direction: column;
}

/* 分类标签页 */
.category-tabs {
	background: #fff;
	display: flex;
	padding: 20rpx 24rpx;
	box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
	
	.tab-item {
		flex: 1;
		text-align: center;
		padding: 16rpx 0;
		font-size: 28rpx;
		color: #666;
		position: relative;
		transition: all 0.3s;
		
		&.active {
			color: #399bfe;
			font-weight: bold;
			
			&::after {
				content: '';
				position: absolute;
				bottom: 0;
				left: 50%;
				transform: translateX(-50%);
				width: 40rpx;
				height: 4rpx;
				background: #399bfe;
				border-radius: 2rpx;
			}
		}
	}
}

/* 系统推荐入口 */
.recommend-entry {
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	margin: 24rpx 24rpx 0;
	border-radius: 16rpx;
	padding: 24rpx 32rpx;
	display: flex;
	align-items: center;
	justify-content: space-between;
	box-shadow: 0 6rpx 20rpx rgba(102, 126, 234, 0.3);
	transition: all 0.3s;
	
	&:active {
		transform: scale(0.98);
		opacity: 0.9;
	}
	
	.entry-left {
		display: flex;
		align-items: center;
		gap: 16rpx;
		
		.entry-icon {
			font-size: 40rpx;
		}
		
		.entry-text {
			font-size: 30rpx;
			color: #fff;
			font-weight: bold;
		}
	}
	
	.entry-right {
		display: flex;
		align-items: center;
		gap: 8rpx;
		
		.entry-hint {
			font-size: 26rpx;
			color: rgba(255, 255, 255, 0.9);
		}
		
		.entry-arrow {
			font-size: 40rpx;
			color: #fff;
			font-weight: bold;
		}
	}
}

/* 默认备忘录区域 */
.default-memo-section {
	background: #fff;
	margin: 24rpx;
	border-radius: 16rpx;
	padding: 24rpx;
	box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.06);
	
	.section-header {
		margin-bottom: 20rpx;
		padding-bottom: 16rpx;
		border-bottom: 2rpx solid #f0f0f0;
		
		.section-title {
			font-size: 32rpx;
			font-weight: bold;
			color: #333;
			position: relative;
			padding-left: 20rpx;
			
			&::before {
				content: '';
				position: absolute;
				left: 0;
				top: 50%;
				transform: translateY(-50%);
				width: 8rpx;
				height: 28rpx;
				background: #399bfe;
				border-radius: 4rpx;
			}
		}
	}
	
	.default-memo-list {
		.default-memo-item {
			display: flex;
			align-items: center;
			gap: 24rpx;
			padding: 20rpx 0;
			border-bottom: 1rpx solid #f5f5f5;
			
			&:last-child {
				border-bottom: none;
			}
			
			// 左侧图片
			.memo-image-container {
				flex-shrink: 0;
				width: 120rpx;
				height: 120rpx;
				border-radius: 12rpx;
				overflow: hidden;
				
				.memo-image {
					width: 100%;
					height: 100%;
				}
				
				.memo-image-placeholder {
					width: 100%;
					height: 100%;
					background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
					display: flex;
					align-items: center;
					justify-content: center;
					
					.placeholder-icon {
						font-size: 60rpx;
					}
				}
			}
			
			// 中间文字
			.memo-text-container {
				flex: 1;
				display: flex;
				flex-direction: column;
				gap: 8rpx;
				min-width: 0;
				
				.memo-item-title {
					font-size: 30rpx;
					font-weight: bold;
					color: #333;
					overflow: hidden;
					text-overflow: ellipsis;
					white-space: nowrap;
				}
				
				.memo-item-content {
					font-size: 26rpx;
					color: #666;
					line-height: 1.6;
					display: -webkit-box;
					-webkit-box-orient: vertical;
					-webkit-line-clamp: 2;
					overflow: hidden;
					text-overflow: ellipsis;
				}
			}
			
			// 右侧收藏按钮
			.memo-collect-btn {
				flex-shrink: 0;
				width: 80rpx;
				height: 80rpx;
				display: flex;
				align-items: center;
				justify-content: center;
				background: #f5f5f5;
				border-radius: 50%;
				transition: all 0.3s;
				
				&:active {
					transform: scale(0.9);
				}
				
				.collect-icon {
					font-size: 48rpx;
					color: #999;
					transition: all 0.3s;
					
					&.collected {
						color: #ff5a5f;
					}
				}
			}
		}
	}
}

/* 备忘录列表 */
.memo-list {
	flex: 1;
	padding: 24rpx;
}

.empty-state {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 120rpx 0;
	
	.empty-icon {
		font-size: 120rpx;
		margin-bottom: 24rpx;
	}
	
	.empty-text {
		font-size: 28rpx;
		color: #999;
	}
}

.memo-items {
	padding-bottom: 160rpx;
}

/* 备忘录卡片 - 符合用户视觉层次要求 */
.memo-card {
	background: #fff;
	border-radius: 16rpx;
	padding: 24rpx;
	margin-bottom: 24rpx;
	box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.06);
	transition: all 0.3s;
	
	&.completed {
		opacity: 0.7;
		background: #f9f9f9;
	}
	
	.card-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 16rpx;
		
		.header-left {
			display: flex;
			align-items: center;
			flex: 1;
			
			.checkbox {
				width: 40rpx;
				height: 40rpx;
				border: 2rpx solid #ddd;
				border-radius: 50%;
				display: flex;
				align-items: center;
				justify-content: center;
				margin-right: 16rpx;
				transition: all 0.3s;
				
				&.checked {
					background: #399bfe;
					border-color: #399bfe;
					
					.check-icon {
						color: #fff;
						font-size: 24rpx;
						font-weight: bold;
					}
				}
			}
			
			.memo-title {
				font-size: 32rpx;
				font-weight: bold;
				color: #333;
				flex: 1;
				
				&.completed {
					text-decoration: line-through;
					color: #999;
				}
			}
		}
		
		.priority-badge {
			padding: 8rpx 16rpx;
			border-radius: 8rpx;
			font-size: 24rpx;
			
			&.priority-低 {
				background: #e8f5e9;
				color: #4caf50;
			}
			
			&.priority-中 {
				background: #fff3e0;
				color: #ff9800;
			}
			
			&.priority-高 {
				background: #ffebee;
				color: #f44336;
			}
		}
	}
	
	.card-content {
		padding-left: 56rpx;
		margin-bottom: 16rpx;
		
		.memo-content {
			font-size: 28rpx;
			color: #666;
			line-height: 1.6;
		}
	}
	
	.card-footer {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding-left: 56rpx;
		padding-top: 16rpx;
		border-top: 1rpx solid #f0f0f0;
		
		.footer-left {
			display: flex;
			align-items: center;
			gap: 16rpx;
			
			.category-tag {
				padding: 4rpx 12rpx;
				background: #f0f0f0;
				border-radius: 6rpx;
				font-size: 24rpx;
				color: #666;
			}
			
			.time-text {
				font-size: 24rpx;
				color: #999;
			}
		}
		
		.action-buttons {
			display: flex;
			gap: 16rpx;
			
			.action-btn {
				padding: 8rpx 20rpx;
				border-radius: 8rpx;
				font-size: 24rpx;
				transition: all 0.3s;
				
				&.complete-btn {
					background: #e8f5e9;
					color: #4caf50;
					font-weight: bold;
				}
				
				&.completed-btn {
					background: #4caf50;
					color: #fff;
					font-weight: bold;
				}
				
				&.edit-btn {
					background: #e3f2fd;
					color: #399bfe;
				}
				
				&.delete-btn {
					background: #ffebee;
					color: #f44336;
				}
			}
		}
	}
}

/* 底部按钮组 */
.bottom-buttons {
	position: fixed;
	right: 40rpx;
	bottom: 100rpx;
	z-index: 100;
	
	/* 添加按钮 */
	.add-button {
		width: 112rpx;
		height: 112rpx;
		background: linear-gradient(135deg, #399bfe 0%, #2979ff 100%);
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: 0 8rpx 20rpx rgba(57, 155, 254, 0.4);
		transition: all 0.3s;
		
		&:active {
			transform: scale(0.95);
			opacity: 0.8;
		}
		
		.add-icon {
			color: #fff;
			font-size: 64rpx;
			font-weight: 300;
		}
	}
}

/* 弹窗 */
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
			
			.form-label {
				display: block;
				font-size: 28rpx;
				color: #333;
				margin-bottom: 12rpx;
				font-weight: bold;
			}
			
			.form-textarea {
				width: 100%;
				height: 300rpx;
				min-height: 300rpx;
				max-height: 400rpx;
				padding: 16rpx;
				border: 1rpx solid #ddd;
				border-radius: 8rpx;
				font-size: 28rpx;
				box-sizing: border-box;
				background-color: #fff;
				color: #333;
				line-height: 1.6;
			}
			
			.char-count {
				margin-top: 8rpx;
				text-align: right;
				font-size: 24rpx;
				color: #999;
			}
			
			.radio-group {
				display: flex;
				gap: 16rpx;
				flex-wrap: wrap;
				
				.radio-item {
					padding: 12rpx 24rpx;
					border: 2rpx solid #ddd;
					border-radius: 8rpx;
					font-size: 26rpx;
					color: #666;
					transition: all 0.3s;
					
					&.active {
						background: #399bfe;
						border-color: #399bfe;
						color: #fff;
					}
					
					&.priority-item.priority-低.active {
						background: #4caf50;
						border-color: #4caf50;
					}
					
					&.priority-item.priority-高.active {
						background: #f44336;
						border-color: #f44336;
					}
				}
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
				color: #399bfe;
				font-weight: bold;
			}
		}
	}
}
</style>
