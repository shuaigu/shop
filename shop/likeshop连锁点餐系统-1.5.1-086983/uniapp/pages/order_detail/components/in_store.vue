<template>
    <view class="card p-t-30 p-b-50 text-center">
        <template v-if="true">
            <view>
                <view class="md">堂食</view>
                <view class="font-size-60 bold m-t-20s">{{ data.desk_info.number }}</view>
                <view class="flex row-center m-t-50">
                    <view>
                        <image style="width: 72rpx;height: 72rpx;" src="@/static/images/order_detail/no_order.png"></image>
                        <view class="muted">已下单</view>
                    </view>
                    <view class="line"></view>
                    <view>
                        <image style="width: 72rpx;height: 72rpx;" v-if="data.order_status == 1"
                            src="@/static/images/order_detail/is_making.png"></image>
                        <image style="width: 72rpx;height: 72rpx;" v-if="data.order_status != 1"
                            src="@/static/images/order_detail/no_making.png"></image>
                        <view :class="{ 'black': data.order_status == 1, 'muted': data.order_status != 1 }">制作中</view>
                    </view>
                </view>
                <view class="m-t-50 xs">很快制作完成，请耐心等候</view>
                <view class="muted m-t-10 xs">请勿随意更换座位，制作完成后将第一时间为您送餐</view>
            </view>
        </template>
    </view>
</template>

<script>
export default {
    props: {
        data: {
            type: Object,
            default: {}
        }
    },
    data() {

    },
    methods: {

    }
}
</script>

<style scoped lang="scss">
.card {
    overflow: hidden;
    margin-top: 20rpx;
    border-radius: 20rpx;
    background-color: #FFFFFF;
}

.line {
    position: relative;
    width: 100rpx;

    &::before {
        content: '';
        height: 0px;
        width: 100rpx;
        position: absolute;
        top: -30rpx;
        left: 0px;
        border: 1px #999999 dashed;
    }
}
</style>