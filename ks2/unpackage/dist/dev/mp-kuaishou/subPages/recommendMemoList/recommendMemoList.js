"use strict";
const common_vendor = require("../../common/vendor.js");
const store_user = require("../../store/user.js");
const _sfc_main = {
  data() {
    return {
      memoList: [],
      collectedMap: {},
      loading: true,
      shareUserId: "",
      shareUserNickname: "",
      pendingCollectMemo: null,
      // 待收藏的备忘录
      statusBarHeight: 0,
      // 状态栏高度
      navBarHeight: 44
      // 导航栏内容高度
    };
  },
  onLoad(options) {
    console.log("=== 推荐备忘录管理页面加载 ===");
    const systemInfo = common_vendor.index.getSystemInfoSync();
    this.statusBarHeight = systemInfo.statusBarHeight || 0;
    if (options && options.shareUserId) {
      this.shareUserId = options.shareUserId;
      this.shareUserNickname = options.shareUserNickname || "";
    } else {
      try {
        const shareUserInfo = common_vendor.index.getStorageSync("memo_share_user");
        if (shareUserInfo) {
          this.shareUserId = shareUserInfo.id || "";
          this.shareUserNickname = shareUserInfo.nickname || "";
        }
      } catch (e) {
        console.error("获取本地分享用户信息失败:", e);
      }
    }
    this.loadRecommendMemos();
  },
  onShow() {
    console.log("=== 页面显示 onShow ===");
    if (this.pendingCollectMemo) {
      console.log("检测到待收藏的备忘录，尝试自动收藏");
      const memo = this.pendingCollectMemo;
      this.pendingCollectMemo = null;
      setTimeout(() => {
        this.toggleCollect(memo);
      }, 500);
    }
  },
  onPullDownRefresh() {
    this.loadRecommendMemos().then(() => {
      common_vendor.index.stopPullDownRefresh();
    });
  },
  // 分享配置
  onShareAppMessage(options) {
    console.log("=== 触发分享 ===");
    const userStore = store_user.useUserInfoStore();
    const userId = userStore.userInfo.uid || "";
    const userNickname = userStore.userInfo.nickName || "用户";
    return {
      title: `${userNickname}分享了系统推荐备忘录`,
      path: `/subPages/recommendMemoList/recommendMemoList?shareUserId=${userId}&shareUserNickname=${encodeURIComponent(userNickname)}`,
      imageUrl: ""
      // 可选：自定义分享图片
    };
  },
  methods: {
    // 更多操作
    handleMore() {
      common_vendor.index.showActionSheet({
        itemList: ["分享", "刷新"],
        success: (res) => {
          if (res.tapIndex === 0) {
            common_vendor.index.showShareMenu();
          } else if (res.tapIndex === 1) {
            this.loadRecommendMemos();
          }
        }
      });
    },
    // 关闭页面
    handleClose() {
      common_vendor.index.navigateBack({
        delta: 1
      });
    },
    // 加载推荐备忘录列表
    async loadRecommendMemos() {
      console.log("=== 加载推荐备忘录列表 ===");
      this.loading = true;
      try {
        const memoApi = common_vendor.tr.importObject("memoList", { customUI: true });
        const res = await memoApi.getDefaultMemos();
        if (res && res.code === 0) {
          this.memoList = res.data || [];
          console.log("加载推荐备忘录成功:", this.memoList.length, "条");
          await this.loadCollectionStatus();
        } else {
          console.log("加载推荐备忘录失败:", res == null ? void 0 : res.message);
          this.memoList = [];
          common_vendor.index.showToast({
            title: (res == null ? void 0 : res.message) || "加载失败",
            icon: "none"
          });
        }
      } catch (e) {
        console.error("加载推荐备忘录失败:", e);
        this.memoList = [];
        common_vendor.index.showToast({
          title: "加载失败，请重试",
          icon: "none"
        });
      } finally {
        this.loading = false;
      }
    },
    // 加载收藏状态
    async loadCollectionStatus() {
      console.log("=== 加载收藏状态 ===");
      try {
        const userStore = store_user.useUserInfoStore();
        const userId = userStore.userInfo.uid;
        if (!userId) {
          console.log("用户未登录，跳过加载收藏状态");
          return;
        }
        const memoApi = common_vendor.tr.importObject("memoList", { customUI: true });
        for (const memo of this.memoList) {
          try {
            const res = await memoApi.checkCollected(memo._id, userId);
            if (res && res.code === 0) {
              this.collectedMap[memo._id] = res.data.collected;
            }
          } catch (e) {
            console.error("检查收藏状态失败:", e);
          }
        }
        console.log("收藏状态加载完成:", this.collectedMap);
      } catch (e) {
        console.error("加载收藏状态失败:", e);
      }
    },
    // 切换收藏状态
    async toggleCollect(memo) {
      console.log("=== 切换收藏状态 ===", memo._id);
      const userStore = store_user.useUserInfoStore();
      const isLogin = userStore.userInfo.isLogin;
      const userId = userStore.userInfo.uid;
      if (!isLogin || !userId) {
        console.log("用户未登录，唤起登录");
        this.pendingCollectMemo = memo;
        common_vendor.index.showModal({
          title: "提示",
          content: "添加功能需要登录，是否前往登录？",
          success: (res) => {
            if (res.confirm) {
              const currentPath = "/subPages/recommendMemoList/recommendMemoList";
              common_vendor.index.navigateTo({
                url: "/pages/login/login?redirect=" + encodeURIComponent(currentPath),
                fail: () => {
                  common_vendor.index.reLaunch({
                    url: "/pages/login/login?redirect=" + encodeURIComponent(currentPath)
                  });
                }
              });
            } else {
              this.pendingCollectMemo = null;
            }
          }
        });
        return;
      }
      try {
        const memoApi = common_vendor.tr.importObject("memoList", { customUI: true });
        if (this.collectedMap[memo._id]) {
          console.log("执行取消收藏操作...");
          const res = await memoApi.uncollectMemo(memo._id, userId);
          if (res && res.code === 0) {
            this.collectedMap[memo._id] = false;
            this.$forceUpdate();
            common_vendor.index.showToast({
              title: "已取消添加",
              icon: "success",
              duration: 1500
            });
          } else {
            common_vendor.index.showToast({
              title: (res == null ? void 0 : res.message) || "取消添加失败",
              icon: "none"
            });
          }
        } else {
          console.log("执行收藏操作...");
          const res = await memoApi.collectMemo({
            memo_id: memo._id,
            user_id: userId,
            share_user_id: this.shareUserId,
            share_user_nickname: this.shareUserNickname
          });
          if (res && res.code === 0) {
            this.collectedMap[memo._id] = true;
            this.$forceUpdate();
            common_vendor.index.showToast({
              title: "添加成功",
              icon: "success",
              duration: 1500
            });
          } else {
            common_vendor.index.showToast({
              title: (res == null ? void 0 : res.message) || "添加失败",
              icon: "none"
            });
          }
        }
      } catch (e) {
        console.error("收藏操作失败:", e);
        const errorMsg = e.message || e.errMsg || "操作失败，请重试";
        common_vendor.index.showToast({
          title: errorMsg,
          icon: "none"
        });
      }
    },
    // 格式化时间
    formatTime(timestamp) {
      if (!timestamp)
        return "";
      const date = new Date(timestamp);
      const now = /* @__PURE__ */ new Date();
      const diff = now - date;
      if (diff < 6e4) {
        return "刚刚";
      } else if (diff < 36e5) {
        return Math.floor(diff / 6e4) + "分钟前";
      } else if (diff < 864e5) {
        return Math.floor(diff / 36e5) + "小时前";
      } else if (diff < 1728e5) {
        return "昨天";
      } else {
        return `${date.getMonth() + 1}-${date.getDate()}`;
      }
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: common_vendor.t($data.memoList.length),
    b: $data.loading
  }, $data.loading ? {} : $data.memoList.length === 0 ? {} : {
    d: common_vendor.f($data.memoList, (memo, index, i0) => {
      return common_vendor.e({
        a: memo.image_url
      }, memo.image_url ? {
        b: memo.image_url
      } : {}, {
        c: memo.title
      }, memo.title ? {
        d: common_vendor.t(memo.title)
      } : {}, {
        e: common_vendor.t(memo.content),
        f: common_vendor.t($options.formatTime(memo.create_time)),
        g: common_vendor.t($data.collectedMap[memo._id] ? "已添加" : "添加"),
        h: $data.collectedMap[memo._id] ? 1 : "",
        i: common_vendor.o(($event) => $options.toggleCollect(memo)),
        j: memo._id
      });
    })
  }, {
    c: $data.memoList.length === 0,
    e: common_vendor.gei(_ctx, "")
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-570c4fc2"]]);
_sfc_main.__runtimeHooks = 2;
ks.createPage(MiniProgramPage);
