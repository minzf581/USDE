# 基于现有架构的USDE模块增量优化

## 🔧 优化策略概述

保持现有架构不变，通过以下方式进行增量优化：
- **代码层面优化**：改进现有函数和中间件
- **数据库增量改进**：添加索引和字段，不改变表结构
- **API接口增强**：在现有端点基础上添加功能
- **错误处理完善**：增强现有错误处理机制
- **性能优化**：添加缓存层和优化查询

## 📊 数据库增量优化

### 1. 在现有表基础上添加字段和索引

```sql
-- 在现有Company表添加字段（不破坏现有结构）
ALTER TABLE companies ADD COLUMN IF NOT EXISTS risk_rating VARCHAR(10) DEFAULT 'medium';
ALTER TABLE companies ADD COLUMN IF NOT EXISTS daily_limit DECIMAL(18,8) DEFAULT 10000.00;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS monthly_limit DECIMAL(18,8) DEFAULT 100000.00;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS kyc_level INTEGER DEFAULT 1;

-- 添加性能优化索引
CREATE INDEX IF NOT EXISTS idx_companies_kyc_status ON companies(kycStatus);
CREATE INDEX IF NOT EXISTS idx_companies_email ON companies(email);
CREATE INDEX IF NOT EXISTS idx_companies_risk_rating ON companies(risk_rating);

-- 在现有Deposit表添加字段
ALTER TABLE deposits ADD COLUMN IF NOT EXISTS stripe_payment_intent_id VARCHAR(255);
ALTER TABLE deposits ADD COLUMN IF NOT EXISTS blockchain_tx_hash VARCHAR(255);
ALTER TABLE deposits ADD COLUMN IF NOT EXISTS fee_rate DECIMAL(6,4) DEFAULT 0.0025;
ALTER TABLE deposits ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50) DEFAULT 'card';
ALTER TABLE deposits ADD COLUMN IF NOT EXISTS failure_reason TEXT;

-- 优化查询索引
CREATE INDEX IF NOT EXISTS idx_deposits_company_status ON deposits(companyId, status);
CREATE INDEX IF NOT EXISTS idx_deposits_stripe_session ON deposits(stripeSessionId);
CREATE INDEX IF NOT EXISTS idx_deposits_created_at ON deposits(createdAt);

-- 在现有USDETransaction表添加字段
ALTER TABLE usde_transactions ADD COLUMN IF NOT EXISTS blockchain_tx_hash VARCHAR(255);
ALTER TABLE usde_transactions ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'confirmed';
ALTER TABLE usde_transactions ADD COLUMN IF NOT EXISTS block_number BIGINT;

-- 优化交易查询索引
CREATE INDEX IF NOT EXISTS idx_usde_transactions_company_type ON usde_transactions(companyId, type);
CREATE INDEX IF NOT EXISTS idx_usde_transactions_status ON usde_transactions(status);
CREATE INDEX IF NOT EXISTS idx_usde_transactions_blockchain_hash ON usde_transactions(blockchain_tx_hash);
```

### 2. 新增风控记录表（不影响现有表）

```sql
-- 新增风控评估表
CREATE TABLE IF NOT EXISTS risk_assessments (
    id VARCHAR(32) PRIMARY KEY,
    companyId VARCHAR(32) NOT NULL,
    assessment_type VARCHAR(20) NOT NULL,
    amount DECIMAL(18,8) NOT NULL,
    risk_score INTEGER NOT NULL DEFAULT 0,
    risk_factors TEXT, -- JSON格式存储
    decision VARCHAR(20) NOT NULL DEFAULT 'approved',
    decision_reason TEXT,
    assessor VARCHAR(50) DEFAULT 'system',
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (companyId) REFERENCES companies(id),
    INDEX idx_risk_company_type (companyId, assessment_type),
    INDEX idx_risk_decision (decision),
    INDEX idx_risk_created_at (createdAt)
);
```

## 🔧 代码层面增量优化

### 1. 增强现有存款路由 (routes/deposit.js)

