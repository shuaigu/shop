<template>
    <view :data-theme="themeName">

        <view class="header">
            <view class="header-wrap">
                <u-tabs font-size="28" name="tabsName" inactive-color="#333" :active-color="themeColor" :list="tabList"
                    :is-scroll="false" :current="current" @change="change">
                </u-tabs>
            </view>
        </view>

        <view class="order-container">
            <swiper :duration="400" style="height: 100%" @change="change" :current="current">
                <swiper-item v-for="(items, index) in tabList" :key="index">
                    <template v-show="index == current">
                        <mescroll-uni bottom="100rpx" ref="mescrollRef" top="0rpx" height="100%" @init="mescrollInit"
                            @up="upCallback" :up="upOption" @down="downCallback">

                            <template v-if="items.type === 1">
                                <block v-for="(item, index2) in items.list" :key="index2">
                                    <coupon-card :params="item" type="use"></coupon-card>
                                </block>
                            </template>

                            <template v-if="items.type === 2">
                                <block v-for="(item, index2) in items.list" :key="index2">
                                    <coupon-card :params="item" :unusable="true" type="used" :checked="couponIndex===index"></coupon-card>
                                </block>
                            </template>
                            
                            <template v-if="items.type === 3">
                                <block v-for="(item, index2) in items.list" :key="index2">
                                    <coupon-card :params="item" :unusable="true" type="invalid" :checked="couponIndex===index"></coupon-card>
                                </block>
                            </template>

                        </mescroll-uni>
                    </template>
                </swiper-item>
            </swiper>
        </view>
    </view>
</template>

<script>
    import {
        apiMyCouponList
    } from '@/api/store.js';
    import {
        debounce
    } from "@/utils/tools.js"
    import MescrollMixin from "@/components/mescroll-uni/mescroll-mixins.js";
    export default {
        mixins: [MescrollMixin],
        data() {
            return {
                tabList: [{
                    tabsName: '可使用',
                    list: [],
                    type: 1
                }, {
                    tabsName: '已使用',
                    list: [],
                    type: 2
                }, {
                    tabsName: '已失效',
                    list: [],
                    type: 3
                }],
                current: 0,

                order_id: 0, //订单ID
                showCancel: false, //取消订单

                upOption: {
                    empty: {
                        icon: '/static/images/coupon.png',
                        tip: '暂无优惠券！', // 提示
                        fixed: true,
                        top: "200rpx",
                    }
                }
            };
        },

        onShow() {
            // 使用防抖是为了防止v-show的时候出发多条数据，所以使用防抖触发多次的时候可以只成为触发一次，优化性能请求
            this.upCallback = debounce(this.upCallback, 200, this)
            this.$nextTick(() => {
                this.$refs.mescrollRef[this.current].mescroll.resetUpScroll()
            })
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
                apiMyCouponList({
                    type: this.tabList[index].type,
                    page_no: pageNum,
                    page_size: pageSize
                }).then(({
                    data
                }) => {
                    if (page.num == 1) this.tabList[index].list = [];
                    const curPageData = data.list;
                    const curPageLen = curPageData.length;
                    const hasNext = !!data.more;
                    this.tabList[index].list = this.tabList[index].list.concat(curPageData);
                    this.$refs.mescrollRef[index].mescroll.endSuccess(curPageLen, hasNext);
                    this.tabList[0].tabsName = `可使用(${data.statistics.notuse_count})`;
                    this.tabList[1].tabsName = `已使用(${data.statistics.use_count})`;
                    this.tabList[2].tabsName = `已失效(${data.statistics.overtime_count})`;
                }).catch(err => {
                    console.log(err)
                    this.$refs.mescrollRef[this.current].mescroll.endErr()
                })
            },

            // 去使用
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
        }
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
        padding: 0 24rpx;
    }
</style>
