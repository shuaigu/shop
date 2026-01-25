<template>
	<view class="bargain-section">
		<view class="section-header">
			<text class="section-title">砍价活动</text>
			<switch :checked="bargainConfig.enableBargain" @change="handleBargainSwitch" color="#2196F3" />
		</view>
		
		<view class="bargain-settings" v-if="bargainConfig.enableBargain">
			<!-- 起始金额设置 -->
			<view class="setting-item">
				<text class="setting-label">起始金额（元）</text>
				<input 
					v-model.number="bargainConfig.initialPrice" 
					type="digit" 
					placeholder="请输入起始金额" 
					class="setting-input"
					maxlength="10"
					@input="handleConfigChange"
				/>
			</view>
			
			<!-- 砍价策略选择 -->
			<view class="setting-item mode-selector">
				<text class="setting-label">砍价模式</text>
				<view class="mode-tabs">
					<view 
						class="mode-tab" 
						:class="{ 'active': bargainConfig.mode === 'fixed' }"
						@click="handleBargainModeChange('fixed')"
					>
						<text>固定金额</text>
					</view>
					<view 
						class="mode-tab" 
						:class="{ 'active': bargainConfig.mode === 'random' }"
						@click="handleBargainModeChange('random')"
					>
						<text>随机金额</text>
					</view>
					<view 
						class="mode-tab" 
						:class="{ 'active': bargainConfig.mode === 'decrease' }"
						@click="handleBargainModeChange('decrease')"
					>
						<text>递减模式</text>
					</view>
					<view 
						class="mode-tab" 
						:class="{ 'active': bargainConfig.mode === 'percentage' }"
						@click="handleBargainModeChange('percentage')"
					>
						<text>百分比模式</text>
					</view>
				</view>
			</view>
			
			<!-- 固定金额模式配置 -->
			<view class="mode-config" v-if="bargainConfig.mode === 'fixed'">
				<view class="setting-item">
					<text class="setting-label">每次砍价（元）</text>
					<input 
						v-model.number="bargainConfig.step" 
						type="digit" 
						placeholder="默认10元" 
						class="setting-input"
						maxlength="10"
						@input="handleConfigChange"
					/>
				</view>
				<view class="mode-description">
					<uni-icons type="info" size="14" color="#999"></uni-icons>
					<text>每人每次砍价的金额固定不变，简单明确</text>
				</view>
			</view>
			
			<!-- 随机金额模式配置 -->
			<view class="mode-config" v-if="bargainConfig.mode === 'random'">
				<view class="setting-item">
					<text class="setting-label">最小金额（元）</text>
					<input 
						v-model.number="bargainConfig.minAmount" 
						type="digit" 
						placeholder="默认1元" 
						class="setting-input"
						maxlength="10"
						@input="handleConfigChange"
					/>
				</view>
				<view class="setting-item">
					<text class="setting-label">最大金额（元）</text>
					<input 
						v-model.number="bargainConfig.maxAmount" 
						type="digit" 
						placeholder="默认5元" 
						class="setting-input"
						maxlength="10"
						@input="handleConfigChange"
					/>
				</view>
				<view class="mode-description">
					<uni-icons type="info" size="14" color="#999"></uni-icons>
					<text>每次砍价金额在设定范围内随机生成，增加趣味性</text>
				</view>
			</view>
			
			<!-- 递减模式配置 -->
			<view class="mode-config" v-if="bargainConfig.mode === 'decrease'">
				<view class="setting-item">
					<text class="setting-label">首次砍价（元）</text>
					<input 
						v-model.number="bargainConfig.step" 
						type="digit" 
						placeholder="首次砍价金额" 
						class="setting-input"
						maxlength="10"
						@input="handleConfigChange"
					/>
				</view>
				<view class="setting-item">
					<text class="setting-label">递减比例</text>
					<picker mode="selector" :range="decreaseRateOptions" :value="decreaseRateIndex" @change="handleDecreaseRateChange">
						<view class="picker-display">
							<text>{{ ((1 - bargainConfig.decreaseRate) * 100).toFixed(0) }}% 递减</text>
							<uni-icons type="bottom" size="14" color="#999"></uni-icons>
						</view>
					</picker>
				</view>
				<view class="mode-description">
					<uni-icons type="info" size="14" color="#999"></uni-icons>
					<text>每次在递减后的基准金额±30%范围内随机，既有递减趋势又有惊喜</text>
				</view>
			</view>
			
			<!-- 百分比模式配置 -->
			<view class="mode-config" v-if="bargainConfig.mode === 'percentage'">
				<view class="setting-item">
					<text class="setting-label">砍价百分比（%）</text>
					<input 
						v-model.number="bargainConfig.percentage" 
						type="digit" 
						placeholder="每次砍掉原价的X%" 
						class="setting-input"
						maxlength="5"
						@input="handleConfigChange"
					/>
				</view>
				<view class="mode-description">
					<uni-icons type="info" size="14" color="#999"></uni-icons>
					<text>每次砍掉原价的固定百分比，适合不同价位商品</text>
				</view>
			</view>
			
			<!-- 弹窗图片设置 -->
			<view class="setting-item image-upload-item">
				<text class="setting-label">弹窗图片</text>
				<view class="image-upload-section">
					<view class="image-preview" v-if="bargainConfig.popupImage" @click="handleImagePreview">
						<image :src="bargainConfig.popupImage" mode="aspectFit" class="preview-img"></image>
						<view class="image-actions">
							<view class="action-icon" @click.stop="handleChooseImage">
								<uni-icons type="images" size="20" color="#fff"></uni-icons>
							</view>
							<view class="action-icon" @click.stop="handleDeleteImage">
								<uni-icons type="trash" size="20" color="#fff"></uni-icons>
							</view>
						</view>
					</view>
					<view class="upload-btn" v-else @click="handleChooseImage">
						<uni-icons type="camera" size="32" color="#999"></uni-icons>
						<text class="upload-text">上传弹窗图片</text>
						<text class="upload-tip">建议尺寸 400x400</text>
					</view>
				</view>
			</view>
			
			<!-- 买断功能设置 -->
			<view class="setting-item buyout-section">
				<view class="buyout-header">
					<text class="setting-label">买断功能</text>
					<switch :checked="bargainConfig.enableBuyout" @change="handleBuyoutSwitch" color="#FFB800" />
				</view>
				<view class="buyout-description" v-if="bargainConfig.enableBuyout">
					<uni-icons type="info" size="14" color="#FFB800"></uni-icons>
					<text>用户可以直接以当前砍价剩余金额购买，无需等待砍价</text>
				</view>
				<view class="buyout-tip" v-if="bargainConfig.enableBuyout">
					<uni-icons type="info-filled" size="14" color="#FF8C00"></uni-icons>
					<text>买断价格为用户当前参与砍价的实时剩余金额，随砍价进度动态变化</text>
				</view>
			</view>
			
			<!-- 预览提示 -->
			<view class="bargain-preview" v-if="bargainConfig.initialPrice > 0">
				<view class="preview-header">
					<uni-icons type="eye" size="16" color="#2196F3"></uni-icons>
					<text class="preview-title">预览效果</text>
				</view>
				<text class="preview-text">起始价：¥{{ bargainConfig.initialPrice.toFixed(2) }}</text>
				<text class="preview-text highlight">{{ previewBargainAmount }}</text>
			</view>
			
			<text class="tip">开启砍价后，用户可帮忙砍价，每人每天限砍1次（管理员无限制）</text>
		</view>
	</view>
