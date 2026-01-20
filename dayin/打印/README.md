# 链科云打印小程序使用说明

## 一、项目简介

这是一个基于 uni-app 开发的链科云打印微信小程序，支持文本、图片、文档和标签打印功能。

## 二、功能特点

### 1. 多种打印方式
- **文本打印**：支持自定义文本内容和字体大小
- **图片打印**：支持批量选择图片打印
- **文档打印**：支持 PDF、Word、Excel、PPT 等文档格式
- **标签打印**：支持多种标签模板

### 2. 打印机管理
- 添加打印机（支持扫码添加）
- 切换打印机
- 查看打印机状态

### 3. 打印设置
- 自定义打印份数
- 选择纸张大小
- 设置打印方向（竖向/横向）
- 选择颜色模式（彩色/黑白）

### 4. 历史记录
- 查看打印历史
- 按状态和类型筛选
- 查看详细信息
- 重新打印失败任务

## 三、配置步骤

### 1. 获取 API 密钥

1. 登录链科云打印管理后台：https://www.liankenet.com
2. 进入"开发秘钥"菜单
3. 获取 `clientId` 和 `clientSecret`

### 2. 配置小程序

打开 `utils/printApi.js` 文件，修改配置：

```javascript
const config = {
    clientId: '你的clientId',
    clientSecret: '你的clientSecret',
    baseUrl: 'https://cloud.liankenet.com/api',
    version: 'v1'
}
```

### 3. 配置微信小程序

打开 `manifest.json` 文件，修改小程序 appid：

```json
"mp-weixin": {
    "appid": "你的小程序appid",
    "setting": {
        "urlCheck": false
    }
}
```

### 4. 配置服务器域名

在微信小程序管理后台，配置以下服务器域名：

**request合法域名**：
- https://cloud.liankenet.com

**uploadFile合法域名**：
- https://cloud.liankenet.com

## 四、使用指南

### 1. 添加打印机

1. 点击首页的"打印机管理"
2. 点击"添加打印机"按钮
3. 填写打印机信息（可扫描二维码自动填充）
4. 点击确定完成添加

### 2. 开始打印

1. 在首页选择打印类型（文本/图片/文档/标签）
2. 输入或选择要打印的内容
3. 配置打印设置
4. 点击"开始打印"

### 3. 查看历史

1. 点击底部"历史"标签
2. 可按状态和类型筛选
3. 点击记录查看详情
4. 失败的任务可重新打印

## 五、API 接口说明

### 主要接口

1. **获取打印机列表**
   - 接口：`GET /api/printer/list`

2. **获取打印机状态**
   - 接口：`GET /api/printer/status`

3. **添加打印机**
   - 接口：`POST /api/printer/add`

4. **文本打印**
   - 接口：`POST /api/print/text`

5. **图片打印**
   - 接口：`POST /api/print/image`

6. **文档打印**
   - 接口：`POST /api/print/document`

7. **标签打印**
   - 接口：`POST /api/print/label`

8. **文件上传**
   - 接口：`POST /api/file/upload`

### 请求签名

所有API请求都需要签名验证：

1. 将请求参数按字母顺序排序
2. 拼接成字符串：`key1=value1&key2=value2&timestamp=xxx&secret=xxx`
3. 使用MD5加密生成签名
4. 将签名添加到请求参数中

## 六、开发说明

### 技术栈

- uni-app（Vue 3）
- 微信小程序

### 项目结构

```
打印/
├── pages/                 # 页面
│   ├── index/            # 首页
│   ├── print/            # 打印页面
│   ├── printer/          # 打印机管理
│   └── history/          # 历史记录
├── utils/                # 工具类
│   └── printApi.js       # API封装
├── App.vue               # 应用入口
├── main.js               # 主入口
├── manifest.json         # 配置文件
└── pages.json            # 页面配置
```

### 本地存储数据

- `printers`: 打印机列表
- `selectedPrinter`: 当前选中的打印机
- `printHistory`: 打印历史记录

## 七、常见问题

### 1. 打印失败

- 检查打印机是否在线
- 检查网络连接
- 检查API密钥是否正确
- 查看错误信息

### 2. 无法连接打印机

- 确认打印机ID是否正确
- 检查打印机是否开机
- 检查打印机网络连接

### 3. 图片/文档上传失败

- 检查文件大小（建议不超过10MB）
- 检查网络状态
- 检查文件格式是否支持

## 八、联系方式

- 官网：https://www.liankenet.com
- 邮箱：business@liankenet.com
- 售后文档：https://docs.liankenet.com

## 九、注意事项

1. **安全性**：请妥善保管 `clientSecret`，不要泄露
2. **测试**：正式使用前请先在测试环境充分测试
3. **费用**：根据实际打印次数收费，请关注账户余额
4. **兼容性**：建议使用最新版本微信小程序
5. **网络**：确保网络连接稳定

## 十、更新日志

### v1.0.0 (2025-01-15)
- 首次发布
- 支持文本、图片、文档、标签打印
- 打印机管理功能
- 打印历史记录
- 完整的打印设置选项
