# Railway Deployment Guide

## 🚀 部署步骤

### 1. 环境变量设置

在Railway Dashboard中设置以下环境变量：

#### 必需变量
```env
DATABASE_URL=postgresql://postgres:password@railway.internal:5432/railway
DATABASE_PUBLIC_URL=postgresql://postgres:password@railway.proxy:port/railway
JWT_SECRET=your-super-secret-jwt-key-here
NODE_ENV=production
```

#### 可选变量
```env
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_key
STRIPE_SECRET_KEY=sk_test_your_stripe_secret
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
FRONTEND_URL=https://your-frontend-domain.com
```

### 2. 数据库设置

1. 在Railway中创建PostgreSQL数据库
2. 复制数据库连接URL到环境变量
3. 确保`DATABASE_URL`和`DATABASE_PUBLIC_URL`都已设置

### 3. 部署配置

项目已配置为自动：
- 安装依赖
- 生成Prisma客户端
- 推送数据库schema
- 运行种子数据
- 启动服务器

### 4. 健康检查

应用包含健康检查端点：`/api/health`

## 🔧 故障排除

### 502错误解决方案

1. **检查环境变量**
   - 确保所有必需变量都已设置
   - 验证数据库URL格式正确

2. **检查数据库连接**
   - 确认PostgreSQL服务正在运行
   - 验证数据库凭据正确

3. **查看部署日志**
   ```bash
   railway logs --service usde-usde
   ```

4. **手动重新部署**
   - 在Railway Dashboard中触发重新部署
   - 或推送代码更改到GitHub

### 常见问题

#### 数据库连接失败
- 检查`DATABASE_URL`格式
- 确认数据库服务已启动
- 验证网络连接

#### Prisma错误
- 确保`DATABASE_URL`指向PostgreSQL
- 检查schema.prisma配置
- 验证Prisma客户端已生成

#### 环境变量缺失
- 检查所有必需变量是否设置
- 验证变量名称拼写正确
- 确认变量值不为空

## 📊 监控

### 健康检查端点
```
GET /api/health
```

响应示例：
```json
{
  "status": "OK",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "environment": "production"
}
```

### 默认用户
- **Admin**: admin@usde.com / admin123
- **Demo**: demo@usde.com / demo123

## 🔄 更新部署

1. 推送代码到GitHub
2. Railway自动触发重新部署
3. 检查部署日志确认成功
4. 验证健康检查端点

## 📞 支持

如果遇到问题：
1. 检查Railway部署日志
2. 验证环境变量设置
3. 确认数据库连接
4. 查看应用健康状态 