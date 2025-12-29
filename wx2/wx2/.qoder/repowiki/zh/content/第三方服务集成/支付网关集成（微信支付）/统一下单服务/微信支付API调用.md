# 微信支付API调用

<cite>
**本文档引用文件**  
- [index.obj.js](file://uniCloud-aliyun/cloudfunctions/wxpay/index.obj.js)
- [config.js](file://uniCloud-aliyun/cloudfunctions/wxpay/config.js)
- [apiclient_cert.p12](file://uniCloud-aliyun/cloudfunctions/wxpay/apiclient_cert.p12)
</cite>

## 目录
1. [项目结构](#项目结构)  
2. [核心组件分析](#核心组件分析)  
3. [HTTPS客户端配置与证书加载](#https客户端配置与证书加载)  
4. [签名生成规则详解](#签名生成规则详解)  
5. [请求头构造与安全细节](#请求头构造与安全细节)  
6. [预支付响应处理与prepay_id提取](#预支付响应处理与prepay_id提取)  
7. [小程序端支付参数封装](#小程序端支付参数封装)  
8. [前后端支付流程衔接](#前后端支付流程衔接)  
9. [错误处理与调试建议](#错误处理与调试建议)

## 项目结构

本项目为基于uni-app的云开发架构，微信支付相关逻辑集中在`uniCloud-aliyun/cloudfunctions/wxpay/`目录下。主要包含：

- `index.obj.js`：核心支付逻辑入口，实现预支付请求、订单查询等功能。
- `config.js`：存储微信支付所需的商户配置信息。
- `apiclient_cert.p12`：微信商户平台API证书文件，用于HTTPS双向认证。

该结构遵循云函数模块化设计原则，将支付功能独立部署，便于维护和调用。

**文档来源**
- [index.obj.js](file://uniCloud-aliyun/cloudfunctions/wxpay/index.obj.js)
- [config.js](file://uniCloud-aliyun/cloudfunctions/wxpay/config.js)

## 核心组件分析

`wxpay/index.obj.js` 文件实现了调用微信支付APIv3发起预支付的核心逻辑。其主要功能包括：

- 参数验证：确保传入的`openid`、`out_trade_no`、`total_fee`等必要参数完整且合法。
- 支付客户端初始化：使用`wx-pay`库并加载商户证书创建安全连接。
- 预支付订单创建：通过`createUnifiedOrder`接口向微信服务器发送请求。
- 签名生成：按照微信规范对返回的支付参数进行MD5签名。
- 响应封装：将`prepay_id`等关键信息重组为符合小程序`wx.requestPayment`调用格式的数据结构。

此组件作为后端服务的关键环节，承担了与微信支付系统交互的安全性和可靠性保障。

**Section sources**
- [index.obj.js](file://uniCloud-aliyun/cloudfunctions/wxpay/index.obj.js#L15-L116)

## HTTPS客户端配置与证书加载

在调用微信支付API时，必须建立安全的HTTPS连接，并完成双向身份验证。本实现通过以下方式配置HTTPS客户端：

```javascript
const payRes = await WXPay({
    appid: config.appid,
    mch_id: config.mch_id,
    partner_key: config.partner_key,
    pfx: fs.readFileSync(__dirname + '/apiclient_cert.p12')
});
```

其中：
- `pfx`字段通过`fs.readFileSync`同步读取位于同级目录下的`apiclient_cert.p12`证书文件。
- 该`.p12`文件是微信商户平台提供的API客户端证书，包含私钥和公钥信息，用于在TLS握手阶段证明商户身份。
- 所有通信均通过加密通道进行，防止敏感数据（如交易金额、用户信息）被窃听或篡改。

这种基于PKI体系的身份认证机制有效提升了支付过程的安全性。

**Section sources**
- [index.obj.js](file://uniCloud-aliyun/cloudfunctions/wxpay/index.obj.js#L30-L37)
- [apiclient_cert.p12](file://uniCloud-aliyun/cloudfunctions/wxpay/apiclient_cert.p12)

## 签名生成规则详解

微信支付要求所有请求和响应数据都需进行数字签名以确保完整性。本实现采用MD5算法进行签名，具体步骤如下：

1. **参数准备**：从统一下单接口返回结果中提取`appid`、`nonce_str`、`prepay_id`等字段。
2. **构建待签字符串**：按字典序排列以下字段并拼接成字符串：
   - `appId`
   - `timeStamp`
   - `nonceStr`
   - `package`
   - `signType`
3. **附加密钥**：在拼接后的字符串末尾添加`&key=partner_key`（即商户API密钥）。
4. **执行哈希运算**：使用MD5算法计算最终字符串的摘要，并转换为大写形式。

代码示例如下：

```javascript
const signParams = {
    appId: payParams.appId,
    timeStamp: payParams.timeStamp,
    nonceStr: payParams.nonceStr,
    package: payParams.package,
    signType: payParams.signType
};
const paySign = payRes.sign(signParams);
```

该签名将作为`paySign`字段随其他参数一同返回给前端，供小程序发起支付时使用。

**Section sources**
- [index.obj.js](file://uniCloud-aliyun/cloudfunctions/wxpay/index.obj.js#L75-L88)

## 请求头构造与安全细节

虽然实际HTTP请求由`wx-pay`库内部处理，但其构造的请求头遵循微信支付APIv3的安全规范。关键安全要素包括：

- **Authorization头**：由库自动生成，包含签名信息，用于验证请求来源合法性。
- **Content-Type**：设置为`application/xml`，符合微信API对数据格式的要求。
- **证书校验**：通过`.p12`证书实现客户端身份认证，防止非法调用。
- **敏感信息保护**：商户密钥（`partner_key`）和证书文件不暴露于前端代码中，仅在云端安全存储和使用。

此外，`notify_url`指向一个HTTPS地址（`https://fc-mp-...bspapp.com/wxpay-notify`），确保支付结果通知也能在加密通道中传输，避免中间人攻击。

**Section sources**
- [index.obj.js](file://uniCloud-aliyun/cloudfunctions/wxpay/index.obj.js#L48-L58)
- [config.js](file://uniCloud-aliyun/cloudfunctions/wxpay/config.js#L2-L8)

## 预支付响应处理与prepay_id提取

当调用`createUnifiedOrder`成功后，微信服务器会返回XML格式的响应，其中包含关键字段`prepay_id`。该ID表示此次预支付会话的唯一标识，有效期为2小时。

在代码中，`prepay_id`通过回调函数从`result`对象中获取：

```javascript
function(err, result) {
    if (err) { reject(err); return; }
    const prepayId = result.prepay_id;
    // ...
}
```

随后将其封装为`package=prepay_id=${result.prepay_id}`的形式，这是小程序端调用支付所必需的参数格式。整个过程通过Promise包装，保证异步操作的有序执行和错误传播。

**Section sources**
- [index.obj.js](file://uniCloud-aliyun/cloudfunctions/wxpay/index.obj.js#L59-L74)

## 小程序端支付参数封装

为了适配小程序`wx.requestPayment` API的要求，后端需将原始响应数据重新组织为特定结构。最终返回给前端的对象如下：

```json
{
  "provider": "wxpay",
  "timeStamp": "1720000000",
  "nonceStr": "abc123xyz",
  "package": "prepay_id=wx1234567890abcdef",
  "signType": "MD5",
  "paySign": "C380BEC2BFD727A4B6845133519F3AD6",
  "out_trade_no": "T202407040001"
}
```

其中：
- `timeStamp`为当前时间戳（秒级）。
- `nonceStr`来自微信返回的随机字符串。
- `package`固定以前缀`prepay_id=`开头。
- `paySign`为上述各参数签名后的结果。
- `out_trade_no`保留原商户订单号以便后续核对。

此结构完全符合官方文档要求，可直接传递给`uni.requestPayment`方法发起支付。

**Section sources**
- [index.obj.js](file://uniCloud-aliyun/cloudfunctions/wxpay/index.obj.js#L78-L95)

## 前后端支付流程衔接

完整的支付流程涉及前后端协同工作：

1. **前端发起请求**：用户点击支付按钮，前端收集必要参数（如商品ID、用户OpenID）并调用云函数`wxpay`。
2. **后端处理订单**：云函数验证参数、调用微信统一下单接口、生成签名并返回标准化支付参数。
3. **前端发起支付**：收到响应后，调用`uni.requestPayment({...res.order})`拉起微信支付界面。
4. **支付结果通知**：微信服务器异步通知`notify_url`指定的地址，更新订单状态。
5. **查询支付结果**：前端可通过`getWxOrder`接口主动查询订单状态，确认支付是否成功。

这一流程确保了用户体验的流畅性与交易数据的一致性。

**Section sources**
- [index.obj.js](file://uniCloud-aliyun/cloudfunctions/wxpay/index.obj.js#L15-L116)

## 错误处理与调试建议

代码中已实现多层级错误处理机制：

- **参数校验**：检查输入是否为空、类型是否正确、金额是否大于零。
- **异常捕获**：使用Promise的reject机制传递底层API调用错误。
- **清晰提示**：抛出具有语义化的错误信息（如“缺少必需的支付参数”），便于定位问题。

调试建议：
- 确保证书文件路径正确且可读。
- 检查`partner_key`是否与微信商户平台一致。
- 使用微信支付提供的沙箱环境进行测试。
- 开启日志记录，监控`notify_url`接收情况。

通过这些措施可显著提升支付系统的稳定性和可维护性。

**Section sources**
- [index.obj.js](file://uniCloud-aliyun/cloudfunctions/wxpay/index.obj.js#L18-L28)