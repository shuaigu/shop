"use strict";
const common_vendor = require("../../common/vendor.js");
const store_user = require("../../store/user.js");
const utils_formatTime = require("../../utils/formatTime.js");
if (!Array) {
  const _easycom_uni_icons2 = common_vendor.resolveComponent("uni-icons");
  _easycom_uni_icons2();
}
const _easycom_uni_icons = () => "../../uni_modules/uni-icons/components/uni-icons/uni-icons.js";
if (!Math) {
  _easycom_uni_icons();
}
const _sfc_main = {
  __name: "comment-list",
  props: {
    comments: {
      type: Array,
      default: () => []
    }
  },
  emits: ["delComment", "likeComment"],
  setup(__props, { emit: __emit }) {
    const userStore = store_user.useUserInfoStore();
    const props = __props;
    const emit = __emit;
    const canDelete = (comment) => {
      return comment.user_id === userStore.userInfo.uid;
    };
    const handleDeleteComment = (commentId) => {
      emit("delComment", commentId);
    };
    const handleLike = (commentId) => {
      const comment = props.comments.find((item) => item._id === commentId);
      if (!comment)
        return;
      if (comment._liking)
        return;
      comment._liking = true;
      comment.isLiked = !comment.isLiked;
      comment.likeCount = comment.isLiked ? (comment.likeCount || 0) + 1 : (comment.likeCount || 1) - 1;
      emit("likeComment", commentId).catch(() => {
        comment.isLiked = !comment.isLiked;
        comment.likeCount = comment.isLiked ? (comment.likeCount || 0) + 1 : (comment.likeCount || 1) - 1;
        common_vendor.index.showToast({
          title: "操作失败，请重试",
          icon: "none"
        });
      }).finally(() => {
        comment._liking = false;
      });
    };
    return (_ctx, _cache) => {
      return {
        a: common_vendor.t(__props.comments.length),
        b: common_vendor.f(__props.comments, (comment, k0, i0) => {
          return common_vendor.e({
            a: comment.avatarUrl,
            b: common_vendor.t(comment.nickName),
            c: "ea2f609f-0-" + i0,
            d: common_vendor.p({
              type: comment.isLiked ? "heart-filled" : "heart",
              color: comment.isLiked ? "#ff5d5d" : "#999",
              size: "18"
            }),
            e: common_vendor.t(comment.likeCount || ""),
            f: comment.isLiked ? 1 : "",
            g: common_vendor.o(($event) => handleLike(comment._id)),
            h: common_vendor.t(comment.content),
            i: common_vendor.t(common_vendor.unref(utils_formatTime.formatTime)(comment.create_time)),
            j: canDelete(comment)
          }, canDelete(comment) ? {
            k: "ea2f609f-1-" + i0,
            l: common_vendor.p({
              type: "trash",
              size: "16",
              color: "#999"
            }),
            m: common_vendor.o(($event) => handleDeleteComment(comment._id))
          } : {}, {
            n: comment._id
          });
        }),
        c: common_vendor.gei(_ctx, "")
      };
    };
  }
};
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-ea2f609f"]]);
ks.createComponent(Component);
