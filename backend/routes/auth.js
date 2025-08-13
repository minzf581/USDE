const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const prisma = require('../lib/prisma');
const { sendVerificationEmail } = require('../services/emailService');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// Register company
router.post('/register', [
  body('name').trim().isLength({ min: 2 }).withMessage('Company name must be at least 2 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('companyName').optional().trim().isLength({ min: 2 }).withMessage('Company name must be at least 2 characters'),
  body('companyType').optional().trim().isLength({ min: 2 }).withMessage('Company type must be at least 2 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password, companyName, companyType } = req.body;

    // Check if company already exists
    const existingCompany = await prisma.company.findUnique({
      where: { email }
    });

    if (existingCompany) {
      return res.status(400).json({ error: 'Company with this email already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create enterprise admin
    const company = await prisma.company.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: 'enterprise_admin',
        kycStatus: 'pending',
        isEnterpriseAdmin: true,
        isEnterpriseUser: false,
        enterpriseRole: 'enterprise_admin',
        companyName: companyName || name,
        enterpriseCompanyType: companyType || 'Private Limited'
      }
    });

    // Create enterprise entity
    const enterprise = await prisma.enterprise.create({
      data: {
        name: companyName || name,
        adminId: company.id
      }
    });

    // Generate JWT token
    const token = jwt.sign(
      { companyId: company.id, email: company.email },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    // Send verification email
    await sendVerificationEmail(company.email, company.name);

    res.status(201).json({
      message: 'Company registered successfully',
      token,
      company: {
        id: company.id,
        name: company.name,
        email: company.email,
        role: company.role,
        kycStatus: company.kycStatus,
        ucBalance: company.ucBalance,
        isEnterpriseAdmin: company.isEnterpriseAdmin,
        isEnterpriseUser: company.isEnterpriseUser,
        enterpriseRole: company.enterpriseRole,
        companyName: company.companyName,
        enterpriseCompanyType: company.enterpriseCompanyType
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login company
router.post('/login', [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Find company
    const company = await prisma.company.findUnique({
      where: { email }
    });

    if (!company) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, company.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { companyId: company.id, email: company.email },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login successful',
      token,
      company: {
        id: company.id,
        name: company.name,
        email: company.email,
        role: company.role,
        kycStatus: company.kycStatus,
        ucBalance: company.ucBalance,
        totalEarnings: company.totalEarnings,
        isEnterpriseAdmin: company.isEnterpriseAdmin,
        isEnterpriseUser: company.isEnterpriseUser,
        enterpriseRole: company.enterpriseRole,
        companyName: company.companyName,
        enterpriseCompanyType: company.enterpriseCompanyType
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// 移除旧的verifyToken，使用middleware/auth.js中的版本

// Get current company profile
router.get('/profile', verifyToken, async (req, res) => {
  try {
    const company = await prisma.company.findUnique({
      where: { id: req.company.companyId }
    });

    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    // Return only the fields we need, in the correct order
    const profileData = {
      id: company.id,
      name: company.name,
      email: company.email,
      type: company.type,
      status: company.status,
      kycStatus: company.kycStatus,
      balance: company.balance,
      usdeBalance: company.usdeBalance,
      role: company.role,
      isEnterpriseAdmin: company.isEnterpriseAdmin,
      isEnterpriseUser: company.isEnterpriseUser,
      enterpriseRole: company.enterpriseRole,
      createdAt: company.createdAt,
      updatedAt: company.updatedAt
    };

    res.json({ company: profileData });

  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

module.exports = { router }; 