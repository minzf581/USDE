# CORS 修复指南

## 🔍 问题分析

CORS错误显示：
```
Access to XMLHttpRequest at 'https://optimistic-fulfillment-production.up.railway.app/api/auth/login' 
from origin 'https://usde-frontend-usde.up.railway.app' has been blocked by CORS policy
```

**问题根源：**
1. **前端域名不匹配** - 实际域名是 `usde-frontend-usde.up.railway.app`
2. **CORS配置不完整** - 缺少正确的域名和头部配置
3. **预检请求失败** - OPTIONS请求被阻止

## ✅ 已修复的问题

### 1. 更新CORS配置
- ✅ 添加了实际的前端域名 `usde-frontend-usde.up.railway.app`
- ✅ 添加了正则表达式匹配所有Railway域名
- ✅ 明确指定了允许的方法和头部

### 2. 前端环境变量
- ✅ 更新了前端域名配置
- ✅ 确保API URL正确

### 3. 调试工具
- ✅ 创建了CORS调试脚本
- ✅ 添加了详细的日志记录

## 🚀 修复后的CORS配置

```javascript
app.use(cors({
  origin: [
    'https://usde-frontend-usde.up.railway.app',
    'https://optimistic-fulfillment-production.up.railway.app',
    // Allow all Railway domains
    /^https:\/\/.*\.up\.railway\.app$/,
    /^https:\/\/.*\.railway\.app$/
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
```

## 📊 验证修复

### 1. 测试CORS配置
```bash
# 在浏览器控制台中测试
fetch('https://optimistic-fulfillment-production.up.railway.app/api/health')
  .then(response => response.json())
  .then(data => console.log('CORS test:', data));
```

### 2. 测试登录API
```bash
curl -X POST https://optimistic-fulfillment-production.up.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -H "Origin: https://usde-frontend-usde.up.railway.app" \
  -d '{"email":"admin@usde.com","password":"admin123"}'
```

### 3. 检查预检请求
```bash
curl -X OPTIONS https://optimistic-fulfillment-production.up.railway.app/api/auth/login \
  -H "Origin: https://usde-frontend-usde.up.railway.app" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -v
```

## 🎯 预期结果

修复成功后应该看到：
- ✅ 没有CORS错误
- ✅ 预检请求返回200状态
- ✅ 登录请求成功
- ✅ 响应头包含正确的CORS头部

## 🔧 如果仍有问题

### 问题1：仍然有CORS错误
**解决方案：**
1. 检查Railway日志中的CORS配置
2. 确认域名完全匹配
3. 验证环境变量设置

### 问题2：预检请求失败
**解决方案：**
1. 确保OPTIONS方法被允许
2. 检查allowedHeaders配置
3. 验证credentials设置

### 问题3：特定域名不工作
**解决方案：**
1. 添加具体的域名到origin列表
2. 使用正则表达式匹配
3. 检查域名拼写

## 📞 支持

如果问题持续存在：
1. 运行CORS调试脚本
2. 检查Railway部署日志
3. 验证域名配置
4. 测试预检请求 