```javascript
// 在现有路由基础上增强功能
const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { PrismaClient } = require('@prisma/client');
const rateLimit = require('express-rate-limit');

const prisma = new PrismaClient();

// 新增：请求限流中间件
const depositLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 5, // 限制每15分钟最多5次充值请求
  message: 'Too many deposit requests, please try again later.',
  standardHeaders: true,
});

// 新增：风控评估函数
async function assessRisk(companyId, amount, paymentMethod) {
  try {
    const company = await prisma.company.findUnique({
      where: { id: companyId }
    });
    
    if (!company) {
      throw new Error('Company not found');
    }
    
    let riskScore = 0;
    const riskFactors = {};
    
    // 金额风险评估
    if (amount > 50000) {
      riskScore += 30;
      riskFactors.large_amount = true;
    }
    
    // 频率风险评估
    const recentDeposits = await prisma.deposit.count({
      where: {
        companyId,
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // 24小时内
        }
      }
    });
    
    if (recentDeposits > 5) {
      riskScore += 20;
      riskFactors.high_frequency = true;
    }
    
    // KYC状态风险
    if (company.kycStatus !== 'APPROVED') {
      riskScore += 50;
      riskFactors.kyc_not_approved = true;
    }
    
    const decision = riskScore > 70 ? 'rejected' : 
                    riskScore > 40 ? 'manual_review' : 'approved';
    
    // 保存风控记录
    await prisma.riskAssessment.create({
      data: {
        companyId,
        assessmentType: 'deposit',
        amount,
        riskScore,
        riskFactors: JSON.stringify(riskFactors),
        decision,
        decisionReason: decision === 'rejected' ? 'High risk score' : null
      }
    });
    
    return { riskScore, decision, factors: riskFactors };
    
  } catch (error) {
    console.error('Risk assessment error:', error);
    return { riskScore: 0, decision: 'approved', factors: {} };
  }
}

// 增强现有的创建支付会话端点
router.post('/create-session', depositLimiter, async (req, res) => {
  try {
    const { amount, paymentMethod = 'card' } = req.body;
    const companyId = req.user.companyId; // 假设从JWT中获取
    
    // 输入验证增强
    if (!amount || amount < 1 || amount > 1000000) {
      return res.status(400).json({
        success: false,
        error: 'Invalid amount. Must be between $1 and $1,000,000'
      });
    }
    
    // 风控评估
    const riskAssessment = await assessRisk(companyId, amount, paymentMethod);
    
    if (riskAssessment.decision === 'rejected') {
      return res.status(403).json({
        success: false,
        error: 'Transaction rejected due to risk assessment',
        riskScore: riskAssessment.riskScore
      });
    }
    
    // 计算手续费
    const feeRate = 0.0025; // 0.25%
    const fee = amount * feeRate;
    const usdeAmount = amount - fee;
    
    // 创建订单记录（增强版）
    const order = await prisma.deposit.create({
      data: {
        companyId,
        amount,
        fee,
        feeRate,
        usdeAmount,
        paymentMethod,
        status: 'CREATED',
        expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000) // 2小时过期
      }
    });
    
    // 创建Stripe会话（保持原有逻辑）
    const session = await stripe.checkout.sessions.create({
      payment_method_types: [paymentMethod],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'USDE Token Purchase',
            description: `Purchase ${usdeAmount.toFixed(2)} USDE tokens`
          },
          unit_amount: Math.round(amount * 100)
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${process.env.FRONTEND_URL}/deposits/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/deposits/cancel`,
      metadata: {
        companyId,
        orderId: order.id,
        amount: amount.toString(),
        usdeAmount: usdeAmount.toString()
      }
    });
    
    // 更新订单的Stripe会话ID
    await prisma.deposit.update({
      where: { id: order.id },
      data: { 
        stripeSessionId: session.id,
        status: 'PENDING'
      }
    });
    
    res.json({
      success: true,
      data: {
        sessionId: session.id,
        url: session.url,
        orderId: order.id,
        amount,
        usdeAmount,
        fee,
        feeRate,
        expiresAt: order.expiresAt,
        riskAssessment: {
          score: riskAssessment.riskScore,
          decision: riskAssessment.decision,
          requiresReview: riskAssessment.decision === 'manual_review'
        }
      }
    });
    
  } catch (error) {
    console.error('Create session error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create payment session'
    });
  }
});

