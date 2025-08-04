const express = require('express');
const multer = require('multer');
const { body, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { verifyToken } = require('./auth');

const router = express.Router();
const prisma = new PrismaClient();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only images and PDFs are allowed'), false);
    }
  }
});

// Submit KYC application
router.post('/submit', verifyToken, [
  // Company Information Validation
  body('companyNameEn').trim().isLength({ min: 2 }).withMessage('Company name is required'),
  body('companyRegNumber').trim().isLength({ min: 1 }).withMessage('Registration number is required'),
  body('countryOfReg').trim().isLength({ min: 2 }).withMessage('Country of registration is required'),
  body('regAddress').trim().isLength({ min: 10 }).withMessage('Registered address is required'),
  body('incorporationDate').isISO8601().withMessage('Valid incorporation date is required'),
  body('companyType').trim().isLength({ min: 2 }).withMessage('Company type is required'),
  
  // Compliance Validation
  body('isPEP').isBoolean().withMessage('PEP status must be boolean'),
  body('isSanctioned').isBoolean().withMessage('Sanction status must be boolean'),
  body('complianceAgreed').isBoolean().withMessage('Compliance agreement is required'),
  
  // UBO Validation
  body('ubos').isArray({ min: 1 }).withMessage('At least one UBO is required'),
  body('ubos.*.name').trim().isLength({ min: 2 }).withMessage('UBO name is required'),
  body('ubos.*.idNumber').trim().isLength({ min: 5 }).withMessage('UBO ID number is required'),
  body('ubos.*.nationality').trim().isLength({ min: 2 }).withMessage('UBO nationality is required'),
  body('ubos.*.address').trim().isLength({ min: 10 }).withMessage('UBO address is required'),
  body('ubos.*.ownershipPercentage').isFloat({ min: 0, max: 100 }).withMessage('Ownership percentage must be between 0-100'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      companyNameEn,
      companyRegNumber,
      countryOfReg,
      regAddress,
      incorporationDate,
      companyType,
      isPEP,
      isSanctioned,
      complianceAgreed,
      ubos
    } = req.body;

    // Check if compliance is agreed
    if (!complianceAgreed) {
      return res.status(400).json({ error: 'Compliance agreement is required' });
    }

    // Update company with KYC information
    const updatedCompany = await prisma.company.update({
      where: { id: req.company.companyId },
      data: {
        companyNameEn,
        companyRegNumber,
        countryOfReg,
        regAddress,
        incorporationDate: new Date(incorporationDate),
        companyType,
        isPEP,
        isSanctioned,
        complianceAgreed,
        kycStatus: 'pending'
      }
    });

    // Create UBO records
    const uboRecords = await Promise.all(
      ubos.map(ubo => 
        prisma.uBO.create({
          data: {
            companyId: req.company.companyId,
            name: ubo.name,
            idNumber: ubo.idNumber,
            nationality: ubo.nationality,
            address: ubo.address,
            ownershipPercentage: parseFloat(ubo.ownershipPercentage),
            addressProof: ubo.addressProof || null
          }
        })
      )
    );

    // Create KYC review record
    await prisma.kYCReview.create({
      data: {
        companyId: req.company.companyId,
        status: 'pending',
        notes: 'KYC application submitted'
      }
    });

    res.status(201).json({
      message: 'KYC application submitted successfully',
      status: 'pending',
      company: {
        id: updatedCompany.id,
        name: updatedCompany.name,
        kycStatus: updatedCompany.kycStatus
      },
      ubosCount: uboRecords.length
    });

  } catch (error) {
    console.error('KYC submission error:', error);
    res.status(500).json({ error: 'Failed to submit KYC application' });
  }
});

// Upload KYC documents
router.post('/upload-documents', verifyToken, upload.array('documents', 10), async (req, res) => {
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
      uploadedAt: new Date(),
      documentType: req.body.documentType || 'general'
    }));

    // Update company with KYC documents
    await prisma.company.update({
      where: { id: req.company.companyId },
      data: {
        kycDocuments: JSON.stringify(documentUrls),
        kycStatus: 'pending'
      }
    });

    res.json({
      message: 'KYC documents uploaded successfully',
      documentsCount: req.files.length,
      status: 'pending'
    });

  } catch (error) {
    console.error('KYC document upload error:', error);
    res.status(500).json({ error: 'Failed to upload KYC documents' });
  }
});

// Get KYC status and details
router.get('/status', verifyToken, async (req, res) => {
  try {
    const company = await prisma.company.findUnique({
      where: { id: req.company.companyId },
      include: {
        ubos: true,
        kycReviews: {
          orderBy: { reviewedAt: 'desc' },
          take: 1
        }
      }
    });

    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    const documents = company.kycDocuments ? JSON.parse(company.kycDocuments) : [];
    const latestReview = company.kycReviews[0];

    res.json({
      status: company.kycStatus,
      companyInfo: {
        companyNameEn: company.companyNameEn,
        companyRegNumber: company.companyRegNumber,
        countryOfReg: company.countryOfReg,
        regAddress: company.regAddress,
        incorporationDate: company.incorporationDate,
        companyType: company.companyType
      },
      compliance: {
        isPEP: company.isPEP,
        isSanctioned: company.isSanctioned,
        complianceAgreed: company.complianceAgreed
      },
      ubos: company.ubos,
      documentsCount: documents.length,
      documents: documents,
      latestReview: latestReview,
      submittedAt: company.createdAt
    });

  } catch (error) {
    console.error('KYC status error:', error);
    res.status(500).json({ error: 'Failed to fetch KYC status' });
  }
});

