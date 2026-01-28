<template>
	<view class="container">
		<!-- 打印类型切换 -->
		<view class="type-tabs">
			<view 
				v-for="type in printTypes" 
				:key="type.value"
				class="tab-item"
				:class="{'active': currentType === type.value}"
				@click="switchType(type.value)"
			>
				<text>{{ type.label }}</text>
			</view>
		</view>
		
		<!-- 文本打印 -->
		<view class="print-content" v-if="currentType === 'text'">
			<view class="form-item">
				<text class="label">输入文本内容</text>
				<textarea 
					v-model="textContent" 
					class="textarea"
					placeholder="请输入要打印的文本内容"
					maxlength="2000"
				></textarea>
				<text class="count">{{ textContent.length }}/2000</text>
			</view>
			
			<view class="form-item">
				<text class="label">字体大小</text>
				<slider 
					:value="fontSize" 
					@change="fontSizeChange"
					min="12" 
					max="48" 
					step="2"
					show-value
				></slider>
			</view>
		</view>
		
		<!-- 图片打印 -->
		<view class="print-content" v-if="currentType === 'image'">
			<view class="image-grid">
				<view 
					v-for="(img, index) in imageList" 
					:key="index"
					class="image-item"
				>
					<image :src="img" mode="aspectFill"></image>
					<view class="delete-icon" @click="deleteImage(index)">×</view>
				</view>
				<view class="upload-btn" @click="chooseImage" v-if="imageList.length < 9">
					<text>+</text>
					<text class="upload-text">添加图片</text>
				</view>
			</view>
		</view>
		
		<!-- 文档打印 -->
		<view class="print-content" v-if="currentType === 'document'">
			<view class="form-item">
				<text class="label">输入方式</text>
				<view class="input-type-btns">
					<button 
						class="input-type-btn"
						:class="{'active': inputType === 'file'}"
						@click="inputType = 'file'"
					>
						本地文件
					</button>
					<button 
						class="input-type-btn"
						:class="{'active': inputType === 'url'}"
						@click="inputType = 'url'"
					>
						文件URL
					</button>
				</view>
			</view>
			
			<!-- 本地文件 -->
			<view v-if="inputType === 'file'">
				<view class="file-list">
					<view v-for="(file, index) in fileList" :key="index" class="file-item">
						<view class="file-info">
							<text class="file-icon">📄</text>
							<view class="file-detail">
								<text class="file-name">{{ file.name }}</text>
								<text class="file-size">{{ formatFileSize(file.size) }}</text>
							</view>
						</view>
						<text class="delete-text" @click="deleteFile(index)">删除</text>
					</view>
					<view class="empty-tip" v-if="fileList.length === 0">
						<text>暂无文件</text>
					</view>
				</view>
				<button class="upload-file-btn" @click="chooseFile">选择文件</button>
				<view class="tip-text">
					<text>支持 PDF、Word、Excel、PPT 等格式</text>
				</view>
			</view>
			
			<!-- URL输入 -->
			<view v-if="inputType === 'url'">
				<view class="form-item">
					<text class="label">文件URL</text>
					<textarea 
						v-model="fileUrl" 
						class="textarea"
						placeholder="请输入文件的完整URL地址，例如：https://example.com/document.pdf"
						auto-height
					></textarea>
				</view>
				<view class="tip-text">
					<text>💡 请确保URL可公开访问，支持 PDF、Office 文档等</text>
				</view>
			</view>
		</view>
		
		<!-- 标签打印 -->
		<view class="print-content" v-if="currentType === 'label'">
			<view class="form-item">
				<text class="label">标签内容</text>
				<input 
					v-model="labelContent" 
					class="input"
					placeholder="请输入标签内容"
				/>
			</view>
			<view class="form-item">
				<text class="label">标签模板</text>
				<picker :range="labelTemplates" range-key="name" @change="templateChange">
					<view class="picker">
						<text>{{ selectedTemplate.name || '请选择模板' }}</text>
					</view>
				</picker>
			</view>
		</view>
		
		<!-- 打印设置 -->
		<view class="settings-section">
			<view class="section-title">打印设置</view>
			
			<view class="setting-item">
				<text class="setting-label">打印机</text>
				<view class="setting-value" @click="selectPrinter">
					<text>{{ currentPrinter ? currentPrinter.name : '请选择打印机' }}</text>
					<text class="arrow">></text>
				</view>
			</view>
			
			<view class="setting-item">
				<text class="setting-label">打印份数</text>
				<view class="counter">
					<button class="counter-btn" @click="changeCopies(-1)">-</button>
					<text class="counter-value">{{ copies }}</text>
					<button class="counter-btn" @click="changeCopies(1)">+</button>
				</view>
			</view>
			
			<view class="setting-item">
				<text class="setting-label">纸张大小</text>
				<picker :range="paperSizes" range-key="name" @change="paperSizeChange">
					<view class="picker">
						<text>{{ currentPaperSize.name }}</text>
					</view>
				</picker>
			</view>
			
			<view class="setting-item">
				<text class="setting-label">打印方向</text>
				<view class="orientation-btns">
					<button 
						class="orientation-btn"
						:class="{'active': orientation === 1}"
						@click="orientation = 1"
					>
						竖向
					</button>
					<button 
						class="orientation-btn"
						:class="{'active': orientation === 2}"
						@click="orientation = 2"
					>
						横向
					</button>
				</view>
			</view>
							
			<view class="setting-item">
				<text class="setting-label">颜色</text>
				<view class="color-btns">
					<button 
						class="color-btn"
						:class="{'active': colorMode === 2}"
						@click="colorMode = 2"
					>
						彩色
					</button>
					<button 
						class="color-btn"
						:class="{'active': colorMode === 1}"
						@click="colorMode = 1"
					>
						黑白
					</button>
				</view>
			</view>
							
			<view class="setting-item">
				<text class="setting-label">双面打印</text>
				<view class="duplex-btns">
					<button 
						class="duplex-btn"
						:class="{'active': duplexMode === 1}"
						@click="duplexMode = 1"
					>
						关闭
					</button>
					<button 
						class="duplex-btn"
						:class="{'active': duplexMode === 3}"
						@click="duplexMode = 3"
					>
						短边
					</button>
					<button 
						class="duplex-btn"
						:class="{'active': duplexMode === 2}"
						@click="duplexMode = 2"
					>
						长边
					</button>
				</view>
			</view>
		</view>
		
		<!-- 打印按钮 -->
		<view class="bottom-bar">
			<button class="preview-btn" @click="previewPrint">预览</button>
			<button class="print-btn" @click="startPrint">开始打印</button>
		</view>
	</view>
