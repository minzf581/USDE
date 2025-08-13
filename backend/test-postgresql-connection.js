const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

async function testPostgreSQLConnection() {
  console.log('🔍 Testing PostgreSQL connection...');
  
  // 检查环境变量
  console.log('\n📊 Environment Variables:');
  console.log('NODE_ENV:', process.env.NODE_ENV);
  console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'Not set');
  
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL is not set!');
    console.log('💡 Please set DATABASE_URL in your .env file or environment');
    return;
  }
  
  // 检查是否是PostgreSQL连接字符串
  if (!process.env.DATABASE_URL.includes('postgresql://')) {
    console.error('❌ DATABASE_URL is not a PostgreSQL connection string!');
    console.log('💡 Expected format: postgresql://user:password@host:port/database');
    return;
  }
  
  console.log('✅ DATABASE_URL format is correct');
  
  try {
    // 生成Prisma客户端
    console.log('\n🔧 Generating Prisma client...');
    const { execSync } = require('child_process');
    execSync('npx prisma generate', { stdio: 'inherit' });
    console.log('✅ Prisma client generated successfully');
    
    // 测试数据库连接
    console.log('\n🗄️ Testing database connection...');
    const prisma = new PrismaClient();
    
    try {
      await prisma.$connect();
      console.log('✅ Database connection successful!');
      
      // 测试基本查询
      console.log('\n📋 Testing basic queries...');
      const result = await prisma.$queryRaw`SELECT version()`;
      console.log('✅ Database query successful:', result[0].version);
      
      // 检查数据库表
      console.log('\n📊 Checking database schema...');
      const tables = await prisma.$queryRaw`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
        ORDER BY table_name
      `;
      
      console.log('📋 Available tables:');
      tables.forEach(table => {
        console.log(`  - ${table.table_name}`);
      });
      
    } catch (dbError) {
      console.error('❌ Database connection failed:', dbError.message);
      console.log('\n💡 Troubleshooting tips:');
      console.log('1. Check if PostgreSQL server is running');
      console.log('2. Verify connection credentials');
      console.log('3. Check network connectivity');
      console.log('4. Ensure database exists');
    } finally {
      await prisma.$disconnect();
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// 运行测试
testPostgreSQLConnection()
  .then(() => {
    console.log('\n✅ PostgreSQL connection test completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ PostgreSQL connection test failed:', error);
    process.exit(1);
  });
