#!/usr/bin/env python3
import psycopg2

# Railway数据库连接配置
RAILWAY_DB_URL = "postgresql://postgres:SOzxfxdDXTsVjKQJLTyeGHeKnxlQHQLR@yamabiko.proxy.rlwy.net:58370/railway"

def drop_railway_tables():
    """删除Railway数据库中的现有表"""
    print("🗑️ 开始删除Railway数据库中的现有表...")
    
    try:
        # 连接数据库
        conn = psycopg2.connect(RAILWAY_DB_URL)
        cursor = conn.cursor()
        
        print("✅ 成功连接到Railway数据库")
        
        # 删除表的顺序（考虑外键约束）
        tables_to_drop = [
            "TreasurySettings",
            "Enterprise", 
            "UserRole",
            "KYC",
            "Withdrawal",
            "Deposit",
            "Stake",
            "Payment",
            "BankAccount",
            "Permission",
            "Role",
            "Company"
        ]
        
        for table in tables_to_drop:
            try:
                cursor.execute(f'DROP TABLE IF EXISTS "{table}" CASCADE')
                print(f"🗑️ 删除表 {table}")
            except Exception as e:
                print(f"⚠️ 删除表 {table} 时出错: {e}")
        
        # 提交事务
        conn.commit()
        print("✅ 所有表删除完成！")
        
    except Exception as e:
        print(f"❌ 删除表失败: {e}")
        if conn:
            conn.rollback()
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

if __name__ == "__main__":
    drop_railway_tables()
