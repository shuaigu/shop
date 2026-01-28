<template>
	<view class="container">
		<!-- 打印机列表 -->
		<view class="printer-list">
			<view 
				v-for="(printer, index) in printerList" 
				:key="index"
				class="printer-item"
				:class="{'selected': selectedPrinter && selectedPrinter.id === printer.id}"
				@click="selectPrinter(printer)"
			>
				<view class="printer-main">
					<view class="printer-icon">🖨️</view>
					<view class="printer-info">
						<text class="printer-name">{{ printer.name }}</text>
						<text class="printer-model">{{ printer.model }}</text>
					</view>
				</view>
				<view class="printer-status" :class="printer.status">
					<view class="status-dot"></view>
					<text>{{ printer.status === 'online' ? '在线' : '离线' }}</text>
				</view>
			</view>
			
			<view class="empty-tip" v-if="printerList.length === 0">
				<text>暂无打印机</text>
				<text class="sub-tip">点击下方按钮添加打印机</text>
			</view>
		</view>
		
		<!-- 添加打印机按钮 -->
		<view class="add-section">
			<button class="add-btn" @click="showAddDialog">+ 添加打印机</button>
		</view>
		
		<!-- 添加打印机对话框 -->
		<view class="dialog-mask" v-if="showDialog" @click="closeDialog">
			<view class="dialog" @click.stop>
				<view class="dialog-title">添加打印机</view>
				
				<view class="quick-fill-section">
					<button class="quick-fill-btn" @click="quickFillDevice">
						⚡ 快速填充测试设备
					</button>
				</view>
				
				<view class="dialog-content">
					<view class="form-item">
						<text class="label">打印机名称</text>
						<input 
							v-model="newPrinter.name" 
							class="input"
							placeholder="请输入打印机名称"
						/>
					</view>
					
					<view class="form-item">
						<text class="label">打印机型号</text>
						<input 
							v-model="newPrinter.model" 
							class="input"
							placeholder="请输入打印机型号"
						/>
					</view>
					
					<view class="form-item">
						<text class="label">打印机ID</text>
						<view class="scan-row">
							<input 
								v-model="newPrinter.id" 
								class="input flex-input"
								placeholder="请扫描或输入打印机ID"
							/>
							<button class="scan-btn" @click="scanCode">扫码</button>
						</view>
					</view>
					
				<view class="form-item">
					<text class="label">打印机密钥</text>
					<input 
						v-model="newPrinter.password" 
						class="input"
						placeholder="请输入打印机密钥"
					/>
				</view>
				
				<view class="form-item">
					<text class="label">驱动名称</text>
					<input 
						v-model="newPrinter.driverName" 
						class="input"
						placeholder="请输入驱动名称（可选）"
					/>
				</view>
				</view>
				
				<view class="dialog-footer">
					<button class="cancel-btn" @click="closeDialog">取消</button>
					<button class="confirm-btn" @click="addPrinter">确定</button>
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
				printerList: [],
				selectedPrinter: null,
				showDialog: false,
			newPrinter: {
				name: '',
				model: '',
				id: '',
				password: '',
				driverName: ''
			}
			}
		},
		
		onLoad() {
			this.loadPrinters();
		},
		
		onShow() {
			// 每次显示时刷新打印机列表
			this.loadPrinters();
		},
		
		methods: {
			// 加载打印机列表
			loadPrinters() {
				// 从本地存储加载
				const printers = uni.getStorageSync('printers') || [];
				this.printerList = printers;
				
				// 加载当前选中的打印机
				this.selectedPrinter = uni.getStorageSync('selectedPrinter');
				
				// 刷新打印机状态
				this.refreshPrinterStatus();
			},
			
			// 刷新打印机状态
			async refreshPrinterStatus() {
				for (let printer of this.printerList) {
					try {
						// 调用API获取打印机状态
						const result = await printApi.getPrinterStatus(printer.id);
						printer.status = result.data.status;
					} catch (error) {
						// API调用失败，默认设置为在线（因为后台显示在线）
						printer.status = 'online';
					}
				}
				
				// 保存更新后的打印机列表
				uni.setStorageSync('printers', this.printerList);
				
				// 更新当前选中的打印机状态
				if (this.selectedPrinter) {
					const currentPrinter = this.printerList.find(p => p.id === this.selectedPrinter.id);
					if (currentPrinter) {
						this.selectedPrinter.status = currentPrinter.status;
						uni.setStorageSync('selectedPrinter', this.selectedPrinter);
					}
				}
			},
			
			// 选择打印机
			selectPrinter(printer) {
				this.selectedPrinter = printer;
				uni.setStorageSync('selectedPrinter', printer);
				
				uni.showToast({
					title: '已选择：' + printer.name,
					icon: 'success'
				});
			},
			
			// 显示添加对话框
			showAddDialog() {
				this.showDialog = true;
			},
			
		// 关闭对话框
		closeDialog() {
			this.showDialog = false;
			this.newPrinter = {
				name: '',
				model: '',
				id: '',
				password: '',
				driverName: ''
			};
		},
			
		// 扫码
		scanCode() {
			uni.scanCode({
				success: (res) => {
					// 解析二维码内容
					try {
						const data = JSON.parse(res.result);
						this.newPrinter.id = data.deviceId || data.printerId || res.result;
						this.newPrinter.password = data.secret || data.password || '';
						this.newPrinter.name = data.name || this.newPrinter.name;
						this.newPrinter.model = data.model || this.newPrinter.model;
						this.newPrinter.driverName = data.driverName || this.newPrinter.driverName;
					} catch (error) {
						this.newPrinter.id = res.result;
					}
				}
			});
		},
			
		// 快速填充示例设备
		quickFillDevice() {
			const defaultDevice = printApi.getDefaultDevice();
			this.newPrinter.id = defaultDevice.id;
			this.newPrinter.name = '测试云盒 - ' + defaultDevice.name;
			this.newPrinter.model = defaultDevice.model;
			this.newPrinter.password = defaultDevice.password;
			this.newPrinter.driverName = defaultDevice.driverName;
			uni.showToast({
				title: '已填充设备信息',
				icon: 'success'
			});
		},
			
		// 添加打印机
		async addPrinter() {
			// 验证表单
			if (!this.newPrinter.name) {
				uni.showToast({
					title: '请输入打印机名称',
					icon: 'none'
				});
				return;
			}
			
			if (!this.newPrinter.id) {
				uni.showToast({
					title: '请输入打印机ID',
					icon: 'none'
				});
				return;
			}
			
			uni.showLoading({
				title: '添加中...'
			});
			
			try {
				// 调用API添加打印机
				const result = await printApi.addPrinter({
					name: this.newPrinter.name,
					model: this.newPrinter.model,
					printerId: this.newPrinter.id,
					password: this.newPrinter.password
				});
				
				// 添加到本地列表
				const printer = {
					id: this.newPrinter.id,
					name: this.newPrinter.name,
					model: this.newPrinter.model,
					password: this.newPrinter.password,
					driverName: this.newPrinter.driverName || this.newPrinter.model,
					status: 'online'
				};
				
				this.printerList.push(printer);
				uni.setStorageSync('printers', this.printerList);
				
				// 如果是第一台打印机，自动选中
				if (this.printerList.length === 1) {
					this.selectPrinter(printer);
				}
				
				uni.hideLoading();
				uni.showToast({
					title: '添加成功',
					icon: 'success'
				});
				
				this.closeDialog();
				
			} catch (error) {
				uni.hideLoading();
				uni.showToast({
					title: error.message || '添加失败',
					icon: 'none'
				});
			}
		},
			
			// 删除打印机（长按）
			deletePrinter(printer) {
				uni.showModal({
					title: '提示',
					content: '确定要删除打印机"' + printer.name + '"吗？',
					success: (res) => {
						if (res.confirm) {
							const index = this.printerList.findIndex(p => p.id === printer.id);
							if (index > -1) {
								this.printerList.splice(index, 1);
								uni.setStorageSync('printers', this.printerList);
								
								// 如果删除的是当前选中的打印机，清空选择
								if (this.selectedPrinter && this.selectedPrinter.id === printer.id) {
									this.selectedPrinter = null;
									uni.removeStorageSync('selectedPrinter');
								}
								
								uni.showToast({
									title: '删除成功',
									icon: 'success'
								});
							}
						}
					}
				});
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
	
	/* 打印机列表 */
	.printer-list {
		margin-bottom: 20rpx;
	}
	
	.printer-item {
		background-color: #ffffff;
		border-radius: 20rpx;
		padding: 30rpx;
		margin-bottom: 20rpx;
		display: flex;
		justify-content: space-between;
		align-items: center;
		border: 2px solid transparent;
		transition: all 0.3s;
	}
	
	.printer-item.selected {
		border-color: #1890ff;
		background-color: #e6f7ff;
	}
	
	.printer-main {
		display: flex;
		align-items: center;
		flex: 1;
	}
	
	.printer-icon {
		font-size: 80rpx;
		margin-right: 30rpx;
	}
	
	.printer-info {
		display: flex;
		flex-direction: column;
	}
	
	.printer-name {
		font-size: 32rpx;
		font-weight: bold;
		color: #333333;
		margin-bottom: 10rpx;
	}
	
	.printer-model {
		font-size: 26rpx;
		color: #999999;
	}
	
	.printer-status {
		display: flex;
		align-items: center;
		padding: 10rpx 20rpx;
		border-radius: 20rpx;
		font-size: 24rpx;
	}
	
	.printer-status.online {
		background-color: #f6ffed;
		color: #52c41a;
	}
	
	.printer-status.offline {
		background-color: #fff1f0;
		color: #ff4d4f;
	}
	
	.status-dot {
		width: 12rpx;
		height: 12rpx;
		border-radius: 50%;
		margin-right: 10rpx;
	}
	
	.printer-status.online .status-dot {
		background-color: #52c41a;
	}
	
	.printer-status.offline .status-dot {
		background-color: #ff4d4f;
	}
	
	/* 添加按钮 */
	.add-section {
		padding: 20rpx 0;
	}
	
	.add-btn {
		width: 100%;
		height: 88rpx;
		line-height: 88rpx;
		background-color: #1890ff;
		color: #ffffff;
		border: none;
		border-radius: 12rpx;
		font-size: 32rpx;
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
	
	.quick-fill-section {
		padding: 0 30rpx 20rpx;
	}
	
	.quick-fill-btn {
		width: 100%;
		height: 70rpx;
		line-height: 70rpx;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: #ffffff;
		border: none;
		border-radius: 12rpx;
		font-size: 28rpx;
		padding: 0;
	}
	
	.dialog-content {
		padding: 20rpx 30rpx;
		max-height: 800rpx;
		overflow-y: auto;
	}
	
	.form-item {
		margin-bottom: 30rpx;
	}
	
	.label {
		display: block;
		font-size: 28rpx;
		color: #333333;
		margin-bottom: 15rpx;
	}
	
	.input {
		width: 100%;
		height: 80rpx;
		padding: 0 20rpx;
		border: 1px solid #d9d9d9;
		border-radius: 8rpx;
		font-size: 28rpx;
	}
	
	.scan-row {
		display: flex;
		align-items: center;
		gap: 20rpx;
	}
	
	.flex-input {
		flex: 1;
	}
	
	.scan-btn {
		width: 140rpx;
		height: 80rpx;
		line-height: 80rpx;
		background-color: #1890ff;
		color: #ffffff;
		border: none;
		border-radius: 8rpx;
		font-size: 28rpx;
		padding: 0;
	}
	
	.dialog-footer {
		display: flex;
		border-top: 1px solid #f0f0f0;
	}
	
	.cancel-btn,
	.confirm-btn {
		flex: 1;
		height: 100rpx;
		line-height: 100rpx;
		border: none;
		font-size: 32rpx;
	}
	
	.cancel-btn {
		background-color: #ffffff;
		color: #666666;
	}
	
	.confirm-btn {
		background-color: #ffffff;
		color: #1890ff;
		border-left: 1px solid #f0f0f0;
	}
	
	.empty-tip {
		text-align: center;
		padding: 120rpx 0;
		color: #999999;
	}
	
	.empty-tip text {
		display: block;
		font-size: 28rpx;
	}
	
	.sub-tip {
		font-size: 24rpx;
		margin-top: 20rpx;
	}
</style>
