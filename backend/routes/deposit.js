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
    const successUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/deposits?success=true`;
    const cancelUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/deposits?canceled=true`;
    
    const session = await StripeService.createCheckoutSession(
      amount,
      companyId,
      successUrl,
      cancelUrl
    );
    
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
    simpleMetrics.incrementErrors();
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
    event = StripeService.verifyWebhook(req.body, sig);
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

// 增强现有的获取余额和交易历史端点
router.get('/usde-balance', verifyToken, cacheMiddleware(300), async (req, res) => {
  try {
    const companyId = req.company.companyId;
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

    const whereClause = { companyId };
    if (status) {
      whereClause.status = status;
    }

    const deposits = await prisma.deposit.findMany({
      where: whereClause,
      orderBy: { timestamp: 'desc' },
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

    const whereClause = { companyId };
    if (status) {
      whereClause.status = status;
    }

    const withdrawals = await prisma.withdrawal.findMany({
      where: whereClause,
      orderBy: { timestamp: 'desc' },
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

// Complete deposit (for testing Stripe webhook simulation)
router.post('/:depositId/complete', verifyToken, async (req, res) => {
  try {
    const { depositId } = req.params;
    const companyId = req.company.companyId;

    const deposit = await prisma.deposit.findFirst({
      where: {
        id: depositId,
        companyId
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

      // Record USDE transaction
      await tx.uSDETransaction.create({
        data: {
          companyId,
          type: 'mint',
          amount: deposit.amount,
          balanceBefore,
          balanceAfter,
          description: `Minted ${deposit.amount} USDE from deposit`,
          metadata: JSON.stringify({
            depositId: deposit.id
          })
        }
      });

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
        where: { companyId },
        _sum: { amount: true }
      }),
      prisma.deposit.aggregate({
        where: { 
          companyId,
          status: 'pending'
        },
        _sum: { amount: true }
      }),
      prisma.deposit.aggregate({
        where: { 
          companyId,
          status: 'completed'
        },
        _sum: { amount: true }
      }),
      prisma.withdrawal.aggregate({
        where: { 
          companyId,
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