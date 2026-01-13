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
    const memoList = common_vendor.ref([]);
    const showMemoDialog = common_vendor.ref(false);
    const memoForm = common_vendor.ref({
      id: "",
      title: "",
      content: "",
      image_url: "",
      sort_order: 0,
      is_enabled: true
    });
    const isEditMemo = common_vendor.ref(false);
    const daohangApi = common_vendor.tr.importObject("daohang", { customUI: true });
    const configApi = common_vendor.tr.importObject("config", { customUI: true });
    const memoApi = common_vendor.tr.importObject("memoList", { customUI: true });
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
    const getMemoList = async () => {
      try {
        const res = await memoApi.getAllDefaultMemos();
        if (res && res.code === 0) {
          memoList.value = res.data || [];
        } else {
          memoList.value = [];
        }
      } catch (err) {
        console.error("获取备忘录列表失败:", err);
        memoList.value = [];
      }
    };
    const openAddMemoDialog = () => {
      isEditMemo.value = false;
      memoForm.value = {
        id: "",
        title: "",
        content: "",
        image_url: "",
        sort_order: 0,
        is_enabled: true
      };
      showMemoDialog.value = true;
    };
    const openEditMemoDialog = (memo) => {
      isEditMemo.value = true;
      memoForm.value = {
        id: memo._id,
        title: memo.title || "",
        content: memo.content,
        image_url: memo.image_url || "",
        sort_order: memo.sort_order || 0,
        is_enabled: memo.is_enabled
      };
      showMemoDialog.value = true;
    };
    const saveMemo = async () => {
      try {
        if (!memoForm.value.title.trim() && !memoForm.value.content.trim()) {
          return common_vendor.index.showToast({ title: "请输入标题或内容", icon: "none" });
        }
        common_vendor.index.showLoading({ title: "保存中..." });
        let res;
        if (isEditMemo.value) {
          res = await memoApi.updateDefaultMemo({
            id: memoForm.value.id,
            data: {
              title: memoForm.value.title,
              content: memoForm.value.content,
              image_url: memoForm.value.image_url,
              sort_order: parseInt(memoForm.value.sort_order) || 0,
              is_enabled: memoForm.value.is_enabled
            }
          });
        } else {
          res = await memoApi.addDefaultMemo({
            title: memoForm.value.title,
            content: memoForm.value.content,
            image_url: memoForm.value.image_url,
            sort_order: parseInt(memoForm.value.sort_order) || 0
          });
        }
        if (res && res.code === 0) {
          common_vendor.index.showToast({ title: "保存成功", icon: "success" });
          showMemoDialog.value = false;
          await getMemoList();
        } else {
          common_vendor.index.showToast({ title: (res == null ? void 0 : res.message) || "保存失败", icon: "none" });
        }
      } catch (err) {
        console.error("保存备忘录失败:", err);
        common_vendor.index.showToast({ title: "保存失败，请重试", icon: "none" });
      } finally {
        common_vendor.index.hideLoading();
      }
    };
    const deleteMemo = async (id) => {
      common_vendor.index.showModal({
        title: "确认删除",
        content: "确定要删除这条备忘录吗？",
        success: async (res) => {
          if (res.confirm) {
            try {
              common_vendor.index.showLoading({ title: "删除中..." });
              const result = await memoApi.deleteDefaultMemo(id);
              if (result && result.code === 0) {
                common_vendor.index.showToast({ title: "删除成功", icon: "success" });
                await getMemoList();
              } else {
                common_vendor.index.showToast({ title: (result == null ? void 0 : result.message) || "删除失败", icon: "none" });
              }
            } catch (err) {
              console.error("删除备忘录失败:", err);
              common_vendor.index.showToast({ title: "删除失败，请重试", icon: "none" });
            } finally {
              common_vendor.index.hideLoading();
            }
          }
        }
      });
    };
    const toggleMemoEnabled = async (memo) => {
      try {
        common_vendor.index.showLoading({ title: "更新中..." });
        const res = await memoApi.updateDefaultMemo({
          id: memo._id,
          data: {
            is_enabled: !memo.is_enabled
          }
        });
        if (res && res.code === 0) {
          common_vendor.index.showToast({ title: "更新成功", icon: "success" });
          await getMemoList();
        } else {
          common_vendor.index.showToast({ title: (res == null ? void 0 : res.message) || "更新失败", icon: "none" });
        }
      } catch (err) {
        console.error("更新备忘录状态失败:", err);
        common_vendor.index.showToast({ title: "更新失败，请重试", icon: "none" });
      } finally {
        common_vendor.index.hideLoading();
      }
    };
    const handleMemoContentInput = (e) => {
      memoForm.value.content = e.detail.value;
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
        getMyPageDisplayStatus(),
        getMemoList()
      ]);
      common_vendor.index.$emit("updateCommentVisibility", {
        isVisible: commentDisplay.value.isVisible
      });
      console.log("初始化完成，评论区显示状态:", commentDisplay.value.isVisible);
      console.log("初始化完成，备忘录首页显示状态:", memoHomeDisplay.value.isEnabled);
      console.log("初始化完成，备忘录列表:", memoList.value.length);
    });
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: navInfo.value.title,
        b: common_vendor.o(($event) => navInfo.value.title = $event.detail.value),
        c: navInfo.value.url,
        d: common_vendor.o(($event) => navInfo.value.url = $event.detail.value),
        e: navInfo.value.isVisible,
        f: common_vendor.o(handleNavVisibilityChange),
        g: common_vendor.o(saveNavSettings),
        h: commentDisplay.value.isVisible,
        i: common_vendor.o(handleCommentVisibilityChange),
        j: memoList.value.length === 0
      }, memoList.value.length === 0 ? {} : {
        k: common_vendor.f(memoList.value, (memo, index, i0) => {
          return common_vendor.e({
            a: common_vendor.t(index + 1),
            b: common_vendor.t(memo.title || "(无标题)"),
            c: memo.is_enabled,
            d: common_vendor.o(($event) => toggleMemoEnabled(memo)),
            e: common_vendor.t(memo.content),
            f: memo.image_url
          }, memo.image_url ? {
            g: common_vendor.t(memo.image_url)
          } : {}, {
            h: common_vendor.o(($event) => openEditMemoDialog(memo)),
            i: common_vendor.o(($event) => deleteMemo(memo._id)),
            j: memo._id
          });
        })
      }, {
        l: common_vendor.o(openAddMemoDialog),
        m: common_vendor.f(data.value, (item, k0, i0) => {
          return {
            a: common_vendor.t(item),
            b: "b5b6feed-0-" + i0,
            c: item,
            d: common_vendor.o(($event) => handleItem(item))
          };
        }),
        n: common_vendor.p({
          color: "#cccccc",
          ["custom-prefix"]: "iconfont",
          type: "icon-arrow-drop-right-line",
          size: "30"
        }),
        o: showMemoDialog.value
      }, showMemoDialog.value ? {
        p: common_vendor.t(isEditMemo.value ? "编辑备忘录" : "添加备忘录"),
        q: common_vendor.o(($event) => showMemoDialog.value = false),
        r: memoForm.value.title,
        s: common_vendor.o(($event) => memoForm.value.title = $event.detail.value),
        t: common_vendor.o([($event) => memoForm.value.content = $event.detail.value, handleMemoContentInput]),
        v: common_vendor.o(() => {
        }),
        w: memoForm.value.content,
        x: common_vendor.t(memoForm.value.content ? memoForm.value.content.length : 0),
        y: memoForm.value.image_url,
        z: common_vendor.o(($event) => memoForm.value.image_url = $event.detail.value),
        A: memoForm.value.sort_order,
        B: common_vendor.o(($event) => memoForm.value.sort_order = $event.detail.value),
        C: memoForm.value.is_enabled,
        D: common_vendor.o(($event) => memoForm.value.is_enabled = $event.detail.value),
        E: common_vendor.o(($event) => showMemoDialog.value = false),
        F: common_vendor.o(saveMemo),
        G: common_vendor.o(() => {
        }),
        H: common_vendor.o(($event) => showMemoDialog.value = false)
      } : {}, {
        I: common_vendor.gei(_ctx, "")
      });
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-b5b6feed"]]);
ks.createPage(MiniProgramPage);
