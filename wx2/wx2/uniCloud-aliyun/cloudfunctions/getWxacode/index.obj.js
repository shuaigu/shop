// 生成小程序码云函数
'use strict';

const appId = 'wxf7ee79349bd957b8'; // 小程序appid
const appSecret = '725f689abdc2c51a36330a813c1b7215'; // 小程序appSecret

/**
 * 获取小程序access_token（内部辅助函数）
 */
async function getAccessToken() {
	try {
		const res = await uniCloud.httpclient.request(
			`https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${appId}&secret=${appSecret}`,
			{
				method: 'GET',
				dataType: 'json'
			}
		);
		
		if (res.data && res.data.access_token) {
			return res.data.access_token;
		} else {
			throw new Error(res.data.errmsg || '获取access_token失败');
		}
	} catch (err) {
		console.error('获取access_token错误：', err);
		throw err;
	}
}

/**
 * 生成小程序码（内部辅助函数）
 */
async function generateQRCode(params = {}) {
	try {
		const { scene, page = 'pages/index/index', width = 430 } = params;
		
		if (!scene) {
			throw new Error('scene参数不能为空');
		}
		
		// 获取access_token
		const accessToken = await getAccessToken();
		
		// 调用微信接口生成小程序码
		const res = await uniCloud.httpclient.request(
			`https://api.weixin.qq.com/wxa/getwxacodeunlimit?access_token=${accessToken}`,
			{
				method: 'POST',
				contentType: 'json',
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
		
		// 将buffer转为base64
		if (res.data) {
			console.log('收到微信响应，数据类型:', typeof res.data);
			console.log('res.data是Buffer?', Buffer.isBuffer(res.data));
			
			// 检查是否是错误响应（JSON格式）
			if (typeof res.data === 'object' && res.data.errcode) {
				console.error('微信API返回错误:', res.data);
				throw new Error(`微信错误: ${res.data.errmsg} (code: ${res.data.errcode})`);
			}
			
			// 确保res.data是Buffer类型
			let bufferData;
			if (Buffer.isBuffer(res.data)) {
				bufferData = res.data;
			} else if (typeof res.data === 'string') {
				// 如果是字符串，转为Buffer（使用latin1编码保留二进制数据）
				bufferData = Buffer.from(res.data, 'latin1');
			} else if (typeof res.data === 'object') {
				// 可能是JSON对象，转换为字符串再转为Buffer
				console.warn('警告: res.data是对象类型，尝试转换');
				const jsonStr = JSON.stringify(res.data);
				bufferData = Buffer.from(jsonStr, 'utf8');
			} else {
				console.error('无法识别的数据类型:', typeof res.data);
				throw new Error('无法识别的响应数据类型');
			}
			
			// 检查buffer是否是PNG格式（魔法数字: 89 50 4E 47）
			const isPNG = bufferData.length > 4 && 
				bufferData[0] === 0x89 && 
				bufferData[1] === 0x50 && 
				bufferData[2] === 0x4E && 
				bufferData[3] === 0x47;
			
			if (!isPNG) {
				console.error('警告: 返回的数据不是PNG格式');
				console.error('前4字节:', bufferData.slice(0, 4));
				console.error('前100字节内容:', bufferData.toString('utf8', 0, Math.min(100, bufferData.length)));
				// 尝试解析为JSON
				try {
					const jsonData = JSON.parse(bufferData.toString('utf8'));
					if (jsonData.errcode) {
						throw new Error(`微信API错误: ${jsonData.errmsg} (code: ${jsonData.errcode})`);
					}
				} catch (parseErr) {
					console.error('JSON解析失败:', parseErr.message);
				}
			}
			
			const base64Image = bufferData.toString('base64');
			console.log('base64长度:', base64Image.length);
			console.log('base64前50字符:', base64Image.substring(0, 50));
			
			return {
				errCode: 0,
				errMsg: 'success',
				qrcodeBase64: `data:image/png;base64,${base64Image}`
			};
		} else {
			throw new Error('生成小程序码失败');
		}
	} catch (err) {
		console.error('生成小程序码错误：', err);
		return {
			errCode: -1,
			errMsg: err.message || '生成失败'
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
		
		console.log('🎯 生成的scene值:', scene);
		console.log('🎯 scene长度:', scene.length, '(限制32字符)');
		
		return await generateQRCode({
			scene,
			page: 'pages/article/articleDetail',
			width: 280
		});
	}
};
