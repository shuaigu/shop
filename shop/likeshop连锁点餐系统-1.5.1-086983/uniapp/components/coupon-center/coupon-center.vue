<template>
    <view class="coupon-center">
        <view class="coupon-header flex row-between" @click="show = !show">
            <view class="flex">
                <view class="nr muted m-r-20"> 领券 </view>
                <scroll-view scroll-x="true" class="coupon-header--scroll-view">
                    <text class="mini-tag plain">优惠</text>

                    <block v-for="item in couponList" :key="item.id">
                        <text class="mini-tag">{{ item.name }}</text>
                    </block>
                </scroll-view>
            </view>
            <u-icon name="arrow-right" size="22rpx" color="#696969"></u-icon>
        </view>

        <u-popup
            class="popup"
            v-model="show"
            mode="bottom"
            height="1000rpx"
            duration="50"
            :closeable="true"
            border-radius="20"
        >
            <view class="title normal bold">领券</view>

            <scroll-view scroll-y="true" class="content bg-body">
                <view>
                    <text class="mini-tag plain">优惠</text>
                    <text>{{
                        couponList.length != 0 ? '您有可领取的优惠券' : '暂无可领取的优惠券'
                    }}</text>
                </view>

                <template v-if="couponList.length != 0">
                    <block v-for="item in couponList" :key="item.id">
                        <coupon-card :params="item" type="receive"></coupon-card>
                    </block>
                </template>

                <u-empty v-else text="暂无可领取的优惠券" mode="coupon"></u-empty>
            </scroll-view>
        </u-popup>
    </view>
</template>

<script>
import { apiReceiveCouponList } from '@/api/store.js'
export default {
    data() {
        return {
            show: false,
            couponList: []
        }
    },

    watch: {
        show: {
            handler(val) {
                this.$parent.$parent.showCart = !this.$parent.$parent.showCart
            }
        }
    },

    methods: {
        getReceiveCoupon() {
            apiReceiveCouponList({
                shop_id: this.shopData.id
            }).then((res) => {
                this.couponList = res.data
            })
        }
    }
}
</script>

<style lang="scss" scoped>
.coupon-center {
    .coupon-header {
        padding: 20rpx;
        border-top: $-solid-border;

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
            height: 75%;
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
