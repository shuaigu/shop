import App from './App'
import uviewPlus from '@/uni_modules/uview-plus'
import { createPinia } from 'pinia'
import persist from 'pinia-plugin-persistedstate'

// #ifndef VUE3
import Vue from 'vue'
import './uni.promisify.adaptor'
Vue.config.productionTip = false
App.mpType = 'app'
const app = new Vue( {
	...App
} )
app.$mount( )
// #endif

// #ifdef VUE3
import { createSSRApp } from 'vue'
export function createApp( ) {
	const app = createSSRApp( App )
	const pinia = createPinia( )

	// 先扩展 pinia，再安装
	pinia.use( persist )
	app.use( pinia )

	// 安装 uviewPlus
	app.use( uviewPlus )

	return {
		app,
		pinia
	}
}
// #endif