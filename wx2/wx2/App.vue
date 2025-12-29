<script>
	import { setWatermarkEnabled, updateWatermarkConfig } from '@/utils/domainConfig.js'
	
	export default {
		onLaunch: function(options) {
			console.log('App Launch');
			console.log('启动参数:', options);
			
			// 处理小程序码扫码进入（scene参数）
			if (options && options.scene) {
				console.log('='.repeat(60));
				console.log('🔍 【App.vue】检测到小程序码启动');
				console.log('🔍 原始scene:', options.scene);
				console.log('🔍 path:', options.path);
				console.log('🔍 query:', options.query);
				
				// 解码scene参数
				let decodedScene = options.scene;
				try {
					decodedScene = decodeURIComponent(options.scene);
					console.log('🔓 解码后scene:', decodedScene);
				} catch (e) {
					console.warn('⚠️ scene解码失败:', e);
				}
				
				// 解析scene参数（格式: a=文章ID）
				const sceneParams = {};
				if (decodedScene) {
					const cleanQuery = decodedScene.startsWith('?') ? decodedScene.substring(1) : decodedScene;
					if (cleanQuery) {
						cleanQuery.split('&').forEach(param => {
							if (!param) return;
							const [key, value] = param.split('=');
							if (key && value !== undefined) {
								sceneParams[key] = value;
							}
						});
					}
				}
				
				console.log('📝 解析后的sceneParams:', sceneParams);
				
				// 如果是文章详情页的小程序码（a=文章ID）
				if (sceneParams.a) {
					const articleId = sceneParams.a;
					console.log('✅ 解析到文章ID:', articleId);
					
					// 延迟跳转，确保应用完全启动
					setTimeout(() => {
						console.log('🚀 即将跳转到文章详情页...');
										
						// 构建跳转URL，包含分享者参数
						let targetUrl = `/pages/article/articleDetail?article_id=${articleId}`;
										
						// 如果有分享者ID后缀（s参数），也传递给详情页
						if (sceneParams.s) {
							console.log('✅ 解析到分享者ID后缀:', sceneParams.s);
							targetUrl += `&sharer_id_suffix=${sceneParams.s}`;
						}
										
						uni.navigateTo({
							url: targetUrl,
							success: () => {
								console.log('✅ 跳转成功');
							},
							fail: (err) => {
								console.error('❌ 跳转失败:', err);
								// 如果navigateTo失败，尝试使用reLaunch
								uni.reLaunch({
									url: targetUrl,
									success: () => {
										console.log('✅ reLaunch跳转成功');
									},
									fail: (err2) => {
										console.error('❌ reLaunch跳转也失败:', err2);
									}
								});
							}
						});
					}, 500);
				} else {
					console.warn('⚠️ scene参数中没有文章ID (a参数)');
				}
				
				console.log('='.repeat(60));
			}
			
			// 全局禁用水印功能
			setWatermarkEnabled(false);
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
	@import "@/style/iconfont/iconfont.css";
</style>