const db = uniCloud.database()
const dbCmd = db.command
const dbJQL = uniCloud.database( )
const { fixTempAvatars } = require('./fix-temp-avatars.js')
const { cleanAllTempAvatars } = require('./clean-temp-avatars.js')

module.exports = {
	_before: function() {
		// 初始化数据库连接
		this.db = uniCloud.database()
		this.dbCmd = this.db.command
		this.userCollection = this.db.collection('uni-id-users')
		this.articleCollection = this.db.collection('articleList')
		this.commentCollection = this.db.collection('commentList')
		this.viewRecordCollection = this.db.collection('viewRecord')
		this.bargainRecordCollection = this.db.collection('kanjia')
	},
	/**
	 * addReady 获取分类和定位
	 * @param {string} location 定位
	 * @returns {object} 返回值 -- 分类和定位
	 */
	async addReady( location ) {
		// 获取所有分类
		const cateRes = await dbJQL.collection( "cateList" ).get( )
		// 获取当前位置
		let baseKey = '13ea1fa3cce63f7f06e130e174eea9ab'

		// 获取当前用户位置
		const locaRes = await uniCloud.request( {
			url: `https://restapi.amap.com/v3/geocode/regeo?key=${baseKey}&location=${location}&extensions=base`,
			method: 'GET'
		} )
		console.log( locaRes, '后端地址' )
		const district = locaRes.data.regeocode.addressComponent.district
		const address = locaRes.data.regeocode.formatted_address
		return {
			cateList: cateRes.data,
			district,
			address
		}
	},
	/**
	 * addArticle 新增文章
	 * @param {Object} params  
	 * @returns {object} 返回值描述
	 */
	async addArticle( params ) {
		const {
			user_id,
			content,
			images,
			videoURL,
			cate_id,
			address,
			district,
			user_nickName,
			user_avatarUrl,
			user_mobile,
			pay_amount = 0,
			is_location_based_category = false,
			category_info = null,
			share_cover_image = '', // 添加分享封面图参数
			// 砍价相关参数
			enable_bargain = false,
			bargain_initial_price = 0,
			bargain_step = 10,
			// 新增砂价策略配置
			bargain_mode = 'fixed',
			bargain_min_amount = 5,
			bargain_max_amount = 20,
			bargain_percentage = 1,
			bargain_decrease_rate = 0.8,
			bargain_popup_image = '',
			bargain_popup_text = '',
			bargain_amount_text = '',
			bargain_end_time = null,
			// 买断功能参数
			enable_buyout = false
		} = params
		
		// 🔍 关键调试：打印接收到的参数
		console.log('====== 云函数接收到的参数 ======')
		console.log('share_cover_image参数:', share_cover_image)
		console.log('完整params:', JSON.stringify(params, null, 2))
		console.log('==================================')
		
		// 参数校验
		if ( !user_id ) throw new Error( '用户ID不能为空' )
		if ( !content || !content.trim( ) ) throw new Error( '内容不能为空' )
		// 允许cate_id为null，支持无分类发布
		
		// 验证并处理用户头像URL - 防止临时文件写入数据库
		let validAvatarUrl = user_avatarUrl || '/static/images/touxiang.png'
		if (validAvatarUrl.startsWith('http://tmp/') || validAvatarUrl.startsWith('wxfile://')) {
			console.warn('🚨 [云函数] 检测到临时头像文件，使用默认头像:', validAvatarUrl)
			validAvatarUrl = '/static/images/touxiang.png'
		}
		
		console.log('👤 [云函数-addArticle] 用户头像信息:');
		console.log('  - 用户ID:', user_id);
		console.log('  - 用户昵称:', user_nickName);
		console.log('  - 接收到的头像URL:', user_avatarUrl);
		console.log('  - 最终存入数据库的头像URL:', validAvatarUrl);
		// 新增文章 - 将 state 默认设置为 1 (已通过)
		return await this.articleCollection.add( {
			user_id,
			content,
			images,
			videoURL,
			cate_id: cate_id || null, // 允许为null
			address: address || null, // 允许为null
			district: district || null, // 允许为null
			user_nickName,
			user_avatarUrl: validAvatarUrl,
			user_mobile,
			like_count: 0,
			comment_count: 0,
			state: 1,
			look_count: 0,
			create_time: Date.now( ),
			update_time: Date.now( ),
			pay_amount: pay_amount || 0,
			is_location_based_category,
			category_info, // 保存完整的分类信息，包括图标URL
			share_cover_image: share_cover_image || '', // 保存分享封面图
			// 砍价功能相关字段
			enable_bargain: enable_bargain || false,
			bargain_initial_price: enable_bargain ? (bargain_initial_price || 0) : 0,
			bargain_step: enable_bargain ? (bargain_step || 10) : 10,
			// 新增砍价策略配置
			bargain_mode: enable_bargain ? (bargain_mode || 'fixed') : 'fixed',
			bargain_min_amount: enable_bargain ? (bargain_min_amount || 5) : 5,
			bargain_max_amount: enable_bargain ? (bargain_max_amount || 20) : 20,
			bargain_percentage: enable_bargain ? (bargain_percentage || 1) : 1,
			bargain_decrease_rate: enable_bargain ? (bargain_decrease_rate || 0.8) : 0.8,
			bargain_popup_image: enable_bargain ? (bargain_popup_image || '') : '',
			bargain_popup_text: enable_bargain ? (bargain_popup_text || '') : '',
			bargain_amount_text: enable_bargain ? (bargain_amount_text || '') : '',
			bargain_end_time: enable_bargain ? (bargain_end_time || null) : null,
			enable_buyout: enable_bargain ? !!enable_buyout : false
		} )
	},
	
	/**
	 * updateArticle 更新文章
	 * @param {string} article_id 文章ID
	 * @param {Object} params 更新参数
	 * @returns {object} 返回值描述
	 */
	async updateArticle(article_id, params) {
		const {
			content,
			images,
			videoURL,
			cate_id,
			address,
			district,
			pay_amount = 0,
			is_location_based_category = false,
			category_info = null,
			share_cover_image = '', // 添加分享封面图参数
			// 砍价相关参数
			enable_bargain = false,
			bargain_initial_price = 0,
			bargain_step = 10,
			bargain_mode = 'fixed',
			bargain_min_amount = 5,
			bargain_max_amount = 20,
			bargain_percentage = 1,
			bargain_decrease_rate = 0.8,
			bargain_popup_image = '',
			bargain_popup_text = '',
			bargain_amount_text = '',
			bargain_end_time = null,
			enable_buyout = false
		} = params
		
		// 参数校验
		if (!article_id) throw new Error('文章ID不能为空')
		if (!content || !content.trim()) throw new Error('内容不能为空')
		
		// 更新文章
		return await this.articleCollection.doc(article_id).update({
			content,
			images,
			videoURL,
			cate_id: cate_id || null,
			address: address || null,
			district: district || null,
			update_time: Date.now(),
			pay_amount: pay_amount || 0,
			is_location_based_category,
			category_info,
			share_cover_image: share_cover_image || '', // 保存分享封面图
			// 砍价功能相关字段
			enable_bargain: enable_bargain || false,
			bargain_initial_price: enable_bargain ? (bargain_initial_price || 0) : 0,
			bargain_step: enable_bargain ? (bargain_step || 10) : 10,
			bargain_mode: enable_bargain ? (bargain_mode || 'fixed') : 'fixed',
			bargain_min_amount: enable_bargain ? (bargain_min_amount || 5) : 5,
			bargain_max_amount: enable_bargain ? (bargain_max_amount || 20) : 20,
			bargain_percentage: enable_bargain ? (bargain_percentage || 1) : 1,
			bargain_decrease_rate: enable_bargain ? (bargain_decrease_rate || 0.8) : 0.8,
			bargain_popup_image: enable_bargain ? (bargain_popup_image || '') : '',
			bargain_popup_text: enable_bargain ? (bargain_popup_text || '') : '',
			bargain_amount_text: enable_bargain ? (bargain_amount_text || '') : '',
			bargain_end_time: enable_bargain ? (bargain_end_time || null) : null,
			enable_buyout: enable_bargain ? !!enable_buyout : false
		})
	},
	/**
	 * getArticle 根据分类获取文章列表
	 * @param {string}  cate_id 分类id
	 * @returns {object} 返回值 -- 文章对象
	 */
	async getArticle( cate_id, pageNo = 1, pageSize = 5 ) {

		try {
			// 基础查询条件
			const whereCondition = { state: 1 }
			let orderByField = 'create_time'
			let orderByType = 'desc'

			// 根据分类ID设置查询条件和排序规则
			if ( cate_id === '02' ) {
				orderByField = 'like_count'
			} else if ( cate_id && cate_id !== '01' ) {
				// 检查分类是否可见
				const cateCollection = this.db.collection('cateList')
				const cateResult = await cateCollection.doc(cate_id).get()
				
				// 如果分类不存在或已被隐藏，则返回空数据
				if (!cateResult.data || cateResult.data.length === 0 || cateResult.data[0].is_visible === false) {
					return {
						code: 0,
						message: '分类不可见或不存在',
						data: []
					}
				}
				
				whereCondition.cate_id = cate_id
			}
			// 当cate_id为空或'01'时，不过滤cate_id，显示所有文章（包括无分类的）

			const res = await this.articleCollection
				.where( whereCondition )
				.orderBy( orderByField, orderByType )
				.skip( ( pageNo - 1 ) * pageSize )
				.limit( pageSize )
				.get( )

			return {
				code: 0,
				message: '获取成功',
				data: res.data
			}
		} catch ( err ) {
			console.error( '查询失败:', err )
			return {
				code: -1,
				message: '获取失败',
				error: err.message
			}
		}
	},

	/**
	 * getArticleDetal 根据文章id获取文章列表
	 * @param {string}  article_id 文章id
	 * @returns {object} 返回值 -- 文章对象
	 */
	async getArticleDetal(articleId) {
		try {
			// 检查文章ID是否存在
			if (!articleId) {
				throw new Error('文章ID不能为空')
			}

			let articleRes;
			
			// 判断是否为精简ID（19位，来自小程序码scene）
			if (articleId.length === 19) {
				console.log('检测到19位ID，使用模糊匹配:', articleId);
				// 使用正则表达式匹配以articleId开头的文章
				articleRes = await this.articleCollection
					.where({
						_id: this.dbCmd.regex({
							regexp: '^' + articleId,
							options: 'i'
						})
					})
					.limit(1)
					.get();
			} else {
				// 使用完整ID精确查询
				articleRes = await this.articleCollection
					.doc(articleId)
					.get();
			}

			// 检查文章是否存在
			if (!articleRes.data || articleRes.data.length === 0) {
				throw new Error('文章不存在')
			}
			
			// 获取实际的文章ID（用于查询评论）
			const actualArticleId = articleRes.data[0]._id;

			// 获取评论列表
			const commentRes = await this.commentCollection
				.where({
					article_id: actualArticleId
				})
				.orderBy('create_time', 'desc')
				.get()

			return {
				articleRes,
				comment: commentRes.data || []
			}
		} catch (err) {
			console.error('获取文章详情失败:', err)
			throw new Error('获取文章详情失败')
		}
	},
	/**
	 * getArticleList 获取用户文章列表
	 * @param {string}  user_id 用户id
	 * @returns {object} 返回值 -- 文章对象
	 */
	async getArticleList( user_id, pageNo = 1, pageSize = 5 ) {
		if ( !user_id ) return '当前文章已删除'

		// 获取分页数据
		const res = await this.articleCollection
			.where( { user_id: user_id } )
			.orderBy( 'create_time', 'desc' )
			.skip( ( pageNo - 1 ) * pageSize )
			.limit( pageSize )
			.get( )

		// 获取用户文章总数
		const countResult = await this.articleCollection
			.where( { user_id: user_id } )
			.count()

		// 🔥 优化：始终从用户表查询最新的用户信息，确保头像和昵称是最新的
		let userInfo = null;
		
		console.log('👤 [云函数-getArticleList] 开始查询用户信息, user_id:', user_id);
		
		try {
			// 始终从user表查询用户信息，确保数据准确性
			const userResult = await this.db.collection('user').doc(user_id).get();
			
			if (userResult.data && userResult.data.length > 0) {
				const userData = userResult.data[0];
				userInfo = {
					avatarUrl: userData.avatarUrl || '',
					nickName: userData.nickName || '未设置昵称',
					mobile: userData.mobile || ''
				};
				console.log('👤 [云函数-getArticleList] 从user表获取用户信息成功');
				console.log('👤 [云函数-getArticleList] avatarUrl:', userInfo.avatarUrl);
				console.log('👤 [云函数-getArticleList] nickName:', userInfo.nickName);
				console.log('👤 [云函数-getArticleList] mobile:', userInfo.mobile);
			} else {
				console.log('⚠️ [云函数-getArticleList] user表中未找到该用户, user_id:', user_id);
			}
		} catch (err) {
			console.error('❌ [云函数-getArticleList] 查询user表失败:', err);
		}

		return {
			data: res.data || [],
			userInfo,
			total: countResult.total || 0,
			pageNo,
			pageSize
		}
	},
	/**
	 * getUserArticleCount 获取指定用户的文章总数
	 * @param {string} user_id 用户id
	 * @returns {object} 返回用户的文章总数
	 */
	async getUserArticleCount(user_id) {
		if (!user_id) {
			throw new Error('用户ID不能为空')
		}

		try {
			// 查询指定用户的文章总数
			const countResult = await this.articleCollection
				.where({ user_id: user_id, state: 1 }) // 只统计已通过审核的文章
				.count()
			
			return {
				code: 0,
				message: '获取用户文章总数成功',
				total: countResult.total
			}
		} catch (err) {
			console.error('获取用户文章总数失败:', err)
			return {
				code: -1,
				message: '获取用户文章总数失败',
				error: err.message
			}
		}
	},
	/**
	 * clickLike 点赞当前文章
	 * @param {string}  article_id 文章id
	 * @param {boolean} likeState 点赞状态
	 * @returns {object} 返回值 -- 文章对象
	 */
	async clickLike(article_id, user_id, is_liked) {
		console.log('点赞操作参数:', { article_id, user_id, is_liked });
		
		// 验证参数
		if (!article_id || !user_id) {
			throw new Error('参数不完整');
		}
		
		// 获取用户信息（用于保存到点赞记录）
		let userInfo = null;
		try {
			const userRes = await this.db.collection('user').doc(user_id).get();
			if (userRes.data && userRes.data[0]) {
				userInfo = userRes.data[0];
			}
		} catch (err) {
			console.error('获取用户信息失败:', err);
		}
		
		if ( !is_liked ) {
			// 点赞操作
			console.log( '执行点赞操作' );
			
			// 先检查是否已存在点赞记录（防止重复点赞）
			const existingRecord = await this.db.collection('likeRecord')
				.where({
					user_id: user_id,
					article_id: article_id,
					record_type: 'like'
				})
				.get();
			
			if (existingRecord.data && existingRecord.data.length > 0) {
				console.log('点赞记录已存在，直接返回');
				// 如果记录已存在，直接返回当前点赞数
				const article = await this.articleCollection.doc(article_id).get();
				const currentLikeCount = article.data && article.data[0] ? article.data[0].like_count : 0;
				return {
					errCode: 0,
					errMsg: '已点赞',
					is_liked: true,
					like_count: currentLikeCount
				};
			}
			
			// 文章点赞数 +1
			await this.articleCollection
				.doc( article_id )
				.update( { like_count: this.dbCmd.inc( 1 ) } );

			// 添加点赞记录
			const likeRecordData = {
				user_id,
				article_id,
				like_status: 1,
				record_type: 'like',
				create_time: Date.now()
			};
			
			// 如果有用户信息，添加昵称和头像
			if (userInfo) {
				likeRecordData.nickname = userInfo.nickname || userInfo.nickName || '匿名用户';
				likeRecordData.avatar = userInfo.avatarUrl || userInfo.avatar || '';
			}
			
			console.log('添加点赞记录:', likeRecordData);
			await this.db.collection( "likeRecord" ).add( likeRecordData );
			
			// 获取更新后的文章数据，返回最新的点赞数
			const updatedArticle = await this.articleCollection.doc(article_id).get();
			const newLikeCount = updatedArticle.data && updatedArticle.data[0] ? updatedArticle.data[0].like_count : 0;
			console.log('点赞后的like_count:', newLikeCount);

			return {
				errCode: 0,
				errMsg: '点赞成功',
				is_liked: true,
				like_count: newLikeCount
			};
		} else {
			// 取消点赞操作
			console.log('执行取消点赞操作');
			
			// 先检查点赞记录是否存在
			const existingRecord = await this.db.collection('likeRecord')
				.where({
					user_id: user_id,
					article_id: article_id,
					record_type: 'like'
				})
				.get();
			
			if (!existingRecord.data || existingRecord.data.length === 0) {
				console.log('点赞记录不存在，直接返回');
				// 如果记录不存在，直接返回当前点赞数
				const article = await this.articleCollection.doc(article_id).get();
				const currentLikeCount = article.data && article.data[0] ? article.data[0].like_count : 0;
				return {
					errCode: 0,
					errMsg: '未点赞',
					is_liked: false,
					like_count: currentLikeCount
				};
			}
			
			// 文章点赞数 -1（但不能小于0）
			await this.articleCollection
				.doc( article_id )
				.update( { like_count: this.dbCmd.inc( -1 ) } );

			// 删除点赞记录
			console.log('删除点赞记录');
			const removeResult = await this.db.collection( 'likeRecord' )
				.where( { user_id: user_id, article_id: article_id, record_type: 'like' } )
				.remove();
			
			console.log('删除结果:', removeResult);
			
			// 获取更新后的文章数据，返回最新的点赞数
			const updatedArticle = await this.articleCollection.doc(article_id).get();
			let newLikeCount = updatedArticle.data && updatedArticle.data[0] ? updatedArticle.data[0].like_count : 0;
			
			// 确保点赞数不为负数
			if (newLikeCount < 0) {
				console.log('点赞数小于0，修正为0');
				await this.articleCollection.doc(article_id).update({ like_count: 0 });
				newLikeCount = 0;
			}
			
			console.log('取消点赞后的like_count:', newLikeCount);

			return {
				errCode: 0,
				errMsg: '取消点赞',
				is_liked: false,
				like_count: newLikeCount
			};
		}
	},

	/**
	 * del  删除文章
	 * @param {string} article_id 当前文章的id
	 * @param {string} user_id 当前操作的用户ID
	 * @returns {object} 返回删除状态
	 */
	async del( article_id, user_id ) {
		if ( !user_id ) {
			throw new Error( '用户未登录' )
		}

		// 根据id获取当前文章
		const article = await this.articleCollection.doc( article_id ).get( )
		if ( !article.data || article.data.length === 0 ) {
			throw new Error( '文章不存在' )
		}

		// 确保类型一致的比较
		const articleUserId = article.data[ 0 ].user_id.toString( )
		const currentUserId = user_id.toString( )

		// 验证是否是文章作者
		if ( articleUserId !== currentUserId ) {
			throw new Error( '无权删除他人文章' )
		}

		// 执行删除
		const result = await this.articleCollection.doc( article_id ).remove( )

		return {
			deleted: result.deleted > 0
		}
	},
	/**
	 * getAdminArticles 获取管理后台文章列表
	 * @param {number} state 文章状态 0-待审核 1-已通过 2-已拒绝，不传则获取全部
	 * @returns {object} 返回文章列表和统计信息
	 */
	async getAdminArticles( params = {} ) {
		const { state } = params
		let query = this.articleCollection

		// 如果传入了状态，添加状态筛选
		if ( typeof state === 'number' ) {
			query = query.where( {
				state: state
			} )
		}

		// 按时间倒序排序
		query = query.orderBy( 'create_time', 'desc' )

		const res = await query.get( )

		// 获取统计数据
		const countRes = await Promise.all( [
			this.articleCollection.where( { state: 0 } ).count( ),
			this.articleCollection.where( { state: 1 } ).count( ),
			this.articleCollection.where( { state: 2 } ).count( )
		] )

		return {
			errCode: 0,
			data: res.data,
			stats: {
				pending: countRes[ 0 ].total,
				approved: countRes[ 1 ].total,
				rejected: countRes[ 2 ].total
			}
		}
	},
	/**
	 * updateState  管理员更新文章状态
	 * @param {string} article_id 当前文章的id
	 * @param {number} state 文章状态 1-通过 2-拒绝
	 * @returns {object} 返回更新状态
	 */
	async updateState( article_id, state ) {
		// 根据id获取当前文章
		const article = await this.articleCollection.doc( article_id ).get( )
		if ( !article.data || article.data.length === 0 ) {
			throw new Error( '文章不存在' )
		}
		if ( article.data[ 0 ].state !== 0 ) {
			throw new Error( '文章状态已更新' )
		}

		const updateData = {
			state,
			update_time: Date.now( )
		}

		// 如果是拒绝状态，添加拒绝原因
		if ( state === 2 ) {
			updateData.reject_reason = '您发布的内容不符合规范，请修改后重新发布'
		}

		// 根据id更新当前文章
		const result = await this.articleCollection.doc( article_id ).update(
			updateData )
		return result
	},
	/**
	 * 获取评论列表
	 */
	async getCommentList(article_id) {
		if (!article_id) {
			return {
				code: -1,
				message: '文章ID不能为空'
			}
		}

		try {
			const res = await this.commentCollection
				.where({
					article_id: article_id
				})
				.orderBy('create_time', 'desc')
				.get()

			return {
				code: 0,
				message: '获取成功',
				data: res.data
			}
		} catch (err) {
			console.error('获取评论列表失败:', err)
			return {
				code: -1,
				message: '获取评论列表失败',
				error: err
			}
		}
	},

	/**
	 * 添加评论
	 */
	async addComment(params) {
		const { article_id, user_id, content, nickName, avatarUrl, imageUrl, images } = params
		
		if (!article_id || !user_id || (!content && !imageUrl && (!images || images.length === 0))) {
			console.log('参数不完整:', params)
			return {
				code: -1,
				msg: '参数不完整'
			}
		}

		try {
			console.log('开始添加评论:', params)
			const addResult = await this.commentCollection.add({
				article_id,
				user_id,
				content: content ? content.trim() : '',
				imageUrl: imageUrl || '', // 保留单图片支持（向后兼容）
				images: images || [], // 支持多图片上传
				nickName,
				avatarUrl,
				create_time: Date.now(),
				like_count: 0,
				liked_by: []
			})
			console.log('添加评论结果:', addResult)

			const updateResult = await this.articleCollection
				.doc(article_id)
				.update({
					comment_count: this.dbCmd.inc(1)
				})
			console.log('更新文章评论数结果:', updateResult)

			return {
				code: 0,
				msg: '评论成功',
				id: addResult.id // 返回评论ID
			}
		} catch (err) {
			console.error('添加评论失败:', err)
			return {
				code: -1,
				msg: '评论失败'
			}
		}
	},
	/**
	 * 删除评论
	 */
	async deleteComment(comment_id) {
		try {
			// 检查参数
			if (!comment_id) {
				return {
					code: -1,
					message: '评论ID不能为空'
				}
			}

			// 获取评论信息
			const comment = await this.commentCollection.doc(comment_id).get()

			if (!comment.data || !comment.data.length) {
				return {
					code: -1,
					message: '评论不存在'
				}
			}

			// 删除评论
			await this.commentCollection.doc(comment_id).remove()

			// 更新文章评论数和删除相关点赞记录
			await this.articleCollection.doc(comment.data[0].article_id).update({
				comment_count: this.dbCmd.inc(-1),
				// 删除该评论的所有点赞记录
				comment_likes: this.dbCmd.pull({
					comment_id: comment_id
				})
			})

			return {
				code: 0,
				message: '删除成功'
			}
		} catch (err) {
			console.error('删除评论失败:', err)
			return {
				code: -1,
				message: '删除失败',
				error: err.message
			}
		}
	},
	/**
	 * updateLookCount 更新文章浏览量并记录浏览者
	 * @param {string} id 文章id
	 * @param {object} viewerInfo 浏览者信息
	 * @returns {object} 返回更新结果
	 */
	async updateLookCount(id, viewerInfo = null) {
		if (!id) return {
			code: -1,
			message: '文章ID不能为空'
		}
		
		try {
			// 获取文章当前浏览量
			const article = await this.articleCollection.doc(id).get();
			
			// 检查文章是否存在
			if (!article.data || article.data.length === 0) {
				return {
					code: -1,
					message: '文章不存在'
				}
			}
			
			// 当前浏览量
			const currentCount = article.data[0].look_count || 0;
			
			// 更新浏览量
			await this.articleCollection
				.doc(id)
				.update({
					look_count: this.dbCmd.inc(1)
				})
				
			// 如果有浏览者信息，记录浏览记录（包括访客用户）- 每次访问都创建新记录
			if (viewerInfo && viewerInfo.user_id) {
				try {
					// 检查是否在3秒内有重复访问，避免频繁刷新
					const recentTime = Date.now() - 3 * 1000; // 3秒前
					const recentRecord = await this.viewRecordCollection
						.where({
							article_id: id,
							user_id: viewerInfo.user_id,
							view_time: this.dbCmd.gte(recentTime)
						})
						.limit(1)
						.get();
					
					if (!recentRecord.data || recentRecord.data.length === 0) {
						// 3秒内没有访问记录，创建新的浏览记录
						const currentTime = Date.now();
						
						// 获取用户完整信息（包括电话和地区）
						let userMobile = '';
						let userDistrict = '';
						
						// 如果不是访客，从 user 表中查询用户信息
						if (viewerInfo.user_id && !viewerInfo.user_id.startsWith('guest_')) {
							try {
								const userRes = await this.db.collection('user').doc(viewerInfo.user_id)
									.field({
										mobile: true,
										district: true
									})
									.get();
								
								if (userRes.data && userRes.data.length > 0) {
									userMobile = userRes.data[0].mobile || '';
									userDistrict = userRes.data[0].district || '';
								
									// 如果用户表中没有地区信息，但浏览记录带有地区，则同步到用户表
									if (!userDistrict && viewerInfo.user_district) {
										try {
											await this.db.collection('user').doc(viewerInfo.user_id).update({
												district: viewerInfo.user_district
											});
											userDistrict = viewerInfo.user_district;
											console.log('已将地区信息同步到用户表:', {
												user_id: viewerInfo.user_id,
												district: viewerInfo.user_district
											});
										} catch (updateErr) {
											console.warn('同步用户地区信息失败:', updateErr);
										}
									}
								}
							} catch (userErr) {
								console.warn('获取用户信息失败:', userErr);
							}
						}
						
						await this.viewRecordCollection.add({
							article_id: id,
							user_id: viewerInfo.user_id,
							user_nickName: viewerInfo.user_nickName || '匿名用户',
							user_avatarUrl: viewerInfo.user_avatarUrl || '/static/images/touxiang.png',
							user_mobile: userMobile,
							user_district: userDistrict,
							view_time: currentTime,
							view_duration: viewerInfo.actual_view_duration || 0, // 使用实际浏览时长，默认0秒
							view_source: viewerInfo.view_source || 'direct',
							sharer_id: viewerInfo.sharer_id || null,
							sharer_name: viewerInfo.sharer_name || null,
							sharer_avatar: viewerInfo.sharer_avatar || null,
							ip_address: viewerInfo.ip_address || '',
							device_info: viewerInfo.device_info || {}
						});
						
						console.log('新浏览记录已创建:', {
							article_id: id,
							user_id: viewerInfo.user_id,
							user_type: viewerInfo.user_id.startsWith('guest_') ? '访客' : '注册用户',
							user_mobile: userMobile,
							user_district: userDistrict,
							view_time: new Date(currentTime).toLocaleString()
						});
					} else {
						console.log('3秒内重复访问，跳过记录创建:', {
							user_id: viewerInfo.user_id,
							last_visit: new Date(recentRecord.data[0].view_time).toLocaleString()
						});
					}
				} catch (recordErr) {
					// 记录浏览者信息失败不影响浏览量更新
					console.error('记录浏览者信息失败:', recordErr);
				}
			}
				
			return {
				code: 0,
				message: '更新成功',
				data: {
					look_count: currentCount + 1
				}
			}
		} catch (err) {
			console.error('更新浏览量失败:', err)
			return {
				code: -1,
				message: '更新失败',
				error: err.message
			}
		}
	},
	/**
	 * addLook 更新文章浏览量（兼容新版本API调用）
	 * @param {string} id 文章id
	 * @returns {object} 返回更新结果
	 */
	async addLook(id) {
		// 调用已有的updateLookCount方法
		return await this.updateLookCount(id);
	},
	/**
	 * getViewers 获取文章浏览者列表
	 * @param {string} articleId 文章ID
	 * @param {object} params 查询参数
	 * @returns {object} 浏览者列表
	 */
	async getViewers(articleId, params = {}) {
		try {
			if (!articleId) {
				return {
					code: -1,
					message: '文章ID不能为空'
				}
			}
			
			// 检查文章是否存在
			const article = await this.articleCollection.doc(articleId).get()
			if (!article.data || article.data.length === 0) {
				return {
					code: -1,
					message: '文章不存在'
				}
			}
			
			// 分页参数
			const pageNo = params.pageNo || 1
			const pageSize = Math.min(params.pageSize || 20, 50) // 限制最大每页数量
			
			// 获取浏览者列表
			const viewersRes = await this.viewRecordCollection
				.where({
					article_id: articleId
				})
				.orderBy('view_time', 'desc')
				.skip((pageNo - 1) * pageSize)
				.limit(pageSize)
				.field({
					user_id: true,
					user_nickName: true,
					user_avatarUrl: true,
					user_mobile: true,
					user_district: true,
					view_time: true,
					view_source: true,
					view_duration: true, // 添加浏览时长字段
					sharer_id: true,
					sharer_name: true,
					sharer_avatar: true
				})
				.get()
			
			// 对返回的数据进行处理，确保浏览时长有合理的最小值
			const processedViewers = viewersRes.data.map(viewer => {
				// 保持原始浏览时长，不再强制设置最小值
				return viewer
			})
			
			// 获取总数
			const totalRes = await this.viewRecordCollection
				.where({
					article_id: articleId
				})
				.count()
			
			return {
				code: 0,
				message: '获取成功',
				data: {
					viewers: processedViewers || [],
					total: totalRes.total || 0,
					pageNo: pageNo,
					pageSize: pageSize,
					totalPages: Math.ceil((totalRes.total || 0) / pageSize)
				}
			}
			
		} catch (err) {
			console.error('获取浏览者列表失败:', err)
			return {
				code: -1,
				message: '获取失败',
				error: err.message
			}
		}
	},
	/**
	 * updateViewDuration 更新浏览时长
	 * @param {string} articleId 文章ID
	 * @param {string} userId 用户ID（包括访客）
	 * @param {number} duration 实际浏览时长（秒）
	 * @returns {object} 更新结果
	 */
	async updateViewDuration(articleId, userId, duration) {
		try {
			if (!articleId || !userId || !duration || duration <= 0) {
				return {
					code: -1,
					message: '参数不合法'
				}
			}
			
			// 查找该用户对该文章的最近一条浏览记录
			const recentRecord = await this.viewRecordCollection
				.where({
					article_id: articleId,
					user_id: userId
				})
				.orderBy('view_time', 'desc')
				.limit(1)
				.get()
			
			if (!recentRecord.data || recentRecord.data.length === 0) {
				return {
					code: -1,
					message: '找不到对应的浏览记录'
				}
			}
			
			const record = recentRecord.data[0]
			
			// 更新最近一条记录的浏览时长
			await this.viewRecordCollection.doc(record._id).update({
				view_duration: Math.max(duration, record.view_duration || 0) // 使用更大的值
			})
			
			console.log('浏览时长已更新:', {
				article_id: articleId,
				user_id: userId,
				old_duration: record.view_duration || 0,
				new_duration: Math.max(duration, record.view_duration || 0)
			})
			
			return {
				code: 0,
				message: '更新成功',
				data: {
					duration: Math.max(duration, record.view_duration || 0)
				}
			}
		} catch (err) {
			console.error('更新浏览时长失败:', err)
			return {
				code: -1,
				message: '更新失败',
				error: err.message
			}
		}
	},
	/**
	 * 点赞评论
	 */
	async likeComment(params) {
		try {
			const { article_id, comment_id, user_id } = params
			
			// 检查参数
			if (!article_id || !comment_id || !user_id) {
				throw new Error('参数不完整')
			}

			// 检查评论是否存在
			const comment = await this.commentCollection.doc(comment_id).get()
			if (!comment.data || !comment.data.length) {
				throw new Error('评论不存在')
			}

			// 检查文章是否存在
			const article = await this.articleCollection.doc(article_id).get()
			if (!article.data || !article.data.length) {
				throw new Error('文章不存在')
			}

			// 检查是否已经点赞
			const likeRecord = (article.data[0].comment_likes || []).find(like => 
				like.comment_id === comment_id && like.user_id === user_id
			)

			if (likeRecord) {
				// 取消点赞
				await this.articleCollection.doc(article_id).update({
					comment_likes: this.dbCmd.pull({
						comment_id: comment_id,
						user_id: user_id
					})
				})

				// 更新评论点赞数
				await this.commentCollection.doc(comment_id).update({
					like_count: this.dbCmd.inc(-1)
				})

				return {
					code: 0,
					message: '取消点赞成功',
					isLiked: false
				}
			} else {
				// 添加点赞
				const likeData = {
					comment_id,
					user_id,
					create_time: Date.now()
				}

				// 使用事务确保数据一致性
				const transaction = await this.db.startTransaction()
				try {
					await transaction.collection('articleList').doc(article_id).update({
						comment_likes: this.dbCmd.push([likeData])
					})

					await transaction.collection('commentList').doc(comment_id).update({
						like_count: this.dbCmd.inc(1)
					})

					await transaction.commit()

					return {
						code: 0,
						message: '点赞成功',
						isLiked: true
					}
				} catch (err) {
					await transaction.rollback()
					throw err
				}
			}
		} catch (err) {
			console.error('点赞操作失败:', err)
			return {
				code: -1,
				message: err.message || '操作失败',
				error: err
			}
		}
	},

	// 获取评论点赞状态
	async getCommentLikeStatus(article_id, comment_id) {
		if (!this.ctx.auth || !this.ctx.auth.uid) {
			return {
				code: 0,
				isLiked: false
			}
		}

		const user_id = this.ctx.auth.uid

		try {
			const articleRes = await this.articleCollection
				.where({
					_id: article_id,
					'comment_likes.comment_id': comment_id,
					'comment_likes.user_id': user_id
				})
				.get()

			return {
				code: 0,
				isLiked: articleRes.data.length > 0
			}
		} catch (err) {
			return {
				code: -1,
				message: '获取点赞状态失败',
				error: err
			}
		}
	},
	/**
	 * updateArticle 更新文章
	 * @param {string} articleId - 文章ID
	 * @param {object} data - 更新的文章数据
	 * @returns {object} 更新结果
	 */
	async updateArticle(articleId, data) {
		try {
			// 检查文章ID是否存在
			if (!articleId) {
				throw new Error('文章ID不能为空')
			}

			// 检查用户权限
			if (!data.user_id) {
				throw new Error('用户ID不能为空')
			}

			// 获取原文章数据
			const articleRes = await this.articleCollection
				.doc(articleId)
				.get()

			if (!articleRes.data || articleRes.data.length === 0) {
				throw new Error('文章不存在')
			}

			const oldArticle = articleRes.data[0]

			// 检查是否是文章作者
			if (oldArticle.user_id !== data.user_id) {
				throw new Error('只能编辑自己的文章')
			}

			// 准备更新数据
			const updateData = {
				content: data.content,
				cate_id: data.cate_id,
				images: data.images,
				videoURL: data.videoURL,
				address: data.address,
				district: data.district,
				update_time: Date.now(),
				category_info: data.category_info,
				is_location_based_category: data.is_location_based_category,
				// 添加砍价相关字段
				enable_bargain: data.enable_bargain || false,
				bargain_initial_price: data.enable_bargain ? (data.bargain_initial_price || 0) : 0,
				bargain_step: data.enable_bargain ? (data.bargain_step || 10) : 10,
				bargain_mode: data.enable_bargain ? (data.bargain_mode || 'fixed') : 'fixed',
				bargain_min_amount: data.enable_bargain ? (data.bargain_min_amount || 5) : 5,
				bargain_max_amount: data.enable_bargain ? (data.bargain_max_amount || 20) : 20,
				bargain_percentage: data.enable_bargain ? (data.bargain_percentage || 1) : 1,
				bargain_decrease_rate: data.enable_bargain ? (data.bargain_decrease_rate || 0.8) : 0.8,
				bargain_popup_image: data.enable_bargain ? (data.bargain_popup_image || '') : '',
				bargain_popup_text: data.enable_bargain ? (data.bargain_popup_text || '') : '',
				bargain_amount_text: data.enable_bargain ? (data.bargain_amount_text || '') : '',
				bargain_end_time: data.enable_bargain ? (data.bargain_end_time || null) : null,
				enable_buyout: data.enable_bargain ? !!data.enable_buyout : false
			}

			// 更新文章
			const result = await this.articleCollection
				.doc(articleId)
				.update(updateData)

			return {
				code: 0,
				message: '更新成功'
			}
		} catch (err) {
			console.error('更新文章失败:', err)
			throw new Error(err.message || '更新文章失败')
		}
	},
	/**
	 * fixDatabaseTempAvatars 修复数据库中的临时头像路径
	 * @returns {object} 修复结果
	 */
	async fixDatabaseTempAvatars() {
		return await fixTempAvatars()
	},
	/**
	 * cleanTempAvatars 清理数据库中的临时头像路径
	 * @returns {object} 返回值描述
	 */
	async cleanTempAvatars() {
		try {
			console.log('开始执行临时头像清理...');
			
			// 执行清理
			const result = await cleanAllTempAvatars();
			
			console.log('清理完成:', result);
			
			return {
				code: 0,
				message: '清理成功',
				data: result
			};
		} catch (error) {
			console.error('清理临时头像失败:', error);
			return {
				code: -1,
				message: '清理失败: ' + error.message,
				error: error.message
			};
		}
	},
	
	/**
	 * bargain 砍价功能（优化版：浏览者作为发起人，邀请好友帮砍）
	 * @param {string} article_id 文章ID
	 * @param {string} user_id 帮砍用户ID
	 * @param {number} bargainStep 砍价金额（固定模式使用）
	 * @param {number} initialPrice 初始价格
	 * @param {object} userInfo 用户信息(昵称、头像等)
	 * @param {string} initiator_id 发起人ID（浏览者）
	 * @param {object} initiatorInfo 发起人信息
	 * @returns {object} 砍价结果
	 */
	async bargain(article_id, user_id, bargainStep, initialPrice, userInfo = {}, initiator_id = null, initiatorInfo = {}) {
		try {
			console.log('砍价操作参数:', { article_id, user_id, initiator_id, bargainStep, initialPrice });
			
			// 参数验证
			if (!article_id || !user_id) {
				return {
					errCode: -1,
					errMsg: '参数不完整'
				};
			}
			
			// 如果没有传入发起人ID，则当前用户就是发起人（自己砍价）
			const actualInitiatorId = initiator_id || user_id;
			const actualInitiatorInfo = initiator_id ? initiatorInfo : userInfo;
			
			// 防止用户帮自己砍价（只在有明确的发起人时检查）
			// 如果 initiator_id 和 user_id 都传入且相同，说明是自己想帮自己砍价
			if (initiator_id && user_id === initiator_id) {
				return {
					errCode: -1,
					errMsg: '不能帮自己砍价，请分享给好友帮忙！'
				};
			}
			
			// 检查文章是否存在并获取砍价配置
			const articleRes = await this.articleCollection.doc(article_id).get();
			if (!articleRes.data || articleRes.data.length === 0) {
				return {
					errCode: -1,
					errMsg: '文章不存在'
				};
			}
			
			const article = articleRes.data[0];
			const bargainMode = article.bargain_mode || 'fixed';
			const bargainConfig = {
				mode: bargainMode,
				fixed_amount: article.bargain_step || 10,
				min_amount: article.bargain_min_amount || 5,
				max_amount: article.bargain_max_amount || 20,
				percentage: article.bargain_percentage || 1,
				decrease_rate: article.bargain_decrease_rate || 0.8
			};
			
			console.log('砍价配置:', bargainConfig);
			
			// 获取用户信息，检查是否为管理员
			let isAdmin = false;
			try {
				const userRes = await this.db.collection('user').doc(user_id).get();
				if (userRes.data && userRes.data.length > 0) {
					const userData = userRes.data[0];
					// 检查用户角色是否为管理员
					isAdmin = userData.role && userData.role[0] === 'admin';
					console.log('用户角色检查:', {
						user_id,
						role: userData.role,
						isAdmin
					});
				}
			} catch (err) {
				console.warn('获取用户角色信息失败:', err);
			}
			
			// 获取发起人在当前文章的所有砍价记录（按发起人分组）
			const initiatorRecords = await this.bargainRecordCollection
				.where({
					article_id: article_id,
					initiator_id: actualInitiatorId
				})
				.orderBy('create_time', 'desc')
				.get();
			
			// 防刷机制1: 检查发起人的砍价是否已完成
			if (initiatorRecords.data && initiatorRecords.data.length > 0) {
				const lastRecord = initiatorRecords.data[0];
				if (lastRecord.is_complete) {
					return {
						errCode: -1,
						errMsg: '该发起人的砍价已完成',
						current_price: lastRecord.current_price,
						is_complete: true
					};
				}
			}
			
			// 防刷机制2: 检查当前用户是否已帮该发起人砍过价（每人只能帮同一发起人砍一次）
			const userHelpRecords = initiatorRecords.data.filter(record => record.user_id === user_id);
			if (!isAdmin && userHelpRecords.length > 0) {
				return {
					errCode: -1,
					errMsg: '您已经帮TA砍过价了，不能重复砍价！'
				};
			}
			
			// 防刷机制3: 时间间隔限制(3秒)
			if (initiatorRecords.data && initiatorRecords.data.length > 0) {
				const lastRecord = initiatorRecords.data[0];
				const now = Date.now();
				const lastBargainTime = lastRecord.create_time;
				if (now - lastBargainTime < 3000) {
					const waitSeconds = Math.ceil((3000 - (now - lastBargainTime)) / 1000);
					return {
						errCode: -1,
						errMsg: `操作太频繁，请${waitSeconds}秒后再试`
					};
				}
			}
			
			// 计算当前价格
			let currentPrice = initialPrice;
			if (initiatorRecords.data && initiatorRecords.data.length > 0) {
				// 使用最后一次砍价后的价格
				currentPrice = initiatorRecords.data[0].current_price;
			}
			
			// 根据不同的砍价模式计算砍价金额
			let actualBargainAmount = 0;
			
			switch(bargainMode) {
				case 'fixed':
					// 固定金额模式
					actualBargainAmount = bargainConfig.fixed_amount;
					console.log('固定金额模式:', actualBargainAmount);
					break;
					
				case 'random':
					// 随机金额模式
					const minAmount = bargainConfig.min_amount;
					const maxAmount = bargainConfig.max_amount;
					actualBargainAmount = minAmount + Math.random() * (maxAmount - minAmount);
					// 保留2位小数
					actualBargainAmount = Math.round(actualBargainAmount * 100) / 100;
					console.log('随机金额模式:', actualBargainAmount, '范围:', minAmount, '-', maxAmount);
					break;
					
				case 'percentage':
					// 百分比模式（基于原价计算）
					actualBargainAmount = initialPrice * (bargainConfig.percentage / 100);
					// 保留2位小数
					actualBargainAmount = Math.round(actualBargainAmount * 100) / 100;
					console.log('百分比模式:', actualBargainAmount, '百分比:', bargainConfig.percentage + '%');
					break;
					
				case 'decrease':
					// 递减随机模式（基于砍价次数递减，并在区间内随机）
					const bargainCount = initiatorRecords.data ? initiatorRecords.data.length : 0;
					// 计算递减后的基准金额
					const baseAmount = bargainConfig.fixed_amount * Math.pow(bargainConfig.decrease_rate, bargainCount);
					// 在基准金额的±30%范围内随机波动
					const fluctuationRate = 0.3; // 30%波动范围
					const decreaseMinAmount = baseAmount * (1 - fluctuationRate);
					const decreaseMaxAmount = baseAmount * (1 + fluctuationRate);
					actualBargainAmount = decreaseMinAmount + Math.random() * (decreaseMaxAmount - decreaseMinAmount);
					// 设置最小砍价金额为0.01元，防止过小
					actualBargainAmount = Math.max(0.01, actualBargainAmount);
					// 保留2位小数
					actualBargainAmount = Math.round(actualBargainAmount * 100) / 100;
					console.log('递减随机模式:', actualBargainAmount, '基准:', baseAmount.toFixed(2), '范围:', decreaseMinAmount.toFixed(2), '-', decreaseMaxAmount.toFixed(2), '次数:', bargainCount);
					break;
					
				default:
					// 默认使用固定金额
					actualBargainAmount = bargainStep || 10;
					break;
			}
			
			// 验证砍价金额
			if (!actualBargainAmount || actualBargainAmount <= 0) {
				return {
					errCode: -1,
					errMsg: '砍价金额必须大于0'
				};
			}
			
			// 计算砍价后的新价格
			const newPrice = Math.max(0, currentPrice - actualBargainAmount);
			const isComplete = newPrice <= 0;
			
			// 计算奖励积分（砍价完成时发起人获得）
			const rewardPoints = isComplete ? Math.floor(initialPrice) : 0; // 完成时奖励等于初始价格的整数部分
			
			// 创建砍价记录
			const recordData = {
				article_id: article_id,
				initiator_id: actualInitiatorId,
				initiator_nickname: actualInitiatorInfo.nickName || '匿名发起人',
				initiator_avatar: actualInitiatorInfo.avatarUrl || '/static/images/touxiang.png',
				user_id: user_id,
				bargain_amount: actualBargainAmount,
				current_price: newPrice,
				is_complete: isComplete,
				create_time: Date.now(),
				nickname: userInfo.nickName || '匿名用户',
				avatar: userInfo.avatarUrl || '/static/images/touxiang.png',
				ip_address: userInfo.ip_address || '',
				device_info: userInfo.device_info || {},
				bargain_mode: bargainMode, // 记录使用的砍价模式
				reward_points: rewardPoints // 奖励积分
			};
			
			await this.bargainRecordCollection.add(recordData);
			
			// 如果砍价完成，更新发起人的积分
			if (isComplete && rewardPoints > 0) {
				try {
					const _ = this.db.command;
					await this.db.collection('user').doc(actualInitiatorId).update({
						points: _.inc(rewardPoints) // 增加积分
					});
					console.log('发起人积分已更新:', { initiator_id: actualInitiatorId, reward_points: rewardPoints });
				} catch (err) {
					console.error('更新发起人积分失败:', err);
				}
				
				// 检查文章是否已经有人完成砍价，如果没有，则更新文章状态为已完成
				try {
					// 先检查文章当前状态
					const articleCheck = await this.articleCollection.doc(article_id).get();
					if (articleCheck.data && articleCheck.data.length > 0) {
						const currentArticle = articleCheck.data[0];
						// 如果文章还未标记为完成，则标记为完成（第一个完成的人是获胜者）
						if (!currentArticle.bargain_completed) {
							await this.articleCollection.doc(article_id).update({
								bargain_completed: true,
								bargain_completed_time: Date.now(),
								bargain_winner_id: actualInitiatorId,
								bargain_winner_nickname: actualInitiatorInfo.nickName || '匿名发起人'
							});
							console.log('文章砍价活动已标记为完成:', { 
								article_id, 
								winner_id: actualInitiatorId,
								winner_nickname: actualInitiatorInfo.nickName 
							});
						}
					}
				} catch (err) {
					console.error('更新文章砍价完成状态失败:', err);
				}
			}
			
			console.log('砍价成功:', {
				current_price: newPrice,
				is_complete: isComplete,
				actualBargainAmount,
				reward_points: rewardPoints
			});
			
			// 检查文章是否已经有人完成砍价（用于提示用户）
			let articleCompleted = false;
			let winnerNickname = '';
			try {
				const articleCheck = await this.articleCollection.doc(article_id).get();
				if (articleCheck.data && articleCheck.data.length > 0) {
					const currentArticle = articleCheck.data[0];
					articleCompleted = currentArticle.bargain_completed || false;
					winnerNickname = currentArticle.bargain_winner_nickname || '';
				}
			} catch (err) {
				console.error('检查文章砍价状态失败:', err);
			}
			
			return {
				errCode: 0,
				errMsg: isComplete ? '砍价完成！发起人已获得奖励！' : '砍价成功',
				current_price: newPrice,
				is_complete: isComplete,
				bargain_amount: actualBargainAmount,
				progress: ((initialPrice - newPrice) / initialPrice * 100).toFixed(2),
				reward_points: rewardPoints,
				article_completed: articleCompleted, // 文章是否已经有人完成砍价
				winner_nickname: winnerNickname // 获胜者昵称
			};
			
		} catch (err) {
			console.error('砍价操作失败:', err);
			return {
				errCode: -1,
				errMsg: '砍价失败: ' + err.message
			};
		}
	},
	
	/**
	 * getBargainStatus 获取砍价状态（按发起人分组）
	 * @param {string} article_id 文章ID
	 * @param {string} initiator_id 发起人ID
	 * @param {number} initialPrice 初始价格
	 * @returns {object} 砍价状态
	 */
	async getBargainStatus(article_id, initiator_id, initialPrice) {
		try {
			if (!article_id || !initiator_id) {
				return {
					errCode: -1,
					errMsg: '参数不完整'
				};
			}
			
			// 获取发起人最新的砍价记录
			const records = await this.bargainRecordCollection
				.where({
					article_id: article_id,
					initiator_id: initiator_id
				})
				.orderBy('create_time', 'desc')
				.limit(1)
				.get();
			
			if (!records.data || records.data.length === 0) {
				// 没有砍价记录，返回初始状态
				return {
					errCode: 0,
					current_price: initialPrice,
					is_complete: false,
					progress: 0
				};
			}
			
			const lastRecord = records.data[0];
			
			return {
				errCode: 0,
				current_price: lastRecord.current_price,
				is_complete: lastRecord.is_complete,
				progress: ((initialPrice - lastRecord.current_price) / initialPrice * 100).toFixed(2)
			};
			
		} catch (err) {
			console.error('获取砍价状态失败:', err);
			return {
				errCode: -1,
				errMsg: '获取失败: ' + err.message
			};
		}
	},
	
	/**
	 * getBargainRecords 获取砍价记录列表
	 * @param {string} article_id 文章ID
	 * @param {object} params 查询参数
	 * @returns {object} 砍价记录列表
	 */
	async getBargainRecords(article_id, params = {}) {
		try {
			if (!article_id) {
				return {
					errCode: -1,
					errMsg: '文章ID不能为空'
				};
			}
			
			const pageNo = params.pageNo || 1;
			const pageSize = Math.min(params.pageSize || 20, 50);
			
			// 获取砍价记录
			const records = await this.bargainRecordCollection
				.where({ article_id: article_id })
				.orderBy('create_time', 'desc')
				.skip((pageNo - 1) * pageSize)
				.limit(pageSize)
				.field({
					user_id: true,
					nickname: true,
					avatar: true,
					bargain_amount: true,
					current_price: true,
					is_complete: true,
					create_time: true
				})
				.get();
			
			// 获取总数
			const totalRes = await this.bargainRecordCollection
				.where({ article_id: article_id })
				.count();
			
			return {
				errCode: 0,
				data: {
					records: records.data || [],
					total: totalRes.total || 0,
					pageNo: pageNo,
					pageSize: pageSize
				}
			};
			
		} catch (err) {
			console.error('获取砍价记录失败:', err);
			return {
				errCode: -1,
				errMsg: '获取失败: ' + err.message
			};
		}
	},
	
	/**
	 * getBargainStats 获取文章砍价统计数据（按发起人分组）
	 * @param {string} article_id 文章ID
	 * @param {string} initiator_id 发起人ID（可选）
	 * @returns {object} 统计数据(参与人数、累计砍价总金额、参与用户头像列表)
	 */
	async getBargainStats(article_id, initiator_id = null) {
		try {
			if (!article_id) {
				return {
					errCode: -1,
					errMsg: '文章ID不能为空'
				};
			}
			
			// 构建查询条件
			const whereCondition = { article_id: article_id };
			if (initiator_id) {
				// 如果指定了发起人，只查询该发起人的记录
				whereCondition.initiator_id = initiator_id;
			}
			
			// 获取该文章所有砍价记录（包含头像和昵称）
			const records = await this.bargainRecordCollection
				.where(whereCondition)
				.orderBy('create_time', 'desc')
				.field({
					user_id: true,
					bargain_amount: true,
					nickname: true,
					avatar: true,
					create_time: true,
					initiator_id: true
				})
				.get();
		
			console.log('=== 砍价记录查询结果 ===', JSON.stringify(records.data));
		
			if (!records.data || records.data.length === 0) {
				// 没有砍价记录
				return {
					errCode: 0,
					data: {
						total_participants: 0,
						total_bargained_amount: 0,
						participants: []
					}
				};
			}
			
			// 统计去重后的帮砍人数，并收集用户信息
			const uniqueUsersMap = new Map();
			let totalAmount = 0;
			
			records.data.forEach(record => {
				// 如果该用户还未记录，添加到Map中
				if (!uniqueUsersMap.has(record.user_id)) {
					uniqueUsersMap.set(record.user_id, {
						user_id: record.user_id,
						nickname: record.nickname || '匿名用户',
						avatar: record.avatar || '/static/images/touxiang.png',
						create_time: record.create_time
					});
				}
				totalAmount += record.bargain_amount || 0;
			});
			
			// 转Map为数组（保持数据库查询的倒序：最新参与的在前）
			const participants = Array.from(uniqueUsersMap.values());
			
			return {
				errCode: 0,
				data: {
					total_participants: participants.length,
					total_bargained_amount: totalAmount,
					participants: participants // 返回所有参与用户的信息
				}
			};
			
		} catch (err) {
			console.error('获取砍价统计失败:', err);
			return {
				errCode: -1,
				errMsg: '获取失败: ' + err.message
			};
		}
	},
	
	/**
	 * getBargainGroupsList 获取文章的所有砍价小组列表
	 * @param {string} article_id 文章ID
	 * @returns {object} 小组列表数据
	 */
	async getBargainGroupsList(article_id) {
		try {
			if (!article_id) {
				return {
					errCode: -1,
					errMsg: '文章ID不能为空'
				};
			}
			
			// 获取该文章所有砍价记录
			const records = await this.bargainRecordCollection
				.where({ article_id: article_id })
				.orderBy('create_time', 'desc')
				.field({
					user_id: true,
					bargain_amount: true,
					nickname: true,
					avatar: true,
					create_time: true,
					initiator_id: true,
					initiator_nickname: true,
					initiator_avatar: true
				})
				.get();
			
			console.log('=== 查询所有砍价记录 ===', records.data.length);
			
			if (!records.data || records.data.length === 0) {
				return {
					errCode: 0,
					data: {
						groups: [],
						total_groups: 0
					}
				};
			}
			
			// 按发起人ID分组
			const groupsMap = new Map();
			
			records.data.forEach(record => {
				const initiatorId = record.initiator_id;
				
				if (!groupsMap.has(initiatorId)) {
					// 创建新小组
					groupsMap.set(initiatorId, {
						initiator_id: initiatorId,
						initiator_nickname: record.initiator_nickname || '匿名用户',
						initiator_avatar: record.initiator_avatar || '/static/images/touxiang.png',
						create_time: record.create_time,
						total_bargained_amount: 0,
						participants_map: new Map(),
						records: []
					});
				}
				
				const group = groupsMap.get(initiatorId);
				group.total_bargained_amount += record.bargain_amount || 0;
				group.records.push(record);
				
				// 统计参与人数（去重）
				if (!group.participants_map.has(record.user_id)) {
					group.participants_map.set(record.user_id, {
						user_id: record.user_id,
						nickname: record.nickname || '匿名用户',
						avatar: record.avatar || '/static/images/touxiang.png',
						create_time: record.create_time
					});
				}
			});
			
			// 获取文章的起始价格和获胜者信息（用于计算进度）
			const article = await this.articleCollection
				.doc(article_id)
				.field({ 
					bargain_initial_price: true,
					bargain_completed: true,
					bargain_winner_id: true,
					bargain_winner_nickname: true
				})
				.get();
			
			const initialPrice = article.data && article.data.length > 0 ? article.data[0].bargain_initial_price : 0;
			const articleCompleted = article.data && article.data.length > 0 ? article.data[0].bargain_completed : false;
			const winnerNickname = article.data && article.data.length > 0 ? article.data[0].bargain_winner_nickname : '';
			
			// 转换为数组并添加统计信息
			const groups = Array.from(groupsMap.values()).map(group => {
				const participants = Array.from(group.participants_map.values());
				const progress = initialPrice > 0 ? (group.total_bargained_amount / initialPrice * 100).toFixed(2) : 0;
				
				// 检查是否是买断记录（查找该小组中是否有is_buyout为true的记录）
				const isBuyout = group.records.some(record => record.is_buyout);
				
				return {
					initiator_id: group.initiator_id,
					initiator_nickname: group.initiator_nickname,
					initiator_avatar: group.initiator_avatar,
					create_time: group.create_time,
					total_participants: participants.length,
					total_bargained_amount: group.total_bargained_amount,
					current_price: Math.max(0, initialPrice - group.total_bargained_amount),
					progress: parseFloat(progress),
					is_complete: group.total_bargained_amount >= initialPrice,
					is_buyout: isBuyout,  // 新增买断标识
					participants: participants.slice(0, 5) // 只返回前5个参与者头像
				};
			});
			
			// 按创建时间降序排序（最新的在前）
			groups.sort((a, b) => b.create_time - a.create_time);
			
			return {
				errCode: 0,
				data: {
					groups: groups,
					total_groups: groups.length,
					initial_price: initialPrice,
					article_completed: articleCompleted, // 文章是否已经有人完成砍价
					winner_nickname: winnerNickname // 获胜者昵称
				}
			};
			
		} catch (err) {
			console.error('获取砍价小组列表失败:', err);
			return {
				errCode: -1,
				errMsg: '获取失败: ' + err.message
			};
		}
	},
	
	/**
	 * getUserBargainGroup 获取用户自己发起的砍价小组信息
	 * @param {string} article_id 文章ID
	 * @param {string} user_id 用户ID
	 * @returns {object} 用户自己的砍价小组信息
	 */
	async getUserBargainGroup(article_id, user_id) {
		try {
			if (!article_id || !user_id) {
				return {
					errCode: -1,
					errMsg: '参数不完整'
				};
			}
			
			console.log('=== 查询用户自己的砍价小组 ===', { article_id, user_id });
			
			// 查询该用户作为发起人的所有砍价记录
			const records = await this.bargainRecordCollection
				.where({ 
					article_id: article_id,
					initiator_id: user_id
				})
				.orderBy('create_time', 'desc')
				.field({
					user_id: true,
					bargain_amount: true,
					nickname: true,
					avatar: true,
					create_time: true,
					initiator_id: true,
					initiator_nickname: true,
					initiator_avatar: true,
					is_buyout: true
				})
				.get();
			
			if (!records.data || records.data.length === 0) {
				console.log('用户没有发起砍价小组');
				return {
					errCode: 0,
					data: null
				};
			}
			
			// 获取文章的起始价格
			const article = await this.articleCollection
				.doc(article_id)
				.field({ 
					bargain_initial_price: true,
					bargain_completed: true
				})
				.get();
			
			const initialPrice = article.data && article.data.length > 0 ? article.data[0].bargain_initial_price : 0;
			
			// 计算小组信息
			let totalBargainedAmount = 0;
			let isBuyout = false;
			const participantsMap = new Map();
			let createTime = records.data[0].create_time;
			
			records.data.forEach(record => {
				totalBargainedAmount += record.bargain_amount || 0;
				
				// 检查是否有买断记录
				if (record.is_buyout) {
					isBuyout = true;
				}
				
				// 统计参与者
				if (!participantsMap.has(record.user_id)) {
					participantsMap.set(record.user_id, {
						user_id: record.user_id,
						nickname: record.nickname || '匿名用户',
						avatar: record.avatar || '/static/images/touxiang.png'
					});
				}
				
				// 获取最早的创建时间
				if (record.create_time < createTime) {
					createTime = record.create_time;
				}
			});
			
			const currentPrice = Math.max(0, initialPrice - totalBargainedAmount);
			const progress = initialPrice > 0 ? (totalBargainedAmount / initialPrice * 100).toFixed(2) : 0;
			const isComplete = totalBargainedAmount >= initialPrice;
			
			const groupInfo = {
				initiator_id: user_id,
				initiator_nickname: records.data[0].initiator_nickname || '匿名用户',
				initiator_avatar: records.data[0].initiator_avatar || '/static/images/touxiang.png',
				create_time: createTime,
				total_participants: participantsMap.size,
				total_bargained_amount: totalBargainedAmount,
				current_price: currentPrice,
				progress: parseFloat(progress),
				is_complete: isComplete,
				is_buyout: isBuyout,
				participants: Array.from(participantsMap.values()).slice(0, 5)
			};
			
			console.log('用户砍价小组信息:', groupInfo);
			
			return {
				errCode: 0,
				data: groupInfo
			};
			
		} catch (err) {
			console.error('获取用户砍价小组失败:', err);
			return {
				errCode: -1,
				errMsg: '获取失败: ' + err.message
			};
		}
	},
	
	/**
	 * buyoutBargain 买断砍价商品
	 * @param {string} article_id 文章ID
	 * @param {string} user_id 买断用户ID
	 * @param {number} buyoutPrice 买断价格
	 * @param {object} userInfo 用户信息
	 * @param {string} share_from_user_id 分享来源用户ID
	 * @returns {object} 买断结果
	 */
	async buyoutBargain(article_id, user_id, buyoutPrice, userInfo = {}, share_from_user_id = null) {
		try {
			console.log('买断操作参数:', { article_id, user_id, buyoutPrice, share_from_user_id });
			
			// 参数验证
			if (!article_id || !user_id || !buyoutPrice) {
				return {
					errCode: -1,
					errMsg: '参数不完整'
				};
			}
			
			// 检查文章是否存在
			const articleRes = await this.articleCollection.doc(article_id).get();
			if (!articleRes.data || articleRes.data.length === 0) {
				return {
					errCode: -1,
					errMsg: '文章不存在'
				};
			}
			
			const article = articleRes.data[0];
			
			// 检查砍价/买断功能是否开启
			if (!article.enable_bargain) {
				return {
					errCode: -1,
					errMsg: '该文章未开启砍价功能'
				};
			}
			
			if (!article.enable_buyout) {
				return {
					errCode: -1,
					errMsg: '该文章未开启买断功能'
				};
			}
			
			// 检查是否已结束或已有人完成
			if (article.bargain_completed) {
				return {
					errCode: -1,
					errMsg: '该砍价活动已完成，无法买断'
				};
			}
			
			// 检查活动是否过期
			const now = Date.now();
			if (article.bargain_end_time && now >= article.bargain_end_time) {
				return {
					errCode: -1,
					errMsg: '该砍价活动已过期'
				};
			}
			
			// 检查是否是小组长（发起人）
			const initiatorCheck = await this.bargainRecordCollection
				.where({
					article_id: article_id,
					initiator_id: user_id
				})
				.limit(1)
				.get();
				
			if (!initiatorCheck.data || initiatorCheck.data.length === 0) {
				return {
					errCode: -1,
					errMsg: '只有砍价小组长（发起人）才能买断，请先发起砍价'
				};
			}
			
			// 检查用户是否已经买断过（防止重复买断）
			const existingBuyout = await this.bargainRecordCollection
				.where({
					article_id: article_id,
					user_id: user_id,
					is_buyout: true
				})
				.get();
				
			if (existingBuyout.data && existingBuyout.data.length > 0) {
				return {
					errCode: -1,
					errMsg: '您已经买断过该商品，请勿重复操作'
				};
			}
			
			// 计算买断价格：以当前剩余金额为准（服务端重新计算，避免前端篡改）
			let currentPrice = article.bargain_initial_price || 0;
			try {
				const lastRecord = await this.bargainRecordCollection
					.where({
						article_id: article_id,
						initiator_id: user_id
					})
					.orderBy('create_time', 'desc')
					.limit(1)
					.get();
				
				if (lastRecord.data && lastRecord.data.length > 0) {
					currentPrice = lastRecord.data[0].current_price;
				}
			} catch (err) {
				console.warn('获取当前砍价剩余金额失败，使用初始价格:', err);
			}
			
			if (!currentPrice || currentPrice <= 0) {
				return {
					errCode: -1,
					errMsg: '当前价格已为0，无法买断'
				};
			}
			
			const finalBuyoutPrice = Math.max(0, currentPrice);
			
			// 创建买断记录
			const buyoutRecord = {
				article_id: article_id,
				initiator_id: user_id,  // 买断者即是发起人
				initiator_nickname: userInfo.nickName || '匿名用户',
				initiator_avatar: userInfo.avatarUrl || '/static/images/touxiang.png',
				user_id: user_id,
				nickname: userInfo.nickName || '匿名用户',
				avatar: userInfo.avatarUrl || '/static/images/touxiang.png',
				bargain_amount: finalBuyoutPrice,  // 买断金额等于剩余金额，确保总额不超出
				current_price: 0,  // 买断后价格为0
				buyout_price: finalBuyoutPrice,  // 实际买断价格（服务端计算）
				is_buyout: true,  // 标记为买断记录
				is_complete: true,  // 买断即完成
				share_from_user_id: share_from_user_id,
				create_time: now
			};
			
			// 插入买断记录
			await this.bargainRecordCollection.add(buyoutRecord);
			
			// 更新文章状态：标记为已完成并下架/锁定
			await this.articleCollection.doc(article_id).update({
				bargain_completed: true,
				bargain_winner_id: user_id,
				bargain_winner_nickname: userInfo.nickName || '匿名用户',
				bargain_buyout_price: finalBuyoutPrice,  // 记录买断价格
				bargain_buyout_time: now,  // 记录买断时间
				state: 2 // 自动下架/锁定文章
			});
			
			// 计算奖励积分（买断价的整数部分）
			const rewardPoints = Math.floor(finalBuyoutPrice);
			
			// 更新用户积分
			if (rewardPoints > 0) {
				try {
					await this.db.collection('user').doc(user_id).update({
						points: this.db.command.inc(rewardPoints)
					});
					console.log(`用户 ${user_id} 获得 ${rewardPoints} 积分`);
				} catch (err) {
					console.warn('更新用户积分失败:', err);
				}
			}
			
			console.log('买断成功:', {
				article_id,
				user_id,
				buyout_price: buyoutPrice,
				reward_points: rewardPoints
			});
			
			return {
				errCode: 0,
				errMsg: '买断成功',
				data: {
				buyout_price: finalBuyoutPrice,
					reward_points: rewardPoints,
					is_complete: true
				}
			};
			
		} catch (err) {
			console.error('买断操作失败:', err);
			return {
				errCode: -1,
				errMsg: '买断失败: ' + err.message
			};
		}
	},
	
	/**
	 * createBuyoutOrder 创建买断订单（用于支付前）
	 * @param {string} article_id 文章ID
	 * @param {string} user_id 买断用户ID
	 * @param {number} buyoutPrice 买断价格
	 * @param {object} userInfo 用户信息
	 * @param {string} share_from_user_id 分享来源用户ID
	 * @returns {object} 订单信息
	 */
	async createBuyoutOrder(article_id, user_id, buyoutPrice, userInfo = {}, share_from_user_id = null) {
		try {
			console.log('创建买断订单:', { article_id, user_id, buyoutPrice, share_from_user_id });
			
			// 参数验证
			if (!article_id || !user_id || !buyoutPrice) {
				return {
					errCode: -1,
					errMsg: '参数不完整'
				};
			}
			
			// 检查文章是否存在
			const articleRes = await this.articleCollection.doc(article_id).get();
			if (!articleRes.data || articleRes.data.length === 0) {
				return {
					errCode: -1,
					errMsg: '文章不存在'
				};
			}
			
			const article = articleRes.data[0];
			
			// 检查砍价/买断功能是否开启
			if (!article.enable_bargain || !article.enable_buyout) {
				return {
					errCode: -1,
					errMsg: '买断功能未开启'
				};
			}
			
			// 检查是否是小组长（发起人）
			const initiatorCheck = await this.bargainRecordCollection
				.where({
					article_id: article_id,
					initiator_id: user_id
				})
				.limit(1)
				.get();
				
			if (!initiatorCheck.data || initiatorCheck.data.length === 0) {
				return {
					errCode: -1,
					errMsg: '只有砍价小组长（发起人）才能买断'
				};
			}
			
			// 检查用户是否已经买断过
			const existingBuyout = await this.bargainRecordCollection
				.where({
					article_id: article_id,
					user_id: user_id,
					is_buyout: true
				})
				.get();
				
			if (existingBuyout.data && existingBuyout.data.length > 0) {
				return {
					errCode: -1,
					errMsg: '您已经买断过该商品'
				};
			}
			
			// 生成订单号
			const orderNo = 'BUYOUT' + Date.now() + Math.random().toString(36).substr(2, 9).toUpperCase();
			
			// 创建买断订单记录（存储到数据库）
			const buyoutOrderCollection = this.db.collection('buyout_orders');
			const now = Date.now();
			
			const orderData = {
				order_no: orderNo,
				article_id: article_id,
				user_id: user_id,
				initiator_id: user_id,
				buyout_price: buyoutPrice,
				status: 0, // 0-待支付, 1-已支付, 2-已取消
				user_info: {
					nickname: userInfo.nickName || '匿名用户',
					avatar: userInfo.avatarUrl || '/static/images/touxiang.png'
				},
				share_from_user_id: share_from_user_id || user_id,
				create_time: now,
				update_time: now
			};
			
			const insertRes = await buyoutOrderCollection.add(orderData);
			
			if (!insertRes.id) {
				throw new Error('订单创建失败');
			}
			
			console.log('买断订单创建成功:', orderNo);
			
			return {
				errCode: 0,
				errMsg: '订单创建成功',
				data: {
					order_no: orderNo,
					buyout_id: insertRes.id,
					amount: buyoutPrice
				}
			};
			
		} catch (err) {
			console.error('创建买断订单失败:', err);
			return {
				errCode: -1,
				errMsg: '创建订单失败: ' + err.message
			};
		}
	},
	
	/**
	 * completeBuyout 完成买断（支付成功后调用）
	 * @param {string} order_no 订单号
	 * @param {string} user_id 用户ID
	 * @returns {object} 完成结果
	 */
	async completeBuyout(order_no, user_id) {
		try {
			console.log('完成买断:', { order_no, user_id });
			
			// 参数验证
			if (!order_no || !user_id) {
				return {
					errCode: -1,
					errMsg: '参数不完整'
				};
			}
			
			// 查询订单
			const buyoutOrderCollection = this.db.collection('buyout_orders');
			const orderRes = await buyoutOrderCollection
				.where({
					order_no: order_no,
					user_id: user_id
				})
				.get();
				
			if (!orderRes.data || orderRes.data.length === 0) {
				return {
					errCode: -1,
					errMsg: '订单不存在'
				};
			}
			
			const order = orderRes.data[0];
			
			// 检查订单状态
			if (order.status === 1) {
				return {
					errCode: -1,
					errMsg: '订单已完成，请勿重复操作'
				};
			}
			
			if (order.status === 2) {
				return {
					errCode: -1,
					errMsg: '订单已取消'
				};
			}
			
			// 获取文章信息
			const articleRes = await this.articleCollection.doc(order.article_id).get();
			if (!articleRes.data || articleRes.data.length === 0) {
				return {
					errCode: -1,
					errMsg: '文章不存在'
				};
			}
			
			const article = articleRes.data[0];
			const now = Date.now();
			
			// 创建买断记录（写入 bargainRecord 表）
			const buyoutRecord = {
				article_id: order.article_id,
				initiator_id: user_id,
				initiator_nickname: order.user_info.nickname,
				initiator_avatar: order.user_info.avatar,
				user_id: user_id,
				nickname: order.user_info.nickname,
				avatar: order.user_info.avatar,
				bargain_amount: order.buyout_price,
				current_price: 0,
				buyout_price: order.buyout_price,
				is_buyout: true,
				is_complete: true,
				create_time: now
			};
			
			await this.bargainRecordCollection.add(buyoutRecord);
			
			// 更新文章状态
			await this.articleCollection.doc(order.article_id).update({
				bargain_buyout_price: order.buyout_price,
				bargain_buyout_time: now,
				bargain_completed: true
			});
			
			// 更新订单状态
			await buyoutOrderCollection.doc(order._id).update({
				status: 1,
				update_time: now,
				complete_time: now
			});
			
			// 计算奖励积分
			const rewardPoints = Math.floor(order.buyout_price);
			
			// 更新用户积分
			if (rewardPoints > 0) {
				try {
					const _ = this.db.command;
					await this.db.collection('user').doc(user_id).update({
						points: _.inc(rewardPoints)
					});
					console.log('用户积分已更新:', { user_id, reward_points: rewardPoints });
				} catch (err) {
					console.error('更新用户积分失败:', err);
				}
			}
			
			console.log('买断完成:', {
				order_no: order_no,
				buyout_price: order.buyout_price,
				reward_points: rewardPoints
			});
			
			return {
				errCode: 0,
				errMsg: '买断完成',
				data: {
					buyout_price: order.buyout_price,
					reward_points: rewardPoints,
					is_complete: true
				}
			};
			
		} catch (err) {
			console.error('完成买断失败:', err);
			return {
				errCode: -1,
				errMsg: '完成买断失败: ' + err.message
			};
		}
	},
	
	main: async function(event) {
		console.log('云函数入口函数接收到的参数', event)
		
		// 从event中获取action和相关参数
		const action = event.action
		
		// 支持清理临时头像
		if (action === 'cleanTempAvatars') {
			return await this.cleanTempAvatars()
		}
		
		// 支持浏览量更新
		if (action === 'updateLookCount') {
			const id = event.id
			return await this.updateLookCount(id)
		}
		
		// 兼容addLook方法
		if (action === 'addLook') {
			const id = event.id
			return await this.addLook(id)
		}
		
		if (action === 'addComment') {
			return await this.addComment(event.params)
		}
		
		// 其他操作处理...
		
		return {
			code: -1,
			message: '未找到对应的操作: ' + action
		}
	}
}