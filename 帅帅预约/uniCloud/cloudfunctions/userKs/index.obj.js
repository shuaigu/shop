const config = require( './config.js' )
const { decryptPhoneNumber } = require( './decryptPhoneNumber.js' )
const { createToken } = require( './createToken.js' )
const dbJQL = uniCloud.databaseForJQL( )

// 定义云对象
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
				token,
				last_login_time: new Date()
			} )
			console.log( addRes, '新用户返回' )
			userId = addRes.id
			userRes = await dbJQL.collection( "user" ).doc( userId ).get( )

		} else {
			userId = userRecord.data[ 0 ]._id
			// 更新老用户信息
			const token = createToken( open_id, session_key )
			await dbJQL.collection( "user" ).doc( userId ).update( {
				openid_ks: open_id,
				session_key: session_key,
				token: token,
				last_login_time: new Date()
			} )
			// 获取更新后的用户信息
			userRes = await dbJQL.collection( "user" ).doc( userId ).get( )
		}
		
		// 返回
		return {
			code: 0,
			message: '登录成功',
			data: {
				_id: userRes.data[ 0 ]._id,
				openid_ks: userRes.data[ 0 ].openid_ks,
				token: userRes.data[ 0 ].token,
				mobile: userRes.data[ 0 ].mobile,
				nickName: userRes.data[ 0 ].nickName,
				avatarUrl: userRes.data[ 0 ].avatarUrl,
				role: userRes.data[ 0 ].role
			}
		}
	}
}