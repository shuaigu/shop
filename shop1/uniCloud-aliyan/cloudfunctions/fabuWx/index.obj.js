// 添加数据缓存
const cache = new Map()

// 配置常量
const DOMAIN = "https://aly2.jingle0350.cn"
const DEFAULT_IMAGE = "default.png" // 修正了拼写错误 (defalut → default)

// 水印配置
const WATERMARK_COLORS = {
	// 橙色 - 酒旅圈圈品牌色（RGB: 255,102,0）
	orange: 'I0ZGNjYwMA==', //rgba(255, 102, 0, 0.33)
	// 白色
	white: 'I0ZGRkZGRg==', //rgba(255, 255, 255, 0.34)
	// 黑色
	black: 'IzAwMDAwMA==', // #000000
	// 红色
	red: 'I0ZGMDAwMA==', // #FF0000
	// 蓝色
	blue: 'IzAwNjZGRg==', // #0066FF
	// 半透明黑色
	transBlack: 'IzAwMDAwMDgw', // #00000080
	// 半透明白色
	transWhite: 'I0ZGRkZGRjgw' // #FFFFFF80
}

// 当前使用的水印颜色
const CURRENT_WATERMARK_COLOR = WATERMARK_COLORS.white;
// 水印透明度（0-100）
const WATERMARK_OPACITY = 55;

// 水印图片配置 - 使用相对路径避免URL过长
const WATERMARK_IMAGE = `logo.png`; // 使用相对路径
const USE_IMAGE_WATERMARK = true; // 控制是否使用图片水印

// 构建七牛云URL助手函数
function buildQiniuUrl(path, params = null) {
	const url = `${DOMAIN}/${path}`
	return params ? `${url}?${params}` : url
}

const createCloudPath = (fileType, fileExt, isAvatar = false) => {
	const date = new Date()
	const year = date.getFullYear()
	const month = String(date.getMonth() + 1).padStart(2, '0')
	const day = String(date.getDate()).padStart(2, '0')
	const timestamp = Date.now()
	const randomStr = Math.random().toString(36).slice(2, 10)
	
	// 如果是头像，使用 2025/touxiang/ 目录
	if (isAvatar) {
		return `${year}/touxiang/${timestamp}_${randomStr}.${fileExt}`
	}
	
	// 构建新的文件路径: 2025年/图片或视频/年月日/时间戳_随机字符.扩展名
	const mediaType = fileType === 'image' ? 'tupian' : 'shipin'
	return `${year}/${mediaType}/${year}${month}${day}/${timestamp}_${randomStr}.${fileExt}`
}

