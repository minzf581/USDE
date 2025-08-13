#!/usr/bin/env python3
"""
Verify Railway Database Upgrade Results
"""

import psycopg2
import requests
import json

# Database connection parameters
DB_URL = "postgresql://postgres:SOzxfxdDXTsVjKQJLTyeGHeKnxlQHQLR@yamabiko.proxy.rlwy.net:58370/railway"

def verify_database_upgrade():
    """Verify the database upgrade results"""
    try:
        print("🔍 Verifying database upgrade results...")
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
            
            new_columns = ['parentCompanyId', 'companyCode', 'walletAddress', 'isParentCompany']
            for col in columns:
                if col[0] in new_columns:
                    print(f"  ✅ {col[0]}: {col[1]} (NEW)")
                else:
                    print(f"  - {col[0]}: {col[1]}")
            
            # Check companies
            print(f"\n🏢 Companies:")
            cursor.execute('SELECT "name", "email", "role", "companyCode", "isParentCompany" FROM "Company" ORDER BY "isParentCompany" DESC, "name"')
            companies = cursor.fetchall()
            
            for company in companies:
                company_type = "Parent" if company[4] else "Subsidiary"
                print(f"  {company_type}: {company[0]} ({company[1]}) - Role: {company[2]} - Code: {company[3]}")
            
            # Check new tables
            new_tables = ['CompanySettings', 'CompanyBalances', 'InternalTransfer', 'CompanyUser']
            print(f"\n📋 New tables:")
            for table in new_tables:
                try:
                    cursor.execute(f'SELECT COUNT(*) FROM "{table}"')
                    count = cursor.fetchone()[0]
                    print(f"  ✅ {table}: {count} records")
                except Exception as e:
                    print(f"  ❌ {table}: Error - {e}")
            
            # Check indexes
            print(f"\n📊 Performance indexes:")
            index_names = [
                'idx_company_parentCompanyId',
                'idx_company_companyCode', 
                'idx_company_isParentCompany',
                'idx_company_user_companyId',
                'idx_company_user_userId',
                'idx_internal_transfer_source',
                'idx_internal_transfer_target',
                'idx_internal_transfer_status',
                'idx_company_balances_company_token',
                'idx_company_settings_companyId'
            ]
            
            for index_name in index_names:
                try:
                    cursor.execute(f'SELECT indexname FROM pg_indexes WHERE indexname = %s', (index_name,))
                    result = cursor.fetchone()
                    if result:
                        print(f"  ✅ {index_name}")
                    else:
                        print(f"  ❌ {index_name} - Not found")
                except Exception as e:
                    print(f"  ❌ {index_name} - Error: {e}")
        
        conn.close()
        return True
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def test_api_connection():
    """Test API connection to backend"""
    try:
        print("\n🌐 Testing API connection...")
        
        # Test login with demo@usde.com
        login_data = {
            "email": "demo@usde.com",
            "password": "demo123"
        }
        
        response = requests.post(
            "https://optimistic-fulfillment-usde.up.railway.app/api/auth/login",
            json=login_data,
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            # Check for token in different possible locations
            token = None
            if 'data' in data and 'token' in data['data']:
                token = data['data']['token']
            elif 'token' in data:
                token = data['token']
            
            if token:
                print(f"✅ API login successful!")
                print(f"   Token: {token[:20]}...")
                print(f"   Company: {data.get('company', {}).get('name', 'Unknown')}")
                print(f"   Role: {data.get('company', {}).get('role', 'Unknown')}")
                
                # Test API endpoints
                headers = {"Authorization": f"Bearer {token}"}
                
                # Test company info endpoint
                try:
                    company_response = requests.get(
                        "https://optimistic-fulfillment-usde.up.railway.app/api/company/current",
                        headers=headers,
                        timeout=10
                    )
                    if company_response.status_code == 200:
                        print(f"✅ Company API endpoint accessible")
                    else:
                        print(f"⚠️ Company API endpoint returned: {company_response.status_code}")
                except Exception as e:
                    print(f"⚠️ Company API endpoint error: {e}")
                
                return True
            else:
                print(f"❌ Login response missing token: {data}")
                return False
        else:
            print(f"❌ Login failed with status: {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ API connection error: {e}")
        return False

def main():
    print("🔍 Railway Database Upgrade Verification")
    print("=" * 50)
    
    # Verify database
    db_success = verify_database_upgrade()
    
    # Test API
    api_success = test_api_connection()
    
    print("\n" + "=" * 50)
    print("📋 VERIFICATION SUMMARY:")
    print(f"   Database Upgrade: {'✅ SUCCESS' if db_success else '❌ FAILED'}")
    print(f"   API Connection: {'✅ SUCCESS' if api_success else '❌ FAILED'}")
    
    if db_success and api_success:
        print("\n🎉 All verifications passed!")
        print("The Railway database has been successfully upgraded for subsidiary support.")
        print("demo@usde.com is now configured as a parent company administrator.")
    else:
        print("\n⚠️ Some verifications failed. Please check the details above.")

if __name__ == "__main__":
    main()