</template>

<script>
	import printApi from '@/utils/printApi.js';
	
	export default {
		data() {
			return {
				// 打印类型
				printTypes: [
					{ label: '文本', value: 'text' },
					{ label: '图片', value: 'image' },
					{ label: '文档', value: 'document' },
					{ label: '标签', value: 'label' }
				],
				currentType: 'text',
							
				// 文本打印
				textContent: '',
				fontSize: 14,
							
				// 图片打印
				imageList: [],
							
				// 文档打印
				inputType: 'url', // 'file' 或 'url'
				fileList: [],
				fileUrl: '',
							
				// 标签打印
				labelContent: '',
				labelTemplates: [
					{ name: '标准标签', value: 'standard' },
					{ name: '快递标签', value: 'express' },
					{ name: '价格标签', value: 'price' }
				],
				selectedTemplate: {},
							
				// 打印设置
				currentPrinter: null,
				copies: 1,
				paperSizes: [
					{ name: 'A4', value: 9 },
					{ name: 'A5', value: 11 },
					{ name: 'Letter', value: 1 },
					{ name: 'A3', value: 8 }
				],
				currentPaperSize: { name: 'A4', value: 9 },
				orientation: 1, // 1=竖向, 2=横向
				colorMode: 1, // 1=黑白, 2=彩色
				duplexMode: 1 // 1=关闭双面, 2=长边, 3=短边
			}
		},
		
		onLoad(options) {
			if (options.type) {
				this.currentType = options.type;
			}
			this.loadPrinter();
		},
		
		methods: {
			// 切换打印类型
			switchType(type) {
				this.currentType = type;
			},
			
			// 加载打印机
			loadPrinter() {
				this.currentPrinter = uni.getStorageSync('selectedPrinter');
			},
			
			// 选择打印机
			selectPrinter() {
				uni.navigateTo({
					url: '/pages/printer/printer'
				});
			},
			
			// 字体大小变化
			fontSizeChange(e) {
				this.fontSize = e.detail.value;
			},
			
			// 选择图片
			chooseImage() {
				uni.chooseImage({
					count: 9 - this.imageList.length,
					sizeType: ['original', 'compressed'],
					sourceType: ['album', 'camera'],
					success: (res) => {
						this.imageList = this.imageList.concat(res.tempFilePaths);
					}
				});
			},
			
			// 删除图片
			deleteImage(index) {
				this.imageList.splice(index, 1);
			},
			
			// 选择文件
			chooseFile() {
				// 微信小程序选择文件
				uni.chooseMessageFile({
					count: 10,
					type: 'file',
					success: (res) => {
						this.fileList = this.fileList.concat(res.tempFiles.map(file => ({
							name: file.name,
							path: file.path,
							size: file.size
						})));
					}
				});
			},
			
			// 删除文件
			deleteFile(index) {
				this.fileList.splice(index, 1);
			},
			
			// 格式化文件大小
			formatFileSize(size) {
				if (size < 1024) {
					return size + 'B';
				} else if (size < 1024 * 1024) {
					return (size / 1024).toFixed(2) + 'KB';
				} else {
					return (size / 1024 / 1024).toFixed(2) + 'MB';
				}
			},
			
			// 模板变化
			templateChange(e) {
				this.selectedTemplate = this.labelTemplates[e.detail.value];
			},
			
			// 纸张大小变化
			paperSizeChange(e) {
				this.currentPaperSize = this.paperSizes[e.detail.value];
			},
			
			// 改变份数
			changeCopies(delta) {
				const newCopies = this.copies + delta;
				if (newCopies >= 1 && newCopies <= 99) {
					this.copies = newCopies;
				}
			},
			
			// 预览打印
			previewPrint() {
				if (!this.validatePrintData()) {
					return;
				}
				
				uni.showToast({
					title: '预览功能开发中',
					icon: 'none'
				});
			},
			
			// 验证打印数据
			validatePrintData() {
				if (!this.currentPrinter) {
					uni.showToast({
						title: '请先选择打印机',
						icon: 'none'
					});
					return false;
				}
								
				if (this.currentType === 'text' && !this.textContent) {
					uni.showToast({
						title: '请输入文本内容',
						icon: 'none'
					});
					return false;
				}
								
				if (this.currentType === 'image' && this.imageList.length === 0) {
					uni.showToast({
						title: '请选择图片',
						icon: 'none'
					});
					return false;
				}
								
				if (this.currentType === 'document') {
					if (this.inputType === 'file' && this.fileList.length === 0) {
						uni.showToast({
							title: '请选择文件',
							icon: 'none'
						});
						return false;
					}
					if (this.inputType === 'url' && !this.fileUrl) {
						uni.showToast({
							title: '请输入文件URL',
							icon: 'none'
						});
						return false;
					}
				}
								
				if (this.currentType === 'label' && !this.labelContent) {
					uni.showToast({
						title: '请输入标签内容',
						icon: 'none'
					});
					return false;
				}
								
				return true;
			},
			
			// 开始打印
			async startPrint() {
				if (!this.validatePrintData()) {
					return;
				}
							
				// 检查打印机配置是否完整
				if (!this.currentPrinter.password) {
					uni.showModal({
						title: '提示',
						content: '打印机缺少密码配置，是否继续？\n（可能导致打印失败）',
						success: (res) => {
							if (res.confirm) {
								this.executePrint();
							}
						}
					});
					return;
				}
				
				this.executePrint();
			},
			
			// 执行打印
			async executePrint() {
				uni.showLoading({
					title: '正在打印...'
				});
							
				try {
					let result;
					
					// 打印调试信息
					console.log('当前打印机信息:', this.currentPrinter);
								
					// 构建通用打印参数
					const printData = {
						deviceId: this.currentPrinter.id,
						devicePassword: this.currentPrinter.password,
						printerName: this.currentPrinter.model || this.currentPrinter.name,
						driverName: this.currentPrinter.driverName || this.currentPrinter.model,
						dmCopies: this.copies,
						dmPaperSize: this.currentPaperSize.value,
						dmOrientation: this.orientation,
						dmColor: this.colorMode,
						dmDuplex: this.duplexMode,
						isPreview: 1 // 生成预览图
					};
					
					console.log('打印参数:', printData);
									
					// 根据类型调用不同的打印接口
					if (this.currentType === 'document') {
						if (this.inputType === 'url') {
							// 使用URL打印
							result = await printApi.submitPrintTask({
								...printData,
								jobFileUrl: this.fileUrl
							});
						} else {
							// 先上传文件
							const fileUrls = [];
							for (let file of this.fileList) {
								const uploadResult = await printApi.uploadFile(file.path);
								fileUrls.push(uploadResult.data.url);
							}
							// 使用第一个文件URL
							result = await printApi.submitPrintTask({
								...printData,
								jobFileUrl: fileUrls[0]
							});
						}
					} else if (this.currentType === 'image') {
						// 先上传图片
						const imageUrls = [];
						for (let img of this.imageList) {
							const uploadResult = await printApi.uploadFile(img);
							imageUrls.push(uploadResult.data.url);
						}
						result = await printApi.printImage({
							...printData,
							imageUrls: imageUrls
						});
					} else if (this.currentType === 'label') {
						result = await printApi.printLabel({
							...printData,
							content: this.labelContent,
							template: this.selectedTemplate.value
						});
					} else {
						// 文本打印 - 使用旧API
						result = await printApi.printText({
							...printData,
							content: this.textContent,
							fontSize: this.fontSize
						});
					}
									
					// 保存打印历史
					this.savePrintHistory(result);
									
					uni.hideLoading();
									
					// 显示任务ID
					const taskId = result.data?.task_id || result.data?.jobId;
					if (taskId) {
						uni.showModal({
							title: '打印任务已提交',
							content: `任务ID: ${taskId}\n\n可在历史记录中查询任务状态`,
							confirmText: '查看历史',
							cancelText: '继续打印',
							success: (res) => {
								if (res.confirm) {
									uni.navigateTo({
										url: '/pages/history/history'
									});
								}
							}
						});
					} else {
						uni.showToast({
							title: '打印成功',
							icon: 'success'
						});
					}
									
					// 清空表单
					this.clearForm();
									
				} catch (error) {
					uni.hideLoading();
					console.error('打印失败:', error);
					uni.showModal({
						title: '打印失败',
						content: error.message || error.msg || '未知错误',
						showCancel: false
					});
				}
			},
			
			// 保存打印历史
			savePrintHistory(result) {
				let history = uni.getStorageSync('printHistory') || [];
				history.unshift({
					id: result.data?.task_id || result.data?.jobId || Date.now(),
					type: this.currentType,
					printer: this.currentPrinter.name,
					time: new Date().toISOString(),
					status: 'pending',
					params: {
						copies: this.copies,
						paperSize: this.currentPaperSize.name,
						orientation: this.orientation === 1 ? '竖向' : '横向',
						colorMode: this.colorMode === 1 ? '黑白' : '彩色',
						duplexMode: this.duplexMode === 1 ? '关闭' : (this.duplexMode === 2 ? '长边' : '短边')
					}
				});
								
				// 只保留最近100条记录
				if (history.length > 100) {
					history = history.slice(0, 100);
				}
								
				uni.setStorageSync('printHistory', history);
			},
			
			// 清空表单
			clearForm() {
				this.textContent = '';
				this.imageList = [];
				this.fileList = [];
				this.fileUrl = '';
				this.labelContent = '';
				this.copies = 1;
			}
		}
	}
