<template>
  <view class="price-container" :class="themeName">
    <view
      :class="['price-wrap', { 'price-wrap--disabled': lineThrough }]"
      :style="{ color: color }"
    >
      <!-- Prefix -->
      <view class="fix-pre" :style="{ fontSize: minorSize }">
        <slot name="prefix">{{ prefix }}</slot>
      </view>

      <!-- Content -->
      <view class="content" :style="{ 'font-weight': fontWeight }">
        <!-- Integer -->
        <text class="integer" :style="{ fontSize: mainSize }">{{
          integer
        }}</text>
        <!-- Decimals -->
        <text class="decimals" :style="{ fontSize: minorSize }">{{
          decimals
        }}</text>
      </view>

      <!-- Suffix -->
      <view class="fix-suf" :style="{ fontSize: minorSize }">
        <slot name="suffix">{{ suffix }}</slot>
      </view>
    </view>
  </view>
</template>

<script>
/**
 * @description 价格展示，适用于有前后缀，小数样式不一
 * @property {String|Number} content 价格 (必填项)
 * @property {Number} prec 小数位 (默认: 2)
 * @property {Boolean} autoPrec 自动小数位【注：以prec为最大小数位】 (默认: true)
 * @property {String} color 颜色 (默认: 'unset')
 * @property {String} mainSize 主要内容字体大小 (默认: 46rpx)
 * @property {String} minorSize 主要内容字体大小 (默认: 32rpx)
 * @property {Boolean} lineThrough 贯穿线 (默认: false)
 * @property {String|Number} fontWeight 字重 (默认: normal)
 * @property {String} prefix 前缀 (默认: ￥)
 * @property {String} suffix 后缀
 * @example <price content="100" suffix="\/元" />
 */

import { formatPrice } from "@/utils/tools";

export default {
  name: "Price",

  props: {
    // 价格
    content: {
      type: String | Number,
      required: true,
    },

    // 小数位
    prec: {
      type: Number,
      default: 2,
    },

    // 动态小数
    autoPrec: {
      type: Boolean,
      default: true,
    },

    // 颜色
    color: {
      type: String,
      default: "inherit",
    },

    // 主要内容字体大小
    mainSize: {
      type: String,
      default: "inherit",
    },

    // 次要内容字体大小
    minorSize: {
      type: String,
      default: "inherit",
    },

    // 贯穿线
    lineThrough: {
      type: Boolean,
      default: false,
    },

    // 字重
    fontWeight: {
      type: String | Number,
      default: "normal",
    },

    // 前缀
    prefix: {
      type: String,
      default: "￥",
    },

    // 后缀
    suffix: {
      type: String,
      default: "",
    },
  },

  computed: {
    // 金额整数部分
    integer() {
      return formatPrice({
        price: this.content,
        take: "int",
      });
    },

    // 金额小数部分
    decimals() {
      let decimals = formatPrice({
        price: this.content,
        take: "dec",
        prec: this.prec,
      });

      // 小数余十不能是 .10||.20||.30以此类推，
      decimals =
        decimals % 10 == 0 ? decimals.substr(0, decimals.length - 1) : decimals;

      return this.autoPrec
        ? decimals * 1
          ? "." + decimals
          : ""
        : this.prec
        ? "." + decimals
        : "";
    },
  },
};
</script>

<style lang="scss" scoped>
.price-container {
  display: inline-block;
  line-height: 1em;
  // @include font_color()
}

.price-wrap {
  display: flex;
  align-items: flex-end;
  justify-content: center;

  &--disabled {
    position: relative;

    &::before {
      position: absolute;
      left: 0;
      top: 50%;
      right: 0;
      transform: translateY(-50%);
      display: block;
      content: "";
      height: 0.05em;
      background-color: currentColor;
    }
  }
}

.content {
  // font-weight: 500;
}
</style>
