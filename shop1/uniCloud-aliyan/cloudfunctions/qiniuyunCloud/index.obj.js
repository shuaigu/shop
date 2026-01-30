// 云对象代码（qiniu.obj.js）
const qiniu = require('qiniu'); // 需在云对象所在目录安装七牛云 SDK

// 七牛云配置
const config = {
    ACCESS_KEY: 'o-XHmyZU6d5inMWWdJFlSGWQQnJts6KfgTuOFV1B',
    SECRET_KEY: 'J-YxhHHto_N2w_nUs87OHZ3Zi7ezNygiJDW1yawR',
    BUCKET: 'uniapp2',
    DOMAIN: 'https://aly2.jingle0350.cn',
    UPLOAD_DOMAIN: 'http://up-z1.qiniup.com'
};

// 视频转码配置
const videoTranscode = {
    styleName: 'qiniuyunzhuanma.m3u8', // 转码样式名称
    fops: 'avthumb/m3u8/segtime/10/vcodec/libx264/acodec/libfdk_aac', // 转码指令
    pipeline: 'video-pipeline', // 转码队列名称
};

// 样式分隔符 - 必须与七牛云控制台设置的一致
const styleSeparator = '-';

// 添加连接管理器 - 全局单例
const connectionManager = {
  activeConnections: 0,
  maxConnections: 5, // 设置为远小于微信小程序限制的值(10)
  queue: [],
  
  async acquire() {
    console.log(`当前活跃连接数: ${this.activeConnections}, 队列长度: ${this.queue.length}`);
    
    if (this.activeConnections < this.maxConnections) {
      this.activeConnections++;
      console.log(`获取连接成功，当前活跃连接数: ${this.activeConnections}`);
      return true;
    }
    
    console.log(`连接数已达上限，加入等待队列`);
    // 如果连接数已达上限，则等待
    return new Promise(resolve => {
      this.queue.push(resolve);
    });
  },
  
  release() {
    if (this.queue.length > 0) {
      // 如果队列中有等待的任务，则唤醒一个
      const resolve = this.queue.shift();
      console.log(`释放连接，唤醒队列中的任务，当前活跃连接数保持: ${this.activeConnections}`);
      resolve(true);
    } else {
      this.activeConnections--;
      console.log(`释放连接，当前活跃连接数: ${this.activeConnections}`);
    }
  }
};

