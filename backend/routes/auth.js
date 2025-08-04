const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { sendVerificationEmail } = require('../services/emailService');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Register company
router.post('/register', [
  body('name').trim().isLength({ min: 2 }).withMessage('Company name must be at least 2 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password } = req.body;

    // Check if company already exists
    const existingCompany = await prisma.company.findUnique({
      where: { email }
    });

    if (existingCompany) {
      return res.status(400).json({ error: 'Company with this email already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create company
    const company = await prisma.company.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: 'user',
        kycStatus: 'pending'
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
        ucBalance: company.ucBalance
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
        totalEarnings: company.totalEarnings
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
      where: { id: req.company.companyId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        kycStatus: true,
        ucBalance: true,
        usdeBalance: true,
        totalEarnings: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    res.json({ company });

  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

module.exports = { router }; 