const express = require('express');
const { body, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { verifyToken } = require('./auth');

const router = express.Router();
const prisma = new PrismaClient();

// Get all stakes for a company
router.get('/', verifyToken, async (req, res) => {
  try {
    const companyId = req.company.companyId;
    const { page = 1, limit = 10, status } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = { companyId };
    if (status === 'active') {
      whereClause.unlocked = false;
    } else if (status === 'unlocked') {
      whereClause.unlocked = true;
    }

    const stakes = await prisma.stake.findMany({
      where: whereClause,
      orderBy: { startDate: 'desc' },
      skip: offset,
      take: parseInt(limit)
    });

    const total = await prisma.stake.count({ where: whereClause });

    // Calculate current earnings for each stake
    const stakesWithEarnings = stakes.map(stake => {
      const now = new Date();
      const daysHeld = Math.floor((now - stake.startDate) / (1000 * 60 * 60 * 24));
      const dailyRate = stake.interestRate / 365;
      const currentEarnings = stake.unlocked ? 0 : (stake.amount * dailyRate * daysHeld);

      return {
        ...stake,
        currentEarnings: Math.max(0, currentEarnings),
        daysHeld,
        isExpired: now > stake.endDate
      };
    });

    res.json({
      stakes: stakesWithEarnings,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Stakes fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch stakes' });
  }
});

// Get stake details
router.get('/:stakeId', verifyToken, async (req, res) => {
  try {
    const { stakeId } = req.params;
    const companyId = req.company.companyId;

    const stake = await prisma.stake.findFirst({
      where: {
        id: stakeId,
        companyId
      },
      include: {
        earnings: {
          orderBy: { date: 'desc' }
        }
      }
    });

    if (!stake) {
      return res.status(404).json({ error: 'Stake not found' });
    }

    // Calculate current earnings
    const now = new Date();
    const daysHeld = Math.floor((now - stake.startDate) / (1000 * 60 * 60 * 24));
    const dailyRate = stake.interestRate / 365;
    const currentEarnings = stake.unlocked ? 0 : (stake.amount * dailyRate * daysHeld);

    const totalEarnings = stake.earnings.reduce((sum, earning) => sum + earning.amount, 0);

    res.json({
      stake: {
        ...stake,
        currentEarnings: Math.max(0, currentEarnings),
        totalEarnings,
        daysHeld,
        isExpired: now > stake.endDate,
        remainingDays: Math.max(0, Math.ceil((stake.endDate - now) / (1000 * 60 * 60 * 24)))
      }
    });

  } catch (error) {
    console.error('Stake details error:', error);
    res.status(500).json({ error: 'Failed to fetch stake details' });
  }
});

// Create manual stake (for testing)
router.post('/', verifyToken, [
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
  body('days').isInt({ min: 1, max: 365 }).withMessage('Days must be between 1 and 365'),
  body('interestRate').optional().isFloat({ min: 0, max: 1 }).withMessage('Interest rate must be between 0 and 1')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { amount, days, interestRate = 0.04 } = req.body;
    const companyId = req.company.companyId;

    // Check if company has sufficient balance
    const company = await prisma.company.findUnique({
      where: { id: companyId }
    });

    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    if (company.ucBalance < amount) {
      return res.status(400).json({ error: 'Insufficient USDE balance' });
    }

    // Calculate end date
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + days);

    // Create stake in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Deduct from balance
      const updatedCompany = await tx.company.update({
        where: { id: companyId },
        data: { ucBalance: { decrement: amount } }
      });

      // Create stake
      const stake = await tx.stake.create({
        data: {
          companyId,
          amount,
          startDate: new Date(),
          endDate,
          unlocked: false,
          interestRate
        }
      });

      return { stake, updatedCompany };
    });

    res.json({
      message: 'Stake created successfully',
      stake: {
        id: result.stake.id,
        amount: result.stake.amount,
        startDate: result.stake.startDate,
        endDate: result.stake.endDate,
        interestRate: result.stake.interestRate
      },
      newBalance: result.updatedCompany.ucBalance
    });

  } catch (error) {
    console.error('Stake creation error:', error);
    res.status(500).json({ error: 'Failed to create stake' });
  }
});

// Get stake statistics
router.get('/stats/summary', verifyToken, async (req, res) => {
  try {
    const companyId = req.company.companyId;

    const [totalStaked, activeStakes, totalEarnings] = await Promise.all([
      prisma.stake.aggregate({
        where: { companyId },
        _sum: { amount: true }
      }),
      prisma.stake.count({
        where: { 
          companyId,
          unlocked: false
        }
      }),
      prisma.earning.aggregate({
        where: { companyId },
        _sum: { amount: true }
      })
    ]);

    const activeStakesData = await prisma.stake.findMany({
      where: {
        companyId,
        unlocked: false
      },
      select: {
        amount: true,
        startDate: true,
        endDate: true,
        interestRate: true
      }
    });

    // Calculate current daily earnings
    const now = new Date();
    let currentDailyEarnings = 0;
    
    activeStakesData.forEach(stake => {
      const daysHeld = Math.floor((now - stake.startDate) / (1000 * 60 * 60 * 24));
      const dailyRate = stake.interestRate / 365;
      currentDailyEarnings += stake.amount * dailyRate;
    });

    res.json({
      summary: {
        totalStaked: totalStaked._sum.amount || 0,
        activeStakes,
        totalEarnings: totalEarnings._sum.amount || 0,
        currentDailyEarnings: Math.round(currentDailyEarnings * 100) / 100
      }
    });

  } catch (error) {
    console.error('Stake stats error:', error);
    res.status(500).json({ error: 'Failed to fetch stake statistics' });
  }
});

module.exports = router; 