const dbJQL = uniCloud.databaseForJQL( )
module.exports = {
	_before: function( ) { // 通用预处理器

	},

	// 添加评论
	async addComment( params ) {
		const { article_id, user_id, content, nickName, avatarUrl, reply_to } = params

		if ( !content.trim( ) ) {
			throw new Error( '评论内容不能为空' )
		}

		// 构建评论数据
		const commentData = {
			article_id,
			user_id,
			content: content.trim( ),
			nickName,
			avatarUrl
		}

		// 如果是回复评论，添加 reply_to 字段
		if ( reply_to ) {
			commentData.reply_to = reply_to
		}

		// 添加评论
		const res = await dbJQL.collection( 'commentList' ).add( commentData )

		return {
			id: res.id
		}
	},

	// 删除评论
	async delComment( comment_id ) {
		try {
			// 删除评论
			const res = await dbJQL.collection( 'commentList' ).doc( comment_id ).remove( )

			return {
				deleted: res.deleted > 0
			}
		} catch ( err ) {
			throw new Error( '删除评论失败：' + err.message )
		}
	}
}