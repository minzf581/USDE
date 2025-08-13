#!/bin/bash

echo "🚀 Starting Railway deployment..."

# 检查环境变量
echo "📊 Environment check:"
echo "NODE_ENV: $NODE_ENV"
echo "DATABASE_URL: ${DATABASE_URL:0:50}..."

# 生成Prisma客户端
echo "🔧 Generating Prisma client..."
npx prisma generate

# 推送数据库schema到PostgreSQL
echo "🗄️ Pushing database schema..."
npx prisma db push --accept-data-loss

# 启动应用
echo "🚀 Starting application..."
npm start
