<template>
	<view class="container">
		<view class="header">
			<text class="title">加入我们的粉丝群</text>
		</view>
		
		<view class="group-info">
			<text class="group-desc">加入我们的官方粉丝群，获取最新资讯、活动和福利！</text>
		</view>
		
		<view class="join-section">
			<button 
				open-type="joinGroup" 
				group-id="CgYIASAHKAESTgpMPxsfnWvXJ61q6Eun6E6R/pZOQXqOK93pt9RbaamdIKv8hWML07CE8p7UrP6JX+XO7emnzmu+LFuaNy62FR6ye20jDcp/UPy2SaOrbBoA"
				@joingroup="handleJoinGroup"
				class="btn-join"
			>
				立即加入粉丝群
			</button>
		</view>
	</view>
</template>

<script setup>
import { ref } from 'vue';

// 加入群聊回调
const handleJoinGroup = (e) => {
	console.log('加入群聊回调', e.detail);
	if (e.detail.errNo === 0) {
		uni.showToast({
			title: '加入群聊成功',
			icon: 'success'
		});
	} else {
		uni.showToast({
			title: '加入失败: ' + e.detail.errMsg,
			icon: 'none'
		});
	}
};
</script>

<style>
.container {
	padding: 40rpx;
	display: flex;
	flex-direction: column;
	align-items: center;
}

.header {
	margin-bottom: 60rpx;
	text-align: center;
}

.title {
	font-size: 40rpx;
	font-weight: bold;
	color: #333;
}

.group-info {
	margin-bottom: 80rpx;
	text-align: center;
}

.group-desc {
	font-size: 32rpx;
	color: #666;
	line-height: 1.6;
}

.join-section {
	width: 100%;
}

.btn-join {
	background-color: #07C160;
	color: #FFFFFF;
	width: 90%;
	height: 90rpx;
	line-height: 90rpx;
	font-size: 32rpx;
	border-radius: 45rpx;
	margin-top: 30rpx;
	font-weight: bold;
}
</style>
