# 502错误修复指南

## 🔍 问题诊断

你的Railway部署返回502错误，主要原因可能是：

1. **数据库连接问题** - Prisma schema配置为SQLite，但Railway需要PostgreSQL
2. **环境变量缺失** - 缺少必要的环境变量
3. **Prisma客户端问题** - 多个PrismaClient实例导致连接池问题

## ✅ 已修复的问题

### 1. 数据库配置
- ✅ 更新了 `backend/prisma/schema.prisma` 使用PostgreSQL
- ✅ 配置使用环境变量 `DATABASE_URL`

### 2. 部署配置
- ✅ 更新了 `railway.json` 包含数据库迁移步骤
- ✅ 创建了 `backend/deploy.sh` 部署脚本
- ✅ 添加了环境变量检查

### 3. Prisma客户端优化
- ✅ 创建了共享的Prisma客户端 `backend/lib/prisma.js`
- ✅ 更新了所有文件使用共享客户端
- ✅ 添加了优雅的连接关闭

## 🚀 立即修复步骤

### 1. 推送代码到GitHub
```bash
git add .
git commit -m "Fix 502 error: Update to PostgreSQL and optimize Prisma client"
git push origin main
```

### 2. 在Railway Dashboard中设置环境变量

**必需变量：**
```env
DATABASE_URL=postgresql://postgres:password@railway.internal:5432/railway
JWT_SECRET=your-super-secret-jwt-key-here
NODE_ENV=production
```

**可选变量：**
```env
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_key
STRIPE_SECRET_KEY=sk_test_your_stripe_secret
EMAIL_HOST=smtp.gmail.com
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
FRONTEND_URL=https://your-frontend-domain.com
```

### 3. 重新部署
- 在Railway Dashboard中触发重新部署
- 或推送代码更改到GitHub

## 🔧 验证修复

### 1. 检查健康端点
访问：`https://usde-usde.up.railway.app/api/health`

应该返回：
```json
{
  "status": "OK",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "environment": "production"
}
```

### 2. 检查部署日志
在Railway Dashboard中查看部署日志，应该看到：
- ✅ Environment check completed!
- ✅ Database connection successful
- ✅ Deployment completed successfully!

### 3. 测试默认用户
- **Admin**: admin@usde.com / admin123
- **Demo**: demo@usde.com / demo123

## 📊 监控要点

1. **数据库连接** - 确保PostgreSQL服务正常运行
2. **环境变量** - 验证所有必需变量已设置
3. **Prisma客户端** - 检查连接池状态
4. **健康检查** - 监控 `/api/health` 端点

## 🆘 如果仍有问题

1. **检查Railway日志** - 查看详细的错误信息
2. **验证数据库** - 确认PostgreSQL服务状态
3. **测试连接** - 使用 `node test-db.js` 测试数据库连接
4. **重新部署** - 触发完整的重新部署

## 📞 支持

如果问题持续存在：
1. 检查Railway部署日志
2. 验证环境变量设置
3. 确认数据库服务状态
4. 查看应用健康状态 