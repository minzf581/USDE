# Railway PostgreSQL 部署修复指南

## 问题描述
Railway部署失败，主要原因是Prisma配置仍然指向SQLite数据库，而不是PostgreSQL。

## 已修复的问题

### 1. Prisma Schema 配置
- ✅ 将 `datasource db` 从 SQLite 改为 PostgreSQL
- ✅ 使用环境变量 `DATABASE_URL` 而不是硬编码路径

### 2. Railway 启动脚本
- ✅ 创建了 `railway-start.sh` 脚本
- ✅ 确保正确的数据库连接和schema推送
- ✅ 添加了详细的日志输出

### 3. 部署配置
- ✅ 更新了 `railway.json` 配置
- ✅ 添加了PostgreSQL迁移脚本
- ✅ 创建了部署检查工具

## 部署步骤

### 1. 确保环境变量设置正确
在Railway项目设置中，确保以下环境变量已设置：
```
DATABASE_URL=postgresql://postgres:SOzxfxdDXTsVjKQJLTyeGHeKnxlQHQLR@yamabiko.proxy.rlwy.net:58370/railway
NODE_ENV=production
PORT=8080
```

### 2. 重新部署
```bash
# 在本地测试
cd backend
npm run railway:check

# 提交更改到Git
git add .
git commit -m "Fix Railway PostgreSQL deployment"
git push

# Railway会自动重新部署
```

### 3. 验证部署
部署完成后，检查以下端点：
- `/api/health` - 健康检查
- 查看Railway日志确认数据库连接成功

## 关键修复点

1. **数据库提供者**: 从 `sqlite` 改为 `postgresql`
2. **连接字符串**: 使用环境变量而不是硬编码路径
3. **启动流程**: 确保正确的数据库初始化顺序
4. **错误处理**: 添加了详细的日志和错误检查

## 故障排除

### 如果仍然失败：
1. 检查Railway日志中的具体错误信息
2. 确认 `DATABASE_URL` 环境变量已正确设置
3. 运行 `npm run railway:check` 进行本地诊断
4. 检查PostgreSQL连接是否可达

### 常见问题：
- **权限错误**: 确保数据库用户有足够权限
- **连接超时**: 检查网络配置和防火墙设置
- **Schema冲突**: 使用 `--accept-data-loss` 标志处理现有数据

## 预期结果
修复后，你应该看到：
```
✅ Database connection successful!
✅ Prisma client generated
✅ Database schema pushed
🚀 Server running on port 8080
```

而不是之前的SQLite相关错误。
