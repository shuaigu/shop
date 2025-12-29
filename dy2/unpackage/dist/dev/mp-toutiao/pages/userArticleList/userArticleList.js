"use strict";
const common_vendor = require("../../common/vendor.js");
const store_user = require("../../store/user.js");
require("../../store/authSwitch.js");
const _sfc_main = {
  components: {},
  data() {
    return {
      // 视频播放相关
      videoUrl: "",
      // 默认视频地址
      videoVisible: false,
      // 控制视频组件显示状态
      isVideoPlaying: false,
      // 视频是否正在播放
      videoContext: null,
      // 视频上下文对象
      userClosedVideo: false,
      // 用户是否主动关闭了视频
      isVideoSpeedUp: false,
      // 视频是否正在倍速播放
      videoDefinition: null,
      // 视频清晰度配置
      // 用户信息和文章列表
      userArticleData: [],
      userArticleInfo: {
        avatarUrl: "/static/images/default-avatar.png",
        nickName: "加载中...",
        mobile: "未填写"
      },
      // 最新文章图片
      latestArticleImages: [],
      // 分页相关
      pageNo: 1,
      pageSize: 8,
      // 每页加载的数据条数，与后端默认值保持一致
      // 加载状态
      status: "more",
      // 初始状态为 'more'
      isLoading: false,
      // 是否正在加载
      hasMore: true,
      // 是否还有更多数据
      loadMoreText: {
        contentdown: "上拉加载更多",
        contentrefresh: "加载中...",
        contentnomore: "~ 已经到底啦 ~"
      },
      // 用户信息store
      userStore: null,
      // 头像点击控制状态
      avatarClickEnabled: true,
      // 下拉刷新相关
      isRefreshing: false,
      refreshStartTime: 0,
      // 记录开始刷新的时间
      // 添加触底加载防抖变量
      scrollToLowerTimer: null,
      isScrollLoading: false,
      totalArticleCount: 0,
      // 文章总数
      // 黑名单相关
      blacklistedUrls: [],
      // 视频重试计数
      videoRetryCount: 0,
      // 视频字段优先级顺序
      videoFieldPriority: [
        "videoURL",
        // 首先检查大写URL
        "videoUrl",
        // 然后检查首字母大写URL
        "video_url",
        "videoSrc",
        "video",
        "video_src",
        "url"
      ]
    };
  },
  props: {
    userId: String
  },
  computed: {
    // 计算文章总数，便于在模板和分享中使用
    articleTotal() {
      return this.totalArticleCount || 0;
    }
  },
  // 页面加载时设置分享数据
  onLoad(options) {
    if (options.userId) {
      this.shareUserId = options.userId;
    }
    this.userStore = store_user.useUserInfoStore();
    this.getSendOnState();
    this.getUserArticleCount();
    this.getArticelList(true);
    this.initVideoFromUrl();
    common_vendor.index.$on("viewCountUpdated", (articleId) => {
      this.updateLocalViewCount(articleId);
    });
    common_vendor.index.$on("avatarClickChanged", (newState) => {
      common_vendor.index.__f__("log", "at pages/userArticleList/userArticleList.vue:122", "用户文章列表页面收到头像点击状态变化事件:", newState);
      this.avatarClickEnabled = newState;
    });
    common_vendor.index.$on("globalRefresh", (data) => {
      common_vendor.index.__f__("log", "at pages/userArticleList/userArticleList.vue:128", "用户文章列表收到全局刷新事件:", data);
      if (data && data.pages && data.pages.includes("userArticleList")) {
        common_vendor.index.__f__("log", "at pages/userArticleList/userArticleList.vue:131", "正在刷新用户文章列表...");
        this.getUserArticleCount();
        this.getArticelList(true);
      }
    });
  },
  // 页面卸载时移除事件监听
  onUnload() {
    common_vendor.index.$off("viewCountUpdated");
    common_vendor.index.$off("avatarClickChanged");
    common_vendor.index.$off("globalRefresh");
    if (this.scrollToLowerTimer) {
      clearTimeout(this.scrollToLowerTimer);
      this.scrollToLowerTimer = null;
    }
  },
  // 组件销毁前清理资源
  beforeDestroy() {
    if (this.scrollToLowerTimer) {
      clearTimeout(this.scrollToLowerTimer);
      this.scrollToLowerTimer = null;
    }
  },
  // 监听页面触底事件
  onReachBottom() {
    common_vendor.index.__f__("log", "at pages/userArticleList/userArticleList.vue:170", "原生触底事件被触发");
    if (this.isScrollLoading || this.scrollToLowerTimer) {
      return;
    }
    this.scrolltolower();
  },
  methods: {
    // 检查第一篇文章是否包含视频URL字段
    checkFirstArticleVideo() {
      if (this.userClosedVideo) {
        common_vendor.index.__f__("log", "at pages/userArticleList/userArticleList.vue:184", "用户已主动关闭视频，跳过视频检查");
        return false;
      }
      if (this.videoVisible && this.videoUrl) {
        common_vendor.index.__f__("log", "at pages/userArticleList/userArticleList.vue:190", "已有视频在播放，跳过视频检查");
        return false;
      }
      if (!this.userArticleData || this.userArticleData.length === 0) {
        common_vendor.index.__f__("log", "at pages/userArticleList/userArticleList.vue:196", "没有文章数据，无法检查视频");
        return false;
      }
      const firstArticle = this.userArticleData[0];
      const videoUrl = this.getVideoUrlFromArticle(firstArticle);
      if (videoUrl) {
        if (this.isUrlBlacklisted(videoUrl)) {
          common_vendor.index.__f__("log", "at pages/userArticleList/userArticleList.vue:210", "视频URL在黑名单中，跳过:", videoUrl);
          return false;
        }
        this.videoUrl = videoUrl;
        this.videoVisible = true;
        this.$nextTick(() => {
          this.initVideoContext();
        });
        return true;
      }
      return false;
    },
    // 尝试从URL直接初始化视频（处理数据库中的直接videoURL字段）
    initVideoFromUrl() {
      const pages = getCurrentPages();
      const currentPage = pages[pages.length - 1];
      if (currentPage && currentPage.options) {
        common_vendor.index.__f__("log", "at pages/userArticleList/userArticleList.vue:235", "检查页面参数是否包含视频URL");
        const possibleParams = ["videoURL", "videoUrl", "video_url", "video"];
        let videoUrl = null;
        for (const param of possibleParams) {
          if (currentPage.options[param]) {
            videoUrl = decodeURIComponent(currentPage.options[param]);
            common_vendor.index.__f__("log", "at pages/userArticleList/userArticleList.vue:244", `在页面参数中找到视频URL(${param}):`, videoUrl);
            break;
          }
        }
        if (videoUrl && this.isValidVideoUrl(videoUrl)) {
          common_vendor.index.__f__("log", "at pages/userArticleList/userArticleList.vue:251", "设置从页面参数中提取的视频URL:", videoUrl);
          this.videoUrl = videoUrl;
          this.videoVisible = true;
          this.$nextTick(() => {
            this.initVideoContext();
          });
          return true;
        }
      }
      return false;
    },
    // 获取权限开关状态
    async getSendOnState() {
      try {
        common_vendor.index.__f__("log", "at pages/userArticleList/userArticleList.vue:270", "正在获取按钮状态...");
        const sendOnApi = common_vendor.nr.importObject("sendOn", { customUI: true });
        const res = await sendOnApi.get();
        if (res && res.data && res.data.length > 0) {
          const serverAvatarClickState = res.data[0].avatarClick !== void 0 ? res.data[0].avatarClick : true;
          this.avatarClickEnabled = serverAvatarClickState;
          common_vendor.index.__f__("log", "at pages/userArticleList/userArticleList.vue:282", "头像点击状态:", this.avatarClickEnabled);
        } else {
          common_vendor.index.__f__("error", "at pages/userArticleList/userArticleList.vue:284", "获取按钮状态失败: 数据格式不正确");
        }
      } catch (err) {
        common_vendor.index.__f__("error", "at pages/userArticleList/userArticleList.vue:287", "获取按钮状态失败:", err);
      }
    },
    // 请求云对象获取文章总数
    async getUserArticleCount() {
      if (!this.userId) {
        common_vendor.index.__f__("log", "at pages/userArticleList/userArticleList.vue:294", "用户ID不存在，无法获取文章总数");
        return;
      }
      common_vendor.index.__f__("log", "at pages/userArticleList/userArticleList.vue:298", "通过云对象请求文章总数，用户ID:", this.userId);
      try {
        const articleApi = common_vendor.nr.importObject("articleDy", { customUI: true });
        const result = await articleApi.getArticleList(this.userId, 1, 1);
        if (result && result.total !== void 0) {
          this.totalArticleCount = result.total;
          common_vendor.index.__f__("log", "at pages/userArticleList/userArticleList.vue:310", "云对象通过getArticleList获取到文章总数:", this.totalArticleCount);
          return this.totalArticleCount;
        } else {
          common_vendor.index.__f__("error", "at pages/userArticleList/userArticleList.vue:314", "云对象获取文章总数失败: 未返回total字段");
          return null;
        }
      } catch (err) {
        common_vendor.index.__f__("error", "at pages/userArticleList/userArticleList.vue:318", "云对象获取文章总数出错:", err);
        this.totalArticleCount = 0;
        common_vendor.index.__f__("log", "at pages/userArticleList/userArticleList.vue:322", "云对象请求失败，设置文章总数为0");
        return null;
      }
    },
    // 获取用户文章列表（首次加载或重置）
    async getArticelList(isReset = false) {
      this.isLoading = true;
      this.status = "loading";
      if (isReset) {
        this.pageNo = 1;
        this.userArticleData = [];
      }
      return new Promise(async (resolve, reject) => {
        try {
          const articleApi = common_vendor.nr.importObject("articleDy", { customUI: true });
          const res = await articleApi.getArticleList(this.userId, this.pageNo, this.pageSize);
          if (res && res.total !== void 0) {
            this.totalArticleCount = res.total;
            common_vendor.index.__f__("log", "at pages/userArticleList/userArticleList.vue:346", "获取到文章总数:", this.totalArticleCount);
          }
          if (res && res.userInfo) {
            this.userArticleInfo = res.userInfo;
            if (this.userId === this.userStore.userInfo.uid) {
              this.userStore.setUserInfo({
                ...this.userStore.userInfo,
                nickName: res.userInfo.nickName || this.userStore.userInfo.nickName,
                avatarUrl: res.userInfo.avatarUrl || this.userStore.userInfo.avatarUrl
              });
            }
            this.$nextTick(() => {
              this.extractLatestArticleImages();
              this.checkFirstArticleVideo();
              this.extractVideoFromArticles();
            });
          } else {
            if (isReset) {
              this.userArticleData = [];
            }
            this.hasMore = false;
            this.status = "noMore";
          }
          if (res && res.data) {
            if (isReset) {
              this.userArticleData = res.data;
            } else {
              this.userArticleData = [...this.userArticleData, ...res.data];
            }
            this.userArticleData.forEach((article) => {
              if (!article.user_avatarUrl && this.userArticleInfo.avatarUrl) {
                article.user_avatarUrl = this.userArticleInfo.avatarUrl;
              }
              if (!article.user_nickName && this.userArticleInfo.nickName) {
                article.user_nickName = this.userArticleInfo.nickName;
              }
            });
            this.hasMore = res.data.length >= this.pageSize;
            this.status = this.hasMore ? "more" : "noMore";
            this.$nextTick(() => {
              this.extractLatestArticleImages();
              this.checkFirstArticleVideo();
              this.extractVideoFromArticles();
            });
          } else {
            if (isReset) {
              this.userArticleData = [];
            }
            this.hasMore = false;
            this.status = "noMore";
          }
          resolve();
        } catch (err) {
          common_vendor.index.__f__("error", "at pages/userArticleList/userArticleList.vue:420", "获取用户文章列表失败:", err);
          if (isReset) {
            this.userArticleData = [];
          }
          this.userArticleInfo = {};
          this.status = "noMore";
          this.hasMore = false;
          common_vendor.index.showToast({
            title: "获取数据失败，请重试",
            icon: "none"
          });
          reject(err);
        } finally {
          this.isLoading = false;
          this.isRefreshing = false;
        }
      });
    },
    // 触底加载时，不影响视频状态
    scrolltolower() {
      common_vendor.index.__f__("log", "at pages/userArticleList/userArticleList.vue:445", "触底加载被触发，状态:", { isLoading: this.isLoading, hasMore: this.hasMore, isScrollLoading: this.isScrollLoading });
      if (this.isLoading || !this.hasMore || this.isScrollLoading) {
        common_vendor.index.__f__("log", "at pages/userArticleList/userArticleList.vue:449", "跳过加载: " + (this.isLoading ? "正在加载中" : this.isScrollLoading ? "防抖期间" : "没有更多数据"));
        return;
      }
      this.isScrollLoading = true;
      this.status = "loading";
      if (this.scrollToLowerTimer) {
        clearTimeout(this.scrollToLowerTimer);
      }
      let savedVideoState = null;
      if (this.videoVisible && this.videoContext) {
        savedVideoState = {
          isPlaying: this.isVideoPlaying,
          position: 0,
          visible: this.videoVisible
        };
        try {
          this.videoContext.pause();
          savedVideoState.position = this.videoContext.currentTime || 0;
          if (savedVideoState.isPlaying) {
            this.videoContext.play();
          }
        } catch (e) {
          common_vendor.index.__f__("error", "at pages/userArticleList/userArticleList.vue:482", "保存视频状态时出错:", e);
        }
      }
      this.scrollToLowerTimer = setTimeout(() => {
        common_vendor.index.__f__("log", "at pages/userArticleList/userArticleList.vue:488", "开始加载更多数据 (防抖后)，保存的视频状态:", savedVideoState);
        this.loadMoreData(savedVideoState);
      }, 500);
    },
    // 加载更多数据
    async loadMoreData(savedVideoState = null) {
      if (this.isLoading || !this.hasMore) {
        common_vendor.index.__f__("log", "at pages/userArticleList/userArticleList.vue:498", "跳过加载更多:", { isLoading: this.isLoading, hasMore: this.hasMore });
        this.isScrollLoading = false;
        return;
      }
      common_vendor.index.__f__("log", "at pages/userArticleList/userArticleList.vue:503", `开始加载第${this.pageNo + 1}页数据，视频状态:`, savedVideoState);
      this.status = "loading";
      this.isLoading = true;
      const loadStartTime = Date.now();
      const minLoadingTime = 500;
      this.pageNo++;
      try {
        await this.getArticelList();
        const loadDuration = Date.now() - loadStartTime;
        if (loadDuration < minLoadingTime) {
          await new Promise((resolve) => setTimeout(resolve, minLoadingTime - loadDuration));
        }
        common_vendor.index.__f__("log", "at pages/userArticleList/userArticleList.vue:523", `第${this.pageNo}页数据加载完成, 当前状态:`, {
          articleCount: this.userArticleData.length,
          hasMore: this.hasMore,
          status: this.status
        });
        this.$nextTick(() => {
          this.restoreVideoState(savedVideoState);
        });
      } catch (err) {
        if (err && err.message === "请求进行中") {
          common_vendor.index.__f__("log", "at pages/userArticleList/userArticleList.vue:536", "忽略并发请求:", err.message);
        } else {
          common_vendor.index.__f__("error", "at pages/userArticleList/userArticleList.vue:538", "加载更多数据失败:", err);
        }
        this.pageNo--;
        this.status = "more";
        this.$nextTick(() => {
          this.restoreVideoState(savedVideoState);
        });
      } finally {
        this.isLoading = false;
        this.isScrollLoading = false;
      }
    },
    // 恢复视频状态的方法
    restoreVideoState(savedVideoState) {
      if (!savedVideoState)
        return;
      common_vendor.index.__f__("log", "at pages/userArticleList/userArticleList.vue:559", "尝试恢复视频状态:", savedVideoState, "用户关闭标记:", this.userClosedVideo);
      if (this.userClosedVideo) {
        common_vendor.index.__f__("log", "at pages/userArticleList/userArticleList.vue:563", "用户已主动关闭视频，不恢复视频状态");
        return;
      }
      if (savedVideoState.visible !== this.videoVisible) {
        this.videoVisible = savedVideoState.visible;
      }
      if (this.videoVisible && this.videoUrl) {
        this.videoContext = common_vendor.index.createVideoContext("myVideo", this);
        if (this.videoContext) {
          try {
            if (savedVideoState.position > 0) {
              this.videoContext.seek(savedVideoState.position);
            }
            if (savedVideoState.isPlaying) {
              this.videoContext.play();
              this.isVideoPlaying = true;
            } else {
              this.videoContext.pause();
              this.isVideoPlaying = false;
            }
            common_vendor.index.__f__("log", "at pages/userArticleList/userArticleList.vue:593", "视频状态恢复成功");
          } catch (e) {
            common_vendor.index.__f__("error", "at pages/userArticleList/userArticleList.vue:595", "恢复视频状态时出错:", e);
          }
        }
      }
    },
    // 处理删除
    async handleDelete(article_id) {
      try {
        common_vendor.index.showModal({
          title: "确认删除",
          content: "确定要删除这篇文章吗？",
          success: async (result) => {
            if (result.confirm) {
              common_vendor.index.showLoading({
                title: "删除中...",
                mask: true
              });
              const articleApi = common_vendor.nr.importObject("articleDy", { customUI: true });
              const res = await articleApi.del(article_id, this.userStore.userInfo.uid);
              common_vendor.index.__f__("log", "at pages/userArticleList/userArticleList.vue:620", "删除返回结果:", res);
              if (res && res.deleted) {
                const index = this.userArticleData.findIndex((item) => item._id === article_id);
                if (index !== -1) {
                  this.userArticleData.splice(index, 1);
                }
                common_vendor.index.hideLoading();
                common_vendor.index.showToast({
                  title: "删除成功",
                  icon: "success",
                  duration: 1500
                });
              } else {
                throw new Error("删除失败，请重试");
              }
            }
          }
        });
      } catch (err) {
        common_vendor.index.__f__("error", "at pages/userArticleList/userArticleList.vue:644", "删除出错:", err);
        common_vendor.index.hideLoading();
        common_vendor.index.showToast({
          title: err.message || "删除失败，请重试",
          icon: "none",
          duration: 2e3
        });
      }
    },
    // 图片预览
    previewImage(urls, current) {
      common_vendor.index.previewImage({
        urls,
        current
      });
    },
    // 处理联系方式
    handleContact() {
      if (!this.userArticleInfo || this.userArticleInfo.mobile === "未填写") {
        return common_vendor.index.showToast({
          icon: "none",
          title: "他并不想让人联系"
        });
      }
      common_vendor.index.makePhoneCall({
        phoneNumber: this.userArticleInfo.mobile
      });
    },
    // 文章列表触底时触发
    scrolltolower() {
      common_vendor.index.__f__("log", "at pages/userArticleList/userArticleList.vue:678", "触底加载被触发，状态:", { isLoading: this.isLoading, hasMore: this.hasMore, isScrollLoading: this.isScrollLoading });
      if (this.isLoading || !this.hasMore || this.isScrollLoading) {
        common_vendor.index.__f__("log", "at pages/userArticleList/userArticleList.vue:682", "跳过加载: " + (this.isLoading ? "正在加载中" : this.isScrollLoading ? "防抖期间" : "没有更多数据"));
        return;
      }
      this.isScrollLoading = true;
      this.status = "loading";
      if (this.scrollToLowerTimer) {
        clearTimeout(this.scrollToLowerTimer);
      }
      let savedVideoState = null;
      if (this.videoVisible && this.videoContext) {
        savedVideoState = {
          isPlaying: this.isVideoPlaying,
          position: 0,
          visible: this.videoVisible
        };
        try {
          this.videoContext.pause();
          savedVideoState.position = this.videoContext.currentTime || 0;
          if (savedVideoState.isPlaying) {
            this.videoContext.play();
          }
        } catch (e) {
          common_vendor.index.__f__("error", "at pages/userArticleList/userArticleList.vue:715", "保存视频状态时出错:", e);
        }
      }
      this.scrollToLowerTimer = setTimeout(() => {
        common_vendor.index.__f__("log", "at pages/userArticleList/userArticleList.vue:721", "开始加载更多数据 (防抖后)，保存的视频状态:", savedVideoState);
        this.loadMoreData(savedVideoState);
      }, 500);
    },
    // 更新本地文章浏览量数据
    updateLocalViewCount(articleId) {
      const article = this.userArticleData.find((item) => item._id === articleId);
      if (article) {
        if (article.look_count !== void 0) {
          article.look_count++;
        } else {
          article.look_count = 1;
        }
      }
    },
    // 预览最新文章图片
    previewLatestImages(index) {
      if (this.latestArticleImages && this.latestArticleImages.length > 0) {
        common_vendor.index.previewImage({
          current: this.latestArticleImages[index],
          urls: this.latestArticleImages
        });
      }
    },
    // 获取文章的图片
    getArticleImages(article) {
      const images = [];
      if (!article)
        return images;
      if (article.images && article.images.length > 0) {
        article.images.forEach((img) => {
          if (img.thumbnailURL) {
            images.push(this.processImageUrl(img.thumbnailURL));
          } else if (img.compressedURL) {
            images.push(this.processImageUrl(img.compressedURL));
          } else if (img.url) {
            images.push(this.processImageUrl(img.url));
          } else if (typeof img === "string") {
            images.push(this.processImageUrl(img));
          }
        });
      }
      if (article.imgArr && article.imgArr.length > 0) {
        article.imgArr.forEach((img) => {
          images.push(this.processImageUrl(img));
        });
      }
      if (article.coverImage && images.length === 0) {
        images.push(this.processImageUrl(article.coverImage));
      }
      return images;
    },
    // 预览文章图片
    previewArticleImage(article, index) {
      const images = this.getArticleImages(article);
      if (images && images.length > 0) {
        common_vendor.index.previewImage({
          current: images[index],
          urls: images
        });
      }
    },
    // 下拉刷新
    onRefresh() {
      this.isRefreshing = true;
      this.refreshStartTime = Date.now();
      this.getArticelList(true).then(() => {
        const refreshDuration = Date.now() - this.refreshStartTime;
        const minimumDuration = 800;
        if (refreshDuration < minimumDuration) {
          setTimeout(() => {
            this.isRefreshing = false;
            common_vendor.index.showToast({
              title: "刷新成功",
              icon: "success",
              duration: 1500
            });
          }, minimumDuration - refreshDuration);
        } else {
          this.isRefreshing = false;
          common_vendor.index.showToast({
            title: "刷新成功",
            icon: "success",
            duration: 1500
          });
        }
      }).catch(() => {
        const refreshDuration = Date.now() - this.refreshStartTime;
        const minimumDuration = 800;
        if (refreshDuration < minimumDuration) {
          setTimeout(() => {
            this.isRefreshing = false;
            common_vendor.index.showToast({
              title: "刷新失败",
              icon: "none",
              duration: 1500
            });
          }, minimumDuration - refreshDuration);
        } else {
          this.isRefreshing = false;
          common_vendor.index.showToast({
            title: "刷新失败",
            icon: "none",
            duration: 1500
          });
        }
      });
    },
    // 隐藏分享引导蒙层
    hideShareGuide() {
      this.showShareArrow = false;
    },
    // 视频相关方法
    // 初始化视频上下文
    initVideoContext() {
      if (this.videoVisible && this.videoUrl) {
        common_vendor.index.__f__("log", "at pages/userArticleList/userArticleList.vue:871", "初始化视频上下文");
        const processedUrl = this.adjustVideoUrlForToutiao(this.videoUrl);
        if (processedUrl !== this.videoUrl) {
          common_vendor.index.__f__("log", "at pages/userArticleList/userArticleList.vue:877", "视频URL已处理:", processedUrl);
          this.videoUrl = processedUrl;
        }
        this.setVideoDefinitions(this.videoUrl);
        this.$nextTick(() => {
          this.videoContext = common_vendor.index.createVideoContext("myVideo", this);
          this.videoRetryCount = 0;
        });
      } else {
        common_vendor.index.__f__("log", "at pages/userArticleList/userArticleList.vue:892", "视频组件不可见或没有视频URL，跳过初始化");
      }
    },
    // 处理视频URL使其适合头条/抖音小程序
    adjustVideoUrlForToutiao(url) {
      if (!url)
        return url;
      if (url.startsWith("http://")) {
        url = url.replace("http://", "https://");
        common_vendor.index.__f__("log", "at pages/userArticleList/userArticleList.vue:903", "视频URL已更改为https:", url);
      }
      if (url.includes("bdstatic.com")) {
        const parts = url.split("/");
        const lastPart = parts[parts.length - 1];
        if (!lastPart.endsWith(".mp4")) {
          url = `${url}.mp4`;
          common_vendor.index.__f__("log", "at pages/userArticleList/userArticleList.vue:915", "百度CDN视频URL已修正:", url);
        }
        if (!url.startsWith("https://vd3.bdstatic.com")) {
          const urlParts = url.split("/");
          const domainParts = urlParts[2].split(".");
          if (domainParts[0] !== "vd3") {
            domainParts[0] = "vd3";
            urlParts[2] = domainParts.join(".");
            url = urlParts.join("/");
            common_vendor.index.__f__("log", "at pages/userArticleList/userArticleList.vue:927", "百度CDN域名已修正:", url);
          }
        }
      }
      const isMP4 = url.toLowerCase().endsWith(".mp4");
      const isMOV = url.toLowerCase().endsWith(".mov");
      if (!isMP4 && !isMOV) {
        if (url.includes(".")) {
          const extension = url.split(".").pop().toLowerCase();
          if (!["mp4", "mov"].includes(extension)) {
            common_vendor.index.__f__("log", "at pages/userArticleList/userArticleList.vue:943", `检测到不支持的视频格式: ${extension}，转换为mp4`);
            url = url.substring(0, url.lastIndexOf(".")) + ".mp4";
          }
        } else {
          url = url + ".mp4";
          common_vendor.index.__f__("log", "at pages/userArticleList/userArticleList.vue:949", "视频URL没有扩展名，添加.mp4:", url);
        }
      }
      if (url.includes("?")) {
        const baseUrl = url.split("?")[0];
        common_vendor.index.__f__("log", "at pages/userArticleList/userArticleList.vue:956", "视频URL查询参数已移除:", baseUrl);
        return baseUrl;
      }
      return url;
    },
    // 视频播放事件处理
    onVideoPlay() {
      common_vendor.index.__f__("log", "at pages/userArticleList/userArticleList.vue:965", "视频开始播放");
      this.isVideoPlaying = true;
    },
    // 视频暂停事件处理
    onVideoPause() {
      common_vendor.index.__f__("log", "at pages/userArticleList/userArticleList.vue:971", "视频暂停播放");
      this.isVideoPlaying = false;
    },
    // 视频播放结束事件处理
    onVideoEnded() {
      common_vendor.index.__f__("log", "at pages/userArticleList/userArticleList.vue:977", "视频播放结束");
      this.isVideoPlaying = false;
    },
    // 视频播放错误事件处理
    onVideoError(e) {
      common_vendor.index.__f__("error", "at pages/userArticleList/userArticleList.vue:983", "视频播放错误:", e);
      const currentErrorUrl = this.videoUrl;
      const fixedUrl = this.tryFixVideoUrl(currentErrorUrl);
      if (fixedUrl && fixedUrl !== currentErrorUrl) {
        common_vendor.index.__f__("log", "at pages/userArticleList/userArticleList.vue:991", "尝试使用修复后的URL播放:", fixedUrl);
        this.videoUrl = fixedUrl;
        this.$nextTick(() => {
          this.initVideoContext();
        });
        return;
      }
      common_vendor.index.showModal({
        title: "视频加载失败",
        content: "当前视频格式可能不被支持，是否尝试其他视频？",
        confirmText: "尝试其他",
        cancelText: "关闭视频",
        success: (res) => {
          if (res.confirm) {
            this.videoUrl = "";
            this.videoVisible = false;
            setTimeout(() => {
              this.addUrlToBlacklist(currentErrorUrl);
              this.findNextVideo();
            }, 300);
          } else {
            this.hideVideo();
          }
        }
      });
    },
    // 尝试修复视频URL格式
    tryFixVideoUrl(url) {
      if (!url)
        return null;
      let fixedUrl = url;
      if (fixedUrl.startsWith("http://")) {
        fixedUrl = fixedUrl.replace("http://", "https://");
        common_vendor.index.__f__("log", "at pages/userArticleList/userArticleList.vue:1039", "视频URL转换为https:", fixedUrl);
      }
      if (fixedUrl.includes("bdstatic.com")) {
        if (!fixedUrl.includes("vd3.bdstatic.com")) {
          const urlParts = fixedUrl.split("/");
          if (urlParts[2] && urlParts[2].includes("bdstatic.com")) {
            const domainParts = urlParts[2].split(".");
            domainParts[0] = "vd3";
            urlParts[2] = domainParts.join(".");
            fixedUrl = urlParts.join("/");
            common_vendor.index.__f__("log", "at pages/userArticleList/userArticleList.vue:1054", "修正百度CDN域名前缀:", fixedUrl);
          }
        }
        if (!fixedUrl.includes("/mda-")) {
          common_vendor.index.__f__("log", "at pages/userArticleList/userArticleList.vue:1061", "百度视频URL格式不正确，缺少mda-前缀");
          return null;
        }
        if (!fixedUrl.includes("/360p/") && !fixedUrl.includes("/h264/")) {
          const mdaMatch = fixedUrl.match(/\/mda-([a-zA-Z0-9]+)/);
          if (mdaMatch && mdaMatch[1]) {
            const mdaId = mdaMatch[1];
            const timestamp = Date.now();
            fixedUrl = `https://vd3.bdstatic.com/mda-${mdaId}/360p/h264/${timestamp}/mda-${mdaId}.mp4`;
            common_vendor.index.__f__("log", "at pages/userArticleList/userArticleList.vue:1074", "重构的百度视频完整URL:", fixedUrl);
          }
        }
        if (!fixedUrl.endsWith(".mp4")) {
          fixedUrl = `${fixedUrl}.mp4`;
          common_vendor.index.__f__("log", "at pages/userArticleList/userArticleList.vue:1081", "添加.mp4扩展名:", fixedUrl);
        }
      }
      if (!fixedUrl.endsWith(".mp4") && !fixedUrl.endsWith(".mov")) {
        if (fixedUrl.includes(".")) {
          const extension = fixedUrl.split(".").pop().toLowerCase();
          if (!["mp4", "mov"].includes(extension)) {
            common_vendor.index.__f__("log", "at pages/userArticleList/userArticleList.vue:1093", `检测到不支持的视频格式: ${extension}，尝试转换为mp4`);
            fixedUrl = fixedUrl.substring(0, fixedUrl.lastIndexOf(".")) + ".mp4";
          }
        } else {
          fixedUrl = fixedUrl + ".mp4";
          common_vendor.index.__f__("log", "at pages/userArticleList/userArticleList.vue:1100", "视频URL没有扩展名，添加.mp4:", fixedUrl);
        }
      }
      if (fixedUrl.includes("4k") || fixedUrl.includes("2160p") || fixedUrl.includes("3840")) {
        common_vendor.index.__f__("log", "at pages/userArticleList/userArticleList.vue:1106", "检测到高分辨率视频，尝试降低为1080p");
        fixedUrl = fixedUrl.replace(/4k/gi, "1080p").replace(/2160p/gi, "1080p").replace(/3840/g, "1920");
      }
      if (fixedUrl.includes("?")) {
        fixedUrl = fixedUrl.split("?")[0];
        common_vendor.index.__f__("log", "at pages/userArticleList/userArticleList.vue:1115", "移除URL查询参数:", fixedUrl);
      }
      return fixedUrl !== url ? fixedUrl : null;
    },
    // 添加URL到黑名单
    addUrlToBlacklist(url) {
      if (!this.blacklistedUrls) {
        this.blacklistedUrls = [];
      }
      if (url && !this.blacklistedUrls.includes(url)) {
        this.blacklistedUrls.push(url);
        common_vendor.index.__f__("log", "at pages/userArticleList/userArticleList.vue:1129", "已将视频URL添加到黑名单:", url);
      }
    },
    // 检查URL是否在黑名单中
    isUrlBlacklisted(url) {
      return this.blacklistedUrls && this.blacklistedUrls.includes(url);
    },
    // 查找下一个可用视频
    findNextVideo() {
      common_vendor.index.__f__("log", "at pages/userArticleList/userArticleList.vue:1140", "查找下一个可用视频");
      if (!this.userArticleData || this.userArticleData.length === 0) {
        common_vendor.index.__f__("log", "at pages/userArticleList/userArticleList.vue:1144", "没有文章数据，无法查找视频");
        return false;
      }
      const allVideoUrls = [];
      for (let article of this.userArticleData) {
        const possibleVideoFields = ["videoUrl", "video_url", "video", "videoSrc", "video_src", "url"];
        for (let field of possibleVideoFields) {
          if (article[field] && typeof article[field] === "string" && this.isValidVideoUrl(article[field])) {
            if (article[field] !== this.videoUrl && !this.isUrlBlacklisted(article[field])) {
              allVideoUrls.push(article[field]);
            }
          }
        }
        const possibleVideoArrayFields = ["videos", "videoArr", "video_arr", "videoList", "video_list"];
        for (let field of possibleVideoArrayFields) {
          if (article[field] && Array.isArray(article[field])) {
            for (let videoItem of article[field]) {
              if (typeof videoItem === "string" && this.isValidVideoUrl(videoItem)) {
                if (this.isUrlBlacklisted(videoItem)) {
                  common_vendor.index.__f__("log", "at pages/userArticleList/userArticleList.vue:1172", `跳过黑名单中的视频URL(${field}数组):`, videoItem);
                  continue;
                }
                this.videoUrl = videoItem;
                this.videoVisible = true;
              } else if (typeof videoItem === "object") {
                const possibleUrlProps = ["url", "src", "source", "path", "videoUrl"];
                for (let prop of possibleUrlProps) {
                  if (videoItem[prop] && typeof videoItem[prop] === "string" && this.isValidVideoUrl(videoItem[prop])) {
                    if (this.isUrlBlacklisted(videoItem[prop])) {
                      common_vendor.index.__f__("log", "at pages/userArticleList/userArticleList.vue:1186", `跳过黑名单中的视频URL(${field}.${prop}):`, videoItem[prop]);
                      continue;
                    }
                    this.videoUrl = videoItem[prop];
                    this.videoVisible = true;
                    break;
                  }
                }
              }
            }
          }
        }
        if (article.content) {
          const videoUrlMatch = this.extractVideoUrlFromContent(article.content);
          if (videoUrlMatch && videoUrlMatch !== this.videoUrl && !this.isUrlBlacklisted(videoUrlMatch)) {
            allVideoUrls.push(videoUrlMatch);
          }
        }
      }
      if (allVideoUrls.length > 0) {
        common_vendor.index.__f__("log", "at pages/userArticleList/userArticleList.vue:1211", "找到其他视频:", allVideoUrls[0]);
        this.videoUrl = allVideoUrls[0];
        this.videoVisible = true;
        this.$nextTick(() => {
          this.initVideoContext();
        });
        return true;
      } else {
        common_vendor.index.__f__("log", "at pages/userArticleList/userArticleList.vue:1222", "没有找到其他可用视频");
        common_vendor.index.showToast({
          title: "未找到其他视频",
          icon: "none"
        });
        return false;
      }
    },
    // 全屏状态变化事件处理
    handleFullscreenChange(e) {
      common_vendor.index.__f__("log", "at pages/userArticleList/userArticleList.vue:1233", "全屏状态变化:", e.detail.fullScreen);
    },
    // 隐藏视频
    hideVideo() {
      common_vendor.index.__f__("log", "at pages/userArticleList/userArticleList.vue:1238", "隐藏视频组件被调用");
      this.userClosedVideo = true;
      if (this.videoContext) {
        this.videoContext.pause();
      }
      this.videoVisible = false;
      this.videoUrl = "";
    },
    // 显示视频
    showVideo() {
      this.userClosedVideo = false;
      this.videoVisible = true;
      this.$nextTick(() => {
        this.initVideoContext();
      });
    },
    // 从文章列表中提取视频URL
    extractVideoFromArticles() {
      common_vendor.index.__f__("log", "at pages/userArticleList/userArticleList.vue:1263", "尝试从文章中提取视频链接");
      if (this.userClosedVideo) {
        common_vendor.index.__f__("log", "at pages/userArticleList/userArticleList.vue:1267", "用户已主动关闭视频，跳过视频提取");
        return false;
      }
      if (this.videoVisible && this.videoUrl) {
        common_vendor.index.__f__("log", "at pages/userArticleList/userArticleList.vue:1273", "已有视频在播放，跳过视频提取");
        return false;
      }
      if (!this.userArticleData || this.userArticleData.length === 0) {
        common_vendor.index.__f__("log", "at pages/userArticleList/userArticleList.vue:1279", "没有文章数据，无法提取视频");
        return false;
      }
      const sortedArticleIndices = this.userArticleData.map((article, index) => ({ index, time: article.create_time || article.createTime || article.time || 0 })).sort((a, b) => {
        if (typeof a.time === "string" && typeof b.time === "string") {
          return new Date(b.time) - new Date(a.time);
        } else if (typeof a.time === "number" && typeof b.time === "number") {
          return b.time - a.time;
        } else {
          return a.index - b.index;
        }
      }).map((item) => item.index);
      common_vendor.index.__f__("log", "at pages/userArticleList/userArticleList.vue:1298", "按时间排序后的文章索引:", sortedArticleIndices);
      for (let i = 0; i < sortedArticleIndices.length; i++) {
        const articleIndex = sortedArticleIndices[i];
        const article = this.userArticleData[articleIndex];
        common_vendor.index.__f__("log", "at pages/userArticleList/userArticleList.vue:1305", `检查第 ${i + 1} 新的文章(索引:${articleIndex})是否包含视频`);
        const videoUrl = this.getVideoUrlFromArticle(article);
        if (videoUrl) {
          if (this.isUrlBlacklisted(videoUrl)) {
            common_vendor.index.__f__("log", "at pages/userArticleList/userArticleList.vue:1314", "视频URL在黑名单中，跳过:", videoUrl);
            continue;
          }
          this.videoUrl = videoUrl;
          this.videoVisible = true;
          this.$nextTick(() => {
            this.initVideoContext();
          });
          return true;
        }
      }
      common_vendor.index.__f__("log", "at pages/userArticleList/userArticleList.vue:1330", "未在文章中找到有效的视频链接");
      return false;
    },
    // 检查URL是否是有效的视频URL
    isValidVideoUrl(url) {
      if (!url || typeof url !== "string")
        return false;
      const videoExtensions = [".mp4", ".mov"];
      const hasVideoExtension = videoExtensions.some((ext) => url.toLowerCase().endsWith(ext));
      if (hasVideoExtension) {
        return true;
      }
      const videoDomains = [
        "youku",
        "vimeo",
        "bilibili",
        "qq.com/video",
        "douyin",
        "bspapp.com",
        "ixigua.com",
        "kuaishou.com",
        "bdstatic.com",
        // 百度静态资源
        "cdn"
      ];
      const hasVideoDomain = videoDomains.some((domain) => url.toLowerCase().includes(domain));
      if (url.toLowerCase().includes("bdstatic.com/mda-")) {
        return true;
      }
      const isHttpUrl = /^https?:\/\//.test(url);
      const videoParams = ["mp4", "mov", "video", "media", "play"];
      const hasVideoParams = videoParams.some((param) => url.toLowerCase().includes(param));
      return (hasVideoDomain || hasVideoParams) && isHttpUrl;
    },
    // 从内容中提取视频URL
    extractVideoUrlFromContent(content) {
      if (!content || typeof content !== "string")
        return null;
      const videoUrlRegexes = [
        // 常见视频文件扩展名
        /https?:\/\/[^\s<>"']+\.(mp4|avi|mov|wmv|flv|mkv|webm|m3u8|3gp|rm|rmvb)/gi,
        // 特定视频平台
        /https?:\/\/v\.qq\.com\/[^\s<>"']+/gi,
        /https?:\/\/www\.youtube\.com\/watch\?v=[^\s<>"']+/gi,
        /https?:\/\/youtu\.be\/[^\s<>"']+/gi,
        /https?:\/\/vimeo\.com\/[^\s<>"']+/gi,
        /https?:\/\/www\.bilibili\.com\/video\/[^\s<>"']+/gi,
        /https?:\/\/www\.ixigua\.com\/[^\s<>"']+/gi,
        /https?:\/\/www\.kuaishou\.com\/[^\s<>"']+/gi,
        // 通用CDN和文件存储链接
        /https?:\/\/[^\s<>"']+\.bspapp\.com\/[^\s<>"']+/gi,
        /https?:\/\/[^\s<>"']+\.cdn[^\s<>"']*\/[^\s<>"']+/gi,
        // 微信视频
        /https?:\/\/mp\.weixin\.qq\.com\/[^\s<>"']*video[^\s<>"']+/gi,
        /https?:\/\/wxsnsdy\.wxs\.qq\.com\/[^\s<>"']+/gi
      ];
      for (let regex of videoUrlRegexes) {
        const matches = content.match(regex);
        if (matches && matches.length > 0) {
          return matches[0];
        }
      }
      return null;
    },
    // 跳转到发布页面
    goToPublish() {
      common_vendor.index.showToast({
        title: "发布功能已禁用",
        icon: "none",
        duration: 2e3
      });
    },
    // 处理图片URL，确保可以正确加载
    processImageUrl(url) {
      if (!url)
        return "";
      if (url.startsWith("/static/") || url.startsWith("wxfile://") || url.startsWith("http://tmp/")) {
        return url;
      }
      try {
        if (url.includes("watermark") || url.includes("imageMogr2")) {
          const baseUrl = url.split("?")[0];
          if (baseUrl) {
            return baseUrl;
          }
        }
        return url;
      } catch (e) {
        common_vendor.index.__f__("error", "at pages/userArticleList/userArticleList.vue:1446", "处理图片URL出错:", e);
        return "";
      }
    },
    // 从文章列表中提取最新的图片
    extractLatestArticleImages() {
      common_vendor.index.__f__("log", "at pages/userArticleList/userArticleList.vue:1453", "提取最新文章图片");
      if (!this.userArticleData || this.userArticleData.length === 0) {
        common_vendor.index.__f__("log", "at pages/userArticleList/userArticleList.vue:1457", "没有文章数据，无法提取图片");
        this.latestArticleImages = [];
        return [];
      }
      const sortedArticleIndices = this.userArticleData.map((article, index) => ({ index, time: article.create_time || article.createTime || article.time || 0 })).sort((a, b) => {
        if (typeof a.time === "string" && typeof b.time === "string") {
          return new Date(b.time) - new Date(a.time);
        } else if (typeof a.time === "number" && typeof b.time === "number") {
          return b.time - a.time;
        } else {
          return a.index - b.index;
        }
      }).map((item) => item.index);
      const allImages = [];
      for (let i = 0; i < sortedArticleIndices.length && allImages.length < 5; i++) {
        const articleIndex = sortedArticleIndices[i];
        const article = this.userArticleData[articleIndex];
        const articleImages = this.getArticleImages(article);
        if (articleImages && articleImages.length > 0) {
          for (let img of articleImages) {
            if (!allImages.includes(img) && allImages.length < 5) {
              allImages.push(img);
            }
          }
        }
      }
      this.latestArticleImages = allImages;
      common_vendor.index.__f__("log", "at pages/userArticleList/userArticleList.vue:1500", "提取到的最新文章图片:", this.latestArticleImages);
      return this.latestArticleImages;
    },
    // 直接从文章中获取视频URL
    getVideoUrlFromArticle(article) {
      if (!article)
        return null;
      common_vendor.index.__f__("log", "at pages/userArticleList/userArticleList.vue:1509", "尝试从文章中获取视频URL:", article._id);
      for (const field of this.videoFieldPriority) {
        if (article[field] && typeof article[field] === "string" && this.isValidVideoUrl(article[field])) {
          common_vendor.index.__f__("log", "at pages/userArticleList/userArticleList.vue:1514", `在文章中找到视频字段(${field}):`, article[field]);
          return article[field];
        }
      }
      if (article.videoURL && typeof article.videoURL === "string" && this.isValidVideoUrl(article.videoURL)) {
        common_vendor.index.__f__("log", "at pages/userArticleList/userArticleList.vue:1521", "在文章中找到videoURL字段:", article.videoURL);
        return article.videoURL;
      }
      const possibleVideoArrayFields = ["videos", "videoArr", "video_arr", "videoList", "video_list"];
      for (const field of possibleVideoArrayFields) {
        if (article[field] && Array.isArray(article[field]) && article[field].length > 0) {
          const videoItem = article[field][0];
          if (typeof videoItem === "string" && this.isValidVideoUrl(videoItem)) {
            common_vendor.index.__f__("log", "at pages/userArticleList/userArticleList.vue:1533", `在文章视频数组(${field})中找到视频:`, videoItem);
            return videoItem;
          }
          if (typeof videoItem === "object") {
            const possibleUrlProps = ["url", "src", "source", "path", "videoUrl", "videoURL"];
            for (const prop of possibleUrlProps) {
              if (videoItem[prop] && typeof videoItem[prop] === "string" && this.isValidVideoUrl(videoItem[prop])) {
                common_vendor.index.__f__("log", "at pages/userArticleList/userArticleList.vue:1542", `在文章视频数组对象(${field}.${prop})中找到视频:`, videoItem[prop]);
                return videoItem[prop];
              }
            }
          }
        }
      }
      if (article.content) {
        const videoUrlMatch = this.extractVideoUrlFromContent(article.content);
        if (videoUrlMatch) {
          common_vendor.index.__f__("log", "at pages/userArticleList/userArticleList.vue:1554", "从文章内容中提取到视频URL:", videoUrlMatch);
          return videoUrlMatch;
        }
      }
      common_vendor.index.__f__("log", "at pages/userArticleList/userArticleList.vue:1559", "未在文章中找到视频URL");
      return null;
    },
    // 视频长按事件处理（倍速播放）
    handleVideoLongTap() {
      common_vendor.index.__f__("log", "at pages/userArticleList/userArticleList.vue:1565", "视频长按，开始倍速播放");
      if (this.videoContext) {
        this.videoContext.playbackRate(2);
        this.isVideoSpeedUp = true;
        try {
          if (typeof tt !== "undefined" && tt.vibrateShort) {
            tt.vibrateShort({ type: "light" });
          } else if (typeof common_vendor.index !== "undefined") {
            common_vendor.index.vibrateShort({ success: () => {
            } });
          }
        } catch (e) {
          common_vendor.index.__f__("error", "at pages/userArticleList/userArticleList.vue:1581", "震动反馈失败:", e);
        }
      }
    },
    // 视频触摸结束事件处理（恢复正常速度）
    handleVideoTouchEnd() {
      common_vendor.index.__f__("log", "at pages/userArticleList/userArticleList.vue:1588", "视频触摸结束，恢复正常播放速度");
      if (this.videoContext && this.isVideoSpeedUp) {
        this.videoContext.playbackRate(1);
        this.isVideoSpeedUp = false;
      }
    },
    // 设置视频清晰度选项
    setVideoDefinitions(url) {
      if (!url || !url.toLowerCase().includes(".mp4") && !url.toLowerCase().includes("/mp4")) {
        this.videoDefinition = null;
        return;
      }
      try {
        let baseUrl = url;
        const resPattern1 = /_(1080p|720p|480p|360p|240p|4k|2k)\./i;
        const resPattern2 = /_(hd|sd|ld)\./i;
        const resPattern3 = /\/(1080|720|480|360|240|4k|2k|hd|sd|ld)\//i;
        if (resPattern1.test(baseUrl)) {
          baseUrl = baseUrl.replace(resPattern1, ".");
        } else if (resPattern2.test(baseUrl)) {
          baseUrl = baseUrl.replace(resPattern2, ".");
        } else if (resPattern3.test(baseUrl)) {
          this.videoDefinition = null;
          return;
        }
        const definitionList = [];
        const urlWithoutExt = baseUrl.substring(0, baseUrl.lastIndexOf("."));
        const extension = baseUrl.substring(baseUrl.lastIndexOf("."));
        const has4K = url.toLowerCase().includes("4k") || url.toLowerCase().includes("2160p");
        const has2K = url.toLowerCase().includes("2k") || url.toLowerCase().includes("1440p");
        const has1080 = url.toLowerCase().includes("1080") || url.toLowerCase().includes("hd");
        const has720 = url.toLowerCase().includes("720");
        const has480 = url.toLowerCase().includes("480") || url.toLowerCase().includes("sd");
        definitionList.push({
          name: "流畅",
          url: `${urlWithoutExt}_360p${extension}`
        });
        definitionList.push({
          name: "标清",
          url: `${urlWithoutExt}_480p${extension}`
        });
        definitionList.push({
          name: "高清",
          url: `${urlWithoutExt}_720p${extension}`
        });
        if (has1080 || has4K || has2K) {
          definitionList.push({
            name: "超清",
            url: `${urlWithoutExt}_1080p${extension}`
          });
        }
        if (has2K || has4K) {
          definitionList.push({
            name: "2K",
            url: `${urlWithoutExt}_2k${extension}`
          });
        }
        if (has4K) {
          definitionList.push({
            name: "4K",
            url: `${urlWithoutExt}_4k${extension}`
          });
        }
        this.videoDefinition = {
          list: definitionList,
          // 默认选择当前清晰度或720P
          defaultDefinition: has720 ? "高清" : has480 ? "标清" : "流畅"
        };
        common_vendor.index.__f__("log", "at pages/userArticleList/userArticleList.vue:1686", "设置视频清晰度选项:", this.videoDefinition);
      } catch (e) {
        common_vendor.index.__f__("error", "at pages/userArticleList/userArticleList.vue:1688", "设置视频清晰度选项失败:", e);
        this.videoDefinition = null;
      }
    },
    onGroupChange(e) {
      this.selectedGroupIndex = e.detail.value;
    },
    goToDetail(item) {
      common_vendor.index.navigateTo({
        url: `/pages/article/articleDetail?article_id=${item._id}`
      });
    }
  }
};
if (!Array) {
  const _easycom_user_header2 = common_vendor.resolveComponent("user-header");
  const _easycom_articleItem2 = common_vendor.resolveComponent("articleItem");
  const _easycom_uni_load_more2 = common_vendor.resolveComponent("uni-load-more");
  (_easycom_user_header2 + _easycom_articleItem2 + _easycom_uni_load_more2)();
}
const _easycom_user_header = () => "../../components/user-header/user-header.js";
const _easycom_articleItem = () => "../../components/articleItem/articleItem.js";
const _easycom_uni_load_more = () => "../../uni_modules/uni-load-more/components/uni-load-more/uni-load-more.js";
if (!Math) {
  (_easycom_user_header + _easycom_articleItem + _easycom_uni_load_more)();
}
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: common_vendor.o($options.handleContact),
    b: common_vendor.p({
      articleTotal: $options.articleTotal,
      userInfo: $data.userArticleInfo
    }),
    c: $data.videoUrl && $data.videoUrl.length > 0
  }, $data.videoUrl && $data.videoUrl.length > 0 ? {
    d: $data.videoUrl,
    e: common_vendor.o((...args) => $options.onVideoPlay && $options.onVideoPlay(...args)),
    f: common_vendor.o((...args) => $options.onVideoPause && $options.onVideoPause(...args))
  } : {}, {
    g: $data.userArticleData && $data.userArticleData.length > 0
  }, $data.userArticleData && $data.userArticleData.length > 0 ? {
    h: common_vendor.f($data.userArticleData, (item, k0, i0) => {
      return {
        a: item._id,
        b: "72340410-1-" + i0,
        c: common_vendor.p({
          item,
          avatarClickEnabled: $data.avatarClickEnabled
        })
      };
    }),
    i: common_vendor.o($options.goToDetail),
    j: common_vendor.o($options.handleContact),
    k: common_vendor.o($options.handleDelete)
  } : {}, {
    l: common_vendor.p({
      color: "#d6d6d6",
      status: $data.status,
      ["content-text"]: $data.loadMoreText
    }),
    m: common_vendor.o((...args) => $options.scrolltolower && $options.scrolltolower(...args)),
    n: $data.isRefreshing,
    o: common_vendor.o((...args) => $options.onRefresh && $options.onRefresh(...args))
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-72340410"]]);
tt.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-toutiao/pages/userArticleList/userArticleList.js.map
