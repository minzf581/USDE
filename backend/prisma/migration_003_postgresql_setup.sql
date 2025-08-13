-- Migration 003: PostgreSQL Setup
-- This migration ensures proper PostgreSQL compatibility

-- Enable UUID extension if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Update existing tables to use proper PostgreSQL types
-- Note: This will be handled by Prisma db push

-- Ensure proper indexing for performance
CREATE INDEX IF NOT EXISTS idx_company_email ON "Company"(email);
CREATE INDEX IF NOT EXISTS idx_user_email ON "User"(email);
CREATE INDEX IF NOT EXISTS idx_payment_company_id ON "Payment"(company_id);
CREATE INDEX IF NOT EXISTS idx_withdrawal_company_id ON "Withdrawal"(company_id);
CREATE INDEX IF NOT EXISTS idx_kyc_company_id ON "KYC"(company_id);

-- Add any additional PostgreSQL-specific optimizations here
