"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  __name: "qunliao",
  setup(__props) {
    const handleJoinGroup = (e) => {
      common_vendor.index.__f__("log", "at pages/qunliao/qunliao.vue:29", "加入群聊回调", e.detail);
      if (e.detail.errNo === 0) {
        common_vendor.index.showToast({
          title: "加入群聊成功",
          icon: "success"
        });
      } else {
        common_vendor.index.showToast({
          title: "加入失败: " + e.detail.errMsg,
          icon: "none"
        });
      }
    };
    return (_ctx, _cache) => {
      return {
        a: common_vendor.o(handleJoinGroup)
      };
    };
  }
};
tt.createPage(_sfc_main);
//# sourceMappingURL=../../../.sourcemap/mp-toutiao/pages/qunliao/qunliao.js.map
