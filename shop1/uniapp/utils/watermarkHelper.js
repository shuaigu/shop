/**
 * 图片水印工具
 * 功能：为图片自动添加水印，支持文字和logo
 * 特点：
 * 1. 支持自定义水印内容（文字或logo图片）
 * 2. 支持自定义位置（默认右上角）
 * 3. 支持自定义透明度和大小
 * 4. 适配不同设备和屏幕尺寸
 */

// 水印配置对象
const watermarkConfig = {
	// 水印类型: 'text' | 'image' | 'both'
	type: 'text',
	
	// 文字水印配置
	text: {
		content: '本站专属', // 水印文字内容
		fontSize: 14, // 字体大小（px）
		fontFamily: 'Arial', // 字体
		color: '#FFFFFF', // 文字颜色
		opacity: 0.6, // 透明度 (0-1)
		position: 'topRight', // 位置: topLeft, topRight, bottomLeft, bottomRight, center
		offsetX: 10, // X轴偏移量（px）
		offsetY: 10, // Y轴偏移量（px）
		angle: 0 // 旋转角度（0-360度）
	},
	
	// 图片水印配置（logo）
	image: {
		url: '', // logo图片URL（支持本地路径或网络图片）
		width: 80, // logo宽度（px）
		height: 30, // logo高度（px）
		opacity: 0.6, // 透明度 (0-1)
		position: 'topRight', // 位置
		offsetX: 10, // X轴偏移量（px）
		offsetY: 10, // Y轴偏移量（px）
	},
	
	// 组合模式配置（文字+图片）
	both: {
		layout: 'vertical', // 布局方式: 'vertical' | 'horizontal'
		spacing: 10 // 文字和图片之间的间距（px）
	}
};

/**
 * 计算水印位置坐标
 * @param {number} canvasWidth - 画布宽度
 * @param {number} canvasHeight - 画布高度
 * @param {number} watermarkWidth - 水印宽度
 * @param {number} watermarkHeight - 水印高度
 * @param {string} position - 位置标识
 * @param {number} offsetX - X轴偏移
 * @param {number} offsetY - Y轴偏移
 * @returns {object} - {x, y} 坐标
 */
function calculatePosition(canvasWidth, canvasHeight, watermarkWidth, watermarkHeight, position, offsetX, offsetY) {
	let x = 0;
	let y = 0;
	
	switch (position) {
		case 'topLeft':
			x = offsetX;
			y = offsetY;
			break;
		case 'topRight':
			x = canvasWidth - watermarkWidth - offsetX;
			y = offsetY;
			break;
		case 'bottomLeft':
			x = offsetX;
			y = canvasHeight - watermarkHeight - offsetY;
			break;
		case 'bottomRight':
			x = canvasWidth - watermarkWidth - offsetX;
			y = canvasHeight - watermarkHeight - offsetY;
			break;
		case 'center':
			x = (canvasWidth - watermarkWidth) / 2;
			y = (canvasHeight - watermarkHeight) / 2;
			break;
		default:
			// 默认右上角
			x = canvasWidth - watermarkWidth - offsetX;
			y = offsetY;
	}
	
	return { x, y };
}

/**
 * 为图片添加文字水印
 * @param {string} imagePath - 图片路径
 * @param {object} options - 水印配置选项
 * @returns {Promise<string>} - 返回添加水印后的图片临时路径
 */
export async function addTextWatermark(imagePath, options = {}) {
	// 合并配置
	const config = {
		...watermarkConfig.text,
		...options
	};
	
	try {
		// 获取图片信息
		const imageInfo = await uni.getImageInfo({
			src: imagePath
		});
		
		const { width, height } = imageInfo;
		
		// 创建canvas上下文
		const ctx = uni.createCanvasContext('watermarkCanvas');
		
		// 计算适配设备的实际尺寸
		const dpr = uni.getSystemInfoSync().pixelRatio || 1;
		const canvasWidth = width;
		const canvasHeight = height;
		
		// 绘制原始图片
		ctx.drawImage(imagePath, 0, 0, canvasWidth, canvasHeight);
		
		// 设置文字样式
		ctx.setFontSize(config.fontSize * dpr);
		ctx.setFillStyle(config.color);
		ctx.setGlobalAlpha(config.opacity);
		ctx.setTextAlign('left');
		ctx.setTextBaseline('top');
		
		// 测量文字宽度
		const textMetrics = ctx.measureText(config.content);
		const textWidth = textMetrics.width;
		const textHeight = config.fontSize * dpr * 1.2; // 估算文字高度
		
		// 计算水印位置
		const position = calculatePosition(
			canvasWidth,
			canvasHeight,
			textWidth,
			textHeight,
			config.position,
			config.offsetX * dpr,
			config.offsetY * dpr
		);
		
		// 如果需要旋转
		if (config.angle !== 0) {
			ctx.translate(position.x + textWidth / 2, position.y + textHeight / 2);
			ctx.rotate((config.angle * Math.PI) / 180);
			ctx.fillText(config.content, -textWidth / 2, -textHeight / 2);
		} else {
			ctx.fillText(config.content, position.x, position.y);
		}
		
		// 绘制到canvas
		ctx.draw(false, async () => {
			// 导出canvas为图片
			const result = await uni.canvasToTempFilePath({
				canvasId: 'watermarkCanvas',
				width: canvasWidth,
				height: canvasHeight,
				destWidth: canvasWidth,
				destHeight: canvasHeight
			});
			
			return result.tempFilePath;
		});
		
	} catch (error) {
		console.error('添加文字水印失败:', error);
		throw error;
	}
}

