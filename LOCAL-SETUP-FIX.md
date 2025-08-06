# 本地启动问题修复总结

## 问题描述

使用 `start-services.sh` 本地启动系统时遇到以下问题：

1. **数据库连接失败**：系统试图连接到 PostgreSQL (`localhost:5432`)，但本地应该使用 SQLite
2. **JWT token 过期**：用户 token 已过期
3. **React Hook 警告**：KYC.js 中的 useCallback 依赖问题

## 解决方案

### 1. 数据库配置修复

**问题**：Prisma schema 配置为 PostgreSQL，但本地开发需要使用 SQLite

**解决步骤**：
1. 修改 `backend/prisma/schema.prisma`：
   ```prisma
   datasource db {
     provider = "sqlite"  // 从 "postgresql" 改为 "sqlite"
     url      = env("DATABASE_URL")
   }
   ```

2. 修复 `.env` 文件中的数据库路径：
   ```bash
   DATABASE_URL="file:/Users/minzhenfa/sourceCode/USDE/backend/prisma/data/app.db"
   ```

3. 清除系统环境变量中的 DATABASE_URL：
   ```bash
   unset DATABASE_URL
   ```

### 2. React Hook 警告修复

**问题**：KYC.js 中的 useCallback 缺少 navigate 依赖

**解决方案**：
修改 `frontend/src/pages/KYC.js` 第 62 行：
```javascript
// 从
}, []);

// 改为
}, [navigate]);
```

### 3. 启动脚本优化

更新 `start-services.sh` 以确保正确的数据库路径：
```bash
export DATABASE_URL="file:/Users/minzhenfa/sourceCode/USDE/backend/prisma/data/app.db"
```

## 验证结果

### 后端 API 测试
```bash
# 健康检查
curl http://localhost:5001/api/health
# 返回: {"status":"OK","timestamp":"2025-08-06T02:55:03.534Z","environment":"development","port":"5001"}

# 登录测试
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@usde.com","password":"admin123"}'
# 返回: {"message":"Login successful","token":"...","company":{...}}
```

### 前端访问测试
```bash
curl http://localhost:3000
# 返回: HTML 页面内容
```

## 默认登录凭据

- **邮箱**: admin@usde.com
- **密码**: admin123
- **角色**: admin
- **KYC 状态**: approved
- **初始余额**: 10,000 UC

## 服务端口

- **前端**: http://localhost:3000
- **后端**: http://localhost:5001

## 注意事项

1. 确保在启动前清除系统环境变量中的 DATABASE_URL
2. 本地开发使用 SQLite，生产环境使用 PostgreSQL
3. 数据库文件位置：`backend/prisma/data/app.db`
4. 如果遇到数据库连接问题，检查文件权限和路径

## 启动命令

```bash
# 使用更新后的启动脚本
./start-services.sh

# 或手动启动
cd backend && export DATABASE_URL="file:/Users/minzhenfa/sourceCode/USDE/backend/prisma/data/app.db" && npm run dev
cd frontend && npm start
``` 