const db = uniCloud.database()
const dbCmd = db.command

module.exports = {
	_before: function() {
		this.db = uniCloud.database()
		this.dbCmd = this.db.command
		this.chatConfigCollection = this.db.collection('chat_config')
		this.userCollection = this.db.collection('user')
	},

	/**
	 * 获取聊天对话配置
	 * @returns {Object} 对话配置数据
	 */
	async getChatConfig() {
		try {
			// 从数据库获取配置
			const res = await this.chatConfigCollection
				.where({ config_type: 'liaotian_questions' })
				.orderBy('sort_order', 'asc')
				.get()

			if (res.data && res.data.length > 0) {
				// 返回数据库中的配置
				return {
					errCode: 0,
					errMsg: 'success',
					data: res.data[0]
				}
			}

			// 如果数据库没有配置，返回默认配置
			const defaultConfig = getDefaultConfigData()
			return {
				errCode: 0,
				errMsg: 'success',
				data: defaultConfig
			}
		} catch (error) {
			console.error('获取聊天配置失败:', error)
			const defaultConfig = getDefaultConfigData()
			return {
				errCode: -1,
				errMsg: error.message,
				data: defaultConfig // 出错时返回默认配置
			}
		}
	},

	/**
	 * 更新聊天对话配置
	 * @param {Object} config 新的配置数据
	 * @returns {Object} 更新结果
	 */
	async updateChatConfig(config) {
		try {
			const { questions, header_title, header_subtitle, footer_text, reward_amount } = config

			// 验证必填字段
			if (!questions || !Array.isArray(questions)) {
				throw new Error('questions 必须是数组')
			}

			// 查找现有配置
			const existRes = await this.chatConfigCollection
				.where({ config_type: 'liaotian_questions' })
				.get()

			const updateData = {
				config_type: 'liaotian_questions',
				questions,
				header_title: header_title || '我们帮您把业务/产品推广出去',
				header_subtitle: header_subtitle || '收下福利，开始精准获客之旅',
				footer_text: footer_text || '页面信息及服务由湖北客聚多企业管理有限公司提供',
				reward_amount: reward_amount || 0.1,
				update_time: Date.now()
			}

			if (existRes.data && existRes.data.length > 0) {
				// 更新现有配置
				await this.chatConfigCollection
					.doc(existRes.data[0]._id)
					.update(updateData)
			} else {
				// 创建新配置
				updateData.create_time = Date.now()
				updateData.sort_order = 1
				await this.chatConfigCollection.add(updateData)
			}

			return {
				errCode: 0,
				errMsg: '配置更新成功'
			}
		} catch (error) {
			console.error('更新聊天配置失败:', error)
			return {
				errCode: -1,
				errMsg: error.message
			}
		}
	},

	/**
	 * 处理聊天奖励（转账）
	 * @param {String} userId 用户ID
	 * @param {Number} amount 奖励金额
	 * @param {String} remark 备注
	 * @returns {Object} 转账结果
	 */
	async processChatReward(userId, amount, remark) {
		try {
			if (!userId) {
				return {
					errCode: -1,
					errMsg: '用户ID不能为空'
				}
			}

			// 检查用户是否已经领取过
			const rewardRecord = await this.db.collection('chat_reward_record')
				.where({
					user_id: userId,
					reward_type: 'liaotian_survey'
				})
				.get()

			if (rewardRecord.data && rewardRecord.data.length > 0) {
				return {
					errCode: -1,
					errMsg: '您已经领取过这个奖励了',
					already_received: true
				}
			}

			// 获取用户信息
			const userRes = await this.userCollection.doc(userId).get()
			if (!userRes.data || userRes.data.length === 0) {
				return {
					errCode: -1,
					errMsg: '用户不存在'
				}
			}

			const user = userRes.data[0]
			const openid = user.wx_openid && user.wx_openid.mp ? user.wx_openid.mp : null

			if (!openid) {
				return {
					errCode: -1,
					errMsg: '用户未绑定微信openid，无法转账',
					no_openid: true
				}
			}

			// 调用微信转账接口
			const wxpay = uniCloud.importObject('wxpay')
			const transferResult = await wxpay.transfer({
				openid: openid,
				amount: amount,
				desc: remark || '问卷调查奖励'
			})

			if (transferResult && transferResult.errCode === 0) {
				// 记录奖励发放
				await this.db.collection('chat_reward_record').add({
					user_id: userId,
					reward_type: 'liaotian_survey',
					amount: amount,
					openid: openid,
					remark: remark,
					transfer_result: transferResult,
					create_time: Date.now()
				})

				return {
					errCode: 0,
					errMsg: '转账成功',
					data: {
						amount: amount
					}
				}
			} else {
				return {
					errCode: -1,
					errMsg: transferResult.errMsg || '转账失败'
				}
			}
		} catch (error) {
			console.error('处理聊天奖励失败:', error)
			return {
				errCode: -1,
				errMsg: error.message
			}
		}
	},

	/**
	 * 获取默认配置
	 * @returns {Object} 默认配置
	 */
	getDefaultConfig() {
		return getDefaultConfigData()
	},

	/**
	 * 初始化默认配置到数据库
	 * @returns {Object} 初始化结果
	 */
	async initDefaultConfig() {
		try {
			// 检查是否已存在配置
			const existRes = await this.chatConfigCollection
				.where({ config_type: 'liaotian_questions' })
				.get()

			if (existRes.data && existRes.data.length > 0) {
				return {
					errCode: 0,
					errMsg: '配置已存在，无需初始化'
				}
			}

			// 插入默认配置
			const defaultConfig = getDefaultConfigData()
			defaultConfig.create_time = Date.now()
			defaultConfig.update_time = Date.now()
			defaultConfig.sort_order = 1

			await this.chatConfigCollection.add(defaultConfig)

			return {
				errCode: 0,
				errMsg: '默认配置初始化成功'
			}
		} catch (error) {
			console.error('初始化默认配置失败:', error)
			return {
				errCode: -1,
				errMsg: error.message
			}
		}
	}
}

// 获取默认配置数据（独立函数，避免 this 上下文问题）
function getDefaultConfigData() {
	return {
		config_type: 'liaotian_questions',
		header_title: '我们帮您把业务/产品推广出去',
		header_subtitle: '收下福利，开始精准获客之旅',
		footer_text: '页面信息及服务由湖北客聚多企业管理有限公司提供',
		reward_amount: 0.1,
		questions: [
			{
				text: '我们是做全行业获客的专业团队，能够帮助您精准获取客户；意向客户会主动添加您，全行业均可做；若您有需求，请认真回答以下问题。',
				type: 'text'
			},
			{
				text: '您是否愿意收下0.1元？',
				options: ['愿意', '不愿意'],
				type: 'reward',
				isReward: true
			},
			{
				text: '您是否整面临获客难、成本高的问题？',
				options: ['是', '否'],
				type: 'choice'
			},
			{
				text: '您想要获取哪里的客户？',
				options: ['本地客户', '全国客户'],
				type: 'choice'
			},
			{
				text: '我们提供精准客户，您是否接受1000-3000/年的合作费用？',
				options: ['是', '否'],
				type: 'choice'
			},
			{
				text: '您是否愿意换电瓶？',
				options: ['愿意', '不愿意'],
				type: 'choice'
			},
			{
				text: '感谢您的回答！我们会根据您的需求为您匹配最优质的推广方案，稍后会有专业顾问为您提供咨询服务。',
				type: 'text',
				isEnd: true
			}
		]
	}
}
