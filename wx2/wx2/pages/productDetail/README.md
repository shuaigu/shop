# 商品详情页面使用说明

## 页面概述
这是一个仿拼多多风格的商品详情页面，包含以下主要功能：

### 主要功能模块

1. **商品图片轮播**
   - 支持多图轮播展示
   - 图片指示器显示当前位置
   - 返回和分享按钮

2. **社交证明区域**
   - 显示回头客数量
   - 显示一周内购买人数
   - 增强用户信任感

3. **价格展示**
   - 突出显示限时优惠价格
   - 显示折扣金额
   - 实时倒计时功能
   - 显示附近购买人数

4. **商品信息**
   - 商品标题和描述
   - 商品保障标签（坏了包退、晚到必赔）

5. **配送信息**
   - 显示配送倒计时
   - 配送时间说明

6. **商品保障**
   - 展示售后服务承诺
   - 支持查看详细保障信息

7. **商品评价**
   - 评价统计和好评率
   - 评价标签展示
   - 用户评价列表
   - 支持查看更多评价

8. **底部操作栏**
   - 购物车图标（带数量角标）
   - 去支付按钮
   - 加入购物车按钮

## 如何使用

### 1. 页面跳转
```javascript
// 从其他页面跳转到商品详情页
uni.navigateTo({
  url: '/pages/productDetail/productDetail?productId=xxx'
})
```

### 2. 传递参数
页面支持通过URL参数传递商品ID：
- `productId`: 商品ID，用于加载商品详情数据

### 3. 需要的静态资源
确保以下静态资源存在：
- `/static/product-demo.jpg` - 商品示例图片
- `/static/avatar-placeholder.png` - 用户头像占位图

### 4. 数据接口对接
在实际使用中，需要将以下数据从后端获取：

```javascript
// 在 loadProductDetail 方法中实现
async loadProductDetail(productId) {
  // 调用云函数或API获取商品详情
  const res = await uniCloud.callFunction({
    name: 'getProductDetail',
    data: { productId }
  })
  
  // 更新页面数据
  this.productImages = res.result.images
  this.productTitle = res.result.title
  this.currentPrice = res.result.price
  // ... 其他数据
}
```

## 样式特点

### 设计规范
- **统一边距**: 24rpx（符合用户UI边距统一规范）
- **卡片式设计**: 列表项采用卡片式设计，增强视觉层次感
- **圆角**: 使用圆角设计，提升视觉体验
- **颜色**: 
  - 主色调：#e02e24（红色，突出优惠）
  - 成功色：#09bb07（绿色，保障标签）
  - 文字色：#333（主文字）、#666（次要文字）、#999（辅助文字）

### 响应式设计
- 使用rpx单位，适配不同屏幕尺寸
- 图片使用mode="aspectFill"保持比例

## 功能扩展建议

### 1. 商品规格选择
可以添加规格选择弹窗：
```javascript
// 点击加入购物车时弹出规格选择
handleSelectSpec() {
  uni.showModal({
    title: '选择规格',
    // ...
  })
}
```

### 2. 图片预览
可以集成图片预览功能：
```javascript
// 点击商品图片预览
handleImagePreview(index) {
  uni.previewImage({
    current: index,
    urls: this.productImages
  })
}
```

### 3. 分享功能
集成微信小程序分享：
```javascript
onShareAppMessage() {
  return {
    title: this.productTitle,
    path: '/pages/productDetail/productDetail?productId=' + this.productId,
    imageUrl: this.productImages[0]
  }
}
```

### 4. 收藏功能
添加商品收藏功能：
```javascript
async handleCollect() {
  // 调用收藏接口
  await uniCloud.callFunction({
    name: 'collectProduct',
    data: { productId: this.productId }
  })
  uni.showToast({
    title: '收藏成功',
    icon: 'success'
  })
}
```

## 注意事项

1. **倒计时功能**: 记得在页面卸载时清除定时器，避免内存泄漏
2. **图片加载**: 建议使用懒加载和缩略图，提升加载速度
3. **数据缓存**: 可以缓存商品详情数据，减少重复请求
4. **错误处理**: 完善错误处理逻辑，提升用户体验

## 测试建议

1. 测试不同商品数据的展示效果
2. 测试倒计时功能是否正常
3. 测试购物车功能
4. 测试图片轮播功能
5. 测试在不同设备上的显示效果

## 后续优化方向

1. 添加骨架屏，优化首屏加载体验
2. 实现图片懒加载
3. 添加商品详情富文本展示
4. 添加相关推荐商品
5. 优化评价列表的分页加载
