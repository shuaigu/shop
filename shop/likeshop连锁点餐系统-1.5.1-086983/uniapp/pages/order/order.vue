<template>
    <view :data-theme="themeName">
        <!-- Header 头部 -->
        <mescroll-body
            height="90%"
            ref="mescrollRef"
            @init="mescrollInit"
            @down="downCallback"
            @up="upCallback"
            :up="{ use: false }"
            :down="{ use: true, auto: false }"
        >
            <view class="header m-t-5">
                <view class="header-content">
                    <!-- 头部地址 -->
                    <view class="flex row-between">
                        <view @click="toStoreList('', true)">
                            <view class="flex m-b-5">
                                <view class="bold line-1 lg normal" v-if="shopData.name">{{
                                    shopData.name || '暂未选择店铺'
                                }}</view>
                                <u-icon name="arrow-right" size="28" color="#333"></u-icon>
                            </view>
                            <view class="muted xxs line-1"
                                >距离您 {{ shopData.distance || '0m' }}
                                <!-- 距离您 {{ shopData.distance || '0m' }} 
                                {{ 
                                    shopData.address_detail ||
                                    '请开启定位或权限后刷新本页面获取定位'
                                }} -->
                            </view>
                        </view>

                        <swich
                            :sliderColor="themeColor"
                            v-model="order_type"
                            @change="changeOrderType"
                            firstText="自取"
                            lastText="外卖"
                        ></swich>
                    </view>
                    <!-- header-content头部内容 -->
                    <view class="m-t-20">
                        <!-- 公告组件 -->
                        <!-- <notice ref="notice"></notice> -->
                        <notice-pop ref="notice"></notice-pop>
                    </view>
                </view>

                <!-- 领券中心 -->
                <coupon-center ref="coupon" @change="isShowBottomCart"></coupon-center>
            </view>

            <!-- Section -->
            <view class="order flex m-t-10" v-if="shopData != null">
                <!-- 左侧菜单栏 -->
                <view class="aside">
                    <scroll-view
                        style="height: 100%"
                        :scroll-into-view="toAsideView"
                        scroll-y="true"
                        scroll-with-animation="true"
                    >
                        <block v-for="(item, index) in cateList" :key="index">
                            <view
                                :id="'aside' + index"
                                :class="'aside-item  sm ' + (index == active ? 'active' : '')"
                                @click="changeActive(index)"
                            >
                                <view class="flex row-center">
                                    <u-image
                                        v-if="item.image != ''"
                                        width="60rpx"
                                        height="60rpx"
                                        :src="item.image"
                                    >
                                    </u-image>
                                </view>
                                <text class="name normal">{{ item.name }}</text>
                            </view>
                        </block>
                    </scroll-view>
                </view>
                <!-- 右侧内容栏 -->
                <view class="main">
                    <scroll-view
                        style="height: 100%"
                        scroll-y="true"
                        scroll-with-animation="true"
                        @scroll="scrollView"
                        :scroll-into-view="toView"
                    >
                        <view class="main-wrap">
                            <!-- 右侧-广告 -->
                            <view class="p-t-20" style="border-radius: 16rpx">
                                <swipers
                                    :pid="2"
                                    height="200rpx"
                                    previous-margin="0"
                                    padding="0rpx 0 20rpx"
                                    radius="10rpx"
                                >
                                </swipers>
                            </view>
                            <!-- 右侧-各类商品方块 -->
                            <view
                                class="goods-wrap"
                                v-for="(item, index) in cateList"
                                :key="item.id"
                                :id="'p' + index"
                            >
                                <view class="title flex">
                                    <u-image
                                        v-if="item.image != ''"
                                        width="60rpx"
                                        height="60rpx"
                                        :src="item.image"
                                    >
                                    </u-image>
                                    <text>{{ item.name }}</text>
                                </view>
                                <view
                                    class="goods-item flex"
                                    v-for="(el, cIndex) in item.goods"
                                    :key="el.id"
                                >
                                    <!-- 商品图片 -->
                                    <view class="">
                                        <u-image
                                            @click="toDetail(el.shop_goods_id)"
                                            :src="el.image"
                                            width="160rpx"
                                            height="160rpx"
                                            border-radius="10rpx"
                                        >
                                        </u-image>
                                    </view>

                                    <!-- 商品信息 -->
                                    <view class="m-l-20" style="width: 100%">
                                        <view
                                            class="normal md bold"
                                            @click="toDetail(el.shop_goods_id)"
                                            >{{ el.name }}
                                        </view>
                                        <view
                                            class="muted line-2 xs"
                                            @click="toDetail(el.shop_goods_id)"
                                            >{{ el.remark }}
                                        </view>
                                        <view class="flex row-between" style="width: 100%">
                                            <price
                                                :content="el.price"
                                                main-size="32rpx"
                                                minor-size="22rpx"
                                                :color="themeColor"
                                            >
                                            </price>

                                            <!-- Add ShoppingCart -->
                                            <number-box
                                                :isZero="true"
                                                v-if="
                                                    el.goods_item.length === 1 &&
                                                    el.goods_material.length === 0
                                                "
                                                @change="
                                                    numberChange(
                                                        $event,
                                                        el.cart_goods_num,
                                                        el.cart_id,
                                                        el.goods_item[0].id
                                                    )
                                                "
                                                v-model="el.cart_goods_num"
                                            >
                                            </number-box>

                                            <!-- 规格选择 -->
                                            <view
                                                class="opt xs br60 white"
                                                @click="openSpecItem($event, el)"
                                                v-if="
                                                    el.goods_item.length > 1 ||
                                                    el.goods_material.length >= 1
                                                "
                                            >
                                                <text
                                                    class="flex row-center"
                                                    v-if="el.cart_goods_num >= 1"
                                                    >{{ el.cart_goods_num }}</text
                                                >
                                                选规格
                                            </view>
                                        </view>
                                    </view>
                                </view>
                            </view>
                        </view>
                    </scroll-view>
                </view>
            </view>

            <view class="empty order flex-col row-center" v-show="shopData == null">
                <view class="flex row-center">
                    <image
                        :src="'../../static/images/empty_shop.png'"
                        style="width: 300rpx; height: 300rpx"
                    ></image>
                </view>
                <view class="flex row-around p-30">
                    <button
                        class="br60 m-r-30 bg-body"
                        style="width: 300rpx"
                        @click="toStoreList('', true)"
                    >
                        去选择
                    </button>
                </view>
            </view>
        </mescroll-body>

        <!-- Footer -->
        <view class="cart flex row-between">
            <view class="cart-item flex row-center" ref="btn" @click="showCartList = !showCartList">
                <image src="@/static/images/shop_cart.png" mode=""></image>
                <view class="tips xs">
                    {{ cartList.total_num || '0' }}
                </view>
            </view>
            <view class="cart-price">
                <price
                    :content="cartList.total_amount || 0"
                    main-size="36rpx"
                    minor-size="22rpx"
                    color="#222"
                >
                </price>
            </view>
            <view class="result flex row-center" @click="toBuy">去结算</view>
        </view>

        <u-modal
            z-index="10000"
            v-model="showShopNotData"
            :show-cancel-button="false"
            confirm-text="确定"
            :confirm-color="themeColor"
            :show-title="false"
            @confirm="toStoreList(order_type)"
        >
            <view class="flex-col col-center tips-dialog p-t-40">
                <view class="bold xl normal p-b-20">温馨提示</view>
                <view class="m-t-30 p-b-50">该店铺暂无商品，请重新选择店铺</view>
            </view>
        </u-modal>

        <!-- 不支持的订单类型 -->
        <u-modal
            z-index="10000"
            v-model="showShopTips"
            :show-cancel-button="false"
            confirm-text="确定"
            :confirm-color="themeColor"
            :show-title="false"
            @confirm="showShopTips = false"
        >
            <view class="flex-col col-center tips-dialog p-t-40">
                <view class="bold xl normal p-b-20">温馨提示</view>
                <view class="m-t-30 p-b-50"
                    >当前门店暂不支持{{ this.order_type == 1 ? '门店自取' : '外卖配送' }}</view
                >
            </view>
        </u-modal>

        <!-- 规格 -->
        <spec-popup
            ref="spec"
            v-model="showSpecPop"
            @change="changeCartList"
            :spec="optSpec"
        ></spec-popup>

        <!-- 购物车列表 -->
        <cart-list
            @change="changeCartList"
            :lists="cartList.lists"
            v-model="showCartList"
        ></cart-list>

        <!-- 加载动画 -->
        <loading-view v-if="loading"></loading-view>

        <!-- 底部tabbar -->
        <tabbar :active="1"></tabbar>
    </view>
