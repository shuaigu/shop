<template>
    <view :data-theme="themeName">
        <!-- #ifndef H5 -->

        <u-navbar
            id="navbar"
            :border-bottom="false"
            :background="{ background: 'rgba(256,256,256, ' + 0 + ')' }"
            :immersive="true"
            back-text="返回"
            :back-text-style="{ color: '#fff' }"
            title="商品详情"
            title-color="#ffffff"
            title-bold="true"
            :is-back="true"
            back-icon-color="#ffffff"
        >
        </u-navbar>
        <!--  #endif -->

        <view class="header">
            <u-image width="100%" height="560rpx" :src="detail.image"></u-image>
        </view>

        <view class="section">
            <!-- 商品名称简介 -->
            <view class="name m-b-20">
                <view class="normal lg">{{ detail.name }}</view>
                <view class="xs muted m-t-10">{{ detail.remark || '暂无简介～' }}</view>
            </view>

            <view class="spec-main">
                <view class="spec-list p-b-60 m-b-20">
                    <!-- 规格表 -->
                    <view v-for="(item, index) in specList" :key="index" class="spec">
                        <view class="m-b-20 m-t-30">
                            {{ item.name }}
                            <text class="primary xs m-l-20">{{
                                checkedGoods.spec_value_ids_arr[index] == ''
                                    ? '请选择' + item.name
                                    : ''
                            }}</text>
                        </view>
                        <view class="flex flex-wrap">
                            <view
                                v-for="(specitem, index2) in item.spec_value"
                                :key="index2"
                                :class="
                                    'spec-item sm ' +
                                    (checkedGoods.spec_value_ids_arr[index] == specitem.id
                                        ? 'checked'
                                        : '') +
                                    (isDisable(specitem.id) ? ' disabled' : '')
                                "
                                :style="{
                                    background:
                                        checkedGoods.spec_value_ids_arr[index] == specitem.id
                                            ? 'rgba(' + color(themeColor) + ',.1)'
                                            : ''
                                }"
                                @click="choseSpecItem(index, index2)"
                            >
                                {{ specitem.value }}
                            </view>
                        </view>
                    </view>

                    <!-- 配料表 -->
                    <view v-for="(item, index) in material" :key="index" class="spec">
                        <view class="m-b-20 m-t-30">{{ item.name }}</view>
                        <view class="flex flex-wrap">
                            <view
                                v-for="(specitem, index2) in item.material"
                                :key="index2"
                                :class="'spec-item sm ' + (specitem.checked ? 'checked' : '')"
                                :style="{
                                    background: specitem.checked
                                        ? 'rgba(' + color(themeColor) + ',.1)'
                                        : ''
                                }"
                                @tap="choseSpecItemMaterial(index, index2)"
                            >
                                {{ specitem.name }}
                                {{ specitem.price == '0.00' ? '' : '¥' + specitem.price }}
                            </view>
                        </view>
                    </view>
                </view>
            </view>
        </view>

        <view class="footer">
            <view class="flex footer-text row-between">
                <view>
                    <price
                        fontWeight="600"
                        :content="getMainPrice"
                        main-size="32rpx"
                        minor-size="22rpx"
                        :color="themeColor"
                    >
                    </price>
                    <scroll-view style="max-height: 80rpx" scroll-y="true">
                        <view class="muted xs m-t-10" style="width: 500rpx">{{ getMainDesc }}</view>
                    </scroll-view>
                </view>
                <view class="flex">
                    <number-box v-model="goods_num"></number-box>
                </view>
            </view>
            <!-- this -->
            <view class="footer-btn flex row-center md m-b-20 m-t-20" @click="onAddCart"
                >选好了</view
            >
        </view>
    </view>
</template>

<script>
import { addShopCart, getShopGoodsDetail } from '@/api/store.js'
import { mapActions, mapGetters, mapMutations } from 'vuex'
import { colorRgb } from '@/utils/tools'

