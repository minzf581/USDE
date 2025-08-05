# CORS 问题详细修复方案

## 问题分析

CORS错误仍然存在，主要原因是：

1. **Railway配置问题**: `railway-backend.json` 中的启动命令有问题
2. **CORS配置不够精确**: 需要明确指定允许的源
3. **中间件顺序问题**: CORS必须在其他中间件之前

## 修复步骤

### 1. 修复Railway配置 ✅

**问题**: Railway根目录设置为`backend`，但缺少`backend/railway.json`配置文件

**修复**: 创建了`backend/railway.json`文件
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm install && npx prisma generate && npx prisma db push && npm start",
    "healthcheckPath": "/api/health",
    "healthcheckTimeout": 300,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

### 2. 精确CORS配置 ✅

**修改前**:
```javascript
app.use(cors({
  origin: true, // 允许所有源
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Origin', 'Accept']
}));
```

**修改后**:
```javascript
app.use(cors({
  origin: ['https://usde-frontend-usde.up.railway.app', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Origin', 'Accept']
}));
```

### 3. 添加调试端点 ✅

添加了 `/api/debug-cors` 端点来测试CORS配置：
```javascript
app.get('/api/debug-cors', (req, res) => {
  res.json({
    message: 'CORS is working!',
    origin: req.headers.origin,
    method: req.method,
    headers: req.headers
  });
});
```

### 4. 创建测试脚本 ✅

创建了 `backend/test-cors.js` 来测试CORS配置。

## 部署步骤

1. **部署后端**:
```bash
./deploy-backend-fix.sh
```

2. **测试CORS**:
```bash
cd backend
node test-cors.js
```

3. **验证修复**:
- 访问: https://optimistic-fulfillment-production.up.railway.app/api/debug-cors
- 测试登录功能

## 验证方法

### 方法1: 浏览器测试
1. 打开浏览器开发者工具
2. 访问前端应用
3. 尝试登录
4. 检查Network标签页是否有CORS错误

### 方法2: 命令行测试
```bash
# 测试OPTIONS预检请求
curl -X OPTIONS \
  -H "Origin: https://usde-frontend-usde.up.railway.app" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type,Authorization" \
  https://optimistic-fulfillment-production.up.railway.app/api/auth/login

# 测试GET请求
curl -H "Origin: https://usde-frontend-usde.up.railway.app" \
  https://optimistic-fulfillment-production.up.railway.app/api/debug-cors
```

### 方法3: 使用测试脚本
```bash
cd backend
node test-cors.js
```

## 预期结果

部署成功后：
- ✅ 浏览器控制台不再显示CORS错误
- ✅ 登录功能正常工作
- ✅ `/api/debug-cors` 端点返回正确的CORS头
- ✅ OPTIONS预检请求返回正确的CORS头

## 故障排除

如果问题仍然存在：

1. **检查Railway日志**:
```bash
railway logs --service optimistic-fulfillment-production
```

2. **检查环境变量**:
```bash
railway variables --service optimistic-fulfillment-production
```

3. **重启服务**:
```bash
railway restart --service optimistic-fulfillment-production
```

4. **检查网络连接**:
```bash
curl -I https://optimistic-fulfillment-production.up.railway.app/api/health
``` 