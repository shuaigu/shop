#!/bin/bash

# uniCloud 固定 IP 代理服务器快速部署脚本
# 适用于 CentOS/Ubuntu Linux 系统

echo "======================================"
echo "  uniCloud 固定 IP 代理服务器部署"
echo "======================================"
echo ""

# 检查是否为 root 用户
if [ "$EUID" -ne 0 ]; then 
    echo "⚠️  请使用 root 权限运行此脚本"
    echo "   sudo bash deploy.sh"
    exit 1
fi

# 1. 检查并安装 Node.js
echo "📦 检查 Node.js..."
if ! command -v node &> /dev/null; then
    echo "   未检测到 Node.js，正在安装..."
    
    # 检测系统类型
    if [ -f /etc/redhat-release ]; then
        # CentOS/RHEL
        curl -sL https://rpm.nodesource.com/setup_16.x | bash -
        yum install -y nodejs
    elif [ -f /etc/debian_version ]; then
        # Ubuntu/Debian
        curl -sL https://deb.nodesource.com/setup_16.x | bash -
        apt-get install -y nodejs
    else
        echo "❌ 不支持的系统类型，请手动安装 Node.js"
        exit 1
    fi
else
    echo "   ✅ Node.js 已安装: $(node -v)"
fi

# 2. 检查并安装 npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm 未安装"
    exit 1
else
    echo "   ✅ npm 已安装: $(npm -v)"
fi

# 3. 创建项目目录
PROJECT_DIR="/www/unicloud-proxy"
echo ""
echo "📁 创建项目目录: $PROJECT_DIR"
mkdir -p $PROJECT_DIR
cd $PROJECT_DIR

# 4. 创建 package.json
echo ""
echo "📝 创建 package.json..."
cat > package.json << 'EOF'
{
  "name": "unicloud-proxy-server",
  "version": "1.0.0",
  "description": "固定 IP 代理服务器，用于转发 uniCloud 请求",
  "main": "proxy-server.js",
  "scripts": {
    "start": "node proxy-server.js",
    "pm2:start": "pm2 start proxy-server.js --name unicloud-proxy",
    "pm2:stop": "pm2 stop unicloud-proxy",
    "pm2:restart": "pm2 restart unicloud-proxy",
    "pm2:logs": "pm2 logs unicloud-proxy"
  },
  "dependencies": {
    "express": "^4.18.2",
    "axios": "^1.6.0",
    "body-parser": "^1.20.2"
  },
  "keywords": [
    "proxy",
    "unicloud",
    "wxpay",
    "fixed-ip"
  ],
  "author": "",
  "license": "ISC"
}
EOF

echo "   ✅ package.json 创建成功"

# 5. 安装依赖
echo ""
echo "📦 安装项目依赖..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ 依赖安装失败"
    exit 1
fi

echo "   ✅ 依赖安装成功"

# 6. 安装 PM2（进程管理器）
echo ""
echo "📦 安装 PM2..."
if ! command -v pm2 &> /dev/null; then
    npm install -g pm2
    echo "   ✅ PM2 安装成功"
else
    echo "   ✅ PM2 已安装"
fi

# 7. 配置防火墙
echo ""
echo "🔥 配置防火墙..."

# 检测防火墙类型
if command -v firewall-cmd &> /dev/null; then
    # firewalld (CentOS/RHEL)
    echo "   检测到 firewalld"
    firewall-cmd --zone=public --add-port=8888/tcp --permanent
    firewall-cmd --reload
    echo "   ✅ 已开放 8888 端口"
elif command -v ufw &> /dev/null; then
    # ufw (Ubuntu/Debian)
    echo "   检测到 ufw"
    ufw allow 8888/tcp
    echo "   ✅ 已开放 8888 端口"
else
    echo "   ⚠️  未检测到防火墙，请手动开放 8888 端口"
fi

# 8. 提示下一步操作
echo ""
echo "======================================"
echo "  ✅ 基础环境部署完成"
echo "======================================"
echo ""
echo "📋 下一步操作："
echo ""
echo "1. 将 proxy-server.js 文件上传到："
echo "   $PROJECT_DIR/proxy-server.js"
echo ""
echo "2. 启动服务："
echo "   cd $PROJECT_DIR"
echo "   npm run pm2:start"
echo ""
echo "3. 查看服务状态："
echo "   pm2 status"
echo ""
echo "4. 查看日志："
echo "   pm2 logs unicloud-proxy"
echo ""
echo "5. 设置开机自启："
echo "   pm2 startup"
echo "   pm2 save"
echo ""
echo "6. 测试服务："
echo "   curl http://localhost:8888/health"
echo ""
echo "7. 获取服务器 IP："
echo "   curl http://localhost:8888/ip"
echo ""
echo "======================================"
echo "  📝 重要提醒"
echo "======================================"
echo ""
echo "• 确保云服务商的安全组也开放了 8888 端口"
echo "• 将获取到的 IP 添加到微信支付白名单"
echo "• 建议配置 API 密钥认证以提高安全性"
echo ""
echo "部署完成！🎉"
echo ""
