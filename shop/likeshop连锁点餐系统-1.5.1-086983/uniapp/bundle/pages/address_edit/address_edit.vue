<template>
    <view :data-theme="themeName">
        <view class="address-edit">
            <view class="form bg-white">
                <u-field v-model="addressObj.contact" label="收货人" placeholder="请填写收货人姓名">
                </u-field>
                <u-field
                    v-model="addressObj.telephone"
                    label="联系方式"
                    placeholder="请填写手机号码"
                >
                </u-field>
                <view @click="showRegion = true">
                    <u-field
                        @click="selectAddressFun"
                        v-model="region"
                        :disabled="true"
                        label="收货地址"
                        placeholder="请选择收货地址"
                        right-icon="arrow-right"
                    >
                    </u-field>
                </view>
                <view>
                    <u-field
                        v-model="addressObj.address"
                        type="textarea"
                        label="详细地址"
                        placeholder="请填写详细地址"
                        :field-style="{ flex: 1, height: '200rpx' }"
                    />
                </view>
            </view>
            <view class="m-b-10 bg-white p-20">
                <u-checkbox
                    :activeColor="themeColor"
                    @click="changeDefault"
                    v-model="addressObj.is_default"
                    shape="circle"
                >
                    <text class="xs">设置为默认</text>
                </u-checkbox>
            </view>
            <button class="my-btn flex row-center white" @tap="formSubmit">完成</button>

            <!-- <u-select v-model="showRegion" mode="mutil-column-auto" @confirm="regionChange" :list="lists"></u-select> -->
        </view>
    </view>
</template>

<script>
// +----------------------------------------------------------------------
// | LikeShop100%开源免费商用电商系统
// +----------------------------------------------------------------------
// | 欢迎阅读学习系统程序代码，建议反馈是我们前进的动力
// | 开源版本可自由商用，可去除界面版权logo
// | 商业版本务必购买商业授权，以免引起法律纠纷
// | 禁止对系统程序代码以任何目的，任何形式的再发布
// | Gitee下载：https://gitee.com/likemarket/likeshopv2
// | 访问官网：https://www.likemarket.net
// | 访问社区：https://home.likemarket.net
// | 访问手册：http://doc.likemarket.net
// | 微信公众号：好象科技
// | 好象科技开发团队 版权所有 拥有最终解释权
// +----------------------------------------------------------------------
// | Author: LikeShopTeam
// +----------------------------------------------------------------------
import { editAddress, getOneAddress, hasRegionCode, addAddress } from '@/api/user'
import { copy, colorRgb, jsonp } from '@/utils/tools'
import { mapActions, mapGetters, mapMutations } from 'vuex'
import area from '@/utils/area'
export default {
    data() {
        return {
            addressObj: {
                contact: '',
                telephone: '',
                latitude: '',
                longitude: '',
                address: '',
                is_default: false
            },
            region: '',
            addressId: '',
            defaultRegion: ['广东省', '广州市', '番禺区'],
            defaultRegionCode: '440113',
            showRegion: false,
            lists: []
        }
    },
    onLoad: function (options) {
        this.addressId = parseInt(options.id)
        if (options.id) {
            uni.setNavigationBarTitle({
                title: '编辑地址'
            })
            this.getOneAddressFun()
        } else {
            uni.setNavigationBarTitle({
                title: '添加地址'
            })
            this.getWxAddressFun()
        }
        this.$nextTick(() => {
            this.lists = area
        })
    },

    onUnload: function () {
        uni.removeStorageSync('wxAddress')
    },
    computed: {
        ...mapGetters(['appConfig', 'location'])
    },
    methods: {
        async formSubmit() {
            let {
                addressObj: { contact, telephone, latitude, longitude, is_default, address },
                addressId
            } = this
            if (!contact)
                return this.$toast({
                    title: '请填写收货人姓名'
                })
            if (!telephone)
                return this.$toast({
                    title: '请填写手机号码'
                })
            if (latitude == '' || longitude == '')
                return this.$toast({
                    title: '请选择地址'
                })
            if (!address)
                return this.$toast({
                    title: '请填写小区、街道、门牌号等信息'
                })
            const params = {
                contact,
                telephone,
                latitude,
                longitude,
                is_default: is_default ? 1 : 0,
                id: addressId,
                address
            }
            const { code, msg } = addressId ? await editAddress(params) : await addAddress(params)
            if (code == 1) {
                this.$toast(
                    {
                        title: msg
                    },
                    {
                        tab: 3,
                        url: 1
                    }
                )
            }
        },

        selectAddressFun(i) {
            uni.chooseLocation({
                success: (res) => {
                    this.region = res.address
                    this.addressObj.latitude = res.latitude
                    this.addressObj.longitude = res.longitude
                }
            })
        },

        getOneAddressFun() {
            getOneAddress(this.addressId).then((res) => {
                if (res.code == 1) {
                    let { location } = res.data
                    this.addressObj = res.data
                    this.region = location
                }
            })
        },

        getWxAddressFun() {
            let wxAddress = uni.getStorageSync('wxAddress')
            if (!wxAddress) return
            wxAddress = JSON.parse(wxAddress)
            console.log(wxAddress, 123)
            let {
                userName: contact,
                telNumber: telephone,
                provinceName: province,
                cityName: city,
                detailInfo: address
            } = wxAddress
            let district = wxAddress.countryName || wxAddress.countyName
            hasRegionCode({
                province,
                city,
                district
            }).then(async (res) => {
                if (res.data.province) {
                    console.log(res.data)
                    this.region = `${province} ${city} ${district}`
                    this.addressObj.province_id = res.data.province
                    this.addressObj.city_id = res.data.city
                    this.addressObj.district_id = res.data.district
                    await this.getAddress(this.region)
                }
                this.addressObj.contact = contact
                this.addressObj.telephone = telephone
                this.addressObj.address = address
            })
        },
        async getAddress(address) {
            let that = this
            // #ifdef H5
            try {
                const res = await jsonp('https://apis.map.qq.com/ws/geocoder/v1', {
                    key: that.appConfig.map_key,
                    address: address,
                    output: 'jsonp'
                })
                const data = res.result
                that.addressObj.latitude = data.location.lat
                that.addressObj.longitude = data.location.lng
            } catch (err) {
                uni.showToast({
                    title: JSON.stringify(err),
                    icon: 'none'
                })
            }
            // #endif
            // #ifndef H5

            uni.request({
                url: `https://apis.map.qq.com/ws/geocoder/v1/?address=${address}&key=${that.appConfig.map_key}`,
                success(result) {
                    if (result.data.message == '缺少必要字段key')
                        return that.$toast({
                            title: '请在后台配置地图的key值'
                        })
                    const data = result.data.result
                    that.addressObj.latitude = data.location.lat
                    that.addressObj.longitude = data.location.lng
                }
            })
            // #endif
        }
    }
}
</script>
<style lang="scss">
.address-edit {
    border-radius: 20rpx;
    margin: 24rpx;

    .my-btn {
        margin: 40rpx 26rpx;
        height: 88rpx;
        border-radius: 20rpx;
        @include background_color();
    }
}
</style>