</template>

<script>
// 导入用户store
import { useUserInfoStore } from '@/store/user.js'

export default {
	name: 'kanjia',
	setup() {
		// 获取用户信息
		const userStore = useUserInfoStore()
		// 导入云函数
		const extStorageCo = uniCloud.importObject('fabuWx', { customUI: true })
		
		return {
			userStore,
			extStorageCo
		}
	},
	props: {
		// 使用 v-model 双向绑定砍价配置
		modelValue: {
			type: Object,
			default: () => ({
				enableBargain: false,
				initialPrice: 0,
				step: 10,
				mode: 'fixed',
				minAmount: 5,
				maxAmount: 20,
				percentage: 1,
				decreaseRate: 0.8,
				popupImage: '', // 弹窗图片
				enableBuyout: false // 启用买断功能（买断价格为实时计算）
			})
		}
	},
	data() {
		return {
			// 内部配置对象
			bargainConfig: {
				enableBargain: false,
				initialPrice: 0,
				step: 10,
				mode: 'fixed',
				minAmount: 5,
				maxAmount: 20,
				percentage: 1,
				decreaseRate: 0.8,
				popupImage: '', // 弹窗图片
				enableBuyout: false // 启用买断功能
			},
			// 递减比例选项
			decreaseRateOptions: [0.9, 0.85, 0.8, 0.75, 0.7]
		}
	},
	computed: {
		// 计算当前选中的递减比例索引
		decreaseRateIndex() {
			return this.decreaseRateOptions.indexOf(this.bargainConfig.decreaseRate)
		},
		// 计算预览砍价金额
		previewBargainAmount() {
			switch(this.bargainConfig.mode) {
				case 'fixed':
					return `每次固定砍掉 ¥${(this.bargainConfig.step || 10).toFixed(2)}`
				case 'random':
					return `每次随机砍掉 ¥${(this.bargainConfig.minAmount || 1).toFixed(2)} ~ ¥${(this.bargainConfig.maxAmount || 5).toFixed(2)}`
				case 'percentage':
					const percentAmount = this.bargainConfig.initialPrice * (this.bargainConfig.percentage || 1) / 100
					return `每次砍掉原价的 ${this.bargainConfig.percentage}%（约¥${percentAmount.toFixed(2)}）`
				case 'decrease':
					return `首次砍掉 ¥${(this.bargainConfig.step || 10).toFixed(2)}，之后每次递减 ${((1 - this.bargainConfig.decreaseRate) * 100).toFixed(0)}% 并在区间内随机`
				default:
					return ''
			}
		}
	},
	watch: {
		// 监听外部传入的配置变化
		modelValue: {
			handler(newVal) {
				if (newVal) {
					this.bargainConfig = { ...newVal }
				}
			},
			immediate: true,
			deep: true
		}
	},
	methods: {
		// 处理砍价开关变化
		handleBargainSwitch(e) {
			this.bargainConfig.enableBargain = e.detail.value
			
			// 开启时，设置默认值
			if (e.detail.value && this.bargainConfig.initialPrice === 0) {
				this.bargainConfig.initialPrice = 100
				this.bargainConfig.step = 10
				this.bargainConfig.minAmount = 1
				this.bargainConfig.maxAmount = 5
				this.bargainConfig.percentage = 1
				this.bargainConfig.decreaseRate = 0.8
			}
			
			// 关闭时清空
			if (!e.detail.value) {
				this.bargainConfig.initialPrice = 0
				this.bargainConfig.step = 10
			}
			
			this.emitChange()
		},
		
		// 切换砍价模式
		handleBargainModeChange(mode) {
			this.bargainConfig.mode = mode
			// 根据不同模式设置默认值
			switch(mode) {
				case 'fixed':
					this.bargainConfig.step = this.bargainConfig.step || 10
					break
				case 'random':
					this.bargainConfig.minAmount = this.bargainConfig.minAmount || 1
					this.bargainConfig.maxAmount = this.bargainConfig.maxAmount || 5
					break
				case 'percentage':
					this.bargainConfig.percentage = this.bargainConfig.percentage || 1
					break
				case 'decrease':
					this.bargainConfig.step = this.bargainConfig.step || 10
					this.bargainConfig.decreaseRate = this.bargainConfig.decreaseRate || 0.8
					break
			}
			this.emitChange()
		},
		
		// 处理递减比例变化
		handleDecreaseRateChange(e) {
			this.bargainConfig.decreaseRate = this.decreaseRateOptions[e.detail.value]
			this.emitChange()
		},
		
		// 处理配置变化
		handleConfigChange() {
			this.emitChange()
		},
		
		// 处理买断开关变化
		handleBuyoutSwitch(e) {
			this.bargainConfig.enableBuyout = e.detail.value
			
			// 开启时，设置默认值（9折）
			if (e.detail.value && !this.bargainConfig.buyoutPrice) {
				this.bargainConfig.buyoutType = 'discount'
				this.bargainConfig.buyoutPrice = 90
			}
			
			this.emitChange()
		},
		
		// 切换买断价格类型
		handleBuyoutTypeChange(type) {
			this.bargainConfig.buyoutType = type
			
			// 根据类型设置默认值
			if (type === 'discount') {
				// 按折扣：默认9折
				this.bargainConfig.buyoutPrice = 90
			} else {
				// 固定金额：默认为起始价格的90%
				this.bargainConfig.buyoutPrice = Math.round(this.bargainConfig.initialPrice * 0.9)
			}
			
			this.emitChange()
		},
		
		// 选择图片
		async handleChooseImage() {
			try {
				console.log('=== 开始选择弹窗图片 ===')
				
				// 选择图片
				const chooseRes = await uni.chooseImage({
					count: 1,
					sizeType: ['original'],
					sourceType: ['album', 'camera']
				}).catch(err => {
					console.error('选择图片失败:', err)
					if (err.errMsg && err.errMsg.includes('auth')) {
						uni.showModal({
							title: '需要相册权限',
							content: '请在小程序设置中开启相册权限',
							confirmText: '去设置',
							success: (res) => {
								if (res.confirm) {
									uni.openSetting()
								}
							}
						})
					} else {
						uni.showToast({
							title: '选择图片失败',
							icon: 'none'
						})
					}
					throw err
				})
				
				if (!chooseRes || !chooseRes.tempFilePaths || chooseRes.tempFilePaths.length === 0) {
					console.warn('未选择任何图片')
					return
				}
				
				const filePath = chooseRes.tempFilePaths[0]
				console.log('选择了图片:', filePath)
				
				// 显示上传中
				uni.showLoading({
					title: '上传中...'
				})
				
				try {
					// 获取图片信息
					const imageInfo = await uni.getImageInfo({
						src: filePath
					}).catch(err => {
						console.error('获取图片尺寸信息失败:', err)
						return { width: 400, height: 400 }
					})
					
					console.log('图片尺寸:', imageInfo.width, 'x', imageInfo.height)
					
					// 获取上传配置
					const uploadOptions = await this.extStorageCo.getUploadFileOptions({
						cloudPath: `bargain-popup/${this.userStore.userInfo.uid}/${Date.now()}.jpg`,
						fileType: 'image',
						isOriginal: true,
						userNickName: this.userStore.userInfo.nickName,
						imageWidth: imageInfo.width,
						imageHeight: imageInfo.height
					}).catch(err => {
						console.error('获取上传配置失败:', err)
						uni.hideLoading()
						uni.showToast({
							title: '云存储配置失败',
							icon: 'none'
						})
						throw err
					})
					
					console.log('====== 云函数返回的上传配置 ======')
					console.log('原图URL:', uploadOptions.fileURL)
					console.log('======================================')
					
					// 执行上传
					await new Promise((resolve, reject) => {
						uni.uploadFile({
							...uploadOptions.uploadFileOptions,
							filePath: filePath,
							success: () => {
								// 获取纯净的URL（不带参数）
								const originalUrl = uploadOptions.url || uploadOptions.fileURL
								const cleanUrl = originalUrl.includes('?') ? originalUrl.split('?')[0] : originalUrl
								
								// 保存图片URL
								this.bargainConfig.popupImage = cleanUrl
								this.emitChange()
								
								console.log('====== 图片上传成功 ======')
								console.log('原始URL:', originalUrl)
								console.log('保存URL:', cleanUrl)
								console.log('============================')
								
								uni.hideLoading()
								uni.showToast({
									title: '上传成功',
									icon: 'success'
								})
								
								resolve()
							},
							fail: (err) => {
								console.error('上传失败:', err)
								uni.hideLoading()
								uni.showToast({
									title: '上传失败',
									icon: 'none'
								})
								reject(err)
							}
						})
					})
				} catch (err) {
					uni.hideLoading()
					console.error('上传图片失败:', err)
					uni.showToast({
						title: '上传失败，请重试',
						icon: 'none'
					})
				}
			} catch (err) {
				console.error('选择图片失败:', err)
			}
		},
		
		// 预览图片
		handleImagePreview() {
			if (this.bargainConfig.popupImage) {
				uni.previewImage({
					urls: [this.bargainConfig.popupImage],
					current: 0
				})
			}
		},
		
		// 删除图片
		handleDeleteImage() {
			uni.showModal({
				title: '提示',
				content: '确定要删除这张图片吗？',
				success: (res) => {
					if (res.confirm) {
						this.bargainConfig.popupImage = ''
						this.emitChange()
						uni.showToast({
							title: '已删除',
							icon: 'success'
						})
					}
				}
			})
		},
		
		// 向父组件发送配置变化事件
		emitChange() {
			this.$emit('update:modelValue', { ...this.bargainConfig })
		}
	}
}
</script>

