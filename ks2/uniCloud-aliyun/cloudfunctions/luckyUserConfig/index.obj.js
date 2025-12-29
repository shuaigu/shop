const dbJQL = uniCloud.databaseForJQL()

module.exports = {
	_before: function() {
		// 通用预处理器
	},
	
	/**
	 * 获取幸运用户配置
	 * @returns {object} 返回值 - 幸运用户配置
	 */
	async getConfig() {
		try {
			// 获取配置
			const configRes = await dbJQL.collection('luckyUserConfig').limit(1).get()
			
			// 如果没有配置，创建默认配置
			if (!configRes.data || configRes.data.length === 0) {
				const db = uniCloud.database()
				const defaultConfig = {
					lucky_ranks: [1, 8, 18],
					rewards: '幸运用户专属奖励',
					is_enabled: true,
					update_time: new Date()
				}
				
				// 创建默认配置
				const insertRes = await db.collection('luckyUserConfig').add(defaultConfig)
				
				return {
					code: 0,
					message: '获取成功',
					data: {
						_id: insertRes.id,
						...defaultConfig
					}
				}
			}
			
			return {
				code: 0,
				message: '获取成功',
				data: configRes.data[0]
			}
		} catch (err) {
			console.error('获取幸运用户配置失败:', err)
			return {
				code: -1,
				message: '获取配置失败',
				error: err.message
			}
		}
	},
	
	/**
	 * 更新幸运用户配置
	 * @param {object} config 配置信息
	 * @param {Array} config.lucky_ranks 幸运用户排名列表
	 * @param {string} config.rewards 幸运用户奖励描述
	 * @param {boolean} config.is_enabled 是否启用幸运用户功能
	 * @returns {object} 返回值 - 更新结果
	 */
	async updateConfig(config) {
		try {
			// 参数校验
			if (!config) {
				return {
					code: -1,
					message: '参数不能为空'
				}
			}
			
			// 获取数据库引用
			const db = uniCloud.database()
			
			// 获取当前配置
			const configRes = await db.collection('luckyUserConfig').limit(1).get()
			
			// 更新数据
			const updateData = {
				update_time: new Date()
			}
			
			// 如果提供了幸运用户排名列表
			if (config.lucky_ranks !== undefined) {
				// 确保是数组
				if (!Array.isArray(config.lucky_ranks)) {
					return {
						code: -1,
						message: '幸运用户排名列表必须是数组'
					}
				}
				
				// 确保数组中的元素都是数字
				const validRanks = config.lucky_ranks.filter(rank => 
					typeof rank === 'number' || (typeof rank === 'string' && !isNaN(parseInt(rank)))
				).map(rank => parseInt(rank));
				
				// 排序并去重
				updateData.lucky_ranks = [...new Set(validRanks)].sort((a, b) => a - b);
			}
			
			// 如果提供了奖励描述
			if (config.rewards !== undefined) {
				updateData.rewards = String(config.rewards).trim();
			}
			
			// 如果提供了启用状态
			if (config.is_enabled !== undefined) {
				updateData.is_enabled = Boolean(config.is_enabled);
			}
			
			// 如果没有配置，创建默认配置
			if (!configRes.data || configRes.data.length === 0) {
				// 确保有默认值
				if (updateData.lucky_ranks === undefined) updateData.lucky_ranks = [1, 8, 18];
				if (updateData.rewards === undefined) updateData.rewards = '幸运用户专属奖励';
				if (updateData.is_enabled === undefined) updateData.is_enabled = true;
				
				// 创建配置
				const insertRes = await db.collection('luckyUserConfig').add(updateData)
				
				return {
					code: 0,
					message: '创建成功',
					data: {
						_id: insertRes.id,
						...updateData
					}
				}
			} else {
				// 更新配置
				const updateRes = await db.collection('luckyUserConfig')
					.doc(configRes.data[0]._id)
					.update(updateData)
				
				return {
					code: 0,
					message: '更新成功',
					data: {
						...configRes.data[0],
						...updateData
					}
				}
			}
		} catch (err) {
			console.error('更新幸运用户配置失败:', err)
			return {
				code: -1,
				message: '更新配置失败',
				error: err.message
			}
		}
	},
	
	/**
	 * 获取全局幸运用户配置状态
	 * @returns {object} 返回值 - 全局配置状态
	 */
	async getGlobalLuckyConfig() {
		try {
			// 获取配置
			const configRes = await dbJQL.collection('luckyUserConfig').limit(1).get()
			
			// 如果没有配置，创建默认配置
			if (!configRes.data || configRes.data.length === 0) {
				const db = uniCloud.database()
				const defaultConfig = {
					lucky_ranks: [1, 8, 18],
					rewards: '幸运用户专属奖励',
					is_enabled: false, // 默认关闭全局配置
					update_time: new Date()
				}
				
				// 创建默认配置
				const insertRes = await db.collection('luckyUserConfig').add(defaultConfig)
				
				return {
					code: 0,
					message: '获取成功',
					data: {
						_id: insertRes.id,
						...defaultConfig
					}
				}
			}
			
			return {
				code: 0,
				message: '获取成功',
				data: configRes.data[0]
			}
		} catch (err) {
			console.error('获取全局幸运用户配置状态失败:', err)
			return {
				code: -1,
				message: '获取配置失败',
				error: err.message
			}
		}
	},
	
	/**
	 * 切换全局幸运用户配置状态
	 * @param {boolean} enabled 是否启用全局配置
	 * @returns {object} 返回值 - 更新结果
	 */
	async toggleGlobalLuckyConfig(enabled) {
		try {
			if (typeof enabled !== 'boolean') {
				return {
					code: -1,
					message: '启用状态参数必须是布尔值'
				}
			}
			
			// 获取数据库引用
			const db = uniCloud.database()
			
			// 获取当前配置
			const configRes = await db.collection('luckyUserConfig').limit(1).get()
			
			// 更新数据
			const updateData = {
				is_enabled: enabled,
				update_time: new Date()
			}
			
			// 如果没有配置，创建默认配置
			if (!configRes.data || configRes.data.length === 0) {
				// 创建默认配置
				const defaultConfig = {
					lucky_ranks: [1, 8, 18],
					rewards: '幸运用户专属奖励',
					is_enabled: enabled,
					update_time: new Date()
				}
				
				// 创建配置
				const insertRes = await db.collection('luckyUserConfig').add(defaultConfig)
				
				return {
					code: 0,
					message: enabled ? '已开启全局配置' : '已关闭全局配置',
					data: {
						_id: insertRes.id,
						...defaultConfig
					}
				}
			} else {
				// 更新配置
				await db.collection('luckyUserConfig')
					.doc(configRes.data[0]._id)
					.update(updateData)
				
				return {
					code: 0,
					message: enabled ? '已开启全局配置' : '已关闭全局配置',
					data: {
						...configRes.data[0],
						...updateData
					}
				}
			}
		} catch (err) {
			console.error('切换全局幸运用户配置状态失败:', err)
			return {
				code: -1,
				message: '切换状态失败',
				error: err.message
			}
		}
	},
	
	/**
	 * 获取文章特定幸运用户配置列表
	 * @returns {object} 返回值 - 文章特定配置列表
	 */
	async getArticleLuckyConfigList() {
		try {
			// 获取文章特定配置列表
			const configRes = await dbJQL.collection('articleLuckyConfig')
				.orderBy('update_time', 'desc')
				.get()
			
			return {
				code: 0,
				message: '获取成功',
				data: configRes.data || []
			}
		} catch (err) {
			console.error('获取文章特定幸运用户配置列表失败:', err)
			return {
				code: -1,
				message: '获取配置列表失败',
				error: err.message
			}
		}
	},
	
	/**
	 * 获取文章特定幸运用户配置
	 * @param {string} article_id 文章ID
	 * @returns {object} 返回值 - 文章特定配置
	 */
	async getArticleLuckyConfig(article_id) {
		try {
			if (!article_id) {
				return {
					code: -1,
					message: '文章ID不能为空'
				}
			}
			
			// 获取文章特定配置
			const configRes = await dbJQL.collection('articleLuckyConfig')
				.where({
					article_id: article_id
				})
				.limit(1)
				.get()
			
			if (configRes.data && configRes.data.length > 0) {
				return {
					code: 0,
					message: '获取成功',
					data: configRes.data[0],
					source: 'article'
				}
			} else {
				// 如果没有文章特定配置，返回全局配置
				const globalConfig = await this.getGlobalLuckyConfig()
				
				if (globalConfig.code === 0 && globalConfig.data) {
					return {
						code: 0,
						message: '使用全局配置',
						data: {
							article_id: article_id,
							lucky_ranks: globalConfig.data.lucky_ranks || [1, 8, 18],
							is_enabled: globalConfig.data.is_enabled || false,
							show_modal: true
						},
						source: 'global'
					}
				} else {
					return {
						code: -1,
						message: '获取配置失败'
					}
				}
			}
		} catch (err) {
			console.error('获取文章特定幸运用户配置失败:', err)
			return {
				code: -1,
				message: '获取配置失败',
				error: err.message
			}
		}
	},
	
	/**
	 * 设置文章特定幸运用户配置
	 * @param {string} article_id 文章ID
	 * @param {Array} lucky_ranks 幸运用户排名列表
	 * @param {boolean} is_enabled 是否启用
	 * @param {boolean} show_modal 是否显示弹窗
	 * @returns {object} 返回值 - 设置结果
	 */
	async setArticleLuckyConfig(article_id, lucky_ranks, is_enabled, show_modal) {
		try {
			if (!article_id) {
				return {
					code: -1,
					message: '文章ID不能为空'
				}
			}
			
			// 参数处理
			const parsed_lucky_ranks = Array.isArray(lucky_ranks) 
				? lucky_ranks.filter(rank => 
					typeof rank === 'number' || (typeof rank === 'string' && !isNaN(parseInt(rank)))
				).map(rank => parseInt(rank))
				: [1, 8, 18];
			
			// 排序并去重
			const unique_lucky_ranks = [...new Set(parsed_lucky_ranks)].sort((a, b) => a - b);
			
			// 构建更新数据
			const updateData = {
				article_id: article_id,
				lucky_ranks: unique_lucky_ranks,
				is_enabled: typeof is_enabled === 'boolean' ? is_enabled : true,
				show_modal: typeof show_modal === 'boolean' ? show_modal : true,
				update_time: new Date()
			}
			
			// 获取数据库引用
			const db = uniCloud.database()
			
			// 获取文章特定配置
			const configRes = await db.collection('articleLuckyConfig')
				.where({
					article_id: article_id
				})
				.limit(1)
				.get()
			
			// 如果已存在则更新，否则新增
			if (configRes.data && configRes.data.length > 0) {
				await db.collection('articleLuckyConfig')
					.doc(configRes.data[0]._id)
					.update(updateData)
				
				return {
					code: 0,
					message: '更新成功',
					data: {
						...configRes.data[0],
						...updateData
					}
				}
			} else {
				const insertRes = await db.collection('articleLuckyConfig')
					.add(updateData)
				
				return {
					code: 0,
					message: '创建成功',
					data: {
						_id: insertRes.id,
						...updateData
					}
				}
			}
		} catch (err) {
			console.error('设置文章特定幸运用户配置失败:', err)
			return {
				code: -1,
				message: '设置配置失败',
				error: err.message
			}
		}
	},
	
	/**
	 * 删除文章特定幸运用户配置
	 * @param {string} article_id 文章ID
	 * @returns {object} 返回值 - 删除结果
	 */
	async deleteArticleLuckyConfig(article_id) {
		try {
			if (!article_id) {
				return {
					code: -1,
					message: '文章ID不能为空'
				}
			}
			
			// 获取数据库引用
			const db = uniCloud.database()
			
			// 获取文章特定配置
			const configRes = await db.collection('articleLuckyConfig')
				.where({
					article_id: article_id
				})
				.limit(1)
				.get()
			
			if (configRes.data && configRes.data.length > 0) {
				// 删除配置
				await db.collection('articleLuckyConfig')
					.doc(configRes.data[0]._id)
					.remove()
				
				return {
					code: 0,
					message: '删除成功'
				}
			} else {
				return {
					code: -1,
					message: '配置不存在'
				}
			}
		} catch (err) {
			console.error('删除文章特定幸运用户配置失败:', err)
			return {
				code: -1,
				message: '删除配置失败',
				error: err.message
			}
		}
	}
} 