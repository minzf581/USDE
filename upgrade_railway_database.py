#!/usr/bin/env python3
"""
Railway Database Upgrade Script for USDE Subsidiary Support
This script upgrades the existing Railway database to support subsidiaries
"""

import psycopg2
import hashlib
import os
from datetime import datetime

# Database connection parameters
DB_URL = "postgresql://postgres:SOzxfxdDXTsVjKQJLTyeGHeKnxlQHQLR@yamabiko.proxy.rlwy.net:58370/railway"

def hash_password(password):
    """Hash password using bcrypt-like format"""
    return hashlib.sha256(password.encode()).hexdigest()

def create_connection():
    """Create database connection"""
    try:
        conn = psycopg2.connect(DB_URL)
        return conn
    except Exception as e:
        print(f"Error connecting to database: {e}")
        return None

def execute_sql(conn, sql, params=None):
    """Execute SQL with error handling"""
    try:
        with conn.cursor() as cursor:
            cursor.execute(sql, params)
            conn.commit()
            print(f"✓ Executed: {sql[:50]}...")
            return True
    except Exception as e:
        print(f"✗ Error executing SQL: {e}")
        print(f"SQL: {sql}")
        conn.rollback()
        return False

def upgrade_database():
    """Main upgrade function"""
    conn = create_connection()
    if not conn:
        print("Failed to create database connection")
        return False
    
    print("🚀 Starting Railway database upgrade for USDE subsidiary support...")
    
    # 1. Add new columns to Company table
    print("\n🔧 Updating Company table...")
    
    # Check if parentCompanyId column exists
    check_parent_sql = """
    SELECT column_name FROM information_schema.columns 
    WHERE table_name = 'Company' AND column_name = 'parentCompanyId';
    """
    
    with conn.cursor() as cursor:
        cursor.execute(check_parent_sql)
        parent_exists = cursor.fetchone()
    
    if not parent_exists:
        add_parent_sql = 'ALTER TABLE "Company" ADD COLUMN "parentCompanyId" text REFERENCES "Company"(id);'
        if not execute_sql(conn, add_parent_sql):
            return False
    
    # Check if companyCode column exists
    check_code_sql = """
    SELECT column_name FROM information_schema.columns 
    WHERE table_name = 'Company' AND column_name = 'companyCode';
    """
    
    with conn.cursor() as cursor:
        cursor.execute(check_code_sql)
        code_exists = cursor.fetchone()
    
    if not code_exists:
        add_code_sql = 'ALTER TABLE "Company" ADD COLUMN "companyCode" text;'
        if not execute_sql(conn, add_code_sql):
            return False
    
    # Check if walletAddress column exists
    check_wallet_sql = """
    SELECT column_name FROM information_schema.columns 
    WHERE table_name = 'Company' AND column_name = 'walletAddress';
    """
    
    with conn.cursor() as cursor:
        cursor.execute(check_wallet_sql)
        wallet_exists = cursor.fetchone()
    
    if not wallet_exists:
        add_wallet_sql = 'ALTER TABLE "Company" ADD COLUMN "walletAddress" text;'
        if not execute_sql(conn, add_wallet_sql):
            return False
    
    # Check if isParentCompany column exists
    check_parent_flag_sql = """
    SELECT column_name FROM information_schema.columns 
    WHERE table_name = 'Company' AND column_name = 'isParentCompany';
    """
    
    with conn.cursor() as cursor:
        cursor.execute(check_parent_flag_sql)
        parent_flag_exists = cursor.fetchone()
    
    if not parent_flag_exists:
        add_parent_flag_sql = 'ALTER TABLE "Company" ADD COLUMN "isParentCompany" boolean DEFAULT false;'
        if not execute_sql(conn, add_parent_flag_sql):
            return False
    
    # 2. Create CompanySettings table
    print("\n⚙️ Creating CompanySettings table...")
    company_settings_table_sql = """
    CREATE TABLE IF NOT EXISTS "CompanySettings" (
        "id" text PRIMARY KEY,
        "companyId" text NOT NULL REFERENCES "Company"(id) ON DELETE CASCADE,
        "monthlyBudget" double precision DEFAULT 0,
        "quarterlyBudget" double precision DEFAULT 0,
        "dailyTransferLimit" double precision DEFAULT 0,
        "autoApprovalEnabled" boolean DEFAULT false,
        "autoApprovalThreshold" double precision DEFAULT 0,
        "allowCrossBorder" boolean DEFAULT false,
        "approvalWorkflow" jsonb,
        "treasuryConfig" jsonb,
        "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP
    );
    """
    
    if not execute_sql(conn, company_settings_table_sql):
        return False
    
    # 3. Create CompanyBalances table
    print("\n💰 Creating CompanyBalances table...")
    company_balances_table_sql = """
    CREATE TABLE IF NOT EXISTS "CompanyBalances" (
        "id" text PRIMARY KEY,
        "companyId" text NOT NULL REFERENCES "Company"(id) ON DELETE CASCADE,
        "tokenType" text NOT NULL,
        "availableBalance" double precision DEFAULT 0,
        "lockedBalance" double precision DEFAULT 0,
        "totalBalance" double precision DEFAULT 0,
        "lastUpdated" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
        UNIQUE("companyId", "tokenType")
    );
    """
    
    if not execute_sql(conn, company_balances_table_sql):
        return False
    
    # 4. Create InternalTransfer table
    print("\n🔄 Creating InternalTransfer table...")
    internal_transfer_table_sql = """
    CREATE TABLE IF NOT EXISTS "InternalTransfer" (
        "id" text PRIMARY KEY,
        "transferId" text UNIQUE NOT NULL,
        "sourceCompanyId" text NOT NULL REFERENCES "Company"(id),
        "targetCompanyId" text NOT NULL REFERENCES "Company"(id),
        "tokenType" text NOT NULL,
        "amount" double precision NOT NULL,
        "purpose" text,
        "priority" text DEFAULT 'normal' CHECK ("priority" IN ('low', 'normal', 'high', 'urgent')),
        "status" text DEFAULT 'pending' CHECK ("status" IN ('pending', 'approved', 'rejected', 'completed', 'failed')),
        "approvalRequired" boolean DEFAULT true,
        "approvalDetails" jsonb,
        "createdBy" text NOT NULL,
        "approvedBy" text,
        "approvedAt" timestamp without time zone,
        "completedAt" timestamp without time zone,
        "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP
    );
    """
    
    if not execute_sql(conn, internal_transfer_table_sql):
        return False
    
    # 5. Create CompanyUser table
    print("\n👥 Creating CompanyUser table...")
    company_user_table_sql = """
    CREATE TABLE IF NOT EXISTS "CompanyUser" (
        "id" text PRIMARY KEY,
        "companyId" text NOT NULL REFERENCES "Company"(id) ON DELETE CASCADE,
        "userId" text NOT NULL REFERENCES "Company"(id) ON DELETE CASCADE,
        "role" text NOT NULL,
        "permissions" jsonb,
        "isPrimaryContact" boolean DEFAULT false,
        "department" text,
        "position" text,
        "accessLevel" text DEFAULT 'standard' CHECK ("accessLevel" IN ('standard', 'elevated', 'admin')),
        "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
        UNIQUE("companyId", "userId")
    );
    """
    
    if not execute_sql(conn, company_user_table_sql):
        return False
    
    # 6. Update existing demo@usde.com account
    print("\n👤 Updating demo@usde.com account...")
    
    # Update demo@usde.com to be parent company admin
    update_demo_sql = """
    UPDATE "Company" 
    SET "role" = 'parent_company_admin',
        "companyCode" = 'USDE001',
        "isParentCompany" = true,
        "walletAddress" = '0x1234567890abcdef',
        "companyType" = 'parent'
    WHERE "email" = 'demo@usde.com';
    """
    
    if not execute_sql(conn, update_demo_sql):
        return False
    
    # 7. Create parent company settings for demo@usde.com
    print("\n⚙️ Creating parent company settings...")
    
    # Get demo company ID
    with conn.cursor() as cursor:
        cursor.execute('SELECT "id" FROM "Company" WHERE "email" = %s', ('demo@usde.com',))
        demo_company_id = cursor.fetchone()
        if demo_company_id:
            demo_company_id = demo_company_id[0]
        else:
            print("❌ Could not find demo@usde.com company")
            return False
    
    # Insert parent company settings
    parent_settings_sql = """
    INSERT INTO "CompanySettings" ("id", "companyId", "monthlyBudget", "quarterlyBudget", "dailyTransferLimit", "autoApprovalEnabled", "autoApprovalThreshold")
    VALUES (%s, %s, 5000000, 15000000, 500000, true, 200000);
    """
    
    if not execute_sql(conn, parent_settings_sql, (f"settings_{demo_company_id}", demo_company_id)):
        return False
    
    # 8. Create sample subsidiaries
    print("\n🏢 Creating sample subsidiaries...")
    
    subsidiaries_data = [
        {
            'id': 'sub_asia_001',
            'name': 'USDE Asia Pacific',
            'email': 'asia@usde.com',
            'password': hash_password('sub123'),
            'companyCode': 'USDE002',
            'country': 'Singapore',
            'region': 'Asia Pacific',
            'industry': 'Financial Technology'
        },
        {
            'id': 'sub_europe_001',
            'name': 'USDE Europe',
            'email': 'europe@usde.com',
            'password': hash_password('sub123'),
            'companyCode': 'USDE003',
            'country': 'Germany',
            'region': 'Europe',
            'industry': 'Financial Technology'
        }
    ]
    
    for subsidiary in subsidiaries_data:
        # Create subsidiary company
        subsidiary_sql = """
        INSERT INTO "Company" ("id", "name", "email", "password", "role", "kycStatus", "isActive", "companyCode", "isParentCompany", "companyType", "ucBalance", "usdeBalance", "totalEarnings", "createdAt", "updatedAt")
        VALUES (%s, %s, %s, %s, 'subsidiary_admin', 'approved', true, %s, false, 'subsidiary', 2500000, 1800000, 0, %s, %s)
        ON CONFLICT ("email") DO NOTHING
        RETURNING "id";
        """
        
        with conn.cursor() as cursor:
            cursor.execute(subsidiary_sql, (
                subsidiary['id'],
                subsidiary['name'],
                subsidiary['email'],
                subsidiary['password'],
                subsidiary['companyCode'],
                datetime.now(),
                datetime.now()
            ))
            result = cursor.fetchone()
            if result:
                subsidiary_id = result[0]
                
                # Add company settings
                settings_sql = """
                INSERT INTO "CompanySettings" ("id", "companyId", "monthlyBudget", "quarterlyBudget", "dailyTransferLimit", "autoApprovalEnabled", "autoApprovalThreshold")
                VALUES (%s, %s, 1000000, 3000000, 100000, true, 50000);
                """
                execute_sql(conn, settings_sql, (f"settings_{subsidiary_id}", subsidiary_id))
                
                # Add company balances
                balance_sql = """
                INSERT INTO "CompanyBalances" ("id", "companyId", "tokenType", "availableBalance", "totalBalance")
                VALUES (%s, %s, 'USDC', 2500000, 2500000), (%s, %s, 'USDT', 1800000, 1800000);
                """
                execute_sql(conn, balance_sql, (f"balance_{subsidiary_id}_usdc", subsidiary_id, f"balance_{subsidiary_id}_usdt", subsidiary_id))
        
        conn.commit()
    
    # 9. Create indexes for performance
    print("\n📊 Creating performance indexes...")
    indexes_sql = [
        'CREATE INDEX IF NOT EXISTS "idx_company_parentCompanyId" ON "Company"("parentCompanyId");',
        'CREATE INDEX IF NOT EXISTS "idx_company_companyCode" ON "Company"("companyCode");',
        'CREATE INDEX IF NOT EXISTS "idx_company_isParentCompany" ON "Company"("isParentCompany");',
        'CREATE INDEX IF NOT EXISTS "idx_company_user_companyId" ON "CompanyUser"("companyId");',
        'CREATE INDEX IF NOT EXISTS "idx_company_user_userId" ON "CompanyUser"("userId");',
        'CREATE INDEX IF NOT EXISTS "idx_internal_transfer_source" ON "InternalTransfer"("sourceCompanyId");',
        'CREATE INDEX IF NOT EXISTS "idx_internal_transfer_target" ON "InternalTransfer"("targetCompanyId");',
        'CREATE INDEX IF NOT EXISTS "idx_internal_transfer_status" ON "InternalTransfer"("status");',
        'CREATE INDEX IF NOT EXISTS "idx_company_balances_company_token" ON "CompanyBalances"("companyId", "tokenType");',
        'CREATE INDEX IF NOT EXISTS "idx_company_settings_companyId" ON "CompanySettings"("companyId");'
    ]
    
    for index_sql in indexes_sql:
        if not execute_sql(conn, index_sql):
            print(f"Warning: Failed to create index: {index_sql}")
    
    # 10. Verify the upgrade
    print("\n🔍 Verifying upgrade...")
    
    with conn.cursor() as cursor:
        # Check companies
        cursor.execute('SELECT COUNT(*) FROM "Company" WHERE "isParentCompany" = true')
        parent_count = cursor.fetchone()[0]
        print(f"✅ Parent companies: {parent_count}")
        
        cursor.execute('SELECT COUNT(*) FROM "Company" WHERE "isParentCompany" = false AND "role" = %s', ('subsidiary_admin',))
        subsidiary_count = cursor.fetchone()[0]
        print(f"✅ Subsidiary companies: {subsidiary_count}")
        
        # Check demo account
        cursor.execute('SELECT "name", "role", "companyCode" FROM "Company" WHERE "email" = %s', ('demo@usde.com',))
        demo_info = cursor.fetchone()
        if demo_info:
            print(f"✅ Demo account: {demo_info[0]} - Role: {demo_info[1]} - Code: {demo_info[2]}")
    
    print("\n🎉 Database upgrade completed successfully!")
    print(f"\n📋 Connection Information:")
    print(f"   Demo Account: demo@usde.com / demo123")
    print(f"   Parent Company: USDE Demo Corporation")
    print(f"   Subsidiaries: USDE Asia Pacific, USDE Europe")
    print(f"   Database: {DB_URL}")
    
    conn.close()
    return True

if __name__ == "__main__":
    try:
        success = upgrade_database()
        if success:
            print("\n🚀 Database upgrade completed successfully!")
            print("You can now use demo@usde.com with password 'demo123' to access the system.")
        else:
            print("\n❌ Database upgrade failed!")
            exit(1)
    except Exception as e:
        print(f"\n💥 Unexpected error: {e}")
        exit(1)
