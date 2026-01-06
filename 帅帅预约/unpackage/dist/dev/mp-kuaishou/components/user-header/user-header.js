"use strict";
const common_vendor = require("../../common/vendor.js");
const store_user = require("../../store/user.js");
const _sfc_main = {
  __name: "user-header",
  props: {
    // 用户头像
    userInfo: {
      type: Object,
      defalut: () => {
      }
    },
    // 文章总数
    articleTotal: {
      type: Number,
      default: 0
    },
    // 点赞总数
    likesTotal: {
      type: Number,
      default: 0
    }
  },
  emits: ["contact"],
  setup(__props, { emit: __emit }) {
    store_user.useUserInfoStore();
    const emit = __emit;
    const handleContact = () => {
      emit("contact");
    };
    return (_ctx, _cache) => {
      return {
        a: __props.userInfo.avatarUrl,
        b: common_vendor.t(__props.userInfo.nickName),
        c: common_vendor.t(__props.articleTotal),
        d: common_vendor.t(__props.likesTotal),
        e: common_vendor.o(handleContact),
        f: common_vendor.gei(_ctx, "")
      };
    };
  }
};
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-fb8a6be5"]]);
ks.createComponent(Component);
