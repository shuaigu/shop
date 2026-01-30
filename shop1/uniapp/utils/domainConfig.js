/**
 * 域名配置管理
 * 集中管理所有图片域名相关配置，方便统一修改和维护
 */

// 导入水印工具
import { addQiniuWatermark } from './watermarkHelper.js'

// 域名配置对象
const domainConfig = {
	// 当前使用的正确域名（主域名）
	// 如果需要换域名，只需要修改这个值
	correctDomain: 'aly2.jingle0350.cn',
	
	// 默认图片路径配置 - 使用实际存在的文件
	defaultImages: {
		'default': '/static/images/占位图.png',      // 默认图片（实际存在）
		'avatar': '/static/images/touxiang.png',       // 默认头像（实际存在）
		'video': '/static/images/占位图.png'         // 默认视频缩略图
	},
	
	// 图片质量参数配置（七牛云）
	imageParams: {
		thumbnail: '?imageMogr2/thumbnail/300x300',   // 缩略图参数
		compress: '?imageMogr2/quality/80',           // 压缩参数
		webp: '?imageMogr2/format/webp',              // webp格式参数
		listWidth: '?imageMogr2/thumbnail/750x'       // 列表页宽度限制（750px宽度自适应）
	},
	
	// 水印配置（默认不启用，可通过setWatermarkEnabled控制）
	watermark: {
		enabled: false, // 是否启用水印（已禁用）
		type: 'text', // 水印类型: 'text' | 'image'
		text: '本站专属', // 文字水印内容
		fontSize: 30, // 字体大小（增大到30）
		opacity: 90, // 透明度 (0-100)（提高到90）
		position: 'SouthEast', // 位置
		dx: 20, // X轴偏移（增大）
		dy: 20, // Y轴偏移（增大）
		color: '#FFFFFF', // 文字颜色（白色）
		logoUrl: '' // logo图片URL（用于图片水印）
	}
}

/**
 * 修复图片URL中的问题（移除错误水印参数）
 * @param {string} url - 原始图片URL
 * @param {string} type - 图片类型 'avatar'|其他，默认为普通图片
 * @param {boolean} addParams - 是否自动添加图片参数，默认true
 * @returns {string} - 修复后的URL
 */
