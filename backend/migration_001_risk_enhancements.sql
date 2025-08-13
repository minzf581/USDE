-- migration_001_risk_enhancements.sql
-- 为现有表添加风控相关字段

-- 为companies表添加风控字段
ALTER TABLE companies ADD COLUMN IF NOT EXISTS risk_rating VARCHAR(10) DEFAULT 'medium';
ALTER TABLE companies ADD COLUMN IF NOT EXISTS daily_limit DECIMAL(18,8) DEFAULT 10000.00;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS monthly_limit DECIMAL(18,8) DEFAULT 100000.00;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS kyc_level INTEGER DEFAULT 1;

-- 为deposits表添加增强字段
ALTER TABLE deposits ADD COLUMN IF NOT EXISTS fee_rate DECIMAL(6,4) DEFAULT 0.0025;
ALTER TABLE deposits ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50) DEFAULT 'card';
ALTER TABLE deposits ADD COLUMN IF NOT EXISTS failure_reason TEXT;
ALTER TABLE deposits ADD COLUMN IF NOT EXISTS stripe_payment_intent_id VARCHAR(255);
ALTER TABLE deposits ADD COLUMN IF NOT EXISTS blockchain_tx_hash VARCHAR(255);
ALTER TABLE deposits ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP;
ALTER TABLE deposits ADD COLUMN IF NOT EXISTS fee DECIMAL(18,8) DEFAULT 0;
ALTER TABLE deposits ADD COLUMN IF NOT EXISTS usde_amount DECIMAL(18,8) DEFAULT 0;
ALTER TABLE deposits ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP;

-- 为usde_transactions表添加区块链相关字段
ALTER TABLE usde_transactions ADD COLUMN IF NOT EXISTS blockchain_tx_hash VARCHAR(255);
ALTER TABLE usde_transactions ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'confirmed';
ALTER TABLE usde_transactions ADD COLUMN IF NOT EXISTS block_number BIGINT;

-- 创建风控评估表
CREATE TABLE IF NOT EXISTS risk_assessments (
    id VARCHAR(32) PRIMARY KEY,
    companyId VARCHAR(32) NOT NULL,
    assessment_type VARCHAR(20) NOT NULL,
    amount DECIMAL(18,8) NOT NULL,
    risk_score INTEGER NOT NULL DEFAULT 0,
    risk_factors TEXT,
    decision VARCHAR(20) NOT NULL DEFAULT 'approved',
    decision_reason TEXT,
    assessor VARCHAR(50) DEFAULT 'system',
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (companyId) REFERENCES companies(id),
    INDEX idx_risk_company_type (companyId, assessment_type),
    INDEX idx_risk_decision (decision),
    INDEX idx_risk_created_at (createdAt)
);

-- 创建性能优化索引
CREATE INDEX IF NOT EXISTS idx_companies_kyc_status ON companies(kycStatus);
CREATE INDEX IF NOT EXISTS idx_companies_risk_rating ON companies(risk_rating);
CREATE INDEX IF NOT EXISTS idx_deposits_company_status ON deposits(companyId, status);
CREATE INDEX IF NOT EXISTS idx_deposits_created_at ON deposits(createdAt);
CREATE INDEX IF NOT EXISTS idx_usde_transactions_company_type ON usde_transactions(companyId, type);
CREATE INDEX IF NOT EXISTS idx_usde_transactions_status ON usde_transactions(status);



