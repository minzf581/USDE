# Payments Module Introduction

## 概述

Payments模块是USDE企业平台的核心支付功能，支持企业用户使用USDE Token向供应商进行支付，并提供锁仓机制确保资金安全。该模块实现了完整的支付流程管理，包括发送支付、锁仓管理、自动释放和支付历史记录。

## 主要功能

### ✅ 核心功能
- **Token支付**: 企业用户向供应商转账USDE代币
- **承兑选择**: 支持30/90/180天锁仓期选择
- **锁仓机制**: 收款方Token锁定到期前无法动用
- **支付记录**: 发送方和接收方都能查看支付历史
- **到期释放**: 承兑期满后自动释放Token至供应商可用余额

### 🔧 技术特性
- **实时余额检查**: 自动计算可用余额（排除锁仓部分）
- **定时任务**: 每小时检查并自动释放到期的锁仓余额
- **事务安全**: 所有支付操作使用数据库事务确保数据一致性
- **状态管理**: 完整的支付状态跟踪和更新

## 模块结构

### 📁 后端文件结构

```
backend/
├── routes/
│   └── payment.js              # 支付路由处理
├── services/
│   └── paymentService.js       # 支付业务逻辑服务
└── prisma/
    └── schema.prisma           # 数据库模型定义
```

### 📁 前端文件结构

```
frontend/src/
├── pages/
│   └── Payments.js             # 支付页面组件
└── services/
    └── api.js                  # API调用服务
```

## 核心文件详解

### 1. `backend/routes/payment.js`
**功能**: 支付相关的API路由处理
**主要端点**:
- `POST /api/payment/send` - 发送支付
- `GET /api/payment/history` - 获取支付历史
- `GET /api/payment/locked-balances` - 获取锁仓余额
- `POST /api/payment/release/:paymentId` - 手动释放支付（测试用）

**关键特性**:
- 输入验证和错误处理
- 余额检查和锁仓计算
- 事务性操作确保数据一致性

### 2. `backend/services/paymentService.js`
**功能**: 支付业务逻辑服务
**主要方法**:
- `createPayment()` - 创建支付和锁仓记录
- `getAvailableBalance()` - 计算可用余额
- `getLockedBalances()` - 获取锁仓余额详情
- `releaseExpiredLocks()` - 自动释放过期锁仓
- `initScheduledTasks()` - 初始化定时任务

**定时任务**:
- 每小时检查并释放到期的锁仓余额
- 自动更新支付状态

### 3. `frontend/src/pages/Payments.js`
**功能**: 支付页面用户界面
**主要组件**:
- 支付表单（收款方、金额、锁仓期）
- 锁仓余额显示
- 支付历史表格
- 状态指示器和倒计时

**UI特性**:
- 响应式设计
- 实时状态更新
- 用户友好的错误提示
- 加载状态指示

## 数据库设计

### 核心表结构

#### 1. `Payment` 表
```sql
model Payment {
  id          String   @id @default(cuid())
  fromId      String   # 支付方用户ID
  toId        String   # 收款方用户ID
  amount      Float    # 支付金额
  lockDays    Int      # 锁仓期（30/90/180天）
  status      String   # 状态（pending/released）
  releaseAt   DateTime # 解锁日期
  releasedAt  DateTime? # 实际释放时间
  timestamp   DateTime # 创建时间
  
  # 关联关系
  fromCompany Company  @relation("PaymentFrom")
  toCompany   Company  @relation("PaymentTo")
}
```

#### 2. `LockedBalance` 表
```sql
model LockedBalance {
  id          String   @id @default(cuid())
  userId      String   # 拥有者用户ID
  amount      Float    # 锁仓金额
  releaseAt   DateTime # 到期时间
  sourceId    String   # 来源payment_id
  createdAt   DateTime # 创建时间
  
  # 关联关系
  user        Company  @relation(fields: [userId], references: [id])
}
```

### 数据关系
- `Company` 与 `Payment` 通过 `fromId` 和 `toId` 关联
- `Company` 与 `LockedBalance` 通过 `userId` 关联
- `Payment` 与 `LockedBalance` 通过 `sourceId` 关联

## 支付流程

### 🔄 完整支付流程

