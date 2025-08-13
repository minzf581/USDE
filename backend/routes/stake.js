const express = require('express');
const { body, validationResult } = require('express-validator');
const prisma = require('../lib/prisma');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();


// Get all stakes for a company
router.get('/', verifyToken, async (req, res) => {
  try {
    const companyId = req.company.companyId;
    const { page = 1, limit = 10, status } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = { company_id: companyId };
    if (status === 'active') {
      whereClause.status = 'active';
    } else if (status === 'completed') {
      whereClause.status = 'completed';
    }

    const stakes = await prisma.stake.findMany({
      where: whereClause,
      orderBy: { start_date: 'desc' },
      skip: offset,
      take: parseInt(limit)
    });

    const total = await prisma.stake.count({ where: whereClause });

    // Calculate current earnings for each stake
    const stakesWithEarnings = stakes.map(stake => {
      const now = new Date();
      const daysHeld = Math.floor((now - stake.start_date) / (1000 * 60 * 60 * 24));
      const dailyRate = stake.apy / 365;
      const currentEarnings = stake.status === 'active' ? (stake.amount * dailyRate * daysHeld) : 0;

      return {
        ...stake,
        currentEarnings: Math.max(0, currentEarnings),
        daysHeld,
        isExpired: stake.end_date ? now > stake.end_date : false
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
        company_id: companyId
      }
    });

    if (!stake) {
      return res.status(404).json({ error: 'Stake not found' });
    }

    // Calculate current earnings
    const now = new Date();
    const daysHeld = Math.floor((now - stake.start_date) / (1000 * 60 * 60 * 24));
    const dailyRate = stake.apy / 365;
    const currentEarnings = stake.status === 'active' ? (stake.amount * dailyRate * daysHeld) : 0;

    res.json({
      stake: {
        ...stake,
        currentEarnings: Math.max(0, currentEarnings),
        totalEarnings: 0, // No earnings table in current schema
        daysHeld,
        isExpired: stake.end_date ? now > stake.end_date : false,
        remainingDays: stake.end_date ? Math.max(0, Math.ceil((stake.end_date - now) / (1000 * 60 * 60 * 24))) : 0
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
  body('lockPeriod').isInt({ min: 30, max: 365 }).withMessage('Lock period must be between 30 and 365 days'),
  body('interestRate').optional().isFloat({ min: 0, max: 1 }).withMessage('Interest rate must be between 0 and 1')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { amount, lockPeriod, interestRate = 0.04 } = req.body;
    const companyId = req.company.companyId;

    // Check if company has sufficient balance
    const company = await prisma.company.findUnique({
      where: { id: companyId }
    });

    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    if (company.usdeBalance < amount) {
      return res.status(400).json({ error: 'Insufficient USDE balance' });
    }

    // Calculate end date
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + lockPeriod);

    // Create stake in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Deduct from balance
      const updatedCompany = await tx.company.update({
        where: { id: companyId },
        data: { usdeBalance: { decrement: amount } }
      });

      // Create stake
      const stake = await tx.stake.create({
        data: {
          company_id: companyId,
          amount,
          start_date: new Date(),
          end_date: endDate,
          status: 'active',
          apy: interestRate || 0.05
        }
      });

      return { stake, updatedCompany };
    });

    res.json({
      message: 'Stake created successfully',
      stake: {
        id: result.stake.id,
        amount: result.stake.amount,
        start_date: result.stake.start_date,
        end_date: result.stake.end_date,
        apy: result.stake.apy
      },
      newBalance: result.updatedCompany.usdeBalance
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

    const [totalStaked, activeStakes] = await Promise.all([
      prisma.stake.aggregate({
        where: { company_id: companyId },
        _sum: { amount: true }
      }),
      prisma.stake.count({
        where: { 
          company_id: companyId,
          status: 'active'
        }
      })
    ]);

    const activeStakesData = await prisma.stake.findMany({
      where: {
        company_id: companyId,
        status: 'active'
      },
      select: {
        amount: true,
        start_date: true,
        end_date: true,
        apy: true
      }
    });

    // Calculate current daily earnings
    const now = new Date();
    let currentDailyEarnings = 0;
    
    activeStakesData.forEach(stake => {
      const daysHeld = Math.floor((now - stake.start_date) / (1000 * 60 * 60 * 24));
      const dailyRate = stake.apy / 365;
      currentDailyEarnings += stake.amount * dailyRate;
    });

    res.json({
      totalStaked: totalStaked._sum.amount || 0,
      activeStakes,
      totalEarnings: 0, // No earnings table in current schema
      currentDailyEarnings: Math.round(currentDailyEarnings * 100) / 100
    });

  } catch (error) {
    console.error('Stake stats error:', error);
    res.status(500).json({ error: 'Failed to fetch stake statistics' });
  }
});

module.exports = router; 