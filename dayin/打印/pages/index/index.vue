<template>
	<view class="container">
		<!-- 头部 -->
		<view class="header">
			<image class="logo" src="/static/logo.png" mode="aspectFit"></image>
			<text class="title">链科云打印</text>
			<text class="subtitle">随时随地，轻松打印</text>
		</view>
		
		<!-- 当前打印机 -->
		<view class="printer-card" @click="goPrinterList">
			<view class="card-header">
				<text class="card-title">当前打印机</text>
				<text class="more">更多 ></text>
			</view>
			<view class="printer-info" v-if="currentPrinter">
				<view class="printer-name">{{ currentPrinter.name }}</view>
				<view class="printer-status" :class="currentPrinter.status === 'online' ? 'online' : 'offline'">
					{{ currentPrinter.status === 'online' ? '在线' : '离线' }}
				</view>
			</view>
			<view class="empty-tip" v-else>
				<text>暂无打印机，点击添加</text>
			</view>
		</view>
		
		<!-- 快捷功能 -->
		<view class="quick-actions">
			<view class="action-item" @click="goPage('/pages/print/print?type=text')">
				<view class="action-icon">📄</view>
				<text class="action-text">文本打印</text>
			</view>
			<view class="action-item" @click="goPage('/pages/print/print?type=image')">
				<view class="action-icon">🖼️</view>
				<text class="action-text">图片打印</text>
			</view>
			<view class="action-item" @click="goPage('/pages/print/print?type=document')">
				<view class="action-icon">📋</view>
				<text class="action-text">文档打印</text>
			</view>
			<view class="action-item" @click="goPage('/pages/print/print?type=label')">
				<view class="action-icon">🏷️</view>
				<text class="action-text">标签打印</text>
			</view>
		</view>
		
		<!-- 统计信息 -->
		<view class="stats-card">
			<view class="stat-item">
				<text class="stat-value">{{ stats.totalPrints }}</text>
				<text class="stat-label">总打印次数</text>
			</view>
			<view class="stat-item">
				<text class="stat-value">{{ stats.todayPrints }}</text>
				<text class="stat-label">今日打印</text>
			</view>
			<view class="stat-item">
				<text class="stat-value">{{ stats.successRate }}%</text>
				<text class="stat-label">成功率</text>
			</view>
		</view>
		
		<!-- 最近打印 -->
		<view class="recent-section">
			<view class="section-header">
				<text class="section-title">最近打印</text>
				<text class="more" @click="goPage('/pages/history/history')">查看全部 ></text>
			</view>
			<view class="recent-list">
				<view class="recent-item" v-for="(item, index) in recentPrints" :key="index">
					<view class="item-left">
						<text class="item-type">{{ item.typeName }}</text>
						<text class="item-time">{{ item.time }}</text>
					</view>
					<view class="item-status" :class="item.status">
						{{ item.statusText }}
					</view>
				</view>
				<view class="empty-tip" v-if="recentPrints.length === 0">
					<text>暂无打印记录</text>
				</view>
			</view>
		</view>
		
		<!-- 测试按钮 -->
		<view class="test-section" v-if="currentPrinter">
			<button class="connection-test-btn" @click="goConnectionTest">🔌 连接测试</button>
			<button class="test-btn" @click="testPrint">🖨️ 快速打印</button>
		</view>
	</view>
</template>

