"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_printApi = require("../../utils/printApi.js");
const _sfc_main = {
  data() {
    return {
      printerList: [],
      selectedPrinter: null,
      showDialog: false,
      newPrinter: {
        name: "",
        model: "",
        id: "",
        password: "",
        driverName: ""
      }
    };
  },
  onLoad() {
    this.loadPrinters();
  },
  onShow() {
    this.loadPrinters();
  },
  methods: {
    // 加载打印机列表
    loadPrinters() {
      const printers = common_vendor.index.getStorageSync("printers") || [];
      this.printerList = printers;
      this.selectedPrinter = common_vendor.index.getStorageSync("selectedPrinter");
      this.refreshPrinterStatus();
    },
    // 刷新打印机状态
    async refreshPrinterStatus() {
      for (let printer of this.printerList) {
        try {
          const result = await utils_printApi.printApi.getPrinterStatus(printer.id);
          printer.status = result.data.status;
        } catch (error) {
          printer.status = "online";
        }
      }
      common_vendor.index.setStorageSync("printers", this.printerList);
      if (this.selectedPrinter) {
        const currentPrinter = this.printerList.find((p) => p.id === this.selectedPrinter.id);
        if (currentPrinter) {
          this.selectedPrinter.status = currentPrinter.status;
          common_vendor.index.setStorageSync("selectedPrinter", this.selectedPrinter);
        }
      }
    },
    // 选择打印机
    selectPrinter(printer) {
      this.selectedPrinter = printer;
      common_vendor.index.setStorageSync("selectedPrinter", printer);
      common_vendor.index.showToast({
        title: "已选择：" + printer.name,
        icon: "success"
      });
    },
    // 显示添加对话框
    showAddDialog() {
      this.showDialog = true;
    },
    // 关闭对话框
    closeDialog() {
      this.showDialog = false;
      this.newPrinter = {
        name: "",
        model: "",
        id: "",
        password: "",
        driverName: ""
      };
    },
    // 扫码
    scanCode() {
      common_vendor.index.scanCode({
        success: (res) => {
          try {
            const data = JSON.parse(res.result);
            this.newPrinter.id = data.deviceId || data.printerId || res.result;
            this.newPrinter.password = data.secret || data.password || "";
            this.newPrinter.name = data.name || this.newPrinter.name;
            this.newPrinter.model = data.model || this.newPrinter.model;
            this.newPrinter.driverName = data.driverName || this.newPrinter.driverName;
          } catch (error) {
            this.newPrinter.id = res.result;
          }
        }
      });
    },
    // 快速填充示例设备
    quickFillDevice() {
      const defaultDevice = utils_printApi.printApi.getDefaultDevice();
      this.newPrinter.id = defaultDevice.id;
      this.newPrinter.name = "测试云盒 - " + defaultDevice.name;
      this.newPrinter.model = defaultDevice.model;
      this.newPrinter.password = defaultDevice.password;
      this.newPrinter.driverName = defaultDevice.driverName;
      common_vendor.index.showToast({
        title: "已填充设备信息",
        icon: "success"
      });
    },
    // 添加打印机
    async addPrinter() {
      if (!this.newPrinter.name) {
        common_vendor.index.showToast({
          title: "请输入打印机名称",
          icon: "none"
        });
        return;
      }
      if (!this.newPrinter.id) {
        common_vendor.index.showToast({
          title: "请输入打印机ID",
          icon: "none"
        });
        return;
      }
      common_vendor.index.showLoading({
        title: "添加中..."
      });
      try {
        const result = await utils_printApi.printApi.addPrinter({
          name: this.newPrinter.name,
          model: this.newPrinter.model,
          printerId: this.newPrinter.id,
          password: this.newPrinter.password
        });
        const printer = {
          id: this.newPrinter.id,
          name: this.newPrinter.name,
          model: this.newPrinter.model,
          password: this.newPrinter.password,
          driverName: this.newPrinter.driverName || this.newPrinter.model,
          status: "online"
        };
        this.printerList.push(printer);
        common_vendor.index.setStorageSync("printers", this.printerList);
        if (this.printerList.length === 1) {
          this.selectPrinter(printer);
        }
        common_vendor.index.hideLoading();
        common_vendor.index.showToast({
          title: "添加成功",
          icon: "success"
        });
        this.closeDialog();
      } catch (error) {
        common_vendor.index.hideLoading();
        common_vendor.index.showToast({
          title: error.message || "添加失败",
          icon: "none"
        });
      }
    },
    // 删除打印机（长按）
    deletePrinter(printer) {
      common_vendor.index.showModal({
        title: "提示",
        content: '确定要删除打印机"' + printer.name + '"吗？',
        success: (res) => {
          if (res.confirm) {
            const index = this.printerList.findIndex((p) => p.id === printer.id);
            if (index > -1) {
              this.printerList.splice(index, 1);
              common_vendor.index.setStorageSync("printers", this.printerList);
              if (this.selectedPrinter && this.selectedPrinter.id === printer.id) {
                this.selectedPrinter = null;
                common_vendor.index.removeStorageSync("selectedPrinter");
              }
              common_vendor.index.showToast({
                title: "删除成功",
                icon: "success"
              });
            }
          }
        }
      });
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: common_vendor.f($data.printerList, (printer, index, i0) => {
      return {
        a: common_vendor.t(printer.name),
        b: common_vendor.t(printer.model),
        c: common_vendor.t(printer.status === "online" ? "在线" : "离线"),
        d: common_vendor.n(printer.status),
        e: index,
        f: $data.selectedPrinter && $data.selectedPrinter.id === printer.id ? 1 : "",
        g: common_vendor.o(($event) => $options.selectPrinter(printer), index)
      };
    }),
    b: $data.printerList.length === 0
  }, $data.printerList.length === 0 ? {} : {}, {
    c: common_vendor.o((...args) => $options.showAddDialog && $options.showAddDialog(...args)),
    d: $data.showDialog
  }, $data.showDialog ? {
    e: common_vendor.o((...args) => $options.quickFillDevice && $options.quickFillDevice(...args)),
    f: $data.newPrinter.name,
    g: common_vendor.o(($event) => $data.newPrinter.name = $event.detail.value),
    h: $data.newPrinter.model,
    i: common_vendor.o(($event) => $data.newPrinter.model = $event.detail.value),
    j: $data.newPrinter.id,
    k: common_vendor.o(($event) => $data.newPrinter.id = $event.detail.value),
    l: common_vendor.o((...args) => $options.scanCode && $options.scanCode(...args)),
    m: $data.newPrinter.password,
    n: common_vendor.o(($event) => $data.newPrinter.password = $event.detail.value),
    o: $data.newPrinter.driverName,
    p: common_vendor.o(($event) => $data.newPrinter.driverName = $event.detail.value),
    q: common_vendor.o((...args) => $options.closeDialog && $options.closeDialog(...args)),
    r: common_vendor.o((...args) => $options.addPrinter && $options.addPrinter(...args)),
    s: common_vendor.o(() => {
    }),
    t: common_vendor.o((...args) => $options.closeDialog && $options.closeDialog(...args))
  } : {});
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-4bff6566"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/printer/printer.js.map
