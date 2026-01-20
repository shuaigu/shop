<script>
	export default {
		globalData: {
			// 链科云打印配置
			printConfig: {
				clientId: 'dimA9V2fbB556AFMYaK8t',
				clientSecret: '' // 请填入你的密钥
			},
			// 当前选中的打印机
			selectedPrinter: null
		},
		onLaunch: function() {
			console.log('App Launch')
			// 初始化时加载打印机列表
			this.loadPrinters()
		},
		onShow: function() {
			console.log('App Show')
		},
		onHide: function() {
			console.log('App Hide')
		},
		methods: {
			// 加载打印机列表
			loadPrinters() {
				const printers = uni.getStorageSync('printers');
				if (printers) {
					this.globalData.selectedPrinter = printers[0] || null;
				}
			}
		}
	}
</script>

<style>
	/*每个页面公共css */
</style>
