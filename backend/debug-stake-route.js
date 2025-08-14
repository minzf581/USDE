const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');

async function debugStakeRoute() {
  console.log('🔍 调试stake路由...\n');
  
  const prisma = new PrismaClient({
    log: ['query', 'error', 'warn'],
    errorFormat: 'pretty',
  });

  try {
    // 1. 获取demo用户
    console.log('📡 1. 获取demo用户...');
    const demoUser = await prisma.company.findFirst({
      where: { email: 'demo@usde.com' }
    });
    
    if (!demoUser) {
      console.error('❌ 找不到demo用户');
      return;
    }
    
    console.log(`✅ 找到demo用户: ${demoUser.id} (${demoUser.email})`);
    console.log(`   用户状态: ${demoUser.status}, KYC状态: ${demoUser.kycStatus}`);

    // 2. 模拟JWT token验证
    console.log('\n📡 2. 模拟JWT token验证...');
    const token = jwt.sign(
      { companyId: demoUser.id },
      process.env.JWT_SECRET || 'your-super-secret-jwt-key-here'
    );
    console.log('✅ JWT token生成成功');

    // 3. 模拟verifyToken中间件
    console.log('\n📡 3. 模拟verifyToken中间件...');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-super-secret-jwt-key-here');
    console.log(`✅ Token解码成功: companyId = ${decoded.companyId}`);

    // 4. 模拟stake查询逻辑
    console.log('\n📡 4. 模拟stake查询逻辑...');
    const companyId = decoded.companyId;
    const page = 1;
    const limit = 10;
    const offset = (page - 1) * limit;

    console.log(`   查询参数: companyId=${companyId}, page=${page}, limit=${limit}, offset=${offset}`);

    const whereClause = { companyId: companyId };
    console.log(`   whereClause:`, whereClause);

    // 5. 执行stake查询
    console.log('\n📡 5. 执行stake查询...');
    
    console.log('   5.1 查询stakes...');
    const stakes = await prisma.stake.findMany({
      where: whereClause,
      orderBy: { start_date: 'desc' },
      skip: offset,
      take: parseInt(limit)
    });
    console.log(`   ✅ stakes查询成功: ${stakes.length} 条记录`);

    console.log('   5.2 查询总数...');
    const total = await prisma.stake.count({ where: whereClause });
    console.log(`   ✅ 总数查询成功: ${total}`);

    // 6. 模拟计算逻辑
    console.log('\n📡 6. 模拟计算逻辑...');
    const stakesWithEarnings = stakes.map(stake => {
      const now = new Date();
      const daysHeld = Math.floor((now - stake.start_date) / (1000 * 60 * 60 * 24));
      const dailyRate = stake.apy / 365;
      const currentEarnings = stake.status === 'active' ? (stake.amount * dailyRate * daysHeld) : 0;

      return {
        ...stake,
        currentEarnings: Math.max(0, currentEarnings),
        daysHeld,
        isExpired: stake.end_date ? now > stake.end_date : false
      };
    });

    console.log(`✅ 计算逻辑执行成功: ${stakesWithEarnings.length} 条记录`);

    // 7. 构建响应
    console.log('\n📡 7. 构建响应...');
    const response = {
      stakes: stakesWithEarnings,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    };

    console.log('✅ 响应构建成功:');
    console.log('   响应数据:', JSON.stringify(response, null, 2));

    console.log('\n🎉 stake路由调试完成！所有步骤都成功执行。');

  } catch (error) {
    console.error('❌ stake路由调试失败:', error);
    console.error('错误堆栈:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

// 运行调试
debugStakeRoute();
