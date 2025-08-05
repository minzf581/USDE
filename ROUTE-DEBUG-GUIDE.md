# 路由调试指南

## 🔍 问题分析

部署成功但访问URL返回404错误，说明：
1. 服务器正在运行（端口8080）
2. 数据库连接正常
3. 种子数据加载成功
4. 但是路由配置有问题

## ✅ 已修复的问题

### 1. 服务器配置优化
- ✅ 添加了根路径 `/` 端点
- ✅ 改进了404错误处理，显示可用端点
- ✅ 添加了详细的服务器日志
- ✅ 确保服务器监听 `0.0.0.0` 地址

### 2. 端口配置
- ✅ 使用环境变量 `PORT`（Railway自动设置）
- ✅ 添加了端口信息到健康检查响应

### 3. 路由调试
- ✅ 创建了测试路由脚本
- ✅ 添加了详细的404错误信息

## 🚀 测试步骤

### 1. 推送更新
```bash
git add .
git commit -m "Fix routing: Add root endpoint and improve error handling"
git push origin main
```

### 2. 测试端点
部署完成后，测试以下端点：

#### 基本端点
- `https://usde-usde.up.railway.app/` - API信息
- `https://usde-usde.up.railway.app/api/health` - 健康检查

#### 认证端点
- `https://usde-usde.up.railway.app/api/auth/register` - 注册
- `https://usde-usde.up.railway.app/api/auth/login` - 登录

#### 其他端点
- `https://usde-usde.up.railway.app/api/company` - 公司信息
- `https://usde-usde.up.railway.app/api/dashboard` - 仪表板

### 3. 预期响应

#### 根路径 `/`
```json
{
  "message": "USDE Backend API",
  "version": "1.0.0",
  "status": "running",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "environment": "production",
  "endpoints": {
    "health": "/api/health",
    "auth": "/api/auth",
    "company": "/api/company",
    "kyc": "/api/kyc",
    "payment": "/api/payment",
    "stake": "/api/stake",
    "deposit": "/api/deposit",
    "withdrawal": "/api/withdrawal",
    "dashboard": "/api/dashboard",
    "admin": "/api/admin"
  }
}
```

#### 健康检查 `/api/health`
```json
{
  "status": "OK",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "environment": "production",
  "port": 8080
}
```

## 🔧 如果仍有问题

### 检查部署日志
在Railway Dashboard中查看日志，应该看到：
```
🔧 Server configuration:
   PORT: 8080
   NODE_ENV: production
   DATABASE_URL: Set
🚀 Server running on port 8080
🌐 Available endpoints:
   GET  / - API info
   GET  /api/health - Health check
   POST /api/auth/register - Register
   POST /api/auth/login - Login
```

### 检查URL路径
确保你访问的是正确的URL：
- ✅ `https://usde-usde.up.railway.app/` - 根路径
- ✅ `https://usde-usde.up.railway.app/api/health` - 健康检查
- ❌ `https://usde-usde.up.railway.app/health` - 没有这个路径

### 测试认证端点
使用POST请求测试认证：
```bash
curl -X POST https://usde-usde.up.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@usde.com","password":"admin123"}'
```

## 📊 成功指标

修复成功后应该看到：
- ✅ 访问 `/` 返回API信息
- ✅ 访问 `/api/health` 返回健康状态
- ✅ 404错误显示可用端点列表
- ✅ 服务器日志显示所有端点

## 🆘 紧急修复

如果问题持续存在：

### 方案1：检查Railway配置
确保Railway正确设置了端口和环境变量

### 方案2：使用测试脚本
临时使用测试部署脚本：
```json
{
  "deploy": {
    "startCommand": "cd backend && ./test-deploy.sh"
  }
}
```

### 方案3：手动测试
在本地测试服务器配置：
```bash
cd backend
npm install
node server.js
```

然后访问 `http://localhost:5001/` 和 `http://localhost:5001/api/health` 