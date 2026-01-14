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
    const showCustomPageEntry = common_vendor.ref(false);
    const showMyPage = common_vendor.ref(true);
    const configApi = common_vendor.tr.importObject("config", { customUI: true });
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
    const moreServices = () => {
      common_vendor.index.navigateTo({
        url: "/subPages/customPageList/customPageList"
      });
    };
    const getCustomPageEntryStatus = async () => {
      try {
        const res = await configApi.getConfig("customPageEntry");
        if (res && res.data) {
          showCustomPageEntry.value = res.data.isVisible !== false;
        } else {
          showCustomPageEntry.value = false;
        }
      } catch (err) {
        console.error("获取自定义页面入口配置失败:", err);
        showCustomPageEntry.value = false;
      }
    };
    const getMyPageDisplayStatus = async () => {
      try {
        const res = await configApi.getConfig("myPageDisplay");
        if (res && res.data) {
          showMyPage.value = res.data.isVisible !== false;
        } else {
          showMyPage.value = true;
        }
      } catch (err) {
        console.error("获取我的页面配置失败:", err);
        showMyPage.value = true;
      }
    };
    const handleCustomPageEntryUpdate = (e) => {
      showCustomPageEntry.value = e.isVisible;
      console.log("收到自定义页面入口状态更新:", e.isVisible);
    };
    const handleMyPageDisplayUpdate = (e) => {
      showMyPage.value = e.isVisible;
      console.log("收到我的页面状态更新:", e.isVisible);
    };
    common_vendor.onMounted(async () => {
      await Promise.all([
        getCustomPageEntryStatus(),
        getMyPageDisplayStatus()
      ]);
      if (userStore.userInfo.isLogin) {
        await checkSharerStatus();
      }
      common_vendor.index.$on("updateCustomPageEntry", handleCustomPageEntryUpdate);
      common_vendor.index.$on("updateMyPageDisplay", handleMyPageDisplayUpdate);
    });
    common_vendor.onUnmounted(() => {
      common_vendor.index.$off("updateCustomPageEntry", handleCustomPageEntryUpdate);
      common_vendor.index.$off("updateMyPageDisplay", handleMyPageDisplayUpdate);
    });
    const isAdmin = common_vendor.computed(() => userStore.userInfo.role[0] === "admin");
    const isSharer = common_vendor.ref(false);
    const checkSharerStatus = async () => {
      try {
        const userId = userStore.userInfo.uid;
        if (!userId || isAdmin.value) {
          isSharer.value = false;
          return;
        }
        const memoApi = common_vendor.tr.importObject("memoList", { customUI: true });
        const res = await memoApi.getSharerCollections(userId);
        if (res && res.code === 0 && res.data && res.data.length > 0) {
          isSharer.value = true;
        } else {
          isSharer.value = false;
        }
      } catch (err) {
        console.error("检查分享者状态失败:", err);
        isSharer.value = false;
      }
    };
    const adminManage = () => {
      if (isAdmin) {
        common_vendor.index.navigateTo({
          url: "/subPages/adminManage/adminManage"
        });
      }
    };
    const collectionManage = () => {
      if (isAdmin.value || isSharer.value) {
        common_vendor.index.navigateTo({
          url: "/pages/memo/myCollections"
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
        a: !showMyPage.value
      }, !showMyPage.value ? {
        b: common_vendor.p({
          type: "info-filled",
          size: "80",
          color: "#999"
        })
      } : common_vendor.e({
        c: common_vendor.unref(userStore).userInfo.avatarUrl,
        d: common_vendor.unref(userStore).userInfo.isLogin
      }, common_vendor.unref(userStore).userInfo.isLogin ? {
        e: common_vendor.t(common_vendor.unref(userStore).userInfo.nickName),
        f: common_vendor.t(maskedMobile.value)
      } : {
        g: common_vendor.o(clickLogin)
      }, {
        h: common_vendor.p({
          color: "#999999",
          type: "wallet",
          size: "22"
        }),
        i: common_vendor.p({
          color: "#cccccc",
          ["custom-prefix"]: "iconfont",
          type: "icon-arrow-drop-right-line",
          size: "30"
        }),
        j: common_vendor.o(contarct),
        k: common_vendor.p({
          color: "#999999",
          ["custom-prefix"]: "iconfont",
          type: "icon-yijianfankui",
          size: "22"
        }),
        l: common_vendor.p({
          color: "#cccccc",
          ["custom-prefix"]: "iconfont",
          type: "icon-arrow-drop-right-line",
          size: "30"
        }),
        m: common_vendor.o(feedBack),
        n: showCustomPageEntry.value
      }, showCustomPageEntry.value ? {
        o: common_vendor.p({
          color: "#999999",
          type: "star",
          size: "22"
        }),
        p: common_vendor.p({
          color: "#cccccc",
          ["custom-prefix"]: "iconfont",
          type: "icon-arrow-drop-right-line",
          size: "30"
        }),
        q: common_vendor.o(moreServices)
      } : {}, {
        r: common_vendor.unref(userStore).userInfo.role[0] == "admin" || isSharer.value
      }, common_vendor.unref(userStore).userInfo.role[0] == "admin" || isSharer.value ? {
        s: common_vendor.p({
          color: "#999999",
          type: "heart",
          size: "22"
        }),
        t: common_vendor.p({
          color: "#cccccc",
          ["custom-prefix"]: "iconfont",
          type: "icon-arrow-drop-right-line",
          size: "30"
        }),
        v: common_vendor.o(collectionManage)
      } : {}, {
        w: common_vendor.unref(userStore).userInfo.role[0] == "admin"
      }, common_vendor.unref(userStore).userInfo.role[0] == "admin" ? {
        x: common_vendor.p({
          color: "#999999",
          ["custom-prefix"]: "iconfont",
          type: "icon-houtaiguanli",
          size: "22"
        }),
        y: common_vendor.p({
          color: "#cccccc",
          ["custom-prefix"]: "iconfont",
          type: "icon-arrow-drop-right-line",
          size: "30"
        }),
        z: common_vendor.o(adminManage)
      } : {}, {
        A: common_vendor.unref(userStore).userInfo.isLogin
      }, common_vendor.unref(userStore).userInfo.isLogin ? {
        B: common_vendor.p({
          color: "#999999",
          ["custom-prefix"]: "iconfont",
          type: "icon-tuichudenglu",
          size: "22"
        }),
        C: common_vendor.p({
          color: "#cccccc",
          ["custom-prefix"]: "iconfont",
          type: "icon-arrow-drop-right-line",
          size: "30"
        }),
        D: common_vendor.o(loginOut)
      } : {}));
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-2f1ef635"]]);
ks.createPage(MiniProgramPage);
