<template>
	<view class="container">
		<!-- 筛选栏 -->
		<view class="filter-bar">
			<picker :range="statusFilters" range-key="label" @change="statusChange">
				<view class="filter-item">
					<text>{{ currentStatus.label }}</text>
					<text class="arrow">▼</text>
				</view>
			</picker>
			
			<picker :range="typeFilters" range-key="label" @change="typeChange">
				<view class="filter-item">
					<text>{{ currentType.label }}</text>
					<text class="arrow">▼</text>
				</view>
			</picker>
		</view>
		
		<!-- 历史列表 -->
		<view class="history-list">
			<view 
				v-for="(item, index) in filteredHistory" 
				:key="index"
				class="history-item"
				@click="showDetail(item)"
			>
				<view class="item-left">
					<view class="item-icon">{{ getTypeIcon(item.type) }}</view>
					<view class="item-info">
						<text class="item-title">{{ getTypeName(item.type) }}</text>
						<text class="item-printer">{{ item.printer }}</text>
						<text class="item-time">{{ formatTime(item.time) }}</text>
					</view>
				</view>
				
				<view class="item-right">
					<view class="item-status" :class="item.status">
						{{ getStatusText(item.status) }}
					</view>
					<text class="arrow">></text>
				</view>
			</view>
			
			<view class="empty-tip" v-if="filteredHistory.length === 0">
				<text>暂无打印记录</text>
			</view>
		</view>
		
		<!-- 加载更多 -->
		<view class="load-more" v-if="hasMore">
			<button class="load-btn" @click="loadMore">加载更多</button>
		</view>
		
		<!-- 详情对话框 -->
		<view class="dialog-mask" v-if="showDetailDialog" @click="closeDetail">
			<view class="dialog" @click.stop>
				<view class="dialog-title">打印详情</view>
				
				<view class="detail-content">
					<view class="detail-item">
						<text class="detail-label">任务ID</text>
						<text class="detail-value">{{ currentDetail.id }}</text>
					</view>
					<view class="detail-item">
						<text class="detail-label">打印类型</text>
						<text class="detail-value">{{ getTypeName(currentDetail.type) }}</text>
					</view>
					<view class="detail-item">
						<text class="detail-label">打印机</text>
						<text class="detail-value">{{ currentDetail.printer }}</text>
					</view>
					<view class="detail-item">
						<text class="detail-label">打印时间</text>
						<text class="detail-value">{{ formatFullTime(currentDetail.time) }}</text>
					</view>
					<view class="detail-item">
						<text class="detail-label">状态</text>
						<text class="detail-value" :class="'status-' + currentDetail.status">
							{{ getStatusText(currentDetail.status) }}
						</text>
					</view>
				</view>
				
				<view class="dialog-footer">
					<button class="close-btn" @click="closeDetail">关闭</button>
					<button class="reprint-btn" @click="reprintJob" v-if="currentDetail.status === 'failed'">
						重新打印
					</button>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
	import printApi from '@/utils/printApi.js';
	
	export default {
		data() {
			return {
				historyList: [],
				filteredHistory: [],
				currentStatus: { label: '全部状态', value: 'all' },
				currentType: { label: '全部类型', value: 'all' },
				statusFilters: [
					{ label: '全部状态', value: 'all' },
					{ label: '成功', value: 'success' },
					{ label: '失败', value: 'failed' },
					{ label: '进行中', value: 'pending' }
				],
				typeFilters: [
					{ label: '全部类型', value: 'all' },
					{ label: '文本打印', value: 'text' },
					{ label: '图片打印', value: 'image' },
					{ label: '文档打印', value: 'document' },
					{ label: '标签打印', value: 'label' }
				],
				currentPage: 1,
				pageSize: 20,
				hasMore: false,
				showDetailDialog: false,
				currentDetail: {}
			}
		},
		
		onLoad() {
			this.loadHistory();
		},
		
		onShow() {
			// 每次显示时刷新历史记录
			this.loadHistory();
		},
		
		methods: {
			// 加载历史记录
			loadHistory() {
				const history = uni.getStorageSync('printHistory') || [];
				this.historyList = history;
				this.filterHistory();
			},
			
			// 筛选历史记录
			filterHistory() {
				let filtered = this.historyList;
				
				// 按状态筛选
				if (this.currentStatus.value !== 'all') {
					filtered = filtered.filter(item => item.status === this.currentStatus.value);
				}
				
				// 按类型筛选
				if (this.currentType.value !== 'all') {
					filtered = filtered.filter(item => item.type === this.currentType.value);
				}
				
				// 分页
				const start = 0;
				const end = this.currentPage * this.pageSize;
				this.filteredHistory = filtered.slice(start, end);
				this.hasMore = filtered.length > end;
			},
			
			// 状态变化
			statusChange(e) {
				this.currentStatus = this.statusFilters[e.detail.value];
				this.currentPage = 1;
				this.filterHistory();
			},
			
			// 类型变化
			typeChange(e) {
				this.currentType = this.typeFilters[e.detail.value];
				this.currentPage = 1;
				this.filterHistory();
			},
			
			// 加载更多
			loadMore() {
				this.currentPage++;
				this.filterHistory();
			},
			
			// 显示详情
			showDetail(item) {
				this.currentDetail = item;
				this.showDetailDialog = true;
			},
			
			// 关闭详情
			closeDetail() {
				this.showDetailDialog = false;
			},
			
			// 重新打印
			reprintJob() {
				uni.showModal({
					title: '提示',
					content: '确定要重新打印吗？',
					success: (res) => {
						if (res.confirm) {
							// 跳转到打印页面，并传递参数
							uni.navigateTo({
								url: '/pages/print/print?type=' + this.currentDetail.type
							});
							this.closeDetail();
						}
					}
				});
			},
			
			// 获取类型图标
			getTypeIcon(type) {
				const iconMap = {
					text: '📄',
					image: '🖼️',
					document: '📋',
					label: '🏷️'
				};
				return iconMap[type] || '📄';
			},
			
			// 获取类型名称
			getTypeName(type) {
				const nameMap = {
					text: '文本打印',
					image: '图片打印',
					document: '文档打印',
					label: '标签打印'
				};
				return nameMap[type] || '未知';
			},
			
			// 获取状态文本
			getStatusText(status) {
				const textMap = {
					success: '成功',
					failed: '失败',
					pending: '进行中'
				};
				return textMap[status] || '未知';
			},
			
			// 格式化时间
			formatTime(time) {
				const date = new Date(time);
				const now = new Date();
				const diff = now - date;
				
				// 小于1分钟
				if (diff < 60000) {
					return '刚刚';
				}
				
				// 小于1小时
				if (diff < 3600000) {
					return Math.floor(diff / 60000) + '分钟前';
				}
				
				// 小于1天
				if (diff < 86400000) {
					return Math.floor(diff / 3600000) + '小时前';
				}
				
				// 小于7天
				if (diff < 604800000) {
					return Math.floor(diff / 86400000) + '天前';
				}
				
				// 超过7天显示具体日期
				const month = date.getMonth() + 1;
				const day = date.getDate();
				return `${month}月${day}日`;
			},
			
			// 格式化完整时间
			formatFullTime(time) {
				const date = new Date(time);
				const year = date.getFullYear();
				const month = String(date.getMonth() + 1).padStart(2, '0');
				const day = String(date.getDate()).padStart(2, '0');
				const hour = String(date.getHours()).padStart(2, '0');
				const minute = String(date.getMinutes()).padStart(2, '0');
				const second = String(date.getSeconds()).padStart(2, '0');
				return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
			}
		}
	}
