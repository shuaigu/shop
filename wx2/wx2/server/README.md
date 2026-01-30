# uniCloud 固定 IP 代理服务器

## 方案说明

通过在固定 IP 服务器（115.159.35.33）上部署 HTTP 代理服务，让 uniCloud 云函数的请求通过该服务器转发，从而获得固定的出口 IP 地址。

## 服务器架构

```
uniCloud 云函数 (动态IP)
    ↓ HTTP 请求
代理服务器 (115.159.35.33 固定IP) 
    ↓ 转发请求
微信支付 API 服务器
```

## 部署步骤

### 1. 上传代码到服务器

将 `server` 目录下的文件上传到您的服务器 115.159.35.33：

```bash
# 在服务器上创建目录
mkdir -p /www/unicloud-proxy
cd /www/unicloud-proxy

# 上传 proxy-server.js 和 package.json 文件
```

### 2. 安装依赖

```bash
# 安装 Node.js（如果未安装）
# CentOS/RHEL
sudo yum install nodejs npm

# Ubuntu/Debian
sudo apt-get install nodejs npm

# 安装项目依赖
npm install
```

### 3. 启动服务

#### 方法一：直接启动（测试用）

```bash
npm start
```

#### 方法二：使用 PM2 管理（生产环境推荐）

```bash
# 安装 PM2
npm install -g pm2

# 启动服务
npm run pm2:start

# 查看状态
pm2 status

# 查看日志
npm run pm2:logs

# 重启服务
npm run pm2:restart

# 停止服务
npm run pm2:stop

# 设置开机自启
pm2 startup
pm2 save
```

### 4. 配置防火墙

确保服务器防火墙开放 8888 端口：

```bash
# CentOS/RHEL (firewalld)
sudo firewall-cmd --zone=public --add-port=8888/tcp --permanent
sudo firewall-cmd --reload

# Ubuntu/Debian (ufw)
sudo ufw allow 8888/tcp
sudo ufw reload

# 阿里云/腾讯云需要在安全组规则中开放 8888 端口
```

### 5. 验证服务

```bash
# 健康检查
curl http://115.159.35.33:8888/health

# 获取服务器 IP
curl http://115.159.35.33:8888/ip

# 测试代理功能
curl -X POST http://115.159.35.33:8888/proxy \
  -H "Content-Type: application/json" \
  -d '{
    "target_url": "https://api.ipify.org?format=json",
    "target_method": "GET",
    "response_type": "json"
  }'
```

## 微信支付白名单配置

### 1. 登录微信支付商户平台

访问：https://pay.weixin.qq.com

### 2. 添加 IP 白名单

1. 进入 **账户中心** → **API安全** → **IP白名单**
2. 点击 **添加IP**
3. 输入服务器 IP：`115.159.35.33`
4. 保存配置

### 3. 等待生效

IP 白名单配置通常需要 5-10 分钟生效。

## uniCloud 云函数使用

### 1. 在云函数中引入代理助手

```javascript
const HttpProxyHelper = require('http-proxy-helper');

// 创建代理实例
const proxy = new HttpProxyHelper({
    host: '115.159.35.33',
    port: 8888,
    protocol: 'http'
});
```

### 2. 使用代理发送请求

#### 通用 HTTP 请求

```javascript
// 通过代理发送请求
const result = await proxy.request({
    url: 'https://api.mch.weixin.qq.com/pay/unifiedorder',
    method: 'POST',
    headers: {
        'Content-Type': 'application/xml'
    },
    data: xmlData,
    dataType: 'text'
});
```

#### 微信支付 V2 请求

```javascript
const result = await proxy.wxpayRequest({
    url: 'https://api.mch.weixin.qq.com/pay/unifiedorder',
    method: 'POST',
    data: xmlData
});
```

#### 微信支付 V3 请求

```javascript
const result = await proxy.wxpayV3Request({
    url: 'https://api.mch.weixin.qq.com/v3/transfer/batches',
    method: 'POST',
    headers: {
        'Authorization': `WECHATPAY2-SHA256-RSA2048 ${authString}`
    },
    data: jsonData
});
```

## 完整使用示例

### 砍价返现功能集成

在 `cashback-handler-v3.js` 中使用代理：

