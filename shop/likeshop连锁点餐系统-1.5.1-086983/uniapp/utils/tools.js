import {
	baseURL
} from '@/config/app.js'

import store from '@/store'


//所在环境
let client = null
// #ifdef MP-WEIXIN
client = 1
// #endif

// #ifdef H5
client = isWeixinClient() ? 2 : 6
// #endif

// #ifdef APP-PLUS
client = 3;
uni.getSystemInfo({
	success: res => {
		client = res.platform == 'ios' ? 3 : 4;
	},
	fail: res => {
		client = 3
	}
})
// #endif
export { client }


//节流
export const trottle = (func, time = 1000, context) => {
	let previous = new Date(0).getTime()
	return function (...args) {
		let now = new Date().getTime()
		if (now - previous > time) {
			func.apply(context, args)
			previous = now
		}
	}
}


//防抖
export const debounce = (func, time = 1000, context) => {
	let timer = null
	return function (...args) {
		if (timer) {
			clearTimeout(timer)
		}
		timer = setTimeout(() => {
			timer = null
			func.apply(context, args)
		}, time)
	}
}


//判断是否为微信环境
export function isWeixinClient() {
	var ua = navigator.userAgent.toLowerCase();
	if (ua.match(/MicroMessenger/i) == "micromessenger") {
		//这是微信环境
		return true;
	} else {
		//这是非微信环境
		return false;
	}
}

//判断是否为安卓环境
export function isAndroid() {
	let u = navigator.userAgent;
	return u.indexOf('Android') > -1 || u.indexOf('Adr') > -1;
}

//获取url后的参数  以对象返回
export function strToParams(str) {
	var newparams = {}
	const arr = str.split('&')
	arr.forEach(item => {
		newparams[item.split('=')[0]] = item.split('=')[1]
	});
	// for (let item of str.split('&')) {
	// 	newparams[item.split('=')[0]] = item.split('=')[1]
	// }
	return newparams
}

//重写encodeURL函数
export function urlencode(str) {
	str = (str + '').toString();
	return encodeURIComponent(str).replace(/!/g, '%21').replace(/'/g, '%27').replace(/\(/g, '%28').
		replace(/\)/g, '%29').replace(/\*/g, '%2A').replace(/%20/g, '+');
}


//一维数组截取为二维数组

export function arraySlice(data, array = [], optNum = 10) {
	data = JSON.parse(JSON.stringify(data))
	if (data.length <= optNum) {
		data.length > 0 && array.push(data);
		return array;
	}
	array.push(data.splice(0, optNum));
	return arraySlice(data, array, optNum);
}

//对象参数转为以？&拼接的字符
export function paramsToStr(params) {
	let p = '';
	if (typeof params == 'object') {
		p = '?'
		for (let props in params) {
			p += `${props}=${params[props]}&`
		}
		p = p.slice(0, -1)
	}
	return p
}


// 获取wxml元素

export function getRect(selector, all, context) {
	return new Promise(function (resolve) {
		let qurey = uni.createSelectorQuery();

		if (context) {
			qurey = uni.createSelectorQuery().in(context);
		}

		qurey[all ? 'selectAll' : 'select'](selector).boundingClientRect(function (rect) {
			if (all && Array.isArray(rect) && rect.length) {
				resolve(rect);
			}
			if (!all && rect) {
				resolve(rect);
			}
		}).exec();
	});
}


// 轻提示
export function toast(info = {}, navigateOpt) {
	let title = info.title || ''
	let icon = info.icon || 'none'
	let endtime = info.endtime || 2000
	if (title) uni.showToast({
		title: title,
		icon: icon,
		duration: endtime
	})
	if (navigateOpt != undefined) {
		if (typeof navigateOpt == 'object') {
			let tab = navigateOpt.tab || 1,
				url = navigateOpt.url || '';
			switch (tab) {
				case 1:
					//跳转至 table
					setTimeout(function () {
						uni.switchTab({
							url: url
						})
					}, endtime);
					break;
				case 2:
					//跳转至非table页面
					setTimeout(function () {
						uni.navigateTo({
							url: url,
						})
					}, endtime);
					break;
				case 3:
					//返回上页面
					setTimeout(function () {
						uni.navigateBack({
							delta: parseInt(url),
						})
					}, endtime);
					break;
				case 4:
					//关闭当前所有页面跳转至非table页面
					setTimeout(function () {
						uni.reLaunch({
							url: url,
						})
					}, endtime);
					break;
				case 5:
					//关闭当前页面跳转至非table页面
					setTimeout(function () {
						uni.redirectTo({
							url: url,
						})
					}, endtime);
					break;
			}

		} else if (typeof navigateOpt == 'function') {
			setTimeout(function () {
				navigateOpt && navigateOpt();
			}, endtime);
		}
	}
}

