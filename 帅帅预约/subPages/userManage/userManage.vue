<script setup>
	import { ref, onMounted } from 'vue'
	
	// 用户列表
	const userList = ref([])
	// 用户管理API
	const userApi = uniCloud.importObject('user', { customUI: true })
	
	// 获取用户列表
	const getUserList = async () => {
		try {
			const res = await userApi.getUserList()
			userList.value = res.data
		} catch (err) {
			uni.showToast({
				title: '获取用户列表失败',
				icon: 'none'
			})
		}
	}
	
	// 设置用户VIP权限
	const setUserVip = async (userId, isVip) => {
		try {
			await userApi.setUserVip(userId, isVip)
			uni.showToast({
				title: isVip ? '设置VIP成功' : '取消VIP成功',
				icon: 'success'
			})
			// 刷新用户列表
			getUserList()
		} catch (err) {
			uni.showToast({
				title: '操作失败',
				icon: 'none'
			})
		}
	}
	
	// 页面加载时获取用户列表
	onMounted(() => {
		getUserList()
	})
</script>

<template>
	<view class="userManage">
		<view class="header">
			<text class="title">用户权限管理</text>
		</view>
		
		<view class="content">
			<view class="user-item" v-for="user in userList" :key="user._id">
				<view class="user-info">
					<image class="avatar" :src="user.avatarUrl" mode="aspectFill"></image>
					<view class="details">
						<text class="nickname">{{user.nickName}}</text>
						<text class="mobile">{{user.mobile}}</text>
					</view>
				</view>
				<view class="actions">
					<text class="vip-tag" v-if="user.isVip">VIP</text>
					<button class="btn" 
						:class="user.isVip ? 'btn-danger' : 'btn-primary'"
						@click="setUserVip(user._id, !user.isVip)">
						{{user.isVip ? '取消VIP' : '设置VIP'}}
					</button>
				</view>
			</view>
		</view>
	</view>
</template>

<style lang="scss" scoped>
.userManage {
	min-height: 100vh;
	background-color: #f7f7f7;
	
	.header {
		padding: 20rpx;
		background-color: #fff;
		border-bottom: 1px solid #eee;
		
		.title {
			font-size: 32rpx;
			font-weight: bold;
			color: #333;
		}
	}
	
	.content {
		padding: 20rpx;
		
		.user-item {
			display: flex;
			justify-content: space-between;
			align-items: center;
			padding: 20rpx;
			margin-bottom: 20rpx;
			background-color: #fff;
			border-radius: 12rpx;
			
			.user-info {
				display: flex;
				align-items: center;
				
				.avatar {
					width: 80rpx;
					height: 80rpx;
					border-radius: 50%;
					margin-right: 20rpx;
				}
				
				.details {
					display: flex;
					flex-direction: column;
					
					.nickname {
						font-size: 28rpx;
						color: #333;
						margin-bottom: 8rpx;
					}
					
					.mobile {
						font-size: 24rpx;
						color: #999;
					}
				}
			}
			
			.actions {
				display: flex;
				align-items: center;
				
				.vip-tag {
					margin-right: 20rpx;
					padding: 4rpx 12rpx;
					font-size: 24rpx;
					color: #fff;
					background-color: #FFB800;
					border-radius: 8rpx;
				}
				
				.btn {
					padding: 8rpx 24rpx;
					font-size: 24rpx;
					border-radius: 8rpx;
					
					&.btn-primary {
						color: #fff;
						background-color: #007AFF;
					}
					
					&.btn-danger {
						color: #fff;
						background-color: #FF3B30;
					}
				}
			}
		}
	}
}
</style> 