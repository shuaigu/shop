<script>
	export default {
		onLaunch: function( ) {
			console.log( 'App Launch' )
		},
		onShow: function( ) {
			console.log( 'App Show' )
		},
		onHide: function( ) {
			console.log( 'App Hide' )
		}
	}
</script>

<style lang="scss">
	/*每个页面公共css */
	@import "@/uni_modules/uview-plus/index.scss";
	@import "@/style/common.scss";
	@import "@/static/styles/iconfont.scss";  // 引入字体图标样式
</style>