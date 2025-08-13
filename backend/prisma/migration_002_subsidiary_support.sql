-- Migration 002: Add Subsidiary Support
-- This migration adds support for multi-company structure with parent-subsidiary relationships

-- Add new fields to Company table
ALTER TABLE Company ADD COLUMN companyCode TEXT;
ALTER TABLE Company ADD COLUMN companyAddress TEXT;
ALTER TABLE Company ADD COLUMN parentCompanyId TEXT;
ALTER TABLE Company ADD COLUMN isParentCompany BOOLEAN DEFAULT FALSE;
ALTER TABLE Company ADD COLUMN companyType TEXT;

-- Rename existing companyType field to avoid conflict
ALTER TABLE Company RENAME COLUMN companyType TO companyTypeKYC;

-- Create indexes for better performance
CREATE INDEX idx_company_parentCompanyId ON Company(parentCompanyId);
CREATE INDEX idx_company_companyCode ON Company(companyCode);
CREATE INDEX idx_company_companyType ON Company(companyType);

-- Create PaymentRequest table for payment workflow
CREATE TABLE PaymentRequest (
  id TEXT PRIMARY KEY,
  companyId TEXT NOT NULL,
  type TEXT NOT NULL, -- 'external', 'internal_transfer'
  tokenAddress TEXT NOT NULL,
  amount REAL NOT NULL,
  recipient TEXT, -- For external payments
  targetCompanyId TEXT, -- For internal transfers
  purpose TEXT NOT NULL,
  status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  requestedBy TEXT NOT NULL,
  requestedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  approvedBy TEXT,
  approvedAt DATETIME,
  rejectedBy TEXT,
  rejectedAt DATETIME,
  rejectionReason TEXT,
  FOREIGN KEY (companyId) REFERENCES Company(id),
  FOREIGN KEY (targetCompanyId) REFERENCES Company(id),
  FOREIGN KEY (requestedBy) REFERENCES Company(id),
  FOREIGN KEY (approvedBy) REFERENCES Company(id),
  FOREIGN KEY (rejectedBy) REFERENCES Company(id)
);

-- Create indexes for PaymentRequest
CREATE INDEX idx_paymentrequest_companyId ON PaymentRequest(companyId);
CREATE INDEX idx_paymentrequest_status ON PaymentRequest(status);
CREATE INDEX idx_paymentrequest_type ON PaymentRequest(type);
CREATE INDEX idx_paymentrequest_targetCompanyId ON PaymentRequest(targetCompanyId);

-- Update existing companies to be parent companies by default
UPDATE Company SET 
  companyType = 'parent',
  isParentCompany = TRUE,
  companyCode = 'COMP' || substr(id, 1, 8)
WHERE companyType IS NULL;

-- Create sample parent company if none exists
INSERT OR IGNORE INTO Company (
  id, name, email, password, role, kycStatus, isActive,
  companyCode, companyAddress, companyType, isParentCompany,
  ucBalance, usdeBalance, totalEarnings
) VALUES (
  'parent_company_001',
  'Sample Parent Company',
  'parent@company.com',
  'temp_password_hash',
  'enterprise_admin',
  'approved',
  1,
  'PARENT001',
  '0x1234567890123456789012345678901234567890',
  'parent',
  1,
  0.0,
  0.0,
  0.0
);

-- Create sample subsidiary if none exists
INSERT OR IGNORE INTO Company (
  id, name, email, password, role, kycStatus, isActive,
  companyCode, companyAddress, companyType, isParentCompany,
  parentCompanyId, ucBalance, usdeBalance, totalEarnings
) VALUES (
  'subsidiary_company_001',
  'Sample Subsidiary Company',
  'subsidiary@company.com',
  'temp_password_hash',
  'enterprise_admin',
  'pending',
  1,
  'SUB001',
  '0x0987654321098765432109876543210987654321',
  'subsidiary',
  0,
  'parent_company_001',
  0.0,
  0.0,
  0.0
);

-- Create TreasurySettings for sample companies if they don't exist
INSERT OR IGNORE INTO TreasurySettings (
  id, companyId, monthlyBudget, quarterlyBudget, approvalThreshold,
  autoApprovalEnabled, riskFlagThreshold, approvalWorkflow
) VALUES (
  'ts_parent_001',
  'parent_company_001',
  1000000.0,
  3000000.0,
  1000.0,
  0,
  5000.0,
  'single'
);

INSERT OR IGNORE INTO TreasurySettings (
  id, companyId, monthlyBudget, quarterlyBudget, approvalThreshold,
  autoApprovalEnabled, riskFlagThreshold, approvalWorkflow
) VALUES (
  'ts_subsidiary_001',
  'subsidiary_company_001',
  500000.0,
  1500000.0,
  500.0,
  0,
  2500.0,
  'single'
);