// 增强现有的webhook处理
router.post('/webhook', express.raw({type: 'application/json'}), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const { companyId, orderId, usdeAmount } = session.metadata;
    
    try {
      // 使用事务确保数据一致性
      await prisma.$transaction(async (tx) => {
        // 更新订单状态
        const order = await tx.deposit.update({
          where: { id: orderId },
          data: {
            status: 'COMPLETED',
            stripePaymentIntentId: session.payment_intent,
            completedAt: new Date()
          }
        });
        
        // 更新USDE余额
        const currentBalance = await tx.company.findUnique({
          where: { id: companyId },
          select: { usdeBalance: true }
        });
        
        await tx.company.update({
          where: { id: companyId },
          data: {
            usdeBalance: (currentBalance.usdeBalance || 0) + parseFloat(usdeAmount)
          }
        });
        
        // 记录交易历史（增强版）
        await tx.uSDETransaction.create({
          data: {
            companyId,
            type: 'mint',
            amount: parseFloat(usdeAmount),
            balanceBefore: currentBalance.usdeBalance || 0,
            balanceAfter: (currentBalance.usdeBalance || 0) + parseFloat(usdeAmount),
            description: `Minted ${usdeAmount} USDE from $${order.amount} deposit`,
            metadata: JSON.stringify({
              orderId: order.id,
              stripeSessionId: session.id,
              paymentMethod: order.paymentMethod,
              fee: order.fee
            }),
            status: 'confirmed'
          }
        });
      });
      
      console.log(`✅ Successfully processed deposit for company ${companyId}`);
      
    } catch (error) {
      console.error('Error processing webhook:', error);
      // 这里可以添加重试机制或错误通知
    }
  }

  res.json({received: true});
});

// 新增：获取订单详细状态端点
router.get('/order/:orderId/status', async (req, res) => {
  try {
    const { orderId } = req.params;
    const companyId = req.user.companyId;
    
    const order = await prisma.deposit.findFirst({
      where: {
        id: orderId,
        companyId
      },
      include: {
        riskAssessments: {
          where: { assessmentType: 'deposit' },
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });
    
    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }
    
    // 构建状态进度
    const progress = [];
    
    if (order.createdAt) {
      progress.push({
        step: 'order_created',
        status: 'completed',
        timestamp: order.createdAt,
        description: 'Payment order created'
      });
    }
    
    if (order.stripeSessionId) {
      progress.push({
        step: 'payment_session_created',
        status: 'completed',
        timestamp: order.createdAt,
        description: 'Payment session initialized'
      });
    }
    
    if (order.status === 'COMPLETED') {
      progress.push({
        step: 'payment_confirmed',
        status: 'completed',
        timestamp: order.completedAt,
        description: 'Payment confirmed by Stripe'
      });
      
      progress.push({
        step: 'tokens_minted',
        status: 'completed',
        timestamp: order.completedAt,
        description: 'USDE tokens minted and credited'
      });
    } else if (order.status === 'FAILED') {
      progress.push({
        step: 'payment_failed',
        status: 'failed',
        timestamp: order.updatedAt,
        description: order.failureReason || 'Payment failed'
      });
    }
    
    res.json({
      success: true,
      data: {
        orderId: order.id,
        status: order.status,
        amount: order.amount,
        usdeAmount: order.usdeAmount,
        fee: order.fee,
        paymentMethod: order.paymentMethod,
        progress,
        riskAssessment: order.riskAssessments[0] ? {
          score: order.riskAssessments[0].riskScore,
          decision: order.riskAssessments[0].decision
        } : null,
        createdAt: order.createdAt,
        expiresAt: order.expiresAt
      }
    });
    
  } catch (error) {
    console.error('Get order status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get order status'
    });
  }
});

