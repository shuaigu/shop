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
    const showLikeRankModal = common_vendor.ref(false);
    const likeRank = common_vendor.ref(1);
    const isWinner = common_vendor.ref(false);
    const checkIfLuckyUser = async () => {
      try {
        const likeApi = common_vendor.tr.importObject("likeRecord", { customUI: true });
        const result = await likeApi.getLikeRank(props.articleId, props.userId);
        if (result.code === 0 && result.like_rank) {
          likeRank.value = result.like_rank;
          const configResult = await likeApi.getLuckyConfig();
          let luckyRanks = [1, 8, 18];
          let isEnabled = true;
          if (configResult.code === 0 && configResult.data) {
            if (Array.isArray(configResult.data.lucky_ranks) && configResult.data.lucky_ranks.length > 0) {
              luckyRanks = configResult.data.lucky_ranks;
            }
            if (typeof configResult.data.is_enabled === "boolean") {
              isEnabled = configResult.data.is_enabled;
            }
          }
          console.log("幸运用户配置:", {
            luckyRanks,
            isEnabled,
            currentRank: likeRank.value
          });
          isWinner.value = isEnabled && luckyRanks.includes(likeRank.value);
          console.log("初始化时检查幸运用户状态:", {
            likeRank: likeRank.value,
            isWinner: isWinner.value,
            nickname: result.nickname,
            avatar: result.avatar
          });
          if (isWinner.value) {
            const resultData = result || {};
            emit("luckyUser", {
              likeRank: likeRank.value,
              isWinner: true,
              // 优先使用服务器返回的用户信息，如果没有则使用传入的信息
              avatar: resultData.avatar || props.userAvatar || "",
              nickname: resultData.nickname || props.userNickname || ""
            });
          }
        }
      } catch (err) {
        console.error("检查幸运用户状态失败:", err);
      }
    };
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
              try {
                const configResult = await likeApi.getLuckyConfig();
                let luckyRanks = [1, 8, 18];
                let isEnabled = true;
                if (configResult.code === 0 && configResult.data) {
                  if (Array.isArray(configResult.data.lucky_ranks) && configResult.data.lucky_ranks.length > 0) {
                    luckyRanks = configResult.data.lucky_ranks;
                  }
                  if (typeof configResult.data.is_enabled === "boolean") {
                    isEnabled = configResult.data.is_enabled;
                  }
                }
                console.log("点赞时获取幸运用户配置:", {
                  luckyRanks,
                  isEnabled,
                  currentRank: likeRank.value
                });
                isWinner.value = isEnabled && luckyRanks.includes(likeRank.value);
              } catch (err) {
                console.error("获取幸运用户配置失败:", err);
                isWinner.value = [1, 8, 18].includes(likeRank.value);
              }
              console.log("点赞排名信息:", {
                likeRank: likeRank.value,
                isWinner: isWinner.value
              });
              if (isWinner.value) {
                if (common_vendor.index.vibrateLong) {
                  common_vendor.index.vibrateLong({
                    success: () => {
                      console.log("震动反馈成功");
                    }
                  });
                }
              }
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
              isWinner: isWinner.value
            });
            if (isWinner.value && isLiked.value) {
              const resultData = result || {};
              emit("luckyUser", {
                likeRank: likeRank.value,
                isWinner: true,
                // 优先使用服务器返回的用户信息，如果没有则使用传入的信息
                avatar: resultData.avatar || props.userAvatar || "",
                nickname: resultData.nickname || props.userNickname || ""
              });
              common_vendor.index.showToast({
                title: "恭喜您成为幸运用户！",
                icon: "none",
                duration: 2e3,
                mask: true
              });
            }
            common_vendor.index.$emit("updateArticleLikeStatus", {
              articleId: props.articleId,
              isLiked: isLiked.value,
              likeCount: likeCount.value,
              likeRank: likeRank.value,
              isWinner: isWinner.value
            });
            if (!isWinner.value || !isLiked.value) {
              common_vendor.index.showToast({
                title: isLiked.value ? "已点赞" : "已取消点赞",
                icon: "none",
                duration: 1e3,
                mask: false
              });
            }
            if (result.isLiked && !previousLikeState && result.like_rank) {
              common_vendor.index.hideToast();
              setTimeout(() => {
                showLikeRankModal.value = true;
                console.log("显示点赞排名模态框:", {
                  likeRank: likeRank.value,
                  showModal: showLikeRankModal.value,
                  isWinner: isWinner.value
                });
              }, 100);
            }
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
    const closeLikeRankModal = () => {
      console.log("关闭点赞排名模态框");
      showLikeRankModal.value = false;
      console.log("模态框已关闭:", showLikeRankModal.value);
      return false;
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
      if (isLiked.value) {
        checkIfLuckyUser();
      }
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
      return common_vendor.e({
        a: common_vendor.p({
          type: isLiked.value ? "heart-filled" : "heart",
          size: __props.size,
          color: isLiked.value ? "#FF5D5B" : __props.color
        }),
        b: isLiked.value ? 1 : "",
        c: __props.showCount
      }, __props.showCount ? {
        d: common_vendor.t(likeCount.value)
      } : {}, {
        e: __props.showText
      }, __props.showText ? {
        f: common_vendor.t(isLiked.value ? "已点赞" : "点赞")
      } : {}, {
        g: common_vendor.o(debounceHandleLike),
        h: isLikeAnimating.value ? 1 : "",
        i: showLikeRankModal.value
      }, showLikeRankModal.value ? common_vendor.e({
        j: isWinner.value
      }, isWinner.value ? {
        k: common_vendor.f(6, (i, k0, i0) => {
          return {
            a: i
          };
        })
      } : {}, {
        l: common_vendor.t(isWinner.value ? "恭喜您中奖了！" : "恭喜您"),
        m: common_vendor.t(likeRank.value || 1),
        n: isWinner.value
      }, isWinner.value ? {} : {}, {
        o: isWinner.value
      }, isWinner.value ? {} : {}, {
        p: common_vendor.t(isWinner.value ? "太棒了" : "我知道了"),
        q: common_vendor.o(closeLikeRankModal),
        r: common_vendor.o(() => {
        }),
        s: isWinner.value ? 1 : "",
        t: common_vendor.o(closeLikeRankModal)
      }) : {}, {
        v: common_vendor.gei(_ctx, "")
      });
    };
  }
};
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-304aeb49"]]);
ks.createComponent(Component);
