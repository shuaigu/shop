"use strict";
const common_vendor = require("../../common/vendor.js");
if (!Array) {
  const _easycom_uni_icons2 = common_vendor.resolveComponent("uni-icons");
  const _easycom_floatButton2 = common_vendor.resolveComponent("floatButton");
  (_easycom_uni_icons2 + _easycom_floatButton2)();
}
const _easycom_uni_icons = () => "../../uni_modules/uni-icons/components/uni-icons/uni-icons.js";
const _easycom_floatButton = () => "../../components/floatButton/floatButton.js";
if (!Math) {
  (_easycom_uni_icons + managePopup + _easycom_floatButton)();
}
const managePopup = () => "../../components/manage-popup/manage-popup.js";
const _sfc_main = {
  __name: "cateManage",
  setup(__props) {
    const cateApi = common_vendor.nr.importObject("cateKs");
    const cateList = common_vendor.ref([]);
    const globalCategoryVisibility = common_vendor.ref(true);
    const cateListGet = async () => {
      console.log("开始获取分类列表");
      try {
        const res = await cateApi.get();
        console.log("获取分类列表成功:", res);
        if (res.data && Array.isArray(res.data)) {
          res.data.sort((a, b) => (b.sort || 0) - (a.sort || 0));
        }
        cateList.value = res.data;
        console.log("分类列表数据已更新，当前列表长度:", cateList.value.length);
        if (cateList.value.length > 0) {
          const allVisible = cateList.value.every((item) => item.is_visible !== false);
          const allHidden = cateList.value.every((item) => item.is_visible === false);
          if (allVisible) {
            globalCategoryVisibility.value = true;
          } else if (allHidden) {
            globalCategoryVisibility.value = false;
          }
        }
      } catch (error) {
        console.error("获取分类列表失败:", error);
      }
    };
    const toggleAllCategoriesVisibility = async (e) => {
      const isVisible = e.detail.value;
      try {
        common_vendor.index.showLoading({
          title: isVisible ? "显示分类中..." : "隐藏分类中...",
          mask: true
        });
        const res = await cateApi.updateVisibility(isVisible);
        console.log("更新所有分类可见性结果:", res);
        common_vendor.index.hideLoading();
        if (res.code === 0) {
          globalCategoryVisibility.value = isVisible;
          common_vendor.index.showToast({
            title: isVisible ? "所有分类已显示" : "所有分类已隐藏",
            icon: "success"
          });
          await cateListGet();
          const cateRes = await cateApi.get();
          const hiddenCategoryIds = cateRes.data.filter((item) => item.is_visible === false).map((item) => item._id);
          common_vendor.index.$emit("categoryVisibilityChanged", {
            isVisible,
            hiddenCategoryIds,
            allCategories: cateRes.data
          });
        } else {
          common_vendor.index.showToast({
            title: res.errMsg || "操作失败",
            icon: "none"
          });
        }
      } catch (error) {
        common_vendor.index.hideLoading();
        console.error("切换分类可见性失败:", error);
        common_vendor.index.showToast({
          title: "操作失败: " + (error.message || "未知错误"),
          icon: "none"
        });
      }
    };
    common_vendor.onLoad(() => {
      console.log("页面加载完成");
      cateListGet();
    });
    common_vendor.onShow(() => {
      console.log("页面显示，开始获取分类列表");
      cateListGet();
    });
    const showPopup = common_vendor.ref(false);
    const isEdit = common_vendor.ref(false);
    const editValue = common_vendor.ref("");
    const editImg = common_vendor.ref("");
    const editSort = common_vendor.ref(0);
    const currentId = common_vendor.ref("");
    const isSelectMode = common_vendor.ref(false);
    const selectedItems = common_vendor.ref([]);
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
      if (selectedItems.value.length === cateList.value.length) {
        selectedItems.value = [];
      } else {
        selectedItems.value = cateList.value.map((item) => item._id);
      }
    };
    const batchDelete = () => {
      if (selectedItems.value.length === 0) {
        common_vendor.index.showToast({
          title: "请先选择要删除的分类",
          icon: "none"
        });
        return;
      }
      common_vendor.index.showModal({
        title: "⚠️ 批量删除",
        content: `确定要删除选中的 ${selectedItems.value.length} 个分类吗？
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
                  const res2 = await cateApi.del(id);
                  if (res2.deleted === 1) {
                    successCount++;
                  }
                } catch (error) {
                  console.error(`删除分类 ${id} 失败:`, error);
                }
              }
              common_vendor.index.hideLoading();
              common_vendor.index.showToast({
                title: `成功删除 ${successCount} 个分类`,
                icon: "none"
              });
              cateListGet();
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
    const handleAddCate = () => {
      console.log("点击添加分类按钮");
      isEdit.value = false;
      editValue.value = "";
      editImg.value = "";
      setTimeout(() => {
        showPopup.value = true;
        console.log("打开添加分类弹窗，showPopup值:", showPopup.value);
      }, 0);
    };
    const edit = async (id) => {
      console.log("开始编辑分类，ID:", id);
      isEdit.value = true;
      currentId.value = id;
      try {
        const res = await cateApi.get(id);
        console.log("获取单个分类数据成功:", res);
        if (res.data && res.data.length > 0) {
          console.log("使用数组格式的数据:", res.data[0]);
          editValue.value = res.data[0].cate_name;
          editSort.value = res.data[0].sort || 0;
          editImg.value = res.data[0].cate_img || "/static/images/defalut.png";
        } else if (res.data) {
          console.log("使用对象格式的数据:", res.data);
          editValue.value = res.data.cate_name;
          editSort.value = res.data.sort || 0;
          editImg.value = res.data.cate_img || "/static/images/defalut.png";
        }
        console.log("设置编辑值为:", editValue.value, "排序为:", editSort.value);
        showPopup.value = true;
        console.log("打开编辑分类弹窗，showPopup值:", showPopup.value);
      } catch (error) {
        console.error("获取单个分类数据失败:", error);
        common_vendor.index.showToast({
          title: "获取分类数据失败",
          icon: "none"
        });
      }
    };
    const del = async (id) => {
      console.log("开始删除分类，ID:", id);
      const category = cateList.value.find((item) => item._id === id);
      const cateName = category ? category.cate_name : "此分类";
      common_vendor.index.showModal({
        title: "⚠️ 确认删除",
        content: `确定要删除"${cateName}"吗？
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
              const res2 = await cateApi.del(id);
              console.log("删除分类结果:", res2);
              common_vendor.index.hideLoading();
              if (res2.deleted === 1) {
                common_vendor.index.showToast({
                  title: "删除成功",
                  icon: "none"
                });
                console.log("删除成功，重新获取分类列表");
                cateListGet();
              } else {
                console.warn("删除失败，返回结果:", res2);
                common_vendor.index.showToast({
                  title: "删除失败",
                  icon: "none"
                });
              }
            } catch (error) {
              console.error("删除分类出错:", error);
              common_vendor.index.hideLoading();
              common_vendor.index.showToast({
                title: "删除失败: " + (error.message || "未知错误"),
                icon: "none"
              });
            }
          } else {
            console.log("用户取消删除操作");
          }
        }
      });
    };
    const handleConfirm = async (value) => {
      console.log("确认按钮点击，输入值:", value);
      const { name, img, sort, is_visible } = value;
      if (!name || !name.trim()) {
        common_vendor.index.showToast({
          title: "请输入分类名称",
          icon: "none"
        });
        return;
      }
      common_vendor.index.showLoading({
        title: "处理中...",
        mask: true
      });
      try {
        const imgPath = img || "/static/images/defalut.png";
        const sortValue = sort !== void 0 ? parseInt(sort) : isEdit.value ? editSort.value : 0;
        const visibleValue = is_visible !== void 0 ? is_visible : true;
        console.log("使用的参数:", {
          name,
          imgPath,
          sortValue,
          visibleValue
        });
        if (isEdit.value) {
          console.log("执行编辑操作，ID:", currentId.value, "新值:", name, "图片:", imgPath, "排序:", sortValue, "可见性:", visibleValue);
          const upRes = await cateApi.update(currentId.value, name, imgPath, sortValue, visibleValue);
          console.log("更新分类结果:", upRes);
          common_vendor.index.hideLoading();
          if (upRes.updated === 1) {
            common_vendor.index.showToast({
              title: "更新成功",
              icon: "success"
            });
            console.log("更新成功，重新获取分类列表");
            cateListGet();
            showPopup.value = false;
            editValue.value = "";
            editImg.value = "";
            editSort.value = 0;
            console.log("弹窗已关闭，编辑值已清空");
          } else {
            console.warn("更新失败，返回结果:", upRes);
            common_vendor.index.showToast({
              title: upRes.errMsg || "更新失败",
              icon: "none"
            });
          }
        } else {
          console.log("执行添加操作，值:", name, "图片:", imgPath, "排序:", sortValue);
          const res = await cateApi.add(name, imgPath, sortValue);
          console.log("添加分类结果:", res);
          common_vendor.index.hideLoading();
          if (res.id) {
            common_vendor.index.showToast({
              title: "添加成功",
              icon: "success"
            });
            console.log("添加成功，重新获取分类列表");
            cateListGet();
            showPopup.value = false;
            editValue.value = "";
            editImg.value = "";
            editSort.value = 0;
            console.log("弹窗已关闭，编辑值已清空");
          } else {
            console.warn("添加失败，返回结果:", res);
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
      console.log("当前编辑ID已重置");
    };
    const watchPopupState = (val) => {
      console.log("弹窗状态变化:", val);
    };
    const handleImageError = (item) => {
      console.error(`图片加载失败，分类ID: ${item._id}, 图片路径: ${item.cate_img}`);
      if (item.cate_img && item.cate_img !== "/static/images/defalut.png") {
        console.log(`尝试将分类 ${item._id} 的图片更新为默认图片`);
        item.cate_img = "/static/images/defalut.png";
        setTimeout(() => {
          cateApi.update(item._id, item.cate_name, "/static/images/defalut.png").then((res) => {
            console.log("更新为默认图片成功:", res);
          }).catch((err) => {
            console.error("更新为默认图片失败:", err);
          });
        }, 500);
      }
    };
    const recalculateAllSorts = async () => {
      common_vendor.index.showLoading({
        title: "优化排序...",
        mask: true
      });
      try {
        const currentList = [...cateList.value];
        const sortStep = 1e3;
        let startSort = currentList.length * sortStep;
        for (let i = 0; i < currentList.length; i++) {
          const item = currentList[i];
          const newSort = startSort - i * sortStep;
          if (item.sort !== newSort) {
            await cateApi.updateSort(item._id, newSort);
          }
        }
        await cateListGet();
        common_vendor.index.showToast({
          title: "排序已优化",
          icon: "success"
        });
      } catch (error) {
        console.error("优化排序失败:", error);
        common_vendor.index.showToast({
          title: "优化排序失败",
          icon: "none"
        });
      } finally {
        common_vendor.index.hideLoading();
      }
    };
    const swapItems = async (index1, index2) => {
      common_vendor.index.showLoading({
        title: "更新排序...",
        mask: true
      });
      try {
        const item1 = cateList.value[index1];
        const item2 = cateList.value[index2];
        const tempSort = item1.sort;
        await cateApi.updateSort(item1._id, item2.sort);
        await cateApi.updateSort(item2._id, tempSort);
        await cateListGet();
      } catch (error) {
        console.error("交换位置失败:", error);
        common_vendor.index.showToast({
          title: "更新排序失败",
          icon: "none"
        });
      } finally {
        common_vendor.index.hideLoading();
      }
    };
    const moveUp = async (index, item) => {
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
    const moveDown = async (index, item) => {
      if (index === cateList.value.length - 1) {
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
    const toggleCategoryVisibility = async (id, currentVisibility) => {
      try {
        common_vendor.index.showLoading({
          title: "更新中...",
          mask: true
        });
        const category = cateList.value.find((item) => item._id === id);
        if (!category) {
          common_vendor.index.showToast({
            title: "未找到分类信息",
            icon: "none"
          });
          common_vendor.index.hideLoading();
          return;
        }
        const newVisibility = !currentVisibility;
        const upRes = await cateApi.update(
          id,
          category.cate_name,
          category.cate_img,
          category.sort,
          newVisibility
        );
        common_vendor.index.hideLoading();
        if (upRes.updated === 1) {
          common_vendor.index.showToast({
            title: newVisibility ? "已设为显示" : "已设为隐藏",
            icon: "success"
          });
          await cateListGet();
          const cateRes = await cateApi.get();
          const hiddenCategoryIds = cateRes.data.filter((item) => item.is_visible === false).map((item) => item._id);
          common_vendor.index.$emit("categoryVisibilityChanged", {
            categoryId: id,
            isVisible: newVisibility,
            hiddenCategoryIds,
            allCategories: cateRes.data
          });
        } else {
          common_vendor.index.showToast({
            title: upRes.errMsg || "更新失败",
            icon: "none"
          });
        }
      } catch (error) {
        console.error("切换分类可见性失败:", error);
        common_vendor.index.hideLoading();
        common_vendor.index.showToast({
          title: "操作失败: " + (error.message || "未知错误"),
          icon: "none"
        });
      }
    };
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.t(cateList.value.length),
        b: common_vendor.t(globalCategoryVisibility.value ? "显示" : "隐藏"),
        c: globalCategoryVisibility.value,
        d: common_vendor.o(toggleAllCategoriesVisibility),
        e: !isSelectMode.value
      }, !isSelectMode.value ? {
        f: common_vendor.o(recalculateAllSorts)
      } : {}, {
        g: common_vendor.t(isSelectMode.value ? "取消" : "批量删除"),
        h: common_vendor.o(toggleSelectMode),
        i: !isSelectMode.value
      }, !isSelectMode.value ? {
        j: common_vendor.p({
          type: "info",
          size: "16",
          color: "#399bfe"
        })
      } : {}, {
        k: isSelectMode.value
      }, isSelectMode.value ? common_vendor.e({
        l: selectedItems.value.length === cateList.value.length
      }, selectedItems.value.length === cateList.value.length ? {} : {}, {
        m: selectedItems.value.length === cateList.value.length ? 1 : "",
        n: common_vendor.o(toggleSelectAll),
        o: common_vendor.t(selectedItems.value.length),
        p: common_vendor.p({
          color: "#fff",
          ["custom-prefix"]: "iconfont",
          type: "icon-shanchu1",
          size: "18"
        }),
        q: common_vendor.o(batchDelete),
        r: selectedItems.value.length === 0 ? 1 : ""
      }) : {}, {
        s: common_vendor.f(cateList.value, (item, index, i0) => {
          return common_vendor.e(isSelectMode.value ? common_vendor.e({
            a: selectedItems.value.includes(item._id)
          }, selectedItems.value.includes(item._id) ? {} : {}, {
            b: selectedItems.value.includes(item._id) ? 1 : "",
            c: common_vendor.o(($event) => toggleSelectItem(item._id))
          }) : {}, {
            d: item.cate_img || "/static/images/defalut.png",
            e: common_vendor.o(($event) => handleImageError(item)),
            f: common_vendor.t(item.cate_name),
            g: common_vendor.t(item.sort || 0),
            h: common_vendor.t(item.is_visible === false ? "隐藏" : "显示"),
            i: item.is_visible !== false ? 1 : "",
            j: item.is_visible === false ? 1 : "",
            k: common_vendor.o(($event) => toggleCategoryVisibility(item._id, item.is_visible !== false))
          }, !isSelectMode.value ? {
            l: "1eceedb2-2-" + i0,
            m: common_vendor.p({
              type: "arrow-up",
              size: "18",
              color: "#399bfe"
            }),
            n: common_vendor.o(($event) => moveUp(index)),
            o: "1eceedb2-3-" + i0,
            p: common_vendor.p({
              type: "arrow-down",
              size: "18",
              color: "#399bfe"
            }),
            q: common_vendor.o(($event) => moveDown(index))
          } : {}, !isSelectMode.value ? {
            r: "1eceedb2-4-" + i0,
            s: common_vendor.p({
              color: "#399bfe",
              type: "compose",
              size: "22"
            }),
            t: common_vendor.o(($event) => edit(item._id))
          } : {}, !isSelectMode.value ? {
            v: "1eceedb2-5-" + i0,
            w: common_vendor.p({
              color: "#e65c00",
              ["custom-prefix"]: "iconfont",
              type: "icon-shanchu1",
              size: "20"
            }),
            x: common_vendor.o(($event) => del(item._id))
          } : {}, {
            y: item._id
          });
        }),
        t: isSelectMode.value,
        v: !isSelectMode.value,
        w: !isSelectMode.value,
        x: !isSelectMode.value,
        y: common_vendor.j({
          "confirm": common_vendor.o(handleConfirm),
          "updateShow": common_vendor.o(watchPopupState),
          "updateShow": common_vendor.o(($event) => showPopup.value = $event)
        }),
        z: common_vendor.p({
          title: isEdit.value ? "编辑分类" : "添加分类",
          ["edit-value"]: editValue.value,
          ["edit-img"]: editImg.value,
          ["edit-sort"]: editSort.value,
          show: showPopup.value
        }),
        A: common_vendor.j({
          "click": common_vendor.o(handleAddCate)
        }),
        B: common_vendor.p({
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
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-1eceedb2"]]);
ks.createPage(MiniProgramPage);
