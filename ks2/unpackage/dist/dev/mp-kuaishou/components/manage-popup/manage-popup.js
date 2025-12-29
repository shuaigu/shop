"use strict";
const common_vendor = require("../../common/vendor.js");
if (!Array) {
  const _easycom_uni_file_picker2 = common_vendor.resolveComponent("uni-file-picker");
  _easycom_uni_file_picker2();
}
const _easycom_uni_file_picker = () => "../../uni_modules/uni-file-picker/components/uni-file-picker/uni-file-picker.js";
if (!Math) {
  _easycom_uni_file_picker();
}
const defaultImg = "/static/images/defalut.png";
const _sfc_main = {
  __name: "manage-popup",
  props: {
    show: {
      type: Boolean,
      default: false
    },
    title: {
      type: String,
      default: "添加分类"
    },
    editValue: {
      type: String,
      default: ""
    },
    editImg: {
      type: String,
      default: ""
    },
    editSort: {
      type: Number,
      default: 0
    },
    editVisible: {
      type: Boolean,
      default: true
    }
  },
  emits: ["update:show", "confirm"],
  setup(__props, { emit: __emit }) {
    const props = __props;
    const emit = __emit;
    const inputValue = common_vendor.ref("");
    const imageUrl = common_vendor.ref("");
    const isUploading = common_vendor.ref(false);
    const fileList = common_vendor.ref([]);
    const sortValue = common_vendor.ref(0);
    const isVisible = common_vendor.ref(true);
    common_vendor.watch(
      [() => props.show, () => props.editValue, () => props.editImg, () => props.editSort, () => props.editVisible],
      ([showVal, editVal, editImgVal, editSortVal, editVisibleVal]) => {
        if (showVal) {
          if (editVal) {
            inputValue.value = editVal;
          }
          if (editImgVal) {
            imageUrl.value = editImgVal;
            if (editImgVal.startsWith("cloud://")) {
              fileList.value = [{
                url: editImgVal,
                extname: "png",
                name: "category-image.png"
              }];
            } else if (editImgVal !== defaultImg) {
              fileList.value = [{
                url: editImgVal,
                extname: "png",
                name: "category-image.png"
              }];
            } else {
              fileList.value = [];
            }
          } else {
            imageUrl.value = defaultImg;
            fileList.value = [];
          }
          sortValue.value = editSortVal || 0;
          isVisible.value = editVisibleVal !== false;
        } else {
          inputValue.value = "";
          imageUrl.value = "";
          fileList.value = [];
          sortValue.value = 0;
          isVisible.value = true;
        }
      }
    );
    const handleInput = (e) => {
      inputValue.value = e.detail.value;
    };
    const onFileUploadSuccess = (e) => {
      console.log("文件上传成功:", e);
      try {
        if (e && e.tempFiles && e.tempFiles.length > 0) {
          const fileInfo = e.tempFiles[0];
          if (fileInfo.url) {
            console.log("设置新的图片URL:", fileInfo.url);
            imageUrl.value = fileInfo.url;
            isUploading.value = false;
            common_vendor.index.showToast({
              title: "上传成功",
              icon: "success"
            });
          } else {
            console.error("上传成功但未获取到文件URL");
            common_vendor.index.showToast({
              title: "上传异常，请重试",
              icon: "none"
            });
          }
        } else {
          console.error("上传成功但未获取到文件信息");
          common_vendor.index.showToast({
            title: "上传异常，请重试",
            icon: "none"
          });
        }
      } catch (error) {
        console.error("处理上传结果时出错:", error);
        common_vendor.index.showToast({
          title: "上传异常，请重试",
          icon: "none"
        });
      }
      isUploading.value = false;
    };
    const onFileUploadFail = (e) => {
      console.error("文件上传失败:", e);
      isUploading.value = false;
      common_vendor.index.showToast({
        title: "上传失败，请重试",
        icon: "none"
      });
    };
    const onFileRemove = () => {
      imageUrl.value = defaultImg;
      fileList.value = [];
    };
    const handleConfirm = () => {
      if (!inputValue.value.trim()) {
        common_vendor.index.showToast({
          title: "请输入分类名称",
          icon: "none"
        });
        return;
      }
      if (isUploading.value) {
        common_vendor.index.showToast({
          title: "图片上传中，请稍候",
          icon: "none"
        });
        return;
      }
      emit("confirm", {
        name: inputValue.value,
        img: imageUrl.value || defaultImg,
        sort: sortValue.value,
        is_visible: isVisible.value
      });
      emit("update:show", false);
      inputValue.value = "";
      imageUrl.value = "";
      fileList.value = [];
      sortValue.value = 0;
    };
    const handleCancel = () => {
      emit("update:show", false);
    };
    const selectDefaultImage = () => {
      if (fileList.value.length === 0) {
        common_vendor.index.chooseImage({
          count: 1,
          sizeType: ["compressed"],
          sourceType: ["album", "camera"],
          success: (res) => {
            if (res.tempFilePaths && res.tempFilePaths.length > 0) {
              isUploading.value = true;
              common_vendor.index.showLoading({
                title: "上传中...",
                mask: true
              });
              const tempFilePath = res.tempFilePaths[0];
              const cloudPath = `cate_images/${Date.now()}.png`;
              console.log("开始上传文件:", {
                tempFilePath,
                cloudPath
              });
              common_vendor.nr.uploadFile({
                filePath: tempFilePath,
                cloudPath,
                success: (uploadRes) => {
                  console.log("手动上传成功:", uploadRes);
                  imageUrl.value = uploadRes.fileID;
                  fileList.value = [{
                    url: uploadRes.fileID,
                    extname: "png",
                    name: "category-image.png"
                  }];
                  common_vendor.index.showToast({
                    title: "上传成功",
                    icon: "success"
                  });
                },
                fail: (err) => {
                  console.error("手动上传失败:", err);
                  common_vendor.index.showToast({
                    title: "上传失败，请重试",
                    icon: "none"
                  });
                },
                complete: () => {
                  isUploading.value = false;
                  common_vendor.index.hideLoading();
                }
              });
            }
          }
        });
      }
    };
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: props.show
      }, props.show ? common_vendor.e({
        b: common_vendor.o(handleCancel),
        c: common_vendor.t(__props.title),
        d: inputValue.value,
        e: {
          "input": common_vendor.o(handleInput)
        },
        f: common_vendor.j({
          "success": common_vendor.o(onFileUploadSuccess),
          "fail": common_vendor.o(onFileUploadFail),
          "delete": common_vendor.o(onFileRemove),
          "updateValue": common_vendor.o(($event) => fileList.value = $event)
        }),
        g: common_vendor.p({
          fileMediatype: "image",
          mode: "grid",
          limit: 1,
          ["image-styles"]: {
            width: "200rpx",
            height: "200rpx"
          },
          ["auto-upload"]: true,
          ["del-icon"]: true,
          ["return-type"]: "object",
          ["file-extname"]: "jpg,png,webp",
          value: fileList.value
        }),
        h: fileList.value.length === 0
      }, fileList.value.length === 0 ? {
        i: defaultImg,
        j: common_vendor.o(selectDefaultImage)
      } : {}, {
        k: isUploading.value
      }, isUploading.value ? {} : fileList.value.length === 0 ? {} : imageUrl.value && imageUrl.value.startsWith("cloud://") ? {} : {}, {
        l: fileList.value.length === 0,
        m: imageUrl.value && imageUrl.value.startsWith("cloud://"),
        n: {
          "input": common_vendor.o(common_vendor.m(($event) => sortValue.value = $event.detail.value, {
            number: true
          }))
        },
        o: sortValue.value,
        p: isVisible.value,
        q: common_vendor.o(($event) => isVisible.value = $event.detail.value),
        r: common_vendor.t(isVisible.value ? "显示" : "隐藏"),
        s: common_vendor.o(handleCancel),
        t: common_vendor.o(handleConfirm),
        v: isUploading.value,
        w: common_vendor.gei(_ctx, "")
      }) : {});
    };
  }
};
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-21adf0f7"]]);
ks.createComponent(Component);
