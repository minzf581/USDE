// services/optimizedQueries.js - 新增文件
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// 优化的批量查询
async function getCompanyDashboardData(companyId) {
  // 使用单个查询获取所有需要的数据
  const [company, recentTransactions, depositStats, monthlyDeposits] = await Promise.all([
    prisma.company.findUnique({
      where: { id: companyId },
      select: {
        usdeBalance: true,
        kycStatus: true,
        dailyLimit: true,
        monthlyLimit: true
      }
    }),
    
    prisma.uSDETransaction.findMany({
      where: { companyId },
      orderBy: { timestamp: 'desc' },
      take: 5,
      select: {
        id: true,
        type: true,
        amount: true,
        timestamp: true,
        status: true
      }
    }),
    
    prisma.deposit.aggregate({
      where: {
        companyId,
        status: 'completed'
      },
      _sum: { amount: true },
      _count: { id: true }
    }),
    
    prisma.deposit.aggregate({
      where: {
        companyId,
        status: 'completed',
        createdAt: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        }
      },
      _sum: { amount: true }
    })
  ]);
  
  return {
    company,
    recentTransactions,
    depositStats,
    monthlyDeposits
  };
}

module.exports = {
  getCompanyDashboardData
};
