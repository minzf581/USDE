const { PrismaClient } = require('@prisma/client');
const path = require('path');

// 直接指定数据库路径
const databasePath = path.join(__dirname, 'prisma', 'data', 'database.db');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: `file:${databasePath}`
    }
  }
});

async function initBasicDatabase() {
  console.log('🚀 Initializing Basic Database Structure...\n');

  try {
    // Create basic tables first
    console.log('📊 Creating basic database tables...');
    
    // Create Company table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS Company (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT DEFAULT 'enterprise_admin',
        kycStatus TEXT DEFAULT 'pending',
        kycDocuments TEXT,
        ucBalance REAL DEFAULT 0,
        usdeBalance REAL DEFAULT 0,
        totalEarnings REAL DEFAULT 0,
        isActive BOOLEAN DEFAULT 1,
        isEnterpriseAdmin BOOLEAN DEFAULT 1,
        isEnterpriseUser BOOLEAN DEFAULT 0,
        enterpriseId TEXT,
        enterpriseRole TEXT,
        companyName TEXT,
        enterpriseCompanyType TEXT,
        companyCode TEXT,
        companyAddress TEXT,
        parentCompanyId TEXT,
        isParentCompany BOOLEAN DEFAULT 0,
        companyType TEXT,
        companyNameEn TEXT,
        companyRegNumber TEXT,
        countryOfReg TEXT,
        regAddress TEXT,
        incorporationDate DATETIME,
        companyTypeKYC TEXT,
        isPEP BOOLEAN DEFAULT 0,
        isSanctioned BOOLEAN DEFAULT 0,
        complianceAgreed BOOLEAN DEFAULT 0,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Company table created');

    // Create Role table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS Role (
        id TEXT PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        description TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Role table created');

    // Create Permission table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS Permission (
        id TEXT PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        description TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Permission table created');

    // Create UserRole table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS UserRole (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL,
        roleId TEXT NOT NULL,
        companyId TEXT,
        assignedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES Company(id),
        FOREIGN KEY (roleId) REFERENCES Role(id),
        FOREIGN KEY (companyId) REFERENCES Company(id)
      )
    `);
    console.log('✅ UserRole table created');

    // Create TreasurySettings table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS TreasurySettings (
        id TEXT PRIMARY KEY,
        companyId TEXT UNIQUE NOT NULL,
        monthlyBudget REAL DEFAULT 0,
        quarterlyBudget REAL DEFAULT 0,
        approvalThreshold REAL DEFAULT 1000,
        autoApprovalEnabled BOOLEAN DEFAULT 0,
        riskFlagThreshold REAL DEFAULT 5000,
        approvalWorkflow TEXT DEFAULT 'single',
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (companyId) REFERENCES Company(id)
      )
    `);
    console.log('✅ TreasurySettings table created');

    // Create PaymentRequest table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS PaymentRequest (
        id TEXT PRIMARY KEY,
        companyId TEXT NOT NULL,
        type TEXT NOT NULL,
        tokenAddress TEXT NOT NULL,
        amount REAL NOT NULL,
        recipient TEXT,
        targetCompanyId TEXT,
        purpose TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        requestedBy TEXT NOT NULL,
        requestedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        approvedBy TEXT,
        approvedAt DATETIME,
        rejectedBy TEXT,
        rejectedAt DATETIME,
        rejectionReason TEXT,
        FOREIGN KEY (companyId) REFERENCES Company(id),
        FOREIGN KEY (targetCompanyId) REFERENCES Company(id),
        FOREIGN KEY (requestedBy) REFERENCES Company(id),
        FOREIGN KEY (approvedBy) REFERENCES Company(id),
        FOREIGN KEY (rejectedBy) REFERENCES Company(id)
      )
    `);
    console.log('✅ PaymentRequest table created');

    // Create USDETransaction table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS USDETransaction (
        id TEXT PRIMARY KEY,
        companyId TEXT NOT NULL,
        type TEXT NOT NULL,
        amount REAL NOT NULL,
        balanceBefore REAL NOT NULL,
        balanceAfter REAL NOT NULL,
        description TEXT,
        metadata TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (companyId) REFERENCES Company(id)
      )
    `);
    console.log('✅ USDETransaction table created');

    // Create indexes
    console.log('📊 Creating database indexes...');
    
    await prisma.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS idx_company_parentCompanyId ON Company(parentCompanyId)');
    await prisma.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS idx_company_companyCode ON Company(companyCode)');
    await prisma.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS idx_company_companyType ON Company(companyType)');
    await prisma.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS idx_paymentrequest_companyId ON PaymentRequest(companyId)');
    await prisma.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS idx_paymentrequest_status ON PaymentRequest(status)');
    await prisma.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS idx_paymentrequest_type ON PaymentRequest(type)');
    await prisma.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS idx_paymentrequest_targetCompanyId ON PaymentRequest(targetCompanyId)');
    
    console.log('✅ Database indexes created');

    // Insert basic roles
    console.log('📝 Inserting basic roles...');
    
    await prisma.$executeRawUnsafe(`
      INSERT OR IGNORE INTO Role (id, name, description) VALUES 
      ('role_admin', 'ADMIN', 'Administrator with full access'),
      ('role_supervisor', 'SUPERVISOR', 'Supervisor with approval and management access'),
      ('role_operator', 'OPERATOR', 'Operator with basic operational access'),
      ('role_observer', 'OBSERVER', 'Observer with read-only access')
    `);
    console.log('✅ Basic roles inserted');

    // Create sample parent company
    console.log('📝 Creating sample parent company...');
    
    await prisma.$executeRawUnsafe(`
      INSERT OR IGNORE INTO Company (
        id, name, email, password, role, kycStatus, isActive,
        companyCode, companyAddress, companyType, isParentCompany,
        ucBalance, usdeBalance, totalEarnings
      ) VALUES (
        'parent_company_001',
        'Sample Parent Company',
        'parent@company.com',
        'temp_password_hash',
        'enterprise_admin',
        'approved',
        1,
        'PARENT001',
        '0x1234567890123456789012345678901234567890',
        'parent',
        1,
        0.0,
        0.0,
        0.0
      )
    `);

    // Create sample subsidiary
    console.log('📝 Creating sample subsidiary...');
    
    await prisma.$executeRawUnsafe(`
      INSERT OR IGNORE INTO Company (
        id, name, email, password, role, kycStatus, isActive,
        companyCode, companyAddress, companyType, isParentCompany,
        parentCompanyId, ucBalance, usdeBalance, totalEarnings
      ) VALUES (
        'subsidiary_company_001',
        'Sample Subsidiary Company',
        'subsidiary@company.com',
        'temp_password_hash',
        'enterprise_admin',
        'pending',
        1,
        'SUB001',
        '0x0987654321098765432109876543210987654321',
        'subsidiary',
        0,
        'parent_company_001',
        0.0,
        0.0,
        0.0
      )
    `);

    // Create treasury settings
    console.log('📝 Creating treasury settings...');
    
    await prisma.$executeRawUnsafe(`
      INSERT OR IGNORE INTO TreasurySettings (
        id, companyId, monthlyBudget, quarterlyBudget, approvalThreshold,
        autoApprovalEnabled, riskFlagThreshold, approvalWorkflow
      ) VALUES 
      ('ts_parent_001', 'parent_company_001', 1000000.0, 3000000.0, 1000.0, 0, 5000.0, 'single'),
      ('ts_subsidiary_001', 'subsidiary_company_001', 500000.0, 1500000.0, 500.0, 0, 2500.0, 'single')
    `);

    console.log('\n🎉 Basic database structure created successfully!');
    console.log('\nNext steps:');
    console.log('1. Run: npm run db:test-subsidiary');
    console.log('2. Start backend server: npm run dev');

  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the initialization
initBasicDatabase();