</script>

<style scoped>
	.container {
		min-height: 100vh;
		background-color: #f5f5f5;
		padding-bottom: 140rpx;
	}
	
	/* 类型标签 */
	.type-tabs {
		display: flex;
		background-color: #ffffff;
		padding: 20rpx;
	}
	
	.tab-item {
		flex: 1;
		text-align: center;
		padding: 20rpx 0;
		border-radius: 12rpx;
		font-size: 28rpx;
		color: #666666;
	}
	
	.tab-item.active {
		background-color: #1890ff;
		color: #ffffff;
	}
	
	/* 打印内容 */
	.print-content {
		background-color: #ffffff;
		margin: 20rpx;
		border-radius: 20rpx;
		padding: 30rpx;
	}
	
	.form-item {
		margin-bottom: 30rpx;
	}
	
	.label {
		display: block;
		font-size: 28rpx;
		color: #333333;
		margin-bottom: 20rpx;
	}
	
	.textarea {
		width: 100%;
		min-height: 300rpx;
		padding: 20rpx;
		border: 1px solid #e0e0e0;
		border-radius: 12rpx;
		font-size: 28rpx;
	}
	
	.count {
		display: block;
		text-align: right;
		font-size: 24rpx;
		color: #999999;
		margin-top: 10rpx;
	}
	
	.input {
		width: 100%;
		padding: 20rpx;
		border: 1px solid #e0e0e0;
		border-radius: 12rpx;
		font-size: 28rpx;
	}
	
	.picker {
		padding: 20rpx;
		border: 1px solid #e0e0e0;
		border-radius: 12rpx;
		font-size: 28rpx;
	}
	
	/* 图片网格 */
	.image-grid {
		display: flex;
		flex-wrap: wrap;
	}
	
	.image-item {
		position: relative;
		width: 200rpx;
		height: 200rpx;
		margin-right: 20rpx;
		margin-bottom: 20rpx;
		border-radius: 12rpx;
		overflow: hidden;
	}
	
	.image-item image {
		width: 100%;
		height: 100%;
	}
	
	.delete-icon {
		position: absolute;
		top: 0;
		right: 0;
		width: 50rpx;
		height: 50rpx;
		background-color: rgba(0, 0, 0, 0.6);
		color: #ffffff;
		text-align: center;
		line-height: 50rpx;
		font-size: 40rpx;
	}
	
	.upload-btn {
		width: 200rpx;
		height: 200rpx;
		border: 2px dashed #d9d9d9;
		border-radius: 12rpx;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		font-size: 60rpx;
		color: #d9d9d9;
	}
	
	.upload-text {
		font-size: 24rpx;
		margin-top: 10rpx;
	}
	
	/* 文件列表 */
	.file-list {
		margin-bottom: 20rpx;
	}
	
	.file-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 20rpx;
		background-color: #f5f5f5;
		border-radius: 12rpx;
		margin-bottom: 20rpx;
	}
	
	.file-info {
		display: flex;
		align-items: center;
		flex: 1;
	}
	
	.file-icon {
		font-size: 60rpx;
		margin-right: 20rpx;
	}
	
	.file-detail {
		display: flex;
		flex-direction: column;
	}
	
	.file-name {
		font-size: 28rpx;
		color: #333333;
		margin-bottom: 10rpx;
	}
	
	.file-size {
		font-size: 24rpx;
		color: #999999;
	}
	
	.delete-text {
		font-size: 28rpx;
		color: #ff4d4f;
	}
	
	.upload-file-btn {
		width: 100%;
		background-color: #1890ff;
		color: #ffffff;
		border-radius: 12rpx;
		height: 80rpx;
		line-height: 80rpx;
	}
	
	.tip-text {
		text-align: center;
		font-size: 24rpx;
		color: #999999;
		margin-top: 20rpx;
	}
	
	/* 打印设置 */
	.settings-section {
		background-color: #ffffff;
		margin: 20rpx;
		border-radius: 20rpx;
		padding: 30rpx;
	}
	
	.section-title {
		font-size: 32rpx;
		font-weight: bold;
		color: #333333;
		margin-bottom: 30rpx;
	}
	
	.setting-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 20rpx 0;
		border-bottom: 1px solid #f0f0f0;
	}
	
	.setting-item:last-child {
		border-bottom: none;
	}
	
	.setting-label {
		font-size: 28rpx;
		color: #333333;
	}
	
	.setting-value {
		display: flex;
		align-items: center;
		font-size: 28rpx;
		color: #666666;
	}
	
	.arrow {
		margin-left: 10rpx;
		color: #999999;
	}
	
	.counter {
		display: flex;
		align-items: center;
	}
	
	.counter-btn {
		width: 60rpx;
		height: 60rpx;
		background-color: #f5f5f5;
		border: none;
		border-radius: 8rpx;
		font-size: 32rpx;
		line-height: 60rpx;
		padding: 0;
	}
	
	.counter-value {
		margin: 0 30rpx;
		font-size: 28rpx;
		min-width: 60rpx;
		text-align: center;
	}
	
	.orientation-btns,
	.color-btns,
	.duplex-btns,
	.input-type-btns {
		display: flex;
		gap: 20rpx;
	}
	
	.orientation-btn,
	.color-btn,
	.duplex-btn,
	.input-type-btn {
		padding: 12rpx 30rpx;
		background-color: #f5f5f5;
		border: none;
		border-radius: 8rpx;
		font-size: 26rpx;
		color: #666666;
	}
	
	.orientation-btn.active,
	.color-btn.active,
	.duplex-btn.active,
	.input-type-btn.active {
		background-color: #e6f7ff;
		color: #1890ff;
	}
	
	/* 底部按钮栏 */
	.bottom-bar {
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		display: flex;
		padding: 20rpx;
		background-color: #ffffff;
		box-shadow: 0 -2rpx 10rpx rgba(0, 0, 0, 0.1);
	}
	
	.preview-btn {
		flex: 1;
		height: 80rpx;
		line-height: 80rpx;
		background-color: #ffffff;
		color: #1890ff;
		border: 1px solid #1890ff;
		border-radius: 12rpx;
		margin-right: 20rpx;
	}
	
	.print-btn {
		flex: 2;
		height: 80rpx;
		line-height: 80rpx;
		background-color: #1890ff;
		color: #ffffff;
		border: none;
		border-radius: 12rpx;
	}
	
	.empty-tip {
		text-align: center;
		padding: 60rpx 0;
		color: #999999;
		font-size: 28rpx;
	}
</style>
