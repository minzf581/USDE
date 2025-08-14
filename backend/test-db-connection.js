const { PrismaClient } = require('@prisma/client');

async function testDatabaseConnection() {
  console.log('🔍 测试数据库连接...');
  
  const prisma = new PrismaClient({
    log: ['query', 'error', 'warn'],
    errorFormat: 'pretty',
  });

  try {
    // 测试基本连接
    console.log('📡 测试基本连接...');
    await prisma.$queryRaw`SELECT 1`;
    console.log('✅ 基本连接成功');

    // 测试stake表
    console.log('📊 测试stake表...');
    const stakeCount = await prisma.stake.count();
    console.log(`✅ stake表连接成功，记录数: ${stakeCount}`);

    // 测试deposit表
    console.log('📊 测试deposit表...');
    const depositCount = await prisma.deposit.count();
    console.log(`✅ deposit表连接成功，记录数: ${depositCount}`);

    // 测试withdrawal表
    console.log('📊 测试withdrawal表...');
    const withdrawalCount = await prisma.withdrawal.count();
    console.log(`✅ withdrawal表连接成功，记录数: ${withdrawalCount}`);

    // 测试bankAccount表
    console.log('📊 测试bankAccount表...');
    const bankAccountCount = await prisma.bankAccount.count();
    console.log(`✅ bankAccount表连接成功，记录数: ${bankAccountCount}`);

    // 测试company表
    console.log('📊 测试company表...');
    const companyCount = await prisma.company.count();
    console.log(`✅ company表连接成功，记录数: ${companyCount}`);

    console.log('\n🎉 所有数据库测试通过！');

  } catch (error) {
    console.error('❌ 数据库连接测试失败:', error);
    
    if (error.code === 'P1001') {
      console.error('💡 提示: 无法连接到数据库服务器');
    } else if (error.code === 'P1002') {
      console.error('💡 提示: 数据库连接超时');
    } else if (error.code === 'P1003') {
      console.error('💡 提示: 数据库不存在');
    } else if (error.code === 'P1008') {
      console.error('💡 提示: 数据库操作超时');
    } else if (error.code === 'P2002') {
      console.error('💡 提示: 唯一约束冲突');
    } else if (error.code === 'P2025') {
      console.error('💡 提示: 记录未找到');
    }
    
    console.error('\n🔧 建议的解决方案:');
    console.error('1. 检查DATABASE_URL环境变量');
    console.error('2. 确保数据库服务器正在运行');
    console.error('3. 检查数据库权限');
    console.error('4. 验证Prisma schema文件');
  } finally {
    await prisma.$disconnect();
  }
}

// 运行测试
testDatabaseConnection();