import Spec from '@/utils/spec.js'
export default {
    data() {
        return {
            detail: {},
            outOfStock: [], //缺货的
            specList: [], //规格
            disable: [], //不可选择的
            checkedGoods: {}, // 选中的
            material: [], //配料
            goods_num: 1,

            Spec: {} //规格类
        }
    },

    computed: {
        //计算金额
        getMainPrice() {
            let data = this.checkedGoods
            let price = Number(data.price)
            if (data.material != undefined) {
                data.material.forEach((item) => {
                    const itemPrice = Number(item.price)
                    price += itemPrice
                })
            }
            return price
        },

        //计算选中的规格和配料
        getMainDesc() {
            let data = this.checkedGoods
            let desc = ''
            if (data.material != undefined) {
                data.material.forEach((item) => {
                    desc += ' ,' + item.name
                })
            }

            let arr = this.checkedGoods.spec_value_ids?.split(',')
            let spec_str = ''
            if (arr)
                arr.forEach((item, index) => {
                    if (item == '') spec_str += this.specList[index].name + ','
                })
            if (this.checkedGoods?.stock != 0 && spec_str == '')
                return `已选择 ${this.checkedGoods.spec_value_str}${desc}  ${this.goods_num} 件`
            else return `请选择 ${spec_str.slice(0, spec_str.length - 1)}`
        }
    },

    methods: {
        ...mapMutations(['setShopData']),

        async getDetail(id) {
            try {
                const { data } = await getShopGoodsDetail({ id: id })
                this.detail = data
                this.Spec = new Spec(data, this)
                //处理分享返回问题
                setTimeout(() => {
                    this.setShopData(data.shop_info)
                }, 1000)
            } catch (e) {
                //TODO handle the exception
                console.log('获取商品详情错误', e)
            }
        },
        color(color) {
            return colorRgb(color)
        },

        // 是否禁用
        isDisable(event) {
            return this.Spec.isDisable(event, this)
        },

        // 选择规格
        choseSpecItem(id, specid) {
            this.Spec.choseSpecItemFun(this, id, specid)
        },

        // 选择配料表
        choseSpecItemMaterial(index, cIndex) {
            this.Spec.choseSpecItemMaterialFun(this, index, cIndex)
            this.Spec.changeSpecWatch(this)
        },

        // 选好了
        onAddCart() {
            if (!this.isLogin) {
                uni.navigateTo({
                    url: '/pages/login/login'
                })
                return
            }
            if (this.getMainDesc.indexOf('请选择') != -1)
                return this.$toast({
                    title: this.getMainDesc
                })
            if (this.checkedGoods.stock == 0)
                return this.$toast({
                    title: '当前选择库存不足'
                })
            const params = {
                shop_id: this.detail.shop_id,
                item_id: this.checkedGoods.id,
                num: this.goods_num,
                material_ids: this.checkedGoods.material.map((item) => item.id)
            }
            addShopCart({
                ...params
            }).then((res) => {
                if (res.code != 1) return
                setTimeout(() => {
                    try {
                        uni.navigateBack(1)
                    } catch (e) {
                        //TODO handle the exception
                        uni.switchTab({
                            url: '/pages/order/order'
                        })
                    }
                }, 1000)
            })
        }
    },

    // 监听
    watch: {
        specList: {
            handler(val) {
                this.Spec.changeSpecWatch(this)
            }
        }
    },
    onShareAppMessage() {
        const { name, image } = this.detail
        return {
            title: name,
            path: `/pages/goods_detail/goods_detail?id=${this.detail.shop_goods_id}`,
            imageUrl: image
        }
    },

    onLoad() {
        const options = this.$Route.query
        this.getDetail(options.id)
    }
}
</script>

<style lang="scss">
page {
    background: #ffffff;
}

.section {
    padding: 0 30rpx;
    padding-bottom: 300rpx;

    .name {
        padding: 23rpx 0;
        border-bottom: 1rpx solid #f2f2f2;
    }
}

.spec-main {
    .spec-list {
        .spec-item {
            color: #666666;
            padding: 0 20rpx;
            line-height: 54rpx;
            background: #f2f2f2;
            border-radius: 60rpx;
            border: 1rpx solid #f2f2f2;
            margin: 0 20rpx 20rpx 0;

            &.checked {
                @include font_color();
                border-width: 1rpx;
                border-style: solid;
                @include border_color();
            }

            &.disabled {
                opacity: 0.5;
                text-decoration: line-through;
            }
        }
    }
}

.footer {
    left: 0;
    bottom: 0;
    width: 100%;
    position: fixed;
    background-color: #ffffff;
    border-top: 1rpx solid #e5e5e5;
    padding: 15rpx 30rpx constant(safe-area-inset-bottom) 30rpx;
    padding: 15rpx 30rpx env(safe-area-inset-bottom) 30rpx;

    .footer-btn {
        color: #ffffff;
        width: 100%;
        height: 84rpx;
        border-radius: 10rpx;
        @include background_color();
    }
}
</style>
