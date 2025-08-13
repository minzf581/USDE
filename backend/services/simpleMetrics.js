// services/simpleMetrics.js - 新增文件
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class SimpleMetrics {
  constructor() {
    this.metrics = {
      requests: 0,
      errors: 0,
      deposits: 0,
      withdrawals: 0,
      startTime: Date.now()
    };
  }
  
  incrementRequests() {
    this.metrics.requests++;
  }
  
  incrementErrors() {
    this.metrics.errors++;
  }
  
  incrementDeposits() {
    this.metrics.deposits++;
  }
  
  incrementWithdrawals() {
    this.metrics.withdrawals++;
  }
  
  getMetrics() {
    const uptime = Date.now() - this.metrics.startTime;
    return {
      ...this.metrics,
      uptime: Math.floor(uptime / 1000), // 秒
      errorRate: this.metrics.requests > 0 ? (this.metrics.errors / this.metrics.requests * 100).toFixed(2) : 0
    };
  }
  
  async getDatabaseMetrics() {
    try {
      const [totalCompanies, totalSupply, totalDeposits] = await Promise.all([
        prisma.company.count(),
        prisma.company.aggregate({ _sum: { usdeBalance: true } }),
        prisma.deposit.count({ where: { status: 'completed' } })
      ]);
      
      return {
        totalCompanies,
        totalSupply: totalSupply._sum.usdeBalance || 0,
        totalDeposits
      };
    } catch (error) {
      console.error('Failed to get database metrics:', error);
      return {};
    }
  }
}

module.exports = new SimpleMetrics();



