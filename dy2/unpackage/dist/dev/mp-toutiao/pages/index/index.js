"use strict";
const common_vendor = require("../../common/vendor.js");
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
const pageSize = 8;
const _sfc_main = {
  __name: "index",
  setup(__props) {
    const loadingManager = {
      isLoading: false,
      showLoading(title = "加载中...", mask = true) {
        this.isLoading = true;
      },
      hideLoading() {
        this.isLoading = false;
      }
    };
    const avatarClickState = common_vendor.ref(true);
    const getSendOnState = async () => {
      try {
        common_vendor.index.__f__("log", "at pages/index/index.vue:32", "首页正在获取按钮状态...");
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5e3);
        const requestInProgress = common_vendor.ref(true);
        const sendOnApi = common_vendor.nr.importObject("sendOn", { customUI: true });
        const res = await Promise.race([
          sendOnApi.get(),
          new Promise((_, reject) => {
            common_vendor.index.$once("index-page-destroyed", () => {
              common_vendor.index.__f__("log", "at pages/index/index.vue:48", "页面销毁，中断请求");
              reject(new Error("页面已销毁，请求被中断"));
            });
          })
        ]).finally(() => {
          clearTimeout(timeoutId);
          requestInProgress.value = false;
        });
        if (res && res.data && res.data.length > 0) {
          const serverAvatarClickState = res.data[0].avatarClick !== void 0 ? res.data[0].avatarClick : true;
          avatarClickState.value = serverAvatarClickState;
          common_vendor.index.__f__("log", "at pages/index/index.vue:64", "首页头像点击状态:", avatarClickState.value);
        } else {
          common_vendor.index.__f__("log", "at pages/index/index.vue:66", "获取按钮状态返回空数据，使用默认值");
          avatarClickState.value = true;
        }
      } catch (err) {
        if (err.message && (err.message.includes("abort") || err.message.includes("中断"))) {
          common_vendor.index.__f__("log", "at pages/index/index.vue:73", "获取按钮状态请求被中断，使用默认值");
        } else {
          common_vendor.index.__f__("error", "at pages/index/index.vue:75", "获取按钮状态失败:", err);
        }
        avatarClickState.value = true;
      }
    };
    const userStore = store_user.useUserInfoStore();
    common_vendor.ref(null);
    const cateList = common_vendor.ref([]);
    const activeIndex = common_vendor.ref(0);
    const currentCateId = common_vendor.ref("");
    const cateApi = common_vendor.nr.importObject("cateDy", { customUI: true });
    const articleApi = common_vendor.nr.importObject("articleDy", { customUI: true });
    common_vendor.nr.importObject("fabuWx", { customUI: true });
    const cateListGet = async () => {
      try {
        common_vendor.index.__f__("log", "at pages/index/index.vue:106", "开始获取分类数据...");
        const db = common_vendor.nr.database();
        const collection = db.collection("cateList");
        const res = await collection.where({
          is_visible: true
        }).orderBy("sort", "desc").get();
        common_vendor.index.__f__("log", "at pages/index/index.vue:118", "分类数据获取结果:", res);
        if (res && res.data && res.data.length > 0) {
          let processedCateList = res.data.map((cate) => {
            return {
              ...cate,
              cate_img: cate.cate_img || getCategoryIcon(cate)
            };
          });
          const allCategory = {
            _id: "all",
            cate_name: "全部",
            cate_img: "/static/images/defalut.png",
            sort: 9999
            // 确保排序权重最高
          };
          const hasAllCategory = processedCateList.some(
            (cate) => cate.cate_name === "全部" || cate._id === "all"
          );
          if (!hasAllCategory) {
            processedCateList.unshift(allCategory);
          } else {
            const allIndex = processedCateList.findIndex(
              (cate) => cate.cate_name === "全部" || cate._id === "all"
            );
            if (allIndex > 0) {
              const allCate = processedCateList.splice(allIndex, 1)[0];
              processedCateList.unshift(allCate);
            }
          }
          cateList.value = processedCateList;
          try {
            common_vendor.index.setStorageSync("cachedCategories", processedCateList);
          } catch (cacheErr) {
            common_vendor.index.__f__("warn", "at pages/index/index.vue:164", "缓存分类数据失败:", cacheErr);
          }
          currentCateId.value = processedCateList[0]._id;
          activeIndex.value = 0;
          pageNo.value = 1;
          getArticleList(currentCateId.value);
        } else {
          common_vendor.index.__f__("warn", "at pages/index/index.vue:176", "数据库中没有找到分类数据，尝试使用API方式获取");
          const apiRes = await cateApi.get();
          if (apiRes && apiRes.data && apiRes.data.length > 0) {
            common_vendor.index.__f__("log", "at pages/index/index.vue:182", "API获取分类成功:", apiRes.data.length, "个分类");
            let processedCateList = apiRes.data.map((cate) => {
              return {
                ...cate,
                cate_img: getCategoryIcon(cate)
              };
            });
            const allCategory = {
              _id: "all",
              cate_name: "全部",
              cate_img: "/static/images/defalut.png",
              sort: 9999
              // 确保排序权重最高
            };
            const hasAllCategory = processedCateList.some(
              (cate) => cate.cate_name === "全部" || cate._id === "all"
            );
            if (!hasAllCategory) {
              processedCateList.unshift(allCategory);
            } else {
              const allIndex = processedCateList.findIndex(
                (cate) => cate.cate_name === "全部" || cate._id === "all"
              );
              if (allIndex > 0) {
                const allCate = processedCateList.splice(allIndex, 1)[0];
                processedCateList.unshift(allCate);
              }
            }
            cateList.value = processedCateList;
            try {
              common_vendor.index.setStorageSync("cachedCategories", processedCateList);
            } catch (cacheErr) {
              common_vendor.index.__f__("warn", "at pages/index/index.vue:226", "缓存分类数据失败:", cacheErr);
            }
            currentCateId.value = processedCateList[0]._id;
            activeIndex.value = 0;
            pageNo.value = 1;
            getArticleList(currentCateId.value);
          } else {
            try {
              const cachedCates = common_vendor.index.getStorageSync("cachedCategories");
              if (cachedCates && cachedCates.length > 0) {
                cateList.value = cachedCates;
                common_vendor.index.__f__("log", "at pages/index/index.vue:242", "使用缓存的分类数据");
                if (cachedCates.length > 0) {
                  currentCateId.value = cachedCates[0]._id;
                  activeIndex.value = 0;
                }
                getArticleList(currentCateId.value);
              } else {
                common_vendor.index.__f__("log", "at pages/index/index.vue:254", "使用默认分类数据");
                const defaultCategories = [
                  { _id: "all", cate_name: "全部", cate_img: "/static/images/defalut.png" },
                  { _id: "default2", cate_name: "餐饮", cate_img: "/static/images/defalut.png" },
                  { _id: "default3", cate_name: "购物", cate_img: "/static/images/defalut.png" },
                  { _id: "default4", cate_name: "服务", cate_img: "/static/images/defalut.png" }
                ];
                cateList.value = defaultCategories;
                currentCateId.value = defaultCategories[0]._id;
                activeIndex.value = 0;
                getArticleList();
              }
            } catch (cacheErr) {
              common_vendor.index.__f__("error", "at pages/index/index.vue:270", "读取缓存分类失败:", cacheErr);
              getArticleList();
            }
          }
        }
      } catch (err) {
        common_vendor.index.__f__("error", "at pages/index/index.vue:277", "获取分类失败:", err);
        try {
          const cachedCates = common_vendor.index.getStorageSync("cachedCategories");
          if (cachedCates && cachedCates.length > 0) {
            cateList.value = cachedCates;
            common_vendor.index.__f__("log", "at pages/index/index.vue:284", "使用缓存的分类数据");
            if (cachedCates.length > 0) {
              currentCateId.value = cachedCates[0]._id;
              activeIndex.value = 0;
            }
            getArticleList(currentCateId.value);
          } else {
            const defaultCategories = [
              { _id: "all", cate_name: "全部", cate_img: "/static/images/defalut.png" },
              { _id: "default2", cate_name: "餐饮", cate_img: "/static/images/defalut.png" },
              { _id: "default3", cate_name: "购物", cate_img: "/static/images/defalut.png" },
              { _id: "default4", cate_name: "服务", cate_img: "/static/images/defalut.png" }
            ];
            cateList.value = defaultCategories;
            currentCateId.value = defaultCategories[0]._id;
            activeIndex.value = 0;
            getArticleList();
          }
        } catch (cacheErr) {
          common_vendor.index.__f__("error", "at pages/index/index.vue:311", "读取缓存分类失败:", cacheErr);
          getArticleList();
        }
      } finally {
        common_vendor.index.hideLoading();
      }
    };
    const pageNo = common_vendor.ref(1);
    const hanleHeadTab = (index, id) => {
      activeIndex.value = index;
      pageNo.value = 1;
      status.value = "more";
      currentCateId.value = id;
      getArticleList(id);
    };
    const articleList = common_vendor.ref([]);
    let tempCateId = "";
    const isLoading = common_vendor.ref(true);
    const getArticleList = async (cate_id) => {
      if (loadingManager.isLoading)
        return;
      try {
        tempCateId = cate_id === "all" ? "" : cate_id || "";
        common_vendor.index.__f__("log", "at pages/index/index.vue:346", tempCateId, "临时id");
        loadingManager.showLoading("加载文章列表...", true);
        isLoading.value = true;
        const res = await articleApi.getArticle(tempCateId, pageNo.value, pageSize);
        common_vendor.index.__f__("log", "at pages/index/index.vue:354", res);
        articleList.value = res.data;
      } catch (err) {
        common_vendor.index.__f__("log", "at pages/index/index.vue:357", err);
        common_vendor.index.showToast({
          title: "加载失败，请重试",
          icon: "none",
          duration: 2e3
        });
      } finally {
        loadingManager.hideLoading();
        isLoading.value = false;
      }
    };
    common_vendor.onPullDownRefresh(async () => {
      if (loadingManager.isLoading) {
        common_vendor.index.stopPullDownRefresh();
        return;
      }
      pageNo.value = 1;
      status.value = "more";
      try {
        await getArticleList(tempCateId);
      } catch (err) {
        common_vendor.index.__f__("error", "at pages/index/index.vue:384", "下拉刷新失败:", err);
        common_vendor.index.showToast({
          title: "刷新失败，请重试",
          icon: "none"
        });
      } finally {
        common_vendor.index.stopPullDownRefresh();
      }
    });
    const status = common_vendor.ref("more");
    common_vendor.onReachBottom(async () => {
      common_vendor.index.__f__("log", "at pages/index/index.vue:400", "触底");
      if (status.value === "noMore" || loadingManager.isLoading)
        return;
      status.value = "loading";
      try {
        loadingManager.showLoading("加载更多...", false);
        pageNo.value++;
        const res = await articleApi.getArticle(tempCateId, pageNo.value, pageSize);
        articleList.value = [...articleList.value, ...res.data];
        if (res.data.length > 0) {
          status.value = "more";
        } else {
          status.value = "noMore";
        }
      } catch (err) {
        common_vendor.index.__f__("error", "at pages/index/index.vue:425", "加载更多失败:", err);
        common_vendor.index.showToast({
          title: "加载失败，请重试",
          icon: "none"
        });
        status.value = "more";
      } finally {
        loadingManager.hideLoading();
      }
    });
    const handleDelete = async (articleId) => {
      try {
        common_vendor.index.showModal({
          title: "确认删除",
          content: "确定要删除这篇文章吗？",
          success: async (res) => {
            if (res.confirm) {
              loadingManager.showLoading("删除中...");
              common_vendor.index.__f__("log", "at pages/index/index.vue:450", "正在删除文章ID:", articleId, "用户ID:", userStore.userInfo.uid);
              if (!userStore.userInfo.uid) {
                common_vendor.index.showToast({
                  title: "请先登录",
                  icon: "none",
                  duration: 2e3
                });
                loadingManager.hideLoading();
                return;
              }
              const res2 = await articleApi.del(articleId, userStore.userInfo.uid);
              common_vendor.index.__f__("log", "at pages/index/index.vue:465", "删除接口返回结果:", res2);
              if (res2 && res2.deleted) {
                const index = articleList.value.findIndex((item) => item._id === articleId);
                if (index !== -1) {
                  articleList.value.splice(index, 1);
                }
                loadingManager.hideLoading();
                common_vendor.index.showToast({
                  title: "删除成功",
                  icon: "success",
                  duration: 2e3
                });
              } else {
                throw new Error(res2.message || "删除失败，请重试");
              }
            }
          }
        });
      } catch (err) {
        common_vendor.index.__f__("error", "at pages/index/index.vue:487", "删除文章失败:", err);
        loadingManager.hideLoading();
        common_vendor.index.showToast({
          title: err.message || "删除失败，请重试",
          icon: "none",
          duration: 2e3
        });
      }
    };
    const handelContact = (mobile) => {
      common_vendor.index.__f__("log", "at pages/index/index.vue:499", mobile);
      if (!userStore.userInfo.isLogin) {
        return utils_isLogin.testLogin();
      }
      if (mobile === "未填写") {
        return common_vendor.index.showToast({
          icon: "none",
          title: "他并不想让人联系"
        });
      }
      common_vendor.index.__f__("log", "at pages/index/index.vue:513", "运行在抖音小程序环境");
      try {
        common_vendor.index.makePhoneCall({
          phoneNumber: mobile,
          success: function() {
            common_vendor.index.__f__("log", "at pages/index/index.vue:520", "拨打电话成功");
          },
          fail: function(err) {
            common_vendor.index.__f__("error", "at pages/index/index.vue:523", "拨打电话失败:", err);
            if (err.errNo === 10202 || err.errNo === 10101 || err.errMsg.includes("auth deny") || err.errMsg.includes("not declared in the privacy")) {
              common_vendor.index.showModal({
                title: "提示",
                content: `由于平台限制，无法直接拨打电话。您可以复制此号码(${mobile})后手动拨打。`,
                confirmText: "复制号码",
                cancelText: "取消",
                success: (res) => {
                  if (res.confirm) {
                    common_vendor.index.setClipboardData({
                      data: mobile,
                      success: () => {
                        common_vendor.index.showToast({
                          title: "电话号码已复制",
                          icon: "success"
                        });
                      }
                    });
                  }
                }
              });
            } else {
              common_vendor.index.showToast({
                icon: "none",
                title: "拨打电话失败，请手动拨打"
              });
            }
          }
        });
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/index/index.vue:557", "拨打电话异常:", error);
        common_vendor.index.showModal({
          title: "无法拨打电话",
          content: `您可以复制此号码(${mobile})后手动拨打`,
          confirmText: "复制号码",
          cancelText: "取消",
          success: (res) => {
            if (res.confirm) {
              common_vendor.index.setClipboardData({
                data: mobile,
                success: () => {
                  common_vendor.index.showToast({
                    title: "电话号码已复制",
                    icon: "success"
                  });
                }
              });
            }
          }
        });
      }
    };
    const handelGoUserList = (user_id) => {
      if (!avatarClickState.value) {
        common_vendor.index.__f__("log", "at pages/index/index.vue:595", "头像点击功能已禁用");
        common_vendor.index.showToast({
          title: "联系管理员",
          icon: "none",
          duration: 2e3
        });
        return;
      }
      common_vendor.index.navigateTo({
        url: `/pages/userArticleList/userArticleList?userId=${user_id}`
      });
    };
    common_vendor.onMounted(() => {
      cateListGet();
      common_vendor.index.$on("articlePublished", (articleId) => {
        common_vendor.index.__f__("log", "at pages/index/index.vue:618", "收到文章发布成功事件，文章ID:", articleId);
        pageNo.value = 1;
        status.value = "more";
        getArticleList(tempCateId);
        common_vendor.index.showToast({
          title: "发布成功，内容已更新",
          icon: "success",
          duration: 2e3
        });
      });
      common_vendor.index.$on("refreshIndexOnce", (articleId) => {
        common_vendor.index.__f__("log", "at pages/index/index.vue:634", "收到一次性刷新事件，文章ID:", articleId);
        pageNo.value = 1;
        status.value = "more";
        setTimeout(() => {
          getArticleList(tempCateId).then(() => {
            if (articleId && articleList.value.length > 0) {
              const index = articleList.value.findIndex((item) => item._id === articleId);
              if (index !== -1) {
                common_vendor.index.__f__("log", "at pages/index/index.vue:656", "找到新发布的文章，位置:", index);
              }
            }
          }).catch((err) => {
            common_vendor.index.__f__("error", "at pages/index/index.vue:661", "刷新文章列表失败:", err);
          });
        }, 300);
      });
      common_vendor.index.$on("viewCountUpdated", (articleId) => {
        updateLocalViewCount(articleId);
      });
      common_vendor.index.showShareMenu({
        withShareTicket: true
      });
      common_vendor.index.$on("avatarClickChanged", (newState) => {
        common_vendor.index.__f__("log", "at pages/index/index.vue:679", "首页收到头像点击状态变化事件:", newState);
        avatarClickState.value = newState;
      });
    });
    common_vendor.onUnmounted(() => {
      common_vendor.index.$off("articlePublished");
      common_vendor.index.$off("refreshIndexOnce");
      common_vendor.index.$off("viewCountUpdated");
      common_vendor.index.$off("avatarClickChanged");
      common_vendor.index.$emit("index-page-destroyed");
    });
    common_vendor.onPageScroll(() => {
      loadingManager.hideLoading();
    });
    let lastRefreshTime = 0;
    common_vendor.onBackPress((e) => {
      common_vendor.index.__f__("log", "at pages/index/index.vue:704", "检测到返回按钮事件", e);
      const now = Date.now();
      if (now - lastRefreshTime < 1e3) {
        common_vendor.index.__f__("log", "at pages/index/index.vue:711", "距离上次刷新时间不足1秒，跳过刷新");
        return false;
      }
      lastRefreshTime = now;
      const pages = getCurrentPages();
      const currentPage = pages[pages.length - 1];
      if (currentPage && currentPage.route === "pages/index/index") {
        common_vendor.index.__f__("log", "at pages/index/index.vue:723", "当前在首页，检查是否需要刷新");
        setTimeout(() => {
          pageNo.value = 1;
          status.value = "more";
          getArticleList(tempCateId);
        }, 300);
      }
      return false;
    });
    common_vendor.onActivated(() => {
      common_vendor.index.__f__("log", "at pages/index/index.vue:740", "首页被激活");
      const now = Date.now();
      if (now - lastRefreshTime > 5e3) {
        common_vendor.index.__f__("log", "at pages/index/index.vue:747", "页面激活，自动刷新内容");
        lastRefreshTime = now;
        pageNo.value = 1;
        status.value = "more";
        getArticleList(tempCateId);
      }
    });
    const getCategoryIcon = (category) => {
      if (category && category.cate_img && category.cate_img.length > 4) {
        if (category.cate_img.startsWith("http") || category.cate_img.startsWith("/")) {
          return category.cate_img;
        }
      }
      if (category && category.cate_name) {
        const iconMapping = {
          "餐饮": "/static/images/category/food.png",
          "美食": "/static/images/category/food.png",
          "购物": "/static/images/category/shopping.png",
          "商场": "/static/images/category/shopping.png",
          "教育": "/static/images/category/education.png",
          "学校": "/static/images/category/education.png",
          "医疗": "/static/images/category/medical.png",
          "医院": "/static/images/category/medical.png",
          "交通": "/static/images/category/transportation.png",
          "旅游": "/static/images/category/tourism.png",
          "景点": "/static/images/category/tourism.png",
          "住宿": "/static/images/category/accommodation.png",
          "酒店": "/static/images/category/accommodation.png",
          "娱乐": "/static/images/category/entertainment.png",
          "运动": "/static/images/category/sports.png",
          "健身": "/static/images/category/sports.png",
          "服务": "/static/images/category/service.png",
          "房产": "/static/images/category/real_estate.png",
          "招聘": "/static/images/category/recruitment.png",
          "求职": "/static/images/category/recruitment.png",
          "金融": "/static/images/category/finance.png",
          "科技": "/static/images/category/technology.png",
          "办公": "/static/images/category/office.png",
          "公司": "/static/images/category/company.png",
          "企业": "/static/images/category/company.png"
        };
        for (const [keyword, iconPath] of Object.entries(iconMapping)) {
          if (category.cate_name.includes(keyword)) {
            return iconPath;
          }
        }
      }
      return "/static/images/defalut.png";
    };
    const updateLocalViewCount = (articleId) => {
      if (!articleId || !articleList.value.length)
        return;
      const index = articleList.value.findIndex((item) => item._id === articleId);
      if (index !== -1) {
        if (articleList.value[index].view_count !== void 0) {
          articleList.value[index].view_count++;
          common_vendor.index.__f__("log", "at pages/index/index.vue:819", `文章 ${articleId} view_count已更新为:`, articleList.value[index].view_count);
        }
        if (articleList.value[index].look_count !== void 0) {
          articleList.value[index].look_count++;
          common_vendor.index.__f__("log", "at pages/index/index.vue:825", `文章 ${articleId} look_count已更新为:`, articleList.value[index].look_count);
        } else if (articleList.value[index].view_count !== void 0) {
          articleList.value[index].look_count = articleList.value[index].view_count;
        } else {
          articleList.value[index].view_count = 1;
          articleList.value[index].look_count = 1;
          common_vendor.index.__f__("log", "at pages/index/index.vue:833", `文章 ${articleId} 浏览量已初始化为:1`);
        }
      }
    };
    const previewImage = (urls, current) => {
      if (!urls || !urls.length) {
        common_vendor.index.__f__("error", "at pages/index/index.vue:842", "预览图片缺少URLs参数");
        return;
      }
      let previewUrls = urls;
      if (typeof current === "object" && current !== null) {
        current = current.compressedURL;
      }
      if (urls.length > 0 && typeof urls[0] === "object") {
        previewUrls = urls.map((img) => img.compressedURL);
      }
      common_vendor.index.previewImage({
        urls: previewUrls,
        // 需要预览的图片链接列表（此时已是压缩URL或原始URL）
        current: current || previewUrls[0],
        // 当前显示图片的链接
        indicator: "number",
        // 显示页码指示器
        loop: true,
        // 循环预览
        success: () => {
          common_vendor.index.__f__("log", "at pages/index/index.vue:866", "图片预览成功");
        },
        fail: (err) => {
          common_vendor.index.__f__("error", "at pages/index/index.vue:869", "预览图片失败:", err);
          common_vendor.index.showToast({
            title: "预览图片失败",
            icon: "none"
          });
        },
        complete: () => {
        }
      });
    };
    common_vendor.onShow(() => {
      getSendOnState();
      if (lastActiveTime && Date.now() - lastActiveTime > 6e4) {
        common_vendor.index.__f__("log", "at pages/index/index.vue:890", "应用从后台恢复，重新获取分类");
        cateListGet();
      }
      lastActiveTime = Date.now();
    });
    let lastActiveTime = Date.now();
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.f(cateList.value, (item, index, i0) => {
          return common_vendor.e({
            a: item.cate_img
          }, item.cate_img ? {
            b: item.cate_img
          } : {}, {
            c: common_vendor.t(item.cate_name),
            d: item._id,
            e: currentCateId.value === item._id ? 1 : "",
            f: common_vendor.o(($event) => hanleHeadTab(index, item._id))
          });
        }),
        b: cateList.value.length == 0
      }, cateList.value.length == 0 ? {
        c: common_vendor.p({
          type: "spinner-cycle",
          size: "24",
          color: "#399bfe"
        })
      } : {}, {
        d: articleList.value.length === 0 && isLoading.value
      }, articleList.value.length === 0 && isLoading.value ? {
        e: common_vendor.p({
          type: "spinner-cycle",
          size: "48",
          color: "#399bfe"
        })
      } : {}, {
        f: articleList.value.length === 0 && !isLoading.value
      }, articleList.value.length === 0 && !isLoading.value ? {
        g: common_vendor.p({
          color: "#5cb85c",
          ["custom-prefix"]: "icon",
          type: "lishuai-a-00jichuiconkongzhuangtaiwuneirong",
          size: "58"
        })
      } : {}, {
        h: common_vendor.f(articleList.value, (item, k0, i0) => {
          return {
            a: item._id,
            b: "1cf27b2a-3-" + i0,
            c: common_vendor.p({
              item,
              avatarClickEnabled: avatarClickState.value
            })
          };
        }),
        i: common_vendor.o(handelContact),
        j: common_vendor.o((url, urls) => previewImage(urls, url)),
        k: common_vendor.o(handelGoUserList),
        l: common_vendor.o(handleDelete),
        m: !articleList.value.length == 0
      }, !articleList.value.length == 0 ? {
        n: common_vendor.p({
          color: "#cccccc",
          iconType: "auto",
          status: status.value
        })
      } : {});
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-1cf27b2a"]]);
_sfc_main.__runtimeHooks = 1;
tt.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-toutiao/pages/index/index.js.map
