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
  emits: ["delete", "contact", "comment", "like", "preview", "userList", "navigateToDetail"],
  setup(__props, { emit: __emit }) {
    const userStore = store_user.useUserInfoStore();
    const isKuaishou = common_vendor.ref(false);
    common_vendor.onMounted(() => {
      isKuaishou.value = true;
      console.log("运行在快手小程序环境");
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
        console.log("头像点击功能已禁用");
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
    const handleContact = (mobile, event) => {
      if (event) {
        event.stopPropagation();
      }
      emit("contact", mobile);
    };
    const isNavigating = common_vendor.ref(false);
    const goToDetail = (item, event) => {
      if (!props.showComments) {
        if (isNavigating.value)
          return;
        isNavigating.value = true;
        console.log("点击文章详情, articleId:", item._id);
        emit("navigateToDetail", item._id);
        setTimeout(() => {
          isNavigating.value = false;
        }, 500);
      }
    };
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
    const handlePreview = (url, index, event) => {
      if (event) {
        event.stopPropagation();
      }
      if (!url)
        return;
      console.log("Preview URL:", url);
      const validImages = props.item.images.filter((img) => img.thumbnailURL || img.compressedURL || img.url);
      if (validImages.length) {
        const maxPreviewImages = validImages.length > 9 ? 8 : 9;
        const limitedImages = validImages.slice(0, maxPreviewImages);
        let urls = limitedImages.map((img) => img.compressedURL || img.thumbnailURL || img.url);
        const previewIndex = Math.min(index, urls.length - 1);
        common_vendor.index.previewImage({
          urls,
          current: urls[previewIndex],
          indicator: "number",
          loop: true,
          success: () => {
            console.log("图片预览成功");
          },
          fail: (err) => {
            console.error("预览图片失败:", err);
            common_vendor.index.showToast({
              title: "预览图片失败",
              icon: "none"
            });
          }
        });
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
        n: common_vendor.o(($event) => handleContact(__props.item.user_mobile, $event))
      }, {
        o: common_vendor.t(__props.item.content),
        p: common_vendor.o(($event) => goToDetail(__props.item)),
        q: (_a = __props.item.images) == null ? void 0 : _a.length
      }, ((_b = __props.item.images) == null ? void 0 : _b.length) ? common_vendor.e({
        r: __props.item.images.length === 1
      }, __props.item.images.length === 1 ? {
        s: __props.item.images[0].compressedURL || __props.item.images[0].thumbnailURL || __props.item.images[0].url,
        t: common_vendor.o(($event) => handlePreview(__props.item.images[0].compressedURL || __props.item.images[0].thumbnailURL || __props.item.images[0].url, 0, $event))
      } : common_vendor.e({
        v: __props.item.images.length > 9
      }, __props.item.images.length > 9 ? {
        w: common_vendor.f(__props.item.images.slice(0, 8), (img, index, i0) => {
          return {
            a: index,
            b: img.compressedURL || img.thumbnailURL || img.url,
            c: common_vendor.o(($event) => handlePreview(img.compressedURL || img.thumbnailURL || img.url, index, $event))
          };
        }),
        x: __props.item.images[8].compressedURL || __props.item.images[8].thumbnailURL || __props.item.images[8].url,
        y: common_vendor.t(__props.item.images.length - 8),
        z: common_vendor.o(($event) => goToDetail(__props.item))
      } : {
        A: common_vendor.f(__props.item.images, (img, index, i0) => {
          return {
            a: index,
            b: img.compressedURL || img.thumbnailURL || img.url,
            c: common_vendor.o(($event) => handlePreview(img.compressedURL || img.thumbnailURL || img.url, index, $event))
          };
        })
      }, {
        B: common_vendor.n(`grid-${Math.min(__props.item.images.length, 9)}`)
      })) : {}, {
        C: __props.item.videoURL || ((_c = __props.item.video) == null ? void 0 : _c.videoURL)
      }, __props.item.videoURL || ((_d = __props.item.video) == null ? void 0 : _d.videoURL) ? {
        D: common_vendor.p({
          ["custom-prefix"]: "icon",
          type: "lishuai-shipin",
          size: "14",
          color: "#999999"
        })
      } : {}, {
        E: common_vendor.t(formatDate(__props.item.create_time)),
        F: common_vendor.t(__props.item.look_count || 0),
        G: common_vendor.gei(_ctx, "")
      });
    };
  }
};
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-caed195d"]]);
ks.createComponent(Component);
