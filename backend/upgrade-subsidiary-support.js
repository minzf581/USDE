const { PrismaClient } = require('@prisma/client');
const path = require('path');

// 使用现有的数据库路径
const databasePath = path.join(__dirname, 'prisma', 'data', 'app.db');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: `file:${databasePath}`
    }
  }
});

async function upgradeSubsidiarySupport() {
  console.log('🚀 Upgrading Existing Database for Subsidiary Support...\n');

  try {
    // 检查现有数据库结构
    console.log('🔍 Checking existing database structure...');
    
    const tables = await prisma.$queryRaw`SELECT name FROM sqlite_master WHERE type='table'`;
    console.log('📋 Existing tables:', tables.map(t => t.name).join(', '));

    // 检查Company表结构
    console.log('\n📊 Checking Company table structure...');
    const companyFields = await prisma.$queryRaw`PRAGMA table_info(Company)`;
    const existingFields = companyFields.map(f => f.name);
    console.log('Existing Company fields:', existingFields.join(', '));

    // 需要添加的新字段
    const newFields = [
      'companyCode',
      'companyAddress', 
      'parentCompanyId',
      'isParentCompany',
      'companyType'
    ];

    const missingFields = newFields.filter(field => !existingFields.includes(field));
    
    if (missingFields.length > 0) {
      console.log(`\n📝 Adding missing fields: ${missingFields.join(', ')}`);
      
      // 添加缺失的字段
      for (const field of missingFields) {
        try {
          let sql = '';
          switch (field) {
            case 'companyCode':
              sql = 'ALTER TABLE Company ADD COLUMN companyCode TEXT';
              break;
            case 'companyAddress':
              sql = 'ALTER TABLE Company ADD COLUMN companyAddress TEXT';
              break;
            case 'parentCompanyId':
              sql = 'ALTER TABLE Company ADD COLUMN parentCompanyId TEXT';
              break;
            case 'isParentCompany':
              sql = 'ALTER TABLE Company ADD COLUMN isParentCompany BOOLEAN DEFAULT 0';
              break;
            case 'companyType':
              sql = 'ALTER TABLE Company ADD COLUMN companyType TEXT';
              break;
          }
          
          if (sql) {
            await prisma.$executeRawUnsafe(sql);
            console.log(`✅ Added field: ${field}`);
          }
        } catch (error) {
          console.log(`⚠️  Field ${field} may already exist:`, error.message);
        }
      }
    } else {
      console.log('✅ All required Company fields already exist');
    }

    // 检查PaymentRequest表是否存在
    const hasPaymentRequest = tables.some(t => t.name === 'PaymentRequest');
    
    if (!hasPaymentRequest) {
      console.log('\n📝 Creating PaymentRequest table...');
      
      await prisma.$executeRawUnsafe(`
        CREATE TABLE PaymentRequest (
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
    } else {
      console.log('✅ PaymentRequest table already exists');
    }

    // 创建必要的索引
    console.log('\n📊 Creating database indexes...');
    
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_company_parentCompanyId ON Company(parentCompanyId)',
      'CREATE INDEX IF NOT EXISTS idx_company_companyCode ON Company(companyCode)',
      'CREATE INDEX IF NOT EXISTS idx_company_companyType ON Company(companyType)',
      'CREATE INDEX IF NOT EXISTS idx_paymentrequest_companyId ON PaymentRequest(companyId)',
      'CREATE INDEX IF NOT EXISTS idx_paymentrequest_status ON PaymentRequest(status)',
      'CREATE INDEX IF NOT EXISTS idx_paymentrequest_type ON PaymentRequest(type)',
      'CREATE INDEX IF NOT EXISTS idx_paymentrequest_targetCompanyId ON PaymentRequest(targetCompanyId)'
    ];

    for (const indexSql of indexes) {
      try {
        await prisma.$executeRawUnsafe(indexSql);
        console.log('✅ Index created');
      } catch (error) {
        console.log('⚠️  Index may already exist:', error.message);
      }
    }

    // 更新现有公司为母公司
    console.log('\n📝 Updating existing companies...');
    
    const existingCompanies = await prisma.company.findMany({
      select: { 
        id: true, 
        companyType: true, 
        isParentCompany: true,
        companyCode: true
      }
    });

    console.log(`Found ${existingCompanies.length} existing companies`);

    // 使用原始SQL更新，避免Prisma字段映射问题
    for (const company of existingCompanies) {
      if (!company.companyType || company.isParentCompany === null || !company.companyCode) {
        try {
          const updateSql = `
            UPDATE Company 
            SET companyType = '${company.companyType || 'parent'}',
                isParentCompany = ${company.isParentCompany !== null ? company.isParentCompany : 1},
                companyCode = '${company.companyCode || `COMP${company.id.substring(0, 8)}`}'
            WHERE id = '${company.id}'
          `;
          
          await prisma.$executeRawUnsafe(updateSql);
          console.log(`✅ Updated company ${company.id}`);
        } catch (error) {
          console.log(`⚠️  Could not update company ${company.id}:`, error.message);
        }
      }
    }

    // 检查TreasurySettings
    console.log('\n📊 Checking TreasurySettings...');
    
    const hasTreasurySettings = tables.some(t => t.name === 'TreasurySettings');
    
    if (!hasTreasurySettings) {
      console.log('📝 Creating TreasurySettings table...');
      
      await prisma.$executeRawUnsafe(`
        CREATE TABLE TreasurySettings (
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
    } else {
      console.log('✅ TreasurySettings table already exists');
    }

    // 为现有公司创建TreasurySettings（如果不存在）
    console.log('\n📝 Creating TreasurySettings for existing companies...');
    
    for (const company of existingCompanies) {
      try {
        const existingSettings = await prisma.treasurySettings.findUnique({
          where: { companyId: company.id }
        });

        if (!existingSettings) {
          await prisma.treasurySettings.create({
            data: {
              companyId: company.id,
              monthlyBudget: 1000000,
              quarterlyBudget: 3000000,
              approvalThreshold: 1000,
              autoApprovalEnabled: false,
              riskFlagThreshold: 5000,
              approvalWorkflow: 'single'
            }
          });
          console.log(`✅ Created TreasurySettings for company ${company.id}`);
        }
      } catch (error) {
        console.log(`⚠️  Could not create TreasurySettings for company ${company.id}:`, error.message);
      }
    }

    console.log('\n🎉 Database upgrade completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Start backend server: npm run dev');
    console.log('2. Test the new subsidiary features');

  } catch (error) {
    console.error('❌ Database upgrade failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the upgrade
upgradeSubsidiarySupport();
