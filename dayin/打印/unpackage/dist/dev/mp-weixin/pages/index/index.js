"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_printApi = require("../../utils/printApi.js");
const common_assets = require("../../common/assets.js");
const _sfc_main = {
  data() {
    return {
      currentPrinter: null,
      stats: {
        totalPrints: 0,
        todayPrints: 0,
        successRate: 0
      },
      recentPrints: []
    };
  },
  onLoad() {
    this.loadData();
    this.checkAndAddDefaultDevice();
  },
  onShow() {
    this.loadCurrentPrinter();
  },
  methods: {
    // 加载数据
    loadData() {
      this.loadCurrentPrinter();
      this.loadStats();
      this.loadRecentPrints();
    },
    // 加载当前打印机
    loadCurrentPrinter() {
      const printer = common_vendor.index.getStorageSync("selectedPrinter");
      if (printer) {
        if (!printer.status) {
          printer.status = "online";
        }
        this.currentPrinter = printer;
      }
    },
    // 加载统计数据
    loadStats() {
      const history = common_vendor.index.getStorageSync("printHistory") || [];
      const today = (/* @__PURE__ */ new Date()).toDateString();
      this.stats.totalPrints = history.length;
      this.stats.todayPrints = history.filter((item) => {
        return new Date(item.time).toDateString() === today;
      }).length;
      const successCount = history.filter((item) => item.status === "success").length;
      this.stats.successRate = history.length > 0 ? Math.round(successCount / history.length * 100) : 0;
    },
    // 加载最近打印记录
    loadRecentPrints() {
      const history = common_vendor.index.getStorageSync("printHistory") || [];
      this.recentPrints = history.slice(0, 5).map((item) => ({
        ...item,
        typeName: this.getTypeName(item.type),
        statusText: this.getStatusText(item.status)
      }));
    },
    // 获取类型名称
    getTypeName(type) {
      const typeMap = {
        text: "文本打印",
        image: "图片打印",
        document: "文档打印",
        label: "标签打印"
      };
      return typeMap[type] || "未知";
    },
    // 获取状态文本
    getStatusText(status) {
      const statusMap = {
        success: "成功",
        failed: "失败",
        pending: "进行中"
      };
      return statusMap[status] || "未知";
    },
    // 跳转页面
    goPage(url) {
      common_vendor.index.navigateTo({ url });
    },
    // 跳转打印机列表
    goPrinterList() {
      common_vendor.index.navigateTo({
        url: "/pages/printer/printer"
      });
    },
    // 检查并添加默认设备
    async checkAndAddDefaultDevice() {
      const printers = common_vendor.index.getStorageSync("printers") || [];
      if (printers.length === 0) {
        const defaultDevice = utils_printApi.printApi.getDefaultDevice();
        const printer = {
          id: defaultDevice.id,
          name: "测试云盒 - " + defaultDevice.name,
          model: defaultDevice.model,
          password: defaultDevice.password,
          driverName: defaultDevice.driverName,
          status: "online"
        };
        printers.push(printer);
        common_vendor.index.setStorageSync("printers", printers);
        common_vendor.index.setStorageSync("selectedPrinter", printer);
        this.currentPrinter = printer;
        common_vendor.index.showToast({
          title: "已自动添加测试云盒",
          icon: "success",
          duration: 2e3
        });
      }
    },
    // 跳转连接测试页面
    goConnectionTest() {
      common_vendor.index.navigateTo({
        url: "/pages/test/test"
      });
    },
    // 测试打印
    async testPrint() {
      if (!this.currentPrinter) {
        common_vendor.index.showToast({
          title: "请先添加打印机",
          icon: "none"
        });
        return;
      }
      common_vendor.index.showLoading({
        title: "测试连接..."
      });
      try {
        common_vendor.index.__f__("log", "at pages/index/index.vue:249", "🧪 测试external_api连接...");
        const printerListResult = await utils_printApi.printApi.getDevicePrinterList(
          this.currentPrinter.id,
          this.currentPrinter.password
        );
        common_vendor.index.__f__("log", "at pages/index/index.vue:257", "✅ external_api可用！打印机列表:", printerListResult);
        common_vendor.index.hideLoading();
        let printerNames = "";
        if (printerListResult.data && Array.isArray(printerListResult.data) && printerListResult.data.length > 0) {
          printerNames = "\n\n可用打印机:\n" + printerListResult.data.map((p) => `- ${p.name || p.printerName}`).join("\n");
        }
        common_vendor.index.showModal({
          title: "✅ 连接测试成功",
          content: `设备连接正常！${printerNames}

提示：V3 API暂时不可用(503错误)，建议联系技术支持开通V3权限或使用旧版API。`,
          confirmText: "继续测试V3",
          cancelText: "关闭",
          success: async (modalRes) => {
            if (modalRes.confirm) {
              this.testV3Print();
            }
          }
        });
      } catch (error) {
        common_vendor.index.hideLoading();
        common_vendor.index.__f__("error", "at pages/index/index.vue:282", "❌ external_api测试失败:", error);
        common_vendor.index.showModal({
          title: "❌ 连接测试失败",
          content: `无法连接到打印服务

错误: ${error.message || error.msg || "网络请求失败"}

请检查:
1. 设备ID和密码是否正确
2. 网络连接是否正常
3. 链科云服务是否可用`,
          showCancel: false
        });
      }
    },
    // 测试V3 API打印
    async testV3Print() {
      var _a, _b, _c, _d;
      common_vendor.index.showLoading({
        title: "正在打印..."
      });
      try {
        const result = await utils_printApi.printApi.submitPrintTask({
          deviceId: this.currentPrinter.id,
          devicePassword: this.currentPrinter.password,
          printerName: this.currentPrinter.model || this.currentPrinter.name,
          driverName: this.currentPrinter.driverName || this.currentPrinter.model,
          jobFileUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
          dmPaperSize: 9,
          // A4
          dmOrientation: 1,
          // 竖向
          dmColor: 1,
          // 黑白
          dmDuplex: 1,
          // 关闭双面
          dmCopies: 1,
          // 1份
          isPreview: 1
          // 生成预览图
        });
        let history = common_vendor.index.getStorageSync("printHistory") || [];
        history.unshift({
          id: ((_a = result.data) == null ? void 0 : _a.task_id) || ((_b = result.data) == null ? void 0 : _b.jobId) || Date.now(),
          type: "document",
          printer: this.currentPrinter.name,
          time: (/* @__PURE__ */ new Date()).toISOString(),
          status: "pending"
        });
        common_vendor.index.setStorageSync("printHistory", history);
        common_vendor.index.hideLoading();
        const taskId = ((_c = result.data) == null ? void 0 : _c.task_id) || ((_d = result.data) == null ? void 0 : _d.jobId);
        if (taskId) {
          common_vendor.index.showModal({
            title: "✅ 测试打印已提交",
            content: `任务ID: ${taskId}

可在历史记录或测试页面查询任务状态`,
            confirmText: "去测试页面",
            cancelText: "关闭",
            success: (modalRes) => {
              if (modalRes.confirm) {
                common_vendor.index.navigateTo({
                  url: "/pages/test/test"
                });
              }
            }
          });
        } else {
          common_vendor.index.showToast({
            title: "测试打印成功",
            icon: "success"
          });
        }
        this.loadStats();
        this.loadRecentPrints();
      } catch (error) {
        common_vendor.index.hideLoading();
        common_vendor.index.__f__("error", "at pages/index/index.vue:357", "❌ V3 API测试打印失败:", error);
        const is503 = error.message && error.message.includes("503");
        common_vendor.index.showModal({
          title: "❌ V3 API不可用",
          content: is503 ? "V3 API返回503错误，服务暂时不可用。\n\n建议:\n1. 联系技术支持确认V3权限\n2. 暂时使用管理后台打印\n\n要打开管理后台吗？" : `错误: ${error.message || error.msg || "未知错误"}

请联系技术支持`,
          confirmText: "打开后台",
          cancelText: "关闭",
          success: (modalRes) => {
            if (modalRes.confirm) {
              const url = utils_printApi.printApi.getPrintManageUrl();
              common_vendor.index.__f__("log", "at pages/index/index.vue:373", "管理后台URL:", url);
              common_vendor.index.showModal({
                title: "管理后台地址",
                content: url,
                confirmText: "复制",
                success: (res) => {
                  if (res.confirm) {
                    common_vendor.index.setClipboardData({
                      data: url,
                      success: () => {
                        common_vendor.index.showToast({
                          title: "已复制到剪贴板",
                          icon: "success"
                        });
                      }
                    });
                  }
                }
              });
            }
          }
        });
      }
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: common_assets._imports_0,
    b: $data.currentPrinter
  }, $data.currentPrinter ? {
    c: common_vendor.t($data.currentPrinter.name),
    d: common_vendor.t($data.currentPrinter.status === "online" ? "在线" : "离线"),
    e: common_vendor.n($data.currentPrinter.status === "online" ? "online" : "offline")
  } : {}, {
    f: common_vendor.o((...args) => $options.goPrinterList && $options.goPrinterList(...args)),
    g: common_vendor.o(($event) => $options.goPage("/pages/print/print?type=text")),
    h: common_vendor.o(($event) => $options.goPage("/pages/print/print?type=image")),
    i: common_vendor.o(($event) => $options.goPage("/pages/print/print?type=document")),
    j: common_vendor.o(($event) => $options.goPage("/pages/print/print?type=label")),
    k: common_vendor.t($data.stats.totalPrints),
    l: common_vendor.t($data.stats.todayPrints),
    m: common_vendor.t($data.stats.successRate),
    n: common_vendor.o(($event) => $options.goPage("/pages/history/history")),
    o: common_vendor.f($data.recentPrints, (item, index, i0) => {
      return {
        a: common_vendor.t(item.typeName),
        b: common_vendor.t(item.time),
        c: common_vendor.t(item.statusText),
        d: common_vendor.n(item.status),
        e: index
      };
    }),
    p: $data.recentPrints.length === 0
  }, $data.recentPrints.length === 0 ? {} : {}, {
    q: $data.currentPrinter
  }, $data.currentPrinter ? {
    r: common_vendor.o((...args) => $options.goConnectionTest && $options.goConnectionTest(...args)),
    s: common_vendor.o((...args) => $options.testPrint && $options.testPrint(...args))
  } : {});
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-1cf27b2a"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/index/index.js.map
