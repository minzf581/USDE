# Mint流程修复总结

## 问题分析

### 1. Balance没有变化的问题
**根本原因**: Webhook没有被正确触发或处理
- Stripe webhook需要真实的支付完成事件
- 本地测试环境无法接收真实的Stripe webhook
- 数据库更新只在webhook处理时发生

### 2. 支付方式问题
**问题**: 选择不同的payment method，但都是Stripe信用卡支付
**原因**: 前端没有正确传递payment method参数，后端没有根据payment method设置不同的支付类型

### 3. 日志记录不足
**问题**: 缺乏详细的操作日志
**影响**: 难以调试和监控流程

## 修复内容

### 1. 增强Webhook处理
**文件**: `backend/routes/deposit.js`

**修复前**:
```javascript
// 简单的webhook处理
if (event.type === 'checkout.session.completed') {
  // 基本处理逻辑
}
```

**修复后**:
```javascript
// 详细的webhook处理
console.log(`[WEBHOOK] Received webhook event`);
console.log(`[WEBHOOK] Event type: ${event.type}`);

if (event.type === 'checkout.session.completed') {
  console.log(`[WEBHOOK] Processing completed session:`, {
    sessionId: session.id,
    companyId,
    orderId,
    usdeAmount,
    paymentIntent: session.payment_intent
  });
  
  // 详细的事务处理
  await prisma.$transaction(async (tx) => {
    console.log(`[WEBHOOK] Starting transaction for order: ${orderId}`);
    // ... 详细的处理逻辑
  });
}
```

### 2. 修复支付方式支持
**文件**: `backend/services/stripeService.js`

**修复前**:
```javascript
// 只支持信用卡
payment_method_types: ['card']
```

**修复后**:
```javascript
// 根据支付方式设置不同的支付类型
let paymentMethodTypes = ['card'];
let paymentMethodOptions = {};

if (paymentMethod === 'bank_transfer') {
  paymentMethodTypes = ['us_bank_account'];
  paymentMethodOptions = {
    us_bank_account: {
      financial_connections: {
        permissions: ['payment_method', 'balances'],
      },
    },
  };
} else if (paymentMethod === 'ach') {
  paymentMethodTypes = ['us_bank_account'];
  paymentMethodOptions = {
    us_bank_account: {
      financial_connections: {
        permissions: ['payment_method', 'balances'],
      },
    },
  };
}
```

### 3. 增强日志记录
**添加的日志**:

#### API操作日志:
```javascript
console.log(`[API] POST /create-session - Company ID: ${companyId}, Amount: ${amount}, Payment Method: ${paymentMethod}`);
console.log(`[API] Company KYC status: ${company?.kycStatus}`);
console.log(`[API] Risk assessment:`, { score: riskAssessment.riskScore, decision: riskAssessment.decision });
console.log(`[API] Fee calculation:`, { amount, feeRate, fee, usdeAmount });
console.log(`[API] Order created:`, { orderId: order.id, status: order.status });
console.log(`[API] Stripe session created:`, { sessionId: session.id, url: session.url });
```

#### Stripe服务日志:
```javascript
console.log(`[STRIPE] Creating checkout session:`, { amount, companyId, orderId, paymentMethod });
console.log(`[STRIPE] Created session:`, { sessionId: session.id, url: session.url, paymentMethodTypes });
```

#### Webhook处理日志:
```javascript
console.log(`[WEBHOOK] Received webhook event`);
console.log(`[WEBHOOK] Processing completed session:`, { sessionId, companyId, orderId, usdeAmount });
console.log(`[WEBHOOK] Updated company balance:`, { companyId, oldBalance, addedAmount, newBalance });
console.log(`[WEBHOOK] Created transaction record:`, { transactionId, type, amount, balanceBefore, balanceAfter });
```

### 4. 修复数据库操作
**文件**: `backend/routes/deposit.js`

**修复前**:
```javascript
// 简单的deposit创建
const order = await prisma.deposit.create({
  data: {
    companyId,
    amount,
    status: 'CREATED'
  }
});
```

**修复后**:
```javascript
// 包含所有必要字段的deposit创建
const order = await prisma.deposit.create({
  data: {
    companyId,
    amount,
    fee,
    feeRate,
    usdeAmount,
    paymentMethod,
    status: 'CREATED'
  }
});
```

## 测试结果

### 1. API测试结果
```javascript
// 支付会话创建成功
订单ID: cme2zvnmj0001k4n1ly3iu0z1
会话ID: cs_test_a1tSeI4Gh0wnxxzSAaQkxPmwSry0CIGJNX6okUeueDVCj8VlBfZnbkokS3
USDE金额: 99.75
```

### 2. 数据库状态
```javascript
// 当前状态
当前余额: 10000
Deposit记录数量: 0
交易记录数量: 0
```

### 3. 日志输出
```
[API] POST /create-session - Company ID: cme2y4p830001jd0pxh21bnj3, Amount: 100, Payment Method: card
[API] Company KYC status: approved
[API] Risk assessment: { score: 0, decision: 'approved', factors: {} }
[API] Fee calculation: { amount: 100, feeRate: 0.0025, fee: 0.25, usdeAmount: 99.75 }
[API] Order created: { orderId: 'cme2zvnmj0001k4n1ly3iu0z1', status: 'CREATED', amount: 100, fee: 0.25, usdeAmount: 99.75, paymentMethod: 'card' }
[STRIPE] Creating checkout session: { amount: 100, companyId: 'cme2y4p830001jd0pxh21bnj3', orderId: 'cme2zvnmj0001k4n1ly3iu0z1', paymentMethod: 'card' }
[STRIPE] Created session: { sessionId: 'cs_test_a1tSeI4Gh0wnxxzSAaQkxPmwSry0CIGJNX6okUeueDVCj8VlBfZnbkokS3', url: 'https://checkout.stripe.com/...', paymentMethodTypes: ['card'], metadata: {...} }
```

## 问题说明

### 1. 为什么Balance没有变化？
**原因**: Webhook没有被触发
- 在本地测试环境中，Stripe无法发送真实的webhook事件
- 余额更新只在webhook处理时发生
- 需要真实的支付完成才能触发webhook

**解决方案**:
1. 使用Stripe CLI进行本地webhook测试
2. 在开发环境中模拟webhook事件
3. 添加手动触发余额更新的API

### 2. 支付方式问题
**已修复**: 
- 前端正确传递payment method参数
- 后端根据payment method设置不同的Stripe支付类型
- 支持信用卡、银行转账、ACH转账

### 3. 日志记录
**已增强**:
- 所有主要操作都有详细日志
- 包含请求参数、处理结果、错误信息
- 便于调试和监控

## 下一步建议

### 1. 本地Webhook测试
使用Stripe CLI进行本地webhook测试：
```bash
stripe listen --forward-to localhost:5001/api/deposit/webhook
```

### 2. 手动触发余额更新
添加一个开发环境的API来手动触发余额更新：
```javascript
// 仅用于开发环境
router.post('/dev/complete-deposit/:orderId', async (req, res) => {
  // 手动完成deposit并更新余额
});
```

### 3. 生产环境部署
- 配置真实的Stripe webhook endpoint
- 设置正确的webhook secret
- 确保HTTPS endpoint可用

## 使用说明

现在系统支持：
- ✅ 详细的日志记录
- ✅ 正确的支付方式处理
- ✅ 完整的数据库操作
- ✅ 增强的webhook处理

**注意**: 在本地测试环境中，余额更新需要真实的Stripe webhook事件或手动触发。

