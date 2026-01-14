// 云对象教程: https://uniapp.dcloud.net.cn/uniCloud/cloud-obj
// jsdoc语法提示教程：https://ask.dcloud.net.cn/docs/#//ask.dcloud.net.cn/article/129

module.exports = {
	_before: function () { // 通用预处理器
		
	},
	
	/**
	 * 添加默认备忘录（仅管理员）
	 * @param {object} params - 备忘录参数
	 * @param {string} params.title - 标题
	 * @param {string} params.content - 内容
	 * @param {string} params.image_url - 配图URL
	 * @param {number} params.sort_order - 排序序号
	 * @returns {object} 返回添加结果
	 */
	async addDefaultMemo(params) {
		try {
			// 参数验证：标题和内容至少有一个不为空
			if (!params) {
				return {
					code: 1,
					message: '参数错误：缺少参数'
				};
			}
			
			const { title, content, image_url, sort_order = 0 } = params;
			
			// 验证标题和内容至少有一个
			const hasTitle = title && title.trim();
			const hasContent = content && content.trim();
			
			if (!hasTitle && !hasContent) {
				return {
					code: 1,
					message: '参数错误：标题和内容至少填写一个'
				};
			}
			
			// 添加到数据库
			const db = uniCloud.database();
			const memoItemsCollection = db.collection('memo_items');
			
			const result = await memoItemsCollection.add({
				title: title || '',
				content: content || '',
				image_url: image_url || '',
				sort_order,
				is_enabled: true,
				create_time: Date.now(),
				update_time: Date.now()
			});
			
			return {
				code: 0,
				message: '添加成功',
				data: result
			};
		} catch (err) {
			console.error('添加默认备忘录失败:', err);
			return {
				code: 1,
				message: '添加失败: ' + err.message
			};
		}
	},
	
	/**
	 * 获取默认备忘录列表
	 * @returns {object} 返回备忘录列表
	 */
	async getDefaultMemos() {
		try {
			const db = uniCloud.database();
			const memoItemsCollection = db.collection('memo_items');
			
			// 查询启用的备忘录，按sort_order排序
			const result = await memoItemsCollection
				.where({ is_enabled: true })
				.orderBy('sort_order', 'asc')
				.orderBy('create_time', 'desc')
				.get();
			
			return {
				code: 0,
				message: '获取成功',
				data: result.data || []
			};
		} catch (err) {
			console.error('获取默认备忘录列表失败:', err);
			return {
				code: 1,
				message: '获取失败: ' + err.message
			};
		}
	},
	
	/**
	 * 获取所有默认备忘录（管理用，包括未启用的）
	 * @returns {object} 返回备忘录列表
	 */
	async getAllDefaultMemos() {
		try {
			const db = uniCloud.database();
			const memoItemsCollection = db.collection('memo_items');
			
			const result = await memoItemsCollection
				.orderBy('sort_order', 'asc')
				.orderBy('create_time', 'desc')
				.get();
			
			return {
				code: 0,
				message: '获取成功',
				data: result.data || []
			};
		} catch (err) {
			console.error('获取所有默认备忘录失败:', err);
			return {
				code: 1,
				message: '获取失败: ' + err.message
			};
		}
	},
	
	/**
	 * 更新默认备忘录
	 * @param {object} params - 更新参数
	 * @param {string} params.id - 备忘录ID
	 * @param {object} params.data - 更新的数据
	 * @returns {object} 返回更新结果
	 */
	async updateDefaultMemo(params) {
		try {
			if (!params || !params.id) {
				return {
					code: 1,
					message: '参数错误：缺少备忘录ID'
				};
			}
			
			const { id, data } = params;
			
			const db = uniCloud.database();
			const memoItemsCollection = db.collection('memo_items');
			
			// 添加更新时间
			data.update_time = Date.now();
			
			await memoItemsCollection.doc(id).update(data);
			
			return {
				code: 0,
				message: '更新成功'
			};
		} catch (err) {
			console.error('更新默认备忘录失败:', err);
			return {
				code: 1,
				message: '更新失败: ' + err.message
			};
		}
	},
	
	/**
	 * 删除默认备忘录
	 * @param {string} id - 备忘录ID
	 * @returns {object} 返回删除结果
	 */
	async deleteDefaultMemo(id) {
		try {
			if (!id) {
				return {
					code: 1,
					message: '参数错误：缺少备忘录ID'
				};
			}
			
			const db = uniCloud.database();
			const memoItemsCollection = db.collection('memo_items');
			
			await memoItemsCollection.doc(id).remove();
			
			return {
				code: 0,
				message: '删除成功'
			};
		} catch (err) {
			console.error('删除默认备忘录失败:', err);
			return {
				code: 1,
				message: '删除失败: ' + err.message
			};
		}
	},
	
	/**
	 * 收藏备忘录
	 * @param {object} params - 收藏参数
	 * @param {string} params.memo_id - 备忘录ID
	 * @param {string} params.user_id - 用户ID
	 * @param {string} params.share_user_id - 分享用户ID
	 * @param {string} params.share_user_nickname - 分享用户昵称
	 * @returns {object} 返回收藏结果
	 */
	async collectMemo(params) {
		try {
			if (!params || !params.user_id) {
				return {
					code: 1,
					message: '请先登录'
				};
			}
			
			const { memo_id, user_id, share_user_id, share_user_nickname } = params;
			if (!memo_id) {
				return {
					code: 1,
					message: '参数错误：缺少备忘录ID'
				};
			}
			
			const db = uniCloud.database();
			const collectionsCollection = db.collection('memo_collections');
			
			// 检查是否已收藏
			const existResult = await collectionsCollection
				.where({
					user_id: user_id,
					memo_id: memo_id
				})
				.get();
			
			if (existResult.data && existResult.data.length > 0) {
				return {
					code: 1,
					message: '已经收藏过了'
				};
			}
			
			// 添加收藏记录
			await collectionsCollection.add({
				user_id: user_id,
				memo_id: memo_id,
				share_user_id: share_user_id || '',
				share_user_nickname: share_user_nickname || '',
				collection_time: Date.now()
			});
			
			return {
				code: 0,
				message: '收藏成功'
			};
		} catch (err) {
			console.error('收藏备忘录失败:', err);
			return {
				code: 1,
				message: '收藏失败: ' + err.message
			};
		}
	},
	
	/**
	 * 取消收藏备忘录
	 * @param {string} memo_id - 备忘录ID
	 * @param {string} user_id - 用户ID
	 * @returns {object} 返回取消收藏结果
	 */
	async uncollectMemo(memo_id, user_id) {
		try {
			if (!user_id) {
				return {
					code: 1,
					message: '请先登录'
				};
			}
			
			if (!memo_id) {
				return {
					code: 1,
					message: '参数错误：缺少备忘录ID'
				};
			}
			
			const db = uniCloud.database();
			const collectionsCollection = db.collection('memo_collections');
			
			// 删除收藏记录
			await collectionsCollection
				.where({
					user_id: user_id,
					memo_id: memo_id
				})
				.remove();
			
			return {
				code: 0,
				message: '取消收藏成功'
			};
		} catch (err) {
			console.error('取消收藏备忘录失败:', err);
			return {
				code: 1,
				message: '取消收藏失败: ' + err.message
			};
		}
	},
	
	/**
	 * 获取用户的收藏列表
	 * @param {string} user_id - 用户ID
	 * @returns {object} 返回收藏列表
	 */
	async getMyCollections(user_id) {
		try {
			if (!user_id) {
				return {
					code: 1,
					message: '请先登录'
				};
			}
			
			const db = uniCloud.database();
			const dbCmd = db.command;
			
			// 联表查询，获取收藏的备忘录详细信息
			const result = await db.collection('memo_collections')
				.where({
					user_id: user_id
				})
				.field({
					memo_id: true,
					share_user_id: true,
					share_user_nickname: true,
					collection_time: true
				})
				.orderBy('collection_time', 'desc')
				.get();
			
			// 获取收藏的备忘录详情
			if (result.data && result.data.length > 0) {
				const memoIds = result.data.map(item => item.memo_id);
				const memoResult = await db.collection('memo_items')
					.where({
						_id: dbCmd.in(memoIds)
					})
					.get();
				
				// 合并数据
				const memoMap = {};
				memoResult.data.forEach(memo => {
					memoMap[memo._id] = memo;
				});
				
				const collections = result.data.map(item => ({
					...item,
					memo_info: memoMap[item.memo_id] || null
				}));
				
				return {
					code: 0,
					message: '获取成功',
					data: collections
				};
			}
			
			return {
				code: 0,
				message: '获取成功',
				data: []
			};
		} catch (err) {
			console.error('获取收藏列表失败:', err);
			return {
				code: 1,
				message: '获取失败: ' + err.message
			};
		}
	},
	
	/**
	 * 管理员获取所有收藏记录（含用户信息）
	 * @returns {object} 返回所有收藏列表
	 */
	async getAllCollections() {
		try {
			const db = uniCloud.database();
			const dbCmd = db.command;
			
			// 获取所有收藏记录
			const result = await db.collection('memo_collections')
				.field({
					user_id: true,
					memo_id: true,
					share_user_id: true,
					share_user_nickname: true,
					collection_time: true
				})
				.orderBy('collection_time', 'desc')
				.get();
			
			if (!result.data || result.data.length === 0) {
				return {
					code: 0,
					message: '获取成功',
					data: []
				};
			}
			
			// 获取所有相关的备忘录信息
			const memoIds = [...new Set(result.data.map(item => item.memo_id))];
			const memoResult = await db.collection('memo_items')
				.where({
					_id: dbCmd.in(memoIds)
				})
				.get();
			
			// 获取所有相关的用户信息
			const userIds = [...new Set(result.data.map(item => item.user_id))];
			const userResult = await db.collection('user')
				.where({
					_id: dbCmd.in(userIds)
				})
				.field({
					_id: true,
					nickName: true,
					avatarUrl: true,
					mobile: true
				})
				.get();
			
			// 创建映射表
			const memoMap = {};
			memoResult.data.forEach(memo => {
				memoMap[memo._id] = memo;
			});
			
			const userMap = {};
			userResult.data.forEach(user => {
				userMap[user._id] = user;
			});
			
			// 合并数据
			const collections = result.data.map(item => ({
				...item,
				memo_info: memoMap[item.memo_id] || null,
				user_info: userMap[item.user_id] || null
			}));
			
			return {
				code: 0,
				message: '获取成功',
				data: collections
			};
		} catch (err) {
			console.error('获取所有收藏列表失败:', err);
			return {
				code: 1,
				message: '获取失败: ' + err.message
			};
		}
	},
	
	/**
	 * 检查用户是否已收藏某个备忘录
	 * @param {string} memo_id - 备忘录ID
	 * @param {string} user_id - 用户ID
	 * @returns {object} 返回是否已收藏
	 */
	async checkCollected(memo_id, user_id) {
		try {
			if (!user_id) {
				return {
					code: 0,
					data: { collected: false }
				};
			}
			
			if (!memo_id) {
				return {
					code: 1,
					message: '参数错误：缺少备忘录ID'
				};
			}
			
			const db = uniCloud.database();
			const collectionsCollection = db.collection('memo_collections');
			
			const result = await collectionsCollection
				.where({
					user_id: user_id,
					memo_id: memo_id
				})
				.count();
			
			return {
				code: 0,
				data: {
					collected: result.total > 0
				}
			};
		} catch (err) {
			console.error('检查收藏状态失败:', err);
			return {
				code: 1,
				message: '检查失败: ' + err.message
			};
		}
	},
	
	/**
	 * 分享者获取通过其分享进入的用户的收藏记录
	 * @param {string} sharer_id - 分享者用户ID
	 * @returns {object} 返回该分享者分享的用户的收藏列表
	 */
	async getSharerCollections(sharer_id) {
		try {
			if (!sharer_id) {
				return {
					code: 1,
					message: '参数错误：缺少分享者ID'
				};
			}
			
			const db = uniCloud.database();
			const dbCmd = db.command;
			
			// 查询所有通过该分享者进入的用户的收藏记录
			const result = await db.collection('memo_collections')
				.where({
					share_user_id: sharer_id
				})
				.field({
					user_id: true,
					memo_id: true,
					share_user_id: true,
					share_user_nickname: true,
					collection_time: true
				})
				.orderBy('collection_time', 'desc')
				.get();
			
			if (!result.data || result.data.length === 0) {
				return {
					code: 0,
					message: '获取成功',
					data: []
				};
			}
			
			// 获取所有相关的备忘录信息
			const memoIds = [...new Set(result.data.map(item => item.memo_id))];
			const memoResult = await db.collection('memo_items')
				.where({
					_id: dbCmd.in(memoIds)
				})
				.get();
			
			// 获取所有相关的用户信息
			const userIds = [...new Set(result.data.map(item => item.user_id))];
			const userResult = await db.collection('user')
				.where({
					_id: dbCmd.in(userIds)
				})
				.field({
					_id: true,
					nickName: true,
					avatarUrl: true,
					mobile: true
				})
				.get();
			
			// 创建映射表
			const memoMap = {};
			memoResult.data.forEach(memo => {
				memoMap[memo._id] = memo;
			});
			
			const userMap = {};
			userResult.data.forEach(user => {
				userMap[user._id] = user;
			});
			
			// 合并数据
			const collections = result.data.map(item => ({
				...item,
				memo_info: memoMap[item.memo_id] || null,
				user_info: userMap[item.user_id] || null
			}));
			
			return {
				code: 0,
				message: '获取成功',
				data: collections
			};
		} catch (err) {
			console.error('获取分享者收藏列表失败:', err);
			return {
				code: 1,
				message: '获取失败: ' + err.message
			};
		}
	}
}
