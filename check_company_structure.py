#!/usr/bin/env python3
"""
Check Company Table Structure
"""

import psycopg2

# Database connection parameters
DB_URL = "postgresql://postgres:SOzxfxdDXTsVjKQJLTyeGHeKnxlQHQLR@yamabiko.proxy.rlwy.net:58370/railway"

def check_company_structure():
    """Check the Company table structure"""
    try:
        print("🔍 Connecting to Railway database...")
        conn = psycopg2.connect(DB_URL)
        
        with conn.cursor() as cursor:
            # Check Company table structure
            print("\n📊 Company table structure:")
            cursor.execute("""
                SELECT column_name, data_type, is_nullable, column_default 
                FROM information_schema.columns 
                WHERE table_name = 'Company' 
                ORDER BY ordinal_position;
            """)
            columns = cursor.fetchall()
            
            for col in columns:
                print(f"  - {col[0]}: {col[1]} (nullable: {col[2]}, default: {col[3]})")
            
            # Check existing companies
            print(f"\n🏢 Existing companies:")
            cursor.execute("SELECT COUNT(*) FROM \"Company\"")
            count = cursor.fetchone()
            print(f"  Total companies: {count[0]}")
            
            if count[0] > 0:
                cursor.execute('SELECT * FROM "Company" LIMIT 5')
                companies = cursor.fetchall()
                print(f"  Sample companies:")
                for i, company in enumerate(companies, 1):
                    print(f"    {i}. {company}")
            
            # Check other relevant tables
            relevant_tables = ['BankAccount', 'KYCReview', 'Payment', 'USDETransaction']
            
            for table in relevant_tables:
                print(f"\n📋 {table} table:")
                try:
                    cursor.execute(f'SELECT COUNT(*) FROM "{table}"')
                    count = cursor.fetchone()
                    print(f"  Total records: {count[0]}")
                    
                    if count[0] > 0:
                        cursor.execute(f'SELECT * FROM "{table}" LIMIT 2')
                        sample_data = cursor.fetchall()
                        print(f"  Sample data:")
                        for i, record in enumerate(sample_data, 1):
                            print(f"    {i}. {record}")
                except Exception as e:
                    print(f"  Error querying {table}: {e}")
        
        conn.close()
        return True
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == "__main__":
    check_company_structure()