1. **用户输入**: 收款方邮箱、金额、锁仓期
2. **余额检查**: 验证发送方可用余额（排除锁仓部分）
3. **创建支付**: 在事务中创建Payment和LockedBalance记录
4. **余额更新**: 扣除发送方余额，增加收款方余额
5. **状态跟踪**: 记录支付状态和释放时间
6. **自动释放**: 定时任务在到期时自动释放锁仓余额

### 🔐 锁仓机制

**锁仓期间限制**:
- 收款方无法提取锁仓的Token
- 无法转账锁仓的Token
- 无法兑换锁仓的Token

**解锁条件**:
- 锁仓期到期（30/90/180天）
- 系统自动执行释放
- 更新支付状态为released

## API接口

### 发送支付
```http
POST /api/payment/send
Content-Type: application/json
Authorization: Bearer <token>

{
  "toEmail": "supplier@company.com",
  "amount": 1000.00,
  "lockDays": 90
}
```

**响应**:
```json
{
  "message": "Payment sent successfully",
  "payment": {
    "id": "payment_id",
    "amount": 1000.00,
    "lockDays": 90,
    "releaseAt": "2024-03-01T10:00:00Z",
    "recipient": "Supplier Company",
    "recipientEmail": "supplier@company.com",
    "timestamp": "2024-01-01T10:00:00Z"
  },
  "newBalance": 5000.00
}
```

### 获取支付历史
```http
GET /api/payment/history?page=1&limit=10
Authorization: Bearer <token>
```

**响应**:
```json
{
  "payments": [
    {
      "id": "payment_id",
      "amount": 1000.00,
      "lockDays": 90,
      "status": "pending",
      "releaseAt": "2024-03-01T10:00:00Z",
      "timestamp": "2024-01-01T10:00:00Z",
      "type": "sent",
      "counterparty": {
        "name": "Supplier Company",
        "email": "supplier@company.com"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "pages": 3
  }
}
```

### 获取锁仓余额
```http
GET /api/payment/locked-balances
Authorization: Bearer <token>
```

**响应**:
```json
{
  "lockedBalances": [
    {
      "id": "lock_id",
      "amount": 1000.00,
      "releaseAt": "2024-03-01T10:00:00Z",
      "createdAt": "2024-01-01T10:00:00Z",
      "daysRemaining": 45
    }
  ]
}
```

## 安全特性

### 🔒 数据安全
- 所有支付操作使用数据库事务
- 余额检查防止超额支付
- 锁仓机制防止资金滥用

### 🛡️ 业务安全
- 输入验证和清理
- 权限检查（只能操作自己的支付）
- 状态验证（防止重复操作）

### ⏰ 定时安全
- 自动释放机制确保资金及时可用
- 错误处理和重试机制
- 日志记录便于审计

## 扩展功能

### 🚀 未来计划
- **链上支付**: 支持区块链合约直接锁仓转账
- **支付标签**: 备注用途（订单号、合同等）
- **发票关联**: 可上传或生成企业支付发票PDF
- **利息计算**: 若企业端可设置锁仓支付的奖励
- **定期支付**: 预设支付频率自动执行付款

### 🔧 技术优化
- 缓存机制提升查询性能
- WebSocket实时状态更新
- 批量操作支持
- 高级筛选和搜索功能

## 部署说明

### 环境要求
- Node.js 16+
- SQLite数据库
- node-cron依赖（已包含）

### 启动步骤
1. 安装依赖: `npm install`
2. 数据库迁移: `npm run db:push`
3. 启动服务: `npm run dev`

### 配置项
- 定时任务频率（默认每小时）
- 锁仓期选项（30/90/180天）
- 支付限额设置
- 日志级别配置

## 测试建议

### 🧪 功能测试
- 支付发送和接收
- 锁仓期验证
- 余额计算准确性
- 自动释放机制

### 🔍 边界测试
- 余额不足情况
- 无效收款方
- 锁仓期到期处理
- 并发支付处理

### 📊 性能测试
- 大量支付记录查询
- 定时任务执行效率
- 数据库事务性能
- 前端响应速度

---

*Payments模块为企业用户提供了安全、可靠的USDE支付解决方案，通过锁仓机制确保资金安全，同时提供完整的支付管理和监控功能。* 