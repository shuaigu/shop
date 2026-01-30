/**
 * 砍价返现处理模块（使用微信支付V3 API）
 * 商家转账到零钱 - 新版API
 */

const crypto = require('crypto');
const configData = require('./cashback-config.js');

class CashbackHandlerV3 {
	constructor(useProxy = true, proxyConfig = null) {
		// 微信支付V3配置（从配置文件加载）
		this.config = {
			appid: configData.appid,
			mchid: configData.mchid,
			serial_no: configData.serial_no,
			apiv3_key: configData.apiv3_key,
			private_key: configData.private_key,
			transfer_scene_id: configData.transfer_scene_id || '1001'
		};
		
		// 平台证书（从配置文件加载）
		this.platform_cert = configData.platform_cert;
		
		// 代理配置
		this.useProxy = useProxy;
		this.proxyConfig = proxyConfig || {
			host: '115.159.35.33',
			port: 8889,
			protocol: 'http'
		};
		
		console.log('✅ 商家转账V3配置已加载');
		console.log('   商户号:', this.config.mchid);
		console.log('   证书序列号:', this.config.serial_no);
		console.log('   转账场景:', this.config.transfer_scene_id);
		if (this.useProxy) {
			console.log('   使用代理: ' + this.proxyConfig.protocol + '://' + this.proxyConfig.host + ':' + this.proxyConfig.port);
		}
	}

	/**
	 * 处理单次砍价返现
	 * @param {Object} params 返现参数
	 * @param {string} params.bargain_record_id 砍价记录ID
	 * @param {string} params.user_id 用户ID（小组长）
	 * @param {string} params.openid 用户openid
	 * @param {number} params.amount 返现金额（元）
	 * @param {string} params.desc 返现描述
	 * @param {string} params.user_name 用户真实姓名（可选）
	 * @returns {Object} 返现结果
	 */
	async processCashback(params) {
		const { bargain_record_id, user_id, openid, amount, desc, user_name } = params;

		try {
			console.log('开始处理返现（V3 API）:', params);

			// 参数验证
			if (!openid || !amount || amount <= 0) {
				return {
					success: false,
					message: '参数不完整或金额无效'
				};
			}

			// 金额转换为分
			const amountInFen = Math.round(amount * 100);

			// 调用微信商家转账API
			const result = await this.transferToBalance({
				openid,
				amount: amountInFen,
				desc: desc || '砍价返现',
				user_name: user_name || null
			});

			if (result.success) {
				// 返现成功，更新数据库记录
				const db = uniCloud.database();
				await db.collection('kanjia').doc(bargain_record_id).update({
					cashback_status: 1, // 已返现
					cashback_time: Date.now(),
					transaction_id: result.detail_id || result.out_detail_no
				});

				console.log('返现成功（V3）:', {
					user_id,
					amount,
					detail_id: result.detail_id,
					out_detail_no: result.out_detail_no
				});

				return {
					success: true,
					message: '返现成功',
					detail_id: result.detail_id,
					out_detail_no: result.out_detail_no
				};
			} else {
				// 返现失败，标记失败状态
				const db = uniCloud.database();
				await db.collection('kanjia').doc(bargain_record_id).update({
					cashback_status: 2, // 返现失败
					cashback_error: result.message
				});

				console.error('返现失败（V3）:', result.message);

				return {
					success: false,
					message: result.message
				};
			}

		} catch (err) {
			console.error('返现处理异常（V3）:', err);
			return {
				success: false,
				message: '返现处理异常: ' + err.message
			};
		}
	}

