#!/usr/bin/env python3
"""
测试Railway数据库连接和查询
"""

import psycopg2
import json

# Railway数据库配置
RAILWAY_DB_URL = "postgresql://postgres:SOzxfxdDXTsVjKQJLTyeGHeKnxlQHQLR@yamabiko.proxy.rlwy.net:58370/railway"

def test_database_connection():
    """测试数据库连接"""
    print("🔍 测试Railway数据库连接...")
    
    try:
        conn = psycopg2.connect(RAILWAY_DB_URL)
        cursor = conn.cursor()
        
        print("✅ 数据库连接成功")
        
        # 检查Company表结构
        print("\n📊 检查Company表结构...")
        cursor.execute("""
            SELECT column_name, data_type, is_nullable 
            FROM information_schema.columns 
            WHERE table_name = 'Company' 
            ORDER BY ordinal_position
        """)
        
        columns = cursor.fetchall()
        print("Company表字段:")
        for col in columns:
            print(f"  - {col[0]}: {col[1]} ({'NULL' if col[2] == 'YES' else 'NOT NULL'})")
        
        # 检查用户数据
        print("\n👥 检查用户数据...")
        cursor.execute('SELECT id, name, email, type, status, "kycStatus" FROM "Company" ORDER BY email')
        users = cursor.fetchall()
        
        for user in users:
            print(f"  - {user[2]}: {user[1]} ({user[3]}) - {user[4]} - KYC: {user[5]}")
        
        # 测试特定用户查询
        print("\n🔍 测试特定用户查询...")
        cursor.execute('SELECT * FROM "Company" WHERE email = %s', ('admin@usde.com',))
        admin_user = cursor.fetchone()
        
        if admin_user:
            print("✅ 找到admin用户:")
            print(f"  ID: {admin_user[0]}")
            print(f"  名称: {admin_user[1]}")
            print(f"  邮箱: {admin_user[2]}")
            print(f"  类型: {admin_user[3]}")
            print(f"  状态: {admin_user[4]}")
            print(f"  KYC状态: {admin_user[5]}")
        else:
            print("❌ 未找到admin用户")
        
        cursor.close()
        conn.close()
        print("\n🔒 数据库连接已关闭")
        
    except Exception as e:
        print(f"❌ 数据库错误: {e}")

if __name__ == "__main__":
    test_database_connection()
