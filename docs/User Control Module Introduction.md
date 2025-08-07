# User Control Module Introduction

## 概述

User Control模块是USDE企业平台的核心用户管理和权限控制系统，实现了基于角色的访问控制（RBAC），支持系统管理员、企业管理员和企业用户的不同权限级别。该模块提供了完整的用户管理、KYC审批、提现审批和审计日志功能。

## 主要功能

### ✅ 核心功能
- **用户角色系统**: 支持system_admin、enterprise_admin、enterprise_user三种角色
- **身份验证与登录**: JWT token认证机制
- **基于角色的访问控制**: 细粒度的权限管理
- **管理员后台面板**: 用户管理、KYC审批、提现审批
- **审计日志系统**: 完整的管理操作记录
- **种子用户初始化**: 默认管理员和演示用户

### 🔧 技术特性
- **权限中间件**: 灵活的权限控制机制
- **KYC状态验证**: 自动检查用户KYC状态
- **实时状态更新**: 用户状态和权限实时同步
- **安全审计**: 所有管理操作都有详细日志记录

## 模块结构

### 📁 后端文件结构

```
backend/
├── middleware/
│   └── auth.js                 # 权限控制中间件
├── routes/
│   ├── auth.js                 # 认证路由（更新）
│   └── admin.js                # 管理员路由
├── prisma/
│   ├── schema.prisma           # 数据库模型（更新）
│   └── seed-users.js           # 种子用户脚本
└── server.js                   # 服务器配置（更新）
```

### 📁 前端文件结构

```
frontend/src/
├── pages/
│   └── Admin.js                # 管理员仪表板
├── components/
│   └── Layout.js               # 布局组件（更新）
├── services/
│   └── api.js                  # API服务（更新）
└── App.js                      # 应用路由（更新）
```

## 核心文件详解

### 1. `backend/middleware/auth.js`
**功能**: 权限控制中间件
**主要方法**:
- `verifyToken()` - JWT token验证
- `requireRole(roles)` - 角色权限检查
- `requireSystemAdmin` - 系统管理员权限检查
- `requireEnterpriseAdmin` - 企业管理员权限检查
- `requireEnterpriseUser` - 企业用户权限检查
- `requireAdmin` - 管理员权限检查（系统管理员或企业管理员）
- `requireUser` - 用户权限检查
- `requireKYCApproved` - KYC状态检查
- `logAudit()` - 审计日志记录

**权限控制**:
- 支持多角色权限验证
- 自动KYC状态检查
- 完整的审计日志记录

### 2. `backend/routes/admin.js`
**功能**: 管理员API路由
**主要端点**:
- `GET /api/admin/users` - 获取用户列表
- `GET /api/admin/users/:userId` - 获取用户详情（包含财务信息等）
- `PUT /api/admin/users/:userId/status` - 更新用户状态
- `PUT /api/admin/users/:userId` - 修改用户信息（仅系统管理员）
- `DELETE /api/admin/users/:userId` - 删除用户（仅系统管理员）
- `PUT /api/admin/kyc/:userId/approve` - KYC审批
- `GET /api/admin/withdrawals/pending` - 获取待审批提现
- `PUT /api/admin/withdrawals/:withdrawalId/approve` - 提现审批
- `GET /api/admin/stats` - 获取平台统计
- `GET /api/admin/audit-logs` - 获取审计日志

**功能特性**:
- 用户管理和状态控制
- 用户删除和修改功能
- KYC审批流程
- 提现审批管理
- 平台统计和监控
- 审计日志查询

### 3. `frontend/src/pages/Admin.js`
**功能**: 管理员仪表板界面
**主要组件**:
- 平台统计仪表板（包含角色统计）
- 用户管理表格（支持查看、编辑、删除）
- 提现审批界面
- 审计日志查看
- 用户详情模态框
- 删除确认模态框
- 实时状态更新

**UI特性**:
- 响应式设计
- 标签页导航
- 实时数据更新
- 操作确认和反馈
- 角色标识和状态显示

### 4. `backend/prisma/seed-users.js`
**功能**: 种子用户初始化
**默认用户**:
- System Admin: `admin@usde.com` / `admin123`
- Demo: `demo@usde.com` / `demo123`

**初始化特性**:
- 自动检查现有用户
- 安全的密码哈希
- 完整的用户配置

## 数据库设计

### 核心表结构

