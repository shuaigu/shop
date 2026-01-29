<template>
    <view class="container">
        <view class="m-t-10" v-if="shopData.hasOwnProperty('license') && shopData.license.length">
            <image style="width: 100%;" v-for="(item, index) in shopData.license" :src="item"></image>
        </view>
        <view v-else class="text-center">
            店家暂无上传资质～
        </view>
    </view>
</template>

<script>

</script>

<style lang="scss" scoped>
.container {
    margin: 20rpx;
    background: #fff;
    padding: 20rpx;
    border-radius: 10rpx;
}
</style>