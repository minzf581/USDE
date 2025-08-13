const { PrismaClient } = require('@prisma/client');

async function checkRailwayDeployment() {
  console.log('🔍 Checking Railway deployment...');
  
  try {
    // 检查环境变量
    console.log('\n📊 Environment Variables:');
    console.log('NODE_ENV:', process.env.NODE_ENV);
    console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'Not set');
    console.log('PORT:', process.env.PORT);
    
    if (!process.env.DATABASE_URL) {
      console.error('❌ DATABASE_URL is not set!');
      return;
    }
    
    // 测试数据库连接
    console.log('\n🗄️ Testing database connection...');
    const prisma = new PrismaClient();
    
    try {
      await prisma.$connect();
      console.log('✅ Database connection successful!');
      
      // 检查数据库表
      console.log('\n📋 Checking database tables...');
      const tables = await prisma.$queryRaw`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
        ORDER BY table_name
      `;
      
      console.log('📊 Available tables:');
      tables.forEach(table => {
        console.log(`  - ${table.table_name}`);
      });
      
      // 检查用户数量
      const userCount = await prisma.user.count();
      const companyCount = await prisma.company.count();
      
      console.log(`\n👥 Data summary:`);
      console.log(`  - Users: ${userCount}`);
      console.log(`  - Companies: ${companyCount}`);
      
    } catch (dbError) {
      console.error('❌ Database connection failed:', dbError.message);
    } finally {
      await prisma.$disconnect();
    }
    
  } catch (error) {
    console.error('❌ Deployment check failed:', error.message);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  checkRailwayDeployment()
    .then(() => {
      console.log('\n✅ Deployment check completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Deployment check failed:', error);
      process.exit(1);
    });
}

module.exports = { checkRailwayDeployment };