/**
 * 为图片添加logo水印
 * @param {string} imagePath - 图片路径
 * @param {object} options - 水印配置选项
 * @returns {Promise<string>} - 返回添加水印后的图片临时路径
 */
export async function addImageWatermark(imagePath, options = {}) {
	// 合并配置
	const config = {
		...watermarkConfig.image,
		...options
	};
	
	if (!config.url) {
		throw new Error('请提供水印logo图片URL');
	}
	
	try {
		// 获取原图信息
		const imageInfo = await uni.getImageInfo({
			src: imagePath
		});
		
		const { width, height } = imageInfo;
		
		// 创建canvas上下文
		const ctx = uni.createCanvasContext('watermarkCanvas');
		
		// 计算适配设备的实际尺寸
		const dpr = uni.getSystemInfoSync().pixelRatio || 1;
		const canvasWidth = width;
		const canvasHeight = height;
		
		// 绘制原始图片
		ctx.drawImage(imagePath, 0, 0, canvasWidth, canvasHeight);
		
		// 计算logo尺寸
		const logoWidth = config.width * dpr;
		const logoHeight = config.height * dpr;
		
		// 计算logo位置
		const position = calculatePosition(
			canvasWidth,
			canvasHeight,
			logoWidth,
			logoHeight,
			config.position,
			config.offsetX * dpr,
			config.offsetY * dpr
		);
		
		// 设置透明度
		ctx.setGlobalAlpha(config.opacity);
		
		// 绘制logo
		ctx.drawImage(config.url, position.x, position.y, logoWidth, logoHeight);
		
		// 绘制到canvas
		ctx.draw(false, async () => {
			// 导出canvas为图片
			const result = await uni.canvasToTempFilePath({
				canvasId: 'watermarkCanvas',
				width: canvasWidth,
				height: canvasHeight,
				destWidth: canvasWidth,
				destHeight: canvasHeight
			});
			
			return result.tempFilePath;
		});
		
	} catch (error) {
		console.error('添加logo水印失败:', error);
		throw error;
	}
}

/**
 * 为图片同时添加文字和logo水印
 * @param {string} imagePath - 图片路径
 * @param {object} textOptions - 文字水印配置
 * @param {object} imageOptions - logo水印配置
 * @returns {Promise<string>} - 返回添加水印后的图片临时路径
 */
