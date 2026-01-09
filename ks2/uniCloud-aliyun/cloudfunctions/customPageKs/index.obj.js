const dbJQL = uniCloud.databaseForJQL()

module.exports = {
	_before: function() {
		// 通用预处理器
	},
	
	/**
	 * get 获取自定义页面
	 * @param {string} id 页面id（可选）
	 * @param {boolean} onlyVisible 仅获取可见页面（可选，默认false）
	 * @returns {object} 返回页面数据
	 */
	async get(id, onlyVisible = false) {
		if (id) {
			const res = await dbJQL.collection("customPages").doc(id).get()
			return res
		} else {
			let query = dbJQL.collection("customPages")
			
			// 如果只获取可见页面
			if (onlyVisible) {
				query = query.where('is_visible == true')
			}
			
			// 按排序降序排列
			const res = await query.orderBy('sort', 'desc').get()
			return res
		}
	},
	
	/**
	 * add 添加自定义页面
	 * @param {object} pageData 页面数据
	 * @returns {object} 返回值
	 */
	async add(pageData) {
		const { title, content, contact_info, qr_code_image, background_color, text_color, sort } = pageData
		
		if (!title) {
			return {
				errCode: 1,
				errMsg: '页面标题不能为空'
			}
		}
		
		const res = await dbJQL.collection("customPages").add({
			title: title,
			content: content || '',
			contact_info: contact_info || '',
			qr_code_image: qr_code_image || '',
			background_color: background_color || '#ffffff',
			text_color: text_color || '#333333',
			sort: sort || 0,
			is_visible: true,
			view_count: 0
		})
		
		return res
	},
	
	/**
	 * update 修改自定义页面
	 * @param {string} id 页面id
	 * @param {object} pageData 页面数据
	 * @returns {object} 返回值
	 */
	async update(id, pageData) {
		if (!id) {
			return {
				errCode: 1,
				errMsg: '页面ID不能为空'
			}
		}
		
		const { title, content, contact_info, qr_code_image, background_color, text_color, sort, is_visible } = pageData
		
		if (!title) {
			return {
				errCode: 1,
				errMsg: '页面标题不能为空'
			}
		}
		
		const updateData = {
			title: title,
			content: content || '',
			contact_info: contact_info || '',
			qr_code_image: qr_code_image || '',
			background_color: background_color || '#ffffff',
			text_color: text_color || '#333333',
			update_time: new Date().getTime()
		}
		
		// 如果有排序值，则更新排序
		if (sort !== undefined) {
			updateData.sort = sort
		}
		
		// 如果指定了可见性，则更新可见性
		if (is_visible !== undefined) {
			updateData.is_visible = is_visible
		}
		
		const res = await dbJQL.collection("customPages").doc(id).update(updateData)
		return res
	},
	
	/**
	 * del 删除自定义页面
	 * @param {string} id 页面id
	 * @returns {object} 返回值
	 */
	async del(id) {
		if (!id) {
			return {
				errCode: 1,
				errMsg: '页面ID不能为空'
			}
		}
		
		const res = await dbJQL.collection("customPages").doc(id).remove()
		return res
	},
	
	/**
	 * updateVisibility 更新页面可见性
	 * @param {string} id 页面id
	 * @param {boolean} isVisible 是否可见
	 * @returns {object} 返回值
	 */
	async updateVisibility(id, isVisible) {
		if (!id) {
			return {
				errCode: 1,
				errMsg: '页面ID不能为空'
			}
		}
		
		if (typeof isVisible !== 'boolean') {
			return {
				errCode: 1,
				errMsg: '可见性参数必须是布尔值'
			}
		}
		
		try {
			const res = await dbJQL.collection("customPages").doc(id).update({
				is_visible: isVisible,
				update_time: new Date().getTime()
			})
			
			return {
				updated: res.updated,
				code: 0,
				message: isVisible ? '页面已设为显示' : '页面已设为隐藏'
			}
		} catch (error) {
			console.error('更新页面可见性失败:', error)
			return {
				errCode: 2,
				errMsg: '更新页面可见性失败: ' + (error.message || '未知错误')
			}
		}
	},
	
	/**
	 * updateSort 更新页面排序
	 * @param {string} id 页面id
	 * @param {number} sort 排序值
	 * @returns {object} 返回值
	 */
	async updateSort(id, sort) {
		if (!id) {
			return {
				errCode: 1,
				errMsg: '页面ID不能为空'
			}
		}
		
		if (typeof sort !== 'number') {
			return {
				errCode: 1,
				errMsg: '排序值必须是数字'
			}
		}
		
		try {
			const res = await dbJQL.collection("customPages").doc(id).update({
				sort: sort,
				update_time: new Date().getTime()
			})
			
			return {
				updated: res.updated,
				code: 0,
				message: '排序更新成功'
			}
		} catch (error) {
			console.error('更新页面排序失败:', error)
			return {
				errCode: 2,
				errMsg: '更新页面排序失败: ' + (error.message || '未知错误')
			}
		}
	},
	
	/**
	 * increaseViewCount 增加浏览次数
	 * @param {string} id 页面id
	 * @returns {object} 返回值
	 */
	async increaseViewCount(id) {
		if (!id) {
			return {
				errCode: 1,
				errMsg: '页面ID不能为空'
			}
		}
		
		try {
			// 先获取当前页面数据
			const pageRes = await dbJQL.collection("customPages").doc(id).get()
			
			if (!pageRes.data || pageRes.data.length === 0) {
				return {
					errCode: 1,
					errMsg: '页面不存在'
				}
			}
			
			// 获取当前浏览次数，默认0
			const currentCount = pageRes.data[0].view_count || 0
			
			// 更新浏览次数
			const res = await dbJQL.collection("customPages").doc(id).update({
				view_count: currentCount + 1
			})
			
			return {
				updated: res.updated,
				code: 0,
				message: '浏览次数更新成功',
				view_count: currentCount + 1
			}
		} catch (error) {
			console.error('增加浏览次数失败:', error)
			return {
				errCode: 2,
				errMsg: '增加浏览次数失败: ' + (error.message || '未知错误')
			}
		}
	}
}
