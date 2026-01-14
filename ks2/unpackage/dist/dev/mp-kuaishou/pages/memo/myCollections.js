"use strict";
const common_vendor = require("../../common/vendor.js");
const store_user = require("../../store/user.js");
const _sfc_main = {
  data() {
    return {
      collections: [],
      loading: false,
      noMore: false,
      userRole: ""
      // 'admin' 或 'sharer'
    };
  },
  computed: {
    // 按分享者分组的数据（三级结构：分享者 → 添加者 → 条目）
    groupedCollections() {
      const grouped = {};
      this.collections.forEach((item) => {
        var _a, _b, _c;
        const shareUserId = item.share_user_id || "direct_add";
        const shareUserNickname = item.share_user_nickname || "直接添加";
        if (!grouped[shareUserId]) {
          grouped[shareUserId] = {
            userInfo: {
              nickName: shareUserNickname,
              avatarUrl: ""
              // 分享者暂无头像信息
            },
            collectors: {}
            // 二级分组：添加者
          };
        }
        const collectorId = item.user_id || "unknown";
        const collectorNickname = ((_a = item.user_info) == null ? void 0 : _a.nickName) || "未知用户";
        const collectorAvatar = ((_b = item.user_info) == null ? void 0 : _b.avatarUrl) || "";
        const collectorPhone = ((_c = item.user_info) == null ? void 0 : _c.mobile) || "";
        if (!grouped[shareUserId].collectors[collectorId]) {
          grouped[shareUserId].collectors[collectorId] = {
            collectorInfo: {
              nickName: collectorNickname,
              avatarUrl: collectorAvatar,
              phone: collectorPhone
              // 保存手机号
            },
            items: []
            // 三级：具体条目
          };
        }
        grouped[shareUserId].collectors[collectorId].items.push(item);
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
    // 加载添加列表
    async loadCollections() {
      console.log("=== 加载添加列表 ===");
      const userStore = store_user.useUserInfoStore();
      const isAdmin = userStore.userInfo.role && userStore.userInfo.role[0] === "admin";
      const userId = userStore.userInfo.uid;
      this.userRole = isAdmin ? "admin" : "sharer";
      if (!userId) {
        console.log("用户未登录");
        common_vendor.index.showToast({
          title: "请先登录",
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
        let res;
        if (isAdmin) {
          console.log("管理员模式：获取所有收藏记录");
          res = await memoApi.getAllCollections();
        } else {
          console.log("分享者模式：获取我分享的用户的收藏记录");
          res = await memoApi.getSharerCollections(userId);
        }
        console.log("添加列表结果:", res);
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
      console.log("=== 取消添加 ===", item);
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
    },
    // 拨打电话
    makePhoneCall(phoneNumber) {
      if (!phoneNumber) {
        common_vendor.index.showToast({
          title: "手机号不可用",
          icon: "none"
        });
        return;
      }
      common_vendor.index.makePhoneCall({
        phoneNumber,
        fail: (err) => {
          console.error("拨打电话失败:", err);
          common_vendor.index.showToast({
            title: "拨打失败",
            icon: "none"
          });
        }
      });
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: $data.userRole
  }, $data.userRole ? {
    b: common_vendor.t($data.userRole === "admin" ? "👑" : "🔗"),
    c: common_vendor.t($data.userRole === "admin" ? "管理员模式：查看所有用户的收藏信息" : "分享者模式：查看通过你分享进入的用户收藏信息"),
    d: $data.userRole === "admin" ? 1 : "",
    e: $data.userRole === "sharer" ? 1 : ""
  } : {}, {
    f: !$data.loading && $data.collections.length === 0
  }, !$data.loading && $data.collections.length === 0 ? {
    g: common_vendor.t($data.userRole === "admin" ? "还没有用户添加备忘录~" : "还没有用户通过你的分享添加备忘录~")
  } : common_vendor.e({
    h: common_vendor.f($options.groupedCollections, (shareGroup, shareUserId, i0) => {
      return {
        a: common_vendor.t(shareGroup.userInfo.nickName),
        b: common_vendor.t(Object.keys(shareGroup.collectors).length),
        c: common_vendor.f(shareGroup.collectors, (collectorGroup, collectorId, i1) => {
          return common_vendor.e({
            a: collectorGroup.collectorInfo.avatarUrl
          }, collectorGroup.collectorInfo.avatarUrl ? {
            b: collectorGroup.collectorInfo.avatarUrl
          } : {}, {
            c: common_vendor.t(collectorGroup.collectorInfo.nickName),
            d: common_vendor.t(collectorGroup.items.length),
            e: collectorGroup.collectorInfo.phone
          }, collectorGroup.collectorInfo.phone ? {
            f: common_vendor.t(collectorGroup.collectorInfo.phone),
            g: common_vendor.o(($event) => $options.makePhoneCall(collectorGroup.collectorInfo.phone))
          } : {}, {
            h: common_vendor.f(collectorGroup.items, (item, k2, i2) => {
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
                g: common_vendor.t($options.formatTime(item.collection_time)),
                h: common_vendor.o(($event) => $options.cancelCollection(item)),
                i: item._id
              });
            }),
            i: collectorId
          });
        }),
        d: shareUserId
      };
    }),
    i: $data.loading
  }, $data.loading ? {} : {}), {
    j: common_vendor.gei(_ctx, "")
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-b16fd458"]]);
ks.createPage(MiniProgramPage);
