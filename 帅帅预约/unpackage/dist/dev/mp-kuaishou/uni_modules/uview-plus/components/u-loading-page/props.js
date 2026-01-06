"use strict";
const uni_modules_uviewPlus_libs_vue = require("../../libs/vue.js");
const uni_modules_uviewPlus_libs_config_props = require("../../libs/config/props.js");
const props = uni_modules_uviewPlus_libs_vue.defineMixin({
  props: {
    // 提示内容
    loadingText: {
      type: [String, Number],
      default: () => uni_modules_uviewPlus_libs_config_props.defProps.loadingPage.loadingText
    },
    // 文字上方用于替换loading动画的图片
    image: {
      type: String,
      default: () => uni_modules_uviewPlus_libs_config_props.defProps.loadingPage.image
    },
    // 加载动画的模式，circle-圆形，spinner-花朵形，semicircle-半圆形
    loadingMode: {
      type: String,
      default: () => uni_modules_uviewPlus_libs_config_props.defProps.loadingPage.loadingMode
    },
    // 是否加载中
    loading: {
      type: Boolean,
      default: () => uni_modules_uviewPlus_libs_config_props.defProps.loadingPage.loading
    },
    // 背景色
    bgColor: {
      type: String,
      default: () => uni_modules_uviewPlus_libs_config_props.defProps.loadingPage.bgColor
    },
    // 文字颜色
    color: {
      type: String,
      default: () => uni_modules_uviewPlus_libs_config_props.defProps.loadingPage.color
    },
    // 文字大小
    fontSize: {
      type: [String, Number],
      default: () => uni_modules_uviewPlus_libs_config_props.defProps.loadingPage.fontSize
    },
    // 图标大小
    iconSize: {
      type: [String, Number],
      default: () => uni_modules_uviewPlus_libs_config_props.defProps.loadingPage.fontSize
    },
    // 加载中图标的颜色，只能rgb或者十六进制颜色值
    loadingColor: {
      type: String,
      default: () => uni_modules_uviewPlus_libs_config_props.defProps.loadingPage.loadingColor
    },
    // 层级
    zIndex: {
      type: [Number],
      default: () => uni_modules_uviewPlus_libs_config_props.defProps.loadingPage.zIndex
    }
  }
});
exports.props = props;
