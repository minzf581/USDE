const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { verifyToken } = require('../middleware/auth');

// Middleware to check if user has required permission
const requirePermission = (permission) => {
  return async (req, res, next) => {
    try {
      const userId = req.company.companyId;
      const user = await prisma.company.findUnique({
        where: { id: userId }
      });

      // 系统管理员和企业管理员拥有所有权限
      if (user.role === 'admin' || user.isEnterpriseAdmin) {
        return next();
      }

      // 检查用户角色权限
      const userRole = await prisma.userRole.findFirst({
        where: { userId },
        include: {
          role: {
            include: {
              permissions: true
            }
          }
        }
      });

      if (!userRole || !userRole.role.permissions.some(p => p.name === permission)) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }
      next();
    } catch (error) {
      console.error('Permission check error:', error);
      res.status(500).json({ error: 'Permission check failed' });
    }
  };
};

// Get user's treasury dashboard data
router.get('/dashboard', verifyToken, async (req, res) => {
  try {
    const userId = req.company.companyId;
    const user = await prisma.company.findUnique({
      where: { id: userId },
      include: {
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

    // Get pending approvals
    const pendingApprovals = await prisma.approvalWorkflow.findMany({
      where: {
        companyId: user.isEnterprise ? user.id : user.parentCompanyId || user.id,
        status: 'pending'
      },
      include: {
        approvals: {
          include: {
            approver: {
              select: { name: true, email: true }
            }
          }
        }
      }
    });

    // Get recent transactions
    const recentTransactions = await prisma.uSDETransaction.findMany({
      where: {
        companyId: user.isEnterprise ? user.id : user.parentCompanyId || user.id
      },
      orderBy: { timestamp: 'desc' },
      take: 10
    });

    // Calculate monthly totals
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);

    const monthlyPayments = await prisma.payment.aggregate({
      where: {
        fromId: user.isEnterprise ? user.id : user.parentCompanyId || user.id,
        timestamp: { gte: currentMonth }
      },
      _sum: { amount: true }
    });

    const monthlyWithdrawals = await prisma.withdrawal.aggregate({
      where: {
        companyId: user.isEnterprise ? user.id : user.parentCompanyId || user.id,
        timestamp: { gte: currentMonth },
        status: 'success'
      },
      _sum: { amount: true }
    });

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        isEnterprise: user.isEnterprise,
        roles: user.userRoles.map(ur => ur.role.name)
      },
      treasury: {
        totalAssets: user.ucBalance + user.usdeBalance,
        ucBalance: user.ucBalance,
        usdeBalance: user.usdeBalance,
        monthlyPayments: monthlyPayments._sum.amount || 0,
        monthlyWithdrawals: monthlyWithdrawals._sum.amount || 0,
        settings: user.treasurySettings
      },
      pendingApprovals: pendingApprovals.length,
      recentTransactions
    });
  } catch (error) {
    console.error('Treasury dashboard error:', error);
    res.status(500).json({ error: 'Failed to load dashboard data' });
  }
});

