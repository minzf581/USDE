# Railway 正确多服务部署指南

## 🎯 正确的Railway配置方式

### 重要说明
Railway会根据设置的根目录自动使用对应目录下的 `railway.json` 文件。

## 🚀 正确的部署步骤

### 步骤1：创建后端服务
1. 在Railway Dashboard中创建新项目
2. 连接你的GitHub仓库
3. **设置根目录为项目根目录**（不是backend目录）
4. 重命名服务为 "usde-backend"
5. 将 `railway-backend.json` 重命名为 `railway.json`

### 步骤2：创建前端服务
1. 在同一个Railway项目中添加新服务
2. 选择 "Deploy from GitHub repo"
3. 选择同一个GitHub仓库
4. **设置根目录为 `frontend`**
5. 重命名服务为 "usde-frontend"
6. Railway会自动使用 `frontend/railway.json`

## 📁 文件结构说明

```
USDE/
├── railway-backend.json          # 后端服务配置（需要重命名为railway.json）
├── backend/
│   ├── railway.json             # 不会被使用
│   └── clean-deploy.sh
└── frontend/
    ├── railway.json             # 前端服务配置（自动使用）
    ├── test-health.js
    └── package.json
```

## 🔧 配置文件内容

### 后端配置（railway-backend.json → railway.json）
```json
{
  "deploy": {
    "startCommand": "cd backend && ./clean-deploy.sh",
    "healthcheckPath": "/api/health"
  }
}
```

### 前端配置（frontend/railway.json）
```json
{
  "deploy": {
    "startCommand": "npm install && cp env.production .env.production && npm run build && npm run serve",
    "healthcheckPath": "/health"
  }
}
```

## 📊 部署流程

### 后端服务部署
1. 根目录：项目根目录
2. 使用：`railway-backend.json`（重命名为 `railway.json`）
3. 启动命令：`cd backend && ./clean-deploy.sh`
4. 健康检查：`/api/health`

### 前端服务部署
1. 根目录：`frontend`
2. 使用：`frontend/railway.json`（自动使用）
3. 启动命令：`npm install && cp env.production .env.production && npm run build && npm run serve`
4. 健康检查：`/health`

## 🎯 验证配置

### 后端验证
- URL：`https://usde-backend-production.up.railway.app`
- 健康检查：`https://usde-backend-production.up.railway.app/api/health`

### 前端验证
- URL：`https://usde-frontend-production.up.railway.app`
- 健康检查：`https://usde-frontend-production.up.railway.app/health`

## 🔧 环境变量配置

### 后端服务环境变量
```env
DATABASE_URL=postgresql://postgres:password@railway.internal:5432/railway
JWT_SECRET=your-super-secret-jwt-key-here
NODE_ENV=production
FRONTEND_URL=https://usde-frontend-production.up.railway.app
```

### 前端服务环境变量
```env
REACT_APP_API_URL=https://usde-backend-production.up.railway.app/api
REACT_APP_ENVIRONMENT=production
```

## 🆘 常见问题

### 问题1：Railway找不到配置文件
**解决：** 确保在正确的根目录下设置了 `railway.json`

### 问题2：前端健康检查失败
**解决：** 确认 `frontend/railway.json` 中的健康检查路径为 `/health`

### 问题3：后端启动失败
**解决：** 确认 `railway-backend.json` 已重命名为 `railway.json`

## 📞 支持

如果遇到问题：
1. 检查Railway项目根目录设置
2. 确认配置文件在正确位置
3. 验证环境变量设置
4. 查看部署日志 