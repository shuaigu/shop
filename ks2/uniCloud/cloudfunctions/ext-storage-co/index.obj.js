// 添加数据缓存
const cache = new Map()

const createCloudPath = (fileType) => {
	const date = new Date()
	const year = date.getFullYear()
	const month = String(date.getMonth() + 1).padStart(2, '0')
	const day = String(date.getDate()).padStart(2, '0')
	const timestamp = Date.now()
	const randomStr = Math.random().toString(36).slice(2, 10)
	
	// 构建新的文件路径: 2025年/年月日/时间戳_随机字符.扩展名
	return `${year}/${year}${month}${day}/${timestamp}_${randomStr}.${fileType}`
}

// 水印参数配置
const createWatermarkParams = (scale) => [
	'watermark/1',                    // 图片水印
	'image/aHR0cHM6Ly9hbHkyLmppbmdsZTAzNTAuY24vd2F0ZXJtYXJrLnBuZw==',  // 水印图片
	'dissolve/50',                    // 透明度
	'gravity/NorthEast',             // 位置
	'dx/20',                         // 横向边距
	'dy/20',                         // 纵向边距
	`ws/${scale}`                    // 水印图片短边占主图短边的比例
].join('/');

// 为不同尺寸图片定制水印大小
const watermarkLarge = createWatermarkParams('0.80');     // 原图水印占15%
const watermarkMedium = createWatermarkParams('0.50');    // 中等压缩图水印占10%
const watermarkSmall = createWatermarkParams('0.15');     // 缩略图水印占8%

// 设置七牛云图片处理参数
const imageOps = [
	// 原图处理 - 添加大水印
	`imageMogr2/auto-orient/format/webp|${watermarkLarge}`,
	// 压缩图 - 用于文章显示，添加中等水印
	`imageMogr2/auto-orient/thumbnail/!1080x1920r/format/webp/quality/80|${watermarkMedium}`,
	// 缩略图 - 用于列表显示，添加小水印
	`imageMogr2/auto-orient/thumbnail/!300x300r/format/webp/quality/70|${watermarkSmall}`
].join('|');

module.exports = {
	getUploadFileOptions(data = {}) {
		let { 
			cloudPath, // 前端传过来的文件路径
			fileType = 'image'  // 默认为图片类型
		} = data;
		
		// 获取文件扩展名
		const fileExt = cloudPath.split('.').pop().toLowerCase()
		
		// 文件类型安全检查
		const allowedImageTypes = ['jpg', 'jpeg', 'png', 'gif', 'webp']
		if (!allowedImageTypes.includes(fileExt)) {
			throw new Error('不支持的图片类型')
		}
		
		// 使用新的路径生成方法
		const cloudPathNew = createCloudPath(fileExt)
		
		// 获取 extStorageManager 对象实例
		const extStorageManager = uniCloud.getExtStorageManager({
			provider: "qiniu",
			domain: "https://aly2.jingle0350.cn",
		});
		
		// 调用 extStorageManager.getUploadFileOptions
		let uploadFileOptionsRes = extStorageManager.getUploadFileOptions({
			cloudPath: cloudPathNew,
			allowUpdate: false,
			persistentOps: imageOps,
			metadata: {
				fileType: fileType,
				uploadTime: Date.now()
			}
		});
		
		const domain = "https://aly2.jingle0350.cn";
		const fileURL = `${domain}/${cloudPathNew}`;
		
		return {
			...uploadFileOptionsRes,
			fileURL,
			compressedURL: `${fileURL}?imageMogr2/thumbnail/!1080x1920r/format/webp/quality/80|${watermarkMedium}`,
			thumbnailURL: `${fileURL}?imageMogr2/thumbnail/!300x300r/format/webp/quality/70|${watermarkSmall}`
		};
	},

	// 优化缓存方法
	async method(param) {
		const cacheKey = JSON.stringify(param)
		const cachedResult = cache.get(cacheKey)
		
		if (cachedResult) {
			// 检查缓存是否过期(30分钟)
			if (Date.now() - cachedResult.timestamp < 1800000) {
				return cachedResult.data
			}
			cache.delete(cacheKey)
		}
		
		const result = await // ... 原有处理逻辑
		
		cache.set(cacheKey, {
			data: result,
			timestamp: Date.now()
		})
		return result
	},
	async getArticleList() {
		const db = uniCloud.database()
		const domain = "https://aly2.jingle0350.cn"
		
		try {
			const result = await db.collection('articles').orderBy('createTime', 'desc').get()
			
			// 处理每篇文章的图片URL
			const processedData = result.data.map(article => {
				if (!article.images || !Array.isArray(article.images)) {
					article.images = []
				}
				
				// 处理图片URL
				const urls = article.images.map(image => {
					if (!image || !image.cloudPath) return null
					
					const fileURL = `${domain}/${image.cloudPath}`
					return {
						original: fileURL,
						compressed: `${fileURL}?imageMogr2/thumbnail/!1080x1920r/format/webp/quality/80|${watermarkMedium}`,
						thumbnail: `${fileURL}?imageMogr2/thumbnail/!300x300r/format/webp/quality/70|${watermarkSmall}`
					}
				}).filter(url => url !== null)
				
				return {
					...article,
					url: urls // 确保url字段存在且为数组
				}
			})
			
			return {
				code: 0,
				data: processedData
			}
		} catch (e) {
			console.error('获取文章列表失败:', e)
			return {
				code: -1,
				message: '获取文章列表失败',
				error: e.message
			}
		}
	}
}
