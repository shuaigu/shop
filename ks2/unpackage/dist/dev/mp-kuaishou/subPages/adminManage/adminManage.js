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
    const daohangApi = common_vendor.tr.importObject("daohang", { customUI: true });
    const configApi = common_vendor.tr.importObject("config", { customUI: true });
    const luckyUserConfig = common_vendor.ref({
      lucky_ranks: [1, 8, 18],
      rewards: "幸运用户专属奖励",
      is_enabled: true
    });
    const newLuckyRank = common_vendor.ref("");
    const likeApi = common_vendor.tr.importObject("likeRecord", { customUI: true });
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
    const getLuckyUserConfig = async () => {
      try {
        common_vendor.index.showLoading({ title: "加载中..." });
        const res = await likeApi.getLuckyConfig();
        if (res.code === 0 && res.data) {
          luckyUserConfig.value = res.data;
        } else {
          common_vendor.index.showToast({ title: "获取幸运用户配置失败", icon: "none" });
        }
      } catch (err) {
        console.error("获取幸运用户配置异常:", err);
        common_vendor.index.showToast({ title: "获取幸运用户配置失败", icon: "none" });
      } finally {
        common_vendor.index.hideLoading();
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
          common_vendor.index.showToast({ title: res.message || "更新失败", icon: "none" });
        }
      } catch (err) {
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
          common_vendor.index.showToast({ title: (res == null ? void 0 : res.message) || "更新失败", icon: "none" });
        }
      } catch (err) {
        console.error("更新评论区设置失败:", err);
        common_vendor.index.showToast({ title: "更新失败，请重试", icon: "none" });
      } finally {
        common_vendor.index.hideLoading();
      }
    };
    const handleMemoHomeDisplayChange = async (e) => {
      try {
        common_vendor.index.showLoading({ title: "更新中..." });
        const isEnabled = e.detail.value;
        const res = await configApi.updateConfig({
          key: "memoHomeDisplay",
          data: {
            isEnabled
          }
        });
        if (res && res.code === 0) {
          memoHomeDisplay.value.isEnabled = isEnabled;
          common_vendor.index.showToast({
            title: isEnabled ? "已开启备忘录首页显示" : "已关闭备忘录首页显示",
            icon: "success"
          });
        } else {
          common_vendor.index.showToast({ title: (res == null ? void 0 : res.message) || "更新失败", icon: "none" });
        }
      } catch (err) {
        console.error("更新备忘录首页显示设置失败:", err);
        common_vendor.index.showToast({ title: "更新失败，请重试", icon: "none" });
      } finally {
        common_vendor.index.hideLoading();
      }
    };
    const handleLuckyUserEnabledChange = async (e) => {
      try {
        common_vendor.index.showLoading({ title: "更新中..." });
        const isEnabled = e.detail.value;
        const res = await likeApi.updateLuckyConfig({
          is_enabled: isEnabled
        });
        if (res.code === 0) {
          luckyUserConfig.value.is_enabled = isEnabled;
          common_vendor.index.showToast({
            title: isEnabled ? "幸运用户功能已启用" : "幸运用户功能已禁用",
            icon: "success"
          });
        } else {
          common_vendor.index.showToast({ title: res.message || "更新失败", icon: "none" });
        }
      } catch (err) {
        console.error("更新幸运用户设置失败:", err);
        common_vendor.index.showToast({ title: "更新失败，请重试", icon: "none" });
      } finally {
        common_vendor.index.hideLoading();
      }
    };
    const addLuckyRank = () => {
      const rank = parseInt(newLuckyRank.value);
      if (isNaN(rank) || rank <= 0) {
        return common_vendor.index.showToast({ title: "请输入有效的排名数字", icon: "none" });
      }
      if (luckyUserConfig.value.lucky_ranks.includes(rank)) {
        return common_vendor.index.showToast({ title: "该排名已存在", icon: "none" });
      }
      luckyUserConfig.value.lucky_ranks.push(rank);
      luckyUserConfig.value.lucky_ranks.sort((a, b) => a - b);
      newLuckyRank.value = "";
      common_vendor.index.showToast({ title: `已添加第${rank}位`, icon: "success" });
    };
    const removeLuckyRank = (rank) => {
      luckyUserConfig.value.lucky_ranks = luckyUserConfig.value.lucky_ranks.filter((r) => r !== rank);
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
    const saveLuckyUserConfig = async () => {
      try {
        if (!luckyUserConfig.value.lucky_ranks || luckyUserConfig.value.lucky_ranks.length === 0) {
          return common_vendor.index.showToast({ title: "请至少添加一个幸运用户排名", icon: "none" });
        }
        if (!luckyUserConfig.value.rewards || !luckyUserConfig.value.rewards.trim()) {
          return common_vendor.index.showToast({ title: "请输入奖励描述", icon: "none" });
        }
        common_vendor.index.showLoading({ title: "保存中..." });
        const res = await likeApi.updateLuckyConfig({
          lucky_ranks: luckyUserConfig.value.lucky_ranks,
          rewards: luckyUserConfig.value.rewards,
          is_enabled: luckyUserConfig.value.is_enabled
        });
        if (res.code === 0) {
          common_vendor.index.showToast({ title: "保存成功", icon: "success" });
        } else {
          common_vendor.index.showToast({ title: res.message || "保存失败", icon: "none" });
        }
      } catch (err) {
        console.error("保存幸运用户配置失败:", err);
        common_vendor.index.showToast({ title: "保存失败，请重试", icon: "none" });
      } finally {
        common_vendor.index.hideLoading();
      }
    };
    const data = common_vendor.ref(["分类管理", "文章管理", "用户反馈", "公司信息", "文章权限"]);
    const handleItem = (dataItem) => {
      switch (dataItem) {
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
        case "文章权限":
          showSendUpdate();
          break;
      }
    };
    common_vendor.onMounted(async () => {
      await Promise.all([
        getNavInfo(),
        getCommentDisplayStatus(),
        getLuckyUserConfig(),
        getMemoHomeDisplayStatus()
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
        j: memoHomeDisplay.value.isEnabled,
        k: common_vendor.o(handleMemoHomeDisplayChange),
        l: luckyUserConfig.value.is_enabled,
        m: common_vendor.o(handleLuckyUserEnabledChange),
        n: luckyUserConfig.value.rewards,
        o: common_vendor.o(($event) => luckyUserConfig.value.rewards = $event.detail.value),
        p: common_vendor.f(luckyUserConfig.value.lucky_ranks, (rank, k0, i0) => {
          return {
            a: common_vendor.t(rank),
            b: common_vendor.o(($event) => removeLuckyRank(rank)),
            c: rank
          };
        }),
        q: common_vendor.o(addLuckyRank),
        r: newLuckyRank.value,
        s: common_vendor.o(($event) => newLuckyRank.value = $event.detail.value),
        t: common_vendor.o(addLuckyRank),
        v: common_vendor.o(saveLuckyUserConfig),
        w: common_vendor.f(data.value, (item, k0, i0) => {
          return {
            a: common_vendor.t(item),
            b: "b5b6feed-0-" + i0,
            c: item,
            d: common_vendor.o(($event) => handleItem(item))
          };
        }),
        x: common_vendor.p({
          color: "#cccccc",
          ["custom-prefix"]: "iconfont",
          type: "icon-arrow-drop-right-line",
          size: "30"
        }),
        y: common_vendor.gei(_ctx, "")
      };
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-b5b6feed"]]);
ks.createPage(MiniProgramPage);
