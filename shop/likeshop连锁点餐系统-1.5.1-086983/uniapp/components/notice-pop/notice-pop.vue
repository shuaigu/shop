<template>
    <div>
        <div style="height: 50rpx;overflow: hidden;" @click="showPop">
            <template v-if="content.length">
                <swiper style="height: 100%;" interval="3000" :autoplay="true" :vertical="true" :circular="true">
                    <swiper-item v-for="(item, index) in content" :key="index">
                        <view class="p-t-14 p-b-20 flex col-center col-center" style="height: 100%rpx;">
                            <u-icon name="star-fill" color="#febc2e" size="28"></u-icon>
                            <div class="m-l-10 line-1">{{ item.name }}</div>
                            <u-icon class="m-l-10" name="arrow-right" color="#707070" size="28"></u-icon>
                        </view>
                    </swiper-item>
                </swiper>
            </template>
            <template v-else>
                <view class="muted">查看门店信息 <u-icon class="m-l-10" name="arrow-right" color="#707070" size="28"></u-icon>
                </view>
            </template>
        </div>
        <u-popup v-model="show" mode="bottom" height="800rpx" border-radius="20">
            <view class="p-t-50 p-l-30 p-r-30 ">
                <view v-if="content.length" class="m-b-40">
                    <view class="nr bold">门店公告</view>
                    <view class="m-t-28">
                        <view class="flex row-between" v-for="(item, index) in content" :key="index">
                            <view class="flex flex-1" style="min-width: 0;">
                                <u-icon name="star-fill" color="#febc2e" size="24"></u-icon>
                                <view class="m-l-10 muted line-1">{{ item.name }}</view>
                            </view>
                            <view style="color: #FEBC2E;flex: none;" @click="toDetail(item.id)">查看</view>
                        </view>
                    </view>
                </view>
                <view>
                    <view class="nr bold">门店信息</view>
                    <view class="m-t-28">
                        <view class="flex  col-top muted">
                            <view style="flex: none;">地址：</view>
                            <view>{{ shopData.address_detail }}</view>
                        </view>
                        <view class="flex  col-top muted m-t-20">
                            <view style="flex: none;">电话：</view>
                            <view>{{ shopData.phone }}</view>
                        </view>
                        <view class="flex  col-top muted m-t-20">
                            <view style="flex: none;">营业时间：</view>
                            <view>{{ shopData.business }}</view>
                        </view>
                    </view>
                </view>
                <view class="m-t-40">
                    <view class="nr bold" @click="toFile">食品安全档案 ></view>
                </view>
            </view>
        </u-popup>
    </div>
</template>

<script>
import {
    getShopNotice
} from "@/api/store.js"
export default {
    data() {
        return {
            content: `暂无公告`,
            flag: false,
            show: false
        }
    },

    methods: {
        getNoticeFun() {
            getShopNotice().then(res => {
                this.content = res.data
            })
        },
        showPop() {
            this.show = true
        },
        toFile() {
            uni.navigateTo({
                url: 'bundle/pages/file/file'
            });
        },
        toDetail(id) {
            console.log(id);
            uni.navigateTo({
                url: `bundle/pages/store_notice_detail/store_notice_detail?id=${id}`

            })
        }
    }
}
</script>

<style lang="scss"></style>