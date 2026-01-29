<template>
    <view :data-theme="themeName" class="u-skeleton">
        <view class="store-header flex row-between bg-white">
            <view class="flex nr normal u-skeleton-rect" @click="toAddressSwitch">
                <view class="name m-r-14 line-1">{{ areaData.name || '请选择地址' }}</view>
                <u-icon name="arrow-right" size="24"></u-icon>
            </view>
            <view
                :style="{ width: hideRight == false ? '430rpx' : '300rpx' }"
                class="u-skeleton-rect"
            >
                <u-search
                    :hideRight="true"
                    :show-action="true"
                    action-text="取消"
                    :animation="true"
                    @focus="hideRight = false"
                    @blur="hideRight = true"
                    @custom="cancel"
                    placeholder="搜索门店"
                    height="60"
                    @change="getShoplistFun"
                    v-model="keyword"
                ></u-search>
            </view>
        </view>

        <map
            style="width: 750rpx; height: 500rpx"
            class="u-skeleton-rect"
            show-location
            :latitude="areaData.latitude"
            :longitude="areaData.longitude"
            :markers="markers"
        ></map>

        <view class="store-box">
            <mescroll-body
                ref="mescrollRef"
                height="100%"
                @init="mescrollInit"
                @down="downCallback"
                @up="upCallback"
                :down="downOption"
                :up="upOption"
            >
                <block v-for="(item, index) in lists" :key="index">
                    <view class="store_list flex" @click="onSelectStore(item)">
                        <view class="left">
                            <view class="flex normal lg bold u-skeleton-rect">
                                <image
                                    v-if="item.have_coupon"
                                    src="../../static/coupon_icon.png"
                                ></image>

                                {{ item.name }}
                                <template v-if="item.status == 1">
                                    <text
                                        class="in-operation tips"
                                        :style="{
                                            background: 'rgba( ' + color(themeColor) + ',.1)'
                                        }"
                                        >营业中</text
                                    >
                                </template>
                                <template v-else>
                                    <text class="rest tips">休息中</text>
                                </template>
                            </view>
                            <view class="normal xs mt-t7 u-skeleton-rect"
                                >距离您 {{ item.distance }}</view
                            >
                            <view
                                class="xs m-t-10 u-skeleton-rect"
                                style="color: #555; width: 440rpx"
                            >
                                {{ item.address_detail }}
                            </view>
                            <view class="muted xs m-t-10 u-skeleton-rect">
                                营业时间：{{ item.business }}
                            </view>
                        </view>
                        <view class="line"></view>
                        <view class="right">
                            <view class="flex row-between">
                                <view class="xs u-skeleton-rect" @click.stop="openTel(item.phone)">
                                    <image src="../../static/contact_icon.png"></image>
                                    <view>电话</view>
                                </view>
                                <view class="xs u-skeleton-rect" @click.stop="openLocation(item)">
                                    <image src="../../static/adress_icon.png"></image>
                                    <view>导航</view>
                                </view>
                            </view>
                            <template v-if="item.status == 1">
                                <view
                                    class="select white u-skeleton-rect flex sm row-center m-t-45"
                                >
                                    去下单
                                </view>
                            </template>
                            <template v-else>
                                <view
                                    style="background: #e5e5e5"
                                    class="select white flex sm row-center m-t-45"
                                >
                                    去下单
                                </view>
                            </template>
                        </view>
                    </view>
                </block>
            </mescroll-body>
        </view>

        <u-action-sheet :list="list" @click="actionTen" v-model="showTen"></u-action-sheet>

        <!-- 骨架屏 -->
        <u-skeleton :loading="loading" :animation="true" bgColor="#FFF"></u-skeleton>
    </view>
</template>

