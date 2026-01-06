"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  data() {
    return {
      paymentParams: null
    };
  },
  methods: {
    // 创建支付订单
    async createOrder() {
      const total_fee = 1;
      const out_trade_no = "KS" + Date.now();
      const payment = common_vendor.tr.importObject("payment");
      const res = await payment.createOrder({ total_fee, out_trade_no });
      if (res.code === 0) {
        const { order_no, order_info_token } = res.data;
        this.paymentParams = {
          order_no,
          order_info_token
        };
        this.pay();
      } else {
        common_vendor.index.showToast({
          title: "创建订单失败",
          icon: "none"
        });
      }
    },
    // 调起支付
    pay() {
      if (!this.paymentParams) {
        common_vendor.index.showToast({
          title: "支付参数未准备好",
          icon: "none"
        });
        return;
      }
      ks.pay({
        serviceId: "1",
        // 服务类型 id（固定值为 '1'）
        orderInfo: {
          order_no: this.paymentParams.order_no,
          order_info_token: this.paymentParams.order_info_token
        },
        success: (res) => {
          common_vendor.index.showToast({
            title: "支付成功",
            icon: "success"
          });
        },
        fail: (err) => {
          common_vendor.index.showToast({
            title: "支付失败",
            icon: "none"
          });
        },
        complete: () => {
        }
      });
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return {
    a: common_vendor.o((...args) => $options.createOrder && $options.createOrder(...args)),
    b: common_vendor.gei(_ctx, "")
  };
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
ks.createPage(MiniProgramPage);
