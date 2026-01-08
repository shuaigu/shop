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
  __name: "dianzan",
  props: {
    articleId: {
      type: String,
      required: true
    },
    userId: {
      type: String,
      required: true
    },
    initialLikeCount: {
      type: Number,
      default: 0
    },
    initialIsLiked: {
      type: Boolean,
      default: false
    },
    size: {
      type: [Number, String],
      default: 24
    },
    color: {
      type: String,
      default: "#444444"
    },
    showCount: {
      type: Boolean,
      default: true
    },
    showText: {
      type: Boolean,
      default: false
    },
    userAvatar: {
      type: String,
      default: ""
    },
    userNickname: {
      type: String,
      default: ""
    }
  },
  emits: ["likeChange", "luckyUser"],
  setup(__props, { emit: __emit }) {
    const props = __props;
    const emit = __emit;
    const isLiked = common_vendor.ref(false);
    const likeCount = common_vendor.ref(0);
    const isLikeAnimating = common_vendor.ref(false);
    const isProcessing = common_vendor.ref(false);
    const lastClickTime = common_vendor.ref(0);
    common_vendor.ref(false);
    const likeRank = common_vendor.ref(1);
    const isWinner = common_vendor.ref(false);
    const updateLikeStatus = (data) => {
      if (data.articleId === props.articleId) {
        console.log("收到点赞状态更新事件:", {
          articleId: data.articleId,
          oldLikeState: isLiked.value,
          newLikeState: data.isLiked,
          oldLikeCount: likeCount.value,
          newLikeCount: data.likeCount
        });
        isLiked.value = data.isLiked;
        likeCount.value = data.likeCount;
        if (data.likeRank) {
          likeRank.value = data.likeRank;
        }
        if (data.isWinner !== void 0) {
          isWinner.value = data.isWinner;
        }
      }
    };
    const debounceHandleLike = () => {
      const now = Date.now();
      if (now - lastClickTime.value < 500 || isProcessing.value) {
        console.log("点击过于频繁或正在处理中，忽略此次点击");
        return;
      }
      lastClickTime.value = now;
      if (common_vendor.index.vibrateShort) {
        common_vendor.index.vibrateShort({
          success: () => {
          }
        });
      }
      handleLike();
    };
    const checkLogin = async () => {
      try {
        if (props.userId) {
          return true;
        }
        common_vendor.index.showToast({
          title: "请先登录",
          icon: "none",
          duration: 2e3
        });
        setTimeout(() => {
          const currentRoute = `/pages/article/articleDetail?article_id=${props.articleId}`;
          const redirectUrl = encodeURIComponent(currentRoute);
          common_vendor.index.navigateTo({
            url: `/pages/login/login?redirect=${redirectUrl}`,
            fail: (err) => {
              console.error("跳转登录页失败:", err);
              common_vendor.index.redirectTo({
                url: `/pages/login/login?redirect=${redirectUrl}`
              });
            }
          });
        }, 500);
        return false;
      } catch (err) {
        console.error("登录检查失败:", err);
        common_vendor.index.showToast({
          title: "登录检查失败，请重试",
          icon: "none",
          duration: 2e3
        });
        return false;
      }
    };
    const handleError = (err, message = "操作失败") => {
      var _a, _b, _c;
      console.error(message, err);
      common_vendor.index.showToast({
        title: (err == null ? void 0 : err.message) || message,
        icon: "none",
        duration: 2e3
      });
      if (((_a = err == null ? void 0 : err.message) == null ? void 0 : _a.includes("request:fail")) || ((_b = err == null ? void 0 : err.message) == null ? void 0 : _b.includes("网络")) || ((_c = err == null ? void 0 : err.message) == null ? void 0 : _c.includes("timeout"))) {
        common_vendor.index.showToast({
          title: "网络连接失败，请检查网络设置",
          icon: "none",
          duration: 2e3
        });
      }
    };
    const handleLike = async () => {
      if (isProcessing.value)
        return;
      try {
        isProcessing.value = true;
        console.log("点赞操作开始:", {
          articleId: props.articleId,
          userId: props.userId,
          currentLikeState: isLiked.value,
          currentLikeCount: likeCount.value
        });
        const isLoggedIn = await checkLogin();
        if (!isLoggedIn) {
          isProcessing.value = false;
          return;
        }
        const previousLikeState = isLiked.value;
        const previousLikeCount = likeCount.value;
        common_vendor.index.showLoading({
          title: "处理中...",
          mask: true
        });
        try {
          const likeApi = common_vendor.tr.importObject("likeRecord", { customUI: true });
          console.log("调用服务器点赞接口:", {
            articleId: props.articleId,
            userId: props.userId
          });
          const result = await likeApi.toggleLike(props.articleId, props.userId);
          console.log("服务器点赞结果:", result);
          common_vendor.index.hideLoading();
          if (result.code === 0) {
            isLiked.value = result.isLiked;
            likeCount.value = result.like_count;
            console.log("已更新到服务器状态:", {
              isLiked: isLiked.value,
              likeCount: likeCount.value
            });
            if (isLiked.value && !previousLikeState && result.like_rank) {
              likeRank.value = result.like_rank || 1;
            }
            if (isLiked.value && !previousLikeState) {
              isLikeAnimating.value = true;
              setTimeout(() => {
                isLikeAnimating.value = false;
              }, 400);
            }
            emit("likeChange", {
              isLiked: isLiked.value,
              likeCount: likeCount.value,
              likeRank: likeRank.value,
              isWinner: false
            });
            common_vendor.index.$emit("updateArticleLikeStatus", {
              articleId: props.articleId,
              isLiked: isLiked.value,
              likeCount: likeCount.value,
              likeRank: likeRank.value,
              isWinner: false
            });
            common_vendor.index.showToast({
              title: isLiked.value ? "已点赞" : "已取消点赞",
              icon: "none",
              duration: 1e3,
              mask: false
            });
          } else {
            console.warn("服务器操作失败:", result);
            throw new Error(result.message || "操作失败");
          }
        } catch (err) {
          console.error("服务器请求失败:", err);
          handleError(err, "点赞操作失败");
        }
      } catch (err) {
        console.error("点赞处理失败:", err);
        handleError(err, "点赞处理失败");
      } finally {
        common_vendor.index.hideLoading();
        isProcessing.value = false;
        console.log("点赞操作结束，当前状态:", {
          isLiked: isLiked.value,
          likeCount: likeCount.value,
          isProcessing: isProcessing.value
        });
      }
    };
    common_vendor.onMounted(() => {
      isLiked.value = props.initialIsLiked;
      likeCount.value = props.initialLikeCount;
      common_vendor.index.$on("updateArticleLikeStatus", updateLikeStatus);
      console.log("点赞组件创建:", {
        articleId: props.articleId,
        userId: props.userId,
        initialIsLiked: props.initialIsLiked,
        initialLikeCount: props.initialLikeCount,
        isLiked: isLiked.value,
        likeCount: likeCount.value
      });
    });
    common_vendor.watch(() => props.initialIsLiked, (newValue, oldValue) => {
      console.log("initialIsLiked 变化:", {
        old: oldValue,
        new: newValue,
        currentIsLiked: isLiked.value,
        articleId: props.articleId
      });
      isLiked.value = newValue;
    });
    common_vendor.watch(() => props.initialLikeCount, (newValue, oldValue) => {
      console.log("initialLikeCount 变化:", {
        old: oldValue,
        new: newValue,
        currentLikeCount: likeCount.value,
        articleId: props.articleId
      });
      likeCount.value = newValue;
    });
    common_vendor.onBeforeUnmount(() => {
      common_vendor.index.$off("updateArticleLikeStatus", updateLikeStatus);
    });
    return (_ctx, _cache) => {
      return {
        a: common_vendor.p({
          type: isLiked.value ? "heart-filled" : "heart",
          size: __props.size,
          color: isLiked.value ? "#FF5D5B" : __props.color
        }),
        b: isLiked.value ? 1 : "",
        c: common_vendor.t(isLiked.value ? "已点赞" : "点赞"),
        d: isLiked.value ? 1 : "",
        e: common_vendor.o(debounceHandleLike),
        f: isLikeAnimating.value ? 1 : "",
        g: common_vendor.gei(_ctx, "")
      };
    };
  }
};
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-304aeb49"]]);
ks.createComponent(Component);
