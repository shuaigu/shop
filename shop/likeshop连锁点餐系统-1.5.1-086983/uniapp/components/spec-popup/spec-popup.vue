<template>
  <u-popup
    v-model="show"
    duration="50"
    :z-index="899"
    mode="bottom"
    :closeable="true"
  >
    <view class="bg-white spec-contain">
      <view class="header flex">
        <u-image
          width="160rpx"
          height="160rpx"
          class="m-r-20 image"
          border-radius="10rpx"
          @tap="previewGoodsImage(spec.image)"
          :src="spec.image"
        ></u-image>
        <view class="goods-info">
          <view class="primary flex">
            <price
              :content="getMainPrice"
              main-size="46rpx"
              minor-size="32rpx"
              :color="themeColor"
            >
            </price>
          </view>
          <view class="sm m-t-5"> 库存：{{ checkedGoods.stock }}件 </view>
          <view class="xs m-t-5 line-2 MainDesc" style="height: 35px">
            <view>{{ getMainDesc }}</view>
          </view>
        </view>
      </view>
      <view class="spec-main" style="height: 500rpx">
        <scroll-view style="height: 500rpx" scroll-y="true">
          <view class="spec-list">
            <view v-for="(item, index) in specList" :key="index" class="spec">
              <view class="m-b-20 m-t-30">
                {{ item.name }}
                <text class="primary xs m-l-20">{{
                  checkedGoods.spec_value_ids_arr[index] == ""
                    ? "请选择" + item.name
                    : ""
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
                        : '',
                  }"
                  @click="choseSpecItem(index, index2)"
                >
                  {{ specitem.value }}
                </view>
              </view>
            </view>

            <view v-for="(item, index2) in material" :key="index2" class="spec">
              <view class="m-b-20 m-t-30">{{ item.name }}</view>
              <view class="flex flex-wrap">
                <view
                  v-for="(specitem, index3) in item.material"
                  :key="index3"
                  :class="'spec-item sm ' + (specitem.checked ? 'checked' : '')"
                  :style="{
                    background: specitem.checked
                      ? 'rgba(' + color(themeColor) + ',.1)'
                      : '',
                  }"
                  @tap="choseSpecItemMaterial(index2, index3)"
                >
                  {{ specitem.name }}
                  {{ specitem.price == "0.00" ? "" : "¥" + specitem.price }}
                </view>
              </view>
            </view>
          </view>
        </scroll-view>
        <view class="good-num flex row-between p-t-10 m-l-24 m-r-24">
          <view class="label">数量</view>
          <number-box v-model="goods_num"></number-box>
        </view>
      </view>
      <view class="btns flex row-between bg-white">
        <button class="br60 white btn" size="lg" @tap="onAddCart('confirm')">
          选好了
        </button>
      </view>
    </view>
  </u-popup>
</template>

<script>
import { addShopCart } from "@/api/store.js";

import { colorRgb } from "@/utils/tools";

import Spec from "@/utils/spec.js";
export default {
  name: "GoodsSpec",

  props: {
    // 显示状态
    value: {
      type: Boolean,
      default: false,
    },

    // 规格
    spec: {
      type: Object | null,
      required: true,
    },
  },

  data() {
    return {
      checkedGoods: {
        stock: 0,
      }, //选中的
      outOfStock: [], //缺货的
      specList: [], //规格
      disable: [], //不可选择的
      material: [], //配料
      goods_num: 1,

      Spec: {}, //规格类
    };
  },

  computed: {
    // 弹窗Popup显示状态
    show: {
      get: function () {
        return this.value;
      },
      set: function (value) {
        if (value == false) {
          this.goods_num = 1;
        }
        this.$parent.showCart = !this.$parent.showCart;
        this.$emit("input", value);
      },
    },
    //计算金额
    getMainPrice() {
      let data = this.checkedGoods;
      let price = Number(data.price);
      if (data.material != undefined) {
        data.material.forEach((item) => {
          const itemPrice = Number(item.price);
          price += itemPrice;
        });
      }
      return price;
    },

    //计算选中的规格和配料
    getMainDesc() {
      let data = this.checkedGoods;
      let desc = "";
      if (data.material != undefined) {
        data.material.forEach((item) => {
          desc += " ," + item.name;
        });
      }

      let arr = this.checkedGoods.spec_value_ids?.split(",");
      let spec_str = "";
      if (arr)
        arr.forEach((item, index) => {
          if (item == "") spec_str += this.specList[index].name + ",";
        });
      if (this.checkedGoods?.stock != 0 && spec_str == "")
        return `已选择 ${this.checkedGoods.spec_value_str}${desc}  ${this.goods_num} 件`;
      else return `请选择 ${spec_str.slice(0, spec_str.length - 1)}`;
    },
  },

  methods: {
    color(color) {
      return colorRgb(color);
    },

    // 是否禁用
    isDisable(event) {
      return this.Spec.isDisable(event, this);
    },

    // 选择规格
    choseSpecItem(id, specid) {
      this.Spec.choseSpecItemFun(this, id, specid);
    },

    // 选择配料表
    choseSpecItemMaterial(index, cIndex) {
      this.Spec.choseSpecItemMaterialFun(this, index, cIndex);
      this.Spec.changeSpecWatch(this);
    },

    // 选好了
    onAddCart() {
      if (this.getMainDesc.indexOf("请选择") != -1)
        return this.$toast({
          title: this.getMainDesc,
        });
      if (this.checkedGoods.stock == 0)
        return this.$toast({
          title: "当前选择库存不足",
        });

      const params = {
        shop_id: this.shopData.id,
        item_id: this.checkedGoods.id,
        num: this.goods_num,
        material_ids: this.checkedGoods.material.map((item) => item.id),
      };

      addShopCart({
        ...params,
      }).then((res) => {
        this.$emit("input", false);
        this.$emit("change");
      });
    },

    // 查看商品图片
    previewGoodsImage() {
      uni.previewImage({
        urls: [this.spec.image],
      });
    },
  },

  // 监听
  watch: {
    spec: {
      handler(val) {
        // 初始化商品规格
        this.Spec = new Spec(val, this);
        // getSpecDataInit(val, this)
      },
    },
    specList: {
      handler(val) {
        this.Spec.changeSpecWatch(this);
      },
    },
  },
};
</script>

<style lang="scss" scoped>
.spec-contain {
  height: 1045rpx;
}

.header {
  padding: 20rpx;
}

.spec-main {
  // padding-bottom: env(safe-area-inset-bottom);
  .spec-list {
    padding: 24rpx;

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

.btns {
  width: 100%;
  height: 110rpx;
  padding: 0 30rpx;
  position: fixed;
  bottom: 100rpx;
  margin-bottom: env(safe-area-inset-bottom);

  .btn {
    margin: 0 10rpx;
    flex: 1;
    @include background_color();
  }
}
.image {
  flex-shrink: 0;
}
</style>
