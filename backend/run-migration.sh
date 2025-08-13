#!/bin/bash

echo "🔧 Running USDE Module Database Migration..."

# 检查是否在正确的目录
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the backend directory"
    exit 1
fi

# 安装依赖
echo "📦 Installing dependencies..."
npm install

# 生成Prisma客户端
echo "🔧 Generating Prisma client..."
npm run db:generate

# 推送数据库架构
echo "🗄️ Pushing database schema..."
npm run db:push

# 运行迁移脚本
echo "🔄 Running risk enhancements migration..."
sqlite3 prisma/data/dev.db < migration_001_risk_enhancements.sql

echo "✅ Migration completed successfully!"
echo "🚀 You can now start the server with: npm start"



