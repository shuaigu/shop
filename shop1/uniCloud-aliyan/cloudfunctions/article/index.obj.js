const db = uniCloud.database()
const dbCmd = db.command
const dbJQL = uniCloud.database( )

module.exports = {
	_before: function() {
		// 初始化数据库连接
		this.db = uniCloud.database()
		this.dbCmd = this.db.command
		this.userCollection = this.db.collection('uni-id-users')
		this.articleCollection = this.db.collection('articleList')
		this.commentCollection = this.db.collection('commentList')
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
			video,
			cate_id,
			address,
			district,
			user_nickName,
			user_avatarUrl,
			user_mobile
		} = params
		// 参数校验
		if ( !user_id ) throw new Error( '用户ID不能为空' )
		if ( !content || !content.trim( ) ) throw new Error( '内容不能为空' )
		if ( !cate_id ) throw new Error( '请选择分类' )
		// 新增文章 - 将 state 默认设置为 1 (已通过)
		return await this.articleCollection.add( {
			user_id,
			content,
			images,
			video,
			cate_id,
			address: address || '未知位置',
			district: district || '未知位置',
			user_nickName,
			user_avatarUrl,
			user_mobile,
			like_count: 0,
			comment_count: 0,
			state: 1,
			look_count: 0,
			create_time: Date.now( ),
			update_time: Date.now( ),
		} )
	},
	/**
	 * getArticle 根据分类获取文章列表
	 * @param {string}  cate_id 分类id
	 * @param {number}  pageNo 页码
	 * @param {number}  pageSize 每页数量
	 * @param {Array}   hiddenCategoryIds 隐藏的分类ID数组
	 * @returns {object} 返回值 -- 文章对象
	 */
	async getArticle( cate_id, pageNo = 1, pageSize = 5, hiddenCategoryIds = [] ) {

		try {
			// 基础查询条件
			const whereCondition = { state: 1 }
			let orderByField = 'create_time'
			let orderByType = 'desc'

			// 根据分类ID设置排序规则
			if ( cate_id === '02' ) {
				orderByField = 'like_count'
			} else if ( cate_id && cate_id !== '01' ) {
				// 特定分类的查询条件
				whereCondition.cate_id = cate_id
			}
			
			// 处理隐藏分类的文章
			if (hiddenCategoryIds && hiddenCategoryIds.length > 0) {
				// 如果是特定分类（非"最新"和"最热"），则不需要额外过滤
				if (cate_id && cate_id !== '01' && cate_id !== '02') {
					// 已经请求了特定分类，不需要过滤
					// whereCondition.cate_id 已经在上面设置
				} else {
					// 对于"最新"和"最热"分类，需要排除隐藏分类的文章
					whereCondition.cate_id = this.dbCmd.nin(hiddenCategoryIds)
				}
			}

			// 设置更短的超时时间，避免长时间显示加载动画
			const options = { timeout: 3000 }; // 3秒超时
			
			const res = await this.articleCollection
				.where( whereCondition )
				.orderBy( orderByField, orderByType )
				.skip( ( pageNo - 1 ) * pageSize )
				.limit( pageSize )
				.get( options )

			return {
				code: 0,
				message: '获取成功',
				data: res.data,
				hideLoading: true // 添加标记，告诉前端隐藏加载动画
			}
		} catch ( err ) {
			console.error( '查询失败:', err )
			return {
				code: -1,
				message: '获取失败',
				error: err.message,
				hideLoading: true // 即使失败也隐藏加载动画
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

			// 获取文章详情
			const articleRes = await this.articleCollection
				.doc(articleId)
				.get()

			// 检查文章是否存在
			if (!articleRes.data || articleRes.data.length === 0) {
				throw new Error('文章不存在')
			}

			// 获取评论列表
			const commentRes = await this.commentCollection
				.where({
					article_id: articleId
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

		const res = await this.articleCollection
			.where( { user_id: user_id } )
			.orderBy( 'create_time', 'desc' )
			.skip( ( pageNo - 1 ) * pageSize )
			.limit( pageSize )
			.get( )

		const userInfo = {
			avatarUrl: res.data[ 0 ].user_avatarUrl,
			nickName: res.data[ 0 ].user_nickName,
			mobile: res.data[ 0 ].user_mobile
		}

		return {
			data: res.data,
			userInfo
		}
	},
	/**
	 * clickLike 点赞当前文章
	 * @param {string}  article_id 文章id
	 * @param {boolean} likeState 点赞状态
	 * @returns {object} 返回值 -- 文章对象
	 */
	async clickLike( article_id, user_id, is_liked ) {
		// 如果没有点赞 则给文章点赞 +1 
		if ( !is_liked ) {
			console.log( '如果没有点赞则+1' )
			await this.articleCollection
				.doc( article_id )
				.update( { like_count: this.dbCmd.inc( 1 ) } )

			// 将此用户和文章添加到点赞列表
			await this.db.collection( "likeRecord" ).add( {
				user_id,
				article_id,
				like_status: 1,
			} )

			return {
				errCode: 0,
				errMsg: '点赞成功',
				is_liked
			}
		} else {
			// 如果用户点过赞 则给文章点赞 -1
			await this.articleCollection
				.doc( article_id )
				.update( { like_count: this.dbCmd.inc( -1 ) } )

			// 将此用户和文章的点赞列表删除
			await this.db.collection( 'likeRecord' )
				.where( { user_id: user_id, article_id: article_id } )
				.remove( )

			return {
				errCode: 0,
				errMsg: '取消点赞',
				is_liked
			}
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
		const { article_id, user_id, content, nickName, avatarUrl } = params
		
		if (!article_id || !user_id || !content) {
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
				content: content.trim(),
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
				msg: '评论成功'
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
	 * updateLookCount 更新文章浏览量
	 * @param {string} id 文章id
	 * @returns {object} 返回更新结果
	 */
	async updateLookCount(id) {
		if (!id) return {
			code: -1,
			message: '文章ID不能为空'
		}
		
		try {
			await this.articleCollection
				.doc(id)
				.update({
					look_count: this.dbCmd.inc(1)
				})
			return {
				code: 0,
				message: '更新成功'
			}
		} catch (err) {
			console.error('更新浏览量失败:', err)
			return {
				code: -1,
				message: '更新失败'
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
	main: async (event, context) => {
		console.log('云函数上下文:', context)
		const { action, params } = event
		console.log('接收到的 action:', action)
		console.log('接收到的 params:', params)

		if (action === 'addComment') {
			return await addComment(params)
		}

		// 其他逻辑
	},
	// 添加一个测试方法来检查数据库连接
	async testConnection() {
		try {
			const result = await this.articleCollection.limit(1).get()
			console.log('数据库连接测试成功:', result)
			return {
				code: 0,
				message: '连接成功'
			}
		} catch (err) {
			console.error('数据库连接测试失败:', err)
			return {
				code: -1,
				message: '连接失败',
				error: err
			}
		}
	}
}