#!/bin/bash

echo "🚀 Railway PostgreSQL 部署修复脚本"
echo "=================================="

# 检查是否在正确的目录
if [ ! -f "backend/package.json" ]; then
    echo "❌ 请在项目根目录运行此脚本"
    exit 1
fi

echo "📁 当前目录: $(pwd)"
echo "🔧 开始修复 Railway 部署问题..."

# 进入backend目录
cd backend

echo "\n1️⃣ 检查当前配置..."
echo "   - Prisma schema: $(grep -n "provider.*=" prisma/schema.prisma | head -1)"
echo "   - Database URL: $(grep -n "url.*=" prisma/schema.prisma | head -1)"

echo "\n2️⃣ 生成 Prisma 客户端..."
npx prisma generate

echo "\n3️⃣ 测试 PostgreSQL 连接..."
npm run test:postgresql

echo "\n4️⃣ 检查 Railway 配置..."
if [ -f "railway.json" ]; then
    echo "   ✅ railway.json 存在"
    echo "   - 启动命令: $(grep "startCommand" railway.json)"
else
    echo "   ❌ railway.json 不存在"
fi

echo "\n5️⃣ 准备部署..."
echo "   - 确保所有更改已提交到 Git"
echo "   - 推送到远程仓库"
echo "   - Railway 将自动重新部署"

echo "\n✅ 修复完成！"
echo "\n📋 下一步操作："
echo "   1. git add ."
echo "   2. git commit -m 'Fix Railway PostgreSQL deployment'"
echo "   3. git push"
echo "   4. 检查 Railway 部署状态"
echo "   5. 查看部署日志确认成功"

echo "\n🔍 如果仍有问题，请检查："
echo "   - Railway 环境变量设置"
echo "   - PostgreSQL 连接字符串"
echo "   - 网络连接和防火墙设置"
