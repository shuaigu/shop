<template>
	<view class="watermark-config-page">
		<!-- 页面标题 -->
		<view class="page-header">
			<text class="header-title">水印配置</text>
			<text class="header-subtitle">管理图片水印设置</text>
		</view>
		
		<!-- 配置表单 -->
		<view class="config-form">
			<!-- 启用开关 -->
			<view class="form-item">
				<view class="item-label">
					<uni-icons type="checkmarkempty" size="20" color="#1890ff"></uni-icons>
					<text class="label-text">启用水印</text>
				</view>
				<view class="item-control">
					<switch :checked="config.enabled" @change="handleEnabledChange" color="#1890ff"></switch>
				</view>
			</view>
			
			<!-- 水印类型 -->
			<view class="form-item">
				<view class="item-label">
					<uni-icons type="gear" size="20" color="#52c41a"></uni-icons>
					<text class="label-text">水印类型</text>
				</view>
				<view class="item-control">
					<picker mode="selector" :range="typeOptions" :value="typeIndex" @change="handleTypeChange">
						<view class="picker-value">{{typeOptions[typeIndex]}}</view>
					</picker>
				</view>
			</view>
			
			<!-- 文字水印内容 -->
			<view class="form-item" v-if="config.type === 'text'">
				<view class="item-label">
					<uni-icons type="compose" size="20" color="#fa8c16"></uni-icons>
					<text class="label-text">水印文字</text>
				</view>
				<view class="item-control">
					<input class="text-input" v-model="config.text" placeholder="请输入水印文字" />
				</view>
			</view>
			
			<!-- 字体大小 -->
			<view class="form-item" v-if="config.type === 'text'">
				<view class="item-label">
					<uni-icons type="font" size="20" color="#722ed1"></uni-icons>
					<text class="label-text">字体大小</text>
					<text class="label-value">{{config.fontSize}}px</text>
				</view>
				<view class="item-control slider-control">
					<slider :value="config.fontSize" @change="handleFontSizeChange" min="10" max="50" block-size="16" activeColor="#722ed1"></slider>
				</view>
			</view>
			
			<!-- 透明度 -->
			<view class="form-item">
				<view class="item-label">
					<uni-icons type="eye" size="20" color="#13c2c2"></uni-icons>
					<text class="label-text">透明度</text>
					<text class="label-value">{{config.opacity}}%</text>
				</view>
				<view class="item-control slider-control">
					<slider :value="config.opacity" @change="handleOpacityChange" min="0" max="100" block-size="16" activeColor="#13c2c2"></slider>
				</view>
			</view>
			
			<!-- 位置 -->
			<view class="form-item">
				<view class="item-label">
					<uni-icons type="location" size="20" color="#eb2f96"></uni-icons>
					<text class="label-text">水印位置</text>
				</view>
				<view class="item-control">
					<picker mode="selector" :range="positionOptions" :value="positionIndex" @change="handlePositionChange">
						<view class="picker-value">{{positionOptions[positionIndex]}}</view>
					</picker>
				</view>
			</view>
			
			<!-- X轴偏移 -->
			<view class="form-item">
				<view class="item-label">
					<uni-icons type="arrowright" size="20" color="#faad14"></uni-icons>
					<text class="label-text">X轴偏移</text>
					<text class="label-value">{{config.dx}}px</text>
				</view>
				<view class="item-control slider-control">
					<slider :value="config.dx" @change="handleDxChange" min="0" max="100" block-size="16" activeColor="#faad14"></slider>
				</view>
			</view>
			
			<!-- Y轴偏移 -->
			<view class="form-item">
				<view class="item-label">
					<uni-icons type="arrowdown" size="20" color="#2f54eb"></uni-icons>
					<text class="label-text">Y轴偏移</text>
					<text class="label-value">{{config.dy}}px</text>
				</view>
				<view class="item-control slider-control">
					<slider :value="config.dy" @change="handleDyChange" min="0" max="100" block-size="16" activeColor="#2f54eb"></slider>
				</view>
			</view>
			
			<!-- 预览区域 -->
			<view class="preview-section">
				<view class="preview-header">
					<uni-icons type="eye" size="18" color="#1890ff"></uni-icons>
					<text class="preview-title">效果预览</text>
				</view>
				<view class="preview-container">
					<image class="preview-image" :src="previewImageUrl" mode="aspectFit"></image>
					<view class="watermark-overlay" :style="watermarkStyle" v-if="config.enabled && config.type === 'text'">
						<text class="watermark-text">{{config.text}}</text>
					</view>
				</view>
			</view>
		</view>
		
		<!-- 保存按钮 -->
		<view class="save-button-container">
			<button class="save-button" type="primary" @click="handleSave">保存配置</button>
			<button class="reset-button" @click="handleReset">恢复默认</button>
		</view>
	</view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { setWatermarkEnabled, updateWatermarkConfig } from '@/utils/domainConfig.js'

