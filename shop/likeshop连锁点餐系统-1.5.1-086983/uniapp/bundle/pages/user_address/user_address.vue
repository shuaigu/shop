<template>
    <view :data-theme="themeName">
        <view class="user-address">
            <view class="no-address flex-col col-center" v-if="!hasAddress">
                <image class="img-null mt20" src="/static/images/address_null.png"></image>
                <view class="sm muted m-t-50">暂无任何地址~</view>
            </view>

            <view class="address-list" v-else>
                <view class="md bold p-t-20 p-b-20">收货地址</view>
                <u-radio-group v-model="currentId" class="radio-group" @change="radioChange" :active-color="themeColor">
                    <view v-for="(item, index) in addressList.normal" :key="index" class="item bg-white m-b-20"
                        @tap="onSelect(item.id)">
                        <view class="address">
                            <view class="consignee md bold">
                                {{ item.contact }}
                                <text class="phone m-l-10">{{ item.telephone }}</text>
                            </view>
                            <view class="lighter sm m-t-10">
                                {{ item.location }} {{ item.address }}
                            </view>
                        </view>
                        <view class="operation flex row-between">
                            <view @tap.stop="">
                                <u-radio activeColor="#101010" class="radio flex" :name="item.id">
                                    <text class="xs">{{
                                        currentId == item.id ? '默认' : '设为默认'
                                    }}</text>
                                </u-radio>
                            </view>
                            <view class="flex row-center">
                                <router-link :to="{
                                        path: '/bundle/pages/address_edit/address_edit',
                                        query: { id: item.id }
                                    }">
                                    <view class="flex m-r-20">
                                        <image class="icon-md m-r-10" src="/static/images/icon_edit.png"></image>
                                        编辑
                                    </view>
                                </router-link>
                                <view class="flex m-l-20" @tap.stop="showSurePop(item.id)">
                                    <image class="icon-md m-r-10" src="/static/images/icon_del_1.png"></image>
                                    删除
                                </view>
                            </view>
                        </view>
                    </view>
                </u-radio-group>
                <view v-if="addressList.abnormal.length">
                    <view class="m-t-60 m-b-20 md bold muted">以下地址超出配送范围</view>
                    <u-radio-group v-model="currentId" class="radio-group" @change="radioChange" :active-color="themeColor">
                        <view v-for="(item, index) in addressList.abnormal" :key="index" class="item bg-white m-b-20 muted">
                            <view class="address">
                                <view class="consignee md bold">
                                    {{ item.contact }}
                                    <text class="phone m-l-10">{{ item.telephone }}</text>
                                </view>
                                <view class="lighter sm m-t-10">
                                    {{ item.location }} {{ item.address }}
                                </view>
                            </view>
                            <view class="operation flex row-between">
                                <view @tap.stop="">
                                    <u-radio disabled activeColor="#101010" class="radio flex" :name="item.id">
                                        <text class="xs">{{
                                            currentId == item.id ? '默认' : '设为默认'
                                        }}</text>
                                    </u-radio>
                                </view>
                                <view class="flex row-center">
                                    <router-link :to="{
                                            path: '/bundle/pages/address_edit/address_edit',
                                            query: { id: item.id }
                                        }">
                                        <view class="flex m-r-20">
                                            <image class="icon-md m-r-10" src="/static/images/icon_edit.png"></image>
                                            编辑
                                        </view>
                                    </router-link>
                                    <view class="flex m-l-20" @tap.stop="showSurePop(item.id)">
                                        <image class="icon-md m-r-10" src="/static/images/icon_del_1.png"></image>
                                        删除
                                    </view>
                                </view>
                            </view>
                        </view>
                    </u-radio-group>
                </view>
            </view>
            <u-modal id="delete-dialog" v-model="deleteSure" :show-cancel-button="true" confirm-text="确认"
                :confirm-color="themeColor" :show-title="false" @confirm="delAddressFun">
                <view class="flex-col col-center tips-dialog p-t-40">
                    <view class="bold xl normal p-b-20">温馨提示</view>
                    <view class="m-t-30 p-b-50">确认删除该地址吗？</view>
                </view>
            </u-modal>
            <view class="footer flex row-between fixed bg-white">
                <!-- #ifdef H5 || MP-WEIXIN -->
                <view class="btn flex row-center bg-gray br60 m-r-20" @click="getWxAddressFun" v-if="isWeixin">
                    <image class="icon-lg m-r-10" src="/static/images/icon_wechat.png"></image>
                    <text class="md">微信导入</text>
                </view>
                <!-- #endif -->
                <router-link class="flex-1" :to="{ path: '/bundle/pages/address_edit/address_edit' }">
                    <view class="btn add-btn white md flex row-center br60">新增收货地址</view>
                </router-link>
            </view>
        </view>
    </view>
