const dbJQL = uniCloud.databaseForJQL( )
module.exports = {
	_before: function( ) { // 通用预处理器

	},
	/**
	 * getLikeRecord 获取文章点赞列表
	 * @param {string} article_id 文章id
	 * @param {string} user_id 当前用户id
	 * @returns {object} 返回值 点赞状态
	 */
	async getLikeRecord( article_id, user_id ) {
		// 获取点赞列表
		const res = await dbJQL.collection( 'likeRecord' )
			.where( { article_id: article_id, user_id: user_id } )
			.get( )
		// 从文章列表获取最新的点赞数
		const articleRes = await dbJQL.collection( 'articleList' ).doc( article_id ).get( )
		const like_count = articleRes.data[ 0 ].like_count
		return {
			like_count,
			res
		}
	}
}