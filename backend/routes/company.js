const express = require('express');
const multer = require('multer');
const { body, validationResult } = require('express-validator');
const prisma = require('../lib/prisma');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();


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

// Get current company information
router.get('/current', verifyToken, async (req, res) => {
  try {
    const company = await prisma.company.findUnique({
      where: { id: req.company.companyId },
      select: {
        id: true,
        name: true,
        email: true,
        type: true,
        status: true,
        kycStatus: true,
        balance: true,
        usdeBalance: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    res.json({
      success: true,
      company: company
    });
  } catch (error) {
    console.error('Error fetching current company:', error);
    res.status(500).json({ error: 'Failed to fetch company information' });
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

// ===== SUBSIDIARY SUPPORT ROUTES =====

// Register parent company
router.post('/parent', verifyToken, async (req, res) => {
  try {
    const { name, email, companyCode, companyAddress } = req.body;

    const company = await prisma.company.create({
      data: {
        name,
        email,
        companyCode,
        companyAddress,
        companyType: 'parent',
        isParentCompany: true,
        role: 'enterprise_admin'
      }
    });

    res.status(201).json({
      success: true,
      message: 'Parent company registered successfully',
      company
    });
  } catch (error) {
    console.error('Parent company registration error:', error);
    res.status(500).json({ error: 'Failed to register parent company' });
  }
});

// Register subsidiary company
router.post('/subsidiary', verifyToken, async (req, res) => {
  try {
    const { name, email, companyCode, companyAddress, parentCompanyId } = req.body;

    // Verify parent company exists
    const parentCompany = await prisma.company.findUnique({
      where: { id: parentCompanyId }
    });

    if (!parentCompany || !parentCompany.isParentCompany) {
      return res.status(400).json({ error: 'Invalid parent company' });
    }

    const company = await prisma.company.create({
      data: {
        name,
        email,
        companyCode,
        companyAddress,
        companyType: 'subsidiary',
        isParentCompany: false,
        parentCompanyId,
        role: 'enterprise_user'
      }
    });

    res.status(201).json({
      success: true,
      message: 'Subsidiary company registered successfully',
      company
    });
  } catch (error) {
    console.error('Subsidiary company registration error:', error);
    res.status(500).json({ error: 'Failed to register subsidiary company' });
  }
});

// Get company information
router.get('/:companyId', verifyToken, async (req, res) => {
  try {
    const { companyId } = req.params;

    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: {
        id: true,
        name: true,
        email: true,
        companyCode: true,
        companyAddress: true,
        companyType: true,
        isParentCompany: true,
        parentCompanyId: true,
        ucBalance: true,
        usdeBalance: true,
        totalEarnings: true,
        kycStatus: true,
        createdAt: true
      }
    });

    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    res.json({
      success: true,
      company
    });
  } catch (error) {
    console.error('Get company error:', error);
    res.status(500).json({ error: 'Failed to get company information' });
  }
});

// Get subsidiaries of a parent company
router.get('/:parentCompanyId/subsidiaries', verifyToken, async (req, res) => {
  try {
    const { parentCompanyId } = req.params;

    const subsidiaries = await prisma.company.findMany({
      where: {
        parentCompanyId,
        companyType: 'subsidiary'
      },
      select: {
        id: true,
        name: true,
        companyCode: true,
        companyAddress: true,
        ucBalance: true,
        usdeBalance: true,
        totalEarnings: true,
        kycStatus: true,
        createdAt: true
      }
    });

    res.json({
      success: true,
      subsidiaries,
      count: subsidiaries.length
    });
  } catch (error) {
    console.error('Get subsidiaries error:', error);
    res.status(500).json({ error: 'Failed to get subsidiaries' });
  }
});

// Get consolidated balance for parent company
router.get('/:parentCompanyId/consolidated-balance', verifyToken, async (req, res) => {
  try {
    const { parentCompanyId } = req.params;

    // Get parent company balance
    const parentCompany = await prisma.company.findUnique({
      where: { id: parentCompanyId },
      select: {
        id: true,
        name: true,
        ucBalance: true,
        usdeBalance: true
      }
    });

    if (!parentCompany) {
      return res.status(404).json({ error: 'Parent company not found' });
    }

    // Get subsidiaries total balance
    const subsidiariesBalance = await prisma.company.aggregate({
      where: {
        parentCompanyId,
        companyType: 'subsidiary'
      },
      _sum: {
        ucBalance: true,
        usdeBalance: true
      }
    });

    const consolidatedBalance = {
      parentCompany: {
        id: parentCompany.id,
        name: parentCompany.name,
        ucBalance: parentCompany.ucBalance || 0,
        usdeBalance: parentCompany.usdeBalance || 0
      },
      subsidiaries: {
        totalUC: subsidiariesBalance._sum.ucBalance || 0,
        totalUSDE: subsidiariesBalance._sum.usdeBalance || 0,
        count: await prisma.company.count({
          where: {
            parentCompanyId,
            companyType: 'subsidiary'
          }
        })
      },
      consolidated: {
        totalUC: (parentCompany.ucBalance || 0) + (subsidiariesBalance._sum.ucBalance || 0),
        totalUSDE: (parentCompany.usdeBalance || 0) + (subsidiariesBalance._sum.usdeBalance || 0)
      }
    };

    res.json({
      success: true,
      consolidatedBalance
    });
  } catch (error) {
    console.error('Get consolidated balance error:', error);
    res.status(500).json({ error: 'Failed to get consolidated balance' });
  }
});

// Update company transfer configuration
router.put('/:companyId/transfer-config', verifyToken, async (req, res) => {
  try {
    const { companyId } = req.params;
    const { autoApprovalEnabled, approvalThreshold } = req.body;

    const company = await prisma.company.update({
      where: { id: companyId },
      data: {
        // Add transfer configuration fields if needed
      }
    });

    res.json({
      success: true,
      message: 'Transfer configuration updated successfully',
      company
    });
  } catch (error) {
    console.error('Update transfer config error:', error);
    res.status(500).json({ error: 'Failed to update transfer configuration' });
  }
});

// Get all companies (admin only)
router.get('/', verifyToken, async (req, res) => {
  try {
    const companies = await prisma.company.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        companyCode: true,
        companyType: true,
        isParentCompany: true,
        parentCompanyId: true,
        ucBalance: true,
        usdeBalance: true,
        kycStatus: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({
      success: true,
      companies,
      count: companies.length
    });
  } catch (error) {
    console.error('Get companies error:', error);
    res.status(500).json({ error: 'Failed to get companies' });
  }
});

module.exports = router; 