#### 1. `Company` 表（更新）
```sql
model Company {
  id            String   @id @default(cuid())
  name          String
  email         String   @unique
  password      String
  role          String   @default("enterprise_admin") // system_admin, enterprise_admin, enterprise_user
  kycStatus     String   @default("pending") // pending, approved, rejected
  isActive      Boolean  @default(true)
  usdeBalance   Float    @default(0)
  ucBalance     Float    @default(0)
  totalEarnings Float    @default(0)
  
  // Enterprise fields
  isEnterpriseAdmin Boolean @default(true)
  isEnterpriseUser  Boolean @default(false)
  enterpriseId      String?
  enterpriseRole    String? // enterprise_admin, finance_manager, finance_operator, observer
  
  // Enterprise information
  companyName       String?
  enterpriseCompanyType String?
  
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  // Relations
  auditLogs     AuditLog[]
  // ... 其他关联
}
```

#### 2. `AuditLog` 表（新增）
```sql
model AuditLog {
  id          String   @id @default(cuid())
  adminId     String   // 执行操作的管理员ID
  action      String   // 操作类型
  targetId    String?  // 目标对象ID
  details     String?  // 操作详情（JSON）
  ipAddress   String?  // IP地址
  userAgent   String?  // 用户代理
  timestamp   DateTime @default(now())
  
  // 关联关系
  admin       Company  @relation(fields: [adminId], references: [id])
}
```

### 数据关系
- `Company` 与 `AuditLog` 通过 `adminId` 关联
- 支持多对多的审计日志记录
- 完整的操作追踪链

## 权限控制设计

### 🧱 RBAC权限矩阵

| 功能模块 | System Admin | Enterprise Admin | Enterprise User |
|---------|-------------|------------------|-----------------|
| 登录系统 | ✅ 登录 | ✅ 登录 | ✅ 登录 |
| 查看系统用户 | ✅ 可查看全部 | ✅ 可查看企业用户 | ❌ |
| 审批用户KYC | ✅ 可以审核 | ✅ 可以审核企业用户 | ❌ |
| 审批提现请求 | ✅ 可以审核 | ✅ 可以审核企业用户 | ❌ |
| 查看平台统计 | ✅ 可见资产/收入等 | ✅ 可见企业统计 | ❌ |
| 删除用户 | ✅ 可以删除 | ❌ | ❌ |
| 修改用户信息 | ✅ 可以修改 | ❌ | ❌ |
| 发起KYC申请 | ❌ | ✅ 可发起 | ✅ 可发起 |
| 使用支付、提现等功能 | ❌ | ✅ KYC后可用 | ✅ KYC后可用 |
| 查看个人资产 | ❌ | ✅ | ✅ |

### 🔐 权限验证流程

1. **Token验证**: 检查JWT token有效性
2. **用户状态检查**: 验证用户是否激活
3. **角色权限验证**: 检查用户角色权限
4. **KYC状态检查**: 验证KYC审批状态（如需要）
5. **操作执行**: 执行具体业务操作
6. **审计记录**: 记录操作日志

## API接口

### 管理员接口

#### 获取用户列表
```http
GET /api/admin/users?page=1&limit=20&search=&status=&role=
Authorization: Bearer <admin_token>
```

**响应**:
```json
{
  "users": [
    {
      "id": "user_id",
      "name": "Company Name",
      "email": "company@example.com",
      "role": "enterprise_admin",
      "kycStatus": "pending",
      "isActive": true,
      "usdeBalance": 1000.00,
      "isEnterpriseAdmin": true,
      "isEnterpriseUser": false,
      "enterpriseRole": "enterprise_admin",
      "companyName": "Company Name",
      "createdAt": "2024-01-01T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 50,
    "pages": 3
  }
}
```

#### 获取用户详情
```http
GET /api/admin/users/:userId
Authorization: Bearer <admin_token>
```

**响应**:
```json
{
  "user": {
    "id": "user_id",
    "name": "Company Name",
    "email": "company@example.com",
    "role": "enterprise_admin",
    "kycStatus": "approved",
    "isActive": true,
    "usdeBalance": 1000.00,
    "ucBalance": 500.00,
    "totalEarnings": 2000.00,
    "deposits": [...],
    "withdrawals": [...],
    "stakes": [...],
    "earnings": [...],
    "bankAccounts": [...],
    "treasurySettings": {...},
    "userRoles": [...]
  }
}
```

#### 删除用户
```http
DELETE /api/admin/users/:userId
Authorization: Bearer <system_admin_token>
```

#### 修改用户信息
```http
PUT /api/admin/users/:userId
Authorization: Bearer <system_admin_token>
Content-Type: application/json

{
  "name": "Updated Company Name",
  "email": "updated@example.com",
  "role": "enterprise_user",
  "isActive": true
}
```

