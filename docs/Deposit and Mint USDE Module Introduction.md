# Deposit and Mint USDE Module Introduction

## 概述

Deposit and Mint USDE模块是USDE企业平台的核心功能之一，允许用户通过Stripe支付系统充值美元，并自动铸造等额的USDE稳定币。该模块实现了完整的充值、铸造、提现和交易历史管理功能。

## 主要功能

### 🔐 KYC验证
- 只有通过KYC验证的用户才能进行充值和提现操作
- 未验证用户可浏览功能但无法执行操作
- 前端显示KYC状态提示

### 💳 Stripe支付集成
- 支持信用卡和银行账户充值
- 安全的Stripe Checkout流程
- Webhook处理支付确认
- 1:1美元到USDE的铸造比例

### 🪙 USDE余额管理
- 实时显示用户USDE余额
- 完整的交易历史记录
- 支持提现到链上钱包地址

### 📊 统计和报告
- 充值统计（总额、待处理、已完成）
- 提现统计
- 交易历史分页显示

## 技术架构

### 后端架构

#### 核心文件
```
backend/
├── routes/deposit.js          # 主要API路由
├── services/stripeService.js  # Stripe集成服务
├── prisma/schema.prisma      # 数据库模型
└── server.js                 # 服务器配置
```

#### 数据库设计

**Company表扩展**
```sql
-- 添加USDE余额字段
usdeBalance Float @default(0) // USDE稳定币余额
```

**Deposit表扩展**
```sql
-- 添加Stripe会话ID
stripeSessionId String? // Stripe checkout session ID
```

**Withdrawal表扩展**
```sql
-- 添加钱包地址和交易哈希
walletAddress String? // 区块链钱包地址
transactionHash String? // 区块链交易哈希
```

**新增USDETransaction表**
```sql
-- USDE交易历史记录
model USDETransaction {
  id            String   @id @default(cuid())
  companyId     String
  type          String   // mint, withdraw, transfer
  amount        Float
  balanceBefore Float
  balanceAfter  Float
  description   String?
  metadata      String?  // JSON字符串存储额外数据
  timestamp     DateTime @default(now())
  
  company       Company  @relation(fields: [companyId], references: [id])
}
```

### 前端架构

#### 核心文件
```
frontend/
├── src/pages/Deposits.js     # 主要页面组件
├── src/services/api.js       # API服务
└── src/components/           # 可复用组件
```

#### 页面结构
- **USDE余额展示**：实时显示用户USDE余额
- **充值功能**：Stripe支付集成
- **提现功能**：支持提现到钱包地址
- **交易历史**：完整的交易记录和统计

## API接口设计

### 1. 创建Stripe支付会话
```http
POST /api/deposit/create-session
Content-Type: application/json
Authorization: Bearer <token>

{
  "amount": 100.00
}

Response:
{
  "sessionId": "cs_test_1234",
  "url": "https://checkout.stripe.com/...",
  "amount": 100
}
```

### 2. Stripe Webhook处理
```http
POST /api/deposit/webhook
Content-Type: application/json
Stripe-Signature: <signature>

{
  "type": "checkout.session.completed",
  "data": {
    "object": {
      "id": "cs_test_1234",
      "payment_status": "paid",
      "metadata": {
        "companyId": "company_id",
        "amount": "100"
      }
    }
  }
}
```

### 3. 获取USDE余额和交易历史
```http
GET /api/deposit/usde-balance?page=1&limit=10
Authorization: Bearer <token>

Response:
{
  "balance": 1200.00,
  "kycStatus": "approved",
  "transactions": [
    {
      "id": "tx_123",
      "type": "mint",
      "amount": 100.00,
      "balanceBefore": 1100.00,
      "balanceAfter": 1200.00,
      "description": "Minted 100 USDE from $100 deposit",
      "timestamp": "2024-01-15T10:30:00Z"
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

### 4. 提现USDE到钱包
```http
POST /api/deposit/withdraw
Content-Type: application/json
Authorization: Bearer <token>

{
  "amount": 50.00,
  "walletAddress": "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6"
}

Response:
{
  "message": "Withdrawal processed successfully",
  "withdrawal": {
    "id": "wd_123",
    "amount": 50.00,
    "walletAddress": "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
    "transactionHash": "tx_123456789",
    "status": "completed",
    "timestamp": "2024-01-15T10:30:00Z"
  },
  "newBalance": 1150.00
}
```

## 安全措施

### 1. KYC验证
- 所有充值和提现操作都需要KYC验证
- 前端和后端双重验证
- 清晰的错误提示

### 2. Stripe安全
- Webhook签名验证
- 支付状态严格检查
- 防止重复处理

### 3. 数据完整性
- 使用数据库事务确保一致性
- 完整的审计日志
- 余额变更记录

## 环境配置

### 必需的环境变量
```bash
# Stripe配置
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# 前端URL（用于Stripe重定向）
FRONTEND_URL=http://localhost:3000
```

## 部署说明

### 1. 数据库迁移
```bash
cd backend
npm run db:push
```

### 2. 环境变量配置
复制`env.example`到`.env`并配置Stripe密钥

### 3. 启动服务
```bash
# 后端
cd backend && npm start

# 前端
cd frontend && npm start
```

## 测试流程

### 1. KYC验证测试
- 未验证用户尝试充值 → 显示KYC提示
- 验证后用户充值 → 正常流程

### 2. Stripe支付测试
- 使用Stripe测试卡号：4242 4242 4242 4242
- 测试成功和取消流程
- 验证Webhook处理

### 3. 提现测试
- 测试余额不足情况
- 测试无效钱包地址
- 验证交易记录

## 扩展功能

### 未来计划
1. **链上集成**：与真实区块链网络集成
2. **多币种支持**：支持USDC、USDT等稳定币
3. **自动转账**：充值后自动转入链上钱包
4. **收益配置**：铸造时配置理财偏好

## 故障排除

### 常见问题
1. **Stripe Webhook失败**：检查签名和密钥配置
2. **数据库同步问题**：运行`npm run db:push`
3. **KYC状态不更新**：检查数据库中的kycStatus字段
4. **余额显示错误**：检查USDETransaction表记录

### 日志查看
```bash
# 后端日志
cd backend && npm run dev

# 数据库查看
npm run db:studio
```

## 贡献指南

### 代码规范
- 使用ESLint进行代码检查
- 遵循RESTful API设计原则
- 添加适当的错误处理和日志

### 测试要求
- 单元测试覆盖核心功能
- 集成测试验证API接口
- 端到端测试验证用户流程

---

*本文档最后更新：2024年1月* 