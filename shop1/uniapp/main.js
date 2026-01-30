import App from './App'
import { createSSRApp } from 'vue'
import { createPinia } from 'pinia'

// 自定义持久化插件函数
const createPersistedState = (options = {}) => {
	const storage = {
		getItem: (key) => uni.getStorageSync(key),
		setItem: (key, value) => uni.setStorageSync(key, value)
	}
	
	return ({ store }) => {
		// 判断当前store是否需要持久化
		if (!options.stores || options.stores.includes(store.$id)) {
			const storageKey = `${options.prefix || 'pinia'}-${store.$id}`;
			
			// 从存储中恢复状态
			const persisted = storage.getItem(storageKey);
			if (persisted) {
				store.$patch(JSON.parse(persisted));
			}
			
			// 监听变更并保存
			store.$subscribe((_, state) => {
				storage.setItem(storageKey, JSON.stringify(state));
			});
		}
	}
}

export function createApp() {
	const app = createSSRApp(App)
	const pinia = createPinia()
	
	// 使用自定义持久化插件
	pinia.use(createPersistedState({
		stores: ['userInfo'],
		prefix: 'shop1-'
	}));
	
	app.use(pinia)
	
	// 挂载全局请求方法
	app.config.globalProperties.$request = function(options) {
		const token = uni.getStorageSync('token');
		const baseUrl = 'https://shop.jingle0350.cn/shop1/php1/api.php'; // 对应后端的地址
		
		// 处理路由路径，去除前导斜杠
		const path = options.url.startsWith('/') ? options.url.substring(1) : options.url;
		const fullUrl = `${baseUrl}?path=${path}`;
		
		console.log('[Request] URL:', fullUrl);
		console.log('[Request] Method:', options.method || 'GET');
		console.log('[Request] Data:', options.data);
		
		return new Promise((resolve, reject) => {
			uni.request({
				url: fullUrl,
				method: options.method || 'GET',
				data: options.data || {},
				header: {
					'Authorization': token ? 'Bearer ' + token : '',
					'Content-Type': 'application/json',
					...options.header
				},
				success: (res) => {
					console.log('[Response] Status:', res.statusCode);
					console.log('[Response] Data:', res.data);
					
					if (res.data.success === false && res.data.message === '令牌已过期') {
						uni.removeStorageSync('token');
						uni.navigateTo({ url: '/pages/login/login' });
						reject(res.data);
					} else {
						resolve(res.data);
					}
				},
				fail: (err) => {
					console.error('[Request] Fail:', err);
					reject(err);
				}
			});
		});
	};
	
	return {
		app
	}
}
