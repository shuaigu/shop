"use strict";
const common_vendor = require("../../common/vendor.js");
if (!Array) {
  const _easycom_uni_icons2 = common_vendor.resolveComponent("uni-icons");
  const _easycom_uni_popup2 = common_vendor.resolveComponent("uni-popup");
  const _easycom_floatButton2 = common_vendor.resolveComponent("floatButton");
  (_easycom_uni_icons2 + _easycom_uni_popup2 + _easycom_floatButton2)();
}
const _easycom_uni_icons = () => "../../uni_modules/uni-icons/components/uni-icons/uni-icons.js";
const _easycom_uni_popup = () => "../../uni_modules/uni-popup/components/uni-popup/uni-popup.js";
const _easycom_floatButton = () => "../../components/floatButton/floatButton.js";
if (!Math) {
  (_easycom_uni_icons + _easycom_uni_popup + _easycom_floatButton)();
}
const _sfc_main = {
  __name: "customPageManage",
  setup(__props) {
    const pageApi = common_vendor.tr.importObject("customPageKs");
    const configApi = common_vendor.tr.importObject("config", { customUI: true });
    const pageList = common_vendor.ref([]);
    const activeTab = common_vendor.ref("all");
    const globalSwitch = common_vendor.ref(false);
    const popupRef = common_vendor.ref(null);
    const openPopup = () => {
      if (popupRef.value) {
        popupRef.value.open();
      }
    };
    const closePopup = () => {
      if (popupRef.value) {
        popupRef.value.close();
      }
    };
    const getPageList = async () => {
      try {
        const res = await pageApi.get();
        console.log("获取页面列表成功:", res);
        if (res.data && Array.isArray(res.data)) {
          res.data.sort((a, b) => (b.sort || 0) - (a.sort || 0));
        }
        pageList.value = res.data || [];
      } catch (error) {
        console.error("获取页面列表失败:", error);
        pageList.value = [];
        common_vendor.index.showToast({
          title: "请先上传云函数 customPageKs",
          icon: "none",
          duration: 3e3
        });
      }
    };
    const getGlobalSwitchStatus = async () => {
      try {
        const res = await configApi.getConfig("customPageEntry");
        if (res && res.data) {
          globalSwitch.value = res.data.isVisible !== false;
        } else {
          globalSwitch.value = false;
        }
      } catch (err) {
        console.error("获取总开关状态失败:", err);
        globalSwitch.value = false;
      }
    };
    const toggleGlobalSwitch = async (e) => {
      try {
        common_vendor.index.showLoading({ title: "更新中..." });
        const newValue = e.detail.value;
        const res = await configApi.updateConfig({
          key: "customPageEntry",
          data: {
            isVisible: newValue
          }
        });
        if (res && res.code === 0) {
          globalSwitch.value = newValue;
          common_vendor.index.$emit("updateCustomPageEntry", {
            isVisible: newValue
          });
          common_vendor.index.hideLoading();
          common_vendor.index.showToast({
            title: newValue ? "已开启入口" : "已关闭入口",
            icon: "success"
          });
        } else {
          globalSwitch.value = !newValue;
          common_vendor.index.hideLoading();
          common_vendor.index.showToast({
            title: "更新失败",
            icon: "none"
          });
        }
      } catch (error) {
        const oldValue = e.detail.value;
        globalSwitch.value = !oldValue;
        common_vendor.index.hideLoading();
        console.error("切换总开关失败:", error);
        common_vendor.index.showToast({
          title: "操作失败",
          icon: "none"
        });
      }
    };
    common_vendor.onLoad(() => {
      getPageList();
      getGlobalSwitchStatus();
    });
    common_vendor.onShow(() => {
      getPageList();
      getGlobalSwitchStatus();
    });
    common_vendor.ref(false);
    const isEdit = common_vendor.ref(false);
    const currentId = common_vendor.ref("");
    const editData = common_vendor.ref({
      title: "",
      content: "",
      contact_info: "",
      qr_code_image: "",
      background_color: "#ffffff",
      text_color: "#333333",
      sort: 0
    });
    const isSelectMode = common_vendor.ref(false);
    const selectedItems = common_vendor.ref([]);
    const switchTab = (tab) => {
      activeTab.value = tab;
    };
    const filteredPageList = () => {
      if (activeTab.value === "visible") {
        return pageList.value.filter((item) => item.is_visible !== false);
      } else if (activeTab.value === "hidden") {
        return pageList.value.filter((item) => item.is_visible === false);
      }
      return pageList.value;
    };
    const toggleSelectMode = () => {
      isSelectMode.value = !isSelectMode.value;
      selectedItems.value = [];
    };
    const toggleSelectItem = (id) => {
      const index = selectedItems.value.indexOf(id);
      if (index === -1) {
        selectedItems.value.push(id);
      } else {
        selectedItems.value.splice(index, 1);
      }
    };
    const toggleSelectAll = () => {
      const currentList = filteredPageList();
      if (selectedItems.value.length === currentList.length) {
        selectedItems.value = [];
      } else {
        selectedItems.value = currentList.map((item) => item._id);
      }
    };
    const batchDelete = () => {
      if (selectedItems.value.length === 0) {
        common_vendor.index.showToast({
          title: "请先选择要删除的页面",
          icon: "none"
        });
        return;
      }
      common_vendor.index.showModal({
        title: "⚠️ 批量删除",
        content: `确定要删除选中的 ${selectedItems.value.length} 个页面吗？
删除后无法恢复。`,
        confirmColor: "#e65c00",
        confirmText: "删除",
        cancelText: "取消",
        success: async (res) => {
          if (res.confirm) {
            try {
              common_vendor.index.showLoading({
                title: "删除中...",
                mask: true
              });
              let successCount = 0;
              for (const id of selectedItems.value) {
                try {
                  const res2 = await pageApi.del(id);
                  if (res2.deleted === 1) {
                    successCount++;
                  }
                } catch (error) {
                  console.error(`删除页面 ${id} 失败:`, error);
                }
              }
              common_vendor.index.hideLoading();
              common_vendor.index.showToast({
                title: `成功删除 ${successCount} 个页面`,
                icon: "none"
              });
              getPageList();
              isSelectMode.value = false;
              selectedItems.value = [];
            } catch (error) {
              common_vendor.index.hideLoading();
              console.error("批量删除出错:", error);
              common_vendor.index.showToast({
                title: "删除失败: " + (error.message || "未知错误"),
                icon: "none"
              });
            }
          }
        }
      });
    };
    const handleAddPage = () => {
      isEdit.value = false;
      editData.value = {
        title: "",
        content: "",
        contact_info: "",
        qr_code_image: "",
        background_color: "#ffffff",
        text_color: "#333333",
        sort: 0
      };
      openPopup();
    };
    const edit = async (id) => {
      isEdit.value = true;
      currentId.value = id;
      try {
        const res = await pageApi.get(id);
        if (res.data && res.data.length > 0) {
          const data = res.data[0];
          editData.value = {
            title: data.title || "",
            content: data.content || "",
            contact_info: data.contact_info || "",
            qr_code_image: data.qr_code_image || "",
            background_color: data.background_color || "#ffffff",
            text_color: data.text_color || "#333333",
            sort: data.sort || 0
          };
        }
        openPopup();
      } catch (error) {
        console.error("获取页面数据失败:", error);
        common_vendor.index.showToast({
          title: "获取页面数据失败",
          icon: "none"
        });
      }
    };
    const del = async (id) => {
      const page = pageList.value.find((item) => item._id === id);
      const pageName = page ? page.title : "此页面";
      common_vendor.index.showModal({
        title: "⚠️ 确认删除",
        content: `确定要删除"${pageName}"吗？
删除后无法恢复。`,
        confirmColor: "#e65c00",
        confirmText: "删除",
        cancelText: "取消",
        success: async (res) => {
          if (res.confirm) {
            try {
              common_vendor.index.showLoading({
                title: "删除中...",
                mask: true
              });
              const res2 = await pageApi.del(id);
              common_vendor.index.hideLoading();
              if (res2.deleted === 1) {
                common_vendor.index.showToast({
                  title: "删除成功",
                  icon: "none"
                });
                getPageList();
              } else {
                common_vendor.index.showToast({
                  title: "删除失败",
                  icon: "none"
                });
              }
            } catch (error) {
              common_vendor.index.hideLoading();
              console.error("删除页面出错:", error);
              common_vendor.index.showToast({
                title: "删除失败: " + (error.message || "未知错误"),
                icon: "none"
              });
            }
          }
        }
      });
    };
    const handleConfirm = async () => {
      if (!editData.value.title || !editData.value.title.trim()) {
        common_vendor.index.showToast({
          title: "请输入页面标题",
          icon: "none"
        });
        return;
      }
      common_vendor.index.showLoading({
        title: "处理中...",
        mask: true
      });
      try {
        if (isEdit.value) {
          const upRes = await pageApi.update(currentId.value, editData.value);
          common_vendor.index.hideLoading();
          if (upRes.updated === 1) {
            common_vendor.index.showToast({
              title: "更新成功",
              icon: "success"
            });
            getPageList();
            closePopup();
          } else {
            common_vendor.index.showToast({
              title: upRes.errMsg || "更新失败",
              icon: "none"
            });
          }
        } else {
          const res = await pageApi.add(editData.value);
          common_vendor.index.hideLoading();
          if (res.id) {
            common_vendor.index.showToast({
              title: "添加成功",
              icon: "success"
            });
            getPageList();
            closePopup();
          } else {
            common_vendor.index.showToast({
              title: res.errMsg || "添加失败",
              icon: "none"
            });
          }
        }
      } catch (error) {
        common_vendor.index.hideLoading();
        console.error("操作失败:", error);
        common_vendor.index.showToast({
          title: "操作失败: " + (error.message || "未知错误"),
          icon: "none"
        });
      }
      currentId.value = "";
    };
    const swapItems = async (index1, index2) => {
      common_vendor.index.showLoading({
        title: "更新排序...",
        mask: true
      });
      try {
        const currentList = filteredPageList();
        const item1 = currentList[index1];
        const item2 = currentList[index2];
        const tempSort = item1.sort;
        await pageApi.updateSort(item1._id, item2.sort);
        await pageApi.updateSort(item2._id, tempSort);
        await getPageList();
        common_vendor.index.hideLoading();
      } catch (error) {
        console.error("交换位置失败:", error);
        common_vendor.index.hideLoading();
        common_vendor.index.showToast({
          title: "更新排序失败",
          icon: "none"
        });
      }
    };
    const moveUp = async (index) => {
      if (index === 0) {
        common_vendor.index.showToast({
          title: "已经是第一项",
          icon: "none"
        });
        return;
      }
      await swapItems(index, index - 1);
      common_vendor.index.showToast({
        title: "上移成功",
        icon: "success"
      });
    };
    const moveDown = async (index) => {
      const currentList = filteredPageList();
      if (index === currentList.length - 1) {
        common_vendor.index.showToast({
          title: "已经是最后一项",
          icon: "none"
        });
        return;
      }
      await swapItems(index, index + 1);
      common_vendor.index.showToast({
        title: "下移成功",
        icon: "success"
      });
    };
    const chooseImage = async () => {
      common_vendor.index.chooseImage({
        count: 1,
        sizeType: ["compressed"],
        sourceType: ["album", "camera"],
        success: async (res) => {
          const tempFilePath = res.tempFilePaths[0];
          common_vendor.index.showLoading({
            title: "上传中...",
            mask: true
          });
          try {
            const uploadRes = await common_vendor.tr.uploadFile({
              filePath: tempFilePath,
              cloudPath: `customPage/${Date.now()}_${Math.random().toString(36).substr(2)}.jpg`
            });
            editData.value.qr_code_image = uploadRes.fileID;
            common_vendor.index.hideLoading();
            common_vendor.index.showToast({
              title: "上传成功",
              icon: "success"
            });
          } catch (error) {
            common_vendor.index.hideLoading();
            console.error("上传图片失败:", error);
            common_vendor.index.showToast({
              title: "上传失败",
              icon: "none"
            });
          }
        }
      });
    };
    const previewPage = (id) => {
      common_vendor.index.navigateTo({
        url: `/subPages/customPageDisplay/customPageDisplay?id=${id}`
      });
    };
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.t(pageList.value.length),
        b: common_vendor.t(isSelectMode.value ? "取消" : "批量删除"),
        c: common_vendor.o(toggleSelectMode),
        d: common_vendor.t(pageList.value.length),
        e: activeTab.value === "all" ? 1 : "",
        f: common_vendor.o(($event) => switchTab("all")),
        g: common_vendor.t(pageList.value.filter((item) => item.is_visible !== false).length),
        h: activeTab.value === "visible" ? 1 : "",
        i: common_vendor.o(($event) => switchTab("visible")),
        j: common_vendor.t(pageList.value.filter((item) => item.is_visible === false).length),
        k: activeTab.value === "hidden" ? 1 : "",
        l: common_vendor.o(($event) => switchTab("hidden")),
        m: isSelectMode.value
      }, isSelectMode.value ? common_vendor.e({
        n: selectedItems.value.length === filteredPageList().length && filteredPageList().length > 0
      }, selectedItems.value.length === filteredPageList().length && filteredPageList().length > 0 ? {} : {}, {
        o: selectedItems.value.length === filteredPageList().length && filteredPageList().length > 0 ? 1 : "",
        p: common_vendor.o(toggleSelectAll),
        q: common_vendor.t(selectedItems.value.length),
        r: common_vendor.p({
          color: "#fff",
          ["custom-prefix"]: "iconfont",
          type: "icon-shanchu1",
          size: "18"
        }),
        s: common_vendor.o(batchDelete),
        t: selectedItems.value.length === 0 ? 1 : ""
      }) : {}, {
        v: common_vendor.f(filteredPageList(), (item, index, i0) => {
          return common_vendor.e(isSelectMode.value ? common_vendor.e({
            a: selectedItems.value.includes(item._id)
          }, selectedItems.value.includes(item._id) ? {} : {}, {
            b: selectedItems.value.includes(item._id) ? 1 : "",
            c: common_vendor.o(($event) => toggleSelectItem(item._id))
          }) : {}, {
            d: common_vendor.t(item.title),
            e: common_vendor.t(item.sort || 0),
            f: common_vendor.t(item.view_count || 0),
            g: item.content
          }, item.content ? {
            h: common_vendor.t(item.content.substring(0, 50)),
            i: common_vendor.t(item.content.length > 50 ? "..." : "")
          } : {}, {
            j: item.contact_info
          }, item.contact_info ? {
            k: "1ac37899-1-" + i0,
            l: common_vendor.p({
              type: "phone",
              size: "14",
              color: "#999"
            }),
            m: common_vendor.t(item.contact_info)
          } : {}, {
            n: common_vendor.o(($event) => previewPage(item._id))
          }, !isSelectMode.value ? {
            o: "1ac37899-2-" + i0,
            p: common_vendor.p({
              type: "arrow-up",
              size: "18",
              color: "#399bfe"
            }),
            q: common_vendor.o(($event) => moveUp(index)),
            r: "1ac37899-3-" + i0,
            s: common_vendor.p({
              type: "arrow-down",
              size: "18",
              color: "#399bfe"
            }),
            t: common_vendor.o(($event) => moveDown(index))
          } : {}, !isSelectMode.value ? {
            v: "1ac37899-4-" + i0,
            w: common_vendor.p({
              color: "#399bfe",
              type: "compose",
              size: "22"
            }),
            x: common_vendor.o(($event) => edit(item._id))
          } : {}, !isSelectMode.value ? {
            y: "1ac37899-5-" + i0,
            z: common_vendor.p({
              color: "#e65c00",
              ["custom-prefix"]: "iconfont",
              type: "icon-shanchu1",
              size: "20"
            }),
            A: common_vendor.o(($event) => del(item._id))
          } : {}, {
            B: item._id
          });
        }),
        w: isSelectMode.value,
        x: !isSelectMode.value,
        y: !isSelectMode.value,
        z: !isSelectMode.value,
        A: filteredPageList().length === 0
      }, filteredPageList().length === 0 ? {
        B: common_vendor.p({
          type: "info",
          size: "60",
          color: "#ccc"
        })
      } : {}, {
        C: common_vendor.t(isEdit.value ? "编辑页面" : "添加页面"),
        D: common_vendor.p({
          type: "close",
          size: "24",
          color: "#666"
        }),
        E: common_vendor.o(closePopup),
        F: editData.value.title,
        G: common_vendor.o(($event) => editData.value.title = $event.detail.value),
        H: editData.value.content,
        I: common_vendor.o(($event) => editData.value.content = $event.detail.value),
        J: editData.value.contact_info,
        K: common_vendor.o(($event) => editData.value.contact_info = $event.detail.value),
        L: editData.value.qr_code_image
      }, editData.value.qr_code_image ? {
        M: editData.value.qr_code_image
      } : {
        N: common_vendor.p({
          type: "camera",
          size: "40",
          color: "#999"
        })
      }, {
        O: common_vendor.o(chooseImage),
        P: editData.value.background_color,
        Q: common_vendor.o(($event) => editData.value.background_color = $event.detail.value),
        R: editData.value.text_color,
        S: common_vendor.o(($event) => editData.value.text_color = $event.detail.value),
        T: editData.value.sort,
        U: common_vendor.o(common_vendor.m(($event) => editData.value.sort = $event.detail.value, {
          number: true
        })),
        V: common_vendor.o(closePopup),
        W: common_vendor.o(handleConfirm),
        X: common_vendor.sr(popupRef, "1ac37899-7", {
          "k": "popupRef"
        }),
        Y: common_vendor.p({
          type: "bottom"
        }),
        Z: globalSwitch.value,
        aa: common_vendor.o(toggleGlobalSwitch),
        ab: common_vendor.o(handleAddPage),
        ac: common_vendor.p({
          icon: "plus",
          size: 100,
          position: {
            bottom: "120rpx",
            right: "40rpx"
          }
        })
      });
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-1ac37899"]]);
ks.createPage(MiniProgramPage);
