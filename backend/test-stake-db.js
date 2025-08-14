const { PrismaClient } = require('@prisma/client');

async function testStakeDatabase() {
  console.log('🔍 测试stake数据库查询...\n');
  
  const prisma = new PrismaClient({
    log: ['query', 'error', 'warn'],
    errorFormat: 'pretty',
  });

  try {
    // 测试基本连接
    console.log('📡 测试基本连接...');
    await prisma.$queryRaw`SELECT 1`;
    console.log('✅ 基本连接成功');

    // 测试stake表查询
    console.log('\n📊 测试stake表查询...');
    
    // 1. 测试count查询
    console.log('   1. 测试count查询...');
    const stakeCount = await prisma.stake.count();
    console.log(`   ✅ stake count查询成功: ${stakeCount}`);

    // 2. 测试findMany查询
    console.log('   2. 测试findMany查询...');
    const stakes = await prisma.stake.findMany({
      take: 5,
      orderBy: { start_date: 'desc' }
    });
    console.log(`   ✅ stake findMany查询成功: ${stakes.length} 条记录`);

    // 3. 测试aggregate查询
    console.log('   3. 测试aggregate查询...');
    const stakeAggregate = await prisma.stake.aggregate({
      _sum: { amount: true }
    });
    console.log(`   ✅ stake aggregate查询成功: ${stakeAggregate._sum.amount || 0}`);

    // 4. 测试特定companyId查询
    console.log('   4. 测试特定companyId查询...');
    const companyId = 'demo-company-id'; // 使用一个示例ID
    const companyStakes = await prisma.stake.findMany({
      where: { companyId: companyId }
    });
    console.log(`   ✅ 特定companyId查询成功: ${companyStakes.length} 条记录`);

    console.log('\n🎉 所有stake数据库测试通过！');

  } catch (error) {
    console.error('❌ stake数据库测试失败:', error);
    
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
    console.error('1. 检查Prisma schema文件');
    console.error('2. 检查数据库表结构');
    console.error('3. 运行数据库迁移');
    console.error('4. 检查字段名是否一致');
  } finally {
    await prisma.$disconnect();
  }
}

// 运行测试
testStakeDatabase();
