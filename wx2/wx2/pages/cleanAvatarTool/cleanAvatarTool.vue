<template>
	<view class="clean-tool">
		<view class="header">
			<text class="title">🔧 头像修复工具</text>
			<text class="desc">清理数据库中的临时头像路径</text>
		</view>
		
		<view class="content">
			<!-- 说明区域 -->
			<view class="info-box">
				<text class="info-title">⚠️ 重要说明</text>
				<view class="info-item">
					<text>• 此工具用于清理数据库中的临时头像路径</text>
				</view>
				<view class="info-item">
					<text>• 执行后会将所有临时路径替换为默认头像</text>
				</view>
				<view class="info-item">
					<text>• 建议在首次使用时执行一次即可</text>
				</view>
			</view>
			
			<!-- 操作按钮 -->
			<button 
				class="action-btn" 
				:disabled="loading"
				@click="executeClean">
				<text v-if="!loading">{{ buttonText }}</text>
				<text v-else>清理中...</text>
			</button>
			
			<!-- 加载状态 -->
			<view v-if="loading" class="loading-box">
				<uni-load-more status="loading" :contentText="{ contentdown: '正在清理...' }"></uni-load-more>
			</view>
			
			<!-- 结果显示 -->
			<view v-if="result && !loading" class="result-box">
				<text class="result-title">✅ 清理完成</text>
				
				<view class="result-item">
					<text class="label">总记录数：</text>
					<text class="value">{{ result.totalRecords }}</text>
				</view>
				
				<view class="result-item">
					<text class="label">成功清理：</text>
					<text class="value success">{{ result.totalSuccess }}</text>
				</view>
				
				<view class="result-item" v-if="result.totalFail > 0">
					<text class="label">失败数量：</text>
					<text class="value fail">{{ result.totalFail }}</text>
				</view>
				
				<!-- 详细结果 -->
				<view class="detail-section">
					<text class="detail-title">详细结果</text>
					<view v-for="(item, index) in result.details" :key="index" class="detail-item">
						<text class="collection-name">{{ getCollectionName(item.collection) }}</text>
						<text class="collection-count">{{ item.success }}/{{ item.total }}</text>
					</view>
				</view>
			</view>
			
			<!-- 错误显示 -->
			<view v-if="error" class="error-box">
				<text class="error-title">❌ 清理失败</text>
				<text class="error-msg">{{ error }}</text>
			</view>
		</view>
	</view>
</template>

<script setup>
	import { ref } from 'vue';
	
	const loading = ref(false);
	const result = ref(null);
	const error = ref('');
	const buttonText = ref('开始清理');
	
	// 获取集合中文名称
	const getCollectionName = (collection) => {
		const names = {
			'articleList': '文章列表',
			'viewRecord': '浏览记录',
			'user': '用户表'
		};
		return names[collection] || collection;
	};
	
	// 执行清理
	const executeClean = async () => {
		// 二次确认
		const confirmResult = await new Promise((resolve) => {
			uni.showModal({
				title: '确认清理',
				content: '确定要清理数据库中的临时头像吗？此操作不可撤销。',
				success: (res) => {
					resolve(res.confirm);
				}
			});
		});
		
		if (!confirmResult) return;
		
		try {
			loading.value = true;
			error.value = '';
			result.value = null;
			
			console.log('开始执行数据库清理...');
			
			// 调用云函数
			const articleApi = uniCloud.importObject('articleWx', { customUI: true });
			const cleanResult = await articleApi.cleanTempAvatars();
			
			console.log('清理结果:', cleanResult);
			
			if (cleanResult.code === 0 && cleanResult.data) {
				result.value = cleanResult.data.data;
				buttonText.value = '清理完成';
				
				uni.showToast({
					title: '清理成功',
					icon: 'success',
					duration: 2000
				});
			} else {
				throw new Error(cleanResult.message || '清理失败');
			}
			
		} catch (err) {
			console.error('清理失败:', err);
			error.value = err.message || '清理失败，请重试';
			buttonText.value = '重新清理';
			
			uni.showToast({
				title: '清理失败',
				icon: 'none',
				duration: 2000
			});
		} finally {
			loading.value = false;
		}
	};
