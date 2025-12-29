"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_formatTime = require("../../utils/formatTime.js");
const store_user = require("../../store/user.js");
if (!Array) {
  const _easycom_uni_load_more2 = common_vendor.resolveComponent("uni-load-more");
  _easycom_uni_load_more2();
}
const _easycom_uni_load_more = () => "../../uni_modules/uni-load-more/components/uni-load-more/uni-load-more.js";
if (!Math) {
  _easycom_uni_load_more();
}
const _sfc_main = {
  __name: "articleManage",
  setup(__props) {
    const userInfoStore = store_user.useUserInfoStore();
    const articleApi = common_vendor.nr.importObject("articleKs", { customUI: true });
    const articleList = common_vendor.ref([]);
    const stats = common_vendor.ref({
      pending: 0,
      approved: 0,
      rejected: 0
    });
    const currentStatus = common_vendor.ref("0");
    const getPlatform = () => {
      try {
        return "other";
      } catch (err) {
        console.error("获取平台信息失败:", err);
        return "other";
      }
    };
    const platform = common_vendor.ref(getPlatform());
    const getArticleList = async () => {
      try {
        const params = { state: Number(currentStatus.value) };
        const res = await articleApi.getAdminArticles(params);
        articleList.value = res.data.map((article) => ({
          ...article,
          create_time: utils_formatTime.formatTime(article.create_time)
        }));
        stats.value = res.stats;
      } catch (e) {
        common_vendor.index.showToast({
          title: e.message || "获取文章列表失败",
          icon: "none"
        });
      }
    };
    const handleStatusChange = (status) => {
      currentStatus.value = status;
      getArticleList();
    };
    const handleAudit = async (articleId, state) => {
      try {
        common_vendor.index.showLoading({ title: "处理中..." });
        await articleApi.updateState(articleId, state);
        common_vendor.index.hideLoading();
        common_vendor.index.showToast({
          title: state === 1 ? "已通过" : "已拒绝",
          icon: "success"
        });
        getArticleList();
      } catch (e) {
        common_vendor.index.hideLoading();
        common_vendor.index.showToast({
          title: e.message || "操作失败",
          icon: "none"
        });
      }
    };
    const handleDelete = async (articleId) => {
      common_vendor.index.showModal({
        title: "提示",
        content: "确定要删除这篇文章吗？",
        async success(res) {
          if (res.confirm) {
            try {
              common_vendor.index.showLoading({ title: "删除中..." });
              await articleApi.adminDelete(articleId, userInfoStore.userInfo.role[0]);
              common_vendor.index.hideLoading();
              common_vendor.index.showToast({
                title: "删除成功",
                icon: "success"
              });
              getArticleList();
            } catch (e) {
              common_vendor.index.hideLoading();
              common_vendor.index.showToast({
                title: e.message || "删除失败",
                icon: "none"
              });
            }
          }
        }
      });
    };
    const goToHome = () => {
      common_vendor.index.switchTab({
        url: "/pages/index/index"
      });
    };
    const previewImage = (images, current) => {
      const validUrls = images.map((img) => {
        if (typeof img === "string")
          return img;
        if (img && img.url)
          return img.url;
        if (img && img.compressed)
          return img.compressed;
        return "";
      }).filter((url) => url);
      if (validUrls.length > 0) {
        const validCurrent = typeof current === "string" ? current : current && current.url ? current.url : validUrls[0];
        common_vendor.index.previewImage({
          urls: validUrls,
          current: validCurrent
        });
      }
    };
    const loadingStatus = common_vendor.ref("more");
    const hasMore = common_vendor.ref(true);
    const loadMore = async () => {
      if (!hasMore.value || loadingStatus.value === "loading")
        return;
      try {
        loadingStatus.value = "loading";
      } catch (err) {
        console.error("加载更多失败:", err);
        loadingStatus.value = "more";
      }
    };
    common_vendor.onMounted(() => {
      getArticleList();
    });
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.t(stats.value.pending),
        b: common_vendor.t(stats.value.approved),
        c: common_vendor.t(stats.value.rejected),
        d: currentStatus.value === "0" ? 1 : "",
        e: common_vendor.o(($event) => handleStatusChange("0")),
        f: currentStatus.value === "1" ? 1 : "",
        g: common_vendor.o(($event) => handleStatusChange("1")),
        h: currentStatus.value === "2" ? 1 : "",
        i: common_vendor.o(($event) => handleStatusChange("2")),
        j: common_vendor.f(articleList.value, (article, k0, i0) => {
          var _a, _b;
          return common_vendor.e({
            a: common_vendor.t(article.content),
            b: article.images && article.images.length
          }, article.images && article.images.length ? common_vendor.e({
            c: article.images.length === 1
          }, article.images.length === 1 ? {
            d: ((_a = article.images[0]) == null ? void 0 : _a.compressed) || ((_b = article.images[0]) == null ? void 0 : _b.url) || article.images[0] || "",
            e: common_vendor.o(($event) => previewImage(article.images, article.images[0]))
          } : {}, {
            f: article.images.length > 4
          }, article.images.length > 4 ? {
            g: common_vendor.f(article.images, (img, index, i1) => {
              return {
                a: (img == null ? void 0 : img.compressed) || (img == null ? void 0 : img.url) || img || "",
                b: common_vendor.o(($event) => previewImage(article.images, img)),
                c: index
              };
            })
          } : {
            h: common_vendor.f(article.images, (img, index, i1) => {
              return {
                a: (img == null ? void 0 : img.compressed) || (img == null ? void 0 : img.url) || img || "",
                b: common_vendor.o(($event) => previewImage(article.images, img)),
                c: index
              };
            })
          }) : {}, {
            i: common_vendor.t(article.create_time),
            j: common_vendor.t(article.state === 0 ? "待审核" : article.state === 1 ? "已通过" : "已拒绝"),
            k: article.state === 0 ? 1 : "",
            l: article.state === 1 ? 1 : "",
            m: article.state === 2 ? 1 : "",
            n: article.state === 0
          }, article.state === 0 ? {
            o: common_vendor.o(($event) => handleAudit(article._id, 1))
          } : {}, {
            p: article.state === 0
          }, article.state === 0 ? {
            q: common_vendor.o(($event) => handleAudit(article._id, 2))
          } : {}, {
            r: common_vendor.o(($event) => handleDelete(article._id)),
            s: article._id
          });
        }),
        k: articleList.value.length > 0
      }, articleList.value.length > 0 ? {
        l: common_vendor.p({
          status: loadingStatus.value,
          platform: platform.value,
          iconSize: 16,
          color: "#909399"
        })
      } : {}, {
        m: common_vendor.o(loadMore),
        n: common_vendor.o(goToHome),
        o: common_vendor.gei(_ctx, "")
      });
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-bc942a68"]]);
ks.createPage(MiniProgramPage);
