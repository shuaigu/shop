/**
 * 清理数据库中的临时头像路径
 * 这个脚本用于修复已经保存到数据库中的临时文件路径
 */

'use strict';

const db = uniCloud.database();
const dbCmd = db.command;

/**
 * 清理文章列表中的临时头像
 */
async function cleanArticleTempAvatars() {
	try {
		console.log('开始清理文章列表中的临时头像...');
		
		const articleCollection = db.collection('articleList');
		
		// 查找所有包含临时文件路径的文章（增强检测）
		const tempAvatarArticles = await articleCollection
			.where(dbCmd.or([
				{ user_avatarUrl: dbCmd.exists(true).and(db.RegExp({ regexp: 'tmp_' })) },
				{ user_avatarUrl: dbCmd.exists(true).and(db.RegExp({ regexp: 'tmp/' })) },
				{ user_avatarUrl: dbCmd.exists(true).and(db.RegExp({ regexp: '^http://tmp/' })) },
				{ user_avatarUrl: dbCmd.exists(true).and(db.RegExp({ regexp: '^wxfile://' })) }
			]))
			.get();
		
		if (!tempAvatarArticles.data || tempAvatarArticles.data.length === 0) {
			console.log('文章列表中未找到需要清理的临时头像');
			return {
				collection: 'articleList',
				total: 0,
				success: 0,
				fail: 0,
				message: '未找到需要清理的记录'
			};
		}
		
		console.log(`文章列表中找到 ${tempAvatarArticles.data.length} 条临时头像记录`);
		
		// 批量更新
		let successCount = 0;
		let failCount = 0;
		
		for (const article of tempAvatarArticles.data) {
			try {
				await articleCollection.doc(article._id).update({
					user_avatarUrl: '/static/images/touxiang.png'
				});
				successCount++;
				console.log(`已清理文章 ${article._id}, 原头像: ${article.user_avatarUrl}`);
			} catch (err) {
				failCount++;
				console.error(`清理文章 ${article._id} 失败:`, err);
			}
		}
		
		console.log(`文章列表清理完成! 成功: ${successCount}, 失败: ${failCount}`);
		
		return {
			collection: 'articleList',
			total: tempAvatarArticles.data.length,
			success: successCount,
			fail: failCount,
			message: '清理完成'
		};
		
	} catch (err) {
		console.error('清理文章列表临时头像失败:', err);
		return {
			collection: 'articleList',
			error: err.message,
			message: '清理失败'
		};
	}
}

/**
 * 清理浏览记录中的临时头像
 */
async function cleanViewRecordTempAvatars() {
	try {
		console.log('开始清理浏览记录中的临时头像...');
		
		const viewRecordCollection = db.collection('viewRecord');
		
		// 查找所有包含临时文件路径的浏览记录
		const tempAvatarRecords = await viewRecordCollection
			.where(dbCmd.or([
				{ user_avatarUrl: dbCmd.exists(true).and(db.RegExp({ regexp: 'tmp_' })) },
				{ user_avatarUrl: dbCmd.exists(true).and(db.RegExp({ regexp: 'tmp/' })) },
				{ user_avatarUrl: dbCmd.exists(true).and(db.RegExp({ regexp: '^http://tmp/' })) },
				{ user_avatarUrl: dbCmd.exists(true).and(db.RegExp({ regexp: '^wxfile://' })) }
			]))
			.get();
		
		if (!tempAvatarRecords.data || tempAvatarRecords.data.length === 0) {
			console.log('浏览记录中未找到需要清理的临时头像');
			return {
				collection: 'viewRecord',
				total: 0,
				success: 0,
				fail: 0,
				message: '未找到需要清理的记录'
			};
		}
		
		console.log(`浏览记录中找到 ${tempAvatarRecords.data.length} 条临时头像记录`);
		
		// 批量更新
		let successCount = 0;
		let failCount = 0;
		
		for (const record of tempAvatarRecords.data) {
			try {
				await viewRecordCollection.doc(record._id).update({
					user_avatarUrl: '/static/images/touxiang.png'
				});
				successCount++;
				console.log(`已清理浏览记录 ${record._id}, 原头像: ${record.user_avatarUrl}`);
			} catch (err) {
				failCount++;
				console.error(`清理浏览记录 ${record._id} 失败:`, err);
			}
		}
		
		console.log(`浏览记录清理完成! 成功: ${successCount}, 失败: ${failCount}`);
		
		return {
			collection: 'viewRecord',
			total: tempAvatarRecords.data.length,
			success: successCount,
			fail: failCount,
			message: '清理完成'
		};
		
	} catch (err) {
		console.error('清理浏览记录临时头像失败:', err);
		return {
			collection: 'viewRecord',
			error: err.message,
			message: '清理失败'
		};
	}
}

