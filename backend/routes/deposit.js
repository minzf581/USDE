const express = require('express');
const { body, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { verifyToken } = require('./auth');
const StripeService = require('../services/stripeService');

const router = express.Router();
const prisma = new PrismaClient();

// Create Stripe checkout session for deposit
router.post('/create-session', verifyToken, [
  body('amount').isFloat({ min: 1 }).withMessage('Amount must be at least $1'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { amount } = req.body;
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
        error: 'KYC must be approved before making deposits',
        kycStatus: company.kycStatus
      });
    }

    // Create Stripe checkout session
    const successUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/deposits?success=true`;
    const cancelUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/deposits?canceled=true`;
    
    const session = await StripeService.createCheckoutSession(
      amount,
      companyId,
      successUrl,
      cancelUrl
    );

    res.json({
      sessionId: session.id,
      url: session.url,
      amount: amount
    });

  } catch (error) {
    console.error('Create session error:', error);
    res.status(500).json({ error: 'Failed to create payment session' });
  }
});

// Stripe webhook handler
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];

  try {
    const event = StripeService.verifyWebhook(req.body, sig);

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      
      if (session.payment_status === 'paid') {
        await StripeService.handlePaymentSuccess(session.id);
      }
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(400).json({ error: 'Webhook signature verification failed' });
  }
});

// Get USDE balance and transaction history
router.get('/usde-balance', verifyToken, async (req, res) => {
  try {
    const companyId = req.company.companyId;
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: {
        usdeBalance: true,
        kycStatus: true
      }
    });

    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    // Get transaction history
    const transactions = await prisma.uSDETransaction.findMany({
      where: { companyId },
      orderBy: { timestamp: 'desc' },
      skip: offset,
      take: parseInt(limit),
      select: {
        id: true,
        type: true,
        amount: true,
        balanceBefore: true,
        balanceAfter: true,
        description: true,
        timestamp: true
      }
    });

    const total = await prisma.uSDETransaction.count({ where: { companyId } });

    res.json({
      balance: company.usdeBalance,
      kycStatus: company.kycStatus,
      transactions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('USDE balance error:', error);
    res.status(500).json({ error: 'Failed to fetch USDE balance' });
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