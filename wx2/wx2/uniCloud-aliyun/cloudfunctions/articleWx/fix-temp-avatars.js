/**
 * 数据库修复脚本 - 清理临时头像文件路径
 * 将所有 user_avatarUrl 中的临时文件路径替换为默认头像
 */

const db = uniCloud.database()
const dbCmd = db.command

async function fixTempAvatars() {
	try {
		console.log('开始修复数据库中的临时头像路径...')
		
		const articleCollection = db.collection('articleList')
		
		// 查找所有包含临时文件路径的文章
		const tempAvatarArticles = await articleCollection
			.where(dbCmd.or([
				{ user_avatarUrl: dbCmd.exists(true).and(db.RegExp({ regexp: '^http://tmp/' })) },
				{ user_avatarUrl: dbCmd.exists(true).and(db.RegExp({ regexp: '^wxfile://' })) }
			]))
			.get()
		
		if (!tempAvatarArticles.data || tempAvatarArticles.data.length === 0) {
			console.log('未找到需要修复的记录')
			return {
				code: 0,
				message: '未找到需要修复的记录',
				count: 0
			}
		}
		
		console.log(`找到 ${tempAvatarArticles.data.length} 条需要修复的记录`)
		
		// 批量更新
		let successCount = 0
		let failCount = 0
		
		for (const article of tempAvatarArticles.data) {
			try {
				await articleCollection.doc(article._id).update({
					user_avatarUrl: '/static/images/touxiang.png'
				})
				successCount++
				console.log(`已修复文章 ${article._id}, 原头像: ${article.user_avatarUrl}`)
			} catch (err) {
				failCount++
				console.error(`修复文章 ${article._id} 失败:`, err)
			}
		}
		
		console.log(`修复完成! 成功: ${successCount}, 失败: ${failCount}`)
		
		return {
			code: 0,
			message: '修复完成',
			total: tempAvatarArticles.data.length,
			success: successCount,
			fail: failCount
		}
		
	} catch (err) {
		console.error('修复过程出错:', err)
		return {
			code: -1,
			message: '修复失败',
			error: err.message
		}
	}
}

// 导出修复函数
module.exports = {
	fixTempAvatars
}