export function fixImageUrl(url, type = 'image', addParams = true) {
	if (!url || typeof url !== 'string') {
		// 根据类型返回对应的默认图
		return type === 'avatar' ? domainConfig.defaultImages.avatar : domainConfig.defaultImages.default
	}
	
	// 如果是本地路径，直接返回
	if (url.startsWith('/') || url.startsWith('./') || url.startsWith('../')) {
		return url
	}
	
	// 检测是否为微信小程序临时文件，如果是则返回默认图
	if (url.startsWith('http://tmp/') || url.startsWith('wxfile://')) {
		console.warn('检测到微信临时文件，返回默认图:', url);
		// 根据类型返回对应的默认图
		return type === 'avatar' ? domainConfig.defaultImages.avatar : domainConfig.defaultImages.default;
	}
	
	// 🔥 小程序安全限制：必须使用HTTPS协议
	if (url.startsWith('http://') && !url.startsWith('http://tmp/')) {
		console.warn('小程序不支持HTTP协议的图片，自动转换为HTTPS:', url);
		url = url.replace('http://', 'https://');
	}
	
	// ⚠️ 注意：cloud://格式的fileID需要单独处理
	// 🔥 重要：cloud://格式不能在真机上直接显示，必须返回默认图
	// 应该在组件层面使用convertCloudFileID转换
	if (url.startsWith('cloud://')) {
		console.warn('cloud://格式的URL需要通过convertCloudFileID转换，当前返回默认图:', url);
		return type === 'avatar' ? domainConfig.defaultImages.avatar : domainConfig.defaultImages.default;
	}
	
	// 🔥 uniCloud CDN域名转换为配置的域名
	// 识别uniCloud CDN域名：mp-xxx.cdn.bspapp.com
	if (url.includes('.cdn.bspapp.com/cloudstorage/')) {
		console.log('🔄 [fixImageUrl] 检测uniCloud CDN域名，转换为自定义域名:', url);
		
		try {
			// 提取文件路径部分
			// 示例: https://mp-xxx.cdn.bspapp.com/cloudstorage/xxx.jpg
			const match = url.match(/\.cdn\.bspapp\.com(\/cloudstorage\/.+)/);
			
			if (match && match[1]) {
				const filePath = match[1];
				// 移除 /cloudstorage/ 前缀
				const cleanPath = filePath.replace('/cloudstorage/', '');
				// 构建新的URL
				const convertedUrl = `https://${domainConfig.correctDomain}/${cleanPath}`;
				// 移除URL中的图片处理参数
				const finalUrl = convertedUrl.split('?')[0];
				
				console.log('✅ [fixImageUrl] CDN域名转换成功:', finalUrl);
				
				// 如果需要添加参数，根据类型添加
				if (addParams) {
					if (type === 'avatar') {
						return addImageParams(finalUrl, { preset: 'thumbnail' });
					} else {
						return addImageParams(finalUrl, { preset: 'listWidth' });
					}
				}
				
				return finalUrl;
			}
			
			console.warn('⚠️ [fixImageUrl] CDN域名格式无法识别，使用默认图');
			return type === 'avatar' ? domainConfig.defaultImages.avatar : domainConfig.defaultImages.default;
		} catch (error) {
			console.error('❌ [fixImageUrl] CDN域名转换失败:', error);
			return type === 'avatar' ? domainConfig.defaultImages.avatar : domainConfig.defaultImages.default;
		}
	}
	
	// 🔥 自动添加图片处理参数
	if (addParams) {
		// 检查是否包含项目域名
		const hasDomain = url.includes(domainConfig.correctDomain);
		
		if (hasDomain) {
			// 根据图片类型添加不同的预设参数
			if (type === 'avatar') {
				// 头像使用缩略图参数 (300x300)
				return addImageParams(url, { preset: 'thumbnail' });
			} else {
				// 普通图片使用列表宽度限制 (750px)
				return addImageParams(url, { preset: 'listWidth' });
			}
		}
	}
	
	// 其他域名直接返回
	return url
}

/**
 * 处理云存储fileID，将cloud://格式转换为可显示的HTTPS链接
 * @param {string} fileID - 云存储文件ID
 * @param {string} type - 图片类型 'avatar'|其他
 * @returns {Promise<string>} - 转换后的URL
 */
export async function convertCloudFileID(fileID, type = 'image') {
	if (!fileID || typeof fileID !== 'string') {
		return type === 'avatar' ? domainConfig.defaultImages.avatar : domainConfig.defaultImages.default
	}
	
	// 如果不是cloud://格式，直接返回
	if (!fileID.startsWith('cloud://')) {
		return fixImageUrl(fileID, type)
	}
	
	try {
		// 尝试转换为HTTPS链接
		const result = await uniCloud.getTempFileURL({
			fileList: [fileID]
		})
		
		if (result.fileList && result.fileList[0] && result.fileList[0].tempFileURL) {
			// 返回转换后的HTTPS链接，并应用fixImageUrl处理
			return fixImageUrl(result.fileList[0].tempFileURL, type)
		}
		
		// 如果转换失败，返回默认图
		console.warn('无法获取临时链接，使用默认图:', fileID)
		return type === 'avatar' ? domainConfig.defaultImages.avatar : domainConfig.defaultImages.default
	} catch (error) {
		console.error('转换fileID失败:', error)
		return type === 'avatar' ? domainConfig.defaultImages.avatar : domainConfig.defaultImages.default
	}
}

/**
 * 智能处理头像 URL，自动识别并转换 cloud:// 格式
 * 🔥 推荐使用此函数处理所有头像，避免真机显示问题
 * @param {string} avatarUrl - 头像URL
 * @returns {Promise<string>} - 处理后的URL
 */