module.exports = {
  // 生成上传凭证
  async generateUploadToken(fileInfo, userInfo) {
    try {
      const mac = new qiniu.auth.digest.Mac(config.ACCESS_KEY, config.SECRET_KEY);
      
      const fileType = fileInfo && fileInfo.type ? fileInfo.type : 'image';
      const fileExt = fileInfo && fileInfo.ext ? fileInfo.ext : (fileType === 'video' ? 'mp4' : 'jpg');
      
      console.log('文件信息:', { fileType, fileExt, userId: fileInfo?.userId });
      
      // 根据文件类型生成路径
      let fileKey;
      const date = new Date();
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).slice(2, 10);
      
      if (fileType === 'avatar') {
        // 头像上传到 2025/touxiang/ 目录
        fileKey = `${year}/touxiang/${timestamp}_${randomStr}.${fileExt}`;
        console.log('头像上传路径:', fileKey);
      } else if (fileType === 'video') {
        // 视频使用日期格式
        fileKey = `${year}/shipin/${year}${month}${day}/${timestamp}_${randomStr}.${fileExt}`;
      } else {
        // 其他图片使用日期格式
        fileKey = `${year}/tupian/${year}${month}${day}/${timestamp}_${randomStr}.${fileExt}`;
      }
      
      console.log('生成的文件路径:', fileKey);
      
      // 基本上传策略 - 修复scope格式
      const options = {
        scope: config.BUCKET, // 使用简单模式，不指定文件名，避免冲突
        expires: fileType === 'video' ? 14400 : 3600,
        returnBody: '{"key":"$(key)","hash":"$(etag)","size":$(fsize),"mimeType":"$(mimeType)","width":"$(imageInfo.width)","height":"$(imageInfo.height)","duration":"$(avinfo.video.duration)"}'
      };

      if (fileType === 'video') {
        // 配置视频文件的上传参数
        options.fsizeLimit = 500 * 1024 * 1024; // 500MB
        options.chunkSize = 4 * 1024 * 1024;    // 4MB
        
        // 简化持久化操作配置，避免错误
        // 注释掉可能导致问题的持久化操作
        /*
        const saveasKey = `${fileKey.substring(0, fileKey.lastIndexOf('.'))}.m3u8`;
        const encodedSaveasKey = qiniu.util.urlsafeBase64Encode(saveasKey);
        const encodedBucket = qiniu.util.urlsafeBase64Encode(config.BUCKET);
        
        // 设置转码指令
        options.persistentOps = `${videoTranscode.fops}|saveas/${encodedBucket}:${encodedSaveasKey}`;
        options.persistentPipeline = videoTranscode.pipeline;
        */
      }

      const putPolicy = new qiniu.rs.PutPolicy(options);
      const uploadToken = putPolicy.uploadToken(mac);

      let response = {
        token: uploadToken,
        domain: config.DOMAIN,
        uploadDomain: config.UPLOAD_DOMAIN,
        key: fileKey
      };
      
      if (fileType === 'video') {
        // 添加视频转码信息
        response.videoStyle = videoTranscode.styleName;
        response.styleSeparator = styleSeparator;
        // 不再返回m3u8Key，避免混淆
      }

      console.log('生成上传凭证成功，配置信息:', response);
      return response;
    } catch (error) {
      console.error('获取上传凭证失败：', error);
      throw new Error('获取上传凭证失败：' + error.message);
    }
  },

  // 上传文件到七牛云并返回URL
  async uploadFile(fileBuffer, fileInfo) {
    try {
      console.log('开始上传文件，尝试获取连接许可');
      // 获取连接许可
      await connectionManager.acquire();
      
      try {
        console.log('获取连接许可成功，开始上传文件');
        // 获取上传凭证
        const uploadConfig = await this.generateUploadToken(fileInfo);
        
        // 创建表单上传对象
        const formUploader = new qiniu.form_up.FormUploader(new qiniu.conf.Config());
        const putExtra = new qiniu.form_up.PutExtra();
        
        // 执行上传
        return new Promise((resolve, reject) => {
          formUploader.put(uploadConfig.token, uploadConfig.key, fileBuffer, putExtra, (err, body, info) => {
            // 释放连接
            console.log('上传完成，释放连接');
            connectionManager.release();
            
            if (err) {
              console.error('上传失败:', err);
              reject(err);
              return;
            }
            
            if (info.statusCode === 200) {
              const fileUrl = `${config.DOMAIN}/${body.key}`;
              let result = {
                originalUrl: fileUrl,
                key: body.key
              };
              
              // 如果是视频，添加转码后的URL
              if (fileInfo.type === 'video') {
                result.m3u8Url = `${config.DOMAIN}/${uploadConfig.videoStyle}${styleSeparator}${uploadConfig.styleSeparator}${uploadConfig.key}`;
                result.thumbnailUrl = `${fileUrl}?vframe/jpg/offset/1`; // 获取视频首帧作为封面
              }
              
              resolve(result);
            } else {
              reject(new Error(`上传失败: ${info.statusCode}`));
            }
          });
        });
      } catch (error) {
        // 确保在出错时也释放连接
        console.error('上传过程中出错，释放连接:', error);
        connectionManager.release();
        throw error;
      }
    } catch (error) {
      throw new Error('文件上传失败：' + error.message);
    }
  },

  // 获取视频转码状态
  async getTranscodeStatus(persistentId) {
    try {
      const mac = new qiniu.auth.digest.Mac(config.ACCESS_KEY, config.SECRET_KEY);
      const operationManager = new qiniu.fop.OperationManager(mac, new qiniu.conf.Config());
      
      return new Promise((resolve, reject) => {
        operationManager.prefop(persistentId, (err, respBody, respInfo) => {
          if (err) {
            reject(err);
            return;
          }
          
          if (respInfo.statusCode === 200) {
            resolve({
              status: respBody.code === 0 ? 'success' : 'processing',
              info: respBody
            });
          } else {
            reject(new Error('获取转码状态失败'));
          }
        });
      });
    } catch (error) {
      throw new Error('获取转码状态失败：' + error.message);
    }
  },

  // 删除文件
  async deleteFile(fileKey) {
    try {
      const mac = new qiniu.auth.digest.Mac(config.ACCESS_KEY, config.SECRET_KEY);
      const conf = new qiniu.conf.Config();
      const bucketManager = new qiniu.rs.BucketManager(mac, conf);

      return new Promise((resolve, reject) => {
        bucketManager.delete(config.BUCKET, fileKey, (err, respBody, respInfo) => {
          if (err) {
            reject(err);
          } else {
            resolve({
              success: true,
              respInfo
            });
          }
        });
      });
    } catch (error) {
      throw new Error('删除文件失败：' + error.message);
    }
  },

  // 生成m3u8播放地址
  generateM3U8URL(fileKey) {
    if (!fileKey) return null;
    
    // 使用样式访问方式
    const styleUrl = `${config.DOMAIN}/${fileKey}${styleSeparator}${videoTranscode.styleName}`;
    
    return styleUrl;
  },

  // 获取当前连接状态 - 添加此方法用于调试
  getConnectionStatus() {
    return {
      activeConnections: connectionManager.activeConnections,
      maxConnections: connectionManager.maxConnections,
      queueLength: connectionManager.queue.length
    };
  },
  
  // 上传头像到七牛云（从 uniCloud 同步）
  async uploadAvatarToQiniu(params) {
    try {
      const { cloudPath, fileID } = params;
      console.log('👤 开始上传头像到七牛云, cloudPath:', cloudPath, 'fileID:', fileID);
      
      // 1. 从 uniCloud 下载文件
      const result = await uniCloud.getTempFileURL({
        fileList: [fileID]
      });
      
      if (!result.fileList || !result.fileList[0] || !result.fileList[0].tempFileURL) {
        throw new Error('获取临时文件URL失败');
      }
      
      const tempFileURL = result.fileList[0].tempFileURL;
      console.log('✅ 获取临时URL成功:', tempFileURL);
      
      // 2. 下载文件内容
      const downloadRes = await uniCloud.httpclient.request(tempFileURL, {
        method: 'GET',
        dataType: 'text',
        responseType: 'arraybuffer'
      });
      
      if (downloadRes.status !== 200) {
        throw new Error(`下载文件失败: ${downloadRes.status}`);
      }
      
      const fileBuffer = Buffer.from(downloadRes.data);
      console.log('✅ 下载文件成功, 大小:', fileBuffer.length, 'bytes');
      
      // 3. 生成七牛云上传凭证（使用avatar路径）
      const mac = new qiniu.auth.digest.Mac(config.ACCESS_KEY, config.SECRET_KEY);
      
      // 使用相同的cloudPath，确保路径一致
      const fileKey = cloudPath; // 例如：touxiang/123_1234567890.jpg
      
      const options = {
        scope: config.BUCKET,
        expires: 3600,
        returnBody: '{"key":"$(key)","hash":"$(etag)","size":$(fsize)}'
      };
      
      const putPolicy = new qiniu.rs.PutPolicy(options);
      const uploadToken = putPolicy.uploadToken(mac);
      
      // 4. 上传到七牛云
      const formUploader = new qiniu.form_up.FormUploader(new qiniu.conf.Config());
      const putExtra = new qiniu.form_up.PutExtra();
      
      return new Promise((resolve, reject) => {
        formUploader.put(uploadToken, fileKey, fileBuffer, putExtra, (err, body, info) => {
          if (err) {
            console.error('❌ 上传到七牛云失败:', err);
            reject(err);
            return;
          }
          
          if (info.statusCode === 200) {
            const fileUrl = `${config.DOMAIN}/${body.key}`;
            console.log('✅ 上传到七牛云成功, URL:', fileUrl);
            resolve({
              success: true,
              url: fileUrl,
              key: body.key
            });
          } else {
            reject(new Error(`上传失败: ${info.statusCode}`));
          }
        });
      });
    } catch (error) {
      console.error('❌ 上传头像到七牛云失败:', error);
      throw new Error('上传头像到七牛云失败：' + error.message);
    }
  }

  // 七牛云回调配置（控制台设置回调 URL 到云对象接口）
// async uploadCallbackHandler(callbackData) {
//   // 验证回调签名（防伪造）
//   const isValid = qiniu.util.isQiniuCallback(
//     this.getHttpInfo().headers, 
//     callbackData, 
//     'your-callback-secret'
//   );
//   if (!isValid) throw new Error('非法回调');

//   // 处理业务逻辑（如记录文件信息到数据库）
//   await db.collection('files').add(callbackData);
// }

};


