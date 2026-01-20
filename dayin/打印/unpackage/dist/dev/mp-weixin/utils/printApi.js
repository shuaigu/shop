"use strict";
const common_vendor = require("../common/vendor.js");
const config = {
  // API配置 - 请从链科云打印管理后台获取
  clientId: "dImA9V2fbB556AFMYaK88eHtXyHpCCgH",
  // 你的clientId
  clientSecret: "dImA9V2fbB556AFMYaK88eHtXyHpCCgH",
  // 你的密钥
  baseUrl: "https://cloud.liankenet.com",
  // API基础地址（不包含/api）
  version: "v1",
  // API版本
  // 默认设备信息（从 open.liankenet.com 获取）
  defaultDevice: {
    id: "lc01cc05708199",
    password: "XnoyolfCxRRxQThh",
    model: "LP-N110W_D2",
    // 打印机型号
    name: "LP-N110W_D2_60",
    // 主机名
    driverName: "LP-N110W_D2"
    // 驱动名称
  },
  // 生成Base64 Token
  getToken() {
    const tokenStr = `${this.defaultDevice.id}:${this.defaultDevice.password}`;
    return common_vendor.index.base64Encode(tokenStr);
  }
};
function simpleMD5(string) {
  function md5cycle(x, k) {
    let a = x[0], b = x[1], c = x[2], d = x[3];
    a += (b & c | ~b & d) + k[0] - 680876936 | 0;
    a = (a << 7 | a >>> 25) + b | 0;
    d += (a & b | ~a & c) + k[1] - 389564586 | 0;
    d = (d << 12 | d >>> 20) + a | 0;
    c += (d & a | ~d & b) + k[2] + 606105819 | 0;
    c = (c << 17 | c >>> 15) + d | 0;
    b += (c & d | ~c & a) + k[3] - 1044525330 | 0;
    b = (b << 22 | b >>> 10) + c | 0;
    x[0] = a + x[0] | 0;
    x[1] = b + x[1] | 0;
    x[2] = c + x[2] | 0;
    x[3] = d + x[3] | 0;
  }
  function md51(s) {
    const n = s.length;
    const state = [1732584193, -271733879, -1732584194, 271733878];
    let i;
    for (i = 64; i <= n; i += 64) {
      md5cycle(state, md5blk(s.substring(i - 64, i)));
    }
    s = s.substring(i - 64);
    const tail = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    for (i = 0; i < s.length; i++) {
      tail[i >> 2] |= s.charCodeAt(i) << (i % 4 << 3);
    }
    tail[i >> 2] |= 128 << (i % 4 << 3);
    if (i > 55) {
      md5cycle(state, tail);
      for (i = 0; i < 16; i++)
        tail[i] = 0;
    }
    tail[14] = n * 8;
    md5cycle(state, tail);
    return state;
  }
  function md5blk(s) {
    const md5blks = [];
    for (let i = 0; i < 64; i += 4) {
      md5blks[i >> 2] = s.charCodeAt(i) + (s.charCodeAt(i + 1) << 8) + (s.charCodeAt(i + 2) << 16) + (s.charCodeAt(i + 3) << 24);
    }
    return md5blks;
  }
  const hex_chr = "0123456789abcdef".split("");
  function rhex(n) {
    let s = "";
    for (let j = 0; j < 4; j++) {
      s += hex_chr[n >> j * 8 + 4 & 15] + hex_chr[n >> j * 8 & 15];
    }
    return s;
  }
  function hex(x) {
    for (let i = 0; i < x.length; i++) {
      x[i] = rhex(x[i]);
    }
    return x.join("");
  }
  return hex(md51(string));
}
function generateSign(params, timestamp) {
  const sortedKeys = Object.keys(params).sort();
  let signStr = "";
  sortedKeys.forEach((key) => {
    signStr += key + "=" + params[key] + "&";
  });
  signStr += "timestamp=" + timestamp + "&secret=" + config.clientSecret;
  return simpleMD5(signStr).toUpperCase();
}
function request(url, data = {}, method = "POST") {
  return new Promise((resolve, reject) => {
    const timestamp = Date.now();
    const requestData = {
      ...data
    };
    const headers = {
      "Content-Type": "application/json"
    };
    {
      headers["X-Client-Id"] = config.clientId;
      headers["X-Timestamp"] = timestamp;
      headers["X-Sign"] = generateSign(data, timestamp);
    }
    let fullUrl = config.baseUrl + url;
    if (url.startsWith("/v3")) {
      fullUrl = config.baseUrl + url;
    } else if (!url.startsWith("/api") && !config.baseUrl.endsWith("/api")) {
      fullUrl = config.baseUrl + "/api" + url;
    }
    common_vendor.index.__f__("log", "at utils/printApi.js:141", "API请求:", {
      url: fullUrl,
      method,
      data: requestData,
      headers
    });
    common_vendor.index.request({
      url: fullUrl,
      method,
      data: requestData,
      header: headers,
      success: (res) => {
        common_vendor.index.__f__("log", "at utils/printApi.js:154", "API响应:", res);
        if (res.statusCode === 200) {
          if (res.data.code === 0 || res.data.code === 200 || res.data.success) {
            resolve(res.data);
          } else {
            reject(res.data);
          }
        } else {
          reject(res.data || { message: "请求失败" });
        }
      },
      fail: (err) => {
        common_vendor.index.__f__("error", "at utils/printApi.js:167", "API错误:", err);
        reject({ message: err.errMsg || "网络请求失败" });
      }
    });
  });
}
function requestWithoutSign(url, data = {}, method = "POST") {
  return new Promise((resolve, reject) => {
    const requestData = {
      ...data
    };
    const headers = {
      "Content-Type": "application/json"
    };
    let fullUrl = config.baseUrl + url;
    if (!url.startsWith("/v3") && !url.startsWith("/api")) {
      fullUrl = config.baseUrl + "/api" + url;
    }
    common_vendor.index.__f__("log", "at utils/printApi.js:194", "API请求(无签名):", {
      url: fullUrl,
      method,
      data: requestData,
      headers
    });
    common_vendor.index.request({
      url: fullUrl,
      method,
      data: requestData,
      header: headers,
      success: (res) => {
        common_vendor.index.__f__("log", "at utils/printApi.js:207", "API响应:", res);
        common_vendor.index.__f__("log", "at utils/printApi.js:208", "API响应数据:", JSON.stringify(res.data));
        if (res.statusCode === 200) {
          if (res.data.code === 0 || res.data.code === 200 || res.data.success) {
            resolve(res.data);
          } else if (Array.isArray(res.data)) {
            resolve({ code: 200, data: res.data });
          } else if (typeof res.data === "object" && res.data !== null) {
            resolve({ code: 200, data: res.data });
          } else {
            reject(res.data);
          }
        } else {
          reject(res.data || { message: "请求失败", statusCode: res.statusCode });
        }
      },
      fail: (err) => {
        common_vendor.index.__f__("error", "at utils/printApi.js:227", "API错误:", err);
        reject({ message: err.errMsg || "网络请求失败" });
      }
    });
  });
}
function requestWithToken(url, data = {}, method = "POST") {
  return new Promise((resolve, reject) => {
    const requestData = {
      ...data
    };
    const headers = {
      "Content-Type": "application/json",
      "Authorization": "Basic " + config.getToken()
    };
    let fullUrl = config.baseUrl + url;
    if (!url.startsWith("/v3") && !url.startsWith("/api")) {
      fullUrl = config.baseUrl + "/api" + url;
    }
    common_vendor.index.__f__("log", "at utils/printApi.js:255", "API请求(Token):", {
      url: fullUrl,
      method,
      data: requestData,
      headers
    });
    common_vendor.index.request({
      url: fullUrl,
      method,
      data: requestData,
      header: headers,
      success: (res) => {
        common_vendor.index.__f__("log", "at utils/printApi.js:268", "API响应:", res);
        if (res.statusCode === 200) {
          if (res.data.code === 0 || res.data.code === 200 || res.data.success) {
            resolve(res.data);
          } else {
            reject(res.data);
          }
        } else {
          reject(res.data || { message: "请求失败", statusCode: res.statusCode });
        }
      },
      fail: (err) => {
        common_vendor.index.__f__("error", "at utils/printApi.js:281", "API错误:", err);
        reject({ message: err.errMsg || "网络请求失败" });
      }
    });
  });
}
const printApi = {
  // 获取打印机列表（旧接口 - 保留兼容）
  getPrinterList() {
    return request("/printer/list", {}, "GET");
  },
  // 获取设备打印机列表（官方接口）
  getDevicePrinterList(deviceId = null, deviceKey = null, printerType = 1) {
    const params = {
      deviceId: deviceId || config.defaultDevice.id,
      deviceKey: deviceKey || config.defaultDevice.password,
      printerType
    };
    const queryString = Object.keys(params).map((key) => `${key}=${encodeURIComponent(params[key])}`).join("&");
    return requestWithoutSign(`/external_api/printer_list?${queryString}`, {}, "GET");
  },
  // 获取打印机状态
  getPrinterStatus(printerId) {
    return request("/v3/printer/status", { printerId }, "GET");
  },
  // 添加打印机
  addPrinter(printerData) {
    return request("/printer/add", printerData, "POST");
  },
  // 文本打印（链科云打印API格式）
  printText(printData) {
    const requestData = {
      deviceId: printData.printerId || printData.deviceId || config.defaultDevice.id,
      content: printData.content,
      copies: printData.copies || 1
    };
    common_vendor.index.__f__("log", "at utils/printApi.js:330", "打印请求数据:", requestData);
    return request("/print/text", requestData, "POST");
  },
  // 图片打印
  printImage(printData) {
    return request("/print/image", printData, "POST");
  },
  // V3 API: 提交打印任务（支持文件和URL）
  submitPrintTask(printData) {
    const requestData = {
      deviceId: printData.deviceId || config.defaultDevice.id,
      devicePassword: printData.devicePassword || config.defaultDevice.password,
      printerName: printData.printerName || config.defaultDevice.model,
      driverName: printData.driverName || config.defaultDevice.driverName,
      // 打印参数
      dmPaperSize: printData.dmPaperSize || 9,
      // A4 = 9
      dmOrientation: printData.dmOrientation || 1,
      // 竖向 = 1, 横向 = 2
      dmColor: printData.dmColor || 1,
      // 黑白 = 1, 彩色 = 2
      dmDuplex: printData.dmDuplex || 1,
      // 关闭双面 = 1, 短边 = 3, 长边 = 2
      dmCopies: printData.dmCopies || 1,
      // 打印份数
      // 文件信息
      jobFile: printData.jobFile || "",
      // 本地文件（multipart上传）
      jobFileUrl: printData.jobFileUrl || "",
      // 文件URL
      // 预览设置
      isPreview: printData.isPreview !== void 0 ? printData.isPreview : 1
      // 是否生成预览图 0=否 1=是
    };
    return requestWithToken("/v3/print/submitTask", requestData, "POST").catch((err) => {
      common_vendor.index.__f__("log", "at utils/printApi.js:363", "Token认证失败，尝试无签名方式...", err);
      return requestWithoutSign("/v3/print/submitTask", requestData, "POST");
    });
  },
  // 查询任务状态
  queryTaskStatus(taskId) {
    return requestWithoutSign("/v3/print/queryTask", { task_id: taskId }, "POST");
  },
  // 取消任务
  cancelTask(taskId) {
    return requestWithoutSign("/v3/print/cancelTask", { task_id: taskId }, "POST");
  },
  // 文档打印（PDF、Word等）- 保留兼容
  printDocument(printData) {
    return this.submitPrintTask(printData);
  },
  // 标签打印
  printLabel(printData) {
    return request("/print/label", printData, "POST");
  },
  // 获取打印任务状态
  getPrintJobStatus(jobId) {
    return request("/print/status", { jobId }, "GET");
  },
  // 获取打印历史
  getPrintHistory(params) {
    return request("/print/history", params, "GET");
  },
  // 取消打印任务
  cancelPrintJob(jobId) {
    return request("/print/cancel", { jobId }, "POST");
  },
  // 上传文件到云端
  uploadFile(filePath) {
    return new Promise((resolve, reject) => {
      common_vendor.index.uploadFile({
        url: config.baseUrl + "/file/upload",
        filePath,
        name: "file",
        formData: {
          clientId: config.clientId,
          timestamp: Date.now()
        },
        success: (res) => {
          const data = JSON.parse(res.data);
          if (data.code === 0) {
            resolve(data);
          } else {
            reject(data);
          }
        },
        fail: reject
      });
    });
  },
  // 获取默认设备配置
  getDefaultDevice() {
    return config.defaultDevice;
  },
  // 获取设备Token（用于Web访问）
  getDeviceToken() {
    return config.getToken();
  },
  // 获取打印管理页面URL
  getPrintManageUrl() {
    const token = config.getToken();
    return `https://printing.liankenet.com/?token=${token}#/home?isMainPage=1&isBack=1`;
  }
};
exports.printApi = printApi;
//# sourceMappingURL=../../.sourcemap/mp-weixin/utils/printApi.js.map
