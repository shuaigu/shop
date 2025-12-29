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
  __name: "fabu",
  setup(__props) {
    const userStore = store_user.useUserInfoStore();
    const articleApi = common_vendor.nr.importObject("articleDy", { customUI: true });
    const extStorageCo = common_vendor.nr.importObject("fabuWx", { customUI: true });
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
    const contentTextarea = common_vendor.ref(null);
    const payAmount = common_vendor.ref(0);
    const videoLink = common_vendor.ref("");
    const inputHeight = common_vendor.ref(170);
    const selectionStart = common_vendor.ref(0);
    const selectionEnd = common_vendor.ref(0);
    const iconCustomizing = common_vendor.ref(false);
    const textOffsetX = common_vendor.ref(0);
    const textOffsetY = common_vendor.ref(0);
    const textSize = common_vendor.ref(100);
    const previewImageUrl = common_vendor.ref("");
    let currentEditingCategory = null;
    const getLocaAndCate = async () => {
      try {
        common_vendor.index.showLoading({
          title: "加载中...",
          mask: false
        });
        let locationRes = await common_vendor.index.getLocation({
          type: "gcj02"
        }).catch((err) => {
          common_vendor.index.__f__("error", "at pages/fabu/fabu.vue:50", "获取位置失败:", err);
          return { longitude: 116.397428, latitude: 39.90923 };
        });
        const res = await articleApi.addReady(`${locationRes.longitude},${locationRes.latitude}`);
        common_vendor.index.__f__("log", "at pages/fabu/fabu.vue:57", "获取分类和地址信息成功:", res);
        locationInfo.value = {
          address: res.address || "未知地址",
          district: res.district || "未知区域"
        };
        if (res.district && res.district !== "未知区域") {
          try {
            const categoryResult = await extStorageCo.processCategoryFromDistrict(res.district);
            common_vendor.index.__f__("log", "at pages/fabu/fabu.vue:70", "区域分类处理结果:", categoryResult);
            if (categoryResult.code === 0 && categoryResult.data) {
              const updatedCateRes = await articleApi.addReady(`${locationRes.longitude},${locationRes.latitude}`);
              if (updatedCateRes.cateList && updatedCateRes.cateList.length > 0) {
                res.cateList = updatedCateRes.cateList;
              }
            }
          } catch (categoryError) {
            common_vendor.index.__f__("error", "at pages/fabu/fabu.vue:81", "处理区域分类失败:", categoryError);
          }
        }
        if (res.cateList && res.cateList.length > 0) {
          const locationBasedCategories = res.cateList.filter(
            (cate) => cate.is_location_based && cate.location_district === res.district
          );
          if (locationBasedCategories.length > 0) {
            categoryList.value = locationBasedCategories.map((cate) => {
              return {
                ...cate,
                icon: cate.cate_img || getDefaultCategoryIcon(cate.cate_name)
              };
            });
            selectedCategory.value = categoryList.value[0]._id;
            cateIndex.value = 0;
            const firstCategory = categoryList.value[0];
            if (!firstCategory.cate_img || firstCategory.cate_img.includes("default")) {
              try {
                common_vendor.index.__f__("log", "at pages/fabu/fabu.vue:110", "为位置分类自动生成图标:", firstCategory.cate_name);
                const iconResult = await generateCategoryIcon(firstCategory.cate_name, firstCategory._id);
                if (iconResult && iconResult.iconURL) {
                  firstCategory.icon = iconResult.iconURL;
                  categoryList.value[0].icon = iconResult.iconURL;
                  categoryList.value[0].cate_img = iconResult.iconURL;
                }
              } catch (iconError) {
                common_vendor.index.__f__("error", "at pages/fabu/fabu.vue:120", "自动生成位置分类图标失败:", iconError);
              }
            }
          } else {
            try {
              if (res.district && res.district !== "未知区域") {
                const createResult = await extStorageCo.createLocationCategory({
                  district: res.district,
                  address: res.address
                });
                if (createResult && createResult.categoryId) {
                  const newCategory = {
                    _id: createResult.categoryId,
                    cate_name: res.district,
                    is_location_based: true,
                    location_district: res.district,
                    icon: getDefaultCategoryIcon(res.district)
                  };
                  categoryList.value = [newCategory];
                  selectedCategory.value = newCategory._id;
                  cateIndex.value = 0;
                  handleGenerateIcon(newCategory);
                } else {
                  setDefaultCategory();
                }
              } else {
                setDefaultCategory();
              }
            } catch (e) {
              common_vendor.index.__f__("error", "at pages/fabu/fabu.vue:158", "创建位置分类失败:", e);
              setDefaultCategory();
            }
          }
        } else {
          common_vendor.index.__f__("warn", "at pages/fabu/fabu.vue:163", "未获取到分类列表或分类列表为空");
          setDefaultCategory();
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/fabu/fabu.vue:167", "获取位置和分类失败:", error);
        common_vendor.index.showToast({
          title: "获取分类失败，请重试",
          icon: "none",
          duration: 2e3
        });
        locationInfo.value = {
          address: "未知地址",
          district: "未知区域"
        };
        setDefaultCategory();
      } finally {
        common_vendor.index.hideLoading();
      }
    };
    const setDefaultCategory = () => {
      categoryList.value = [{
        _id: "default",
        cate_name: "默认分类",
        icon: "/static/images/category/default.png"
      }];
      selectedCategory.value = "default";
      cateIndex.value = 0;
    };
    const getDefaultCategoryIcon = (cateName) => {
      const iconMap = {
        "宠物用品": "/static/images/category/pet.png",
        "水杯餐具": "/static/images/category/tableware.png",
        "日用百货": "/static/images/category/daily.png",
        "清洁工具": "/static/images/category/cleaning.png",
        "收纳整理": "/static/images/category/storage.png",
        "文具教具": "/static/images/category/stationery.png",
        "畜牧农资": "/static/images/category/agriculture.png",
        "纸品湿巾": "/static/images/category/tissue.png",
        "个人护理": "/static/images/category/personal.png",
        "厨房烹饪": "/static/images/category/kitchen.png",
        "节庆礼品": "/static/images/category/gift.png",
        "图书乐器": "/static/images/category/book.png",
        "家庭清洁": "/static/images/category/home.png",
        "花卉园艺": "/static/images/category/garden.png",
        "锅具水壶": "/static/images/category/pot.png"
      };
      return iconMap[cateName] || "/static/images/default.png";
    };
    const chooseAndUploadImage = async () => {
      try {
        const chooseRes = await common_vendor.index.chooseImage({
          count: 9,
          // 保留此参数但不再做前置检查
          sizeType: ["original"],
          // 只使用原图
          sourceType: ["album", "camera"],
          mediaType: ["image"]
          // 只选择图片，隐藏视频
        });
        const uploadPromises = chooseRes.tempFilePaths.map(async (filePath, index) => {
          const newIndex = imageList.value.length;
          imageList.value.push({
            fileURL: "",
            thumbnailURL: filePath,
            progress: 0
          });
          try {
            const uploadOptions = await extStorageCo.getUploadFileOptions({
              cloudPath: `images/${userStore.userInfo.uid}/${Date.now()}-${newIndex}.jpg`,
              fileType: "image",
              isOriginal: true
            });
            let fallbackTimer = null;
            let fallbackActive = true;
            fallbackTimer = setTimeout(function setupFallback() {
              var _a;
              if (!fallbackActive)
                return;
              const currentProgress = ((_a = imageList.value[newIndex]) == null ? void 0 : _a.progress) || 0;
              if (currentProgress >= 98) {
                fallbackActive = false;
                return;
              }
              let nextProgress;
              if (currentProgress < 30) {
                nextProgress = currentProgress + 5;
              } else if (currentProgress < 70) {
                nextProgress = currentProgress + 3;
              } else if (currentProgress < 90) {
                nextProgress = currentProgress + 1;
              } else {
                nextProgress = currentProgress + 0.5;
              }
              imageList.value[newIndex].progress = Math.min(98, nextProgress);
              fallbackTimer = setTimeout(setupFallback, 800);
            }, 500);
            return new Promise((resolve, reject) => {
              const uploadTask = common_vendor.index.uploadFile({
                ...uploadOptions.uploadFileOptions,
                filePath,
                success: () => {
                  fallbackActive = false;
                  clearTimeout(fallbackTimer);
                  imageList.value[newIndex].progress = 100;
                  imageList.value[newIndex].fileURL = uploadOptions.fileURL;
                  imageList.value[newIndex].compressedURL = uploadOptions.compressedURL;
                  imageList.value[newIndex].thumbnailURL = uploadOptions.thumbnailURL;
                  resolve(true);
                },
                fail: (err) => {
                  fallbackActive = false;
                  clearTimeout(fallbackTimer);
                  common_vendor.index.__f__("error", "at pages/fabu/fabu.vue:307", "上传失败", err);
                  imageList.value.splice(newIndex, 1);
                  reject(err);
                }
              });
              try {
                uploadTask.onProgressUpdate((res) => {
                  if (res && typeof res.progress === "number") {
                    fallbackActive = false;
                    clearTimeout(fallbackTimer);
                    const actualProgress = Math.min(99, res.progress);
                    imageList.value[newIndex].progress = actualProgress;
                  }
                });
              } catch (progressErr) {
                common_vendor.index.__f__("log", "at pages/fabu/fabu.vue:327", "进度更新回调不可用，使用备用进度显示", progressErr);
              }
            });
          } catch (err) {
            imageList.value.splice(newIndex, 1);
            common_vendor.index.__f__("error", "at pages/fabu/fabu.vue:334", "上传图片错误:", err);
            return Promise.reject(err);
          }
        });
        await Promise.all(uploadPromises);
      } catch (err) {
        common_vendor.index.showToast({
          title: "上传失败",
          icon: "none"
        });
        common_vendor.index.__f__("error", "at pages/fabu/fabu.vue:347", "图片上传过程错误:", err);
      }
    };
    const deleteImage = (index) => {
      imageList.value.splice(index, 1);
    };
    const validateVideoLink = () => {
      if (!videoLink.value.trim()) {
        common_vendor.index.showToast({
          title: "请输入视频链接",
          icon: "none",
          duration: 2e3
        });
        return false;
      }
      if (videoLink.value.trim().length > 5e3) {
        common_vendor.index.showToast({
          title: "视频链接过长，请不要超过500个字符",
          icon: "none",
          duration: 2e3
        });
        return false;
      }
      const urlPattern = /^(https?:\/\/)?([\w-]+\.)+[\w-]+(\/[\w- ./?%&=]*)?$/;
      if (!urlPattern.test(videoLink.value.trim())) {
        common_vendor.index.showToast({
          title: "请输入有效的视频链接",
          icon: "none",
          duration: 2e3
        });
        return false;
      }
      return true;
    };
    const addVideoLink = () => {
      if (!validateVideoLink())
        return;
      if (videoInfo.value) {
        common_vendor.index.showToast({
          title: "只能添加一个视频",
          icon: "none",
          duration: 2e3
        });
        return;
      }
      videoInfo.value = videoLink.value.trim();
      videoLink.value = "";
      common_vendor.index.showToast({
        title: "视频链接已添加",
        icon: "success",
        duration: 1500
      });
    };
    const deleteVideo = () => {
      videoInfo.value = null;
    };
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
        if (!categoryList.value.length || categoryList.value[0]._id === "default") {
          common_vendor.index.showModal({
            title: "提示",
            content: "未能获取到分类信息，是否重新获取？",
            success: (res) => {
              if (res.confirm) {
                retryGetCategories();
              }
            }
          });
        }
        return;
      }
      if (!locationInfo.value || !locationInfo.value.address) {
        common_vendor.index.showToast({
          title: "未能获取位置信息",
          icon: "none"
        });
        return;
      }
      common_vendor.index.showLoading({
        title: "发布中...",
        mask: false
      });
      try {
        const uploadedImages = imageList.value.filter((img) => img.fileURL && img.progress === 100).map((img) => ({
          url: img.fileURL,
          compressedURL: img.compressedURL,
          thumbnailURL: img.thumbnailURL
        }));
        const videoURL = videoInfo.value || null;
        const selectedCategoryInfo = categoryList.value.find((cate) => cate._id === selectedCategory.value) || null;
        const isLocationBasedCategory = selectedCategoryInfo && selectedCategoryInfo.is_location_based === true;
        const params = {
          user_id: userStore.userInfo.uid,
          content: content.value.trim(),
          images: uploadedImages,
          videoURL,
          cate_id: selectedCategory.value,
          address: locationInfo.value.address || "未知地址",
          district: locationInfo.value.district || "未知区域",
          user_nickName: userStore.userInfo.nickName,
          user_avatarUrl: userStore.userInfo.avatarUrl,
          user_mobile: userStore.userInfo.mobile,
          pay_amount: payAmount.value || 0,
          // 确保即使没有选择支付金额也能发布，默认为0
          is_location_based_category: isLocationBasedCategory,
          // 添加标识，指示是否使用位置分类
          category_info: selectedCategoryInfo ? {
            name: selectedCategoryInfo.cate_name,
            is_location_based: selectedCategoryInfo.is_location_based || false,
            location_district: selectedCategoryInfo.location_district || null,
            icon: selectedCategoryInfo.icon || null,
            cate_img: selectedCategoryInfo.cate_img || selectedCategoryInfo.icon || null
          } : null
          // 添加更多分类相关信息，包括图标URL
        };
        common_vendor.index.__f__("log", "at pages/fabu/fabu.vue:507", "发布数据:", {
          基础信息: {
            用户ID: params.user_id,
            文章内容: params.content,
            分类ID: params.cate_id,
            分类信息: params.category_info,
            是否位置分类: params.is_location_based_category
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
          视频信息: params.videoURL ? params.videoURL : "无视频"
        });
        const res = await articleApi.addArticle(params);
        if (res.id) {
          common_vendor.index.showToast({
            title: "发布成功",
            icon: "success"
          });
          common_vendor.index.showToast({
            title: "发布成功",
            icon: "success",
            duration: 1500,
            success: () => {
              setTimeout(() => {
                common_vendor.index.navigateBack({
                  delta: 1,
                  success: () => {
                    common_vendor.index.$emit("globalRefresh", {
                      timestamp: Date.now(),
                      pages: ["index", "userArticleList"]
                    });
                    common_vendor.index.__f__("log", "at pages/fabu/fabu.vue:556", "触发全局刷新事件");
                  }
                });
              }, 1500);
            }
          });
        } else {
          throw new Error(res.message || "发布失败");
        }
      } catch (err) {
        common_vendor.index.__f__("error", "at pages/fabu/fabu.vue:566", "发布失败:", err);
        common_vendor.index.showToast({
          title: err.message || "发布失败，请重试",
          icon: "none"
        });
      } finally {
        common_vendor.index.hideLoading();
      }
    };
    const selectCategory = (index) => {
      cateIndex.value = index;
      selectedCategory.value = categoryList.value[index]._id;
      common_vendor.index.__f__("log", "at pages/fabu/fabu.vue:587", "选择分类:", categoryList.value[index].cate_name);
    };
    const focusTextarea = () => {
      common_vendor.index.hideKeyboard();
      setTimeout(() => {
        textareaFocus.value = true;
      }, 50);
    };
    const handleGenerateIcon = async (category) => {
      try {
        common_vendor.index.showLoading({
          title: "生成图标中...",
          mask: false
        });
        const tempResult = await generateTempCategoryIcon(category.cate_name);
        if (tempResult && tempResult.tempFilePath) {
          currentEditingCategory = category;
          previewImageUrl.value = tempResult.tempFilePath;
          await saveCustomIcon();
        } else {
          throw new Error("生成临时图标失败");
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/fabu/fabu.vue:630", "生成图标失败:", error);
        common_vendor.index.showToast({
          title: "生成图标失败",
          icon: "none"
        });
      } finally {
        common_vendor.index.hideLoading();
      }
    };
    const generateTempCategoryIcon = async (categoryName) => {
      try {
        common_vendor.index.showLoading({
          title: "生成预览中...",
          mask: false
        });
        const getColorFromName = (name) => {
          let hash = 0;
          for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
          }
          const h = Math.abs(hash) % 360;
          const s = 40 + Math.abs(hash) % 30;
          const l = 75 + Math.abs(hash) % 15;
          const foregroundColor = l > 65 ? "#333333" : "#FFFFFF";
          return {
            background: `hsl(${h}, ${s}%, ${l}%)`,
            foreground: foregroundColor
          };
        };
        const colors = getColorFromName(categoryName);
        const canvasSize = 200;
        const iconSize = canvasSize;
        const canvas = common_vendor.index.createOffscreenCanvas({
          type: "2d",
          width: iconSize,
          height: iconSize
        });
        const ctx = canvas.getContext("2d");
        ctx.fillStyle = colors.background;
        ctx.fillRect(0, 0, iconSize, iconSize);
        ctx.strokeStyle = "rgba(0,0,0,0.1)";
        ctx.lineWidth = 2;
        ctx.strokeRect(2, 2, iconSize - 4, iconSize - 4);
        const firstChar = categoryName.charAt(0);
        ctx.fillStyle = colors.foreground;
        const fontSize = iconSize / 2 * (textSize.value / 100);
        ctx.font = `bold ${fontSize}px sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        const textX = iconSize / 2 + textOffsetX.value * iconSize / 100;
        const textY = iconSize / 2 + textOffsetY.value * iconSize / 100;
        ctx.fillText(firstChar, textX, textY);
        const tempFilePath = await new Promise((resolve, reject) => {
          const buffer = canvas.toDataURL("image/png");
          const fs = common_vendor.index.getFileSystemManager();
          const tempFilePath2 = `${common_vendor.index.env.USER_DATA_PATH}/temp_category_icon_${Date.now()}.png`;
          const base64Data = buffer.replace(/^data:image\/\w+;base64,/, "");
          fs.writeFile({
            filePath: tempFilePath2,
            data: base64Data,
            encoding: "base64",
            success: () => resolve(tempFilePath2),
            fail: (err) => reject(new Error(`保存临时文件失败: ${JSON.stringify(err)}`))
          });
        });
        common_vendor.index.hideLoading();
        return {
          tempFilePath,
          colors
        };
      } catch (error) {
        common_vendor.index.hideLoading();
        common_vendor.index.__f__("error", "at pages/fabu/fabu.vue:736", "生成临时图标失败:", error);
        return null;
      }
    };
    const retryGetCategories = () => {
      common_vendor.index.showToast({
        title: "正在重新获取分类...",
        icon: "loading",
        duration: 2e3
      });
      setTimeout(() => {
        getLocaAndCate();
      }, 1e3);
    };
    common_vendor.onMounted(() => {
      getLocaAndCate().catch((err) => {
        common_vendor.index.__f__("error", "at pages/fabu/fabu.vue:756", "onMounted获取分类失败:", err);
        common_vendor.index.showModal({
          title: "提示",
          content: "获取分类失败，是否重试？",
          success: (res) => {
            if (res.confirm) {
              retryGetCategories();
            }
          }
        });
      });
    });
    const createNewCategoryIcon = () => {
      if (categoryList.value.length === 0) {
        common_vendor.index.showToast({
          title: "没有可用分类",
          icon: "none",
          duration: 2e3
        });
        return;
      }
      if (categoryList.value[cateIndex.value]) {
        handleGenerateIcon(categoryList.value[cateIndex.value]);
      } else {
        common_vendor.index.showToast({
          title: "请先选择一个分类",
          icon: "none",
          duration: 2e3
        });
      }
    };
    const handleLineChange = (e) => {
      const lineCount = e.detail.lineCount || 0;
      inputHeight.value = Math.max(170, lineCount * 40);
      adjustScrollPosition();
    };
    const enableCursorDrag = (e) => {
      common_vendor.index.__f__("log", "at pages/fabu/fabu.vue:830", "启用光标拖动模式");
      try {
        if (contentTextarea.value) {
          textareaFocus.value = true;
          setTimeout(() => {
            common_vendor.index.showActionSheet({
              itemList: ["选择", "全选", "复制", "粘贴"],
              success: (res) => {
                switch (res.tapIndex) {
                  case 0:
                    break;
                  case 1:
                    selectionStart.value = 0;
                    selectionEnd.value = content.value.length;
                    break;
                  case 2:
                    common_vendor.index.setClipboardData({
                      data: content.value.substring(selectionStart.value, selectionEnd.value),
                      success: () => {
                        common_vendor.index.showToast({
                          title: "已复制",
                          icon: "success",
                          duration: 1500
                        });
                      }
                    });
                    break;
                  case 3:
                    common_vendor.index.getClipboardData({
                      success: (res2) => {
                        if (res2.data) {
                          insertTextAtCursor(res2.data);
                          common_vendor.index.showToast({
                            title: "已粘贴",
                            icon: "success",
                            duration: 1500
                          });
                        }
                      }
                    });
                    break;
                }
              }
            });
          }, 200);
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/fabu/fabu.vue:885", "启用光标拖动失败:", error);
      }
    };
    const updateIconPreview = async () => {
      if (!currentEditingCategory)
        return;
      try {
        const tempResult = await generateTempCategoryIcon(currentEditingCategory.cate_name);
        if (tempResult && tempResult.tempFilePath) {
          previewImageUrl.value = tempResult.tempFilePath;
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/fabu/fabu.vue:899", "更新预览失败:", error);
      }
    };
    const saveCustomIcon = async () => {
      if (!currentEditingCategory || !previewImageUrl.value) {
        common_vendor.index.showToast({
          title: "没有可保存的图标",
          icon: "none"
        });
        return;
      }
      try {
        common_vendor.index.showLoading({
          title: "保存中...",
          mask: false
        });
        const uploadResult = await extStorageCo.getUploadFileOptions({
          cloudPath: `categories/${currentEditingCategory._id || Date.now()}.png`,
          fileType: "image",
          isOriginal: true
        });
        const uploadRes = await common_vendor.index.uploadFile({
          ...uploadResult.uploadFileOptions,
          filePath: previewImageUrl.value,
          name: "file"
        });
        if (uploadRes.statusCode !== 200) {
          throw new Error(`上传失败: ${uploadRes.statusCode}`);
        }
        const iconURL = uploadResult.fileURL;
        const thumbnailURL = uploadResult.thumbnailURL;
        if (currentEditingCategory._id) {
          try {
            const updateResult = await extStorageCo.updateCategoryIcon({
              categoryId: currentEditingCategory._id,
              iconURL,
              thumbnailURL
            }).catch((err) => {
              common_vendor.index.__f__("warn", "at pages/fabu/fabu.vue:950", "云函数updateCategoryIcon可能未部署或不可用:", err);
              return { updated: false, error: err.message };
            });
            if (updateResult && updateResult.updated) {
              common_vendor.index.__f__("log", "at pages/fabu/fabu.vue:956", "更新分类图标结果:", updateResult);
              currentEditingCategory.icon = iconURL;
              currentEditingCategory.cate_img = iconURL;
              currentEditingCategory.cate_img_thumbnail = thumbnailURL;
              iconCustomizing.value = false;
              common_vendor.index.showToast({
                title: "图标保存成功",
                icon: "success"
              });
            } else {
              common_vendor.index.__f__("warn", "at pages/fabu/fabu.vue:972", "更新分类图标未成功，但图标已生成:", { iconURL, thumbnailURL });
              currentEditingCategory.icon = iconURL;
              currentEditingCategory.cate_img = iconURL;
              currentEditingCategory.cate_img_thumbnail = thumbnailURL;
              iconCustomizing.value = false;
              common_vendor.index.showToast({
                title: "图标已生成",
                icon: "success"
              });
            }
          } catch (updateError) {
            common_vendor.index.__f__("error", "at pages/fabu/fabu.vue:989", "更新分类图标数据库记录失败:", updateError);
            currentEditingCategory.icon = iconURL;
            currentEditingCategory.cate_img = iconURL;
            currentEditingCategory.cate_img_thumbnail = thumbnailURL;
            iconCustomizing.value = false;
            common_vendor.index.showToast({
              title: "图标已生成，但未更新数据库",
              icon: "none"
            });
          }
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/fabu/fabu.vue:1006", "保存图标失败:", error);
        common_vendor.index.showToast({
          title: "保存图标失败",
          icon: "none"
        });
      } finally {
        common_vendor.index.hideLoading();
      }
    };
    const cancelCustomize = () => {
      iconCustomizing.value = false;
      currentEditingCategory = null;
      previewImageUrl.value = "";
    };
    const adjustScrollPosition = () => {
      common_vendor.nextTick$1(() => {
        common_vendor.index.getWindowInfo().windowHeight;
        const targetPosition = inputHeight.value + 200;
        common_vendor.index.pageScrollTo({
          scrollTop: targetPosition,
          duration: 100
        });
      });
    };
    const insertTextAtCursor = (textToInsert) => {
      if (!content.value)
        content.value = "";
      const before = content.value.substring(0, selectionStart.value);
      const after = content.value.substring(selectionEnd.value);
      content.value = before + textToInsert + after;
      common_vendor.nextTick$1(() => {
        const newPosition = selectionStart.value + textToInsert.length;
        selectionStart.value = newPosition;
        selectionEnd.value = newPosition;
        if (contentTextarea.value) {
          textareaFocus.value = true;
        }
      });
    };
    const handleSelectionChange = (e) => {
      selectionStart.value = e.detail.selectionStart || 0;
      selectionEnd.value = e.detail.selectionEnd || 0;
    };
    return (_ctx, _cache) => {
      return common_vendor.e({}, {
        f: categoryList.value.length > 0 && categoryList.value[cateIndex.value] && !categoryList.value[cateIndex.value].cate_img_thumbnail
      }, categoryList.value.length > 0 && categoryList.value[cateIndex.value] && !categoryList.value[cateIndex.value].cate_img_thumbnail ? {
        g: common_vendor.p({
          type: "plus",
          size: "30",
          color: "#2196F3"
        }),
        h: common_vendor.o(createNewCategoryIcon)
      } : {}, {
        i: common_vendor.f(categoryList.value, (item, index, i0) => {
          return common_vendor.e({
            a: item.icon,
            b: index === cateIndex.value
          }, index === cateIndex.value ? {
            c: "0b7d0eba-2-" + i0,
            d: common_vendor.p({
              type: "checkmarkempty",
              size: "16",
              color: "#fff"
            })
          } : {}, {
            e: item.is_location_based
          }, item.is_location_based ? {
            f: "0b7d0eba-3-" + i0,
            g: common_vendor.p({
              type: "location",
              size: "12",
              color: "#2196F3"
            })
          } : {}, {
            h: common_vendor.t(item.cate_name),
            i: index,
            j: index === cateIndex.value ? 1 : "",
            k: item.is_location_based ? 1 : "",
            l: common_vendor.o(($event) => selectCategory(index))
          });
        }),
        j: categoryList.value.length === 0 || categoryList.value[0]._id === "default"
      }, categoryList.value.length === 0 || categoryList.value[0]._id === "default" ? {
        k: common_vendor.p({
          type: "refresh",
          size: "16",
          color: "#ff6600"
        }),
        l: common_vendor.o(retryGetCategories)
      } : {}, {
        m: textareaFocus.value,
        n: common_vendor.o(($event) => textareaFocus.value = false),
        o: selectionStart.value,
        p: selectionEnd.value,
        q: common_vendor.o(() => {
        }),
        r: common_vendor.o(handleLineChange),
        s: common_vendor.o([($event) => content.value = $event.detail.value, handleLineChange]),
        t: common_vendor.o(handleSelectionChange),
        v: common_vendor.o(enableCursorDrag),
        w: content.value,
        x: inputHeight.value + "rpx",
        y: common_vendor.o(focusTextarea),
        z: common_vendor.f(imageList.value, (image, index, i0) => {
          return common_vendor.e({
            a: image.thumbnailURL,
            b: "0b7d0eba-5-" + i0,
            c: common_vendor.o(($event) => deleteImage(index)),
            d: image.progress < 100
          }, image.progress < 100 ? {
            e: common_vendor.t(image.progress.toFixed(0)),
            f: image.progress + "%"
          } : {}, {
            g: index
          });
        }),
        A: common_vendor.p({
          type: "close",
          size: "20",
          color: "#fff"
        }),
        B: common_vendor.p({
          type: "plusempty",
          size: "30",
          color: "#999"
        }),
        C: common_vendor.o(chooseAndUploadImage),
        D: videoInfo.value
      }, videoInfo.value ? {
        E: common_vendor.t(videoInfo.value),
        F: common_vendor.p({
          type: "close",
          size: "20",
          color: "#fff"
        }),
        G: common_vendor.o(deleteVideo)
      } : {
        H: videoLink.value,
        I: common_vendor.o(($event) => videoLink.value = $event.detail.value),
        J: common_vendor.o(addVideoLink)
      }, {
        K: common_vendor.o(submitForm),
        L: iconCustomizing.value
      }, iconCustomizing.value ? {
        M: common_vendor.p({
          type: "close",
          size: "20",
          color: "#666"
        }),
        N: common_vendor.o(cancelCustomize),
        O: previewImageUrl.value,
        P: textOffsetX.value + 50,
        Q: common_vendor.o((e) => {
          textOffsetX.value = e.detail.value - 50;
          updateIconPreview();
        }),
        R: textOffsetY.value + 50,
        S: common_vendor.o((e) => {
          textOffsetY.value = e.detail.value - 50;
          updateIconPreview();
        }),
        T: textSize.value,
        U: common_vendor.o((e) => {
          textSize.value = e.detail.value;
          updateIconPreview();
        }),
        V: common_vendor.o(cancelCustomize),
        W: common_vendor.o(saveCustomIcon)
      } : {});
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-0b7d0eba"]]);
tt.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-toutiao/pages/fabu/fabu.js.map