/**
 * 清理用户表中的临时头像
 */
async function cleanUserTempAvatars() {
	try {
		console.log('开始清理用户表中的临时头像...');
		
		const userCollection = db.collection('user');
		
		// 查找所有包含临时文件路径的用户
		const tempAvatarUsers = await userCollection
			.where(dbCmd.or([
				{ avatarUrl: dbCmd.exists(true).and(db.RegExp({ regexp: 'tmp_' })) },
				{ avatarUrl: dbCmd.exists(true).and(db.RegExp({ regexp: 'tmp/' })) },
				{ avatarUrl: dbCmd.exists(true).and(db.RegExp({ regexp: '^http://tmp/' })) },
				{ avatarUrl: dbCmd.exists(true).and(db.RegExp({ regexp: '^wxfile://' })) }
			]))
			.get();
		
		if (!tempAvatarUsers.data || tempAvatarUsers.data.length === 0) {
			console.log('用户表中未找到需要清理的临时头像');
			return {
				collection: 'user',
				total: 0,
				success: 0,
				fail: 0,
				message: '未找到需要清理的记录'
			};
		}
		
		console.log(`用户表中找到 ${tempAvatarUsers.data.length} 条临时头像记录`);
		
		// 批量更新
		let successCount = 0;
		let failCount = 0;
		
		for (const user of tempAvatarUsers.data) {
			try {
				await userCollection.doc(user._id).update({
					avatarUrl: '/static/images/touxiang.png'
				});
				successCount++;
				console.log(`已清理用户 ${user._id}, 原头像: ${user.avatarUrl}`);
			} catch (err) {
				failCount++;
				console.error(`清理用户 ${user._id} 失败:`, err);
			}
		}
		
		console.log(`用户表清理完成! 成功: ${successCount}, 失败: ${failCount}`);
		
		return {
			collection: 'user',
			total: tempAvatarUsers.data.length,
			success: successCount,
			fail: failCount,
			message: '清理完成'
		};
		
	} catch (err) {
		console.error('清理用户表临时头像失败:', err);
		return {
			collection: 'user',
			error: err.message,
			message: '清理失败'
		};
	}
}

/**
 * 执行所有清理任务
 */
async function cleanAllTempAvatars() {
	console.log('=== 开始清理所有数据库中的临时头像 ===');
	
	const results = [];
	
	// 清理文章列表
	const articleResult = await cleanArticleTempAvatars();
	results.push(articleResult);
	
	// 清理浏览记录
	const viewRecordResult = await cleanViewRecordTempAvatars();
	results.push(viewRecordResult);
	
	// 清理用户表
	const userResult = await cleanUserTempAvatars();
	results.push(userResult);
	
	console.log('=== 所有清理任务完成 ===');
	
	// 汇总结果
	const summary = {
		totalRecords: results.reduce((sum, r) => sum + (r.total || 0), 0),
		totalSuccess: results.reduce((sum, r) => sum + (r.success || 0), 0),
		totalFail: results.reduce((sum, r) => sum + (r.fail || 0), 0),
		details: results
	};
	
	console.log('清理汇总:', summary);
	
	return {
		code: 0,
		message: '清理完成',
		data: summary
	};
}

// 导出清理函数
module.exports = {
	cleanArticleTempAvatars,
	cleanViewRecordTempAvatars,
	cleanUserTempAvatars,
	cleanAllTempAvatars
};
