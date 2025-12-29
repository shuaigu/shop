"use strict";
const common_vendor = require("../common/vendor.js");
const testLogin = () => {
  common_vendor.index.showModal({
    title: "提示",
    content: "请登录后继续",
    confirmColor: "#399bfe",
    confirmText: "去登录",
    success: (res) => {
      if (res.confirm) {
        common_vendor.index.reLaunch({
          url: "/pages/login/login"
        });
      }
    }
  });
};
exports.testLogin = testLogin;
//# sourceMappingURL=../../.sourcemap/mp-toutiao/utils/isLogin.js.map
