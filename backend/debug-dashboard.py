#!/usr/bin/env python3
"""
调试dashboard问题的脚本
"""

import psycopg2
import json

# Railway数据库配置
RAILWAY_DB_URL = "postgresql://postgres:SOzxfxdDXTsVjKQJLTyeGHeKnxlQHQLR@yamabiko.proxy.rlwy.net:58370/railway"

def debug_dashboard():
    """调试dashboard问题"""
    print("🔍 调试dashboard问题...")
    
    try:
        conn = psycopg2.connect(RAILWAY_DB_URL)
        cursor = conn.cursor()
        
        print("✅ 数据库连接成功")
        
        # 检查admin用户的完整数据
        print("\n📊 检查admin用户数据...")
        cursor.execute('SELECT * FROM "Company" WHERE email = %s', ('admin@usde.com',))
        admin_user = cursor.fetchone()
        
        if admin_user:
            print("✅ 找到admin用户:")
            print(f"  完整数据: {admin_user}")
            
            # 检查每个字段
            cursor.execute('SELECT column_name FROM information_schema.columns WHERE table_name = \'Company\' ORDER BY ordinal_position')
            columns = [col[0] for col in cursor.fetchall()]
            
            print(f"\n📋 字段列表: {columns}")
            
            # 检查balance和usdeBalance字段
            cursor.execute('SELECT balance, "usdeBalance" FROM "Company" WHERE email = %s', ('admin@usde.com',))
            balance_data = cursor.fetchone()
            print(f"\n💰 余额数据: balance={balance_data[0]}, usdeBalance={balance_data[1]}")
            
            # 检查字段类型
            cursor.execute("""
                SELECT column_name, data_type, is_nullable, column_default
                FROM information_schema.columns 
                WHERE table_name = 'Company' AND column_name IN ('balance', 'usdeBalance')
            """)
            
            balance_columns = cursor.fetchall()
            print(f"\n🔧 余额字段详情:")
            for col in balance_columns:
                print(f"  - {col[0]}: {col[1]} ({'NULL' if col[2] == 'YES' else 'NOT NULL'}) 默认值: {col[3]}")
        
        cursor.close()
        conn.close()
        print("\n🔒 数据库连接已关闭")
        
    except Exception as e:
        print(f"❌ 数据库错误: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    debug_dashboard()
