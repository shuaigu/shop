// 云对象教程: https://uniapp.dcloud.net.cn/uniCloud/cloud-obj
// jsdoc语法提示教程：https://ask.dcloud.net.cn/docs/#//ask.dcloud.net.cn/article/129

// 引入缓存模块
const { Cache } = require('uni-cloud-cache')

module.exports = {
	_before: function () { // 通用预处理器
		// 初始化缓存
		this.cache = new Cache({
			// 默认缓存时间为5分钟
			defaultExpire: 300
		})
	},
	/**
	 * 点赞或取消点赞
	 * @param {string} articleId 文章ID
	 * @param {string} userId 用户ID
	 * @returns {object} 返回点赞状态和点赞数
	 */
	async toggleLike(articleId, userId) {
		if (!articleId || !userId) {
			return {
				code: 1,
				message: '参数不能为空'
			};
		}
		
		try {
			// 获取数据库引用
			const db = uniCloud.database();
			const likeCollection = db.collection('article_likes');
			const articleCollection = db.collection('articles');
			
			// 使用事务确保数据一致性
			const transaction = await db.startTransaction();
			
			try {
				// 查询是否已点赞
				const likeRecord = await likeCollection.where({
					article_id: articleId,
					user_id: userId
				}).limit(1).get();
				
				// 判断是否已点赞
				const isLiked = likeRecord.data && likeRecord.data.length > 0;
				
				// 缓存键
				const likeCacheKey = `article_like_${articleId}_${userId}`;
				const countCacheKey = `article_like_count_${articleId}`;
				
				if (isLiked) {
					// 已点赞，取消点赞
					await likeCollection.where({
						article_id: articleId,
						user_id: userId
					}).remove();
					
					// 更新文章点赞数
					await articleCollection.where({
						_id: articleId
					}).update({
						like_count: db.command.inc(-1)
					});
					
					// 清除缓存
					await this.cache.remove(likeCacheKey);
					await this.cache.remove(countCacheKey);
					
					// 获取最新点赞数
					const articleInfo = await articleCollection.doc(articleId).field({ like_count: 1 }).get();
					const likeCount = articleInfo.data && articleInfo.data.length > 0 ? articleInfo.data[0].like_count : 0;
					
					// 更新缓存
					await this.cache.set(countCacheKey, likeCount);
					
					// 提交事务
					await transaction.commit();
					
					return {
						code: 0,
						isLiked: false,
						like_count: likeCount
					};
				} else {
					// 未点赞，添加点赞
					const now = new Date();
					await likeCollection.add({
						article_id: articleId,
						user_id: userId,
						create_time: now
					});
					
					// 更新文章点赞数
					await articleCollection.where({
						_id: articleId
					}).update({
						like_count: db.command.inc(1)
					});
					
					// 获取最新点赞数
					const articleInfo = await articleCollection.doc(articleId).field({ like_count: 1 }).get();
					const likeCount = articleInfo.data && articleInfo.data.length > 0 ? articleInfo.data[0].like_count : 1;
					
					// 更新缓存
					await this.cache.set(likeCacheKey, true);
					await this.cache.set(countCacheKey, likeCount);
					
					// 获取当前用户点赞排名
					const likeRank = await this.getLikeRank(articleId, userId);
					
					// 检查是否为幸运用户（即使失败也不影响点赞功能）
					let isWinner = { isWinner: false };
					try {
						isWinner = await this.checkIfLuckyUser(articleId, likeRank.like_rank);
					} catch (luckyErr) {
						console.warn('检查幸运用户失败，但不影响点赞:', luckyErr);
					}
					
					// 提交事务
					await transaction.commit();
					
					return {
						code: 0,
						isLiked: true,
						like_count: likeCount,
						like_rank: likeRank.like_rank,
						isWinner: isWinner.isWinner || false,
						rewardMessage: isWinner.rewardMessage
					};
				}
			} catch (err) {
				// 回滚事务
				await transaction.rollback();
				throw err;
			}
		} catch (err) {
			console.error('点赞操作失败:', err);
			return {
				code: 1,
				message: `点赞操作失败: ${err.message || '操作失败，请稍后再试'}`,
				error: process.env.NODE_ENV === 'development' ? err.message : undefined
			};
		}
	},
	
	/**
	 * 获取用户点赞排名
	 * @param {string} articleId 文章ID
	 * @param {string} userId 用户ID
	 * @returns {object} 返回用户点赞排名
	 */
	async getLikeRank(articleId, userId) {
		if (!articleId || !userId) {
			return {
				code: 1,
				message: '参数不能为空'
			};
		}
		
		// 缓存键
		const rankCacheKey = `article_like_rank_${articleId}_${userId}`;
		
		try {
			// 尝试从缓存获取
			const cachedRank = await this.cache.get(rankCacheKey);
			if (cachedRank !== undefined) {
				return {
					code: 0,
					like_rank: cachedRank
				};
			}
			
			// 获取数据库引用
			const db = uniCloud.database();
			const likeCollection = db.collection('article_likes');
			
			// 查询用户点赞记录
			const likeRecord = await likeCollection.where({
				article_id: articleId,
				user_id: userId
			}).limit(1).get();
			
			if (!likeRecord.data || likeRecord.data.length === 0) {
				return {
					code: 0,
					like_rank: 0
				};
			}
			
			// 获取用户点赞时间
			const userLikeTime = likeRecord.data[0].create_time;
			
			// 计算排名（比当前用户早点赞的人数 + 1）
			const earlierLikes = await likeCollection.where({
				article_id: articleId,
				create_time: db.command.lt(userLikeTime)
			}).count();
			
			// 排名 = 早于用户点赞的人数 + 1
			const rank = earlierLikes.total + 1;
			
			// 缓存结果
			await this.cache.set(rankCacheKey, rank, {
				expire: 3600 // 缓存1小时
			});
			
			return {
				code: 0,
				like_rank: rank
			};
		} catch (err) {
			console.error('获取点赞排名失败:', err);
			return {
				code: 2,
				message: '获取排名失败，请稍后再试',
				error: process.env.NODE_ENV === 'development' ? err.message : undefined
			};
		}
	},
	
	/**
	 * 批量获取文章点赞状态
	 * @param {string} userId 用户ID
	 * @param {Array<string>} articleIds 文章ID数组
	 * @returns {object} 返回文章点赞状态
	 */
	async batchGetLikeStatus(userId, articleIds) {
		if (!userId || !articleIds || !Array.isArray(articleIds) || articleIds.length === 0) {
			return {
				code: 1,
				message: '参数不能为空'
			};
		}
		
		try {
			// 获取数据库引用
			const db = uniCloud.database();
			const likeCollection = db.collection('article_likes');
			
			// 查询用户对这些文章的点赞记录
			const likeRecords = await likeCollection.where({
				article_id: db.command.in(articleIds),
				user_id: userId
			}).get();
			
			// 构建结果对象
			const result = {};
			articleIds.forEach(id => {
				result[id] = false;
			});
			
			// 更新已点赞的文章
			if (likeRecords.data && likeRecords.data.length > 0) {
				likeRecords.data.forEach(record => {
					result[record.article_id] = true;
				});
			}
			
			return {
				code: 0,
				likeStatus: result
			};
		} catch (err) {
			console.error('批量获取点赞状态失败:', err);
			return {
				code: 2,
				message: '获取点赞状态失败，请稍后再试',
				error: process.env.NODE_ENV === 'development' ? err.message : undefined
			};
		}
	},
	
	/**
	 * 检查是否为幸运用户
	 * @param {string} articleId 文章ID
	 * @param {number} likeRank 点赞排名
	 * @returns {object} 返回是否为幸运用户
	 */
	async checkIfLuckyUser(articleId, likeRank) {
		if (!articleId || !likeRank) {
			return {
				code: 1,
				message: '参数不能为空',
				isWinner: false
			};
		}
		
		// 缓存键
		const configCacheKey = `lucky_config_${articleId}`;
		
		try {
			// 获取数据库引用
			const db = uniCloud.database();
			
			// 尝试从缓存获取配置
			let luckyConfig = await this.cache.get(configCacheKey);
			
			if (!luckyConfig) {
				// 检查 lucky_user_config 表是否存在
				const configCollection = db.collection('lucky_user_config');
				
				// 查询文章特定配置
				try {
					const config = await configCollection.where({
						article_id: articleId
					}).limit(1).get();
					
					// 如果没有配置，则不是幸运用户
					if (!config.data || config.data.length === 0) {
						console.log('未找到文章幸运用户配置，跳过幸运用户检查');
						return {
							code: 0,
							isWinner: false
						};
					}
					
					luckyConfig = config.data[0];
					
					// 缓存配置
					await this.cache.set(configCacheKey, luckyConfig, {
						expire: 3600 // 缓存1小时
					});
				} catch (tableErr) {
					// 表不存在或其他错误，直接返回不中奖
					console.log('lucky_user_config 表不存在或查询失败，跳过幸运用户检查:', tableErr.message);
					return {
						code: 0,
						isWinner: false
					};
				}
			}
			
			// 检查是否启用幸运用户功能
			if (!luckyConfig.is_enabled) {
				return {
					code: 0,
					isWinner: false
				};
			}
			
			// 检查是否为幸运排名
			const luckyRanks = luckyConfig.lucky_ranks || [];
			const isLuckyRank = luckyRanks.includes(Number(likeRank));
			
			// 检查是否通过概率中奖
			const winProbability = luckyConfig.win_probability || 0;
			const isProbabilityWin = this.checkProbabilityWin(winProbability);
			
			// 如果是幸运排名或通过概率中奖，则为幸运用户
			const isWinner = isLuckyRank || isProbabilityWin;
			
			return {
				code: 0,
				isWinner: isWinner,
				rewardMessage: luckyConfig.reward_message || '恭喜您获得幸运用户奖励！'
			};
		} catch (err) {
			console.error('检查幸运用户失败:', err);
			// 即使出错也不影响点赞功能，直接返回不中奖
			return {
				code: 0,
				isWinner: false
			};
		}
	},
	
	/**
	 * 获取抽奖奖品列表
	 * @param {string} articleId 文章ID
	 * @returns {object} 返回奖品列表
	 */
	async getLotteryItems(articleId) {
		if (!articleId) {
			return {
				code: 1,
				message: '参数不能为空'
			};
		}
		
		// 缓存键
		const prizesCacheKey = `lottery_prizes_${articleId}`;
		
		try {
			// 尝试从缓存获取
			const cachedPrizes = await this.cache.get(prizesCacheKey);
			if (cachedPrizes) {
				return {
					code: 0,
					prizes: cachedPrizes
				};
			}
			
			// 获取数据库引用
			const db = uniCloud.database();
			const prizeCollection = db.collection('lottery_prizes');
			
			// 查询文章特定奖品
			const prizes = await prizeCollection.where({
				article_id: articleId
			}).get();
			
			// 默认奖品
			const defaultPrizes = [
				{
					image: '/static/images/logo.png',
					name: '奖品1',
					probability: 70,
					message: '恭喜您获得奖品1！'
				},
				{
					image: '/static/images/dibiao.png',
					name: '奖品2',
					probability: 30,
					message: '恭喜您获得奖品2！'
				}
			];
			
			// 如果没有配置奖品，则使用默认奖品
			const resultPrizes = (!prizes.data || prizes.data.length === 0) ? defaultPrizes : prizes.data;
			
			// 缓存结果
			await this.cache.set(prizesCacheKey, resultPrizes, {
				expire: 3600 // 缓存1小时
			});
			
			return {
				code: 0,
				prizes: resultPrizes
			};
		} catch (err) {
			console.error('获取奖品列表失败:', err);
			return {
				code: 2,
				message: '获取奖品列表失败，请稍后再试',
				error: process.env.NODE_ENV === 'development' ? err.message : undefined
			};
		}
	},
	
	/**
	 * 保存幸运用户信息
	 * @param {string} articleId 文章ID
	 * @param {string} userId 用户ID
	 * @param {number} likeRank 点赞排名
	 * @param {string} nickname 用户昵称
	 * @param {string} avatar 用户头像
	 * @param {string} giftImage 获得的礼物图片
	 * @returns {object} 返回保存结果
	 */
	async saveLuckyUser(articleId, userId, likeRank, nickname, avatar, giftImage) {
		if (!articleId || !userId) {
			return {
				code: 1,
				message: '参数不能为空'
			};
		}
		
		try {
			// 获取数据库引用
			const db = uniCloud.database();
			const luckyUserCollection = db.collection('lucky_users');
			
			// 检查是否已经保存过
			const existingRecord = await luckyUserCollection.where({
				article_id: articleId,
				user_id: userId
			}).limit(1).get();
			
			if (existingRecord.data && existingRecord.data.length > 0) {
				// 已存在记录，更新
				await luckyUserCollection.doc(existingRecord.data[0]._id).update({
					like_rank: likeRank,
					nickname: nickname || existingRecord.data[0].nickname || '',
					avatar: avatar || existingRecord.data[0].avatar || '',
					gift_image: giftImage || existingRecord.data[0].gift_image || '',
					update_time: new Date()
				});
			} else {
				// 保存幸运用户信息
				await luckyUserCollection.add({
					article_id: articleId,
					user_id: userId,
					like_rank: likeRank,
					nickname: nickname || '',
					avatar: avatar || '',
					gift_image: giftImage || '',
					create_time: new Date()
				});
			}
			
			return {
				code: 0,
				message: '保存成功'
			};
		} catch (err) {
			console.error('保存幸运用户信息失败:', err);
			return {
				code: 2,
				message: '保存失败，请稍后再试',
				error: process.env.NODE_ENV === 'development' ? err.message : undefined
			};
		}
	},
	
	/**
	 * 获取文章幸运用户列表
	 * @param {string} articleId 文章ID
	 * @param {number} limit 限制数量
	 * @param {number} skip 跳过数量
	 * @returns {object} 返回幸运用户列表
	 */
	async getLuckyUsers(articleId, limit = 10, skip = 0) {
		if (!articleId) {
			return {
				code: 1,
				message: '参数不能为空'
			};
		}
		
		try {
			// 获取数据库引用
			const db = uniCloud.database();
			const luckyUserCollection = db.collection('lucky_users');
			
			// 查询文章幸运用户
			const luckyUsers = await luckyUserCollection
				.where({
					article_id: articleId
				})
				.orderBy('create_time', 'desc')
				.skip(skip)
				.limit(limit)
				.get();
			
			// 获取总数
			const total = await luckyUserCollection
				.where({
					article_id: articleId
				})
				.count();
			
			return {
				code: 0,
				luckyUsers: luckyUsers.data,
				total: total.total
			};
		} catch (err) {
			console.error('获取幸运用户列表失败:', err);
			return {
				code: 2,
				message: '获取幸运用户列表失败，请稍后再试',
				error: process.env.NODE_ENV === 'development' ? err.message : undefined
			};
		}
	},
	
	/**
	 * 检查概率中奖
	 * @param {number} probability 中奖概率
	 * @returns {boolean} 是否中奖
	 */
	checkProbabilityWin(probability) {
		// 确保概率在0-100之间
		const validProbability = Math.min(100, Math.max(0, probability));
		// 生成0-100之间的随机数
		const randomValue = Math.random() * 100;
		// 如果随机数小于概率值，则视为中奖
		return randomValue < validProbability;
	}
}