module.exports = router;
```

### 2. 增强现有的余额API (routes/wallet.js 或 deposits.js 中的余额部分)

```javascript
// 增强现有的获取余额和交易历史端点
router.get('/usde-balance', async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const { page = 1, limit = 10, type = 'all' } = req.query;
    
    // 获取公司信息和余额
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: {
        usdeBalance: true,
        kycStatus: true,
        kycLevel: true,
        dailyLimit: true,
        monthlyLimit: true,
        riskRating: true
      }
    });
    
    if (!company) {
      return res.status(404).json({
        success: false,
        error: 'Company not found'
      });
    }
    
    // 构建交易查询条件
    const whereClause = { companyId };
    if (type !== 'all') {
      whereClause.type = type;
    }
    
    // 获取交易历史（分页）
    const [transactions, totalCount] = await Promise.all([
      prisma.uSDETransaction.findMany({
        where: whereClause,
        orderBy: { timestamp: 'desc' },
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit)
      }),
      prisma.uSDETransaction.count({ where: whereClause })
    ]);
    
    // 计算统计数据
    const [depositStats, withdrawStats, todayStats] = await Promise.all([
      prisma.uSDETransaction.aggregate({
        where: { companyId, type: 'mint' },
        _sum: { amount: true },
        _count: { id: true }
      }),
      prisma.uSDETransaction.aggregate({
        where: { companyId, type: 'withdraw' },
        _sum: { amount: true },
        _count: { id: true }
      }),
      prisma.deposit.aggregate({
        where: {
          companyId,
          status: 'COMPLETED',
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0))
          }
        },
        _sum: { amount: true }
      })
    ]);
    
    // 计算今日和本月剩余限额
    const todayUsed = todayStats._sum.amount || 0;
    const monthlyUsed = await prisma.deposit.aggregate({
      where: {
        companyId,
        status: 'COMPLETED',
        createdAt: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        }
      },
      _sum: { amount: true }
    });
    
    res.json({
      success: true,
      data: {
        balance: {
          available: company.usdeBalance || 0,
          locked: 0, // 预留字段
          total: company.usdeBalance || 0
        },
        kycStatus: company.kycStatus,
        kycLevel: company.kycLevel || 1,
        limits: {
          daily: {
            limit: company.dailyLimit || 10000,
            used: todayUsed,
            remaining: (company.dailyLimit || 10000) - todayUsed
          },
          monthly: {
            limit: company.monthlyLimit || 100000,
            used: monthlyUsed._sum.amount || 0,
            remaining: (company.monthlyLimit || 100000) - (monthlyUsed._sum.amount || 0)
          }
        },
        statistics: {
          totalDeposited: depositStats._sum.amount || 0,
          totalWithdrawn: withdrawStats._sum.amount || 0,
          depositCount: depositStats._count || 0,
          withdrawCount: withdrawStats._count || 0,
          riskRating: company.riskRating || 'medium'
        },
        transactions: transactions.map(tx => ({
          id: tx.id,
          type: tx.type,
          amount: tx.amount,
          balanceBefore: tx.balanceBefore,
          balanceAfter: tx.balanceAfter,
          description: tx.description,
          status: tx.status || 'confirmed',
          blockchainTxHash: tx.blockchainTxHash,
          timestamp: tx.timestamp
        })),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalCount,
          pages: Math.ceil(totalCount / parseInt(limit))
        }
      }
    });
    
  } catch (error) {
    console.error('Get USDE balance error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get balance information'
    });
  }
});
```

### 3. 新增缓存中间件 (不改变现有架构)

```javascript
// middleware/cache.js - 新增文件
const NodeCache = require('node-cache');
const cache = new NodeCache({ stdTTL: 300 }); // 5分钟默认缓存

const cacheMiddleware = (duration = 300) => {
  return (req, res, next) => {
    // 只缓存GET请求
    if (req.method !== 'GET') {
      return next();
    }
    
    const key = req.originalUrl;
    const cachedResponse = cache.get(key);
    
    if (cachedResponse) {
      return res.json(cachedResponse);
    }
    
    // 重写res.json方法以缓存响应
    const originalJson = res.json;
    res.json = function(data) {
      if (res.statusCode === 200) {
        cache.set(key, data, duration);
      }
      originalJson.call(this, data);
    };
    
    next();
  };
};

// 缓存失效函数
const invalidateCache = (pattern) => {
  const keys = cache.keys();
  keys.forEach(key => {
    if (key.includes(pattern)) {
      cache.del(key);
    }
  });
};

module.exports = { cacheMiddleware, invalidateCache };
```

### 4. 增强错误处理中间件

```javascript
// middleware/errorHandler.js - 增强现有错误处理
const errorHandler = (err, req, res, next) => {
  console.error(`[${new Date().toISOString()}] Error:`, {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    body: req.body,
    user: req.user?.id
  });
  
  // Prisma错误处理
  if (err.code === 'P2002') {
    return res.status(409).json({
      success: false,
      error: 'Duplicate entry. This record already exists.',
      code: 'DUPLICATE_ERROR'
    });
  }
  
  if (err.code === 'P2025') {
    return res.status(404).json({
      success: false,
      error: 'Record not found.',
      code: 'NOT_FOUND'
    });
  }
  
  // Stripe错误处理
  if (err.type === 'StripeCardError') {
    return res.status(402).json({
      success: false,
      error: 'Your card was declined.',
      code: 'CARD_DECLINED',
      stripeError: err.code
    });
  }
  
  // 默认错误
  res.status(err.status || 500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' 
      ? 'An internal server error occurred' 
      : err.message,
    code: err.code || 'INTERNAL_ERROR'
  });
};

