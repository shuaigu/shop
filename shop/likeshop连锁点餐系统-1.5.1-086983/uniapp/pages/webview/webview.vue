<template>
<view class="page-body">
  <view class="page-section page-section-gap">
    <web-view :src="url"></web-view>
  </view>
</view>
</template>

<script>

export default {
  data() {
    return {
      url: ''
    };
  },
  onLoad: function (options) {
	  console.log(options.url)
      this.url = options.url
  },
  methods: {}
};
</script>
<style>
.page-section-gap{
  box-sizing: border-box;
  padding: 0 30rpx;
}
</style>