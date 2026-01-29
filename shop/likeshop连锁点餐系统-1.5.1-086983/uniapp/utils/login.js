import {
	silentLogin
} from '@/api/app';
import {
	currentPage,
	trottle
} from './tools'
import store from '@/store'
import Cache from './cache'
import {
	BACK_URL,
	INVITE_CODE
} from '@/config/cachekey'
import {bindSuperior} from '@/api/user'
import wechath5 from './wechath5'
import {router} from '@/router'

// 获取登录凭证（code
export function getWxCode() {
	return new Promise((resolve, reject) => {
		uni.login({
			success(res) {
				resolve(res.code);
			},
			fail(res) {
				reject(res);
			}

		});
	});
}

//小程序获取用户信息
export function getUserProfile() {
	return new Promise((resolve, reject) => {
		uni.getUserProfile({
			desc: '获取用户信息，完善用户资料 ',
			success: (res) => {
				resolve(res);
			},
			fail(res) {}

		})
	})
}

//小程序静默授权
export async function wxMnpLogin() {
	const code = await getWxCode()
	const {
		code: loginCode,
		data: loginData
	} = await silentLogin({
		code
	})
	const {
		options,
		onLoad,
		onShow,
		route
	} = currentPage()
	if (loginCode != 1) return
	if (loginData.token && !loginData.is_new_user) {
		store.commit('login', loginData)
		// 刷新页面
		onLoad && onLoad(options)
		onShow && onShow()
	}
}

export const toLogin = trottle(_toLogin, 1000)
function _toLogin() {
	//#ifdef  MP-WEIXIN
	wxMnpLogin()
	// #endif
	//#ifndef MP-WEIXIN
	const {currentRoute} = router
	if(currentRoute.meta.auth) {
		router.push('/pages/login/login')
	}
	// #endif
} 