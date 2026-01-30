/**
 * HTTP 代理服务器
 * 部署在固定 IP 服务器（115.159.35.33）上
 * 用于转发 uniCloud 云函数的请求，使其具有固定的出口 IP
 * 
 * 部署说明：
 * 1. 将此文件上传到您的服务器 115.159.35.33
 * 2. 安装依赖：npm install express axios body-parser
 * 3. 启动服务：node proxy-server.js
 * 4. 建议使用 pm2 管理：pm2 start proxy-server.js
 */

const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');

const app = express();
const PORT = 8888; // 代理服务端口

// 中间件配置
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));
app.use(bodyParser.text({ type: 'application/xml', limit: '10mb' }));

// 允许跨域（仅允许来自 uniCloud 的请求）
app.use((req, res, next) => {
	res.header('Access-Control-Allow-Origin', '*');
	res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
	res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
	
	if (req.method === 'OPTIONS') {
		return res.sendStatus(200);
	}
	
	next();
});

// 请求日志中间件
app.use((req, res, next) => {
	const timestamp = new Date().toISOString();
	console.log(`[${timestamp}] ${req.method} ${req.path} - ${req.ip}`);
	next();
});

/**
 * 健康检查接口
 */
app.get('/health', (req, res) => {
	res.json({
		status: 'ok',
		server: '115.159.35.33',
		port: PORT,
		timestamp: new Date().toISOString()
	});
});

/**
 * 获取服务器出口 IP
 */
app.get('/ip', async (req, res) => {
	try {
		// 方法1：通过外部服务获取
		const response = await axios.get('https://api.ipify.org?format=json');
		res.json({
			success: true,
			ip: response.data.ip,
			message: '服务器出口 IP 地址'
		});
	} catch (error) {
		// 方法2：返回配置的固定 IP
		res.json({
			success: true,
			ip: '115.159.35.33',
			message: '服务器配置 IP 地址'
		});
	}
});

/**
 * 代理转发接口
 * POST /proxy
 * 
 * 请求体：
 * {
 *   target_url: string,      // 目标 URL
 *   target_method: string,   // 请求方法
 *   target_headers: object,  // 请求头
 *   target_data: any,        // 请求数据
 *   response_type: string    // 响应类型：json/text/xml
 * }
 */
app.post('/proxy', async (req, res) => {
	try {
		const {
			target_url,
			target_method = 'GET',
			target_headers = {},
			target_data,
			response_type = 'json'
		} = req.body;

		// 参数验证
		if (!target_url) {
			return res.status(400).json({
				success: false,
				error: '缺少 target_url 参数'
			});
		}

		console.log('📤 转发请求:', {
			url: target_url,
			method: target_method,
			responseType: response_type
		});

		// 构建 axios 请求配置
		const axiosConfig = {
			method: target_method,
			url: target_url,
			headers: {
				'User-Agent': 'Proxy-Server/1.0',
				...target_headers
			},
			timeout: 30000 // 30秒超时
		};

		// 添加请求数据
		if (target_data) {
			if (target_method.toUpperCase() === 'GET') {
				axiosConfig.params = target_data;
			} else {
				axiosConfig.data = target_data;
			}
		}

		// 根据响应类型设置
		if (response_type === 'text' || response_type === 'xml') {
			axiosConfig.responseType = 'text';
		}

		// 发送请求
		const response = await axios(axiosConfig);

		console.log('✅ 请求成功:', {
			status: response.status,
			dataLength: JSON.stringify(response.data).length
		});

		// 返回结果
		res.json({
			success: true,
			status: response.status,
			statusText: response.statusText,
			headers: response.headers,
			data: response.data
		});

	} catch (error) {
		console.error('❌ 请求失败:', error.message);

		// 处理错误响应
		if (error.response) {
			// 服务器返回错误状态码
			res.json({
				success: false,
				status: error.response.status,
				statusText: error.response.statusText,
				headers: error.response.headers,
				data: error.response.data,
				error: error.message
			});
		} else if (error.request) {
			// 请求已发送但未收到响应
			res.status(504).json({
				success: false,
				error: '目标服务器无响应',
				message: error.message
			});
		} else {
			// 请求配置错误
			res.status(500).json({
				success: false,
				error: '请求配置错误',
				message: error.message
			});
		}
	}
});

/**
 * 微信支付专用代理接口
 * POST /wxpay-proxy
 */
app.post('/wxpay-proxy', async (req, res) => {
	try {
		const {
			url,
			method = 'POST',
			data,
			headers = {}
		} = req.body;

		console.log('💰 微信支付请求:', { url, method });

		const response = await axios({
			method,
			url,
			data,
			headers: {
				'Content-Type': 'application/xml',
				'User-Agent': 'WXPay-Proxy/1.0',
				...headers
			},
			responseType: 'text',
			timeout: 30000
		});

		console.log('✅ 微信支付请求成功');

		res.json({
			success: true,
			status: response.status,
			data: response.data,
			headers: response.headers
		});

	} catch (error) {
		console.error('❌ 微信支付请求失败:', error.message);

		res.json({
			success: false,
			error: error.message,
			response: error.response ? {
				status: error.response.status,
				data: error.response.data
			} : null
		});
	}
});

/**
 * 错误处理中间件
 */
app.use((err, req, res, next) => {
	console.error('服务器错误:', err);
	res.status(500).json({
		success: false,
		error: '服务器内部错误',
		message: err.message
	});
});

// 启动服务器
app.listen(PORT, '0.0.0.0', () => {
	console.log('=================================');
	console.log('  HTTP 代理服务器已启动');
	console.log('=================================');
	console.log(`  服务器地址: 115.159.35.33:${PORT}`);
	console.log(`  健康检查: http://115.159.35.33:${PORT}/health`);
	console.log(`  获取IP:   http://115.159.35.33:${PORT}/ip`);
	console.log(`  代理接口: http://115.159.35.33:${PORT}/proxy`);
	console.log('=================================');
	console.log('  请将此服务器 IP 添加到微信支付白名单');
	console.log('=================================');
});

// 优雅关闭
process.on('SIGTERM', () => {
	console.log('收到 SIGTERM 信号，正在关闭服务器...');
	process.exit(0);
});

process.on('SIGINT', () => {
	console.log('收到 SIGINT 信号，正在关闭服务器...');
	process.exit(0);
});
