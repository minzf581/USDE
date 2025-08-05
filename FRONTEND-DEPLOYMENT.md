# 前端部署指南

## 🔍 问题分析

目前只有后端API在Railway上运行，前端应用还没有部署。这就是为什么你看到API响应而不是登录页面的原因。

## 🚀 解决方案

### 方案1：部署前端到Railway（推荐）

#### 步骤1：创建前端Railway项目
1. 在Railway Dashboard中创建新项目
2. 连接你的GitHub仓库
3. 设置根目录为 `frontend`

#### 步骤2：配置前端环境变量
在Railway Dashboard中设置：
```env
REACT_APP_API_URL=https://usde-usde.up.railway.app/api
REACT_APP_ENVIRONMENT=production
```

#### 步骤3：配置前端部署
创建 `frontend/railway.json`：
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm install && npm run build && npx serve -s build -l 3000",
    "healthcheckPath": "/",
    "healthcheckTimeout": 300,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

#### 步骤4：安装serve包
在 `frontend/package.json` 中添加：
```json
{
  "dependencies": {
    "serve": "^14.2.1"
  }
}
```

### 方案2：使用Vercel部署前端（更简单）

#### 步骤1：连接Vercel
1. 访问 [vercel.com](https://vercel.com)
2. 连接你的GitHub仓库
3. 设置根目录为 `frontend`

#### 步骤2：配置环境变量
在Vercel Dashboard中设置：
```env
REACT_APP_API_URL=https://usde-usde.up.railway.app/api
REACT_APP_ENVIRONMENT=production
```

#### 步骤3：部署
Vercel会自动检测React应用并部署

### 方案3：使用Netlify部署前端

#### 步骤1：连接Netlify
1. 访问 [netlify.com](https://netlify.com)
2. 连接你的GitHub仓库
3. 设置构建命令：`npm run build`
4. 设置发布目录：`build`

#### 步骤2：配置环境变量
在Netlify Dashboard中设置：
```env
REACT_APP_API_URL=https://usde-usde.up.railway.app/api
REACT_APP_ENVIRONMENT=production
```

## 🔧 前端配置更新

### 更新API配置
确保 `frontend/src/services/api.js` 中的API URL正确：
```javascript
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';
```

### 更新CORS配置
在 `backend/server.js` 中确保CORS配置正确：
```javascript
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://your-frontend-domain.vercel.app', 'https://your-frontend-domain.netlify.app'] 
    : ['http://localhost:3000'],
  credentials: true
}));
```

## 📊 验证部署

### 前端部署成功后应该看到：
- ✅ 访问前端URL显示登录页面
- ✅ 登录功能正常工作
- ✅ 可以访问仪表板
- ✅ API调用成功

### 测试流程：
1. 访问前端URL（如：`https://usde-frontend.vercel.app`）
2. 应该看到登录页面
3. 使用默认用户登录：
   - **Admin**: admin@usde.com / admin123
   - **Demo**: demo@usde.com / demo123
4. 登录后应该看到仪表板

## 🆘 常见问题

### 问题1：前端无法连接后端API
**解决方案：**
- 检查 `REACT_APP_API_URL` 环境变量是否正确
- 确认后端API URL可访问
- 检查CORS配置

### 问题2：登录后页面空白
**解决方案：**
- 检查浏览器控制台错误
- 确认API调用成功
- 检查认证token是否正确

### 问题3：构建失败
**解决方案：**
- 检查 `package.json` 依赖
- 确认Node.js版本兼容
- 查看构建日志

## 🎯 推荐方案

**推荐使用Vercel部署前端**，因为：
1. 自动检测React应用
2. 零配置部署
3. 自动HTTPS
4. 全球CDN
5. 免费计划足够

## 📞 支持

如果遇到问题：
1. 检查环境变量设置
2. 确认API URL可访问
3. 查看部署日志
4. 测试API端点 