<template>
    <view class="p-30">
        <view class="xxl normal bold" style="word-break:break-all; ">
            {{ detail.name || detail.title }}
        </view>

        <view class="flex m-t-30 row-between xs muted snd-border-b">
            <!-- Time -->
            <view>
                <text>发布时间:</text>
                <text>{{ detail.create_time }}</text>
            </view>
            <!-- Views -->
            <view>
                <u-icon name="eye" size="30" />
                <text class="m-l-10">{{ detail.views }}人浏览</text>
            </view>
        </view>

        <u-parse :html="detail.content" :selectable="true" :show-with-animation="true" :tagStyle="{
            p: 'word-break:break-all; ',
        }"></u-parse>
    </view>
</template>

<script>
import {
    apiShopNoticeDetail
} from "@/api/store.js"
export default {
    data() {
        return {
            id: 0,
            detail: {}
        }
    },

    methods: {
        // 商城公告
        getNoticeDetailDataFun() {
            apiShopNoticeDetail({
                id: this.id
            }).then(res => {
                this.detail = res.data;
            })
        },
    },

    onLoad() {
        const options = this.$Route.query;
        this.id = options.id;
        uni.setNavigationBarTitle({
            title: "公告详情"
        });
        this.getNoticeDetailDataFun();
    }
}
</script>

<style lang="scss">
page {
    background-color: #FFFFFF;

    .snd-border-b {
        border-bottom: 1rpx solid #e5e5e5;
        padding-bottom: 20rpx;
        margin-bottom: 20rpx;
    }
}
</style>
