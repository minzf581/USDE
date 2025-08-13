# 环境配置指南

## 🎯 目标
确保本地开发和Railway部署都能正常工作，不会相互影响。

## 🔧 配置方案

### 1. 智能环境检测
- **本地开发**: 自动使用SQLite数据库
- **Railway部署**: 自动使用PostgreSQL数据库
- **无需手动切换**: 脚本自动检测环境

### 2. 数据库配置
- **本地**: `file:./prisma/data/app.db` (SQLite)
- **Railway**: `postgresql://postgres:SOzxfxdDXTsVjKQJLTyeGHeKnxlQHQLR@yamabiko.proxy.rlwy.net:58370/railway`

## 📁 .env 文件配置

### 本地开发环境 (.env.local)
```bash
# 复制 env.local.example 为 .env.local
cp backend/env.local.example backend/.env.local
```

**文件内容**:
```env
# 本地开发环境配置
NODE_ENV=development
PORT=5001

# 本地数据库配置 - SQLite
DATABASE_PROVIDER=sqlite
DATABASE_URL="file:./prisma/data/app.db"

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key-here-local

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Stripe Configuration (测试密钥)
STRIPE_PUBLISHABLE_KEY=pk_test_51RdnXAGfyR7fgfw4LTp09BjX6SSmiQ3bD9veXjiQZ90gMPdTWwp67OFJPnyvMGcidlXjGuNlRSdUYnj95UAXOenN00ckcFGYCZ
STRIPE_SECRET_KEY=sk_test_51RdnXAGfyR7fgfw8ccChJCOiG0KkG4N2vJUZ3i47ClU9INTDTFQfM6sHnPPsQFk1eog4yBxPIoo2gYmoTdx43z00p1JxAnPr
STRIPE_WEBHOOK_SECRET=whsec_tR8h8lY0ZtF09y3yQyKHGz4qQN2X0zWj

# Frontend URL (本地开发)
FRONTEND_URL=http://localhost:3000

# 本地开发特定配置
LOG_LEVEL=debug
ENABLE_DEBUG_ENDPOINTS=true
```

### Railway环境变量
在Railway项目设置中配置：
```env
NODE_ENV=production
DATABASE_PROVIDER=postgresql
DATABASE_URL=postgresql://postgres:SOzxfxdDXTsVjKQJLTyeGHeKnxlQHQLR@yamabiko.proxy.rlwy.net:58370/railway
PORT=8080
JWT_SECRET=your-production-jwt-secret
# 其他生产环境变量...
```

## 🚀 启动方式

### 本地开发
```bash
# 使用原有的启动脚本
./start-services.sh

# 脚本会自动检测环境并使用SQLite
```

### Railway部署
```bash
# Railway自动使用 railway-start.sh
# 脚本会自动检测环境并使用PostgreSQL
```

## 🔍 环境检测逻辑

### 1. 本地开发环境
- 条件: 没有 `RAILWAY_ENVIRONMENT` 或 `RAILWAY_SERVICE_NAME` 环境变量
- 数据库: SQLite (`file:./prisma/data/app.db`)
- 端口: 5001
- 前端: 启动 (http://localhost:3000)

### 2. Railway环境
- 条件: 存在 `RAILWAY_ENVIRONMENT` 或 `RAILWAY_SERVICE_NAME` 环境变量
- 数据库: PostgreSQL (环境变量中的 `DATABASE_URL`)
- 端口: 环境变量中的 `PORT`
- 前端: 不启动 (通过Railway单独部署)

### 3. 生产环境
- 条件: `NODE_ENV=production`
- 数据库: PostgreSQL
- 端口: 环境变量中的 `PORT`
- 前端: 不启动

## 📋 配置检查清单

### 本地开发
- [ ] 复制 `env.local.example` 为 `.env.local`
- [ ] 修改必要的配置值 (JWT_SECRET, EMAIL等)
- [ ] 确保 `prisma/data/` 目录存在
- [ ] 运行 `./start-services.sh`

### Railway部署
- [ ] 在Railway中设置环境变量
- [ ] 确保 `DATABASE_URL` 格式正确
- [ ] 设置 `NODE_ENV=production`
- [ ] 推送代码到Git仓库

## 🎉 优势

1. **自动化**: 无需手动切换配置
2. **兼容性**: 本地和Railway都能正常工作
3. **安全性**: 本地和生产环境使用不同的密钥
4. **维护性**: 统一的启动脚本，易于维护

## 🚨 注意事项

1. **不要提交 `.env.local`**: 添加到 `.gitignore`
2. **本地数据库**: 确保 `prisma/data/` 目录存在
3. **环境变量**: Railway中必须设置正确的环境变量
4. **端口冲突**: 本地使用5001，Railway使用环境变量中的PORT

现在你的应用可以同时支持本地开发和Railway部署了！
