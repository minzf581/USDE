#!/usr/bin/env python3
"""
Check Railway Database Structure
"""

import psycopg2

# Database connection parameters
DB_URL = "postgresql://postgres:SOzxfxdDXTsVjKQJLTyeGHeKnxlQHQLR@yamabiko.proxy.rlwy.net:58370/railway"

def check_database_structure():
    """Check the actual database structure"""
    try:
        print("🔍 Connecting to Railway database...")
        conn = psycopg2.connect(DB_URL)
        
        with conn.cursor() as cursor:
            # Get all tables
            cursor.execute("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public' 
                ORDER BY table_name;
            """)
            tables = cursor.fetchall()
            
            print(f"\n📋 Found {len(tables)} tables:")
            for i, table in enumerate(tables, 1):
                print(f"  {i:2d}. {table[0]}")
            
            # Check if there are any user-related tables
            user_tables = [table[0] for table in tables if 'user' in table[0].lower()]
            if user_tables:
                print(f"\n👥 User-related tables: {user_tables}")
                
                # Check structure of first user table
                if user_tables:
                    first_user_table = user_tables[0]
                    print(f"\n📊 Structure of {first_user_table}:")
                    cursor.execute(f"""
                        SELECT column_name, data_type, is_nullable, column_default 
                        FROM information_schema.columns 
                        WHERE table_name = '{first_user_table}' 
                        ORDER BY ordinal_position;
                    """)
                    columns = cursor.fetchall()
                    
                    for col in columns:
                        print(f"  - {col[0]}: {col[1]} (nullable: {col[2]}, default: {col[3]})")
            
            # Check for any existing data
            if tables:
                first_table = tables[0][0]
                print(f"\n📊 Sample data from {first_table}:")
                try:
                    cursor.execute(f"SELECT COUNT(*) FROM {first_table}")
                    count = cursor.fetchone()
                    print(f"  Total records: {count[0]}")
                    
                    if count[0] > 0:
                        cursor.execute(f"SELECT * FROM {first_table} LIMIT 3")
                        sample_data = cursor.fetchall()
                        print(f"  Sample records:")
                        for i, record in enumerate(sample_data, 1):
                            print(f"    {i}. {record}")
                except Exception as e:
                    print(f"  Could not query {first_table}: {e}")
        
        conn.close()
        return True
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == "__main__":
    check_database_structure()
