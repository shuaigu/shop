"use strict";
const common_vendor = require("../../common/vendor.js");
const store_user = require("../../store/user.js");
const _sfc_main = {
  __name: "userProfile",
  setup(__props) {
    const userStore = store_user.useUserInfoStore();
    const userApi = common_vendor.nr.importObject("userDy");
    const loginCode = common_vendor.ref("");
    const userProfile = common_vendor.ref({
      nickName: "",
      avatarUrl: "/static/images/defalut.png",
      mobile: ""
    });
    common_vendor.ref(false);
    const submitting = common_vendor.ref(false);
    const validationErrors = common_vendor.ref({
      nickname: ""
    });
    const isFormValid = common_vendor.computed(() => {
      return userProfile.value.nickName.trim() !== "" && userProfile.value.avatarUrl !== "/static/images/defalut.png" && !validationErrors.value.nickname;
    });
    function validateNickname(value) {
      if (!value.trim()) {
        validationErrors.value.nickname = "昵称不能为空";
        return false;
      }
      if (value.length > 20) {
        validationErrors.value.nickname = "昵称不能超过20个字符";
        return false;
      }
      validationErrors.value.nickname = "";
      return true;
    }
    const onNicknameInput = (e) => {
      const value = e.detail.value;
      userProfile.value.nickName = value;
      validateNickname(value);
    };
    const chooseAvatar = () => {
      common_vendor.index.chooseImage({
        count: 1,
        sizeType: ["compressed"],
        sourceType: ["album", "camera"],
        success: (res) => {
          const tempFilePath = res.tempFilePaths[0];
          userProfile.value.avatarUrl = tempFilePath;
        }
      });
    };
    const getPhoneNumber = async (e) => {
      var _a;
      try {
        if (e.detail.errMsg !== "getPhoneNumber:ok") {
          common_vendor.index.showToast({
            title: "未授权手机号",
            icon: "none",
            duration: 2e3
          });
          return;
        }
        const params = {
          code: loginCode.value,
          encryptedData: e.detail.encryptedData,
          iv: e.detail.iv
        };
        common_vendor.index.showLoading({
          title: "获取中...",
          mask: true
        });
        const res = await userApi.getPhoneNumberDy(params);
        common_vendor.index.hideLoading();
        if (res.code === 0 && ((_a = res.data) == null ? void 0 : _a.phoneNumber)) {
          userProfile.value.mobile = res.data.phoneNumber;
          common_vendor.index.showToast({
            title: "获取成功",
            icon: "success",
            duration: 2e3
          });
        } else {
          throw new Error(res.message || "获取手机号失败");
        }
      } catch (err) {
        common_vendor.index.__f__("error", "at pages/userProfile/userProfile.vue:112", "获取手机号失败:", err);
        common_vendor.index.showToast({
          title: err.message || "获取手机号失败",
          icon: "none",
          duration: 2e3
        });
      }
    };
    const submitUserInfo = async () => {
      if (!isFormValid.value) {
        common_vendor.index.showToast({
          title: "请填写完整信息",
          icon: "none",
          duration: 2e3
        });
        return;
      }
      submitting.value = true;
      try {
        common_vendor.index.showLoading({
          title: "保存中...",
          mask: true
        });
        const loginRes = await common_vendor.index.login();
        if (!loginRes.code) {
          throw new Error("获取登录凭证失败");
        }
        let cloudFunctionName = "user";
        let actionName = "registerUser";
        cloudFunctionName = "userDy";
        actionName = "registerUserDy";
        const { result } = await common_vendor.index.cloud.callFunction({
          name: cloudFunctionName,
          data: {
            action: actionName,
            params: {
              code: loginRes.code,
              nickName: userProfile.value.nickName,
              avatarUrl: userProfile.value.avatarUrl,
              mobile: userProfile.value.mobile
            }
          }
        });
        if (result.code === 0) {
          userStore.setUserInfo({
            uid: result.data._id || result.data.uid || "",
            nickName: result.data.nickName || "",
            avatarUrl: result.data.avatarUrl || "/static/images/defalut.png",
            mobile: result.data.mobile || "",
            isLogin: true,
            role: Array.isArray(result.data.role) ? result.data.role : ["user"]
          });
          common_vendor.index.showToast({
            title: "保存成功",
            icon: "success",
            duration: 2e3,
            success: () => {
              setTimeout(() => {
                common_vendor.index.navigateBack();
              }, 2e3);
            }
          });
        } else {
          throw new Error(result.message || "保存失败");
        }
      } catch (err) {
        common_vendor.index.__f__("error", "at pages/userProfile/userProfile.vue:195", "提交用户信息错误:", err);
        common_vendor.index.showToast({
          title: "保存失败，请重试",
          icon: "none",
          duration: 2e3
        });
      } finally {
        submitting.value = false;
        common_vendor.index.hideLoading();
      }
    };
    const goBack = () => {
      common_vendor.index.navigateBack();
    };
    common_vendor.onMounted(() => {
      var _a;
      const pages = getCurrentPages();
      const currentPage = pages[pages.length - 1];
      if (currentPage && currentPage.options && currentPage.options.code) {
        loginCode.value = currentPage.options.code;
      } else {
        const query = ((_a = common_vendor.index.$route) == null ? void 0 : _a.query) || common_vendor.index.getLaunchOptionsSync().query || {};
        if (query.code) {
          loginCode.value = query.code;
        }
      }
    });
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.o(goBack),
        b: userProfile.value.avatarUrl,
        c: common_vendor.o(chooseAvatar),
        d: common_vendor.o([($event) => userProfile.value.nickName = $event.detail.value, onNicknameInput]),
        e: userProfile.value.nickName,
        f: validationErrors.value.nickname
      }, validationErrors.value.nickname ? {
        g: common_vendor.t(validationErrors.value.nickname)
      } : {}, {
        h: userProfile.value.mobile
      }, userProfile.value.mobile ? {
        i: common_vendor.t(userProfile.value.mobile)
      } : {}, {
        j: common_vendor.o(getPhoneNumber),
        k: !isFormValid.value || submitting.value,
        l: submitting.value,
        m: common_vendor.o(submitUserInfo),
        n: common_vendor.o(submitUserInfo)
      });
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-badd6e76"]]);
tt.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-toutiao/pages/userProfile/userProfile.js.map
