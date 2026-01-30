<template>
    <view :data-theme="themeName">
        <mescroll-body
            ref="mescrollRef"
            @init="mescrollInit"
            @down="downCallback"
            @up="upCallback"
            :up="{ use: false }"
        >
            <swipers :pid="1" height="750rpx"></swipers>

            <!--用户信息-->
            <view class="hd-wrap">
                <view class="user-info flex row-between">
                    <router-link to="/bundle/pages/user_profile/user_profile">
                        <view class="info flex">
                            <image
                                class="avatar m-r-20 flex-none"
                                :src="
                                    isLogin ? userInfo.avatar : '/static/images/portrait_empty.png'
                                "
                            />
                            <template v-if="isLogin">
                                <view class="name">
                                    <view class="xxl bold line-2">{{ userInfo.nickname }}</view>
                                    <view class="flex col-center">
                                        <image
                                            style="width: 32rpx; height: 32rpx"
                                            src="/static/images/coupon_icon.png"
                                        ></image>
                                        <view class="m-l-10" @click.stop="toCouponPage">
                                            <text class="muted">优惠券</text>
                                            <text class="primaryColor">
                                                {{ userInfo.coupon_num }}
                                            </text>
                                            <text class="muted">张</text>
                                        </view>
                                    </view>
                                </view>
                            </template>
                            <template v-if="!isLogin">
                                <view class="xl">点击授权</view>
                            </template>
                        </view>
                    </router-link>
                </view>
            </view>

            <view class="main flex row-around">
                <view class="main-item" @click="menuJump(menuList[0])">
                    <image :src="menuList[0].image" mode=""></image>
                    <view class="name">{{ menuList[0].name }}</view>
                    <view class="xs muted">{{ menuList[0].describe }}</view>
                </view>

                <view class="flex line"></view>

                <view class="main-item" @click="menuJump(menuList[1])">
                    <image :src="menuList[1].image" mode=""></image>
                    <view class="name">{{ menuList[1].name }}</view>
                    <view class="xs muted">{{ menuList[1].describe }}</view>
                </view>
            </view>
            <view class="activity" v-if="shopData && Object.keys(shopData).length">
                <swipers height="380rpx" :pid="3"></swipers>
                <div class="m-t-30">
                    <div class="flex" @click="onSelectStore">
                        <u-icon name="map-fill" color="#333"></u-icon>
                        <div>
                            <text class="font-primary">{{ shopData.name }}</text>
                            <text class="muted m-l-10"> | {{ shopData.distance }}</text>
                        </div>
                    </div>
                    <div class="muted m-t-10 xs" @click="menuJump(menuList[0])">
                        <text>带你发掘更多线下门店</text>
                        <u-icon name="arrow-right" color="#999"></u-icon>
                    </div>
                </div>
            </view>
            <!-- #ifdef H5 -->
            <view class="record_number">
                <a :href="appConfig.icp_link" style="color: #495770; text-decoration: none">
                    {{ appConfig.icp_number }}
                </a>
            </view>
            <!-- #endif -->
        </mescroll-body>

        <tabbar></tabbar>
    </view>
</template>

<script>
import MescrollMixin from '@/components/mescroll-uni/mescroll-mixins'
import { mapActions, mapMutations, mapGetters } from 'vuex'
import { getMenu } from '@/api/store'
import { menuJump } from '@/utils/tools'
export default {
    mixins: [MescrollMixin],
    data() {
        return {
            menuList: [
                {
                    image: ''
                },
                {
                    image: ''
                }
            ]
        }
    },

    methods: {
        async downCallback() {
            await this.getMenuFun()
            this.mescroll.endSuccess(0, false)
        },

        goLogin() {
            let { isLogin } = this
            if (isLogin) {
                uni.navigateTo({
                    url: '/bundle/pages/user_profile/user_profile'
                })
                return
            }
            uni.navigateTo({
                url: '/pages/login/login'
            })
        },

        goPage(url) {
            if (!this.isLogin) return toLogin()
            uni.navigateTo({
                url
            })
        },

        async getMenuFun() {
            const { data, code } = await getMenu({
                type: 1
            })
            if (code == 1) {
                this.menuList = data
            }
        },

        menuJump(item) {
            menuJump(item)
        },
        onSelectStore() {
            uni.reLaunch({
                url: '/pages/order/order?'
            })
        },
        toCouponPage() {
            uni.navigateTo({
                url: '/bundle/pages/user_coupon/user_coupon'
            })
        }
    },
    computed: {
        ...mapGetters(['userInfo', 'shopData', 'appConfig'])
    },
    onShow() {
        // uni.hideTabBar()
        // this.getCartNum()
    }
}
</script>

<style lang="scss">
page {
    //   padding-bottom: calc(env(safe-area-inset-bottom));
    padding-bottom: calc(120rpx + env(safe-area-inset-bottom));
}

.main {
    padding: 50rpx 40rpx;
    background: #fff;
    border-radius: 20rpx;
    margin: 30rpx 24rpx;

    .main-item {
        text-align: center;

        image {
            width: 158rpx;
            height: 158rpx;
        }

        .name {
            color: #222222;
            font-weight: 500;
            font-size: 38rpx;
            margin: 13rpx auto 10rpx auto;
        }
    }

    .line {
        width: 3rpx;
        height: 260rpx;
        background: #e5e5e5;
    }
}

.activity {
    margin: 30rpx 24rpx;
}

.hd-wrap {
    margin: 0 20rpx;
    margin-top: 30rpx;
    border-radius: 20rpx 20rpx 0 0;
}

.user-info {
    padding: 20rpx;

    .avatar {
        height: 110rpx;
        width: 110rpx;
        border-radius: 50%;
        overflow: hidden;
    }

    .name {
        text-align: left;
        margin-bottom: 5rpx;
    }

    .primaryColor {
        @include font_color();
    }
}
.record_number {
    text-align: center;
    padding: 30rpx;
    font-size: 24rpx;
}
</style>