export async function processAvatarUrl(avatarUrl) {
	if (!avatarUrl || typeof avatarUrl !== 'string') {
		console.log('👤 processAvatarUrl: 无效的URL，返回空字符串');
		return ''; // 返回空字符串，由Canvas处理
	}
	
	console.log('👤 processAvatarUrl: 处理头像URL:', avatarUrl);
	
	// 1. 本地路径，直接返回
	if (avatarUrl.startsWith('/') || avatarUrl.startsWith('./') || avatarUrl.startsWith('../')) {
		console.log('👤 processAvatarUrl: 本地路径，直接返回');
		return avatarUrl
	}
	
	// 2. 临时文件，返回空字符串
	if (avatarUrl.startsWith('http://tmp/') || avatarUrl.startsWith('wxfile://') || avatarUrl.includes('tmp_')) {
		console.warn('👤 processAvatarUrl: 检测到临时文件，返回空字符串:', avatarUrl)
		return ''; // 返回空字符串，由Canvas处理
	}
	
	// 3. 已经是七牛云自定义域名，直接返回
	if (avatarUrl.includes(domainConfig.correctDomain)) {
		console.log('👤 processAvatarUrl: 已是自定义域名，直接返回:', avatarUrl);
		console.log('👤 processAvatarUrl: 域名配置:', domainConfig.correctDomain);
		console.log('👤 processAvatarUrl: 包含2025/touxiang:', avatarUrl.includes('2025/touxiang'));
		return avatarUrl;
	}
	
	// 4. cloud:// 格式（旧头像，需要转换）
	if (avatarUrl.startsWith('cloud://')) {
		console.log('👤 processAvatarUrl: cloud://格式（旧数据），开始转换...');
		try {
			// 转换为HTTPS临时URL
			const result = await uniCloud.getTempFileURL({
				fileList: [avatarUrl]
			});
			
			if (result.fileList && result.fileList[0] && result.fileList[0].tempFileURL) {
				const httpsUrl = result.fileList[0].tempFileURL;
				console.log('👤 processAvatarUrl: cloud://转换成功:', httpsUrl);
				
				// cloud:// 格式的旧数据直接返回临时URL
				
				return httpsUrl;
			}
			
			console.warn('👤 processAvatarUrl: cloud://转换失败，返回空字符串');
			return ''; // 返回空字符串，不使用默认图
		} catch (error) {
			console.error('👤 processAvatarUrl: cloud://转换异常:', error);
			return ''; // 返回空字符串，不使用默认图
		}
	}
	
	// 5. uniCloud CDN域名（旧头像数据，转换为自定义域名）
	if (avatarUrl.includes('.cdn.bspapp.com/cloudstorage/')) {
		console.log('👤 processAvatarUrl: 检测uniCloud CDN域名（旧数据），尝试转换为自定义域名');
		
		try {
			// 提取文件路径部分
			// 示例: https://mp-xxx.cdn.bspapp.com/cloudstorage/xxx.jpg
			// 提取: /cloudstorage/xxx.jpg
			const match = avatarUrl.match(/\.cdn\.bspapp\.com(\/cloudstorage\/.+)/);
			
			if (match && match[1]) {
				const filePath = match[1];
				// 移除 /cloudstorage/ 前缀
				const cleanPath = filePath.replace('/cloudstorage/', '');
				// 构建新的URL: https://aly2.jingle0350.cn/ + 文件路径
				const convertedUrl = `https://${domainConfig.correctDomain}/${cleanPath}`;
				
				// 移除URL中的图片处理参数
				const finalUrl = convertedUrl.split('?')[0];
				
				console.log('✅ processAvatarUrl: CDN域名转换成功');
				console.log('  - 原始URL:', avatarUrl);
				console.log('  - 转换后:', finalUrl);
				
				return finalUrl;
			}
			
			console.warn('⚠️ processAvatarUrl: CDN域名格式无法识别，返回空字符串');
			return '';
		} catch (error) {
			console.error('❌ processAvatarUrl: CDN域名转换失败:', error);
			return '';
		}
	}
	
	// 6. HTTP 协议，转换为 HTTPS
	if (avatarUrl.startsWith('http://')) {
		console.log('👤 processAvatarUrl: HTTP协议，转换为HTTPS');
		avatarUrl = avatarUrl.replace('http://', 'https://')
	}
	
	// 7. HTTPS 链接，直接返回
	console.log('👤 processAvatarUrl: 最终URL:', avatarUrl);
	return avatarUrl;
}

