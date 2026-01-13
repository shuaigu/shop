"use strict";
const common_vendor = require("../../common/vendor.js");
const store_user = require("../../store/user.js");
const _sfc_main = {
  data() {
    store_user.useUserInfoStore();
    return {
      // 标签页
      tabs: [
        { label: "全部", value: "all" },
        { label: "未完成", value: "pending" },
        { label: "已完成", value: "completed" }
      ],
      activeTab: "all",
      // 分类和优先级
      categories: ["工作", "生活", "学习", "其他"],
      priorities: ["低", "中", "高"],
      // 备忘录列表
      memos: [],
      // 默认备忘录列表
      defaultMemos: [],
      // 收藏状态映射（memo_id -> boolean）
      collectedMap: {},
      // 分享用户信息
      shareUserId: "",
      shareUserNickname: "",
      // 弹窗控制
      showAddDialog: false,
      isEdit: false,
      // 输入框焦点控制
      contentFocus: false,
      // 表单数据
      formData: {
        id: "",
        content: "",
        category: "其他",
        priority: "中",
        is_completed: false,
        create_time: 0
      }
    };
  },
  computed: {
    // 筛选后的备忘录列表
    filteredMemos() {
      if (this.activeTab === "all") {
        return this.memos;
      } else if (this.activeTab === "pending") {
        return this.memos.filter((m) => !m.is_completed);
      } else {
        return this.memos.filter((m) => m.is_completed);
      }
    },
    // 空状态提示文本
    emptyText() {
      if (this.activeTab === "all") {
        return "暂无备忘录，点击下方按钮添加";
      } else if (this.activeTab === "pending") {
        return "暂无未完成的备忘录";
      } else {
        return "暂无已完成的备忘录";
      }
    }
  },
  onLoad(options) {
    console.log("=== 页面加载 onLoad ===");
    if (options && options.shareUserId) {
      this.shareUserId = options.shareUserId;
      this.shareUserNickname = options.shareUserNickname || "";
      console.log("获取到分享用户:", this.shareUserId, this.shareUserNickname);
      try {
        common_vendor.index.setStorageSync("memo_share_user", {
          id: this.shareUserId,
          nickname: this.shareUserNickname
        });
      } catch (e) {
        console.error("保存分享用户信息失败:", e);
      }
    } else {
      try {
        const shareUserInfo = common_vendor.index.getStorageSync("memo_share_user");
        if (shareUserInfo) {
          this.shareUserId = shareUserInfo.id || "";
          this.shareUserNickname = shareUserInfo.nickname || "";
          console.log("从本地获取分享用户:", this.shareUserId, this.shareUserNickname);
        }
      } catch (e) {
        console.error("获取本地分享用户信息失败:", e);
      }
    }
    this.loadMemos();
    this.loadDefaultMemos();
  },
  methods: {
    // 加载默认备忘录
    async loadDefaultMemos() {
      console.log("=== 开始加载默认备忘录 ===");
      try {
        const memoApi = common_vendor.tr.importObject("memoList", { customUI: true });
        const res = await memoApi.getDefaultMemos();
        if (res && res.code === 0) {
          this.defaultMemos = res.data || [];
          console.log("加载默认备忘录成功:", this.defaultMemos.length, "条");
          await this.loadCollectionStatus();
        } else {
          console.log("加载默认备忘录失败:", res == null ? void 0 : res.message);
          this.defaultMemos = [];
        }
      } catch (e) {
        console.error("加载默认备忘录失败:", e);
        this.defaultMemos = [];
      }
    },
    // 加载收藏状态
    async loadCollectionStatus() {
      console.log("=== 加载收藏状态 ===");
      try {
        const userStore = store_user.useUserInfoStore();
        const userId = userStore.userInfo.uid;
        if (!userId) {
          console.log("用户未登录，跳过加载收藏状态");
          return;
        }
        const memoApi = common_vendor.tr.importObject("memoList", { customUI: true });
        for (const memo of this.defaultMemos) {
          try {
            const res = await memoApi.checkCollected(memo._id, userId);
            if (res && res.code === 0) {
              this.collectedMap[memo._id] = res.data.collected;
            }
          } catch (e) {
            console.error("检查收藏状态失败:", e);
          }
        }
        console.log("收藏状态加载完成:", this.collectedMap);
      } catch (e) {
        console.error("加载收藏状态失败:", e);
      }
    },
    // 收藏备忘录
    async collectMemo(memo) {
      console.log("=== 收藏备忘录 ===");
      console.log("memo 对象:", JSON.stringify(memo));
      console.log("memo._id:", memo._id);
      console.log("当前收藏状态:", this.collectedMap[memo._id]);
      if (!memo || !memo._id) {
        console.error("备忘录对象无效，缺少_id");
        common_vendor.index.showToast({
          title: "备忘录信息错误",
          icon: "none",
          duration: 2e3
        });
        return;
      }
      const userStore = store_user.useUserInfoStore();
      const isLogin = userStore.userInfo.isLogin;
      const userId = userStore.userInfo.uid;
      if (!isLogin || !userId) {
        console.log("用户未登录，唤起登录");
        common_vendor.index.showModal({
          title: "提示",
          content: "收藏功能需要登录，是否前往登录？",
          success: (res) => {
            if (res.confirm) {
              const currentPath = "/pages/memo/memo";
              common_vendor.index.redirectTo({
                url: "/pages/login/login?redirect=" + encodeURIComponent(currentPath),
                fail: (err) => {
                  console.error("跳转登录页失败:", err);
                  common_vendor.index.reLaunch({
                    url: "/pages/login/login?redirect=" + encodeURIComponent(currentPath)
                  });
                }
              });
            }
          }
        });
        return;
      }
      try {
        const memoApi = common_vendor.tr.importObject("memoList", { customUI: true });
        if (this.collectedMap[memo._id]) {
          console.log("执行取消收藏操作...");
          const res = await memoApi.uncollectMemo(memo._id, userId);
          console.log("取消收藏结果:", res);
          if (res && res.code === 0) {
            this.collectedMap[memo._id] = false;
            this.$forceUpdate();
            common_vendor.index.showToast({
              title: "已取消收藏",
              icon: "success",
              duration: 1500
            });
          } else {
            common_vendor.index.showToast({
              title: (res == null ? void 0 : res.message) || "取消收藏失败",
              icon: "none"
            });
          }
        } else {
          console.log("执行收藏操作...");
          console.log("收藏参数:", {
            memo_id: memo._id,
            user_id: userId,
            share_user_id: this.shareUserId,
            share_user_nickname: this.shareUserNickname
          });
          const res = await memoApi.collectMemo({
            memo_id: memo._id,
            user_id: userId,
            share_user_id: this.shareUserId,
            share_user_nickname: this.shareUserNickname
          });
          console.log("收藏结果:", res);
          if (res && res.code === 0) {
            this.collectedMap[memo._id] = true;
            this.$forceUpdate();
            common_vendor.index.showToast({
              title: "收藏成功",
              icon: "success",
              duration: 1500
            });
          } else {
            common_vendor.index.showToast({
              title: (res == null ? void 0 : res.message) || "收藏失败",
              icon: "none",
              duration: 2e3
            });
          }
        }
      } catch (e) {
        console.error("收藏操作失败:", e);
        console.error("错误堆栈:", e.stack);
        const errorMsg = e.message || e.errMsg || "操作失败，请重试";
        common_vendor.index.showToast({
          title: errorMsg,
          icon: "none",
          duration: 2e3
        });
      }
    },
    // 加载备忘录
    loadMemos() {
      console.log("=== 开始加载备忘录 ===");
      try {
        const data = common_vendor.index.getStorageSync("memo_list");
        console.log("从存储读取的数据:", data);
        if (data) {
          this.memos = JSON.parse(data);
          console.log("解析后的备忘录列表:", this.memos.length, "条");
        } else {
          console.log("存储中没有数据");
        }
      } catch (e) {
        console.error("加载备忘录失败:", e);
        this.memos = [];
      }
    },
    // 保存到本地存储
    saveMemos() {
      console.log("=== 开始保存备忘录 ===");
      console.log("准备保存的备忘录数量:", this.memos.length);
      try {
        common_vendor.index.setStorageSync("memo_list", JSON.stringify(this.memos));
        console.log("保存成功");
      } catch (e) {
        console.error("保存备忘录失败:", e);
        common_vendor.index.showToast({
          title: "保存失败",
          icon: "none"
        });
      }
    },
    // 切换标签页
    switchTab(value) {
      console.log("=== 切换标签页 ===", value);
      this.activeTab = value;
    },
    // 打开添加对话框
    openAddDialog() {
      console.log("=== 打开添加对话框 ===");
      console.log("当前 showAddDialog:", this.showAddDialog);
      console.log("当前 formData:", JSON.stringify(this.formData));
      this.showAddDialog = true;
      console.log("设置 showAddDialog = true");
      setTimeout(() => {
        console.log("延迟后设置 contentFocus = true");
        this.contentFocus = true;
      }, 500);
    },
    // 切换完成状态
    toggleComplete(id) {
      console.log("=== 切换完成状态 ===", id);
      try {
        const memo = this.memos.find((m) => m.id === id);
        if (memo) {
          console.log("找到备忘录, 当前状态:", memo.is_completed);
          memo.is_completed = !memo.is_completed;
          console.log("切换后状态:", memo.is_completed);
          this.saveMemos();
          common_vendor.index.showToast({
            title: memo.is_completed ? "已标记完成" : "已标记未完成",
            icon: "success",
            duration: 1500
          });
        } else {
          console.log("未找到备忘录");
        }
      } catch (e) {
        console.error("切换状态失败:", e);
      }
    },
    // 编辑备忘录
    editMemo(memo) {
      console.log("=== 编辑备忘录 ===");
      console.log("备忘录数据:", JSON.stringify(memo));
      this.isEdit = true;
      this.formData = { ...memo };
      console.log("设置 isEdit = true, formData =", JSON.stringify(this.formData));
      this.showAddDialog = true;
      setTimeout(() => {
        console.log("延迟后设置 contentFocus = true (编辑模式)");
        this.contentFocus = true;
      }, 500);
    },
    // 删除备忘录
    deleteMemo(id) {
      console.log("=== 删除备忘录 ===", id);
      common_vendor.index.showModal({
        title: "确认删除",
        content: "确定要删除这条备忘录吗？",
        success: (res) => {
          if (res.confirm) {
            console.log("用户确认删除");
            const beforeCount = this.memos.length;
            this.memos = this.memos.filter((m) => m.id !== id);
            console.log("删除前数量:", beforeCount, "删除后数量:", this.memos.length);
            this.saveMemos();
            common_vendor.index.showToast({
              title: "删除成功",
              icon: "success",
              duration: 1500
            });
          } else {
            console.log("用户取消删除");
          }
        }
      });
    },
    // 保存备忘录
    saveMemo() {
      console.log("=== 保存备忘录 ===");
      console.log("isEdit:", this.isEdit);
      console.log("formData:", JSON.stringify(this.formData));
      if (!this.formData.content.trim()) {
        console.log("验证失败: 内容为空");
        common_vendor.index.showToast({
          title: "请输入内容",
          icon: "none"
        });
        return;
      }
      console.log("验证通过");
      if (this.isEdit) {
        console.log("编辑模式 - 查找备忘录 id:", this.formData.id);
        const index = this.memos.findIndex((m) => m.id === this.formData.id);
        console.log("找到索引:", index);
        if (index !== -1) {
          this.memos[index] = { ...this.formData };
          console.log("更新备忘录成功");
        }
      } else {
        console.log("新增模式");
        const newMemo = {
          ...this.formData,
          id: Date.now().toString(),
          create_time: Date.now(),
          is_completed: false
        };
        console.log("新建备忘录:", JSON.stringify(newMemo));
        this.memos.unshift(newMemo);
        console.log("添加到列表成功, 当前总数:", this.memos.length);
      }
      this.saveMemos();
      this.closeDialog();
      common_vendor.index.showToast({
        title: this.isEdit ? "修改成功" : "添加成功",
        icon: "success",
        duration: 1500
      });
    },
    // 关闭弹窗
    closeDialog() {
      console.log("=== 关闭弹窗 ===");
      console.log("当前 showAddDialog:", this.showAddDialog);
      this.showAddDialog = false;
      this.isEdit = false;
      this.contentFocus = false;
      console.log("重置焦点状态");
      this.formData = {
        id: "",
        content: "",
        category: "其他",
        priority: "中",
        is_completed: false,
        create_time: 0
      };
      console.log("表单已重置");
    },
    // 处理遮罩层点击
    handleMaskClick() {
      console.log("=== 点击遮罩层 ===");
    },
    // 选择分类
    selectCategory(cat) {
      console.log("=== 选择分类 ===", cat);
      this.formData.category = cat;
    },
    // 选择优先级
    selectPriority(pri) {
      console.log("=== 选择优先级 ===", pri);
      this.formData.priority = pri;
    },
    // 内容输入事件
    handleContentInput(e) {
      console.log("=== 内容输入 ===", "长度:", e.detail.value.length);
      console.log("输入内容:", e.detail.value);
      this.formData.content = e.detail.value;
      this.$forceUpdate();
    },
    // 内容获取焦点
    handleContentFocus(e) {
      console.log("=== 内容获取焦点 ===");
      this.contentFocus = true;
    },
    // 内容失去焦点
    handleContentBlur(e) {
      console.log("=== 内容失去焦点 ===");
      this.contentFocus = false;
    },
    // 内容确认
    handleContentConfirm(e) {
      console.log("=== 内容确认 ===");
      this.formData.content = e.detail.value;
    },
    // 获取第一行内容作为标题
    getFirstLine(content) {
      if (!content)
        return "无标题";
      const firstLine = content.split("\n")[0];
      return firstLine.length > 20 ? firstLine.substring(0, 20) + "..." : firstLine;
    },
    // 格式化时间
    formatTime(timestamp) {
      if (!timestamp)
        return "";
      const date = new Date(timestamp);
      const now = /* @__PURE__ */ new Date();
      const diff = now - date;
      if (diff < 6e4) {
        return "刚刚";
      } else if (diff < 36e5) {
        return Math.floor(diff / 6e4) + "分钟前";
      } else if (diff < 864e5) {
        return Math.floor(diff / 36e5) + "小时前";
      } else if (diff < 1728e5) {
        return "昨天";
      } else {
        return `${date.getMonth() + 1}-${date.getDate()}`;
      }
    },
    // 跳转到系统推荐页面
    goToRecommendList() {
      console.log("=== 跳转到系统推荐页面 ===");
      common_vendor.index.navigateTo({
        url: "/subPages/recommendMemoList/recommendMemoList",
        fail: (err) => {
          console.error("跳转失败:", err);
          common_vendor.index.showToast({
            title: "跳转失败",
            icon: "none"
          });
        }
      });
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: common_vendor.f($data.tabs, (tab, index, i0) => {
      return {
        a: common_vendor.t(tab.label),
        b: index,
        c: $data.activeTab === tab.value ? 1 : "",
        d: common_vendor.o(($event) => $options.switchTab(tab.value))
      };
    }),
    b: common_vendor.o((...args) => $options.goToRecommendList && $options.goToRecommendList(...args)),
    c: $options.filteredMemos.length === 0
  }, $options.filteredMemos.length === 0 ? {
    d: common_vendor.t($options.emptyText)
  } : {
    e: common_vendor.f($options.filteredMemos, (memo, index, i0) => {
      return common_vendor.e({
        a: memo.is_completed
      }, memo.is_completed ? {} : {}, {
        b: memo.is_completed ? 1 : "",
        c: common_vendor.o(($event) => $options.toggleComplete(memo.id)),
        d: common_vendor.t($options.getFirstLine(memo.content)),
        e: memo.is_completed ? 1 : "",
        f: common_vendor.t(memo.priority),
        g: common_vendor.n("priority-" + memo.priority),
        h: common_vendor.t(memo.content),
        i: common_vendor.t(memo.category),
        j: common_vendor.t($options.formatTime(memo.create_time)),
        k: common_vendor.t(memo.is_completed ? "已完成" : "完成"),
        l: common_vendor.n(memo.is_completed ? "completed-btn" : "complete-btn"),
        m: common_vendor.o(($event) => $options.toggleComplete(memo.id)),
        n: common_vendor.o(($event) => $options.editMemo(memo)),
        o: common_vendor.o(($event) => $options.deleteMemo(memo.id)),
        p: memo.id,
        q: memo.is_completed ? 1 : ""
      });
    })
  }, {
    f: common_vendor.o((...args) => $options.openAddDialog && $options.openAddDialog(...args)),
    g: $data.showAddDialog
  }, $data.showAddDialog ? {
    h: common_vendor.t($data.isEdit ? "编辑备忘录" : "新建备忘录"),
    i: common_vendor.o((...args) => $options.closeDialog && $options.closeDialog(...args)),
    j: common_vendor.o((...args) => $options.handleContentInput && $options.handleContentInput(...args)),
    k: common_vendor.o((...args) => $options.handleContentFocus && $options.handleContentFocus(...args)),
    l: common_vendor.o((...args) => $options.handleContentBlur && $options.handleContentBlur(...args)),
    m: common_vendor.o((...args) => $options.handleContentConfirm && $options.handleContentConfirm(...args)),
    n: common_vendor.t($data.formData.content.length),
    o: common_vendor.f($data.categories, (cat, k0, i0) => {
      return {
        a: common_vendor.t(cat),
        b: cat,
        c: $data.formData.category === cat ? 1 : "",
        d: common_vendor.o(($event) => $options.selectCategory(cat))
      };
    }),
    p: common_vendor.f($data.priorities, (pri, k0, i0) => {
      return {
        a: common_vendor.t(pri),
        b: pri,
        c: common_vendor.n({
          active: $data.formData.priority === pri
        }),
        d: common_vendor.n("priority-" + pri),
        e: common_vendor.o(($event) => $options.selectPriority(pri))
      };
    }),
    q: common_vendor.o((...args) => $options.closeDialog && $options.closeDialog(...args)),
    r: common_vendor.o((...args) => $options.saveMemo && $options.saveMemo(...args)),
    s: common_vendor.o(() => {
    }),
    t: common_vendor.o((...args) => $options.handleMaskClick && $options.handleMaskClick(...args))
  } : {}, {
    v: common_vendor.gei(_ctx, "")
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-c0e26b37"]]);
ks.createPage(MiniProgramPage);
