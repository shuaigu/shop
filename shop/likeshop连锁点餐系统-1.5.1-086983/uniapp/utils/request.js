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
		uni.showToast({
			title: "系统错误",
			icon: "none"
		})
		console.log(error)
		console.log('err' + error) // for debug
		return Promise.reject(error)
	}
)

export default service