// Get all users in enterprise (admin only)
router.get('/users', verifyToken, requirePermission('manage_users'), async (req, res) => {
  try {
    const userId = req.company.companyId;
    const user = await prisma.company.findUnique({
      where: { id: userId }
    });

    if (!user.isEnterprise) {
      return res.status(403).json({ error: 'Enterprise access required' });
    }

    const users = await prisma.company.findMany({
      where: {
        OR: [
          { id: user.id },
          { parentCompanyId: user.id }
        ]
      },
      include: {
        userRoles: {
          include: {
            role: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(users.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      kycStatus: u.kycStatus,
      isActive: u.isActive,
      roles: u.userRoles.map(ur => ur.role.name),
      createdAt: u.createdAt
    })));
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Create new user in enterprise
router.post('/users', verifyToken, requirePermission('manage_users'), async (req, res) => {
  try {
    const { name, email, password, roleName } = req.body;
    const userId = req.company.companyId;
    const admin = await prisma.company.findUnique({
      where: { id: userId }
    });

    if (!admin.isEnterprise) {
      return res.status(403).json({ error: 'Enterprise access required' });
    }

    // Check if email already exists
    const existingUser = await prisma.company.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Get role
    const role = await prisma.role.findUnique({
      where: { name: roleName }
    });

    if (!role) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    // Create user
    const newUser = await prisma.company.create({
      data: {
        name,
        email,
        password, // Note: Should be hashed in production
        parentCompanyId: admin.id,
        isEnterprise: false
      }
    });

    // Assign role
    await prisma.userRole.create({
      data: {
        userId: newUser.id,
        roleId: role.id,
        companyId: admin.id
      }
    });

    res.json({
      message: 'User created successfully',
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: roleName
      }
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// Update user role
router.patch('/users/:id/role', verifyToken, requirePermission('manage_users'), async (req, res) => {
  try {
    const { roleName } = req.body;
    const targetUserId = req.params.id;
    const adminId = req.company.companyId;

    const admin = await prisma.company.findUnique({
      where: { id: adminId }
    });

    if (!admin.isEnterprise) {
      return res.status(403).json({ error: 'Enterprise access required' });
    }

    // Get role
    const role = await prisma.role.findUnique({
      where: { name: roleName }
    });

    if (!role) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    // Update user role
    await prisma.userRole.updateMany({
      where: {
        userId: targetUserId,
        companyId: admin.id
      },
      data: {
        roleId: role.id
      }
    });

    res.json({ message: 'User role updated successfully' });
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({ error: 'Failed to update user role' });
  }
});

// Get pending approvals
router.get('/approvals', verifyToken, requirePermission('view_approvals'), async (req, res) => {
  try {
    const userId = req.company.companyId;
    const user = await prisma.company.findUnique({
      where: { id: userId }
    });

    const companyId = user.isEnterprise ? user.id : user.parentCompanyId || user.id;

    const approvals = await prisma.approvalWorkflow.findMany({
      where: {
        companyId,
        status: 'pending'
      },
      include: {
        approvals: {
          include: {
            approver: {
              select: { name: true, email: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(approvals);
  } catch (error) {
    console.error('Get approvals error:', error);
    res.status(500).json({ error: 'Failed to fetch approvals' });
  }
});

// Approve/reject payment
router.post('/approvals/:id/approve', verifyToken, requirePermission('approve_payment'), async (req, res) => {
  try {
    const { notes } = req.body;
    const workflowId = req.params.id;
    const approverId = req.company.companyId;

    const workflow = await prisma.approvalWorkflow.findUnique({
      where: { id: workflowId },
      include: {
        approvals: true
      }
    });

    if (!workflow) {
      return res.status(404).json({ error: 'Approval workflow not found' });
    }

    // Check if user is authorized to approve
    const userRole = await prisma.userRole.findFirst({
      where: { userId: approverId },
      include: { role: true }
    });

    if (!userRole || !['admin', 'finance_manager'].includes(userRole.role.name)) {
      return res.status(403).json({ error: 'Insufficient permissions to approve' });
    }

    // Create approval record
    await prisma.approval.create({
      data: {
        workflowId,
        approverId,
        status: 'approved',
        notes,
        approvedAt: new Date()
      }
    });

    // Check if all required approvals are complete
    const totalApprovals = workflow.totalSteps;
    const approvedCount = await prisma.approval.count({
      where: {
        workflowId,
        status: 'approved'
      }
    });

    if (approvedCount >= totalApprovals) {
      // Update workflow status
      await prisma.approvalWorkflow.update({
        where: { id: workflowId },
        data: { status: 'approved' }
      });

      // Process the actual payment/withdrawal based on type
      if (workflow.type === 'payment') {
        // Process payment logic here
      } else if (workflow.type === 'withdrawal') {
        // Process withdrawal logic here
      }
    }

    res.json({ message: 'Approval submitted successfully' });
  } catch (error) {
    console.error('Approve error:', error);
    res.status(500).json({ error: 'Failed to approve request' });
  }
});

// Reject payment
router.post('/approvals/:id/reject', verifyToken, requirePermission('approve_payment'), async (req, res) => {
  try {
    const { notes } = req.body;
    const workflowId = req.params.id;
    const approverId = req.company.companyId;

    const workflow = await prisma.approvalWorkflow.findUnique({
      where: { id: workflowId }
    });

    if (!workflow) {
      return res.status(404).json({ error: 'Approval workflow not found' });
    }

    // Create rejection record
    await prisma.approval.create({
      data: {
        workflowId,
        approverId,
        status: 'rejected',
        notes,
        approvedAt: new Date()
      }
    });

    // Update workflow status
    await prisma.approvalWorkflow.update({
      where: { id: workflowId },
      data: { status: 'rejected' }
    });

    res.json({ message: 'Request rejected successfully' });
  } catch (error) {
    console.error('Reject error:', error);
    res.status(500).json({ error: 'Failed to reject request' });
  }
});

// Get treasury settings
router.get('/settings', verifyToken, requirePermission('view_settings'), async (req, res) => {
  try {
    const userId = req.company.companyId;
    const user = await prisma.company.findUnique({
      where: { id: userId },
      include: {
        treasurySettings: true
      }
    });

    if (!user.treasurySettings) {
      // Create default settings
      const settings = await prisma.treasurySettings.create({
        data: {
          companyId: user.id
        }
      });
      return res.json(settings);
    }

    res.json(user.treasurySettings);
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// Update treasury settings
router.post('/settings', verifyToken, requirePermission('manage_settings'), async (req, res) => {
  try {
    const userId = req.company.companyId;
    const {
      monthlyBudget,
      quarterlyBudget,
      approvalThreshold,
      autoApprovalEnabled,
      riskFlagThreshold,
      approvalWorkflow
    } = req.body;

    const settings = await prisma.treasurySettings.upsert({
      where: { companyId: userId },
      update: {
        monthlyBudget,
        quarterlyBudget,
        approvalThreshold,
        autoApprovalEnabled,
        riskFlagThreshold,
        approvalWorkflow
      },
      create: {
        companyId: userId,
        monthlyBudget,
        quarterlyBudget,
        approvalThreshold,
        autoApprovalEnabled,
        riskFlagThreshold,
        approvalWorkflow
      }
    });

    res.json(settings);
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// Get audit logs
router.get('/logs', verifyToken, requirePermission('view_logs'), async (req, res) => {
  try {
    const userId = req.company.companyId;
    const user = await prisma.company.findUnique({
      where: { id: userId }
    });

    const companyId = user.isEnterprise ? user.id : user.parentCompanyId || user.id;

    const logs = await prisma.auditLog.findMany({
      where: {
        OR: [
          { adminId: companyId },
          { targetId: { startsWith: companyId } }
        ]
      },
      include: {
        admin: {
          select: { name: true, email: true }
        }
      },
      orderBy: { timestamp: 'desc' },
      take: 100
    });

    res.json(logs);
  } catch (error) {
    console.error('Get logs error:', error);
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
});

// Get monthly reports
router.get('/reports/monthly', verifyToken, requirePermission('view_reports'), async (req, res) => {
  try {
    const { month, year } = req.query;
    const userId = req.company.companyId;
    const user = await prisma.company.findUnique({
      where: { id: userId }
    });

    const companyId = user.isEnterprise ? user.id : user.parentCompanyId || user.id;
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    // Get monthly transactions
    const payments = await prisma.payment.findMany({
      where: {
        fromId: companyId,
        timestamp: {
          gte: startDate,
          lte: endDate
        }
      }
    });

    const withdrawals = await prisma.withdrawal.findMany({
      where: {
        companyId,
        timestamp: {
          gte: startDate,
          lte: endDate
        }
      }
    });

    const deposits = await prisma.deposit.findMany({
      where: {
        companyId,
        timestamp: {
          gte: startDate,
          lte: endDate
        }
      }
    });

    const report = {
      period: `${year}-${month.toString().padStart(2, '0')}`,
      totalPayments: payments.reduce((sum, p) => sum + p.amount, 0),
      totalWithdrawals: withdrawals.reduce((sum, w) => sum + w.amount, 0),
      totalDeposits: deposits.reduce((sum, d) => sum + d.amount, 0),
      paymentCount: payments.length,
      withdrawalCount: withdrawals.length,
      depositCount: deposits.length,
      transactions: {
        payments,
        withdrawals,
        deposits
      }
    };

    res.json(report);
  } catch (error) {
    console.error('Get report error:', error);
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

module.exports = router; 