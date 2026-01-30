/**
 * HTTP 代理请求助手
 * 通过固定 IP 服务器转发微信支付 API 请求
 */

class HttpProxyHelper {
	constructor(proxyConfig) {
		this.proxyConfig = proxyConfig || {
			host: '115.159.35.33',  // 您的服务器 IP
			port: 8888,              // 代理服务端口
			protocol: 'http'         // 代理协议
		};
	}

	/**
	 * 通过代理发送 HTTP 请求
	 * @param {Object} options 请求配置
	 * @param {string} options.url 目标 URL
	 * @param {string} options.method 请求方法
	 * @param {Object} options.headers 请求头
	 * @param {string|Object} options.data 请求数据
	 * @param {string} options.dataType 数据类型 json/text/xml
	 * @returns {Promise} 请求结果
	 */
	async request(options) {
		const {
			url,
			method = 'GET',
			headers = {},
			data,
			dataType = 'json'
		} = options;

		try {
			console.log('🔄 通过代理服务器发送请求:', {
				proxy: `${this.proxyConfig.protocol}://${this.proxyConfig.host}:${this.proxyConfig.port}`,
				target: url,
				method
			});

			// 构建代理请求
			const proxyUrl = `${this.proxyConfig.protocol}://${this.proxyConfig.host}:${this.proxyConfig.port}/proxy`;
			
			const requestConfig = {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					...headers
				},
				dataType: 'json',
				data: {
					target_url: url,
					target_method: method,
					target_headers: headers,
					target_data: data,
					response_type: dataType
				}
			};

			// 使用 uniCloud.httpclient 发送请求到代理服务器
			const result = await uniCloud.httpclient.request(proxyUrl, requestConfig);

			console.log('✅ 代理请求成功');
			
			return result;

		} catch (err) {
			console.error('❌ 代理请求失败:', err);
			throw err;
		}
	}

	/**
	 * 通过代理发送微信支付 API 请求
	 * @param {Object} options 微信支付请求配置
	 * @returns {Promise} 请求结果
	 */
	async wxpayRequest(options) {
		const {
			url,
			method = 'POST',
			data,
			headers = {}
		} = options;

		// 添加微信支付通用请求头
		const wxHeaders = {
			'Content-Type': 'application/xml',
			'User-Agent': 'uniCloud-wxpay',
			...headers
		};

		return await this.request({
			url,
			method,
			headers: wxHeaders,
			data,
			dataType: 'text'
		});
	}

	/**
	 * 通过代理发送微信支付 V3 API 请求
	 * @param {Object} options 微信支付 V3 请求配置
	 * @returns {Promise} 请求结果
	 */
	async wxpayV3Request(options) {
		const {
			url,
			method = 'POST',
			data,
			headers = {}
		} = options;

		// 添加微信支付 V3 通用请求头
		const wxV3Headers = {
			'Content-Type': 'application/json',
			'Accept': 'application/json',
			'User-Agent': 'uniCloud-wxpay-v3',
			...headers
		};

		return await this.request({
			url,
			method,
			headers: wxV3Headers,
			data,
			dataType: 'json'
		});
	}
}

module.exports = HttpProxyHelper;
