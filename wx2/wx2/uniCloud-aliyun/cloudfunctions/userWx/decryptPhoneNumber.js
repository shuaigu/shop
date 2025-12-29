const crypto = require( 'crypto' )
// 解密手机号的工具函数
function decryptPhoneNumber( sessionKey, encryptedData, iv ) {
	try {
		console.log('开始解密手机号:', { sessionKey: sessionKey ? '***' : null, encryptedData: encryptedData ? '***' : null, iv: iv ? '***' : null })

		// Base64解码
		const keyBytes = Buffer.from( sessionKey, 'base64' )
		const ivBytes = Buffer.from( iv, 'base64' )
		const encryptedBytes = Buffer.from( encryptedData, 'base64' )

		console.log('解码后的长度:', { keyBytes: keyBytes.length, ivBytes: ivBytes.length, encryptedBytes: encryptedBytes.length })

		// 创建解密器
		const decipher = crypto.createDecipheriv( 'aes-128-cbc', keyBytes, ivBytes )
		decipher.setAutoPadding( true )

		// 解密
		let decoded = decipher.update( encryptedBytes, 'binary', 'utf8' )
		decoded += decipher.final( 'utf8' )

		console.log( '解密结果长度:', decoded.length ) // 只打印前100个字符，避免敏感信息泄露

		// 解析JSON
		const result = JSON.parse( decoded )
		console.log('手机号解密成功')
		return result
	} catch ( err ) {
		console.error( '解密失败:', {
			message: err.message,
			stack: err.stack,
			code: err.code
		} )
		return null
	}
}
module.exports = { decryptPhoneNumber }