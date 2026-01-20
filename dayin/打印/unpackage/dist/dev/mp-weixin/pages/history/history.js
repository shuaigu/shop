"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  data() {
    return {
      historyList: [],
      filteredHistory: [],
      currentStatus: { label: "全部状态", value: "all" },
      currentType: { label: "全部类型", value: "all" },
      statusFilters: [
        { label: "全部状态", value: "all" },
        { label: "成功", value: "success" },
        { label: "失败", value: "failed" },
        { label: "进行中", value: "pending" }
      ],
      typeFilters: [
        { label: "全部类型", value: "all" },
        { label: "文本打印", value: "text" },
        { label: "图片打印", value: "image" },
        { label: "文档打印", value: "document" },
        { label: "标签打印", value: "label" }
      ],
      currentPage: 1,
      pageSize: 20,
      hasMore: false,
      showDetailDialog: false,
      currentDetail: {}
    };
  },
  onLoad() {
    this.loadHistory();
  },
  onShow() {
    this.loadHistory();
  },
  methods: {
    // 加载历史记录
    loadHistory() {
      const history = common_vendor.index.getStorageSync("printHistory") || [];
      this.historyList = history;
      this.filterHistory();
    },
    // 筛选历史记录
    filterHistory() {
      let filtered = this.historyList;
      if (this.currentStatus.value !== "all") {
        filtered = filtered.filter((item) => item.status === this.currentStatus.value);
      }
      if (this.currentType.value !== "all") {
        filtered = filtered.filter((item) => item.type === this.currentType.value);
      }
      const start = 0;
      const end = this.currentPage * this.pageSize;
      this.filteredHistory = filtered.slice(start, end);
      this.hasMore = filtered.length > end;
    },
    // 状态变化
    statusChange(e) {
      this.currentStatus = this.statusFilters[e.detail.value];
      this.currentPage = 1;
      this.filterHistory();
    },
    // 类型变化
    typeChange(e) {
      this.currentType = this.typeFilters[e.detail.value];
      this.currentPage = 1;
      this.filterHistory();
    },
    // 加载更多
    loadMore() {
      this.currentPage++;
      this.filterHistory();
    },
    // 显示详情
    showDetail(item) {
      this.currentDetail = item;
      this.showDetailDialog = true;
    },
    // 关闭详情
    closeDetail() {
      this.showDetailDialog = false;
    },
    // 重新打印
    reprintJob() {
      common_vendor.index.showModal({
        title: "提示",
        content: "确定要重新打印吗？",
        success: (res) => {
          if (res.confirm) {
            common_vendor.index.navigateTo({
              url: "/pages/print/print?type=" + this.currentDetail.type
            });
            this.closeDetail();
          }
        }
      });
    },
    // 获取类型图标
    getTypeIcon(type) {
      const iconMap = {
        text: "📄",
        image: "🖼️",
        document: "📋",
        label: "🏷️"
      };
      return iconMap[type] || "📄";
    },
    // 获取类型名称
    getTypeName(type) {
      const nameMap = {
        text: "文本打印",
        image: "图片打印",
        document: "文档打印",
        label: "标签打印"
      };
      return nameMap[type] || "未知";
    },
    // 获取状态文本
    getStatusText(status) {
      const textMap = {
        success: "成功",
        failed: "失败",
        pending: "进行中"
      };
      return textMap[status] || "未知";
    },
    // 格式化时间
    formatTime(time) {
      const date = new Date(time);
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
      if (diff < 6048e5) {
        return Math.floor(diff / 864e5) + "天前";
      }
      const month = date.getMonth() + 1;
      const day = date.getDate();
      return `${month}月${day}日`;
    },
    // 格式化完整时间
    formatFullTime(time) {
      const date = new Date(time);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const hour = String(date.getHours()).padStart(2, "0");
      const minute = String(date.getMinutes()).padStart(2, "0");
      const second = String(date.getSeconds()).padStart(2, "0");
      return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: common_vendor.t($data.currentStatus.label),
    b: $data.statusFilters,
    c: common_vendor.o((...args) => $options.statusChange && $options.statusChange(...args)),
    d: common_vendor.t($data.currentType.label),
    e: $data.typeFilters,
    f: common_vendor.o((...args) => $options.typeChange && $options.typeChange(...args)),
    g: common_vendor.f($data.filteredHistory, (item, index, i0) => {
      return {
        a: common_vendor.t($options.getTypeIcon(item.type)),
        b: common_vendor.t($options.getTypeName(item.type)),
        c: common_vendor.t(item.printer),
        d: common_vendor.t($options.formatTime(item.time)),
        e: common_vendor.t($options.getStatusText(item.status)),
        f: common_vendor.n(item.status),
        g: index,
        h: common_vendor.o(($event) => $options.showDetail(item), index)
      };
    }),
    h: $data.filteredHistory.length === 0
  }, $data.filteredHistory.length === 0 ? {} : {}, {
    i: $data.hasMore
  }, $data.hasMore ? {
    j: common_vendor.o((...args) => $options.loadMore && $options.loadMore(...args))
  } : {}, {
    k: $data.showDetailDialog
  }, $data.showDetailDialog ? common_vendor.e({
    l: common_vendor.t($data.currentDetail.id),
    m: common_vendor.t($options.getTypeName($data.currentDetail.type)),
    n: common_vendor.t($data.currentDetail.printer),
    o: common_vendor.t($options.formatFullTime($data.currentDetail.time)),
    p: common_vendor.t($options.getStatusText($data.currentDetail.status)),
    q: common_vendor.n("status-" + $data.currentDetail.status),
    r: common_vendor.o((...args) => $options.closeDetail && $options.closeDetail(...args)),
    s: $data.currentDetail.status === "failed"
  }, $data.currentDetail.status === "failed" ? {
    t: common_vendor.o((...args) => $options.reprintJob && $options.reprintJob(...args))
  } : {}, {
    v: common_vendor.o(() => {
    }),
    w: common_vendor.o((...args) => $options.closeDetail && $options.closeDetail(...args))
  }) : {});
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-b2d018fa"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/history/history.js.map
