const express = require('express');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const prisma = require('../lib/prisma');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// Middleware to check if user is enterprise admin
const requireEnterpriseAdmin = async (req, res, next) => {
  try {
    const userId = req.company.companyId;
    const user = await prisma.company.findUnique({
      where: { id: userId }
    });

    if (!user || !user.isEnterpriseAdmin) {
      return res.status(403).json({ error: 'Enterprise admin access required' });
    }

    req.enterpriseAdmin = user;
    next();
  } catch (error) {
    res.status(500).json({ error: 'Permission check failed' });
  }
};

// Get enterprise users
router.get('/users', verifyToken, requireEnterpriseAdmin, async (req, res) => {
  try {
    const enterpriseAdmin = req.enterpriseAdmin;
    
    // Get enterprise
    const enterprise = await prisma.enterprise.findUnique({
      where: { adminId: enterpriseAdmin.id }
    });

    if (!enterprise) {
      return res.status(404).json({ error: 'Enterprise not found' });
    }

    // Get all users in this enterprise
    const users = await prisma.company.findMany({
      where: {
        OR: [
          { id: enterpriseAdmin.id }, // Enterprise admin
          { enterpriseId: enterprise.id } // Enterprise users
        ]
      },
      select: {
        id: true,
        name: true,
        email: true,
        kycStatus: true,
        isActive: true,
        enterpriseRole: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(users);
  } catch (error) {
    console.error('Get enterprise users error:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: 'Failed to fetch enterprise users' });
  }
});

// Create enterprise user
router.post('/users', verifyToken, requireEnterpriseAdmin, [
  body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('enterpriseRole').isIn(['enterprise_finance_manager', 'enterprise_finance_operator']).withMessage('Invalid enterprise role')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password, enterpriseRole } = req.body;
    const enterpriseAdmin = req.enterpriseAdmin;

    // Check if email already exists
    const existingUser = await prisma.company.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // Get enterprise
    const enterprise = await prisma.enterprise.findUnique({
      where: { adminId: enterpriseAdmin.id }
    });

    if (!enterprise) {
      return res.status(404).json({ error: 'Enterprise not found' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const newUser = await prisma.company.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: enterpriseRole,
        isEnterpriseAdmin: false,
        isEnterpriseUser: true,
        enterpriseId: enterprise.id,
        enterpriseRole,
        isActive: true
      }
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        adminId: enterpriseAdmin.id,
        action: 'create_enterprise_user',
        targetId: newUser.id,
        details: JSON.stringify({
          userEmail: email,
          enterpriseRole,
          enterpriseId: enterprise.id
        })
      }
    });

    res.status(201).json({
      message: 'Enterprise user created successfully',
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        enterpriseRole: newUser.enterpriseRole,
        isActive: newUser.isActive
      }
    });
  } catch (error) {
    console.error('Create enterprise user error:', error);
    res.status(500).json({ error: 'Failed to create enterprise user' });
  }
});

// Update enterprise user
router.put('/users/:userId', verifyToken, requireEnterpriseAdmin, [
  body('name').optional().trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('enterpriseRole').optional().isIn(['enterprise_finance_manager', 'enterprise_finance_operator']).withMessage('Invalid enterprise role'),
  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { userId } = req.params;
    const { name, enterpriseRole, isActive } = req.body;
    const enterpriseAdmin = req.enterpriseAdmin;

    // Get enterprise
    const enterprise = await prisma.enterprise.findUnique({
      where: { adminId: enterpriseAdmin.id }
    });

    if (!enterprise) {
      return res.status(404).json({ error: 'Enterprise not found' });
    }

    // Check if user belongs to this enterprise
    const user = await prisma.company.findFirst({
      where: {
        id: userId,
        enterpriseId: enterprise.id
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found or not part of this enterprise' });
    }

    // Update user
    const updatedUser = await prisma.company.update({
      where: { id: userId },
      data: {
        ...(name && { name }),
        ...(enterpriseRole && { enterpriseRole }),
        ...(typeof isActive === 'boolean' && { isActive })
      }
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        adminId: enterpriseAdmin.id,
        action: 'update_enterprise_user',
        targetId: userId,
        details: JSON.stringify({
          updatedFields: { name, enterpriseRole, isActive },
          enterpriseId: enterprise.id
        })
      }
    });

    res.json({
      message: 'Enterprise user updated successfully',
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        enterpriseRole: updatedUser.enterpriseRole,
        isActive: updatedUser.isActive
      }
    });
  } catch (error) {
    console.error('Update enterprise user error:', error);
    res.status(500).json({ error: 'Failed to update enterprise user' });
  }
});

