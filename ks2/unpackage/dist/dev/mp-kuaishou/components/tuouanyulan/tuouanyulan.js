"use strict";
const common_vendor = require("../../common/vendor.js");
const minScale = 0.8;
const maxScale = 5;
const doubleClickInterval = 300;
const swipeThreshold = 80;
const _sfc_main = {
  __name: "tuouanyulan",
  props: {
    // 图片列表
    images: {
      type: Array,
      default: () => []
    },
    // 当前显示的图片索引
    current: {
      type: [Number, String],
      default: 0
    },
    // 是否可见
    visible: {
      type: Boolean,
      default: false
    }
  },
  emits: ["close", "change"],
  setup(__props, { emit: __emit }) {
    const props = __props;
    const emit = __emit;
    const currentIndex = common_vendor.ref(Number(props.current) || 0);
    const imageScale = common_vendor.ref(1);
    const imageOffset = common_vendor.reactive({
      x: 0,
      y: 0
    });
    const lastClickTime = common_vendor.ref(0);
    const touchStartX = common_vendor.ref(0);
    const touchStartY = common_vendor.ref(0);
    const touchDistance = common_vendor.ref(0);
    const lastTouchDistance = common_vendor.ref(0);
    const startScale = common_vendor.ref(1);
    const isZooming = common_vendor.ref(false);
    const isTransitioning = common_vendor.ref(false);
    const imageLoaded = common_vendor.ref({});
    const imageLoadError = common_vendor.ref({});
    const preloadedImages = common_vendor.ref({});
    const showDoubleTapHint = common_vendor.ref(false);
    const swiperDuration = common_vendor.ref(300);
    const isLoopAnimating = common_vendor.ref(false);
    const swiperAnimationClass = common_vendor.ref("");
    const initialTouchX = common_vendor.ref(0);
    const currentTouchX = common_vendor.ref(0);
    const swipeProgress = common_vendor.ref(0);
    const isSwipingHorizontal = common_vendor.ref(false);
    const imageList = common_vendor.computed(() => {
      if (!props.images || !Array.isArray(props.images))
        return [];
      return props.images.map((item) => {
        if (typeof item === "string")
          return item;
        if (item.url)
          return item.url;
        if (item.compressedURL)
          return item.compressedURL;
        return "";
      }).filter((url) => url);
    });
    common_vendor.watch(() => props.current, (newVal) => {
      currentIndex.value = Number(newVal) || 0;
      preloadAdjacentImages(currentIndex.value);
    });
    common_vendor.watch(() => props.visible, (newVal) => {
      if (newVal) {
        resetZoom();
        showDoubleTapHint.value = true;
        setTimeout(() => {
          showDoubleTapHint.value = false;
        }, 3e3);
        common_vendor.nextTick$1(() => {
          preloadAllImages();
        });
      }
    });
    const disablePageScroll = () => {
      common_vendor.index.pageScrollTo({
        scrollTop: 0,
        duration: 0
      });
    };
    common_vendor.onMounted(() => {
      if (props.visible) {
        disablePageScroll();
      }
    });
    common_vendor.onUnmounted(() => {
      resetZoom();
    });
    const preloadAdjacentImages = (index) => {
      const totalImages = imageList.value.length;
      if (totalImages <= 1)
        return;
      preloadImage(imageList.value[index]);
      const nextIndex = (index + 1) % totalImages;
      preloadImage(imageList.value[nextIndex]);
      const prevIndex = (index - 1 + totalImages) % totalImages;
      preloadImage(imageList.value[prevIndex]);
      if (index === 0) {
        preloadImage(imageList.value[totalImages - 1]);
      } else if (index === totalImages - 1) {
        preloadImage(imageList.value[0]);
      }
    };
    const preloadImage = (url) => {
      if (!url || preloadedImages.value[url])
        return;
      const img = new Image();
      img.src = url;
      img.onload = () => {
        preloadedImages.value[url] = true;
      };
      img.onerror = () => {
        console.warn("预加载图片失败:", url);
      };
      common_vendor.index.getImageInfo({
        src: url,
        success: () => {
          preloadedImages.value[url] = true;
        },
        fail: () => {
          console.warn("预加载图片失败:", url);
        }
      });
    };
    const preloadAllImages = () => {
      if (!imageList.value.length)
        return;
      imageList.value.forEach((url) => {
        preloadImage(url);
      });
    };
    const getImageTransform = (index) => {
      if (index !== currentIndex.value)
        return "scale(1)";
      const scale = `scale(${imageScale.value})`;
      const translate = `translate(${imageOffset.x}px, ${imageOffset.y}px)`;
      return `${translate} ${scale}`;
    };
    const handleImageLoaded = (index) => {
      imageLoaded.value[index] = true;
      imageLoadError.value[index] = false;
      if (index === currentIndex.value) {
        preloadAdjacentImages(index);
      }
    };
    const handleSwiperAnimationStart = (e) => {
      const total = imageList.value.length;
      if (total <= 1)
        return;
      const from = e.detail.from;
      const to = e.detail.to;
      if (from === total - 1 && to === 0) {
        swiperAnimationClass.value = "loop-right";
        isLoopAnimating.value = true;
      } else if (from === 0 && to === total - 1) {
        swiperAnimationClass.value = "loop-left";
        isLoopAnimating.value = true;
      } else {
        swiperAnimationClass.value = "";
        isLoopAnimating.value = false;
      }
    };
    const handleSwiperAnimationEnd = () => {
      setTimeout(() => {
        swiperAnimationClass.value = "";
        isLoopAnimating.value = false;
      }, 50);
    };
    const handleSwiperChange = (e) => {
      const newIndex = e.detail.current;
      currentIndex.value = newIndex;
      emit("change", newIndex);
      resetZoom();
      preloadAdjacentImages(newIndex);
      setTimeout(() => {
        handleSwiperAnimationEnd();
      }, swiperDuration.value);
    };
    const goToNextImage = () => {
      if (isZooming.value || isLoopAnimating.value)
        return;
      const total = imageList.value.length;
      if (total <= 1)
        return;
      const nextIndex = (currentIndex.value + 1) % total;
      currentIndex.value = nextIndex;
      emit("change", nextIndex);
      if (nextIndex === 0) {
        swiperAnimationClass.value = "loop-right";
        isLoopAnimating.value = true;
        setTimeout(() => {
          handleSwiperAnimationEnd();
        }, swiperDuration.value);
      }
    };
    const goToPrevImage = () => {
      if (isZooming.value || isLoopAnimating.value)
        return;
      const total = imageList.value.length;
      if (total <= 1)
        return;
      const prevIndex = (currentIndex.value - 1 + total) % total;
      currentIndex.value = prevIndex;
      emit("change", prevIndex);
      if (prevIndex === total - 1 && currentIndex.value === 0) {
        swiperAnimationClass.value = "loop-left";
        isLoopAnimating.value = true;
        setTimeout(() => {
          handleSwiperAnimationEnd();
        }, swiperDuration.value);
      }
    };
    const resetZoom = () => {
      imageScale.value = 1;
      imageOffset.x = 0;
      imageOffset.y = 0;
      isZooming.value = false;
      transitionTemp();
    };
    const transitionTemp = () => {
      isTransitioning.value = true;
      setTimeout(() => {
        isTransitioning.value = false;
      }, 300);
    };
    const handleClose = () => {
      resetZoom();
      emit("close");
    };
    const handleSave = () => {
      if (imageList.value.length === 0 || currentIndex.value >= imageList.value.length) {
        common_vendor.index.showToast({
          title: "没有可保存的图片",
          icon: "none"
        });
        return;
      }
      const currentImage = imageList.value[currentIndex.value];
      common_vendor.index.showLoading({
        title: "保存中..."
      });
      common_vendor.index.downloadFile({
        url: currentImage,
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
                console.error("保存图片失败:", err);
                if (err.errMsg && err.errMsg.indexOf("authorize") > -1) {
                  common_vendor.index.showModal({
                    title: "提示",
                    content: "需要您授权保存图片到相册",
                    success: (res2) => {
                      if (res2.confirm) {
                        common_vendor.index.openSetting({
                          success: (settingRes) => {
                            console.log("设置页面打开成功");
                          }
                        });
                      }
                    }
                  });
                } else {
                  common_vendor.index.showToast({
                    title: "保存失败",
                    icon: "none"
                  });
                }
              }
            });
          } else {
            common_vendor.index.hideLoading();
            common_vendor.index.showToast({
              title: "下载图片失败",
              icon: "none"
            });
          }
        },
        fail: (err) => {
          common_vendor.index.hideLoading();
          console.error("下载图片失败:", err);
          common_vendor.index.showToast({
            title: "下载图片失败",
            icon: "none"
          });
        }
      });
    };
    const handleImageError = (index) => {
      console.error("图片加载失败:", index);
      imageLoaded.value[index] = true;
      imageLoadError.value[index] = true;
    };
    const getDistance = (touches) => {
      if (touches.length < 2)
        return 0;
      const x1 = touches[0].pageX || touches[0].clientX;
      const y1 = touches[0].pageY || touches[0].clientY;
      const x2 = touches[1].pageX || touches[1].clientX;
      const y2 = touches[1].pageY || touches[1].clientY;
      return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    };
    const getMidpoint = (touches) => {
      if (touches.length < 2) {
        return { x: 0, y: 0 };
      }
      const x1 = touches[0].pageX || touches[0].clientX;
      const y1 = touches[0].pageY || touches[0].clientY;
      const x2 = touches[1].pageX || touches[1].clientX;
      const y2 = touches[1].pageY || touches[1].clientY;
      return {
        x: (x1 + x2) / 2,
        y: (y1 + y2) / 2
      };
    };
    let touchStartTime = 0;
    let touchEndTime = 0;
    let touchMoveCount = 0;
    const handleTouchStart = (e) => {
      if (imageScale.value > 1) {
        showDoubleTapHint.value = false;
        touchStartTime = Date.now();
        touchMoveCount = 0;
        if (e.touches.length === 1) {
          touchStartX.value = e.touches[0].pageX || e.touches[0].clientX;
          touchStartY.value = e.touches[0].pageY || e.touches[0].clientY;
          lastTouchDistance.value = 0;
        } else if (e.touches.length === 2) {
          touchDistance.value = getDistance(e.touches);
          lastTouchDistance.value = touchDistance.value;
          startScale.value = imageScale.value;
        }
        return;
      }
      if (e.touches.length === 1 && !isZooming.value) {
        initialTouchX.value = e.touches[0].pageX || e.touches[0].clientX;
        currentTouchX.value = initialTouchX.value;
        isSwipingHorizontal.value = false;
        swipeProgress.value = 0;
      }
    };
    const handleImageTouchMove = (e) => {
      touchMoveCount++;
      if (imageScale.value > 1 || isZooming.value) {
        if (e.touches.length === 1) {
          const currentX = e.touches[0].pageX || e.touches[0].clientX;
          const currentY = e.touches[0].pageY || e.touches[0].clientY;
          const moveX = currentX - touchStartX.value;
          const moveY = currentY - touchStartY.value;
          touchStartX.value = currentX;
          touchStartY.value = currentY;
          const maxOffsetX = (imageScale.value - 1) * 200;
          const maxOffsetY = (imageScale.value - 1) * 200;
          imageOffset.x = Math.min(maxOffsetX, Math.max(-maxOffsetX, imageOffset.x + moveX));
          imageOffset.y = Math.min(maxOffsetY, Math.max(-maxOffsetY, imageOffset.y + moveY));
          isZooming.value = true;
          e.stopPropagation();
          e.preventDefault();
        } else if (e.touches.length === 2) {
          const newDistance = getDistance(e.touches);
          if (lastTouchDistance.value > 0) {
            const scale = newDistance / lastTouchDistance.value;
            let newScale = imageScale.value * scale;
            newScale = Math.min(maxScale, Math.max(minScale, newScale));
            getMidpoint(e.touches);
            imageScale.value = newScale;
            isZooming.value = true;
          }
          lastTouchDistance.value = newDistance;
          e.stopPropagation();
          e.preventDefault();
        }
        return;
      }
      if (e.touches.length === 1 && !isZooming.value) {
        const currentX = e.touches[0].pageX || e.touches[0].clientX;
        const currentY = e.touches[0].pageY || e.touches[0].clientY;
        const deltaX = currentX - initialTouchX.value;
        const deltaY = Math.abs(currentY - touchStartY.value);
        if (Math.abs(deltaX) > deltaY && Math.abs(deltaX) > 10) {
          isSwipingHorizontal.value = true;
          currentTouchX.value = currentX;
          swipeProgress.value = Math.max(-1, Math.min(1, deltaX / 300));
          e.preventDefault();
          e.stopPropagation();
        }
      }
    };
    const handleTouchEnd = (e) => {
      touchEndTime = Date.now();
      const touchDuration = touchEndTime - touchStartTime;
      if (imageScale.value > 1) {
        const maxOffsetX = (imageScale.value - 1) * 200;
        const maxOffsetY = (imageScale.value - 1) * 200;
        const needBounce = Math.abs(imageOffset.x) > maxOffsetX || Math.abs(imageOffset.y) > maxOffsetY;
        if (needBounce) {
          isTransitioning.value = true;
          imageOffset.x = Math.min(maxOffsetX, Math.max(-maxOffsetX, imageOffset.x));
          imageOffset.y = Math.min(maxOffsetY, Math.max(-maxOffsetY, imageOffset.y));
          setTimeout(() => {
            isTransitioning.value = false;
          }, 300);
        }
      } else {
        if (isSwipingHorizontal.value) {
          const deltaX = currentTouchX.value - initialTouchX.value;
          if (Math.abs(deltaX) > swipeThreshold) {
            if (deltaX > 0) {
              goToPrevImage();
            } else {
              goToNextImage();
            }
          }
          isSwipingHorizontal.value = false;
          swipeProgress.value = 0;
        } else if (touchMoveCount < 5 && touchDuration < 200) {
          if (touchDuration < doubleClickInterval && Date.now() - lastClickTime.value < doubleClickInterval) {
            handleImageDoubleClick(e);
          } else {
            handleImageClick();
          }
          lastClickTime.value = Date.now();
        }
      }
      lastTouchDistance.value = 0;
    };
    const handleImageClick = (e) => {
      const now = Date.now();
      if (now - lastClickTime.value < doubleClickInterval) {
        return;
      }
      lastClickTime.value = now;
      if (imageScale.value > 1) {
        resetZoom();
      }
    };
    const handleImageDoubleClick = (e) => {
      var _a, _b, _c, _d;
      e.detail.x || ((_b = (_a = e.touches) == null ? void 0 : _a[0]) == null ? void 0 : _b.pageX) || 0;
      e.detail.y || ((_d = (_c = e.touches) == null ? void 0 : _c[0]) == null ? void 0 : _d.pageY) || 0;
      if (imageScale.value > 1) {
        resetZoom();
      } else {
        imageScale.value = 2.5;
        isZooming.value = true;
        transitionTemp();
      }
    };
    const toggleZoom = () => {
      if (imageScale.value > 1) {
        resetZoom();
      } else {
        imageScale.value = 2.5;
        isZooming.value = true;
        transitionTemp();
      }
    };
    const handleTouchMove = (e) => {
      if (isZooming.value)
        return;
      e.preventDefault();
      e.stopPropagation();
    };
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: __props.visible
      }, __props.visible ? common_vendor.e({
        b: common_vendor.o(handleClose),
        c: isSwipingHorizontal.value && !isZooming.value
      }, isSwipingHorizontal.value && !isZooming.value ? {
        d: `translateX(${swipeProgress.value * 100}px)`
      } : {}, {
        e: common_vendor.f(imageList.value, (item, index, i0) => {
          return common_vendor.e({
            a: item,
            b: getImageTransform(index),
            c: common_vendor.o(($event) => handleImageError(index)),
            d: common_vendor.o(($event) => handleImageLoaded(index)),
            e: !imageLoaded.value[index]
          }, !imageLoaded.value[index] ? {} : {}, {
            f: imageLoadError.value[index]
          }, imageLoadError.value[index] ? {} : {}, {
            g: index
          });
        }),
        f: isTransitioning.value ? "transform 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)" : "none",
        g: common_vendor.o(handleTouchStart),
        h: common_vendor.o(handleImageTouchMove),
        i: common_vendor.o(handleTouchEnd),
        j: common_vendor.o(handleTouchEnd),
        k: common_vendor.o(handleImageClick),
        l: common_vendor.o(handleImageDoubleClick),
        m: currentIndex.value,
        n: common_vendor.o(handleSwiperChange),
        o: common_vendor.o(handleSwiperAnimationEnd),
        p: common_vendor.o(handleSwiperAnimationStart),
        q: isZooming.value || isSwipingHorizontal.value,
        r: swiperDuration.value,
        s: common_vendor.n(swiperAnimationClass.value),
        t: imageList.value.length > 1 && !isZooming.value
      }, imageList.value.length > 1 && !isZooming.value ? {
        v: common_vendor.o(goToPrevImage),
        w: common_vendor.o(goToNextImage)
      } : {}, {
        x: common_vendor.t(currentIndex.value + 1),
        y: common_vendor.t(imageList.value.length),
        z: common_vendor.o(handleClose),
        A: !isZooming.value,
        B: common_vendor.o(handleSave),
        C: common_vendor.t(imageScale.value > 1 ? "缩小" : "放大"),
        D: common_vendor.o(toggleZoom),
        E: !isZooming.value,
        F: imageScale.value > 1
      }, imageScale.value > 1 ? {
        G: common_vendor.t(Math.floor(imageScale.value * 100))
      } : {}, {
        H: showDoubleTapHint.value
      }, showDoubleTapHint.value ? {} : {}, {
        I: common_vendor.o(handleTouchMove),
        J: common_vendor.gei(_ctx, "")
      }) : {});
    };
  }
};
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-5d636c93"]]);
ks.createComponent(Component);