<script>
import { getShoplist } from '@/api/store.js'
import MescrollCompMixin from '@/components/mescroll-uni/mixins/mescroll-comp'
import MescrollMixin from '@/components/mescroll-uni/mescroll-mixins'
import { mapActions, mapGetters, mapMutations } from 'vuex'
import { copy, colorRgb, jsonp } from '@/utils/tools'
export default {
    mixins: [MescrollMixin, MescrollCompMixin],
    data() {
        return {
            loading: true,
            flag: false,
            hideRight: true,

            is_home: '',

            showTen: false, //显示选择电话组件
            list: [
                {
                    text: '手机号'
                },
                {
                    text: '呼叫'
                }
            ],

            lists: [{}, {}, {}],
            areaData: {
                name: '请选择地址～',
                latitude: 0,
                longitude: 0
            },
            markers: [],
            keyword: '',

            downOption: {
                auto: false // 不自动加载 (mixin已处理第一个tab触发downCallback)
            },
            upOption: {
                auto: true, // 不自动加载
                noMoreSize: 4, //如果列表已无数据,可设置列表的总数量要大于半页才显示无更多数据;避免列表数据过少(比如只有一条数据),显示无更多数据会不好看; 默认5
                empty: {
                    icon: '/static/images/',
                    tip: '暂无订单！', // 提示
                    fixed: true,
                    top: '200rpx'
                }
            }
        }
    },

    computed: {
        ...mapGetters(['appConfig', 'location'])
    },

    methods: {
        ...mapMutations(['setShopData']),
        ...mapActions(['getLocationFunc']),

        color(color) {
            return colorRgb(color)
        },

        async downCallback() {
            await this.getShoplistFun()
            // this.$refs.mescrollItem.getData()
        },

        // 获取定位地址
        getLocation() {
            this.getLocationFunc().then((res) => {
                console.log(res)
                this.getShoplistFun()
                if (res == false) return
                this.areaData.latitude = this.location.latitude
                this.areaData.longitude = this.location.longitude
                this.getAddress(this.areaData)
            })
        },

        // 逆解析地址
        async getAddress(location) {
            let that = this
            // #ifdef H5
            try {
                const res = await jsonp('https://apis.map.qq.com/ws/geocoder/v1', {
                    key: that.appConfig.map_key,
                    location: `${location.latitude},${location.longitude}`,
                    output: 'jsonp'
                })
                const data = res.result
                that.areaData.name = data.address
            } catch (err) {
                console.log(JSON.stringify(err))
                uni.showToast({
                    title: JSON.stringify(err),
                    icon: 'none'
                })
            }
            // #endif

            // #ifndef H5
            uni.request({
                url: `https://apis.map.qq.com/ws/geocoder/v1/?location=${location.latitude},${location.longitude}&key=${that.appConfig.map_key}`,
                success(result) {
                    if (result.data.message == '缺少必要字段key')
                        return that.$toast({
                            title: '请在后台配置地图的key值'
                        })
                    const data = result.data.result
                    that.areaData.name = data.address
                }
            })
            // #endif
        },

        cancel() {
            this.keyword = ''
            this.getShoplistFun()
        },

        // 获取门店列表
        getShoplistFun() {
            getShoplist({
                latitude: this.location.latitude,
                longitude: this.location.longitude,
                type: this.type,
                keyword: this.keyword
            }).then((res) => {
                this.flag = false
                this.loading = false
                this.lists = res.data.list
                this.mescroll.endSuccess(res.data.list.length, res.data.more)
                this.markers = this.lists.map((item) => {
                    return {
                        id: item.id,
                        latitude: item.latitude,
                        longitude: item.longitude,
                        iconPath: this.appConfig.shop_login_logo,
                        width: 32,
                        height: 38,
                        callout: {
                            content: item.name,
                            padding: 5,
                            borderRadius: 4,
                            fontSize: 13,
                            display: 'ALWAYS'
                        }
                    }
                })
            })
        },

        // 打开显示选择电话组件
        openTel(phone) {
            this.showTen = true
            this.list[0].text = phone
        },

        // 选择电话
        actionTen(index) {
            if (index == 0) {
                copy(this.list[0].text)
            } else {
                wx.makePhoneCall({
                    phoneNumber: this.list[0].text.toString()
                })
            }
        },

        // 去导航
        openLocation(row) {
            uni.openLocation({
                //?使用微信内置地图查看位置。
                latitude: Number(row.latitude), //要去地点的纬度
                longitude: Number(row.longitude), ///要去地点的经度-地址
                name: row.name, //地点名称
                address: row.address_detail //详细地点名称
            })
        },

        onSelectStore(row) {
            if (row.status == 0)
                return this.$toast({
                    title: '该门店未营业～'
                })

            uni.$emit('setShopData', row)
            this.setShopData(row)

            if (this.type == '') {
                this.$Router.back()
            } else {
                uni.reLaunch({
                    url: '/pages/order/order?type=' + this.type
                })
            }
        },

        toAddressSwitch() {
            this.flag = true
            this.$Router.push({
                path: '/bundle/pages/address_switch/address_switch'
            })
        }
    },

    async onLoad() {
        uni.$on('getLocations', (res) => {
            setTimeout(() => {
                this.flag = true
                this.areaData.name = res.address
                this.areaData.latitude = res.latitude
                this.areaData.longitude = res.longitude
                this.getShoplistFun()
            }, 500)
        })

        const type = this.$Route.query.type || ''
        this.type = type

        if (this.flag == false) {
            console.log('获取定位')
            await this.getLocation()
        }
    },

    onUnload() {
        // 移除监听事件 优化性能
        uni.$off('getLocations')
    }
}
</script>

<style lang="scss">
.store-header {
    width: 100%;
    height: 110rpx;
    padding: 25rpx 24rpx;

    .name {
        width: 300rpx;
    }
}

.store-box {
    height: calc(100vh - 710rpx);

    .store_list {
        padding: 24rpx;
        background: #fff;
        border-radius: 20rpx;
        margin: 20rpx 20rpx 0 20rpx;

        .left {
            margin-right: 15rpx;

            .tips {
                color: #ffffff;
                margin-left: 10rpx;
                padding: 5rpx 17rpx;
                font-size: 22rpx;
            }

            .rest {
                background: #e5e5e5;
            }

            .in-operation {
                @include font_color();
            }

            image {
                width: 40rpx;
                height: 28rpx;
                margin-right: 20rpx;
            }
        }

        .line {
            width: 3rpx;
            height: 180rpx;
            background: #e5e5e5;
        }

        .right {
            width: 200rpx;
            padding-left: 50rpx;

            image {
                width: 48rpx;
                height: 48rpx;
            }

            .select {
                width: 140rpx;
                height: 60rpx;
                border-radius: 10rpx;
                @include background_color();
            }
        }
    }
}
</style>
