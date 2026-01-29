<template>
    <view class="goods flex">
        <u-image width="100rpx" height="100rpx" :src="data.image"></u-image>

        <view class="main m-l-20 flex-1">
            <view class="flex row-between">
                <view>{{data.name||data.goods_name}}</view>
                <price :content="data.total_price||data.goods_price" main-size="32rpx" minor-size="28rpx"
                    color="#222222">
                </price>
            </view>
            <view class="flex row-between m-t-10">
                <view class="xxs muted">{{specValueStr}}</view>
                <view class="lighter xs">x{{data.goods_num}}</view>
            </view>
        </view>
    </view>
</template>

<script>
    export default {
        name: 'goods-card',
        props: {
            data: {
                type: Object,
                default: {}
            }
        },

        computed: {
            specValueStr() {
                let material = (this.data.material_name ? this.data.material_name.toString() : false || this.data
                    .goods_snap.material_name ? this.data.goods_snap.material_name.toString() : false);
                let spec_value_str = (this.data.spec_value_str || this.data.goods_snap.spec_value_str)

                return spec_value_str + material
            }
        }
    }
</script>

<style lang="scss" scoped>
    .goods {
        padding: 16rpx 24rpx;

        .main {
            width: 100%;
            padding: 16rpx 0;
        }
    }
</style>
