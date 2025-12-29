"use strict";
const uni_modules_uviewPlus_components_uLoadingPage_props = require("./props.js");
const uni_modules_uviewPlus_libs_mixin_mpMixin = require("../../libs/mixin/mpMixin.js");
const uni_modules_uviewPlus_libs_mixin_mixin = require("../../libs/mixin/mixin.js");
const uni_modules_uviewPlus_libs_function_index = require("../../libs/function/index.js");
const common_vendor = require("../../../../common/vendor.js");
const _sfc_main = {
  name: "u-loading-page",
  mixins: [uni_modules_uviewPlus_libs_mixin_mpMixin.mpMixin, uni_modules_uviewPlus_libs_mixin_mixin.mixin, uni_modules_uviewPlus_components_uLoadingPage_props.props],
  data() {
    return {};
  },
  methods: {
    addUnit: uni_modules_uviewPlus_libs_function_index.addUnit
  }
};
if (!Array) {
  const _easycom_u_loading_icon2 = common_vendor.resolveComponent("u-loading-icon");
  const _easycom_u_transition2 = common_vendor.resolveComponent("u-transition");
  (_easycom_u_loading_icon2 + _easycom_u_transition2)();
}
const _easycom_u_loading_icon = () => "../u-loading-icon/u-loading-icon.js";
const _easycom_u_transition = () => "../u-transition/u-transition.js";
if (!Math) {
  (_easycom_u_loading_icon + _easycom_u_transition)();
}
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: _ctx.image
  }, _ctx.image ? {
    b: _ctx.image,
    c: $options.addUnit(_ctx.iconSize),
    d: $options.addUnit(_ctx.iconSize)
  } : {
    e: common_vendor.p({
      mode: _ctx.loadingMode,
      size: $options.addUnit(_ctx.iconSize),
      color: _ctx.loadingColor
    })
  }, {
    f: common_vendor.t(_ctx.loadingText),
    g: $options.addUnit(_ctx.fontSize),
    h: _ctx.color,
    i: common_vendor.p({
      show: _ctx.loading,
      ["custom-style"]: {
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: _ctx.bgColor,
        display: "flex",
        zIndex: _ctx.zIndex,
        ..._ctx.customStyle
      }
    })
  });
}
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-9c9e88a3"]]);
tt.createComponent(Component);
//# sourceMappingURL=../../../../../.sourcemap/mp-toutiao/uni_modules/uview-plus/components/u-loading-page/u-loading-page.js.map
