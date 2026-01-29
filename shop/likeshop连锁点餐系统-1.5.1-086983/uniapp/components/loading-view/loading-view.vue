<template>
<view :class="'loading ' + ( type == 'flex' ? 'flex' : '' )" :style="{backgroundColor, }">
   <image class="loading-img" src="/static/images/loading.gif"></image>
</view>
</template>

<script>

export default {
  data() {
    return {};
  },
  props: {
    type: {
      type: String,
      default: 'fixed'
    },
		
	backgroundColor: {
		type: String,
		default: '#fff'
	}
  },
  methods: {}
};
</script>
<style lang="scss" scoped>
.loading {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    z-index: 1000;
    display: flex;
    justify-content: center;
    align-items: center;
}

.loading.flex {
    position: static;
    flex: 1;
    width: 100%;
}
.loading {
	.loading-img {
		width: 100rpx;
		height: 100rpx;
	}
}
</style>