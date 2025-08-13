#!/bin/bash

echo "🔄 智能Prisma Schema切换脚本"
echo "============================"

# 检查是否在backend目录
if [ ! -f "package.json" ]; then
    echo "❌ 请在backend目录运行此脚本"
    exit 1
fi

# 检测环境
echo "🔍 检测运行环境..."
if [[ -n "$RAILWAY_ENVIRONMENT" || -n "$RAILWAY_SERVICE_NAME" ]]; then
    echo "🚂 检测到Railway环境，切换到PostgreSQL schema"
    TARGET_SCHEMA="schema.postgresql.prisma"
    TARGET_PROVIDER="postgresql"
elif [[ "$NODE_ENV" == "production" ]]; then
    echo "🏭 检测到生产环境，切换到PostgreSQL schema"
    TARGET_SCHEMA="schema.postgresql.prisma"
    TARGET_PROVIDER="postgresql"
else
    echo "💻 检测到本地开发环境，切换到SQLite schema"
    TARGET_SCHEMA="schema.sqlite.prisma"
    TARGET_PROVIDER="sqlite"
fi

# 检查目标schema文件是否存在
if [ ! -f "prisma/$TARGET_SCHEMA" ]; then
    echo "❌ 目标schema文件不存在: prisma/$TARGET_SCHEMA"
    exit 1
fi

# 备份当前schema
echo "📋 备份当前schema..."
if [ -f "prisma/schema.prisma" ]; then
    cp prisma/schema.prisma prisma/schema.prisma.backup
    echo "✅ 当前schema已备份为 schema.prisma.backup"
fi

# 切换到目标schema
echo "🔄 切换到 $TARGET_SCHEMA..."
cp "prisma/$TARGET_SCHEMA" prisma/schema.prisma
echo "✅ Schema已切换到 $TARGET_SCHEMA"

# 设置环境变量
export DATABASE_PROVIDER="$TARGET_PROVIDER"
echo "🔧 设置 DATABASE_PROVIDER=$TARGET_PROVIDER"

# 生成Prisma客户端
echo "🔧 生成Prisma客户端..."
npx prisma generate

if [ $? -eq 0 ]; then
    echo "✅ Prisma客户端生成成功"
else
    echo "❌ Prisma客户端生成失败"
    # 恢复备份
    if [ -f "prisma/schema.prisma.backup" ]; then
        echo "🔄 恢复原始schema..."
        cp prisma/schema.prisma.backup prisma/schema.prisma
    fi
    exit 1
fi

echo ""
echo "🎉 Schema切换完成！"
echo "   当前使用: $TARGET_SCHEMA"
echo "   数据库提供者: $TARGET_PROVIDER"
echo "   环境: $([ -n "$RAILWAY_ENVIRONMENT" ] && echo "Railway" || echo "本地开发")"
echo ""
echo "💡 提示: 运行 'npx prisma db push' 来同步数据库schema"
