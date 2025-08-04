const express = require('express');
const { body, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { verifyToken } = require('./auth');

const router = express.Router();
const prisma = new PrismaClient();

// Create withdrawal request
router.post('/', verifyToken, [
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
  body('withdrawalMethod').isIn(['stripe', 'manual']).withMessage('Invalid withdrawal method')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { amount, withdrawalMethod } = req.body;
    const companyId = req.company.companyId;

    // Check if company exists and has sufficient balance
    const company = await prisma.company.findUnique({
      where: { id: companyId }
    });

    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    if (company.ucBalance < amount) {
      return res.status(400).json({ error: 'Insufficient USDE balance' });
    }

    // Check if company has any active stakes that would be affected
    const activeStakes = await prisma.stake.findMany({
      where: {
        companyId,
        unlocked: false
      }
    });

    const totalStaked = activeStakes.reduce((sum, stake) => sum + stake.amount, 0);
    const availableBalance = company.ucBalance - totalStaked;

    if (availableBalance < amount) {
      return res.status(400).json({ 
        error: 'Insufficient available balance (some funds are locked in stakes)',
        availableBalance,
        totalStaked
      });
    }

    // Create withdrawal record
    const withdrawal = await prisma.withdrawal.create({
      data: {
        companyId,
        amount,
        status: withdrawalMethod === 'stripe' ? 'pending' : 'completed',
        stripePayoutId: withdrawalMethod === 'stripe' ? `po_${Date.now()}` : null
      }
    });

    // If manual withdrawal, immediately burn USDE
    if (withdrawalMethod === 'manual') {
      await prisma.company.update({
        where: { id: companyId },
        data: { ucBalance: { decrement: amount } }
      });

      withdrawal.status = 'completed';
    }

    res.json({
      message: withdrawalMethod === 'manual' ? 'USDE burned successfully' : 'Withdrawal initiated',
      withdrawal: {
        id: withdrawal.id,
        amount: withdrawal.amount,
        status: withdrawal.status,
        timestamp: withdrawal.timestamp
      },
      newBalance: withdrawalMethod === 'manual' ? company.ucBalance - amount : company.ucBalance
    });

  } catch (error) {
    console.error('Withdrawal error:', error);
    res.status(500).json({ error: 'Withdrawal failed' });
  }
});

// Get withdrawal history
router.get('/', verifyToken, async (req, res) => {
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

// Complete withdrawal (for testing Stripe webhook simulation)
router.post('/:withdrawalId/complete', verifyToken, async (req, res) => {
  try {
    const { withdrawalId } = req.params;
    const companyId = req.company.companyId;

    const withdrawal = await prisma.withdrawal.findFirst({
      where: {
        id: withdrawalId,
        companyId
      }
    });

    if (!withdrawal) {
      return res.status(404).json({ error: 'Withdrawal not found' });
    }

    if (withdrawal.status === 'completed') {
      return res.status(400).json({ error: 'Withdrawal already completed' });
    }

    // Check current balance
    const company = await prisma.company.findUnique({
      where: { id: companyId }
    });

    if (company.ucBalance < withdrawal.amount) {
      return res.status(400).json({ error: 'Insufficient balance to complete withdrawal' });
    }

    // Complete the withdrawal and burn USDE
    const result = await prisma.$transaction(async (tx) => {
      const updatedWithdrawal = await tx.withdrawal.update({
        where: { id: withdrawalId },
        data: { status: 'completed' }
      });

      const updatedCompany = await tx.company.update({
        where: { id: companyId },
        data: { ucBalance: { decrement: withdrawal.amount } }
      });

      return { updatedWithdrawal, updatedCompany };
    });

    res.json({
      message: 'Withdrawal completed and USDE burned',
      withdrawal: result.updatedWithdrawal,
      newBalance: result.updatedCompany.ucBalance
    });

  } catch (error) {
    console.error('Withdrawal completion error:', error);
    res.status(500).json({ error: 'Failed to complete withdrawal' });
  }
});

// Get withdrawal statistics
router.get('/stats/summary', verifyToken, async (req, res) => {
  try {
    const companyId = req.company.companyId;

    const [totalWithdrawals, pendingWithdrawals, completedWithdrawals] = await Promise.all([
      prisma.withdrawal.aggregate({
        where: { companyId },
        _sum: { amount: true }
      }),
      prisma.withdrawal.aggregate({
        where: { 
          companyId,
          status: 'pending'
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
        totalWithdrawals: totalWithdrawals._sum.amount || 0,
        pendingWithdrawals: pendingWithdrawals._sum.amount || 0,
        completedWithdrawals: completedWithdrawals._sum.amount || 0
      }
    });

  } catch (error) {
    console.error('Withdrawal stats error:', error);
    res.status(500).json({ error: 'Failed to fetch withdrawal statistics' });
  }
});

module.exports = router; 