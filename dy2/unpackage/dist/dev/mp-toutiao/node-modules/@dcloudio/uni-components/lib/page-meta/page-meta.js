"use strict";
const common_vendor = require("../../../../../common/vendor.js");
const _sfc_main = {
  name: "PageMeta",
  setup(props, { emit }) {
    common_vendor.onResize((evt) => {
      emit("resize", evt);
    });
  },
  props: {
    backgroundTextStyle: {
      type: String,
      default: "dark",
      validator(value) {
        return ["dark", "light"].indexOf(value) !== -1;
      }
    },
    backgroundColor: {
      type: String,
      default: "#ffffff"
    },
    backgroundColorTop: {
      type: String,
      default: "#ffffff"
    },
    backgroundColorBottom: {
      type: String,
      default: "#ffffff"
    },
    scrollTop: {
      type: String,
      default: ""
    },
    scrollDuration: {
      type: Number,
      default: 300
    },
    pageStyle: {
      type: String,
      default: ""
    },
    enablePullDownRefresh: {
      type: [Boolean, String],
      default: false
    },
    rootFontSize: {
      type: String,
      default: ""
    }
  },
  created() {
    const page = getCurrentPages()[0];
    this.$pageVm = page.$vm || page;
    this.$watch("backgroundTextStyle", () => {
      this.setBackgroundTextStyle();
    });
    this.$watch(() => [
      this.rootFontSize,
      this.pageStyle
    ], () => {
      this.setPageMeta();
    });
    this.$watch(() => [
      this.backgroundColor,
      this.backgroundColorTop,
      this.backgroundColorBottom
    ], () => {
      this.setBackgroundColor();
    });
    this.$watch(() => [
      this.scrollTop,
      this.scrollDuration
    ], () => {
      this.pageScrollTo();
    });
  },
  beforeMount() {
    this.setBackgroundColor();
    if (this.rootFontSize || this.pageStyle) {
      this.setPageMeta();
    }
    this.backgroundTextStyle && this.setBackgroundTextStyle();
  },
  mounted() {
    this.scrollTop && this.pageScrollTo();
  },
  methods: {
    setPullDownRefresh(webview, enabled) {
      webview.setStyle({
        pullToRefresh: {
          support: enabled,
          style: plus.os.name === "Android" ? "circle" : "default"
        }
      });
    },
    setPageMeta() {
    },
    setBackgroundTextStyle() {
      common_vendor.index.setBackgroundTextStyle && common_vendor.index.setBackgroundTextStyle({
        textStyle: this.backgroundTextStyle
      });
    },
    setBackgroundColor() {
      common_vendor.index.setBackgroundColor && common_vendor.index.setBackgroundColor({
        backgroundColor: this.backgroundColor,
        backgroundColorTop: this.backgroundColorTop,
        backgroundColorBottom: this.backgroundColorBottom
      });
    },
    pageScrollTo() {
      let scrollTop = String(this.scrollTop);
      if (scrollTop.indexOf("rpx") !== -1) {
        scrollTop = common_vendor.index.upx2px(scrollTop.replace("rpx", ""));
      }
      scrollTop = parseFloat(scrollTop);
      if (isNaN(scrollTop)) {
        return;
      }
      common_vendor.index.pageScrollTo({
        scrollTop,
        duration: this.scrollDuration,
        success: () => {
        }
      });
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return {};
}
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
tt.createComponent(Component);
//# sourceMappingURL=../../../../../../.sourcemap/mp-toutiao/node-modules/@dcloudio/uni-components/lib/page-meta/page-meta.js.map
