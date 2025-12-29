"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_formatTime = require("../../utils/formatTime.js");
if (!Array) {
  const _easycom_uni_icons2 = common_vendor.resolveComponent("uni-icons");
  const _easycom_uni_load_more2 = common_vendor.resolveComponent("uni-load-more");
  (_easycom_uni_icons2 + _easycom_uni_load_more2)();
}
const _easycom_uni_icons = () => "../../uni_modules/uni-icons/components/uni-icons/uni-icons.js";
const _easycom_uni_load_more = () => "../../uni_modules/uni-load-more/components/uni-load-more/uni-load-more.js";
if (!Math) {
  (_easycom_uni_icons + _easycom_uni_load_more)();
}
const _sfc_main = {
  __name: "tuijian",
  props: {
    // 当前文章ID
    currentArticleId: {
      type: String,
      required: true
    },
    // 分类ID
    cate_id: {
      type: String,
      default: ""
    }
  },
  emits: ["click"],
  setup(__props, { expose: __expose, emit: __emit }) {
    const props = __props;
    const emit = __emit;
    const articles = common_vendor.ref([]);
    const pageNo = common_vendor.ref(1);
    const pageSize = common_vendor.ref(8);
    const isLoadingMore = common_vendor.ref(false);
    const loadMoreStatus = common_vendor.ref("more");
    const articleApi = common_vendor.nr.importObject("articleKs", { customUI: true });
    const cateApi = common_vendor.nr.importObject("cateKs", { customUI: true });
    const getCategoryName = async (cateId) => {
      try {
        if (!cateId)
          return "未分类";
        const res = await cateApi.get(cateId);
        return res.data && res.data[0] ? res.data[0].cate_name : "未分类";
      } catch (err) {
        console.error("获取分类名称失败:", err);
        return "未分类";
      }
    };
    const getCategoryImage = async (cateId) => {
      try {
        if (!cateId)
          return "/static/images/default-image.png";
        const res = await cateApi.get(cateId);
        return res.data && res.data[0] && res.data[0].cate_img ? res.data[0].cate_img : "/static/images/default-image.png";
      } catch (err) {
        console.error("获取分类图片失败:", err);
        return "/static/images/default-image.png";
      }
    };
    const getMoreArticles = async (refresh = false) => {
      try {
        if (refresh) {
          pageNo.value = 1;
          loadMoreStatus.value = "loading";
        }
        isLoadingMore.value = true;
        const res = await articleApi.getArticle(
          props.cate_id || "01",
          // 如果没有分类ID，则获取最新文章
          pageNo.value,
          pageSize.value
        );
        if (res.code === 0 && res.data) {
          const filteredData = res.data.filter((item) => item._id !== props.currentArticleId);
          const articlesWithCategory = await Promise.all(
            filteredData.map(async (article) => {
              if (!article.cate_name) {
                article.cate_name = await getCategoryName(article.cate_id);
              }
              if (!article.images || article.images.length === 0) {
                article.category_image = await getCategoryImage(article.cate_id);
              }
              return article;
            })
          );
          if (refresh || pageNo.value === 1) {
            articles.value = articlesWithCategory;
          } else {
            articles.value = [...articles.value, ...articlesWithCategory];
          }
          if (filteredData.length === 0) {
            loadMoreStatus.value = "noMore";
          } else if (filteredData.length < pageSize.value && pageNo.value > 1) {
            loadMoreStatus.value = "noMore";
          } else {
            loadMoreStatus.value = "more";
          }
        } else {
          throw new Error(res.message || "获取更多文章失败");
        }
      } catch (err) {
        console.error("获取更多文章失败:", err);
        loadMoreStatus.value = "more";
      } finally {
        isLoadingMore.value = false;
      }
    };
    const loadMore = async () => {
      if (isLoadingMore.value || loadMoreStatus.value === "noMore")
        return;
      pageNo.value++;
      await getMoreArticles(false);
    };
    const handleArticleClick = (articleId) => {
      emit("click", articleId);
    };
    const handleImagePreview = (images) => {
      if (!images || !images.length)
        return;
      const urls = images.map((img) => img.compressedURL);
      common_vendor.index.previewImage({
        current: urls[0],
        // 默认显示第一张
        urls,
        indicator: "number",
        loop: true,
        fail: (err) => {
          console.error("预览图片失败:", err);
          common_vendor.index.showToast({
            title: "预览图片失败",
            icon: "none"
          });
        }
      });
    };
    common_vendor.watch(() => props.cate_id, (newVal, oldVal) => {
      if (newVal !== oldVal) {
        getMoreArticles(true);
      }
    });
    common_vendor.onMounted(() => {
      getMoreArticles(true);
    });
    __expose({
      loadMore,
      refresh: () => getMoreArticles(true)
    });
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.t(__props.cate_id ? "相关推荐" : "更多文章"),
        b: articles.value.length > 0
      }, articles.value.length > 0 ? {
        c: common_vendor.f(articles.value, (item, k0, i0) => {
          return common_vendor.e({
            a: item.images && item.images.length ? item.images[0].compressedURL : item.category_image || "/static/images/default-image.png",
            b: common_vendor.o(($event) => item.images && item.images.length ? handleImagePreview(item.images) : null),
            c: item.images && item.images.length > 1
          }, item.images && item.images.length > 1 ? {
            d: "089fc835-0-" + i0,
            e: common_vendor.p({
              type: "image",
              size: "12",
              color: "#fff"
            }),
            f: common_vendor.t(item.images.length)
          } : {}, {
            g: common_vendor.t(item.cate_name || "未分类"),
            h: common_vendor.t(item.content),
            i: common_vendor.t(common_vendor.unref(utils_formatTime.formatTime)(item.create_time)),
            j: common_vendor.t(item.look_count || 0),
            k: item._id,
            l: common_vendor.o(($event) => handleArticleClick(item._id))
          });
        })
      } : {}, {
        d: common_vendor.p({
          status: isLoadingMore.value ? "loading" : loadMoreStatus.value,
          contentText: {
            contentdown: "上拉加载更多",
            contentrefresh: "加载中...",
            contentnomore: __props.cate_id ? "没有更多相关文章了" : "没有更多文章了"
          },
          iconType: "auto",
          color: "#cccccc"
        }),
        e: common_vendor.gei(_ctx, "")
      });
    };
  }
};
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-089fc835"]]);
ks.createComponent(Component);
