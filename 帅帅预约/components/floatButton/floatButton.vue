<script setup>
	const props = defineProps( {
		// 按钮大小
		size: {
			type: Number,
			default: 50
		},
		// 按钮位置
		position: {
			type: Object,
			default: ( ) => ( {
				bottom: '100rpx',
				right: '30rpx'
			} )
		}
	} )

	// 点击事件
	const emit = defineEmits( [ 'click' ] )
	const handleClick = ( ) => {
		emit( 'click' )
	}
</script>

<template>
	<view class="float-button" :style="{
			  width: size + 'rpx',
			  height: size + 'rpx',
			  bottom: position.bottom,
			  right: position.right
		  }" @click="handleClick">
		<view class="plus">+</view>
	</view>
</template>

<style lang="scss" scoped>
	.float-button {
		position: fixed;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 4rpx;
		background-color: $pyq-vi-color;
		border-radius: 50%;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
		z-index: 999;
		transition: all 0.3s;

		/* + 号的样式*/
		.plus {
			padding-top: 4rpx;
			color: #fff;
			font-weight: bold;
			font-size: 56rpx;
		}
	}
</style>