</template>

<script>
import { mapActions, mapMutations } from 'vuex'
import MescrollMixin from '@/components/mescroll-uni/mescroll-mixins'
import {
    getCartList, //获取购物车数据
    getShopGoodsList, //获取商品数据
    addShopCart, //添加购物车
    deleteGoods, //删除购物车商品
    changeGoodsCount //更改购物车数量
} from '@/api/store'
import { debounce } from '@/utils/tools.js'
import { paramsToStr, currentPage, toast } from '../../utils/tools'

export default {
    mixins: [MescrollMixin],
    data() {
        return {
            loading: true, //加载

            toView: '', //右侧内容锚点
            toAsideView: '', //左侧分类锚点

            scrollTop: 0, //保存scroll-view的滚动条高度，防止数据更新后出现问题

            cateList: [], //分类数据
            active: 0, //当前的分类索引

            classScrollTop: '', //左侧列表点击滑动
            goodsScrollTop: '', //右侧滑动更改左侧索引值

            optSpec: {}, //选规格当前商品数据
            showSpecPop: false, //显示规格组件

            showCart: true,

            showCartList: false, //显示购物车组件

            cartList: {
                lists: [],
                //购物车金额和数量
                total_amount: 0,
                total_num: 0
            },

            order_type: 1, //
            showShopNotData: false, //门店暂无商品
            showShopTips: false //门店是否支持外卖
        }
    },

    methods: {
        // 下拉刷新
        async downCallback() {
            this.changeCartList()
            this.mescroll.endSuccess(0, false)
            this.$refs.coupon.getReceiveCoupon()
        },

        // 更新购物车状态
        changeCartList() {
            if (this.shopData == null) return
            this.getCartListFun()
            this.getShopGoodsListFun()
        },

        // 获取购物车列表
        getCartListFun() {
            getCartList({
                shop_id: this.shopData ? this.shopData.id : this.toStoreList()
            }).then((res) => {
                this.cartList = res.data
            })
        },

        // 获取当前店铺的商品数据
        getShopGoodsListFun() {
            if (!this.shopData) {
                return this.toStoreList()
            }
            getShopGoodsList({
                shop_id: this.shopData.id
            }).then((res) => {
                this.cateList = res.data
                this.$nextTick(() => {
                    if (res.data.length == 0) {
                        if (this.shopData != null) {
                            this.showShopNotData = true
                        }
                    } else {
                        this.loading = false
                        this.baseLocation()
                    }
                })
            })
        },

        // 初始化scroll-view的头部位置锚点
        baseLocation() {
            let data = this.cateList
            this.$nextTick(() => {
                try {
                    data.forEach((item, index) => {
                        const title = uni.createSelectorQuery().select(`#p${index}`)
                        title
                            .boundingClientRect((res) => {
                                item.top = res.top += this.scrollTop
                            })
                            .exec()
                    })
                    if (data[0].top == undefined) {
                        this.cateList = data
                    }
                } catch (err) {
                    console.log(err)
                }
            })
        },

        // 选择对应分类
        changeActive(index) {
            this.active = index
            this.toView = 'p' + index // 跳转到对应分类头部
        },

        // 滚动条滚动
        scrollView(event) {
            this.cateList.forEach((item, index) => {
                if (event.detail.scrollTop >= item.top - 160) {
                    this.active = index
                    this.toAsideView = 'aside' + index
                    this.scrollTop = event.detail.scrollTop - 0
                }
            })
        },

        // 切换门店订单类型
        changeOrderType(event) {
            // if (!this.isLogin) return this.goLogin()
            const data = this.shopData.delivery_type
            const res = data.some((item) => item == event.text)
            if (!res) {
                this.order_type = this.order_type == 1 ? 2 : 1
                this.showShopTips = true
            }
        },

        // 商品的更改
        numberChange(event, num, cart_id, item_id) {
            if (this.showCartList == false) {
                // 删除商品
                if (event.value == 0 && cart_id != 0) this.delCartFun(cart_id)
                // 添加商品
                if (event.value > 0 && cart_id == 0) this.addCartFun(event.value, item_id)
                // 更改商品
                if (cart_id != 0 && event.value > 0) this.changeNumberFun(event.value, cart_id)
            }
        },

        // 添加购物车
        addCartFun(val, id) {
            addShopCart({
                shop_id: this.shopData.id,
                item_id: id,
                num: val,
                material_ids: []
            }).then((res) => {
                this.changeCartList()
            })
        },

        // 删除购物车
        delCartFun(id) {
            deleteGoods({
                cart_ids: [id]
            }).then((res) => {
                this.changeCartList()
            })
        },

        // 修改购物车数量
        changeNumberFun(val, id) {
            changeGoodsCount({
                cart_id: id,
                num: val
            }).then((res) => {
                if (res.code === 0) this.getShopGoodsListFun()
                else this.getCartListFun()
            })
        },

        // 点击选规格时
        openSpecItem(event, el) {
            if (!this.isLogin) return this.goLogin()
            this.optSpec = {
                ...el
            }
            this.showSpecPop = true
        },

        //去选择地址
        toStoreList(type = '', is_nextTick) {
            // if (!this.isLogin) return this.goLogin()
            this.showShopNotData = false
            if (is_nextTick != undefined) {
                this.$Router.push({
                    path: '/bundle/pages/store_list/store_list?type=' + type
                })
            } else {
                setTimeout(() => {
                    this.$Router.push({
                        path: '/bundle/pages/store_list/store_list?type=' + type
                    })
                }, 500)
            }
        },

        // 去商品详情
        toDetail(id) {
            this.$Router.push({
                path: '/pages/goods_detail/goods_detail',
                query: {
                    id: id
                }
            })
        },

        //去结算商品
        toBuy() {
            console.log(this)
            if (!this.isLogin) return this.goLogin()
            if (this.cartList.total_num == 0)
                return this.$toast({
                    title: '请先选择商品'
                })
            this.$Router.push({
                path: '/pages/confirm_order/confirm_order',
                query: {
                    type: this.order_type
                }
            })
        },

        goLogin() {
            if (this.isLogin) {
                uni.navigateTo({
                    url: '/bundle/pages/user_profile/user_profile'
                })
                return
            }
            uni.navigateTo({
                url: '/pages/login/login'
            })
        }
    },
    onShow() {
        const { type } = this.$Route.query
        if (type) {
            this.order_type = type
        }

        setTimeout(() => {
            // 获取公告组件数据
            this.$refs?.notice?.getNoticeFun()
            if (this.shopData && Object.keys(this.shopData).length) {
                this.$nextTick(() => {
                    this.getShopGoodsListFun() //获取商品数据
                    this.getCartListFun() //获取购物车
                    this.$refs?.coupon?.getReceiveCoupon()
                })
            } else {
                this.loading = false
            }
        }, 0)
        // 获取数据

        // this.toStoreList(type == undefined ? '' : type);
    },
    onLoad() {
        this.changeCartList()
    },
    onUnload() {
        // 移除监听事件 优化性能
        uni.$off('setShopData')
    }
}
</script>

