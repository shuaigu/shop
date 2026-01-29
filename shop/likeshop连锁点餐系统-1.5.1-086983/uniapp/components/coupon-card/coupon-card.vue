<template>
    <view :data-theme="themeName">
        <view class="coupon-card flex" :class="{ unusable: unusable }" @click="handleclick">
            <view class="left white flex-col row-center">
                <price :content="params.money" mainSize="60rpx" minorSize="34rpx"></price>
                <view class="sm m-t-10">{{
                    params.use_tips === '满0元可用' ? '' : params.use_tips
                }}</view>
            </view>
            <view
                class="right flex row-between bg-white flex-1"
                :class="{ receive: params.is_get }"
            >
                <view class="content flex-1">
                    <view class="md bold normal">{{ params.name }}</view>
                    <view class="muted xxs m-t-10">{{ params.over_time }}</view>
                    <view class="muted xxs m-t-10">{{ params.use_goods_tips }}</view>
                </view>

                <!-- 领取优惠券 -->
                <template v-if="type === 'receive'">
                    <view class="inline flex row-right col-bottom" @click="onReceive">
                        <view class="btn br60 white">领取</view>
                    </view>
                </template>

                <!-- 选择优惠券 -->
                <template v-if="type === 'radio'">
                    <view class="inline flex row-right col-center radio">
                        <u-checkbox
                            class="u-checkbox"
                            :value="checked"
                            shape="circle"
                            :name="id"
                            :disabled="false"
                            :active-color="themeColor"
                        />
                    </view>
                </template>

                <!-- 去使用优惠券 -->
                <template v-if="type === 'use'">
                    <view class="inline flex row-right col-bottom" @click="toUse">
                        <view class="btn plain br60 white">去使用</view>
                    </view>
                </template>

                <!-- 已使用 -->
                <template v-if="type === 'used'">
                    <view class="inline flex row-right col-bottom">
                        <view class="btn plain br60 white">已使用</view>
                    </view>
                </template>

                <!-- 已失效 -->
                <template v-if="type === 'invalid'">
                    <view class="inline flex row-right col-bottom">
                        <view class="btn plain br60 white">已失效</view>
                    </view>
                </template>
            </view>
        </view>
        <view class="instructions bg-white" v-if="params.use_goods_list">
            <view class="flex row-between" @click="showTips = !showTips">
                <view class="xs normal">使用说明</view>
                <u-icon :name="showTips == true ? 'arrow-up' : 'arrow-down'" size="24"></u-icon>
            </view>
            <view class="xs muted m-t-20" v-show="showTips == true">
                <view>{{ params.use_goods_list }}</view>
            </view>
        </view>
    </view>
</template>

<script>
import { apiReceiveCoupon } from '@/api/store.js'
export default {
    name: 'coupone-card',
    props: {
        params: {
            type: Object,
            default: {}
        },
        index: {
            default: ''
        },
        type: {
            type: String,
            default: ''
        },

        checked: {
            type: Boolean,
            default: false
        },

        unusable: {
            type: Boolean,
            default: false
        }
    },
    data() {
        return {
            showTips: false
        }
    },
    methods: {
        handleclick() {
            console.log(this.params, this.index)
            this.$emit('check', this.index, this.params)
        },
        // 领取优惠券
        onReceive() {
            apiReceiveCoupon({
                id: this.params.id
            }).then((res) => {
                this.$toast({ title: res.msg })
                try {
                    this.$parent.$parent.getReceiveCoupon()
                } catch (error) {
                    //TODO handle the exception
                    console.log(error)
                }
            })
        },

        // 去使用
        toUse() {
            uni.switchTab({
                url: '/pages/order/order'
            })
        }
    }
}
</script>

<style lang="scss" scoped>
.unusable {
    filter: grayscale(100%);
}

.coupon-card {
    width: 100%;
    height: 200rpx;
    overflow: hidden;
    margin-top: 20rpx;

    .left {
        width: 200rpx;
        height: 100%;
        text-align: center;
        position: relative;
        @include background_linear(90deg, 0%, 100%);
    }

    .left::before {
        content: '';
        width: 34rpx;
        height: 34rpx;
        border-radius: 50%;
        position: absolute;
        left: 0;
        top: 0;
        transform: translate(-50%, -50%);
        background-color: $-color-body;
    }

    .left::after {
        content: '';
        width: 34rpx;
        height: 34rpx;
        border-radius: 50%;
        position: absolute;
        left: 0;
        bottom: 0;
        transform: translate(-50%, 50%);
        background-color: $-color-body;
    }

    // 是否领取
    .receive {
        background-image: url(../../static/images/receive.png);
        background-position: right top;
        background-size: 76rpx 82rpx;
        background-repeat: no-repeat;
    }

    .right {
        width: 100%;
        height: 100%;
        padding: 20rpx;
        > view {
            height: 100%;
        }
        .content {
            width: 350rpx;
            display: inline-block;
        }

        .btn {
            padding: 8rpx 34rpx;
            font-size: $-font-size-sm;
            @include background_color();
        }

        .plain {
            border-width: 1px;
            border-style: solid;
            @include border_color();
            @include font_color();
            box-sizing: border-box;
            background: none !important;
        }

        .radio {
            image {
                width: 36rpx;
                height: 36rpx;
            }
        }
    }
}

.instructions {
    padding: 14rpx 20rpx;
}
</style>
