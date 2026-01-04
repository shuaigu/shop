"use strict";
const common_vendor = require("../../common/vendor.js");
const common_assets = require("../../common/assets.js");
const utils_ag = require("../../utils/ag.js");
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
    const userApi = common_vendor.tr.importObject("userKs");
    const aloneChecked = common_vendor.ref(false);
    const modelShow = common_vendor.ref(false);
    const navigateToAgreement = (type) => {
      console.log(type);
      let url = "";
      if (type === "vipServer") {
        url = utils_ag.vipServer;
        console.log("服务");
      } else if (type === "privacyAgreement") {
        url = utils_ag.privacyAgreement;
        console.log("隐私");
      }
      common_vendor.index.navigateTo({
        url: `/pages/webview/webview?url=${encodeURIComponent(url)}`
      });
    };
    let codeRes;
    const clickLogin = async () => {
      if (!aloneChecked.value) {
        aloneChecked.value = true;
      }
      try {
        common_vendor.index.showLoading({
          title: "登录中...",
          mask: true
        });
        const loginResult = await common_vendor.index.login({
          provider: "kuaishou"
          // 指定快手登录
        }).catch((err) => {
          throw new Error("获取登录code失败: " + (err.errMsg || err.message));
        });
        if (!loginResult || !loginResult.code) {
          throw new Error("获取登录code失败");
        }
        codeRes = loginResult;
        try {
          await getKsAuthInfo();
          modelShow.value = true;
        } catch (error) {
          console.error("获取用户信息失败:", error);
          throw new Error("获取用户信息失败，请重试");
        }
      } catch (err) {
        console.error("登录失败:", err);
        common_vendor.index.showToast({
          title: err.message || "登录失败，请重试",
          icon: "none",
          duration: 2e3
        });
      } finally {
        common_vendor.index.hideLoading();
      }
    };
    let userData;
    const getKsAuthInfo = async () => {
      var _a, _b;
      try {
        await new Promise((resolve, reject) => {
          ks.authorize({
            scope: "scope.userInfo",
            success: resolve,
            fail: (err) => reject(new Error("用户信息授权失败: " + err.errMsg))
          });
        });
        const result = await new Promise((resolve, reject) => {
          ks.getUserInfo({
            success: resolve,
            fail: (err) => reject(new Error("获取用户信息失败: " + err.errMsg))
          });
        });
        const ksNickName = result.userInfo.nickName;
        const ksAvatarUrl = result.userInfo.avatarUrl;
        const currentNickName = ((_a = userStore.userInfo) == null ? void 0 : _a.nickName) || "未登录";
        console.log("当前存储信息:", {
          nickName: currentNickName,
          isLogin: !!((_b = userStore.userInfo) == null ? void 0 : _b.uid)
        });
        console.log("快手返回信息:", {
          nickName: ksNickName,
          avatarUrl: ksAvatarUrl
        });
        userData = {
          nickName: ksNickName,
          avatarUrl: ksAvatarUrl
        };
        console.log("用户信息获取成功:", userData);
      } catch (error) {
        console.error("获取用户信息失败:", error);
        throw error;
      }
    };
    common_vendor.ref({
      uid: "",
      //本地平台ID
      nickName: "",
      //昵称
      avatarUrl: "/static/defalut.png",
      //头像地址
      mobile: "",
      //手机号码
      isLogin: false,
      //登录状态
      role: []
      //默认角色
    });
    const getMobile = async (e) => {
      var _a;
      try {
        if (e.detail.errMsg !== "getPhoneNumber:ok") {
          throw new Error("未授权获取手机号");
        }
        common_vendor.index.showLoading({
          title: "登录中...",
          mask: true
        });
        const params = {
          code: codeRes.code,
          encryptedData: e.detail.encryptedData,
          iv: e.detail.iv,
          nickName: userData.nickName,
          avatarUrl: userData.avatarUrl
        };
        const res = await userApi.loginByPhoneKs(params);
        if (!((_a = res.data) == null ? void 0 : _a._id)) {
          throw new Error("登录失败，请重试");
        }
        modelShow.value = false;
        try {
          console.log("登录返回数据:", JSON.stringify(res.data));
          const safeUserData = {
            uid: res.data._id || "",
            nickName: res.data.nickName || "",
            avatarUrl: res.data.avatarUrl || "/static/images/defalut.png",
            mobile: res.data.mobile || "",
            isLogin: true,
            role: Array.isArray(res.data.role) ? res.data.role : ["user"]
          };
          userStore.setUserInfo(safeUserData);
          common_vendor.index.setStorageSync("lastLoginMobile", res.data.mobile);
          common_vendor.index.showToast({
            icon: "success",
            title: res.message || "登录成功"
          });
          setTimeout(() => {
            handleLoginSuccess();
          }, 1500);
        } catch (serializeError) {
          console.error("处理用户数据失败:", serializeError);
          const basicUserInfo = {
            uid: res.data._id || "",
            nickName: res.data.nickName || "",
            avatarUrl: res.data.avatarUrl || "/static/images/defalut.png",
            mobile: res.data.mobile || "",
            isLogin: true,
            role: Array.isArray(res.data.role) ? res.data.role : ["user"]
          };
          userStore.setUserInfo(basicUserInfo);
          common_vendor.index.setStorageSync("lastLoginMobile", res.data.mobile || "");
          common_vendor.index.showToast({
            icon: "success",
            title: "登录成功"
          });
          setTimeout(() => {
            handleLoginSuccess();
          }, 1500);
        }
      } catch (err) {
        console.error("手机号登录失败:", err);
        common_vendor.index.showToast({
          title: "手机号登录失败: " + (err.message || "请重试"),
          icon: "none",
          duration: 2e3
        });
      } finally {
        common_vendor.index.hideLoading();
      }
    };
    function handleLoginSuccess() {
      common_vendor.index.switchTab({
        url: "/pages/index/index"
      });
    }
    common_vendor.onMounted(() => {
      if (userStore.userInfo.uid) {
        handleLoginSuccess();
      }
    });
    const closeModel = () => {
      modelShow.value = false;
      common_vendor.index.navigateBack();
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
      } : {}, {
        k: common_vendor.gei(_ctx, "")
      });
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-e4e4508d"]]);
ks.createPage(MiniProgramPage);
