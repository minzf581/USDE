# Railway 快速部署指南

## 🚀 在Railway上部署完整应用

### 步骤1：推送代码
```bash
git add .
git commit -m "Add Railway multi-service deployment configuration"
git push origin main
```

### 步骤2：配置Railway项目

#### 2.1 创建后端服务
1. 在Railway Dashboard中创建新项目
2. 连接你的GitHub仓库
3. 设置根目录为项目根目录
4. 重命名服务为 "usde-backend"
5. 将 `railway-backend.json` 重命名为 `railway.json`

#### 2.2 创建前端服务
1. 在同一个Railway项目中添加新服务
2. 选择 "Deploy from GitHub repo"
3. 选择同一个GitHub仓库
4. 设置根目录为项目根目录
5. 重命名服务为 "usde-frontend"
6. 将 `railway-frontend.json` 重命名为 `railway.json`

### 步骤3：配置环境变量

#### 后端服务环境变量：
```env
DATABASE_URL=postgresql://postgres:password@railway.internal:5432/railway
JWT_SECRET=your-super-secret-jwt-key-here
NODE_ENV=production
FRONTEND_URL=https://usde-frontend-production.up.railway.app
```

#### 前端服务环境变量：
```env
REACT_APP_API_URL=https://usde-backend-production.up.railway.app/api
REACT_APP_ENVIRONMENT=production
```

### 步骤4：部署
1. Railway会自动检测配置并开始部署
2. 等待两个服务都部署完成
3. 检查部署日志确认成功

## 📊 验证部署

### 后端验证
访问：`https://usde-backend-production.up.railway.app/api/health`
应该返回：
```json
{
  "status": "OK",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "environment": "production",
  "port": 8080
}
```

### 前端验证
访问：`https://usde-frontend-production.up.railway.app`
应该看到登录页面，可以使用：
- **Admin**: admin@usde.com / admin123
- **Demo**: demo@usde.com / demo123

## 🎯 优势

使用Railway多服务架构的优势：
1. **统一管理** - 所有服务在同一个项目中
2. **自动网络** - 服务间自动连接
3. **统一监控** - 在一个仪表板中查看所有服务
4. **成本优化** - 共享资源和配置
5. **简化部署** - 一次推送更新所有服务

## 🔧 如果遇到问题

### 问题1：服务间无法通信
**解决：** 确保使用正确的内部URL格式

### 问题2：前端构建失败
**解决：** 检查环境变量和依赖安装

### 问题3：后端数据库连接失败
**解决：** 验证DATABASE_URL和数据库服务状态

## 📞 支持

如果遇到问题：
1. 检查Railway项目配置
2. 验证环境变量设置
3. 查看服务部署日志
4. 确认服务间网络连接 