module.exports = errorHandler;
```

## 📈 性能优化补丁

### 1. 数据库查询优化

```javascript
// services/optimizedQueries.js - 新增文件
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// 优化的批量查询
async function getCompanyDashboardData(companyId) {
  // 使用单个查询获取所有需要的数据
  const [company, recentTransactions, depositStats, monthlyDeposits] = await Promise.all([
    prisma.company.findUnique({
      where: { id: companyId },
      select: {
        usdeBalance: true,
        kycStatus: true,
        dailyLimit: true,
        monthlyLimit: true
      }
    }),
    
    prisma.uSDETransaction.findMany({
      where: { companyId },
      orderBy: { timestamp: 'desc' },
      take: 5,
      select: {
        id: true,
        type: true,
        amount: true,
        timestamp: true,
        status: true
      }
    }),
    
    prisma.deposit.aggregate({
      where: {
        companyId,
        status: 'COMPLETED'
      },
      _sum: { amount: true },
      _count: { id: true }
    }),
    
    prisma.deposit.aggregate({
      where: {
        companyId,
        status: 'COMPLETED',
        createdAt: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        }
      },
      _sum: { amount: true }
    })
  ]);
  
  return {
    company,
    recentTransactions,
    depositStats,
    monthlyDeposits
  };
}

module.exports = {
  getCompanyDashboardData
};
```

### 2. 响应时间优化中间件

```javascript
// middleware/responseTime.js - 新增文件
const responseTime = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.url} - ${res.statusCode} - ${duration}ms`);
    
    // 如果响应时间过长，记录警告
    if (duration > 2000) {
      console.warn(`Slow response detected: ${req.method} ${req.url} took ${duration}ms`);
    }
  });
  
  next();
};

module.exports = responseTime;
```

## 🔒 安全性增强补丁

### 1. 输入验证中间件

```javascript
// middleware/validation.js - 新增文件
const { body, param, validationResult } = require('express-validator');

const validateDeposit = [
  body('amount')
    .isFloat({ min: 1, max: 1000000 })
    .withMessage('Amount must be between $1 and $1,000,000'),
  body('paymentMethod')
    .isIn(['card', 'bank_transfer', 'ach'])
    .withMessage('Invalid payment method'),
  
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }
    next();
  }
];

const validateWithdrawal = [
  body('amount')
    .isFloat({ min: 1 })
    .withMessage('Amount must be greater than $1'),
  body('walletAddress')
    .matches(/^0x[a-fA-F0-9]{40}$/)
    .withMessage('Invalid wallet address'),
  
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }
    next();
  }
];

module.exports = {
  validateDeposit,
  validateWithdrawal
};
```

## 📊 监控增强

### 1. 简单的指标收集器

```javascript
// services/simpleMetrics.js - 新增文件
class SimpleMetrics {
  constructor() {
    this.metrics = {
      requests: 0,
      errors: 0,
      deposits: 0,
      withdrawals: 0,
      startTime: Date.now()
    };
  }
  
  incrementRequests() {
    this.metrics.requests++;
  }
  
  incrementErrors() {
    this.metrics.errors++;
  }
  
  incrementDeposits() {
    this.metrics.deposits++;
  }
  
  incrementWithdrawals() {
    this.metrics.withdrawals++;
  }
  
  getMetrics() {
    const uptime = Date.now() - this.metrics.startTime;
    return {
      ...this.metrics,
      uptime: Math.floor(uptime / 1000), // 秒
      errorRate: this.metrics.requests > 0 ? (this.metrics.errors / this.metrics.requests * 100).toFixed(2) : 0
    };
  }
  
  async getDatabaseMetrics() {
    try {
      const [totalCompanies, totalSupply, totalDeposits] = await Promise.all([
        prisma.company.count(),
        prisma.company.aggregate({ _sum: { usdeBalance: true } }),
        prisma.deposit.count({ where: { status: 'COMPLETED' } })
      ]);
      
      return {
        totalCompanies,
        totalSupply: totalSupply._sum.usdeBalance || 0,
        totalDeposits
      };
    } catch (error) {
      console.error('Failed to get database metrics:', error);
      return {};
    }
  }
}

module.exports = new SimpleMetrics();
```

## 🚀 部署脚本优化

### 1. Railway健康检查增强