export async function addCombinedWatermark(imagePath, textOptions = {}, imageOptions = {}) {
	// 合并配置
	const textConfig = {
		...watermarkConfig.text,
		...textOptions
	};
	
	const imageConfig = {
		...watermarkConfig.image,
		...imageOptions
	};
	
	const layoutConfig = watermarkConfig.both;
	
	try {
		// 获取图片信息
		const imageInfo = await uni.getImageInfo({
			src: imagePath
		});
		
		const { width, height } = imageInfo;
		
		// 创建canvas上下文
		const ctx = uni.createCanvasContext('watermarkCanvas');
		
		// 计算适配设备的实际尺寸
		const dpr = uni.getSystemInfoSync().pixelRatio || 1;
		const canvasWidth = width;
		const canvasHeight = height;
		
		// 绘制原始图片
		ctx.drawImage(imagePath, 0, 0, canvasWidth, canvasHeight);
		
		// 计算文字尺寸
		ctx.setFontSize(textConfig.fontSize * dpr);
		const textMetrics = ctx.measureText(textConfig.content);
		const textWidth = textMetrics.width;
		const textHeight = textConfig.fontSize * dpr * 1.2;
		
		// 计算logo尺寸
		const logoWidth = imageConfig.width * dpr;
		const logoHeight = imageConfig.height * dpr;
		
		// 根据布局方式计算总尺寸
		const spacing = layoutConfig.spacing * dpr;
		let totalWidth, totalHeight;
		
		if (layoutConfig.layout === 'vertical') {
			// 垂直布局
			totalWidth = Math.max(textWidth, logoWidth);
			totalHeight = textHeight + spacing + logoHeight;
		} else {
			// 水平布局
			totalWidth = textWidth + spacing + logoWidth;
			totalHeight = Math.max(textHeight, logoHeight);
		}
		
		// 计算组合水印的位置
		const position = calculatePosition(
			canvasWidth,
			canvasHeight,
			totalWidth,
			totalHeight,
			textConfig.position || imageConfig.position,
			textConfig.offsetX * dpr,
			textConfig.offsetY * dpr
		);
		
		// 绘制logo
		ctx.setGlobalAlpha(imageConfig.opacity);
		let logoX, logoY;
		
		if (layoutConfig.layout === 'vertical') {
			logoX = position.x + (totalWidth - logoWidth) / 2;
			logoY = position.y;
		} else {
			logoX = position.x;
			logoY = position.y + (totalHeight - logoHeight) / 2;
		}
		
		if (imageConfig.url) {
			ctx.drawImage(imageConfig.url, logoX, logoY, logoWidth, logoHeight);
		}
		
		// 绘制文字
		ctx.setGlobalAlpha(textConfig.opacity);
		ctx.setFontSize(textConfig.fontSize * dpr);
		ctx.setFillStyle(textConfig.color);
		ctx.setTextAlign('left');
		ctx.setTextBaseline('top');
		
		let textX, textY;
		
		if (layoutConfig.layout === 'vertical') {
			textX = position.x + (totalWidth - textWidth) / 2;
			textY = logoY + logoHeight + spacing;
		} else {
			textX = logoX + logoWidth + spacing;
			textY = position.y + (totalHeight - textHeight) / 2;
		}
		
		ctx.fillText(textConfig.content, textX, textY);
		
		// 绘制到canvas
		ctx.draw(false, async () => {
			// 导出canvas为图片
			const result = await uni.canvasToTempFilePath({
				canvasId: 'watermarkCanvas',
				width: canvasWidth,
				height: canvasHeight,
				destWidth: canvasWidth,
				destHeight: canvasHeight
			});
			
			return result.tempFilePath;
		});
		
	} catch (error) {
		console.error('添加组合水印失败:', error);
		throw error;
	}
}

/**
 * Base64编码函数
 * @param {string} str - 要编码的字符串
 * @returns {string} - Base64编码后的字符串
 */
function base64Encode(str) {
	const base64EncodeChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
	let out = '', i = 0, len = str.length, c1, c2, c3;
	
	while (i < len) {
		c1 = str.charCodeAt(i++) & 0xff;
		if (i == len) {
			out += base64EncodeChars.charAt(c1 >> 2);
			out += base64EncodeChars.charAt((c1 & 0x3) << 4);
			out += "==";
			break;
		}
		c2 = str.charCodeAt(i++);
		if (i == len) {
			out += base64EncodeChars.charAt(c1 >> 2);
			out += base64EncodeChars.charAt(((c1 & 0x3) << 4) | ((c2 & 0xF0) >> 4));
			out += base64EncodeChars.charAt((c2 & 0xF) << 2);
			out += "=";
			break;
		}
		c3 = str.charCodeAt(i++);
		out += base64EncodeChars.charAt(c1 >> 2);
		out += base64EncodeChars.charAt(((c1 & 0x3) << 4) | ((c2 & 0xF0) >> 4));
		out += base64EncodeChars.charAt(((c2 & 0xF) << 2) | ((c3 & 0xC0) >> 6));
		out += base64EncodeChars.charAt(c3 & 0x3F);
	}
	return out;
}

/**
 * UTF8编码
 * @param {string} str - 要编码的字符串
 * @returns {string} - UTF8编码后的字符串
 */
function utf8Encode(str) {
	let result = '';
	for (let i = 0; i < str.length; i++) {
		const c = str.charCodeAt(i);
		if (c < 128) {
			result += String.fromCharCode(c);
		} else if (c < 2048) {
			result += String.fromCharCode((c >> 6) | 192);
			result += String.fromCharCode((c & 63) | 128);
		} else {
			result += String.fromCharCode((c >> 12) | 224);
			result += String.fromCharCode(((c >> 6) & 63) | 128);
			result += String.fromCharCode((c & 63) | 128);
		}
	}
	return result;
}

/**
 * 使用七牛云水印功能添加水印（推荐方式）
 * @param {string} imageUrl - 图片URL（必须是七牛云图片）
 * @param {object} options - 水印配置选项
 * @returns {string} - 返回添加水印参数后的URL
 */
