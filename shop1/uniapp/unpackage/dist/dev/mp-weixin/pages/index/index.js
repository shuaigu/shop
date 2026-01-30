"use strict";
const common_vendor = require("../../common/vendor.js");
const store_user = require("../../store/user.js");
const pageSize = 10;
const _sfc_main = {
  __name: "index",
  setup(__props) {
    const userStore = store_user.useUserInfoStore();
    const articleList = common_vendor.ref([]);
    const loading = common_vendor.ref(false);
    const pageNo = common_vendor.ref(1);
    const payLoading = common_vendor.ref(false);
    const loadArticles = async () => {
      if (loading.value)
        return;
      loading.value = true;
      try {
        const res = await common_vendor.index.request({
          url: "https://shop.jingle0350.cn/shop1/php1/api.php?path=articles",
          method: "GET",
          data: {
            page: pageNo.value,
            pageSize
          }
        });
        if (res.data && res.data.code === 0) {
          articleList.value = res.data.data || [];
        } else {
          common_vendor.index.__f__("error", "at pages/index/index.vue:65", "获取文章失败:", res.data);
          common_vendor.index.showToast({ title: res.data.message || "加载失败", icon: "none" });
        }
      } catch (err) {
        common_vendor.index.__f__("error", "at pages/index/index.vue:69", "加载文章失败:", err);
        common_vendor.index.showToast({ title: "加载失败", icon: "none" });
      } finally {
        loading.value = false;
      }
    };
    common_vendor.onMounted(() => {
      common_vendor.index.__f__("log", "at pages/index/index.vue:77", "首页加载");
      loadArticles();
    });
    common_vendor.onPullDownRefresh(async () => {
      pageNo.value = 1;
      await loadArticles();
      common_vendor.index.stopPullDownRefresh();
    });
    const goLogin = () => {
      common_vendor.index.navigateTo({ url: "/pages/login/login" });
    };
    const handlePay = async () => {
      if (!userStore.userInfo.isLogin || !userStore.userInfo.uid) {
        common_vendor.index.showModal({
          title: "提示",
          content: "请先登录后再进行支付",
          confirmText: "去登录",
          cancelText: "取消",
          success: (res) => {
            if (res.confirm) {
              goLogin();
            }
          }
        });
        return;
      }
      payLoading.value = true;
      try {
        const out_trade_no = "ORDER_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
        const openid = userStore.userInfo.openid;
        if (!openid) {
          common_vendor.index.showModal({
            title: "提示",
            content: "用户信息异常，请重新登录",
            confirmText: "重新登录",
            success: (res) => {
              if (res.confirm) {
                userStore.cleanUserInfo();
                common_vendor.index.removeStorageSync("userInfo");
                goLogin();
              }
            }
          });
          return;
        }
        const wxpay = common_vendor.tr.importObject("wxpay");
        const payResult = await wxpay.wxpay({
          openid,
          out_trade_no,
          total_fee: 1
          // 金额（分），这里设置为0.01元作为测试
        });
        common_vendor.index.__f__("log", "at pages/index/index.vue:145", "支付参数:", payResult);
        common_vendor.index.requestPayment({
          provider: "wxpay",
          timeStamp: payResult.timeStamp,
          nonceStr: payResult.nonceStr,
          package: payResult.package,
          signType: payResult.signType,
          paySign: payResult.paySign,
          success: (res) => {
            common_vendor.index.__f__("log", "at pages/index/index.vue:156", "支付成功:", res);
            common_vendor.index.showToast({ title: "保存成功", icon: "success" });
          },
          fail: (err) => {
            common_vendor.index.__f__("error", "at pages/index/index.vue:161", "支付失败:", err);
            if (err.errMsg.includes("cancel")) {
              common_vendor.index.showToast({ title: "取消支付", icon: "none" });
            } else {
              common_vendor.index.showToast({ title: "支付失败", icon: "none" });
            }
          }
        });
      } catch (err) {
        common_vendor.index.__f__("error", "at pages/index/index.vue:171", "支付错误:", err);
        common_vendor.index.showToast({ title: err.message || "支付异常", icon: "none" });
      } finally {
        payLoading.value = false;
      }
    };
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.f(articleList.value, (item, k0, i0) => {
          return {
            a: common_vendor.t(item.title),
            b: common_vendor.t(item.content),
            c: common_vendor.t(item.author),
            d: item.id
          };
        }),
        b: !common_vendor.unref(userStore).userInfo.isLogin
      }, !common_vendor.unref(userStore).userInfo.isLogin ? {
        c: common_vendor.o(goLogin)
      } : {}, {
        d: common_vendor.t(payLoading.value ? "支付中..." : "立即支付"),
        e: common_vendor.o(handlePay),
        f: payLoading.value
      });
    };
  }
};
wx.createPage(_sfc_main);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/index/index.js.map