```javascript
// 在现有server.js中增强健康检查
app.get('/health', async (req, res) => {
  const checks = {};
  let overall = 'healthy';
  
  try {
    // 数据库检查
    await prisma.$queryRaw`SELECT 1`;
    checks.database = 'healthy';
  } catch (error) {
    checks.database = 'unhealthy';
    overall = 'unhealthy';
  }
  
  try {
    // Stripe连接检查
    await stripe.paymentMethods.list({ limit: 1 });
    checks.stripe = 'healthy';
  } catch (error) {
    checks.stripe = 'unhealthy';
    overall = 'degraded';
  }
  
  // 内存使用检查
  const memUsage = process.memoryUsage();
  const memUsageMB = Math.round(memUsage.heapUsed / 1024 / 1024);
  checks.memory = {
    status: memUsageMB > 400 ? 'warning' : 'healthy',
    usage: `${memUsageMB}MB`
  };
  
  res.status(overall === 'healthy' ? 200 : 503).json({
    status: overall,
    timestamp: new Date().toISOString(),
    service: 'usde-api',
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.RAILWAY_ENVIRONMENT || 'development',
    uptime: process.uptime(),
    checks
  });
});

// 新增：指标端点
app.get('/metrics', async (req, res) => {
  try {
    const simpleMetrics = require('./services/simpleMetrics');
    const [appMetrics, dbMetrics] = await Promise.all([
      simpleMetrics.getMetrics(),
      simpleMetrics.getDatabaseMetrics()
    ]);
    
    res.json({
      timestamp: new Date().toISOString(),
      application: appMetrics,
      database: dbMetrics
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to collect metrics',
      timestamp: new Date().toISOString()
    });
  }
});
```

## 💼 前端集成优化

### 1. 增强现有Deposits.js页面

