"use strict";
const common_vendor = require("../../common/vendor.js");
const store_user = require("../../store/user.js");
if (!Array) {
  const _easycom_uni_dateformat2 = common_vendor.resolveComponent("uni-dateformat");
  _easycom_uni_dateformat2();
}
const _easycom_uni_dateformat = () => "../../uni_modules/uni-dateformat/components/uni-dateformat/uni-dateformat.js";
if (!Math) {
  _easycom_uni_dateformat();
}
const _sfc_main = {
  __name: "articleItem",
  props: {
    item: {
      type: Object,
      require: true,
      default: () => ({
        user_nickName: "未知用户",
        user_avatarUrl: "/static/images/default-avatar.png",
        user_mobile: "未填写",
        images: [],
        look_count: 0
        // 添加浏览量默认值
      })
    },
    // 是否显示评论区
    showComments: {
      type: Boolean,
      default: false
    }
  },
  emits: ["delete", "contact", "comment", "like", "userList", "update:comments", "navigateToDetail"],
  setup(__props, { emit: __emit }) {
    const userStore = store_user.useUserInfoStore();
    const props = __props;
    const emit = __emit;
    const handleUserList = (userId) => emit("userList", userId);
    const handleDelete = (id) => emit("delete", id);
    const handleContact = (mobile) => emit("contact", mobile);
    const goToDetail = (item) => {
      if (!props.showComments) {
        common_vendor.index.navigateTo({
          url: `/pages/article/articleDetail?article_id=${item._id}&user_id=${item.user_id}`
        });
      }
    };
    const userInfo = common_vendor.computed(() => {
      if (!props.item) {
        return {
          user_nickName: "未知用户",
          user_avatarUrl: "/static/images/default-avatar.png",
          user_mobile: "未填写"
        };
      }
      const info = {
        user_nickName: props.item.user_nickName || "未知用户",
        user_avatarUrl: props.item.user_avatarUrl || "/static/images/default-avatar.png",
        user_mobile: props.item.user_mobile || "未填写"
      };
      return info;
    });
    const onAvatarError = (e) => {
      e.target.src = "/static/images/default-avatar.png";
    };
    common_vendor.ref(false);
    const processedImages = common_vendor.computed(() => {
      var _a;
      if (!((_a = props.item) == null ? void 0 : _a.images))
        return [];
      const allImages = props.item.images.map((img) => {
        if (!img)
          return null;
        if (typeof img === "object") {
          return {
            // 缩略图优先使用 thumbnailURL
            thumbnail: img.thumbnailURL || img.url || "",
            // 原图优先使用 compressedURL，其次是 url，最后是 thumbnailURL
            original: img.compressedURL || img.url || img.thumbnailURL || ""
          };
        }
        return {
          thumbnail: img,
          original: img
        };
      }).filter(Boolean);
      return allImages.slice(0, 9);
    });
    const extraImagesCount = common_vendor.computed(() => {
      var _a;
      if (!((_a = props.item) == null ? void 0 : _a.images))
        return 0;
      const totalImages = props.item.images.filter((img) => img).length;
      return totalImages > 9 ? totalImages - 9 : 0;
    });
    const onImageError = (index) => {
      var _a;
      if ((_a = props.item.images) == null ? void 0 : _a[index]) {
        if (typeof props.item.images[index] === "object") {
          props.item.images[index].thumbnailURL = "/static/images/image-error.png";
        } else {
          props.item.images[index] = "/static/images/image-error.png";
        }
      }
    };
    const handleArticleClick = () => {
      emit("navigateToDetail", props.item._id);
    };
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: userInfo.value.user_avatarUrl,
        b: common_vendor.o(onAvatarError),
        c: common_vendor.t(userInfo.value.user_nickName),
        d: common_vendor.t(__props.item.district || "未知位置"),
        e: common_vendor.o(($event) => handleUserList(__props.item.user_id)),
        f: __props.item.user_id === common_vendor.unref(userStore).userInfo.uid
      }, __props.item.user_id === common_vendor.unref(userStore).userInfo.uid ? {
        g: common_vendor.o(($event) => handleDelete(__props.item._id))
      } : {
        h: common_vendor.o(($event) => handleContact(__props.item.user_mobile))
      }, {
        i: common_vendor.t(__props.item.content),
        j: common_vendor.o(handleArticleClick),
        k: processedImages.value.length
      }, processedImages.value.length ? common_vendor.e({
        l: processedImages.value.length === 1
      }, processedImages.value.length === 1 ? {
        m: processedImages.value[0].thumbnail,
        n: common_vendor.o(() => onImageError(0)),
        o: common_vendor.o(($event) => goToDetail(__props.item))
      } : {
        p: common_vendor.f(processedImages.value, (img, index, i0) => {
          return common_vendor.e({
            a: img.thumbnail,
            b: common_vendor.o(() => onImageError(index)),
            c: index === 8 && extraImagesCount.value > 0
          }, index === 8 && extraImagesCount.value > 0 ? {
            d: common_vendor.t(extraImagesCount.value)
          } : {}, {
            e: index,
            f: index === 8 && extraImagesCount.value > 0 ? 1 : ""
          });
        }),
        q: common_vendor.o(($event) => goToDetail(__props.item)),
        r: common_vendor.n(`grid-${processedImages.value.length}`)
      }) : {}, {
        s: common_vendor.p({
          date: Number(__props.item.create_time),
          threshold: [0],
          before: "",
          pattern: {
            year: "年前",
            month: "个月前",
            day: "天前",
            hour: "小时前",
            minute: "分钟前",
            second: "刚刚"
          }
        }),
        t: common_vendor.t(__props.item.look_count || 0),
        v: common_vendor.gei(_ctx, "")
      });
    };
  }
};
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-caed195d"]]);
ks.createComponent(Component);
