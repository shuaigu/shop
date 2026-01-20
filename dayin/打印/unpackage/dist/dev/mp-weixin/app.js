"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const common_vendor = require("./common/vendor.js");
if (!Math) {
  "./pages/index/index.js";
  "./pages/test/test.js";
  "./pages/print/print.js";
  "./pages/printer/printer.js";
  "./pages/history/history.js";
}
const _sfc_main = {
  globalData: {
    // 链科云打印配置
    printConfig: {
      clientId: "dimA9V2fbB556AFMYaK8t",
      clientSecret: ""
      // 请填入你的密钥
    },
    // 当前选中的打印机
    selectedPrinter: null
  },
  onLaunch: function() {
    common_vendor.index.__f__("log", "at App.vue:13", "App Launch");
    this.loadPrinters();
  },
  onShow: function() {
    common_vendor.index.__f__("log", "at App.vue:18", "App Show");
  },
  onHide: function() {
    common_vendor.index.__f__("log", "at App.vue:21", "App Hide");
  },
  methods: {
    // 加载打印机列表
    loadPrinters() {
      const printers = common_vendor.index.getStorageSync("printers");
      if (printers) {
        this.globalData.selectedPrinter = printers[0] || null;
      }
    }
  }
};
function createApp() {
  const app = common_vendor.createSSRApp(_sfc_main);
  return {
    app
  };
}
createApp().app.mount("#app");
exports.createApp = createApp;
//# sourceMappingURL=../.sourcemap/mp-weixin/app.js.map