```javascript
// 在现有Deposits.js基础上增加功能
import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';

const Deposits = () => {
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [kycStatus, setKycStatus] = useState('pending');
  const [limits, setLimits] = useState({});
  const [orderStatus, setOrderStatus] = useState(null); // 新增订单状态跟踪
  
  const stripe = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

  // 现有的数据获取函数增强
  const fetchBalanceData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/v1/deposits/usde-balance', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      const data = await response.json();
      if (data.success) {
        setBalance(data.data.balance.available);
        setTransactions(data.data.transactions);
        setKycStatus(data.data.kycStatus);
        setLimits(data.data.limits);
      }
    } catch (error) {
      console.error('Failed to fetch balance:', error);
    } finally {
      setLoading(false);
    }
  };

  // 新增：实时订单状态检查
  const checkOrderStatus = async (orderId) => {
    try {
      const response = await fetch(`/api/v1/deposits/order/${orderId}/status`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      const data = await response.json();
      if (data.success) {
        setOrderStatus(data.data);
        
        // 如果订单完成，刷新余额
        if (data.data.status === 'COMPLETED') {
          fetchBalanceData();
        }
      }
    } catch (error) {
      console.error('Failed to check order status:', error);
    }
  };

  // 增强的充值处理函数
  const handleDeposit = async (e) => {
    e.preventDefault();
    
    if (kycStatus !== 'APPROVED') {
      alert('Please complete KYC verification before depositing.');
      return;
    }
    
    const amount = parseFloat(depositAmount);
    if (!amount || amount < 1) {
      alert('Please enter a valid amount (minimum $1)');
      return;
    }
    
    // 检查限额
    if (amount > limits.daily?.remaining) {
      alert(`Amount exceeds daily limit. Remaining: ${limits.daily.remaining}`);
      return;
    }

    try {
      setLoading(true);
      
      // 创建支付会话
      const response = await fetch('/api/v1/deposits/create-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          amount,
          paymentMethod
        })
      });

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error);
      }

      // 显示风控信息（如果需要）
      if (data.data.riskAssessment.requiresReview) {
        alert('Your deposit requires manual review due to risk assessment. You will be notified once approved.');
      }

      // 重定向到Stripe
      const stripeInstance = await stripe;
      const { error } = await stripeInstance.redirectToCheckout({
        sessionId: data.data.sessionId
      });

      if (error) {
        throw error;
      }

      // 开始跟踪订单状态
      const orderId = data.data.orderId;
      const statusInterval = setInterval(() => {
        checkOrderStatus(orderId);
      }, 5000); // 每5秒检查一次

      // 5分钟后停止检查
      setTimeout(() => {
        clearInterval(statusInterval);
      }, 300000);

    } catch (error) {
      alert(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBalanceData();
    
    // 检查URL参数中是否有订单ID
    const urlParams = new URLSearchParams(window.location.search);
    const orderId = urlParams.get('order_id');
    if (orderId) {
      checkOrderStatus(orderId);
    }
  }, []);

  // 新增：订单状态显示组件
  const OrderStatusDisplay = ({ orderStatus }) => {
    if (!orderStatus) return null;

    const getStatusColor = (status) => {
      switch (status) {
        case 'COMPLETED': return 'text-green-600';
        case 'FAILED': return 'text-red-600';
        case 'PROCESSING': return 'text-yellow-600';
        default: return 'text-gray-600';
      }
    };

    return (
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <h3 className="text-lg font-medium mb-3">Order Status</h3>
        <div className="space-y-2">
          <p><strong>Order ID:</strong> {orderStatus.orderId}</p>
          <p><strong>Amount:</strong> ${orderStatus.amount}</p>
          <p><strong>USDE Amount:</strong> {orderStatus.usdeAmount}</p>
          <p className={`font-medium ${getStatusColor(orderStatus.status)}`}>
            <strong>Status:</strong> {orderStatus.status}
          </p>
          
          {orderStatus.progress && (
            <div className="mt-4">
              <h4 className="font-medium mb-2">Progress:</h4>
              {orderStatus.progress.map((step, index) => (
                <div key={index} className="flex items-center space-x-2 text-sm">
                  <span className={`w-3 h-3 rounded-full ${
                    step.status === 'completed' ? 'bg-green-500' :
                    step.status === 'failed' ? 'bg-red-500' :
                    'bg-yellow-500'
                  }`}></span>
                  <span>{step.description}</span>
                  <span className="text-gray-500">
                    {new Date(step.timestamp).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">USDE Deposits</h1>
      
      {/* KYC状态提示 */}
      {kycStatus !== 'APPROVED' && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-6">
          <p className="font-bold">KYC Verification Required</p>
          <p>Complete your KYC verification to deposit and withdraw USDE tokens.</p>
        </div>
      )}

      {/* 余额和统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900">USDE Balance</h3>
          <p className="text-3xl font-bold text-blue-600">{balance.toFixed(2)}</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900">Daily Limit</h3>
          <p className="text-lg font-semibold">
            ${limits.daily?.remaining?.toFixed(2) || '0'} remaining
          </p>
          <p className="text-sm text-gray-500">
            of ${limits.daily?.limit?.toFixed(2) || '0'} daily limit
          </p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900">Monthly Limit</h3>
          <p className="text-lg font-semibold">
            ${limits.monthly?.remaining?.toFixed(2) || '0'} remaining
          </p>
          <p className="text-sm text-gray-500">
            of ${limits.monthly?.limit?.toFixed(2) || '0'} monthly limit
          </p>
        </div>
      </div>

      {/* 订单状态显示 */}
      <OrderStatusDisplay orderStatus={orderStatus} />

      {/* 充值表单 */}
      <div className="bg-white p-6 rounded-lg shadow mb-8">
        <h2 className="text-xl font-semibold mb-4">Deposit USD to Mint USDE</h2>
        <form onSubmit={handleDeposit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Amount (USD)
            </label>
            <input
              type="number"
              step="0.01"
              min="1"
              max="1000000"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter amount"
              disabled={loading || kycStatus !== 'APPROVED'}
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Fee: 0.25% • You'll receive approximately {
                (parseFloat(depositAmount) * 0.9975).toFixed(2) || '0.00'
              } USDE
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Method
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            >
              <option value="card">Credit/Debit Card</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="ach">ACH Transfer</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading || kycStatus !== 'APPROVED' || !depositAmount}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Processing...' : 'Deposit & Mint USDE'}
          </button>
        </form>
      </div>

      {/* 交易历史 */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold">Transaction History</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {transactions.map((tx) => (
                <tr key={tx.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      tx.type === 'mint' ? 'bg-green-100 text-green-800' :
                      tx.type === 'withdraw' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {tx.type.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {tx.amount.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      tx.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                      tx.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {tx.status || 'confirmed'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(tx.timestamp).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {tx.description}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {transactions.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No transactions yet
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Deposits;
```

## 🔄 数据库迁移脚本

### 1. 增量迁移脚本