<style lang="scss" scoped>
// 砍价设置区域样式
.bargain-section {
	padding: 30rpx;
	background-color: #fff;
	border-radius: 20rpx;
	margin-bottom: 20rpx;
	
	.section-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 20rpx;
		
		.section-title {
			font-size: 32rpx;
			font-weight: 600;
			color: #333;
		}
	}
	
	.bargain-settings {
		margin-top: 20rpx;
		
		.setting-item {
			display: flex;
			align-items: center;
			justify-content: space-between;
			margin-bottom: 20rpx;
			padding: 20rpx;
			background-color: #f7f7f7;
			border-radius: 12rpx;
			
			.setting-label {
				font-size: 28rpx;
				color: #666;
				flex-shrink: 0;
				width: 200rpx;
			}
			
			.setting-input {
				flex: 1;
				height: 60rpx;
				padding: 0 20rpx;
				background-color: #fff;
				border-radius: 8rpx;
				font-size: 28rpx;
				text-align: right;
			}
			
			.picker-display {
				flex: 1;
				display: flex;
				align-items: center;
				justify-content: space-between;
				padding: 0 20rpx;
				background-color: #fff;
				border-radius: 8rpx;
				height: 60rpx;
				
				text {
					font-size: 28rpx;
					color: #333;
				}
			}
			
			&.mode-selector {
				flex-direction: column;
				align-items: flex-start;
				gap: 16rpx;
				padding: 24rpx;
				
				.setting-label {
					width: auto;
					font-weight: 500;
					color: #333;
				}
			}
			
			&.image-upload-item {
				flex-direction: column;
				align-items: flex-start;
				gap: 12rpx;
				
				.setting-label {
					width: auto;
					margin-bottom: 8rpx;
				}
				
				.image-upload-section {
					width: 100%;
					
					.image-preview {
						position: relative;
						width: 200rpx;
						height: 200rpx;
						border-radius: 12rpx;
						overflow: hidden;
						background-color: #fff;
						box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);
						
						.preview-img {
							width: 100%;
							height: 100%;
						}
						
						.image-actions {
							position: absolute;
							bottom: 0;
							left: 0;
							right: 0;
							display: flex;
							justify-content: space-around;
							padding: 12rpx;
							background: linear-gradient(to top, rgba(0, 0, 0, 0.6), transparent);
							
							.action-icon {
								width: 48rpx;
								height: 48rpx;
								display: flex;
								align-items: center;
								justify-content: center;
								background-color: rgba(0, 0, 0, 0.3);
								border-radius: 50%;
								transition: all 0.3s;
								
								&:active {
									background-color: rgba(0, 0, 0, 0.5);
									transform: scale(0.9);
								}
							}
						}
					}
					
					.upload-btn {
						width: 200rpx;
						height: 200rpx;
						display: flex;
						flex-direction: column;
						align-items: center;
						justify-content: center;
						gap: 8rpx;
						background-color: #fff;
						border: 2rpx dashed #d9d9d9;
						border-radius: 12rpx;
						cursor: pointer;
						transition: all 0.3s;
						
						&:active {
							border-color: #667eea;
							background-color: rgba(102, 126, 234, 0.05);
						}
						
						.upload-text {
							font-size: 26rpx;
							color: #666;
						}
						
						.upload-tip {
							font-size: 22rpx;
							color: #999;
						}
					}
				}
			}
			
			&.buyout-section {
				flex-direction: column;
				align-items: flex-start;
				gap: 12rpx;
				
				.buyout-header {
					width: 100%;
					display: flex;
					align-items: center;
					justify-content: space-between;
				}
				
				.buyout-description {
					display: flex;
					align-items: center;
					gap: 8rpx;
					padding: 16rpx;
					background-color: rgba(255, 184, 0, 0.08);
					border-radius: 8rpx;
					width: 100%;
					
					text {
						font-size: 24rpx;
						color: #666;
						line-height: 1.5;
					}
				}
			}
		}
		
		.mode-tabs {
			display: flex;
			gap: 12rpx;
			width: 100%;
			flex-wrap: wrap;
			
			.mode-tab {
				flex: 1;
				min-width: 140rpx;
				height: 60rpx;
				display: flex;
				align-items: center;
				justify-content: center;
				background-color: #fff;
				border: 2rpx solid #e0e0e0;
				border-radius: 8rpx;
				transition: all 0.3s;
				
				text {
					font-size: 26rpx;
					color: #666;
					font-weight: 400;
				}
				
				&.active {
					background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
					border-color: #667eea;
					box-shadow: 0 4rpx 12rpx rgba(102, 126, 234, 0.3);
					
					text {
						color: #fff;
						font-weight: 600;
					}
				}
			}
		}
		
		.mode-config {
			margin-top: 12rpx;
			padding: 20rpx;
			background-color: #fafafa;
			border-radius: 12rpx;
			border-left: 4rpx solid #667eea;
			
			.mode-description {
				display: flex;
				align-items: center;
				gap: 8rpx;
				padding: 16rpx;
				background-color: rgba(102, 126, 234, 0.08);
				border-radius: 8rpx;
				margin-top: 12rpx;
				
				text {
					font-size: 24rpx;
					color: #666;
					line-height: 1.5;
				}
			}
		}
		
		.bargain-preview {
			padding: 24rpx;
			background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
			border-radius: 12rpx;
			margin: 20rpx 0;
			box-shadow: 0 8rpx 16rpx rgba(102, 126, 234, 0.25);
			
			.preview-header {
				display: flex;
				align-items: center;
				gap: 8rpx;
				margin-bottom: 12rpx;
				
				.preview-title {
					font-size: 26rpx;
					color: rgba(255, 255, 255, 0.9);
					font-weight: 500;
				}
			}
			
			.preview-text {
				display: block;
				font-size: 26rpx;
				color: rgba(255, 255, 255, 0.85);
				line-height: 1.6;
				margin-bottom: 8rpx;
				
				&.highlight {
					font-size: 28rpx;
					color: #fff;
					font-weight: 600;
					margin-top: 4rpx;
				}
			}
		}
		
		.tip {
			display: block;
			font-size: 24rpx;
			color: #999;
			line-height: 1.5;
			padding: 10rpx 20rpx;
			background-color: #f0f9ff;
			border-left: 4rpx solid #2196F3;
			border-radius: 4rpx;
			margin-top: 12rpx;
		}
		
		// 买断配置区域
		.buyout-config {
			margin-top: 12rpx;
			padding: 20rpx;
			background-color: #fffbf0;
			border-radius: 12rpx;
			border-left: 4rpx solid #FFB800;
			
			.buyout-type-tabs {
				display: flex;
				gap: 12rpx;
				flex: 1;
				
				.type-tab {
					flex: 1;
					height: 60rpx;
					display: flex;
					align-items: center;
					justify-content: center;
					background-color: #fff;
					border: 2rpx solid #e0e0e0;
					border-radius: 8rpx;
					transition: all 0.3s;
					
					text {
						font-size: 26rpx;
						color: #666;
						font-weight: 400;
					}
					
					&.active {
						background: linear-gradient(135deg, #FFB800 0%, #FF8C00 100%);
						border-color: #FFB800;
						box-shadow: 0 4rpx 12rpx rgba(255, 184, 0, 0.3);
						
						text {
							color: #fff;
							font-weight: 600;
						}
					}
				}
			}
			
			.buyout-preview {
				padding: 20rpx;
				background: linear-gradient(135deg, #FFB800 0%, #FF8C00 100%);
				border-radius: 12rpx;
				margin-top: 20rpx;
				box-shadow: 0 8rpx 16rpx rgba(255, 184, 0, 0.25);
				
				.preview-row {
					display: flex;
					align-items: center;
					justify-content: space-between;
					margin-bottom: 8rpx;
					
					&:last-child {
						margin-bottom: 0;
					}
					
					.preview-label {
						font-size: 26rpx;
						color: rgba(255, 255, 255, 0.85);
					}
					
					.preview-value {
						font-size: 28rpx;
						color: rgba(255, 255, 255, 0.9);
						font-weight: 500;
						
						&.buyout {
							font-size: 36rpx;
							color: #fff;
							font-weight: 700;
						}
					}
					
					&.highlight {
						background-color: rgba(255, 255, 255, 0.15);
						padding: 8rpx 12rpx;
						border-radius: 8rpx;
					}
				}
			}
		}
		
		// 买断功能提示样式
		.buyout-tip {
			display: flex;
			align-items: flex-start;
			gap: 8rpx;
			margin-top: 8rpx;
			padding: 12rpx;
			background: #FFF3CD;
			border-radius: 8rpx;
			font-size: 24rpx;
			color: #856404;
			line-height: 1.6;
			
			.uni-icons {
				flex-shrink: 0;
				margin-top: 2rpx;
			}
		}
	}
}
</style>