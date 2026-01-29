/**
 * 商家转账配置脚本
 * 自动获取证书序列号和平台证书，生成完整配置
 */

const crypto = require('crypto');
const https = require('https');
const fs = require('fs');
const path = require('path');

// ========== 配置信息 ==========
const config = {
  appid: 'wxf7ee79349bd957b8',                // 小程序APPID
  mchid: '1545803671',                        // 商户号
  apiv3_key: 'lishuai4323811lishuai4323811lish', // APIv3密钥（32位）
  
  // 证书文件路径
  cert_dir: path.join(__dirname, '1545803671_20250301_cert'),
  cert_file: 'apiclient_cert.pem',
  key_file: 'apiclient_key.pem'
};

console.log('🚀 开始配置商家转账功能...\n');

// ========== 步骤1：读取商户私钥 ==========
console.log('📖 步骤1：读取商户私钥...');
const keyPath = path.join(config.cert_dir, config.key_file);
const privateKey = fs.readFileSync(keyPath, 'utf8');
console.log('✅ 私钥读取成功！');
console.log(`   长度: ${privateKey.length} 字符\n`);

// ========== 步骤2：获取证书序列号 ==========
console.log('📖 步骤2：获取证书序列号...');
const certPath = path.join(config.cert_dir, config.cert_file);
const certContent = fs.readFileSync(certPath, 'utf8');
const cert = crypto.X509Certificate ? new crypto.X509Certificate(certContent) : null;

let serialNo;
if (cert && cert.serialNumber) {
  // Node.js 15.6.0+ 支持
  serialNo = cert.serialNumber.replace(/:/g, '').toUpperCase();
} else {
  // 兼容旧版本Node.js
  const certLines = certContent.split('\n').filter(line => 
    !line.includes('BEGIN') && !line.includes('END')
  ).join('');
  const certBuffer = Buffer.from(certLines, 'base64');
  // 简单提取（实际应该解析ASN.1，但这里用简化方法）
  const serialMatch = certBuffer.toString('hex').match(/0209([0-9a-f]{40})/i);
  serialNo = serialMatch ? serialMatch[1].toUpperCase() : '请手动获取';
}

console.log('✅ 证书序列号:', serialNo);
console.log('');

// ========== 步骤3：获取平台证书 ==========
console.log('📖 步骤3：获取微信平台证书...');
console.log('   正在请求微信API...');

getPlatformCertificate(config, privateKey, serialNo)
  .then(platformCert => {
    console.log('✅ 平台证书获取成功！\n');
    
    // ========== 生成最终配置 ==========
    console.log('📝 生成配置文件...');
    const configContent = generateConfigFile({
      appid: config.appid,
      mchid: config.mchid,
      serial_no: serialNo,
      apiv3_key: config.apiv3_key,
      private_key: privateKey,
      platform_cert: platformCert
    });
    
    // 保存配置文件
    const configPath = path.join(__dirname, 'wx2', 'uniCloud-aliyun', 'cloudfunctions', 'articleWx', 'cashback-config.js');
    fs.writeFileSync(configPath, configContent, 'utf8');
    console.log('✅ 配置文件已保存:', configPath);
    console.log('');
    
    // 显示配置摘要
    console.log('========== 配置完成 ==========\n');
    console.log('✅ 小程序APPID:', config.appid);
    console.log('✅ 商户号:', config.mchid);
    console.log('✅ 证书序列号:', serialNo);
    console.log('✅ APIv3密钥: ***已配置***');
    console.log('✅ 商户私钥: ***已配置***');
    console.log('✅ 平台证书: ***已配置***');
    console.log('');
    console.log('========== 下一步 ==========\n');
    console.log('1. 在 cashback-handler-v3.js 中引用配置：');
    console.log('   const config = require(\'./cashback-config.js\');');
    console.log('');
    console.log('2. 测试转账功能（在uniCloud控制台）：');
    console.log('   const articleWx = uniCloud.importObject(\'articleWx\');');
    console.log('   await articleWx.processCashback(\'record_id\', \'user_id\');');
    console.log('');
    console.log('3. 配置定时任务：');
    console.log('   触发器: 0 * * * * * * (每分钟)');
    console.log('   方法: batchProcessCashbacks');
    console.log('');
    console.log('🎉 配置完成！祝您使用愉快！');
  })
  .catch(err => {
    console.error('❌ 获取平台证书失败:', err.message);
    console.log('');
    console.log('⚠️  没关系，您可以稍后手动获取平台证书。');
    console.log('   当前已配置的信息：');
    console.log('   - 商户号:', config.mchid);
    console.log('   - 证书序列号:', serialNo);
    console.log('   - 商户私钥: 已读取');
    console.log('');
    console.log('   获取平台证书的方法：');
    console.log('   1. 使用微信支付官方工具');
    console.log('   2. 或稍后使用 getCertificates.js 脚本');
  });

