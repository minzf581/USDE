# Treasury Control 系统集成设计文档

## 🎯 设计目标

将Treasury Control功能集成到现有USDE平台中，作为企业级用户的升级功能，而不是独立的新系统。

## 🔄 系统架构调整

### 原有系统架构
```
用户角色：
- 系统管理员 (System Admin) - 管理整个平台
- 普通用户 (User) - 基础功能用户
```

### 升级后系统架构
```
用户角色：
- 系统管理员 (System Admin) - 管理整个平台，与Treasury Control无关
- 企业管理员 (Enterprise Admin) - 管理企业级财务控制
- 企业财务主管 (Enterprise Finance Manager) - 审批财务操作
- 企业财务操作员 (Enterprise Finance Operator) - 执行财务操作
- 企业观察员 (Enterprise Observer) - 只读权限
- 普通用户 (User) - 基础功能用户
```

## 👥 用户角色重新定义

### 1. 系统管理员 (System Admin)
- **功能范围**：整个USDE平台管理
- **Treasury Control权限**：无访问权限
- **主要功能**：
  - 平台用户管理
  - 系统配置
  - 平台级审计日志
  - 与Treasury Control完全独立

### 2. 企业管理员 (Enterprise Admin) - 新角色
- **注册方式**：用户注册时默认成为企业管理员
- **功能范围**：企业级财务控制
- **主要功能**：
  - 企业用户管理
  - 财务审批设置
  - 预算管理
  - 企业级审计日志
  - 财务报表

### 3. 企业财务主管 (Enterprise Finance Manager)
- **创建方式**：由企业管理员创建
- **功能范围**：财务审批和报告
- **主要功能**：
  - 审批支付/提现请求
  - 查看财务报告
  - 查看审计日志

### 4. 企业财务操作员 (Enterprise Finance Operator)
- **创建方式**：由企业管理员创建
- **功能范围**：财务操作执行
- **主要功能**：
  - 发起支付/提现
  - 查看财务报告
  - 查看基础审计信息

### 5. 企业观察员 (Enterprise Observer)
- **创建方式**：由企业管理员创建
- **功能范围**：只读权限
- **主要功能**：
  - 查看财务报告
  - 查看基础审计信息

## 🎨 界面修改设计

### 1. 注册流程调整

#### 注册页面修改
```
注册表单：
- 姓名 (Name)
- 邮箱 (Email) 
- 密码 (Password)
- 确认密码 (Confirm Password)
- 企业名称 (Company Name) - 新增
- 企业类型 (Company Type) - 新增
- 同意条款 (Terms & Conditions)

注册后：
- 用户自动成为企业管理员
- 创建企业实体
- 分配企业管理员权限
```

### 2. 登录后界面调整

#### 左侧菜单栏修改
```
原有菜单：
- Dashboard
- Profile  
- Payments
- Stakes
- Deposits
- Withdrawals
- KYC

企业管理员登录后新增菜单：
- Dashboard
- Profile
- Payments
- Stakes
- Deposits
- Withdrawals
- KYC
- 企业用户管理 (Enterprise User Management) - 新增
- 财务控制 (Treasury Control) - 新增
```

#### 菜单显示逻辑
```
if (user.role === 'system_admin') {
  // 显示系统管理员菜单
  // 不显示企业相关菜单
} else if (user.isEnterpriseAdmin) {
  // 显示企业管理员菜单
  // 包含企业用户管理和财务控制
} else if (user.isEnterpriseUser) {
  // 显示企业用户菜单
  // 根据具体角色显示不同功能
} else {
  // 显示普通用户菜单
}
```

### 3. 企业用户管理界面

#### 页面路径：`/enterprise/users`
```
功能模块：
1. 用户列表 (User List)
   - 显示所有企业用户
   - 用户状态 (活跃/非活跃)
   - 角色信息
   - KYC状态
   - 最后登录时间

2. 创建用户 (Create User)
   - 用户基本信息
   - 角色选择 (财务主管/财务操作员/观察员)
   - 权限预览

3. 用户详情 (User Details)
   - 用户信息编辑
   - 角色权限管理
   - 操作历史

4. 批量操作 (Bulk Operations)
   - 批量激活/停用
   - 批量角色调整
```

### 4. 财务控制界面

