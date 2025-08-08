#!/bin/bash

echo "🔄 开始更新用户角色系统..."

# 检查是否在正确的目录
if [ ! -f "package.json" ]; then
    echo "❌ 请在 backend 目录中运行此脚本"
    exit 1
fi

echo "📦 安装依赖..."
npm install

echo "🗄️ 生成 Prisma 客户端..."
npx prisma generate

echo "🔄 运行数据库迁移..."
npx prisma db push

echo "🔄 更新现有用户角色..."
node update-user-roles.js

echo "🌱 重新运行种子数据..."
node prisma/seed-rbac.js
node prisma/seed-enterprise.js
node prisma/seed-users.js

echo "✅ 角色系统更新完成！"
echo ""
echo "📋 新的角色系统:"
echo "   - admin: 系统管理员"
echo "   - enterprise_admin: 企业管理员"
echo "   - enterprise_finance_manager: 企业财务管理员"
echo "   - enterprise_finance_operator: 企业财务操作员"
echo ""
echo "🚀 可以重新启动服务器了"
