<template>
    <view class="coupon-center" :data-theme="themeName">
        <view class="coupon-header flex row-between" @click="show = !show">
            <view class="nr normal"> 优惠券 </view>

            <view>
                <template v-if="couponIndex != -1">
                    <text class="m-r-20 sm primary"
                        >-¥{{ couponList.usable[couponIndex].money }}</text
                    >
                </template>

                <template v-else>
                    <text class="muted nr m-r-20" v-if="couponList.usable.length <= 0"
                        >暂无可用优惠券</text
                    >
                    <text class="mini-tag" v-else>{{ couponList.usable.length }}张可用</text>
                </template>

                <u-icon name="arrow-right" size="22rpx" color="#696969"></u-icon>
            </view>
        </view>

        <u-popup
            class="popup"
            v-model="show"
            mode="bottom"
            height="1000rpx"
            :closeable="true"
            border-radius="20"
        >
            <view class="title normal bold">优惠券</view>

            <u-tabs
                font-size="28"
                name="tabsName"
                inactive-color="#333"
                :active-color="themeColor"
                :list="list"
                :is-scroll="false"
                :current="current"
                @change="change"
                :show-bar="false"
            >
            </u-tabs>

            <scroll-view scroll-y="true" class="content bg-body">
                <view v-show="current == 0">
                    <template v-if="couponList.usable.length">
                        <block v-for="(item, index) in couponList.usable" :key="item.id">
                            <view>
                                <coupon-card
                                    :index="index"
                                    :params="item"
                                    type="radio"
                                    :checked="couponIndex === index"
                                    @check="selectCoupon"
                                ></coupon-card>
                            </view>
                        </block>
                    </template>

                    <u-empty v-else text="暂无优惠券" mode="coupon" margin-top="150"></u-empty>
                </view>

                <view v-show="current == 1">
                    <template v-if="couponList.unusable.length">
                        <block v-for="(item, index) in couponList.unusable" :key="item.id">
                            <coupon-card :params="item" type="" :unusable="true"></coupon-card>
                        </block>
                    </template>

                    <u-empty v-else text="暂无优惠券" mode="coupon" margin-top="150"></u-empty>
                </view>
            </scroll-view>
        </u-popup>
    </view>
</template>

<script>
import { apiOrderBuyCouponList } from '@/api/store.js'
export default {
    data() {
        return {
            show: false,
            couponList: {
                usable: [],
                unusable: []
            },
            list: [
                {
                    name: '可使用优惠券'
                },
                {
                    name: '不可使用优惠券'
                }
            ],
            current: 0,

            couponIndex: -1 //当前选择的优惠券索引
        }
    },

    created() {
        this.getOrderBuyCoupon()
    },

    methods: {
        change(index) {
            this.current = index
        },

        selectCoupon(index, item) {
            if (this.couponIndex === index) {
                this.couponIndex = -1
                // this.$parent.couponId = ''
                this.$emit('change', '')
            } else {
                this.couponIndex = index
                // this.$parent.couponId = item.cl_id
                this.$emit('change', item.cl_id)
            }
            setTimeout(() => {
                this.show = false
            }, 200)
        },

        getOrderBuyCoupon() {
            console.log(this.shopData.id)
            apiOrderBuyCouponList({
                shop_id: this.shopData.id
            }).then((res) => {
                this.list[0].name = `可使用优惠券(${res.data.usable.length})`
                this.list[1].name = `不可使用优惠券(${res.data.unusable.length})`
                this.couponList = res.data
            })
        }
    }
}
</script>

<style lang="scss" scoped>
.coupon-center {
    .primary {
        @include font_color();
    }

    .coupon-header {
        padding: 20rpx;

        &--scroll-view {
            width: 500rpx;
            height: 46rpx;
            white-space: nowrap;
        }
    }

    .popup {
        .title {
            padding: 30rpx 20rpx;
        }

        .content {
            padding: 20rpx;
            box-sizing: border-box;
            height: 65%;
            // height: calc(100vh - 385rpx - env(safe-area-inset-bottom));
        }
    }

    // 标签
    .mini-tag {
        color: #ffffff;
        border-radius: 4rpx;
        padding: 4rpx 20rpx;
        margin-right: 16rpx;
        @include background_color();
        font-size: $-font-size-xxs;
    }

    // 镂空
    .plain {
        border-width: 1rpx;
        border-style: solid;
        @include border_color();
        @include font_color();
        background: none !important;
    }
}
</style>