</script>

<style lang="scss" scoped>
	.clean-tool {
		min-height: 100vh;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		padding: 40rpx 30rpx;
	}
	
	.header {
		text-align: center;
		margin-bottom: 40rpx;
		
		.title {
			display: block;
			font-size: 48rpx;
			font-weight: 600;
			color: #fff;
			margin-bottom: 20rpx;
		}
		
		.desc {
			display: block;
			font-size: 28rpx;
			color: rgba(255, 255, 255, 0.9);
		}
	}
	
	.content {
		background: #fff;
		border-radius: 24rpx;
		padding: 40rpx;
		box-shadow: 0 20rpx 60rpx rgba(0, 0, 0, 0.1);
	}
	
	.info-box {
		background: #fffbeb;
		border-left: 8rpx solid #f59e0b;
		padding: 30rpx;
		margin-bottom: 40rpx;
		border-radius: 12rpx;
		
		.info-title {
			display: block;
			font-size: 32rpx;
			font-weight: 600;
			color: #f59e0b;
			margin-bottom: 20rpx;
		}
		
		.info-item {
			margin-bottom: 16rpx;
			
			text {
				font-size: 28rpx;
				color: #78350f;
				line-height: 1.6;
			}
		}
	}
	
	.action-btn {
		width: 100%;
		height: 100rpx;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: #fff;
		border: none;
		border-radius: 16rpx;
		font-size: 32rpx;
		font-weight: 600;
		margin-bottom: 30rpx;
		
		&:disabled {
			opacity: 0.6;
		}
	}
	
	.loading-box {
		text-align: center;
		padding: 40rpx 0;
	}
	
	.result-box {
		background: #f0fdf4;
		border: 4rpx solid #10b981;
		padding: 30rpx;
		border-radius: 12rpx;
		margin-top: 30rpx;
		
		.result-title {
			display: block;
			font-size: 32rpx;
			font-weight: 600;
			color: #10b981;
			margin-bottom: 30rpx;
		}
		
		.result-item {
			display: flex;
			justify-content: space-between;
			align-items: center;
			padding: 20rpx 0;
			border-bottom: 1px solid #d1fae5;
			
			&:last-child {
				border-bottom: none;
			}
			
			.label {
				font-size: 28rpx;
				color: #374151;
			}
			
			.value {
				font-size: 32rpx;
				font-weight: 600;
				color: #111827;
				
				&.success {
					color: #10b981;
				}
				
				&.fail {
					color: #ef4444;
				}
			}
		}
		
		.detail-section {
			margin-top: 30rpx;
			padding-top: 30rpx;
			border-top: 2rpx solid #d1fae5;
			
			.detail-title {
				display: block;
				font-size: 28rpx;
				font-weight: 600;
				color: #374151;
				margin-bottom: 20rpx;
			}
			
			.detail-item {
				display: flex;
				justify-content: space-between;
				align-items: center;
				padding: 16rpx 24rpx;
				background: #fff;
				border-radius: 8rpx;
				margin-bottom: 12rpx;
				
				.collection-name {
					font-size: 26rpx;
					color: #6b7280;
				}
				
				.collection-count {
					font-size: 26rpx;
					font-weight: 600;
					color: #10b981;
				}
			}
		}
	}
	
	.error-box {
		background: #fef2f2;
		border: 4rpx solid #ef4444;
		padding: 30rpx;
		border-radius: 12rpx;
		margin-top: 30rpx;
		
		.error-title {
			display: block;
			font-size: 32rpx;
			font-weight: 600;
			color: #ef4444;
			margin-bottom: 20rpx;
		}
		
		.error-msg {
			display: block;
			font-size: 28rpx;
			color: #991b1b;
			line-height: 1.6;
		}
	}
</style>
