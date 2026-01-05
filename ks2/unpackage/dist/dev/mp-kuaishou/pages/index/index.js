"use strict";
const common_vendor = require("../../common/vendor.js");
const common_assets = require("../../common/assets.js");
const utils_isLogin = require("../../utils/isLogin.js");
const store_user = require("../../store/user.js");
if (!Array) {
  const _easycom_uni_icons2 = common_vendor.resolveComponent("uni-icons");
  const _easycom_articleItem2 = common_vendor.resolveComponent("articleItem");
  const _easycom_uni_load_more2 = common_vendor.resolveComponent("uni-load-more");
  (_easycom_uni_icons2 + _easycom_articleItem2 + _easycom_uni_load_more2)();
}
const _easycom_uni_icons = () => "../../uni_modules/uni-icons/components/uni-icons/uni-icons.js";
const _easycom_articleItem = () => "../../components/articleItem/articleItem.js";
const _easycom_uni_load_more = () => "../../uni_modules/uni-load-more/components/uni-load-more/uni-load-more.js";
if (!Math) {
  (_easycom_uni_icons + _easycom_articleItem + _easycom_uni_load_more)();
}
const _sfc_main = {
  __name: "index",
  setup(__props) {
    const userStore = store_user.useUserInfoStore();
    common_vendor.ref(null);
    const cateList = common_vendor.ref([]);
    const activeIndex = common_vendor.ref(0);
    const headList = [
      { _id: "01", cate_name: "最新" },
      { _id: "02", cate_name: "最热" }
    ];
    const cateApi = common_vendor.tr.importObject("cateKs", { customUI: true });
    const articleApi = common_vendor.tr.importObject("articleKs", { customUI: true });
    const daohangApi = common_vendor.tr.importObject("daohang", { customUI: true });
    const isLoading = common_vendor.ref(true);
    const navInfo = common_vendor.ref(null);
    const isNavLoading = common_vendor.ref(true);
    const cateListGet = async () => {
      try {
        console.log("=== 开始获取分类 ===");
        const res = await cateApi.get();
        console.log("分类获取成功:", res);
        if (!res || !res.data) {
          throw new Error("分类数据为空");
        }
        const hiddenCategoryIds = res.data.filter((item) => item.is_visible === false).map((item) => item._id);
        const visibleCategories = res.data.filter((item) => item.is_visible !== false);
        cateList.value = [...headList, ...visibleCategories];
        pageNo.value = 1;
        console.log("开始获取文章列表...");
        await getArticleList("01", pageNo.value, 8, hiddenCategoryIds);
      } catch (err) {
        console.error("=== 获取分类失败 ===", err);
        console.error("错误详情:", JSON.stringify(err));
        common_vendor.index.showToast({
          title: "加载失败: " + (err.message || err.errMsg || "网络错误"),
          icon: "none",
          duration: 5e3
        });
        cateList.value = headList;
        await getArticleList("01", 1, 8, []);
      } finally {
        isLoading.value = false;
      }
    };
    const pageNo = common_vendor.ref(1);
    const hanleHeadTab = (index, id) => {
      activeIndex.value = index;
      pageNo.value = 1;
      status.value = "more";
      isLoading.value = true;
      cateApi.get().then((res) => {
        const hiddenCategoryIds = res.data.filter((item) => item.is_visible === false).map((item) => item._id);
        getArticleList(id, pageNo.value, 8, hiddenCategoryIds);
      }).catch((err) => {
        console.error("获取分类失败:", err);
        getArticleList(id, pageNo.value, 8, []);
      });
    };
    const articleList = common_vendor.ref([]);
    const currentCateId = common_vendor.ref("01");
    const getArticleList = async (cate_id, pageNo2 = 1, pageSize = 8, hiddenCategoryIds = []) => {
      try {
        isLoading.value = true;
        currentCateId.value = cate_id;
        console.log("=== 开始获取文章 ===");
        console.log("分类ID:", cate_id, "页码:", pageNo2);
        const res = await articleApi.getArticle(cate_id, pageNo2, pageSize, hiddenCategoryIds);
        console.log("文章列表数据:", res);
        if (!res || !res.data) {
          throw new Error("文章数据为空");
        }
        articleList.value = res.data;
        console.log("文章加载成功, 数量:", res.data.length);
      } catch (err) {
        console.error("=== 获取文章失败 ===", err);
        console.error("错误详情:", JSON.stringify(err));
        common_vendor.index.showToast({
          title: "加载失败: " + (err.message || err.errMsg || "网络错误"),
          icon: "none",
          duration: 5e3
        });
        articleList.value = [];
      } finally {
        isLoading.value = false;
      }
    };
    const getNavInfo = async () => {
      try {
        isNavLoading.value = true;
        const res = await daohangApi.getNavInfo();
        if (res.code === 0) {
          navInfo.value = res.data;
        } else {
          console.error("获取导航信息失败:", res.message);
        }
      } catch (err) {
        console.error("获取导航信息异常:", err);
      } finally {
        isNavLoading.value = false;
      }
    };
    const openNavLink = async () => {
      try {
        if (!userStore.userInfo.isLogin) {
          return utils_isLogin.testLogin();
        }
        const res = await daohangApi.getNavInfo();
        if (res.code === 0 && res.data && res.data.url) {
          common_vendor.index.navigateTo({
            url: `/pages/webview/webview?url=${encodeURIComponent(res.data.url)}`
          });
        }
      } catch (error) {
        console.error("打开链接失败", error);
      }
    };
    common_vendor.onPullDownRefresh(async () => {
      pageNo.value = 1;
      status.value = "more";
      try {
        const res = await cateApi.get();
        const hiddenCategoryIds = res.data.filter((item) => item.is_visible === false).map((item) => item._id);
        await getArticleList(currentCateId.value, pageNo.value, 8, hiddenCategoryIds);
        await getNavInfo();
      } catch (err) {
        console.error("下拉刷新失败:", err);
        common_vendor.index.showToast({
          title: "刷新失败，请重试",
          icon: "none"
        });
      } finally {
        common_vendor.index.stopPullDownRefresh();
      }
    });
    const status = common_vendor.ref("more");
    const scrolltolower = async () => {
      if (status.value === "noMore")
        return;
      status.value = "loading";
      try {
        const res = await cateApi.get();
        const hiddenCategoryIds = res.data.filter((item) => item.is_visible === false).map((item) => item._id);
        pageNo.value++;
        const articleRes = await articleApi.getArticle(currentCateId.value, pageNo.value, 8, hiddenCategoryIds);
        articleList.value = [...articleList.value, ...articleRes.data];
        if (articleRes.data.length > 0) {
          status.value = "more";
        } else {
          status.value = "noMore";
        }
      } catch (err) {
        console.error("加载更多失败:", err);
        common_vendor.index.showToast({
          title: "加载失败，请重试",
          icon: "none"
        });
        status.value = "more";
      }
    };
    const handleDelete = async (articleId) => {
      try {
        common_vendor.index.showLoading({ title: "删除中...", mask: true });
        const res = await articleApi.del(articleId, userStore.userInfo.uid);
        if (res.deleted) {
          common_vendor.index.hideLoading();
          common_vendor.index.showToast({ title: "删除成功", icon: "success" });
          articleList.value = articleList.value.filter((item) => item._id !== articleId);
        }
      } catch (err) {
        common_vendor.index.hideLoading();
        common_vendor.index.showToast({ title: err.message || "删除失败", icon: "none" });
      }
    };
    const handelContact = (mobile) => {
      console.log(mobile);
      if (!userStore.userInfo.isLogin) {
        return utils_isLogin.testLogin();
      }
      if (mobile === "未填写") {
        return common_vendor.index.showToast({
          icon: "none",
          title: "他并不想让人联系"
        });
      }
      common_vendor.index.makePhoneCall({
        phoneNumber: mobile
      });
    };
    const handelGoUserList = (user_id) => {
      common_vendor.index.navigateTo({
        url: `/pages/userArticleList/userArticleList?userId=${user_id}`
      });
    };
    const preloadArticleDetail = (articleId) => {
      setTimeout(() => {
        try {
          const articleCloud = common_vendor.tr.importObject("articleKs", {
            customUI: true
            // 禁用默认UI
          });
          Promise.all([
            articleCloud.getArticleDetal(articleId),
            common_vendor.tr.importObject("commentList", { customUI: true }).getCommentList(articleId)
          ]).catch((err) => {
            console.warn("文章预加载失败:", err);
          });
        } catch (err) {
          console.warn("预加载初始化失败:", err);
        }
      }, 200);
    };
    const handleItemHover = (articleId) => {
      preloadArticleDetail(articleId);
    };
    const navigateToArticleDetail = (articleId) => {
      if (!articleId) {
        common_vendor.index.showToast({
          title: "文章ID不能为空",
          icon: "none"
        });
        return;
      }
      common_vendor.index.navigateTo({
        url: `/pages/article/articleDetail?article_id=${articleId}`,
        animationType: "slide-in-right",
        animationDuration: 300
      });
    };
    common_vendor.onMounted(() => {
      console.log("=== 页面开始加载 ===");
      try {
        const systemInfo = common_vendor.index.getSystemInfoSync();
        console.log("系统信息:", systemInfo);
        console.log("uniCloud 配置:", common_vendor.tr.config);
      } catch (e) {
        console.error("获取系统信息失败:", e);
      }
      console.log("cateApi:", cateApi);
      console.log("articleApi:", articleApi);
      cateListGet();
      getNavInfo();
      common_vendor.index.showShareMenu({
        withShareTicket: true
      });
      common_vendor.index.$on("articleAdded", ({ cateId }) => {
        pageNo.value = 1;
        articleList.value = [];
        getArticleList(cateId);
      });
      common_vendor.index.$on("updateArticleLookCount", ({ articleId, lookCount }) => {
        const article = articleList.value.find((item) => item._id === articleId);
        if (article) {
          article.look_count = lookCount;
        }
      });
      common_vendor.index.$on("updateNavVisibility", ({ isVisible, navInfo: updatedNavInfo }) => {
        console.log("收到导航条状态更新:", isVisible);
        if (navInfo.value) {
          navInfo.value.isVisible = isVisible;
          if (updatedNavInfo) {
            if (updatedNavInfo.title)
              navInfo.value.title = updatedNavInfo.title;
            if (updatedNavInfo.url)
              navInfo.value.url = updatedNavInfo.url;
          }
        }
      });
      common_vendor.index.$on("categoryVisibilityChanged", async (data) => {
        var _a;
        console.log("收到分类可见性变化事件，开始刷新数据", data);
        try {
          let hiddenCategoryIds = [];
          let allCategories = [];
          if (data && data.hiddenCategoryIds) {
            hiddenCategoryIds = data.hiddenCategoryIds;
          } else {
            const res = await cateApi.get();
            hiddenCategoryIds = res.data.filter((item) => item.is_visible === false).map((item) => item._id);
            allCategories = res.data;
          }
          if (data && data.allCategories) {
            allCategories = data.allCategories;
          } else if (!allCategories.length) {
            const res = await cateApi.get();
            allCategories = res.data;
          }
          const visibleCategories = allCategories.filter((item) => item.is_visible !== false);
          cateList.value = [...headList, ...visibleCategories];
          if (activeIndex.value >= 2) {
            const currentCategoryId = (_a = cateList.value[activeIndex.value]) == null ? void 0 : _a._id;
            if (!currentCategoryId) {
              activeIndex.value = 0;
              currentCateId.value = "01";
            }
          }
          pageNo.value = 1;
          await getArticleList(currentCateId.value, pageNo.value, 8, hiddenCategoryIds);
          console.log("分类可见性变更处理完成，当前显示分类:", cateList.value.length, "隐藏分类:", hiddenCategoryIds.length);
        } catch (error) {
          console.error("处理分类可见性变化事件失败:", error);
          common_vendor.index.showToast({
            title: "刷新数据失败，请手动刷新",
            icon: "none"
          });
        }
      });
      common_vendor.tr.addInterceptor("callObject", {
        invoke(param) {
          param.options = param.options || {};
          param.options.customUI = true;
          return param;
        }
      });
    });
    common_vendor.onUnmounted(() => {
      common_vendor.index.$off("articleAdded");
      common_vendor.index.$off("updateArticleLookCount");
      common_vendor.index.$off("updateNavVisibility");
      common_vendor.index.$off("categoryVisibilityChanged");
    });
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.f(cateList.value, (item, index, i0) => {
          return {
            a: common_vendor.t(item.cate_name),
            b: activeIndex.value === index ? 1 : "",
            c: item._id,
            d: common_vendor.o(($event) => hanleHeadTab(index, item._id))
          };
        }),
        b: navInfo.value && navInfo.value.isVisible
      }, navInfo.value && navInfo.value.isVisible ? {
        c: common_vendor.t(navInfo.value.title),
        d: common_vendor.p({
          type: "right",
          size: "16",
          color: "#FFFFFF"
        }),
        e: common_vendor.o(openNavLink)
      } : {}, {
        f: isLoading.value
      }, isLoading.value ? {
        g: common_vendor.p({
          type: "spinner-cycle",
          size: "24",
          color: "#666666"
        })
      } : articleList.value.length === 0 ? {
        i: common_assets._imports_0
      } : {
        j: common_vendor.f(articleList.value, (item, k0, i0) => {
          return {
            a: item._id,
            b: common_vendor.o(($event) => handleItemHover(item._id)),
            c: "1cf27b2a-2-" + i0,
            d: common_vendor.p({
              item
            })
          };
        }),
        k: common_vendor.o(handelContact),
        l: common_vendor.o(handelGoUserList),
        m: common_vendor.o(handleDelete),
        n: common_vendor.o(navigateToArticleDetail)
      }, {
        h: articleList.value.length === 0,
        o: !isLoading.value && articleList.value.length > 0
      }, !isLoading.value && articleList.value.length > 0 ? {
        p: common_vendor.p({
          color: "#666666",
          iconType: "auto",
          status: status.value
        })
      } : {}, {
        q: common_vendor.o(scrolltolower),
        r: common_vendor.gei(_ctx, "")
      });
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-1cf27b2a"]]);
ks.createPage(MiniProgramPage);
