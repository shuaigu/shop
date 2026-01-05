"use strict";
const common_vendor = require("../../common/vendor.js");
const store_user = require("../../store/user.js");
if (!Array) {
  const _easycom_uni_icons2 = common_vendor.resolveComponent("uni-icons");
  _easycom_uni_icons2();
}
const _easycom_uni_icons = () => "../../uni_modules/uni-icons/components/uni-icons/uni-icons.js";
if (!Math) {
  _easycom_uni_icons();
}
const _sfc_main = {
  __name: "my",
  setup(__props) {
    const userStore = store_user.useUserInfoStore();
    const maskedMobile = common_vendor.computed(() => {
      const mobile = userStore.userInfo.mobile;
      if (!mobile)
        return "";
      return mobile.replace(/(\d{3})\d{4}(\d{4})/, "$1****$2");
    });
    const clickLogin = async () => {
      common_vendor.index.navigateTo({
        url: "/pages/login/login"
      });
    };
    const contarct = () => {
      common_vendor.index.navigateTo({
        url: "/subPages/contarct/contarct"
      });
    };
    const feedBack = () => {
      common_vendor.index.navigateTo({
        url: "/subPages/feedBack/feedBack"
      });
    };
    const goToMemo = () => {
      common_vendor.index.navigateTo({
        url: "/pages/memo/memo"
      });
    };
    const isAdmin = common_vendor.computed(() => userStore.userInfo.role[0] === "admin");
    const adminManage = () => {
      if (isAdmin) {
        common_vendor.index.navigateTo({
          url: "/subPages/adminManage/adminManage"
        });
      }
    };
    const loginOut = () => {
      common_vendor.index.showModal({
        title: "提示",
        content: "确定要退出登录吗",
        success(res) {
          if (res.confirm) {
            userStore.cleanUserInfo();
          }
        }
      });
    };
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.unref(userStore).userInfo.avatarUrl,
        b: common_vendor.unref(userStore).userInfo.isLogin
      }, common_vendor.unref(userStore).userInfo.isLogin ? {
        c: common_vendor.t(common_vendor.unref(userStore).userInfo.nickName),
        d: common_vendor.t(maskedMobile.value)
      } : {
        e: common_vendor.o(clickLogin)
      }, {
        f: common_vendor.p({
          color: "#999999",
          type: "wallet",
          size: "22"
        }),
        g: common_vendor.p({
          color: "#cccccc",
          ["custom-prefix"]: "iconfont",
          type: "icon-arrow-drop-right-line",
          size: "30"
        }),
        h: common_vendor.o(contarct),
        i: common_vendor.p({
          color: "#999999",
          ["custom-prefix"]: "iconfont",
          type: "icon-yijianfankui",
          size: "22"
        }),
        j: common_vendor.p({
          color: "#cccccc",
          ["custom-prefix"]: "iconfont",
          type: "icon-arrow-drop-right-line",
          size: "30"
        }),
        k: common_vendor.o(feedBack),
        l: common_vendor.p({
          color: "#999999",
          type: "paperplane",
          size: "22"
        }),
        m: common_vendor.p({
          color: "#cccccc",
          ["custom-prefix"]: "iconfont",
          type: "icon-arrow-drop-right-line",
          size: "30"
        }),
        n: common_vendor.o(goToMemo),
        o: common_vendor.unref(userStore).userInfo.role[0] == "admin"
      }, common_vendor.unref(userStore).userInfo.role[0] == "admin" ? {
        p: common_vendor.p({
          color: "#999999",
          ["custom-prefix"]: "iconfont",
          type: "icon-houtaiguanli",
          size: "22"
        }),
        q: common_vendor.p({
          color: "#cccccc",
          ["custom-prefix"]: "iconfont",
          type: "icon-arrow-drop-right-line",
          size: "30"
        }),
        r: common_vendor.o(adminManage)
      } : {}, {
        s: common_vendor.unref(userStore).userInfo.isLogin
      }, common_vendor.unref(userStore).userInfo.isLogin ? {
        t: common_vendor.p({
          color: "#999999",
          ["custom-prefix"]: "iconfont",
          type: "icon-tuichudenglu",
          size: "22"
        }),
        v: common_vendor.p({
          color: "#cccccc",
          ["custom-prefix"]: "iconfont",
          type: "icon-arrow-drop-right-line",
          size: "30"
        }),
        w: common_vendor.o(loginOut)
      } : {}, {
        x: common_vendor.gei(_ctx, "")
      });
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-2f1ef635"]]);
ks.createPage(MiniProgramPage);
