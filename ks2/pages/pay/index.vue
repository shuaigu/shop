<template>
  <view class="container">
    <button @click="createOrder">支付</button>
  </view>
</template>

<script>
export default {
  data() {
    return {
      paymentParams: null,
    };
  },
  methods: {
    // 创建支付订单
    async createOrder() {
      const total_fee = 1; // 金额（单位：分）
      const out_trade_no = 'KS' + Date.now(); // 生成唯一订单号

      const payment = uniCloud.importObject('payment');
      const res = await payment.createOrder({ total_fee, out_trade_no });
      if (res.code === 0) {
        const { order_no, order_info_token } = res.data;
        this.paymentParams = {
          order_no,
          order_info_token
        };
        this.pay();
      } else {
        uni.showToast({
          title: '创建订单失败',
          icon: 'none',
        });
      }
    },

    // 调起支付
    pay() {
      if (!this.paymentParams) {
        uni.showToast({
          title: '支付参数未准备好',
          icon: 'none',
        });
        return;
      }

      // 快手支付API
      ks.pay({
        serviceId: '1', // 服务类型 id（固定值为 '1'）
        orderInfo: {
          order_no: this.paymentParams.order_no,
          order_info_token: this.paymentParams.order_info_token
        },
        success: (res) => {
          uni.showToast({
            title: '支付成功',
            icon: 'success',
          });
        },
        fail: (err) => {
          uni.showToast({
            title: '支付失败',
            icon: 'none',
          });
        },
        complete: () => {
          // 支付完成后的处理
        }
      });
    },
  },
};
</script>

<style>
.container {
  padding: 20px;
}
</style>