<style lang="scss">
page {
    background-color: #ffffff;
}

.header {
    background-color: #ffffff;
    box-shadow: 0px 1px 5px rgba(229, 229, 229, 0.6), 0px -1px 5px rgba(229, 229, 229, 0.6);

    .header-content {
        padding: 20rpx;
    }
}

.order {
    height: calc(100vh - 464rpx - env(safe-area-inset-bottom) ;);
    background-color: #fff;

    .aside {
        width: 180rpx;
        flex: none;
        height: 100%;
        padding-bottom: 80rpx;
        background-color: $-color-body;

        .aside-item {
            position: relative;
            text-align: center;
            padding: 26rpx 10rpx;

            &.active {
                color: $-color-normal;
                background: #ffffff;
                font-size: 26rpx;
                font-weight: bold;
            }

            .active-line {
                position: absolute;
                width: 6rpx;
                height: 30rpx;
                left: 4rpx;
                top: 50%;
                transform: translateY(-50%);
            }
        }
    }

    .main {
        height: 100%;
        flex: 1;

        .main-wrap {
            position: relative;
            padding: 0 20rpx 140rpx 20rpx;

            .title {
                color: $-color-normal;
                margin-top: 30rpx;
            }

            .goods-item {
                margin-top: 30rpx;
            }

            .opt {
                margin: 8rpx;
                padding: 8rpx 20rpx;
                position: relative;
                @include background_color();

                text {
                    color: #ffffff;
                    position: absolute;
                    top: -20rpx;
                    right: -20rpx;
                    width: 40rpx;
                    height: 40rpx;
                    font-size: 20rpx;
                    border-radius: 50%;
                    border: 1rpx solid #ffffff;
                    @include background_color();
                }
            }
        }
    }
}

// 底部cart
.cart {
    width: 100%;
    height: 100rpx;
    position: fixed;
    padding-bottom: 10px;
    margin-bottom: env(safe-area-inset-bottom);
    bottom: 90rpx;
    z-index: 889;
    background-color: $-color-body;

    .cart-item {
        width: 100rpx;
        height: 100rpx;
        position: relative;
        border-radius: 50%;
        margin: 0 0 20rpx 30rpx;
        background-color: #ffffff;
        box-shadow: 0 0 10rpx rgba($color: #000000, $alpha: 0.1);

        image {
            width: 48rpx;
            height: 48rpx;
        }

        .tips {
            top: 0;
            right: 0;
            width: 36rpx;
            height: 36rpx;
            color: #ffffff;
            line-height: 36rpx;
            text-align: center;
            border-radius: 50%;
            position: absolute;
            @include background_color();
        }
    }

    .cart-price {
        position: absolute;
        left: 22%;
        top: 50%;
        transform: translateY(-50%);
    }

    .result {
        width: 240rpx;
        height: 100rpx;
        color: #ffffff;
        margin-top: 20rpx;
        @include background_color();
    }
}
</style>
