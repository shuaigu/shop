<script setup>
	import { useUserInfoStore } from '@/store/user'

	const userStore = useUserInfoStore( )
	// 定义组件属性
	const props = defineProps( {
		// 用户头像
		userInfo: {
			type: Object,
			defalut: ( ) => {

			}
		},
		// 文章总数
		articleTotal: {
			type: Number,
			default: 0
		},
		// 点赞总数
		likesTotal: {
			type: Number,
			default: 0
		}
	} )
	// 定义事件
	const emit = defineEmits( [ 'contact' ] )

	// 处理联系按钮点击
	const handleContact = ( ) => {
		emit( 'contact' )
	}
</script>

<template>
	<view class="headInfo">
		<view class="left">
			<!-- 用户头像和昵称 -->
			<view class="avatar">
				<image :src="userInfo.avatarUrl" mode="aspectFit"></image>
			</view>
			<view class="nickName">
				{{userInfo.nickName}}
			</view>
		</view>
		<view class="right">
			<!-- 文章信息 -->
			<view class="top">
				<!-- 总发帖 -->
				<view class="articleInfo">
					<view class="articleNum">
						{{articleTotal}}
					</view>
					<view class="textValue">
						总发帖
					</view>
				</view>
				<!-- 总点赞 -->
				<view class="articleLikes">
					<view class="likesTotal">
						{{likesTotal}}
					</view>
					<view class="textValue">
						总点赞
					</view>
				</view>
			</view>
			<!-- 联系方式 -->
			<view class="contarctBtn" @click="handleContact">
				联系方式
			</view>
		</view>
	</view>
</template>

<style lang="scss" scoped>
	/*头部*/
	.headInfo {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 80rpx;
		height: 376rpx;
		background-color: #fff;

		.left {
			display: flex;
			flex-direction: column;
			align-items: center;
			margin-right: 64rpx;

			/*头像*/
			.avatar {
				margin-bottom: 16rpx;
				width: 180rpx;
				height: 180rpx;
				border-radius: 50%;
				overflow: hidden;
			}

			.nickName {
				font-size: 28rpx;
				color: $pyq-text-color-body;
				@include textShenglue(1)
			}
		}

		.right {
			display: flex;
			flex-direction: column;
			justify-content: space-between;
			width: 320rpx;
			align-items: center;

			.top {
				display: flex;

				/*发帖*/
				.articleInfo {
					@include textBaseStyle;
				}

				/*总点赞*/
				.articleLikes {
					@include textBaseStyle;
				}
			}

			/*联系方式按钮样式*/
			.contarctBtn {
				margin-top: 32rpx;
				padding: 16rpx 24rpx;
				width: 100%;
				text-align: center;
				background-color: $pyq-vi-color;
				color: #fff;
				border-radius: 32rpx;
				cursor: pointer;

				&:active {
					opacity: 0.8;
				}
			}
		}
	}
</style>