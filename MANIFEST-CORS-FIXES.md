# Manifest 和 CORS 问题修复

## 问题1：Manifest 错误
**错误信息**: `Manifest: Line: 1, column: 1, Syntax error.`

### 原因
- 前端缺少 `manifest.json` 文件
- `index.html` 中引用了不存在的 manifest 文件

### 修复方案
1. ✅ 创建了 `frontend/public/manifest.json` 文件
2. ✅ 添加了基本的 PWA 配置
3. ✅ 创建了 `favicon.ico` 文件

### 文件内容
```json
{
  "short_name": "USDE",
  "name": "USDE Enterprise Platform",
  "icons": [
    {
      "src": "favicon.ico",
      "sizes": "64x64 32x32 24x24 16x16",
      "type": "image/x-icon"
    }
  ],
  "start_url": ".",
  "display": "standalone",
  "theme_color": "#0D43F9",
  "background_color": "#ffffff"
}
```

## 问题2：CORS 错误
**错误信息**: `Access to XMLHttpRequest at 'https://optimistic-fulfillment-production.up.railway.app/api/auth/login' from origin 'https://usde-frontend-usde.up.railway.app' has been blocked by CORS policy`

### 原因
- CORS 中间件配置问题
- 预检请求处理不当
- Helmet 安全策略过于严格

### 修复方案
1. ✅ 重新排序中间件，CORS 必须在 Helmet 之前
2. ✅ 简化 CORS 配置，允许所有来源（临时解决方案）
3. ✅ 添加预检请求处理：`app.options('*', cors())`
4. ✅ 更新 Helmet 配置，允许跨域资源访问
5. ✅ 添加更多允许的请求头

### 关键修改
```javascript
// CORS middleware - must be before other middleware
app.use(cors({
  origin: true, // Allow all origins temporarily
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Origin', 'Accept']
}));

// Handle CORS preflight requests
app.options('*', cors());

// Security middleware with relaxed CSP
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", "https://optimistic-fulfillment-production.up.railway.app"]
    }
  }
}));
```

## 部署步骤

1. 运行部署脚本：
```bash
./deploy-fixes.sh
```

2. 或者手动部署：
```bash
# 部署后端
cd backend
railway up --service optimistic-fulfillment-production

# 部署前端
cd ../frontend
railway up --service usde-frontend-usde
```

## 验证修复

1. 检查 manifest 错误是否消失
2. 测试登录功能是否正常工作
3. 检查浏览器控制台是否还有 CORS 错误

## 注意事项

- 当前 CORS 配置允许所有来源，仅用于快速修复
- 生产环境应该限制允许的来源
- 建议在问题解决后恢复更严格的 CORS 策略 