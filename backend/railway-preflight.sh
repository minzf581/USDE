#!/bin/bash

echo "🚀 Railway 预启动配置..."

# 设置环境变量
export NODE_ENV=production
export DATABASE_PROVIDER=postgresql

# 检查环境变量
echo "📊 环境检查:"
echo "NODE_ENV: $NODE_ENV"
echo "DATABASE_PROVIDER: $DATABASE_PROVIDER"
echo "DATABASE_URL: ${DATABASE_URL:0:50}..."

# 验证PostgreSQL连接
if [[ ! "$DATABASE_URL" =~ ^postgresql:// ]]; then
    echo "❌ 错误: DATABASE_URL必须是PostgreSQL连接字符串"
    echo "   当前: $DATABASE_URL"
    exit 1
fi

echo "✅ PostgreSQL连接字符串验证通过"

# 强制使用PostgreSQL schema
echo "🔄 设置PostgreSQL schema..."
if [ -f "prisma/schema.postgresql.prisma" ]; then
    cp prisma/schema.postgresql.prisma prisma/schema.prisma
    echo "✅ Schema已设置为PostgreSQL"
else
    echo "❌ PostgreSQL schema文件不存在"
    exit 1
fi

# 生成Prisma客户端
echo "🔧 生成Prisma客户端..."
npx prisma generate

if [ $? -eq 0 ]; then
    echo "✅ Prisma客户端生成成功"
else
    echo "❌ Prisma客户端生成失败"
    exit 1
fi

# 推送数据库schema
echo "🗄️ 推送数据库schema..."
npx prisma db push --accept-data-loss

if [ $? -eq 0 ]; then
    echo "✅ 数据库schema推送成功"
else
    echo "❌ 数据库schema推送失败"
    exit 1
fi

echo "🎉 Railway预启动配置完成！"
echo "   现在可以启动应用了"
