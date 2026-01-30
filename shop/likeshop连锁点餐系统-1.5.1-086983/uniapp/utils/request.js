import axios from '../js_sdk/xtshadow-axios/axios.min'
import store from '../store'
import {
	paramsToStr,
	currentPage,
	toast
} from './tools'
import Cache from './cache'
import {
	TOKEN
} from '../config/cachekey'
import { baseURL } from '../config/app'
import {
	toLogin
} from './login'
import { router } from '../router'
let index = 0;

function checkParams(params) {
	if (typeof params != 'object') return params
	for (let key in params) {
		const value = params[key];
		if (value === null || value === undefined || value === "") {
			delete params[key];
		}
	}
	return params;
}



const service = axios.create({
	baseURL: baseURL + '/api/',
	timeout: 10000,
	header: {
		'content-type': 'application/json'
	},

});


// request拦截器
service.interceptors.request.use(
	config => {
		config.data = checkParams(config.data)
		config.params = checkParams(config.params)
		if (config.method == 'GET') {
			config.url += paramsToStr(config.params)
		}
		config.header.token = config.header.token || store.getters.token

		return config
	},
	error => {
		// Do something with request error
		console.log(error) // for debug
		Promise.reject(error)
	}
)

// response 拦截器
service.interceptors.response.use(
	async (response) => {

		if (response.data) {
			const {
				code,
				show,
				msg
			} = response.data;
			if (code == 0 && show) {
				toast({
					title: msg,
				})
			} else if (code == -1) {
				store.commit('logout')
				toLogin()
			} else if (code == 301) {
				// 返回上一页
				toast({
					title: msg,
				}, {
					tab: 3,
					url: 1
				})
			}
		}

		return Promise.resolve(response.data)
	},
	error => {
		let errorMsg = "系统错误"
		
		// 尝试从响应中获取详细错误信息
		if (error.response && error.response.data) {
			const { msg, message } = error.response.data
			errorMsg = msg || message || errorMsg
		} else if (error.message) {
			errorMsg = error.message
		}
		
		console.log('请求错误:', error)
		console.log('错误详情:', error.response)
		console.log('err' + error) // for debug
		
		uni.showToast({
			title: errorMsg,
			icon: "none",
			duration: 3000
		})
		
		return Promise.reject(error)
	}
)

export default service
