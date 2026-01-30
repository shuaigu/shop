"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  __name: "register",
  setup(__props) {
    const username = common_vendor.ref("");
    const nickname = common_vendor.ref("");
    const password = common_vendor.ref("");
    const confirmPassword = common_vendor.ref("");
    const loading = common_vendor.ref(false);
    const { proxy } = common_vendor.getCurrentInstance();
    const goBack = () => {
      common_vendor.index.navigateBack();
    };
    const handleRegister = async () => {
      if (!username.value || !password.value || !confirmPassword.value) {
        return common_vendor.index.showToast({ title: "请填写完整信息", icon: "none" });
      }
      if (password.value !== confirmPassword.value) {
        return common_vendor.index.showToast({ title: "两次密码输入不一致", icon: "none" });
      }
      if (username.value.length < 3) {
        return common_vendor.index.showToast({ title: "用户名太短", icon: "none" });
      }
      if (password.value.length < 6) {
        return common_vendor.index.showToast({ title: "密码至少6位", icon: "none" });
      }
      loading.value = true;
      try {
        const res = await proxy.$request({
          url: "/register",
          method: "POST",
          data: {
            username: username.value,
            nickname: nickname.value || username.value,
            password: password.value
          }
        });
        if (res.success) {
          common_vendor.index.showToast({ title: "注册成功，请登录", icon: "success" });
          setTimeout(() => {
            common_vendor.index.navigateBack();
          }, 1500);
        } else {
          common_vendor.index.showToast({ title: res.message || "注册失败", icon: "none" });
        }
      } catch (e) {
        common_vendor.index.showToast({ title: "网络请求错误", icon: "none" });
      } finally {
        loading.value = false;
      }
    };
    return (_ctx, _cache) => {
      return {
        a: common_vendor.o(goBack),
        b: username.value,
        c: common_vendor.o(($event) => username.value = $event.detail.value),
        d: nickname.value,
        e: common_vendor.o(($event) => nickname.value = $event.detail.value),
        f: password.value,
        g: common_vendor.o(($event) => password.value = $event.detail.value),
        h: confirmPassword.value,
        i: common_vendor.o(($event) => confirmPassword.value = $event.detail.value),
        j: loading.value,
        k: common_vendor.o(handleRegister)
      };
    };
  }
};
wx.createPage(_sfc_main);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/login/register.js.map
