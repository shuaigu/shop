"use strict";
const common_vendor = require("../../common/vendor.js");
const common_assets = require("../../common/assets.js");
const store_user = require("../../store/user.js");
if (!Array) {
  const _easycom_up_checkbox2 = common_vendor.resolveComponent("up-checkbox");
  _easycom_up_checkbox2();
}
const _easycom_up_checkbox = () => "../../uni_modules/uview-plus/components/u-checkbox/u-checkbox.js";
if (!Math) {
  _easycom_up_checkbox();
}
const _sfc_main = {
  __name: "login",
  setup(__props) {
    const userStore = store_user.useUserInfoStore();
    const dyLogin = common_vendor.nr.importObject("userDy");
    const modelShow = common_vendor.ref(false);
    const code = common_vendor.ref();
    const aloneChecked = common_vendor.ref(true);
    common_vendor.onMounted(() => {
      aloneChecked.value = true;
    });
    const clickLogin = async () => {
      aloneChecked.value = true;
      await tt.login({
        success(result) {
          code.value = result.code;
          modelShow.value = true;
        }
      });
    };
    const closeModel = () => {
      modelShow.value = false;
    };
    const navigateToAgreement = (type) => {
      common_vendor.index.navigateTo({
        url: `/pages/agreement/${type}`
      });
    };
    const getMobile = async (e) => {
      if (e.detail.errMsg !== "getPhoneNumber:ok") {
        common_vendor.index.showToast({
          title: "获取手机号失败",
          icon: "none"
        });
        return;
      }
      const params = {
        code: code.value,
        encryptedData: e.detail.encryptedData,
        iv: e.detail.iv
      };
      try {
        common_vendor.index.showLoading({
          title: "登录中...",
          mask: true
        });
        const res = await dyLogin.loginByPhoneDy(params);
        common_vendor.index.__f__("log", "at pages/login/login.vue:66", res);
        common_vendor.index.hideLoading();
        if (res.code === 0) {
          userStore.login({
            uid: res.data.uid || "",
            nickName: res.data.nickName || "",
            avatarUrl: res.data.avatarUrl || "/static/images/defalut.png",
            mobile: res.data.mobile || "",
            role: res.data.role || []
          });
          common_vendor.index.showToast({
            title: "登录成功",
            icon: "success"
          });
          const pages = getCurrentPages();
          if (pages.length > 1) {
            setTimeout(() => {
              common_vendor.index.navigateBack({
                delta: 1,
                success: () => {
                  common_vendor.index.__f__("log", "at pages/login/login.vue:95", "成功返回上一页");
                },
                fail: (err) => {
                  common_vendor.index.__f__("error", "at pages/login/login.vue:98", "返回上一页失败:", err);
                  common_vendor.index.switchTab({
                    url: "/pages/index/index"
                  });
                }
              });
            }, 1500);
          } else {
            setTimeout(() => {
              common_vendor.index.switchTab({
                url: "/pages/index/index"
              });
            }, 1500);
          }
          common_vendor.index.$emit("loginSuccess", userStore.userInfo);
        } else {
          common_vendor.index.showToast({
            title: res.message || "登录失败",
            icon: "none"
          });
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/login/login.vue:124", error);
        common_vendor.index.hideLoading();
        common_vendor.index.showToast({
          title: "登录失败，请稍后再试",
          icon: "none"
        });
      }
    };
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_assets._imports_0,
        b: common_vendor.o(($event) => aloneChecked.value = $event),
        c: common_vendor.p({
          activeColor: "#46b0fe",
          name: "agree",
          usedAlone: true,
          shape: "circle",
          checked: aloneChecked.value
        }),
        d: common_vendor.o(($event) => navigateToAgreement("vipServer")),
        e: common_vendor.o(($event) => navigateToAgreement("privacyAgreement")),
        f: common_vendor.o(clickLogin),
        g: modelShow.value
      }, modelShow.value ? {
        h: common_vendor.o(closeModel),
        i: common_assets._imports_1,
        j: common_vendor.o(getMobile)
      } : {});
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-e4e4508d"]]);
tt.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-toutiao/pages/login/login.js.map