#### KYC审批
```http
PUT /api/admin/kyc/:userId/approve
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "status": "approved",
  "notes": "Documents verified successfully"
}
```

#### 提现审批
```http
PUT /api/admin/withdrawals/:withdrawalId/approve
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "status": "completed",
  "notes": "Payment processed successfully"
}
```

#### 获取平台统计
```http
GET /api/admin/stats
Authorization: Bearer <admin_token>
```

**响应**:
```json
{
  "stats": {
    "users": {
      "total": 150,
      "approved": 120,
      "pendingKYC": 30,
      "systemAdmins": 2,
      "enterpriseAdmins": 25,
      "enterpriseUsers": 123
    },
    "financial": {
      "totalDeposits": 500000.00,
      "totalWithdrawals": 200000.00,
      "totalPayments": 100000.00,
      "totalStakes": 50000.00
    }
  },
  "recentActivity": [...]
}
```

### 用户接口

#### 获取用户资料
```http
GET /api/auth/profile
Authorization: Bearer <user_token>
```

**响应**:
```json
{
  "company": {
    "id": "user_id",
    "name": "Company Name",
    "email": "company@example.com",
    "role": "enterprise_admin",
    "kycStatus": "approved",
    "usdeBalance": 1000.00,
    "isActive": true,
    "isEnterpriseAdmin": true,
    "isEnterpriseUser": false,
    "enterpriseRole": "enterprise_admin"
  }
}
```

## 前端权限控制

### 🧾 用户界面行为控制

| 功能区域 | KYC前展示 | KYC后解锁行为 |
|---------|-----------|---------------|
| Dashboard | 显示账户初始化状态 | 展示资产、收益等 |
| Payments | 显示支付逻辑/示例 | 启用实际付款操作 |
| Stake | 显示质押说明 | 启用质押操作 |
| Withdraw | 按钮禁用+提示需先KYC | 启用提现表单 |

### 🔧 导航菜单控制

**系统管理员导航**:
- Admin Dashboard
- User Management（包含删除和修改功能）
- Withdrawal Approval
- Audit Logs

**企业管理员导航**:
- Admin Dashboard
- User Management（仅查看和KYC审批）
- Withdrawal Approval
- Audit Logs

**普通用户导航**:
- Dashboard
- Profile
- Payments
- Stakes
- Deposits
- Withdrawals
- KYC

## 安全特性

### 🔒 数据安全
- JWT token认证
- 密码bcrypt哈希
- 角色权限验证
- 用户状态检查

### 🛡️ 业务安全
- KYC状态验证
- 操作权限检查
- 输入验证和清理
- 防止权限提升

### ⏰ 审计安全
- 完整操作日志
- IP地址记录
- 用户代理记录
- 操作详情追踪

## 部署说明

### 环境要求
- Node.js 16+
- SQLite数据库
- bcryptjs依赖

### 启动步骤
1. 安装依赖: `npm install`
2. 数据库迁移: `npm run db:push`
3. 创建种子用户: `npm run db:seed-users`
4. 启动服务: `npm run dev`

### 默认用户
- **系统管理员**: `admin@usde.com` / `admin123`
- **演示用户**: `demo@usde.com` / `demo123`

## 扩展功能

### 🚀 未来计划
- **多角色权限**: 财务审核员、运营管理员等
- **用户分组**: 子账户、企业账户管理
- **KYC自动化**: AI辅助KYC审批
- **高级审计**: 更详细的操作追踪
- **权限模板**: 预设权限组合

### 🔧 技术优化
- 缓存机制提升性能
- WebSocket实时通知
- 批量操作支持
- 高级搜索和筛选

## 测试建议

### 🧪 功能测试
- 用户角色权限验证
- KYC审批流程
- 提现审批流程
- 用户删除和修改功能
- 审计日志记录
- 权限边界测试

### 🔍 安全测试
- 权限提升攻击
- 跨角色访问测试
- Token安全性验证
- 输入验证测试

### 📊 性能测试
- 大量用户查询
- 并发权限检查
- 审计日志性能
- 用户管理操作性能

## 更新日志

### v2.0.0 - Treasury Control集成
- ✅ 新增系统管理员、企业管理员、企业用户角色
- ✅ 支持用户删除和修改功能
- ✅ 增强用户详情查看功能
- ✅ 更新权限控制中间件
- ✅ 优化管理员仪表板界面
- ✅ 完善审计日志系统 