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
企业管理员登录后菜单：
- Dashboard (包含Treasury Control功能)
- User Management (包含Profile功能)
- Payments
- Stakes
- Deposits
- Withdrawals
- KYC
- Settings (包含Enterprise Settings功能)

企业财务主管 登录后菜单：
- Dashboard (有财务审批功能)
- Payments
- Stakes
- Deposits
- Withdrawals
- KYC
- Settings (不包含Enterprise Settings功能)

企业财务操作员登录后菜单：
- Dashboard (无财务审批功能)
- Payments
- Stakes
- Deposits
- Withdrawals
- KYC
- Settings (不包含Enterprise Settings功能)
```

#### 菜单显示逻辑
```
if (user.role === 'system_admin') {
  // 显示系统管理员菜单
  // 不显示企业相关菜单
} else if (user.role === 'enterprise_admin') {
  // 显示企业管理员菜单
  // 包含所有基础功能和企业功能
} else if (user.role === 'enterprise_finance_manager') {
    // 显示企业财务经理菜单
    // 包含基础功能和财务审批功能
} else if (user.role === 'enterprise_finance_operator') {
    // 显示财务操作员菜单
    // 包含基础功能，不包含审批功能
}
```

### 3. Dashboard集成Treasury Control功能

#### Dashboard页面增强
```
功能模块：
1. 待审批事项 (Prominent Display) - 仅企业管理员和财务主管可见
   - 显示在页面顶部
   - 黄色背景突出显示
   - 显示待审批数量
   - 快速审批按钮

2. 财务概览 (Overview Tab)
   - 总资产
   - 月度支付
   - 月度提现

3. 财务报告 (Reports Tab)
   - 月度报告
   - 支付统计
   - 提现统计

4. 审计日志 (Audit Logs Tab)
   - 操作日志
   - 登录日志
   - 时间戳和IP地址
```

### 4. User Management界面

#### 页面路径：`/enterprise/users`
```
功能模块：
1. Profile Tab
   - 公司信息编辑
   - 账户信息显示
   - KYC状态显示

2. Enterprise Users Tab - 仅企业管理员可见
   - 用户列表 (User List)
   - 创建用户 (Create User)
   - 用户详情 (User Details)
   - 批量操作 (Bulk Operations)
```

### 5. Settings界面

#### 页面路径：`/settings`
```
功能模块：
1. Profile Tab
   - 公司信息编辑
   - 账户信息显示
   - KYC状态显示

2. Enterprise Settings Tab - 仅企业管理员可见
   - 预算设置
   - 审批设置
   - 风险控制设置
   - 企业信息显示
```

## 🔐 权限系统设计

### 权限矩阵
```
权限\角色          系统管理员  企业管理员  财务主管  财务操作员
系统管理            ✅         ❌         ❌       ❌
企业用户管理        ❌         ✅         ❌       ❌
财务控制设置        ❌         ✅         ❌       ❌
财务审批            ❌         ✅         ✅       ❌
财务操作            ❌         ✅         ✅       ✅
财务报告查看        ❌         ✅         ✅       ✅
基础功能            ✅         ✅         ✅       ✅
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
- enterpriseRole STRING (enterprise_admin/finance_manager/finance_operator)
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
  role STRING (enterprise_admin/finance_manager/finance_operator)
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

### 阶段1：基础架构 ✅
1. 数据库结构调整
2. 用户角色系统升级
3. 权限系统重构

### 阶段2：企业用户管理 ✅
1. 企业用户管理界面
2. 用户创建和角色分配
3. 权限管理功能

### 阶段3：财务控制集成 ✅
1. Dashboard集成Treasury Control功能
2. 审批流程实现
3. 报告和审计功能

### 阶段4：测试和优化 ✅
1. 功能测试
2. 性能优化
3. 用户体验优化

## ✅ 当前实现状态

### 已完成的修改：

1. **菜单结构调整**：
   - 移除了独立的Treasury Control菜单
   - 移除了Debug菜单
   - 将Enterprise Users重命名为User Management
   - 将Profile功能集成到User Management中
   - 将Enterprise Settings集成到Settings中
   - 最终菜单结构：Dashboard, User Management, Payments, Stakes, Deposits, Withdrawals, KYC, Settings

2. **Dashboard增强**：
   - 在顶部添加了待审批事项的突出显示
   - 在底部添加了Treasury Control的TAB功能
   - 包含Overview、Reports、Audit Logs三个TAB
   - 实现了快速审批功能

3. **User Management页面**：
   - 包含Profile和Enterprise Users两个TAB
   - Profile TAB包含公司信息编辑和账户信息显示
   - Enterprise Users TAB包含用户管理功能

4. **Settings页面**：
   - 包含Profile和Enterprise Settings两个TAB
   - Profile TAB包含公司信息编辑
   - Enterprise Settings TAB包含企业财务控制设置

5. **路由更新**：
   - 添加了/settings路由
   - 移除了/profile、/treasury、/enterprise/settings、/debug路由
   - 保留了/enterprise/users路由

### 技术实现细节：

1. **组件重构**：
   - 修复了Treasury.js中的loadInitialData初始化问题
   - 更新了Layout.js中的导航菜单逻辑
   - 创建了新的Settings.js组件
   - 更新了EnterpriseUsers.js组件以包含Profile功能
   - 增强了Dashboard.js组件以包含Treasury Control功能

2. **API集成**：
   - 集成了Treasury Control的API调用
   - 实现了审批流程的API调用
   - 实现了报告和日志的API调用

3. **用户体验优化**：
   - 待审批事项使用黄色背景突出显示
   - 添加了快速审批按钮
   - 实现了TAB切换功能
   - 保持了与原有系统一致的设计风格

## ❓确认问题

确认以下设计要点：

1. **用户注册**：新用户注册时默认成为企业管理员 ✅
2. **菜单显示**：企业管理员看到简化的菜单结构，Treasury Control功能集成到Dashboard中 ✅
3. **权限隔离**：企业管理员只能管理自己企业的用户和数据 ✅
4. **角色命名**：企业内角色命名合适 ✅
5. **数据迁移**：现有用户数据升级为企业管理员 ✅
6. **界面风格**：企业功能界面保持与原有系统一致的设计风格 ✅
7. **功能集成**：Treasury Control功能已集成到Dashboard中，不再作为独立菜单 ✅
8. **角色简化**：删除了普通用户和企业观察员角色，简化了系统复杂度 ✅