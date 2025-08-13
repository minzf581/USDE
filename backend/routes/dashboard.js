const express = require('express');
const prisma = require('../lib/prisma');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();


// Get comprehensive dashboard data
router.get('/', verifyToken, async (req, res) => {
  try {
    const companyId = req.company.companyId;
    console.log('Dashboard request for company:', companyId);

    // Get company info
    const company = await prisma.company.findUnique({
      where: { id: companyId }
    });

    if (!company) {
      console.log('Company not found');
      return res.status(404).json({ error: 'Company not found' });
    }

    console.log('Company found:', company);

    // Return basic dashboard data
    const dashboardData = {
      success: true,
      company: {
        id: company.id,
        name: company.name,
        email: company.email,
        type: company.type,
        status: company.status,
        kycStatus: company.kycStatus,
        balance: company.balance || 0,
        usdeBalance: company.usdeBalance || 0
      },
      overview: {
        totalBalance: (company.balance || 0) + (company.usdeBalance || 0),
        availableBalance: company.balance || 0,
        lockedAmount: 0,
        totalEarnings: 0,
        currentDailyEarnings: 0,
        activeStakesCount: 0
      },
      statistics: {
        payments: { total: 0, count: 0 },
        stakes: { total: 0, count: 0 },
        earnings: { total: 0, count: 0 }
      },
      recentActivities: {
        payments: [],
        stakes: [],
        earnings: []
      }
    };

    console.log('Sending dashboard data:', JSON.stringify(dashboardData, null, 2));
    res.json(dashboardData);

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
        totalEarnings: 0, // We'll calculate this later
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
        balance: true,
        usdeBalance: true,
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
      ? (totalEarningsFromStakes / daysSinceRegistration) * 365 
      : 0;

    res.json({
      metrics: {
        totalBalance: company.balance,
        totalEarnings: 0, // We'll calculate this later
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