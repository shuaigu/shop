const dbJQL = uniCloud.databaseForJQL()
const db = uniCloud.database()
const dbCmd = db.command

// 验证并处理图片路径
function validateImagePath(imgPath) {
	console.log('验证图片路径:', imgPath);
	
	// 如果没有提供图片路径，使用默认图片
	if (!imgPath) {
		console.log('未提供图片路径，使用默认图片');
		return '/static/images/占位图.png';
	}
	
	// 如果是临时文件路径，使用默认图片
	if (typeof imgPath === 'string' && (imgPath.startsWith('http://tmp/') || imgPath.startsWith('wxfile://'))) {
		console.warn('临时文件路径无法保存，使用默认图片:', imgPath);
		return '/static/images/占位图.png';
	}
	
	// 如果是云存储路径或有效的URL，直接使用
	if (typeof imgPath === 'string' && (
		imgPath.startsWith('cloud://') || 
		imgPath.startsWith('http://') || 
		imgPath.startsWith('https://')
	)) {
		console.log('使用云存储或URL路径:', imgPath);
		return imgPath;
	}
	
	// 如果是本地静态资源路径，确保格式正确
	if (typeof imgPath === 'string' && imgPath.startsWith('/static/')) {
		console.log('使用本地静态资源路径:', imgPath);
		return imgPath;
	}
	
	// 其他情况，使用默认图片
	console.warn('无效的图片路径，使用默认图片:', imgPath);
	return '/static/images/占位图.png';
}

// 获取当前时间戳
function getCurrentTimestamp() {
    return Date.now();
}

