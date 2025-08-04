const express = require('express');
const multer = require('multer');
const { body, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only images and PDFs are allowed'), false);
    }
  }
});

// Upload KYC documents
router.post('/kyc/upload', verifyToken, upload.array('documents', 5), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No documents uploaded' });
    }

    // In a real implementation, you would upload files to cloud storage
    // For this prototype, we'll store file info in the database
    const documentUrls = req.files.map(file => ({
      filename: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      uploadedAt: new Date()
    }));

    // Update company with KYC documents
    await prisma.company.update({
      where: { id: req.company.companyId },
      data: {
        kycDocuments: JSON.stringify(documentUrls),
        kycStatus: 'pending' // Reset to pending for review
      }
    });

    res.json({
      message: 'KYC documents uploaded successfully',
      documentsCount: req.files.length,
      status: 'pending'
    });

  } catch (error) {
    console.error('KYC upload error:', error);
    res.status(500).json({ error: 'Failed to upload KYC documents' });
  }
});

// Update company profile
router.put('/profile', verifyToken, [
  body('name').optional().trim().isLength({ min: 2 }).withMessage('Company name must be at least 2 characters'),
  body('email').optional().isEmail().normalizeEmail().withMessage('Valid email is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email } = req.body;
    const updateData = {};

    if (name) updateData.name = name;
    if (email) {
      // Check if email is already taken by another company
      const existingCompany = await prisma.company.findFirst({
        where: {
          email,
          id: { not: req.company.companyId }
        }
      });

      if (existingCompany) {
        return res.status(400).json({ error: 'Email is already taken by another company' });
      }
      updateData.email = email;
    }

    const company = await prisma.company.update({
      where: { id: req.company.companyId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        kycStatus: true,
        ucBalance: true,
        totalEarnings: true,
        updatedAt: true
      }
    });

    res.json({
      message: 'Profile updated successfully',
      company
    });

  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Get KYC status
router.get('/kyc/status', verifyToken, async (req, res) => {
  try {
    const company = await prisma.company.findUnique({
      where: { id: req.company.companyId },
      select: {
        kycStatus: true,
        kycDocuments: true,
        createdAt: true
      }
    });

    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    const documents = company.kycDocuments ? JSON.parse(company.kycDocuments) : [];

    res.json({
      status: company.kycStatus,
      documentsCount: documents.length,
      submittedAt: company.createdAt,
      documents: documents
    });

  } catch (error) {
    console.error('KYC status error:', error);
    res.status(500).json({ error: 'Failed to fetch KYC status' });
  }
});

// Admin: Update KYC status (for admin use)
router.put('/kyc/status/:companyId', verifyToken, [
  body('status').isIn(['pending', 'approved', 'rejected']).withMessage('Invalid status'),
  body('notes').optional().isString().withMessage('Notes must be a string')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { companyId } = req.params;
    const { status, notes } = req.body;

    // In a real app, you'd check if the current user is an admin
    // For this prototype, we'll allow any authenticated user to update KYC status

    const company = await prisma.company.update({
      where: { id: companyId },
      data: {
        kycStatus: status
      },
      select: {
        id: true,
        name: true,
        email: true,
        kycStatus: true,
        updatedAt: true
      }
    });

    res.json({
      message: `KYC status updated to ${status}`,
      company
    });

  } catch (error) {
    console.error('KYC status update error:', error);
    res.status(500).json({ error: 'Failed to update KYC status' });
  }
});

module.exports = router; 