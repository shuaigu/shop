// 生成小程序码云函数
'use strict';

const appId = 'wxf7ee79349bd957b8'; // 小程序appid
const appSecret = '725f689abdc2c51a36330a813c1b7215'; // 小程序appSecret

// ✅ 新增：缓存 access_token（云函数实例级别缓存）
let cachedAccessToken = null;
let tokenExpireTime = 0;

/**
 * 获取小程序access_token（带缓存优化）
 */
async function getAccessToken() {
	try {
		// ✅ 检查缓存（提前5分钟过期）
		const now = Date.now();
		if (cachedAccessToken && now < tokenExpireTime - 5 * 60 * 1000) {
			console.log('✅ 使用缓存的 access_token');
			return cachedAccessToken;
		}
		
		console.log('🔄 重新获取 access_token...');
		const res = await uniCloud.httpclient.request(
			`https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${appId}&secret=${appSecret}`,
			{
				method: 'GET',
				dataType: 'json',
				timeout: 10000 // ✅ 增加超时时间
			}
		);
		
		if (res.data && res.data.access_token) {
			// ✅ 缓存 token（有效期7200秒）
			cachedAccessToken = res.data.access_token;
			tokenExpireTime = now + res.data.expires_in * 1000;
			console.log('✅ access_token 获取成功，有效期至:', new Date(tokenExpireTime));
			return cachedAccessToken;
		} else {
			throw new Error(res.data?.errmsg || '获取access_token失败');
		}
	} catch (err) {
		console.error('❌ 获取access_token错误：', err);
		// ✅ 清空缓存
		cachedAccessToken = null;
		tokenExpireTime = 0;
		throw err;
	}
}

/**
 * 生成小程序码（带重试机制）
 */