// ========== 获取平台证书 ==========
async function getPlatformCertificate(config, privateKey, serialNo) {
  return new Promise((resolve, reject) => {
    const url = 'https://api.mch.weixin.qq.com/v3/certificates';
    const timestamp = Math.floor(Date.now() / 1000);
    const nonce_str = crypto.randomBytes(16).toString('hex');
    
    // 构建签名串
    const signStr = `GET\n/v3/certificates\n${timestamp}\n${nonce_str}\n\n`;
    
    // 生成签名
    const sign = crypto.createSign('RSA-SHA256');
    sign.update(signStr);
    const signature = sign.sign(privateKey, 'base64');
    
    // 构建Authorization
    const authorization = `WECHATPAY2-SHA256-RSA2048 mchid="${config.mchid}",nonce_str="${nonce_str}",signature="${signature}",timestamp="${timestamp}",serial_no="${serialNo}"`;
    
    // 发送请求
    const req = https.request(url, {
      method: 'GET',
      headers: {
        'Authorization': authorization,
        'Accept': 'application/json',
        'User-Agent': 'CashbackSetup/1.0'
      }
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          if (result.data && result.data.length > 0) {
            // 解密证书
            const encryptedCert = result.data[0].encrypt_certificate;
            const decrypted = decryptCertificate(
              encryptedCert.ciphertext,
              encryptedCert.nonce,
              encryptedCert.associated_data,
              config.apiv3_key
            );
            resolve(decrypted);
          } else {
            reject(new Error('响应数据格式错误: ' + data));
          }
        } catch (e) {
          reject(new Error('解析响应失败: ' + e.message));
        }
      });
    });
    
    req.on('error', reject);
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('请求超时'));
    });
    req.end();
  });
}

// ========== 解密证书 ==========
function decryptCertificate(ciphertext, nonce, associated_data, key) {
  const cipherBuffer = Buffer.from(ciphertext, 'base64');
  const authTag = cipherBuffer.slice(-16);
  const encryptedData = cipherBuffer.slice(0, -16);
  
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, nonce);
  decipher.setAuthTag(authTag);
  decipher.setAAD(Buffer.from(associated_data));
  
  let decrypted = decipher.update(encryptedData, null, 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

// ========== 生成配置文件 ==========
function generateConfigFile(params) {
  return `/**
 * 商家转账配置文件
 * 自动生成于: ${new Date().toLocaleString('zh-CN')}
 */

module.exports = {
  appid: '${params.appid}',
  mchid: '${params.mchid}',
  serial_no: '${params.serial_no}',
  apiv3_key: '${params.apiv3_key}',
  
  // 商户私钥
  private_key: \`${params.private_key}\`,
  
  // 平台证书
  platform_cert: \`${params.platform_cert}\`,
  
  // 转账场景ID（根据您的商户平台配置）
  transfer_scene_id: '1001' // 分销返佣
};
`;
}
