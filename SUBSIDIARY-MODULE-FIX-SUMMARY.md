# 子公司管理模块问题修复总结

## 问题描述
用户使用 demo@usde.com 登录后，没有看到子公司管理模块。

## 问题分析

### 1. 根本原因
- **字段缺失**：Prisma schema中Company模型缺少`role`字段
- **角色未设置**：demo用户的`role`字段值为`undefined`
- **前端判断逻辑**：Layout组件根据`user?.role === 'enterprise_admin'`来决定是否显示子公司管理模块

### 2. 具体问题
- 后端`/auth/profile`接口没有返回`role`字段
- 前端无法获取用户角色信息
- 导航菜单无法正确显示

## 解决方案

### 1. 数据库Schema更新
- 在`Company`模型中添加`role`字段
- 设置默认值为`'enterprise_user'`
- 运行数据库迁移

### 2. 后端接口修复
- 修改`/auth/profile`接口，返回用户角色信息
- 确保包含以下字段：
  - `role`
  - `isEnterpriseAdmin`
  - `isEnterpriseUser`
  - `enterpriseRole`

### 3. 用户角色设置
- 重新创建demo用户
- 设置角色为`'enterprise_admin'`
- 设置类型为`'enterprise'`

## 修复步骤

### 步骤1：更新Prisma Schema
```prisma
model Company {
  // ... existing fields
  role        String   @default("enterprise_user") // enterprise_admin, enterprise_user, admin, etc.
  // ... other fields
}
```

### 步骤2：运行数据库迁移
```bash
npx prisma migrate dev --name add_role_field_to_company
```

### 步骤3：重新生成Prisma客户端
```bash
npx prisma generate
```

### 步骤4：创建demo用户
```bash
node create-demo-user.js
```

## 修复后的效果

### 用户角色
- **demo@usde.com**: `enterprise_admin`
- **类型**: `enterprise`
- **KYC状态**: `approved`

### 导航菜单
现在demo用户登录后可以看到以下菜单：
- Dashboard
- User Management
- **Subsidiaries** ← 子公司管理模块
- Payments
- Stakes
- Deposits
- Withdrawals
- KYC
- Settings

## 注意事项

1. **数据库迁移**：添加新字段会重置数据库，需要重新创建用户
2. **角色权限**：确保用户角色与前端权限判断逻辑一致
3. **字段同步**：前后端字段名必须保持一致

## 测试建议

1. 使用demo@usde.com登录
2. 验证是否看到子公司管理模块
3. 检查用户角色信息是否正确显示
4. 测试子公司相关功能是否正常工作

## 后续改进

1. 完善角色权限系统
2. 添加子公司创建和管理功能
3. 实现跨公司转账和报表功能
4. 添加用户角色管理界面