module.exports = {
	_before: function( ) { // 通用预处理器

	},
	/**
	 * get  获取分类
	 * @param {string} id 分类id
	 * @param {boolean} showAll 是否显示全部分类，包括未启用的
	 * @returns {object} 返回值 分类
	 */
	async get( id, showAll = false ) {
		try {
			if ( id ) {
				// 获取单个分类
				const res = await dbJQL.collection( "cateList" ).doc( id ).get( )
				return res
			} else {
				// 获取所有分类
				let query = dbJQL.collection( "cateList" )
				
				// 如果不是显示全部，则只查询可见的分类
				if (!showAll) {
					// 添加is_visible条件，当is_visible为true或未设置时显示
					query = query.where({
						$or: [
							{ is_visible: true },
							{ is_visible: dbCmd.exists(false) }
						]
					})
				}
				
				// 按排序字段降序排列
				const res = await query.orderBy("sort desc, create_time desc").get()
				return res
			}
		} catch (err) {
			console.error('获取分类失败:', err)
			return {
				code: -1,
				msg: '获取分类失败',
				err
			}
		}
	},
	
	/**
	 * getAllForAdmin 管理界面获取所有分类，包括不可见的
	 * @returns {object} 返回值 所有分类
	 */
	async getAllForAdmin() {
		try {
			// 获取所有分类，包括不可见的
			const res = await dbJQL.collection("cateList").orderBy("sort desc, create_time desc").get()
			return res
		} catch (err) {
			console.error('获取所有分类失败:', err)
			return {
				code: -1,
				msg: '获取所有分类失败',
				err
			}
		}
	},
	/**
	 * add  添加分类
	 * @param {object|string} cateData 分类数据或分类名称
	 * @param {string} cate_img 分类图片
	 * @param {number} sort 排序权重
	 * @returns {object} 返回值 0 成功
	 */
	async add( cateData, cate_img, sort = 0 ) {
		try {
			let cate_name, is_visible = true;
			
			// 处理传入的参数，兼容旧版本
			if (typeof cateData === 'string') {
				cate_name = cateData;
			} else if (typeof cateData === 'object') {
				cate_name = cateData.cate_name;
				cate_img = cateData.cate_img !== undefined ? cateData.cate_img : cate_img;
				sort = cateData.sort !== undefined ? cateData.sort : sort;
				is_visible = cateData.is_visible !== undefined ? cateData.is_visible : true;
			}
			
			// 检查分类名称是否已存在
			const existCheck = await dbJQL.collection("cateList").where({
				cate_name: cate_name
			}).get();
			
			if (existCheck.data && existCheck.data.length > 0) {
				return {
					code: -1,
					msg: '分类名称已存在'
				}
			}
			
			// 确保图片路径有效
			const imgPath = validateImagePath(cate_img);
			
			// 获取当前时间戳
			const now = getCurrentTimestamp();
			
			// 添加分类
			const res = await dbJQL.collection( "cateList" ).add({ 
				cate_name: cate_name,
				cate_img: imgPath,
				sort: parseInt(sort) || 0,
				is_visible: is_visible,
				create_time: now,
				update_time: now
			})
			
			return res
		} catch (err) {
			console.error('添加分类失败:', err)
			return {
				code: -1,
				msg: '添加分类失败',
				err
			}
		}
	},
	/**
	 * update  修改分类
	 * @param {string} id 分类id
	 * @param {object|string} cateData 分类数据或分类名称
	 * @param {string} cate_img 分类图片
	 * @param {number} sort 排序权重
	 * @returns {object} 返回值 0 成功
	 */
	async update( id, cateData, cate_img, sort ) {
		console.log('更新分类参数:', { id, cateData, cate_img, sort });
		
		if (!id) {
			return {
				errCode: 1,
				errMsg: '当前分类不存在'
			}
		}
		
		try {
			// 获取当前分类信息
			const cateInfo = await dbJQL.collection("cateList").doc(id).get();
			console.log('获取当前分类信息:', cateInfo);
			
			if (!cateInfo.data) {
				return {
					errCode: 1,
					errMsg: '当前分类不存在'
				}
			}
			
			// 准备更新数据
			const updateData = { 
				update_time: getCurrentTimestamp()
			};
			
			// 处理传入的参数，兼容旧版本
			if (typeof cateData === 'string') {
				// 如果传入的是字符串，则视为分类名称
				updateData.cate_name = cateData;
				
				// 检查分类名称是否已存在（排除当前ID）
				if (cateData) {
					const existCheck = await dbJQL.collection("cateList").where({
						_id: {
							$ne: id
						},
						cate_name: cateData
					}).get();
					
					if (existCheck.data && existCheck.data.length > 0) {
						return {
							code: -1,
							msg: '分类名称已存在'
						}
					}
				} else {
					return {
						errCode: 1,
						errMsg: '分类名称不可以为空'
					}
				}
			} else if (typeof cateData === 'object') {
				// 如果传入的是对象，则处理对象中的各个字段
				
				// 处理分类名称
				if (cateData.cate_name !== undefined) {
					if (!cateData.cate_name) {
						return {
							errCode: 1,
							errMsg: '分类名称不可以为空'
						}
					}
					
					// 检查分类名称是否已存在（排除当前ID）
					const existCheck = await dbJQL.collection("cateList").where({
						_id: {
							$ne: id
						},
						cate_name: cateData.cate_name
					}).get();
					
					if (existCheck.data && existCheck.data.length > 0) {
						return {
							code: -1,
							msg: '分类名称已存在'
						}
					}
					
					updateData.cate_name = cateData.cate_name;
				}
				
				// 处理分类图片
				if (cateData.cate_img !== undefined) {
					cate_img = cateData.cate_img;
				}
				
				// 处理排序权重
				if (cateData.sort !== undefined) {
					sort = cateData.sort;
				}
				
				// 处理可见性
				if (cateData.is_visible !== undefined) {
					updateData.is_visible = cateData.is_visible;
				}
			}
			
			// 如果有图片，则更新图片
			if (cate_img !== undefined) {
				// 验证图片路径
				updateData.cate_img = validateImagePath(cate_img);
				
				// 如果原来有云存储图片，且新图片不同，则删除旧图片
				const oldImg = cateInfo.data.cate_img;
				if (oldImg && oldImg.startsWith('cloud://') && oldImg !== updateData.cate_img && updateData.cate_img.startsWith('cloud://')) {
					try {
						await uniCloud.deleteFile({
							fileList: [oldImg]
						});
						console.log('已删除旧的云存储图片:', oldImg);
					} catch (fileErr) {
						console.error('删除旧的云存储图片失败:', fileErr);
						// 继续执行更新操作
					}
				}
			}
			
			// 如果有排序值，则更新排序
			if (sort !== undefined) {
				updateData.sort = parseInt(sort) || 0;
			}
			
			console.log('更新数据:', updateData);
			
			// 执行更新操作
			const res = await dbJQL.collection("cateList").doc(id).update(updateData);
			console.log('更新结果:', res);
			return res;
		} catch (err) {
			console.error('更新分类失败:', err);
			return {
				errCode: 2,
				errMsg: '更新分类失败: ' + err.message
			};
		}
	},
	/**
	 * updateSort  更新分类排序
	 * @param {string} id 分类id
	 * @param {number} sort 排序权重
	 * @returns {object} 返回值 0 成功
	 */
	async updateSort(id, sort) {
		if (!id) {
			return {
				errCode: 1,
				errMsg: '分类ID不能为空'
			}
		}
		
		try {
			const res = await dbJQL.collection("cateList").doc(id).update({
				sort: parseInt(sort) || 0,
				update_time: getCurrentTimestamp()
			});
			return res;
		} catch (err) {
			console.error('更新分类排序失败:', err);
			return {
				errCode: 2,
				errMsg: '更新分类排序失败: ' + err.message
			};
		}
	},
	/**
	 * toggleVisibility  切换分类可见性
	 * @param {string} id 分类id
	 * @param {boolean} visible 是否可见
	 * @returns {object} 返回值 0 成功
	 */
	async toggleVisibility(id, visible) {
		if (!id) {
			return {
				errCode: 1,
				errMsg: '分类ID不能为空'
			}
		}
		
		try {
			// 先获取当前分类信息，确保更新时包含必填字段
			const cateInfo = await dbJQL.collection("cateList").doc(id).get();
			if (!cateInfo.data) {
				return {
					errCode: 1,
					errMsg: '当前分类不存在'
				}
			}
			
			// 执行更新操作，保留原始的cate_name字段
			const res = await dbJQL.collection("cateList").doc(id).update({
				cate_name: cateInfo.data.cate_name, // 保留原有的分类名称，确保满足必填字段要求
				is_visible: !!visible,
				update_time: getCurrentTimestamp()
			});
			return res;
		} catch (err) {
			console.error('切换分类可见性失败:', err);
			return {
				errCode: 2,
				errMsg: '切换分类可见性失败: ' + err.message
			};
		}
	},
	/**
	 * del  删除分类
	 * @param {string} id 分类id
	 * @returns {object} 返回值 0 成功
	 */
	async del( id ) {
		try {
			// 获取分类信息，检查是否有云存储图片需要删除
			const cateInfo = await dbJQL.collection("cateList").doc(id).get();
			
			// 执行删除操作
			const res = await dbJQL.collection( "cateList" ).doc( id ).remove( )
			
			// 如果删除成功且有云存储图片，则删除图片
			if (res.deleted === 1 && cateInfo.data && cateInfo.data.cate_img && cateInfo.data.cate_img.startsWith('cloud://')) {
				try {
					await uniCloud.deleteFile({
						fileList: [cateInfo.data.cate_img]
					});
					console.log('已删除云存储图片:', cateInfo.data.cate_img);
				} catch (fileErr) {
					console.error('删除云存储图片失败:', fileErr);
					// 继续返回删除成功
				}
			}
			
			return res
		} catch (err) {
			console.error('删除分类失败:', err)
			return {
				code: -1,
				msg: '删除分类失败',
				err
			}
		}
	},
	
	/**
	 * updateSubCategoryTags  更新分类的二级标签
	 * @param {string} id 分类id
	 * @param {array} tags 二级分类标签数组
	 * @param {string} description 分类描述
	 * @returns {object} 返回值 0 成功
	 */
	async updateSubCategoryTags(id, tags, description) {
		if (!id) {
			return {
				errCode: 1,
				errMsg: '分类ID不能为空'
			}
		}
		
		try {
			// 获取当前分类信息
			const cateInfo = await dbJQL.collection("cateList").doc(id).get();
			if (!cateInfo.data) {
				return {
					errCode: 1,
					errMsg: '当前分类不存在'
				}
			}
			
			// 处理标签数组
			let processedTags = [];
			if (Array.isArray(tags)) {
				processedTags = tags.filter(tag => 
					tag && typeof tag === 'string' && tag.trim().length > 0
				).map(tag => tag.trim()).slice(0, 20); // 最多20个标签
			}
			
			// 准备更新数据
			const updateData = {
				cate_name: cateInfo.data.cate_name, // 保留原有字段
				sub_category_tags: processedTags,
				update_time: getCurrentTimestamp()
			};
			
			// 如果有描述，则更新描述
			if (description !== undefined) {
				updateData.sub_category_description = description ? description.trim() : '';
			}
			
			// 执行更新操作
			const res = await dbJQL.collection("cateList").doc(id).update(updateData);
			console.log('更新二级分类成功:', res);
			return res;
		} catch (err) {
			console.error('更新二级分类失败:', err);
			return {
				errCode: 2,
				errMsg: '更新二级分类失败: ' + err.message
			};
		}
	},
	
	/**
	 * getSubCategoryTags  获取分类的二级标签
	 * @param {string} id 分类id
	 * @returns {object} 返回值 二级分类信息
	 */
	async getSubCategoryTags(id) {
		if (!id) {
			return {
				errCode: 1,
				errMsg: '分类ID不能为空'
			}
		}
		
		try {
			const res = await dbJQL.collection("cateList").doc(id).field({
				_id: true,
				cate_name: true,
				sub_category_tags: true,
				sub_category_description: true,
				is_location_based: true
			}).get();
			
			if (!res.data) {
				return {
					errCode: 1,
					errMsg: '分类不存在'
				}
			}
			
			return {
				code: 0,
				data: {
					id: res.data._id,
					cate_name: res.data.cate_name,
					tags: res.data.sub_category_tags || [],
					description: res.data.sub_category_description || '',
					is_location_based: res.data.is_location_based || false
				}
			};
		} catch (err) {
			console.error('获取二级分类失败:', err);
			return {
				errCode: 2,
				errMsg: '获取二级分类失败: ' + err.message
			};
		}
	},
	
	/**
	 * ensureSubCategoryFields  确保二级分类字段存在
	 * @param {string} categoryId 分类 ID
	 * @returns {object} 返回值
	 */
	async ensureSubCategoryFields(categoryId) {
		try {
			// 先获取现有数据
			const categoryRes = await dbJQL.collection("cateList").doc(categoryId).get();
			
			if (!categoryRes.data) {
				return {
					errCode: 1,
					errMsg: '分类不存在'
				};
			}
			
			const category = categoryRes.data;
			
			// 检查是否已有二级分类字段
			if (category.sub_category_tags !== undefined && category.sub_category_description !== undefined) {
				return {
					code: 0,
					msg: '字段已存在'
				};
			}
			
			// 添加缺失的字段
			const updateData = {};
			
			if (category.sub_category_tags === undefined) {
				updateData.sub_category_tags = [];
			}
			
			if (category.sub_category_description === undefined) {
				updateData.sub_category_description = '';
			}
			
			if (Object.keys(updateData).length > 0) {
				updateData.update_time = getCurrentTimestamp();
				
				const updateRes = await dbJQL.collection("cateList").doc(categoryId).update(updateData);
				
				if (updateRes.updated === 1) {
					return {
						code: 0,
						msg: '字段初始化成功'
					};
				} else {
					return {
						errCode: 2,
						errMsg: '字段初始化失败'
					};
				}
			}
			
			return {
				code: 0,
				msg: '字段已存在'
			};
			
		} catch (err) {
			console.error('确保二级分类字段失败:', err);
			return {
				errCode: 3,
				errMsg: '确保字段失败: ' + err.message
			};
		}
	},
	
	/**
	 * addSubCategoryForSpecificCategory  为指定分类添加二级标签
	 * @param {string} categoryName 分类名称
	 * @param {array} tags 二级标签数组
	 * @param {string} description 分类描述
	 * @returns {object} 返回值 更新结果
	 */
	async addSubCategoryForSpecificCategory(categoryName, tags, description) {
		try {
			// 参数验证
			if (!categoryName || typeof categoryName !== 'string') {
				return {
					errCode: 1,
					errMsg: '分类名称不能为空且必须为字符串'
				};
			}
			
			if (!tags || !Array.isArray(tags) || tags.length === 0) {
				return {
					errCode: 1,
					errMsg: '二级标签不能为空且必须为数组'
				};
			}
			
			// 验证数组长度和元素格式
			if (tags.length > 20) {
				return {
					errCode: 1,
					errMsg: '二级标签数量不能超过20个'
				};
			}
			
			// 验证每个标签的格式
			for (let i = 0; i < tags.length; i++) {
				const tag = tags[i];
				if (typeof tag !== 'string') {
					return {
						errCode: 1,
						errMsg: `第${i+1}个标签必须为字符串`
					};
				}
				if (tag.trim().length === 0) {
					return {
						errCode: 1,
						errMsg: `第${i+1}个标签不能为空`
					};
				}
				if (tag.trim().length > 10) {
					return {
						errCode: 1,
						errMsg: `第${i+1}个标签长度不能超过10个字符`
					};
				}
			}
			
			// 验证描述字段
			if (description && typeof description !== 'string') {
				return {
					errCode: 1,
					errMsg: '描述必须为字符串类型'
				};
			}
			
			if (description && description.length > 100) {
				return {
					errCode: 1,
					errMsg: '描述长度不能超过100个字符'
				};
			}
			
			// 查找指定分类
			const categoryRes = await dbJQL.collection("cateList").where({
				cate_name: categoryName.trim()
			}).get();
			
			if (!categoryRes.data || categoryRes.data.length === 0) {
				return {
					errCode: 2,
					errMsg: `分类 "${categoryName}" 不存在，请检查分类名称是否正确`
				};
			}
			
			const category = categoryRes.data[0];
			
			// 确保二级分类字段存在（直接在当前方法中处理）
			try {
				// 检查字段是否存在，如果不存在则先初始化
				if (category.sub_category_tags === undefined || category.sub_category_description === undefined) {
					console.log('检测到缺失字段，正在初始化...');
					
					const initData = {};
					if (category.sub_category_tags === undefined) {
						initData.sub_category_tags = [];
					}
					if (category.sub_category_description === undefined) {
						initData.sub_category_description = '';
					}
					
					// 先初始化字段
					const initRes = await dbJQL.collection("cateList").doc(category._id).update(initData);
					if (initRes.updated !== 1) {
						console.warn('字段初始化失败，继续尝试直接更新');
					}
				}
			} catch (initError) {
				console.warn('字段初始化出错:', initError.message);
				// 继续执行，尝试直接更新
			}
			
			// 清理数据，去除空白和重复
			const cleanedTags = [...new Set(tags.map(tag => tag.trim()).filter(tag => tag.length > 0))];
			
			// 构建更新数据
			const updateData = {
				sub_category_tags: cleanedTags,
				sub_category_description: description ? description.trim() : `${categoryName.trim()}相关信息`,
				update_time: getCurrentTimestamp()
			};
			
			console.log('将要更新的数据:', updateData);
			
			// 直接使用update方法更新
			const updateRes = await dbJQL.collection("cateList").doc(category._id).update(updateData);
			
			if (updateRes.updated === 1) {
				return {
					code: 0,
					msg: `成功为分类 "${categoryName}" 添加二级标签`,
					data: {
						id: category._id,
						categoryName: categoryName.trim(),
						tags: cleanedTags,
						description: updateData.sub_category_description
					}
				};
			} else {
				return {
					errCode: 3,
					errMsg: '数据库更新失败，请检查数据格式和权限设置'
				};
			}
			
		} catch (err) {
			console.error('为指定分类添加二级标签失败:', err);
			
			// 提供更详细的错误信息
			let errorMsg = '添加二级标签失败';
			if (err.message) {
				if (err.message.includes('validation')) {
					errorMsg += ': 数据库验证失败，请检查schema文件中的字段定义';
				} else if (err.message.includes('permission')) {
					errorMsg += ': 权限不足，请检查数据库权限设置';
				} else {
					errorMsg += ': ' + err.message;
				}
			}
			
			return {
				errCode: 4,
				errMsg: errorMsg
			};
		}
	},
	
	/**
	 * updateDatabaseSchema  更新数据库Schema，为所有分类添加二级分类字段
	 * @returns {object} 返回值
	 */
	async updateDatabaseSchema() {
		try {
			console.log('开始更新数据库Schema...');
			
			// 获取所有分类
			const allCategories = await dbJQL.collection("cateList").get();
			if (!allCategories.data || allCategories.data.length === 0) {
				return {
					code: 0,
					msg: '没有需要更新的分类'
				};
			}
			
			let updateCount = 0;
			const updateResults = [];
			
			// 逐个更新分类，添加缺失的字段
			for (const category of allCategories.data) {
				try {
					const updateData = {};
					let needUpdate = false;
					
					// 检查并添加缺失的字段
					if (category.sub_category_tags === undefined) {
						updateData.sub_category_tags = [];
						needUpdate = true;
					}
					
					if (category.sub_category_description === undefined) {
						updateData.sub_category_description = '';
						needUpdate = true;
					}
					
					if (needUpdate) {
						updateData.update_time = getCurrentTimestamp();
						
						const res = await dbJQL.collection("cateList").doc(category._id).update(updateData);
						
						if (res.updated === 1) {
							updateCount++;
							updateResults.push({
								id: category._id,
								name: category.cate_name,
								status: 'success',
								updatedFields: Object.keys(updateData).filter(key => key !== 'update_time')
							});
						} else {
							updateResults.push({
								id: category._id,
								name: category.cate_name,
								status: 'failed',
								error: '更新失败'
							});
						}
					} else {
						updateResults.push({
							id: category._id,
							name: category.cate_name,
							status: 'skipped',
							message: '字段已存在'
						});
					}
					
				} catch (err) {
					console.error(`更新分类 ${category.cate_name} 失败:`, err);
					updateResults.push({
						id: category._id,
						name: category.cate_name,
						status: 'failed',
						error: err.message
					});
				}
			}
			
			return {
				code: 0,
				msg: `Schema更新完成，共更新 ${updateCount} 个分类`,
				data: {
					updateCount,
					totalCount: allCategories.data.length,
					results: updateResults
				}
			};
			
		} catch (err) {
			console.error('更新数据库Schema失败:', err);
			return {
				errCode: 1,
				errMsg: '更新Schema失败: ' + err.message
			};
		}
	},
	
	/**
	 * batchUpdateSubCategories  批量更新预设分类的二级标签
	 * @returns {object} 返回值 更新结果
	 */
	async batchUpdateSubCategories() {
		try {
			// 预设的分类二级标签映射 - 已移除所有预设内容，改为手动添加
			const presetSubCategories = {
				// 移除所有预设分类映射，用户需要手动添加分类内容
			};
			
			// 获取所有分类
			const allCategories = await dbJQL.collection("cateList").get();
			if (!allCategories.data || allCategories.data.length === 0) {
				return {
					code: 0,
					msg: '没有需要更新的分类'
				};
			}
			
			let updateCount = 0;
			const updateResults = [];
			
			// 遍历所有分类，更新匹配的分类
			for (const category of allCategories.data) {
				const preset = presetSubCategories[category.cate_name];
				
				if (preset) {
					try {
						const updateData = {
							cate_name: category.cate_name,
							sub_category_tags: preset.tags,
							sub_category_description: preset.description,
							update_time: getCurrentTimestamp()
						};
						
						const res = await dbJQL.collection("cateList").doc(category._id).update(updateData);
						
						if (res.updated === 1) {
							updateCount++;
							updateResults.push({
								id: category._id,
								name: category.cate_name,
								status: 'success'
							});
						}
					} catch (err) {
						console.error(`更新分类 ${category.cate_name} 失败:`, err);
						updateResults.push({
							id: category._id,
							name: category.cate_name,
							status: 'failed',
							error: err.message
						});
					}
				}
			}
			
			return {
				code: 0,
				msg: `批量更新完成，共更新 ${updateCount} 个分类`,
				data: {
					updateCount,
					results: updateResults
				}
			};
		} catch (err) {
			console.error('批量更新二级分类失败:', err);
			return {
				errCode: 2,
				errMsg: '批量更新二级分类失败: ' + err.message
			};
		}
	}
}