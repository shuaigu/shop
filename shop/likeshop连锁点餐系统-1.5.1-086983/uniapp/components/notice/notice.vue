<template>
    <view>
        <view class="notice flex" @click="flag=!flag">
            <view class="item lighter xs line-1" style="">
                <template v-if="flag==false">
                    <u-parse :html="content"></u-parse>
                </template>
            </view>
            
            <view class="more flex row-right lighter xxs">
                <view class="m-r-6">{{flag==false?'更多':'收起'}}</view>
                <view :class="flag==false?'down':'top'"><u-icon name="arrow-down" color="#999" size="20"></u-icon></view>
            </view>
            
            <view class="content" :class="flag==true?'show':'hide'" >
                <u-parse :html="content"></u-parse>
            </view>
        </view>
    </view>
</template>

<script>
    import {
        getShopNotice
    } from "@/api/store.js"
    export default {
        data() {
            return {
                content: `暂无公告`,
                flag: false
            }
        },

        methods: {
            getNoticeFun() {
                getShopNotice().then(res => {
                    this.content = res.data.content
                })
            }
        }
    }
</script>

<style lang="scss" scoped>
    .notice {
        position: relative;
        height: 40rpx;
        .item {
            width: 85%;
            height: 45rpx;
            transition: all 1s;
            top: 0;
            left: 0;
            z-index: 2;
            position: absolute;
        }
        .more {
            width: 15%;
            text-align: right;
            top: 0rpx;
            right: 0;
            z-index: 2;
            position: absolute;
        }
    }
    
    .top {
        transition: all .3s;
        transform: rotate(180deg);
    }
    
    .down {
        transition: all .3s;
        transform: rotate(0deg);
    }
    
    .content {
        width: 101vw;
        top: 40rpx;
        padding: 24rpx;
        left: -24rpx;
        transition: all .3s;
        position: absolute;
        background-color: #FFFFFF;
    }
    
    .show {
        opacity: 1;
        z-index: 99;
        height: calc(100vh - 250rpx - env(safe-area-inset-bottom); );
    }
    
    .hide {
        opacity: 0;
        z-index: -10;
    }
</style>
