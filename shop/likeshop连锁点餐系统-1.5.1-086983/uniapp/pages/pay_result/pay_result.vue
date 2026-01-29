

<template>
	<view class="pay-result">
		<view class="contain bg-white">
			<view class="header flex-col col-center">
				<view>
					<image class="tips-icon" src="/static/images/icon_success.png"></image>
				</view>
				<view class="xl m-t-20">订单支付成功</view>
			</view>
			<view class="info">
				<view class="order-num flex row-between m-t-20">
					<view>订单编号</view>
					<view>
						{{payInfo.order_sn}}
					</view>
				</view>
				<view v-if="payInfo.pay_time" class="order-time flex row-between m-t-20">
					<view>付款时间</view>
					<view>{{payInfo.pay_time}}</view>
				</view>
				<view class="order-pay-type flex row-between m-t-20">
					<view>支付方式</view>
					<view>{{payInfo.pay_way}}</view>
				</view>
				<view class="order-pay-money flex row-between m-t-20">
					<view>支付金额</view>
					<view>
						<!-- <price-format :price="payInfo.total_amount"></price-format> -->
					</view>
				</view>
			</view>
			<view class="line m-t-40"></view>
			<view class="m-t-40 flex-col row-center">
				<router-link to="/bundle/pages/user_order/user_order" navType="replace">
					<button type="primary" size="lg" class="br60">查看订单</button>
				</router-link>
				<router-link  navType="pushTab" to="/pages/index/index">
					<button size="lg" class="br60 plain primary m-t-30">返回首页</button>
				</router-link>
			</view>
		</view>
	</view>
</template>

<script>
	import {
		getPayResult
	} from '@/api/order';
	export default {
		data() {
			return {
				payInfo: {}
			};
		},

		onLoad: function(options) {
			this.id = this.$Route.query.id;
			this.getOrderResultFun();
		},


		methods: {
			getOrderResultFun() {
				getPayResult(this.id).then(res => {
					if (res.code == 1) {
						this.payInfo = res.data
					}
				});
			},

		}
	};
</script>
<style lang="scss">
	.pay-result {
		.contain {
			border-radius: 10rpx;
			padding: 0 30rpx 40rpx;
			position: relative;
			margin: 78rpx 20rpx 0;
			.tips-icon {
				width: 112rpx;
				height: 112rpx;
			}

			.header {
				position: absolute;
				left: 50%;
				transform: translateX(-50%);
				top: -50rpx;
			}
			.info {
				padding-top: 180rpx;
			}
			.line {
				border-top: $-solid-border;
			}
			.plain {
				border: 1px solid $-color-primary;
			}
		}
	}
</style>
