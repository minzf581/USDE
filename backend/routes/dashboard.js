const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { verifyToken } = require('./auth');

const router = express.Router();
const prisma = new PrismaClient();

// Get comprehensive dashboard data
router.get('/', verifyToken, async (req, res) => {
  try {
    const companyId = req.company.companyId;

    // Get company info
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: {
        id: true,
        name: true,
        email: true,
        kycStatus: true,
        ucBalance: true,
        totalEarnings: true,
        createdAt: true
      }
    });

    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    // Get recent activities
    const [recentPayments, recentStakes, recentEarnings] = await Promise.all([
      prisma.payment.findMany({
        where: {
          OR: [
            { fromId: companyId },
            { toId: companyId }
          ]
        },
        include: {
          fromCompany: { select: { name: true } },
          toCompany: { select: { name: true } }
        },
        orderBy: { timestamp: 'desc' },
        take: 5
      }),
      prisma.stake.findMany({
        where: { companyId },
        orderBy: { startDate: 'desc' },
        take: 5
      }),
      prisma.earning.findMany({
        where: { companyId },
        orderBy: { date: 'desc' },
        take: 5
      })
    ]);

    // Get statistics
    const [paymentStats, stakeStats, earningStats] = await Promise.all([
      prisma.payment.aggregate({
        where: {
          OR: [
            { fromId: companyId },
            { toId: companyId }
          ]
        },
        _sum: { amount: true },
        _count: true
      }),
      prisma.stake.aggregate({
        where: { companyId },
        _sum: { amount: true },
        _count: true
      }),
      prisma.earning.aggregate({
        where: { companyId },
        _sum: { amount: true },
        _count: true
      })
    ]);

    // Calculate active stakes and locked amount
    const activeStakes = await prisma.stake.findMany({
      where: {
        companyId,
        unlocked: false
      }
    });

    const totalLocked = activeStakes.reduce((sum, stake) => sum + stake.amount, 0);
    const availableBalance = company.ucBalance - totalLocked;

    // Calculate current daily earnings from active stakes
    const now = new Date();
    let currentDailyEarnings = 0;
    
    activeStakes.forEach(stake => {
      const daysHeld = Math.floor((now - stake.startDate) / (1000 * 60 * 60 * 24));
      const dailyRate = stake.interestRate / 365;
      currentDailyEarnings += stake.amount * dailyRate;
    });

    res.json({
      company,
      overview: {
        totalBalance: company.ucBalance,
        availableBalance: Math.max(0, availableBalance),
        lockedAmount: totalLocked,
        totalEarnings: company.totalEarnings,
        currentDailyEarnings: Math.round(currentDailyEarnings * 100) / 100,
        activeStakesCount: activeStakes.length
      },
      statistics: {
        payments: {
          total: paymentStats._sum.amount || 0,
          count: paymentStats._count || 0
        },
        stakes: {
          total: stakeStats._sum.amount || 0,
          count: stakeStats._count || 0
        },
        earnings: {
          total: earningStats._sum.amount || 0,
          count: earningStats._count || 0
        }
      },
      recentActivities: {
        payments: recentPayments.map(payment => ({
          id: payment.id,
          amount: payment.amount,
          type: payment.fromId === companyId ? 'sent' : 'received',
          counterparty: payment.fromId === companyId 
            ? payment.toCompany.name 
            : payment.fromCompany.name,
          timestamp: payment.timestamp,
          released: payment.released
        })),
        stakes: recentStakes.map(stake => ({
          id: stake.id,
          amount: stake.amount,
          startDate: stake.startDate,
          endDate: stake.endDate,
          unlocked: stake.unlocked,
          interestRate: stake.interestRate
        })),
        earnings: recentEarnings.map(earning => ({
          id: earning.id,
          amount: earning.amount,
          date: earning.date,
          strategy: earning.strategy
        }))
      }
    });

  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// Get earnings history
router.get('/earnings', verifyToken, async (req, res) => {
  try {
    const companyId = req.company.companyId;
    const { page = 1, limit = 20, period = '30d' } = req.query;
    const offset = (page - 1) * limit;

    // Calculate date range based on period
    const now = new Date();
    let startDate = new Date();
    
    switch (period) {
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(now.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate.setDate(now.getDate() - 30);
    }

    const earnings = await prisma.earning.findMany({
      where: {
        companyId,
        date: {
          gte: startDate
        }
      },
      orderBy: { date: 'desc' },
      skip: offset,
      take: parseInt(limit)
    });

    const total = await prisma.earning.count({
      where: {
        companyId,
        date: {
          gte: startDate
        }
      }
    });

    // Calculate total earnings for the period
    const totalEarnings = earnings.reduce((sum, earning) => sum + earning.amount, 0);

    res.json({
      earnings,
      summary: {
        totalEarnings,
        count: earnings.length,
        period
      },
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Earnings history error:', error);
    res.status(500).json({ error: 'Failed to fetch earnings history' });
  }
});

// Get performance metrics
router.get('/performance', verifyToken, async (req, res) => {
  try {
    const companyId = req.company.companyId;

    // Get company data
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: {
        ucBalance: true,
        totalEarnings: true,
        createdAt: true
      }
    });

    // Get all stakes
    const stakes = await prisma.stake.findMany({
      where: { companyId },
      select: {
        amount: true,
        startDate: true,
        endDate: true,
        unlocked: true,
        interestRate: true
      }
    });

    // Calculate performance metrics
    const now = new Date();
    const daysSinceRegistration = Math.floor((now - company.createdAt) / (1000 * 60 * 60 * 24));
    
    let totalStaked = 0;
    let activeStaked = 0;
    let totalEarningsFromStakes = 0;
    let averageInterestRate = 0;

    stakes.forEach(stake => {
      totalStaked += stake.amount;
      if (!stake.unlocked) {
        activeStaked += stake.amount;
      }
      
      const daysHeld = Math.floor((now - stake.startDate) / (1000 * 60 * 60 * 24));
      const dailyRate = stake.interestRate / 365;
      const earnings = stake.unlocked ? 0 : (stake.amount * dailyRate * daysHeld);
      totalEarningsFromStakes += earnings;
    });

    if (stakes.length > 0) {
      averageInterestRate = stakes.reduce((sum, stake) => sum + stake.interestRate, 0) / stakes.length;
    }

    const annualizedReturn = daysSinceRegistration > 0 
      ? (company.totalEarnings / daysSinceRegistration) * 365 
      : 0;

    res.json({
      metrics: {
        totalBalance: company.ucBalance,
        totalEarnings: company.totalEarnings,
        totalStaked,
        activeStaked,
        averageInterestRate: Math.round(averageInterestRate * 10000) / 100, // Convert to percentage
        annualizedReturn: Math.round(annualizedReturn * 100) / 100,
        daysSinceRegistration
      },
      breakdown: {
        totalStakes: stakes.length,
        activeStakes: stakes.filter(s => !s.unlocked).length,
        completedStakes: stakes.filter(s => s.unlocked).length
      }
    });

  } catch (error) {
    console.error('Performance metrics error:', error);
    res.status(500).json({ error: 'Failed to fetch performance metrics' });
  }
});

module.exports = router; 