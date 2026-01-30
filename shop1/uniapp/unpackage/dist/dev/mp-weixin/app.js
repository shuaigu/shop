"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const common_vendor = require("./common/vendor.js");
const store_user = require("./store/user.js");
if (!Math) {
  "./pages/index/index.js";
  "./pages/login/login.js";
  "./pages/chat/chat.js";
}
const _sfc_main = {
  __name: "App",
  setup(__props) {
    const userStore = store_user.useUserInfoStore();
    common_vendor.onLaunch((options) => {
      common_vendor.index.__f__("log", "at App.vue:8", "App Launch");
      common_vendor.index.__f__("log", "at App.vue:9", "启动参数:", options);
      checkLoginStatus();
      common_vendor.index.showShareMenu({
        withShareTicket: true
      });
    });
    common_vendor.onShow(() => {
      common_vendor.index.__f__("log", "at App.vue:21", "App Show");
      checkLoginStatus();
    });
    common_vendor.onHide(() => {
      common_vendor.index.__f__("log", "at App.vue:27", "App Hide");
    });
    const checkLoginStatus = () => {
      if (userStore.userInfo && userStore.userInfo.uid && userStore.userInfo.isLogin) {
        common_vendor.index.__f__("log", "at App.vue:34", "用户已登录:", userStore.userInfo.nickName);
        return true;
      }
      const storageUserInfo = common_vendor.index.getStorageSync("userInfo");
      if (storageUserInfo && storageUserInfo.uid && storageUserInfo.isLogin) {
        common_vendor.index.__f__("log", "at App.vue:41", "从本地存储恢复登录状态:", storageUserInfo.nickName);
        userStore.setUserInfo(storageUserInfo);
        return true;
      }
      common_vendor.index.__f__("log", "at App.vue:46", "用户未登录");
      return false;
    };
    return () => {
    };
  }
};
const createPersistedState = (options = {}) => {
  const storage = {
    getItem: (key) => common_vendor.index.getStorageSync(key),
    setItem: (key, value) => common_vendor.index.setStorageSync(key, value)
  };
  return ({ store }) => {
    if (!options.stores || options.stores.includes(store.$id)) {
      const storageKey = `${options.prefix || "pinia"}-${store.$id}`;
      const persisted = storage.getItem(storageKey);
      if (persisted) {
        store.$patch(JSON.parse(persisted));
      }
      store.$subscribe((_, state) => {
        storage.setItem(storageKey, JSON.stringify(state));
      });
    }
  };
};
function createApp() {
  const app = common_vendor.createSSRApp(_sfc_main);
  const pinia = common_vendor.createPinia();
  pinia.use(createPersistedState({
    stores: ["userInfo"],
    prefix: "shop1-"
  }));
  app.use(pinia);
  app.config.globalProperties.$request = function(options) {
    const token = common_vendor.index.getStorageSync("token");
    const baseUrl = "https://shop.jingle0350.cn/shop1/php1/api.php";
    const path = options.url.startsWith("/") ? options.url.substring(1) : options.url;
    const fullUrl = `${baseUrl}?path=${path}`;
    common_vendor.index.__f__("log", "at main.js:52", "[Request] URL:", fullUrl);
    common_vendor.index.__f__("log", "at main.js:53", "[Request] Method:", options.method || "GET");
    common_vendor.index.__f__("log", "at main.js:54", "[Request] Data:", options.data);
    return new Promise((resolve, reject) => {
      common_vendor.index.request({
        url: fullUrl,
        method: options.method || "GET",
        data: options.data || {},
        header: {
          "Authorization": token ? "Bearer " + token : "",
          "Content-Type": "application/json",
          ...options.header
        },
        success: (res) => {
          common_vendor.index.__f__("log", "at main.js:67", "[Response] Status:", res.statusCode);
          common_vendor.index.__f__("log", "at main.js:68", "[Response] Data:", res.data);
          if (res.data.success === false && res.data.message === "令牌已过期") {
            common_vendor.index.removeStorageSync("token");
            common_vendor.index.navigateTo({ url: "/pages/login/login" });
            reject(res.data);
          } else {
            resolve(res.data);
          }
        },
        fail: (err) => {
          common_vendor.index.__f__("error", "at main.js:79", "[Request] Fail:", err);
          reject(err);
        }
      });
    });
  };
  return {
    app
  };
}
createApp().app.mount("#app");
exports.createApp = createApp;
//# sourceMappingURL=../.sourcemap/mp-weixin/app.js.map