// 修复 URL 安全的 Base64 编码函数 - 改进七牛云兼容性
function urlsafeBase64Encode(str) {
	// 确保输入是字符串
	if (typeof str !== 'string') {
		str = String(str || '');
	}
	
	try {
		// 七牛云要求Base64编码必须是UTF-8编码后的字符串
		// 直接使用七牛云推荐的编码方式
		const utf8Str = unescape(encodeURIComponent(str));
		
		// 执行Base64编码
		let base64 = btoa(utf8Str);
		
		// 替换特殊字符，使其URL安全
		base64 = base64
			.replace(/\+/g, '-')
			.replace(/\//g, '_');
			
		// 在七牛云URL中使用Base64时不需要去掉等号，保留它们
		return base64;
	} catch (error) {
		console.error('Base64编码错误:', error);
		// 返回已编码的默认文本 "精选商城"
		return '57K-6L-H5Z-O5biC';
	}
}

// 设置七牛云图片处理参数
// 添加水印文字
const watermarkText = urlsafeBase64Encode("酒旅圈圈");

// 根据图片形状生成水印参数（只使用图片水印）
function getWatermarkParams(imageWidth, imageHeight, isThumb = false) {
	// 使用图片水印
	return getImageWatermarkParams(imageWidth, imageHeight, isThumb);
}

// 图片水印参数生成 - 优化版本，确保URL不会过长
function getImageWatermarkParams(imageWidth, imageHeight, isThumb = false) {
	// 默认水印参数 - 使用更简洁的参数
	let wmScale = 0.18;
	let dx = 10; // 七牛云要求最小10px
	let dy = 10;
	
	// 如果是缩略图，使用更小的水印
	if (isThumb) {
		wmScale = 0.15;
		return `watermark/1/image/${urlsafeBase64Encode(WATERMARK_IMAGE)}/dissolve/${WATERMARK_OPACITY}/gravity/SouthEast/dx/10/dy/10`;
	}
	
	// 如果提供了宽高信息，根据图片形状调整水印大小
	if (imageWidth && imageHeight) {
		const ratio = imageWidth / imageHeight;
		
		// 根据图片形状调整水印大小
		if (ratio < 0.8) {
			// 竖图
			wmScale = 0.15;
		} else if (ratio > 1.5) {
			// 横图
			wmScale = 0.2;
		} else {
			// 方图
			wmScale = 0.18;
		}
		
		// 如果图片很小，进一步减小水印但确保有最小可见大小
		const minDimension = Math.min(imageWidth, imageHeight);
		if (minDimension < 800) {
			wmScale = Math.max(0.12, wmScale * (minDimension / 1000));
		}
	}
	
	// 使用简化的水印URL - 移除ws参数减少URL长度
	const watermarkUrl = `watermark/1/image/${urlsafeBase64Encode(WATERMARK_IMAGE)}/dissolve/${WATERMARK_OPACITY}/gravity/SouthEast/dx/10/dy/10`;
	
	return watermarkUrl;
}

// 文字水印参数生成（保留原功能）
function getTextWatermarkParams(imageWidth, imageHeight, isThumb = false) {
	// 默认水印参数
	let fontSize = 500;
	let dx = 50;  // 修改为50px
	let dy = 50;  // 修改为50px
	
	// 如果是缩略图，使用更小的水印
	if (isThumb) {
		fontSize = 260;
		dx = 25;
		dy = 25;
		return `watermark/2/text/${watermarkText}/font/5a6L5L2T/fontsize/${fontSize}/fill/${CURRENT_WATERMARK_COLOR}/dissolve/${WATERMARK_OPACITY}/gravity/NorthEast/dx/${dx}/dy/${dy}`;
	}
	
	// 如果提供了宽高信息，根据图片宽度动态计算字号（1080x的1/4宽度）
	if (imageWidth && imageHeight) {
		// 根据图片宽度计算字号，使水印宽度为图片宽度的1/4
		// 对于1080px宽度的图片：
		// - 目标水印宽度 = 1080 × 0.25 = 270px
		// - 4个汉字：字号 × 4 ≈ 水印宽度
		// - 所以：fontSize = imageWidth × 0.25 / 4 = imageWidth × 0.0625
		fontSize = Math.round(imageWidth * 0.0625);
		
		// 限制字号范围：150-800
		fontSize = Math.max(150, Math.min(800, fontSize));
		
		// 计算宽高比
		const ratio = imageWidth / imageHeight;
		
		// 根据图片形状调整边距
		if (ratio < 0.8) {
			// 竖图
			dx = 30;
			dy = 30;
		} else if (ratio > 1.2) {
			// 横图
			dx = 60;
			dy = 60;
		} else {
			// 正方形
			dx = 50;
			dy = 50;
		}
		
		// 如果图片很小，进一步减小水印
		const minDimension = Math.min(imageWidth, imageHeight);
		if (minDimension < 800) {
			fontSize = Math.max(150, Math.round(fontSize * (minDimension / 800)));
			dx = Math.max(20, Math.round(dx * (minDimension / 800)));
			dy = Math.max(20, Math.round(dy * (minDimension / 800)));
		}
	}
	
	return `watermark/2/text/${watermarkText}/font/5a6L5L2T/fontsize/${Math.round(fontSize)}/fill/${CURRENT_WATERMARK_COLOR}/dissolve/${WATERMARK_OPACITY}/gravity/NorthEast/dx/${Math.round(dx)}/dy/${Math.round(dy)}`;
}

// 基本图片处理参数（不含水印）
const baseImageOps = [
	// 原图处理
	`imageMogr2/auto-orient/format/webp`,
	// 压缩图 - 用于文章显示
	`imageMogr2/auto-orient/thumbnail/!1080x1920r/format/webp/quality/80`
];

// 默认的水印参数 - 简化版本，减少URL长度
const defaultWatermarkParams = USE_IMAGE_WATERMARK 
	? `watermark/1/image/${urlsafeBase64Encode(WATERMARK_IMAGE)}/dissolve/55/gravity/SouthEast/dx/10/dy/10`
	: `watermark/2/text/${watermarkText}/font/5a6L5L2T/fontsize/400/fill/${CURRENT_WATERMARK_COLOR}/dissolve/55/gravity/SouthEast/dx/20/dy/20`;

const defaultThumbWatermarkParams = USE_IMAGE_WATERMARK
	? `watermark/1/image/${urlsafeBase64Encode(WATERMARK_IMAGE)}/dissolve/55/gravity/SouthEast/dx/10/dy/10`
	: `watermark/2/text/${watermarkText}/font/5a6L5L2T/fontsize/300/fill/${CURRENT_WATERMARK_COLOR}/dissolve/55/gravity/SouthEast/dx/10/dy/10`;

// 简化图片处理参数（当无法获取图片尺寸时使用）
const imageOps = [
	// 压缩图 - 用于文章显示，宽度限制1080px
	`imageMogr2/thumbnail/1080x`
].join('|');

// 添加视频文件类型检查
const allowedVideoTypes = ['mp4', 'mov', 'm4v']

module.exports = {
	getUploadFileOptions(data = {}) {
		let { 
			cloudPath, // 前端传过来的文件路径
			fileType = 'image',  // 默认为图片类型
			isOriginal = false, // 是否保持原始文件
			imageWidth, // 图片宽度
			imageHeight // 图片高度
		} = data;
		
		// 获取文件扩展名
		const fileExt = cloudPath.split('.').pop().toLowerCase()
		
		// 检测是否为头像上传（根据cloudPath中是否包含 'avatar'）
		const isAvatar = cloudPath.includes('avatar')
		
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
		
		// 使用修改后的路径生成方法，传入文件类型、扩展名和头像标识
		const cloudPathNew = createCloudPath(fileType, fileExt, isAvatar)
		
		// 获取 extStorageManager 对象实例
		const extStorageManager = uniCloud.getExtStorageManager({
			provider: "qiniu",
			domain: "https://aly2.jingle0350.cn",
		});
		
		// 简化文件类型处理参数 - 只处理一次
		let persistentOps;
		
		if (fileType === 'image') {
			// 原图模式：不进行任何处理
			persistentOps = '';
		} else {
			// 视频不进行处理
			persistentOps = '';
		}
		
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
		
		// 根据文件类型返回简化的URL
		if (fileType === 'image') {
			// 图片上传：直接使用原图URL，不生成压缩版本
			const result = {
				uploadFileOptions: {
					...uploadFileOptionsRes.uploadFileOptions,
					name: 'file', // 添加文件字段名（关键）
					filePath: '' // 前端会填充实际文件路径
				},
				url: fileURL, // 原图URL（主要字段）
				fileURL, // 原图URL
				compressedURL: fileURL, // 直接使用原图URL
				thumbnailURL: fileURL, // 直接使用原图URL
				cloudPath: cloudPathNew
			};
			
			// 上传时打印详细日志
			console.log('====== 图片上传配置生成（原图模式）======');
			console.log('是否为头像:', isAvatar);
			console.log('文件路径:', cloudPathNew);
			console.log('图片尺寸:', imageWidth, 'x', imageHeight);
			console.log('原图URL:', result.url);
			console.log('上传配置:', uploadFileOptionsRes.uploadFileOptions ? '✅ 存在' : '❌ 缺失');
			console.log('文件字段名:', result.uploadFileOptions.name);
			console.log('说明: 直接使用原图URL，无压缩处理');
			console.log('=======================================');
			
			return result;
		} else if (fileType === 'video') {
			// 只返回原始视频URL和简单的封面图URL
			const thumbnailURL = `${fileURL}?vframe/jpg/offset/0/w/640/h/360/rotate/auto`;
			
			return {
				...uploadFileOptionsRes,
				fileURL,
				thumbnailURL: thumbnailURL,
				cloudPath: cloudPathNew,
				video: {
					url: fileURL,
					cloudPath: cloudPathNew,
					thumbnail: thumbnailURL
				}
			};
		}
	},

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
				// 直接返回原始数据，不做额外处理
				return article;
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
	},

	// 添加更新分类图标的方法
	async updateCategoryIcon(params) {
		try {
			// 解构参数
			const { categoryId, iconURL } = params;
			
			// 参数验证
			if (!categoryId) {
				return {
					code: -1,
					message: '分类ID不能为空',
					updated: false
				};
			}
			
			if (!iconURL) {
				return {
					code: -1,
					message: '图标URL不能为空',
					updated: false
				};
			}
			
			// 初始化数据库连接
			const db = uniCloud.database();
			
			// 只更新一个cate_img字段
			const updateResult = await db.collection('cateList')
				.doc(categoryId)
				.update({
					cate_img: iconURL,
					update_time: new Date()
				});
			
			console.log('分类图标更新结果:', updateResult);
			
			// 检查更新结果
			if (updateResult.updated) {
				return {
					code: 0,
					message: '分类图标更新成功',
					updated: true,
					data: {
						categoryId,
						iconURL
					}
				};
			} else {
				return {
					code: -1,
					message: '分类不存在或未更新',
					updated: false
				};
			}
		} catch (error) {
			console.error('更新分类图标失败:', error);
			return {
				code: -1,
				message: '更新分类图标失败: ' + error.message,
				updated: false,
				error: error.message
			};
		}
	},

	// 解析快手视频链接（纯净模式）
	async parseKuaishouVideoLink(url) {
		try {
			if (!url || typeof url !== 'string') {
				return {
					code: -1,
					message: '链接不能为空'
				};
			}

			console.log('收到视频链接:', url);

			// 检测是否是快手平台的视频链接
			const isKuaishouVideo = url.includes('kwimgs.com') || url.includes('kuaishou.com');
			
			if (!isKuaishouVideo) {
				return {
					code: -1,
					message: '请粘贴快手视频链接（包含kwimgs.com或kuaishou.com）'
				};
			}

			// 去除URL参数（问号后的部分）
			const cleanUrl = url.split('?')[0];
			
			console.log('原始链接:', url);
			console.log('纯净链接:', cleanUrl);

			return {
				code: 0,
				message: '快手视频链接处理成功',
				data: {
					originalUrl: url,
					cleanUrl: cleanUrl,
					videoUrl: cleanUrl
				}
			};

		} catch (error) {
			console.error('处理视频链接失败:', error);
			return {
				code: -1,
				message: '处理失败: ' + error.message,
				error: error.message
			};
		}
	}
}
