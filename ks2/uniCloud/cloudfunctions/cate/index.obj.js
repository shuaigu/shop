const dbJQL = uniCloud.databaseForJQL( )
module.exports = {
	_before: function( ) { // 通用预处理器

	},
	/**
	 * add  获取分类
	 * @param {string} id 分类id
	 * @returns {object} 返回值 分类
	 */
	async get( id ) {
		if ( id ) {
			const res = await dbJQL.collection( "cateList" ).doc( id ).get( )
			return res
		} else {
			const res = await dbJQL.collection( "cateList" ).get( )
			return res
		}
	},
	/**
	 * add  添加分类
	 * @param {string} cate_name 分类名称
	 * @returns {object} 返回值 0 成功
	 */
	async add( cate_name ) {
		const res = await dbJQL.collection( "cateList" ).add( { cate_name: cate_name } )
		return res
	},
	/**
	 * update  修改分类
	 * @param {string} id 分类id
	 * @param {string} cate_name 分类名称
	 * @returns {object} 返回值 0 成功
	 */
	async update( id, cate_name ) {
		if ( !cate_name ) {
			return {
				errCode: 1,
				errMsg: '更新值不可以为空'
			}
		}
		if ( id ) {
			const res = await dbJQL.collection( "cateList" ).doc( id )
				.update( { cate_name: cate_name } )
			return res
		}
		return {
			errCode: 1,
			errMsg: '当前分类不存在'
		}
	},
	/**
	 * del  删除分类
	 * @param {string} id 分类id
	 * @returns {object} 返回值 0 成功
	 */
	async del( id ) {
		if ( !id ) {
			return {
				errCode: 1,
				errMsg: '当前删除的分类不存在'
			}
		}
		const res = await dbJQL.collection( "cateList" ).doc( id ).remove( )
		return res
	},
}