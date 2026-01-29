<template>
  <view :data-theme="themeName">
    <view class="top_bg"></view>
    <view class="order-detail">
      <!-- Header -->
      <!--店内用餐-->
      <template v-if="orderDetailObj.order_status == 1 || orderDetailObj.order_status == 2
        ">
        <in_store :data="orderDetailObj" v-if="orderDetailObj.order_type == 1 && orderDetailObj.dining_type == 1
          ">
        </in_store>
        <out_store :data="orderDetailObj" v-if="orderDetailObj.order_type == 1 && orderDetailObj.dining_type == 2
          ">
        </out_store>
        <delivery :data="orderDetailObj" v-if="orderDetailObj.order_type == 2"></delivery>
      </template>
      <waiting_pay :data="orderDetailObj" v-if="orderDetailObj.order_status == 0" @cancel="showCancel = true"
        @toPay="toPayment">
      </waiting_pay>
      <complete v-if="orderDetailObj.order_status == 3"></complete>
      <close v-if="orderDetailObj.order_status == 4"></close>
      <!-- 外卖的时候 -->
      <!-- <template v-if="orderDetailObj.order_type == 2">
                <view class="header card">
                    <view class="header-title white lg">订单状态: {{ orderDetailObj.order_status_text }}</view>
                    <view class="header-content flex">
                        <image src="/static/images/order_address.png"></image>
                        <view class="normal m-l-20">
                            <view class="md bold">{{ orderDetailObj.address_snap.contact }} <text class="m-l-20 ">{{
                                orderDetailObj.address_snap.telephone }}</text></view>
                            <view class="sm ">{{ orderDetailObj.delivery_address }}</view>
                        </view>
                    </view>
                </view>
            </template> -->

      <!-- 自提的时候 -->
      <!-- <template v-if="orderDetailObj.order_type == 1">
                <view class="wrap card">
                    <view class="wrap-title normal bold md flex row-between">
                        <view>用餐信息</view>
                        <view class="themeColor">{{ orderDetailObj.order_status_text }}</view>
                    </view>

                    <view class="take_code p-t-24 m-t-20">
                        <view class="bold normal" style="font-size: 60rpx;">{{ orderDetailObj.take_code }}</view>
                        <view class="lighter sm">取餐码</view>
                    </view>

                    <view class="flex row-between sm p-t-20 p-b-20">
                        <view class="lighter">就餐方式</view>
                        <view class="normal">{{ orderDetailObj.dining_type == 1 ? '店内就餐' : '打包带走' }}</view>
                    </view>
                    <view class="flex row-between sm p-t-20 p-b-20">
                        <view class="lighter">就餐时间</view>
                        <view class="normal">{{ orderDetailObj.appoint_time || '-' }}</view>
                    </view>
                    <view class="flex row-between sm p-t-20 p-b-30">
                        <view class="lighter">联系方式</view>
                        <view class="normal">{{ orderDetailObj.mobile || '-' }}</view>
                    </view>
                </view>
            </template> -->

      <!-- 商品信息 -->
      <view class="wrap card">
        <view class="flex row-between col-center wrap-title">
          <view class=" normal bold md">{{
            orderDetailObj.shop.name
          }}</view>
          <image style="width: 36rpx; height: 36rpx" src="../../static/images/order_detail/phone.png" @click="actionTen">
          </image>
        </view>
        <view class="wrap-main m-b-20">
          <block v-for="(item, index) in orderDetailObj.order_goods" :key="index">
            <goods-card :data="item"></goods-card>
          </block>
        </view>

        <template v-if="orderDetailObj.order_type == 2">
          <view class="">
            <view class="flex row-between m-t-30">
              商品总价
              <price fontWeight="600" :content="orderDetailObj.total_amount" main-size="26rpx" minor-size="26rpx"
                color="#222222">
              </price>
            </view>
            <view class="flex row-between m-t-30">
              配送费
              <price fontWeight="600" :content="orderDetailObj.delivery_amount" main-size="26rpx" minor-size="26rpx"
                color="#222222">
              </price>
            </view>
          </view>
        </template>

        <view class="nr flex row-between p-b-10 m-t-30">
          <text class="normal">优惠券</text>
          <text class="themeColor">-¥{{ orderDetailObj.discount_amount }}</text>
        </view>

        <view class="wrap-footer flex row-right lighter m-t-12 p-b-15">
          共{{ orderDetailObj.total_num }}件商品， 小计：
          <price fontWeight="600" :content="orderDetailObj.order_amount" main-size="36rpx" minor-size="26rpx"
            color="#222222">
          </price>
        </view>
      </view>

      <!-- 门店信息 -->
      <!-- <view class="wrap card">
                <view class="wrap-title normal bold md">
                    <view>门店信息</view>
                </view>

                <view class="flex row-between sm p-t-20 p-b-20">
                    <view class="lighter">门店名称</view>
                    <view class="normal">{{ orderDetailObj.shop.name }}</view>
                </view>
                <view class="flex row-between sm p-t-20 p-b-20">
                    <view class="lighter">门店地址</view>
                    <view class="normal">{{ orderDetailObj.shop.address_detail || '-' }}</view>
                </view>
                <view class="flex row-between sm p-t-20 p-b-30">
                    <view class="lighter">门店号码</view>
                    <view class="normal flex">
                        <view class="">{{ orderDetailObj.shop.phone || '-' }}</view>
                        <view class="line"></view>
                        <view class="themeColor" @click="showTen = true">联系商家</view>
                    </view>
                </view>
            </view> -->

      <!-- 订单信息 -->
      <view class="wrap card">
        <view class="wrap-title normal bold md">
          <view>订单信息</view>
        </view>
        <view class="flex row-between sm p-t-20 p-b-20">
          <view class="lighter">下单时间</view>
          <view class="normal">{{ orderDetailObj.pay_time || "-" }}</view>
        </view>
        <template v-if="orderDetailObj.order_type == 1">
          <view class="flex row-between sm p-t-20 p-b-20">
            <view class="lighter">就餐方式</view>
            <view class="normal">{{
              orderDetailObj.dining_type == 1 ? "堂食" : "外带" || "-"
            }}</view>
          </view>
          <template v-if="orderDetailObj.dining_type == 1">
            <view class="flex row-between sm p-t-20 p-b-20">
              <view class="lighter">点单桌号</view>
              <view class="normal">{{
                orderDetailObj.desk_info.number || "-"
              }}</view>
            </view>
          </template>
          <view class="flex row-between sm p-t-20 p-b-20">
            <view class="lighter">取餐编号</view>
            <view class="normal">{{ orderDetailObj.take_code || "-" }}</view>
          </view>
          <template v-if="orderDetailObj.dining_type == 2">
            <view class="flex row-between sm p-t-20 p-b-20">
              <view class="lighter">取餐时间</view>
              <view class="normal">{{
                orderDetailObj.appoint_time || "-"
              }}</view>
            </view>
          </template>
        </template>

        <view class="flex row-between sm p-t-20 p-b-20">
          <view class="lighter">订单编号</view>
          <view class="normal">{{ orderDetailObj.order_sn }}</view>
        </view>

        <view class="flex row-between sm p-t-20 p-b-20" v-if="orderDetailObj.order_type == 2">
          <view class="lighter">配送地址</view>
          <view class="normal">{{
            orderDetailObj.delivery_address || "-"
          }}</view>
        </view>
        <!-- <view class="flex row-between sm p-t-20 p-b-20">
                    <view class="lighter">支付方式</view>
                    <view class="normal">{{ getPayment }}</view>
                </view> -->
        <view class="flex row-between sm p-t-20 p-b-30 col-top">
          <view class="lighter m-r-20" style="flex: none;">订单备注</view>
          <view class="normal ">{{
            orderDetailObj.user_remark || "-"
          }}</view>
        </view>
      </view>
      <view v-if="orderDetailObj.cancel_btn" @click.stop="showCancel = true" class="wrap card text-center"
        style="padding: 20rpx 0;font-size: 30rpx;">
        取消订单
      </view>
      <!-- 联系商家选择 -->
      <u-action-sheet :list="list" @click="actionTen" v-model="showTen"></u-action-sheet>
    </view>

    <!-- <template v-if="orderDetailObj.cancel_btn == 1 || orderDetailObj.pay_btn == 1">
            <view class="footer flex bg-white row-between">
                <price fontWeight="600" :content="orderDetailObj.order_amount" main-size="36rpx" minor-size="36rpx"
                    color="#222222">
                </price>

                <view class="flex">
                    <template v-if="orderDetailObj.cancel_btn">
                        <button class="br60 btn br-btn flex row-center normal" @click.stop="showCancel = true">取消订单</button>
                    </template>

                    <template v-if="orderDetailObj.pay_btn">
                        <button class="br60 btn bg-btn flex row-center white" @click.stop="toPayment">去支付</button>
                    </template>
                </view>
            </view>
        </template> -->

    <!-- 取消订单 -->
    <u-modal id="delete-dialog" z-index="10000" negative-top="200rpx" v-model="showCancel"
      :confirm-style="{ 'border-left': '1rpx solid #f2f2f2' }" :show-cancel-button="true" confirm-text="确认"
      :confirm-color="themeColor" :show-title="false" @confirm="cancelOrder">
      <view class="flex-col col-center tips-dialog p-t-40">
        <view class="normal lg bold"> 温馨提示 </view>
        <view style="margin-top: 43rpx" class="p-b-60">是否取消当前订单？</view>
      </view>
    </u-modal>

    <loading-view v-if="loading"></loading-view>
  </view>