// 配置数据
const config = ref({
	enabled: true,  // 默认启用水印
	type: 'text',
	text: '本站专属',
	fontSize: 30,  // 与 imagePreview.js 中的默认值一致
	opacity: 90,   // 与 imagePreview.js 中的默认值一致
	position: 'SouthEast',
	dx: 20,        // 与 imagePreview.js 中的默认值一致
	dy: 20,        // 与 imagePreview.js 中的默认值一致
	color: '#FFFFFF'
})

// 类型选项
const typeOptions = ['文字水印', '图片水印']
const typeIndex = computed(() => {
	return config.value.type === 'text' ? 0 : 1
})

// 位置选项映射
const positionOptionsMap = {
	'NorthWest': '左上角',
	'North': '顶部居中',
	'NorthEast': '右上角',
	'West': '左侧居中',
	'Center': '正中央',
	'East': '右侧居中',
	'SouthWest': '左下角',
	'South': '底部居中',
	'SouthEast': '右下角'
}

const positionOptions = Object.values(positionOptionsMap)
const positionKeys = Object.keys(positionOptionsMap)

const positionIndex = computed(() => {
	return positionKeys.indexOf(config.value.position)
})

// 预览图片URL（使用项目中的占位图）
const previewImageUrl = ref('/static/images/占位图.png')

