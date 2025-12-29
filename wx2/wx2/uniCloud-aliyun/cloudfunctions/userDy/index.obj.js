const config = require('./config.js')
const {
	decryptPhoneNumber
} = require('./decryptPhoneNumber.js')
const {
	createToken
} = require('./createToken.js')
const dbJQL = uniCloud.databaseForJQL()

module.exports = {
	_before: function() { // 通用预处理器

	},

	/**
	 * 快手手机号登录
	 * @param {object} params --   js_code
	 * @returns {object}
	 */
	async loginByPhoneDy(params) {

		const {
			code,
			encryptedData,
			iv
		} = params


		// 构造请求参数
		const sessionParams = {
			appid: config.app_id_dy,
			secret: config.app_secret_dy,
			code: code
		}


		// 1. 获取抖音登录信息
		const res = await uniCloud.request({
			url: 'https://developer.toutiao.com/api/apps/v2/jscode2session', // 正式环境
			// url: 'https://open-sandbox.douyin.com/api/apps/v2/jscode2session', // 沙盒环境
			method: "POST",
			header: {
				'Content-Type': 'application/json' // 抖音要求JSON格式
			},
			data: JSON.stringify(sessionParams) // 需要转为JSON字符串
		})

		const {
			openid,
			session_key
		} = res.data.data
		// console.log( openid, session_key, '后端' )
		if (!openid || !session_key) {
			throw new Error('获取用户信息失败')
		}

		// 2. 解密手机号
		const phoneData = decryptPhoneNumber(
			session_key,
			encryptedData,
			iv
		)

		if (!phoneData || !phoneData.phoneNumber) {
			throw new Error('手机号解密失败')
		}

		// 3. 查找或创建用户

		const userRecord = await dbJQL.collection("user").where({
			mobile: phoneData.phoneNumber
		}).limit(1).get()

		let userId
		let userRes
		if (userRecord.data.length === 0) {
			// 创建新用户
			const token = createToken(openid, session_key)

			const addRes = await dbJQL.collection("user").add({
				openid_dy: openid,
				session_key: session_key,
				mobile: phoneData.phoneNumber,
				role: ['user'],
				token
			})
			console.log(addRes, '新用户返回')
			userId = addRes.id
			userRes = await dbJQL.collection("user").doc(userId).get()

		} else {
			userId = userRecord.data[0]._id

			// 更新用户信息的逻辑
			await dbJQL.collection("user").doc(userId).update({
				openid_dy: openid,
				session_key: session_key,
				token: createToken(openid, session_key), // 更新token
				update_time: Date.now()
			})

			// 获取更新后的用户信息
			userRes = await dbJQL.collection("user").doc(userId).get()
		}


		// 确保返回的数据都是可序列化的
		const safeUserData = {
			_id: userRes.data[0]._id || '',
			uid: userRes.data[0]._id || '', // 添加uid字段与前端保持一致
			openid_dy: userRes.data[0].openid_dy || '',
			token: userRes.data[0].token || '',
			mobile: userRes.data[0].mobile || '',
			role: Array.isArray(userRes.data[0].role) ? userRes.data[0].role : ['user'],
			isLogin: true
		};

		// 返回
		return {
			code: 0,
			message: '登录成功',
			data: safeUserData
		}
	}
}