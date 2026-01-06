const config = require( './config.js' )
const { decryptPhoneNumber } = require( './decryptPhoneNumber.js' )
const { createToken } = require( './createToken.js' )
const generateRandomName = require( './generateRandomName' )

const dbJQL = uniCloud.databaseForJQL( )

module.exports = {
	_before: function( ) { // 通用预处理器

	},
	/**
	 * loginByPhoneWx 微信手机号登录
	 * @param {string} param1 参数1描述
	 * @returns {object} 返回值描述
	 */
	async loginByPhoneWx( params ) {
		const { code, encryptedData, iv } = params
		// 构造请求参数
		const sessionParams = {
			app_id: config.app_id_wx,
			app_secret: config.app_secret_wx,
			js_code: code
		}
		console.log( sessionParams.app_id, '微信id' )
		// 1. 获取微信登录信息
		const res = await uniCloud.request( {
			url: `https://api.weixin.qq.com/sns/jscode2session?appid=${sessionParams.app_id}&secret=${sessionParams.app_secret}&js_code=${sessionParams.js_code}&grant_type=authorization_code`,
			method: "POST",
		} )

		const { openid, session_key } = res.data

		// console.log( open_id, session_key, '后端' )
		if ( !openid || !session_key ) {
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

		const userRecord = await dbJQL.collection( "user" ).where( {
			mobile: phoneData.phoneNumber
		} ).limit( 1 ).get( )

		let userId
		let userRes
		if ( userRecord.data.length === 0 ) {
			// 生成随机名称
			const randomName = generateRandomName( )
			// 创建新用户
			const token = createToken( openid, session_key )
			const addRes = await dbJQL.collection( "user" ).add( {
				openid_wx: openid,
				session_key: session_key,
				mobile: phoneData.phoneNumber,
				role: [ 'user' ],
				token,
				nickName: randomName
			} )
			console.log( addRes, '微信新用户返回' )
			userId = addRes.id
			userRes = await dbJQL.collection( "user" ).doc( userId ).get( )

		} else {
			userId = userRecord.data[ 0 ]._id
			await dbJQL.collection( "user" ).doc( userId ).update( { openid_wx: openid } )
			// 获取老用户信息
			userRes = await dbJQL.collection( "user" ).doc( userId ).get( )

		}

		// 返回
		return {
			code: 0,
			message: '登录成功',
			data: {
				_id: userRes.data[ 0 ]._id,
				openid_wx: userRes.data[ 0 ].openid_wx,
				token: userRes.data[ 0 ].token,
				mobile: userRes.data[ 0 ].mobile,
				nickName: userRes.data[ 0 ].nickName,
				avatarUrl: userRes.data[ 0 ].avatarUrl,
				role: userRes.data[ 0 ].role
			}
		}
	},
}