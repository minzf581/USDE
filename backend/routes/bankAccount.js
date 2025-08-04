const express = require('express');
const { body, validationResult } = require('express-validator');
const prisma = require('../lib/prisma');
const { verifyToken, requireKYCApproved } = require('../middleware/auth');

const router = express.Router();


// Get user's bank accounts
router.get('/', verifyToken, async (req, res) => {
  try {
    const companyId = req.company.companyId;

    const bankAccounts = await prisma.bankAccount.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ bankAccounts });
  } catch (error) {
    console.error('Get bank accounts error:', error);
    res.status(500).json({ error: 'Failed to fetch bank accounts' });
  }
});

// Add new bank account
router.post('/', verifyToken, requireKYCApproved, [
  body('bankName').notEmpty().withMessage('Bank name is required'),
  body('accountNum').notEmpty().withMessage('Account number is required'),
  body('currency').optional().isIn(['USD']).withMessage('Currency must be USD')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { bankName, accountNum, currency = 'USD' } = req.body;
    const companyId = req.company.companyId;

    // 检查是否已存在相同的银行账户
    const existingAccount = await prisma.bankAccount.findFirst({
      where: {
        companyId,
        bankName,
        accountNum
      }
    });

    if (existingAccount) {
      return res.status(400).json({ error: 'Bank account already exists' });
    }

    // 创建银行账户
    const bankAccount = await prisma.bankAccount.create({
      data: {
        companyId,
        bankName,
        accountNum,
        currency,
        isVerified: false // 需要验证
      }
    });

    res.status(201).json({
      message: 'Bank account added successfully',
      bankAccount
    });

  } catch (error) {
    console.error('Add bank account error:', error);
    res.status(500).json({ error: 'Failed to add bank account' });
  }
});

// Verify bank account (simulated)
router.post('/:accountId/verify', verifyToken, requireKYCApproved, async (req, res) => {
  try {
    const { accountId } = req.params;
    const companyId = req.company.companyId;

    const bankAccount = await prisma.bankAccount.findFirst({
      where: {
        id: accountId,
        companyId
      }
    });

    if (!bankAccount) {
      return res.status(404).json({ error: 'Bank account not found' });
    }

    if (bankAccount.isVerified) {
      return res.status(400).json({ error: 'Bank account already verified' });
    }

    // 模拟银行账户验证（在实际系统中会调用银行API）
    const isVerified = await simulateBankAccountVerification(bankAccount);

    if (isVerified) {
      await prisma.bankAccount.update({
        where: { id: accountId },
        data: { isVerified: true }
      });

      res.json({
        message: 'Bank account verified successfully',
        bankAccount: {
          ...bankAccount,
          isVerified: true
        }
      });
    } else {
      res.status(400).json({ error: 'Bank account verification failed' });
    }

  } catch (error) {
    console.error('Verify bank account error:', error);
    res.status(500).json({ error: 'Failed to verify bank account' });
  }
});

// Delete bank account
router.delete('/:accountId', verifyToken, async (req, res) => {
  try {
    const { accountId } = req.params;
    const companyId = req.company.companyId;

    const bankAccount = await prisma.bankAccount.findFirst({
      where: {
        id: accountId,
        companyId
      }
    });

    if (!bankAccount) {
      return res.status(404).json({ error: 'Bank account not found' });
    }

    // 检查是否有进行中的提现使用此银行账户
    const activeWithdrawals = await prisma.withdrawal.findMany({
      where: {
        bankAccountId: accountId,
        status: { in: ['pending', 'processing'] }
      }
    });

    if (activeWithdrawals.length > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete bank account with active withdrawals' 
      });
    }

    await prisma.bankAccount.delete({
      where: { id: accountId }
    });

    res.json({
      message: 'Bank account deleted successfully'
    });

  } catch (error) {
    console.error('Delete bank account error:', error);
    res.status(500).json({ error: 'Failed to delete bank account' });
  }
});

// Get available balance for withdrawal
router.get('/balance', verifyToken, requireKYCApproved, async (req, res) => {
  try {
    const companyId = req.company.companyId;

    const company = await prisma.company.findUnique({
      where: { id: companyId }
    });

    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    // 计算锁仓余额
    const lockedAmount = await prisma.lockedBalance.aggregate({
      where: { userId: companyId },
      _sum: { amount: true }
    });

    const availableBalance = company.usdeBalance - (lockedAmount._sum.amount || 0);

    // 检查是否有验证过的银行账户
    const verifiedBankAccount = await prisma.bankAccount.findFirst({
      where: {
        companyId,
        isVerified: true
      }
    });

    res.json({
      balance: {
        totalBalance: company.usdeBalance,
        lockedAmount: lockedAmount._sum.amount || 0,
        availableBalance,
        hasVerifiedBankAccount: !!verifiedBankAccount
      }
    });

  } catch (error) {
    console.error('Get balance error:', error);
    res.status(500).json({ error: 'Failed to fetch balance' });
  }
});

// 模拟银行账户验证
async function simulateBankAccountVerification(bankAccount) {
  // 模拟验证延迟
  await new Promise(resolve => setTimeout(resolve, 1000));

  // 模拟90%验证成功率
  return Math.random() < 0.9;
}

module.exports = router; 