const express = require('express');
const { body, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { verifyToken } = require('./auth');

const router = express.Router();
const prisma = new PrismaClient();

// Create deposit (simulate USDE minting)
router.post('/', verifyToken, [
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
  body('paymentMethod').isIn(['stripe', 'manual']).withMessage('Invalid payment method')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { amount, paymentMethod } = req.body;
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

    // Create deposit record
    const deposit = await prisma.deposit.create({
      data: {
        companyId,
        amount,
        status: paymentMethod === 'stripe' ? 'pending' : 'completed',
        stripePaymentId: paymentMethod === 'stripe' ? `pi_${Date.now()}` : null
      }
    });

    // If manual deposit, immediately mint USDE
    if (paymentMethod === 'manual') {
      await prisma.company.update({
        where: { id: companyId },
        data: { ucBalance: { increment: amount } }
      });

      deposit.status = 'completed';
    }

    res.json({
      message: paymentMethod === 'manual' ? 'USDE minted successfully' : 'Deposit initiated',
      deposit: {
        id: deposit.id,
        amount: deposit.amount,
        status: deposit.status,
        timestamp: deposit.timestamp
      },
      newBalance: paymentMethod === 'manual' ? company.ucBalance + amount : company.ucBalance
    });

  } catch (error) {
    console.error('Deposit error:', error);
    res.status(500).json({ error: 'Deposit failed' });
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

      const updatedCompany = await tx.company.update({
        where: { id: companyId },
        data: { ucBalance: { increment: deposit.amount } }
      });

      return { updatedDeposit, updatedCompany };
    });

    res.json({
      message: 'Deposit completed and USDE minted',
      deposit: result.updatedDeposit,
      newBalance: result.updatedCompany.ucBalance
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

    const [totalDeposits, pendingDeposits, completedDeposits] = await Promise.all([
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
      })
    ]);

    res.json({
      summary: {
        totalDeposits: totalDeposits._sum.amount || 0,
        pendingDeposits: pendingDeposits._sum.amount || 0,
        completedDeposits: completedDeposits._sum.amount || 0
      }
    });

  } catch (error) {
    console.error('Deposit stats error:', error);
    res.status(500).json({ error: 'Failed to fetch deposit statistics' });
  }
});

module.exports = router; 