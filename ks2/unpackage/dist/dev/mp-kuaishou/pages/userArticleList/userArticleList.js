"use strict";
const common_vendor = require("../../common/vendor.js");
const common_assets = require("../../common/assets.js");
const store_user = require("../../store/user.js");
const utils_isLogin = require("../../utils/isLogin.js");
if (!Array) {
  const _easycom_user_header2 = common_vendor.resolveComponent("user-header");
  const _easycom_uni_load_more2 = common_vendor.resolveComponent("uni-load-more");
  const _easycom_articleItem2 = common_vendor.resolveComponent("articleItem");
  (_easycom_user_header2 + _easycom_uni_load_more2 + _easycom_articleItem2)();
}
const _easycom_user_header = () => "../../components/user-header/user-header.js";
const _easycom_uni_load_more = () => "../../uni_modules/uni-load-more/components/uni-load-more/uni-load-more.js";
const _easycom_articleItem = () => "../../components/articleItem/articleItem.js";
if (!Math) {
  (_easycom_user_header + _easycom_uni_load_more + _easycom_articleItem)();
}
const _sfc_main = {
  __name: "userArticleList",
  props: {
    userId: String
  },
  setup(__props) {
    const props = __props;
    const userStore = store_user.useUserInfoStore();
    const articleTotal = common_vendor.computed(() => {
      return userArticleData.value.length;
    });
    const likesTotal = common_vendor.computed(() => {
      let likeArray = userArticleData.value.map((item) => item.like_count) || [];
      return likeArray.reduce((sum, item) => sum + item, 0);
    });
    const articleApi = common_vendor.nr.importObject("articleKs", { customUI: true });
    const pageNo = common_vendor.ref(1);
    const pageSize = common_vendor.ref(8);
    const userArticleData = common_vendor.ref([]);
    const userArticleInfo = common_vendor.ref({});
    const isLoading = common_vendor.ref(true);
    const getArticelList = async (refresh = false) => {
      try {
        isLoading.value = true;
        const res = await articleApi.getArticleList(props.userId, pageNo.value, pageSize.value);
        console.log(res);
        if (refresh || pageNo.value === 1) {
          userArticleData.value = res.data;
        } else {
          userArticleData.value = [...userArticleData.value, ...res.data];
        }
        userArticleInfo.value = res.userInfo;
        if (res.data.length < pageSize.value) {
          status.value = "noMore";
        } else {
          status.value = "more";
        }
      } catch (err) {
        console.error("获取文章列表失败:", err);
        common_vendor.index.showToast({
          title: "加载失败，请重试",
          icon: "none"
        });
        status.value = "more";
      } finally {
        isLoading.value = false;
        if (refresh) {
          common_vendor.index.stopPullDownRefresh();
        }
      }
    };
    common_vendor.onPullDownRefresh(async () => {
      pageNo.value = 1;
      await getArticelList(true);
    });
    const handleDelete = async (article_id) => {
      try {
        common_vendor.index.showLoading({ title: "删除中...", mask: true });
        const res = await articleApi.del(article_id, userStore.userInfo.uid);
        if (res.deleted) {
          common_vendor.index.hideLoading();
          common_vendor.index.showToast({ title: "删除成功", icon: "success" });
          userArticleData.value = userArticleData.value.filter((item) => item._id !== article_id);
        }
      } catch (err) {
        common_vendor.index.hideLoading();
        common_vendor.index.showToast({ title: err.message || "删除失败", icon: "none" });
      }
    };
    const previewImage = (urls, current) => {
      common_vendor.index.previewImage({
        urls,
        current
      });
    };
    const handleContact = () => {
      if (!userStore.userInfo.isLogin) {
        return utils_isLogin.testLogin();
      }
      if (userArticleInfo.value.mobile === "未填写") {
        return common_vendor.index.showToast({
          icon: "none",
          title: "他并不想让人联系"
        });
      }
      common_vendor.index.makePhoneCall({
        phoneNumber: userArticleInfo.value.mobile
      });
    };
    const status = common_vendor.ref("more");
    const scrolltolower = async () => {
      if (status.value === "noMore" || isLoading.value)
        return;
      status.value = "loading";
      pageNo.value++;
      await getArticelList();
    };
    common_vendor.onMounted(() => {
      console.log(props.userId, "传递过来的id");
      getArticelList();
      common_vendor.index.showShareMenu({
        withShareTicket: true
      });
      common_vendor.index.$on("updateArticleLookCount", ({ articleId, lookCount }) => {
        const article = userArticleData.value.find((item) => item._id === articleId);
        if (article) {
          article.look_count = lookCount;
        }
      });
    });
    common_vendor.onUnmounted(() => {
      common_vendor.index.$off("updateArticleLookCount");
    });
    common_vendor.index.showShareMenu({
      withShareTicket: true
    });
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.j({
          "contact": common_vendor.o(handleContact)
        }),
        b: common_vendor.p({
          articleTotal: articleTotal.value,
          likesTotal: likesTotal.value,
          userInfo: userArticleInfo.value
        }),
        c: isLoading.value && userArticleData.value.length === 0
      }, isLoading.value && userArticleData.value.length === 0 ? {
        d: common_vendor.p({
          status: "loading",
          iconType: "snow"
        })
      } : userArticleData.value.length === 0 ? {
        f: common_assets._imports_0
      } : {
        g: common_vendor.f(userArticleData.value, (item, k0, i0) => {
          return {
            a: item._id,
            b: "72340410-2-" + i0,
            c: common_vendor.p({
              item
            })
          };
        }),
        h: common_vendor.j({
          "preview": common_vendor.o((url, urls) => previewImage(urls, url)),
          "contact": common_vendor.o(handleContact),
          "delete": common_vendor.o(handleDelete)
        })
      }, {
        e: userArticleData.value.length === 0,
        i: userArticleData.value.length > 0
      }, userArticleData.value.length > 0 ? {
        j: common_vendor.p({
          color: "#cccccc",
          iconType: "auto",
          status: status.value
        })
      } : {}, {
        k: common_vendor.o(scrolltolower),
        l: common_vendor.gei(_ctx, "")
      });
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-72340410"]]);
ks.createPage(MiniProgramPage);
