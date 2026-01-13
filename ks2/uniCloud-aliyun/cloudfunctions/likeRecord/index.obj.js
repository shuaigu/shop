'use strict';

/**
 * likeRecord 云对象
 * 用于处理文章点赞相关的操作
 */

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
				}
			} catch (err) {
				console.error('获取文章点赞数失败:', err)
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
				}
				
				return {
					code: 0,
					message: '点赞成功',
					isLiked: true,
					like_count: newLikeCount,
					like_rank: newLikeCount,
					isWinner: false,
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
				}
				
				return {
					code: 0,
					message: '取消点赞成功',
					isLiked: false,
					like_count: newLikeCount,
					isWinner: false
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
			
			if (likeRecord.data.length === 0) {
				return {
					code: 1,
					message: '用户未点赞该文章'
				}
			}
			
			// 获取文章点赞数
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
			}
			
			return {
				code: 0,
				message: '获取点赞排名成功',
				like_rank: currentLikeCount
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
	 * 获取用户对文章的点赞记录
	 * @param {String} article_id - 文章ID
	 * @param {String} user_id - 用户ID
	 * @return {Object} 包含点赞记录的对象
	 */
	async getLikeRecord(article_id, user_id) {
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
	 * 批量获取文章点赞状态
	 * @param {String} userId - 用户ID
	 * @param {Array<String>} articleIds - 文章ID数组
	 * @return {Object} 返回文章点赞状态
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
			const likeCollection = this.db.collection('likeRecord');
			
			// 查询用户对这些文章的点赞记录
			const likeRecords = await likeCollection.where({
				article_id: this.db.command.in(articleIds),
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
	}
}
