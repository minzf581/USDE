#!/bin/bash

echo "🚀 开始部署Railway后端..."

# 检查是否在正确的目录
if [ ! -f "package.json" ]; then
    echo "❌ 错误: 请在backend目录中运行此脚本"
    exit 1
fi

# 检查环境变量
if [ -z "$RAILWAY_TOKEN" ]; then
    echo "❌ 错误: 请设置RAILWAY_TOKEN环境变量"
    echo "运行: export RAILWAY_TOKEN=your_token_here"
    exit 1
fi

# 安装依赖
echo "📦 安装依赖..."
npm install

# 生成Prisma客户端
echo "🔧 生成Prisma客户端..."
npx prisma generate

# 部署到Railway
echo "🚂 部署到Railway..."
railway up

echo "✅ 部署完成！"
echo "🌐 后端地址: https://optimistic-fulfillment-usde.up.railway.app"
echo "📊 健康检查: https://optimistic-fulfillment-usde.up.railway.app/api/health"
