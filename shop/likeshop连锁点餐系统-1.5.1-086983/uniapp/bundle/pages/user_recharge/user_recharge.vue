<template>
	<view :data-theme="themeName">
		<view class="user-payment">
			<!-- 支付方式 -->
			<view class="pay-config">
                <view class="sm" style="color: #555;">支付方式</view>
                
                <view class="p-t-20 p-b-20 m-t-20 flex row-between">
                    <view class="pay-item">
                        <image class="m-r-15" src="../../static/btn_WeChatPay_s.png"></image>
                        <text class="nr normal">微信支付</text>
                    </view>
                    
                    <u-radio-group v-model="current">
                    	<u-radio size="36" :active-color="themeColor" shape="circle" name="1"></u-radio>
                    </u-radio-group>
                </view>
            </view>

			<!-- 推荐充值 -->
			<view class="fast-payment-container" v-if="rechargeObj.length">
				<view class="title bold normal flex">充值金额</view>
				<view class="fast-pay flex wrap">
					<view v-for="(item, index) in rechargeObj" :key="index"
						class="fast-pay-item bg-white flex-col col-center row-center"
                        :style="{'background': index==active ? 'rgba('+color(themeColor)+',.1)' : ''}"
                        :class="index==active?'chacked':''" @click="choseRechargeItem(index)">
						<view class="price bold">
							<price :content="item.recharge_amount" main-size="44rpx" minor-size="32rpx"
							    :color="index==active?themeColor:'#222'">
							</price>
                            元
						</view>
						<view class="preferential xs">{{item.tips}}</view>
					</view>
				</view>
                
                <!-- <view class="m-t-40 muted xxs">* 本服务合作方暂无提供充值发票，敬请谅解</view> -->
			</view>
            
            <view class="btns flex row-center white lg" @click="temRecharge(rechargeObj[active].id)">
                到账{{Number(rechargeObj[active].recharge_amount) + Number(rechargeObj[active].give_balance)}}元，确认充值
            </view>
            
            <view class="footer flex row-center muted nr" @click="toRechargeRecord">
                充值记录
            </view>
		</view>

		<!-- 充值成功 -->
		<u-popup class="pay-popup" v-model="showPopup" closeable round mode="center">
			<view class="content bg-white">
				<image class="img-icon" src="/static/images/icon_success.png"></image>
				<view class="xxl bold m-t-10">充值成功</view>
                
				<button class="btn" type="primary" size="md" @click="showPopup = !showPopup">好的，谢谢</button>
			</view>
		</u-popup>
		<loading-view id="van-toast" v-if="showLoading" backgroundColor="rgba(0, 0, 0, 0)"></loading-view>
		<loading-view id="van-toast" v-if="showLoadingOnload"></loading-view>
	</view>
</template>

<script>
	import {
		recharge,
		rechargeRule
	} from '@/api/user';
	import {
		prepay
	} from '@/api/app';
	import {
		wxpay
	} from '@/utils/pay';
    
    import {
        colorRgb
    } from '@/utils/tools'

	export default {
		data() {
			return {
                current: '1',
				active: 0,
				rechargeObj: [{
                    recharge_amount: 0,
                    give_balance: 0
                }],
				showPopup: false,
				showLoading: false,
                showLoadingOnload: true
			};
		},

		/**
		 * 生命周期函数--监听页面加载
		 */
		onLoad: function(options) {
			this.rechargeRuleFun();
		},

		methods: {
            color(color) {
                return colorRgb(color)
            },
            
            //  选择充值模板
            choseRechargeItem(index) {
                this.active = index;
            },
            
            // 充值规则
			rechargeRuleFun() {
				rechargeRule().then(res => {
					if (res.code == 1) {
						this.rechargeObj = res.data
					}
                    this.showLoadingOnload = false;
				});
			},
            
            // 确认充值
			temRecharge(id) {
				this.rechargeFun({
					id
				});
			},

			rechargeFun(obj) {
				this.showLoading = true
				recharge(obj).then(({ code, data, msg }) => {
					if (code != 1) throw new Error(msg)
					
					prepay({
						from: 'recharge',
						order_id: data.id,
						pay_way: 1,
					}).then(({ code, data }) => {
						// 微信支付
                        this.showLoading = false
						this.handleWechatPay(data)
					}).catch(err => {
						this.showLoading = false
					})
				}).catch(err => {
					console.log(err)
				}).finally(() => {
					this.showLoading = false
				})
			},
            
            // 微信支付
            handleWechatPay(data) {
                console.log(data)
            	wxpay(data.data).then(res => {
            		if(res == 'success') {
                        this.showPopup = true
                    }
            	}).catch(err => {
            		console.log(err)
            	})
            },
            
            toRechargeRecord() {
                this.$Router.push({
                    path: '/bundle/pages/balance_details/balance_details?type=2'
                })
            }
		}
	};
</script>
<style lang="scss">
	.user-payment {
		.pay-config {
            padding-left: 24rpx;
            padding-top: 17rpx;
            background-color: #FFFFFF;
            image {
                width: 42rpx;
                height: 42rpx;
                vertical-align: middle;
            }
        }

		.fast-payment-container {
			margin-top: 20rpx;
            padding: 24rpx;
            background-color: #FFFFFF;

			.title {
				font-size: 30rpx;
				line-height: 53rpx;
			}
            
            .chacked {
                border-width: 1rpx;
                border-style: solid;
                @include border_color();
                .price {
                    @include font_color();
                }
            }

			.fast-pay {
				margin-top: 30rpx;
                flex-wrap: wrap;
                
				.fast-pay-item {
					position: relative;
                    box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1);
					width: 214rpx;
					height: 150rpx;
					border-radius: 10rpx;
					margin-bottom: 16rpx;

					&:not(:nth-of-type(3n)) {
						margin-right: 24rpx;
					}
                    
					.price {
						font-size: 30rpx;
						line-height: 50rpx;
					}

					.preferential {
                        color: #B2B2B2;
						line-height: 32rpx;
					}
				}

			}
		}
	}
    
    .btns {
        height: 88rpx;
        border-radius: 10rpx;
        margin: 60rpx 30rpx 0;
        @include background_color();
    }
    
    .footer {
        width: 100%;
        height: 40px;
        position: fixed;
        bottom: 30rpx;
    }

	.pay-popup {
		.content {
			padding: 40rpx 0;
			text-align: center;
			width: 560rpx;
			border-radius: 20rpx;
		}

		.img-icon {
			width: 112rpx;
			height: 112rpx;
			display: inline-block;
		}

		.btn {
            border-radius: 10rpx;
			margin: 80rpx 60rpx 0;
            @include background_color();
		}
	}
</style>
