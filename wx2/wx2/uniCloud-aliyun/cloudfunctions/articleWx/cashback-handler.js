/**
 * 砍价返现处理模块
 * 用于处理微信企业付款到零钱
 */

const crypto = require('crypto');

class CashbackHandler {
	constructor() {
		// 微信支付配置（需要在实际使用时配置）
		this.config = {
			appid: '', // 小程序APPID
			mch_id: '', // 商户号
			api_key: '', // API密钥
			// cert_path: '', // API证书路径（企业付款需要）
			// key_path: '', // API证书密钥路径
		};
	}

	/**
	 * 处理单次砍价返现
	 * @param {Object} params 返现参数
	 * @param {string} params.bargain_record_id 砍价记录ID
	 * @param {string} params.user_id 用户ID（小组长）
	 * @param {string} params.openid 用户openid
	 * @param {number} params.amount 返现金额（元）
	 * @param {string} params.desc 返现描述
	 * @returns {Object} 返现结果
	 */
	async processCashback(params) {
		const { bargain_record_id, user_id, openid, amount, desc } = params;

		try {
			console.log('开始处理返现:', params);

			// 参数验证
			if (!openid || !amount || amount <= 0) {
				return {
					success: false,
					message: '参数不完整或金额无效'
				};
			}

			// 金额转换为分
			const amountInFen = Math.round(amount * 100);

			// 调用微信企业付款API
			const result = await this.transferToBalance({
				openid,
				amount: amountInFen,
				desc: desc || '砍价返现'
			});

			if (result.success) {
				// 返现成功，更新数据库记录
				const db = uniCloud.database();
				await db.collection('kanjia').doc(bargain_record_id).update({
					cashback_status: 1, // 已返现
					cashback_time: Date.now(),
					transaction_id: result.payment_no
				});

				console.log('返现成功:', {
					user_id,
					amount,
					transaction_id: result.payment_no
				});

				return {
					success: true,
					message: '返现成功',
					transaction_id: result.payment_no
				};
			} else {
				// 返现失败，标记失败状态
				const db = uniCloud.database();
				await db.collection('kanjia').doc(bargain_record_id).update({
					cashback_status: 2, // 返现失败
					cashback_error: result.message
				});

				console.error('返现失败:', result.message);

				return {
					success: false,
					message: result.message
				};
			}

		} catch (err) {
			console.error('返现处理异常:', err);
			return {
				success: false,
				message: '返现处理异常: ' + err.message
			};
		}
	}

	/**
	 * 调用微信企业付款API
	 * @param {Object} params
	 * @param {string} params.openid 用户openid
	 * @param {number} params.amount 金额（分）
	 * @param {string} params.desc 描述
	 * @returns {Object} 付款结果
	 */
	async transferToBalance(params) {
		const { openid, amount, desc } = params;

		try {
			// 验证金额（单位：分）
			if (amount < 100) {
				return {
					success: false,
					message: '单笔金额不能少于1元（100分）'
				};
			}

			if (amount > 200000) {
				return {
					success: false,
					message: '单笔金额不能超过2000元（200000分）'
				};
			}

			// 构建请求参数
			const tradeNo = this.generateTradeNo();
			const requestData = {
				mch_appid: this.config.appid,
				mchid: this.config.mch_id,
				nonce_str: this.generateNonceStr(),
				partner_trade_no: tradeNo,
				openid: openid,
				check_name: 'NO_CHECK', // 不校验真实姓名
				amount: amount,
				desc: desc,
				spbill_create_ip: '127.0.0.1' // 实际部署时应该获取服务器真实IP
			};

			// 生成签名
			requestData.sign = this.generateSign(requestData);

			console.log('企业付款请求参数:', {
				trade_no: tradeNo,
				openid: openid,
				amount: amount / 100 + '元',
				desc: desc
			});

			// 转换为XML格式
			const xmlData = this.objToXml(requestData);

			// 调用微信企业付款API（需要使用证书）
			const response = await this.makeRequest(
				'https://api.mch.weixin.qq.com/mmpaymkttransfers/promotion/transfers',
				xmlData
			);

			// 解析响应
			const result = this.xmlToObj(response);

			if (result.return_code === 'SUCCESS' && result.result_code === 'SUCCESS') {
				console.log('✅ 企业付款成功:', {
					payment_no: result.payment_no,
					payment_time: result.payment_time
				});

				return {
					success: true,
					payment_no: result.payment_no,
					payment_time: result.payment_time
				};
			} else {
				const errorMsg = result.err_code_des || result.return_msg || '付款失败';
				console.error('❌ 企业付款失败:', {
					return_code: result.return_code,
					err_code: result.err_code,
					err_code_des: result.err_code_des
				});

				return {
					success: false,
					message: errorMsg,
					err_code: result.err_code
				};
			}

		} catch (err) {
			console.error('调用企业付款API异常:', err);
			return {
				success: false,
				message: '调用API异常: ' + err.message
			};
		}
	}

