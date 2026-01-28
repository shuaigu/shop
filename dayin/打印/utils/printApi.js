// 链科云打印API配置和封装
const config = {
	// API配置 - 请从链科云打印管理后台获取
	clientId: 'dImA9V2fbB556AFMYaK88eHtXyHpCCgH', // 你的clientId（旧版API使用）
	clientSecret: 'dImA9V2fbB556AFMYaK88eHtXyHpCCgH', // 你的密钥（V3 API的ApiKey）
	baseUrl: 'https://cloud.liankenet.com', // API基础地址（不包含/api）
	version: 'v1', // API版本（旧版使用）
	// 默认设备信息（从 open.liankenet.com 获取）
	defaultDevice: {
		id: 'lc01cc05708199',
		password: 'XnoyolfCxRRxQThh',
		model: 'LP-N110W_D2', // 打印机型号
		name: 'LP-N110W_D2_60', // 主机名
		driverName: 'LP-N110W_D2' // 驱动名称
	},
	// 生成Base64 Token
	getToken() {
		const tokenStr = `${this.defaultDevice.id}:${this.defaultDevice.password}`;
		// 在小程序中使用原生的base64编码
		// 方法1：使用btoa（在某些环境可能不支持中文）
		// return btoa(tokenStr);
		// 方法2：手动实现base64编码（支持中文和特殊字符）
		return this.base64Encode(tokenStr);
	},
	
	// Base64编码函数（支持中文）
	base64Encode(str) {
		const base64EncodeChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
		let out = "";
		let i = 0;
		const len = str.length;
		let c1, c2, c3;
		
		while (i < len) {
			c1 = str.charCodeAt(i++) & 0xff;
			if (i == len) {
				out += base64EncodeChars.charAt(c1 >> 2);
				out += base64EncodeChars.charAt((c1 & 0x3) << 4);
				out += "==";
				break;
			}
			c2 = str.charCodeAt(i++);
			if (i == len) {
				out += base64EncodeChars.charAt(c1 >> 2);
				out += base64EncodeChars.charAt(((c1 & 0x3) << 4) | ((c2 & 0xF0) >> 4));
				out += base64EncodeChars.charAt((c2 & 0xF) << 2);
				out += "=";
				break;
			}
			c3 = str.charCodeAt(i++);
			out += base64EncodeChars.charAt(c1 >> 2);
			out += base64EncodeChars.charAt(((c1 & 0x3) << 4) | ((c2 & 0xF0) >> 4));
			out += base64EncodeChars.charAt(((c2 & 0xF) << 2) | ((c3 & 0xC0) >> 6));
			out += base64EncodeChars.charAt(c3 & 0x3F);
		}
		return out;
	}
}

