<template>
	<view class="watermark-demo-page">
		<view class="demo-header">
			<text class="header-title">水印功能使用示例</text>
		</view>
		
		<!-- 示例1: 列表图片自动添加水印 -->
		<view class="demo-section">
			<view class="section-title">
				<text class="title-text">示例1：列表图片自动添加水印</text>
			</view>
			<view class="section-content">
				<view class="image-item" v-for="(img, index) in sampleImages" :key="index">
					<image 
						class="demo-image" 
						:src="getWatermarkedImageUrl(img)" 
						mode="aspectFill"
					></image>
				</view>
			</view>
			<view class="code-block">
				<text class="code-title">代码示例：</text>
				<text class="code-content">
import { getWatermarkedImageUrl } from '@/utils/watermarkHelper.js'

// 在模板中使用
&lt;image :src="getWatermarkedImageUrl(imageUrl)" /&gt;
				</text>
			</view>
		</view>
		
		<!-- 示例2: 自定义水印参数 -->
		<view class="demo-section">
			<view class="section-title">
				<text class="title-text">示例2：自定义水印参数</text>
			</view>
			<view class="section-content">
				<view class="image-item">
					<image 
						class="demo-image" 
						:src="customWatermarkUrl" 
						mode="aspectFill"
					></image>
				</view>
			</view>
			<view class="code-block">
				<text class="code-title">代码示例：</text>
				<text class="code-content">
import { addQiniuWatermark } from '@/utils/watermarkHelper.js'

// 自定义水印配置
const watermarkUrl = addQiniuWatermark(imageUrl, {
  type: 'text',
  text: '自定义水印',
  fontSize: 20,
  opacity: 70,
  position: 'SouthEast',
  dx: 20,
  dy: 20
})
				</text>
			</view>
		</view>
		
		<!-- 示例3: 批量添加水印 -->
		<view class="demo-section">
			<view class="section-title">
				<text class="title-text">示例3：批量添加水印</text>
			</view>
			<view class="section-content">
				<view class="image-item" v-for="(img, index) in batchImages" :key="index">
					<image 
						class="demo-image" 
						:src="img" 
						mode="aspectFill"
					></image>
				</view>
			</view>
			<view class="code-block">
				<text class="code-title">代码示例：</text>
				<text class="code-content">
import { batchAddWatermark } from '@/utils/watermarkHelper.js'

// 批量处理图片数组
const imageUrls = [...] // 原始图片数组
const watermarkedUrls = batchAddWatermark(imageUrls, {
  text: '批量水印',
  opacity: 60
})
				</text>
			</view>
		</view>
		
		<!-- 示例4: 在domainConfig中集成 -->
		<view class="demo-section">
			<view class="section-title">
				<text class="title-text">示例4：全局启用水印</text>
			</view>
			<view class="section-content">
				<view class="config-info">
					<view class="info-item">
						<text class="info-label">当前状态：</text>
						<text class="info-value" :class="watermarkEnabled ? 'enabled' : 'disabled'">
							{{ watermarkEnabled ? '已启用' : '未启用' }}
						</text>
					</view>
					<button class="toggle-button" @click="toggleWatermark">
						{{ watermarkEnabled ? '关闭水印' : '开启水印' }}
					</button>
				</view>
			</view>
			<view class="code-block">
				<text class="code-title">代码示例：</text>
				<text class="code-content">
import { setWatermarkEnabled, addListImageParams } from '@/utils/domainConfig.js'

// 启用全局水印
setWatermarkEnabled(true)

// 使用addListImageParams会自动添加水印（如果全局已启用）
const processedUrl = addListImageParams(imageUrl)
				</text>
			</view>
		</view>
		
		<!-- 配置说明 -->
		<view class="demo-section">
			<view class="section-title">
				<text class="title-text">水印参数说明</text>
			</view>
			<view class="param-table">
				<view class="param-row header">
					<text class="param-name">参数名</text>
					<text class="param-type">类型</text>
					<text class="param-desc">说明</text>
				</view>
				<view class="param-row" v-for="(param, index) in paramList" :key="index">
					<text class="param-name">{{ param.name }}</text>
					<text class="param-type">{{ param.type }}</text>
					<text class="param-desc">{{ param.desc }}</text>
				</view>
			</view>
		</view>
	</view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { getWatermarkedImageUrl, addQiniuWatermark, batchAddWatermark } from '@/utils/watermarkHelper.js'
import { setWatermarkEnabled, getWatermarkEnabled } from '@/utils/domainConfig.js'

// 示例图片URL（使用项目中的实际图片）
const sampleImages = ref([
	'https://aly2.jingle0350.cn/test/sample1.jpg',
	'https://aly2.jingle0350.cn/test/sample2.jpg',
	'https://aly2.jingle0350.cn/test/sample3.jpg'
])