/**
 * 获取默认图片路径
 * @param {string} type - 图片类型 (default|avatar|video)
 * @returns {string} - 默认图片路径
 */
export function getDefaultImage(type = 'default') {
	return domainConfig.defaultImages[type] || domainConfig.defaultImages.default
}

/**
 * 获取当前正确的域名
 * @returns {string} - 当前正确域名
 */
export function getCurrentDomain() {
	return domainConfig.correctDomain
}

/**
 * 生成缩略图URL
 * @param {string} url - 原始图片URL
 * @param {string} size - 缩略图尺寸，如 '150x150' 或 '300x300'
 * @param {number} quality - 图片质量 (1-100)
 * @returns {string} - 缩略图URL
 */
export function getThumbnailUrl(url, size = '150x150', quality = 50) {
	if (!url || typeof url !== 'string') {
		return domainConfig.defaultImages.default
	}
	
	// 如果是本地路径，直接返回
	if (url.startsWith('/') || url.startsWith('./') || url.startsWith('../')) {
		return url
	}
	
	// 如果是七牛云域名，添加缩略图参数
	if (url.includes(domainConfig.correctDomain)) {
		// 移除已有的参数
		const baseUrl = url.split('?')[0]
		// 添加缩略图参数
		return `${baseUrl}?imageMogr2/thumbnail/!${size}r/format/webp/quality/${quality}`
	}
	
	// 其他域名直接返回原图
	return url
}

/**
 * 添加图片处理参数（支持七牛云参数）
 * @param {string} url - 图片URL
 * @param {Object} options - 可选参数配置
 * @param {number} options.width - 限定宽度（如 750）
 * @param {number} options.height - 限定高度（可选）
 * @param {number} options.quality - 图片质量 1-100（可选）
 * @param {string} options.format - 图片格式 jpg|png|webp（可选）
 * @param {boolean} options.autoOrient - 是否自动旋正（默认 false）
 * @param {string} options.preset - 预设参数 listWidth|thumbnail|compress|webp（可选）
 * @returns {string} - 处理后的URL
 */
export function addImageParams(url, options = {}) {
	if (!url || typeof url !== 'string') {
		console.warn('无效的图片URL:', url)
		return domainConfig.defaultImages.default
	}
	
	// 如果是本地路径，直接返回
	if (url.startsWith('/') || url.startsWith('./') || url.startsWith('../')) {
		return url
	}
	
	// 🔥 关键修复：先移除URL中的所有处理参数，使用纯原图
	let cleanUrl = url;
	
	// 如果URL包含 ? 参数
	const questionMarkIndex = url.indexOf('?');
	if (questionMarkIndex !== -1) {
		const queryString = url.substring(questionMarkIndex);
		// 如果查询参数包含imageMogr2等处理参数，静默处理
		if (queryString.includes('imageMogr2') || queryString.includes('imageView2') || queryString.includes('watermark')) {
			// 静默处理：直接移除处理参数，使用纯原图URL
			cleanUrl = url.substring(0, questionMarkIndex);
			// 已删除日志，减少控制台输出
		} else {
			// 如果是其他参数（如token等），保留
			cleanUrl = url;
		}
	}
	
	// 使用预设参数
	if (options.preset && domainConfig.imageParams[options.preset]) {
		return cleanUrl + domainConfig.imageParams[options.preset];
	}
	
	// 构建自定义参数
	let params = []
	
	// 自动旋正（建议放在最前面）
	if (options.autoOrient) {
		params.push('auto-orient')
	}
	
	// 缩放参数
	if (options.width || options.height) {
		const w = options.width || ''
		const h = options.height || ''
		params.push(`thumbnail/${w}x${h}`)
	}
	
	// 质量压缩
	if (options.quality && options.quality >= 1 && options.quality <= 100) {
		params.push(`quality/${options.quality}`)
	}
	
	// 格式转换
	if (options.format) {
		params.push(`format/${options.format}`)
	}
	
	// 如果没有任何参数，返回原始URL
	if (params.length === 0) {
		return cleanUrl
	}
	
	// 拼接参数
	const paramString = params.join('/')
	return `${cleanUrl}?imageMogr2/${paramString}`
}

