"use strict";
const common_vendor = require("../../common/vendor.js");
if (!Array) {
  const _easycom_uni_icons2 = common_vendor.resolveComponent("uni-icons");
  _easycom_uni_icons2();
}
const _easycom_uni_icons = () => "../../uni_modules/uni-icons/components/uni-icons/uni-icons.js";
if (!Math) {
  _easycom_uni_icons();
}
const _sfc_main = {
  __name: "customPageList",
  setup(__props) {
    const pageApi = common_vendor.tr.importObject("customPageKs");
    const pageList = common_vendor.ref([]);
    const loading = common_vendor.ref(true);
    const getPageList = async () => {
      try {
        loading.value = true;
        const res = await pageApi.get();
        if (res.data && Array.isArray(res.data)) {
          pageList.value = res.data.filter((item) => item.is_visible !== false).sort((a, b) => (b.sort || 0) - (a.sort || 0));
        } else {
          pageList.value = [];
        }
      } catch (error) {
        console.error("获取页面列表失败:", error);
        common_vendor.index.showToast({
          title: "加载失败",
          icon: "none"
        });
        pageList.value = [];
      } finally {
        loading.value = false;
      }
    };
    const goToPage = (id) => {
      common_vendor.index.navigateTo({
        url: `/subPages/customPageDisplay/customPageDisplay?id=${id}`
      });
    };
    common_vendor.onMounted(() => {
      getPageList();
    });
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: loading.value
      }, loading.value ? {
        b: common_vendor.p({
          type: "spinner-cycle",
          size: "60",
          color: "#399bfe"
        })
      } : pageList.value.length > 0 ? {
        d: common_vendor.f(pageList.value, (item, k0, i0) => {
          return common_vendor.e({
            a: "15865984-1-" + i0,
            b: common_vendor.t(item.title),
            c: item.content
          }, item.content ? {
            d: common_vendor.t(item.content.substring(0, 30)),
            e: common_vendor.t(item.content.length > 30 ? "..." : "")
          } : {}, {
            f: common_vendor.t(item.view_count || 0),
            g: "15865984-2-" + i0,
            h: item._id,
            i: common_vendor.o(($event) => goToPage(item._id))
          });
        }),
        e: common_vendor.p({
          type: "star-filled",
          size: "24",
          color: "#FFD700"
        }),
        f: common_vendor.p({
          type: "arrow-right",
          size: "20",
          color: "#ccc"
        })
      } : {
        g: common_vendor.p({
          type: "info-filled",
          size: "80",
          color: "#ccc"
        })
      }, {
        c: pageList.value.length > 0,
        h: common_vendor.gei(_ctx, "")
      });
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-15865984"]]);
ks.createPage(MiniProgramPage);
