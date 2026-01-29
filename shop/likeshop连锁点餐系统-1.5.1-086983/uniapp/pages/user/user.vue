<template>
    <view :data-theme="themeName">
        <mescroll-body
            ref="mescrollRef"
            @init="mescrollInit"
            @down="downCallback"
            @up="upCallback"
            :up="{ use: false }"
        >
            <view class="user">
                <!-- #ifndef H5 -->

                <u-sticky offset-top="0" h5-nav-height="0" bg-color="transparent">
                    <u-navbar
                        :is-back="false"
                        title="个人中心"
                        :title-bold="true"
                        :is-fixed="false"
                        :border-bottom="false"
                        :background="{ background: 'rgba(256,256, 256,' + navBg + ')' }"
                        :title-color="navBg > 0.5 ? '#000' : '#fff'"
                    ></u-navbar>
                </u-sticky>
                <!--  #endif -->

                <view class="header" :style="[background]">
                    <view
                        class="hd-wrap"
                        :style="{ background: 'rgba( ' + color(themeColor) + ',.85)' }"
                        style="margin-top: 150rpx"
                    >
                        <view class="user-info flex row-between">
                            <router-link to="/bundle/pages/user_profile/user_profile">
                                <view class="info flex">
                                    <image
                                        class="avatar m-r-20 flex-none"
                                        :src="
                                            isLogin
                                                ? userInfo.avatar
                                                : '/static/images/portrait_empty.png'
                                        "
                                    />
                                    <template v-if="isLogin">
                                        <view class="name flex">
                                            <view class="xxl bold line-2">{{
                                                userInfo.nickname
                                            }}</view>
                                        </view>
                                    </template>

                                    <template v-if="!isLogin">
                                        <view class="xl">点击授权</view>
                                    </template>
                                </view>
                            </router-link>
                        </view>
                    </view>
                    <view class="bg-body">
                        <view class="recharge bg-white flex row-between">
                            <view @click="goPage('/bundle/pages/balance_details/balance_details')">
                                <view class="">
                                    <price
                                        :content="userInfo.user_money"
                                        main-size="42rpx"
                                        minor-size="26rpx"
                                        color="#222"
                                    >
                                    </price>
                                </view>
                                <view class="m-t-10 sm flex row-center"> 我的余额 </view>
                            </view>
                            <template v-if="appConfig.recharge_status">
                                <view
                                    class="recharge-btn white flex row-center md"
                                    @click="goPage('/bundle/pages/user_recharge/user_recharge')"
                                    >充值</view
                                >
                            </template>
                        </view>
                    </view>
                </view>

                <view class="server-nav bg-white" v-if="menuList && menuList.length > 0">
                    <view>
                        <view class="title flex row-between">
                            <view class="lg">我的服务</view>
                        </view>
                    </view>
                    <view class="nav flex flex-wrap">
                        <view class="item flex-col col-center m-b-20" style="width: 25%" @tap="goPage('/pages/user/transfer_test')">
                            <image class="nav-icon" src="/static/images/coupon.png"></image>
                            <view class="sm nav-name">打款测试</view>
                        </view>
                        <button
                            v-for="(item, index) in menuList"
                            :key="index"
                            :open-type="item.link_type == 2 ? 'contact' : ''"
                            class="item flex-col col-center m-b-20"
                            style="width: 25%"
                            @tap="menuJump(item)"
                        >
                            <image class="nav-icon" :src="item.image"></image>
                            <view class="sm nav-name">{{ item.name }}</view>
                        </button>
                    </view>
                </view>
            </view>
        </mescroll-body>
        <tabbar :active="3"></tabbar>
    </view>
</template>

<script>
import MescrollMixin from '@/components/mescroll-uni/mescroll-mixins'
import { mapGetters, mapActions } from 'vuex'
import { getMenu } from '@/api/store'
import { toLogin } from '@/utils/login'
import { menuJump, colorRgb, copy } from '@/utils/tools'
import Cache from '@/utils/cache'
export default {
    mixins: [MescrollMixin],
    data() {
        return {
            showNav: false,
            navBg: 1,
            menuList: [{}, {}, {}]
        }
    },

    onLoad(options) {
        this.getMenuFun()
    },

    onShow() {
        this.getUser()
    },

    onShareAppMessage() {
        const shareInfo = this.appConfig.share
        return {
            title: shareInfo.mnp_share_title,
            path: 'pages/index/index'
        }
    },
    methods: {
        ...mapActions(['getUser']),
        color(color) {
            return '255,255,255'
        },

        async downCallback() {
            this.getUser().then(() => {
                uni.stopPullDownRefresh()
            })
            this.getMenuFun()
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
            if (!this.isLogin) return this.goLogin()
            uni.navigateTo({
                url
            })
        },

        async getMenuFun() {
            const { data, code } = await getMenu({
                type: 2
            })
            if (code == 1) {
                this.menuList = data
            }
        },

        menuJump(item) {
            // 联系客服
            if (item.link_type == 2) return
            menuJump(item)
        }
    },
    computed: {
        ...mapGetters(['userInfo', 'appConfig']),
        background() {
            const { center_setting } = this.appConfig
            return center_setting.top_bg_image
                ? {
                      'background-image': `url(${center_setting.top_bg_image})`
                  }
                : {}
        }
    }
}
</script>
<style lang="scss">
page {
    padding: 0;
}
.user {
    .header {
        padding-top: 20rpx;
        background-image: url(../../static/images/my_head_bg.png);
        @include background_color();
        background-size: 100% auto;
        background-repeat: no-repeat;

        .hd-wrap {
            margin: 0 20rpx;
            border-radius: 20rpx 20rpx 0 0;
        }

        .user-info {
            padding: 30rpx;

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
        }
    }

    .recharge {
        margin: 0 20rpx;
        padding: 32rpx 30rpx 32rpx 45rpx;

        .recharge-btn {
            height: 68rpx;
            width: 178rpx;
            border-radius: 10rpx;
            @include background_color();
        }
    }

    .server-nav {
        margin: 20rpx;
        border-radius: 8rpx;
    }

    .title {
        height: 88rpx;
        padding: 0 30rpx;
    }

    .nav {
        padding: 26rpx 0 0;

        .assets-item {
            flex: 1;
        }

        .item {
            width: 25%;
        }

        .nav-icon {
            width: 52rpx;
            height: 52rpx;
            margin: 16rpx;
        }

        .nav-name {
            width: 80%;
            height: 40rpx;
            margin: 0 24rpx;
            margin-bottom: 24rpx;
            text-align: center;
        }
    }
}
</style>
