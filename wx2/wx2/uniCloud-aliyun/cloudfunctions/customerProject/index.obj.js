// 客户项目云对象
module.exports = {
	_before: function () {
		// 通用预处理器
	},
	
	/**
	 * 获取客户项目列表
	 * @param {object} params - 查询参数
	 * @param {number} params.pageNum - 页码，默认1
	 * @param {number} params.pageSize - 每页条数，默认10
	 * @param {string} params.category - 项目类型筛选
	 * @param {number} params.status - 状态筛选，不传则获取上架的
	 * @returns {object} 返回项目列表和分页信息
	 */
	async getList(params = {}) {
		try {
			const { pageNum = 1, pageSize = 10, category, status = 1 } = params
			const db = uniCloud.database()
			const collection = db.collection('customer_projects')
			
			// 构建查询条件
			let query = collection.where({ status })
			
			// 如果有分类筛选
			if (category) {
				query = query.where({ category })
			}
			
			// 按排序权重和创建时间排序
			query = query.orderBy('sort_order', 'desc').orderBy('create_time', 'desc')
			
			// 分页查询
			const skip = (pageNum - 1) * pageSize
			const result = await query.skip(skip).limit(pageSize).get()
			
			// 获取总数
			const countResult = await collection.where({ status }).count()
			
			return {
				errCode: 0,
				errMsg: '获取成功',
				data: {
					list: result.data || [],
					total: countResult.total || 0,
					pageNum,
					pageSize
				}
			}
		} catch (error) {
			console.error('获取客户项目列表失败:', error)
			return {
				errCode: -1,
				errMsg: '获取失败: ' + error.message
			}
		}
	},
	
	/**
	 * 获取项目详情
	 * @param {string} projectId - 项目ID
	 * @returns {object} 返回项目详情
	 */
	async getDetail(projectId) {
		try {
			if (!projectId) {
				return {
					errCode: -1,
					errMsg: '项目ID不能为空'
				}
			}
			
			const db = uniCloud.database()
			const dbCmd = db.command
			const collection = db.collection('customer_projects')
			
			// 获取项目详情
			const result = await collection.doc(projectId).get()
			
			if (!result.data || result.data.length === 0) {
				return {
					errCode: -1,
					errMsg: '项目不存在'
				}
			}
			
			// 增加浏览次数
			await collection.doc(projectId).update({
				view_count: dbCmd.inc(1)
			})
			
			return {
				errCode: 0,
				errMsg: '获取成功',
				data: result.data[0]
			}
		} catch (error) {
			console.error('获取项目详情失败:', error)
			return {
				errCode: -1,
				errMsg: '获取失败: ' + error.message
			}
		}
	},
	
	/**
	 * 创建项目（管理员）
	 * @param {object} projectData - 项目数据
	 * @returns {object} 返回创建结果
	 */
	async create(projectData) {
		try {
			// 验证权限（这里简化处理，实际应该检查用户角色）
			const db = uniCloud.database()
			const collection = db.collection('customer_projects')
			
			// 补充必要字段
			const data = {
				...projectData,
				user_id: this.getUniIdToken()?.uid || '',
				create_time: Date.now(),
				update_time: Date.now(),
				view_count: 0,
				status: projectData.status !== undefined ? projectData.status : 1,
				sort_order: projectData.sort_order || 0
			}
			
			const result = await collection.add(data)
			
			return {
				errCode: 0,
				errMsg: '创建成功',
				data: {
					id: result.id
				}
			}
		} catch (error) {
			console.error('创建项目失败:', error)
			return {
				errCode: -1,
				errMsg: '创建失败: ' + error.message
			}
		}
	},
	
	/**
	 * 更新项目（管理员）
	 * @param {string} projectId - 项目ID
	 * @param {object} projectData - 更新的数据
	 * @returns {object} 返回更新结果
	 */
	async update(projectId, projectData) {
		try {
			if (!projectId) {
				return {
					errCode: -1,
					errMsg: '项目ID不能为空'
				}
			}
			
			const db = uniCloud.database()
			const collection = db.collection('customer_projects')
			
			// 更新数据
			const updateData = {
				...projectData,
				update_time: Date.now()
			}
			
			// 删除不应该被更新的字段
			delete updateData._id
			delete updateData.user_id
			delete updateData.create_time
			
			const result = await collection.doc(projectId).update(updateData)
			
			return {
				errCode: 0,
				errMsg: '更新成功',
				data: {
					updated: result.updated
				}
			}
		} catch (error) {
			console.error('更新项目失败:', error)
			return {
				errCode: -1,
				errMsg: '更新失败: ' + error.message
			}
		}
	},
	
	/**
	 * 删除项目（管理员）
	 * @param {string} projectId - 项目ID
	 * @returns {object} 返回删除结果
	 */
	async delete(projectId) {
		try {
			if (!projectId) {
				return {
					errCode: -1,
					errMsg: '项目ID不能为空'
				}
			}
			
			const db = uniCloud.database()
			const collection = db.collection('customer_projects')
			
			const result = await collection.doc(projectId).remove()
			
			return {
				errCode: 0,
				errMsg: '删除成功',
				data: {
					deleted: result.deleted
				}
			}
		} catch (error) {
			console.error('删除项目失败:', error)
			return {
				errCode: -1,
				errMsg: '删除失败: ' + error.message
			}
		}
	},
	
	/**
	 * 获取管理后台项目列表（包括下架的）
	 * @param {object} params - 查询参数
	 * @returns {object} 返回项目列表
	 */
	async getAdminList(params = {}) {
		try {
			const { pageNum = 1, pageSize = 20, status, category } = params
			const db = uniCloud.database()
			const collection = db.collection('customer_projects')
			
			// 构建查询条件
			let where = {}
			if (status !== undefined && status !== null && status !== '') {
				where.status = status
			}
			if (category) {
				where.category = category
			}
			
			let query = collection
			if (Object.keys(where).length > 0) {
				query = query.where(where)
			}
			
			// 按排序权重和创建时间排序
			query = query.orderBy('sort_order', 'desc').orderBy('create_time', 'desc')
			
			// 分页查询
			const skip = (pageNum - 1) * pageSize
			const result = await query.skip(skip).limit(pageSize).get()
			
			// 获取总数
			let countQuery = collection
			if (Object.keys(where).length > 0) {
				countQuery = countQuery.where(where)
			}
			const countResult = await countQuery.count()
			
			return {
				errCode: 0,
				errMsg: '获取成功',
				data: {
					list: result.data || [],
					total: countResult.total || 0,
					pageNum,
					pageSize
				}
			}
		} catch (error) {
			console.error('获取管理后台项目列表失败:', error)
			return {
				errCode: -1,
				errMsg: '获取失败: ' + error.message
			}
		}
	}
}