</template>

<script>
import { getAddressLists, delAddress, setDefaultAddress } from '@/api/user'
import wechath5 from '@/utils/wechath5'
import { isWeixinClient } from '@/utils/tools'
export default {
    data() {
        return {
            addressList: [],
            hasAddress: true,
            deleteSure: false,
            currentId: 0,
            isWeixin: true
        }
    },

    onLoad(options) {
        this.type = this.$Route.query.type
        //#ifdef H5
        this.isWeixin = isWeixinClient()
        //#endif
    },

    onShow() {
        this.getAddressListsFun()
    },

    methods: {
        onSelect(id) {
            if (this.type) {
                uni.$emit('selectaddress', {
                    id
                })
                uni.navigateBack()
            }
        },
        getAddressListsFun() {
            getAddressLists({ shop_id: this.shopData.id, longitude: this.shopData.longitude, latitude: this.shopData.latitude }).then((res) => {
                if (res.code == 1) {
                    if (res.data.normal.length || res.data.abnormal.length) {
                        this.addressList = res.data
                        const defaultA = res.data.normal.find((item) => item.is_default)
                        this.currentId = defaultA ? defaultA.id : 0
                        this.hasAddress = true
                    } else {
                        this.hasAddress = false
                    }
                } else {
                    this.hasAddress = false
                }
            })
        },

        async radioChange(id) {
            const { code, msg } = await setDefaultAddress(id)
            if (code == 1) {
                this.$toast({
                    title: msg
                })
                this.getAddressListsFun()
            }
        },

        onLoadFun() {
            this.getAddressListsFun()
        },

        delAddressFun() {
            delAddress(this.delectId).then((res) => {
                if (res.code == 1) {
                    this.$toast({
                        title: res.msg
                    })
                    this.deleteSure = false
                    this.getAddressListsFun()
                }
            })
        },

        getWxAddressFun() {
            // #ifdef H5
            wechath5.getWxAddress().then((res) => {
                uni.setStorageSync('wxAddress', JSON.stringify(res))
                setTimeout(() => {
                    this.$Router.push({
                        path: '/bundle/pages/address_edit/address_edit'
                    })
                }, 200)
            })
            // #endif
            // #ifdef MP-WEIXIN
            uni.authorize({
                scope: 'scope.address',
                success: (res) => {
                    uni.chooseAddress({
                        success: (res) => {
                            uni.setStorageSync('wxAddress', JSON.stringify(res))
                            setTimeout(() => {
                                this.$Router.push({
                                    path: '/bundle/pages/address_edit/address_edit'
                                })
                            }, 200)
                        },
                        fail: (res) => {
                            if (res.errMsg == 'chooseAddress:cancel')
                                return this.$toast({
                                    title: '取消选择'
                                })
                        }
                    })
                },
                fail: (res) => {
                    uni.showModal({
                        title: '您已拒绝导入微信地址权限',
                        content: '是否进入权限管理，调整授权？',
                        success: (res) => {
                            if (res.confirm) {
                                uni.openSetting({
                                    success: (res) => { }
                                })
                            } else if (res.cancel) {
                                return this.$toast({
                                    title: '已取消！'
                                })
                            }
                        }
                    })
                }
            })
            // #endif
        },

        showSurePop(id) {
            this.deleteSure = true
            this.delectId = id
        }
    }
}
</script>
<style lang="scss">
.user-address {
    padding-bottom: calc(140rpx + env(safe-area-inset-bottom));
    padding: 0 20rpx;

    .no-address {
        margin: 24rpx;
        height: 80vh;
        padding-top: 300rpx;
        text-align: center;
        border-radius: 20rpx;
        background-color: #ffffff;

        image {
            width: 209rpx;
            height: 141rpx;
        }
    }

    .address-list {
        padding: 10rpx 0;

        .item {
            padding: 0 30rpx;
            border-radius: 10rpx;

            .address {
                padding: 20rpx 0;
                border-bottom: $-solid-border;
            }

            .operation {
                height: 80rpx;
            }
        }

        .u-radio-group {
            display: block;
        }
    }

    .footer {
        position: fixed;
        left: 0;
        right: 0;
        bottom: 0;
        height: 118rpx;
        padding: 0 30rpx;
        box-sizing: content-box;
        padding-bottom: env(safe-area-inset-bottom);

        .btn {
            flex: 1;
            height: 80rpx;
        }

        .add-btn {
            @include background_color();
        }
    }
}

.tips-dialog {
    height: 270rpx;
    width: 100%;
}
</style>