<script>
	import printApi from '@/utils/printApi.js';
	
	export default {
		data() {
			return {
				currentPrinter: null,
				stats: {
					totalPrints: 0,
					todayPrints: 0,
					successRate: 0
				},
				recentPrints: []
			}
		},
		onLoad() {
			this.loadData();
			// 检查是否需要自动添加默认设备
			this.checkAndAddDefaultDevice();
		},
		onShow() {
			// 每次显示时刷新数据
			this.loadCurrentPrinter();
		},
		methods: {
			// 加载数据
			loadData() {
				this.loadCurrentPrinter();
				this.loadStats();
				this.loadRecentPrints();
			},
			
			// 加载当前打印机
			loadCurrentPrinter() {
				const printer = uni.getStorageSync('selectedPrinter');
				if (printer) {
					// 确保状态为在线
					if (!printer.status) {
						printer.status = 'online';
					}
					this.currentPrinter = printer;
				}
			},
			
			// 加载统计数据
			loadStats() {
				const history = uni.getStorageSync('printHistory') || [];
				const today = new Date().toDateString();
				
				this.stats.totalPrints = history.length;
				this.stats.todayPrints = history.filter(item => {
					return new Date(item.time).toDateString() === today;
				}).length;
				
				const successCount = history.filter(item => item.status === 'success').length;
				this.stats.successRate = history.length > 0 ? 
					Math.round(successCount / history.length * 100) : 0;
			},
			
			// 加载最近打印记录
			loadRecentPrints() {
				const history = uni.getStorageSync('printHistory') || [];
				this.recentPrints = history.slice(0, 5).map(item => ({
					...item,
					typeName: this.getTypeName(item.type),
					statusText: this.getStatusText(item.status)
				}));
			},
			
			// 获取类型名称
			getTypeName(type) {
				const typeMap = {
					text: '文本打印',
					image: '图片打印',
					document: '文档打印',
					label: '标签打印'
				};
				return typeMap[type] || '未知';
			},
			
			// 获取状态文本
			getStatusText(status) {
				const statusMap = {
					success: '成功',
					failed: '失败',
					pending: '进行中'
				};
				return statusMap[status] || '未知';
			},
			
			// 跳转页面
			goPage(url) {
				uni.navigateTo({ url });
			},
			
			// 跳转打印机列表
			goPrinterList() {
				uni.navigateTo({
					url: '/pages/printer/printer'
				});
			},
			
		// 检查并添加默认设备
		async checkAndAddDefaultDevice() {
			const printers = uni.getStorageSync('printers') || [];
			
			// 如果没有打印机，自动添加默认设备
			if (printers.length === 0) {
				const defaultDevice = printApi.getDefaultDevice();
				
				const printer = {
					id: defaultDevice.id,
					name: '测试云盒 - ' + defaultDevice.name,
					model: defaultDevice.model,
					password: defaultDevice.password,
					driverName: defaultDevice.driverName,
					status: 'online'
				};
				
				printers.push(printer);
				uni.setStorageSync('printers', printers);
				uni.setStorageSync('selectedPrinter', printer);
				
				this.currentPrinter = printer;
				
				uni.showToast({
					title: '已自动添加测试云盒',
					icon: 'success',
					duration: 2000
				});
			}
		},
			
			// 跳转连接测试页面
			goConnectionTest() {
				uni.navigateTo({
					url: '/pages/test/test'
				});
			},
			
		// 测试打印
		async testPrint() {
			if (!this.currentPrinter) {
				uni.showToast({
					title: '请先添加打印机',
					icon: 'none'
				});
				return;
			}
			
			// 先测试external_api连接
			uni.showLoading({
				title: '测试连接...'
			});
			
			try {
				console.log('🧪 测试external_api连接...');
				
				// 测试获取打印机列表
				const printerListResult = await printApi.getDevicePrinterList(
					this.currentPrinter.id,
					this.currentPrinter.password
				);
				
				console.log('✅ external_api可用！打印机列表:', printerListResult);
				
				uni.hideLoading();
				
				// 显示测试结果
				let printerNames = '';
				if (printerListResult.data && Array.isArray(printerListResult.data) && printerListResult.data.length > 0) {
					printerNames = '\n\n可用打印机:\n' + printerListResult.data.map(p => `- ${p.name || p.printerName}`).join('\n');
				}
				
				uni.showModal({
					title: '✅ 连接测试成功',
					content: `设备连接正常！${printerNames}\n\n提示：V3 API暂时不可用(503错误)，建议联系技术支持开通V3权限或使用旧版API。`,
					confirmText: '继续测试V3',
					cancelText: '关闭',
					success: async (modalRes) => {
						if (modalRes.confirm) {
							// 用户选择继续测试V3 API
							this.testV3Print();
						}
					}
				});
				
			} catch (error) {
				uni.hideLoading();
				console.error('❌ external_api测试失败:', error);
				
				uni.showModal({
					title: '❌ 连接测试失败',
					content: `无法连接到打印服务\n\n错误: ${error.message || error.msg || '网络请求失败'}\n\n请检查:\n1. 设备ID和密码是否正确\n2. 网络连接是否正常\n3. 链科云服务是否可用`,
					showCancel: false
				});
			}
		},
		
		// 测试V3 API打印
		async testV3Print() {
			uni.showLoading({
				title: '正在打印...'
			});
			
			try {
				// 使用V3 API提交打印任务
				// 使用测试PDF文件（公开可访问）
				const result = await printApi.submitPrintTask({
					deviceId: this.currentPrinter.id,
					devicePassword: this.currentPrinter.password,
					printerName: this.currentPrinter.model || this.currentPrinter.name,
					driverName: this.currentPrinter.driverName || this.currentPrinter.model,
					jobFileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
					dmPaperSize: 9, // A4
					dmOrientation: 1, // 竖向
					dmColor: 1, // 黑白
					dmDuplex: 1, // 关闭双面
					dmCopies: 1, // 1份
					isPreview: 1 // 生成预览图
				});
				
				// 保存测试记录
				let history = uni.getStorageSync('printHistory') || [];
				history.unshift({
					id: result.data?.task_id || result.data?.jobId || Date.now(),
					type: 'document',
					printer: this.currentPrinter.name,
					time: new Date().toISOString(),
					status: 'pending'
				});
				uni.setStorageSync('printHistory', history);
				
				uni.hideLoading();
				
				// 显示任务ID
				const taskId = result.data?.task_id || result.data?.jobId;
				if (taskId) {
					uni.showModal({
						title: '✅ 测试打印已提交',
						content: `任务ID: ${taskId}\n\n可在历史记录或测试页面查询任务状态`,
						confirmText: '去测试页面',
						cancelText: '关闭',
						success: (modalRes) => {
							if (modalRes.confirm) {
								uni.navigateTo({
									url: '/pages/test/test'
								});
							}
						}
					});
				} else {
					uni.showToast({
						title: '测试打印成功',
						icon: 'success'
					});
				}
				
				// 刷新数据
				this.loadStats();
				this.loadRecentPrints();
				
			} catch (error) {
				uni.hideLoading();
				console.error('❌ V3 API测试打印失败:', error);
				
				// 检查是否是503错误
				const is503 = error.message && error.message.includes('503');
				
				uni.showModal({
					title: '❌ V3 API不可用',
					content: is503 
						? 'V3 API返回503错误，服务暂时不可用。\n\n建议:\n1. 联系技术支持确认V3权限\n2. 暂时使用管理后台打印\n\n要打开管理后台吗？'
						: `错误: ${error.message || error.msg || '未知错误'}\n\n请联系技术支持`,
					confirmText: '打开后台',
					cancelText: '关闭',
					success: (modalRes) => {
						if (modalRes.confirm) {
							// 打开管理后台
							const url = printApi.getPrintManageUrl();
							console.log('管理后台URL:', url);
							// 在小程序中无法直接打开外部链接，提示用户
							uni.showModal({
								title: '管理后台地址',
								content: url,
								confirmText: '复制',
								success: (res) => {
									if (res.confirm) {
										uni.setClipboardData({
											data: url,
											success: () => {
												uni.showToast({
													title: '已复制到剪贴板',
													icon: 'success'
												});
											}
										});
									}
								}
							});
						}
					}
				});
			}
		}
		}
	}
