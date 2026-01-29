<template>
	<view>

	</view>
</template>

<script>
	import {
		getOrderDetail
	} from '@/api/order';
	import {
		prepay
	} from '@/api/app';
	import {
		wxpay,
		alipay
	} from '@/utils/pay'

	export default {
		data() {
			return {
				orderDetail: {
					shop: {}
				},
				team: {},
				isFirstLoading: true,
				type: 0,
				cancelTime: 0,
				showCancel: "",
				showLoading: false
			};
		},

		onLoad: function(options) {
			const {
				id
			} = this.$Route.query;
			this.id = id;
			this.getOrderDetailFun();
		},

		methods: {
			onRefresh() {
				uni.$emit("refreshorder")
				const {
					type
				} = this
				if ([0, 2].includes(type)) {
					this.getOrderDetailFun();
				} else if (type == 1) {
					setTimeout(() => {
						uni.navigateBack()
					}, 2000)
				}
			},
			orderDialog() {
				this.$refs.orderDialog.open()
			},

			delOrder() {
				this.type = 1
				this.$nextTick(() => {
					this.orderDialog();
				});
			},

			comfirmOrder() {
				this.type = 2
				this.$nextTick(() => {
					this.orderDialog();
				});
			},

			cancelOrder() {
				this.type = 0
				this.$nextTick(() => {
					this.orderDialog();
				});
			},

			payNow() {
				uni.$on('payment', params => {
					setTimeout(() => {
						if (params.result) {
							this.$toast({ title: "支付成功" })
							this.getOrderDetailFun();
							uni.$emit("refreshorder")
							uni.$off("payment")
						} else {
							this.$toast({ title: "支付失败" })
						}
					}, 500)
				})
				
				uni.navigateTo({
					url: `/pages/payment/payment?from=${'order'}&order_id=${this.id}`
				})
			},

			getOrderDetailFun() {
				getOrderDetail(this.id).then(res => {
					if (res.code == 1) {
						this.cancelTime = res.data.order_cancel_time - Date.now() / 1000;
						this.orderDetail = res.data
						this.team = res.data.team || {}
						this.$nextTick(() => {
							this.isFirstLoading = false
						});
					} else {
						setTimeout(() => uni.navigateBack(), 1500)
					}
				});
			},
		},
		computed: {

		}
	};
</script>
<style lang="scss">
	.bt {
		width: 100%;
		text-align: right;
	}

	.order-details {
		position: relative;
		padding-bottom: calc(120rpx + env(safe-area-inset-bottom));
	}

	.order-details .header-bg {
		position: absolute;
		top: 0;
		width: 100%;
		height: 200rpx;
		background-color: $-color-primary;
		z-index: 0;
	}

	.order-details .goods .status {
		height: 88rpx;
		padding: 0 20rpx;
	}

	.order-details .main {
		position: relative;
		z-index: 1;
	}

	.order-details .contain {
		margin: 0 20rpx 20rpx;
		border-radius: 14rpx;
		background-color: #fff;
	}

	.order-details .header {
		padding: 24rpx 40rpx;
		box-sizing: border-box;
	}

	.order-details .img-line {
		height: 1.5px;
		width: 100%;
		display: block;
	}

	.order-details .address-wrap {
		height: 164rpx;
		padding: 0 24rpx;
	}

	.order-details .order-info {
		padding: 12rpx 0;
	}

	.order-details .order-info .item {
		padding: 12rpx 24rpx;
	}

	.order-details .order-info .item .title {
		width: 180rpx;
		flex: none;
	}

	.order-details .price>view {
		height: 60rpx;
		padding: 0 24rpx;
	}

	.order-details .footer {
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		height: 100rpx;
		padding: 0 24rpx;
		box-sizing: content-box;
		padding-bottom: env(safe-area-inset-bottom);
	}

	.footer .plain {
		border: 1px solid #BBBBBB;
	}

	.footer .plain.red {
		border: 1px solid $-color-primary;
	}

	.tips-dialog {
		height: 230rpx;
		width: 100%;
	}

	.order-details .invite-btn {
		background: linear-gradient(270deg, #FF2C3C 0%, #F95F2F 100%);
		margin: 30rpx 26rpx 40rpx;
	}
</style>
