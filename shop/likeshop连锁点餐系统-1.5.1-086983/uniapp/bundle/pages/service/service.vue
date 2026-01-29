<template>
    <view :data-theme="themeName">
        <view class="service">
            <!-- Navigation -->
            <!-- #ifdef MP -->
            <u-navbar
                :border-bottom="false"
                title="在线客服"
                title-color="#fff"
                back-icon-color="#fff"
                background="rgba(0,0,0,0)"
            ></u-navbar>
            <!-- #endif -->
            <!-- Contain -->
            <view class="service-contain">
                <view class="flex code row-center">
                    <u-image :src="serviceData.image" width="500rpx" height="500rpx"></u-image>
                </view>
                <view class="flex lg m-t-20 row-center" :style="{ color: themeColor }">
                    客服微信
                </view>

                <view class="p-t-20">
                    <view class="br60 copy-btn flex row-center white xxl">
                        <u-image
                            src="@/static/images/icon_wechat.png"
                            width="50rpx"
                            height="50rpx"
                        ></u-image>
                        <text class="m-l-20" @click="copyWechatNumber">复制微信号</text>
                    </view>
                </view>

                <view class="flex row-center normal xs p-t-20">
                    服务时间: {{ serviceData.business_time || '周一至周六9:00-19:00' }}
                </view>

                <view>
                    <!-- #ifdef MP-WEIXIN -->
                    <button class="m-t-20" open-type="contact">在线客服</button>
                    <!-- #endif -->
                    <!-- #ifndef MP-WEIXIN -->
                    <button class="m-t-20" @click="tipsShow()">在线客服</button>
                    <!-- #endif -->
                </view>
            </view>

            <!-- Contact Phone -->
            <view class="service-contact">
                <view class="m-t-20 white flex row-center"> 无法添加或疑难问题请联系工作人员 </view>

                <view class="m-t-20 white flex row-center">
                    {{ serviceData.phone }}
                    <!-- #ifdef H5 -->
                    <a class="br60 m-l-10 phone xs" :href="'tel:' + serviceData.phone">拨打</a>
                    <!-- #endif -->
                    <!-- #ifdef MP-WEIXIN -->
                    <view class="br60 m-l-10 xs phone" @click="showTelTips">拨打</view>
                    <!-- #endif -->
                    <view class="br60 m-l-10 xs phone" @click="copyPhone">复制</view>
                </view>
            </view>
        </view>

        <u-modal
            :content="content"
            v-model="showPhoneCall"
            show-cancel-button
            confirm-text="呼叫"
            :confirm-color="themeColor"
            @confirm="onCall"
        >
        </u-modal>

        <loading-view v-if="loading"></loading-view>
    </view>
</template>

<script>
import { copy } from '@/utils/tools.js'
import { apiServiceConfig } from '@/api/store.js'
export default {
    name: 'Service',

    data() {
        return {
            serviceData: {},
            showPhoneCall: false,
            content: '即将打电话给',
            loading: true
        }
    },

    methods: {
        getServiceConfigDataFun() {
            apiServiceConfig()
                .then((res) => {
                    this.serviceData = res.data
                    setTimeout(() => {
                        this.loading = false
                    }, 100)
                })
                .catch((err) => {
                    this.loading = false
                })
        },

        // 复制微信号
        copyWechatNumber() {
            copy(this.serviceData.wechat)
        },

        // 联系客服 《除微信端以外》
        tipsShow() {
            this.$toast({
                title: '该功能暂未开放'
            })
        },

        // 显示是否拨打电话弹窗
        showTelTips() {
            this.showPhoneCall = true
            this.content = '即将打电话给' + this.serviceData.phone
        },

        //打电话
        onCall() {
            wx.makePhoneCall({
                phoneNumber: this.serviceData.phone.toString()
            })
        },

        // 复制手机号
        copyPhone() {
            copy(this.serviceData.phone)
        }
    },

    onLoad() {
        this.getServiceConfigDataFun()
    }
}
</script>

<style lang="scss">
page {
    padding: 0;
}
.service {
    width: 100vw;
    height: 100vh;
    @include background_color();
    overflow: hidden;

    &-contain {
        width: 620rpx;
        height: 900rpx;
        margin: 68rpx auto;
        border-radius: 10px;
        background-color: #ffffff;

        .code {
            border-radius: 20rpx;
            padding-top: 60rpx;
        }

        .copy-btn {
            margin: 0 80rpx;
            height: 90rpx;
            @include background_color();
        }
    }

    &-contact {
        .phone {
            text-decoration: none;
            color: white;
            padding: 0 20rpx;
            background: rgba($color: #fff, $alpha: 0.2);
        }
    }
}
</style>
