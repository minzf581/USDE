# Deposit and Mint USDE Module Introduction

## 概述

Deposit and Mint USDE模块是USDE企业平台的核心功能之一，允许用户通过Stripe支付系统充值美元，并自动铸造等额的USDE稳定币。该模块实现了完整的充值、铸造、提现和交易历史管理功能，并集成了先进的风控评估、实时监控和性能优化功能。

## 主要功能

### 🔐 KYC验证
- 只有通过KYC验证的用户才能进行充值和提现操作
- 未验证用户可浏览功能但无法执行操作
- 前端显示KYC状态提示

### 💳 Stripe支付集成
- 支持信用卡、银行转账和ACH转账
- 安全的Stripe Checkout流程
- Webhook处理支付确认
- 0.25%手续费，1:0.9975美元到USDE的铸造比例

### 🛡️ 风控评估系统
- 实时风险评估（金额、频率、KYC状态）
- 自动决策引擎（批准/拒绝/人工审核）
- 风控记录和审计追踪
- 限额管理（日限额、月限额）

### 🪙 USDE余额管理
- 实时显示用户USDE余额
- 完整的交易历史记录
- 支持提现到链上钱包地址
- 余额锁定和可用余额分离

### 📊 统计和报告
- 充值统计（总额、待处理、已完成）
- 提现统计
- 交易历史分页显示
- 实时性能指标监控

### ⚡ 性能优化
- 缓存机制减少数据库查询
- 批量查询优化
- 响应时间监控
- 自动限流保护

## 技术架构

### 后端架构

#### 核心文件
```
backend/
├── routes/deposit.js              # 主要API路由（增强版）
├── services/stripeService.js      # Stripe集成服务
├── services/simpleMetrics.js      # 指标收集服务
├── services/optimizedQueries.js   # 优化查询服务
├── middleware/cache.js            # 缓存中间件
├── middleware/validation.js       # 输入验证中间件
├── middleware/responseTime.js     # 响应时间监控
├── prisma/schema.prisma          # 数据库模型
├── migration_001_risk_enhancements.sql # 数据库迁移脚本
└── server.js                     # 服务器配置（增强版）
```

#### 数据库设计

**Company表扩展**
```sql
-- 添加USDE余额字段
usdeBalance Float @default(0) // USDE稳定币余额
riskRating String @default("medium") // 风险评级
dailyLimit Float @default(10000) // 日限额
monthlyLimit Float @default(100000) // 月限额
kycLevel Int @default(1) // KYC等级
```

**Deposit表扩展**
```sql
-- 添加Stripe会话ID和增强字段
stripeSessionId String? // Stripe checkout session ID
feeRate Float @default(0.0025) // 手续费率
paymentMethod String @default("card") // 支付方式
failureReason String? // 失败原因
stripePaymentIntentId String? // Stripe支付意图ID
blockchainTxHash String? // 区块链交易哈希
expiresAt DateTime? // 过期时间
fee Float @default(0) // 手续费
usdeAmount Float @default(0) // USDE数量
completedAt DateTime? // 完成时间
```

**Withdrawal表扩展**
```sql
-- 添加钱包地址和交易哈希
walletAddress String? // 区块链钱包地址
transactionHash String? // 区块链交易哈希
```

**USDETransaction表扩展**
```sql
-- USDE交易历史记录（增强版）
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
  blockchainTxHash String? // 区块链交易哈希
  status        String @default("confirmed") // 交易状态
  blockNumber   BigInt? // 区块号
  
  company       Company  @relation(fields: [companyId], references: [id])
}
```

**新增RiskAssessment表**
```sql
-- 风控评估记录
model RiskAssessment {
  id              String   @id @default(cuid())
  companyId       String
  assessmentType  String   // deposit, withdrawal
  amount          Float
  riskScore       Int @default(0)
  riskFactors     String?  // JSON格式存储风险因素
  decision        String @default("approved") // approved, rejected, manual_review
  decisionReason  String?
  assessor        String @default("system")
  createdAt       DateTime @default(now())
  
  company         Company  @relation(fields: [companyId], references: [id])
}
```

### 前端架构

#### 核心文件
```
frontend/
├── src/pages/Deposits.js     # 主要页面组件（增强版）
├── src/services/api.js       # API服务（增强版）
└── src/components/           # 可复用组件
```

#### 页面结构
- **USDE余额展示**：实时显示用户USDE余额和限额信息
- **充值功能**：Stripe支付集成，支持多种支付方式
- **提现功能**：支持提现到钱包地址
- **交易历史**：完整的交易记录和统计
- **订单状态跟踪**：实时显示订单进度和状态
- **风控信息显示**：显示风险评估结果和决策

## API接口设计