async function generateQRCode(params = {}, retryCount = 0) {
	const MAX_RETRY = 2; // 最多重试2次
	
	try {
		const { scene, page = 'pages/index/index', width = 430 } = params;
		
		if (!scene) {
			throw new Error('scene参数不能为空');
		}
		
		// ✅ 验证 scene 长度
		if (scene.length > 32) {
			throw new Error(`scene参数过长: ${scene.length}/32 字符`);
		}
		
		console.log(`🎯 生成小程序码 (尝试 ${retryCount + 1}/${MAX_RETRY + 1})...`);
		console.log('   scene:', scene, `(${scene.length}字符)`);
		console.log('   page:', page);
		console.log('   width:', width);
		
		// 获取access_token
		const accessToken = await getAccessToken();
		
		// 调用微信接口生成小程序码
		const res = await uniCloud.httpclient.request(
			`https://api.weixin.qq.com/wxa/getwxacodeunlimit?access_token=${accessToken}`,
			{
				method: 'POST',
				contentType: 'json',
				timeout: 15000, // ✅ 增加超时时间到15秒
				// 不指定dataType，让它返回原始Buffer
				data: {
					scene: scene,
					page: page,
					width: width,
					auto_color: false,
					line_color: {"r":0,"g":0,"b":0},
					is_hyaline: false
				}
			}
		);
		
		// ✅ 优化：检查响应数据
		if (!res.data) {
			throw new Error('微信API无响应数据');
		}
		
		console.log('📦 收到微信响应');
		console.log('   数据类型:', typeof res.data);
		console.log('   是Buffer?', Buffer.isBuffer(res.data));
		console.log('   数据长度:', res.data.length);
		
		// ✅ 检查是否是错误响应（JSON格式）
		if (typeof res.data === 'object' && !Buffer.isBuffer(res.data)) {
			if (res.data.errcode) {
				console.error('❌ 微信API返回错误:', res.data);
				
				// ✅ 特殊处理：如果是 access_token 失效，清空缓存并重试
				if (res.data.errcode === 40001 && retryCount < MAX_RETRY) {
					console.log('🔄 access_token失效，清空缓存并重试...');
					cachedAccessToken = null;
					tokenExpireTime = 0;
					return await generateQRCode(params, retryCount + 1);
				}
				
				throw new Error(`微信错误: ${res.data.errmsg} (code: ${res.data.errcode})`);
			}
		}
		
		// ✅ 确保res.data是Buffer类型
		let bufferData;
		if (Buffer.isBuffer(res.data)) {
			bufferData = res.data;
		} else if (typeof res.data === 'string') {
			bufferData = Buffer.from(res.data, 'latin1');
		} else {
			// ✅ 尝试从res.data中提取buffer
			console.warn('⚠️ 数据类型异常，尝试转换...');
			try {
				const jsonStr = JSON.stringify(res.data);
				// 检查是否是错误信息
				const parsed = JSON.parse(jsonStr);
				if (parsed.errcode) {
					throw new Error(`微信API错误: ${parsed.errmsg} (code: ${parsed.errcode})`);
				}
				bufferData = Buffer.from(jsonStr, 'utf8');
			} catch (parseErr) {
				throw new Error('无法解析响应数据');
			}
		}
		
		// ✅ 验证是否是PNG格式（魔法数字: 89 50 4E 47）
		const isPNG = bufferData.length > 4 && 
			bufferData[0] === 0x89 && 
			bufferData[1] === 0x50 && 
			bufferData[2] === 0x4E && 
			bufferData[3] === 0x47;
		
		if (!isPNG) {
			console.error('❌ 返回的数据不是PNG格式');
			console.error('   前4字节:', Array.from(bufferData.slice(0, 4)).map(b => '0x' + b.toString(16).padStart(2, '0')).join(' '));
			
			// ✅ 尝试解析为JSON错误信息
			try {
				const text = bufferData.toString('utf8', 0, Math.min(500, bufferData.length));
				console.error('   响应内容:', text);
				const jsonData = JSON.parse(text);
				if (jsonData.errcode) {
					throw new Error(`微信API错误: ${jsonData.errmsg} (code: ${jsonData.errcode})`);
				}
			} catch (parseErr) {
				// 解析失败，继续抛出原错误
			}
			
			throw new Error('返回的数据不是有效的图片格式');
		}
		
		// ✅ 转换为base64
		const base64Image = bufferData.toString('base64');
		console.log('✅ 小程序码生成成功');
		console.log('   图片大小:', (bufferData.length / 1024).toFixed(2), 'KB');
		console.log('   base64长度:', base64Image.length);
		
		return {
			errCode: 0,
			errMsg: 'success',
			qrcodeBase64: `data:image/png;base64,${base64Image}`
		};
		
	} catch (err) {
		console.error('❌ 生成小程序码错误：', err);
		
		// ✅ 网络错误时重试
		if (retryCount < MAX_RETRY && (
			err.message.includes('timeout') || 
			err.message.includes('ECONNRESET') ||
			err.message.includes('ETIMEDOUT')
		)) {
			console.log(`🔄 网络错误，${1 + retryCount} 秒后重试...`);
			await new Promise(resolve => setTimeout(resolve, (1 + retryCount) * 1000));
			return await generateQRCode(params, retryCount + 1);
		}
		
		return {
			errCode: -1,
			errMsg: err.message || '生成失败',
			error: {
				name: err.name,
				message: err.message,
				stack: err.stack
			}
		};
	}
}

module.exports = {
	_before: function() {
		// 通用预处理器
	},
	
	/**
	 * 生成文章小程序码（对外暴露的方法）
	 * @param {Object} params
	 * @param {String} params.article_id - 文章ID
	 */
	async generateArticleQRCode(params = {}) {
		const { article_id } = params;
		
		if (!article_id) {
			return {
				errCode: -1,
				errMsg: 'article_id不能为空'
			};
		}
		
		console.log('📝 开始生成文章小程序码');
		console.log('  - article_id:', article_id);
		
		// 构建scene参数：只包含文章ID
		// 格式：a=文章ID（最多30字符，符合32字符限制）
		const scene = `a=${article_id}`;
		
		console.log('🎯 scene值:', scene, `(${scene.length}/32字符)`);
		
		return await generateQRCode({
			scene,
			page: 'pages/article/articleDetail',
			width: 280
		});
	},
	
	/**
	 * ✅ 新增：清除缓存方法（用于调试）
	 */
	async clearCache() {
		cachedAccessToken = null;
		tokenExpireTime = 0;
		console.log('✅ access_token 缓存已清除');
		return {
			errCode: 0,
			errMsg: '缓存已清除'
		};
	}
};