</script>

<style scoped>
	.container {
		min-height: 100vh;
		background-color: #f5f5f5;
	}
	
	/* 筛选栏 */
	.filter-bar {
		display: flex;
		background-color: #ffffff;
		padding: 20rpx;
		gap: 20rpx;
	}
	
	.filter-item {
		flex: 1;
		padding: 20rpx;
		background-color: #f5f5f5;
		border-radius: 12rpx;
		display: flex;
		justify-content: space-between;
		align-items: center;
		font-size: 28rpx;
		color: #333333;
	}
	
	.arrow {
		font-size: 20rpx;
		color: #999999;
	}
	
	/* 历史列表 */
	.history-list {
		padding: 20rpx;
	}
	
	.history-item {
		background-color: #ffffff;
		border-radius: 20rpx;
		padding: 30rpx;
		margin-bottom: 20rpx;
		display: flex;
		justify-content: space-between;
		align-items: center;
	}
	
	.item-left {
		display: flex;
		align-items: center;
		flex: 1;
	}
	
	.item-icon {
		font-size: 70rpx;
		margin-right: 30rpx;
	}
	
	.item-info {
		display: flex;
		flex-direction: column;
	}
	
	.item-title {
		font-size: 32rpx;
		font-weight: bold;
		color: #333333;
		margin-bottom: 10rpx;
	}
	
	.item-printer {
		font-size: 26rpx;
		color: #666666;
		margin-bottom: 10rpx;
	}
	
	.item-time {
		font-size: 24rpx;
		color: #999999;
	}
	
	.item-right {
		display: flex;
		align-items: center;
	}
	
	.item-status {
		padding: 8rpx 20rpx;
		border-radius: 12rpx;
		font-size: 24rpx;
		margin-right: 20rpx;
	}
	
	.item-status.success {
		background-color: #f6ffed;
		color: #52c41a;
	}
	
	.item-status.failed {
		background-color: #fff1f0;
		color: #ff4d4f;
	}
	
	.item-status.pending {
		background-color: #fff7e6;
		color: #faad14;
	}
	
	/* 加载更多 */
	.load-more {
		padding: 20rpx;
		text-align: center;
	}
	
	.load-btn {
		width: 400rpx;
		height: 70rpx;
		line-height: 70rpx;
		background-color: #ffffff;
		border: 1px solid #d9d9d9;
		border-radius: 12rpx;
		font-size: 28rpx;
		color: #666666;
	}
	
	/* 对话框 */
	.dialog-mask {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-color: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 9999;
	}
	
	.dialog {
		width: 640rpx;
		background-color: #ffffff;
		border-radius: 20rpx;
		overflow: hidden;
	}
	
	.dialog-title {
		font-size: 36rpx;
		font-weight: bold;
		color: #333333;
		padding: 40rpx 30rpx 20rpx;
		text-align: center;
	}
	
	.detail-content {
		padding: 20rpx 30rpx 40rpx;
	}
	
	.detail-item {
		display: flex;
		justify-content: space-between;
		padding: 20rpx 0;
		border-bottom: 1px solid #f0f0f0;
	}
	
	.detail-item:last-child {
		border-bottom: none;
	}
	
	.detail-label {
		font-size: 28rpx;
		color: #999999;
	}
	
	.detail-value {
		font-size: 28rpx;
		color: #333333;
		text-align: right;
		max-width: 400rpx;
		word-break: break-all;
	}
	
	.status-success {
		color: #52c41a !important;
	}
	
	.status-failed {
		color: #ff4d4f !important;
	}
	
	.status-pending {
		color: #faad14 !important;
	}
	
	.dialog-footer {
		display: flex;
		border-top: 1px solid #f0f0f0;
	}
	
	.close-btn,
	.reprint-btn {
		flex: 1;
		height: 100rpx;
		line-height: 100rpx;
		border: none;
		font-size: 32rpx;
		background-color: #ffffff;
	}
	
	.close-btn {
		color: #666666;
	}
	
	.reprint-btn {
		color: #1890ff;
		border-left: 1px solid #f0f0f0;
	}
	
	.empty-tip {
		text-align: center;
		padding: 120rpx 0;
		color: #999999;
		font-size: 28rpx;
	}
</style>