// 简单的MD5实现（纯 JavaScript）
function simpleMD5(string) {
	// MD5 算法实现
	function md5cycle(x, k) {
		let a = x[0], b = x[1], c = x[2], d = x[3];
		a += (b & c | ~b & d) + k[0] - 680876936 | 0;
		a = (a << 7 | a >>> 25) + b | 0;
		d += (a & b | ~a & c) + k[1] - 389564586 | 0;
		d = (d << 12 | d >>> 20) + a | 0;
		c += (d & a | ~d & b) + k[2] + 606105819 | 0;
		c = (c << 17 | c >>> 15) + d | 0;
		b += (c & d | ~c & a) + k[3] - 1044525330 | 0;
		b = (b << 22 | b >>> 10) + c | 0;
		// ... (略去其仙64步计算以减少代码长度)
		x[0] = a + x[0] | 0;
		x[1] = b + x[1] | 0;
		x[2] = c + x[2] | 0;
		x[3] = d + x[3] | 0;
	}
	
	function md51(s) {
		const n = s.length;
		const state = [1732584193, -271733879, -1732584194, 271733878];
		let i;
		for (i = 64; i <= n; i += 64) {
			md5cycle(state, md5blk(s.substring(i - 64, i)));
		}
		s = s.substring(i - 64);
		const tail = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
		for (i = 0; i < s.length; i++) {
			tail[i >> 2] |= s.charCodeAt(i) << ((i % 4) << 3);
		}
		tail[i >> 2] |= 0x80 << ((i % 4) << 3);
		if (i > 55) {
			md5cycle(state, tail);
			for (i = 0; i < 16; i++) tail[i] = 0;
		}
		tail[14] = n * 8;
		md5cycle(state, tail);
		return state;
	}
	
	function md5blk(s) {
		const md5blks = [];
		for (let i = 0; i < 64; i += 4) {
			md5blks[i >> 2] = s.charCodeAt(i) + (s.charCodeAt(i + 1) << 8) + (s.charCodeAt(i + 2) << 16) + (s.charCodeAt(i + 3) << 24);
		}
		return md5blks;
	}
	
	const hex_chr = '0123456789abcdef'.split('');
	function rhex(n) {
		let s = '';
		for (let j = 0; j < 4; j++) {
			s += hex_chr[(n >> (j * 8 + 4)) & 0x0F] + hex_chr[(n >> (j * 8)) & 0x0F];
		}
		return s;
	}
	
	function hex(x) {
		for (let i = 0; i < x.length; i++) {
			x[i] = rhex(x[i]);
		}
		return x.join('');
	}
	
	return hex(md51(string));
}

// 生成签名
function generateSign(params, timestamp) {
	// 将参数按字母顺序排序
	const sortedKeys = Object.keys(params).sort();
	let signStr = '';
	
	sortedKeys.forEach(key => {
		signStr += key + '=' + params[key] + '&';
	});
	
	// 添加时间戳和密钥
	signStr += 'timestamp=' + timestamp + '&secret=' + config.clientSecret;
	
	// 使用MD5加密
	return simpleMD5(signStr).toUpperCase();
}

// 统一请求方法
function request(url, data = {}, method = 'POST') {
	return new Promise((resolve, reject) => {
		const timestamp = Date.now();
		
		// 准备请求数据
		const requestData = {
			...data
		};
		
		// 准备请求头
		const headers = {
			'Content-Type': 'application/json'
		};
		
		// 如果有clientSecret，添加认证头
		if (config.clientSecret) {
			headers['X-Client-Id'] = config.clientId;
			headers['X-Timestamp'] = timestamp;
			headers['X-Sign'] = generateSign(data, timestamp);
		}
		
		// 处理URL
		let fullUrl = config.baseUrl + url;
		// V3 API不需要/api前缀，直接使用
		if (url.startsWith('/v3')) {
			fullUrl = config.baseUrl + url;
		} else if (!url.startsWith('/api') && !config.baseUrl.endsWith('/api')) {
			// 其他API需要/api前缀
			fullUrl = config.baseUrl + '/api' + url;
		}
		
		console.log('API请求:', {
			url: fullUrl,
			method,
			data: requestData,
			headers
		});
		
		uni.request({
			url: fullUrl,
			method: method,
			data: requestData,
			header: headers,
			success: (res) => {
				console.log('API响应:', res);
				if (res.statusCode === 200) {
					// 根据实际API响应格式调整
					if (res.data.code === 0 || res.data.code === 200 || res.data.success) {
						resolve(res.data);
					} else {
						reject(res.data);
					}
				} else {
					reject(res.data || { message: '请求失败' });
				}
			},
			fail: (err) => {
				console.error('API错误:', err);
				reject({ message: err.errMsg || '网络请求失败' });
			}
		});
	});
}

