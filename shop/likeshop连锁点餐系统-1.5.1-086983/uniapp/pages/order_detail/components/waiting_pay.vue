<template>
  <view :data-theme="themeName">
    <view class="card p-t-30 p-b-50 text-center">
      <view class="lg bold m-t-20s">待付款</view>
      <view class="flex row-center m-t-10">
        <view class="m-r-20">
          <u-count-down
            v-if="show"
            :timestamp="getCancelTime"
            :show-days="false"
            :color="themeColor"
            :show-hours="false"
            :font-size="24"
          />
          <text>后订单会自动取消</text>
        </view>
      </view>
      <view class="flex row-center m-t-26">
        <!-- 取消订单 -->
        <template v-if="data.cancel_btn">
          <button
            class="btn br-btn flex row-center normal"
            @click.stop="cancel"
          >
            取消订单
          </button>
        </template>

        <!-- 去支付 -->
        <template v-if="data.pay_btn">
          <button
            class="btn bg-btn flex row-center white"
            @click.stop="toPayment"
          >
            去支付
          </button>
        </template>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  props: {
    data: {
      type: Object,
      default: {},
    },
  },
  data() {
    return {
      show: true,
    };
  },
  methods: {
    cancel() {
      this.$emit("cancel");
    },
    toPayment() {
      this.$emit("toPay");
    },
  },
  computed: {
    // 获取取消订单时间倒计时
    getCancelTime() {
      console.log(123);
      let start = new Date(this.data.create_time).getTime();
      let end = this.data.order_cancel_time;
      let endTimeStamp = Number(start) + Number(end) * 1000;
      let now = new Date().getTime();

      if (endTimeStamp > now) {
        let min = endTimeStamp - now;
        return min / 1000;
      }

      return false;
    },
  },
};
</script>

<style scoped lang="scss">
.card {
  overflow: hidden;
  margin-top: 20rpx;
  border-radius: 20rpx;
  background-color: #ffffff;
}

.line {
  position: relative;
  width: 100rpx;

  &::before {
    content: "";
    height: 0px;
    width: 100rpx;
    position: absolute;
    top: -30rpx;
    left: 0px;
    border: 1px #999999 dashed;
  }
}

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
</style>
