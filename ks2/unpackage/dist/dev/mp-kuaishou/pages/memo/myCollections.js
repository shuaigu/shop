"use strict";
const common_vendor = require("../../common/vendor.js");
const store_user = require("../../store/user.js");
const _sfc_main = {
  data() {
    return {
      collections: [],
      loading: false,
      noMore: false,
      tabs: ["全部", "按分享者分类"],
      currentTab: 0
    };
  },
  computed: {
    // 按分享者分组的数据
    groupedCollections() {
      const grouped = {};
      this.collections.forEach((item) => {
        const shareUserId = item.share_user_id || "direct_add";
        const shareUserNickname = item.share_user_nickname || "直接添加";
        if (!grouped[shareUserId]) {
          grouped[shareUserId] = {
            userInfo: {
              nickName: shareUserNickname,
              avatarUrl: ""
              // 分享者暂无头像信息
            },
            items: []
          };
        }
        grouped[shareUserId].items.push(item);
      });
      return grouped;
    }
  },
  onLoad() {
    this.loadCollections();
  },
  // 下拉刷新
  onPullDownRefresh() {
    this.collections = [];
    this.noMore = false;
    this.loadCollections().then(() => {
      common_vendor.index.stopPullDownRefresh();
    });
  },
  // 页面显示时保持标签状态
  onShow() {
  },
  methods: {
    // 切换标签
    switchTab(index) {
      this.currentTab = index;
    },
    // 加载添加列表
    async loadCollections() {
      console.log("=== 管理员加载所有添加列表 ===");
      const userStore = store_user.useUserInfoStore();
      const isAdmin = userStore.userInfo.role && userStore.userInfo.role[0] === "admin";
      if (!isAdmin) {
        console.log("非管理员用户");
        common_vendor.index.showToast({
          title: "无权限访问",
          icon: "none",
          duration: 2e3
        });
        setTimeout(() => {
          common_vendor.index.switchTab({
            url: "/pages/memo/memo"
          });
        }, 2e3);
        return;
      }
      this.loading = true;
      try {
        const memoApi = common_vendor.tr.importObject("memoList", { customUI: true });
        const res = await memoApi.getAllCollections();
        console.log("所有添加列表结果:", res);
        if (res && res.code === 0) {
          this.collections = res.data || [];
          this.noMore = true;
          console.log("加载成功，共", this.collections.length, "条添加记录");
        } else {
          common_vendor.index.showToast({
            title: (res == null ? void 0 : res.message) || "获取添加列表失败",
            icon: "none"
          });
        }
      } catch (e) {
        console.error("加载添加列表失败:", e);
        common_vendor.index.showToast({
          title: "加载失败，请重试",
          icon: "none"
        });
      } finally {
        this.loading = false;
      }
    },
    // 取消添加
    async cancelCollection(item) {
      console.log("=== 管理员取消添加 ===", item);
      const confirmRes = await new Promise((resolve) => {
        var _a;
        common_vendor.index.showModal({
          title: "提示",
          content: `确定要删除用户“${((_a = item.user_info) == null ? void 0 : _a.nickName) || "未知用户"}”的添加吗？`,
          success: (res) => resolve(res.confirm)
        });
      });
      if (!confirmRes)
        return;
      try {
        const memoApi = common_vendor.tr.importObject("memoList", { customUI: true });
        const res = await memoApi.uncollectMemo(item.memo_id, item.user_id);
        if (res && res.code === 0) {
          const index = this.collections.findIndex((c) => c._id === item._id);
          if (index !== -1) {
            this.collections.splice(index, 1);
          }
          common_vendor.index.showToast({
            title: "已删除添加记录",
            icon: "success",
            duration: 1500
          });
        } else {
          common_vendor.index.showToast({
            title: (res == null ? void 0 : res.message) || "删除失败",
            icon: "none"
          });
        }
      } catch (e) {
        console.error("删除添加失败:", e);
        common_vendor.index.showToast({
          title: "操作失败，请重试",
          icon: "none"
        });
      }
    },
    // 加载更多（预留）
    loadMore() {
      if (this.loading || this.noMore)
        return;
    },
    // 跳转到备忘录页面
    goToMemo() {
      common_vendor.index.switchTab({
        url: "/pages/memo/memo"
      });
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
      }
      if (diff < 36e5) {
        return Math.floor(diff / 6e4) + "分钟前";
      }
      if (diff < 864e5) {
        return Math.floor(diff / 36e5) + "小时前";
      }
      if (diff < 1728e5) {
        return "昨天 " + date.getHours() + ":" + String(date.getMinutes()).padStart(2, "0");
      }
      return `${date.getMonth() + 1}-${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, "0")}`;
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: common_vendor.f($data.tabs, (tab, index, i0) => {
      return common_vendor.e({
        a: common_vendor.t(tab),
        b: $data.currentTab === index
      }, $data.currentTab === index ? {} : {}, {
        c: index,
        d: common_vendor.n({
          active: $data.currentTab === index
        }),
        e: common_vendor.o(($event) => $options.switchTab(index))
      });
    }),
    b: !$data.loading && $data.collections.length === 0
  }, !$data.loading && $data.collections.length === 0 ? {} : $data.currentTab === 0 ? common_vendor.e({
    d: common_vendor.f($data.collections, (item, k0, i0) => {
      return common_vendor.e({
        a: item.memo_info && item.memo_info.image_url
      }, item.memo_info && item.memo_info.image_url ? {
        b: item.memo_info.image_url
      } : {}, {
        c: item.user_info && item.user_info.avatarUrl
      }, item.user_info && item.user_info.avatarUrl ? {
        d: item.user_info.avatarUrl
      } : {}, {
        e: common_vendor.t(item.user_info ? item.user_info.nickName : "未知用户"),
        f: item.memo_info && item.memo_info.title
      }, item.memo_info && item.memo_info.title ? {
        g: common_vendor.t(item.memo_info.title)
      } : {}, {
        h: item.memo_info
      }, item.memo_info ? {
        i: common_vendor.t(item.memo_info.content)
      } : {}, {
        j: item.share_user_nickname
      }, item.share_user_nickname ? {
        k: common_vendor.t(item.share_user_nickname)
      } : {}, {
        l: common_vendor.t($options.formatTime(item.collection_time)),
        m: common_vendor.o(($event) => $options.cancelCollection(item)),
        n: item._id
      });
    }),
    e: $data.loading
  }, $data.loading ? {} : {}, {
    f: !$data.loading && $data.noMore && $data.collections.length > 0
  }, !$data.loading && $data.noMore && $data.collections.length > 0 ? {} : {}, {
    g: common_vendor.o((...args) => $options.loadMore && $options.loadMore(...args))
  }) : $data.currentTab === 1 ? common_vendor.e({
    i: common_vendor.f($options.groupedCollections, (userGroup, userId, i0) => {
      return {
        a: common_vendor.t(userGroup.userInfo.nickName),
        b: common_vendor.t(userGroup.items.length),
        c: common_vendor.f(userGroup.items, (item, k1, i1) => {
          return common_vendor.e({
            a: item.memo_info && item.memo_info.image_url
          }, item.memo_info && item.memo_info.image_url ? {
            b: item.memo_info.image_url
          } : {}, {
            c: item.memo_info && item.memo_info.title
          }, item.memo_info && item.memo_info.title ? {
            d: common_vendor.t(item.memo_info.title)
          } : {}, {
            e: item.memo_info
          }, item.memo_info ? {
            f: common_vendor.t(item.memo_info.content)
          } : {}, {
            g: item.user_info && item.user_info.avatarUrl
          }, item.user_info && item.user_info.avatarUrl ? {
            h: item.user_info.avatarUrl
          } : {}, {
            i: common_vendor.t(item.user_info ? item.user_info.nickName : "未知"),
            j: common_vendor.t($options.formatTime(item.collection_time)),
            k: common_vendor.o(($event) => $options.cancelCollection(item)),
            l: item._id
          });
        }),
        d: userId
      };
    }),
    j: $data.loading
  }, $data.loading ? {} : {}) : {}, {
    c: $data.currentTab === 0,
    h: $data.currentTab === 1,
    k: common_vendor.gei(_ctx, "")
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-b16fd458"]]);
ks.createPage(MiniProgramPage);