	/**
	 * 发送HTTPS请求（使用证书）
	 * @param {string} url 请求地址
	 * @param {string} data XML数据
	 * @returns {string} 响应内容
	 */
	async makeRequest(url, data) {
		// 注意：这里需要使用uniCloud的HTTP请求能力，并且需要配置证书
		// 由于uniCloud对证书的支持有限，建议使用以下方案之一：
		
		// 方案1：使用uniCloud.httpclient（推荐）
		const result = await uniCloud.httpclient.request(url, {
			method: 'POST',
			data: data,
			contentType: 'text/xml',
			dataType: 'text',
			// 需要在uniCloud后台配置证书
			sslVerify: true
		});

		return result.data;

		// 方案2：如果uniCloud不支持证书，可以考虑：
		// - 使用腾讯云函数的证书功能
		// - 或者通过中间代理服务器处理
	}

	/**
	 * 对象转XML
	 * @param {Object} obj 对象
	 * @returns {string} XML字符串
	 */
	objToXml(obj) {
		let xml = '<xml>';
		for (let key in obj) {
			if (obj.hasOwnProperty(key)) {
				xml += `<${key}><![CDATA[${obj[key]}]]></${key}>`;
			}
		}
		xml += '</xml>';
		return xml;
	}

	/**
	 * XML转对象
	 * @param {string} xml XML字符串
	 * @returns {Object} 对象
	 */
	xmlToObj(xml) {
		const obj = {};
		const regex = /<(\w+)>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/\1>/g;
		let match;
		while ((match = regex.exec(xml)) !== null) {
			obj[match[1]] = match[2];
		}
		return obj;
	}

	/**
	 * 生成随机字符串
	 */
	generateNonceStr() {
		return crypto.randomBytes(16).toString('hex');
	}

	/**
	 * 生成商户订单号
	 */
	generateTradeNo() {
		return 'CASHBACK' + Date.now() + Math.random().toString(36).substr(2, 9).toUpperCase();
	}

	/**
	 * 生成签名
	 * @param {Object} data 待签名数据
	 * @returns {string} 签名
	 */
	generateSign(data) {
		// 排序并拼接字符串
		const keys = Object.keys(data).sort();
		const stringA = keys.map(key => `${key}=${data[key]}`).join('&');
		const stringSignTemp = stringA + '&key=' + this.config.api_key;

		// MD5签名
		const sign = crypto.createHash('md5').update(stringSignTemp, 'utf8').digest('hex').toUpperCase();
		return sign;
	}

	/**
	 * 批量处理待返现的砍价记录
	 * 可以通过定时任务调用此方法
	 */
	async processPendingCashbacks() {
		const db = uniCloud.database();

		try {
			// 查询待返现的记录（状态为0）
			const pendingRecords = await db.collection('kanjia')
				.where({
					cashback_status: 0,
					cashback_amount: db.command.gt(0)
				})
				.limit(50) // 每次最多处理50条
				.get();

			console.log(`找到 ${pendingRecords.data.length} 条待返现记录`);

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

				const openid = userRes.data[0].wx_openid[0]; // 获取第一个openid

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

				// 避免请求过快，延迟100ms
				await new Promise(resolve => setTimeout(resolve, 100));
			}

			return {
				success: true,
				processed: results.length,
				results: results
			};

		} catch (err) {
			console.error('批量处理返现失败:', err);
			return {
				success: false,
				message: err.message
			};
		}
	}
}

module.exports = {
	CashbackHandler
};
