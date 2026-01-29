<template>
    <view :data-theme="themeName">
        <view class="order bg-white" @click="toOrderDetail">

            <!-- Header -->
            <view class="header">
                <view class="flex row-between">
                    <view class="flex">
                        <template v-if="data.order_type == 2">
                            <view class="sign">外</view>
                        </template>

                        <view class="md normal bold">{{data.shop.name}}</view>
                    </view>
                    <view class="flex">

                        <template v-if="data.cancel_btn">
                            <view class="m-r-20">
                                <u-count-down @end="endTime" v-if="showTime" :timestamp="getCancelTime" :show-days="false"
                                    :color="themeColor" :show-hours="false" :font-size="24" />
                            </view>
                        </template>
                        <view class="flex row-end">
                            <view class="m-r-5 normal sm">{{data.order_status_text}}</view>
                            <u-icon name="arrow-right" size="22" color="#333"></u-icon>
                        </view>
                    </view>
                </view>
                <view class="muted xs m-t-10 m-b-10">
                    {{data.create_time}}
                </view>
            </view>

            <!-- Section -->
            <view class="section flex row-between">
                <scroll-view :scroll-x="true" class="scroll-view_H p-t-20 ">
                    <block v-for="(item,index) in data.order_goods" :key="index">
                        <view class="m-r-20 inline">
                            <u-image width="100rpx" height="100rpx" :src="item.image"></u-image>
                        </view>
                    </block>
                </scroll-view>

                <view>
                    <view class="muted nr text-right">共{{data.total_num}}件</view>
                    <price fontWeight="500" :content="data.order_amount" main-size="30rpx" minor-size="30rpx"
                        :color="themeColor">
                    </price>
                </view>
            </view>

            <!-- Footer -->
            <view class="footer flex row-right">
                <slot></slot>
            </view>
        </view>

    </view>
</template>

<script>
    export default {
        data() {
            return {
                showTime: true
            }
        },
        
        props: {
            data: {
                type: Object,
                default: {}
            }
        },

        computed: {
            
            // 获取取消订单时间倒计时
            getCancelTime() {
                let start = new Date(this.data.create_time).getTime();
                let end = this.data.order_cancel_time;

                let endTimeStamp = Number(start) + (Number(end) * 1000)
                let now = new Date().getTime()

                if (endTimeStamp > now) {
                    let min = endTimeStamp - now
                    return (min / 1000)
                }

                return false
            }
        },

        methods: {
            //倒计时结束
            endTime() {
                this.showTime = false;
            },
            
            // 订单详情
            toOrderDetail() {
                console.log(123)
                if (!this.data.id) return this.$toast({
                    title: '订单已失效～'
                })
                const order_id = this.data.id;
                this.$Router.push({
                    path: '/pages/order_detail/order_detail',
                    query: {
                        order_id
                    }
                })
            }
        }
    }
</script>

<style lang="scss" scoped>
    .order {
        padding: 0 30rpx;
        border-radius: 10rpx;
        margin-bottom: 20rpx;

        .header {
            padding: 22rpx 0;
            height: 128rpx;
            border-bottom: 1px solid #F2F2F2;

            .sign {
                color: #FFFFFF;
                font-size: 24rpx;
                margin-right: 20rpx;
                padding: 6rpx 14rpx;
                background-color: $-color-normal;
            }
        }

        .section {
            .scroll-view_H {
                width: 500rpx;
                height: 150rpx;
                white-space: nowrap;
            }
        }

        .footer {
            // padding: 30rpx 0;

        }
    }
</style>
