'use strict';

const db = uniCloud.database()
const $ = db.command.aggregate
const dbCmd = db.command

// 修改主导出对象，包含所有方法
exports.main = {
    // 获取文章列表方法
    async getList(event, context) {
        const { 
            cate_id,    // 分类ID
            page = 1,   // 页码，默认1
            pageSize = 5 // 每页数量，默认5
        } = event
        
        try {
            // 计算跳过的数量
            const skip = (page - 1) * pageSize
            
            // 构建查询条件
            const matchCondition = {
                // 移除了status条件，所有文章都会直接显示
            }
            if (cate_id && cate_id !== '01' && cate_id !== '02') {
                matchCondition.cate_id = cate_id
            }
            
            // 如果是"最新"，按创建时间倒序
            if (cate_id === '01') {
                const result = await db.collection('article')
                    .where(matchCondition)
                    .orderBy('create_time', 'desc')
                    .skip(skip)
                    .limit(pageSize)
                    .get()
                
                return {
                    code: 0,
                    message: '获取成功',
                    data: result.data
                }
            }
            
            // 如果是"最热"，按浏览量倒序
            if (cate_id === '02') {
                const result = await db.collection('article')
                    .where(matchCondition)
                    .orderBy('view_count', 'desc')
                    .skip(skip)
                    .limit(pageSize)
                    .get()
                
                return {
                    code: 0,
                    message: '获取成功',
                    data: result.data
                }
            }
            
            // 普通分类查询
            const result = await db.collection('article')
                .where(matchCondition)
                .orderBy('create_time', 'desc')
                .skip(skip)
                .limit(pageSize)
                .get()
            
            return {
                code: 0,
                message: '获取成功',
                data: result.data
            }
            
        } catch (error) {
            console.error('获取文章列表失败:', error)
            return {
                code: -1,
                message: '获取失败',
                error: error.message
            }
        }
    },

    // 添加文章方法
    async add(data) {
        // 验证登录用户
        const { uid } = await this.middleware.auth()
        
        // 构建文章数据
        const article = {
            ...data,
            // 直接将状态设置为已发布，去掉审核环节
            status: 1,  // 1表示已发布，原来可能是0表示待审核
            publish_date: Date.now(), 
            publish_uid: uid
        }
        
        // 直接保存并发布文章
        return await this.collection.add(article)
    }
} 