# Railway 多服务部署指南

## 🚀 在Railway上部署完整应用

### 方案1：使用Railway多服务架构（推荐）

#### 步骤1：创建后端服务
1. 在Railway Dashboard中创建新项目
2. 连接你的GitHub仓库
3. 设置根目录为项目根目录
4. 重命名服务为 "usde-backend"
5. 将 `railway-backend.json` 重命名为 `railway.json`

#### 步骤2：创建前端服务
1. 在同一个Railway项目中添加新服务
2. 选择 "Deploy from GitHub repo"
3. 选择同一个GitHub仓库
4. 设置根目录为项目根目录
5. 重命名服务为 "usde-frontend"
6. 将 `railway-frontend.json` 重命名为 `railway.json`

#### 步骤3：配置环境变量

**后端服务环境变量：**
```env
DATABASE_URL=postgresql://postgres:password@railway.internal:5432/railway
JWT_SECRET=your-super-secret-jwt-key-here
NODE_ENV=production
FRONTEND_URL=https://usde-frontend-production.up.railway.app
```

**前端服务环境变量：**
```env
REACT_APP_API_URL=https://usde-backend-production.up.railway.app/api
REACT_APP_ENVIRONMENT=production
```

### 方案2：使用Railway子目录部署

#### 步骤1：配置后端部署
1. 在Railway Dashboard中创建项目
2. 连接GitHub仓库
3. 设置根目录为项目根目录
4. 使用 `railway-backend.json` 配置

#### 步骤2：配置前端部署
1. 在同一个项目中添加新服务
2. 选择 "Deploy from GitHub repo"
3. 选择同一个仓库
4. 设置根目录为项目根目录
5. 使用 `railway-frontend.json` 配置

## 🔧 配置文件说明

### railway-backend.json
```json
{
  "deploy": {
    "startCommand": "cd backend && ./clean-deploy.sh",
    "healthcheckPath": "/api/health"
  }
}
```

### railway-frontend.json
```json
{
  "deploy": {
    "startCommand": "cd frontend && npm install && cp env.production .env.production && npm run build && npx serve -s build -l 3000",
    "healthcheckPath": "/"
  }
}
```

## 📊 部署流程

### 1. 后端服务部署
```
🚀 Starting USDE Backend Deployment...
📦 Installing dependencies...
🔧 Generating Prisma client...
🗄️ Pushing database schema...
🌱 Seeding database...
✅ Deployment completed!
🚀 Starting server...
```

### 2. 前端服务部署
```
🚀 Starting USDE Frontend Deployment...
📦 Installing dependencies...
🔧 Setting production environment...
🔨 Building React application...
🚀 Starting frontend server...
```

## 🔗 服务连接

### 服务URL结构
- **后端API**: `https://usde-backend-production.up.railway.app`
- **前端应用**: `https://usde-frontend-production.up.railway.app`

### 内部服务通信
Railway会自动处理同一项目内服务间的网络连接，前端可以通过内部URL访问后端：
```env
REACT_APP_API_URL=https://usde-backend-production.up.railway.app/api
```

## 📊 验证部署

### 后端验证
1. 访问 `https://usde-backend-production.up.railway.app/api/health`
2. 应该返回健康状态

### 前端验证
1. 访问 `https://usde-frontend-production.up.railway.app`
2. 应该看到登录页面
3. 使用默认用户登录：
   - **Admin**: admin@usde.com / admin123
   - **Demo**: demo@usde.com / demo123

## 🆘 常见问题

### 问题1：服务间无法通信
**解决：** 确保使用正确的内部URL格式

### 问题2：前端构建失败
**解决：** 检查环境变量和依赖安装

### 问题3：后端数据库连接失败
**解决：** 验证DATABASE_URL和数据库服务状态

## 🎯 优势

使用Railway多服务架构的优势：
1. **统一管理** - 所有服务在同一个项目中
2. **自动网络** - 服务间自动连接
3. **统一监控** - 在一个仪表板中查看所有服务
4. **成本优化** - 共享资源和配置
5. **简化部署** - 一次推送更新所有服务

## 📞 支持

如果遇到问题：
1. 检查Railway项目配置
2. 验证环境变量设置
3. 查看服务部署日志
4. 确认服务间网络连接 