/**
 * 快捷方法：为列表页图片添加宽度限制（750px）
 * @param {string} url - 图片URL
 * @param {boolean} addWatermark - 是否添加水印（默认使用全局配置）
 * @returns {string} - 处理后的URL
 */
export function addListImageParams(url, addWatermark = null) {
	let processedUrl = addImageParams(url, { preset: 'listWidth' })
	
	// 如果启用水印，添加水印参数
	const shouldAddWatermark = addWatermark !== null ? addWatermark : domainConfig.watermark.enabled
	
	if (shouldAddWatermark) {
		processedUrl = addQiniuWatermark(processedUrl, domainConfig.watermark)
	}
	
	return processedUrl
}

/**
 * 快捷方法：生成webp格式图片
 * @param {string} url - 图片URL
 * @param {number} width - 宽度限制（可选）
 * @param {number} quality - 质量（可选，默认80）
 * @param {boolean} addWatermark - 是否添加水印（默认使用全局配置）
 * @returns {string} - 处理后的URL
 */
export function getWebpImage(url, width = null, quality = 80, addWatermark = null) {
	const options = {
		format: 'webp',
		quality: quality,
		autoOrient: true
	}
	
	if (width) {
		options.width = width
	}
	
	let processedUrl = addImageParams(url, options)
	
	// 如果启用水印，添加水印参数
	const shouldAddWatermark = addWatermark !== null ? addWatermark : domainConfig.watermark.enabled
	if (shouldAddWatermark) {
		processedUrl = addQiniuWatermark(processedUrl, domainConfig.watermark)
	}
	
	return processedUrl
}

/**
 * 设置是否启用水印
 * @param {boolean} enabled - 是否启用
 */
export function setWatermarkEnabled(enabled) {
	domainConfig.watermark.enabled = enabled
}

/**
 * 获取水印启用状态
 * @returns {boolean} - 是否启用
 */
export function getWatermarkEnabled() {
	return domainConfig.watermark.enabled
}

/**
 * 更新水印配置
 * @param {object} config - 水印配置对象
 */
export function updateWatermarkConfig(config) {
	Object.assign(domainConfig.watermark, config)
}

/**
 * 去除图片URL中的水印参数
 * @param {string} url - 包含水印的图片URL
 * @returns {string} - 去除水印后的URL
 */
export function removeWatermark(url) {
	if (!url || typeof url !== 'string') {
		return url
	}
	
	// 如果URL包含水印参数,去除它们
	if (url.includes('watermark/')) {
		// 匹配并移除水印参数部分
		// 水印参数格式: /watermark/2/text/xxx... 或 /watermark/1/image/xxx...
		url = url.replace(/\/watermark\/[^/]+\/[^?#]+/g, '')
		
		// 清理可能残留的多余斜杠
		url = url.replace(/\/+/g, '/')
		
		// 修复协议部分的双斜杠
		url = url.replace(/(:)\/([^/])/, '$1//$2')
	}
	
	return url
}

/**
 * 获取带水印的图片URL
 * @param {string} url - 原始图片URL
 * @param {object} watermarkOptions - 水印配置（可选，默认使用全局配置）
 * @returns {string} - 处理后的URL
 */
export function getWatermarkedUrl(url, watermarkOptions = null) {
	if (!url) return ''
	
	// 先修复URL
	const fixedUrl = fixImageUrl(url)
	
	// 如果未启用水印且没有自定义配置，直接返回
	if (!watermarkOptions && !domainConfig.watermark.enabled) {
		return fixedUrl
	}
	
	// 添加水印
	const options = watermarkOptions || domainConfig.watermark
	return addQiniuWatermark(fixedUrl, options)
}

// 导出配置对象（供需要直接访问配置的场景使用）
export default domainConfig