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
	 * @param {string} cate_img 分类图片
	 * @returns {object} 返回值 0 成功
	 */
	async add( cate_name, cate_img ) {
		const res = await dbJQL.collection( "cateList" ).add( { 
			cate_name: cate_name,
			cate_img: cate_img || ''
		} )
		return res
	},
	/**
	 * update  修改分类
	 * @param {string} id 分类id
	 * @param {string} cate_name 分类名称
	 * @param {string} cate_img 分类图片
	 * @param {number} sort 分类排序
	 * @param {boolean} is_visible 分类可见性
	 * @returns {object} 返回值 0 成功
	 */
	async update( id, cate_name, cate_img, sort, is_visible ) {
		if ( !cate_name ) {
			return {
				errCode: 1,
				errMsg: '更新值不可以为空'
			}
		}
		if ( id ) {
			const updateData = { 
				cate_name: cate_name,
				update_time: new Date().getTime() // 添加更新时间
			};
			
			// 如果有图片，则更新图片
			if (cate_img !== undefined) {
				updateData.cate_img = cate_img;
			}
			
			// 如果有排序值，则更新排序
			if (sort !== undefined) {
				updateData.sort = sort;
			}
			
			// 如果指定了可见性，则更新可见性
			if (is_visible !== undefined) {
				updateData.is_visible = is_visible;
			}
			
			const res = await dbJQL.collection( "cateList" ).doc( id )
				.update( updateData )
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
	
	/**
	 * updateVisibility  批量更新所有分类的可见性
	 * @param {boolean} isVisible 是否可见
	 * @returns {object} 返回值包含更新数量
	 */
	async updateVisibility(isVisible) {
		if (typeof isVisible !== 'boolean') {
			return {
				errCode: 1,
				errMsg: '可见性参数必须是布尔值'
			}
		}
		
		try {
			// 使用批量更新将所有分类的is_visible字段设为传入的值
			const res = await dbJQL.collection("cateList").update({
				is_visible: isVisible,
				update_time: new Date().getTime() // 添加更新时间
			})
			
			return {
				updated: res.updated,
				code: 0,
				message: isVisible ? '所有分类已设为可见' : '所有分类已设为隐藏'
			}
		} catch (error) {
			console.error('批量更新分类可见性失败:', error)
			return {
				errCode: 2,
				errMsg: '更新分类可见性失败: ' + (error.message || '未知错误')
			}
		}
	}
}