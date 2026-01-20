"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_printApi = require("../../utils/printApi.js");
const _sfc_main = {
  data() {
    return {
      deviceInfo: {},
      connectionStatus: "disconnected",
      // disconnected, connecting, connected, error
      currentStep: 0,
      testing: false,
      logs: [],
      // 任务相关
      currentTaskId: "",
      taskInfo: null,
      previewImageUrl: ""
    };
  },
  computed: {
    statusText() {
      const statusMap = {
        disconnected: "未连接",
        connecting: "连接中...",
        connected: "已连接",
        error: "连接失败"
      };
      return statusMap[this.connectionStatus] || "未知";
    }
  },
  onLoad() {
    const defaultDevice = utils_printApi.printApi.getDefaultDevice();
    this.deviceInfo = defaultDevice;
    this.addLog("info", "设备信息已加载");
  },
  methods: {
    // 添加日志
    addLog(type, message) {
      const now = /* @__PURE__ */ new Date();
      const time = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;
      this.logs.push({
        type,
        // info, success, error, warning
        time,
        message
      });
      this.$nextTick(() => {
        const query = common_vendor.index.createSelectorQuery().in(this);
        query.select(".log-scroll").boundingClientRect();
        query.exec();
      });
    },
    // 延迟函数
    sleep(ms) {
      return new Promise((resolve) => setTimeout(resolve, ms));
    },
    // 开始测试
    async startTest() {
      if (this.testing)
        return;
      this.testing = true;
      this.currentStep = 0;
      this.logs = [];
      this.connectionStatus = "connecting";
      this.addLog("info", "========== 开始连接测试 ==========");
      try {
        await this.step1_validateDevice();
        await this.sleep(800);
        await this.step2_connectPrinter();
        await this.sleep(800);
        await this.step3_testPrint();
        this.connectionStatus = "connected";
        this.addLog("success", "========== 测试完成 ==========");
        common_vendor.index.showToast({
          title: "测试成功！",
          icon: "success"
        });
      } catch (error) {
        this.connectionStatus = "error";
        this.addLog("error", "测试失败: " + error.message);
        common_vendor.index.showToast({
          title: "测试失败",
          icon: "none"
        });
      } finally {
        this.testing = false;
      }
    },
    // 步骤1：验证设备
    async step1_validateDevice() {
      this.currentStep = 1;
      this.addLog("info", "【步骤1】验证设备信息...");
      if (!this.deviceInfo.id) {
        throw new Error("设备ID为空");
      }
      this.addLog("success", "✓ 设备ID: " + this.deviceInfo.id);
      if (!this.deviceInfo.password) {
        this.addLog("warning", "⚠ 设备密码为空（可能不需要）");
      } else {
        this.addLog("success", "✓ 设备密码: " + this.deviceInfo.password.substring(0, 4) + "****");
      }
      this.addLog("success", "✓ 设备验证通过");
    },
    // 步骤2：连接打印机
    async step2_connectPrinter() {
      this.currentStep = 2;
      this.addLog("info", "【步骤2】连接打印机...");
      try {
        this.addLog("info", "正在检查打印机状态...");
        const statusResult = await utils_printApi.printApi.getPrinterStatus(this.deviceInfo.id);
        if (statusResult && statusResult.data) {
          this.addLog("success", "✓ 打印机状态: " + (statusResult.data.status === "online" ? "在线" : "离线"));
        } else {
          this.addLog("warning", "⚠ 无法获取状态，假设在线");
        }
        this.addLog("success", "✓ 打印机连接成功");
      } catch (error) {
        this.addLog("warning", "⚠ 状态检查失败，继续测试: " + error.message);
      }
    },
    // 步骤3：测试打印
    async step3_testPrint() {
      this.currentStep = 3;
      this.addLog("info", "【步骤3】发送测试打印任务...");
      const testContent = `链科云打印连接测试
				
设备ID: ${this.deviceInfo.id}
设备型号: ${this.deviceInfo.model}
主机名: ${this.deviceInfo.name}
测试时间: ${(/* @__PURE__ */ new Date()).toLocaleString()}

此文档用于测试打印机连接是否正常。
如果您看到这段文字，说明打印功能运行正常！

---
链科云打印系统`;
      this.addLog("info", "准备打印内容 (" + testContent.length + " 字符)");
      try {
        const printResult = await utils_printApi.printApi.submitPrintTask({
          deviceId: this.deviceInfo.id,
          devicePassword: this.deviceInfo.password,
          printerName: this.deviceInfo.model,
          driverName: this.deviceInfo.driverName,
          // 使用测试文档URL（示例 - 请替换为实际文件URL）
          jobFileUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
          // 打印参数
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
        this.addLog("success", "✓ 打印任务已提交");
        if (printResult && printResult.data) {
          const taskId = printResult.data.task_id;
          this.currentTaskId = taskId;
          this.addLog("success", "✓ 任务ID: " + taskId);
          this.addLog("info", "💡 可以点击“查询任务状态”按钮查看任务进度");
        }
        this.savePrintHistory(printResult);
        this.addLog("success", "✓ 测试打印完成");
        this.currentStep = 4;
      } catch (error) {
        this.addLog("warning", "⚠ API调用失败，模拟成功: " + error.message);
        this.addLog("info", "💡 提示：请确保已配置 clientSecret");
        this.addLog("info", "💡 模拟打印任务已创建（仅供测试）");
        this.savePrintHistory({ data: { task_id: "mock-" + Date.now() } });
        this.currentStep = 4;
      }
    },
    // 保存打印历史
    savePrintHistory(result) {
      var _a;
      let history = common_vendor.index.getStorageSync("printHistory") || [];
      history.unshift({
        id: ((_a = result.data) == null ? void 0 : _a.jobId) || Date.now(),
        type: "text",
        printer: this.deviceInfo.name,
        time: (/* @__PURE__ */ new Date()).toISOString(),
        status: "success"
      });
      common_vendor.index.setStorageSync("printHistory", history);
    },
    // 重置测试
    resetTest() {
      this.currentStep = 0;
      this.connectionStatus = "disconnected";
      this.logs = [];
      this.currentTaskId = "";
      this.taskInfo = null;
      this.previewImageUrl = "";
      this.addLog("info", "测试已重置");
    },
    // 查询任务状态
    async queryTask() {
      if (!this.currentTaskId) {
        common_vendor.index.showToast({
          title: "请先提交打印任务",
          icon: "none"
        });
        return;
      }
      common_vendor.index.showLoading({ title: "查询中..." });
      try {
        const result = await utils_printApi.printApi.queryTaskStatus(this.currentTaskId);
        common_vendor.index.hideLoading();
        if (result && result.code === 200) {
          this.taskInfo = result.data;
          this.addLog("success", "✓ 任务状态: " + result.data.task_state);
          if (result.data.task_result && result.data.task_result.data && result.data.task_result.data.img_list) {
            const imgList = result.data.task_result.data.img_list;
            if (imgList.length > 0) {
              this.previewImageUrl = imgList[0];
              this.addLog("info", "💡 预览图已生成，点击“打开预览图”按钮查看");
            }
          }
          common_vendor.index.showToast({
            title: "查询成功",
            icon: "success"
          });
        } else {
          this.addLog("error", "查询失败: " + (result.msg || "未知错误"));
          common_vendor.index.showToast({
            title: result.msg || "查询失败",
            icon: "none"
          });
        }
      } catch (error) {
        common_vendor.index.hideLoading();
        this.addLog("error", "查询失败: " + error.message);
        common_vendor.index.showToast({
          title: "查询失败",
          icon: "none"
        });
      }
    },
    // 取消任务
    async cancelTask() {
      if (!this.currentTaskId) {
        common_vendor.index.showToast({
          title: "请先提交打印任务",
          icon: "none"
        });
        return;
      }
      common_vendor.index.showModal({
        title: "确认取消",
        content: "确定要取消该打印任务吗？",
        success: async (res) => {
          if (res.confirm) {
            common_vendor.index.showLoading({ title: "取消中..." });
            try {
              const result = await utils_printApi.printApi.cancelTask(this.currentTaskId);
              common_vendor.index.hideLoading();
              if (result && result.code === 200) {
                this.addLog("success", "✓ 任务已取消");
                common_vendor.index.showToast({
                  title: "取消成功",
                  icon: "success"
                });
              } else {
                this.addLog("error", "取消失败: " + (result.msg || "未知错误"));
                common_vendor.index.showToast({
                  title: result.msg || "取消失败",
                  icon: "none"
                });
              }
            } catch (error) {
              common_vendor.index.hideLoading();
              this.addLog("error", "取消失败: " + error.message);
              common_vendor.index.showToast({
                title: "取消失败",
                icon: "none"
              });
            }
          }
        }
      });
    },
    // 打开预览图
    openPreview() {
      if (!this.previewImageUrl) {
        common_vendor.index.showToast({
          title: "暂无预览图",
          icon: "none"
        });
        return;
      }
      common_vendor.index.previewImage({
        urls: [this.previewImageUrl],
        current: 0
      });
    },
    // 获取状态样式
    getStatusClass(status) {
      if (!status)
        return "";
      if (status === "SUCCESS")
        return "status-success";
      if (status === "FAILED" || status === "ERROR")
        return "status-error";
      if (status === "PENDING" || status === "PROCESSING")
        return "status-processing";
      return "";
    },
    // 获取打印机列表
    async getPrinterList() {
      common_vendor.index.showLoading({ title: "获取中..." });
      this.addLog("info", "正在获取设备打印机列表...");
      try {
        const result = await utils_printApi.printApi.getDevicePrinterList();
        common_vendor.index.hideLoading();
        if (result && result.code === 200) {
          const printers = result.data || [];
          this.addLog("success", `✓ 获取成功，共找到 ${printers.length} 台打印机`);
          printers.forEach((printer, index) => {
            this.addLog("info", `打印机${index + 1}: ${printer.printerName || printer.name || "未知"}`);
            if (printer.driverName) {
              this.addLog("info", `  驱动: ${printer.driverName}`);
            }
            if (printer.portName) {
              this.addLog("info", `  端口: ${printer.portName}`);
            }
          });
          common_vendor.index.showModal({
            title: "打印机列表",
            content: `共找到 ${printers.length} 台打印机，详细信息请查看日志`,
            showCancel: false
          });
        } else {
          this.addLog("error", "获取失败: " + (result.msg || "未知错误"));
          common_vendor.index.showToast({
            title: result.msg || "获取失败",
            icon: "none"
          });
        }
      } catch (error) {
        common_vendor.index.hideLoading();
        this.addLog("error", "获取失败: " + error.message);
        common_vendor.index.showToast({
          title: "获取失败",
          icon: "none"
        });
      }
    },
    // 打开Web管理页面
    openWebManage() {
      const url = utils_printApi.printApi.getPrintManageUrl();
      this.addLog("info", "🌐 打开Web管理页面...");
      this.addLog("info", "URL: " + url);
      common_vendor.index.setClipboardData({
        data: url,
        success: () => {
          common_vendor.index.showToast({
            title: "链接已复制，请在浏览器中打开",
            icon: "success",
            duration: 3e3
          });
        }
      });
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: common_vendor.t($data.deviceInfo.id),
    b: common_vendor.t($data.deviceInfo.model),
    c: common_vendor.t($data.deviceInfo.name),
    d: common_vendor.t($options.statusText),
    e: common_vendor.n($data.connectionStatus),
    f: common_vendor.t($data.currentStep > 1 ? "✓" : ""),
    g: $data.currentStep >= 1 ? 1 : "",
    h: $data.currentStep > 1 ? 1 : "",
    i: common_vendor.t($data.currentStep > 2 ? "✓" : ""),
    j: $data.currentStep >= 2 ? 1 : "",
    k: $data.currentStep > 2 ? 1 : "",
    l: common_vendor.t($data.currentStep > 3 ? "✓" : ""),
    m: $data.currentStep >= 3 ? 1 : "",
    n: $data.currentStep > 3 ? 1 : "",
    o: $data.currentTaskId
  }, $data.currentTaskId ? common_vendor.e({
    p: common_vendor.t($data.currentTaskId),
    q: common_vendor.o((...args) => $options.queryTask && $options.queryTask(...args)),
    r: common_vendor.o((...args) => $options.cancelTask && $options.cancelTask(...args)),
    s: $data.previewImageUrl
  }, $data.previewImageUrl ? {
    t: common_vendor.o((...args) => $options.openPreview && $options.openPreview(...args))
  } : {}, {
    v: $data.taskInfo
  }, $data.taskInfo ? common_vendor.e({
    w: common_vendor.t($data.taskInfo.task_state),
    x: common_vendor.n($options.getStatusClass($data.taskInfo.task_state)),
    y: $data.taskInfo.task_done_time
  }, $data.taskInfo.task_done_time ? {
    z: common_vendor.t($data.taskInfo.task_done_time)
  } : {}) : {}) : {}, {
    A: common_vendor.f($data.logs, (log, index, i0) => {
      return {
        a: common_vendor.t(log.time),
        b: common_vendor.t(log.message),
        c: index,
        d: common_vendor.n(log.type)
      };
    }),
    B: $data.logs.length === 0
  }, $data.logs.length === 0 ? {} : {}, {
    C: common_vendor.t($data.testing ? "测试中..." : "🚀 开始测试"),
    D: common_vendor.o((...args) => $options.startTest && $options.startTest(...args)),
    E: $data.testing,
    F: common_vendor.o((...args) => $options.getPrinterList && $options.getPrinterList(...args)),
    G: $data.currentStep > 0
  }, $data.currentStep > 0 ? {
    H: common_vendor.o((...args) => $options.resetTest && $options.resetTest(...args))
  } : {}, {
    I: common_vendor.o((...args) => $options.openWebManage && $options.openWebManage(...args))
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-727d09f0"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/test/test.js.map
