#!/bin/bash

echo "🚀 Starting Railway deployment..."

# 设置Railway环境变量
export NODE_ENV=production
export DATABASE_PROVIDER=postgresql

# 检查环境变量
echo "📊 Environment check:"
echo "NODE_ENV: $NODE_ENV"
echo "DATABASE_PROVIDER: $DATABASE_PROVIDER"
echo "DATABASE_URL: ${DATABASE_URL:0:50}..."

# 验证PostgreSQL连接
if [[ ! "$DATABASE_URL" =~ ^postgresql:// ]]; then
    echo "❌ Error: DATABASE_URL must be a PostgreSQL connection string"
    echo "   Current: $DATABASE_URL"
    exit 1
fi

echo "✅ PostgreSQL connection string validated"

# 切换到PostgreSQL schema
echo "🔄 Switching to PostgreSQL schema..."
if [ -f "prisma/schema.postgresql.prisma" ]; then
    cp prisma/schema.postgresql.prisma prisma/schema.prisma
    echo "✅ Schema switched to PostgreSQL"
else
    echo "❌ PostgreSQL schema file not found"
    exit 1
fi

# 生成Prisma客户端
echo "🔧 Generating Prisma client..."
npx prisma generate

# 推送数据库schema到PostgreSQL
echo "🗄️ Pushing database schema..."
npx prisma db push --accept-data-loss

# 启动应用
echo "🚀 Starting application..."
npm start
