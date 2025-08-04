const express = require('express');
const { body, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { verifyToken } = require('./auth');

const router = express.Router();
const prisma = new PrismaClient();

// Make payment to supplier
router.post('/send', verifyToken, [
  body('toEmail').isEmail().normalizeEmail().withMessage('Valid recipient email is required'),
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
  body('stakeDays').isInt({ min: 1, max: 365 }).withMessage('Stake days must be between 1 and 365')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { toEmail, amount, stakeDays } = req.body;
    const fromCompanyId = req.company.companyId;

    // Check if sender has sufficient balance
    const sender = await prisma.company.findUnique({
      where: { id: fromCompanyId }
    });

    if (!sender) {
      return res.status(404).json({ error: 'Sender company not found' });
    }

    if (sender.ucBalance < amount) {
      return res.status(400).json({ error: 'Insufficient USDE balance' });
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

    // Calculate stake end date
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + stakeDays);

    // Create payment and stake records in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Deduct from sender
      const updatedSender = await tx.company.update({
        where: { id: fromCompanyId },
        data: { ucBalance: { decrement: amount } }
      });

      // Add to recipient
      const updatedRecipient = await tx.company.update({
        where: { id: recipient.id },
        data: { ucBalance: { increment: amount } }
      });

      // Create payment record
      const payment = await tx.payment.create({
        data: {
          fromId: fromCompanyId,
          toId: recipient.id,
          amount,
          stakeDays,
          released: false
        }
      });

      // Create stake record for recipient
      const stake = await tx.stake.create({
        data: {
          companyId: recipient.id,
          amount,
          startDate: new Date(),
          endDate,
          unlocked: false,
          interestRate: 0.04 // 4% annual rate
        }
      });

      return { payment, stake, updatedSender, updatedRecipient };
    });

    res.json({
      message: 'Payment sent successfully',
      payment: {
        id: result.payment.id,
        amount: result.payment.amount,
        stakeDays: result.payment.stakeDays,
        recipient: recipient.name,
        recipientEmail: recipient.email,
        timestamp: result.payment.timestamp
      },
      stake: {
        id: result.stake.id,
        endDate: result.stake.endDate,
        interestRate: result.stake.interestRate
      },
      newBalance: result.updatedSender.ucBalance
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
        stakeDays: payment.stakeDays,
        released: payment.released,
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

    if (payment.released) {
      return res.status(400).json({ error: 'Payment already released' });
    }

    // Check if stake period has ended
    const stake = await prisma.stake.findFirst({
      where: {
        companyId: payment.toId,
        amount: payment.amount,
        unlocked: false
      }
    });

    if (!stake) {
      return res.status(404).json({ error: 'Associated stake not found' });
    }

    const now = new Date();
    if (stake.endDate > now) {
      return res.status(400).json({ 
        error: 'Stake period has not ended yet',
        endDate: stake.endDate
      });
    }

    // Release the payment
    await prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: paymentId },
        data: {
          released: true,
          releasedAt: now
        }
      });

      await tx.stake.update({
        where: { id: stake.id },
        data: {
          unlocked: true,
          unlockedAt: now
        }
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