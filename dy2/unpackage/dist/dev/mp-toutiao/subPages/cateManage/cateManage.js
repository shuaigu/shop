"use strict";
const common_vendor = require("../../common/vendor.js");
if (!Array) {
  const _easycom_uni_icons2 = common_vendor.resolveComponent("uni-icons");
  const _easycom_manage_popup2 = common_vendor.resolveComponent("manage-popup");
  const _easycom_floatButton2 = common_vendor.resolveComponent("floatButton");
  (_easycom_uni_icons2 + _easycom_manage_popup2 + _easycom_floatButton2)();
}
const _easycom_uni_icons = () => "../../uni_modules/uni-icons/components/uni-icons/uni-icons.js";
const _easycom_manage_popup = () => "../../components/manage-popup/manage-popup.js";
const _easycom_floatButton = () => "../../components/floatButton/floatButton.js";
if (!Math) {
  (_easycom_uni_icons + _easycom_manage_popup + _easycom_floatButton)();
}
const _sfc_main = {
  __name: "cateManage",
  setup(__props) {
    const cateApi = common_vendor.nr.importObject("cateWx", { customUI: true });
    common_vendor.nr.importObject("qiniuyunCloud", { customUI: true });
    const cateList = common_vendor.ref([]);
    const cateListGet = async () => {
      const res = await cateApi.get(null, true);
      common_vendor.index.__f__("log", "at subPages/cateManage/cateManage.vue:12", res);
      cateList.value = res.data;
    };
    common_vendor.onShow(() => {
      cateListGet();
    });
    const showPopup = common_vendor.ref(false);
    const isEdit = common_vendor.ref(false);
    const editValue = common_vendor.ref("");
    const currentId = common_vendor.ref("");
    const cateImage = common_vendor.ref("");
    const imageUploading = common_vendor.ref(false);
    const uploadProgress = common_vendor.ref(0);
    const isVisible = common_vendor.ref(true);
    const handleAddCate = () => {
      common_vendor.index.__f__("log", "at subPages/cateManage/cateManage.vue:37", 1);
      isEdit.value = false;
      cateImage.value = "";
      editValue.value = "";
      isVisible.value = true;
      showPopup.value = true;
    };
    const edit = async (id) => {
      var _a, _b, _c;
      isEdit.value = true;
      currentId.value = id;
      const res = await cateApi.get(id);
      common_vendor.index.__f__("log", "at subPages/cateManage/cateManage.vue:53", res, "单个获取");
      editValue.value = (_a = res.data[0]) == null ? void 0 : _a.cate_name;
      cateImage.value = ((_b = res.data[0]) == null ? void 0 : _b.cate_img) || "";
      isVisible.value = ((_c = res.data[0]) == null ? void 0 : _c.is_visible) !== false;
      showPopup.value = true;
    };
    const del = async (id) => {
      const res = await cateApi.del(id);
      if (res.deleted === 1) {
        common_vendor.index.showToast({
          title: "删除成功",
          icon: "none"
        });
        cateListGet();
      }
    };
    const chooseImage = async () => {
      try {
        const res = await common_vendor.index.chooseImage({
          count: 1,
          sizeType: ["compressed"],
          sourceType: ["album", "camera"]
        });
        if (res.tempFilePaths && res.tempFilePaths.length > 0) {
          const tempPath = res.tempFilePaths[0];
          await uploadImage(tempPath);
        }
      } catch (e) {
        common_vendor.index.__f__("error", "at subPages/cateManage/cateManage.vue:89", "选择图片失败:", e);
        if (e.errMsg !== "chooseImage:fail cancel") {
          common_vendor.index.showToast({
            title: "选择图片失败",
            icon: "none"
          });
        }
      }
    };
    const uploadImage = async (filePath) => {
      try {
        imageUploading.value = true;
        uploadProgress.value = 0;
        const fileExt = filePath.substring(filePath.lastIndexOf(".") + 1).toLowerCase();
        const result = await common_vendor.nr.uploadFile({
          filePath,
          cloudPath: `cate_icons/${Date.now()}_${Math.random().toString(36).substring(2, 10)}.${fileExt}`,
          onUploadProgress: (progressEvent) => {
            uploadProgress.value = Math.round(progressEvent.loaded / progressEvent.total * 100);
          }
        });
        common_vendor.index.__f__("log", "at subPages/cateManage/cateManage.vue:117", "上传结果:", result);
        if (result.fileID) {
          const tempUrl = await common_vendor.nr.getTempFileURL({
            fileList: [result.fileID]
          });
          common_vendor.index.__f__("log", "at subPages/cateManage/cateManage.vue:125", "临时链接:", tempUrl);
          if (tempUrl.fileList && tempUrl.fileList[0] && tempUrl.fileList[0].tempFileURL) {
            cateImage.value = result.fileID;
            common_vendor.index.showToast({
              title: "图片上传成功",
              icon: "success"
            });
          } else {
            throw new Error("获取临时链接失败");
          }
        } else {
          throw new Error("上传失败");
        }
      } catch (e) {
        common_vendor.index.__f__("error", "at subPages/cateManage/cateManage.vue:142", "上传图片错误:", e);
        common_vendor.index.showToast({
          title: "图片上传失败",
          icon: "none"
        });
      } finally {
        imageUploading.value = false;
      }
    };
    const handleConfirm = async (data) => {
      if (imageUploading.value) {
        common_vendor.index.showToast({
          title: "图片正在上传中，请稍候",
          icon: "none"
        });
        return;
      }
      if (typeof data === "string") {
        data = {
          cate_name: data,
          cate_img: cateImage.value,
          is_visible: isVisible.value
        };
      } else if (!data.cate_img && cateImage.value) {
        data.cate_img = cateImage.value;
      }
      if (isEdit.value) {
        common_vendor.index.__f__("log", "at subPages/cateManage/cateManage.vue:177", "编辑", data);
        const upRes = await cateApi.update(currentId.value, data);
        common_vendor.index.__f__("log", "at subPages/cateManage/cateManage.vue:179", upRes);
        if (upRes.updated === 1) {
          common_vendor.index.showToast({
            title: "更新成功",
            icon: "none"
          });
          cateListGet();
        }
      } else {
        common_vendor.index.__f__("log", "at subPages/cateManage/cateManage.vue:189", "添加", data);
        const res = await cateApi.add(data);
        if (res.id) {
          common_vendor.index.showToast({
            title: "添加成功",
            icon: "none"
          });
          cateListGet();
        }
      }
      currentId.value = "";
      cateImage.value = "";
    };
    const handleCanner = () => {
      showPopup.value = false;
    };
    const toggleVisibility = async (id, currentVisibility) => {
      const newVisibility = !currentVisibility;
      try {
        const upRes = await cateApi.update(id, {
          is_visible: newVisibility
        });
        if (upRes.updated === 1) {
          common_vendor.index.showToast({
            title: newVisibility ? "已启用显示" : "已隐藏分类",
            icon: "none"
          });
          cateListGet();
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at subPages/cateManage/cateManage.vue:228", "切换可见性失败:", error);
        common_vendor.index.showToast({
          title: "操作失败，请重试",
          icon: "none"
        });
      }
    };
    return (_ctx, _cache) => {
      return {
        a: common_vendor.f(cateList.value, (item, k0, i0) => {
          return common_vendor.e({
            a: item.cate_img,
            b: common_vendor.o(($event) => item.cate_img = "/static/images/defalut.png"),
            c: common_vendor.t(item.cate_name),
            d: !item.is_visible
          }, !item.is_visible ? {} : {}, {
            e: !item.is_visible ? 1 : "",
            f: item.is_visible === false,
            g: common_vendor.o(() => toggleVisibility(item._id, item.is_visible !== false)),
            h: common_vendor.o(($event) => edit(item._id)),
            i: "1eceedb2-0-" + i0,
            j: common_vendor.o(($event) => del(item._id)),
            k: "1eceedb2-1-" + i0,
            l: item._id
          });
        }),
        b: common_vendor.p({
          color: "#399bfe",
          type: "compose",
          size: "22"
        }),
        c: common_vendor.p({
          color: "#e65c00",
          ["custom-prefix"]: "iconfont",
          type: "icon-shanchu1",
          size: "20"
        }),
        d: common_vendor.o(chooseImage),
        e: common_vendor.o(handleConfirm),
        f: common_vendor.o(handleCanner),
        g: common_vendor.p({
          show: showPopup.value,
          title: isEdit.value ? "编辑分类" : "添加分类",
          ["edit-value"]: editValue.value,
          ["image-url"]: cateImage.value,
          ["image-uploading"]: imageUploading.value,
          ["upload-progress"]: uploadProgress.value,
          ["is-visible"]: isVisible.value
        }),
        h: common_vendor.o(handleAddCate),
        i: common_vendor.p({
          icon: "plus",
          size: 100,
          position: {
            bottom: "120rpx",
            right: "40rpx"
          }
        })
      };
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-1eceedb2"]]);
tt.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-toutiao/subPages/cateManage/cateManage.js.map
