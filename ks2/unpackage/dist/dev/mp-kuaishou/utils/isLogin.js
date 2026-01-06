"use strict";
const common_vendor = require("../common/vendor.js");
const testLogin = () => {
  const pages = getCurrentPages();
  const currentPage = pages[pages.length - 1];
  const route = currentPage.route;
  const options = currentPage.options;
  let fullPath = "/" + route;
  if (options && Object.keys(options).length > 0) {
    const params = Object.keys(options).map((key) => `${key}=${options[key]}`).join("&");
    fullPath += "?" + params;
  }
  common_vendor.index.showModal({
    title: "提示",
    content: "请登录后继续",
    confirmColor: "#399bfe",
    confirmText: "去登录",
    success: (res) => {
      if (res.confirm) {
        common_vendor.index.navigateTo({
          url: `/pages/login/login?redirect=${encodeURIComponent(fullPath)}`
        });
      }
    }
  });
};
exports.testLogin = testLogin;
