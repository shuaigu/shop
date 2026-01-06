"use strict";
const common_vendor = require("../common/vendor.js");
const useUserInfoStore = common_vendor.defineStore("userInfo", () => {
  const defaultUserInfo = {
    uid: "",
    //本地平台ID
    nickName: "",
    //昵称
    avatarUrl: "/static/images/defalut.png",
    //头像地址
    mobile: "未填写",
    //手机号码
    isLogin: false,
    //登录状态
    role: []
    //默认角色
  };
  const userInfo = common_vendor.ref(
    common_vendor.index.getStorageSync("userInfo") || { ...defaultUserInfo }
  );
  const setUserInfo = (obj = {}) => {
    const serializableObj = {};
    for (const key in obj) {
      if (obj[key] !== void 0 && (typeof obj[key] === "string" || typeof obj[key] === "number" || typeof obj[key] === "boolean" || Array.isArray(obj[key]))) {
        serializableObj[key] = obj[key];
      }
    }
    if (serializableObj.role && !Array.isArray(serializableObj.role)) {
      serializableObj.role = [];
    }
    userInfo.value = {
      ...defaultUserInfo,
      // 保持默认值
      ...serializableObj
      // 覆盖新数据
    };
    try {
      JSON.stringify(userInfo.value);
      common_vendor.index.setStorageSync("userInfo", userInfo.value);
    } catch (error) {
      console.error("存储用户信息失败，数据无法序列化:", error);
      const basicInfo = {
        ...defaultUserInfo,
        uid: serializableObj.uid || "",
        nickName: serializableObj.nickName || "",
        avatarUrl: serializableObj.avatarUrl || defaultUserInfo.avatarUrl,
        mobile: serializableObj.mobile || defaultUserInfo.mobile,
        isLogin: !!serializableObj.uid,
        role: Array.isArray(serializableObj.role) ? serializableObj.role : []
      };
      userInfo.value = basicInfo;
      common_vendor.index.setStorageSync("userInfo", basicInfo);
    }
  };
  const cleanUserInfo = () => {
    userInfo.value = { ...defaultUserInfo };
    likeRecords.value = [];
    common_vendor.index.removeStorageSync("userInfo");
  };
  const likeRecords = common_vendor.ref([]);
  const setLikeRecords = (records) => {
    likeRecords.value = records;
  };
  const isLiked = (article_id) => {
    return likeRecords.value.some((record) => record.article_id === article_id);
  };
  return {
    userInfo,
    setUserInfo,
    cleanUserInfo,
    likeRecords,
    setLikeRecords,
    isLiked
  };
}, {
  persist: {
    // 使用 uni storage 代替 localStorage
    storage: {
      getItem(key) {
        return common_vendor.index.getStorageSync(key);
      },
      setItem(key, value) {
        try {
          if (typeof value === "object") {
            JSON.stringify(value);
          }
          common_vendor.index.setStorageSync(key, value);
        } catch (e) {
          console.error("存储数据失败:", e);
        }
      }
    },
    paths: ["userInfo", "likeRecords"]
    // 指定需要持久化的状态
  }
});
exports.useUserInfoStore = useUserInfoStore;
