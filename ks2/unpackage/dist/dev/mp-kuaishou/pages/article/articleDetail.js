"use strict";
const common_vendor = require("../../common/vendor.js");
const store_user = require("../../store/user.js");
const utils_formatTime = require("../../utils/formatTime.js");
if (!Array) {
  const _easycom_up_loading_page2 = common_vendor.resolveComponent("up-loading-page");
  const _easycom_uni_icons2 = common_vendor.resolveComponent("uni-icons");
  const _easycom_uni_load_more2 = common_vendor.resolveComponent("uni-load-more");
  const _easycom_comment_list2 = common_vendor.resolveComponent("comment-list");
  (_easycom_up_loading_page2 + _easycom_uni_icons2 + _easycom_uni_load_more2 + _easycom_comment_list2)();
}
const _easycom_up_loading_page = () => "../../uni_modules/uview-plus/components/u-loading-page/u-loading-page.js";
const _easycom_uni_icons = () => "../../uni_modules/uni-icons/components/uni-icons/uni-icons.js";
const _easycom_uni_load_more = () => "../../uni_modules/uni-load-more/components/uni-load-more/uni-load-more.js";
const _easycom_comment_list = () => "../../components/comment-list/comment-list.js";
if (!Math) {
  (_easycom_up_loading_page + _easycom_uni_icons + _easycom_uni_load_more + _easycom_comment_list + tuijian + Dianzan + Tuouanyulan)();
}
const tuijian = () => "../../components/tuijian/tuijian.js";
const Tuouanyulan = () => "../../components/tuouanyulan/tuouanyulan.js";
const Dianzan = () => "../../components/dianzan/dianzan.js";
const __default__ = {
  // 分享给好友
  onShareAppMessage(options) {
    var _a, _b, _c;
    const pages = getCurrentPages();
    const currentPage = pages[pages.length - 1];
    const article_id = ((_b = (_a = currentPage.$page) == null ? void 0 : _a.options) == null ? void 0 : _b.article_id) || ((_c = currentPage.options) == null ? void 0 : _c.article_id);
    console.log("分享给好友:", {
      options,
      article_id
    });
    return {
      title: "来看看这条内容",
      path: `/pages/article/articleDetail?article_id=${article_id}`,
      imageUrl: "",
      // 可以在这里设置分享图片
      success: (res) => {
        console.log("分享成功", res);
      },
      fail: (err) => {
        console.error("分享失败", err);
      }
    };
  },
  // 分享到朋友圈（微信小程序）
  onShareTimeline(options) {
    var _a, _b, _c;
    const pages = getCurrentPages();
    const currentPage = pages[pages.length - 1];
    const article_id = ((_b = (_a = currentPage.$page) == null ? void 0 : _a.options) == null ? void 0 : _b.article_id) || ((_c = currentPage.options) == null ? void 0 : _c.article_id);
    console.log("分享到朋友圈:", {
      options,
      article_id
    });
    return {
      title: "来看看这条内容",
      query: `article_id=${article_id}`,
      imageUrl: ""
    };
  }
};
const _sfc_main = /* @__PURE__ */ Object.assign(__default__, {
  __name: "articleDetail",
  props: {
    article_id: String,
    user_id: String
  },
  setup(__props) {
    const props = __props;
    const isLoading = common_vendor.ref(true);
    const isSubmitting = common_vendor.ref(false);
    const commentContent = common_vendor.ref("");
    const isCommentsLoading = common_vendor.ref(true);
    const userStore = store_user.useUserInfoStore();
    const articleApi = common_vendor.tr.importObject("articleKs", { customUI: true });
    const commentApi = common_vendor.tr.importObject("commentList", { customUI: true });
    common_vendor.tr.importObject("likeRecord", { customUI: true });
    const loginApi = common_vendor.tr.importObject("login", { customUI: true });
    const articleDetail = common_vendor.ref({});
    const articleComment = common_vendor.ref([]);
    const commentCount = common_vendor.computed(() => {
      return articleComment.value.length;
    });
    const isCheckingLogin = common_vendor.ref(false);
    common_vendor.ref(0);
    common_vendor.ref(false);
    const isVideoLoading = common_vendor.ref(true);
    const imageLoadStatus = common_vendor.ref({});
    const isAnyImageLoading = common_vendor.ref(true);
    const navInfo = common_vendor.ref(null);
    const tuijianRef = common_vendor.ref(null);
    common_vendor.ref(null);
    common_vendor.ref(null);
    common_vendor.ref(false);
    common_vendor.ref(true);
    common_vendor.ref(1e3);
    const previewVisible = common_vendor.ref(false);
    const previewImages = common_vendor.ref([]);
    const previewCurrent = common_vendor.ref(0);
    const videoContext = common_vendor.ref(null);
    const videoLoadStatus = common_vendor.ref("loading");
    const isPlaying = common_vendor.ref(true);
    const getArticleDetail = async () => {
      var _a, _b, _c;
      try {
        if (!props.article_id) {
          throw new Error("文章ID不能为空");
        }
        const res = await articleApi.getArticleDetal(
          props.article_id,
          ((_a = userStore.userInfo) == null ? void 0 : _a.uid) || null
        );
        if (!res || !res.articleRes || !res.articleRes.data || !Array.isArray(res.articleRes.data)) {
          throw new Error("获取文章详情失败：返回数据格式错误");
        }
        const articleData = res.articleRes.data[0];
        if (!articleData.content) {
          articleData.content = "暂无内容";
        }
        if (articleData.video && articleData.video.url) {
          if (!articleData.video.compressedURL) {
            articleData.video.compressedURL = articleData.video.url.startsWith("http") ? articleData.video.url : `https://aly2.jingle0350.cn${articleData.video.url}`;
          }
          articleData.videoURL = articleData.video.compressedURL || articleData.video.url;
          videoLoadStatus.value = "loading";
        }
        isLiked.value = articleData.is_liked || false;
        likeCount.value = articleData.like_count || 0;
        console.log("初始化点赞状态:", {
          isLiked: isLiked.value,
          likeCount: likeCount.value,
          articleData_is_liked: articleData.is_liked,
          userId: (_b = userStore.userInfo) == null ? void 0 : _b.uid
        });
        if (articleData.cate_id) {
          try {
            const cateApi = common_vendor.tr.importObject("cateKs", { customUI: true });
            const cateRes = await cateApi.get(articleData.cate_id);
            if (cateRes.data && cateRes.data[0]) {
              articleData.cate_name = cateRes.data[0].cate_name;
            }
          } catch (err) {
            console.error("获取分类名称失败:", err);
          }
        }
        if (articleData.user_id) {
          try {
            articleData.user = {
              nickName: articleData.user_nickName || "未知用户",
              avatarUrl: articleData.user_avatarUrl || "/static/images/default-avatar.png",
              mobile: articleData.user_mobile || "未填写"
            };
            console.log("使用文章中的用户信息:", articleData.user);
          } catch (err) {
            console.error("处理用户信息失败:", err);
            articleData.user = {
              nickName: "未知用户",
              avatarUrl: "/static/images/default-avatar.png",
              mobile: "未填写"
            };
          }
        }
        articleDetail.value = articleData;
        articleComment.value = res.comment || [];
        if (articleData.images && articleData.images.length) {
          articleData.images.forEach((_, index) => {
            imageLoadStatus.value[index] = "loading";
          });
          isAnyImageLoading.value = true;
        } else {
          isAnyImageLoading.value = false;
        }
        try {
          const configApi = common_vendor.tr.importObject("config", { customUI: true });
          const configRes = await configApi.getConfig("commentDisplay");
          navInfo.value = {
            isVisible: ((_c = configRes == null ? void 0 : configRes.data) == null ? void 0 : _c.isVisible) ?? true,
            // 默认显示
            title: "评论区"
          };
        } catch (err) {
          console.error("获取评论区显示状态失败:", err);
          navInfo.value = {
            isVisible: true,
            title: "评论区"
          };
        }
        if (articleData.videoURL) {
          articleData.videoURL = processMediaURL(articleData.videoURL, "video");
          videoLoadStatus.value = "loading";
        }
        if (articleDetail.value.videoURL) {
          setTimeout(() => {
            videoContext.value = common_vendor.index.createVideoContext("articleVideo");
          }, 300);
        }
      } catch (err) {
        console.error("获取文章详情失败：", err);
        common_vendor.index.showToast({
          title: "获取文章详情失败",
          icon: "none"
        });
      }
    };
    const getCommentList = async () => {
      var _a;
      try {
        if (!props.article_id) {
          throw new Error("文章ID不能为空");
        }
        const result = await commentApi.getCommentList(props.article_id);
        if (!result || result.code !== 0 || !Array.isArray(result.data)) {
          throw new Error(result.message || "获取评论列表失败");
        }
        const articleDetail2 = await articleApi.getArticleDetal(props.article_id);
        const commentLikes = ((_a = articleDetail2.articleRes.data[0]) == null ? void 0 : _a.comment_likes) || [];
        const processedComments = result.data.map((comment) => ({
          ...comment,
          isLiked: commentLikes.some(
            (like) => like.comment_id === comment._id && like.user_id === userStore.userInfo.uid
          ),
          likeCount: commentLikes.filter(
            (like) => like.comment_id === comment._id
          ).length,
          formatted_time: utils_formatTime.formatTime(comment.create_time)
        }));
        articleComment.value = processedComments;
        articleComment.value.sort((a, b) => b.create_time - a.create_time);
      } catch (err) {
        console.error("获取评论列表失败:", err);
        common_vendor.index.showToast({
          title: "获取评论列表失败",
          icon: "none",
          duration: 2e3
        });
      }
    };
    common_vendor.watch(() => articleComment.value.length, (newCount, oldCount) => {
      console.log("评论数量变化:", {
        oldCount,
        newCount
      });
    });
    const commentSubmit = async () => {
      if (isSubmitting.value) {
        console.log("[前端] 评论提交中，请勿重复提交");
        return;
      }
      try {
        if (!userStore.userInfo.uid || !userStore.userInfo.nickName) {
          throw new Error("用户信息不完整，请重新登录");
        }
        const content = commentContent.value.trim();
        if (!content) {
          console.log("[前端] 评论内容为空");
          return common_vendor.index.showToast({
            title: "评论内容不能为空",
            icon: "none",
            duration: 2e3
          });
        }
        console.log("[前端] 开始提交评论");
        isSubmitting.value = true;
        common_vendor.index.showLoading({
          title: "提交中...",
          mask: true
        });
        const commentData = {
          article_id: articleDetail.value._id,
          user_id: userStore.userInfo.uid,
          content,
          nickName: userStore.userInfo.nickName || "匿名用户",
          avatarUrl: userStore.userInfo.avatarUrl || ""
        };
        console.log("[前端] 评论数据:", commentData);
        const result = await commentApi.addComment(commentData);
        console.log("[前端] 评论提交结果:", result);
        if (result.code === 0) {
          console.log("[前端] 评论成功");
          commentContent.value = "";
          await getCommentList();
          common_vendor.index.showToast({
            title: "评论成功",
            icon: "success",
            duration: 2e3
          });
        } else {
          throw new Error(result.message || "评论失败");
        }
      } catch (err) {
        console.error("[前端] 评论失败:", {
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
        console.log("[前端] 评论提交完成");
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
          await getCommentList();
          common_vendor.index.showToast({
            title: "删除成功",
            icon: "success"
          });
        } else {
          throw new Error(result.message || "删除失败");
        }
      } catch (err) {
        console.error("删除失败:", err);
        common_vendor.index.showToast({
          title: typeof err === "string" ? err : err.message || "删除失败",
          icon: "none"
        });
      } finally {
        common_vendor.index.hideLoading();
      }
    };
    const handleCommentClick = async () => {
      try {
        const isLoggedIn = await customTestLogin();
        if (!isLoggedIn) {
          return;
        }
        common_vendor.index.showModal({
          title: "发表评论",
          editable: true,
          placeholderText: "评论点什么...",
          success: (res) => {
            if (res.confirm && res.content.trim()) {
              commentContent.value = res.content.trim();
              setTimeout(() => {
                commentSubmit().catch((err) => {
                  console.error("评论提交失败:", err);
                  common_vendor.index.showToast({
                    title: "评论失败，请重试",
                    icon: "none"
                  });
                });
              }, 100);
            }
          }
        });
      } catch (err) {
        console.error("评论点击处理失败:", err);
        common_vendor.index.showToast({
          title: "操作失败，请重试",
          icon: "none"
        });
      }
    };
    const goToHome = () => {
      common_vendor.index.redirectTo({
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
        console.error("拨打电话失败:", err);
        common_vendor.index.showToast({
          title: "操作失败，请重试",
          icon: "none"
        });
      }
    };
    const callPhone = async (phoneNumber, viewerInfo = {}) => {
      if (!phoneNumber || phoneNumber === "未填写") {
        return common_vendor.index.showToast({
          icon: "none",
          title: "没有联系方式"
        });
      }
      const recordParams = {
        article_id: props.article_id,
        caller_id: userStore.userInfo.uid || "",
        caller_nickName: userStore.userInfo.nickName || "",
        caller_avatarUrl: userStore.userInfo.avatarUrl || "",
        callee_id: viewerInfo.user_id || "",
        callee_nickName: viewerInfo.user_nickName || "",
        callee_mobile: phoneNumber,
        call_source: "viewer_list",
        call_status: "success"
        // 默认成功，失败后会更新
      };
      common_vendor.index.makePhoneCall({
        phoneNumber,
        success: async () => {
          console.log("拨打电话成功:", phoneNumber);
          try {
            recordParams.call_status = "success";
            const result = await articleApi.recordPhoneCall(recordParams);
            if (result.code === 0) {
              console.log("拨打记录保存成功");
              await loadViewers(true);
            } else {
              console.warn("拨打记录保存失败:", result.message);
            }
          } catch (err) {
            console.error("保存拨打记录失败:", err);
          }
        },
        fail: async (err) => {
          console.error("拨打电话失败:", err);
          try {
            recordParams.call_status = "failed";
            const result = await articleApi.recordPhoneCall(recordParams);
            if (result.code === 0) {
              console.log("拨打失败记录保存成功");
              await loadViewers(true);
            }
          } catch (recordErr) {
            console.error("保存失败记录失败:", recordErr);
          }
          common_vendor.index.showToast({
            title: "拨打电话失败",
            icon: "none"
          });
        }
      });
    };
    const customTestLogin = async () => {
      if (isCheckingLogin.value)
        return false;
      isCheckingLogin.value = true;
      try {
        if (userStore.userInfo.uid) {
          return true;
        }
        const res = await loginApi.login();
        if (res.code === 0) {
          userStore.setUserInfo(res.data);
          return true;
        }
        const currentRoute = `/pages/article/articleDetail?article_id=${props.article_id}`;
        const redirectUrl = encodeURIComponent(currentRoute);
        common_vendor.index.redirectTo({
          // 改用 redirectTo 替代 navigateTo
          url: `/pages/login/login?redirect=${redirectUrl}`
        });
        return false;
      } catch (err) {
        console.error("登录检查失败:", err);
        const currentRoute = `/pages/article/articleDetail?article_id=${props.article_id}`;
        const redirectUrl = encodeURIComponent(currentRoute);
        common_vendor.index.redirectTo({
          // 改用 redirectTo 替代 navigateTo
          url: `/pages/login/login?redirect=${redirectUrl}`
        });
        return false;
      } finally {
        common_vendor.index.hideLoading();
        isCheckingLogin.value = false;
      }
    };
    const updatePageView = async () => {
      try {
        if (!articleDetail.value._id)
          return;
        viewStartTime.value = Date.now();
        let platformType = "unknown";
        platformType = "kuaishou";
        const viewerInfo = {
          user_id: userStore.userInfo.uid || `guest_${Date.now()}`,
          user_nickName: userStore.userInfo.nickName || "访客",
          user_avatarUrl: userStore.userInfo.avatarUrl || "/static/images/touxiang.png",
          view_source: "direct",
          actual_view_duration: 0,
          device_info: {
            platform: platformType
            // 保存平台信息
          }
        };
        const result = await articleApi.updateLookCount(articleDetail.value._id, viewerInfo);
        if (result.code === 0) {
          articleDetail.value.look_count = result.data.look_count;
          console.log("浏览量更新成功, 平台:", platformType);
          common_vendor.index.$emit("updateArticleLookCount", {
            articleId: articleDetail.value._id,
            lookCount: articleDetail.value.look_count
          });
        }
      } catch (err) {
        console.error("更新浏览量失败:", err);
      }
    };
    common_vendor.onMounted(async () => {
      var _a;
      try {
        common_vendor.index.pageScrollTo({
          scrollTop: 0,
          duration: 0
        });
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
        getCommentList().catch((err) => {
          console.error("获取评论失败:", err);
        }).finally(() => {
          isCommentsLoading.value = false;
        });
        updatePageView().catch((err) => {
          console.error("更新浏览量失败:", err);
        });
      } catch (err) {
        console.error("页面初始化失败:", err);
        common_vendor.index.showToast({
          title: "加载失败，请重试",
          icon: "none"
        });
        setTimeout(() => {
          common_vendor.index.navigateBack();
        }, 1500);
      } finally {
        isLoading.value = false;
        isCommentsLoading.value = false;
      }
      common_vendor.index.showShareMenu({
        withShareTicket: true
      });
      setTimeout(() => {
        if (articleDetail.value && articleDetail.value.videoURL) {
          videoContext.value = common_vendor.index.createVideoContext("articleVideo");
        }
      }, 500);
      common_vendor.index.$on("updateCommentVisibility", (data) => {
        if (navInfo.value) {
          navInfo.value.isVisible = data.isVisible;
        } else {
          navInfo.value = {
            isVisible: data.isVisible,
            title: "评论区"
          };
        }
      });
    });
    let commentRefreshTimer;
    common_vendor.onMounted(() => {
      commentRefreshTimer = setInterval(async () => {
        await getCommentList();
      }, 6e4);
    });
    common_vendor.onUnmounted(() => {
      if (commentRefreshTimer) {
        clearInterval(commentRefreshTimer);
      }
      if (viewStartTime.value > 0 && userStore.userInfo.uid) {
        const duration = Math.floor((Date.now() - viewStartTime.value) / 1e3);
        if (duration > 0 && articleDetail.value._id) {
          articleApi.updateViewDuration(
            articleDetail.value._id,
            userStore.userInfo.uid || `guest_${Date.now()}`,
            duration
          ).catch((err) => {
            console.error("更新浏览时长失败:", err);
          });
        }
      }
      if (articleDetail.value && articleDetail.value._id) {
        common_vendor.index.$emit("updateArticleLookCount", {
          articleId: articleDetail.value._id,
          lookCount: articleDetail.value.look_count || 0
        });
      }
      common_vendor.index.$off("updateCommentVisibility");
    });
    const previewImage = (current) => {
      if (!articleDetail.value.images || !articleDetail.value.images.length)
        return;
      previewImages.value = articleDetail.value.images.map((img) => img.compressedURL);
      if (typeof current === "number") {
        previewCurrent.value = current;
      } else {
        const index = previewImages.value.findIndex((url) => url === current);
        previewCurrent.value = index >= 0 ? index : 0;
      }
      previewVisible.value = true;
    };
    const closePreview = () => {
      previewVisible.value = false;
    };
    const handlePreviewChange = (index) => {
      previewCurrent.value = index;
    };
    const handleVideoError = (err) => {
      console.error("视频播放错误:", err);
      videoLoadStatus.value = "error";
      common_vendor.index.showToast({
        title: "视频加载失败",
        icon: "none"
      });
    };
    const handleVideoLoaded = () => {
      videoLoadStatus.value = "loaded";
      isVideoLoading.value = false;
    };
    const handleVideoWaiting = () => {
      isVideoLoading.value = true;
    };
    const handleVideoCanPlay = () => {
      isVideoLoading.value = false;
    };
    const toggleVideoPlay = () => {
      if (videoContext.value) {
        if (isPlaying.value) {
          videoContext.value.pause();
        } else {
          videoContext.value.play();
        }
        isPlaying.value = !isPlaying.value;
      } else {
        videoContext.value = common_vendor.index.createVideoContext("articleVideo");
      }
    };
    const hasVideo = common_vendor.computed(() => {
      return articleDetail.value && articleDetail.value.videoURL;
    });
    const handleImageLoad = (index) => {
      imageLoadStatus.value[index] = "loaded";
      checkAllImagesLoaded();
    };
    const handleImageError = (index) => {
      console.error("Image loading failed for index:", index);
      imageLoadStatus.value[index] = "error";
      checkAllImagesLoaded();
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
        animationType: "slide-in-right",
        animationDuration: 300,
        success: () => {
          console.log("跳转到文章详情页成功:", articleId);
        },
        fail: (err) => {
          console.error("跳转到文章详情页失败:", err);
          common_vendor.index.showToast({
            title: "跳转失败",
            icon: "none"
          });
        }
      });
    };
    common_vendor.onReachBottom(() => {
      console.log("触发页面触底事件");
      if (tuijianRef.value) {
        tuijianRef.value.loadMore();
      }
    });
    common_vendor.ref(false);
    common_vendor.ref(1);
    common_vendor.ref({
      avatar: "",
      nickname: "用户"
    });
    const isLiked = common_vendor.ref(false);
    const likeCount = common_vendor.ref(0);
    const viewersListVisible = common_vendor.ref(false);
    const viewersList = common_vendor.ref([]);
    const viewersPageNo = common_vendor.ref(1);
    const viewersPageSize = common_vendor.ref(20);
    const viewersTotal = common_vendor.ref(0);
    const hasMoreViewers = common_vendor.ref(true);
    const viewersLoading = common_vendor.ref(false);
    const viewersRefreshing = common_vendor.ref(false);
    const viewStartTime = common_vendor.ref(0);
    const handleLikeChange = (data) => {
      console.log("点赞状态变化:", data);
      isLiked.value = data.isLiked;
      likeCount.value = data.likeCount;
      if (articleDetail.value) {
        articleDetail.value.like_count = data.likeCount;
        articleDetail.value.is_liked = data.isLiked;
      }
    };
    const showViewersList = async () => {
      try {
        const isLoggedIn = await customTestLogin();
        if (!isLoggedIn)
          return;
        if (!userStore.userInfo || userStore.userInfo.uid !== articleDetail.value.user_id) {
          common_vendor.index.showToast({ title: "只有作者才能查看浏览者", icon: "none" });
          return;
        }
        common_vendor.index.showLoading({ title: "加载中...", mask: true });
        viewersList.value = [];
        viewersPageNo.value = 1;
        hasMoreViewers.value = true;
        viewersTotal.value = 0;
        viewersListVisible.value = true;
        await loadViewers(true);
        common_vendor.index.hideLoading();
      } catch (err) {
        console.error("显示浏览者列表失败:", err);
        common_vendor.index.hideLoading();
        common_vendor.index.showToast({ title: "操作失败", icon: "none" });
      }
    };
    const loadViewers = async (refresh = false) => {
      try {
        if (viewersLoading.value)
          return;
        if (refresh) {
          viewersPageNo.value = 1;
          viewersList.value = [];
          hasMoreViewers.value = true;
        } else if (!hasMoreViewers.value)
          return;
        viewersLoading.value = true;
        const result = await articleApi.getViewers(props.article_id, {
          pageNo: viewersPageNo.value,
          pageSize: viewersPageSize.value
        });
        if (result.code === 0) {
          const { viewers, total, totalPages } = result.data;
          if (refresh) {
            viewersList.value = viewers;
          } else {
            viewersList.value.push(...viewers);
          }
          viewersTotal.value = total;
          hasMoreViewers.value = viewersPageNo.value < totalPages;
          if (hasMoreViewers.value)
            viewersPageNo.value++;
        } else {
          common_vendor.index.showToast({ title: result.message || "获取失败", icon: "none" });
        }
      } catch (err) {
        console.error("加载失败:", err);
        common_vendor.index.showToast({ title: "加载失败", icon: "none" });
      } finally {
        viewersLoading.value = false;
        viewersRefreshing.value = false;
      }
    };
    const closeViewersList = () => {
      viewersListVisible.value = false;
      viewersList.value = [];
      viewersPageNo.value = 1;
      hasMoreViewers.value = true;
    };
    const handleViewersRefresh = async () => {
      viewersRefreshing.value = true;
      await loadViewers(true);
    };
    const formatDuration = (seconds) => {
      if (!seconds || seconds <= 0)
        return "0秒";
      const totalSeconds = Math.floor(seconds);
      if (totalSeconds < 60)
        return `${totalSeconds}秒`;
      const minutes = Math.floor(totalSeconds / 60);
      const secs = totalSeconds % 60;
      return `${minutes}分${secs}秒`;
    };
    const isKuaishouUser = (viewer) => {
      if (!viewer.user_id || viewer.user_id.startsWith("guest_")) {
        return false;
      }
      if (viewer.device_info && viewer.device_info.platform) {
        const platform = viewer.device_info.platform.toLowerCase();
        return platform === "kuaishou" || platform.includes("ks");
      }
      return false;
    };
    const isWeixinUser = (viewer) => {
      if (!viewer.user_id || viewer.user_id.startsWith("guest_")) {
        return false;
      }
      if (viewer.device_info && viewer.device_info.platform) {
        const platform = viewer.device_info.platform.toLowerCase();
        return platform === "weixin" || platform.includes("wechat");
      }
      return false;
    };
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
    const handleVideoPlay = () => {
      isPlaying.value = true;
    };
    const handleVideoPause = () => {
      isPlaying.value = false;
    };
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
    common_vendor.watch(() => articleDetail.value._id, (newVal) => {
      if (newVal && articleDetail.value.videoURL) {
        common_vendor.nextTick$1(() => {
          setTimeout(() => {
            videoContext.value = common_vendor.index.createVideoContext("articleVideo");
            console.log("视频上下文已创建");
          }, 300);
        });
      }
    });
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.p({
          loading: isLoading.value && !articleDetail.value._id
        }),
        b: articleDetail.value.user && articleDetail.value.user.avatarUrl || articleDetail.value.user_avatarUrl || articleDetail.value.avatarUrl || "/static/images/default-avatar.png",
        c: common_vendor.t(articleDetail.value.user && articleDetail.value.user.nickName || articleDetail.value.user_nickName || articleDetail.value.nickName || articleDetail.value.user_name || "匿名用户"),
        d: common_vendor.t(common_vendor.unref(utils_formatTime.formatTime)(articleDetail.value.create_time)),
        e: common_vendor.t(articleDetail.value.look_count || 0),
        f: common_vendor.o(($event) => common_vendor.unref(userStore).userInfo && common_vendor.unref(userStore).userInfo.uid === articleDetail.value.user_id ? showViewersList() : null),
        g: common_vendor.p({
          type: "phone-filled",
          size: "24",
          color: "#07C160"
        }),
        h: common_vendor.o(handleCall),
        i: articleDetail.value.videoURL
      }, articleDetail.value.videoURL ? common_vendor.e({
        j: videoLoadStatus.value === "loading"
      }, videoLoadStatus.value === "loading" ? {
        k: common_vendor.p({
          status: "loading",
          contentText: {
            contentrefresh: "视频加载中..."
          }
        })
      } : {}, {
        l: videoLoadStatus.value === "error"
      }, videoLoadStatus.value === "error" ? {
        m: common_vendor.p({
          type: "videocam-slash",
          size: "50",
          color: "#CCCCCC"
        })
      } : {}, {
        n: articleDetail.value.videoURL,
        o: articleDetail.value.images && articleDetail.value.images[0] ? articleDetail.value.images[0].compressedURL : "",
        p: common_vendor.o(handleVideoError),
        q: common_vendor.o(handleVideoLoaded),
        r: common_vendor.o(handleVideoWaiting),
        s: common_vendor.o(handleVideoCanPlay),
        t: common_vendor.o(handleVideoPlay),
        v: common_vendor.o(handleVideoPause),
        w: !isPlaying.value && videoLoadStatus.value === "loaded"
      }, !isPlaying.value && videoLoadStatus.value === "loaded" ? {
        x: common_vendor.p({
          type: "videocam-filled",
          size: "36",
          color: "#FFFFFF"
        }),
        y: common_vendor.o(toggleVideoPlay)
      } : {}) : {}, {
        z: articleDetail.value.images && articleDetail.value.images.length
      }, articleDetail.value.images && articleDetail.value.images.length ? common_vendor.e({
        A: articleDetail.value.images.length > 1
      }, articleDetail.value.images.length > 1 ? {
        B: common_vendor.p({
          type: "image",
          size: "16",
          color: "#FFFFFF"
        }),
        C: common_vendor.t(articleDetail.value.images.length)
      } : {}, {
        D: common_vendor.f(articleDetail.value.images.length > 9 ? articleDetail.value.images.slice(0, 9) : articleDetail.value.images, (item, index, i0) => {
          return common_vendor.e({
            a: item.compressedURL,
            b: common_vendor.o(($event) => handleImageLoad(index)),
            c: common_vendor.o(($event) => handleImageError(index)),
            d: index === 8 && articleDetail.value.images.length > 9
          }, index === 8 && articleDetail.value.images.length > 9 ? {
            e: common_vendor.t(articleDetail.value.images.length - 9)
          } : {}, {
            f: index,
            g: common_vendor.o(($event) => previewImage(index))
          });
        }),
        E: common_vendor.n(`grid-${articleDetail.value.images.length > 9 ? 9 : articleDetail.value.images.length}`)
      }) : {}, {
        F: articleDetail.value.content
      }, articleDetail.value.content ? {
        G: common_vendor.t(articleDetail.value.content)
      } : {}, {
        H: articleDetail.value.images && articleDetail.value.images.length
      }, articleDetail.value.images && articleDetail.value.images.length ? {
        I: common_vendor.t(articleDetail.value.images.length)
      } : {}, {
        J: articleDetail.value.images && articleDetail.value.images.length
      }, articleDetail.value.images && articleDetail.value.images.length ? {
        K: common_vendor.f(articleDetail.value.images, (item, index, i0) => {
          return {
            a: index,
            b: item.compressedURL,
            c: common_vendor.o(($event) => previewImage(index))
          };
        })
      } : {}, {
        L: navInfo.value && navInfo.value.isVisible
      }, navInfo.value && navInfo.value.isVisible ? common_vendor.e({
        M: isCommentsLoading.value && !articleComment.value.length
      }, isCommentsLoading.value && !articleComment.value.length ? {} : commentCount.value === 0 ? {
        O: common_vendor.p({
          type: "chat",
          size: "50",
          color: "#CCCCCC"
        })
      } : {}, {
        N: commentCount.value === 0,
        P: common_vendor.t(commentCount.value),
        Q: common_vendor.p({
          type: "chat",
          size: "20",
          color: "#999"
        }),
        R: common_vendor.o(handleCommentClick)
      }) : {}, {
        S: navInfo.value && navInfo.value.isVisible
      }, navInfo.value && navInfo.value.isVisible ? {
        T: common_vendor.o(handelDelComment),
        U: common_vendor.p({
          comments: articleComment.value
        })
      } : {}, {
        V: common_vendor.sr(tuijianRef, "786907d5-9", {
          "k": "tuijianRef"
        }),
        W: common_vendor.o(handleArticleClick),
        X: common_vendor.p({
          ["current-article-id"]: __props.article_id,
          cate_id: articleDetail.value.cate_id
        }),
        Y: !hasVideo.value ? 1 : "",
        Z: common_vendor.o(($event) => {
          var _a;
          return (_a = tuijianRef.value) == null ? void 0 : _a.loadMore();
        }),
        aa: isLoading.value,
        ab: common_vendor.o(getArticleDetail),
        ac: common_vendor.p({
          type: "home",
          size: "24",
          color: "#444444"
        }),
        ad: common_vendor.o(goToHome),
        ae: common_vendor.o(handleLikeChange),
        af: common_vendor.p({
          articleId: __props.article_id,
          userId: common_vendor.unref(userStore).userInfo.uid,
          initialLikeCount: likeCount.value,
          initialIsLiked: isLiked.value,
          size: 24,
          showCount: true,
          showText: false,
          userAvatar: common_vendor.unref(userStore).userInfo.avatarUrl,
          userNickname: common_vendor.unref(userStore).userInfo.nickName
        }),
        ag: common_vendor.o(handleCall),
        ah: articleDetail.value._id,
        ai: common_vendor.o(closePreview),
        aj: common_vendor.o(handlePreviewChange),
        ak: common_vendor.p({
          visible: previewVisible.value,
          images: previewImages.value,
          current: previewCurrent.value
        }),
        al: viewersListVisible.value
      }, viewersListVisible.value ? common_vendor.e({
        am: common_vendor.t(viewersTotal.value),
        an: common_vendor.p({
          type: "closeempty",
          size: "24",
          color: "#666"
        }),
        ao: common_vendor.o(closeViewersList),
        ap: common_vendor.f(viewersList.value, (viewer, index, i0) => {
          return common_vendor.e({
            a: viewer.user_avatarUrl || "/static/images/touxiang.png",
            b: common_vendor.t(viewer.user_nickName || "匿名用户"),
            c: viewer.user_id && viewer.user_id.startsWith("guest_")
          }, viewer.user_id && viewer.user_id.startsWith("guest_") ? {} : {}, {
            d: isWeixinUser(viewer)
          }, isWeixinUser(viewer) ? {} : {}, {
            e: isKuaishouUser(viewer)
          }, isKuaishouUser(viewer) ? {} : {}, {
            f: viewer.is_liked
          }, viewer.is_liked ? {
            g: "786907d5-14-" + i0,
            h: common_vendor.p({
              type: "heart-filled",
              size: "16",
              color: "#FF5D5B"
            })
          } : {}, {
            i: common_vendor.t(common_vendor.unref(utils_formatTime.formatTime)(viewer.view_time)),
            j: viewer.view_duration > 0
          }, viewer.view_duration > 0 ? {
            k: common_vendor.t(formatDuration(viewer.view_duration))
          } : {}, {
            l: viewer.user_mobile
          }, viewer.user_mobile ? common_vendor.e({
            m: "786907d5-15-" + i0,
            n: common_vendor.p({
              type: "phone",
              size: "20",
              color: "#07C160"
            }),
            o: viewer.call_count > 0
          }, viewer.call_count > 0 ? {
            p: common_vendor.t(viewer.call_count > 99 ? "99+" : viewer.call_count)
          } : {}, {
            q: common_vendor.o(($event) => callPhone(viewer.user_mobile, viewer))
          }) : {}, {
            r: index
          });
        }),
        aq: viewersLoading.value
      }, viewersLoading.value ? {} : {}, {
        ar: !hasMoreViewers.value && viewersList.value.length > 0
      }, !hasMoreViewers.value && viewersList.value.length > 0 ? {} : {}, {
        as: viewersList.value.length === 0 && !viewersLoading.value
      }, viewersList.value.length === 0 && !viewersLoading.value ? {
        at: common_vendor.p({
          type: "eye-slash",
          size: "50",
          color: "#CCCCCC"
        })
      } : {}, {
        av: common_vendor.o(() => loadViewers(false)),
        aw: viewersRefreshing.value,
        ax: common_vendor.o(handleViewersRefresh),
        ay: common_vendor.o(() => {
        }),
        az: common_vendor.o(closeViewersList)
      }) : {}, {
        aA: common_vendor.gei(_ctx, "")
      });
    };
  }
});
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-786907d5"]]);
_sfc_main.__runtimeHooks = 6;
ks.createPage(MiniProgramPage);
