
import wechath5 from './wechath5'
import {
	currentPage,
	isWeixinClient
} from './tools'
export function wxpay(opt) {
	//#ifdef  H5
	if (isWeixinClient()) {
		return wechath5.wxPay(opt)
	} else {
		console.log(opt)
		location.href = opt
	}
	// #endif
	//#ifndef H5
	return new Promise((resolve, reject) => {
		// #ifdef MP-WEIXIN
		const params = {
			timeStamp: opt.timeStamp,
			// 支付签名时间戳，注意微信jssdk中的所有使用timestamp字段均为小写。但最新版的支付后台生成签名使用的timeStamp字段名需大写其中的S字符
			nonceStr: opt.nonceStr,
			// 支付签名随机串，不长于 32 位
			package: opt.package,
			// 统一支付接口返回的prepay_id参数值，提交格式如：prepay_id=***）
			signType: opt.signType,
			// 签名方式，默认为'SHA1'，使用新版支付需传入'MD5'
			paySign: opt.paySign,
		}
		// #endif
		// #ifdef APP-PLUS
		const params = {
			orderInfo: opt
		}
		// #endif
		console.log(params)
		uni.requestPayment({
			provider: 'wxpay',
			...params,
			success: res => {
				resolve('success');
			},
			cancel: res => {
				resolve('fail');
			},
			fail: res => {
				resolve('fail');
			}
		});
	});
	// #endif
}


export function alipay(opt) {

	//#ifdef  H5
	const alipayPage = window.open('', '_self')
	alipayPage.document.body.innerHTML = opt.data
	alipayPage.document.forms[0].submit()
	return
	// #endif
	// #ifdef APP-PLUS
	return new Promise((resolve, reject) => {
		const params = {
			orderInfo: opt
		}
		console.log(params)
		uni.requestPayment({
			provider: 'alipay',
			...params,
			success: res => {
				resolve('success');
			},
			cancel: res => {
				console.log(res)
				resolve('fail');
			},
			fail: res => {
				console.log(res)
				resolve('fail');
			}
		});
	})
	// #endif

}