### 1. 创建Stripe支付会话（增强版）
```http
POST /api/deposit/create-session
Content-Type: application/json
Authorization: Bearer <token>

{
  "amount": 100.00,
  "paymentMethod": "card"
}

Response:
{
  "success": true,
  "data": {
    "sessionId": "cs_test_1234",
    "url": "https://checkout.stripe.com/...",
    "orderId": "order_123",
    "amount": 100.00,
    "usdeAmount": 99.75,
    "fee": 0.25,
    "feeRate": 0.0025,
    "expiresAt": "2024-01-15T12:30:00Z",
    "riskAssessment": {
      "score": 15,
      "decision": "approved",
      "requiresReview": false
    }
  }
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

### 3. 获取USDE余额和交易历史（增强版）
```http
GET /api/deposit/usde-balance?page=1&limit=10&type=all
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": {
    "balance": {
      "available": 1200.00,
      "locked": 0,
      "total": 1200.00
    },
    "kycStatus": "approved",
    "kycLevel": 1,
    "limits": {
      "daily": {
        "limit": 10000,
        "used": 500,
        "remaining": 9500
      },
      "monthly": {
        "limit": 100000,
        "used": 5000,
        "remaining": 95000
      }
    },
    "statistics": {
      "totalDeposited": 5000,
      "totalWithdrawn": 1000,
      "depositCount": 25,
      "withdrawCount": 5,
      "riskRating": "medium"
    },
    "transactions": [
      {
        "id": "tx_123",
        "type": "mint",
        "amount": 100.00,
        "balanceBefore": 1100.00,
        "balanceAfter": 1200.00,
        "description": "Minted 100 USDE from $100 deposit",
        "status": "confirmed",
        "blockchainTxHash": "0x123...",
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
}
```

### 4. 获取订单状态（新增）
```http
GET /api/deposit/order/{orderId}/status
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": {
    "orderId": "order_123",
    "status": "COMPLETED",
    "amount": 100.00,
    "usdeAmount": 99.75,
    "fee": 0.25,
    "paymentMethod": "card",
    "progress": [
      {
        "step": "order_created",
        "status": "completed",
        "timestamp": "2024-01-15T10:30:00Z",
        "description": "Payment order created"
      },
      {
        "step": "payment_confirmed",
        "status": "completed",
        "timestamp": "2024-01-15T10:35:00Z",
        "description": "Payment confirmed by Stripe"
      }
    ],
    "riskAssessment": {
      "score": 15,
      "decision": "approved"
    },
    "createdAt": "2024-01-15T10:30:00Z",
    "expiresAt": "2024-01-15T12:30:00Z"
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

### 2. 风控评估
- 实时风险评估（金额、频率、KYC状态）
- 自动决策引擎（批准/拒绝/人工审核）
- 风控记录和审计追踪
- 限额管理（日限额、月限额）

### 3. Stripe安全
- Webhook签名验证
- 支付状态严格检查
- 防止重复处理

### 4. 数据完整性
- 使用数据库事务确保一致性
- 完整的审计日志
- 余额变更记录

### 5. 性能保护
- 请求限流（每15分钟最多5次充值请求）
- 输入验证和清理
- 缓存机制减少数据库负载
- 响应时间监控和告警

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
# 运行增强的迁移脚本
./run-migration.sh

# 或者手动执行
npm install
npm run db:generate
npm run db:push
sqlite3 prisma/data/dev.db < migration_001_risk_enhancements.sql
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

### 4. 性能检查
```bash
# 运行性能检查脚本
cd backend && npm run performance-check
```

## 测试流程

### 1. KYC验证测试
- 未验证用户尝试充值 → 显示KYC提示
- 验证后用户充值 → 正常流程

### 2. 风控评估测试
- 大额充值（>50,000）→ 触发风险评估
- 高频充值（24小时内>5次）→ 触发频率风险
- 未通过KYC充值 → 触发KYC风险
- 验证风险评估决策（批准/拒绝/人工审核）

### 3. Stripe支付测试
- 使用Stripe测试卡号：4242 4242 4242 4242
- 测试成功和取消流程
- 验证Webhook处理
- 测试多种支付方式（信用卡、银行转账、ACH）

### 4. 提现测试
- 测试余额不足情况
- 测试无效钱包地址
- 验证交易记录

### 5. 性能测试
- 测试缓存机制
- 测试限流保护
- 测试响应时间监控
- 验证指标收集

## 扩展功能

### 已实现功能
1. **风控评估系统**：实时风险评估和决策引擎
2. **性能优化**：缓存、限流、监控
3. **订单状态跟踪**：实时订单进度显示
4. **多种支付方式**：信用卡、银行转账、ACH
5. **限额管理**：日限额、月限额控制

### 未来计划
1. **链上集成**：与真实区块链网络集成
2. **多币种支持**：支持USDC、USDT等稳定币
3. **自动转账**：充值后自动转入链上钱包
4. **收益配置**：铸造时配置理财偏好
5. **高级风控**：机器学习风险评估
6. **实时通知**：WebSocket实时状态更新

## 故障排除

### 常见问题
1. **Stripe Webhook失败**：检查签名和密钥配置
2. **数据库同步问题**：运行`npm run db:push`
3. **KYC状态不更新**：检查数据库中的kycStatus字段
4. **余额显示错误**：检查USDETransaction表记录
5. **风控评估失败**：检查RiskAssessment表记录
6. **缓存不生效**：检查缓存中间件配置
7. **限流触发**：检查请求频率，等待15分钟后重试
8. **性能问题**：运行`npm run performance-check`检查

### 日志查看
```bash
# 后端日志
cd backend && npm run dev

# 数据库查看
npm run db:studio

# 性能指标
curl http://localhost:5001/api/metrics

# 健康检查
curl http://localhost:5001/api/health
```

## 贡献指南

### 代码规范
- 使用ESLint进行代码检查
- 遵循RESTful API设计原则
- 添加适当的错误处理和日志
- 实现输入验证和清理
- 添加性能监控和指标收集

### 测试要求
- 单元测试覆盖核心功能
- 集成测试验证API接口
- 端到端测试验证用户流程
- 性能测试验证缓存和限流
- 风控测试验证评估逻辑

---

*本文档最后更新：2024年1月* 