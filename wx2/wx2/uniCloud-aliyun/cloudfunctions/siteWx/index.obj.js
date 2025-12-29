// 站点管理云函数

module.exports = {
    
    /**
     * 初始化测试数据
     */
    async initTestData() {
        try {
            const db = uniCloud.database()
            
            // 检查是否已有数据
            const existingData = await db.collection('siteList').get()
            if (existingData.data.length > 0) {
                return {
                    code: 0,
                    message: '数据已存在，无需初始化',
                    data: existingData.data
                }
            }
            
            // 测试站点数据
            const testSites = [
                {
                    site_name: '科技园区',
                    site_code: 'tech_park',
                    site_desc: '高新技术产业园区',
                    site_img: '/static/images/sites/tech.png',
                    is_visible: true,
                    sort: 3,
                    create_time: Date.now(),
                    update_time: Date.now()
                },
                {
                    site_name: '商业中心',
                    site_code: 'business_center',
                    site_desc: '繁华商业区域',
                    site_img: '/static/images/sites/business.png',
                    is_visible: true,
                    sort: 2,
                    create_time: Date.now(),
                    update_time: Date.now()
                },
                {
                    site_name: '住宅小区',
                    site_code: 'residential',
                    site_desc: '生活居住区域',
                    site_img: '/static/images/sites/residential.png',
                    is_visible: true,
                    sort: 1,
                    create_time: Date.now(),
                    update_time: Date.now()
                }
            ]
            
            // 批量插入测试数据
            const insertPromises = testSites.map(site => {
                return db.collection('siteList').add(site)
            })
            
            await Promise.all(insertPromises)
            
            return {
                code: 0,
                message: '测试数据初始化成功',
                data: testSites
            }
        } catch (error) {
            console.error('初始化测试数据失败:', error)
            return {
                code: -1,
                message: '初始化失败: ' + error.message
            }
        }
    },
    
    /**
     * 获取站点列表
     * @param {String} siteId - 可选，指定站点ID
     * @param {Boolean} showAll - 是否显示所有站点（包括隐藏的）
     */
    async get(siteId = null, showAll = false) {
        try {
            const db = uniCloud.database()
            let query = db.collection('siteList')
            
            // 如果指定了站点ID，则只查询该站点
            if (siteId) {
                query = query.where({
                    _id: siteId
                })
            } else {
                // 如果不显示所有站点，则只查询可见的站点
                if (!showAll) {
                    query = query.where({
                        is_visible: true
                    })
                }
            }
            
            // 按排序权重降序排列
            const res = await query.orderBy('sort', 'desc').get()
            
            return {
                code: 0,
                message: '获取成功',
                data: res.data
            }
        } catch (error) {
            console.error('获取站点列表失败:', error)
            return {
                code: -1,
                message: '获取失败',
                error: error.message
            }
        }
    },
    
    /**
     * 添加站点
     * @param {Object} data - 站点数据
     */
    async add(data) {
        try {
            if (!data.site_name || !data.site_name.trim()) {
                throw new Error('站点名称不能为空')
            }
            
            if (!data.site_code || !data.site_code.trim()) {
                throw new Error('站点代码不能为空')
            }
            
            const db = uniCloud.database()
            
            // 检查站点名称是否重复
            const nameCheckRes = await db.collection('siteList').where({
                site_name: data.site_name.trim()
            }).get()
            
            if (nameCheckRes.data.length > 0) {
                throw new Error('站点名称已存在')
            }
            
            // 检查站点代码是否重复
            const codeCheckRes = await db.collection('siteList').where({
                site_code: data.site_code.trim()
            }).get()
            
            if (codeCheckRes.data.length > 0) {
                throw new Error('站点代码已存在')
            }
            
            // 准备插入数据
            const insertData = {
                site_name: data.site_name.trim(),
                site_code: data.site_code.trim(),
                site_img: data.site_img || '',
                site_desc: data.site_desc || '',
                sort: data.sort || 0,
                is_visible: data.is_visible !== undefined ? data.is_visible : true,
                create_time: Date.now(),
                update_time: Date.now()
            }
            
            const res = await db.collection('siteList').add(insertData)
            
            return {
                code: 0,
                message: '添加成功',
                data: res
            }
        } catch (error) {
            console.error('添加站点失败:', error)
            return {
                code: -1,
                message: error.message || '添加失败'
            }
        }
    },
    
    /**
     * 更新站点
     * @param {String} siteId - 站点ID
     * @param {Object} data - 更新数据
     */
    async update(siteId, data) {
        try {
            if (!siteId) {
                throw new Error('站点ID不能为空')
            }
            
            if (!data.site_name || !data.site_name.trim()) {
                throw new Error('站点名称不能为空')
            }
            
            if (!data.site_code || !data.site_code.trim()) {
                throw new Error('站点代码不能为空')
            }
            
            const db = uniCloud.database()
            
            // 检查站点名称是否重复（排除当前站点）
            const nameCheckRes = await db.collection('siteList').where({
                site_name: data.site_name.trim(),
                _id: db.command.neq(siteId)
            }).get()
            
            if (nameCheckRes.data.length > 0) {
                throw new Error('站点名称已存在')
            }
            
            // 检查站点代码是否重复（排除当前站点）
            const codeCheckRes = await db.collection('siteList').where({
                site_code: data.site_code.trim(),
                _id: db.command.neq(siteId)
            }).get()
            
            if (codeCheckRes.data.length > 0) {
                throw new Error('站点代码已存在')
            }
            
            // 准备更新数据
            const updateData = {
                site_name: data.site_name.trim(),
                site_code: data.site_code.trim(),
                site_img: data.site_img || '',
                site_desc: data.site_desc || '',
                sort: data.sort || 0,
                is_visible: data.is_visible !== undefined ? data.is_visible : true,
                update_time: Date.now()
            }
            
            const res = await db.collection('siteList').doc(siteId).update(updateData)
            
            return {
                code: 0,
                message: '更新成功',
                data: res
            }
        } catch (error) {
            console.error('更新站点失败:', error)
            return {
                code: -1,
                message: error.message || '更新失败'
            }
        }
    },
    
    /**
     * 删除站点
     * @param {String} siteId - 站点ID
     */
    async del(siteId) {
        try {
            if (!siteId) {
                throw new Error('站点ID不能为空')
            }
            
            const db = uniCloud.database()
            
            // 检查该站点下是否还有分类
            const cateCheckRes = await db.collection('cateList').where({
                site_id: siteId
            }).get()
            
            if (cateCheckRes.data.length > 0) {
                throw new Error('该站点下还有分类，请先删除所有分类')
            }
            
            // 删除站点
            const res = await db.collection('siteList').doc(siteId).remove()
            
            return {
                code: 0,
                message: '删除成功',
                data: res
            }
        } catch (error) {
            console.error('删除站点失败:', error)
            return {
                code: -1,
                message: error.message || '删除失败'
            }
        }
    },
    
    /**
     * 批量更新站点排序
     * @param {Array} sortData - 排序数据 [{id, sort}, ...]
     */
    async batchUpdateSort(sortData) {
        try {
            if (!Array.isArray(sortData) || sortData.length === 0) {
                throw new Error('排序数据不能为空')
            }
            
            const db = uniCloud.database()
            const batch = []
            
            for (const item of sortData) {
                if (!item.id) {
                    throw new Error('站点ID不能为空')
                }
                
                batch.push(
                    db.collection('siteList').doc(item.id).update({
                        sort: item.sort || 0,
                        update_time: Date.now()
                    })
                )
            }
            
            // 执行批量更新
            await Promise.all(batch)
            
            return {
                code: 0,
                message: '批量更新成功'
            }
        } catch (error) {
            console.error('批量更新站点排序失败:', error)
            return {
                code: -1,
                message: error.message || '批量更新失败'
            }
        }
    },
    
    /**
     * 根据地区信息创建或获取站点
     * @param {Object} locationData - 位置数据 {district, city, province, address}
     */
    async getOrCreateSiteByLocation(locationData) {
        try {
            const { district, city, province, address } = locationData
            
            if (!district && !city) {
                throw new Error('位置信息不完整')
            }
            
            const db = uniCloud.database()
            
            // 优先使用区县信息，其次是城市信息
            const siteName = district || city || province
            const siteCode = (district || city || province).replace(/[区市县]/g, '').toLowerCase()
            
            // 查找是否已存在该地区的站点
            const existingSite = await db.collection('siteList').where({
                $or: [
                    { site_name: siteName },
                    { site_code: siteCode },
                    { site_name: district },
                    { site_name: city }
                ]
            }).get()
            
            if (existingSite.data.length > 0) {
                // 返回已存在的站点
                return {
                    code: 0,
                    message: '找到已存在的地区站点',
                    data: existingSite.data[0],
                    isNew: false
                }
            }
            
            // 创建新的地区站点
            const newSiteData = {
                site_name: siteName,
                site_code: siteCode,
                site_desc: `${siteName}地区站点`,
                site_img: '/static/images/sites/location.png',
                is_visible: true,
                sort: Date.now() % 1000, // 使用时间戳作为排序
                is_location_based: true, // 标记为基于位置的站点
                location_info: {
                    district: district || '',
                    city: city || '',
                    province: province || '',
                    address: address || ''
                },
                create_time: Date.now(),
                update_time: Date.now()
            }
            
            const createResult = await db.collection('siteList').add(newSiteData)
            
            return {
                code: 0,
                message: '成功创建地区站点',
                data: {
                    _id: createResult.id,
                    ...newSiteData
                },
                isNew: true
            }
        } catch (error) {
            console.error('根据地区创建站点失败:', error)
            return {
                code: -1,
                message: error.message || '创建地区站点失败'
            }
        }
    }
}