	/**
	 * 调用微信商家转账API（V3）
	 * @param {Object} params
	 * @param {string} params.openid 用户openid
	 * @param {number} params.amount 金额（分）
	 * @param {string} params.desc 描述
	 * @param {string} params.user_name 用户真实姓名（可选，校验姓名时需要）
	 * @returns {Object} 转账结果
	 */
	async transferToBalance(params) {
		const { openid, amount, desc, user_name } = params;

		try {
			// 验证金额（根据您的配置：10分-50000分）
			if (amount < 10) {
				return {
					success: false,
					message: '单笔金额不能少于0.10元（10分）'
				};
			}

			if (amount > 50000) {
				return {
					success: false,
					message: '单笔金额不能超过500元（50000分）'
				};
			}

			// 生成商家批次单号（唯一）
			const out_batch_no = this.generateBatchNo();
			// 生成商家明细单号（唯一）
			const out_detail_no = this.generateDetailNo();

			// 构建请求参数
			const requestData = {
				appid: this.config.appid, // 小程序appid
				out_batch_no: out_batch_no, // 商家批次单号
				batch_name: '砍价返现', // 批次名称
				batch_remark: '砍价活动返现', // 批次备注
				total_amount: amount, // 转账总金额（分）
				total_num: 1, // 转账总笔数
				transfer_detail_list: [
					{
						out_detail_no: out_detail_no, // 商家明细单号
						transfer_amount: amount, // 转账金额（分）
						transfer_remark: desc, // 转账备注
						openid: openid, // 用户openid
						user_name: user_name ? this.encryptData(user_name) : undefined // 用户姓名（加密，可选）
					}
				],
				transfer_scene_id: this.config.transfer_scene_id // 转账场景ID（从配置读取）
			};

			console.log('商家转账请求参数（V3）:', {
				batch_no: out_batch_no,
				detail_no: out_detail_no,
				openid: openid,
				amount: amount / 100 + '元',
				desc: desc
			});

			// 调用API
			const url = 'https://api.mch.weixin.qq.com/v3/transfer/batches';
			const response = await this.makeRequestV3(url, 'POST', requestData);

			// 解析响应
			if (response.batch_id) {
				console.log('✅ 商家转账成功（V3）:', {
					batch_id: response.batch_id,
					out_batch_no: response.out_batch_no,
					create_time: response.create_time
				});

				return {
					success: true,
					batch_id: response.batch_id,
					out_batch_no: response.out_batch_no,
					detail_id: response.transfer_detail_list?.[0]?.detail_id,
					out_detail_no: out_detail_no
				};
			} else {
				const errorMsg = response.message || response.err_code_des || '转账失败';
				console.error('❌ 商家转账失败（V3）:', response);

				return {
					success: false,
					message: errorMsg,
					code: response.code
				};
			}

		} catch (err) {
			console.error('调用商家转账API异常（V3）:', err);
			return {
				success: false,
				message: '调用API异常: ' + err.message
			};
		}
	}

	/**
	 * 发送HTTPS请求（V3 API签名）
	 * @param {string} url 请求地址
	 * @param {string} method 请求方法
	 * @param {Object} data 请求数据
	 * @returns {Object} 响应内容
	 */
	async makeRequestV3(url, method, data) {
		const timestamp = Math.floor(Date.now() / 1000);
		const nonce_str = this.generateNonceStr();
		const body = method === 'GET' ? '' : JSON.stringify(data);

		// 构建签名串
		const signStr = this.buildSignString(method, url, timestamp, nonce_str, body);
		
		// 生成签名
		const signature = this.signV3(signStr);

		// 构建Authorization请求头
		const authorization = this.buildAuthorizationHeader(
			this.config.mchid,
			this.config.serial_no,
			timestamp,
			nonce_str,
			signature
		);

		const headers = {
			'Authorization': authorization,
			'Accept': 'application/json',
			'Content-Type': 'application/json',
			'User-Agent': 'uniCloud-CashbackSystem/1.0'
		};

		// 根据配置决定是否使用代理
		if (this.useProxy) {
			console.log('🔄 通过代理服务器发送请求:', url);
			return await this.makeProxyRequest(url, method, body, headers);
		} else {
			// 直接发送请求
			const result = await uniCloud.httpclient.request(url, {
				method: method,
				data: body,
				contentType: 'application/json',
				dataType: 'json',
				headers: headers,
				sslVerify: true
			});

			return result.data;
		}
	}

	/**
	 * 通过代理服务器发送请求
	 * @param {string} url 目标URL
	 * @param {string} method 请求方法
	 * @param {string} body 请求体
	 * @param {Object} headers 请求头
	 * @returns {Object} 响应内容
	 */
	async makeProxyRequest(url, method, body, headers) {
		try {
			const proxyUrl = `${this.proxyConfig.protocol}://${this.proxyConfig.host}:${this.proxyConfig.port}/proxy`;
			
			console.log('代理请求配置:', {
				proxy: proxyUrl,
				target: url,
				method: method
			});

			const proxyRequestData = {
				target_url: url,
				target_method: method,
				target_headers: headers,
				target_data: body,
				response_type: 'json'
			};

			const result = await uniCloud.httpclient.request(proxyUrl, {
				method: 'POST',
				data: proxyRequestData,
				contentType: 'application/json',
				dataType: 'json',
				headers: {
					'Content-Type': 'application/json'
				}
			});

			if (result.data && result.data.success) {
				console.log('✅ 代理请求成功');
				return result.data.data;
			} else {
				const errorMsg = result.data?.error || '代理请求失败';
				console.error('❌ 代理请求失败:', errorMsg);
				throw new Error(errorMsg);
			}

		} catch (err) {
			console.error('代理请求异常:', err);
			throw err;
		}
	}