</template>

<script>
import { apiOrderDetail, apiCancelOrder } from "@/api/order.js";
import in_store from "./components/in_store.vue";
import out_store from "./components/out_store.vue";
import delivery from "./components/delivery.vue";
import waiting_pay from "./components/waiting_pay.vue";
import complete from "./components/complete.vue";
import close from "./components/close.vue";
import { copy } from "@/utils/tools.js";
export default {
  components: {
    in_store,
    out_store,
    delivery,
    waiting_pay,
    complete,
    close,
  },
  data() {
    return {
      loading: true,
      showCancel: false,

      id: 0,
      orderDetailObj: {},

      showTen: false,
      list: [
        {
          text: "手机号",
        },
        {
          text: "呼叫",
        },
      ],
    };
  },

  computed: {
    getPayment() {
      let data = this.orderDetailObj.pay_way;
      switch (data) {
        case 1:
          return "微信";
        case 2:
          return "余额";
        case 3:
          return "支付宝";
        default:
          return "-";
      }
    },
  },

  async onLoad() {
    const { order_id } = this.$Route.query;

    this.id = order_id;
  },

  onShow() {
    this.getOrderDetailFun();
  },

  methods: {
    getOrderDetailFun() {
      apiOrderDetail({
        id: this.id,
      }).then((res) => {
        this.list[0].text = res.data.shop.phone;
        this.orderDetailObj = res.data;
        this.$nextTick(() => {
          this.loading = false;
        });
      });
    },

    // 选择电话
    actionTen(index) {
      if (index == 0) {
        copy(this.list[0].text);
      } else {
        wx.makePhoneCall({
          phoneNumber: this.list[0].text.toString(),
        });
      }
    },

    // 取消订单
    cancelOrder() {
      apiCancelOrder({ id: this.id }).then((res) => {
        this.$toast({ title: res.msg });
        this.getOrderDetailFun();
      });
    },

    // 去支付
    toPayment() {
      const order_id = this.id;
      this.$Router.push({
        path: "/pages/payment/payment",
        query: {
          order_id,
        },
      });
    },
    toPhone() { },
  },
};
</script>

