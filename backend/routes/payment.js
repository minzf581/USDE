const express = require('express');
const { body, validationResult } = require('express-validator');
const prisma = require('../lib/prisma');
const { verifyToken, requireKYCApproved } = require('../middleware/auth');
const paymentService = require('../services/paymentService');

const router = express.Router();


// Make payment to supplier
router.post('/send', verifyToken, requireKYCApproved, [
  body('toEmail').isEmail().normalizeEmail().withMessage('Valid recipient email is required'),
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
  body('lockDays').isInt({ min: 30, max: 180 }).withMessage('Lock days must be 30, 90, or 180')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { toEmail, amount, lockDays } = req.body;
    const fromCompanyId = req.company.companyId;

    // Validate lock days
    if (![30, 90, 180].includes(lockDays)) {
      return res.status(400).json({ error: 'Lock days must be 30, 90, or 180' });
    }

    // Check if sender has sufficient balance
    const sender = await prisma.company.findUnique({
      where: { id: fromCompanyId }
    });

    if (!sender) {
      return res.status(404).json({ error: 'Sender company not found' });
    }

    // Check available balance using service
    const availableBalance = await paymentService.getAvailableBalance(fromCompanyId);
    
    if (availableBalance < amount) {
      return res.status(400).json({ 
        error: 'Insufficient available USDE balance',
        availableBalance,
        requestedAmount: amount
      });
    }

    // Find recipient company
    const recipient = await prisma.company.findUnique({
      where: { email: toEmail }
    });

    if (!recipient) {
      return res.status(404).json({ error: 'Recipient company not found' });
    }

    if (recipient.id === fromCompanyId) {
      return res.status(400).json({ error: 'Cannot send payment to yourself' });
    }

    // Create payment using service
    const result = await paymentService.createPayment(fromCompanyId, recipient.id, amount, lockDays);

    res.json({
      message: 'Payment sent successfully',
      payment: {
        id: result.payment.id,
        amount: result.payment.amount,
        lockDays: result.payment.lockDays,
        releaseAt: result.payment.releaseAt,
        recipient: recipient.name,
        recipientEmail: recipient.email,
        timestamp: result.payment.timestamp
      },
      newBalance: result.updatedSender.usdeBalance
    });

  } catch (error) {
    console.error('Payment error:', error);
    res.status(500).json({ error: 'Payment failed' });
  }
});

// Get payment history
router.get('/history', verifyToken, async (req, res) => {
  try {
    const companyId = req.company.companyId;
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const payments = await prisma.payment.findMany({
      where: {
        OR: [
          { fromId: companyId },
          { toId: companyId }
        ]
      },
      include: {
        fromCompany: {
          select: { name: true, email: true }
        },
        toCompany: {
          select: { name: true, email: true }
        }
      },
      orderBy: { timestamp: 'desc' },
      skip: offset,
      take: parseInt(limit)
    });

    const total = await prisma.payment.count({
      where: {
        OR: [
          { fromId: companyId },
          { toId: companyId }
        ]
      }
    });

    res.json({
      payments: payments.map(payment => ({
        id: payment.id,
        amount: payment.amount,
        lockDays: payment.lockDays,
        status: payment.status,
        releaseAt: payment.releaseAt,
        releasedAt: payment.releasedAt,
        timestamp: payment.timestamp,
        type: payment.fromId === companyId ? 'sent' : 'received',
        counterparty: payment.fromId === companyId 
          ? payment.toCompany 
          : payment.fromCompany
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Payment history error:', error);
    res.status(500).json({ error: 'Failed to fetch payment history' });
  }
});

// Get locked balances for current user
router.get('/locked-balances', verifyToken, async (req, res) => {
  try {
    const companyId = req.company.companyId;

    const lockedBalances = await paymentService.getLockedBalances(companyId);

    res.json({
      lockedBalances: lockedBalances.map(lock => ({
        id: lock.id,
        amount: lock.amount,
        releaseAt: lock.releaseAt,
        createdAt: lock.createdAt,
        daysRemaining: Math.ceil((new Date(lock.releaseAt) - new Date()) / (1000 * 60 * 60 * 24))
      }))
    });

  } catch (error) {
    console.error('Locked balances error:', error);
    res.status(500).json({ error: 'Failed to fetch locked balances' });
  }
});

// Release locked payment (for testing purposes)
router.post('/release/:paymentId', verifyToken, async (req, res) => {
  try {
    const { paymentId } = req.params;
    const companyId = req.company.companyId;

    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        toCompany: true
      }
    });

    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    if (payment.toId !== companyId) {
      return res.status(403).json({ error: 'Not authorized to release this payment' });
    }

    if (payment.status === 'released') {
      return res.status(400).json({ error: 'Payment already released' });
    }

    // Check if lock period has ended
    const now = new Date();
    if (payment.releaseAt > now) {
      return res.status(400).json({ 
        error: 'Lock period has not ended yet',
        releaseAt: payment.releaseAt
      });
    }

    // Release the payment
    await prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: paymentId },
        data: {
          status: 'released',
          releasedAt: now
        }
      });

      // Remove the locked balance
      await tx.lockedBalance.deleteMany({
        where: { sourceId: paymentId }
      });
    });

    res.json({
      message: 'Payment released successfully',
      paymentId,
      releasedAt: now
    });

  } catch (error) {
    console.error('Payment release error:', error);
    res.status(500).json({ error: 'Failed to release payment' });
  }
});

module.exports = router; 