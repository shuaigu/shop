const db = uniCloud.database()
const dbCmd = db.command

module.exports = {
	_before: function() {
		// 通用预处理器
	},

	/**
	 * 创建打赏订单
	 * @param {Object} params
	 * @param {String} params.article_id 文章ID
	 * @param {Number} params.amount 打赏金额（分）
	 * @param {String} params.message 打赏留言
	 * @returns {Object} 返回订单信息
	 */
	async createRewardOrder(params) {
		const { article_id, amount, message = '', from_user_id } = params
		
		// 简化版：从客户端传递用户ID（测试模式）
		if (!from_user_id) {
			return {
				code: -1,
				message: '用户信息不存在'
			}
		}
		
		// TODO: 正式环境请取消注释下面的代码，使用uni-id验证
		// const uniIdCommon = require('uni-id-common')
		// const uniIdInstance = uniIdCommon.createInstance({ context: this })
		// const payload = await uniIdInstance.checkToken(this.getUniIdToken())
		// if (payload.errCode) {
		// 	return { code: -1, message: '未登录或登录已过期' }
		// }
		// const from_user_id = payload.uid
		
		try {
			// 参数验证
			if (!article_id) {
				return { code: -1, message: '文章ID不能为空' }
			}
			if (!amount || amount < 100) {
				return { code: -1, message: '打赏金额不能少于1元' }
			}
			if (amount > 100000) {
				return { code: -1, message: '单笔打赏金额不能超过1000元' }
			}

			// 获取文章信息
			const articleRes = await db.collection('articleList')
				.doc(article_id)
				.field({ user_id: true })
				.get()
			
			if (!articleRes.data || articleRes.data.length === 0) {
				return { code: -1, message: '文章不存在' }
			}
			
			const article = articleRes.data[0]
			const to_user_id = article.user_id
			
			// 移除“不能打赏自己”的限制，允许管理员打赏
			// 如果需要恢复限制，取消注释下面的代码
			// if (from_user_id === to_user_id) {
			// 	return { code: -1, message: '不能打赏自己的文章' }
			// }
			
			// 获取打赏用户信息
			const fromUserRes = await db.collection('user')
				.doc(from_user_id)
				.field({ nickName: true, avatarUrl: true })
				.get()
			
			if (!fromUserRes.data || fromUserRes.data.length === 0) {
				return { code: -1, message: '用户信息不存在' }
			}
			
			const fromUser = fromUserRes.data[0]
			
			// 获取被打赏用户信息
			const toUserRes = await db.collection('user')
				.doc(to_user_id)
				.field({ nickName: true })
				.get()
			
			const toUser = toUserRes.data && toUserRes.data.length > 0 ? toUserRes.data[0] : {}
			
			// 生成订单号
			const order_no = 'RWD' + Date.now() + Math.floor(Math.random() * 1000)
			
			// 创建打赏记录
			const rewardData = {
				article_id,
				from_user_id,
				from_user_name: fromUser.nickName || '匿名用户',
				from_user_avatar: fromUser.avatarUrl || '',
				to_user_id,
				to_user_name: toUser.nickName || '匿名用户',
				amount,
				order_no,
				status: 0,
				message,
				create_time: Date.now()
			}
			
			const addRes = await db.collection('rewardRecord').add(rewardData)
			
			return {
				code: 0,
				message: '订单创建成功',
				data: {
					reward_id: addRes.id,
					order_no,
					amount
				}
			}
		} catch (err) {
			console.error('创建打赏订单失败:', err)
			return {
				code: -1,
				message: '创建订单失败: ' + err.message
			}
		}
	},

	/**
	 * 更新打赏订单状态
	 * @param {Object} params
	 * @param {String} params.order_no 订单号
	 * @param {Number} params.status 状态
	 * @returns {Object}
	 */
	async updateRewardStatus(params) {
		const { order_no, status } = params
		
		try {
			if (!order_no) {
				return { code: -1, message: '订单号不能为空' }
			}
			
			const updateData = { status }
			if (status === 1) {
				updateData.pay_time = Date.now()
			}
			
			await db.collection('rewardRecord')
				.where({ order_no })
				.update(updateData)
			
			return {
				code: 0,
				message: '更新成功'
			}
		} catch (err) {
			console.error('更新打赏订单状态失败:', err)
			return {
				code: -1,
				message: '更新失败: ' + err.message
			}
		}
	},

	/**
	 * 获取文章的打赏列表
	 * @param {Object} params
	 * @param {String} params.article_id 文章ID
	 * @param {Number} params.page 页码
	 * @param {Number} params.pageSize 每页数量
	 * @returns {Object}
	 */
	async getRewardList(params) {
		const { article_id, page = 1, pageSize = 20 } = params
		
		try {
			if (!article_id) {
				return { code: -1, message: '文章ID不能为空' }
			}
			
			const skip = (page - 1) * pageSize
			
			// 只查询已支付的打赏记录
			const res = await db.collection('rewardRecord')
				.where({
					article_id,
					status: 1
				})
				.field({
					from_user_name: true,
					from_user_avatar: true,
					amount: true,
					message: true,
					pay_time: true
				})
				.orderBy('pay_time', 'desc')
				.skip(skip)
				.limit(pageSize)
				.get()
			
			// 获取总数
			const countRes = await db.collection('rewardRecord')
				.where({
					article_id,
					status: 1
				})
				.count()
			
			return {
				code: 0,
				message: '获取成功',
				data: {
					list: res.data || [],
					total: countRes.total || 0,
					page,
					pageSize
				}
			}
		} catch (err) {
			console.error('获取打赏列表失败:', err)
			return {
				code: -1,
				message: '获取失败: ' + err.message,
				data: {
					list: [],
					total: 0
				}
			}
		}
	},

	/**
	 * 获取文章打赏统计
	 * @param {Object} params
	 * @param {String} params.article_id 文章ID
	 * @returns {Object}
	 */
	async getRewardStatistics(params) {
		const { article_id } = params
		
		try {
			if (!article_id) {
				return { code: -1, message: '文章ID不能为空' }
			}
			
			// 获取打赏总金额和人数
			const res = await db.collection('rewardRecord')
				.where({
					article_id,
					status: 1
				})
				.get()
			
			let totalAmount = 0
			const uniqueUsers = new Set()
			
			res.data.forEach(item => {
				totalAmount += item.amount
				uniqueUsers.add(item.from_user_id)
			})
			
			return {
				code: 0,
				message: '获取成功',
				data: {
					totalAmount, // 总金额（分）
					totalCount: res.data.length, // 打赏次数
					userCount: uniqueUsers.size // 打赏人数
				}
			}
		} catch (err) {
			console.error('获取打赏统计失败:', err)
			return {
				code: -1,
				message: '获取失败: ' + err.message,
				data: {
					totalAmount: 0,
					totalCount: 0,
					userCount: 0
				}
			}
		}
	}
}
