const express = require('express');
const { body, validationResult } = require('express-validator');
const prisma = require('../lib/prisma');
const { verifyToken, requireKYCApproved } = require('../middleware/auth');
const withdrawalService = require('../services/withdrawalService');

const router = express.Router();


// Create withdrawal request
router.post('/', verifyToken, requireKYCApproved, [
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
  body('bankAccountId').notEmpty().withMessage('Bank account ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { amount, bankAccountId } = req.body;
    const companyId = req.company.companyId;

    // 使用提现服务创建提现请求
    const withdrawal = await withdrawalService.createWithdrawal(companyId, amount, bankAccountId);

    res.json({
      message: 'Withdrawal request created successfully',
      withdrawal: {
        id: withdrawal.id,
        amount: withdrawal.amount,
        status: withdrawal.status,
        burnTxHash: withdrawal.burnTxHash,
        timestamp: withdrawal.timestamp,
        bankAccount: withdrawal.bankAccount
      }
    });

  } catch (error) {
    console.error('Withdrawal error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Get withdrawal history
router.get('/', verifyToken, async (req, res) => {
  try {
    const companyId = req.company.companyId;
    const { page = 1, limit = 10 } = req.query;

    const result = await withdrawalService.getWithdrawalHistory(companyId, page, limit);

    res.json(result);

  } catch (error) {
    console.error('Withdrawal history error:', error);
    res.status(500).json({ error: 'Failed to fetch withdrawal history' });
  }
});

// Process bank transfer (for testing)
router.post('/:withdrawalId/process', verifyToken, async (req, res) => {
  try {
    const { withdrawalId } = req.params;
    const companyId = req.company.companyId;

    // 验证提现属于当前用户
    const withdrawal = await prisma.withdrawal.findFirst({
      where: {
        id: withdrawalId,
        companyId
      }
    });

    if (!withdrawal) {
      return res.status(404).json({ error: 'Withdrawal not found' });
    }

    // 使用提现服务处理银行转账
    const result = await withdrawalService.processBankTransfer(withdrawalId);

    res.json({
      message: 'Bank transfer processed successfully',
      result
    });

  } catch (error) {
    console.error('Bank transfer error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get withdrawal statistics
router.get('/stats/summary', verifyToken, async (req, res) => {
  try {
    const companyId = req.company.companyId;

    const stats = await withdrawalService.getWithdrawalStats(companyId);

    res.json({
      totalWithdrawn: stats.totalAmount,
      pendingWithdrawals: stats.pendingWithdrawals,
      completedWithdrawals: stats.successfulWithdrawals
    });

  } catch (error) {
    console.error('Withdrawal stats error:', error);
    res.status(500).json({ error: 'Failed to fetch withdrawal statistics' });
  }
});

module.exports = router; 