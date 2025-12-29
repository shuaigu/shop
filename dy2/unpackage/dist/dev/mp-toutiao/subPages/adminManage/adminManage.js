"use strict";
const common_vendor = require("../../common/vendor.js");
const store_authSwitch = require("../../store/authSwitch.js");
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
    const authSwitchStore = store_authSwitch.useAuthSwitchStore();
    const sendOnApi = common_vendor.nr.importObject("sendOn");
    const indexYunApi = common_vendor.nr.importObject("indexYun");
    const sendOnget = async () => {
      try {
        common_vendor.index.showLoading({
          title: "获取按钮状态...",
          mask: true
        });
        const res = await sendOnApi.get();
        if (res && res.data && res.data.length > 0) {
          publishButtonState.value = res.data[0].publishButton !== void 0 ? res.data[0].publishButton : false;
          floatButtonState.value = res.data[0].floatButton !== void 0 ? res.data[0].floatButton : false;
          avatarClickState.value = res.data[0].avatarClick !== void 0 ? res.data[0].avatarClick : false;
          commentVisibilityState.value = res.data[0].commentVisibility !== void 0 ? res.data[0].commentVisibility : false;
          lotteryVisibilityState.value = res.data[0].lotteryVisibility !== void 0 ? res.data[0].lotteryVisibility : false;
          fansGroupId.value = res.data[0].fans_group_id !== void 0 ? res.data[0].fans_group_id : "CgYIASAHKAESTgpMPxsfnWvXJ61q6Eun6E6R/pZOQXqOK93pt9RbaamdIKv8hWML07CE8p7UrP6JX+XO7emnzmu+LFuaNy62FR6ye20jDcp/UPy2SaOrbBoA";
          authSwitchStore.setAuthValue(true);
          common_vendor.index.__f__("log", "at subPages/adminManage/adminManage.vue:34", "发布按钮状态:", publishButtonState.value);
          common_vendor.index.__f__("log", "at subPages/adminManage/adminManage.vue:35", "悬浮按钮状态:", floatButtonState.value);
          common_vendor.index.__f__("log", "at subPages/adminManage/adminManage.vue:36", "头像点击状态:", avatarClickState.value);
          common_vendor.index.__f__("log", "at subPages/adminManage/adminManage.vue:37", "评论显示状态:", commentVisibilityState.value);
          common_vendor.index.__f__("log", "at subPages/adminManage/adminManage.vue:38", "抽奖模块状态:", lotteryVisibilityState.value);
          common_vendor.index.__f__("log", "at subPages/adminManage/adminManage.vue:39", "粉丝群ID:", fansGroupId.value);
        } else {
          common_vendor.index.__f__("error", "at subPages/adminManage/adminManage.vue:41", "获取按钮状态失败: 数据格式不正确");
          common_vendor.index.showToast({
            icon: "none",
            title: "获取按钮状态失败"
          });
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at subPages/adminManage/adminManage.vue:48", "获取按钮状态失败:", error);
        common_vendor.index.showToast({
          icon: "none",
          title: "获取按钮状态失败"
        });
      } finally {
        common_vendor.index.hideLoading();
      }
    };
    common_vendor.onShow(() => {
      sendOnget();
      getHomeButtonState();
    });
    const publishButtonState = common_vendor.ref(false);
    const floatButtonState = common_vendor.ref(false);
    const avatarClickState = common_vendor.ref(false);
    const commentVisibilityState = common_vendor.ref(false);
    const lotteryVisibilityState = common_vendor.ref(false);
    const fansGroupId = common_vendor.ref("");
    const showFansGroupModal = common_vendor.ref(false);
    const editingFansGroupId = common_vendor.ref("");
    const homeButtonState = common_vendor.ref(false);
    const homeButtonText = common_vendor.ref("返回首页");
    const homeButtonIcon = common_vendor.ref("🏠");
    const togglePublishButton = async (e) => {
      e.stopPropagation();
      const newState = e.detail.value;
      try {
        common_vendor.index.showLoading({
          title: "更新中...",
          mask: true
        });
        publishButtonState.value = newState;
        const res = await sendOnApi.update(true, newState, floatButtonState.value, avatarClickState.value, commentVisibilityState.value, lotteryVisibilityState.value);
        common_vendor.index.__f__("log", "at subPages/adminManage/adminManage.vue:100", "发布按钮状态更新结果:", res);
        common_vendor.index.$emit("publishButtonChanged", newState);
        common_vendor.index.showToast({
          icon: "success",
          title: newState ? "发布按钮已开启" : "发布按钮已关闭",
          duration: 2e3
        });
      } catch (error) {
        common_vendor.index.__f__("error", "at subPages/adminManage/adminManage.vue:111", "更新发布按钮状态失败:", error);
        publishButtonState.value = !newState;
        common_vendor.index.showToast({
          icon: "error",
          title: "操作失败",
          duration: 2e3
        });
      } finally {
        common_vendor.index.hideLoading();
      }
    };
    const toggleFloatButton = async (e) => {
      e.stopPropagation();
      const newState = e.detail.value;
      try {
        common_vendor.index.showLoading({
          title: "更新中...",
          mask: true
        });
        floatButtonState.value = newState;
        const res = await sendOnApi.update(true, publishButtonState.value, newState, avatarClickState.value, commentVisibilityState.value, lotteryVisibilityState.value);
        common_vendor.index.__f__("log", "at subPages/adminManage/adminManage.vue:141", "悬浮按钮状态更新结果:", res);
        common_vendor.index.$emit("floatButtonChanged", newState);
        common_vendor.index.showToast({
          icon: "success",
          title: newState ? "悬浮按钮已开启" : "悬浮按钮已关闭",
          duration: 2e3
        });
      } catch (error) {
        common_vendor.index.__f__("error", "at subPages/adminManage/adminManage.vue:152", "更新悬浮按钮状态失败:", error);
        floatButtonState.value = !newState;
        common_vendor.index.showToast({
          icon: "error",
          title: "操作失败",
          duration: 2e3
        });
      } finally {
        common_vendor.index.hideLoading();
      }
    };
    const toggleAvatarClick = async (e) => {
      e.stopPropagation();
      const newState = e.detail.value;
      try {
        common_vendor.index.showLoading({
          title: "更新中...",
          mask: true
        });
        avatarClickState.value = newState;
        const res = await sendOnApi.update(true, publishButtonState.value, floatButtonState.value, newState, commentVisibilityState.value, lotteryVisibilityState.value);
        common_vendor.index.__f__("log", "at subPages/adminManage/adminManage.vue:182", "头像点击状态更新结果:", res);
        common_vendor.index.$emit("avatarClickChanged", newState);
        common_vendor.index.showToast({
          icon: "success",
          title: newState ? "头像点击已开启" : "头像点击已关闭",
          duration: 2e3
        });
      } catch (error) {
        common_vendor.index.__f__("error", "at subPages/adminManage/adminManage.vue:193", "更新头像点击状态失败:", error);
        avatarClickState.value = !newState;
        common_vendor.index.showToast({
          icon: "error",
          title: "操作失败",
          duration: 2e3
        });
      } finally {
        common_vendor.index.hideLoading();
      }
    };
    const toggleCommentVisibility = async (e) => {
      e.stopPropagation();
      const newState = e.detail.value;
      try {
        common_vendor.index.showLoading({
          title: "更新中...",
          mask: true
        });
        commentVisibilityState.value = newState;
        const res = await sendOnApi.update(true, publishButtonState.value, floatButtonState.value, avatarClickState.value, newState, lotteryVisibilityState.value);
        common_vendor.index.__f__("log", "at subPages/adminManage/adminManage.vue:223", "评论显示状态更新结果:", res);
        common_vendor.index.$emit("commentVisibilityChanged", newState);
        common_vendor.index.showToast({
          icon: "success",
          title: newState ? "评论功能已开启" : "评论功能已关闭",
          duration: 2e3
        });
      } catch (error) {
        common_vendor.index.__f__("error", "at subPages/adminManage/adminManage.vue:234", "更新评论显示状态失败:", error);
        commentVisibilityState.value = !newState;
        common_vendor.index.showToast({
          icon: "error",
          title: "操作失败",
          duration: 2e3
        });
      } finally {
        common_vendor.index.hideLoading();
      }
    };
    const toggleLotteryVisibility = async (e) => {
      e.stopPropagation();
      const newState = e.detail.value;
      try {
        common_vendor.index.showLoading({
          title: "更新中...",
          mask: true
        });
        lotteryVisibilityState.value = newState;
        const res = await sendOnApi.update(true, publishButtonState.value, floatButtonState.value, avatarClickState.value, commentVisibilityState.value, newState);
        common_vendor.index.__f__("log", "at subPages/adminManage/adminManage.vue:264", "抽奖模块显示状态更新结果:", res);
        common_vendor.index.$emit("lotteryVisibilityChanged", newState);
        common_vendor.index.showToast({
          icon: "success",
          title: newState ? "抽奖模块已开启" : "抽奖模块已关闭",
          duration: 2e3
        });
      } catch (error) {
        common_vendor.index.__f__("error", "at subPages/adminManage/adminManage.vue:275", "更新抽奖模块显示状态失败:", error);
        lotteryVisibilityState.value = !newState;
        common_vendor.index.showToast({
          icon: "error",
          title: "操作失败",
          duration: 2e3
        });
      } finally {
        common_vendor.index.hideLoading();
      }
    };
    const getHomeButtonState = async () => {
      try {
        const res = await indexYunApi.getIndexSettings();
        if (res.code === 0) {
          homeButtonState.value = res.showHomeButton;
          homeButtonText.value = res.homeButtonText;
          homeButtonIcon.value = res.homeButtonIcon;
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at subPages/adminManage/adminManage.vue:299", "获取首页按钮状态失败:", error);
      }
    };
    const toggleHomeButton = async (e) => {
      e.stopPropagation();
      const newState = e.detail.value;
      try {
        common_vendor.index.showLoading({
          title: "更新中...",
          mask: true
        });
        homeButtonState.value = newState;
        const res = await indexYunApi.updateIndexSettings({
          showHomeButton: newState,
          homeButtonText: homeButtonText.value,
          homeButtonIcon: homeButtonIcon.value
        });
        if (res.code === 0) {
          common_vendor.index.$emit("homeButtonChanged", newState);
          common_vendor.index.showToast({
            icon: "success",
            title: newState ? "首页按钮已开启" : "首页按钮已关闭",
            duration: 2e3
          });
        } else {
          throw new Error(res.message);
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at subPages/adminManage/adminManage.vue:337", "更新首页按钮状态失败:", error);
        homeButtonState.value = !newState;
        common_vendor.index.showToast({
          icon: "error",
          title: "操作失败",
          duration: 2e3
        });
      } finally {
        common_vendor.index.hideLoading();
      }
    };
    common_vendor.index.$on("publishButtonChanged", (newState) => {
      common_vendor.index.__f__("log", "at subPages/adminManage/adminManage.vue:353", "收到发布按钮状态变化事件:", newState);
      publishButtonState.value = newState;
    });
    common_vendor.index.$on("floatButtonChanged", (newState) => {
      common_vendor.index.__f__("log", "at subPages/adminManage/adminManage.vue:358", "收到悬浮按钮状态变化事件:", newState);
      floatButtonState.value = newState;
    });
    common_vendor.index.$on("avatarClickChanged", (newState) => {
      common_vendor.index.__f__("log", "at subPages/adminManage/adminManage.vue:363", "收到头像点击状态变化事件:", newState);
      avatarClickState.value = newState;
    });
    common_vendor.index.$on("commentVisibilityChanged", (newState) => {
      common_vendor.index.__f__("log", "at subPages/adminManage/adminManage.vue:368", "收到评论显示状态变化事件:", newState);
      commentVisibilityState.value = newState;
    });
    common_vendor.index.$on("lotteryVisibilityChanged", (newState) => {
      common_vendor.index.__f__("log", "at subPages/adminManage/adminManage.vue:373", "收到抽奖模块显示状态变化事件:", newState);
      lotteryVisibilityState.value = newState;
    });
    const openFansGroupModal = () => {
      editingFansGroupId.value = fansGroupId.value;
      showFansGroupModal.value = true;
    };
    const saveFansGroupId = async () => {
      try {
        if (!editingFansGroupId.value.trim()) {
          return common_vendor.index.showToast({
            icon: "none",
            title: "粉丝群ID不能为空"
          });
        }
        common_vendor.index.showLoading({
          title: "保存中...",
          mask: true
        });
        const oldFansGroupId2 = fansGroupId.value;
        fansGroupId.value = editingFansGroupId.value;
        const res = await sendOnApi.updateFansGroupId(
          true,
          publishButtonState.value,
          floatButtonState.value,
          avatarClickState.value,
          commentVisibilityState.value,
          lotteryVisibilityState.value,
          editingFansGroupId.value
        );
        common_vendor.index.__f__("log", "at subPages/adminManage/adminManage.vue:414", "粉丝群ID更新结果:", res);
        common_vendor.index.$emit("fansGroupIdChanged", editingFansGroupId.value);
        showFansGroupModal.value = false;
        common_vendor.index.showToast({
          icon: "success",
          title: "粉丝群ID已更新",
          duration: 2e3
        });
      } catch (error) {
        common_vendor.index.__f__("error", "at subPages/adminManage/adminManage.vue:427", "更新粉丝群ID失败:", error);
        fansGroupId.value = oldFansGroupId;
        common_vendor.index.showToast({
          icon: "error",
          title: "操作失败",
          duration: 2e3
        });
      } finally {
        common_vendor.index.hideLoading();
      }
    };
    const cancelFansGroupEdit = () => {
      showFansGroupModal.value = false;
    };
    const copyFansGroupId = () => {
      common_vendor.index.setClipboardData({
        data: fansGroupId.value,
        success: () => {
          common_vendor.index.showToast({
            title: "已复制到剪贴板"
          });
        }
      });
    };
    common_vendor.index.$on("fansGroupIdChanged", (newId) => {
      common_vendor.index.__f__("log", "at subPages/adminManage/adminManage.vue:460", "收到粉丝群ID变化事件:", newId);
      fansGroupId.value = newId;
    });
    common_vendor.onUnmounted(() => {
      common_vendor.index.$off("publishButtonChanged");
      common_vendor.index.$off("floatButtonChanged");
      common_vendor.index.$off("avatarClickChanged");
      common_vendor.index.$off("commentVisibilityChanged");
      common_vendor.index.$off("lotteryVisibilityChanged");
      common_vendor.index.$off("fansGroupIdChanged");
    });
    const data = common_vendor.ref(["分类管理", "文章管理", "用户反馈", "公司信息", "悬浮按钮控制", "发布按钮控制", "头像点击控制", "评论功能控制", "抽奖模块控制", "首页按钮控制", "粉丝群ID管理", "用户信息查询", "抽奖管理"]);
    const handleItem = (dataItem) => {
      switch (dataItem) {
        case "分类管理":
          common_vendor.index.__f__("log", "at subPages/adminManage/adminManage.vue:480", "跳转分类管理");
          common_vendor.index.navigateTo({
            url: "/subPages/cateManage/cateManage"
          });
          break;
        case "文章管理":
          common_vendor.index.__f__("log", "at subPages/adminManage/adminManage.vue:486", "跳转文章管理");
          common_vendor.index.navigateTo({
            url: "/subPages/articleManage/articleManage"
          });
          break;
        case "用户反馈":
          common_vendor.index.__f__("log", "at subPages/adminManage/adminManage.vue:492", "跳转用户反馈");
          common_vendor.index.navigateTo({
            url: "/subPages/feedManage/feedManage"
          });
          break;
        case "公司信息":
          common_vendor.index.__f__("log", "at subPages/adminManage/adminManage.vue:498", "跳转公司信息");
          common_vendor.index.navigateTo({
            url: "/subPages/companyInfo/companyInfo"
          });
          break;
        case "悬浮按钮控制":
          common_vendor.index.__f__("log", "at subPages/adminManage/adminManage.vue:504", "点击悬浮按钮控制，不执行任何操作");
          break;
        case "发布按钮控制":
          common_vendor.index.__f__("log", "at subPages/adminManage/adminManage.vue:507", "点击发布按钮控制，不执行任何操作");
          break;
        case "头像点击控制":
          common_vendor.index.__f__("log", "at subPages/adminManage/adminManage.vue:510", "点击头像点击控制，不执行任何操作");
          break;
        case "评论功能控制":
          common_vendor.index.__f__("log", "at subPages/adminManage/adminManage.vue:513", "点击评论功能控制，不执行任何操作");
          break;
        case "粉丝群ID管理":
          common_vendor.index.__f__("log", "at subPages/adminManage/adminManage.vue:516", "打开粉丝群ID管理弹窗");
          openFansGroupModal();
          break;
        case "用户信息查询":
          common_vendor.index.__f__("log", "at subPages/adminManage/adminManage.vue:520", "跳转用户信息查询");
          common_vendor.index.navigateTo({
            url: "/subPages/userInfoQuery/userInfoQuery"
          });
          break;
        case "抽奖管理":
          common_vendor.index.__f__("log", "at subPages/adminManage/adminManage.vue:526", "跳转抽奖管理");
          common_vendor.index.navigateTo({
            url: "/subPages/subChoujiang/subChoujiang"
          });
          break;
        case "首页按钮控制":
          common_vendor.index.__f__("log", "at subPages/adminManage/adminManage.vue:532", "点击首页按钮控制，不执行任何操作");
          break;
      }
    };
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.f(data.value, (item, k0, i0) => {
          return common_vendor.e({
            a: common_vendor.t(item),
            b: item === "发布按钮控制"
          }, item === "发布按钮控制" ? {
            c: publishButtonState.value,
            d: common_vendor.o(togglePublishButton),
            e: common_vendor.o(() => {
            })
          } : item === "悬浮按钮控制" ? {
            g: floatButtonState.value,
            h: common_vendor.o(toggleFloatButton),
            i: common_vendor.o(() => {
            })
          } : item === "头像点击控制" ? {
            k: avatarClickState.value,
            l: common_vendor.o(toggleAvatarClick),
            m: common_vendor.o(() => {
            })
          } : item === "评论功能控制" ? {
            o: commentVisibilityState.value,
            p: common_vendor.o(toggleCommentVisibility),
            q: common_vendor.o(() => {
            })
          } : item === "抽奖模块控制" ? {
            s: lotteryVisibilityState.value,
            t: common_vendor.o(toggleLotteryVisibility),
            v: common_vendor.o(() => {
            })
          } : item === "粉丝群ID管理" ? {
            x: common_vendor.t(fansGroupId.value.substring(0, 10)),
            y: common_vendor.o(copyFansGroupId)
          } : item === "首页按钮控制" ? {
            A: homeButtonState.value,
            B: common_vendor.o(toggleHomeButton),
            C: common_vendor.o(() => {
            })
          } : {}, {
            f: item === "悬浮按钮控制",
            j: item === "头像点击控制",
            n: item === "评论功能控制",
            r: item === "抽奖模块控制",
            w: item === "粉丝群ID管理",
            z: item === "首页按钮控制",
            D: "b5b6feed-0-" + i0,
            E: item,
            F: common_vendor.o(($event) => handleItem(item))
          });
        }),
        b: common_vendor.p({
          color: "#cccccc",
          ["custom-prefix"]: "iconfont",
          type: "icon-arrow-drop-right-line",
          size: "30"
        }),
        c: showFansGroupModal.value
      }, showFansGroupModal.value ? {
        d: common_vendor.o(cancelFansGroupEdit),
        e: common_vendor.p({
          type: "closeempty",
          size: "22",
          color: "#666"
        }),
        f: common_vendor.o(cancelFansGroupEdit),
        g: editingFansGroupId.value,
        h: common_vendor.o(($event) => editingFansGroupId.value = $event.detail.value),
        i: common_vendor.o(cancelFansGroupEdit),
        j: common_vendor.o(saveFansGroupId)
      } : {});
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-b5b6feed"]]);
tt.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-toutiao/subPages/adminManage/adminManage.js.map
