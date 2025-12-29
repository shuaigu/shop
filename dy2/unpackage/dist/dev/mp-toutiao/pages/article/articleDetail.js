"use strict";
const common_vendor = require("../../common/vendor.js");
const store_user = require("../../store/user.js");
const utils_formatTime = require("../../utils/formatTime.js");
if (!Array) {
  const _easycom_uni_icons2 = common_vendor.resolveComponent("uni-icons");
  _easycom_uni_icons2();
}
const _easycom_uni_icons = () => "../../uni_modules/uni-icons/components/uni-icons/uni-icons.js";
if (!Math) {
  (_easycom_uni_icons + uniLoadMore + commentList + LotteryDraw + tuijian)();
}
const tuijian = () => "../../components/tuijian/tuijian.js";
const commentList = () => "../../components/comment-list/comment-list.js";
const LotteryDraw = () => "../../components/articleDetail-choujia/articleDetail-choujia.js";
const uniLoadMore = () => "../../uni_modules/uni-load-more/components/uni-load-more/uni-load-more.js";
const IMAGE_LOAD_TIMEOUT = 8e3;
const MAX_RETRY_COUNT = 2;
const _sfc_main = {
  __name: "articleDetail",
  props: {
    article_id: {
      type: String,
      default: ""
    },
    user_id: String
  },
  setup(__props) {
    const FANS_GROUP_ID = common_vendor.ref("CgYIASAHKAESTgpMPxsfnWvXJ61q6Eun6E6R/pZOQXqOK93pt9RbaamdIKv8hWML07CE8p7UrP6JX+XO7emnzmu+LFuaNy62FR6ye20jDcp/UPy2SaOrbBoA");
    const fetchFansGroupId = async () => {
      try {
        const sendOnApi = common_vendor.nr.importObject("sendOn", { customUI: true });
        const res = await sendOnApi.get();
        if (res && res.data && res.data.length > 0 && res.data[0].fans_group_id) {
          FANS_GROUP_ID.value = res.data[0].fans_group_id;
          common_vendor.index.__f__("log", "at pages/article/articleDetail.vue:25", "从数据库获取粉丝群ID:", FANS_GROUP_ID.value);
        } else {
          common_vendor.index.__f__("log", "at pages/article/articleDetail.vue:27", "未从数据库获取到粉丝群ID，使用默认ID");
        }
      } catch (err) {
        common_vendor.index.__f__("error", "at pages/article/articleDetail.vue:30", "获取粉丝群ID失败:", err);
      }
    };
    const props = __props;
    const userStore = store_user.useUserInfoStore();
    const processCDNImage = (url) => {
      if (!url)
        return "";
      if (url.includes("imageMogr2") || url.includes("watermark")) {
        return url;
      }
      if (url.includes("?")) {
        return `${url}&imageMogr2/thumbnail/!300x300r/format/webp/quality/70`;
      } else {
        return `${url}?imageMogr2/thumbnail/!300x300r/format/webp/quality/70`;
      }
    };
    const loginLoadingVisible = common_vendor.ref(false);
    const handlePageNavigation = async () => {
      try {
        const pages = getCurrentPages();
        if (pages.length === 1) {
          common_vendor.index.switchTab({
            url: "/pages/index/index",
            success: () => {
              setTimeout(() => {
                common_vendor.index.navigateTo({
                  url: `/pages/article/articleDetail?article_id=${props.article_id}`,
                  animationType: "slide-in-right",
                  // 添加右侧滑入动画
                  animationDuration: 300,
                  // 设置动画持续时间为300ms
                  fail: (err) => {
                    common_vendor.index.__f__("error", "at pages/article/articleDetail.vue:87", "跳转回文章详情页失败:", err);
                  }
                });
              }, 300);
            },
            fail: (err) => {
              common_vendor.index.__f__("error", "at pages/article/articleDetail.vue:93", "跳转到首页失败:", err);
              try {
                const cateApi = common_vendor.nr.importObject("cateWx", { customUI: true });
                cateApi.get().catch((err2) => {
                  common_vendor.index.__f__("warn", "at pages/article/articleDetail.vue:98", "预加载首页数据失败", err2);
                });
              } catch (err2) {
                common_vendor.index.__f__("warn", "at pages/article/articleDetail.vue:101", "初始化首页数据失败", err2);
              }
            }
          });
          return true;
        }
        return false;
      } catch (err) {
        common_vendor.index.__f__("error", "at pages/article/articleDetail.vue:110", "页面导航错误：", err);
        return false;
      }
    };
    const isLoading = common_vendor.ref(true);
    const isSubmitting = common_vendor.ref(false);
    const commentContent = common_vendor.ref("");
    const isCommentsLoading = common_vendor.ref(true);
    const isLoadingComments = common_vendor.ref(true);
    const articleApi = common_vendor.nr.importObject("articleDy", { customUI: true });
    const commentApi = common_vendor.nr.importObject("commentList", { customUI: true });
    common_vendor.nr.importObject("likeRecord", { customUI: true });
    const userApi = common_vendor.nr.importObject("userDy", { customUI: true });
    const commentRefreshTimer = common_vendor.ref(null);
    const displayCommentsCount = common_vendor.ref(5);
    const showAllComments = common_vendor.ref(false);
    common_vendor.ref(false);
    const selectedWinner = common_vendor.ref(null);
    common_vendor.computed(() => articleComment.value.length >= 3);
    const articleDetail = common_vendor.ref({});
    const articleComment = common_vendor.ref([]);
    const displayedComments = common_vendor.computed(() => {
      if (articleComment.value.length <= 5) {
        return articleComment.value;
      } else {
        return articleComment.value.slice(0, displayCommentsCount.value);
      }
    });
    const loadMoreComments = () => {
      displayCommentsCount.value += 5;
      if (displayCommentsCount.value >= articleComment.value.length) {
        displayCommentsCount.value = articleComment.value.length;
        showAllComments.value = true;
      }
    };
    const foldComments = () => {
      displayCommentsCount.value = 5;
      showAllComments.value = false;
    };
    common_vendor.computed(() => {
      return articleComment.value.length;
    });
    const isCheckingLogin = common_vendor.ref(false);
    common_vendor.ref(0);
    const imageLoadStatus = common_vendor.ref({});
    const isAnyImageLoading = common_vendor.ref(true);
    const videoLoadStatus = common_vendor.ref("loading");
    const videoContext = common_vendor.ref(null);
    const navInfo = common_vendor.ref(null);
    const lotteryVisibility = common_vendor.ref(false);
    const tuijianRef = common_vendor.ref(null);
    common_vendor.ref(null);
    common_vendor.ref(null);
    common_vendor.ref(false);
    const processMediaURL = (url, type = "image") => {
      if (!url)
        return "";
      if (url.includes("jingle0350.cn")) {
        if (type === "image") {
          return processCDNImage(url);
        }
      }
      if (url.includes("ixigua.com") || url.includes("aly2.")) {
        return url.includes("?") ? `${url}&referer=no_referer` : `${url}?referer=no_referer`;
      }
      if (type === "video" && url.includes("baidu.com")) {
        return url;
      }
      return url;
    };
    const imageLoadTimeouts = common_vendor.ref({});
    const imageRetryCount = common_vendor.ref({});
    const shareInfo = common_vendor.ref({
      title: "",
      path: "",
      imageUrl: ""
    });
    const updateShareInfo = () => {
      try {
        let title = articleDetail.value.content ? articleDetail.value.content.substring(0, 30) : "精彩内容";
        if (title.length < 15 && articleDetail.value.cate_name) {
          title;
        }
        let imageUrl = "";
        const path = `/pages/article/articleDetail?article_id=${props.article_id}`;
        shareInfo.value = {
          title,
          path,
          imageUrl
        };
      } catch (err) {
        common_vendor.index.__f__("error", "at pages/article/articleDetail.vue:270", "更新分享信息失败:", err);
      }
    };
    common_vendor.onShareAppMessage((res) => {
      updateShareInfo();
      return {
        title: shareInfo.value.title,
        path: shareInfo.value.path,
        imageUrl: shareInfo.value.imageUrl
      };
    });
    common_vendor.onShareTimeline(() => {
      updateShareInfo();
      return {
        title: shareInfo.value.title,
        path: shareInfo.value.path,
        imageUrl: shareInfo.value.imageUrl
      };
    });
    common_vendor.index.$on("setShareInfo", (data) => {
      if (data) {
        shareInfo.value = {
          title: data.title || shareInfo.value.title,
          path: data.path || shareInfo.value.path,
          imageUrl: data.imageUrl || shareInfo.value.imageUrl
        };
      }
    });
    common_vendor.onBeforeUnmount(() => {
      common_vendor.index.$off("setShareInfo");
    });
    const getArticleDetail = async () => {
      try {
        const needRedirect = await handlePageNavigation();
        if (needRedirect) {
          return;
        }
        if (!props.article_id) {
          throw new Error("文章ID不能为空");
        }
        await new Promise((resolve) => setTimeout(resolve, 50));
        const res = await articleApi.getArticleDetal(props.article_id);
        if (!res || !res.articleRes || !res.articleRes.data || !Array.isArray(res.articleRes.data)) {
          throw new Error("获取文章详情失败：返回数据格式错误");
        }
        const articleData = res.articleRes.data[0];
        if (!articleData.content) {
          articleData.content = "暂无内容";
        }
        if (articleData.videoURL) {
          articleData.videoURL = processMediaURL(articleData.videoURL, "video");
          videoLoadStatus.value = "loading";
        }
        if (articleData.images && articleData.images.length) {
          imageLoadStatus.value = {};
          imageRetryCount.value = {};
          Object.keys(imageLoadTimeouts.value).forEach((key) => {
            clearTimeout(imageLoadTimeouts.value[key]);
          });
          imageLoadTimeouts.value = {};
          articleData.images = articleData.images.map((img, index) => {
            if (!img.compressedURL && img.url) {
              img.compressedURL = img.url;
            }
            if (img.compressedURL) {
              img.compressedURL = processMediaURL(img.compressedURL, "image");
            }
            imageLoadStatus.value[index] = "loading";
            imageLoadTimeouts.value[index] = setTimeout(() => {
              if (imageLoadStatus.value[index] === "loading") {
                common_vendor.index.__f__("log", "at pages/article/articleDetail.vue:415", `图片 ${index} 加载超时`);
                imageLoadStatus.value[index] = "error";
                checkAllImagesLoaded();
              }
            }, IMAGE_LOAD_TIMEOUT);
            return img;
          });
          isAnyImageLoading.value = true;
          setTimeout(() => {
            if (isAnyImageLoading.value) {
              common_vendor.index.__f__("log", "at pages/article/articleDetail.vue:430", "图片加载全局超时，强制显示内容");
              isAnyImageLoading.value = false;
            }
          }, IMAGE_LOAD_TIMEOUT + 2e3);
        } else {
          isAnyImageLoading.value = false;
        }
        if (articleData.cate_id) {
          try {
            const cateApi = common_vendor.nr.importObject("cateWx", { customUI: true });
            const cateRes = await cateApi.get(articleData.cate_id);
            if (cateRes.data && cateRes.data[0]) {
              articleData.cate_name = cateRes.data[0].cate_name;
            }
          } catch (err) {
            common_vendor.index.__f__("error", "at pages/article/articleDetail.vue:447", "获取分类名称失败:", err);
          }
        }
        articleDetail.value = {
          _id: articleData._id || "",
          content: articleData.content || "",
          user_id: articleData.user_id || "",
          user_nickName: articleData.user_nickName || "",
          user_avatarUrl: articleData.user_avatarUrl || "",
          user_mobile: articleData.user_mobile || "",
          cate_id: articleData.cate_id || "",
          cate_name: articleData.cate_name || "",
          create_time: articleData.create_time || Date.now(),
          look_count: articleData.look_count || 0,
          like_count: articleData.like_count || 0,
          comment_count: articleData.comment_count || 0,
          images: articleData.images || [],
          videoURL: articleData.videoURL || null
        };
        articleComment.value = res.comment || [];
        try {
          const sendOnApi = common_vendor.nr.importObject("sendOn", { customUI: true });
          const sendOnRes = await sendOnApi.get();
          if (sendOnRes && sendOnRes.data && sendOnRes.data.length > 0) {
            navInfo.value = {
              isVisible: sendOnRes.data[0].commentVisibility !== void 0 ? sendOnRes.data[0].commentVisibility : true,
              // 默认显示
              title: "评论区"
            };
            lotteryVisibility.value = sendOnRes.data[0].lotteryVisibility !== void 0 ? sendOnRes.data[0].lotteryVisibility : false;
            common_vendor.index.__f__("log", "at pages/article/articleDetail.vue:487", "评论区显示状态:", navInfo.value.isVisible);
            common_vendor.index.__f__("log", "at pages/article/articleDetail.vue:488", "抽奖模块显示状态:", lotteryVisibility.value);
          } else {
            navInfo.value = {
              isVisible: true,
              title: "评论区"
            };
            lotteryVisibility.value = false;
          }
        } catch (err) {
          common_vendor.index.__f__("error", "at pages/article/articleDetail.vue:498", "获取显示状态失败:", err);
          navInfo.value = {
            isVisible: true,
            title: "评论区"
          };
          lotteryVisibility.value = false;
        }
      } catch (err) {
        common_vendor.index.__f__("error", "at pages/article/articleDetail.vue:508", "获取文章详情失败：", err);
        common_vendor.index.showToast({
          title: "获取文章详情失败",
          icon: "none"
        });
      }
    };
    const getCommentList = async () => {
      isLoadingComments.value = true;
      isCommentsLoading.value = true;
      try {
        const result = await articleApi.getCommentList(props.article_id);
        if (result && result.code === 0 && Array.isArray(result.data)) {
          const userIdToMobileMap = {};
          if (articleDetail.value && articleDetail.value.user_id && articleDetail.value.user_mobile) {
            userIdToMobileMap[articleDetail.value.user_id] = articleDetail.value.user_mobile;
          }
          if (userStore.userInfo && userStore.userInfo.uid && userStore.userInfo.mobile) {
            userIdToMobileMap[userStore.userInfo.uid] = userStore.userInfo.mobile;
          }
          const processedComments = result.data.map((comment) => {
            const processedComment = {
              ...comment,
              _id: comment._id || comment.id,
              nickName: comment.nickName || "匿名用户",
              avatarUrl: comment.avatarUrl || "/static/images/default-avatar.png",
              content: comment.content || "",
              create_time: comment.create_time || (/* @__PURE__ */ new Date()).getTime(),
              likeCount: comment.like_count || 0,
              isLiked: comment.is_liked || false
            };
            if (comment.mobile) {
              userIdToMobileMap[comment.user_id] = comment.mobile;
            }
            return processedComment;
          });
          const userIdsWithoutMobile = processedComments.filter((comment) => comment.user_id && !userIdToMobileMap[comment.user_id]).map((comment) => comment.user_id);
          if (userIdsWithoutMobile.length > 0) {
            try {
              const db = common_vendor.nr.database();
              const userCollection = db.collection("user");
              const userResult = await userCollection.where({
                _id: db.command.in(userIdsWithoutMobile)
              }).field({
                _id: true,
                mobile: true
              }).get();
              if (userResult && userResult.data && userResult.data.length > 0) {
                userResult.data.forEach((user) => {
                  if (user._id && user.mobile) {
                    userIdToMobileMap[user._id] = user.mobile;
                  }
                });
              } else {
                try {
                  for (const userId of userIdsWithoutMobile) {
                    try {
                      const userInfoResult = await userApi.getUserInfo(userId);
                      if (userInfoResult && userInfoResult.data && userInfoResult.data.mobile) {
                        userIdToMobileMap[userId] = userInfoResult.data.mobile;
                      }
                    } catch (singleUserError) {
                      common_vendor.index.__f__("warn", "at pages/article/articleDetail.vue:601", `获取用户 ${userId} 信息失败:`, singleUserError);
                    }
                  }
                } catch (userApiError) {
                  common_vendor.index.__f__("error", "at pages/article/articleDetail.vue:605", "获取用户信息失败:", userApiError);
                }
              }
            } catch (dbError) {
              common_vendor.index.__f__("error", "at pages/article/articleDetail.vue:609", "从数据库获取用户手机号失败:", dbError);
            }
          }
          const finalComments = processedComments.map((comment) => {
            if (comment.user_id && userIdToMobileMap[comment.user_id]) {
              comment.mobile = userIdToMobileMap[comment.user_id];
            } else if (comment.mobile === "无手机号") {
              comment.mobile = "";
            }
            return comment;
          });
          articleComment.value = finalComments;
          showAllComments.value = finalComments.length <= 5;
          displayCommentsCount.value = Math.min(5, finalComments.length);
        } else {
          common_vendor.index.__f__("error", "at pages/article/articleDetail.vue:632", "获取评论列表失败: 返回结果无效", result);
          articleComment.value = [];
          showAllComments.value = true;
          displayCommentsCount.value = 0;
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/article/articleDetail.vue:639", "获取评论列表出错:", error);
        common_vendor.index.showToast({
          title: "获取评论失败，请稍后再试",
          icon: "none"
        });
        articleComment.value = [];
        showAllComments.value = true;
        displayCommentsCount.value = 0;
      } finally {
        isLoadingComments.value = false;
        isCommentsLoading.value = false;
      }
    };
    common_vendor.watch(() => articleComment.value.length, (newCount, oldCount) => {
    });
    const refreshPage = async () => {
      try {
        isLoading.value = true;
        isCommentsLoading.value = true;
        await getArticleDetail();
        await getCommentList();
        await updatePageView();
        common_vendor.index.__f__("log", "at pages/article/articleDetail.vue:675", "页面数据已刷新");
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/article/articleDetail.vue:677", "刷新页面数据失败:", error);
        common_vendor.index.showToast({
          title: "刷新数据失败",
          icon: "none"
        });
      } finally {
        isLoading.value = false;
        isCommentsLoading.value = false;
        common_vendor.index.stopPullDownRefresh();
      }
    };
    common_vendor.onPullDownRefresh(() => {
      refreshPage();
    });
    const commentSubmit = async () => {
      if (isSubmitting.value) {
        return;
      }
      try {
        if (!userStore.userInfo.uid || !userStore.userInfo.nickName) {
          throw new Error("用户信息不完整，请重新登录");
        }
        const content = commentContent.value.trim();
        if (!content) {
          return common_vendor.index.showToast({
            title: "评论内容不能为空",
            icon: "none",
            duration: 2e3
          });
        }
        isSubmitting.value = true;
        common_vendor.index.showLoading({
          title: "提交中...",
          mask: true
        });
        let userMobile = userStore.userInfo.mobile || "";
        if (!userMobile) {
          try {
            const localUserInfo = common_vendor.index.getStorageSync("userInfo");
            if (localUserInfo && localUserInfo.mobile) {
              userMobile = localUserInfo.mobile;
            }
          } catch (err) {
            common_vendor.index.__f__("error", "at pages/article/articleDetail.vue:735", "[前端] 获取本地存储的用户信息失败:", err);
          }
        }
        const commentData = {
          article_id: articleDetail.value._id,
          user_id: userStore.userInfo.uid,
          content,
          nickName: userStore.userInfo.nickName || "匿名用户",
          avatarUrl: userStore.userInfo.avatarUrl || "",
          mobile: userMobile || "",
          user_mobile: userMobile || ""
        };
        const result = await commentApi.addComment(commentData);
        if (result.code === 0) {
          commentContent.value = "";
          common_vendor.index.showToast({
            title: "评论成功",
            icon: "success",
            duration: 1500,
            success: () => {
              setTimeout(() => {
                refreshPage();
              }, 1e3);
            }
          });
        } else {
          throw new Error(result.message || "评论失败");
        }
      } catch (err) {
        common_vendor.index.__f__("error", "at pages/article/articleDetail.vue:774", "[前端] 评论失败:", {
          error: err,
          message: err.message,
          stack: err.stack
        });
        common_vendor.index.showToast({
          title: err.message || "评论失败，请稍后重试",
          icon: "none",
          duration: 2e3
        });
      } finally {
        common_vendor.index.hideLoading();
        isSubmitting.value = false;
      }
    };
    const handelDelComment = async (commentId) => {
      try {
        const confirmRes = await common_vendor.index.showModal({
          title: "提示",
          content: "确定要删除这条评论吗？",
          confirmText: "删除",
          confirmColor: "#ff0000"
        });
        if (!confirmRes.confirm)
          return;
        common_vendor.index.showLoading({
          title: "删除中...",
          mask: true
        });
        const result = await articleApi.deleteComment(commentId);
        if (result.code === 0) {
          common_vendor.index.showToast({
            title: "删除成功",
            icon: "success",
            duration: 1500,
            success: () => {
              setTimeout(() => {
                refreshPage();
              }, 1e3);
            }
          });
        } else {
          throw new Error(result.message || "删除失败");
        }
      } catch (err) {
        common_vendor.index.__f__("error", "at pages/article/articleDetail.vue:828", "删除失败:", err);
        common_vendor.index.showToast({
          title: typeof err === "string" ? err : err.message || "删除失败",
          icon: "none"
        });
      } finally {
        common_vendor.index.hideLoading();
      }
    };
    const commonComments = common_vendor.ref([
      "不错",
      "支持一下",
      "有用",
      "谢谢分享",
      "学习了",
      "点赞",
      "期待更多",
      "很好",
      "厉害",
      "喜欢",
      "太棒了",
      "赞一个",
      "非常好",
      "实用",
      "感谢楼主",
      "分享给朋友",
      "楼主辛苦了",
      "收藏了",
      "关注了",
      "顶一下"
    ]);
    const recommendedComments = common_vendor.ref([]);
    const generateRecommendedComments = () => {
      recommendedComments.value = [];
      const tempArray = [...commonComments.value];
      const count = Math.min(4, tempArray.length);
      for (let i = 0; i < count; i++) {
        const randomIndex = Math.floor(Math.random() * tempArray.length);
        recommendedComments.value.push(tempArray[randomIndex]);
        tempArray.splice(randomIndex, 1);
      }
    };
    const selectRecommendedComment = (comment) => {
      commentContent.value = comment;
    };
    const handleCommentClick = async () => {
      try {
        const isLoggedIn = await customTestLogin();
        if (!isLoggedIn) {
          return;
        }
        generateRecommendedComments();
        showCommentPopup.value = true;
      } catch (err) {
        common_vendor.index.__f__("error", "at pages/article/articleDetail.vue:903", "评论点击处理失败:", err);
        common_vendor.index.showToast({
          title: "操作失败，请重试",
          icon: "none"
        });
      }
    };
    const showCommentPopup = common_vendor.ref(false);
    const submitPopupComment = () => {
      if (commentContent.value.trim()) {
        commentSubmit();
        showCommentPopup.value = false;
      } else {
        common_vendor.index.showToast({
          title: "评论内容不能为空",
          icon: "none"
        });
      }
    };
    const closeCommentPopup = () => {
      showCommentPopup.value = false;
      commentContent.value = "";
    };
    const goToHome = () => {
      common_vendor.index.switchTab({
        url: "/pages/index/index"
      });
    };
    const handleCall = async () => {
      try {
        const isLoggedIn = await customTestLogin();
        if (!isLoggedIn) {
          return;
        }
        if (articleDetail.value.user_mobile === "未填写") {
          return common_vendor.index.showToast({
            icon: "none",
            title: "没有联系方式"
          });
        }
        common_vendor.index.makePhoneCall({
          phoneNumber: articleDetail.value.user_mobile,
          fail: (err) => {
            common_vendor.index.showToast({
              title: "拨打电话失败",
              icon: "none"
            });
          }
        });
      } catch (err) {
        common_vendor.index.__f__("error", "at pages/article/articleDetail.vue:968", "拨打电话失败:", err);
        common_vendor.index.showToast({
          title: "操作失败，请重试",
          icon: "none"
        });
      }
    };
    const customTestLogin = async () => {
      if (isCheckingLogin.value)
        return false;
      isCheckingLogin.value = true;
      try {
        if (userStore.userInfo && userStore.userInfo.uid) {
          if (!userStore.userInfo.mobile) {
            try {
              const localUserInfo = common_vendor.index.getStorageSync("userInfo");
              if (localUserInfo && localUserInfo.mobile) {
                userStore.setUserInfo({
                  ...userStore.userInfo,
                  mobile: localUserInfo.mobile
                });
              } else {
                try {
                  const userInfoApi = common_vendor.nr.importObject("userDy", { customUI: true });
                  const userResult = await userInfoApi.getUserInfo(userStore.userInfo.uid);
                  if (userResult && userResult.data && userResult.data.mobile) {
                    userStore.setUserInfo({
                      ...userStore.userInfo,
                      mobile: userResult.data.mobile
                    });
                    common_vendor.index.setStorageSync("userInfo", {
                      ...userStore.userInfo,
                      mobile: userResult.data.mobile
                    });
                  }
                } catch (err) {
                }
              }
            } catch (err) {
              common_vendor.index.__f__("error", "at pages/article/articleDetail.vue:1021", "获取用户手机号失败:", err);
            }
          }
          isCheckingLogin.value = false;
          return true;
        }
        if (!loginLoadingVisible.value) {
          loginLoadingVisible.value = true;
          common_vendor.index.showLoading({
            title: "登录中...",
            mask: true
          });
        }
        const pages = getCurrentPages();
        const currentPage = pages[pages.length - 1];
        const currentRoute = currentPage.route;
        const currentOptions = currentPage.options || {};
        let redirectUrl = "/" + currentRoute;
        const queryParams = [];
        for (const key in currentOptions) {
          if (currentOptions.hasOwnProperty(key)) {
            queryParams.push(`${key}=${encodeURIComponent(currentOptions[key])}`);
          }
        }
        if (queryParams.length > 0) {
          redirectUrl += "?" + queryParams.join("&");
        }
        if (loginLoadingVisible.value) {
          common_vendor.index.hideLoading();
          loginLoadingVisible.value = false;
        }
        common_vendor.index.navigateTo({
          url: `/pages/login/login?redirect=${encodeURIComponent(redirectUrl)}`,
          complete: () => {
            isCheckingLogin.value = false;
          }
        });
        return false;
      } catch (err) {
        common_vendor.index.__f__("error", "at pages/article/articleDetail.vue:1078", "登录检查失败:", err);
        if (loginLoadingVisible.value) {
          common_vendor.index.hideLoading();
          loginLoadingVisible.value = false;
        }
        common_vendor.index.showToast({
          title: "登录检查失败，请重试",
          icon: "none",
          duration: 2e3
        });
        const currentRoute = `/pages/article/articleDetail?article_id=${props.article_id}`;
        const redirectUrl = encodeURIComponent(currentRoute);
        setTimeout(() => {
          common_vendor.index.navigateTo({
            url: `/pages/login/login?redirect=${redirectUrl}`,
            complete: () => {
              isCheckingLogin.value = false;
            }
          });
        }, 1500);
        return false;
      } finally {
        isCheckingLogin.value = false;
      }
    };
    const updatePageView = async () => {
      try {
        if (!articleDetail.value._id) {
          return;
        }
        const result = await articleApi.updateLookCount(articleDetail.value._id);
        if (result && result.code === 0) {
          articleDetail.value.look_count = (articleDetail.value.look_count || 0) + 1;
          common_vendor.index.$emit("viewCountUpdated", articleDetail.value._id);
          common_vendor.index.__f__("log", "at pages/article/articleDetail.vue:1130", "发送浏览量更新事件:", articleDetail.value._id, "浏览量:", articleDetail.value.look_count);
        } else {
          common_vendor.index.__f__("error", "at pages/article/articleDetail.vue:1132", "更新浏览量失败:", result);
        }
      } catch (err) {
        common_vendor.index.__f__("error", "at pages/article/articleDetail.vue:1135", "更新浏览量出错:", err);
        throw err;
      }
    };
    const saveViewedArticle = () => {
      try {
        if (!articleDetail.value || !articleDetail.value._id)
          return;
        const article = {
          _id: articleDetail.value._id,
          title: articleDetail.value.content ? articleDetail.value.content.substring(0, 30) : "无标题",
          content: articleDetail.value.content || "",
          cate_name: articleDetail.value.cate_name || "未分类",
          create_time: articleDetail.value.create_time,
          view_time: Date.now(),
          // 浏览时间
          images: articleDetail.value.images && articleDetail.value.images.length > 0 ? [articleDetail.value.images[0]] : []
        };
        let viewedArticles = common_vendor.index.getStorageSync("viewedArticles") || [];
        const existingIndex = viewedArticles.findIndex((item) => item._id === article._id);
        if (existingIndex !== -1) {
          viewedArticles.splice(existingIndex, 1);
        }
        viewedArticles.unshift(article);
        if (viewedArticles.length > 50) {
          viewedArticles = viewedArticles.slice(0, 50);
        }
        common_vendor.index.setStorageSync("viewedArticles", viewedArticles);
      } catch (err) {
        common_vendor.index.__f__("error", "at pages/article/articleDetail.vue:1180", "保存浏览记录失败:", err);
      }
    };
    common_vendor.onMounted(async () => {
      var _a;
      try {
        await fetchFansGroupId();
        isLoading.value = true;
        isCommentsLoading.value = true;
        const pages = getCurrentPages();
        const currentPage = pages[pages.length - 1];
        const options = ((_a = currentPage.$page) == null ? void 0 : _a.options) || {};
        const articleId = options.article_id || props.article_id;
        if (!articleId) {
          throw new Error("文章ID不能为空");
        }
        await getArticleDetail();
        isLoading.value = false;
        if (articleDetail.value.videoURL) {
          setTimeout(() => {
            videoContext.value = common_vendor.index.createVideoContext("articleVideo");
          }, 300);
        }
        getCommentList().catch((err) => {
          common_vendor.index.__f__("error", "at pages/article/articleDetail.vue:1221", "获取评论列表失败:", err);
          isCommentsLoading.value = false;
          isLoadingComments.value = false;
        });
        updatePageView().catch((err) => {
          common_vendor.index.__f__("error", "at pages/article/articleDetail.vue:1229", "更新浏览量失败:", err);
        });
        saveViewedArticle();
        setTimeout(() => {
          showGroupGuide.value = true;
        }, 1e3);
      } catch (err) {
        common_vendor.index.__f__("error", "at pages/article/articleDetail.vue:1241", "页面初始化失败:", err);
        common_vendor.index.showToast({
          title: "加载失败，请重试",
          icon: "none"
        });
      } finally {
        isLoading.value = false;
      }
    });
    common_vendor.onUnmounted(() => {
      if (commentRefreshTimer.value) {
        clearInterval(commentRefreshTimer.value);
      }
    });
    const previewImage = (current) => {
      if (!articleDetail.value.images || !articleDetail.value.images.length)
        return;
      const urls = articleDetail.value.images.map((img) => img.compressedURL || img.url);
      common_vendor.index.previewImage({
        current,
        // 当前显示图片的索引
        urls,
        // 需要预览的图片链接列表
        indicator: "number",
        loop: true,
        fail: (err) => {
          common_vendor.index.__f__("error", "at pages/article/articleDetail.vue:1270", "预览图片失败:", err);
          common_vendor.index.showToast({
            title: "预览图片失败",
            icon: "none"
          });
        }
      });
    };
    common_vendor.ref(false);
    common_vendor.ref(0);
    const handleImageLoad = (index) => {
      imageLoadStatus.value[index] = "loaded";
      checkAllImagesLoaded();
    };
    const handleImageError = (index) => {
      common_vendor.index.__f__("error", "at pages/article/articleDetail.vue:1377", "图片加载失败:", index, articleDetail.value.images && articleDetail.value.images[index]);
      if (imageLoadTimeouts.value[index]) {
        clearTimeout(imageLoadTimeouts.value[index]);
        delete imageLoadTimeouts.value[index];
      }
      if (!imageRetryCount.value[index]) {
        imageRetryCount.value[index] = 1;
      } else {
        imageRetryCount.value[index]++;
      }
      if (!articleDetail.value || !articleDetail.value.images || !articleDetail.value.images[index]) {
        imageLoadStatus.value[index] = "error";
        checkAllImagesLoaded();
        return;
      }
      if (imageRetryCount.value[index] <= MAX_RETRY_COUNT) {
        const img = articleDetail.value.images[index];
        let shouldRetry = false;
        let newUrl = "";
        if (img.compressedURL !== img.url && img.url) {
          common_vendor.index.__f__("log", "at pages/article/articleDetail.vue:1407", "尝试使用原始URL加载图片:", img.url);
          newUrl = img.url;
          shouldRetry = true;
        } else if (img.compressedURL) {
          const timestamp = (/* @__PURE__ */ new Date()).getTime();
          newUrl = img.compressedURL.includes("?") ? `${img.compressedURL}&t=${timestamp}` : `${img.compressedURL}?t=${timestamp}`;
          shouldRetry = true;
        }
        if (shouldRetry && newUrl) {
          articleDetail.value.images[index] = {
            ...articleDetail.value.images[index],
            compressedURL: newUrl
          };
          imageLoadStatus.value[index] = "loading";
          imageLoadTimeouts.value[index] = setTimeout(() => {
            if (imageLoadStatus.value[index] === "loading") {
              imageLoadStatus.value[index] = "error";
              checkAllImagesLoaded();
            }
          }, IMAGE_LOAD_TIMEOUT);
          return;
        }
      }
      imageLoadStatus.value[index] = "error";
      common_vendor.index.__f__("log", "at pages/article/articleDetail.vue:1444", `图片${index}加载失败，已标记为错误状态`);
      checkAllImagesLoaded();
      if (index === 0) {
        setTimeout(() => {
          isAnyImageLoading.value = false;
        }, 300);
      }
    };
    const checkAllImagesLoaded = () => {
      if (!articleDetail.value || !articleDetail.value.images) {
        isAnyImageLoading.value = false;
        return;
      }
      const imageCount = articleDetail.value.images.length;
      let loadedCount = 0;
      for (let i = 0; i < imageCount; i++) {
        if (imageLoadStatus.value[i] === "loaded" || imageLoadStatus.value[i] === "error") {
          loadedCount++;
        }
      }
      isAnyImageLoading.value = loadedCount < imageCount;
    };
    const handleArticleClick = (articleId) => {
      if (articleId === props.article_id) {
        return;
      }
      common_vendor.index.navigateTo({
        url: `/pages/article/articleDetail?article_id=${articleId}`,
        success: () => {
        },
        fail: (err) => {
          common_vendor.index.__f__("error", "at pages/article/articleDetail.vue:1540", "跳转到文章详情页失败:", err);
          common_vendor.index.showToast({
            title: "跳转失败",
            icon: "none"
          });
        }
      });
    };
    common_vendor.onReachBottom(() => {
      if (tuijianRef.value) {
        tuijianRef.value.loadMore();
      }
    });
    const handleVideoLoad = () => {
      videoLoadStatus.value = "loaded";
    };
    const handleVideoError = () => {
      videoLoadStatus.value = "error";
      common_vendor.index.showToast({
        title: "视频加载失败",
        icon: "none"
      });
    };
    common_vendor.index.$on("commentVisibilityChanged", (newState) => {
      common_vendor.index.__f__("log", "at pages/article/articleDetail.vue:1610", "收到评论显示状态变化事件:", newState);
      if (navInfo.value) {
        navInfo.value.isVisible = newState;
      }
    });
    common_vendor.index.$on("lotteryVisibilityChanged", (newState) => {
      common_vendor.index.__f__("log", "at pages/article/articleDetail.vue:1617", "收到抽奖模块显示状态变化事件:", newState);
      lotteryVisibility.value = newState;
    });
    common_vendor.onUnmounted(() => {
      common_vendor.index.$off("commentVisibilityChanged");
      common_vendor.index.$off("lotteryVisibilityChanged");
      common_vendor.index.$off("setShareInfo");
      common_vendor.index.$off("viewCountUpdated");
      common_vendor.index.$off("updateArticleLikeStatus");
      common_vendor.index.$off("fansGroupIdChanged");
    });
    const handleLotteryResult = (result) => {
      if (result.includes("8元"))
        ;
      else if (result.includes("2元"))
        ;
      else if (result.includes("20元"))
        ;
      else if (result.includes("谢谢参与"))
        ;
      const winners = [];
      const commentsCopy = [...articleComment.value];
      if (commentsCopy.length > 0) {
        const randomIndex = Math.floor(Math.random() * commentsCopy.length);
        const selectedUser = commentsCopy[randomIndex];
        const sameUsers = articleComment.value.filter((comment) => comment.nickName === selectedUser.nickName);
        winners.push(...sameUsers);
      }
      selectedWinner.value = winners;
    };
    const handleJoinGroup = (e) => {
      common_vendor.index.__f__("log", "at pages/article/articleDetail.vue:1701", "加入群聊回调", e.detail);
      if (e.detail) {
        if (e.detail.errMsg && e.detail.errMsg === "onJoinGroup:ok" || e.detail.errNo !== void 0 && e.detail.errNo === 0) {
          common_vendor.index.showToast({
            title: "加入群聊成功",
            icon: "success"
          });
          return;
        }
        if (e.detail.errMsg && e.detail.errMsg !== "onJoinGroup:ok") {
          common_vendor.index.showToast({
            title: "加入失败: " + e.detail.errMsg,
            icon: "none"
          });
          return;
        }
        if (e.detail.errNo !== void 0 && e.detail.errNo !== 0) {
          common_vendor.index.showToast({
            title: "加入失败: " + (e.detail.errMsg || "错误码: " + e.detail.errNo),
            icon: "none"
          });
          return;
        }
      }
      common_vendor.index.__f__("log", "at pages/article/articleDetail.vue:1735", "未知的群聊回调结果", e);
    };
    const showGroupGuide = common_vendor.ref(false);
    const closeGroupGuide = () => {
      showGroupGuide.value = false;
      try {
        common_vendor.index.setStorageSync("hasClosedGroupGuide", "true");
      } catch (e) {
        common_vendor.index.__f__("error", "at pages/article/articleDetail.vue:1748", "保存弹窗关闭状态失败", e);
      }
    };
    const handleGuideJoinGroup = () => {
      closeGroupGuide();
      try {
        common_vendor.index.setStorageSync("hasSeenGroupGuide", "true");
      } catch (e) {
        common_vendor.index.__f__("error", "at pages/article/articleDetail.vue:1759", "保存引导状态失败", e);
      }
    };
    common_vendor.index.$on("fansGroupIdChanged", (newId) => {
      common_vendor.index.__f__("log", "at pages/article/articleDetail.vue:1765", "收到粉丝群ID变化事件:", newId);
      FANS_GROUP_ID.value = newId;
    });
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: isLoading.value && !articleDetail.value._id
      }, isLoading.value && !articleDetail.value._id ? {
        b: common_vendor.p({
          type: "spinner-cycle",
          size: "48",
          color: "#399bfe"
        })
      } : {}, {
        c: articleDetail.value.user_avatarUrl || "/static/images/default-avatar.png",
        d: common_vendor.t(articleDetail.value.user_nickName || "未知用户"),
        e: common_vendor.t(common_vendor.unref(utils_formatTime.formatTime)(articleDetail.value.create_time)),
        f: common_vendor.t(articleDetail.value.look_count || 0),
        g: common_vendor.p({
          color: "#5cb85c",
          ["custom-prefix"]: "icon",
          type: "lishuai-dianhua",
          size: "22"
        }),
        h: common_vendor.o(handleCall),
        i: common_vendor.t(common_vendor.unref(utils_formatTime.formatTime)(articleDetail.value.create_time)),
        j: common_vendor.t(articleDetail.value.look_count || 0),
        k: articleDetail.value.videoURL
      }, articleDetail.value.videoURL ? common_vendor.e({
        l: videoLoadStatus.value === "loading"
      }, videoLoadStatus.value === "loading" ? {
        m: common_vendor.p({
          status: "loading",
          contentText: {
            contentrefresh: "视频加载中..."
          }
        })
      } : {}, {
        n: videoLoadStatus.value === "error"
      }, videoLoadStatus.value === "error" ? {
        o: common_vendor.p({
          type: "videocam-slash",
          size: "50",
          color: "#CCCCCC"
        })
      } : {}, {
        p: articleDetail.value.videoURL,
        q: articleDetail.value.images && articleDetail.value.images[0] ? articleDetail.value.images[0].compressedURL : "",
        r: common_vendor.o(handleVideoError),
        s: common_vendor.o(handleVideoLoad)
      }) : {}, {
        t: articleDetail.value.images && articleDetail.value.images.length
      }, articleDetail.value.images && articleDetail.value.images.length ? common_vendor.e({
        v: common_vendor.f(articleDetail.value.images.slice(0, articleDetail.value.images.length > 9 ? 9 : articleDetail.value.images.length), (item, index, i0) => {
          return common_vendor.e({
            a: imageLoadStatus.value[index] === "error"
          }, imageLoadStatus.value[index] === "error" ? {
            b: "786907d5-4-" + i0,
            c: common_vendor.p({
              type: "image",
              size: "24",
              color: "#999999"
            })
          } : {}, {
            d: item.compressedURL || item.url,
            e: common_vendor.o(($event) => handleImageLoad(index)),
            f: common_vendor.o(($event) => handleImageError(index)),
            g: imageLoadStatus.value[index] === "loaded" ? 1 : 0,
            h: index === 8 && articleDetail.value.images.length > 9
          }, index === 8 && articleDetail.value.images.length > 9 ? {
            i: common_vendor.t(articleDetail.value.images.length - 9)
          } : {}, {
            j: index,
            k: common_vendor.o(($event) => previewImage(item.compressedURL || item.url))
          });
        }),
        w: common_vendor.n({
          "single-image": articleDetail.value.images.length === 1,
          "double-image": articleDetail.value.images.length === 2,
          "triple-image": articleDetail.value.images.length === 3,
          "grid-image": articleDetail.value.images.length > 3
        }),
        x: articleDetail.value.images.length > 1
      }, articleDetail.value.images.length > 1 ? {
        y: common_vendor.t(articleDetail.value.images.length)
      } : {}) : {}, {
        z: common_vendor.p({
          type: "calendar",
          size: "18",
          color: "#666666"
        }),
        A: common_vendor.t(common_vendor.unref(utils_formatTime.formatTime)(articleDetail.value.create_time)),
        B: common_vendor.p({
          type: "eye",
          size: "18",
          color: "#666666"
        }),
        C: common_vendor.t(articleDetail.value.look_count || 0),
        D: articleDetail.value.cate_name
      }, articleDetail.value.cate_name ? {
        E: common_vendor.p({
          type: "tag",
          size: "18",
          color: "#399bfe"
        }),
        F: common_vendor.t(articleDetail.value.cate_name)
      } : {}, {
        G: articleDetail.value.content
      }, articleDetail.value.content ? {
        H: common_vendor.t(articleDetail.value.content)
      } : {}, {
        I: navInfo.value && navInfo.value.isVisible
      }, navInfo.value && navInfo.value.isVisible ? common_vendor.e({
        J: isCommentsLoading.value && !articleComment.value.length
      }, isCommentsLoading.value && !articleComment.value.length ? {
        K: common_vendor.p({
          status: "loading",
          contentText: {
            contentrefresh: "评论加载中..."
          }
        })
      } : !isCommentsLoading.value && articleComment.value.length === 0 ? {
        M: common_vendor.p({
          type: "chat",
          size: "50",
          color: "#CCCCCC"
        })
      } : {}, {
        L: !isCommentsLoading.value && articleComment.value.length === 0,
        N: common_vendor.p({
          type: "chat",
          size: "20",
          color: "#999"
        }),
        O: common_vendor.o(handleCommentClick),
        P: common_vendor.o(handelDelComment),
        Q: common_vendor.p({
          comments: displayedComments.value,
          articleId: __props.article_id,
          articleUserId: articleDetail.value.user_id,
          showMobile: true
        }),
        R: articleComment.value.length > displayCommentsCount.value && !showAllComments.value
      }, articleComment.value.length > displayCommentsCount.value && !showAllComments.value ? {
        S: common_vendor.t(displayCommentsCount.value),
        T: common_vendor.t(articleComment.value.length),
        U: common_vendor.p({
          type: "bottom",
          size: "12",
          color: "#666"
        }),
        V: common_vendor.o(loadMoreComments)
      } : {}, {
        W: articleComment.value.length > 5 && showAllComments.value
      }, articleComment.value.length > 5 && showAllComments.value ? {
        X: common_vendor.p({
          type: "top",
          size: "12",
          color: "#666"
        }),
        Y: common_vendor.o(foldComments)
      } : {}, {
        Z: navInfo.value && navInfo.value.isVisible
      }, navInfo.value && navInfo.value.isVisible ? {} : {}, {
        aa: lotteryVisibility.value
      }, lotteryVisibility.value ? {
        ab: common_vendor.o(handleLotteryResult),
        ac: common_vendor.p({
          commenters: articleComment.value
        })
      } : {}) : {}, {
        ad: articleDetail.value.images && articleDetail.value.images.length
      }, articleDetail.value.images && articleDetail.value.images.length ? {
        ae: common_vendor.t(articleDetail.value.images.length),
        af: common_vendor.f(articleDetail.value.images, (item, index, i0) => {
          return {
            a: item.compressedURL || item.url,
            b: common_vendor.o(($event) => previewImage(item.compressedURL || item.url)),
            c: index
          };
        })
      } : {}, {
        ag: common_vendor.sr(tuijianRef, "786907d5-15", {
          "k": "tuijianRef"
        }),
        ah: common_vendor.o(handleArticleClick),
        ai: common_vendor.p({
          ["current-article-id"]: __props.article_id,
          cate_id: articleDetail.value.cate_id
        }),
        aj: common_vendor.o(($event) => {
          var _a;
          return (_a = tuijianRef.value) == null ? void 0 : _a.loadMore();
        }),
        ak: articleDetail.value._id,
        al: common_vendor.p({
          type: "home",
          size: "24",
          color: "#444444"
        }),
        am: common_vendor.o(goToHome),
        an: FANS_GROUP_ID.value,
        ao: common_vendor.o(handleJoinGroup),
        ap: common_vendor.o(handleCall),
        aq: showCommentPopup.value
      }, showCommentPopup.value ? {
        ar: common_vendor.o(closeCommentPopup),
        as: common_vendor.p({
          type: "close",
          size: "20",
          color: "#999"
        }),
        at: common_vendor.o(closeCommentPopup),
        av: common_vendor.f(recommendedComments.value, (comment, index, i0) => {
          return {
            a: common_vendor.t(comment),
            b: index,
            c: common_vendor.o(($event) => selectRecommendedComment(comment))
          };
        }),
        aw: commentContent.value,
        ax: common_vendor.o(($event) => commentContent.value = $event.detail.value),
        ay: common_vendor.t(commentContent.value.length),
        az: common_vendor.o(closeCommentPopup),
        aA: common_vendor.o(submitPopupComment)
      } : {}, {
        aB: showGroupGuide.value
      }, showGroupGuide.value ? common_vendor.e({
        aC: common_vendor.o(closeGroupGuide),
        aD: common_vendor.o(closeGroupGuide),
        aE: articleDetail.value.images && articleDetail.value.images.length
      }, articleDetail.value.images && articleDetail.value.images.length ? {
        aF: common_vendor.f(articleDetail.value.images.slice(0, 6), (item, index, i0) => {
          return {
            a: item.compressedURL || item.url,
            b: common_vendor.o(($event) => previewImage(item.compressedURL || item.url)),
            c: index
          };
        })
      } : {
        aG: common_vendor.f(6, (index, k0, i0) => {
          return {
            a: `/static/images/${index}.png`,
            b: index
          };
        })
      }, {
        aH: FANS_GROUP_ID.value,
        aI: common_vendor.o(handleJoinGroup),
        aJ: common_vendor.o(handleGuideJoinGroup)
      }) : {});
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-786907d5"]]);
_sfc_main.__runtimeHooks = 6;
tt.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-toutiao/pages/article/articleDetail.js.map
