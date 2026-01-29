<template>
    <view :data-theme="themeName">
        <view class="confirm-order u-skeleton">
            <!-- 头部 -->
            <view class="header wrap bg-white">
                <view class="address u-skeleton-rect">
                    <template v-if="order_type == 1">
                        <view class="flex col-center">
                            <view class="flex-1 m-r-20" @click="openMap">
                                <view class="black md">{{ shopLists.name }}</view>
                                <view class="muted xs"
                                    >距离您{{
                                        shopLists.delivery_distance
                                    }}km，请确认下单门店是否正确</view
                                >
                            </view>
                            <u-icon name="arrow-right" color="#555" size="26"></u-icon>
                        </view>
                    </template>
                    <template v-if="order_type == 2">
                        <navigator
                            hover-class="none"
                            class="flex-1"
                            url="/bundle/pages/user_address/user_address?type=1"
                        >
                            <view class="m-r-20">
                                <view class="black md" v-if="address.length == 0"
                                    >设置收货地址</view
                                >
                                <view v-else>
                                    <view class="flex">
                                        <view class="lg normal line-1">
                                            {{ address.location || '' }}{{ address.address || '' }}
                                        </view>
                                        <u-icon name="arrow-right" color="#555" size="26"></u-icon>
                                    </view>

                                    <text class="name muted md m-r-10">{{ address.contact }}</text>
                                    <text class="muted md">{{ address.telephone }}</text>
                                </view>
                            </view>
                        </navigator>
                    </template>
                    <!-- <swich
                        @change="changeOrderType"
                        v-model="order_type"
                        firstText="自取"
                        lastText="外卖"
                    ></swich> -->
                    <view class="m-t-35 flex row-between">
                        <view
                            class="flex col-center row-center p-t-20 p-b-20 no-select-type"
                            :class="{ 'is-select-type': order_type == 1 }"
                            style="width: 300rpx"
                            @click="changeOrderType({ text: '1' })"
                        >
                            <image
                                style="width: 40rpx; height: 40rpx"
                                src="@/static/images/in_store.png"
                            ></image>
                            <view class="m-l-20">店内堂食</view>
                        </view>
                        <view
                            class="flex col-center row-center p-t-20 p-b-20 no-select-type"
                            :class="{ 'is-select-type': order_type == 2 }"
                            style="width: 300rpx"
                            @click="changeOrderType({ text: '2' })"
                        >
                            <image
                                style="width: 40rpx; height: 40rpx"
                                src="@/static/images/out_store.png"
                            ></image>
                            <view class="m-l-20">外卖配送</view>
                        </view>
                    </view>
                </view>
            </view>
            <view class="wrap bg-white header" v-if="order_type == 1">
                <!-- 订单类型为自取时 -->
                <view class="content m-t-20 p-b-20" style="border-bottom: 1px solid #f2f2f2">
                    <u-radio-group v-model="dining_type">
                        <view class="flex row-around" style="width: 100%">
                            <u-radio
                                style="display: flex; justify-content: center; flex: 1"
                                shape="circle"
                                :active-color="themeColor"
                                v-for="(item, index) in list"
                                :key="index"
                                :name="item.name"
                            >
                                <text class="u-skeleton-rect">{{ item.label }}</text>
                            </u-radio>
                        </view>
                    </u-radio-group>
                </view>
                <template v-if="dining_type == 2">
                    <view class="form-wrap flex" @click="showTimePop">
                        <view class="label u-skeleton-rect"> 取餐时间 </view>
                        <view class="content flex-1 flex row-right">
                            <view class="time m-r-15 u-skeleton-rect">{{ selectTimeString }}</view>
                            <u-icon name="arrow-right" class="u-skeleton-rect"></u-icon>
                        </view>
                    </view>
                    <!-- <view class="form-wrap flex">
                        <view class="label u-skeleton-rect"> 就餐方式 </view>
                        <view class="content flex-1 flex row-right">
                            <u-radio-group v-model="dining_type">
                                <u-radio shape="circle" :active-color="themeColor" v-for="(item, index) in list"
                                    :key="index" :name="item.name">
                                    <text class="u-skeleton-rect">{{ item.label }}</text>
                                </u-radio>
                            </u-radio-group>
                        </view>
                    </view> -->
                    <view class="form-wrap flex">
                        <view class="label u-skeleton-rect"> 预留手机 </view>
                        <view class="content flex-1 flex row-right">
                            <input
                                type="text"
                                v-model="mobile"
                                class="m-r-20 u-skeleton-rect"
                                placeholder="手机号码"
                            />
                            <!--  #ifdef MP -->

                            <button
                                class="get-phone xxs u-skeleton-rect br60 row-center flex"
                                open-type="getPhoneNumber"
                                @getphonenumber="getPhoneNumber"
                                :style="{ background: 'rgba(' + color(themeColor) + ',.1)' }"
                            >
                                自动填写
                            </button>
                            <!-- #endif -->
                        </view>
                    </view>
                </template>
                <template v-if="dining_type == 1 && WeixinClient">
                    <view class="form-wrap flex">
                        <view class="label u-skeleton-rect"> 桌号 </view>
                        <view class="content flex-1 flex row-right col-center" @click="toScan">
                            <view v-if="desk_id == ''" class="muted"> 请扫码桌号 </view>
                            <view v-else class="m-r-20">
                                <view :style="'color:' + color(themeColor) + ';text-align: end;'"
                                    >{{ desk_number }}
                                </view>
                                <view class="muted xxs">支付后请耐心等待，店员将为您送餐</view>
                            </view>
                            <u-icon name="scan" size="32"></u-icon>
                        </view>
                    </view>
                </template>
            </view>

            <!-- 商品信息 -->
            <view class="goods-wrap wrap bg-white">
                <view class="goods-wrap-title normal bold md u-skeleton-rect">商品详情</view>

                <view class="goods-wrap-main u-skeleton-rect">
                    <block v-for="(item, index) in goodsData" :key="index">
                        <goods-card :data="item"></goods-card>
                    </block>
                </view>

                <template v-if="order_type == 2">
                    <view class="lighter xs">
                        <!-- <view class="flex row-between m-t-30">
                            包装费
                            <price fontWeight="600" :content="order_amount" main-size="26rpx" minor-size="26rpx"
                                color="#222222">
                            </price>
                        </view> -->
                        <view class="flex row-between m-t-20 p-l-20 p-r-20">
                            配送费
                            <price
                                fontWeight="600"
                                :content="delivery_amount"
                                main-size="26rpx"
                                minor-size="26rpx"
                                color="#222222"
                            >
                            </price>
                        </view>
                    </view>
                </template>

                <order-coupon @change="handleChange"></order-coupon>

                <view class="goods-wrap-footer flex row-right lighter m-t-12 u-skeleton-rect">
                    共{{ goods_num }}件商品，小计
                    <price
                        fontWeight="600"
                        :content="order_amount"
                        main-size="36rpx"
                        minor-size="26rpx"
                        color="#222222"
                    >
                    </price>
                </view>
            </view>

            <!-- 备注 -->
            <view class="remarks wrap bg-white">
                <view class="flex u-skeleton-rect">
                    <view class="m-r-24 p-b-4">备注</view>
                    <input
                        placeholder-style="color: #C0C0C0"
                        type="text"
                        v-model="remarks"
                        class="flex-1"
                        placeholder="我们将尽力满足您的要求"
                    />
                </view>
            </view>

            <!-- 底部结算信息 -->
            <view class="footer flex row-between fixed">
                <view class="all-price lg flex u-skeleton-rect">
                    <price
                        fontWeight="600"
                        :content="order_amount"
                        main-size="36rpx"
                        minor-size="26rpx"
                        color="#222222"
                    >
                    </price>
                </view>
                <view
                    class="btn u-skeleton-rect flex row-center white"
                    size="md"
                    hover-class="none"
                    @tap="onSubmitOrder"
                >
                    提交订单
                </view>
            </view>
        </view>

        <!-- 选择取餐时间 -->
        <!-- <u-picker
            mode="selector"
            @confirm="mealPickUpTime"
            :confirm-color="themeColor"
            v-model="showTime"
            :default-selector="[0]"
            :range="mealPickUpTimeObj"
            range-key="name"
        >
        </u-picker> -->
        <!-- <u-picker
            mode="multiSelector"
            @confirm="handleConfirm"
            :confirm-color="themeColor"
            v-model="showTime"
            :default-selector="[0, 0]"
            :range="mealPickUpTimeArr"
            @columnchange="handleColumnchange"
        >
        </u-picker> -->
        <u-select
            v-model="showTime"
            :list="mealPickUpTimeArr"
            mode="mutil-column-auto"
            :confirm-color="themeColor"
            @confirm="handleConfirm"
        ></u-select>
        <!-- 不支持的订单类型 -->
        <u-modal
            z-index="100000"
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

        <!-- 加载 -->
        <loading-view v-if="showLoading"></loading-view>

        <!-- 骨架屏 -->
        <u-skeleton :loading="loading" :animation="true" bgColor="#FFF"></u-skeleton>
    </view>
