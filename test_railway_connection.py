#!/usr/bin/env python3
"""
Test Railway Database Connection
"""

import psycopg2
import requests
import json

# Correct Railway connection URL
CONNECTION_URL = "postgresql://postgres:SOzxfxdDXTsVjKQJLTyeGHeKnxlQHQLR@yamabiko.proxy.rlwy.net:58370/railway"

def test_connection():
    """Test database connection"""
    try:
        print(f"Testing connection to Railway database...")
        conn = psycopg2.connect(CONNECTION_URL)
        
        with conn.cursor() as cursor:
            cursor.execute("SELECT version();")
            version = cursor.fetchone()
            print(f"✅ Connection successful! PostgreSQL version: {version[0]}")
            
            # Test basic query
            cursor.execute("SELECT COUNT(*) FROM users;")
            user_count = cursor.fetchone()
            print(f"✅ Users table accessible. Total users: {user_count[0]}")
            
            # Test table structure
            cursor.execute("""
                SELECT table_name FROM information_schema.tables 
                WHERE table_schema = 'public' 
                ORDER BY table_name;
            """)
            tables = cursor.fetchall()
            print(f"✅ Available tables: {[table[0] for table in tables[:10]]}...")
            
        conn.close()
        return True
    except Exception as e:
        print(f"❌ Connection failed: {e}")
        return False

def main():
    print("🔍 Testing Railway database connection...")
    
    if test_connection():
        print(f"\n🎉 Connection successful!")
        print(f"Database URL: {CONNECTION_URL}")
        return True
    else:
        print("\n❌ Connection failed!")
        return False

if __name__ == "__main__":
    main()
