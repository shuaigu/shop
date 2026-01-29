<template>
    <view class="card p-t-30 p-b-50 text-center">
        <view class="xl bold">订单已关闭</view>
        <view class="xs muted">感谢您对我们的支持，欢迎再次光临</view>
    </view>
</template>

<script>
export default {
    props: {

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