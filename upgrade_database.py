#!/usr/bin/env python3
"""
Database Upgrade Script for USDE Subsidiary Support
This script adds subsidiary management tables and demo@usde.com account
"""

import psycopg2
import hashlib
import os
from datetime import datetime

# Database connection parameters
DB_URL = "postgresql://postgres:SOzxfxdDXTsVjKQJLTyeGHeKnxlQHQLR@yamabiko.proxy.rlwy.net:58370/railway"

def hash_password(password):
    """Hash password using SHA-256"""
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
    
    print("🚀 Starting database upgrade for USDE subsidiary support...")
    
    # 1. Create companies table
    print("\n📋 Creating companies table...")
    companies_table_sql = """
    CREATE TABLE IF NOT EXISTS companies (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        company_code VARCHAR(50) UNIQUE NOT NULL,
        type VARCHAR(20) NOT NULL CHECK (type IN ('parent', 'subsidiary')),
        parent_company_id INTEGER REFERENCES companies(id),
        wallet_address VARCHAR(255),
        kyc_status VARCHAR(20) DEFAULT 'pending' CHECK (kyc_status IN ('pending', 'approved', 'rejected')),
        status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'inactive')),
        country VARCHAR(100),
        region VARCHAR(100),
        industry VARCHAR(100),
        registration_number VARCHAR(100),
        tax_id VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """
    
    if not execute_sql(conn, companies_table_sql):
        return False
    
    # 2. Create company_settings table
    print("\n⚙️ Creating company_settings table...")
    company_settings_table_sql = """
    CREATE TABLE IF NOT EXISTS company_settings (
        id SERIAL PRIMARY KEY,
        company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
        monthly_budget DECIMAL(20,2) DEFAULT 0,
        quarterly_budget DECIMAL(20,2) DEFAULT 0,
        daily_transfer_limit DECIMAL(20,2) DEFAULT 0,
        auto_approval_enabled BOOLEAN DEFAULT false,
        auto_approval_threshold DECIMAL(20,2) DEFAULT 0,
        allow_cross_border BOOLEAN DEFAULT false,
        approval_workflow JSONB,
        treasury_config JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """
    
    if not execute_sql(conn, company_settings_table_sql):
        return False
    
    # 3. Create company_balances table
    print("\n💰 Creating company_balances table...")
    company_balances_table_sql = """
    CREATE TABLE IF NOT EXISTS company_balances (
        id SERIAL PRIMARY KEY,
        company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
        token_type VARCHAR(20) NOT NULL,
        available_balance DECIMAL(20,8) DEFAULT 0,
        locked_balance DECIMAL(20,8) DEFAULT 0,
        total_balance DECIMAL(20,8) DEFAULT 0,
        last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(company_id, token_type)
    );
    """
    
    if not execute_sql(conn, company_balances_table_sql):
        return False
    
    # 4. Create internal_transfers table
    print("\n🔄 Creating internal_transfers table...")
    internal_transfers_table_sql = """
    CREATE TABLE IF NOT EXISTS internal_transfers (
        id SERIAL PRIMARY KEY,
        transfer_id VARCHAR(100) UNIQUE NOT NULL,
        source_company_id INTEGER NOT NULL REFERENCES companies(id),
        target_company_id INTEGER NOT NULL REFERENCES companies(id),
        token_type VARCHAR(20) NOT NULL,
        amount DECIMAL(20,8) NOT NULL,
        purpose TEXT,
        priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed', 'failed')),
        approval_required BOOLEAN DEFAULT true,
        approval_details JSONB,
        created_by INTEGER NOT NULL,
        approved_by INTEGER,
        approved_at TIMESTAMP,
        completed_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """
    
    if not execute_sql(conn, internal_transfers_table_sql):
        return False
    
    # 5. Create company_users table
    print("\n👥 Creating company_users table...")
    company_users_table_sql = """
    CREATE TABLE IF NOT EXISTS company_users (
        id SERIAL PRIMARY KEY,
        company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        role VARCHAR(50) NOT NULL,
        permissions JSONB,
        is_primary_contact BOOLEAN DEFAULT false,
        department VARCHAR(100),
        position VARCHAR(100),
        access_level VARCHAR(20) DEFAULT 'standard' CHECK (access_level IN ('standard', 'elevated', 'admin')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(company_id, user_id)
    );
    """
    
    if not execute_sql(conn, company_users_table_sql):
        return False
    
    # 6. Create audit_logs table for company operations
    print("\n📝 Creating audit_logs table...")
    audit_logs_table_sql = """
    CREATE TABLE IF NOT EXISTS audit_logs (
        id SERIAL PRIMARY KEY,
        company_id INTEGER REFERENCES companies(id),
        user_id INTEGER REFERENCES users(id),
        action VARCHAR(100) NOT NULL,
        resource_type VARCHAR(50),
        resource_id VARCHAR(100),
        details JSONB,
        ip_address INET,
        user_agent TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """
    
    if not execute_sql(conn, audit_logs_table_sql):
        return False
    
    # 7. Add new columns to users table
    print("\n🔧 Updating users table...")
    
    # Check if role column exists
    check_role_sql = """
    SELECT column_name FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'role';
    """
    
    with conn.cursor() as cursor:
        cursor.execute(check_role_sql)
        role_exists = cursor.fetchone()
    
    if not role_exists:
        add_role_sql = "ALTER TABLE users ADD COLUMN role VARCHAR(50) DEFAULT 'user';"
        if not execute_sql(conn, add_role_sql):
            return False
    
    # Check if company_id column exists
    check_company_sql = """
    SELECT column_name FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'company_id';
    """
    
    with conn.cursor() as cursor:
        cursor.execute(check_company_sql)
        company_exists = cursor.fetchone()
    
    if not company_exists:
        add_company_sql = "ALTER TABLE users ADD COLUMN company_id INTEGER REFERENCES companies(id);"
        if not execute_sql(conn, add_company_sql):
            return False
    
    # 8. Insert demo@usde.com account
    print("\n👤 Creating demo@usde.com account...")
    
    # First, create parent company
    parent_company_sql = """
    INSERT INTO companies (name, company_code, type, kyc_status, status, country, industry)
    VALUES ('USDE Demo Corporation', 'USDE001', 'parent', 'approved', 'active', 'United States', 'Financial Technology')
    ON CONFLICT (company_code) DO NOTHING
    RETURNING id;
    """
    
    parent_company_id = None
    with conn.cursor() as cursor:
        cursor.execute(parent_company_sql)
        result = cursor.fetchone()
        if result:
            parent_company_id = result[0]
        else:
            # Get existing parent company
            cursor.execute("SELECT id FROM companies WHERE company_code = 'USDE001'")
            parent_company_id = cursor.fetchone()[0]
        conn.commit()
    
    # Create demo user
    demo_user_sql = """
    INSERT INTO users (username, email, password, is_admin, status, role, company_id, created_at)
    VALUES ('demo@usde.com', 'demo@usde.com', %s, true, 1, 'parent_company_admin', %s, %s)
    ON CONFLICT (email) DO UPDATE SET
        username = EXCLUDED.username,
        password = EXCLUDED.password,
        is_admin = EXCLUDED.is_admin,
        role = EXCLUDED.role,
        company_id = EXCLUDED.company_id,
        updated_at = CURRENT_TIMESTAMP
    RETURNING id;
    """
    
    demo_password_hash = hash_password('demo123')
    demo_user_id = None
    with conn.cursor() as cursor:
        cursor.execute(demo_user_sql, (demo_password_hash, parent_company_id, datetime.now()))
        result = cursor.fetchone()
        if result:
            demo_user_id = result[0]
        conn.commit()
    
    # Add user to company_users table
    company_user_sql = """
    INSERT INTO company_users (company_id, user_id, role, permissions, is_primary_contact, access_level)
    VALUES (%s, %s, 'parent_company_admin', %s, true, 'admin')
    ON CONFLICT (company_id, user_id) DO UPDATE SET
        role = EXCLUDED.role,
        permissions = EXCLUDED.permissions,
        is_primary_contact = EXCLUDED.is_primary_contact,
        access_level = EXCLUDED.access_level,
        updated_at = CURRENT_TIMESTAMP;
    """
    
    permissions = {
        "manage_parent_company": True,
        "manage_subsidiaries": True,
        "create_subsidiaries": True,
        "delete_subsidiaries": True,
        "cross_company_transfers": True,
        "consolidated_reporting": True,
        "subsidiary_user_management": True,
        "financial_configuration": True
    }
    
    if not execute_sql(conn, company_user_sql, (parent_company_id, demo_user_id, permissions)):
        return False
    
    # 9. Create sample subsidiaries
    print("\n🏢 Creating sample subsidiaries...")
    
    subsidiaries_data = [
        {
            'name': 'USDE Asia Pacific',
            'code': 'USDE002',
            'country': 'Singapore',
            'region': 'Asia Pacific',
            'industry': 'Financial Technology'
        },
        {
            'name': 'USDE Europe',
            'code': 'USDE003',
            'country': 'Germany',
            'region': 'Europe',
            'industry': 'Financial Technology'
        }
    ]
    
    for subsidiary in subsidiaries_data:
        subsidiary_sql = """
        INSERT INTO companies (name, company_code, type, parent_company_id, kyc_status, status, country, region, industry)
        VALUES (%s, %s, 'subsidiary', %s, 'approved', 'active', %s, %s, %s)
        ON CONFLICT (company_code) DO NOTHING
        RETURNING id;
        """
        
        with conn.cursor() as cursor:
            cursor.execute(subsidiary_sql, (
                subsidiary['name'],
                subsidiary['code'],
                parent_company_id,
                subsidiary['country'],
                subsidiary['region'],
                subsidiary['industry']
            ))
            result = cursor.fetchone()
            if result:
                subsidiary_id = result[0]
                
                # Add company settings
                settings_sql = """
                INSERT INTO company_settings (company_id, monthly_budget, quarterly_budget, daily_transfer_limit, auto_approval_enabled, auto_approval_threshold)
                VALUES (%s, 1000000, 3000000, 100000, true, 50000)
                ON CONFLICT (company_id) DO NOTHING;
                """
                execute_sql(conn, settings_sql, (subsidiary_id,))
                
                # Add company balances
                balance_sql = """
                INSERT INTO company_balances (company_id, token_type, available_balance, total_balance)
                VALUES (%s, 'USDC', 2500000, 2500000), (%s, 'USDT', 1800000, 1800000)
                ON CONFLICT (company_id, token_type) DO NOTHING;
                """
                execute_sql(conn, balance_sql, (subsidiary_id, subsidiary_id))
        
        conn.commit()
    
    # 10. Add company settings for parent company
    print("\n⚙️ Adding parent company settings...")
    parent_settings_sql = """
    INSERT INTO company_settings (company_id, monthly_budget, quarterly_budget, daily_transfer_limit, auto_approval_enabled, auto_approval_threshold)
    VALUES (%s, 5000000, 15000000, 500000, true, 200000)
    ON CONFLICT (company_id) DO NOTHING;
    """
    
    if not execute_sql(conn, parent_settings_sql, (parent_company_id,)):
        return False
    
    # 11. Add parent company balances
    print("\n💰 Adding parent company balances...")
    parent_balance_sql = """
    INSERT INTO company_balances (company_id, token_type, available_balance, total_balance)
    VALUES (%s, 'USDC', 10000000, 10000000), (%s, 'USDT', 8000000, 8000000), (%s, 'USDE', 5000000, 5000000)
    ON CONFLICT (company_id, token_type) DO NOTHING;
    """
    
    if not execute_sql(conn, parent_balance_sql, (parent_company_id, parent_company_id, parent_company_id)):
        return False
    
    # 12. Create indexes for performance
    print("\n📊 Creating performance indexes...")
    indexes_sql = [
        "CREATE INDEX IF NOT EXISTS idx_companies_type ON companies(type);",
        "CREATE INDEX IF NOT EXISTS idx_companies_parent_id ON companies(parent_company_id);",
        "CREATE INDEX IF NOT EXISTS idx_company_users_company_id ON company_users(company_id);",
        "CREATE INDEX IF NOT EXISTS idx_company_users_user_id ON company_users(user_id);",
        "CREATE INDEX IF NOT EXISTS idx_internal_transfers_source ON internal_transfers(source_company_id);",
        "CREATE INDEX IF NOT EXISTS idx_internal_transfers_target ON internal_transfers(target_company_id);",
        "CREATE INDEX IF NOT EXISTS idx_internal_transfers_status ON internal_transfers(status);",
        "CREATE INDEX IF NOT EXISTS idx_company_balances_company_token ON company_balances(company_id, token_type);",
        "CREATE INDEX IF NOT EXISTS idx_audit_logs_company_id ON audit_logs(company_id);",
        "CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);"
    ]
    
    for index_sql in indexes_sql:
        if not execute_sql(conn, index_sql):
            print(f"Warning: Failed to create index: {index_sql}")
    
    print("\n🎉 Database upgrade completed successfully!")
    print(f"✅ Parent company created with ID: {parent_company_id}")
    print(f"✅ Demo user created with ID: {demo_user_id}")
    print("✅ Sample subsidiaries created")
    print("✅ All tables and indexes created")
    
    # Print connection info
    print(f"\n📋 Connection Information:")
    print(f"   Demo Account: demo@usde.com / demo123")
    print(f"   Parent Company: USDE Demo Corporation")
    print(f"   Subsidiaries: USDE Asia Pacific, USDE Europe")
    
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