// Delete enterprise user
router.delete('/users/:userId', verifyToken, requireEnterpriseAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const enterpriseAdmin = req.enterpriseAdmin;

    // Get enterprise
    const enterprise = await prisma.enterprise.findUnique({
      where: { adminId: enterpriseAdmin.id }
    });

    if (!enterprise) {
      return res.status(404).json({ error: 'Enterprise not found' });
    }

    // Check if user belongs to this enterprise
    const user = await prisma.company.findFirst({
      where: {
        id: userId,
        enterpriseId: enterprise.id
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found or not part of this enterprise' });
    }

    // Delete user
    await prisma.company.delete({
      where: { id: userId }
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        adminId: enterpriseAdmin.id,
        action: 'delete_enterprise_user',
        targetId: userId,
        details: JSON.stringify({
          deletedUserEmail: user.email,
          enterpriseId: enterprise.id
        })
      }
    });

    res.json({ message: 'Enterprise user deleted successfully' });
  } catch (error) {
    console.error('Delete enterprise user error:', error);
    res.status(500).json({ error: 'Failed to delete enterprise user' });
  }
});

// Get enterprise settings
router.get('/settings', verifyToken, requireEnterpriseAdmin, async (req, res) => {
  try {
    const enterpriseAdmin = req.enterpriseAdmin;

    // Get enterprise
    const enterprise = await prisma.enterprise.findUnique({
      where: { adminId: enterpriseAdmin.id }
    });

    if (!enterprise) {
      return res.status(404).json({ error: 'Enterprise not found' });
    }

    // Get treasury settings
    const treasurySettings = await prisma.treasurySettings.findUnique({
      where: { companyId: enterpriseAdmin.id }
    });

    res.json({
      enterprise,
      treasurySettings
    });
  } catch (error) {
    console.error('Get enterprise settings error:', error);
    res.status(500).json({ error: 'Failed to fetch enterprise settings' });
  }
});

// Update enterprise settings
router.put('/settings', verifyToken, requireEnterpriseAdmin, [
  body('monthlyBudget').optional().isFloat({ min: 0 }).withMessage('Monthly budget must be a positive number'),
  body('quarterlyBudget').optional().isFloat({ min: 0 }).withMessage('Quarterly budget must be a positive number'),
  body('approvalThreshold').optional().isFloat({ min: 0 }).withMessage('Approval threshold must be a positive number'),
  body('autoApprovalEnabled').optional().isBoolean().withMessage('Auto approval must be a boolean'),
  body('riskFlagThreshold').optional().isFloat({ min: 0 }).withMessage('Risk flag threshold must be a positive number'),
  body('approvalWorkflow').optional().isIn(['single', 'dual', 'committee']).withMessage('Invalid approval workflow')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const enterpriseAdmin = req.enterpriseAdmin;
    const {
      monthlyBudget,
      quarterlyBudget,
      approvalThreshold,
      autoApprovalEnabled,
      riskFlagThreshold,
      approvalWorkflow
    } = req.body;

    // Get enterprise
    const enterprise = await prisma.enterprise.findUnique({
      where: { adminId: enterpriseAdmin.id }
    });

    if (!enterprise) {
      return res.status(404).json({ error: 'Enterprise not found' });
    }

    // Update or create treasury settings
    const treasurySettings = await prisma.treasurySettings.upsert({
      where: { companyId: enterpriseAdmin.id },
      update: {
        ...(monthlyBudget !== undefined && { monthlyBudget }),
        ...(quarterlyBudget !== undefined && { quarterlyBudget }),
        ...(approvalThreshold !== undefined && { approvalThreshold }),
        ...(typeof autoApprovalEnabled === 'boolean' && { autoApprovalEnabled }),
        ...(riskFlagThreshold !== undefined && { riskFlagThreshold }),
        ...(approvalWorkflow && { approvalWorkflow })
      },
      create: {
        companyId: enterpriseAdmin.id,
        monthlyBudget: monthlyBudget || 0,
        quarterlyBudget: quarterlyBudget || 0,
        approvalThreshold: approvalThreshold || 1000,
        autoApprovalEnabled: autoApprovalEnabled || false,
        riskFlagThreshold: riskFlagThreshold || 5000,
        approvalWorkflow: approvalWorkflow || 'single'
      }
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        adminId: enterpriseAdmin.id,
        action: 'update_enterprise_settings',
        targetId: enterpriseAdmin.id,
        details: JSON.stringify({
          updatedSettings: {
            monthlyBudget,
            quarterlyBudget,
            approvalThreshold,
            autoApprovalEnabled,
            riskFlagThreshold,
            approvalWorkflow
          },
          enterpriseId: enterprise.id
        })
      }
    });

    res.json({
      message: 'Enterprise settings updated successfully',
      treasurySettings
    });
  } catch (error) {
    console.error('Update enterprise settings error:', error);
    res.status(500).json({ error: 'Failed to update enterprise settings' });
  }
});

module.exports = router; 