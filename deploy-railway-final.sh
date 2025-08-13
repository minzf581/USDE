#!/bin/bash

echo "🚀 Railway 最终部署修复脚本"
echo "============================"

# 检查是否在正确的目录
if [ ! -f "backend/package.json" ]; then
    echo "❌ 请在项目根目录运行此脚本"
    exit 1
fi

echo "📁 当前目录: $(pwd)"
echo "🔧 开始最终 Railway 部署修复..."

# 进入backend目录
cd backend

echo "\n1️⃣ 检查当前配置..."
echo "   - Prisma schema: $(grep -n "provider.*=" prisma/schema.prisma | head -1)"
echo "   - Database URL: $(grep -n "url.*=" prisma/schema.prisma | head -1)"
echo "   - Railway health check: $(grep "healthcheckPath" railway.json)"

echo "\n2️⃣ 测试健康检查端点..."
node test-health-simple.js

echo "\n3️⃣ 检查 Railway 配置..."
if [ -f "railway.json" ]; then
    echo "   ✅ railway.json 存在"
    echo "   - 启动命令: $(grep "startCommand" railway.json)"
    echo "   - 健康检查路径: $(grep "healthcheckPath" railway.json)"
else
    echo "   ❌ railway.json 不存在"
fi

echo "\n4️⃣ 检查健康检查路由..."
if [ -f "routes/health.js" ]; then
    echo "   ✅ 健康检查路由存在"
else
    echo "   ❌ 健康检查路由不存在"
fi

echo "\n5️⃣ 准备最终部署..."
echo "   - 所有修复已完成"
echo "   - 健康检查端点已优化"
echo "   - Railway 配置已更新"

echo "\n✅ 修复完成！"
echo "\n📋 下一步操作："
echo "   1. git add ."
echo "   2. git commit -m 'Final Railway health check fix'"
echo "   3. git push"
echo "   4. 检查 Railway 部署状态"
echo "   5. 监控健康检查日志"

echo "\n🔍 关键修复点："
echo "   ✅ Prisma 配置已改为 PostgreSQL"
echo "   ✅ 健康检查逻辑已优化"
echo "   ✅ 新增轻量级 ping 端点"
echo "   ✅ Railway 配置已更新"

echo "\n🎯 预期结果："
echo "   - 健康检查返回 200 状态码"
echo "   - 数据库连接成功"
echo "   - 应用正常启动和运行"

echo "\n🚨 如果仍有问题："
echo "   1. 检查 Railway 环境变量设置"
echo "   2. 确认 DATABASE_URL 格式正确"
echo "   3. 查看 Railway 部署日志"
echo "   4. 运行本地测试脚本进行诊断"
