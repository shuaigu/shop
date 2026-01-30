// 添加数据缓存
const cache = new Map()

const createCloudPath = (fileType, fileExt) => {
	const date = new Date()
	const year = date.getFullYear()
	const month = String(date.getMonth() + 1).padStart(2, '0')
	const day = String(date.getDate()).padStart(2, '0')
	const timestamp = Date.now()
	const randomStr = Math.random().toString(36).slice(2, 10)
	
	// 构建新的文件路径: 2025年/图片或视频/年月日/时间戳_随机字符.扩展名
	const mediaType = fileType === 'image' ? 'tupian' : 'shipin'
	return `${year}/${mediaType}/${year}${month}${day}/${timestamp}_${randomStr}.${fileExt}`
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
const watermarkLarge = createWatermarkParams('0.50');     // 原图水印占15%
const watermarkMedium = createWatermarkParams('0.30');    // 中等压缩图水印占10%
const watermarkSmall = createWatermarkParams('0.08');     // 缩略图水印占8%

// 设置七牛云图片处理参数
const imageOps = [
	// 原图处理 - 添加大水印
	`imageMogr2/auto-orient/format/webp|${watermarkLarge}`,
	// 压缩图 - 用于文章显示，添加中等水印
	`imageMogr2/auto-orient/thumbnail/!1080x1920r/format/webp/quality/80|${watermarkMedium}`,
	// 缩略图 - 用于列表显示，添加小水印
	`imageMogr2/auto-orient/thumbnail/!300x300r/format/webp/quality/70|${watermarkSmall}`
].join('|');

// 添加视频文件类型检查
const allowedVideoTypes = ['mp4', 'mov', 'm4v']

// 视频处理参数 - 用于持久化处理
const videoOps = [
	// 转码任务 - 提高视频质量
	'avthumb/mp4' +
	'/s/1920x1080' +    
	'/vb/4096k' +       
	'/ab/192k' +        
	'/ar/44100' +       
	'/acodec/aac' +     
	'/vcodec/libx264' + 
	'/crf/23',          
	// 封面图任务 - 提高质量并添加水印，保持宽高比
	`vframe/jpg/offset/0/w/1920/h/!1080/rotate/auto/format/jpg/q/85|${watermarkMedium}` // 使用!保持宽高比
].join('|');

// 添加实时转码参数配置 - 提高视频质量
const videoTranscodeParams = [
	'avthumb',
	'mp4',
	's/1920x1080',      // 提高分辨率到1080p
	'vb/4096k',         // 提高视频码率到4Mbps
	'ab/192k',          // 提高音频码率
	'ar/44100',         // 音频采样率
	'acodec/aac',       // 音频编码
	'vcodec/libx264',   // 视频编码
	'crf/23'            // 控制视频质量
].join('/');

// 添加 URL 安全的 Base64 编码函数
function urlsafeBase64Encode(str) {
	return btoa(str)
		.replace(/\+/g, '-')
		.replace(/\//g, '_')
		.replace(/=/g, '');
}

module.exports = {
	getUploadFileOptions(data = {}) {
		let { 
			cloudPath, // 前端传过来的文件路径
			fileType = 'image',  // 默认为图片类型
			isOriginal = false // 是否保持原始文件
		} = data;
		
		// 获取文件扩展名
		const fileExt = cloudPath.split('.').pop().toLowerCase()
		
		// 根据文件类型进行安全检查
		if (fileType === 'image') {
			const allowedImageTypes = ['jpg', 'jpeg', 'png', 'gif', 'webp']
			if (!allowedImageTypes.includes(fileExt)) {
				throw new Error('不支持的图片类型')
			}
		} else if (fileType === 'video') {
			if (!allowedVideoTypes.includes(fileExt)) {
				throw new Error('不支持的视频类型')
			}
		} else {
			throw new Error('不支持的文件类型')
		}
		
		// 使用修改后的路径生成方法，传入文件类型和扩展名
		const cloudPathNew = createCloudPath(fileType, fileExt)
		
		// 获取 extStorageManager 对象实例
		const extStorageManager = uniCloud.getExtStorageManager({
			provider: "qiniu",
			domain: "https://aly2.jingle0350.cn",
		});
		
		// 根据文件类型选择处理参数
		const persistentOps = fileType === 'image' ? imageOps : videoOps;
		
		// 调用 extStorageManager.getUploadFileOptions
		let uploadFileOptionsRes = extStorageManager.getUploadFileOptions({
			cloudPath: cloudPathNew,
			allowUpdate: false,
			persistentOps: persistentOps,
			metadata: {
				fileType: fileType,
				uploadTime: Date.now()
			}
		});
		
		const domain = "https://aly2.jingle0350.cn";
		const fileURL = `${domain}/${cloudPathNew}`;
		
		// 根据文件类型返回不同的URL
		if (fileType === 'image') {
			return {
				...uploadFileOptionsRes,
				fileURL,
				compressedURL: `${fileURL}?imageMogr2/thumbnail/!1080x1920r/format/webp/quality/80|${watermarkMedium}`,
				thumbnailURL: `${fileURL}?imageMogr2/thumbnail/!300x300r/format/webp/quality/70|${watermarkSmall}`,
				cloudPath: cloudPathNew // 添加 cloudPath
			};
		} else if (fileType === 'video') {
			// 生成转码后的文件名
			const transcodedKey = cloudPathNew.replace(/\.mp4$/, '_trans.mp4');
			
			// 构建七牛云实时转码 URL
			const encodedOps = urlsafeBase64Encode(videoTranscodeParams);
			const transcodeURL = `${fileURL}?${encodedOps}`;
			
			// 构建封面图 URL，保持宽高比
			const thumbnailURL = `${fileURL}?vframe/jpg/offset/0/w/1920/h/!1080/rotate/auto/format/jpg/q/85`;
			
			// 添加额外的视频处理参数 - 去掉末尾的图片处理部分
			const processedVideoURL = `${fileURL}?avthumb/mp4/s/1920x1080/vb/4096k/ab/192k/ar/44100/acodec/aac/vcodec/libx264/crf/23`;
			
			return {
				...uploadFileOptionsRes,
				fileURL,
				compressedURL: processedVideoURL,
				thumbnailURL: thumbnailURL,
				cloudPath: cloudPathNew,
				video: {
					url: fileURL,
					cloudPath: cloudPathNew,
					compressed: processedVideoURL,
					thumbnail: thumbnailURL
				}
			};
		}
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
			
			// 处理每篇文章的图片和视频URL
			const processedData = result.data.map(article => {
				// 处理图片URL
				if (!article.images || !Array.isArray(article.images)) {
					article.images = []
				}
				
				const imageUrls = article.images.map(image => {
					if (!image || !image.cloudPath) return null
					
					const fileURL = `${domain}/${image.cloudPath}`
					return {
						original: fileURL,
						compressed: `${fileURL}?imageMogr2/thumbnail/!1080x1920r/format/webp/quality/80|${watermarkMedium}`,
						thumbnail: `${fileURL}?imageMogr2/thumbnail/!300x300r/format/webp/quality/70|${watermarkSmall}`
					}
				}).filter(url => url !== null)
				
				// 处理视频URL
				let videoUrls = null
				if (article.video && article.video.cloudPath) {
					const videoFileURL = `${domain}/${article.video.cloudPath}`
					videoUrls = {
						original: videoFileURL,
						compressed: `${videoFileURL}?avthumb/mp4/s/1280x720/vb/1024k`,
						thumbnail: `${videoFileURL}?vframe/jpg/offset/0`,
						duration: article.video.duration || 0
					}
				}
				
				return {
					...article,
					imageUrls,
					videoUrls
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
	},

	async deleteArticle(id) {
		if (!id) {
			return {
				code: -1,
				message: '文章ID不能为空'
			}
		}

		const db = uniCloud.database()
		
		try {
			// 1. 先获取文章信息，用于删除相关的媒体文件
			const article = await db.collection('articles').doc(id).get()
			
			if (!article.data || article.data.length === 0) {
				return {
					code: -1,
					message: '文章不存在'
				}
			}

			const articleData = article.data[0]
			const extStorageManager = uniCloud.getExtStorageManager({
				provider: "qiniu",
				domain: "https://aly2.jingle0350.cn",
			})

			// 2. 删除文章关联的图片
			if (articleData.images && Array.isArray(articleData.images)) {
				for (const image of articleData.images) {
					if (image && image.cloudPath) {
						await extStorageManager.deleteFile({
							fileList: [image.cloudPath]
						})
					}
				}
			}

			// 3. 删除文章关联的视频
			if (articleData.video && articleData.video.cloudPath) {
				await extStorageManager.deleteFile({
					fileList: [articleData.video.cloudPath]
				})
			}

			// 4. 删除文章数据库记录
			await db.collection('articles').doc(id).remove()

			return {
				code: 0,
				message: '删除成功'
			}
		} catch (e) {
			console.error('删除文章失败:', e)
			return {
				code: -1,
				message: '删除文章失败',
				error: e.message
			}
		}
	}
}
