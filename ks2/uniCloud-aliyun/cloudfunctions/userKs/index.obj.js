const config = require( './config.js' )
const { decryptPhoneNumber } = require( './decryptPhoneNumber.js' )
const { createToken } = require( './createToken.js' )
const dbJQL = uniCloud.databaseForJQL( )

module.exports = {
	_before: function( ) { // 通用预处理器

	},

	/**
	 * 快手手机号登录
	 * @param {object} params --   js_code
	 * @returns {object}
	 */
	async loginByPhoneKs( params ) {
		const { code, encryptedData, iv, nickName, avatarUrl } = params
		// 构造请求参数
		const sessionParams = {
			app_id: config.app_id_ks,
			app_secret: config.app_secret_ks,
			js_code: code
		}
		// 1. 获取快手登录信息
		const res = await uniCloud.request( {
			url: 'https://open.kuaishou.com/oauth2/mp/code2session',
			method: "POST",
			header: {
				'content-type': 'application/x-www-form-urlencoded'
			},
			data: sessionParams
		} )

		const { open_id, session_key } = res.data

		// console.log( open_id, session_key, '后端' )
		if ( !open_id || !session_key ) {
			throw new Error( '获取用户信息失败' )
		}
		// 2. 解密手机号
		const phoneData = decryptPhoneNumber(
			session_key,
			encryptedData,
			iv
		)

		if ( !phoneData || !phoneData.phoneNumber ) {
			throw new Error( '手机号解密失败' )
		}

		// 3. 查找或创建用户

		const userRecord = await dbJQL.collection( "user" ).where( {
			mobile: phoneData.phoneNumber
		} ).limit( 1 ).get( )

		let userId
		let userRes
		if ( userRecord.data.length === 0 ) {
			// 创建新用户
			const token = createToken( open_id, session_key )
			const addRes = await dbJQL.collection( "user" ).add( {
				openid_ks: open_id,
				session_key: session_key,
				mobile: phoneData.phoneNumber,
				role: [ 'user' ],
				nickName,
				avatarUrl,
				token
			} )
			console.log( addRes, '新用户返回' )
			userId = addRes.id
			userRes = await dbJQL.collection( "user" ).doc( userId ).get( )

		} else {
			userId = userRecord.data[ 0 ]._id
			
			// 更新用户信息的逻辑
			await dbJQL.collection("user").doc(userId).update({
				openid_ks: open_id,
				session_key: session_key,
				nickName: nickName,  // 更新昵称
				avatarUrl: avatarUrl, // 更新头像
				token: createToken(open_id, session_key), // 更新token
				update_time: Date.now()
			})
			
			// 获取更新后的用户信息
			userRes = await dbJQL.collection("user").doc(userId).get()
		}

		// 在更新用户信息后添加日志
		console.log('更新用户信息:', {
			userId,
			nickName,
			avatarUrl
		})

		// 在返回前添加日志验证
		console.log('最终存储的用户信息:', {
			_id: userRes.data[0]._id,
			nickName: userRes.data[0].nickName,
			avatarUrl: userRes.data[0].avatarUrl,
			updateTime: userRes.data[0].update_time
		})

		// 确保返回的数据都是可序列化的
		const safeUserData = {
			_id: userRes.data[0]._id || '',
			uid: userRes.data[0]._id || '', // 添加uid字段与前端保持一致
			openid_ks: userRes.data[0].openid_ks || '',
			token: userRes.data[0].token || '',
			mobile: userRes.data[0].mobile || '',
			nickName: userRes.data[0].nickName || '',
			avatarUrl: userRes.data[0].avatarUrl || '',
			role: Array.isArray(userRes.data[0].role) ? userRes.data[0].role : ['user'],
			isLogin: true
		};

		// 返回
		return {
			code: 0,
			message: '登录成功',
			data: safeUserData
		}
	},

	/**
	 * 使用存储的手机号登录（跳过手机号解密步骤）
	 * @param {object} params - { code, mobile, nickName, avatarUrl }
	 * @returns {object}
	 */
	async loginByStoredMobile( params ) {
		const { code, mobile, nickName, avatarUrl } = params
		
		if (!mobile) {
			throw new Error('手机号不能为空')
		}
		
		// 构造请求参数
		const sessionParams = {
			app_id: config.app_id_ks,
			app_secret: config.app_secret_ks,
			js_code: code
		}
		
		// 1. 获取快手登录信息
		const res = await uniCloud.request( {
			url: 'https://open.kuaishou.com/oauth2/mp/code2session',
			method: "POST",
			header: {
				'content-type': 'application/x-www-form-urlencoded'
			},
			data: sessionParams
		} )

		const { open_id, session_key } = res.data

		if ( !open_id || !session_key ) {
			throw new Error( '获取用户信息失败' )
		}
		
		// 2. 使用手机号查找用户
		const userRecord = await dbJQL.collection( "user" ).where( {
			mobile: mobile
		} ).limit( 1 ).get( )

		if ( userRecord.data.length === 0 ) {
			// 用户不存在，说明存储的手机号无效
			throw new Error( '用户不存在，请重新授权' )
		}
		
		// 3. 更新用户的openid和session_key
		const userId = userRecord.data[ 0 ]._id
		await dbJQL.collection("user").doc(userId).update({
			openid_ks: open_id,
			session_key: session_key,
			nickName: nickName,  // 更新昵称
			avatarUrl: avatarUrl, // 更新头像
			token: createToken(open_id, session_key), // 更新token
			update_time: Date.now()
		})
		
		// 4. 获取更新后的用户信息
		const userRes = await dbJQL.collection("user").doc(userId).get()
		
		console.log('使用存储手机号登录成功:', {
			userId,
			mobile,
			nickName,
			avatarUrl
		})
		
		// 确保返回的数据都是可序列化的
		const safeUserData = {
			_id: userRes.data[0]._id || '',
			uid: userRes.data[0]._id || '',
			openid_ks: userRes.data[0].openid_ks || '',
			token: userRes.data[0].token || '',
			mobile: userRes.data[0].mobile || '',
			nickName: userRes.data[0].nickName || '',
			avatarUrl: userRes.data[0].avatarUrl || '',
			role: Array.isArray(userRes.data[0].role) ? userRes.data[0].role : ['user'],
			isLogin: true
		};

		// 返回
		return {
			code: 0,
			message: '欢迎回来！',
			data: safeUserData
		}
	}
}