<template>
    <view :data-theme="themeName">

        <template v-if="isLogin">
            <view class="header">
                <view class="header-wrap">
                    <u-tabs font-size="28" name="tabsName" inactive-color="#333" :active-color="themeColor"
                        :list="tabList" :is-scroll="false" :current="current" @change="change">
                    </u-tabs>
                </view>
            </view>

            <view class="order-container">
                <swiper :duration="400" style="height: 100%" @change="change" :current="current">
                    <swiper-item v-for="(items, index) in tabList" :key="index">
                        <template v-show="index == current">
                            <mescroll-uni bottom="100rpx" ref="mescrollRef" top="0rpx" height="100%"
                                @init="mescrollInit" @up="upCallback" :up="upOption" @down="downCallback">

                                <view v-if="items.type == 'current'" class="order-wrap">
                                    <block v-for="(item, index2) in items.list" :key="index2">
                                        <order-card @reRequest="change(current)" :data="item">
                                            <template v-if="item.cancel_btn">
                                                <button class="br60 btn br-btn flex row-center normal"
                                                    @click.stop="openCancel(item.id)">取消订单</button>
                                            </template>

                                            <template v-if="item.pay_btn">
                                                <button class="br60 btn bg-btn flex row-center white"
                                                    @click.stop="toPayment(item.id)">去支付</button>
                                            </template>
                                        </order-card>
                                    </block>
                                </view>

                                <view v-if="items.type == 'history'" class="order-wrap">
                                    <block v-for="(item, index2) in items.list" :key="index2">
                                        <order-card @reRequest="change(current)" :data="item">

                                        </order-card>
                                    </block>
                                </view>

                            </mescroll-uni>
                        </template>
                    </swiper-item>
                </swiper>
            </view>
        </template>

        <view v-if="!isLogin" class="login flex-col col-center row-center">
            <image class="img-null" src="/static/images/order_null.png"></image>
            <view class="muted mt20">登录后才能查看订单哦</view>
            <router-link to="/pages/login/login">
                <view class="white br60 flex row-center btn">
                    <image class="mr10" src="/static/images/icon_wechat.png"></image>
                    <text>去登录</text>
                </view>
            </router-link>
        </view>

        <!-- 取消订单 -->
        <u-modal id="delete-dialog" z-index="10000" negative-top="200rpx" v-model="showCancel"
            :confirm-style="{'border-left':'1rpx solid #f2f2f2'}" :show-cancel-button="true" confirm-text="确认"
            :confirm-color="themeColor" :show-title="false" @confirm="cancelOrder">
            <view class="flex-col col-center tips-dialog p-t-40">
                <view class="normal lg bold">
                    温馨提示
                </view>
                <view style="margin-top:43rpx" class="p-b-60">是否取消当前订单？</view>
            </view>
        </u-modal>

        <tabbar :active="2"></tabbar>

    </view>
</template>

<script>
    import {
        apiOrderLists,
        apiCancelOrder
    } from '@/api/order';
    import {
        debounce
    } from "@/utils/tools.js"
    import MescrollMixin from "@/components/mescroll-uni/mescroll-mixins.js";
    export default {
        mixins: [MescrollMixin],
        data() {
            return {
                tabList: [{
                    tabsName: '当前订单',
                    list: [],
                    type: 'current'
                }, {
                    tabsName: '历史订单',
                    list: [],
                    type: 'history'
                }],
                current: 0,

                order_id: 0, //订单ID
                showCancel: false, //取消订单

                upOption: {
                    empty: {
                        icon: '/static/images/order_null.png',
                        tip: '暂无订单！', // 提示
                        fixed: true,
                        top: "200rpx",
                    }
                }
            };
        },

        onShow() {
            // 使用防抖是为了防止v-show的时候出发多条数据，所以使用防抖触发多次的时候可以只成为触发一次，优化性能请求
			if(this.isLogin) { // 有登陆时才请求数据
				this.upCallback = debounce(this.upCallback, 200, this)
				this.$nextTick(() => {
				    this.$refs?.mescrollRef[this.current].mescroll.resetUpScroll()
				})
			}
        },

        methods: {
            change(event) {
                let index;
                event.detail ? index = event.detail.current : index = event
                if (this.current == index) return;
                else this.current = index
                this.$refs.mescrollRef[this.current].mescroll.resetUpScroll()
            },

            async upCallback(page) {
                const index = this.current;
                const pageNum = page.num; // 页码, 默认从1开始
                const pageSize = page.size; // 页长, 默认每页10条
                apiOrderLists({
                    type: this.tabList[index].type,
                    page_no: pageNum,
                    page_size: pageSize
                }).then(({
                    data
                }) => {
                    if (page.num == 1) this.tabList[index].list = [];
                    const curPageData = data.lists;
                    const curPageLen = curPageData.length;
                    const hasNext = !!data.more;
                    this.tabList[index].list = this.tabList[index].list.concat(curPageData);
                    this.$refs.mescrollRef[index].mescroll.endSuccess(curPageLen, hasNext);
                }).catch(err => {
                    console.log(err)
                    this.$refs.mescrollRef[this.current].mescroll.endErr()
                })
            },

            // 去支付
            toPayment(id) {
                if (!id) return this.$toast({
                    title: '订单已失效～'
                })
                const order_id = id;
                this.$Router.push({
                    path: '/pages/payment/payment',
                    query: {
                        order_id
                    }
                })
            },

            // 打开取消订单
            openCancel(id) {
                this.order_id = id;
                this.showCancel = true;
            },

            // 取消订单
            cancelOrder() {
                apiCancelOrder(this.order_id).then(res => {
                    this.$toast({
                        title: res.msg
                    })
                    this.$refs.mescrollRef[this.current].mescroll.resetUpScroll()
                })
            }
        },
    };
</script>
<style lang="scss">
    .header {
        width: 100%;
        height: 100rpx;
        position: relative;

        &-wrap {
            width: 100%;
            height: 100rpx;
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            z-index: 100;
        }
    }

    .order-container {
        height: calc(100vh - 100rpx - 100rpx - env(safe-area-inset-bottom));
    }

    .order-wrap {
        padding: 0 24rpx;

        .btn {
            margin: 30rpx 0;
            margin-left: 20rpx;
            width: 180rpx;
            height: 64rpx;
            font-size: 26rpx;
        }

        .bg-btn {
            @include background_color();
        }

        .br-btn {
            border: 1px solid #F2F2F2;
        }
    }

    .login {
        height: calc(100vh - 168rpx - env(safe-area-inset-bottom));
        background: #fff;
        text-align: center;

        .btn {
            background-color: #09BB07;
            width: 280rpx;
            line-height: 70rpx;
            margin: 40rpx auto 0;

            image {
                width: 50rpx;
                height: 50rpx;
            }
        }
    }
</style>
