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
  __name: "customPageDisplay",
  setup(__props) {
    const pageApi = common_vendor.tr.importObject("customPageKs");
    const pageData = common_vendor.ref(null);
    const pageId = common_vendor.ref("");
    common_vendor.onLoad((options) => {
      if (options.id) {
        pageId.value = options.id;
        loadPageData();
      }
    });
    const loadPageData = async () => {
      try {
        common_vendor.index.showLoading({
          title: "加载中..."
        });
        const res = await pageApi.get(pageId.value);
        if (res.data && res.data.length > 0) {
          pageData.value = res.data[0];
          try {
            const viewRes = await pageApi.increaseViewCount(pageId.value);
            if (viewRes && viewRes.code === 0 && viewRes.view_count !== void 0) {
              pageData.value.view_count = viewRes.view_count;
            }
          } catch (viewErr) {
            console.error("更新浏览次数失败:", viewErr);
          }
        } else {
          common_vendor.index.showToast({
            title: "页面不存在",
            icon: "none"
          });
        }
        common_vendor.index.hideLoading();
      } catch (error) {
        console.error("加载页面失败:", error);
        common_vendor.index.hideLoading();
        common_vendor.index.showToast({
          title: "加载失败",
          icon: "none"
        });
      }
    };
    const copyContact = () => {
      if (!pageData.value || !pageData.value.contact_info) {
        return;
      }
      common_vendor.index.setClipboardData({
        data: pageData.value.contact_info,
        success: () => {
          common_vendor.index.showToast({
            title: "已复制到剪贴板",
            icon: "success"
          });
        }
      });
    };
    const saveQRCode = () => {
      if (!pageData.value || !pageData.value.qr_code_image) {
        return;
      }
      common_vendor.index.showLoading({
        title: "保存中..."
      });
      common_vendor.index.downloadFile({
        url: pageData.value.qr_code_image,
        success: (res) => {
          if (res.statusCode === 200) {
            common_vendor.index.saveImageToPhotosAlbum({
              filePath: res.tempFilePath,
              success: () => {
                common_vendor.index.hideLoading();
                common_vendor.index.showToast({
                  title: "保存成功",
                  icon: "success"
                });
              },
              fail: (err) => {
                common_vendor.index.hideLoading();
                console.error("保存失败:", err);
                common_vendor.index.showToast({
                  title: "保存失败",
                  icon: "none"
                });
              }
            });
          }
        },
        fail: (err) => {
          common_vendor.index.hideLoading();
          console.error("下载失败:", err);
          common_vendor.index.showToast({
            title: "下载失败",
            icon: "none"
          });
        }
      });
    };
    const previewQRCode = () => {
      if (!pageData.value || !pageData.value.qr_code_image) {
        return;
      }
      common_vendor.index.previewImage({
        urls: [pageData.value.qr_code_image],
        current: pageData.value.qr_code_image
      });
    };
    common_vendor.computed(() => {
      if (!pageData.value)
        return {};
      return {
        backgroundColor: pageData.value.background_color || "#ffffff",
        color: pageData.value.text_color || "#333333"
      };
    });
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: pageData.value
      }, pageData.value ? common_vendor.e({
        b: common_vendor.t(pageData.value.title),
        c: pageData.value.qr_code_image
      }, pageData.value.qr_code_image ? {
        d: pageData.value.qr_code_image,
        e: common_vendor.o(previewQRCode)
      } : {}, {
        f: pageData.value.content
      }, pageData.value.content ? {
        g: common_vendor.t(pageData.value.content)
      } : {}, {
        h: common_vendor.p({
          type: "chat",
          size: "24",
          color: "#07C160"
        }),
        i: common_vendor.p({
          type: "notification",
          size: "24",
          color: "#07C160"
        }),
        j: common_vendor.p({
          type: "star",
          size: "24",
          color: "#07C160"
        }),
        k: pageData.value.qr_code_image
      }, pageData.value.qr_code_image ? {
        l: common_vendor.p({
          type: "download-filled",
          size: "22",
          color: "#fff"
        }),
        m: common_vendor.o(saveQRCode)
      } : {}, {
        n: pageData.value.contact_info
      }, pageData.value.contact_info ? {
        o: common_vendor.p({
          type: "contact",
          size: "18",
          color: "#999"
        }),
        p: common_vendor.t(pageData.value.contact_info),
        q: common_vendor.o(copyContact)
      } : {}, {
        r: common_vendor.p({
          type: "eye",
          size: "16",
          color: "#b3b3b3"
        }),
        s: common_vendor.t(pageData.value.view_count || 0)
      }) : {
        t: common_vendor.p({
          type: "spinner-cycle",
          size: "60",
          color: "#07C160"
        })
      });
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-52a8c446"]]);
ks.createPage(MiniProgramPage);