// 自定义水印示例
const customWatermarkUrl = computed(() => {
	return addQiniuWatermark('https://aly2.jingle0350.cn/test/sample1.jpg', {
		type: 'text',
		text: '自定义水印',
		fontSize: 20,
		opacity: 70,
		position: 'SouthEast',
		dx: 20,
		dy: 20
	})
})

// 批量水印示例
const batchImages = computed(() => {
	return batchAddWatermark(sampleImages.value, {
		text: '批量水印',
		opacity: 60
	})
})

// 水印启用状态
const watermarkEnabled = ref(false)

// 切换水印状态
const toggleWatermark = () => {
	watermarkEnabled.value = !watermarkEnabled.value
	setWatermarkEnabled(watermarkEnabled.value)
	
	uni.showToast({
		title: watermarkEnabled.value ? '水印已启用' : '水印已关闭',
		icon: 'success'
	})
}

// 参数列表
const paramList = [
	{ name: 'type', type: 'string', desc: '水印类型：text(文字) | image(图片)' },
	{ name: 'text', type: 'string', desc: '水印文字内容' },
	{ name: 'fontSize', type: 'number', desc: '字体大小（px）' },
	{ name: 'opacity', type: 'number', desc: '透明度 0-100' },
	{ name: 'position', type: 'string', desc: '位置：SouthEast(右下角)等' },
	{ name: 'dx', type: 'number', desc: 'X轴偏移量（px）' },
	{ name: 'dy', type: 'number', desc: 'Y轴偏移量（px）' },
	{ name: 'color', type: 'string', desc: '文字颜色（十六进制）' }
]

// 页面加载时获取水印状态
onMounted(() => {
	watermarkEnabled.value = getWatermarkEnabled()
})
</script>

<style lang="scss" scoped>
.watermark-demo-page {
	min-height: 100vh;
	background-color: #f5f5f5;
	padding-bottom: 40rpx;
}

.demo-header {
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	padding: 60rpx 40rpx 40rpx;
	
	.header-title {
		display: block;
		font-size: 44rpx;
		font-weight: bold;
		color: #ffffff;
	}
}

.demo-section {
	background-color: #ffffff;
	margin-top: 24rpx;
	padding: 32rpx;
	
	.section-title {
		margin-bottom: 24rpx;
		padding-bottom: 16rpx;
		border-bottom: 2rpx solid #e8e8e8;
		
		.title-text {
			font-size: 32rpx;
			font-weight: bold;
			color: #333333;
		}
	}
	
	.section-content {
		display: flex;
		flex-wrap: wrap;
		gap: 16rpx;
		
		.image-item {
			width: 220rpx;
			height: 220rpx;
			border-radius: 8rpx;
			overflow: hidden;
			
			.demo-image {
				width: 100%;
				height: 100%;
			}
		}
		
		.config-info {
			width: 100%;
			
			.info-item {
				display: flex;
				align-items: center;
				margin-bottom: 24rpx;
				
				.info-label {
					font-size: 28rpx;
					color: #666666;
					margin-right: 16rpx;
				}
				
				.info-value {
					font-size: 28rpx;
					font-weight: bold;
					
					&.enabled {
						color: #52c41a;
					}
					
					&.disabled {
						color: #ff4d4f;
					}
				}
			}
			
			.toggle-button {
				width: 200rpx;
				height: 64rpx;
				line-height: 64rpx;
				background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
				color: #ffffff;
				font-size: 28rpx;
				border-radius: 8rpx;
				border: none;
			}
		}
	}
	
	.code-block {
		margin-top: 24rpx;
		padding: 24rpx;
		background-color: #f5f5f5;
		border-radius: 8rpx;
		
		.code-title {
			display: block;
			font-size: 26rpx;
			font-weight: bold;
			color: #666666;
			margin-bottom: 12rpx;
		}
		
		.code-content {
			display: block;
			font-size: 24rpx;
			color: #333333;
			font-family: 'Courier New', monospace;
			line-height: 1.6;
			white-space: pre-wrap;
		}
	}
	
	.param-table {
		width: 100%;
		
		.param-row {
			display: flex;
			padding: 16rpx 0;
			border-bottom: 1rpx solid #e8e8e8;
			
			&.header {
				font-weight: bold;
				color: #333333;
				background-color: #f5f5f5;
				padding: 16rpx 12rpx;
			}
			
			.param-name {
				flex: 0 0 180rpx;
				font-size: 26rpx;
				color: #333333;
			}
			
			.param-type {
				flex: 0 0 120rpx;
				font-size: 26rpx;
				color: #666666;
			}
			
			.param-desc {
				flex: 1;
				font-size: 26rpx;
				color: #999999;
			}
		}
	}
}
</style>