```sql
-- migration_001_risk_enhancements.sql
-- 为现有表添加风控相关字段

-- 为companies表添加风控字段
ALTER TABLE companies ADD COLUMN IF NOT EXISTS risk_rating VARCHAR(10) DEFAULT 'medium';
ALTER TABLE companies ADD COLUMN IF NOT EXISTS daily_limit DECIMAL(18,8) DEFAULT 10000.00;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS monthly_limit DECIMAL(18,8) DEFAULT 100000.00;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS kyc_level INTEGER DEFAULT 1;

-- 为deposits表添加增强字段
ALTER TABLE deposits ADD COLUMN IF NOT EXISTS fee_rate DECIMAL(6,4) DEFAULT 0.0025;
ALTER TABLE deposits ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50) DEFAULT 'card';
ALTER TABLE deposits ADD COLUMN IF NOT EXISTS failure_reason TEXT;
ALTER TABLE deposits ADD COLUMN IF NOT EXISTS stripe_payment_intent_id VARCHAR(255);
ALTER TABLE deposits ADD COLUMN IF NOT EXISTS blockchain_tx_hash VARCHAR(255);
ALTER TABLE deposits ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP;

-- 为usde_transactions表添加区块链相关字段
ALTER TABLE usde_transactions ADD COLUMN IF NOT EXISTS blockchain_tx_hash VARCHAR(255);
ALTER TABLE usde_transactions ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'confirmed';
ALTER TABLE usde_transactions ADD COLUMN IF NOT EXISTS block_number BIGINT;

-- 创建风控评估表
CREATE TABLE IF NOT EXISTS risk_assessments (
    id VARCHAR(32) PRIMARY KEY,
    companyId VARCHAR(32) NOT NULL,
    assessment_type VARCHAR(20) NOT NULL,
    amount DECIMAL(18,8) NOT NULL,
    risk_score INTEGER NOT NULL DEFAULT 0,
    risk_factors TEXT,
    decision VARCHAR(20) NOT NULL DEFAULT 'approved',
    decision_reason TEXT,
    assessor VARCHAR(50) DEFAULT 'system',
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (companyId) REFERENCES companies(id),
    INDEX idx_risk_company_type (companyId, assessment_type),
    INDEX idx_risk_decision (decision),
    INDEX idx_risk_created_at (createdAt)
);

-- 创建性能优化索引
CREATE INDEX IF NOT EXISTS idx_companies_kyc_status ON companies(kycStatus);
CREATE INDEX IF NOT EXISTS idx_companies_risk_rating ON companies(risk_rating);
CREATE INDEX IF NOT EXISTS idx_deposits_company_status ON deposits(companyId, status);
CREATE INDEX IF NOT EXISTS idx_deposits_created_at ON deposits(createdAt);
CREATE INDEX IF NOT EXISTS idx_usde_transactions_company_type ON usde_transactions(companyId, type);
CREATE INDEX IF NOT EXISTS idx_usde_transactions_status ON usde_transactions(status);
```

## ⚡ 性能监控脚本

### 1. 数据库性能检查

```javascript
// scripts/performance-check.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function performanceCheck() {
  console.log('🔍 Running performance checks...\n');
  
  // 检查慢查询
  const slowQueries = await prisma.$queryRaw`
    SELECT query, mean_time, calls, total_time
    FROM pg_stat_statements 
    WHERE mean_time > 1000 
    ORDER BY mean_time DESC 
    LIMIT 10;
  `;
  
  console.log('📊 Top slow queries:');
  console.table(slowQueries);
  
  // 检查表大小
  const tableSizes = await prisma.$queryRaw`
    SELECT 
      schemaname,
      tablename,
      pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
      pg_total_relation_size(schemaname||'.'||tablename) as size_bytes
    FROM pg_tables 
    WHERE schemaname = 'public'
    ORDER BY size_bytes DESC;
  `;
  
  console.log('\n📏 Table sizes:');
  console.table(tableSizes);
  
  // 检查索引使用情况
  const indexUsage = await prisma.$queryRaw`
    SELECT 
      schemaname,
      tablename,
      indexname,
      idx_tup_read,
      idx_tup_fetch
    FROM pg_stat_user_indexes 
    ORDER BY idx_tup_read DESC 
    LIMIT 10;
  `;
  
  console.log('\n📈 Index usage:');
  console.table(indexUsage);
  
  await prisma.$disconnect();
}

if (require.main === module) {
  performanceCheck().catch(console.error);
}

module.exports = performanceCheck;
```

## 🚀 部署优化检查清单

### ✅ 立即可实施的优化项

**代码层面：**
- [ ] 添加输入验证中间件
- [ ] 实现简单缓存机制
- [ ] 增强错误处理
- [ ] 添加响应时间监控
- [ ] 实现风控评估逻辑

**数据库层面：**
- [ ] 运行增量迁移脚本
- [ ] 添加性能优化索引
- [ ] 创建风控评估表
- [ ] 设置数据库监控

**API层面：**
- [ ] 增强现有端点功能
- [ ] 添加订单状态跟踪
- [ ] 实现批量查询优化
- [ ] 添加限流保护

**前端层面：**
- [ ] 增强用户体验
- [ ] 添加实时状态显示
- [ ] 优化错误提示
- [ ] 实现自动刷新
