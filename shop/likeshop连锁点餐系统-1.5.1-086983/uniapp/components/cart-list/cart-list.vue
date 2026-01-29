<template>
  <view>
    <u-popup
      v-model="show"
      duration="50"
      zIndex="888"
      mode="bottom"
      :closeable="false"
      :safe-area-inset-bottom="true"
    >
      <view style="height: 70vh">
        <view class="header flex row-right p-r-24">
          <view class="nr" @click="showDelAllGoods = true">
            <image src="/static/images/del.png" class="m-r-15"></image>
            清空
          </view>
        </view>
        <template v-if="cartList.length != 0">
          <view class="section">
            <scroll-view class="scroll-view" scroll-y="true">
              <!-- <template v-if="hackReset"> -->
              <block v-for="(item, index) in cartList" :key="item.id">
                <view class="goods-item flex">
                  <u-image
                    @click="toDetail(item)"
                    :src="item.image"
                    width="160rpx"
                    height="160rpx"
                    border-radius="10rpx"
                  >
                  </u-image>
                  <view class="m-l-20" style="width: 100%">
                    <view class="normal md bold">{{ item.name }}</view>
                    <view class="muted xs m-t-10 flex row-between">
                      {{ item.spec_value_str }} {{ item.material_name }}

                      <number-box
                        :isZero="true"
                        @change="handleCartFun($event, item.id, index)"
                        v-model="item.num"
                      >
                      </number-box>
                    </view>
                    <view class="m-t-20" style="width: 100%">
                      <price
                        :content="item.price"
                        main-size="32rpx"
                        minor-size="22rpx"
                        :color="'#333'"
                      >
                      </price>
                    </view>
                  </view>
                </view>
              </block>
              <!-- </template> -->
            </scroll-view>
          </view>
        </template>

        <template v-else>
          <view class="null_cart flex row-center">
            <image src="../../static/images/null_shoppingCar.png"></image>
          </view>
        </template>
      </view>
    </u-popup>

    <u-modal
      id="delete-dialog"
      z-index="10000"
      negative-top="200rpx"
      v-model="showDelAllGoods"
      :confirm-style="{ 'border-left': '1rpx solid #f2f2f2' }"
      :show-cancel-button="true"
      confirm-text="狠心删除"
      :confirm-color="themeColor"
      :show-title="false"
      @confirm="delAddressFun"
    >
      <view class="flex-col col-center tips-dialog p-t-40">
        <view class="normal lg bold"> 温馨提示 </view>
        <view style="margin-top: 43rpx" class="p-b-60">确定清空购物车吗？</view>
      </view>
    </u-modal>
  </view>
</template>

<script>
import {
  deleteGoods, //删除购物车商品
  changeGoodsCount, //更改购物车数量
} from "@/api/store.js";

export default {
  name: "GoodsSpec",

  props: {
    // 显示状态
    value: {
      type: Boolean,
      default: false,
    },

    lists: {
      type: Array,
      default: [],
    },
  },

  data() {
    return {
      cartList: [],
      showDelAllGoods: false,
    };
  },

  computed: {
    // 弹窗Popup显示状态
    show: {
      get: function () {
        return this.value;
      },
      set: function (value) {
        this.$emit("input", value);
      },
    },
  },

  methods: {
    // 购物车数量改变时
    handleCartFun(event, cart_id, index) {
      if (this.value == true) {
        if (event.value == 0) this.delCartFun(cart_id);
        if (event.value > 0) this.changeNumFun(event.value, cart_id);
      }
    },

    // 删除购物车
    delCartFun(id) {
      deleteGoods({
        cart_ids: [id],
      }).then((res) => {
        this.$emit("change", "");
        if (res.code != 1)
          return this.$toast({
            title: res.msg,
          });
      });
    },

    // 修改购物车数量
    changeNumFun(val, id) {
      changeGoodsCount({
        cart_id: id,
        num: val,
      }).then((res) => {
        this.$emit("change", "");
        if (res.code != 1)
          return this.$toast({
            title: res.msg,
          });
      });
    },

    // 清空购物车
    delAddressFun() {
      if (this.lists.length == 0)
        return this.$toast({
          title: "请先添加购物车",
        });

      // 获取购物车所有ID
      let ids = this.lists.map((item) => item.id);
      deleteGoods({
        cart_ids: ids,
      }).then((res) => {
        if (res.code == 1) {
          this.$toast({
            title: "清空成功！",
          });
          this.$emit("change", "");
        } else {
          this.$toast({
            title: res.msg,
          });
        }
      });
    },
  },

  // 监听
  watch: {
    lists: {
      handler(val) {
        this.cartList = val;
      },
    },
  },
};
</script>

<style lang="scss" scoped>
.header {
  width: 100%;
  height: 70rpx;
  color: #555;
  background: #f6f6f6;

  image {
    width: 30rpx;
    height: 30rpx;
    vertical-align: middle;
  }
}

.section {
  .scroll-view {
    height: calc(43vh + 20px + env(safe-area-inset-bottom));
  }

  padding: 24rpx;

  .goods-item {
    padding-bottom: 20rpx;
    margin-bottom: 20rpx;
    border-bottom: 1px solid #e5e5e5;
  }

  .goods-item:last-child {
    border-bottom: none;
  }
}

.null_cart {
  width: 100%;
  height: 80%;

  image {
    width: 300rpx;
    height: 300rpx;
  }
}
</style>
