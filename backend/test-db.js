const prisma = require('./lib/prisma');

async function testDatabaseConnection() {
  try {
    console.log('🔍 Testing database connection...');
    
    // 测试基本连接
    await prisma.$connect();
    console.log('✅ Database connection successful');
    
    // 测试查询
    const companyCount = await prisma.company.count();
    console.log(`📊 Found ${companyCount} companies in database`);
    
    // 测试健康检查
    const healthCheck = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Health check query successful:', healthCheck);
    
    console.log('🎉 Database connection test passed!');
    
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  testDatabaseConnection();
}

module.exports = { testDatabaseConnection }; 