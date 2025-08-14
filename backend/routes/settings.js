const express = require('express');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const prisma = require('../lib/prisma');
const { verifyToken, requireSystemAdmin, requireEnterpriseAdmin, logAudit } = require('../middleware/auth');

const router = express.Router();

// Get system settings
router.get('/', verifyToken, async (req, res) => {
  try {
    // 检查用户权限
    const user = await prisma.company.findUnique({
      where: { id: req.company.companyId }
    });

    // 只有系统管理员和企业管理员可以访问设置
    if (user.role !== 'admin' && user.role !== 'enterprise_admin' && user.role !== 'ENTERPRISE_ADMIN') {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    // TODO: Implement system settings retrieval from database
    const settings = {
      blockchain: {
        currentChain: 'polygon_testnet',
        defaultWalletAddress: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
        contractAddress: '0x1234567890123456789012345678901234567890'
      },
      tokenEconomy: {
        redemptionPeriod: 30,
        acceptanceRate: 0.95,
        stakingDays: [30, 90, 180]
      },
      system: {
        useMockChain: true,
        maintenanceMode: false,
        defaultLanguage: 'en',
        defaultTimezone: 'UTC'
      }
    };

    res.json({ settings });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// Update blockchain settings
router.put('/blockchain', verifyToken, requireSystemAdmin, [
  body('currentChain').isIn(['polygon_testnet', 'polygon_mainnet', 'ethereum_testnet', 'ethereum_mainnet']).withMessage('Invalid chain'),
  body('defaultWalletAddress').optional().isString().withMessage('Wallet address must be a string'),
  body('contractAddress').optional().isString().withMessage('Contract address must be a string')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { currentChain, defaultWalletAddress, contractAddress } = req.body;
    const adminId = req.company.companyId;

    // TODO: Implement blockchain settings update in database
    console.log('Updating blockchain settings:', { currentChain, defaultWalletAddress, contractAddress });

    // Record audit log
    await logAudit(adminId, 'blockchain_settings_updated', null, {
      currentChain,
      defaultWalletAddress,
      contractAddress
    }, req);

    res.json({
      message: 'Blockchain settings updated successfully',
      settings: { currentChain, defaultWalletAddress, contractAddress }
    });
  } catch (error) {
    console.error('Update blockchain settings error:', error);
    res.status(500).json({ error: 'Failed to update blockchain settings' });
  }
});

// Update token economy settings
router.put('/token-economy', verifyToken, requireSystemAdmin, [
  body('redemptionPeriod').isInt({ min: 1, max: 365 }).withMessage('Redemption period must be between 1 and 365 days'),
  body('acceptanceRate').isFloat({ min: 0, max: 1 }).withMessage('Acceptance rate must be between 0 and 1'),
  body('stakingDays').isArray().withMessage('Staking days must be an array')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { redemptionPeriod, acceptanceRate, stakingDays } = req.body;
    const adminId = req.company.companyId;

    // TODO: Implement token economy settings update in database
    console.log('Updating token economy settings:', { redemptionPeriod, acceptanceRate, stakingDays });

    // Record audit log
    await logAudit(adminId, 'token_economy_settings_updated', null, {
      redemptionPeriod,
      acceptanceRate,
      stakingDays
    }, req);

    res.json({
      message: 'Token economy settings updated successfully',
      settings: { redemptionPeriod, acceptanceRate, stakingDays }
    });
  } catch (error) {
    console.error('Update token economy settings error:', error);
    res.status(500).json({ error: 'Failed to update token economy settings' });
  }
});

// Update system settings
router.put('/system', verifyToken, requireSystemAdmin, [
  body('useMockChain').isBoolean().withMessage('useMockChain must be a boolean'),
  body('maintenanceMode').isBoolean().withMessage('maintenanceMode must be a boolean'),
  body('defaultLanguage').isIn(['en', 'zh', 'es', 'fr']).withMessage('Invalid language'),
  body('defaultTimezone').isString().withMessage('Default timezone must be a string')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { useMockChain, maintenanceMode, defaultLanguage, defaultTimezone } = req.body;
    const adminId = req.company.companyId;

    // TODO: Implement system settings update in database
    console.log('Updating system settings:', { useMockChain, maintenanceMode, defaultLanguage, defaultTimezone });

    // Record audit log
    await logAudit(adminId, 'system_settings_updated', null, {
      useMockChain,
      maintenanceMode,
      defaultLanguage,
      defaultTimezone
    }, req);

    res.json({
      message: 'System settings updated successfully',
      settings: { useMockChain, maintenanceMode, defaultLanguage, defaultTimezone }
    });
  } catch (error) {
    console.error('Update system settings error:', error);
    res.status(500).json({ error: 'Failed to update system settings' });
  }
});

// Change admin password
router.put('/password', verifyToken, requireSystemAdmin, [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 8 }).withMessage('New password must be at least 8 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { currentPassword, newPassword } = req.body;
    const adminId = req.company.companyId;

    // Get current admin
    const admin = await prisma.company.findUnique({
      where: { id: adminId }
    });

    if (!admin) {
      return res.status(404).json({ error: 'Admin not found' });
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, admin.password);
    if (!isValidPassword) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update password
    await prisma.company.update({
      where: { id: adminId },
      data: { password: hashedPassword }
    });

    // Record audit log
    await logAudit(adminId, 'admin_password_changed', adminId, {
      adminEmail: admin.email
    }, req);

    res.json({
      message: 'Password updated successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Failed to update password' });
  }
});

module.exports = router;
