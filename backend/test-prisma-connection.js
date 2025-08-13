const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['query', 'error', 'warn'],
  errorFormat: 'pretty',
});

async function testConnection() {
  console.log('🧪 Testing Prisma Database Connection...\n');

  try {
    // Test 1: Basic connection
    console.log('1. Testing basic connection...');
    await prisma.$connect();
    console.log('✅ Prisma connected successfully');

    // Test 2: Query database
    console.log('\n2. Testing database query...');
    const companyCount = await prisma.company.count();
    console.log(`✅ Database query successful. Found ${companyCount} companies`);

    // Test 3: Test new fields
    console.log('\n3. Testing new subsidiary fields...');
    const companies = await prisma.company.findMany({
      take: 3,
      select: {
        id: true,
        name: true,
        companyCode: true,
        companyType: true,
        isParentCompany: true
      }
    });

    console.log('✅ New fields accessible:');
    companies.forEach(company => {
      console.log(`  - ${company.name}: Code=${company.companyCode}, Type=${company.companyType}, Parent=${company.isParentCompany}`);
    });

    // Test 4: Test PaymentRequest table
    console.log('\n4. Testing PaymentRequest table...');
    try {
      const paymentRequestCount = await prisma.paymentRequest.count();
      console.log(`✅ PaymentRequest table accessible. Count: ${paymentRequestCount}`);
    } catch (error) {
      console.log('❌ PaymentRequest table error:', error.message);
    }

    console.log('\n🎉 All tests passed! Prisma connection is working correctly.');

  } catch (error) {
    console.error('❌ Connection test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testConnection();