// 水印样式（用于预览）
const watermarkStyle = computed(() => {
	const positions = {
		'NorthWest': { top: config.value.dy + 'px', left: config.value.dx + 'px' },
		'North': { top: config.value.dy + 'px', left: '50%', transform: 'translateX(-50%)' },
		'NorthEast': { top: config.value.dy + 'px', right: config.value.dx + 'px' },
		'West': { top: '50%', left: config.value.dx + 'px', transform: 'translateY(-50%)' },
		'Center': { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' },
		'East': { top: '50%', right: config.value.dx + 'px', transform: 'translateY(-50%)' },
		'SouthWest': { bottom: config.value.dy + 'px', left: config.value.dx + 'px' },
		'South': { bottom: config.value.dy + 'px', left: '50%', transform: 'translateX(-50%)' },
		'SouthEast': { bottom: config.value.dy + 'px', right: config.value.dx + 'px' }
	}
	
	return {
		...positions[config.value.position],
		fontSize: config.value.fontSize + 'px',
		opacity: config.value.opacity / 100,
		color: config.value.color
	}
})

// 事件处理
const handleEnabledChange = (e) => {
	config.value.enabled = e.detail.value
}

const handleTypeChange = (e) => {
	const index = e.detail.value
	config.value.type = index === 0 ? 'text' : 'image'
}

const handleFontSizeChange = (e) => {
	config.value.fontSize = e.detail.value
}

const handleOpacityChange = (e) => {
	config.value.opacity = e.detail.value
}

const handlePositionChange = (e) => {
	const index = e.detail.value
	config.value.position = positionKeys[index]
}

const handleDxChange = (e) => {
	config.value.dx = e.detail.value
}

const handleDyChange = (e) => {
	config.value.dy = e.detail.value
}

// 保存配置
const handleSave = () => {
	uni.showLoading({
		title: '保存中...'
	})
	
	setTimeout(() => {
		// 更新全局配置
		setWatermarkEnabled(config.value.enabled)
		updateWatermarkConfig(config.value)
		
		// 保存到本地存储
		uni.setStorageSync('watermarkConfig', config.value)
		
		uni.hideLoading()
		uni.showToast({
			title: '保存成功',
			icon: 'success',
			duration: 2000
		})
	}, 500)
}

// 恢复默认
const handleReset = () => {
	uni.showModal({
		title: '确认恢复',
		content: '确定要恢复默认配置吗？',
		success: (res) => {
			if (res.confirm) {
				config.value = {
					enabled: true,
					type: 'text',
					text: '本站专属',
					fontSize: 30,
					opacity: 90,
					position: 'SouthEast',
					dx: 20,
					dy: 20,
					color: '#FFFFFF'
				}
				
				uni.showToast({
					title: '已恢复默认',
					icon: 'success'
				})
			}
		}
	})
}

// 页面加载时读取配置
onMounted(() => {
	try {
		const savedConfig = uni.getStorageSync('watermarkConfig')
		if (savedConfig) {
			config.value = savedConfig
		}
	} catch (e) {
		console.error('读取水印配置失败:', e)
	}
})
</script>

<style lang="scss" scoped>
.watermark-config-page {
	min-height: 100vh;
	background-color: #f5f5f5;
	padding-bottom: 120rpx;
}

.page-header {
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	padding: 60rpx 40rpx 40rpx;
	
	.header-title {
		display: block;
		font-size: 44rpx;
		font-weight: bold;
		color: #ffffff;
		margin-bottom: 12rpx;
	}
	
	.header-subtitle {
		display: block;
		font-size: 28rpx;
		color: rgba(255, 255, 255, 0.8);
	}
}

.config-form {
	margin-top: 24rpx;
}

.form-item {
	background-color: #ffffff;
	padding: 32rpx;
	margin-bottom: 2rpx;
	display: flex;
	justify-content: space-between;
	align-items: center;
	
	.item-label {
		display: flex;
		align-items: center;
		flex: 1;
		
		.label-text {
			margin-left: 16rpx;
			font-size: 30rpx;
			color: #333333;
		}
		
		.label-value {
			margin-left: 16rpx;
			font-size: 28rpx;
			color: #999999;
		}
	}
	
	.item-control {
		display: flex;
		align-items: center;
		
		.picker-value {
			font-size: 28rpx;
			color: #666666;
			padding: 12rpx 24rpx;
			background-color: #f5f5f5;
			border-radius: 8rpx;
		}
		
		.text-input {
			font-size: 28rpx;
			color: #333333;
			padding: 12rpx 24rpx;
			background-color: #f5f5f5;
			border-radius: 8rpx;
			min-width: 300rpx;
			text-align: right;
		}
		
		&.slider-control {
			flex: 1;
			margin-left: 32rpx;
		}
	}
}

.preview-section {
	background-color: #ffffff;
	padding: 32rpx;
	margin-top: 24rpx;
	
	.preview-header {
		display: flex;
		align-items: center;
		margin-bottom: 24rpx;
		
		.preview-title {
			margin-left: 12rpx;
			font-size: 32rpx;
			font-weight: bold;
			color: #333333;
		}
	}
	
	.preview-container {
		position: relative;
		width: 100%;
		height: 400rpx;
		background-color: #f5f5f5;
		border-radius: 12rpx;
		overflow: hidden;
		
		.preview-image {
			width: 100%;
			height: 100%;
		}
		
		.watermark-overlay {
			position: absolute;
			padding: 8rpx 16rpx;
			background-color: rgba(0, 0, 0, 0.3);
			border-radius: 4rpx;
			
			.watermark-text {
				color: #ffffff;
				font-weight: bold;
			}
		}
	}
}

.save-button-container {
	position: fixed;
	bottom: 0;
	left: 0;
	right: 0;
	padding: 24rpx 32rpx;
	background-color: #ffffff;
	box-shadow: 0 -2rpx 12rpx rgba(0, 0, 0, 0.1);
	
	.save-button {
		width: 100%;
		height: 88rpx;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: #ffffff;
		font-size: 32rpx;
		font-weight: bold;
		border-radius: 12rpx;
		border: none;
		margin-bottom: 16rpx;
	}
	
	.reset-button {
		width: 100%;
		height: 76rpx;
		background-color: #f5f5f5;
		color: #666666;
		font-size: 28rpx;
		border-radius: 12rpx;
		border: none;
	}
}
</style>
