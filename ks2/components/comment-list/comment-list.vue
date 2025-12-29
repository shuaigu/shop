<script setup>
	import { useUserInfoStore } from "@/store/user.js"
	import formatTime from '@/utils/formatTime.js'
	const userStore = useUserInfoStore()

	// 定义组件属性
	const props = defineProps( {
		comments: {
			type: Array,
			default: ( ) => [ ]
		}
	} )

	// 定义事件
	const emit = defineEmits( [ 'delComment', 'likeComment' ] )

	// 判断是否可以删除评论（用户是评论作者）
	const canDelete = ( comment ) => {
		return comment.user_id === userStore.userInfo.uid
	}

	// 处理删除评论
	const handleDeleteComment = ( commentId ) => {
		emit( 'delComment', commentId )
	}

	// 处理点赞
	const handleLike = (commentId) => {
		// 找到要更新的评论
		const comment = props.comments.find(item => item._id === commentId)
		if (!comment) return
		
		// 防止重复点击
		if (comment._liking) return
		comment._liking = true
		
		// 立即更新前端状态
		comment.isLiked = !comment.isLiked
		comment.likeCount = comment.isLiked ? (comment.likeCount || 0) + 1 : (comment.likeCount || 1) - 1
		
		// 异步处理后端逻辑
		emit('likeComment', commentId)
			.catch(() => {
				// 发生错误时回滚状态
				comment.isLiked = !comment.isLiked
				comment.likeCount = comment.isLiked ? (comment.likeCount || 0) + 1 : (comment.likeCount || 1) - 1
				uni.showToast({
					title: '操作失败，请重试',
					icon: 'none'
				})
			})
			.finally(() => {
				comment._liking = false
			})
	}
</script>

<template>
	<view class="comment-list">
		<view class="comment-title">评论 {{comments.length}}</view>
		<view v-for="comment in comments" :key="comment._id" class="comment-item">
			<view class="comment-header">
				<image class="avatar" :src="comment.avatarUrl" mode="aspectFill" />
				<view class="user-info">
					<text class="nickname">{{ comment.nickName }}</text>
				</view>
				<view class="like-btn" @click.stop="handleLike(comment._id)">
					<uni-icons 
						:type="comment.isLiked ? 'heart-filled' : 'heart'" 
						:color="comment.isLiked ? '#ff5d5d' : '#999'"
						size="18"
					/>
					<text :class="{'liked': comment.isLiked}">{{ comment.likeCount || '' }}</text>
				</view>
			</view>
			
			<view class="comment-content">
				{{ comment.content }}
				<text class="time1">{{ formatTime(comment.create_time) }}</text>
			</view>
			
			<view class="comment-footer">
				<!-- <text class="reply-btn">回复</text> -->
				<view class="delete-btn" 
					v-if="canDelete(comment)" 
					@click.stop="handleDeleteComment(comment._id)"
				>
					<uni-icons type="trash" size="16" color="#999" />
				</view>
			</view>
		</view>
	</view>
</template>

<style lang="scss" scoped>
	/*评论列表*/
	.comment-list {
		padding: 0 35rpx 35rpx 35rpx;
		
		.comment-title {
			font-size: 32rpx;
			font-weight: 500;
			color: #333;
			margin-bottom: 20rpx;
		}

		.comment-item {
			margin-bottom: 40rpx;
			
			.comment-header {
				display: flex;
				align-items: center;
				margin-bottom: 16rpx;
				
				.avatar {
					width: 64rpx;
					height: 64rpx;
					border-radius: 50%;
					margin-right: 16rpx;
				}
				
				.user-info {
					flex: 1;
					
					.nickname {
						font-size: 28rpx;
						color: #333;
						font-weight: 500;
						display: block;
					}
					
					.time {
						font-size: 24rpx;
						color: #999;
						margin-top: 4rpx;
						display: block;
					}
				}

				.like-btn {
					display: flex;
					align-items: center;
					padding: 8rpx;
					
					text {
						font-size: 24rpx;
						color: #999;
						margin-left: 4rpx;
						
						&.liked {
							color: #ff5d5d;
						}
					}
				}
			}
			
			.comment-content {
				font-size: 35rpx;
				color: #333;
				line-height: 1.5;
				margin: 16rpx 0;
				padding-left: 80rpx;
				.time1{
					font-size: 24rpx;
					color: #999;
				}
			}
			
			.comment-footer {
				display: flex;
				justify-content: space-between;
				align-items: center;
				padding-left: 80rpx;
				
				.reply-btn {
					font-size: 24rpx;
					color: #999;
					padding: 8rpx 0;
				}
				
				.delete-btn {
					padding: 8rpx;
				}
			}
		}
	}
</style>