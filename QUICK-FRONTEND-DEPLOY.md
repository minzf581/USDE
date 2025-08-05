# 快速前端部署指南

## 🚀 立即解决方案

### 方案1：使用Vercel（推荐，5分钟部署）

1. **访问Vercel**
   - 打开 [vercel.com](https://vercel.com)
   - 使用GitHub账号登录

2. **导入项目**
   - 点击 "New Project"
   - 选择你的GitHub仓库
   - 设置根目录为 `frontend`

3. **配置环境变量**
   - 在项目设置中添加：
   ```
   REACT_APP_API_URL=https://usde-usde.up.railway.app/api
   REACT_APP_ENVIRONMENT=production
   ```

4. **部署**
   - 点击 "Deploy"
   - 等待构建完成

### 方案2：使用Railway部署前端

1. **创建新Railway项目**
   - 在Railway Dashboard中创建新项目
   - 连接GitHub仓库
   - 设置根目录为 `frontend`

2. **配置环境变量**
   ```
   REACT_APP_API_URL=https://usde-usde.up.railway.app/api
   REACT_APP_ENVIRONMENT=production
   ```

3. **部署**
   - Railway会自动检测配置并部署

## 📊 验证部署

### 部署成功后：
1. 访问前端URL（如：`https://usde-frontend.vercel.app`）
2. 应该看到登录页面
3. 使用默认用户登录：
   - **Admin**: admin@usde.com / admin123
   - **Demo**: demo@usde.com / demo123

### 预期结果：
- ✅ 看到登录页面而不是API响应
- ✅ 登录功能正常工作
- ✅ 可以访问仪表板
- ✅ 所有功能正常

## 🔧 如果遇到问题

### 问题1：前端无法连接API
**解决：** 检查 `REACT_APP_API_URL` 环境变量是否正确

### 问题2：CORS错误
**解决：** 后端CORS配置已更新，支持多个前端域名

### 问题3：登录后页面空白
**解决：** 检查浏览器控制台，确认API调用成功

## 🎯 推荐流程

1. **立即使用Vercel部署**（最简单）
2. **测试登录功能**
3. **验证所有页面正常**
4. **分享前端URL给用户**

## 📞 支持

如果遇到问题：
1. 检查环境变量设置
2. 确认后端API可访问
3. 查看部署日志
4. 测试API端点 