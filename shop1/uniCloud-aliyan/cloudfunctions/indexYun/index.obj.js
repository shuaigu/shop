const db = uniCloud.database();
const collection = db.collection('index1');

module.exports = {
  _before: function () {
    // 前置检查可以在此处添加
  },
  
  /**
   * 获取首页设置
   */
  async getIndexSettings() {
    try {
      // 获取设置，限制只取一条记录
      const settings = await collection.limit(1).get();
      
      if (settings && settings.data && settings.data.length > 0) {
        // 返回数据库中的设置
        return {
          code: 0,
          ...settings.data[0]
        };
      } else {
        // 返回默认设置
        return {
          code: 0,
          showHomeButton: false,
          homeButtonText: '返回首页',
          homeButtonIcon: '🏠'
        };
      }
    } catch (err) {
      console.error('获取首页设置失败:', err)
      return {
        code: 1,
        message: '获取设置失败',
        error: err.message
      };
    }
  },
  
  /**
   * 更新首页设置
   * @param {Object} params 设置参数
   */
  async updateIndexSettings(params) {
    try {
      const { showHomeButton, homeButtonText, homeButtonIcon } = params;
      
      // 检查是否已有设置记录
      const existingSettings = await collection.limit(1).get();
      
      let result;
      if (existingSettings && existingSettings.data && existingSettings.data.length > 0) {
        // 更新现有记录
        const id = existingSettings.data[0]._id;
        result = await collection.doc(id).update({
          showHomeButton,
          homeButtonText,
          homeButtonIcon,
          updateTime: Date.now() // 添加更新时间
        });
      } else {
        // 创建新记录
        result = await collection.add({
          showHomeButton,
          homeButtonText,
          homeButtonIcon,
          createTime: Date.now(), // 添加创建时间
          updateTime: Date.now() // 添加更新时间
        });
      }
      
      return {
        code: 0,
        message: '更新成功',
        data: result
      };
    } catch (error) {
      console.error('更新首页设置失败:', error)
      return {
        code: 1,
        message: '更新失败',
        error: error.message
      };
    }
  }
}
