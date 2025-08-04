const { PrismaClient } = require('@prisma/client');
const cron = require('node-cron');

const prisma = new PrismaClient();

// Calculate daily earnings for all active stakes
const calculateDailyEarnings = async () => {
  try {
    console.log('💰 Starting daily earnings calculation...');
    
    // Get all active stakes
    const activeStakes = await prisma.stake.findMany({
      where: {
        unlocked: false
      },
      include: {
        company: true
      }
    });

    const now = new Date();
    let totalEarningsCalculated = 0;

    for (const stake of activeStakes) {
      // Calculate days since stake started
      const daysHeld = Math.floor((now - stake.startDate) / (1000 * 60 * 60 * 24));
      
      if (daysHeld > 0) {
        // Calculate daily earnings
        const dailyRate = stake.interestRate / 365;
        const dailyEarnings = stake.amount * dailyRate;
        
        // Create earning record
        await prisma.earning.create({
          data: {
            companyId: stake.companyId,
            amount: dailyEarnings,
            date: now,
            strategy: 'us_treasury',
            stakeId: stake.id
          }
        });

        // Update company's total earnings
        await prisma.company.update({
          where: { id: stake.companyId },
          data: {
            totalEarnings: {
              increment: dailyEarnings
            }
          }
        });

        totalEarningsCalculated += dailyEarnings;
      }
    }

    console.log(`✅ Daily earnings calculation completed. Total earnings: $${totalEarningsCalculated.toFixed(2)}`);
    return totalEarningsCalculated;

  } catch (error) {
    console.error('❌ Daily earnings calculation error:', error);
    throw error;
  }
};

// Calculate earnings for a specific stake
const calculateStakeEarnings = async (stakeId) => {
  try {
    const stake = await prisma.stake.findUnique({
      where: { id: stakeId },
      include: {
        company: true
      }
    });

    if (!stake) {
      throw new Error('Stake not found');
    }

    const now = new Date();
    const daysHeld = Math.floor((now - stake.startDate) / (1000 * 60 * 60 * 24));
    
    if (daysHeld <= 0) {
      return 0;
    }

    const dailyRate = stake.interestRate / 365;
    const totalEarnings = stake.amount * dailyRate * daysHeld;

    return Math.max(0, totalEarnings);

  } catch (error) {
    console.error('Stake earnings calculation error:', error);
    throw error;
  }
};

// Get earnings summary for a company
const getCompanyEarningsSummary = async (companyId) => {
  try {
    const [totalEarnings, recentEarnings, activeStakes] = await Promise.all([
      prisma.earning.aggregate({
        where: { companyId },
        _sum: { amount: true }
      }),
      prisma.earning.findMany({
        where: { companyId },
        orderBy: { date: 'desc' },
        take: 10
      }),
      prisma.stake.findMany({
        where: {
          companyId,
          unlocked: false
        }
      })
    ]);

    // Calculate current daily earnings from active stakes
    const now = new Date();
    let currentDailyEarnings = 0;
    
    activeStakes.forEach(stake => {
      const dailyRate = stake.interestRate / 365;
      currentDailyEarnings += stake.amount * dailyRate;
    });

    return {
      totalEarnings: totalEarnings._sum.amount || 0,
      currentDailyEarnings: Math.round(currentDailyEarnings * 100) / 100,
      recentEarnings: recentEarnings.map(earning => ({
        id: earning.id,
        amount: earning.amount,
        date: earning.date,
        strategy: earning.strategy
      })),
      activeStakesCount: activeStakes.length
    };

  } catch (error) {
    console.error('Company earnings summary error:', error);
    throw error;
  }
};

// Schedule daily earnings calculation (runs at midnight)
const scheduleDailyEarnings = () => {
  if (process.env.NODE_ENV === 'production') {
    cron.schedule('0 0 * * *', async () => {
      console.log('🕛 Running scheduled daily earnings calculation...');
      await calculateDailyEarnings();
    });
    console.log('📅 Daily earnings calculation scheduled for midnight');
  } else {
    console.log('🔄 Development mode: Daily earnings calculation not scheduled');
  }
};

// Manual trigger for earnings calculation (for testing)
const triggerEarningsCalculation = async () => {
  try {
    console.log('🔧 Manually triggering earnings calculation...');
    const totalEarnings = await calculateDailyEarnings();
    return { success: true, totalEarnings };
  } catch (error) {
    console.error('Manual earnings calculation failed:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  calculateDailyEarnings,
  calculateStakeEarnings,
  getCompanyEarningsSummary,
  scheduleDailyEarnings,
  triggerEarningsCalculation
}; 