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
  __name: "articleAdd",
  setup(__props) {
    const userStore = store_user.useUserInfoStore();
    const articleApi = common_vendor.tr.importObject("articleKs");
    const extStorageCo = common_vendor.tr.importObject("ext-storage-co");
    common_vendor.ref(null);
    const categoryList = common_vendor.ref([]);
    const cateIndex = common_vendor.ref(0);
    const imageList = common_vendor.ref([]);
    common_vendor.ref(0);
    const locationInfo = common_vendor.ref(null);
    const content = common_vendor.ref("");
    const selectedCategory = common_vendor.ref(null);
    const videoInfo = common_vendor.ref(null);
    const textareaFocus = common_vendor.ref(false);
    common_vendor.ref(null);
    const payAmount = common_vendor.ref(0);
    const getLocaAndCate = async () => {
      let locationRes = await common_vendor.index.getLocation({
        type: "gcj02"
      });
      const res = await articleApi.addReady(`${locationRes.longitude},${locationRes.latitude}`);
      console.log(res);
      locationInfo.value = {
        address: res.address,
        district: res.district
      };
      categoryList.value = res.cateList;
      if (categoryList.value.length > 0) {
        selectedCategory.value = categoryList.value[0]._id;
      }
    };
    const chooseAndUploadImage = async () => {
      try {
        if (imageList.value.length >= 9) {
          common_vendor.index.showToast({
            title: "最多只能上传9张图片",
            icon: "none"
          });
          return;
        }
        const chooseRes = await common_vendor.index.chooseImage({
          count: 9 - imageList.value.length,
          sizeType: ["original"],
          // 只使用原图
          sourceType: ["album", "camera"]
        });
        const tempFiles = chooseRes.tempFilePaths.map((filePath) => ({
          fileURL: "",
          thumbnailURL: filePath,
          progress: 0
        }));
        const startIndex = imageList.value.length;
        imageList.value.push(...tempFiles);
        for (let i = 0; i < tempFiles.length; i++) {
          const filePath = chooseRes.tempFilePaths[i];
          await uploadFile(filePath, startIndex + i);
        }
      } catch (err) {
        common_vendor.index.showToast({
          title: "选择图片失败",
          icon: "none"
        });
        console.error("选择图片错误:", err);
      }
    };
    const uploadFile = async (filePath, index) => {
      try {
        common_vendor.index.showLoading({ title: "上传中...", mask: true });
        imageList.value[index] = {
          ...imageList.value[index],
          progress: 0
        };
        const uploadFileOptionsRes = await extStorageCo.getUploadFileOptions({
          cloudPath: `images/${userStore.userInfo.uid}/${Date.now()}-${index}.jpg`,
          fileType: "image",
          isOriginal: true
        });
        startImageProgressAnimation(index);
        const uploadTask = common_vendor.index.uploadFile({
          ...uploadFileOptionsRes.uploadFileOptions,
          filePath,
          success: () => {
            imageList.value[index] = {
              ...imageList.value[index],
              fileURL: uploadFileOptionsRes.fileURL,
              compressedURL: uploadFileOptionsRes.compressedURL,
              thumbnailURL: uploadFileOptionsRes.thumbnailURL,
              progress: 100
            };
            console.log("上传成功:", {
              原图: uploadFileOptionsRes.fileURL,
              压缩图: uploadFileOptionsRes.compressedURL,
              缩略图: uploadFileOptionsRes.thumbnailURL
            });
          },
          fail: (err) => {
            console.error("上传失败", err);
            common_vendor.index.showToast({
              title: "上传失败",
              icon: "error"
            });
            imageList.value.splice(index, 1);
          },
          complete: () => {
            common_vendor.index.hideLoading();
          }
        });
        uploadTask.onProgressUpdate((res) => {
          if (imageList.value[index]) {
            const progress = parseFloat(res.progress.toFixed(2));
            if (progress > imageList.value[index].progress) {
              imageList.value[index].progress = progress;
            }
          }
        });
      } catch (e) {
        console.error(e);
        common_vendor.index.hideLoading();
        common_vendor.index.showToast({
          title: "上传失败",
          icon: "error"
        });
        imageList.value.splice(index, 1);
      }
    };
    const startImageProgressAnimation = (index) => {
      let currentProgress = 0;
      const targetProgress = 95;
      const totalDuration = 2e4;
      const updateInterval = 200;
      const progressIncrement = targetProgress / (totalDuration / updateInterval) * (1 + Math.random() * 0.5);
      const progressTimer = setInterval(() => {
        if (!imageList.value[index] || imageList.value[index].progress >= 100) {
          clearInterval(progressTimer);
          return;
        }
        currentProgress += progressIncrement;
        const newProgress = Math.min(currentProgress, targetProgress);
        if (newProgress > imageList.value[index].progress) {
          imageList.value[index].progress = parseFloat(newProgress.toFixed(2));
        }
        if (newProgress >= targetProgress) {
          clearInterval(progressTimer);
        }
      }, updateInterval);
    };
    const deleteImage = (index) => {
      imageList.value.splice(index, 1);
    };
    const chooseAndUploadVideo = async () => {
      try {
        if (videoInfo.value) {
          common_vendor.index.showToast({
            title: "只能上传一个视频",
            icon: "none",
            duration: 2e3
          });
          return;
        }
        const ksChooseRes = await common_vendor.index.chooseMedia({
          count: 1,
          mediaType: ["video"],
          maxDuration: 60,
          camera: "back",
          sourceType: ["album", "camera"]
        });
        if (!ksChooseRes.tempFiles || ksChooseRes.tempFiles.length === 0) {
          return;
        }
        const videoFile = ksChooseRes.tempFiles[0];
        if (videoFile.size > 500 * 1024 * 1024) {
          common_vendor.index.showToast({
            title: "视频大小不能超过500MB",
            icon: "none",
            duration: 2e3
          });
          return;
        }
        videoInfo.value = {
          fileURL: "",
          thumbnailURL: videoFile.thumbTempFilePath || "",
          tempFilePath: videoFile.tempFilePath,
          duration: videoFile.duration || 0,
          size: videoFile.size,
          progress: 0
        };
        await uploadVideo(videoInfo.value.tempFilePath);
      } catch (err) {
        console.error("选择视频错误:", err);
        common_vendor.index.showToast({
          title: "选择视频失败",
          icon: "none",
          duration: 2e3
        });
      }
    };
    const uploadVideo = async (filePath) => {
      try {
        common_vendor.index.showLoading({ title: "上传中...", mask: true });
        videoInfo.value.progress = 0;
        const progressTimer = startProgressAnimation();
        const uploadFileOptionsRes = await extStorageCo.getUploadFileOptions({
          cloudPath: `videos/${userStore.userInfo.uid}/${Date.now()}.mp4`,
          fileType: "video",
          isOriginal: true
        });
        const ksUploadTask = common_vendor.index.uploadFile({
          url: uploadFileOptionsRes.uploadFileOptions.url,
          filePath,
          name: "file",
          formData: uploadFileOptionsRes.uploadFileOptions.formData || {},
          timeout: 6e5,
          // 增加超时时间到10分钟
          success: (res) => {
            try {
              videoInfo.value.progress = 100;
              let result = res.data;
              if (typeof result === "string") {
                result = JSON.parse(result);
              }
              videoInfo.value = {
                ...videoInfo.value,
                fileURL: uploadFileOptionsRes.fileURL,
                compressedURL: uploadFileOptionsRes.compressedURL,
                thumbnailURL: uploadFileOptionsRes.thumbnailURL,
                progress: 100,
                converting: true
              };
              console.log("视频上传成功:", {
                原视频: uploadFileOptionsRes.fileURL,
                压缩视频: uploadFileOptionsRes.compressedURL,
                封面图: uploadFileOptionsRes.thumbnailURL
              });
              setTimeout(() => {
                if (videoInfo.value) {
                  videoInfo.value.converting = false;
                }
              }, 2e3);
            } catch (parseError) {
              console.error("解析上传结果失败", parseError);
              handleUploadError();
            }
          },
          fail: (err) => {
            console.error("视频上传失败", err);
            handleUploadError();
          },
          complete: () => {
            common_vendor.index.hideLoading();
          }
        });
        if (ksUploadTask && typeof ksUploadTask.onProgressUpdate === "function") {
          ksUploadTask.onProgressUpdate(function(res) {
            if (videoInfo.value && res && typeof res.progress === "number") {
              if (res.progress > videoInfo.value.progress) {
                videoInfo.value.progress = res.progress;
              }
            }
          });
        }
      } catch (e) {
        console.error(e);
        handleUploadError();
      }
    };
    const handleUploadError = () => {
      common_vendor.index.hideLoading();
      common_vendor.index.showToast({
        title: "上传失败，请重试",
        icon: "none",
        duration: 2e3
      });
      videoInfo.value = null;
    };
    const startProgressAnimation = () => {
      let currentProgress = 0;
      const targetProgress = 95;
      const totalDuration = 3e4;
      const updateInterval = 300;
      const progressIncrement = targetProgress / (totalDuration / updateInterval) * (1 + Math.random() * 0.3);
      const progressTimer = setInterval(() => {
        if (!videoInfo.value || videoInfo.value.progress >= 100) {
          clearInterval(progressTimer);
          return;
        }
        try {
          currentProgress += progressIncrement;
          const newProgress = Math.min(currentProgress, targetProgress);
          if (newProgress > videoInfo.value.progress) {
            videoInfo.value.progress = parseFloat(newProgress.toFixed(2));
          }
          if (newProgress >= targetProgress) {
            clearInterval(progressTimer);
          }
        } catch (e) {
          console.error("更新进度出错", e);
          clearInterval(progressTimer);
        }
      }, updateInterval);
      return progressTimer;
    };
    const deleteVideo = () => {
      videoInfo.value = null;
    };
    common_vendor.onMounted(() => {
      getLocaAndCate();
    });
    const submitForm = async () => {
      if (!content.value.trim()) {
        common_vendor.index.showToast({
          title: "请输入内容",
          icon: "none"
        });
        return;
      }
      if (!selectedCategory.value) {
        common_vendor.index.showToast({
          title: "请选择分类",
          icon: "none"
        });
        return;
      }
      if (payAmount.value === 0) {
        common_vendor.index.showToast({
          title: "请选择支付金额",
          icon: "none"
        });
        return;
      }
      common_vendor.index.showLoading({
        title: "发布中...",
        mask: true
      });
      try {
        const uploadedImages = imageList.value.filter((img) => img.fileURL && img.progress === 100).map((img) => ({
          url: img.fileURL,
          compressedURL: img.compressedURL,
          thumbnailURL: img.thumbnailURL
        }));
        const videoData = videoInfo.value && videoInfo.value.fileURL ? {
          url: videoInfo.value.fileURL,
          compressedURL: videoInfo.value.compressedURL,
          thumbnailURL: videoInfo.value.thumbnailURL,
          duration: videoInfo.value.duration
        } : null;
        const params = {
          user_id: userStore.userInfo.uid,
          content: content.value.trim(),
          images: uploadedImages,
          video: videoData,
          cate_id: selectedCategory.value,
          address: locationInfo.value.address,
          district: locationInfo.value.district,
          user_nickName: userStore.userInfo.nickName,
          user_avatarUrl: userStore.userInfo.avatarUrl,
          user_mobile: userStore.userInfo.mobile,
          pay_amount: payAmount.value
        };
        console.log("发布数据:", {
          基础信息: {
            用户ID: params.user_id,
            文章内容: params.content,
            分类ID: params.cate_id,
            状态: params.status
          },
          用户信息: {
            昵称: params.user_nickName,
            头像: params.user_avatarUrl,
            手机: params.user_mobile
          },
          位置信息: {
            完整地址: params.address,
            所在区域: params.district
          },
          图片信息: params.images.map((img, index) => ({
            序号: index + 1,
            原图URL: img.url,
            压缩图URL: img.compressedURL,
            缩略图URL: img.thumbnailURL
          })),
          视频信息: params.video ? {
            原始视频: params.video.url,
            压缩视频: params.video.compressedURL,
            视频封面: params.video.thumbnailURL,
            视频时长: params.video.duration + "秒",
            视频大小: (params.video.size / 1024 / 1024).toFixed(2) + "MB"
          } : "无视频"
        });
        const res = await articleApi.addArticle(params);
        if (res.id) {
          common_vendor.index.showToast({
            title: "发布成功",
            icon: "success"
          });
          common_vendor.index.$emit("articleAdded", {
            cateId: selectedCategory.value
          });
          setTimeout(() => {
            common_vendor.index.navigateBack();
          }, 1500);
        } else {
          throw new Error(res.message || "发布失败");
        }
      } catch (err) {
        console.error("发布失败:", err);
        common_vendor.index.showToast({
          title: err.message || "发布失败，请重试",
          icon: "none"
        });
      } finally {
        common_vendor.index.hideLoading();
      }
    };
    const bindPickerChange = (e) => {
      console.log(e, "分类");
      cateIndex.value = e.detail.value;
      selectedCategory.value = categoryList.value[e.detail.value]._id;
    };
    const focusTextarea = () => {
      common_vendor.index.hideKeyboard();
      setTimeout(() => {
        textareaFocus.value = true;
      }, 50);
    };
    return (_ctx, _cache) => {
      var _a;
      return common_vendor.e({
        a: common_vendor.t((_a = categoryList.value[cateIndex.value]) == null ? void 0 : _a.cate_name),
        b: common_vendor.p({
          type: "bottom",
          size: "14",
          color: "#999999"
        }),
        c: common_vendor.o(bindPickerChange),
        d: categoryList.value,
        e: cateIndex.value,
        f: textareaFocus.value,
        g: common_vendor.o(($event) => textareaFocus.value = false),
        h: content.value,
        i: common_vendor.o(($event) => content.value = $event.detail.value),
        j: common_vendor.o(focusTextarea),
        k: common_vendor.f(imageList.value, (image, index, i0) => {
          return common_vendor.e({
            a: image.thumbnailURL,
            b: "590daae8-1-" + i0,
            c: common_vendor.o(($event) => deleteImage(index)),
            d: image.progress < 100
          }, image.progress < 100 ? {
            e: common_vendor.t(image.progress.toFixed(0)),
            f: image.progress + "%"
          } : {}, {
            g: index
          });
        }),
        l: common_vendor.p({
          type: "close",
          size: "20",
          color: "#fff"
        }),
        m: imageList.value.length < 9
      }, imageList.value.length < 9 ? {
        n: common_vendor.p({
          type: "plusempty",
          size: "30",
          color: "#999"
        }),
        o: common_vendor.o(chooseAndUploadImage)
      } : {}, {
        p: videoInfo.value
      }, videoInfo.value ? common_vendor.e({
        q: videoInfo.value.tempFilePath,
        r: videoInfo.value.thumbnailURL,
        s: common_vendor.p({
          type: "close",
          size: "20",
          color: "#fff"
        }),
        t: common_vendor.o(deleteVideo),
        v: videoInfo.value.progress < 100
      }, videoInfo.value.progress < 100 ? {
        w: common_vendor.t(videoInfo.value.progress.toFixed(0)),
        x: videoInfo.value.progress + "%"
      } : {}, {
        y: videoInfo.value.progress === 100 && videoInfo.value.converting
      }, videoInfo.value.progress === 100 && videoInfo.value.converting ? {} : {}, {
        z: videoInfo.value.progress === 100 && !videoInfo.value.converting
      }, videoInfo.value.progress === 100 && !videoInfo.value.converting ? {
        A: common_vendor.p({
          type: "checkmarkempty",
          size: "24",
          color: "#fff"
        })
      } : {}) : {
        B: common_vendor.p({
          type: "videocam-filled",
          size: "30",
          color: "#999"
        }),
        C: common_vendor.o(chooseAndUploadVideo)
      }, {
        D: common_vendor.o(submitForm),
        E: common_vendor.gei(_ctx, "")
      });
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-590daae8"]]);
ks.createPage(MiniProgramPage);
