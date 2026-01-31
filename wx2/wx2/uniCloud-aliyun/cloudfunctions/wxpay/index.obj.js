// 云对象教程: https://uniapp.dcloud.net.cn/uniCloud/cloud-obj
// jsdoc语法提示教程：https://ask.dcloud.net.cn/docs/#//ask.dcloud.net.cn/article/129
const WXPay = require( 'wx-pay' )
const fs = require( 'fs' )
const config = require( './config.js' )

module.exports = {
	_before: function( ) { // 通用预处理器

	},
	/**
	 * wxpay 方法描述
	 * @param {string} params 参数1描述
	 * @returns {object} 返回值描述
	 */
	async wxpay( params ) {
		// 参数验证
		if (!params || typeof params !== 'object') {
			throw new Error('参数错误')
		}

		const { openid, out_trade_no, total_fee } = params

		if (!openid || !out_trade_no || !total_fee) {
			throw new Error('缺少必需的支付参数')
		}

		if (typeof total_fee !== 'number' || total_fee <= 0) {
			throw new Error('金额参数错误')
		}

		// 业务逻辑
		const payRes = await WXPay( {
			appid: config.appid,
			mch_id: config.mch_id,
			partner_key: config.partner_key, //微信商户平台API密钥
			pfx: fs.readFileSync( __dirname + '/apiclient_cert.p12' ), //微信商户平台证书
		} )

		// 使用 Promise 包装微信支付
		return new Promise( ( resolve, reject ) => {
			payRes.createUnifiedOrder( {
				body: '会员充值',
				out_trade_no, // 使用生成的订单号
				total_fee,
				notify_url: config.notifyUrl,
				trade_type: 'JSAPI',
				openid,
			}, function( err, result ) {
				if ( err ) {
					reject( err )
					return
				}

				// 重新构建支付参数
				const timeStamp = Math.floor( Date.now( ) / 1000 ).toString( )
				const nonceStr = result.nonce_str

				// 按微信支付文档要求构建支付参数
				const payParams = {
					appId: result.appid, // 注意这里是 appId 而不是 appid
					timeStamp: timeStamp,
					nonceStr: nonceStr,
					package: `prepay_id=${result.prepay_id}`,
					signType: 'MD5',
					out_trade_no: out_trade_no // 添加商户订单号
				}

				// 生成签名的字符串需要按字典序排序
				const signParams = {
					appId: payParams.appId,
					timeStamp: payParams.timeStamp,
					nonceStr: payParams.nonceStr,
					package: payParams.package,
					signType: payParams.signType
				}

				// 生成签名
				const paySign = payRes.sign( signParams )

				// 返回完整的支付参数
				resolve( {
					provider: 'wxpay',
					timeStamp: payParams.timeStamp,
					nonceStr: payParams.nonceStr,
					package: payParams.package,
					signType: payParams.signType,
					paySign: paySign,
					out_trade_no: out_trade_no
				} )
			} )
		} )
	},

	/**
	 * getWxOrder 订单查询
	 * @param {string} out_trade_no 商户订单号
	 */
	async getWxOrder( out_trade_no ) {
		const payRes = await WXPay( {
			appid: config.appid,
			mch_id: config.mch_id,
			partner_key: config.partner_key,
			pfx: fs.readFileSync( __dirname + '/apiclient_cert.p12' ),
		} )

		return new Promise( ( resolve, reject ) => {
			payRes.queryOrder( { out_trade_no: out_trade_no }, ( err, order ) => {
				if ( err ) {
					reject( err )
					return
				}
				resolve( order )
			} )
		} )
	},

	/**
	 * transfer 微信转账到零钱
	 * @param {Object} params - 转账参数
	 * @param {string} params.openid - 用户openid
	 * @param {number} params.amount - 转账金额（元）
	 * @param {string} params.desc - 转账描述
	 * @returns {Object} 转账结果
	 */
	async transfer(params) {
		try {
			const { openid, amount, desc } = params
			
			// 参数验证
			if (!openid) {
				return {
					errCode: -1,
					errMsg: 'openid不能为空'
				}
			}
			
			if (!amount || amount <= 0) {
				return {
					errCode: -1,
					errMsg: '转账金额必须大于0'
				}
			}
			
			// 将元转为分
			const amountFen = Math.round(amount * 100)
			
			// 生成商户转账单号
			const partner_trade_no = `TF${Date.now()}${Math.floor(Math.random() * 10000)}`
			
			// 初始化微信支付
			const payRes = await WXPay({
				appid: config.appid,
				mch_id: config.mch_id,
				partner_key: config.partner_key,
				pfx: fs.readFileSync(__dirname + '/apiclient_cert.p12')
			})
			
			// 调用企业付款到零钱
			return new Promise((resolve, reject) => {
				payRes.transfer({
					partner_trade_no: partner_trade_no,
					openid: openid,
					check_name: 'NO_CHECK', // 不校验真实姓名
					amount: amountFen,
					desc: desc || '奖励发放',
					spbill_create_ip: '127.0.0.1' // 请求IP
				}, (err, result) => {
					if (err) {
						console.error('转账失败:', err)
						resolve({
							errCode: -1,
							errMsg: err.return_msg || err.err_code_des || '转账失败'
						})
						return
					}
					
					if (result.return_code === 'SUCCESS' && result.result_code === 'SUCCESS') {
						resolve({
							errCode: 0,
							errMsg: '转账成功',
							data: {
								partner_trade_no: partner_trade_no,
								payment_no: result.payment_no,
								payment_time: result.payment_time
							}
						})
					} else {
						resolve({
							errCode: -1,
							errMsg: result.err_code_des || result.return_msg || '转账失败'
						})
					}
				})
			})
		} catch (error) {
			console.error('转账异常:', error)
			return {
				errCode: -1,
				errMsg: error.message || '转账异常'
			}
		}
	}
}