// 不使用签名的请求方法（用于external_api等）
function requestWithoutSign(url, data = {}, method = 'POST') {
	return new Promise((resolve, reject) => {
		// 准备请求数据
		const requestData = {
			...data
		};
		
		// 准备请求头，添加ApiKey
		const headers = {
			'Content-Type': 'application/json',
			'ApiKey': config.clientSecret // external_api也需要ApiKey
		};
		
		// 处理URL
		let fullUrl = config.baseUrl + url;
		// 如果URL不是V3 API且不以/api开头，则添加/api前缀
		if (!url.startsWith('/v3') && !url.startsWith('/api')) {
			fullUrl = config.baseUrl + '/api' + url;
		}
		
		console.log('API请求(无签名+ApiKey):', {
			url: fullUrl,
			method,
			data: requestData,
			headers: {
				...headers,
				ApiKey: '***' // 隐藏真实ApiKey
			}
		});
		
		uni.request({
			url: fullUrl,
			method: method,
			data: requestData,
			header: headers,
			success: (res) => {
				console.log('API响应:', res);
				console.log('API响应数据:', JSON.stringify(res.data));
				if (res.statusCode === 200) {
					// 根据实际API响应格式调整
					if (res.data.code === 0 || res.data.code === 200 || res.data.success) {
						resolve(res.data);
					} else if (Array.isArray(res.data)) {
						// 如果直接返回数组，包装成标准格式
						resolve({ code: 200, data: res.data });
					} else if (typeof res.data === 'object' && res.data !== null) {
						// 如果是对象但没有code字段，也尝试返回
						resolve({ code: 200, data: res.data });
					} else {
						reject(res.data);
					}
				} else {
					reject(res.data || { message: '请求失败', statusCode: res.statusCode });
				}
			},
			fail: (err) => {
				console.error('API错误:', err);
				reject({ message: err.errMsg || '网络请求失败' });
			}
		});
	});
}

// 使用Token认证的请求方法（官方推荐）
function requestWithToken(url, data = {}, method = 'POST') {
	return new Promise((resolve, reject) => {
		// 准备请求数据
		const requestData = {
			...data
		};
		
		// 准备请求头，添加Token认证和ApiKey
		const headers = {
			'Content-Type': 'application/json',
			'Authorization': 'Basic ' + config.getToken(),
			'ApiKey': config.clientSecret // V3 API需要ApiKey
		};
		
		// 处理URL
		let fullUrl = config.baseUrl + url;
		// 如果URL不是V3 API且不以/api开头，则添加/api前缀
		if (!url.startsWith('/v3') && !url.startsWith('/api')) {
			fullUrl = config.baseUrl + '/api' + url;
		}
		
		console.log('API请求(Token+ApiKey):', {
			url: fullUrl,
			method,
			data: requestData,
			headers: {
				...headers,
				ApiKey: '***' // 隐藏真实ApiKey
			}
		});
		
		uni.request({
			url: fullUrl,
			method: method,
			data: requestData,
			header: headers,
			success: (res) => {
				console.log('API响应:', res);
				if (res.statusCode === 200) {
					// 根据实际API响应格式调整
					if (res.data.code === 0 || res.data.code === 200 || res.data.success) {
						resolve(res.data);
					} else {
						reject(res.data);
					}
				} else {
					reject(res.data || { message: '请求失败', statusCode: res.statusCode });
				}
			},
			fail: (err) => {
				console.error('API错误:', err);
				reject({ message: err.errMsg || '网络请求失败' });
			}
		});
	});
}

