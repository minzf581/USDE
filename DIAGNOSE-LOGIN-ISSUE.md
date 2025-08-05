# 登录问题诊断指南

## 🔍 问题分析

登录失败的原因可能是：
1. **前端API URL错误** - 使用了内部URL而不是外部URL
2. **CORS配置问题** - 后端不允许前端域名访问
3. **数据库用户不存在** - 种子数据未正确加载
4. **网络连接问题** - 服务间无法通信

## ✅ 已修复的问题

### 1. 前端API URL
- ✅ 更新了 `frontend/env.production` 使用正确的外部URL
- ✅ 从内部URL改为外部URL

### 2. 后端CORS配置
- ✅ 更新了CORS配置包含新的前端域名
- ✅ 添加了多个前端域名支持

### 3. 诊断脚本
- ✅ 创建了数据库用户检查脚本
- ✅ 创建了API连接测试脚本

## 🚀 诊断步骤

### 步骤1：检查数据库用户
```bash
cd backend
node check-db-users.js
```

预期输出：
```
✅ Admin user found:
  - Email: admin@usde.com
  - Role: admin
  - Status: approved
  - Active: true
```

### 步骤2：测试API连接
```bash
cd backend
node test-api-connection.js
```

预期输出：
```
✅ Health check successful
✅ Login successful
✅ Demo login successful
```

### 步骤3：检查前端配置
确认 `frontend/env.production` 内容：
```env
REACT_APP_API_URL=https://optimistic-fulfillment-production.up.railway.app/api
REACT_APP_ENVIRONMENT=production
```

### 步骤4：检查后端环境变量
确认后端服务环境变量：
```env
FRONTEND_URL=https://optimistic-fulfillment-production.up.railway.app
```

## 🔧 手动测试

### 1. 测试后端健康检查
访问：`https://optimistic-fulfillment-production.up.railway.app/api/health`

### 2. 测试登录API
使用curl测试：
```bash
curl -X POST https://optimistic-fulfillment-production.up.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@usde.com","password":"admin123"}'
```

### 3. 测试前端连接
在浏览器控制台中测试：
```javascript
fetch('https://optimistic-fulfillment-production.up.railway.app/api/health')
  .then(response => response.json())
  .then(data => console.log(data));
```

## 🆘 常见问题解决

### 问题1：ERR_CONNECTION_CLOSED
**原因：** 使用了内部URL
**解决：** 使用外部URL `https://optimistic-fulfillment-production.up.railway.app`

### 问题2：CORS错误
**原因：** 后端不允许前端域名
**解决：** 更新后端CORS配置

### 问题3：用户不存在
**原因：** 种子数据未加载
**解决：** 重新运行种子脚本

### 问题4：认证失败
**原因：** 密码不匹配或用户状态问题
**解决：** 检查用户状态和密码

## 📊 验证修复

修复成功后应该看到：
- ✅ 数据库中有admin和demo用户
- ✅ API健康检查返回200
- ✅ 登录API返回token
- ✅ 前端可以成功登录
- ✅ 没有CORS错误

## 📞 支持

如果问题持续存在：
1. 运行诊断脚本
2. 检查Railway日志
3. 验证环境变量
4. 测试API端点 