</template>

<script>
import {
    getWxMnpMobile //获取微信手机号码
} from '@/api/user'
import { orderBuy } from '@/api/order'
import { mapGetters } from 'vuex'
import {
    getWxCode //获取code
} from '@/utils/login'
import {
    getMnpNotice //获取订阅
} from '@/api/app'
import { apiOrderBuyCouponList } from '@/api/store.js'
import { colorRgb, strToParams } from '@/utils/tools'
import wechath5 from '@/utils/wechath5'
import { isWeixinClient } from '../../utils/tools'
export default {
    data() {
        return {
            loading: true, //骨架屏

            WeixinClient: true,

            showLoading: false,
            shopLists: {}, //店铺信息
            goodsData: [], //商品信息
            delivery_amount: 0, //配送费

            couponId: '', //优惠券ID

            order_amount: 0, //小计
            total_amount: 0, //总资
            goods_num: 0, //商品数量

            order_type: 1, //订单类型 1 == 自取 2 == 外卖
            dining_type: 1, //就餐方式 1 == 就餐 2 == 打包
            desk_id: '', //桌号id
            desk_number: '', //桌号
            list: [
                {
                    name: '1',
                    label: '店内就餐'
                },
                {
                    name: '2',
                    label: '打包带走'
                }
            ],
            mobile: '', //手机号码
            code: '',

            showTime: false, //是否显示取餐组件
            PickUpTime: true,
            selectTimeString: '立即取餐',
            mealPickUpTimeDesc: {
                name: '立即取餐',
                id: true
            },
            mealPickUpTimeArr: [],
            mealPickUpTimeObj: [
                {
                    name: '立即取餐',
                    id: true
                }
            ],
            showShopTips: false, //该门店不支持外卖配送

            address: [], //地址

            remarks: '' // 备注
        }
    },

    computed: {
        ...mapGetters(['userInfo', 'shopData'])
    },

    async onLoad() {
        // #ifdef H5
        this.WeixinClient = isWeixinClient()
        // #endif

        // #ifdef MP
        this.code = await getWxCode()
        // #endif

        uni.$on('selectaddress', (e) => {
            setTimeout(() => {
                this.addressId = e.id
                this.orderBuyFun()
            }, 200)
        })

        uni.$on('payment', (params) => {
            setTimeout(() => {
                if (params.result == true) {
                    uni.redirectTo({
                        url: `/pages/order_detail/order_detail?order_id=${params.order_id}`
                    })
                } else if (params.result == false) {
                    uni.switchTab({
                        url: '/pages/order_list/order_list'
                    })
                }
            }, 200)
        })

        this.order_type = Number(this.$Route.query.type)
        this.mobile = this.userInfo.mobile
        this.orderBuyFun()
    },

    onShow() {
        if (this.shopData.id == uni.getStorageSync('sid')) {
            this.desk_id = uni.getStorageSync('did')
            this.desk_number = uni.getStorageSync('num')
        }
    },

    // 页面销毁
    onUnload() {
        uni.$off('payment')
        uni.$off('selectaddress')
        uni.removeStorageSync('sid')
        uni.removeStorageSync('did')
        uni.removeStorageSync('num')
    },

    methods: {
        handleChange(id) {
            this.couponId = id
            this.orderBuyFun()
        },
        color(color) {
            return colorRgb(color)
        },

        // 切换门店订单类型
        async changeOrderType(event) {
            const data = this.shopData.delivery_type
            uni.showLoading()
            if (data != undefined) {
                const res = data.some((item) => item == event.text)
                if (!res) {
                    this.order_type = this.order_type == 1 ? 2 : 1
                    this.showShopTips = true
                } else {
                    this.order_type = this.order_type == 1 ? 2 : 1
                    await this.orderBuyFun()
                }
            } else {
                await this.orderBuyFun()
            }
            uni.hideLoading()
        },

        // 选择取餐时间
        mealPickUpTime(event) {
            this.mealPickUpTimeDesc = this.mealPickUpTimeObj[event[0]]
        },

        // 获取手机号
        async getPhoneNumber(e) {
            this.code = await getWxCode()
            const { encryptedData, iv } = e.detail
            let data = {
                code: this.code,
                encrypted_data: encryptedData,
                iv
            }
            if (encryptedData) {
                getWxMnpMobile({
                    ...data
                }).then((res) => {
                    this.mobile = res.data.purePhoneNumber
                })
            }
        },

        // 小程序订阅服务消息
        getAuthMsg() {
            return new Promise((resolve) => {
                getMnpNotice({
                    scene: 1,
                    order_type: this.order_type
                }).then((res) => {
                    if (res.code == 1) {
                        uni.requestSubscribeMessage({
                            tmplIds: res.data,
                            complete() {
                                resolve()
                            }
                        })
                    } else {
                        resolve()
                    }
                })
            })
        },

        // 确认下单
        onSubmitOrder() {
            uni.showModal({
                title: '温馨提示',
                content: '是否确认下单?',
                confirmColor: this.themeColor,
                success: async (res) => {
                    let { confirm } = res
                    if (confirm) {
                        // #ifdef MP-WEIXIN
                        await this.getAuthMsg()
                        //#endif
                        // this.showLoading = true
                        this.orderBuyFun('submit')
                    }
                }
            })
        },

        async orderBuyFun(action = '') {
            const submitObj = {
                action,
                cl_id: this.couponId,
                address_id: this.addressId,
                shop_id: this.shopData.id,
                order_type: this.order_type,
                dining_type: this.dining_type,
                mobile: this.mobile,
                user_remark: this.remarks,
                appoint_time: this.PickUpTime,
                desk_id: this.desk_id
            }
            let {
                data: orderData,
                code: orderCode,
                msg: orderMsg
            } = await orderBuy(submitObj).catch((err) => {
                console.log(err)
                setTimeout(() => {
                    uni.navigateBack(1)
                }, 500)
            })

            if (orderMsg == '抱歉,库存不足') {
                setTimeout(() => {
                    uni.navigateBack(1)
                }, 500)
            }

            if (orderMsg.indexOf('元起送') != -1) {
                this.order_type = 1
                this.orderBuyFun()
            } else if (orderMsg.indexOf('超出配送') != -1) {
                return (this.showLoading = false)
            }

            if (orderCode != 1) this.showLoading = false
            if (action == '') {
                const {
                    shop,
                    user_address,
                    goods,
                    delivery_amount,
                    order_amount,
                    goods_num,
                    total_amount
                } = orderData
                this.delivery_amount = delivery_amount
                this.address = user_address
                this.shopLists = shop
                this.goodsData = goods
                this.total_amount = total_amount
                this.order_amount = order_amount
                this.goods_num = goods_num
                // 获取到订单数据后更新取餐时间
                this.mealPickUpTimeObj = [
                    {
                        name: '立即取餐',
                        id: true
                    }
                ]
                this.randomTime(shop.business_end_time, shop.business_start_time)

                this.$nextTick(() => {
                    this.loading = false
                })
            } else if (action == 'submit') {
                this.showLoading = false
                if (orderCode != 1) return
                let order_id = orderData.order_id

                uni.navigateTo({
                    url: `/pages/payment/payment?order_id=${order_id}`
                })
            }
        },

        // 生成取餐时间
        // randomTime(timeString, startTime) {
        //     let hour = timeString.split(':')[0]
        //     let min = timeString.split(':')[1]
        //     let shour = startTime.split(':')[0]
        //     let smin = startTime.split(':')[1]
        //     let curH = new Date().getHours() //获取当前小时数
        //     let curM = new Date().getMinutes() //获取当前分钟数
        //     if (shour > hour || (shour == hour && smin > min)) {
        //         for (let i = curH; i <= shour; i++) {
        //             for (let j = 0; j < 60; j += 10) {
        //                 // 不能小于当前时间
        //                 if (curH == i) {
        //                     if (j < curM) continue
        //                 }
        //                 const time = i + ':' + (j < 10 ? '0' + j : j)
        //                 // 不能大于给定的时间
        //                 if (i >= hour) {
        //                     if (j >= min) continue
        //                 }
        //                 this.mealPickUpTimeObj.push({
        //                     name: time,
        //                     id: this.getTime(time)
        //                 })
        //             }
        //         }
        //     } else {
        //         for (let i = curH; i <= hour; i++) {
        //             for (let j = 0; j < 60; j += 10) {
        //                 // 不能小于当前时间
        //                 if (curH == i) {
        //                     if (j < curM) continue
        //                 }
        //                 const time = i + ':' + (j < 10 ? '0' + j : j)
        //                 // 不能大于给定的时间
        //                 if (i >= hour) {
        //                     if (j >= min) continue
        //                 }
        //                 this.mealPickUpTimeObj.push({
        //                     name: time,
        //                     id: this.getTime(time)
        //                 })
        //             }
        //         }
        //     }
        // },
        randomTime(timeString, startTime) {
            //第一列
            const today = new Date()
            let curMon = today.getMonth() + 1 //获取当前月份期数
            let curD = today.getDate() //获取当前日期数
            const curString = `${curMon < 10 ? '0' + curMon : curMon}月${
                curD < 10 ? '0' + curD : curD
            }日`
            const tomorrow = new Date(today)
            tomorrow.setDate(today.getDate() + 1) // 获取明天时间
            let tomorrowM = tomorrow.getMonth() + 1 //获取明天月份期数
            let tomorrowD = tomorrow.getDate() //获取明天日期数
            const tomorrowString = `${tomorrowM < 10 ? '0' + tomorrowM : tomorrowM}月${
                tomorrowD < 10 ? '0' + tomorrowD : tomorrowD
            }日`
            this.mealPickUpTimeArr = [
                { value: 1, label: curString, children: [{ label: '立即取餐' }] },
                { value: 2, label: tomorrowString, children: [] }
            ]
            //第二列
            let hour = timeString.split(':')[0]
            let min = timeString.split(':')[1]
            let shour = startTime.split(':')[0]
            let smin = startTime.split(':')[1]
            let curH = new Date().getHours() //获取当前小时数
            let curM = new Date().getMinutes() //获取当前分钟数
            // 16:00-次日06:00隔天模式
            if (shour > hour || (shour == hour && smin > min)) {
                for (let i = curH; i <= 23; i++) {
                    for (let j = 0; j < 60; j += 30) {
                        if (curH == i) {
                            if (j < curM) continue
                        }
                        const time = i + ':' + (j < 10 ? '0' + j : j)
                        this.mealPickUpTimeArr[0].children.push({ label: time })
                    }
                }
                for (let i = 0; i < hour; i++) {
                    for (let j = 0; j < 60; j += 30) {
                        const time = i + ':' + (j < 10 ? '0' + j : j)
                        this.mealPickUpTimeArr[1].children.push({ label: time })
                    }
                }
            } else {
                // 6:00-次日23:00当日模式
                for (let i = curH; i <= hour; i++) {
                    for (let j = 0; j < 60; j += 30) {
                        // 不能小于当前时间
                        if (curH == i) {
                            if (j < curM) continue
                        }
                        const time = i + ':' + (j < 10 ? '0' + j : j)
                        // 不能大于给定的时间
                        if (i >= hour) {
                            if (j >= min) continue
                        }
                        this.mealPickUpTimeArr[0].children.push({ label: time })
                    }
                }
                for (let i = shour; i <= hour; i++) {
                    for (let j = 0; j < 60; j += 30) {
                        const time = i + ':' + (j < 10 ? '0' + j : j)
                        // 不能大于给定的时间
                        if (i >= hour) {
                            if (j >= min) continue
                        }
                        this.mealPickUpTimeArr[1].children.push({ label: time })
                    }
                }
            }
        },

        handleConfirm(e) {
            console.log(e)
            if (e[1].label == '立即取餐') {
                return (this.PickUpTime = true)
            }
            const timeString = e[0].label + e[1].label
            this.selectTimeString = timeString
            this.PickUpTime = this.getTime(timeString) / 1000
            console.log(this.PickUpTime)
        },

        getTime(dateStr) {
            // 提取月、日、时、分
            const [month, day, hour, minute] = dateStr.match(/\d+/g) // 提取数字部分
            // 获取当前年份
            const year = new Date().getFullYear()
            // 构造日期对象
            const date = new Date(year, month - 1, day, hour, minute)
            // 转为时间戳
            return date.getTime()
        },
        //扫描桌号
        toScan() {
            let that = this
            // #ifdef H5
            // const deskData = await wechath5.scanCode()
            // that.desk_id = deskData.desk_id;
            // that.desk_number = deskData.number;
            wechath5.scanCode().then((deskData) => {
                console.log(deskData)
                if (deskData.sid != that.shopData.id) {
                    uni.showToast({
                        title: '不是本店桌号！',
                        duration: 2000,
                        icon: 'none'
                    })
                    return
                }
                Object.keys(deskData).map((item) => {
                    uni.setStorageSync(item, deskData[item])
                })
                that.desk_id = uni.getStorageSync('did')
                that.desk_number = uni.getStorageSync('num')
            })

            // #endif
            //#ifdef MP-WEIXIN

            uni.scanCode({
                success: function (res) {
                    const match = res.path.split('scene=')
                    // const regex = /scene=([^&]*)/;
                    // const match = res.path.match(regex);
                    // // 如果匹配成功，提取参数值并解码
                    if (match) {
                        const encodedValue = match[1]
                        const decodedValue = decodeURIComponent(encodedValue)
                        const deskData = strToParams(decodedValue)
                        if (deskData.sid != that.shopData.id) {
                            uni.showToast({
                                title: '不是本店桌号！',
                                duration: 2000,
                                icon: 'none'
                            })
                            return
                        }
                        Object.keys(deskData).map((item) => {
                            uni.setStorageSync(item, deskData[item])
                        })
                        that.desk_id = uni.getStorageSync('did')
                        that.desk_number = uni.getStorageSync('num')
                        // setTimeout(() => {
                        //   Object.keys(deskData).map(item => {
                        //     uni.removeStorageSync(item)
                        //   })
                        // }, 1000);
                    } else {
                        console.log('未找到scene参数')
                    }
                }
            })
            //#endif
        },
        showTimePop() {
            this.showTime = !this.showTime
        },
        openMap() {
            uni.openLocation({
                latitude: Number(this.shopData.latitude),
                longitude: Number(this.shopData.longitude),
                fail: function (err) {
                    console.log(err)
                }
            })
        }
    },
    // 监听地址选择
    watch: {
        address(val) {
            this.addressId = val.id
        }
    }
}
</script>
<style lang="scss" scoped>
.confirm-order {
    padding: 0 20rpx;
    height: 100vh;

    .wrap {
        overflow: hidden;
        margin-top: 20rpx;
        border-radius: 20rpx;
    }

    .header {
        .address {
            width: 100%;
            padding: 30rpx 24rpx;
            border-bottom: 1px solid #f2f2f2;
        }

        .form-wrap {
            font-size: 28rpx;
            color: $-color-normal;
            padding: 30rpx 24rpx;

            .label {
                width: 130rpx;
            }

            .content {
                input {
                    width: 70%;
                    text-align: right;
                    font-size: 28rpx;
                }

                .time {
                    @include font_color();
                }

                .get-phone {
                    width: 144rpx;
                    height: 44rpx;
                    border-style: solid;
                    border-width: 1px;
                    @include border_color();
                    @include font_color();
                }
            }
        }

        .no-select-type {
            border: 1px solid #ccc;
            border-radius: 10rpx;
            color: #666666;
        }

        .is-select-type {
            border-width: 1rpx;
            border-style: solid;
            @include border_color();
            @include font_color();
            @include background_lighter();
            border-radius: 10rpx;
        }
    }

    .goods-wrap {
        padding: 0 24rpx;

        .goods-wrap-title {
            padding: 28rpx 24rpx;
        }

        .goods-wrap-main {
            min-height: 150rpx;
        }

        .goods-wrap-footer {
            padding: 26rpx 0;
            border-top: 1rpx solid #f2f2f2;
        }
    }

    .remarks {
        width: 100%;
        padding: 30rpx 24rpx;
        margin-bottom: calc(120rpx + env(safe-area-inset-bottom));
    }

    .footer {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        z-index: 100;
        // width: 100%;
        height: 110rpx;
        padding-left: 30rpx;
        box-sizing: content-box;
        background-color: #f2f2f2;
        padding-bottom: env(safe-area-inset-bottom);

        .btn {
            height: 100%;
            padding: 0 50rpx;
            border-radius: 0;
            @include background_color();
        }
    }
}

.u-radio-group {
    width: 100% !important;
}
</style>
