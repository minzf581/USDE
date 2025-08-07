const express = require('express');
const { body, validationResult } = require('express-validator');
const prisma = require('../lib/prisma');
const { verifyToken, requireAdmin, requireSystemAdmin, logAudit } = require('../middleware/auth');

const router = express.Router();

// 获取所有用户列表
router.get('/users', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '', status = '', role = '' } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { companyName: { contains: search, mode: 'insensitive' } }
      ];
    }
    if (status) {
      where.kycStatus = status;
    }
    if (role) {
      where.role = role;
    }

    const [users, total] = await Promise.all([
      prisma.company.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          kycStatus: true,
          isActive: true,
          usdeBalance: true,
          ucBalance: true,
          totalEarnings: true,
          isEnterpriseAdmin: true,
          isEnterpriseUser: true,
          enterpriseRole: true,
          companyName: true,
          enterpriseCompanyType: true,
          createdAt: true,
          updatedAt: true
        },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: parseInt(limit)
      }),
      prisma.company.count({ where })
    ]);

    res.json({
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// 获取用户详情（包含财务信息等）
router.get('/users/:userId', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await prisma.company.findUnique({
      where: { id: userId },
      include: {
        ubos: true,
        kycReviews: {
          orderBy: { reviewedAt: 'desc' }
        },
        deposits: {
          orderBy: { timestamp: 'desc' },
          take: 10
        },
        withdrawals: {
          orderBy: { timestamp: 'desc' },
          take: 10
        },
        paymentsFrom: {
          include: {
            toCompany: { select: { name: true, email: true } }
          },
          orderBy: { timestamp: 'desc' },
          take: 10
        },
        paymentsTo: {
          include: {
            fromCompany: { select: { name: true, email: true } }
          },
          orderBy: { timestamp: 'desc' },
          take: 10
        },
        stakes: {
          orderBy: { startDate: 'desc' },
          take: 10
        },
        earnings: {
          orderBy: { date: 'desc' },
          take: 10
        },
        bankAccounts: true,
        treasurySettings: true,
        userRoles: {
          include: {
            role: true
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Get user details error:', error);
    res.status(500).json({ error: 'Failed to fetch user details' });
  }
});

// 更新用户状态
router.put('/users/:userId/status', verifyToken, requireAdmin, [
  body('isActive').isBoolean().withMessage('isActive must be a boolean')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { userId } = req.params;
    const { isActive } = req.body;
    const adminId = req.company.companyId;

    const user = await prisma.company.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const updatedUser = await prisma.company.update({
      where: { id: userId },
      data: { isActive }
    });

    // 记录审计日志
    await logAudit(adminId, 'user_status_update', userId, {
      previousStatus: user.isActive,
      newStatus: isActive,
      userEmail: user.email
    }, req);

    res.json({
      message: 'User status updated successfully',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        isActive: updatedUser.isActive
      }
    });
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({ error: 'Failed to update user status' });
  }
});

// 删除用户（仅系统管理员）
router.delete('/users/:userId', verifyToken, requireSystemAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const adminId = req.company.companyId;

    const user = await prisma.company.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // 检查是否为系统管理员
    if (user.role === 'system_admin') {
      return res.status(403).json({ error: 'Cannot delete system admin' });
    }

    // 删除用户相关数据
    await prisma.$transaction([
      prisma.auditLog.deleteMany({ where: { adminId: userId } }),
      prisma.kYCReview.deleteMany({ where: { companyId: userId } }),
      prisma.ubo.deleteMany({ where: { companyId: userId } }),
      prisma.withdrawal.deleteMany({ where: { companyId: userId } }),
      prisma.deposit.deleteMany({ where: { companyId: userId } }),
      prisma.payment.deleteMany({ 
        where: { 
          OR: [
            { fromId: userId },
            { toId: userId }
          ]
        }
      }),
      prisma.stake.deleteMany({ where: { companyId: userId } }),
      prisma.earning.deleteMany({ where: { companyId: userId } }),
      prisma.bankAccount.deleteMany({ where: { companyId: userId } }),
      prisma.usdeTransaction.deleteMany({ where: { companyId: userId } }),
      prisma.lockedBalance.deleteMany({ where: { userId } }),
      prisma.userRole.deleteMany({ where: { userId } }),
      prisma.company.delete({ where: { id: userId } })
    ]);

    // 记录审计日志
    await logAudit(adminId, 'user_deleted', userId, {
      userEmail: user.email,
      userRole: user.role
    }, req);

    res.json({
      message: 'User deleted successfully',
      deletedUser: {
        id: user.id,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// 修改用户信息（仅系统管理员）
router.put('/users/:userId', verifyToken, requireSystemAdmin, [
  body('name').optional().isString().withMessage('Name must be a string'),
  body('email').optional().isEmail().withMessage('Email must be valid'),
  body('role').optional().isIn(['system_admin', 'enterprise_admin', 'enterprise_user']).withMessage('Invalid role'),
  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { userId } = req.params;
    const { name, email, role, isActive } = req.body;
    const adminId = req.company.companyId;

    const user = await prisma.company.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // 检查邮箱是否已被其他用户使用
    if (email && email !== user.email) {
      const existingUser = await prisma.company.findUnique({
        where: { email }
      });
      if (existingUser) {
        return res.status(400).json({ error: 'Email already in use' });
      }
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (role !== undefined) updateData.role = role;
    if (isActive !== undefined) updateData.isActive = isActive;

    const updatedUser = await prisma.company.update({
      where: { id: userId },
      data: updateData
    });

    // 记录审计日志
    await logAudit(adminId, 'user_updated', userId, {
      previousData: {
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive
      },
      newData: updateData
    }, req);

    res.json({
      message: 'User updated successfully',
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        isActive: updatedUser.isActive
      }
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// KYC审批
router.put('/kyc/:userId/approve', verifyToken, requireAdmin, [
  body('status').isIn(['approved', 'rejected']).withMessage('Status must be approved or rejected'),
  body('notes').optional().isString().withMessage('Notes must be a string')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { userId } = req.params;
    const { status, notes } = req.body;
    const adminId = req.company.companyId;

    const user = await prisma.company.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // 更新KYC状态
    const updatedUser = await prisma.company.update({
      where: { id: userId },
      data: { kycStatus: status }
    });

    // 创建KYC审核记录
    await prisma.kYCReview.create({
      data: {
        companyId: userId,
        reviewerId: adminId,
        status,
        notes
      }
    });

    // 记录审计日志
    await logAudit(adminId, 'kyc_approval', userId, {
      previousStatus: user.kycStatus,
      newStatus: status,
      notes,
      userEmail: user.email
    }, req);

    res.json({
      message: `KYC ${status} successfully`,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        kycStatus: updatedUser.kycStatus
      }
    });
  } catch (error) {
    console.error('KYC approval error:', error);
    res.status(500).json({ error: 'Failed to update KYC status' });
  }
});

// 获取待审批的提现请求
router.get('/withdrawals/pending', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const [withdrawals, total] = await Promise.all([
      prisma.withdrawal.findMany({
        where: { status: 'pending' },
        include: {
          company: {
            select: {
              id: true,
              name: true,
              email: true,
              kycStatus: true,
              role: true
            }
          }
        },
        orderBy: { timestamp: 'desc' },
        skip: offset,
        take: parseInt(limit)
      }),
      prisma.withdrawal.count({
        where: { status: 'pending' }
      })
    ]);

    res.json({
      withdrawals,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get pending withdrawals error:', error);
    res.status(500).json({ error: 'Failed to fetch pending withdrawals' });
  }
});

// 审批提现请求
router.put('/withdrawals/:withdrawalId/approve', verifyToken, requireAdmin, [
  body('status').isIn(['completed', 'failed']).withMessage('Status must be completed or failed'),
  body('notes').optional().isString().withMessage('Notes must be a string')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { withdrawalId } = req.params;
    const { status, notes } = req.body;
    const adminId = req.company.companyId;

    const withdrawal = await prisma.withdrawal.findUnique({
      where: { id: withdrawalId },
      include: {
        company: {
          select: { id: true, email: true, name: true }
        }
      }
    });

    if (!withdrawal) {
      return res.status(404).json({ error: 'Withdrawal not found' });
    }

    if (withdrawal.status !== 'pending') {
      return res.status(400).json({ error: 'Withdrawal is not pending' });
    }

    const updatedWithdrawal = await prisma.withdrawal.update({
      where: { id: withdrawalId },
      data: { 
        status,
        notes: notes || null
      }
    });

    // 记录审计日志
    await logAudit(adminId, 'withdrawal_approval', withdrawalId, {
      previousStatus: withdrawal.status,
      newStatus: status,
      amount: withdrawal.amount,
      userEmail: withdrawal.company.email,
      notes
    }, req);

    res.json({
      message: `Withdrawal ${status} successfully`,
      withdrawal: {
        id: updatedWithdrawal.id,
        amount: updatedWithdrawal.amount,
        status: updatedWithdrawal.status,
        companyEmail: withdrawal.company.email
      }
    });
  } catch (error) {
    console.error('Withdrawal approval error:', error);
    res.status(500).json({ error: 'Failed to approve withdrawal' });
  }
});

// 获取平台统计
router.get('/stats', verifyToken, requireAdmin, async (req, res) => {
  try {
    const [
      totalUsers,
      approvedUsers,
      pendingKYC,
      systemAdmins,
      enterpriseAdmins,
      enterpriseUsers,
      totalDeposits,
      totalWithdrawals,
      totalPayments,
      totalStakes,
      recentActivity
    ] = await Promise.all([
      // 总用户数
      prisma.company.count(),
      // 已认证用户数
      prisma.company.count({ where: { kycStatus: 'approved' } }),
      // 待KYC用户数
      prisma.company.count({ where: { kycStatus: 'pending' } }),
      // 系统管理员数
      prisma.company.count({ where: { role: 'system_admin' } }),
      // 企业管理员数
      prisma.company.count({ where: { role: 'enterprise_admin' } }),
      // 企业用户数
      prisma.company.count({ where: { role: 'enterprise_user' } }),
      // 总存款
      prisma.deposit.aggregate({
        where: { status: 'completed' },
        _sum: { amount: true }
      }),
      // 总提现
      prisma.withdrawal.aggregate({
        where: { status: 'completed' },
        _sum: { amount: true }
      }),
      // 总支付
      prisma.payment.aggregate({
        _sum: { amount: true }
      }),
      // 总质押
      prisma.stake.aggregate({
        where: { unlocked: false },
        _sum: { amount: true }
      }),
      // 最近活动
      prisma.auditLog.findMany({
        orderBy: { timestamp: 'desc' },
        take: 10,
        include: {
          admin: {
            select: { name: true, email: true }
          }
        }
      })
    ]);

    res.json({
      stats: {
        users: {
          total: totalUsers,
          approved: approvedUsers,
          pendingKYC,
          systemAdmins,
          enterpriseAdmins,
          enterpriseUsers
        },
        financial: {
          totalDeposits: totalDeposits._sum.amount || 0,
          totalWithdrawals: totalWithdrawals._sum.amount || 0,
          totalPayments: totalPayments._sum.amount || 0,
          totalStakes: totalStakes._sum.amount || 0
        }
      },
      recentActivity
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Failed to fetch platform stats' });
  }
});

// 获取审计日志
router.get('/audit-logs', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 50, action = '', adminId = '' } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (action) {
      where.action = action;
    }
    if (adminId) {
      where.adminId = adminId;
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          admin: {
            select: { name: true, email: true, role: true }
          }
        },
        orderBy: { timestamp: 'desc' },
        skip: offset,
        take: parseInt(limit)
      }),
      prisma.auditLog.count({ where })
    ]);

    res.json({
      logs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get audit logs error:', error);
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
});

module.exports = router; 