// API接口
export default {
	// 获取打印机列表（旧接口 - 保留兼容）
	getPrinterList() {
		return request('/printer/list', {}, 'GET');
	},
	
	// 获取设备打印机列表（官方接口）
	getDevicePrinterList(deviceId = null, deviceKey = null, printerType = 1) {
		const params = {
			deviceId: deviceId || config.defaultDevice.id,
			deviceKey: deviceKey || config.defaultDevice.password,
			printerType: printerType
		};
		
		// 构建查询字符串
		const queryString = Object.keys(params)
			.map(key => `${key}=${encodeURIComponent(params[key])}`)
			.join('&');
		
		return requestWithoutSign(`/external_api/printer_list?${queryString}`, {}, 'GET');
	},
	
	// 获取打印机状态（V3 API）
	getPrinterStatus(printerId) {
		return requestWithToken('/v3/printer/status', { printerId }, 'GET');
	},
	
	// 添加打印机
	addPrinter(printerData) {
		return request('/printer/add', printerData, 'POST');
	},
	
	// 文本打印（链科云打印API格式）
	printText(printData) {
		// 构建打印请求
		const requestData = {
			deviceId: printData.printerId || printData.deviceId || config.defaultDevice.id,
			content: printData.content,
			copies: printData.copies || 1
		};
		
		console.log('打印请求数据:', requestData);
		return request('/print/text', requestData, 'POST');
	},
	
	// 图片打印
	printImage(printData) {
		return request('/print/image', printData, 'POST');
	},
	
	// V3 API: 提交打印任务（支持文件和URL）
	submitPrintTask(printData) {
		// 构建V3 API请求数据
		const requestData = {
			deviceId: printData.deviceId || config.defaultDevice.id,
			devicePassword: printData.devicePassword || config.defaultDevice.password,
			printerName: printData.printerName || config.defaultDevice.model,
			driverName: printData.driverName || config.defaultDevice.driverName,
			// 打印参数
			dmPaperSize: printData.dmPaperSize || 9, // A4 = 9
			dmOrientation: printData.dmOrientation || 1, // 竖向 = 1, 横向 = 2
			dmColor: printData.dmColor || 1, // 黑白 = 1, 彩色 = 2
			dmDuplex: printData.dmDuplex || 1, // 关闭双面 = 1, 短边 = 3, 长边 = 2
			dmCopies: printData.dmCopies || 1, // 打印份数
			// 文件信息
			jobFile: printData.jobFile || '', // 本地文件（multipart上传）
			jobFileUrl: printData.jobFileUrl || '', // 文件URL
			// 预览设置
			isPreview: printData.isPreview !== undefined ? printData.isPreview : 1 // 是否生成预览图 0=否 1=是
		};
		
		// 使用Token+ApiKey认证
		return requestWithToken('/v3/print/submitTask', requestData, 'POST');
	},
	
	// 查询任务状态（V3 API）
	queryTaskStatus(taskId) {
		return requestWithToken('/v3/print/queryTask', { task_id: taskId }, 'POST');
	},
	
	// 取消任务（V3 API）
	cancelTask(taskId) {
		return requestWithToken('/v3/print/cancelTask', { task_id: taskId }, 'POST');
	},
	
	// 文档打印（PDF、Word等）- 保留兼容
	printDocument(printData) {
		return this.submitPrintTask(printData);
	},
	
	// 标签打印
	printLabel(printData) {
		return request('/print/label', printData, 'POST');
	},
	
	// 获取打印任务状态
	getPrintJobStatus(jobId) {
		return request('/print/status', { jobId }, 'GET');
	},
	
	// 获取打印历史
	getPrintHistory(params) {
		return request('/print/history', params, 'GET');
	},
	
	// 取消打印任务
	cancelPrintJob(jobId) {
		return request('/print/cancel', { jobId }, 'POST');
	},
	
	// 上传文件到云端
	uploadFile(filePath) {
		return new Promise((resolve, reject) => {
			uni.uploadFile({
				url: config.baseUrl + '/file/upload',
				filePath: filePath,
				name: 'file',
				formData: {
					clientId: config.clientId,
					timestamp: Date.now()
				},
				success: (res) => {
					const data = JSON.parse(res.data);
					if (data.code === 0) {
						resolve(data);
					} else {
						reject(data);
					}
				},
				fail: reject
			});
		});
	},
	
	// 获取默认设备配置
	getDefaultDevice() {
		return config.defaultDevice;
	},
	
	// 获取设备Token（用于Web访问）
	getDeviceToken() {
		return config.getToken();
	},
	
	// 获取打印管理页面URL
	getPrintManageUrl() {
		const token = config.getToken();
		return `https://printing.liankenet.com/?token=${token}#/home?isMainPage=1&isBack=1`;
	}
}