</script>

<style scoped>
	.container {
		min-height: 100vh;
		background-color: #f5f5f5;
		padding: 20rpx;
	}
	
	/* 头部 */
	.header {
		background: linear-gradient(135deg, #1890ff 0%, #0066cc 100%);
		border-radius: 20rpx;
		padding: 60rpx 40rpx;
		text-align: center;
		margin-bottom: 20rpx;
	}
	
	.logo {
		width: 120rpx;
		height: 120rpx;
		margin-bottom: 20rpx;
	}
	
	.title {
		display: block;
		font-size: 48rpx;
		font-weight: bold;
		color: #ffffff;
		margin-bottom: 10rpx;
	}
	
	.subtitle {
		display: block;
		font-size: 28rpx;
		color: rgba(255, 255, 255, 0.8);
	}
	
	/* 打印机卡片 */
	.printer-card {
		background-color: #ffffff;
		border-radius: 20rpx;
		padding: 30rpx;
		margin-bottom: 20rpx;
	}
	
	.card-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 20rpx;
	}
	
	.card-title {
		font-size: 32rpx;
		font-weight: bold;
		color: #333333;
	}
	
	.more {
		font-size: 28rpx;
		color: #1890ff;
	}
	
	.printer-info {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 20rpx;
		background-color: #f5f5f5;
		border-radius: 12rpx;
	}
	
	.printer-name {
		font-size: 30rpx;
		color: #333333;
	}
	
	.printer-status {
		font-size: 26rpx;
		padding: 8rpx 20rpx;
		border-radius: 20rpx;
	}
	
	.printer-status.online {
		background-color: #e6f7ff;
		color: #1890ff;
	}
	
	.printer-status.offline {
		background-color: #fff1f0;
		color: #ff4d4f;
	}
	
	/* 快捷功能 */
	.quick-actions {
		display: flex;
		justify-content: space-between;
		margin-bottom: 20rpx;
	}
	
	.action-item {
		flex: 1;
		background-color: #ffffff;
		border-radius: 20rpx;
		padding: 30rpx 20rpx;
		margin: 0 10rpx;
		text-align: center;
	}
	
	.action-item:first-child {
		margin-left: 0;
	}
	
	.action-item:last-child {
		margin-right: 0;
	}
	
	.action-icon {
		font-size: 60rpx;
		margin-bottom: 15rpx;
	}
	
	.action-text {
		display: block;
		font-size: 26rpx;
		color: #666666;
	}
	
	/* 统计卡片 */
	.stats-card {
		background-color: #ffffff;
		border-radius: 20rpx;
		padding: 30rpx;
		display: flex;
		justify-content: space-around;
		margin-bottom: 20rpx;
	}
	
	.stat-item {
		text-align: center;
	}
	
	.stat-value {
		display: block;
		font-size: 48rpx;
		font-weight: bold;
		color: #1890ff;
		margin-bottom: 10rpx;
	}
	
	.stat-label {
		font-size: 26rpx;
		color: #999999;
	}
	
	/* 最近打印 */
	.recent-section {
		background-color: #ffffff;
		border-radius: 20rpx;
		padding: 30rpx;
	}
	
	.section-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 20rpx;
	}
	
	.section-title {
		font-size: 32rpx;
		font-weight: bold;
		color: #333333;
	}
	
	.recent-list {
	}
	
	.recent-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 20rpx 0;
		border-bottom: 1px solid #f0f0f0;
	}
	
	.recent-item:last-child {
		border-bottom: none;
	}
	
	.item-left {
		display: flex;
		flex-direction: column;
	}
	
	.item-type {
		font-size: 30rpx;
		color: #333333;
		margin-bottom: 10rpx;
	}
	
	.item-time {
		font-size: 24rpx;
		color: #999999;
	}
	
	.item-status {
		font-size: 26rpx;
		padding: 6rpx 16rpx;
		border-radius: 12rpx;
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
	
	.empty-tip {
		text-align: center;
		padding: 60rpx 0;
		color: #999999;
		font-size: 28rpx;
	}
	
	/* 测试按钮 */
	.test-section {
		margin-top: 20rpx;
		padding: 0 20rpx 40rpx;
		display: flex;
		gap: 20rpx;
	}
	
	.connection-test-btn {
		flex: 1;
		height: 100rpx;
		line-height: 100rpx;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: #ffffff;
		border: none;
		border-radius: 50rpx;
		font-size: 32rpx;
		font-weight: bold;
		box-shadow: 0 8rpx 20rpx rgba(102, 126, 234, 0.4);
	}
	
	.test-btn {
		flex: 1;
		height: 100rpx;
		line-height: 100rpx;
		background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%);
		color: #ffffff;
		border: none;
		border-radius: 50rpx;
		font-size: 32rpx;
		font-weight: bold;
		box-shadow: 0 8rpx 20rpx rgba(255, 107, 107, 0.4);
	}
</style>
