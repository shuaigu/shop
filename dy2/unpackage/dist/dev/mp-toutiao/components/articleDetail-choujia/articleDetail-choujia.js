"use strict";
const common_vendor = require("../../common/vendor.js");
const INITIAL_SPEED = 200;
const MAX_SPEED = 50;
const FINAL_SPEED = 300;
const _sfc_main = {
  __name: "articleDetail-choujia",
  props: {
    commenters: {
      type: Array,
      default: () => []
    }
  },
  emits: ["lottery-result"],
  setup(__props, { emit: __emit }) {
    const props = __props;
    const emit = __emit;
    const prizes = common_vendor.reactive([]);
    const sequence = common_vendor.ref([]);
    const currentIndex = common_vendor.ref(-1);
    const result = common_vendor.ref("");
    const showResult = common_vendor.ref(false);
    const isRotating = common_vendor.ref(false);
    const luckyUsers = common_vendor.ref([]);
    const commenterCount = common_vendor.computed(() => Math.min(props.commenters.length, 25));
    const currentTime = common_vendor.ref("");
    common_vendor.watch(() => props.commenters, (newVal) => {
      if (newVal && newVal.length > 0) {
        result.value = "";
        showResult.value = false;
        luckyUsers.value = [];
      }
    }, { deep: true });
    let timer = null;
    let times = 0;
    let currentSpeed = INITIAL_SPEED;
    common_vendor.onMounted(async () => {
      try {
        const sortedCommenters = [...props.commenters].sort((a, b) => {
          if (a.create_time && b.create_time) {
            return b.create_time - a.create_time;
          }
          return 0;
        });
        const availableCommenters = sortedCommenters.slice(0, 25);
        const prizeList = availableCommenters.map((commenter) => ({
          avatar: commenter.avatarUrl || "/static/images/default-avatar.png",
          name: (commenter.nickName || "匿名用户").slice(0, 5)
        }));
        Object.assign(prizes, prizeList);
        sequence.value = Array.from({ length: prizeList.length }, (_, i) => i);
      } catch (error) {
        common_vendor.index.__f__("error", "at components/articleDetail-choujia/articleDetail-choujia.vue:154", "初始化用户展示失败:", error);
        common_vendor.index.showToast({
          title: "初始化失败，请重试",
          icon: "none"
        });
      }
      return () => {
        if (timer) {
          clearTimeout(timer);
          timer = null;
        }
      };
    });
    const startLottery = async () => {
      if (isRotating.value) {
        return;
      }
      if (props.commenters.length === 0) {
        common_vendor.index.showToast({
          title: "暂无评论者参与",
          icon: "none"
        });
        return;
      }
      isRotating.value = true;
      result.value = "";
      luckyUsers.value = [];
      try {
        const participantCount = Math.min(props.commenters.length, 25);
        const choujiangWx = common_vendor.nr.importObject("choujiangWx");
        const lotteryResult = await choujiangWx.doLottery({
          userId: common_vendor.index.getStorageSync("userId") || "",
          // 记录抽奖操作者
          commentCount: participantCount
        });
        if (!lotteryResult.success) {
          throw new Error("抽奖失败");
        }
        const { selectedIndex, targetPosition } = lotteryResult;
        currentSpeed = INITIAL_SPEED;
        times = 0;
        const totalRounds = 4;
        const targetTimes = totalRounds * sequence.value.length + targetPosition + 1;
        runLottery(targetPosition, targetTimes, lotteryResult.prize);
      } catch (error) {
        common_vendor.index.__f__("error", "at components/articleDetail-choujia/articleDetail-choujia.vue:222", "抽奖执行失败:", error);
        common_vendor.index.showToast({
          title: "抽奖失败，请重试",
          icon: "none"
        });
        isRotating.value = false;
      }
    };
    const runLottery = (targetPosition, targetTimes, finalPrize) => {
      timer = setTimeout(() => {
        let index = times % sequence.value.length;
        currentIndex.value = index;
        times++;
        const accelerationPhase = Math.floor(targetTimes * 0.3);
        const decelerationPhase = Math.floor(targetTimes * 0.7);
        if (times < accelerationPhase) {
          currentSpeed = INITIAL_SPEED - Math.floor((INITIAL_SPEED - MAX_SPEED) * (times / accelerationPhase));
        } else if (times > decelerationPhase) {
          const slowDownProgress = (times - decelerationPhase) / (targetTimes - decelerationPhase);
          currentSpeed = MAX_SPEED + Math.floor((FINAL_SPEED - MAX_SPEED) * slowDownProgress);
        } else {
          currentSpeed = MAX_SPEED;
        }
        if (times >= targetTimes) {
          clearTimeout(timer);
          isRotating.value = false;
          result.value = finalPrize.name;
          currentIndex.value = targetPosition;
          const now = /* @__PURE__ */ new Date();
          const year = now.getFullYear();
          const month = (now.getMonth() + 1).toString().padStart(2, "0");
          const day = now.getDate().toString().padStart(2, "0");
          const hours = now.getHours().toString().padStart(2, "0");
          const minutes = now.getMinutes().toString().padStart(2, "0");
          currentTime.value = `${year}年${month}月${day}日 ${hours}:${minutes}`;
          setTimeout(() => {
            selectLuckyUsers(result.value, targetPosition);
            showResult.value = true;
            emit("lottery-result", result.value);
          }, 2e3);
        } else {
          runLottery(targetPosition, targetTimes, finalPrize);
        }
      }, currentSpeed);
    };
    const selectLuckyUsers = (prizeResult, targetPosition) => {
      if (!props.commenters || props.commenters.length === 0) {
        return;
      }
      const sortedCommenters = [...props.commenters].sort((a, b) => {
        if (a.create_time && b.create_time) {
          return b.create_time - a.create_time;
        }
        return 0;
      });
      const limitedCommenters = sortedCommenters.slice(0, 25);
      const selectedUser = limitedCommenters[targetPosition];
      if (selectedUser) {
        luckyUsers.value = [selectedUser];
      }
      if (!prizeResult.includes("谢谢参与")) {
        common_vendor.index.showToast({
          title: "恭喜你抽中奖品！",
          icon: "success",
          duration: 2e3
        });
      }
    };
    const closeResult = () => {
      showResult.value = false;
    };
    const formatTime = (timestamp) => {
      if (!timestamp)
        return "";
      const now = Date.now();
      const diff = now - timestamp;
      if (diff < 6e4) {
        return "刚刚";
      }
      if (diff < 36e5) {
        return Math.floor(diff / 6e4) + "分钟前";
      }
      if (diff < 864e5) {
        return Math.floor(diff / 36e5) + "小时前";
      }
      if (diff < 2592e6) {
        return Math.floor(diff / 864e5) + "天前";
      }
      const date = new Date(timestamp);
      const month = date.getMonth() + 1;
      const day = date.getDate();
      return `${month}月${day}日`;
    };
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.t(commenterCount.value),
        b: common_vendor.f(prizes, (prize, index, i0) => {
          return {
            a: prize.avatar,
            b: common_vendor.t(prize.name),
            c: index,
            d: common_vendor.n({
              "active": currentIndex.value === index
            }),
            e: isRotating.value ? `${index * 0.1}s` : "0s"
          };
        }),
        c: common_vendor.t(isRotating.value ? "抽奖中..." : "开始抽奖"),
        d: common_vendor.o(startLottery),
        e: showResult.value
      }, showResult.value ? common_vendor.e({
        f: luckyUsers.value.length > 0
      }, luckyUsers.value.length > 0 ? {
        g: common_vendor.t(currentTime.value),
        h: common_vendor.f(luckyUsers.value, (user, index, i0) => {
          return common_vendor.e({
            a: user.avatarUrl,
            b: common_vendor.t(user.nickName),
            c: user.create_time
          }, user.create_time ? {
            d: common_vendor.t(formatTime(user.create_time))
          } : {}, {
            e: common_vendor.t(user.content),
            f: index
          });
        })
      } : {}, {
        i: common_vendor.o(closeResult)
      }) : {});
    };
  }
};
tt.createComponent(_sfc_main);
//# sourceMappingURL=../../../.sourcemap/mp-toutiao/components/articleDetail-choujia/articleDetail-choujia.js.map
