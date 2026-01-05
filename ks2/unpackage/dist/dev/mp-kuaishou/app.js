"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const common_vendor = require("./common/vendor.js");
const uni_modules_uviewPlus_index = require("./uni_modules/uview-plus/index.js");
if (!Math) {
  "./pages/index/index.js";
  "./pages/my/my.js";
  "./pages/login/login.js";
  "./pages/webview/webview.js";
  "./pages/article/articleAdd.js";
  "./pages/article/articleDetail.js";
  "./pages/userArticleList/userArticleList.js";
  "./pages/article/demo1.js";
  "./pages/pay/index.js";
  "./pages/memo/memo.js";
  "./subPages/contarct/contarct.js";
  "./subPages/feedBack/feedBack.js";
  "./subPages/adminManage/adminManage.js";
  "./subPages/cateManage/cateManage.js";
  "./subPages/articleManage/articleManage.js";
  "./subPages/feedManage/feedManage.js";
  "./subPages/companyInfo/companyInfo.js";
}
const _sfc_main = {
  onLaunch: function() {
    console.log("App Launch");
  },
  onShow: function() {
    console.log("App Show");
  },
  onHide: function() {
    console.log("App Hide");
  }
};
function createApp() {
  const app = common_vendor.createSSRApp(_sfc_main);
  const pinia = common_vendor.createPinia();
  pinia.use(common_vendor.index_default);
  app.use(pinia);
  app.use(uni_modules_uviewPlus_index.uviewPlus);
  return {
    app,
    pinia
  };
}
createApp().app.mount("#app");
exports.createApp = createApp;
