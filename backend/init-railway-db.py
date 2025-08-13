#!/usr/bin/env python3
import psycopg2
import bcrypt
import uuid
from datetime import datetime
import os

# Railway数据库连接配置
RAILWAY_DB_URL = "postgresql://postgres:SOzxfxdDXTsVjKQJLTyeGHeKnxlQHQLR@yamabiko.proxy.rlwy.net:58370/railway"

def init_railway_database():
    """初始化Railway数据库"""
    print("🚀 开始初始化Railway数据库...")
    
    try:
        # 连接数据库
        conn = psycopg2.connect(RAILWAY_DB_URL)
        cursor = conn.cursor()
        
        print("✅ 成功连接到Railway数据库")
        
        # 创建Company表
        print("📊 创建Company表...")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS "Company" (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                type TEXT DEFAULT 'company',
                role TEXT DEFAULT 'enterprise_user',
                status TEXT DEFAULT 'active',
                "kycStatus" TEXT DEFAULT 'pending',
                balance DOUBLE PRECISION DEFAULT 0,
                "usdeBalance" DOUBLE PRECISION DEFAULT 0,
                "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # 创建Enterprise表
        print("📊 创建Enterprise表...")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS "Enterprise" (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                "adminId" TEXT UNIQUE NOT NULL,
                "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT "Enterprise_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "Company"(id)
            )
        """)
        
        # 创建Role表
        print("📊 创建Role表...")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS "Role" (
                id TEXT PRIMARY KEY,
                name TEXT UNIQUE NOT NULL,
                description TEXT,
                "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # 创建Permission表
        print("📊 创建Permission表...")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS "Permission" (
                id TEXT PRIMARY KEY,
                name TEXT UNIQUE NOT NULL,
                description TEXT,
                "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # 创建UserRole表
        print("📊 创建UserRole表...")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS "UserRole" (
                id TEXT PRIMARY KEY,
                "userId" TEXT NOT NULL,
                "roleId" TEXT NOT NULL,
                "companyId" TEXT,
                "assignedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # 创建TreasurySettings表
        print("📊 创建TreasurySettings表...")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS "TreasurySettings" (
                id TEXT PRIMARY KEY,
                "companyId" TEXT UNIQUE NOT NULL,
                "monthlyBudget" DOUBLE PRECISION DEFAULT 0,
                "quarterlyBudget" DOUBLE PRECISION DEFAULT 0,
                "approvalThreshold" DOUBLE PRECISION DEFAULT 1000,
                "autoApprovalEnabled" BOOLEAN DEFAULT false,
                "riskFlagThreshold" DOUBLE PRECISION DEFAULT 5000,
                "approvalWorkflow" TEXT DEFAULT 'single',
                "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # 创建Payment表
        print("📊 创建Payment表...")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS "Payment" (
                id TEXT PRIMARY KEY,
                company_id TEXT NOT NULL,
                amount DOUBLE PRECISION NOT NULL,
                currency TEXT DEFAULT 'USD',
                status TEXT DEFAULT 'pending',
                type TEXT,
                description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # 创建Stake表
        print("📊 创建Stake表...")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS "Stake" (
                id TEXT PRIMARY KEY,
                company_id TEXT NOT NULL,
                amount DOUBLE PRECISION NOT NULL,
                apy DOUBLE PRECISION DEFAULT 0.05,
                status TEXT DEFAULT 'active',
                start_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                end_date TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # 创建Deposit表
        print("📊 创建Deposit表...")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS "Deposit" (
                id TEXT PRIMARY KEY,
                company_id TEXT NOT NULL,
                amount DOUBLE PRECISION NOT NULL,
                currency TEXT DEFAULT 'USD',
                status TEXT DEFAULT 'pending',
                stripe_payment_intent_id TEXT,
                usde_minted DOUBLE PRECISION DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # 创建Withdrawal表
        print("📊 创建Withdrawal表...")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS "Withdrawal" (
                id TEXT PRIMARY KEY,
                company_id TEXT NOT NULL,
                amount DOUBLE PRECISION NOT NULL,
                currency TEXT DEFAULT 'USD',
                status TEXT DEFAULT 'pending',
                bank_account_id TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # 创建KYC表
        print("📊 创建KYC表...")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS "KYC" (
                id TEXT PRIMARY KEY,
                company_id TEXT NOT NULL,
                status TEXT DEFAULT 'pending',
                documents TEXT,
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # 创建BankAccount表
        print("📊 创建BankAccount表...")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS "BankAccount" (
                id TEXT PRIMARY KEY,
                company_id TEXT NOT NULL,
                account_number TEXT NOT NULL,
                routing_number TEXT NOT NULL,
                bank_name TEXT NOT NULL,
                account_type TEXT DEFAULT 'checking',
                status TEXT DEFAULT 'active',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        print("✅ 所有表创建完成")
        
        # 插入基础角色
        print("📝 插入基础角色...")
        cursor.execute("""
            INSERT INTO "Role" (id, name, description, "createdAt", "updatedAt") VALUES 
            ('role_admin', 'ADMIN', 'Administrator with full access', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
            ('role_enterprise_admin', 'ENTERPRISE_ADMIN', 'Enterprise administrator', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
            ('role_enterprise_user', 'ENTERPRISE_USER', 'Enterprise user', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
            ('role_supervisor', 'SUPERVISOR', 'Supervisor with approval access', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
            ('role_operator', 'OPERATOR', 'Operator with basic access', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
            ('role_observer', 'OBSERVER', 'Observer with read-only access', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            ON CONFLICT (id) DO NOTHING
        """)
        
        # 创建管理员用户
        print("👤 创建管理员用户...")
        admin_id = str(uuid.uuid4())
        admin_password_hash = bcrypt.hashpw('admin123'.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        
        cursor.execute("""
            INSERT INTO "Company" (id, name, email, password, type, role, status, "kycStatus", balance, "usdeBalance", "createdAt", "updatedAt")
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            ON CONFLICT (email) DO NOTHING
        """, (
            admin_id,
            'System Administrator',
            'admin@usde.com',
            admin_password_hash,
            'enterprise',
            'admin',
            'active',
            'approved',
            0,
            0
        ))
        
        # 创建demo企业用户
        print("👤 创建demo企业用户...")
        demo_id = str(uuid.uuid4())
        demo_password_hash = bcrypt.hashpw('demo123'.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        
        cursor.execute("""
            INSERT INTO "Company" (id, name, email, password, type, role, status, "kycStatus", balance, "usdeBalance", "createdAt", "updatedAt")
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            ON CONFLICT (email) DO NOTHING
        """, (
            demo_id,
            'Demo Company',
            'demo@usde.com',
            demo_password_hash,
            'enterprise',
            'enterprise_admin',
            'active',
            'approved',
            5000,
            10000
        ))
        
        # 创建企业实体
        print("🏢 创建企业实体...")
        cursor.execute("""
            INSERT INTO "Enterprise" (id, name, "adminId", "createdAt", "updatedAt")
            VALUES (%s, %s, %s, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            ON CONFLICT (id) DO NOTHING
        """, (
            str(uuid.uuid4()),
            'Demo Enterprise',
            demo_id
        ))
        
        # 创建Treasury设置
        print("💰 创建Treasury设置...")
        cursor.execute("""
            INSERT INTO "TreasurySettings" (id, "companyId", "monthlyBudget", "quarterlyBudget", "approvalThreshold", "autoApprovalEnabled", "riskFlagThreshold", "approvalWorkflow")
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (id) DO NOTHING
        """, (
            str(uuid.uuid4()),
            demo_id,
            1000000.0,
            3000000.0,
            10000.0,
            True,
            50000.0,
            'single'
        ))
        
        # 提交事务
        conn.commit()
        print("✅ 数据库初始化完成！")
        
        # 验证用户创建
        print("\n🔍 验证用户创建...")
        cursor.execute('SELECT email, name, role, type, "kycStatus" FROM "Company" WHERE email IN (%s, %s)', ('admin@usde.com', 'demo@usde.com'))
        users = cursor.fetchall()
        
        for user in users:
            print(f"✅ {user[1]} ({user[0]}) - Role: {user[2]}, Type: {user[3]}, KYC: {user[4]}")
        
    except Exception as e:
        print(f"❌ 数据库初始化失败: {e}")
        if conn:
            conn.rollback()
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

if __name__ == "__main__":
    init_railway_database()