<style lang="scss">
.top_bg {
  height: 150rpx;
  @include background_color();
}

.order-detail {
  padding: 0 24rpx;
  padding-bottom: 120rpx;
  margin-top: -100rpx;

  .themeColor {
    @include font_color();
  }

  .header {
    &-title {
      padding: 36rpx 28rpx;
      @include background_color();
    }

    &-content {
      padding: 24rpx 30rpx;

      image {
        width: 44rpx;
        height: 44rpx;
      }
    }
  }

  .card {
    overflow: hidden;
    margin-top: 20rpx;
    border-radius: 20rpx;
    background-color: #ffffff;
  }

  .wrap {
    padding: 0 24rpx;

    .wrap-title {
      padding: 28rpx 6rpx;
      border-bottom: 1px solid #f2f2f2;
    }

    .line {
      width: 2px;
      height: 26rpx;
      background: #b2b2b2;
      margin: 0 20rpx;
    }

    .take_code {
      width: 100%;
      height: 180rpx;
      text-align: center;
      border-radius: 10rpx;
      background-color: #f6f6f6;
    }

    .wrap-main {
      min-height: 150rpx;
    }

    .wrap-footer {
      padding: 26rpx 0;
      border-top: 1rpx solid #f2f2f2;
    }
  }
}

.footer {
  position: fixed;
  bottom: 0;
  left: 0;
  z-index: 100;
  width: 100%;
  border-top: 1rpx solid $-color-body;
  padding: 20rpx 30rpx env(safe-area-inset-bottom) 20rpx;

  .btn {
    margin-left: 20rpx;
    width: 180rpx;
    height: 64rpx;
    font-size: 26rpx;
  }

  .bg-btn {
    @include background_color();
  }

  .br-btn {
    border: 1px solid #f2f2f2;
  }
}
</style>
