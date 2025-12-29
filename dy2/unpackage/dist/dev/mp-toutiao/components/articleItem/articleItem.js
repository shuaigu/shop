"use strict";
const common_vendor = require("../../common/vendor.js");
const store_user = require("../../store/user.js");
if (!Array) {
  const _easycom_uni_icons2 = common_vendor.resolveComponent("uni-icons");
  _easycom_uni_icons2();
}
const _easycom_uni_icons = () => "../../uni_modules/uni-icons/components/uni-icons/uni-icons.js";
if (!Math) {
  _easycom_uni_icons();
}
const _sfc_main = {
  __name: "articleItem",
  props: {
    item: {
      type: Object,
      require: true,
      default: () => ({
        user_info: {
          nickName: "未知用户",
          avatarUrl: "/static/images/default-avatar.png",
          mobile: "未填写"
        }
      })
    },
    // 是否显示评论区
    showComments: {
      type: Boolean,
      default: false
    },
    // 是否启用头像点击功能
    avatarClickEnabled: {
      type: Boolean,
      default: true
    }
  },
  emits: [
    "delete",
    "contact",
    "comment",
    "like",
    "preview",
    "userList",
    "update:comments"
  ],
  setup(__props, { emit: __emit }) {
    const userStore = store_user.useUserInfoStore();
    const isToutiao = common_vendor.ref(false);
    common_vendor.onMounted(() => {
      isToutiao.value = true;
      common_vendor.index.__f__("log", "at components/articleItem/articleItem.vue:13", "运行在抖音小程序环境");
    });
    const props = __props;
    const formatDate = (timestamp) => {
      if (!timestamp)
        return "未知时间";
      const now = Date.now();
      const diff = now - timestamp;
      const seconds = Math.floor(diff / 1e3);
      const minutes = Math.floor(seconds / 60);
      const hours = Math.floor(minutes / 60);
      const days = Math.floor(hours / 24);
      const date = new Date(timestamp);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const day = date.getDate();
      const hour = date.getHours();
      const minute = date.getMinutes();
      const formattedMonth = month < 10 ? `0${month}` : month;
      const formattedDay = day < 10 ? `0${day}` : day;
      const formattedHour = hour < 10 ? `0${hour}` : hour;
      const formattedMinute = minute < 10 ? `0${minute}` : minute;
      const timeStr = `${formattedHour}:${formattedMinute}`;
      if (days < 1) {
        return `${year}年 今天${timeStr}`;
      } else if (days < 2) {
        return `${year}年 昨天${timeStr}`;
      } else if (days < 10) {
        return `${year}年 ${days}天前${timeStr}`;
      } else {
        return `${year}年${formattedMonth}月${formattedDay}日 ${timeStr}`;
      }
    };
    const emit = __emit;
    const handleUserList = (user_id) => {
      if (!props.avatarClickEnabled) {
        common_vendor.index.__f__("log", "at components/articleItem/articleItem.vue:108", "头像点击功能已禁用");
        common_vendor.index.showToast({
          title: "此功能开发中",
          icon: "none",
          duration: 2e3
        });
        return;
      }
      emit("userList", user_id);
    };
    const handleDelete = (id) => {
      emit("delete", id);
    };
    const handleContact = (mobile) => {
      emit("contact", mobile);
    };
    const goToDetail = (item) => {
      if (!props.showComments) {
        if (isNavigating.value)
          return;
        isNavigating.value = true;
        try {
          common_vendor.index.navigateTo({
            url: `/pages/article/articleDetail?article_id=${item._id}&user_id=${item.user_id}`,
            animationType: "slide-in-right",
            // 添加滑入动画
            animationDuration: 300,
            // 设置动画持续时间为300ms
            success: () => {
              common_vendor.index.__f__("log", "at components/articleItem/articleItem.vue:178", "跳转到文章详情成功");
            },
            fail: (err) => {
              common_vendor.index.__f__("error", "at components/articleItem/articleItem.vue:181", "跳转到文章详情失败:", err);
              if (err.errMsg && err.errMsg.includes("too frequent")) {
                setTimeout(() => {
                  common_vendor.index.navigateTo({
                    url: `/pages/article/articleDetail?article_id=${item._id}&user_id=${item.user_id}`
                  });
                }, 500);
              } else {
                common_vendor.index.showToast({
                  title: "页面跳转失败",
                  icon: "none"
                });
              }
            },
            complete: () => {
              setTimeout(() => {
                isNavigating.value = false;
              }, 500);
            }
          });
        } catch (e) {
          common_vendor.index.__f__("error", "at components/articleItem/articleItem.vue:216", "跳转异常:", e);
          isNavigating.value = false;
          common_vendor.index.showToast({
            title: "操作异常，请重试",
            icon: "none"
          });
        }
      }
    };
    const isNavigating = common_vendor.ref(false);
    const userInfo = common_vendor.computed(() => {
      return props.item || {
        nickName: "未知用户",
        avatarUrl: "/static/images/default-avatar.png",
        mobile: "未填写"
      };
    });
    const onAvatarError = (e) => {
      e.target.src = "/static/images/default-avatar.png";
    };
    const handleLongPressPreview = (url, index) => {
      if (!url)
        return;
      common_vendor.index.__f__("log", "at components/articleItem/articleItem.vue:305", "Original URL:", url);
      const validImages = props.item.images.filter((img) => img.thumbnailURL || img.compressedURL || img.url);
      if (validImages.length) {
        const maxPreviewImages = validImages.length > 9 ? 8 : 9;
        const limitedImages = validImages.slice(0, maxPreviewImages);
        let urls = limitedImages.map((img) => img.compressedURL || img.thumbnailURL || img.url);
        urls = urls.map((imgUrl) => {
          if (imgUrl && imgUrl.startsWith("http://")) {
            return imgUrl.replace("http://", "https://");
          }
          return imgUrl;
        });
        const previewIndex = Math.min(index, urls.length - 1);
        emit("preview", urls[previewIndex], urls);
      }
    };
    return (_ctx, _cache) => {
      var _a, _b, _c, _d;
      return common_vendor.e({
        a: userInfo.value.user_avatarUrl,
        b: common_vendor.o(onAvatarError),
        c: common_vendor.t(userInfo.value.user_nickName),
        d: common_vendor.p({
          ["custom-prefix"]: "icon",
          type: "lishuai-dingwei",
          size: "12",
          color: "#8a8a8a"
        }),
        e: common_vendor.t(__props.item.district || "未知位置"),
        f: __props.item.create_time
      }, __props.item.create_time ? {
        g: common_vendor.t(formatDate(__props.item.create_time))
      } : {}, {
        h: common_vendor.o(($event) => handleUserList(__props.item.user_id)),
        i: !__props.avatarClickEnabled ? 1 : "",
        j: __props.item.user_id === common_vendor.unref(userStore).userInfo.uid
      }, __props.item.user_id === common_vendor.unref(userStore).userInfo.uid ? {
        k: common_vendor.p({
          color: "#999999",
          ["custom-prefix"]: "icon",
          type: "lishuai-shanchu",
          size: "18"
        }),
        l: common_vendor.o(($event) => handleDelete(__props.item._id))
      } : {
        m: common_vendor.p({
          color: "#5cb85c",
          ["custom-prefix"]: "icon",
          type: "lishuai-dianhua",
          size: "18"
        }),
        n: common_vendor.o(($event) => handleContact(__props.item.user_mobile))
      }, {
        o: common_vendor.t(__props.item.content),
        p: common_vendor.o(($event) => goToDetail(__props.item)),
        q: (_a = __props.item.images) == null ? void 0 : _a.length
      }, ((_b = __props.item.images) == null ? void 0 : _b.length) ? common_vendor.e({
        r: __props.item.images.length === 1
      }, __props.item.images.length === 1 ? {
        s: __props.item.images[0].compressedURL || __props.item.images[0].thumbnailURL || __props.item.images[0].url,
        t: common_vendor.o(($event) => goToDetail(__props.item)),
        v: common_vendor.o(() => handleLongPressPreview(__props.item.images[0].compressedURL || __props.item.images[0].thumbnailURL || __props.item.images[0].url, 0))
      } : common_vendor.e({
        w: __props.item.images.length > 9
      }, __props.item.images.length > 9 ? {
        x: common_vendor.f(__props.item.images.slice(0, 8), (img, index, i0) => {
          return {
            a: index,
            b: img.compressedURL || img.thumbnailURL || img.url,
            c: common_vendor.o(() => handleLongPressPreview(img.compressedURL || img.thumbnailURL || img.url, index))
          };
        }),
        y: common_vendor.o(($event) => goToDetail(__props.item)),
        z: __props.item.images[8].compressedURL || __props.item.images[8].thumbnailURL || __props.item.images[8].url,
        A: common_vendor.t(__props.item.images.length - 8),
        B: common_vendor.o(($event) => goToDetail(__props.item))
      } : {
        C: common_vendor.f(__props.item.images, (img, index, i0) => {
          return {
            a: index,
            b: img.compressedURL || img.thumbnailURL || img.url,
            c: common_vendor.o(() => handleLongPressPreview(img.compressedURL || img.thumbnailURL || img.url, index))
          };
        }),
        D: common_vendor.o(($event) => goToDetail(__props.item))
      }, {
        E: common_vendor.n(`grid-${Math.min(__props.item.images.length, 9)}`)
      })) : {}, {
        F: __props.item.videoURL || ((_c = __props.item.video) == null ? void 0 : _c.videoURL)
      }, __props.item.videoURL || ((_d = __props.item.video) == null ? void 0 : _d.videoURL) ? {
        G: common_vendor.p({
          ["custom-prefix"]: "icon",
          type: "lishuai-shipin",
          size: "14",
          color: "#999999"
        })
      } : {}, {
        H: common_vendor.t(formatDate(__props.item.create_time)),
        I: common_vendor.t(__props.item.look_count || 0)
      });
    };
  }
};
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-caed195d"]]);
tt.createComponent(Component);
//# sourceMappingURL=../../../.sourcemap/mp-toutiao/components/articleItem/articleItem.js.map
