'use strict';

/**
 * likeRecord 云对象
 * 用于处理文章点赞相关的操作
 */

// 统一的幸运用户配置
const LUCKY_USER_CONFIG = {
	// 幸运用户排名列表（默认值）
	DEFAULT_LUCKY_RANKS: [2, 8, 18, 28],
	// 是否启用幸运用户功能（默认值）
	DEFAULT_IS_ENABLED: true,
	// 是否显示幸运用户横幅（默认值）
	DEFAULT_SHOW_MODAL: true,
	// 幸运用户奖励消息（默认值）
	DEFAULT_REWARD_MESSAGE: '恭喜您获得幸运用户奖励！',
	// 配置在数据库中的键名
	CONFIG_KEY: 'luckyUserConfig'
};

module.exports = {
	/**
	 * 初始化方法，在每次云对象调用前执行
	 */
	_before: function () {
		// 初始化数据库对象
		this.db = uniCloud.database();
	},
	
	/**
	 * 切换点赞状态
	 * @param {String} article_id - 文章ID
	 * @param {String} user_id - 用户ID
	 * @return {Object} 包含点赞状态和点赞数的对象
	 */
	async toggleLike(article_id, user_id) {
		// 参数校验
		if (!article_id || !user_id) {
			return {
				code: 1,
				message: '参数不完整'
			}
		}
		
		try {
			// 查询是否已点赞
			const likeRecord = await this.db.collection('likeRecord')
				.where({
					article_id: article_id,
					user_id: user_id
				})
				.get()
				
			// 获取文章信息，用于获取当前点赞数
			let currentLikeCount = 0
			try {
				const articleInfo = await this.db.collection('articleList')
					.doc(article_id)
					.field({ like_count: 1 })
					.get()
					
				if (articleInfo.data && articleInfo.data.length > 0) {
					currentLikeCount = articleInfo.data[0].like_count || 0
				} else {
					// 如果找不到文章，尝试创建一个默认的点赞记录
					console.warn('文章不存在，使用默认点赞数')
				}
			} catch (err) {
				console.error('获取文章点赞数失败:', err)
				// 继续执行，使用默认点赞数0
			}
			
			// 如果没有点赞记录，则添加点赞
			if (likeRecord.data.length === 0) {
				// 获取用户信息
				let nickname = ''
				let avatar = ''
				
				try {
					const userInfo = await this.db.collection('uni-id-users')
						.doc(user_id)
						.field({ nickname: 1, avatar: 1 })
						.get()
						
					if (userInfo.data && userInfo.data.length > 0) {
						nickname = userInfo.data[0].nickname || ''
						avatar = userInfo.data[0].avatar || ''
					}
				} catch (err) {
					console.error('获取用户信息失败:', err)
					// 继续执行，使用默认空值
				}
				
				// 添加点赞记录
				try {
					await this.db.collection('likeRecord').add({
						article_id: article_id,
						user_id: user_id,
						nickname: nickname,
						avatar: avatar,
						create_time: new Date()
					})
				} catch (err) {
					console.error('添加点赞记录失败:', err)
					return {
						code: 1,
						message: '点赞失败: ' + err.message
					}
				}
				
				// 更新文章点赞数
				const newLikeCount = currentLikeCount + 1
				try {
					await this.db.collection('articleList')
						.doc(article_id)
						.update({
							like_count: newLikeCount
						})
				} catch (err) {
					console.error('更新文章点赞数失败:', err)
					// 继续执行，返回新的点赞数
				}
				
				// 获取当前用户的点赞排名
				// 注意：这里我们使用点赞数作为排名依据
				const like_rank = newLikeCount
				
				// 获取幸运用户配置并判断是否为幸运用户
				let luckyRanks = LUCKY_USER_CONFIG.DEFAULT_LUCKY_RANKS;
				let isEnabled = LUCKY_USER_CONFIG.DEFAULT_IS_ENABLED;
				let isWinner = false;
				
				try {
					// 获取文章特定的幸运用户配置
					const configResult = await this.getArticleLuckyConfig(article_id);
					if (configResult.code === 0 && configResult.data) {
						if (Array.isArray(configResult.data.lucky_ranks) && configResult.data.lucky_ranks.length > 0) {
							luckyRanks = configResult.data.lucky_ranks;
						}
						
						if (typeof configResult.data.is_enabled === 'boolean') {
							isEnabled = configResult.data.is_enabled;
						}
						
						// 判断是否为幸运用户
						isWinner = isEnabled && luckyRanks.includes(like_rank);
					}
				} catch (err) {
					console.error('获取幸运用户配置失败，使用默认配置:', err);
					// 使用默认配置继续执行
					isWinner = luckyRanks.includes(like_rank);
				}
				
				return {
					code: 0,
					message: '点赞成功',
					isLiked: true,
					like_count: newLikeCount,
					like_rank: like_rank,
					nickname: nickname,
					avatar: avatar
				}
			} else {
				// 如果已点赞，则取消点赞
				try {
					await this.db.collection('likeRecord')
						.where({
							article_id: article_id,
							user_id: user_id
						})
						.remove()
				} catch (err) {
					console.error('删除点赞记录失败:', err)
					return {
						code: 1,
						message: '取消点赞失败: ' + err.message
					}
				}
				
				// 更新文章点赞数
				const newLikeCount = Math.max(0, currentLikeCount - 1)
				try {
					await this.db.collection('articleList')
						.doc(article_id)
						.update({
							like_count: newLikeCount
						})
				} catch (err) {
					console.error('更新文章点赞数失败:', err)
					// 继续执行，返回新的点赞数
				}
				
				return {
					code: 0,
					message: '取消点赞成功',
					isLiked: false,
					like_count: newLikeCount
				}
			}
		} catch (err) {
			console.error('点赞操作失败:', err)
			return {
				code: 1,
				message: '点赞操作失败: ' + err.message
			}
		}
	},
	
	/**
	 * 获取点赞排名
	 * @param {String} article_id - 文章ID
	 * @param {String} user_id - 用户ID
	 * @return {Object} 包含点赞排名的对象
	 */
	async getLikeRank(article_id, user_id) {
		// 参数校验
		if (!article_id || !user_id) {
			return {
				code: 1,
				message: '参数不完整'
			}
		}
		
		try {
			// 查询用户点赞记录
			const likeRecord = await this.db.collection('likeRecord')
				.where({
					article_id: article_id,
					user_id: user_id
				})
				.get()
			
			// 如果没有点赞记录，返回错误
			if (likeRecord.data.length === 0) {
				return {
					code: 1,
					message: '用户未点赞该文章'
				}
			}
			
			// 获取文章信息，用于获取当前点赞数
			let currentLikeCount = 0
			try {
				const articleInfo = await this.db.collection('articleList')
					.doc(article_id)
					.field({ like_count: 1 })
					.get()
					
				if (articleInfo.data && articleInfo.data.length > 0) {
					currentLikeCount = articleInfo.data[0].like_count || 0
				}
			} catch (err) {
				console.error('获取文章点赞数失败:', err)
				// 继续执行，使用默认点赞数0
			}
			
			// 使用点赞数作为排名
			const like_rank = currentLikeCount
			
			// 获取用户信息
			let nickname = ''
			let avatar = ''
			try {
				const userInfo = await this.db.collection('uni-id-users')
					.doc(user_id)
					.field({ nickname: 1, avatar: 1 })
					.get()
					
				if (userInfo.data && userInfo.data.length > 0) {
					nickname = userInfo.data[0].nickname || ''
					avatar = userInfo.data[0].avatar || ''
				}
			} catch (err) {
				console.error('获取用户信息失败:', err)
				// 继续执行，使用默认空值
			}
			
			return {
				code: 0,
				message: '获取点赞排名成功',
				like_rank: like_rank,
				nickname: nickname,
				avatar: avatar
			}
		} catch (err) {
			console.error('获取点赞排名失败:', err)
			return {
				code: 1,
				message: '获取点赞排名失败: ' + err.message
			}
		}
	},
	
	/**
	 * 获取幸运用户配置
	 * @return {Object} 包含幸运用户配置的对象
	 */
	async getLuckyConfig() {
		try {
			// 从lucky_config表中获取幸运用户配置
			const configCollection = this.db.collection('lucky_config');
			const result = await configCollection.limit(1).get();
			
			// 如果找到配置，返回配置数据
			if (result.data && result.data.length > 0) {
				// 确保返回完整的配置，包括show_modal和reward_message
				const config = result.data[0];
				return {
					code: 0,
					message: '获取幸运用户配置成功',
					data: {
						lucky_ranks: config.lucky_ranks || LUCKY_USER_CONFIG.DEFAULT_LUCKY_RANKS,
						is_enabled: typeof config.is_enabled === 'boolean' ? config.is_enabled : LUCKY_USER_CONFIG.DEFAULT_IS_ENABLED,
						rewards: config.rewards || LUCKY_USER_CONFIG.DEFAULT_REWARD_MESSAGE,
						show_modal: typeof config.show_modal === 'boolean' ? config.show_modal : LUCKY_USER_CONFIG.DEFAULT_SHOW_MODAL,
						reward_message: config.reward_message || config.rewards || LUCKY_USER_CONFIG.DEFAULT_REWARD_MESSAGE
					}
				}
			}
			
			// 如果没有找到配置，返回默认配置
			return {
				code: 0,
				message: '使用默认幸运用户配置',
				data: {
					lucky_ranks: LUCKY_USER_CONFIG.DEFAULT_LUCKY_RANKS,
					is_enabled: LUCKY_USER_CONFIG.DEFAULT_IS_ENABLED,
					rewards: LUCKY_USER_CONFIG.DEFAULT_REWARD_MESSAGE,
					show_modal: LUCKY_USER_CONFIG.DEFAULT_SHOW_MODAL,
					reward_message: LUCKY_USER_CONFIG.DEFAULT_REWARD_MESSAGE
				}
			}
		} catch (err) {
			console.error('获取幸运用户配置失败:', err)
			// 出错时返回默认配置
			return {
				code: 0,
				message: '获取配置失败，使用默认配置',
				data: {
					lucky_ranks: LUCKY_USER_CONFIG.DEFAULT_LUCKY_RANKS,
					is_enabled: LUCKY_USER_CONFIG.DEFAULT_IS_ENABLED,
					rewards: LUCKY_USER_CONFIG.DEFAULT_REWARD_MESSAGE,
					show_modal: LUCKY_USER_CONFIG.DEFAULT_SHOW_MODAL,
					reward_message: LUCKY_USER_CONFIG.DEFAULT_REWARD_MESSAGE
				}
			}
		}
	},
	
	/**
	 * 获取文章的幸运用户列表
	 * @param {String} article_id - 文章ID
	 * @return {Object} 包含幸运用户列表的对象
	 */
	async getLuckyUsers(article_id) {
		if (!article_id) {
			return {
				code: 1,
				message: '参数不完整',
				data: []
			}
		}
		
		try {
			console.log('获取文章幸运用户列表，文章ID:', article_id);
			
			// 直接查询幸运用户记录，不再依赖 getArticleLuckyConfig
			const luckyUserRecords = await this.db.collection('likeRecord')
				.where({
					article_id: article_id,
					record_type: 'lucky_user',
					is_lucky_user: true
				})
				.orderBy('create_time', 'desc')
				.get();
			
			console.log('查询到的幸运用户记录:', luckyUserRecords);
			
			// 如果找到记录，返回幸运用户信息
			if (luckyUserRecords.data && luckyUserRecords.data.length > 0) {
				// 处理数据，确保每条记录都有必要的字段
				const luckyUsers = luckyUserRecords.data.map(user => ({
					user_id: user.user_id || '',
					nickname: user.nickname || '',
					avatar: user.avatar || '',
					lucky_rank: user.lucky_rank || 1,
					gift_image: user.gift_image || '',
					create_time: user.create_time || new Date()
				}));
				
				return {
					code: 0,
					message: '获取幸运用户列表成功',
					data: luckyUsers
				}
			}
			
			// 如果没有找到记录，尝试从点赞记录中查找幸运用户
			const likeRecords = await this.db.collection('likeRecord')
				.where({
					article_id: article_id,
					is_lucky_user: true
				})
				.orderBy('create_time', 'asc')
				.get();
			
			if (likeRecords.data && likeRecords.data.length > 0) {
				// 处理数据，确保每条记录都有必要的字段
				const luckyUsers = likeRecords.data.map(user => ({
					user_id: user.user_id || '',
					nickname: user.nickname || '',
					avatar: user.avatar || '',
					lucky_rank: user.lucky_rank || 1,
					gift_image: user.gift_image || '',
					create_time: user.create_time || new Date()
				}));
				
				return {
					code: 0,
					message: '从点赞记录中获取幸运用户列表成功',
					data: luckyUsers
				}
			}
			
			return {
				code: 0,
				message: '没有找到幸运用户',
				data: []
			}
		} catch (err) {
			console.error('获取幸运用户列表失败:', err)
			return {
				code: 1,
				message: '获取幸运用户失败: ' + err.message,
				data: []
			}
		}
	},
	
	/**
	 * 获取用户对文章的点赞记录
	 * @param {String} article_id - 文章ID
	 * @param {String} user_id - 用户ID
	 * @return {Object} 包含点赞记录的对象
	 */
	async getLikeRecord(article_id, user_id) {
		// 参数校验
		if (!article_id || !user_id) {
			return {
				code: 1,
				message: '参数不完整',
				res: { data: [] },
				like_count: 0
			}
		}
		
		try {
			// 查询用户点赞记录
			const likeRecord = await this.db.collection('likeRecord')
				.where({
					article_id: article_id,
					user_id: user_id
				})
				.get()
			
			// 获取文章点赞数
			let like_count = 0
			try {
				const articleInfo = await this.db.collection('articleList')
					.doc(article_id)
					.field({ like_count: 1 })
					.get()
				
				if (articleInfo.data && articleInfo.data.length > 0) {
					like_count = articleInfo.data[0].like_count || 0
				}
			} catch (err) {
				console.error('获取文章点赞数失败:', err)
				// 继续执行，使用默认点赞数0
			}
			
			return {
				code: 0,
				message: '获取点赞记录成功',
				res: likeRecord,
				like_count: like_count
			}
		} catch (err) {
			console.error('获取点赞记录失败:', err)
			return {
				code: 1,
				message: '获取点赞记录失败: ' + err.message,
				res: { data: [] },
				like_count: 0
			}
		}
	},
	
	/**
	 * 保存幸运用户信息到数据库
	 * @param {String} article_id - 文章ID
	 * @param {String} user_id - 用户ID
	 * @param {Number} like_rank - 点赞排名
	 * @param {String} nickname - 用户昵称
	 * @param {String} avatar - 用户头像
	 * @param {String} gift_image - 礼物图片
	 * @return {Object} 操作结果
	 */
	async saveLuckyUser(article_id, user_id, like_rank, nickname, avatar, gift_image) {
		if (!article_id || !user_id) {
			return {
				code: 1,
				message: '参数不完整'
			}
		}
		
		try {
			console.log('保存幸运用户信息:', {
				article_id,
				user_id,
				like_rank,
				nickname,
				avatar,
				gift_image
			});
			
			// 查询是否已存在幸运用户记录
			const existingRecord = await this.db.collection('likeRecord')
				.where({
					article_id: article_id,
					user_id: user_id,
					record_type: 'lucky_user'
				})
				.get()
			
			// 如果已存在记录，则更新
			if (existingRecord.data && existingRecord.data.length > 0) {
				console.log('更新已存在的幸运用户记录:', existingRecord.data[0]._id);
				
				await this.db.collection('likeRecord')
					.doc(existingRecord.data[0]._id)
					.update({
						user_id: user_id,
						lucky_rank: like_rank,
						nickname: nickname || '',
						avatar: avatar || '',
						gift_image: gift_image || '', // 添加礼物图片
						is_lucky_user: true,
						update_time: new Date()
					})
				
				return {
					code: 0,
					message: '更新幸运用户信息成功'
				}
			} else {
				// 如果不存在，则创建新记录
				console.log('创建新的幸运用户记录');
				
				await this.db.collection('likeRecord').add({
					article_id: article_id,
					user_id: user_id,
					lucky_rank: like_rank,
					nickname: nickname || '',
					avatar: avatar || '',
					gift_image: gift_image || '', // 添加礼物图片
					is_lucky_user: true,
					record_type: 'lucky_user',
					create_time: new Date(),
					update_time: new Date()
				})
				
				// 同时更新用户的点赞记录，标记为幸运用户
				try {
					await this.db.collection('likeRecord')
						.where({
							article_id: article_id,
							user_id: user_id,
							record_type: { $ne: 'lucky_user' } // 确保不更新刚创建的幸运用户记录
						})
						.update({
							is_lucky_user: true,
							lucky_rank: like_rank,
							gift_image: gift_image || '' // 添加礼物图片
						})
				} catch (updateErr) {
					console.error('更新用户点赞记录失败:', updateErr);
					// 继续执行，不影响主要功能
				}
				
				return {
					code: 0,
					message: '保存幸运用户信息成功'
				}
			}
		} catch (err) {
			console.error('保存幸运用户信息失败:', err)
			return {
				code: 1,
				message: '保存幸运用户信息失败: ' + err.message
			}
		}
	},
	
	/**
	 * 获取文章的幸运用户信息
	 * @param {String} article_id - 文章ID
	 * @return {Object} 包含幸运用户信息的对象
	 */
	async getArticleLuckyUser(article_id) {
		if (!article_id) {
			return {
				code: 1,
				message: '参数不完整',
				data: null
			}
		}
		
		try {
			// 查询文章的幸运用户记录
			const luckyUserRecord = await this.db.collection('likeRecord')
				.where({
					article_id: article_id,
					record_type: 'lucky_user',
					is_lucky_user: true
				})
				.get()
			
			// 如果找到记录，返回幸运用户信息
			if (luckyUserRecord.data && luckyUserRecord.data.length > 0) {
				const luckyUser = luckyUserRecord.data[0]
				return {
					code: 0,
					message: '获取幸运用户信息成功',
					data: {
						user_id: luckyUser.user_id,
						nickname: luckyUser.nickname || '',
						avatar: luckyUser.avatar || '',
						like_rank: luckyUser.lucky_rank || 1,
						create_time: luckyUser.create_time
					}
				}
			}
			
			// 如果没有找到记录，尝试从点赞记录中查找幸运用户
			// 获取文章的所有点赞记录
			const likeRecords = await this.db.collection('likeRecord')
				.where({
					article_id: article_id,
					record_type: 'like'
				})
				.orderBy('create_time', 'asc')
				.get()
				
			// 获取幸运用户配置
			let configData = {
				lucky_ranks: LUCKY_USER_CONFIG.DEFAULT_LUCKY_RANKS,
				is_enabled: LUCKY_USER_CONFIG.DEFAULT_IS_ENABLED
			};
			
			try {
				// 获取文章特定的幸运用户配置
				const configResult = await this.getArticleLuckyConfig(article_id);
				if (configResult.code === 0 && configResult.data) {
					if (Array.isArray(configResult.data.lucky_ranks) && configResult.data.lucky_ranks.length > 0) {
						configData.lucky_ranks = configResult.data.lucky_ranks;
					}
					
					if (typeof configResult.data.is_enabled === 'boolean') {
						configData.is_enabled = configResult.data.is_enabled;
					}
				}
			} catch (err) {
				console.error('获取幸运用户配置失败，使用默认配置:', err);
				// 使用默认配置继续执行
			}
			
			// 如果功能未启用或没有点赞记录，返回null
			if (!configData.is_enabled || !likeRecords.data || likeRecords.data.length === 0) {
				return {
					code: 0,
					message: '没有找到幸运用户',
					data: null
				}
			}
			
			// 获取文章信息，用于获取当前点赞数
			let currentLikeCount = likeRecords.data.length
			try {
				const articleInfo = await this.db.collection('articleList')
					.doc(article_id)
					.field({ like_count: 1 })
					.get()
					
				if (articleInfo.data && articleInfo.data.length > 0) {
					currentLikeCount = articleInfo.data[0].like_count || likeRecords.data.length
				}
			} catch (err) {
				console.error('获取文章点赞数失败:', err)
				// 继续执行，使用点赞记录数量作为点赞数
			}
			
			// 如果当前点赞数在幸运数字列表中，返回第一个点赞的用户作为幸运用户
			if (configData.lucky_ranks.includes(currentLikeCount) && likeRecords.data.length > 0) {
				const luckyUser = likeRecords.data[0]
				
				// 保存幸运用户信息到数据库
				await this.saveLuckyUser(
					article_id, 
					luckyUser.user_id, 
					currentLikeCount, 
					luckyUser.nickname || '', 
					luckyUser.avatar || '',
					luckyUser.gift_image || ''
				)
				
				return {
					code: 0,
					message: '找到幸运用户',
					data: {
						user_id: luckyUser.user_id,
						nickname: luckyUser.nickname || '',
						avatar: luckyUser.avatar || '',
						like_rank: currentLikeCount,
						create_time: luckyUser.create_time
					}
				}
			}
			
			return {
				code: 0,
				message: '没有找到幸运用户',
				data: null
			}
		} catch (err) {
			console.error('获取幸运用户信息失败:', err)
			return {
				code: 1,
				message: '获取幸运用户信息失败: ' + err.message,
				data: null
			}
		}
	},
	
	/**
	 * 获取特定文章的幸运用户配置
	 * @param {String} article_id - 文章ID
	 * @return {Object} 包含幸运用户配置的对象
	 */
	async getArticleLuckyConfig(article_id) {
		if (!article_id) {
			return {
				code: 1,
				message: '文章ID不能为空'
			}
		}

		try {
			console.log('获取文章特定幸运用户配置，文章ID:', article_id);
			
			// 查询文章特定的配置
			const articleConfig = await this.db.collection('article_lucky_config')
				.where({
					article_id: article_id
				})
				.limit(1)
				.get();

			// 如果找到了文章特定的配置
			if (articleConfig.data && articleConfig.data.length > 0) {
				console.log('找到文章特定配置:', articleConfig.data[0]);
				
				// 确保返回的数据格式正确
				const config = articleConfig.data[0];
				return {
					code: 0,
					message: '获取成功',
					data: {
						lucky_ranks: Array.isArray(config.lucky_ranks) ? config.lucky_ranks : [],
						is_enabled: typeof config.is_enabled === 'boolean' ? config.is_enabled : false,
						show_modal: typeof config.show_modal === 'boolean' ? config.show_modal : false,
						rewards: config.rewards || '恭喜您获得幸运用户奖励！',
						reward_message: config.reward_message || config.rewards || '恭喜您获得幸运用户奖励！'
					},
					source: 'article'
				}
			}

			console.log('未找到文章特定配置，返回空配置');
			
			// 如果没有找到文章特定的配置，则返回空配置（禁用幸运用户功能）
			return {
				code: 0,
				message: '未找到文章特定配置',
				data: {
					lucky_ranks: [],
					is_enabled: false,
					show_modal: false,
					rewards: '恭喜您获得幸运用户奖励！',
					reward_message: '恭喜您获得幸运用户奖励！'
				},
				source: 'empty'
			}
		} catch (e) {
			console.error('获取文章特定幸运用户配置失败:', e)
			return {
				code: 1,
				message: '获取配置失败: ' + e.message
			}
		}
	},
	
	// 添加一个新方法来从数据库获取默认配置
	async getLuckyConfigFromDB() {
		try {
			const configResult = await this.db.collection('lucky_config')
				.limit(1)
				.get();
			
			if (configResult.data && configResult.data.length > 0) {
				// 确保返回完整的配置，包括show_modal和reward_message
				const config = configResult.data[0];
				return {
					code: 0,
					message: '获取成功',
					data: {
						lucky_ranks: config.lucky_ranks || LUCKY_USER_CONFIG.DEFAULT_LUCKY_RANKS,
						is_enabled: typeof config.is_enabled === 'boolean' ? config.is_enabled : LUCKY_USER_CONFIG.DEFAULT_IS_ENABLED,
						rewards: config.rewards || LUCKY_USER_CONFIG.DEFAULT_REWARD_MESSAGE,
						show_modal: typeof config.show_modal === 'boolean' ? config.show_modal : LUCKY_USER_CONFIG.DEFAULT_SHOW_MODAL,
						reward_message: config.reward_message || config.rewards || LUCKY_USER_CONFIG.DEFAULT_REWARD_MESSAGE
					}
				}
			} else {
				// 如果没有配置，返回默认值
				return {
					code: 0,
					message: '使用默认值',
					data: {
						lucky_ranks: LUCKY_USER_CONFIG.DEFAULT_LUCKY_RANKS,
						is_enabled: LUCKY_USER_CONFIG.DEFAULT_IS_ENABLED,
						rewards: LUCKY_USER_CONFIG.DEFAULT_REWARD_MESSAGE,
						show_modal: LUCKY_USER_CONFIG.DEFAULT_SHOW_MODAL,
						reward_message: LUCKY_USER_CONFIG.DEFAULT_REWARD_MESSAGE
					}
				}
			}
		} catch (e) {
			console.error('获取默认幸运用户配置失败:', e)
			return {
				code: 1,
				message: '获取配置失败: ' + e.message
			}
		}
	},
	
	/**
	 * 设置特定文章的幸运用户配置
	 * @param {String} article_id - 文章ID
	 * @param {Array} lucky_ranks - 幸运用户排名列表
	 * @param {Boolean} is_enabled - 是否启用幸运用户功能
	 * @param {Boolean} show_modal - 是否显示幸运用户横幅
	 * @return {Object} 操作结果
	 */
	async setArticleLuckyConfig(article_id, lucky_ranks, is_enabled, show_modal) {
		if (!article_id) {
			return {
				code: 1,
				message: '参数不完整'
			}
		}
		
		try {
			// 检查参数
			if (!Array.isArray(lucky_ranks)) {
				lucky_ranks = LUCKY_USER_CONFIG.DEFAULT_LUCKY_RANKS;
			}
			
			if (typeof is_enabled !== 'boolean') {
				is_enabled = LUCKY_USER_CONFIG.DEFAULT_IS_ENABLED;
			}
			
			if (typeof show_modal !== 'boolean') {
				show_modal = LUCKY_USER_CONFIG.DEFAULT_SHOW_MODAL;
			}
			
			// 查询是否已存在配置
			const articleConfigCollection = this.db.collection('article_lucky_config');
			const existingConfig = await articleConfigCollection.where({
				article_id: article_id
			}).get();
			
			const configValue = {
				lucky_ranks: lucky_ranks,
				is_enabled: is_enabled,
				show_modal: show_modal
			};
			
			// 如果已存在配置，则更新
			if (existingConfig.data && existingConfig.data.length > 0) {
				await articleConfigCollection.doc(existingConfig.data[0]._id).update({
					lucky_ranks: lucky_ranks,
					is_enabled: is_enabled,
					show_modal: show_modal,
					update_time: new Date()
				});
			} else {
				// 如果不存在，则创建新配置
				await articleConfigCollection.add({
					article_id: article_id,
					lucky_ranks: lucky_ranks,
					is_enabled: is_enabled,
					show_modal: show_modal,
					create_time: new Date(),
					update_time: new Date()
				});
			}
			
			return {
				code: 0,
				message: '设置文章特定幸运用户配置成功',
				data: configValue
			}
		} catch (err) {
			console.error('设置文章特定幸运用户配置失败:', err)
			return {
				code: 1,
				message: '设置文章特定幸运用户配置失败: ' + err.message
			}
		}
	},
	
	/**
	 * 删除文章特定的幸运用户配置
	 * @param {String} article_id - 文章ID
	 * @return {Object} 操作结果
	 */
	async deleteArticleLuckyConfig(article_id) {
		if (!article_id) {
			return {
				code: 1,
				message: '参数不完整'
			};
		}
		
		try {
			// 删除文章特定的配置
			const articleConfigCollection = this.db.collection('article_lucky_config');
			await articleConfigCollection.where({
				article_id: article_id
			}).remove();
			
			return {
				code: 0,
				message: '删除文章特定幸运用户配置成功'
			};
		} catch (err) {
			console.error('删除文章特定幸运用户配置失败:', err);
			return {
				code: 1,
				message: '删除文章特定幸运用户配置失败: ' + err.message
			};
		}
	},
	
	// 添加测试连接方法
	async testConnection() {
		try {
			// 简单测试数据库连接
			const result = await this.db.collection('lucky_config')
				.limit(1)
				.get();
			
			return {
				code: 0,
				message: '连接成功'
			}
		} catch (e) {
			console.error('测试连接失败:', e)
			return {
				code: 1,
				message: '连接失败: ' + e.message
			}
		}
	},
	
	/**
	 * 设置幸运用户全局配置
	 * @param {Object} params - 配置参数
	 * @param {Array} params.lucky_ranks - 幸运用户排名列表
	 * @param {Boolean} params.is_enabled - 是否启用幸运用户功能
	 * @param {String} params.rewards - 奖励描述
	 * @param {Boolean} params.show_modal - 是否显示幸运用户横幅
	 * @param {String} params.reward_message - 幸运用户奖励消息
	 * @return {Object} 操作结果
	 */
	async setLuckyConfig(params) {
		try {
			// 检查参数
			if (!params) {
				return {
					code: 1,
					message: '参数不能为空'
				};
			}
			
			// 确保lucky_ranks是数组
			if (params.lucky_ranks && !Array.isArray(params.lucky_ranks)) {
				return {
					code: 1,
					message: 'lucky_ranks必须是数组'
				};
			}
			
			// 准备配置数据
			const configValue = {
				lucky_ranks: params.lucky_ranks || LUCKY_USER_CONFIG.DEFAULT_LUCKY_RANKS,
				is_enabled: typeof params.is_enabled === 'boolean' ? params.is_enabled : LUCKY_USER_CONFIG.DEFAULT_IS_ENABLED,
				rewards: params.rewards || LUCKY_USER_CONFIG.DEFAULT_REWARD_MESSAGE,
				show_modal: typeof params.show_modal === 'boolean' ? params.show_modal : LUCKY_USER_CONFIG.DEFAULT_SHOW_MODAL,
				reward_message: params.reward_message || params.rewards || LUCKY_USER_CONFIG.DEFAULT_REWARD_MESSAGE,
				update_time: new Date()
			};
			
			// 查询是否已存在配置
			const configCollection = this.db.collection('lucky_config');
			const existingConfig = await configCollection.limit(1).get();
			
			// 如果已存在配置，则更新
			if (existingConfig.data && existingConfig.data.length > 0) {
				await configCollection.doc(existingConfig.data[0]._id).update(configValue);
			} else {
				// 如果不存在，则创建新配置
				configValue.create_time = new Date();
				await configCollection.add(configValue);
			}
			
			return {
				code: 0,
				message: '设置幸运用户配置成功',
				data: configValue
			};
		} catch (err) {
			console.error('设置幸运用户配置失败:', err);
			return {
				code: 1,
				message: '设置幸运用户配置失败: ' + err.message
			};
		}
	},
	
	/**
	 * 获取所有文章特定幸运用户配置列表
	 * @return {Object} 包含所有文章特定配置的对象
	 */
	async getArticleLuckyConfigList() {
		try {
			// 查询所有文章特定的配置
			const articleConfigCollection = this.db.collection('article_lucky_config');
			const result = await articleConfigCollection
				.orderBy('update_time', 'desc')
				.get();
			
			if (result.data && result.data.length > 0) {
				return {
					code: 0,
					message: '获取成功',
					data: result.data
				};
			} else {
				return {
					code: 0,
					message: '暂无文章特定配置',
					data: []
				};
			}
		} catch (err) {
			console.error('获取文章特定幸运用户配置列表失败:', err);
			return {
				code: 1,
				message: '获取文章特定幸运用户配置列表失败: ' + err.message,
				data: []
			};
		}
	}
} 