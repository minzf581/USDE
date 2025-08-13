# 用户角色系统更新

## 概述

本次更新将用户角色系统统一为4个标准角色，移除了旧的角色定义。

## 新的角色系统

### 1. `admin` - 系统管理员
- **权限**: 完整的系统管理权限
- **功能**: 用户管理、KYC审批、系统设置等
- **导航**: Admin Dashboard, Settings

### 2. `enterprise_admin` - 企业管理员
- **权限**: 企业级管理权限
- **功能**: 用户管理、财务管理、KYC管理等
- **导航**: Dashboard, User Management, Payments, Stakes, Deposits, Withdrawals, KYC, Settings

### 3. `enterprise_finance_manager` - 企业财务管理员
- **权限**: 财务管理和审批权限
- **功能**: 支付管理、审批流程、财务报告等
- **导航**: Dashboard, Payments, Stakes, Deposits, Withdrawals, KYC, Settings

### 4. `enterprise_finance_operator` - 企业财务操作员
- **权限**: 基本财务操作权限
- **功能**: 支付操作、查看报告、KYC查看等
- **导航**: Dashboard, Payments, Stakes, Deposits, Withdrawals, KYC, Settings

## 已移除的角色

- `system_admin` → 更新为 `admin`
- `enterprise_user` → 更新为 `enterprise_finance_operator`
- `finance_manager` → 更新为 `enterprise_finance_manager`
- `finance_operator` → 更新为 `enterprise_finance_operator`
- `observer` → 更新为 `enterprise_finance_operator`

## 更新的文件

### 数据库模式
- `backend/prisma/schema.prisma` - 更新角色注释

### 种子文件
- `backend/prisma/seed-users.js` - 更新默认用户角色
- `backend/prisma/seed-enterprise.js` - 更新企业角色定义
- `backend/prisma/seed-rbac.js` - 更新RBAC角色和权限

### 路由文件
- `backend/routes/admin.js` - 更新角色验证和统计
- `backend/routes/enterprise.js` - 更新企业用户角色验证

### 前端文件
- `frontend/src/components/Layout.js` - 已修复导航菜单问题

### 新增文件
- `backend/update-user-roles.js` - 用户角色迁移脚本
- `backend/update-roles-deploy.sh` - 部署脚本

## 部署步骤

1. **运行更新脚本**:
   ```bash
   cd backend
   ./update-roles-deploy.sh
   ```

2. **重启服务**:
   ```bash
   # 重启后端
   cd backend
   npm start
   
   # 重启前端
   cd frontend
   npm start
   ```

## 验证步骤

1. **检查数据库角色**:
   ```bash
   cd backend
   node -e "
   const { PrismaClient } = require('@prisma/client');
   const prisma = new PrismaClient();
   
   async function checkRoles() {
     const roles = await prisma.company.groupBy({
       by: ['role'],
       _count: true
     });
     console.log('当前角色分布:', roles);
     await prisma.\$disconnect();
   }
   checkRoles();
   "
   ```

2. **测试用户登录**:
   - 使用默认用户登录测试各个角色
   - 验证导航菜单显示正确
   - 确认权限控制正常工作

## 默认用户

更新后的默认用户：

- **Admin**: admin@usde.com / admin123
- **Demo User**: demo@usde.com / demo123  
- **Enterprise Admin**: enterprise@usde.com / enterprise123
- **Enterprise Finance Operator**: user@usde.com / user123

## 注意事项

1. **数据迁移**: 脚本会自动将现有用户的旧角色映射到新角色
2. **权限继承**: 新角色继承了原有角色的所有权限
3. **向后兼容**: 前端代码已经适配新的角色系统
4. **错误修复**: 解决了Layout组件中的导航菜单错误

## 故障排除

如果遇到问题：

1. **检查数据库连接**: 确保数据库服务正常运行
2. **验证角色更新**: 运行角色检查脚本确认更新成功
3. **清除缓存**: 清除浏览器缓存和localStorage
4. **查看日志**: 检查服务器日志获取详细错误信息



