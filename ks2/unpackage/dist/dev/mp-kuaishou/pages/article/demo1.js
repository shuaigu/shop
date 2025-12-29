"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  __name: "demo1",
  setup(__props) {
    const isHidden = common_vendor.ref(false);
    common_vendor.ref(null);
    const videoContext = common_vendor.ref(null);
    const article = common_vendor.ref({
      user_avatarUrl: "",
      user_nickName: "",
      content: "",
      look_count: 0,
      like_count: 0,
      comment_count: 0,
      video: {
        compressedURL: "",
        thumbnailURL: "",
        duration: 0
      }
    });
    const videoUrl = common_vendor.ref("https://aly2.jingle0350.cn/2025/20250224/1740356982395_cwhfnlzb.mp4");
    const videoInfo = common_vendor.computed(() => {
      console.log("Computed videoInfo:", article.value.video);
      console.log("Video URL:", article.value.video.compressedURL);
      return article.value.video || {};
    });
    const initVideoContext = () => {
      common_vendor.nextTick$1(() => {
        videoContext.value = common_vendor.index.createVideoContext("myVideo");
      });
    };
    const getVideoArticle = async (id) => {
      try {
        console.log("Fetching video article with ID:", id);
        const db = common_vendor.nr.database();
        const res = await db.collection("articleList").get();
        console.log("Database response:", res);
        if (res.result.data && res.result.data.length > 0) {
          article.value = res.result.data[0];
          console.log("Fetched article data:", article.value);
          updateLookCount(id);
        } else {
          console.warn("No data found for the given ID");
        }
      } catch (e) {
        console.error("Error fetching video article:", e);
        common_vendor.index.showToast({
          title: "获取视频信息失败",
          icon: "none"
        });
      }
    };
    const updateLookCount = async (id) => {
      try {
        console.log("Updating look count for ID:", id);
        const db = common_vendor.nr.database();
        await db.collection("articleList").doc(id).update({
          look_count: article.value.look_count + 1
        });
        console.log("Look count updated successfully");
      } catch (e) {
        console.error("Error updating look count:", e);
      }
    };
    const handleVideoError = (err) => {
      console.error("Video playback error:", err);
      common_vendor.index.showToast({
        title: "视频加载失败",
        icon: "none"
      });
    };
    const handleScroll = (e) => {
      var _a, _b;
      const scrollTop = e.detail.scrollTop;
      const threshold = 600;
      if (scrollTop >= threshold && !isHidden.value) {
        isHidden.value = true;
        (_a = videoContext.value) == null ? void 0 : _a.pause();
      } else if (scrollTop < threshold && isHidden.value) {
        isHidden.value = false;
        (_b = videoContext.value) == null ? void 0 : _b.play();
      }
    };
    common_vendor.onMounted(() => {
      initVideoContext();
      const pages = getCurrentPages();
      const currentPage = pages[pages.length - 1];
      if (currentPage && currentPage.$page && currentPage.$page.options) {
        const options = currentPage.$page.options;
        if (options.id) {
          console.log("Page loaded with ID:", options.id);
          getVideoArticle(options.id);
        }
      }
    });
    return (_ctx, _cache) => {
      return {
        a: videoUrl.value,
        b: videoInfo.value.thumbnailURL,
        c: videoInfo.value.duration,
        d: common_vendor.o(handleVideoError),
        e: `translateY(${isHidden.value ? "-600rpx" : "0"})`,
        f: common_vendor.f(100, (n, k0, i0) => {
          return {
            a: n
          };
        }),
        g: common_vendor.o(handleScroll),
        h: common_vendor.gei(_ctx, "")
      };
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-0514628c"]]);
ks.createPage(MiniProgramPage);
