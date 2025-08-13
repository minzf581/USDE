#!/usr/bin/env python3
"""
为Railway数据库创建初始用户的Python脚本
"""

import psycopg2
import bcrypt
import json
from datetime import datetime

# Railway数据库配置
RAILWAY_DB_URL = "postgresql://postgres:SOzxfxdDXTsVjKQJLTyeGHeKnxlQHQLR@yamabiko.proxy.rlwy.net:58370/railway"

def hash_password(password):
    """哈希密码"""
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')

def create_company_table(cursor):
    """创建Company表"""
    create_table_sql = """
    CREATE TABLE IF NOT EXISTS "Company" (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        type TEXT DEFAULT 'company',
        status TEXT DEFAULT 'active',
        "kycStatus" TEXT DEFAULT 'pending',
        balance DOUBLE PRECISION DEFAULT 0,
        "usdeBalance" DOUBLE PRECISION DEFAULT 0,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """
    cursor.execute(create_table_sql)
    print("✅ Company表创建成功")

def create_initial_users(cursor):
    """创建初始用户"""
    
    # 1. 系统管理员
    admin_password = hash_password('admin123')
    admin_id = 'admin-company-id'
    
    cursor.execute("""
        INSERT INTO "Company" (id, name, email, password, type, status, "kycStatus", balance, "usdeBalance", "createdAt", "updatedAt")
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON CONFLICT (email) DO UPDATE SET
            name = EXCLUDED.name,
            password = EXCLUDED.password,
            type = EXCLUDED.type,
            status = EXCLUDED.status,
            "kycStatus" = EXCLUDED."kycStatus",
            balance = EXCLUDED.balance,
            "usdeBalance" = EXCLUDED."usdeBalance",
            "updatedAt" = CURRENT_TIMESTAMP
    """, (
        admin_id,
        'System Administrator',
        'admin@usde.com',
        admin_password,
        'enterprise',
        'active',
        'approved',
        0.0,
        0.0
    ))
    print("✅ 系统管理员创建成功: admin@usde.com / admin123")
    
    # 2. 演示用户
    demo_password = hash_password('demo123')
    demo_id = 'demo-company-id'
    
    cursor.execute("""
        INSERT INTO "Company" (id, name, email, password, type, status, "kycStatus", balance, "usdeBalance", "createdAt", "updatedAt")
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON CONFLICT (email) DO UPDATE SET
            name = EXCLUDED.name,
            password = EXCLUDED.password,
            type = EXCLUDED.type,
            status = EXCLUDED.status,
            "kycStatus" = EXCLUDED."kycStatus",
            balance = EXCLUDED.balance,
            "usdeBalance" = EXCLUDED."usdeBalance",
            "updatedAt" = CURRENT_TIMESTAMP
    """, (
        demo_id,
        'Demo Company',
        'demo@usde.com',
        demo_password,
        'enterprise',
        'active',
        'approved',
        5000.0,
        10000.0
    ))
    print("✅ 演示用户创建成功: demo@usde.com / demo123")
    
    # 3. 演示子公司
    subsidiary_password = hash_password('demo123')
    subsidiary_id = 'subsidiary-company-id'
    
    cursor.execute("""
        INSERT INTO "Company" (id, name, email, password, type, status, "kycStatus", balance, "usdeBalance", "createdAt", "updatedAt")
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON CONFLICT (email) DO UPDATE SET
            name = EXCLUDED.name,
            password = EXCLUDED.password,
            type = EXCLUDED.type,
            status = EXCLUDED.status,
            "kycStatus" = EXCLUDED."kycStatus",
            balance = EXCLUDED.balance,
            "usdeBalance" = EXCLUDED."usdeBalance",
            "updatedAt" = CURRENT_TIMESTAMP
    """, (
        subsidiary_id,
        'Demo Subsidiary',
        'subsidiary@usde.com',
        subsidiary_password,
        'subsidiary',
        'active',
        'approved',
        2500.0,
        5000.0
    ))
    print("✅ 演示子公司创建成功: subsidiary@usde.com / demo123")

def verify_users(cursor):
    """验证创建的用户"""
    print("\n🔍 验证创建的用户...")
    
    cursor.execute('SELECT email, name, type, status, "kycStatus" FROM "Company" ORDER BY email')
    users = cursor.fetchall()
    
    for user in users:
        print(f"   - {user[0]}: {user[1]} ({user[2]}) - {user[3]} - KYC: {user[4]}")
    
    print(f"\n📊 总共创建了 {len(users)} 个用户")

def main():
    """主函数"""
    print("🚀 开始为Railway数据库创建初始用户...")
    print(f"📡 连接到数据库: {RAILWAY_DB_URL.split('@')[1]}")
    
    try:
        # 连接数据库
        conn = psycopg2.connect(RAILWAY_DB_URL)
        cursor = conn.cursor()
        
        print("✅ 数据库连接成功")
        
        # 创建表
        create_company_table(cursor)
        
        # 创建用户
        create_initial_users(cursor)
        
        # 验证用户
        verify_users(cursor)
        
        # 提交事务
        conn.commit()
        print("\n🎉 所有操作完成！")
        
        # 显示登录信息
        print("\n📋 登录凭据:")
        print("- 系统管理员: admin@usde.com / admin123")
        print("- 演示用户: demo@usde.com / demo123")
        print("- 演示子公司: subsidiary@usde.com / demo123")
        
        print(f"\n🌐 后端地址: optimistic-fulfillment-usde.up.railway.app")
        print("🔗 登录API: /api/auth/login")
        
    except psycopg2.Error as e:
        print(f"❌ 数据库错误: {e}")
        if conn:
            conn.rollback()
    except Exception as e:
        print(f"❌ 其他错误: {e}")
        if conn:
            conn.rollback()
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()
        print("\n🔒 数据库连接已关闭")

if __name__ == "__main__":
    main()