//菜单跳转
export function menuJump(item) {
	const {
		is_tab,
		link,
		link_type
	} = item
	if (link == '') return false
	switch (link_type) {
		case 1:
			// 本地跳转
			if (is_tab) {
				uni.switchTab({
					url: link
				});
				return;
			}
			uni.navigateTo({
				url: link
			});
			break;

		case 2:
			// webview
			uni.navigateTo({
				url: "/pages/webview/webview?url=" + link
			});
			break;

		case 3: // tabbar

	}
}

export function uploadFile(path, options) {
	const {
		header,
		name
	} = options || {}
	return new Promise((resolve, reject) => {
		uni.uploadFile({
			url: baseURL + '/api/file/formimage',
			filePath: path,
			name: name || 'file',
			header: {
				token: store.getters.token,
				...header
			},
			fileType: 'image',
			cloudPath: '',
			success: res => {
				try {
					console.log(path)
					console.log('uploadFile res ==> ', res)
					let data = JSON.parse(res.data);

					if (data.code == 1) {
						resolve(data.data);
					} else {
						reject()
					}
				} catch (e) {
					console.log(e)
					reject()
				}
			},
			fail: (err) => {
				console.log(err)
				reject()
			}
		});
	});
}

//当前页面
export function currentPage() {
	let pages = getCurrentPages();
	let currentPage = pages[pages.length - 1];
	return currentPage || {};
}



// H5复制方法
export function copy(str) {
	// #ifdef H5
	let aux = document.createElement("input");
	aux.setAttribute("value", str);
	document.body.appendChild(aux);
	aux.select();
	document.execCommand("copy");
	document.body.removeChild(aux);
	uni.showToast({
		title: "复制成功",
	})
	// #endif

	// #ifndef H5
	uni.setClipboardData({
		data: str.toString(),
	})
	// #endif
}


// 格式化输出价格
export function formatPrice({
	price,
	take = 'all',
	prec = undefined
}) {
	let [integer, decimals = ''] = (price + '').split('.');

	// 小数位补
	if (prec !== undefined) {
		const LEN = decimals.length;
		for (let i = prec - LEN; i > 0; --i) decimals += '0'
		decimals = decimals.substr(0, prec)
	}

	switch (take) {
		case 'int':
			return integer;
		case 'dec':
			return decimals;
		case 'all':
			return integer + '.' + decimals;
	}
}


export function colorRgb(sColor) {
	sColor = sColor.toLowerCase();
	//十六进制颜色值的正则表达式
	var reg = /^#([0-9a-fA-f]{3}|[0-9a-fA-f]{6})$/;
	// 如果是16进制颜色
	if (sColor && reg.test(sColor)) {
		if (sColor.length === 4) {
			var sColorNew = "#";
			for (var i = 1; i < 4; i += 1) {
				sColorNew += sColor.slice(i, i + 1).concat(sColor.slice(i, i + 1));
			}
			sColor = sColorNew;
		}
		//处理六位的颜色值
		var sColorChange = [];
		for (var i = 1; i < 7; i += 2) {
			sColorChange.push(parseInt("0x" + sColor.slice(i, i + 2)));
		}
		return sColorChange.join(",");
	}
	return sColor;
};

/**
 * @description jsonp请求跨域地址
 * @param  { Object } url 请求地址
 * @param  { Object } data 请求参数
 */
export const jsonp = (url, data) => {
	// #ifdef H5
	return new Promise((resolve, reject) => {
		// 1.初始化url
		let dataString = url.indexOf('?') === -1 ? '?' : '&'
		let callbackName = `jsonpCB_${Date.now()}`;
		url += `${dataString}callback=${callbackName}`
		if (data) {

			// 2.有请求参数，依次添加到url
			for (let k in data) {
				url += `&${k}=${data[k]}`
			}
		}
		let scriptNode = document.createElement('script');
		scriptNode.src = url;
		// 3. callback
		window[callbackName] = (result) => {
			result ? resolve(result) : reject('没有返回数据');
			delete window[callbackName];
			document.body.removeChild(scriptNode);
		}
		// 4. 异常情况
		scriptNode.addEventListener('error', () => {
			reject('接口返回数据失败');
			delete window[callbackName];
			document.body.removeChild(scriptNode);
		}, false)
		// 5. 开始请求
		document.body.appendChild(scriptNode)
	})
	// #endif
}