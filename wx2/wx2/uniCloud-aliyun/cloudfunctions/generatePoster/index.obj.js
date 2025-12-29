// 服务端海报生成云函数（返回小程序码供前端使用）
'use strict';

const appId = 'wxf7ee79349bd957b8';
const appSecret = '725f689abdc2c51a36330a813c1b7215';

/**
 * 获取access_token
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
 * 生成小程序码（返回base64）
 */
async function generateMiniProgramCode(scene, page = 'pages/index/index', width = 280) {
	try {
		const accessToken = await getAccessToken();
		
		const res = await uniCloud.httpclient.request(
			`https://api.weixin.qq.com/wxa/getwxacodeunlimit?access_token=${accessToken}`,
			{
				method: 'POST',
				contentType: 'json',
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
		
		if (res.data) {
			let bufferData;
			if (Buffer.isBuffer(res.data)) {
				bufferData = res.data;
			} else if (typeof res.data === 'string') {
				bufferData = Buffer.from(res.data, 'latin1');
			} else {
				throw new Error('无法识别的响应数据类型');
			}
			return `data:image/png;base64,${bufferData.toString('base64')}`;
		} else {
			throw new Error('生成小程序码失败');
		}
	} catch (err) {
		console.error('生成小程序码错误：', err);
		return null;
	}
}

module.exports = {
	_before: function() {},
	
	/**
	 * 生成海报数据（返回小程序码base64供前端绘制）
	 */
	async generateArticlePoster(params = {}) {
		try {
			console.log('📝 开始生成海报数据, params:', JSON.stringify(params));
			
			// 生成小程序码
			let qrcodeBase64 = null;
			if (params.articleId) {
				const scene = `a=${params.articleId.substring(0, 24)}`;
				qrcodeBase64 = await generateMiniProgramCode(scene, 'pages/article/articleDetail', 160);
			}
			
			// 返回数据供前端绘制海报
			console.log('✅ 海报数据生成成功');
			return {
				errCode: 0,
				errMsg: 'success',
				data: {
					...params,
					qrcodeBase64: qrcodeBase64
				}
			};
		} catch (err) {
			console.error('❌ 生成海报数据失败:', err);
			return {
				errCode: -1,
				errMsg: err.message || '生成失败'
			};
		}
	}
};
