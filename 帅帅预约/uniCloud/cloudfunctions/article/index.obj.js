const db = uniCloud.database( )
const dbCmd = db.command
const dbJQL = uniCloud.database( )

module.exports = {
	_before: function( ) { // 通用预处理器

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
		// 新增文章
		return await dbJQL.collection( "articleList" ).add( {
			user_id,
			content,
			images,
			cate_id,
			address: address || '未知位置',
			district: district || '未知位置',
			user_nickName,
			user_avatarUrl,
			user_mobile,
			like_count: 0,
			comment_count: 0,
			state: 0,
			look_count: 0,
			create_time: Date.now( ),
			update_time: Date.now( ),
		} )
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
				whereCondition.cate_id = cate_id
			}

			const res = await dbJQL.collection( "articleList" )
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
	async getArticleDetal( article_id ) {
		if ( !article_id ) return '当前文章已删除'

		// 更新文章阅读量
		await dbJQL.collection( 'articleList' ).doc( article_id ).update( {
			look_count: dbCmd.inc( 1 )
		} )

		// 获取文章列表
		const articleRes = await dbJQL.collection( 'articleList' ).doc( article_id ).get( )
		// 获取评论列表
		const commentRes = await dbJQL.collection( 'commentList' ).where( {
			article_id: article_id,
		} ).get( { getCount: true } )
		const comment = commentRes.data
		const commentCount = commentRes.data.length
		return {
			errCode: 0,
			errMsg: '获取成功',
			articleRes,
			comment,
			commentCount
		}
	},
	/**
	 * getArticleList 获取用户文章列表
	 * @param {string}  user_id 用户id
	 * @returns {object} 返回值 -- 文章对象
	 */
	async getArticleList( user_id, pageNo = 1, pageSize = 5 ) {
		if ( !user_id ) return '当前文章已删除'

		const res = await dbJQL.collection( 'articleList' )
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
			await dbJQL.collection( "articleList" )
				.doc( article_id )
				.update( { like_count: dbCmd.inc( 1 ) } )

			// 将此用户和文章添加到点赞列表
			await dbJQL.collection( "likeRecord" ).add( {
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
			await dbJQL.collection( "articleList" )
				.doc( article_id )
				.update( { like_count: dbCmd.inc( -1 ) } )

			// 将此用户和文章的点赞列表删除
			await dbJQL.collection( 'likeRecord' )
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
		const article = await dbJQL.collection( "articleList" ).doc( article_id ).get( )
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
		const result = await dbJQL.collection( "articleList" ).doc( article_id ).remove( )

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
		let query = dbJQL.collection( "articleList" )

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
			dbJQL.collection( "articleList" ).where( { state: 0 } ).count( ),
			dbJQL.collection( "articleList" ).where( { state: 1 } ).count( ),
			dbJQL.collection( "articleList" ).where( { state: 2 } ).count( )
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
		const article = await dbJQL.collection( "articleList" ).doc( article_id ).get( )
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
		const result = await dbJQL.collection( "articleList" ).doc( article_id ).update(
			updateData )
		return result
	},
}