"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  __name: "floatButton",
  props: {
    // 按钮大小
    size: {
      type: Number,
      default: 50
    },
    // 按钮位置
    position: {
      type: Object,
      default: () => ({
        bottom: "100rpx",
        right: "30rpx"
      })
    }
  },
  emits: ["click"],
  setup(__props, { emit: __emit }) {
    const emit = __emit;
    const handleClick = () => {
      emit("click");
    };
    return (_ctx, _cache) => {
      return {
        a: __props.size + "rpx",
        b: __props.size + "rpx",
        c: __props.position.bottom,
        d: __props.position.right,
        e: common_vendor.o(handleClick)
      };
    };
  }
};
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-c199bce7"]]);
tt.createComponent(Component);
//# sourceMappingURL=../../../.sourcemap/mp-toutiao/components/floatButton/floatButton.js.map