// Update UBO information
router.put('/ubo/:uboId', verifyToken, [
  body('name').optional().trim().isLength({ min: 2 }).withMessage('UBO name must be at least 2 characters'),
  body('idNumber').optional().trim().isLength({ min: 5 }).withMessage('ID number must be at least 5 characters'),
  body('nationality').optional().trim().isLength({ min: 2 }).withMessage('Nationality must be at least 2 characters'),
  body('address').optional().trim().isLength({ min: 10 }).withMessage('Address must be at least 10 characters'),
  body('ownershipPercentage').optional().isFloat({ min: 0, max: 100 }).withMessage('Ownership percentage must be between 0-100'),
  body('addressProof').optional().isString().withMessage('Address proof must be a string')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { uboId } = req.params;
    const updateData = req.body;

    // Verify UBO belongs to the company
    const ubo = await prisma.uBO.findFirst({
      where: {
        id: uboId,
        companyId: req.company.companyId
      }
    });

    if (!ubo) {
      return res.status(404).json({ error: 'UBO not found' });
    }

    const updatedUBO = await prisma.uBO.update({
      where: { id: uboId },
      data: updateData
    });

    res.json({
      message: 'UBO information updated successfully',
      ubo: updatedUBO
    });

  } catch (error) {
    console.error('UBO update error:', error);
    res.status(500).json({ error: 'Failed to update UBO information' });
  }
});

// Add new UBO
router.post('/ubo', verifyToken, [
  body('name').trim().isLength({ min: 2 }).withMessage('UBO name is required'),
  body('idNumber').trim().isLength({ min: 5 }).withMessage('ID number is required'),
  body('nationality').trim().isLength({ min: 2 }).withMessage('Nationality is required'),
  body('address').trim().isLength({ min: 10 }).withMessage('Address is required'),
  body('ownershipPercentage').isFloat({ min: 0, max: 100 }).withMessage('Ownership percentage must be between 0-100'),
  body('addressProof').optional().isString().withMessage('Address proof must be a string')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const ubo = await prisma.uBO.create({
      data: {
        companyId: req.company.companyId,
        name: req.body.name,
        idNumber: req.body.idNumber,
        nationality: req.body.nationality,
        address: req.body.address,
        ownershipPercentage: parseFloat(req.body.ownershipPercentage),
        addressProof: req.body.addressProof || null
      }
    });

    res.status(201).json({
      message: 'UBO added successfully',
      ubo
    });

  } catch (error) {
    console.error('UBO creation error:', error);
    res.status(500).json({ error: 'Failed to add UBO' });
  }
});

// Delete UBO
router.delete('/ubo/:uboId', verifyToken, async (req, res) => {
  try {
    const { uboId } = req.params;

    // Verify UBO belongs to the company
    const ubo = await prisma.uBO.findFirst({
      where: {
        id: uboId,
        companyId: req.company.companyId
      }
    });

    if (!ubo) {
      return res.status(404).json({ error: 'UBO not found' });
    }

    await prisma.uBO.delete({
      where: { id: uboId }
    });

    res.json({
      message: 'UBO deleted successfully'
    });

  } catch (error) {
    console.error('UBO deletion error:', error);
    res.status(500).json({ error: 'Failed to delete UBO' });
  }
});

// Admin: Get all KYC applications
router.get('/admin/applications', verifyToken, async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    
    const where = {};
    if (status && status !== 'all') {
      where.kycStatus = status;
    }

    const companies = await prisma.company.findMany({
      where,
      include: {
        ubos: true,
        kycReviews: {
          orderBy: { reviewedAt: 'desc' },
          take: 1
        }
      },
      skip: (parseInt(page) - 1) * parseInt(limit),
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' }
    });

    const total = await prisma.company.count({ where });

    res.json({
      companies,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Admin KYC applications error:', error);
    res.status(500).json({ error: 'Failed to fetch KYC applications' });
  }
});

// Admin: Review KYC application
router.put('/admin/review/:companyId', verifyToken, [
  body('status').isIn(['approved', 'rejected', 'request_info']).withMessage('Invalid status'),
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
    // For this prototype, we'll allow any authenticated user to review KYC

    const company = await prisma.company.update({
      where: { id: companyId },
      data: {
        kycStatus: status
      }
    });

    // Create review record
    await prisma.kYCReview.create({
      data: {
        companyId,
        reviewerId: req.company.companyId,
        status,
        notes
      }
    });

    res.json({
      message: `KYC application ${status}`,
      company: {
        id: company.id,
        name: company.name,
        kycStatus: company.kycStatus
      }
    });

  } catch (error) {
    console.error('KYC review error:', error);
    res.status(500).json({ error: 'Failed to review KYC application' });
  }
});

module.exports = router; 