	/**
	 * 构建签名串（V3规则）
	 * @param {string} method HTTP方法
	 * @param {string} url 请求URL
	 * @param {number} timestamp 时间戳
	 * @param {string} nonce_str 随机字符串
	 * @param {string} body 请求体
	 * @returns {string} 签名串
	 */
	buildSignString(method, url, timestamp, nonce_str, body) {
		const urlObj = new URL(url);
		const canonical_url = urlObj.pathname + urlObj.search;
		
		return `${method}
${canonical_url}
${timestamp}
${nonce_str}
${body}
`;
	}

	/**
	 * V3签名（SHA256-RSA）
	 * @param {string} signStr 签名串
	 * @returns {string} Base64签名
	 */
	signV3(signStr) {
		const sign = crypto.createSign('RSA-SHA256');
		sign.update(signStr);
		return sign.sign(this.config.private_key, 'base64');
	}

	/**
	 * 构建Authorization请求头
	 */
	buildAuthorizationHeader(mchid, serial_no, timestamp, nonce_str, signature) {
		return `WECHATPAY2-SHA256-RSA2048 mchid="${mchid}",nonce_str="${nonce_str}",signature="${signature}",timestamp="${timestamp}",serial_no="${serial_no}"`;
	}

	/**
	 * 加密敏感信息（使用平台公钥）
	 * @param {string} data 明文数据
	 * @returns {string} 加密后的Base64字符串
	 */
	encryptData(data) {
		// 使用平台证书公钥加密
		const encrypted = crypto.publicEncrypt(
			{
				key: this.platform_cert,
				padding: crypto.constants.RSA_PKCS1_OAEP_PADDING
			},
			Buffer.from(data)
		);
		return encrypted.toString('base64');
	}

	/**
	 * 生成批次单号
	 */
	generateBatchNo() {
		return 'BATCH' + Date.now() + Math.random().toString(36).substr(2, 6).toUpperCase();
	}

	/**
	 * 生成明细单号
	 */
	generateDetailNo() {
		return 'DETAIL' + Date.now() + Math.random().toString(36).substr(2, 6).toUpperCase();
	}

	/**
	 * 生成随机字符串
	 */
	generateNonceStr() {
		return crypto.randomBytes(16).toString('hex');
	}

	/**
	 * 批量处理待返现的砍价记录
	 */
	async processPendingCashbacks() {
		const db = uniCloud.database();

		try {
			// 查询待返现的记录
			const pendingRecords = await db.collection('kanjia')
				.where({
					cashback_status: 0,
					cashback_amount: db.command.gt(0)
				})
				.limit(50)
				.get();

			console.log(`找到 ${pendingRecords.data.length} 条待返现记录（V3）`);

			const results = [];

			for (const record of pendingRecords.data) {
				// 获取用户openid
				const userRes = await db.collection('uni-id-users')
					.doc(record.initiator_id)
					.field({ wx_openid: true })
					.get();

				if (!userRes.data || !userRes.data.length || !userRes.data[0].wx_openid) {
					console.warn(`用户 ${record.initiator_id} 没有openid，跳过返现`);
					continue;
				}

				const openid = userRes.data[0].wx_openid[0];

				// 处理返现
				const result = await this.processCashback({
					bargain_record_id: record._id,
					user_id: record.initiator_id,
					openid: openid,
					amount: record.cashback_amount,
					desc: '砍价返现'
				});

				results.push({
					record_id: record._id,
					user_id: record.initiator_id,
					result: result
				});

				// 避免请求过快，延迟200ms
				await new Promise(resolve => setTimeout(resolve, 200));
			}

			return {
				success: true,
				processed: results.length,
				results: results
			};

		} catch (err) {
			console.error('批量处理返现失败（V3）:', err);
			return {
				success: false,
				message: err.message
			};
		}
	}

	/**
	 * 查询转账明细
	 * @param {string} out_detail_no 商家明细单号
	 * @returns {Object} 转账明细
	 */
	async queryTransferDetail(out_batch_no, out_detail_no) {
		try {
			const url = `https://api.mch.weixin.qq.com/v3/transfer/batches/batch-id/${out_batch_no}/details/detail-id/${out_detail_no}`;
			const response = await this.makeRequestV3(url, 'GET', null);
			
			return {
				success: true,
				data: response
			};
		} catch (err) {
			return {
				success: false,
				message: err.message
			};
		}
	}
}

module.exports = {
	CashbackHandlerV3
};
