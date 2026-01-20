"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_printApi = require("../../utils/printApi.js");
const _sfc_main = {
  data() {
    return {
      // 打印类型
      printTypes: [
        { label: "文本", value: "text" },
        { label: "图片", value: "image" },
        { label: "文档", value: "document" },
        { label: "标签", value: "label" }
      ],
      currentType: "text",
      // 文本打印
      textContent: "",
      fontSize: 14,
      // 图片打印
      imageList: [],
      // 文档打印
      inputType: "url",
      // 'file' 或 'url'
      fileList: [],
      fileUrl: "",
      // 标签打印
      labelContent: "",
      labelTemplates: [
        { name: "标准标签", value: "standard" },
        { name: "快递标签", value: "express" },
        { name: "价格标签", value: "price" }
      ],
      selectedTemplate: {},
      // 打印设置
      currentPrinter: null,
      copies: 1,
      paperSizes: [
        { name: "A4", value: 9 },
        { name: "A5", value: 11 },
        { name: "Letter", value: 1 },
        { name: "A3", value: 8 }
      ],
      currentPaperSize: { name: "A4", value: 9 },
      orientation: 1,
      // 1=竖向, 2=横向
      colorMode: 1,
      // 1=黑白, 2=彩色
      duplexMode: 1
      // 1=关闭双面, 2=长边, 3=短边
    };
  },
  onLoad(options) {
    if (options.type) {
      this.currentType = options.type;
    }
    this.loadPrinter();
  },
  methods: {
    // 切换打印类型
    switchType(type) {
      this.currentType = type;
    },
    // 加载打印机
    loadPrinter() {
      this.currentPrinter = common_vendor.index.getStorageSync("selectedPrinter");
    },
    // 选择打印机
    selectPrinter() {
      common_vendor.index.navigateTo({
        url: "/pages/printer/printer"
      });
    },
    // 字体大小变化
    fontSizeChange(e) {
      this.fontSize = e.detail.value;
    },
    // 选择图片
    chooseImage() {
      common_vendor.index.chooseImage({
        count: 9 - this.imageList.length,
        sizeType: ["original", "compressed"],
        sourceType: ["album", "camera"],
        success: (res) => {
          this.imageList = this.imageList.concat(res.tempFilePaths);
        }
      });
    },
    // 删除图片
    deleteImage(index) {
      this.imageList.splice(index, 1);
    },
    // 选择文件
    chooseFile() {
      common_vendor.index.chooseMessageFile({
        count: 10,
        type: "file",
        success: (res) => {
          this.fileList = this.fileList.concat(res.tempFiles.map((file) => ({
            name: file.name,
            path: file.path,
            size: file.size
          })));
        }
      });
    },
    // 删除文件
    deleteFile(index) {
      this.fileList.splice(index, 1);
    },
    // 格式化文件大小
    formatFileSize(size) {
      if (size < 1024) {
        return size + "B";
      } else if (size < 1024 * 1024) {
        return (size / 1024).toFixed(2) + "KB";
      } else {
        return (size / 1024 / 1024).toFixed(2) + "MB";
      }
    },
    // 模板变化
    templateChange(e) {
      this.selectedTemplate = this.labelTemplates[e.detail.value];
    },
    // 纸张大小变化
    paperSizeChange(e) {
      this.currentPaperSize = this.paperSizes[e.detail.value];
    },
    // 改变份数
    changeCopies(delta) {
      const newCopies = this.copies + delta;
      if (newCopies >= 1 && newCopies <= 99) {
        this.copies = newCopies;
      }
    },
    // 预览打印
    previewPrint() {
      if (!this.validatePrintData()) {
        return;
      }
      common_vendor.index.showToast({
        title: "预览功能开发中",
        icon: "none"
      });
    },
    // 验证打印数据
    validatePrintData() {
      if (!this.currentPrinter) {
        common_vendor.index.showToast({
          title: "请先选择打印机",
          icon: "none"
        });
        return false;
      }
      if (this.currentType === "text" && !this.textContent) {
        common_vendor.index.showToast({
          title: "请输入文本内容",
          icon: "none"
        });
        return false;
      }
      if (this.currentType === "image" && this.imageList.length === 0) {
        common_vendor.index.showToast({
          title: "请选择图片",
          icon: "none"
        });
        return false;
      }
      if (this.currentType === "document") {
        if (this.inputType === "file" && this.fileList.length === 0) {
          common_vendor.index.showToast({
            title: "请选择文件",
            icon: "none"
          });
          return false;
        }
        if (this.inputType === "url" && !this.fileUrl) {
          common_vendor.index.showToast({
            title: "请输入文件URL",
            icon: "none"
          });
          return false;
        }
      }
      if (this.currentType === "label" && !this.labelContent) {
        common_vendor.index.showToast({
          title: "请输入标签内容",
          icon: "none"
        });
        return false;
      }
      return true;
    },
    // 开始打印
    async startPrint() {
      var _a, _b;
      if (!this.validatePrintData()) {
        return;
      }
      common_vendor.index.showLoading({
        title: "正在打印..."
      });
      try {
        let result;
        const printData = {
          deviceId: this.currentPrinter.id,
          devicePassword: this.currentPrinter.password,
          printerName: this.currentPrinter.model || this.currentPrinter.name,
          driverName: this.currentPrinter.driverName || this.currentPrinter.model,
          dmCopies: this.copies,
          dmPaperSize: this.currentPaperSize.value,
          dmOrientation: this.orientation,
          dmColor: this.colorMode,
          dmDuplex: this.duplexMode,
          isPreview: 1
          // 生成预览图
        };
        if (this.currentType === "document") {
          if (this.inputType === "url") {
            result = await utils_printApi.printApi.submitPrintTask({
              ...printData,
              jobFileUrl: this.fileUrl
            });
          } else {
            const fileUrls = [];
            for (let file of this.fileList) {
              const uploadResult = await utils_printApi.printApi.uploadFile(file.path);
              fileUrls.push(uploadResult.data.url);
            }
            result = await utils_printApi.printApi.submitPrintTask({
              ...printData,
              jobFileUrl: fileUrls[0]
            });
          }
        } else if (this.currentType === "image") {
          const imageUrls = [];
          for (let img of this.imageList) {
            const uploadResult = await utils_printApi.printApi.uploadFile(img);
            imageUrls.push(uploadResult.data.url);
          }
          result = await utils_printApi.printApi.printImage({
            ...printData,
            imageUrls
          });
        } else if (this.currentType === "label") {
          result = await utils_printApi.printApi.printLabel({
            ...printData,
            content: this.labelContent,
            template: this.selectedTemplate.value
          });
        } else {
          result = await utils_printApi.printApi.printText({
            ...printData,
            content: this.textContent,
            fontSize: this.fontSize
          });
        }
        this.savePrintHistory(result);
        common_vendor.index.hideLoading();
        const taskId = ((_a = result.data) == null ? void 0 : _a.task_id) || ((_b = result.data) == null ? void 0 : _b.jobId);
        if (taskId) {
          common_vendor.index.showModal({
            title: "打印任务已提交",
            content: `任务ID: ${taskId}

可在历史记录中查询任务状态`,
            confirmText: "查看历史",
            cancelText: "继续打印",
            success: (res) => {
              if (res.confirm) {
                common_vendor.index.navigateTo({
                  url: "/pages/history/history"
                });
              }
            }
          });
        } else {
          common_vendor.index.showToast({
            title: "打印成功",
            icon: "success"
          });
        }
        this.clearForm();
      } catch (error) {
        common_vendor.index.hideLoading();
        common_vendor.index.__f__("error", "at pages/print/print.vue:570", "打印失败:", error);
        common_vendor.index.showModal({
          title: "打印失败",
          content: error.message || error.msg || "未知错误",
          showCancel: false
        });
      }
    },
    // 保存打印历史
    savePrintHistory(result) {
      var _a, _b;
      let history = common_vendor.index.getStorageSync("printHistory") || [];
      history.unshift({
        id: ((_a = result.data) == null ? void 0 : _a.task_id) || ((_b = result.data) == null ? void 0 : _b.jobId) || Date.now(),
        type: this.currentType,
        printer: this.currentPrinter.name,
        time: (/* @__PURE__ */ new Date()).toISOString(),
        status: "pending",
        params: {
          copies: this.copies,
          paperSize: this.currentPaperSize.name,
          orientation: this.orientation === 1 ? "竖向" : "横向",
          colorMode: this.colorMode === 1 ? "黑白" : "彩色",
          duplexMode: this.duplexMode === 1 ? "关闭" : this.duplexMode === 2 ? "长边" : "短边"
        }
      });
      if (history.length > 100) {
        history = history.slice(0, 100);
      }
      common_vendor.index.setStorageSync("printHistory", history);
    },
    // 清空表单
    clearForm() {
      this.textContent = "";
      this.imageList = [];
      this.fileList = [];
      this.fileUrl = "";
      this.labelContent = "";
      this.copies = 1;
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: common_vendor.f($data.printTypes, (type, k0, i0) => {
      return {
        a: common_vendor.t(type.label),
        b: type.value,
        c: $data.currentType === type.value ? 1 : "",
        d: common_vendor.o(($event) => $options.switchType(type.value), type.value)
      };
    }),
    b: $data.currentType === "text"
  }, $data.currentType === "text" ? {
    c: $data.textContent,
    d: common_vendor.o(($event) => $data.textContent = $event.detail.value),
    e: common_vendor.t($data.textContent.length),
    f: $data.fontSize,
    g: common_vendor.o((...args) => $options.fontSizeChange && $options.fontSizeChange(...args))
  } : {}, {
    h: $data.currentType === "image"
  }, $data.currentType === "image" ? common_vendor.e({
    i: common_vendor.f($data.imageList, (img, index, i0) => {
      return {
        a: img,
        b: common_vendor.o(($event) => $options.deleteImage(index), index),
        c: index
      };
    }),
    j: $data.imageList.length < 9
  }, $data.imageList.length < 9 ? {
    k: common_vendor.o((...args) => $options.chooseImage && $options.chooseImage(...args))
  } : {}) : {}, {
    l: $data.currentType === "document"
  }, $data.currentType === "document" ? common_vendor.e({
    m: $data.inputType === "file" ? 1 : "",
    n: common_vendor.o(($event) => $data.inputType = "file"),
    o: $data.inputType === "url" ? 1 : "",
    p: common_vendor.o(($event) => $data.inputType = "url"),
    q: $data.inputType === "file"
  }, $data.inputType === "file" ? common_vendor.e({
    r: common_vendor.f($data.fileList, (file, index, i0) => {
      return {
        a: common_vendor.t(file.name),
        b: common_vendor.t($options.formatFileSize(file.size)),
        c: common_vendor.o(($event) => $options.deleteFile(index), index),
        d: index
      };
    }),
    s: $data.fileList.length === 0
  }, $data.fileList.length === 0 ? {} : {}, {
    t: common_vendor.o((...args) => $options.chooseFile && $options.chooseFile(...args))
  }) : {}, {
    v: $data.inputType === "url"
  }, $data.inputType === "url" ? {
    w: $data.fileUrl,
    x: common_vendor.o(($event) => $data.fileUrl = $event.detail.value)
  } : {}) : {}, {
    y: $data.currentType === "label"
  }, $data.currentType === "label" ? {
    z: $data.labelContent,
    A: common_vendor.o(($event) => $data.labelContent = $event.detail.value),
    B: common_vendor.t($data.selectedTemplate.name || "请选择模板"),
    C: $data.labelTemplates,
    D: common_vendor.o((...args) => $options.templateChange && $options.templateChange(...args))
  } : {}, {
    E: common_vendor.t($data.currentPrinter ? $data.currentPrinter.name : "请选择打印机"),
    F: common_vendor.o((...args) => $options.selectPrinter && $options.selectPrinter(...args)),
    G: common_vendor.o(($event) => $options.changeCopies(-1)),
    H: common_vendor.t($data.copies),
    I: common_vendor.o(($event) => $options.changeCopies(1)),
    J: common_vendor.t($data.currentPaperSize.name),
    K: $data.paperSizes,
    L: common_vendor.o((...args) => $options.paperSizeChange && $options.paperSizeChange(...args)),
    M: $data.orientation === 1 ? 1 : "",
    N: common_vendor.o(($event) => $data.orientation = 1),
    O: $data.orientation === 2 ? 1 : "",
    P: common_vendor.o(($event) => $data.orientation = 2),
    Q: $data.colorMode === 2 ? 1 : "",
    R: common_vendor.o(($event) => $data.colorMode = 2),
    S: $data.colorMode === 1 ? 1 : "",
    T: common_vendor.o(($event) => $data.colorMode = 1),
    U: $data.duplexMode === 1 ? 1 : "",
    V: common_vendor.o(($event) => $data.duplexMode = 1),
    W: $data.duplexMode === 3 ? 1 : "",
    X: common_vendor.o(($event) => $data.duplexMode = 3),
    Y: $data.duplexMode === 2 ? 1 : "",
    Z: common_vendor.o(($event) => $data.duplexMode = 2),
    aa: common_vendor.o((...args) => $options.previewPrint && $options.previewPrint(...args)),
    ab: common_vendor.o((...args) => $options.startPrint && $options.startPrint(...args))
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-edb11d9e"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/print/print.js.map
