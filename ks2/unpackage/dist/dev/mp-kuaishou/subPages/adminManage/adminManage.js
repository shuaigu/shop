"use strict";
const common_vendor = require("../../common/vendor.js");
if (!Array) {
  const _easycom_uni_icons2 = common_vendor.resolveComponent("uni-icons");
  _easycom_uni_icons2();
}
const _easycom_uni_icons = () => "../../uni_modules/uni-icons/components/uni-icons/uni-icons.js";
if (!Math) {
  _easycom_uni_icons();
}
const _sfc_main = {
  __name: "adminManage",
  setup(__props) {
    const navInfo = common_vendor.ref({
      title: "",
      url: "",
      isVisible: false
    });
    const commentDisplay = common_vendor.ref({
      isVisible: false
    });
    const memoHomeDisplay = common_vendor.ref({
      isEnabled: false
    });
    const customPageEntryDisplay = common_vendor.ref({
      isVisible: false
    });
    const myPageDisplay = common_vendor.ref({
      isVisible: true
      // 默认显示
    });
    const daohangApi = common_vendor.tr.importObject("daohang", { customUI: true });
    const configApi = common_vendor.tr.importObject("config", { customUI: true });
    const getNavInfo = async () => {
      try {
        common_vendor.index.showLoading({ title: "加载中..." });
        const res = await daohangApi.getNavInfo();
        if (res.code === 0 && res.data) {
          navInfo.value = res.data;
        } else {
          common_vendor.index.showToast({ title: "获取导航信息失败", icon: "none" });
        }
      } catch (err) {
        console.error("获取导航信息异常:", err);
        common_vendor.index.showToast({ title: "获取导航信息失败", icon: "none" });
      } finally {
        common_vendor.index.hideLoading();
      }
    };
    const getCommentDisplayStatus = async () => {
      try {
        const res = await configApi.getConfig("commentDisplay");
        if (res && res.data) {
          commentDisplay.value = res.data;
        } else {
          commentDisplay.value = { isVisible: false };
          try {
            await configApi.updateConfig({
              key: "commentDisplay",
              data: {
                isVisible: false
              }
            });
            console.log("已创建默认评论区配置：不显示");
          } catch (createErr) {
            console.error("创建默认评论区配置失败:", createErr);
          }
        }
      } catch (err) {
        console.error("获取评论区显示状态失败:", err);
        commentDisplay.value = { isVisible: false };
        common_vendor.index.showToast({ title: "获取评论区设置失败", icon: "none" });
      }
    };
    const getMemoHomeDisplayStatus = async () => {
      try {
        const res = await configApi.getConfig("memoHomeDisplay");
        if (res && res.data) {
          memoHomeDisplay.value = res.data;
        } else {
          memoHomeDisplay.value = { isEnabled: false };
        }
      } catch (err) {
        console.error("获取备忘录首页显示状态失败:", err);
        memoHomeDisplay.value = { isEnabled: false };
      }
    };
    const getCustomPageEntryStatus = async () => {
      try {
        const res = await configApi.getConfig("customPageEntry");
        if (res && res.data) {
          customPageEntryDisplay.value = res.data;
        } else {
          customPageEntryDisplay.value = { isVisible: false };
          try {
            await configApi.updateConfig({
              key: "customPageEntry",
              data: {
                isVisible: false
              }
            });
            console.log("已创建默认自定义页面入口配置：关闭");
          } catch (createErr) {
            console.error("创建默认自定义页面入口配置失败:", createErr);
          }
        }
      } catch (err) {
        console.error("获取自定义页面入口显示状态失败:", err);
        customPageEntryDisplay.value = { isVisible: false };
      }
    };
    const getMyPageDisplayStatus = async () => {
      try {
        const res = await configApi.getConfig("myPageDisplay");
        if (res && res.data) {
          myPageDisplay.value = res.data;
        } else {
          myPageDisplay.value = { isVisible: true };
          try {
            await configApi.updateConfig({
              key: "myPageDisplay",
              data: {
                isVisible: true
              }
            });
            console.log("已创建默认我的页面配置：显示");
          } catch (createErr) {
            console.error("创建默认我的页面配置失败:", createErr);
          }
        }
      } catch (err) {
        console.error("获取我的页面显示状态失败:", err);
        myPageDisplay.value = { isVisible: true };
      }
    };
    const handleNavVisibilityChange = async (e) => {
      try {
        common_vendor.index.showLoading({ title: "更新中..." });
        const isVisible = e.detail.value;
        const res = await daohangApi.updateNavInfo({
          isVisible
        });
        if (res.code === 0) {
          navInfo.value.isVisible = isVisible;
          common_vendor.index.$emit("updateNavVisibility", {
            isVisible,
            navInfo: {
              title: navInfo.value.title,
              url: navInfo.value.url,
              isVisible
            }
          });
          common_vendor.index.showToast({
            title: isVisible ? "导航已显示" : "导航已隐藏",
            icon: "success"
          });
        } else {
          navInfo.value.isVisible = !isVisible;
          common_vendor.index.showToast({ title: res.message || "更新失败", icon: "none" });
        }
      } catch (err) {
        navInfo.value.isVisible = !e.detail.value;
        console.error("更新导航设置失败:", err);
        common_vendor.index.showToast({ title: "更新失败，请重试", icon: "none" });
      } finally {
        common_vendor.index.hideLoading();
      }
    };
    const handleCommentVisibilityChange = async (e) => {
      try {
        common_vendor.index.showLoading({ title: "更新中..." });
        const isVisible = e.detail.value;
        const res = await configApi.updateConfig({
          key: "commentDisplay",
          data: {
            isVisible
          }
        });
        if (res && res.code === 0) {
          commentDisplay.value.isVisible = isVisible;
          common_vendor.index.$emit("updateCommentVisibility", {
            isVisible
          });
          common_vendor.index.showToast({
            title: isVisible ? "评论区已显示" : "评论区已隐藏",
            icon: "success"
          });
        } else {
          commentDisplay.value.isVisible = !isVisible;
          common_vendor.index.showToast({ title: (res == null ? void 0 : res.message) || "更新失败", icon: "none" });
        }
      } catch (err) {
        commentDisplay.value.isVisible = !e.detail.value;
        console.error("更新评论区设置失败:", err);
        common_vendor.index.showToast({ title: "更新失败，请重试", icon: "none" });
      } finally {
        common_vendor.index.hideLoading();
      }
    };
    const saveNavSettings = async () => {
      try {
        if (!navInfo.value.title.trim()) {
          return common_vendor.index.showToast({ title: "请输入导航标题", icon: "none" });
        }
        if (!navInfo.value.url.trim()) {
          return common_vendor.index.showToast({ title: "请输入导航链接", icon: "none" });
        }
        common_vendor.index.showLoading({ title: "保存中..." });
        const res = await daohangApi.updateNavInfo({
          title: navInfo.value.title,
          url: navInfo.value.url,
          isVisible: navInfo.value.isVisible
        });
        if (res.code === 0) {
          common_vendor.index.$emit("updateNavVisibility", {
            isVisible: navInfo.value.isVisible,
            navInfo: {
              title: navInfo.value.title,
              url: navInfo.value.url,
              isVisible: navInfo.value.isVisible
            }
          });
          common_vendor.index.showToast({ title: "保存成功", icon: "success" });
        } else {
          common_vendor.index.showToast({ title: res.message || "保存失败", icon: "none" });
        }
      } catch (err) {
        console.error("保存导航设置失败:", err);
        common_vendor.index.showToast({ title: "保存失败，请重试", icon: "none" });
      } finally {
        common_vendor.index.hideLoading();
      }
    };
    const data = common_vendor.ref(["信息页面", "分类管理", "文章管理", "用户反馈", "公司信息", "自定义页面管理", "文章权限"]);
    const handleItem = (dataItem) => {
      switch (dataItem) {
        case "信息页面":
          console.log("跳转信息页面");
          common_vendor.index.redirectTo({
            url: "/pages/index/index"
          });
          break;
        case "分类管理":
          console.log("跳转分类管理");
          common_vendor.index.navigateTo({
            url: "/subPages/cateManage/cateManage"
          });
          break;
        case "文章管理":
          console.log("跳转文章管理");
          common_vendor.index.navigateTo({
            url: "/subPages/articleManage/articleManage"
          });
          break;
        case "用户反馈":
          console.log("跳转用户反馈");
          common_vendor.index.navigateTo({
            url: "/subPages/feedManage/feedManage"
          });
          break;
        case "公司信息":
          console.log("跳转公司信息");
          common_vendor.index.navigateTo({
            url: "/subPages/companyInfo/companyInfo"
          });
          break;
        case "自定义页面管理":
          console.log("跳转自定义页面管理");
          common_vendor.index.navigateTo({
            url: "/subPages/customPageManage/customPageManage"
          });
          break;
        case "文章权限":
          showSendUpdate();
          break;
      }
    };
    common_vendor.onMounted(async () => {
      await Promise.all([
        getNavInfo(),
        getCommentDisplayStatus(),
        getMemoHomeDisplayStatus(),
        getCustomPageEntryStatus(),
        getMyPageDisplayStatus()
      ]);
      common_vendor.index.$emit("updateCommentVisibility", {
        isVisible: commentDisplay.value.isVisible
      });
      console.log("初始化完成，评论区显示状态:", commentDisplay.value.isVisible);
      console.log("初始化完成，备忘录首页显示状态:", memoHomeDisplay.value.isEnabled);
    });
    return (_ctx, _cache) => {
      return {
        a: navInfo.value.title,
        b: common_vendor.o(($event) => navInfo.value.title = $event.detail.value),
        c: navInfo.value.url,
        d: common_vendor.o(($event) => navInfo.value.url = $event.detail.value),
        e: navInfo.value.isVisible,
        f: common_vendor.o(handleNavVisibilityChange),
        g: common_vendor.o(saveNavSettings),
        h: commentDisplay.value.isVisible,
        i: common_vendor.o(handleCommentVisibilityChange),
        j: common_vendor.f(data.value, (item, k0, i0) => {
          return {
            a: common_vendor.t(item),
            b: "b5b6feed-0-" + i0,
            c: item,
            d: common_vendor.o(($event) => handleItem(item))
          };
        }),
        k: common_vendor.p({
          color: "#cccccc",
          ["custom-prefix"]: "iconfont",
          type: "icon-arrow-drop-right-line",
          size: "30"
        }),
        l: common_vendor.gei(_ctx, "")
      };
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-b5b6feed"]]);
ks.createPage(MiniProgramPage);
