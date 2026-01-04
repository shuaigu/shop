"use strict";
const common_vendor = require("../../common/vendor.js");
const defaultAvatar = "/static/images/default-avatar.png";
const _sfc_main = {
  __name: "lucky-user-banner",
  props: {
    visible: {
      type: Boolean,
      default: true
    },
    rank: {
      type: [Number, String, Object],
      default: 1,
      validator: (value) => {
        if (typeof value === "object" && value !== null) {
          return !isNaN(value.likeRank);
        }
        if (typeof value === "string") {
          return !isNaN(Number(value));
        }
        return !isNaN(value);
      }
    },
    avatar: {
      type: String,
      default: ""
    },
    nickname: {
      type: String,
      default: ""
    }
  },
  setup(__props) {
    const props = __props;
    const actualRank = common_vendor.computed(() => {
      try {
        if (typeof props.rank === "object" && props.rank !== null) {
          return Number(props.rank.likeRank) || 1;
        }
        if (typeof props.rank === "string") {
          return Number(props.rank) || 1;
        }
        return Number(props.rank) || 1;
      } catch (e) {
        console.error("计算排名值出错:", e);
        return 1;
      }
    });
    const actualAvatar = common_vendor.computed(() => {
      return props.avatar || defaultAvatar;
    });
    const actualNickname = common_vendor.computed(() => {
      return props.nickname || "用户";
    });
    return (_ctx, _cache) => {
      return {
        a: actualAvatar.value,
        b: common_vendor.t(actualNickname.value),
        c: common_vendor.t(actualRank.value),
        d: common_vendor.gei(_ctx, "")
      };
    };
  }
};
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-8776324e"]]);
ks.createComponent(Component);
