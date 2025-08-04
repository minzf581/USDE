const prisma = require('../lib/prisma');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);



class WithdrawalService {
  // 检查用户是否有足够的可用余额
  async checkAvailableBalance(companyId, amount) {
    const company = await prisma.company.findUnique({
      where: { id: companyId }
    });

    if (!company) {
      throw new Error('Company not found');
    }

    // 计算锁仓余额
    const lockedAmount = await prisma.lockedBalance.aggregate({
      where: { userId: companyId },
      _sum: { amount: true }
    });

    const availableBalance = company.usdeBalance - (lockedAmount._sum.amount || 0);
    
    return {
      totalBalance: company.usdeBalance,
      lockedAmount: lockedAmount._sum.amount || 0,
      availableBalance,
      hasEnoughBalance: availableBalance >= amount
    };
  }

  // 检查提现限制
  async checkWithdrawalLimits(companyId, amount) {
    const company = await prisma.company.findUnique({
      where: { id: companyId }
    });

    // KYC验证检查
    if (company.kycStatus !== 'approved') {
      throw new Error('KYC approval required for withdrawals');
    }

    // 检查是否有验证过的银行账户
    const verifiedBankAccount = await prisma.bankAccount.findFirst({
      where: {
        companyId,
        isVerified: true
      }
    });

    if (!verifiedBankAccount) {
      throw new Error('Verified bank account required for withdrawals');
    }

    // 检查每日限额（示例：每日最多10,000 USD）
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayWithdrawals = await prisma.withdrawal.aggregate({
      where: {
        companyId,
        status: { in: ['pending', 'processing', 'success'] },
        timestamp: {
          gte: today,
          lt: tomorrow
        }
      },
      _sum: { amount: true }
    });

    const dailyTotal = (todayWithdrawals._sum.amount || 0) + amount;
    const dailyLimit = 10000; // 每日限额

    if (dailyTotal > dailyLimit) {
      throw new Error(`Daily withdrawal limit exceeded. Daily limit: $${dailyLimit}`);
    }

    // 检查单笔限额（示例：单笔最多5,000 USD）
    const singleLimit = 5000;
    if (amount > singleLimit) {
      throw new Error(`Single withdrawal limit exceeded. Single limit: $${singleLimit}`);
    }

    return {
      dailyTotal: todayWithdrawals._sum.amount || 0,
      dailyLimit,
      singleLimit,
      bankAccount: verifiedBankAccount
    };
  }

  // 创建提现请求
  async createWithdrawal(companyId, amount, bankAccountId) {
    // 检查余额和限制
    const balanceCheck = await this.checkAvailableBalance(companyId, amount);
    if (!balanceCheck.hasEnoughBalance) {
      throw new Error('Insufficient available balance');
    }

    const limitsCheck = await this.checkWithdrawalLimits(companyId, amount);
    const bankAccount = limitsCheck.bankAccount;

    // 创建提现记录
    const withdrawal = await prisma.withdrawal.create({
      data: {
        companyId,
        amount,
        bankAccountId: bankAccount.id,
        status: 'pending'
      },
      include: {
        bankAccount: true,
        company: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });

    // 模拟代币销毁（在实际链上系统中，这里会调用智能合约）
    const burnTxHash = this.simulateTokenBurn(companyId, amount);

    // 更新提现记录
    await prisma.withdrawal.update({
      where: { id: withdrawal.id },
      data: {
        burnTxHash,
        status: 'processing'
      }
    });

    // 扣除用户余额
    await prisma.company.update({
      where: { id: companyId },
      data: {
        usdeBalance: {
          decrement: amount
        }
      }
    });

    // 记录USDE交易历史
    await prisma.uSDETransaction.create({
      data: {
        companyId,
        type: 'withdraw',
        amount,
        balanceBefore: balanceCheck.totalBalance,
        balanceAfter: balanceCheck.totalBalance - amount,
        description: 'Withdrawal request',
        metadata: JSON.stringify({
          withdrawalId: withdrawal.id,
          burnTxHash
        })
      }
    });

    return {
      ...withdrawal,
      burnTxHash,
      status: 'processing'
    };
  }

  // 模拟代币销毁（在实际系统中会调用智能合约）
  simulateTokenBurn(companyId, amount) {
    const timestamp = Date.now();
    const hash = `0x${companyId.substring(0, 8)}${timestamp.toString(16)}${Math.random().toString(16).substring(2, 10)}`;
    return hash;
  }

  // 处理银行转账
  async processBankTransfer(withdrawalId) {
    const withdrawal = await prisma.withdrawal.findUnique({
      where: { id: withdrawalId },
      include: {
        bankAccount: true,
        company: true
      }
    });

    if (!withdrawal) {
      throw new Error('Withdrawal not found');
    }

    if (withdrawal.status !== 'processing') {
      throw new Error('Withdrawal is not in processing status');
    }

    try {
      // 模拟银行转账（在实际系统中会调用银行API或Stripe）
      const payoutResult = await this.simulateBankPayout(withdrawal);
      
      // 更新提现状态为成功
      await prisma.withdrawal.update({
        where: { id: withdrawalId },
        data: {
          status: 'success',
          processedAt: new Date(),
          stripePayoutId: payoutResult.payoutId
        }
      });

      return {
        status: 'success',
        payoutId: payoutResult.payoutId,
        processedAt: new Date()
      };

    } catch (error) {
      // 更新提现状态为失败
      await prisma.withdrawal.update({
        where: { id: withdrawalId },
        data: {
          status: 'failed',
          notes: error.message
        }
      });

      // 退还用户余额
      await prisma.company.update({
        where: { id: withdrawal.companyId },
        data: {
          usdeBalance: {
            increment: withdrawal.amount
          }
        }
      });

      throw error;
    }
  }

  // 模拟银行转账（在实际系统中会调用Stripe Payouts或银行API）
  async simulateBankPayout(withdrawal) {
    // 模拟处理延迟
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 模拟90%成功率
    if (Math.random() < 0.9) {
      return {
        payoutId: `po_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`,
        status: 'succeeded'
      };
    } else {
      throw new Error('Bank transfer failed - insufficient funds or invalid account');
    }
  }

  // 获取用户提现历史
  async getWithdrawalHistory(companyId, page = 1, limit = 10) {
    const offset = (page - 1) * limit;

    const [withdrawals, total] = await Promise.all([
      prisma.withdrawal.findMany({
        where: { companyId },
        include: {
          bankAccount: {
            select: {
              bankName: true,
              accountNum: true
            }
          }
        },
        orderBy: { timestamp: 'desc' },
        skip: offset,
        take: limit
      }),
      prisma.withdrawal.count({
        where: { companyId }
      })
    ]);

    return {
      withdrawals,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  // 获取提现统计
  async getWithdrawalStats(companyId) {
    const [
      totalWithdrawals,
      pendingWithdrawals,
      successfulWithdrawals,
      totalAmount
    ] = await Promise.all([
      prisma.withdrawal.count({ where: { companyId } }),
      prisma.withdrawal.count({ 
        where: { 
          companyId,
          status: { in: ['pending', 'processing'] }
        }
      }),
      prisma.withdrawal.count({ 
        where: { 
          companyId,
          status: 'success'
        }
      }),
      prisma.withdrawal.aggregate({
        where: { 
          companyId,
          status: 'success'
        },
        _sum: { amount: true }
      })
    ]);

    return {
      totalWithdrawals,
      pendingWithdrawals,
      successfulWithdrawals,
      totalAmount: totalAmount._sum.amount || 0
    };
  }
}

module.exports = new WithdrawalService(); 