#### 页面路径：`/treasury`
```
功能模块：
1. 仪表盘 (Dashboard)
   - 企业财务概览
   - 待审批事项
   - 财务指标

2. 审批中心 (Approval Center)
   - 待审批列表
   - 审批历史
   - 审批设置

3. 预算管理 (Budget Management)
   - 预算设置
   - 预算使用情况
   - 超预算警告

4. 财务报告 (Financial Reports)
   - 月度报告
   - 季度报告
   - 自定义报告

5. 审计日志 (Audit Logs)
   - 操作日志
   - 登录日志
   - 导出功能
```

## 🔐 权限系统设计

### 权限矩阵
```
权限\角色          系统管理员  企业管理员  财务主管  财务操作员  观察员  普通用户
系统管理            ✅         ❌         ❌       ❌         ❌     ❌
企业用户管理        ❌         ✅         ❌       ❌         ❌     ❌
财务控制设置        ❌         ✅         ❌       ❌         ❌     ❌
财务审批            ❌         ✅         ✅       ❌         ❌     ❌
财务操作            ❌         ✅         ✅       ✅         ❌     ❌
财务报告查看        ❌         ✅         ✅       ✅         ✅     ❌
基础功能            ✅         ✅         ✅       ✅         ✅     ✅
```

### 数据隔离
```
企业管理员只能管理：
- 自己创建的企业用户
- 自己企业的财务数据
- 自己企业的审计日志

系统管理员可以管理：
- 所有平台用户
- 所有企业数据
- 系统级配置
```

## 🗄️ 数据库设计调整

### 1. Company表修改
```sql
ALTER TABLE Company ADD COLUMN:
- isEnterpriseAdmin BOOLEAN DEFAULT FALSE
- isEnterpriseUser BOOLEAN DEFAULT FALSE
- enterpriseId STRING (企业ID，企业管理员为NULL)
- enterpriseRole STRING (企业内角色)
```

### 2. 新增企业实体表
```sql
CREATE TABLE Enterprise (
  id STRING PRIMARY KEY
  name STRING
  adminId STRING (企业管理员ID)
  createdAt DATETIME
  updatedAt DATETIME
)
```

### 3. 企业用户关系表
```sql
CREATE TABLE EnterpriseUser (
  id STRING PRIMARY KEY
  enterpriseId STRING
  userId STRING
  role STRING (enterprise_admin/finance_manager/finance_operator/observer)
  createdAt DATETIME
)
```

## 🔄 迁移策略

### 1. 现有用户处理
```
现有用户迁移：
- 系统管理员保持不变
- 普通用户可选择升级为企业管理员
- 提供升级向导
```

### 2. 数据迁移
```
数据迁移步骤：
1. 创建企业实体
2. 分配企业管理员
3. 迁移现有数据
4. 设置默认权限
```

## 🎯 用户体验设计

### 1. 角色切换
```
用户登录后：
- 显示当前角色信息
- 提供角色切换选项（如果有多重角色）
- 显示可用功能模块
```

### 2. 权限提示
```
权限不足时：
- 显示友好的权限提示
- 提供升级路径
- 联系管理员选项
```

### 3. 引导流程
```
新企业管理员：
- 欢迎页面
- 功能引导
- 快速设置向导
```

## 📋 开发计划

### 阶段1：基础架构
1. 数据库结构调整
2. 用户角色系统升级
3. 权限系统重构

### 阶段2：企业用户管理
1. 企业用户管理界面
2. 用户创建和角色分配
3. 权限管理功能

### 阶段3：财务控制集成
1. 财务控制界面集成
2. 审批流程实现
3. 报告和审计功能

### 阶段4：测试和优化
1. 功能测试
2. 性能优化
3. 用户体验优化

## ❓ 确认问题

请确认以下设计要点：

1. **用户注册**：新用户注册时是否默认成为企业管理员？
2. **菜单显示**：企业管理员是否应该看到原有的基础功能菜单？
3. **权限隔离**：企业管理员是否只能管理自己企业的用户和数据？
4. **角色命名**：企业内角色命名是否合适？
5. **数据迁移**：现有用户数据如何处理？
6. **界面风格**：企业功能界面是否保持与原有系统一致的设计风格？

请确认这个设计方案是否符合您的需求，我将根据您的反馈进行相应的开发工作。 