"use strict";
const common_vendor = require("../../common/vendor.js");
const store_user = require("../../store/user.js");
const _sfc_main = {
  __name: "login",
  setup(__props) {
    const userStore = store_user.useUserInfoStore();
    const isAgree = common_vendor.ref(false);
    const loading = common_vendor.ref(false);
    const redirectUrl = common_vendor.ref("");
    common_vendor.onLoad((options) => {
      if (options.redirect) {
        redirectUrl.value = decodeURIComponent(options.redirect);
        common_vendor.index.__f__("log", "at pages/login/login.vue:43", "登录后将跳转到:", redirectUrl.value);
      }
    });
    const agreementChange = (e) => {
      isAgree.value = e.detail.value.length > 0;
    };
    const handleWxLogin = async () => {
      if (!isAgree.value) {
        return common_vendor.index.showToast({ title: "请先阅读并同意协议", icon: "none" });
      }
      loading.value = true;
      try {
        common_vendor.index.__f__("log", "at pages/login/login.vue:59", "开始调用 wx.login...");
        const loginRes = await common_vendor.index.login({ provider: "weixin" });
        if (!loginRes || !loginRes.code) {
          common_vendor.index.__f__("error", "at pages/login/login.vue:63", "wx.login 失败:", loginRes);
          common_vendor.index.showModal({
            title: "登录失败",
            content: "获取微信授权失败，请检查：\n1. 是否在微信开发者工具中\n2. 是否配置了正确的 AppID\n3. 是否开启了“不校验合法域名”",
            showCancel: false
          });
          return;
        }
        common_vendor.index.__f__("log", "at pages/login/login.vue:72", "获取到 code:", loginRes.code);
        common_vendor.index.__f__("log", "at pages/login/login.vue:75", "开始调用后端登录接口...");
        const res = await common_vendor.index.request({
          url: "https://shop.jingle0350.cn/shop1/php1/api.php?path=wx-login",
          method: "POST",
          data: {
            code: loginRes.code
          }
        });
        common_vendor.index.__f__("log", "at pages/login/login.vue:84", "后端登录响应:", res.data);
        if (res.data && res.data.success) {
          const loginData = res.data.data;
          const userData = loginData.userInfo;
          userStore.setUserInfo({
            uid: userData._id,
            nickName: userData.nickName || "微信用户",
            avatarUrl: userData.avatarUrl || "/static/images/touxiang.png",
            mobile: userData.mobile || "138****8888",
            openid: userData.openid,
            // 保存openid用于支付
            isLogin: true,
            token: loginData.token,
            role: userData.role || ["user"]
          });
          common_vendor.index.__f__("log", "at pages/login/login.vue:102", "用户信息已保存:", userStore.userInfo);
          common_vendor.index.showToast({ title: "登录成功", icon: "success" });
          setTimeout(() => {
            if (redirectUrl.value) {
              common_vendor.index.redirectTo({ url: redirectUrl.value });
            } else {
              common_vendor.index.switchTab({ url: "/pages/index/index" });
            }
          }, 1e3);
        } else {
          const errorMsg = res.data.message || "登录失败";
          common_vendor.index.__f__("error", "at pages/login/login.vue:116", "登录失败:", errorMsg);
          common_vendor.index.showToast({ title: errorMsg, icon: "none", duration: 3e3 });
        }
      } catch (e) {
        common_vendor.index.__f__("error", "at pages/login/login.vue:120", "登录异常:", e);
        common_vendor.index.showModal({
          title: "登录失败",
          content: "登录过程出现异常：" + (e.errMsg || e.message || JSON.stringify(e)),
          showCancel: false
        });
      } finally {
        loading.value = false;
      }
    };
    return (_ctx, _cache) => {
      return {
        a: common_vendor.o(handleWxLogin),
        b: isAgree.value,
        c: common_vendor.o(agreementChange)
      };
    };
  }
};
wx.createPage(_sfc_main);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/login/login.js.map
