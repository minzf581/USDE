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

async function testSubsidiaryFeatures() {
  console.log('🧪 Testing Subsidiary Features...\n');

  try {
    // Test 1: Check database schema
    console.log('1. Checking database schema...');
    const companyFields = await prisma.$queryRaw`PRAGMA table_info(Company)`;
    const hasNewFields = companyFields.some(field => 
      ['companyCode', 'companyAddress', 'parentCompanyId', 'isParentCompany', 'companyType'].includes(field.name)
    );
    
    if (hasNewFields) {
      console.log('✅ New company fields found');
    } else {
      console.log('❌ New company fields not found');
    }

    // Test 2: Check PaymentRequest table
    console.log('\n2. Checking PaymentRequest table...');
    try {
      const paymentRequests = await prisma.paymentRequest.findMany({ take: 1 });
      console.log('✅ PaymentRequest table exists and accessible');
    } catch (error) {
      console.log('❌ PaymentRequest table not accessible:', error.message);
    }

    // Test 3: Check existing companies
    console.log('\n3. Checking existing companies...');
    const companies = await prisma.company.findMany({
      select: {
        id: true,
        name: true,
        companyCode: true,
        companyType: true,
        isParentCompany: true,
        parentCompanyId: true
      }
    });

    console.log(`Found ${companies.length} companies:`);
    companies.forEach(company => {
      console.log(`  - ${company.name} (${company.companyCode || 'N/A'}) - Type: ${company.companyType || 'N/A'}, Parent: ${company.isParentCompany ? 'Yes' : 'No'}`);
    });

    // Test 4: Check parent-subsidiary relationships
    console.log('\n4. Checking parent-subsidiary relationships...');
    const parentCompanies = companies.filter(c => c.isParentCompany);
    const subsidiaries = companies.filter(c => c.companyType === 'subsidiary');

    console.log(`Parent companies: ${parentCompanies.length}`);
    console.log(`Subsidiaries: ${subsidiaries.length}`);

    if (parentCompanies.length > 0 && subsidiaries.length > 0) {
      console.log('✅ Parent-subsidiary structure found');
      
      // Show relationships
      parentCompanies.forEach(parent => {
        const childSubsidiaries = subsidiaries.filter(sub => sub.parentCompanyId === parent.id);
        console.log(`  ${parent.name} has ${childSubsidiaries.length} subsidiaries`);
      });
    } else {
      console.log('⚠️  No parent-subsidiary relationships found');
    }

    // Test 5: Check treasury settings
    console.log('\n5. Checking treasury settings...');
    const treasurySettings = await prisma.treasurySettings.findMany({
      include: {
        company: {
          select: {
            name: true,
            companyCode: true
          }
        }
      }
    });

    console.log(`Found ${treasurySettings.length} treasury settings:`);
    treasurySettings.forEach(setting => {
      console.log(`  - ${setting.company.name} (${setting.company.companyCode}): Budget ${setting.monthlyBudget}/${setting.quarterlyBudget}`);
    });

    // Test 6: Test consolidated balance calculation
    console.log('\n6. Testing consolidated balance calculation...');
    if (parentCompanies.length > 0) {
      const parent = parentCompanies[0];
      const parentBalance = await prisma.company.findUnique({
        where: { id: parent.id },
        select: { ucBalance: true, usdeBalance: true }
      });

      const subsidiariesBalance = await prisma.company.aggregate({
        where: { parentCompanyId: parent.id },
        _sum: {
          ucBalance: true,
          usdeBalance: true
        }
      });

      const totalUC = (parentBalance.ucBalance || 0) + (subsidiariesBalance._sum.ucBalance || 0);
      const totalUSDE = (parentBalance.usdeBalance || 0) + (subsidiariesBalance._sum.usdeBalance || 0);

      console.log(`Consolidated balance for ${parent.name}:`);
      console.log(`  UC: ${totalUC}`);
      console.log(`  USDE: ${totalUSDE}`);
    }

    console.log('\n🎉 Subsidiary feature testing completed!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testSubsidiaryFeatures();
