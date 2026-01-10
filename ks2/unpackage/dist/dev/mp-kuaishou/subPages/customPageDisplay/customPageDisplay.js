"use strict";
const common_vendor = require("../../common/vendor.js");
const store_user = require("../../store/user.js");
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
    const userStore = store_user.useUserInfoStore();
    const pageData = common_vendor.ref(null);
    const pageId = common_vendor.ref("");
    const isEditing = common_vendor.ref(false);
    const editForm = common_vendor.ref({
      avatarUrl: "",
      title: "",
      content: "",
      contact_info: "",
      qr_code_image: ""
    });
    const isAdmin = common_vendor.computed(() => {
      return userStore.userInfo.role && userStore.userInfo.role[0] === "admin";
    });
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
    const toggleEdit = () => {
      if (isEditing.value) {
        isEditing.value = false;
      } else {
        editForm.value = {
          avatarUrl: pageData.value.avatar_url || "",
          title: pageData.value.title || "",
          content: pageData.value.content || "",
          contact_info: pageData.value.contact_info || "",
          qr_code_image: pageData.value.qr_code_image || ""
        };
        isEditing.value = true;
      }
    };
    const uploadAvatar = () => {
      common_vendor.index.chooseImage({
        count: 1,
        sizeType: ["compressed"],
        sourceType: ["album", "camera"],
        success: (res) => {
          const tempFilePath = res.tempFilePaths[0];
          common_vendor.index.showLoading({ title: "上传中..." });
          common_vendor.tr.uploadFile({
            filePath: tempFilePath,
            cloudPath: `custom-page-avatar/${Date.now()}_${Math.random().toString(36).slice(2)}.jpg`,
            success: (uploadRes) => {
              common_vendor.index.hideLoading();
              editForm.value.avatarUrl = uploadRes.fileID;
              common_vendor.index.showToast({
                title: "上传成功",
                icon: "success"
              });
            },
            fail: (err) => {
              common_vendor.index.hideLoading();
              console.error("上传失败:", err);
              common_vendor.index.showToast({
                title: "上传失败",
                icon: "none"
              });
            }
          });
        }
      });
    };
    const uploadQRCode = () => {
      common_vendor.index.chooseImage({
        count: 1,
        sizeType: ["compressed"],
        sourceType: ["album", "camera"],
        success: (res) => {
          const tempFilePath = res.tempFilePaths[0];
          common_vendor.index.showLoading({ title: "上传中..." });
          common_vendor.tr.uploadFile({
            filePath: tempFilePath,
            cloudPath: `custom-page-qrcode/${Date.now()}_${Math.random().toString(36).slice(2)}.jpg`,
            success: (uploadRes) => {
              common_vendor.index.hideLoading();
              editForm.value.qr_code_image = uploadRes.fileID;
              common_vendor.index.showToast({
                title: "上传成功",
                icon: "success"
              });
            },
            fail: (err) => {
              common_vendor.index.hideLoading();
              console.error("上传失败:", err);
              common_vendor.index.showToast({
                title: "上传失败",
                icon: "none"
              });
            }
          });
        }
      });
    };
    const saveEdit = async () => {
      try {
        common_vendor.index.showLoading({ title: "保存中..." });
        const updateData = {
          avatar_url: editForm.value.avatarUrl,
          title: editForm.value.title,
          content: editForm.value.content,
          contact_info: editForm.value.contact_info,
          qr_code_image: editForm.value.qr_code_image
        };
        const res = await pageApi.update(pageId.value, updateData);
        if (res.code === 0) {
          pageData.value = {
            ...pageData.value,
            ...updateData
          };
          isEditing.value = false;
          common_vendor.index.hideLoading();
          common_vendor.index.showToast({
            title: "保存成功",
            icon: "success"
          });
        } else {
          common_vendor.index.hideLoading();
          common_vendor.index.showToast({
            title: res.msg || "保存失败",
            icon: "none"
          });
        }
      } catch (error) {
        console.error("保存失败:", error);
        common_vendor.index.hideLoading();
        common_vendor.index.showToast({
          title: "保存失败",
          icon: "none"
        });
      }
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
        b: isAdmin.value
      }, isAdmin.value ? {
        c: common_vendor.p({
          type: "back",
          size: "20",
          color: "#333"
        }),
        d: common_vendor.o(($event) => common_vendor.index.navigateBack()),
        e: common_vendor.p({
          type: isEditing.value ? "close" : "compose",
          size: "20",
          color: isEditing.value ? "#f56c6c" : "#07C160"
        }),
        f: common_vendor.t(isEditing.value ? "取消" : "编辑"),
        g: isEditing.value ? "#f56c6c" : "#07C160",
        h: common_vendor.o(toggleEdit)
      } : {}, {
        i: isEditing.value ? editForm.value.avatarUrl || "/static/default-avatar.png" : pageData.value.avatar_url || "/static/default-avatar.png",
        j: isAdmin.value && isEditing.value
      }, isAdmin.value && isEditing.value ? {
        k: common_vendor.p({
          type: "camera-filled",
          size: "16",
          color: "#fff"
        })
      } : {}, {
        l: common_vendor.o(($event) => isAdmin.value && isEditing.value ? uploadAvatar() : null),
        m: isAdmin.value && isEditing.value
      }, isAdmin.value && isEditing.value ? {
        n: editForm.value.title,
        o: common_vendor.o(($event) => editForm.value.title = $event.detail.value)
      } : {
        p: common_vendor.t(pageData.value.title)
      }, {
        q: isAdmin.value ? "40rpx" : "80rpx",
        r: isEditing.value ? editForm.value.qr_code_image : pageData.value.qr_code_image
      }, (isEditing.value ? editForm.value.qr_code_image : pageData.value.qr_code_image) ? common_vendor.e({
        s: isEditing.value ? editForm.value.qr_code_image : pageData.value.qr_code_image,
        t: isAdmin.value && isEditing.value
      }, isAdmin.value && isEditing.value ? {
        v: common_vendor.p({
          type: "camera-filled",
          size: "20",
          color: "#fff"
        })
      } : {}, {
        w: common_vendor.o(($event) => isAdmin.value && isEditing.value ? uploadQRCode() : previewQRCode()),
        x: common_vendor.p({
          type: "download-filled",
          size: "22",
          color: "#fff"
        }),
        y: common_vendor.o(saveQRCode)
      }) : {}, {
        z: isAdmin.value && isEditing.value
      }, isAdmin.value && isEditing.value ? {
        A: editForm.value.content,
        B: common_vendor.o(($event) => editForm.value.content = $event.detail.value)
      } : pageData.value.content ? {
        D: common_vendor.t(pageData.value.content)
      } : {}, {
        C: pageData.value.content,
        E: common_vendor.p({
          type: "chat",
          size: "24",
          color: "#07C160"
        }),
        F: common_vendor.p({
          type: "notification",
          size: "24",
          color: "#07C160"
        }),
        G: common_vendor.p({
          type: "star",
          size: "24",
          color: "#07C160"
        })
      }, {}, {
        H: isAdmin.value && isEditing.value || pageData.value.contact_info
      }, isAdmin.value && isEditing.value || pageData.value.contact_info ? common_vendor.e({
        I: common_vendor.p({
          type: "contact",
          size: "18",
          color: "#999"
        }),
        J: isAdmin.value && isEditing.value
      }, isAdmin.value && isEditing.value ? {
        K: editForm.value.contact_info,
        L: common_vendor.o(($event) => editForm.value.contact_info = $event.detail.value)
      } : {
        M: common_vendor.t(pageData.value.contact_info),
        N: common_vendor.o(copyContact),
        O: common_vendor.o(copyContact)
      }) : {}, {
        P: isAdmin.value && isEditing.value
      }, isAdmin.value && isEditing.value ? {
        Q: common_vendor.p({
          type: "checkmarkempty",
          size: "22",
          color: "#fff"
        }),
        R: common_vendor.o(saveEdit)
      } : {}, {
        S: common_vendor.p({
          type: "eye",
          size: "16",
          color: "#b3b3b3"
        }),
        T: common_vendor.t(pageData.value.view_count || 0)
      }) : {
        U: common_vendor.p({
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
