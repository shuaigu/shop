# 微信小程序头像昵称获取解决方案

## 背景说明

微信小程序已于2022年10月底废弃了 `wx.getUserProfile` 和 `wx.getUserInfo` 接口，现在无法直接通过API自动获取用户头像和昵称。

## 官方推荐方案：头像昵称填写能力

微信官方推出了新的**头像昵称填写能力**，这是目前获取用户头像昵称的标准方案。

### 核心组件

1. **头像选择**: `<button open-type="chooseAvatar" @chooseavatar="onChooseAvatar">`
2. **昵称输入**: `<input type="nickname" @change="onNicknameChange">`

### 实现原理

- 用户主动点击头像按钮时，会弹出微信原生的头像选择界面
- 用户主动点击昵称输入框时，会弹出微信原生的昵称输入键盘
- 这些操作都需要用户的主动行为，无法自动获取

## 项目中的实现方案

### ✅ 当前使用：方案3 - 工具函数库（推荐）

**文件**: `/utils/profileHelper.js`

**特点**:
- 提供完整的工具函数库，可在项目任何地方使用
- 统一的API接口，减少代码重复
- 支持微信小程序和其他平台的兼容处理
- 提供丰富的配置选项和回调函数

**核心函数**:
- `checkProfileComplete(userInfo)` - 检查用户信息完整度
- `guideProfileComplete(userInfo, options)` - 引导用户完善信息
- `handleWxAvatarChoose(e, userId, onSuccess, onError)` - 处理头像选择
- `handleWxNicknameChange(e, userId, currentNickname, onSuccess, onError)` - 处理昵称修改
- `checkWxProfileSupport()` - 检查微信版本支持
- `uploadAvatar(tempFilePath, userId)` - 上传头像
- `updateUserProfile(updateData, userId)` - 更新用户信息

**使用示例**:
```javascript
import { guideProfileComplete, handleWxAvatarChoose } from '@/utils/profileHelper.js'

// 检查并引导用户完善信息
guideProfileComplete(userInfo, {
    redirectTo: '/pages/my/my', // 跳转到个人中心页面
    onSkip: () => console.log('用户跳过了信息完善')
})

// 处理头像选择
const onChooseAvatar = (e) => {
    handleWxAvatarChoose(e, userId, (fileID) => {
        // 头像更新成功
        userStore.updateUserAvatar(fileID)
    }, (error) => {
        // 处理错误
        console.error('头像更新失败:', error)
    })
}
```

## 重要注意事项

### 1. 用户主动操作原则
- 头像和昵称的获取都需要用户主动点击操作
- 无法在用户不知情的情况下自动获取
- 这是微信为保护用户隐私而设计的机制

### 2. 版本兼容性
- 头像昵称填写能力需要微信基础库版本 ≥ 2.21.2
- 对于低版本，需要提供降级方案（使用 `uni.chooseImage` 和普通输入框）

### 3. 存储和同步
- 获取到的头像需要上传到云存储
- 昵称和头像信息需要同步更新到数据库和本地存储
- 建议在用户信息更新后立即同步到 Store

### 4. 用户体验优化
- 为新用户提供明确的引导提示
- 在关键页面适时提醒用户完善信息
- 提供"跳过"选项，不要强制用户设置

## 最佳实践建议

1. **渐进式引导**: 不要在登录后立即强制用户设置，可以在用户使用过程中适时提醒

2. **视觉提示**: 为使用默认头像的用户添加醒目的编辑图标或提示文字

3. **操作反馈**: 用户设置头像昵称后及时给出成功反馈

4. **容错处理**: 妥善处理网络失败、上传失败等异常情况

5. **隐私保护**: 尊重用户选择，不要过度频繁地提醒用户设置信息

## 技术实现要点

### 头像处理流程
1. 用户点击头像按钮 → 微信原生选择界面
2. 用户选择头像 → 触发 `chooseavatar` 事件
3. 获取临时头像路径 → 上传到云存储
4. 获取云存储 fileID → 调用云函数更新数据库
5. 更新本地 Store → 界面实时更新

### 昵称处理流程
1. 用户点击昵称输入框 → 微信原生键盘
2. 用户输入昵称 → 触发 `change` 事件
3. 获取输入内容 → 调用云函数更新数据库
4. 更新本地 Store → 界面实时更新

这种方案既符合微信的最新规范，又能提供良好的用户体验。