```javascript
const HttpProxyHelper = require('http-proxy-helper');

class CashbackHandlerV3 {
    constructor() {
        // 初始化代理
        this.proxy = new HttpProxyHelper({
            host: '115.159.35.33',
            port: 8888,
            protocol: 'http'
        });
        
        // ... 其他配置
    }

    async transferToBalance(params) {
        const { openid, amount, desc, user_name } = params;
        
        // 构建请求数据
        const requestData = {
            appid: this.config.appid,
            out_batch_no: this.generateBatchNo(),
            batch_name: desc,
            batch_remark: desc,
            total_amount: amount,
            total_num: 1,
            transfer_detail_list: [{
                out_detail_no: this.generateDetailNo(),
                transfer_amount: amount,
                transfer_remark: desc,
                openid: openid,
                user_name: user_name ? this.encryptUserName(user_name) : undefined
            }]
        };

        // 生成签名
        const authorization = this.generateV3Signature({
            method: 'POST',
            url: '/v3/transfer/batches',
            body: JSON.stringify(requestData)
        });

        // 通过代理发送请求
        const result = await this.proxy.wxpayV3Request({
            url: 'https://api.mch.weixin.qq.com/v3/transfer/batches',
            method: 'POST',
            headers: {
                'Authorization': authorization,
                'Wechatpay-Serial': this.config.serial_no
            },
            data: requestData
        });

        return result;
    }
}
```

## 监控与维护

### 查看服务日志

```bash
# PM2 日志
pm2 logs unicloud-proxy

# 实时日志
pm2 logs unicloud-proxy --lines 100

# 错误日志
pm2 logs unicloud-proxy --err
```

### 重启服务

```bash
# 重启代理服务
pm2 restart unicloud-proxy

# 重载配置（无缝重启）
pm2 reload unicloud-proxy
```

### 性能监控

```bash
# 查看服务状态
pm2 status

# 查看详细信息
pm2 show unicloud-proxy

# 监控面板
pm2 monit
```

## 故障排查

### 1. 服务无法启动

```bash
# 检查端口是否被占用
netstat -tulpn | grep 8888

# 检查 Node.js 版本
node -v  # 需要 v14 或更高版本

# 检查依赖是否安装
npm list
```

### 2. 请求超时

```bash
# 检查服务器网络
ping api.mch.weixin.qq.com

# 检查防火墙规则
sudo iptables -L -n

# 检查代理服务日志
pm2 logs unicloud-proxy
```

### 3. 微信支付报错

- 确认 IP 已添加到白名单
- 检查 IP 白名单是否生效（需要等待 5-10 分钟）
- 使用 `curl http://115.159.35.33:8888/ip` 确认出口 IP
- 查看代理服务器日志确认请求是否成功转发

## 安全建议

### 1. 限制访问来源

修改 `proxy-server.js`，添加 IP 白名单：

```javascript
// 允许的来源 IP（uniCloud 服务器 IP）
const ALLOWED_IPS = [
    '120.76.xxx.xxx',  // uniCloud 阿里云 IP 范围
    '47.96.xxx.xxx'
];

app.use((req, res, next) => {
    const clientIP = req.ip || req.connection.remoteAddress;
    
    if (!ALLOWED_IPS.some(ip => clientIP.includes(ip))) {
        return res.status(403).json({
            success: false,
            error: '访问被拒绝'
        });
    }
    
    next();
});
```

### 2. 添加认证

```javascript
// API 密钥认证
const API_KEY = 'your-secret-key';

app.use('/proxy', (req, res, next) => {
    const authHeader = req.headers['authorization'];
    
    if (authHeader !== `Bearer ${API_KEY}`) {
        return res.status(401).json({
            success: false,
            error: '未授权'
        });
    }
    
    next();
});
```

### 3. 请求限流

```bash
# 安装限流中间件
npm install express-rate-limit

# 在 proxy-server.js 中配置
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 分钟
    max: 100 // 限制 100 次请求
});

app.use('/proxy', limiter);
```

## 成本说明

- **服务器成本**：使用已有服务器，无额外成本
- **流量成本**：根据实际请求量计费，微信支付请求量通常不大
- **维护成本**：使用 PM2 自动管理，维护成本低

## 技术支持

如有问题，请检查：
1. 服务器日志：`pm2 logs unicloud-proxy`
2. 防火墙配置
3. 微信支付白名单设置
4. 网络连通性

## 备份方案

如果固定 IP 方案不可用，可以考虑：
1. 使用 uniCloud 的云对云接入
2. 定期更新微信支付白名单（通过脚本自动化）
3. 联系 uniCloud 官方申请固定 IP（企业版功能）
