const express = require('express');
const { body, validationResult } = require('express-validator');
const prisma = require('../lib/prisma');
const { verifyToken } = require('../middleware/auth');
const StripeService = require('../services/stripeService');
const rateLimit = require('express-rate-limit');
const { cacheMiddleware, invalidateCache } = require('../middleware/cache');
const { validateDeposit, validateWithdrawal } = require('../middleware/validation');
const simpleMetrics = require('../services/simpleMetrics');

const router = express.Router();

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
    if (company.kycStatus !== 'approved') {
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
router.post('/create-session', depositLimiter, verifyToken, validateDeposit, async (req, res) => {
  try {
    const { amount, paymentMethod = 'card' } = req.body;
    const companyId = req.company.companyId;
    
    console.log(`[API] POST /create-session - Company ID: ${companyId}, Amount: ${amount}, Payment Method: ${paymentMethod}`);
    
    // 输入验证增强
    if (!amount || amount < 1 || amount > 1000000) {
      console.log(`[API] ERROR: Invalid amount - ${amount}`);
      return res.status(400).json({
        success: false,
        error: 'Invalid amount. Must be between $1 and $1,000,000'
      });
    }
    
    // 检查用户KYC状态
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: {
        kycStatus: true,
        usdeBalance: true
      }
    });
    
    console.log(`[API] Company KYC status: ${company?.kycStatus}`);
    
    if (!company) {
      console.log(`[API] ERROR: Company not found for ID: ${companyId}`);
      return res.status(404).json({
        success: false,
        error: 'Company not found'
      });
    }
    
    if (company.kycStatus !== 'approved') {
      console.log(`[API] ERROR: KYC not approved - Status: ${company.kycStatus}`);
      return res.status(403).json({
        success: false,
        error: 'KYC verification required before depositing'
      });
    }
    
    // 风控评估
    const riskAssessment = await assessRisk(companyId, amount, paymentMethod);
    
    console.log(`[API] Risk assessment:`, {
      score: riskAssessment.riskScore,
      decision: riskAssessment.decision,
      factors: riskAssessment.factors
    });
    
    if (riskAssessment.decision === 'rejected') {
      console.log(`[API] ERROR: Transaction rejected due to risk assessment`);
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
    
    console.log(`[API] Fee calculation:`, {
      amount,
      feeRate,
      fee,
      usdeAmount
    });
    
    // 创建订单记录（增强版）
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
    
    console.log(`[API] Order created:`, {
      orderId: order.id,
      status: order.status,
      amount: order.amount,
      fee: order.fee,
      usdeAmount: order.usdeAmount,
      paymentMethod: order.paymentMethod
    });
    
    // 创建Stripe会话（保持原有逻辑）
    const successUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/deposits?success=true`;
    const cancelUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/deposits?canceled=true`;
    
    console.log(`[API] Creating Stripe session with payment method: ${paymentMethod}`);
    
    const session = await StripeService.createCheckoutSession(
      amount,
      companyId,
      successUrl,
      cancelUrl,
      order.id, // 传递订单ID
      paymentMethod // 传递支付方式
    );
    
    console.log(`[API] Stripe session created:`, {
      sessionId: session.id,
      url: session.url,
      paymentMethod: paymentMethod
    });
    
    // 更新订单的Stripe会话ID
    await prisma.deposit.update({
      where: { id: order.id },
      data: { 
        stripeSessionId: session.id,
        status: 'PENDING'
      }
    });
    
    // 增加指标
    simpleMetrics.incrementDeposits();
    
    const response = {
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
    };
    
    console.log(`[API] Response sent successfully`);
    
    res.json(response);
    
  } catch (error) {
    console.error('[API] Error in /create-session:', error);
    console.error('[API] Error stack:', error.stack);
    console.error('[API] Error details:', {
      message: error.message,
      code: error.code,
      type: error.type
    });
    simpleMetrics.incrementErrors();
    res.status(500).json({
      success: false,
      error: 'Failed to create payment session',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// 增强现有的webhook处理
router.post('/webhook', express.raw({type: 'application/json'}), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    console.log(`[WEBHOOK] Received webhook event`);
    event = StripeService.verifyWebhook(req.body, sig);
    console.log(`[WEBHOOK] Event type: ${event.type}`);
  } catch (err) {
    console.error('[WEBHOOK] Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const { companyId, orderId, usdeAmount } = session.metadata;
    
    console.log(`[WEBHOOK] Processing completed session:`, {
      sessionId: session.id,
      companyId,
      orderId,
      usdeAmount,
      paymentIntent: session.payment_intent
    });
    
    try {
      // 使用事务确保数据一致性
      await prisma.$transaction(async (tx) => {
        console.log(`[WEBHOOK] Starting transaction for order: ${orderId}`);
        
        // 更新订单状态
        const order = await tx.deposit.update({
          where: { id: orderId },
          data: {
            status: 'COMPLETED',
            stripePaymentIntentId: session.payment_intent,
            completedAt: new Date()
          }
        });
        
        console.log(`[WEBHOOK] Updated deposit order:`, {
          orderId: order.id,
          status: order.status,
          amount: order.amount
        });
        
        // 更新USDE余额
        const currentBalance = await tx.company.findUnique({
          where: { id: companyId },
          select: { usdeBalance: true }
        });
        
        console.log(`[WEBHOOK] Current balance for company ${companyId}:`, currentBalance?.usdeBalance || 0);
        
        const newBalance = (currentBalance?.usdeBalance || 0) + parseFloat(usdeAmount);
        
        await tx.company.update({
          where: { id: companyId },
          data: {
            usdeBalance: newBalance
          }
        });
        
        console.log(`[WEBHOOK] Updated company balance:`, {
          companyId,
          oldBalance: currentBalance?.usdeBalance || 0,
          addedAmount: parseFloat(usdeAmount),
          newBalance
        });
        
        // 记录交易历史（增强版）
        const transaction = await tx.uSDETransaction.create({
          data: {
            companyId,
            type: 'mint',
            amount: parseFloat(usdeAmount),
            balanceBefore: currentBalance?.usdeBalance || 0,
            balanceAfter: newBalance,
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
        
        console.log(`[WEBHOOK] Created transaction record:`, {
          transactionId: transaction.id,
          type: transaction.type,
          amount: transaction.amount,
          balanceBefore: transaction.balanceBefore,
          balanceAfter: transaction.balanceAfter
        });
      });
      
      console.log(`✅ [WEBHOOK] Successfully processed deposit for company ${companyId}`);
      
    } catch (error) {
      console.error('[WEBHOOK] Error processing webhook:', error);
      console.error('[WEBHOOK] Error stack:', error.stack);
      // 这里可以添加重试机制或错误通知
    }
  }

  res.json({received: true});
});

// 增强现有的获取余额和交易历史端点
router.get('/usde-balance', verifyToken, cacheMiddleware(300), async (req, res) => {
  try {
    const companyId = req.company.companyId;
    const { page = 1, limit = 10, type = 'all' } = req.query;
    
    console.log(`[API] GET /usde-balance - Company ID: ${companyId}`);
    console.log(`[API] Request query params:`, { page, limit, type });
    
    // 获取公司信息和余额
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: {
        usdeBalance: true,
        kycStatus: true
      }
    });
    
    console.log(`[API] Company data from database:`, {
      usdeBalance: company?.usdeBalance,
      kycStatus: company?.kycStatus
    });
    
    if (!company) {
      console.log(`[API] ERROR: Company not found for ID: ${companyId}`);
      return res.status(404).json({
        success: false,
        error: 'Company not found'
      });
    }
    
    // 构建交易查询条件
    const whereClause = { company_id: companyId };
    if (type !== 'all') {
      whereClause.type = type;
    }
    
    // 获取交易历史（分页）
    const [transactions, totalCount] = await Promise.all([
      prisma.deposit.findMany({
        where: whereClause,
        orderBy: { created_at: 'desc' },
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit)
      }),
      prisma.deposit.count({ where: whereClause })
    ]);
    
    console.log(`[API] Transactions found: ${transactions.length}, Total: ${totalCount}`);
    
    // 计算统计数据
    const [depositStats, withdrawStats, todayStats] = await Promise.all([
      prisma.deposit.aggregate({
        where: { company_id: companyId, status: 'completed' },
        _sum: { amount: true },
        _count: { id: true }
      }),
      prisma.withdrawal.aggregate({
        where: { company_id: companyId, status: 'completed' },
        _sum: { amount: true },
        _count: { id: true }
      }),
      prisma.deposit.aggregate({
        where: {
          company_id: companyId,
          status: 'completed',
          created_at: {
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
        company_id: companyId,
        status: 'COMPLETED',
        created_at: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        }
      },
      _sum: { amount: true }
    });
    
    const response = {
      success: true,
      data: {
        balance: {
          available: company.usdeBalance || 0,
          locked: 0, // 预留字段
          total: company.usdeBalance || 0
        },
        kycStatus: company.kycStatus,
        limits: {
          daily: {
            limit: 10000, // 默认限额
            used: todayUsed,
            remaining: 10000 - todayUsed
          },
          monthly: {
            limit: 100000, // 默认限额
            used: monthlyUsed._sum.amount || 0,
            remaining: 100000 - (monthlyUsed._sum.amount || 0)
          }
        },
        transactions: transactions.map(t => ({
          id: t.id,
          type: 'deposit',
          amount: t.amount,
          description: `Deposit of ${t.amount} USD`,
          timestamp: t.created_at,
          balanceAfter: null // No balanceAfter field in current schema
        })),
        stats: {
          totalDeposits: depositStats._sum.amount || 0,
          totalWithdrawals: withdrawStats._sum.amount || 0,
          depositCount: depositStats._count.id || 0,
          withdrawalCount: withdrawStats._count.id || 0
        }
      }
    };
    
    console.log(`[API] Response data:`, {
      success: true,
      kycStatus: response.data.kycStatus,
      balance: response.data.balance.available,
      dailyRemaining: response.data.limits.daily.remaining,
      monthlyRemaining: response.data.limits.monthly.remaining
    });
    
    res.json(response);
    
  } catch (error) {
    console.error('[API] Error in /usde-balance:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch USDE balance'
    });
  }
});

// Withdraw USDE to wallet
router.post('/withdraw', verifyToken, [
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
  body('walletAddress').isLength({ min: 26, max: 42 }).withMessage('Invalid wallet address'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { amount, walletAddress } = req.body;
    const companyId = req.company.companyId;

    // Check if company exists and KYC is approved
    const company = await prisma.company.findUnique({
      where: { id: companyId }
    });

    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    if (company.kycStatus !== 'approved') {
      return res.status(403).json({ 
        error: 'KYC must be approved before making withdrawals',
        kycStatus: company.kycStatus
      });
    }

    if (company.usdeBalance < amount) {
      return res.status(400).json({ 
        error: 'Insufficient USDE balance',
        currentBalance: company.usdeBalance,
        requestedAmount: amount
      });
    }

    // Process withdrawal
    const result = await prisma.$transaction(async (tx) => {
      const balanceBefore = company.usdeBalance;
      const balanceAfter = balanceBefore - amount;

      // Update company balance
      const updatedCompany = await tx.company.update({
        where: { id: companyId },
        data: { usdeBalance: balanceAfter }
      });

      // Create withdrawal record
      const withdrawal = await tx.withdrawal.create({
        data: {
          companyId,
          amount,
          walletAddress,
          status: 'completed', // For MVP, we'll mark as completed immediately
          transactionHash: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` // Simulated transaction hash
        }
      });

      // Record USDE transaction
      await tx.uSDETransaction.create({
        data: {
          companyId,
          type: 'withdraw',
          amount,
          balanceBefore,
          balanceAfter,
          description: `Withdrew ${amount} USDE to wallet ${walletAddress}`,
          metadata: JSON.stringify({
            withdrawalId: withdrawal.id,
            walletAddress,
            transactionHash: withdrawal.transactionHash
          })
        }
      });

      return { withdrawal, updatedCompany, balanceBefore, balanceAfter };
    });

    res.json({
      message: 'Withdrawal processed successfully',
      withdrawal: {
        id: result.withdrawal.id,
        amount: result.withdrawal.amount,
        walletAddress: result.withdrawal.walletAddress,
        transactionHash: result.withdrawal.transactionHash,
        status: result.withdrawal.status,
        timestamp: result.withdrawal.timestamp
      },
      newBalance: result.balanceAfter
    });

  } catch (error) {
    console.error('Withdrawal error:', error);
    res.status(500).json({ error: 'Withdrawal failed' });
  }
});

// Get deposit history
router.get('/', verifyToken, async (req, res) => {
  try {
    const companyId = req.company.companyId;
    const { page = 1, limit = 10, status } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = { company_id: companyId };
    if (status) {
      whereClause.status = status;
    }

    const deposits = await prisma.deposit.findMany({
      where: whereClause,
      orderBy: { created_at: 'desc' },
      skip: offset,
      take: parseInt(limit)
    });

    const total = await prisma.deposit.count({ where: whereClause });

    res.json({
      deposits,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Deposit history error:', error);
    res.status(500).json({ error: 'Failed to fetch deposit history' });
  }
});

// Get withdrawal history
router.get('/withdrawals', verifyToken, async (req, res) => {
  try {
    const companyId = req.company.companyId;
    const { page = 1, limit = 10, status } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = { company_id: companyId };
    if (status) {
      whereClause.status = status;
    }

    const withdrawals = await prisma.withdrawal.findMany({
      where: whereClause,
      orderBy: { created_at: 'desc' },
      skip: offset,
      take: parseInt(limit)
    });

    const total = await prisma.withdrawal.count({ where: whereClause });

    res.json({
      withdrawals,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Withdrawal history error:', error);
    res.status(500).json({ error: 'Failed to fetch withdrawal history' });
  }
});

// 新增：获取订单详细状态端点
router.get('/order/:orderId/status', verifyToken, async (req, res) => {
  try {
    const { orderId } = req.params;
    const companyId = req.company.companyId;
    
    const order = await prisma.deposit.findFirst({
      where: {
        id: orderId,
        company_id: companyId
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
    
    if (order.created_at) {
      progress.push({
        step: 'order_created',
        status: 'completed',
        timestamp: order.created_at,
        description: 'Payment order created'
      });
    }
    
    if (order.stripe_payment_intent_id) {
      progress.push({
        step: 'payment_session_created',
        status: 'completed',
        timestamp: order.created_at,
        description: 'Payment session initialized'
      });
    }
    
    if (order.status === 'completed') {
      progress.push({
        step: 'payment_confirmed',
        status: 'completed',
        timestamp: order.updated_at,
        description: 'Payment confirmed by Stripe'
      });
      
      progress.push({
        step: 'tokens_minted',
        status: 'completed',
        timestamp: order.updated_at,
        description: 'USDE tokens minted and credited'
      });
    } else if (order.status === 'failed') {
      progress.push({
        step: 'payment_failed',
        status: 'failed',
        timestamp: order.updated_at,
        description: 'Payment failed'
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
        riskAssessment: null, // No risk assessments table in current schema
        createdAt: order.created_at,
        expiresAt: null // No expiresAt field in current schema
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

// Complete deposit (for testing Stripe webhook simulation)
router.post('/:depositId/complete', verifyToken, async (req, res) => {
  try {
    const { depositId } = req.params;
    const companyId = req.company.companyId;

    const deposit = await prisma.deposit.findFirst({
      where: {
        id: depositId,
        company_id: companyId
      }
    });

    if (!deposit) {
      return res.status(404).json({ error: 'Deposit not found' });
    }

    if (deposit.status === 'completed') {
      return res.status(400).json({ error: 'Deposit already completed' });
    }

    // Complete the deposit and mint USDE
    const result = await prisma.$transaction(async (tx) => {
      const updatedDeposit = await tx.deposit.update({
        where: { id: depositId },
        data: { status: 'completed' }
      });

      const company = await tx.company.findUnique({
        where: { id: companyId }
      });

      const balanceBefore = company.usdeBalance;
      const balanceAfter = balanceBefore + deposit.amount;

      const updatedCompany = await tx.company.update({
        where: { id: companyId },
        data: { usdeBalance: balanceAfter }
      });

      // Note: uSDETransaction table doesn't exist in current schema
      // Transaction recording is handled by deposit status update

      return { updatedDeposit, updatedCompany, balanceBefore, balanceAfter };
    });

    res.json({
      message: 'Deposit completed and USDE minted',
      deposit: result.updatedDeposit,
      newBalance: result.balanceAfter
    });

  } catch (error) {
    console.error('Deposit completion error:', error);
    res.status(500).json({ error: 'Failed to complete deposit' });
  }
});

// Get deposit statistics
router.get('/stats/summary', verifyToken, async (req, res) => {
  try {
    const companyId = req.company.companyId;

    const [totalDeposits, pendingDeposits, completedDeposits, totalWithdrawals] = await Promise.all([
      prisma.deposit.aggregate({
        where: { company_id: companyId },
        _sum: { amount: true }
      }),
      prisma.deposit.aggregate({
        where: { 
          company_id: companyId,
          status: 'pending'
        },
        _sum: { amount: true }
      }),
      prisma.deposit.aggregate({
        where: { 
          company_id: companyId,
          status: 'completed'
        },
        _sum: { amount: true }
      }),
      prisma.withdrawal.aggregate({
        where: { 
          company_id: companyId,
          status: 'completed'
        },
        _sum: { amount: true }
      })
    ]);

    res.json({
      summary: {
        totalDeposits: totalDeposits._sum.amount || 0,
        pendingDeposits: pendingDeposits._sum.amount || 0,
        completedDeposits: completedDeposits._sum.amount || 0,
        totalWithdrawals: totalWithdrawals._sum.amount || 0
      }
    });

  } catch (error) {
    console.error('Deposit stats error:', error);
    res.status(500).json({ error: 'Failed to fetch deposit statistics' });
  }
});

module.exports = router; 