export function addQiniuWatermark(imageUrl, options = {}) {
	if (!imageUrl || typeof imageUrl !== 'string') {
		console.warn('无效的图片URL');
		return imageUrl;
	}
	
	// 检查是否是七牛云图片
	if (!imageUrl.includes('aly2.jingle0350.cn')) {
		// 非七牛云图片，直接返回原图URL
		console.log('[Watermark] 非七牛云图片，跳过水印:', imageUrl);
		return imageUrl;
	}
	
	// 合并配置
	const config = {
		type: 'text',
		text: '本站专属',
		fontSize: 30,        // 更大的字体
		color: '#FFFFFF',    // 白色文字
		opacity: 90,         // 更高的透明度
		position: 'SouthEast',
		dx: 20,
		dy: 20,
		logoUrl: '',
		...options
	};
	
	let watermarkParams = '';
	
	if (config.type === 'text') {
		// 文字水印 - 使用urlsafe base64编码
		const textUtf8 = utf8Encode(config.text);
		const textBase64 = base64Encode(textUtf8).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
		
		// 去除颜色的#号
		const colorHex = config.color.replace('#', '');
		
		watermarkParams = `watermark/2/text/${textBase64}/font/5b6u6L2v6ZuF6buR/fontsize/${config.fontSize * 100}/fill/${colorHex}/dissolve/${config.opacity}/gravity/${config.position}/dx/${config.dx}/dy/${config.dy}`;
	} else if (config.type === 'image' && config.logoUrl) {
		// 图片水印
		const logoBase64 = base64Encode(config.logoUrl).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
		watermarkParams = `watermark/1/image/${logoBase64}/dissolve/${config.opacity}/gravity/${config.position}/dx/${config.dx}/dy/${config.dy}`;
	}
	
	if (!watermarkParams) {
		console.warn('[Watermark] 水印参数为空，返回原图');
		return imageUrl;
	}
	
	// 检查URL中是否已有处理参数
	let finalUrl;
	if (imageUrl.includes('?')) {
		// 已有参数，使用斜杠拼接（七牛云语法）
		finalUrl = `${imageUrl}/${watermarkParams}`;
	} else {
		// 没有参数，直接添加
		const baseUrl = imageUrl.split('?')[0];
		finalUrl = `${baseUrl}?${watermarkParams}`;
	}
	
	return finalUrl;
}

/**
 * 批量为图片添加水印（使用七牛云）
 * @param {Array<string>} imageUrls - 图片URL数组
 * @param {object} options - 水印配置选项
 * @returns {Array<string>} - 返回添加水印后的URL数组
 */
export function batchAddWatermark(imageUrls, options = {}) {
	if (!Array.isArray(imageUrls)) {
		return [];
	}
	
	return imageUrls.map(url => addQiniuWatermark(url, options));
}

/**
 * 为组件图片自动添加水印（推荐在图片显示时使用）
 * @param {string} imageUrl - 原始图片URL
 * @param {object} watermarkOptions - 水印配置（可选）
 * @returns {string} - 带水印的图片URL
 */
export function getWatermarkedImageUrl(imageUrl, watermarkOptions = null) {
	if (!imageUrl) return '';
	
	// 如果没有提供配置，使用默认配置
	const defaultOptions = {
		type: 'text',
		text: '本站专属',
		fontSize: 30,        // 更大的字体
		opacity: 90,         // 更高的透明度
		position: 'SouthEast',
		dx: 20,
		dy: 20,
		color: '#FFFFFF'     // 白色文字
	};
	
	const options = watermarkOptions || defaultOptions;
	
	// 使用七牛云水印
	return addQiniuWatermark(imageUrl, options);
}

/**
 * 更新水印配置
 * @param {object} newConfig - 新的水印配置
 */
export function updateWatermarkConfig(newConfig) {
	if (newConfig.text) {
		Object.assign(watermarkConfig.text, newConfig.text);
	}
	if (newConfig.image) {
		Object.assign(watermarkConfig.image, newConfig.image);
	}
	if (newConfig.both) {
		Object.assign(watermarkConfig.both, newConfig.both);
	}
}

/**
 * 获取当前水印配置
 * @returns {object} - 当前水印配置
 */
export function getWatermarkConfig() {
	return { ...watermarkConfig };
}

// 默认导出
export default {
	addTextWatermark,
	addImageWatermark,
	addCombinedWatermark,
	addQiniuWatermark,
	batchAddWatermark,
	getWatermarkedImageUrl,
	updateWatermarkConfig,
	getWatermarkConfig,
	// 导出配置供外部修改
	config: watermarkConfig
};
