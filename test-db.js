const prisma = require('./backend/lib/prisma');

async function testDatabase() {
  try {
    console.log('🔍 测试数据库连接...');
    
    // 测试基本连接
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ 数据库连接正常');
    
    // 测试查询用户
    const users = await prisma.company.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isEnterpriseAdmin: true
      }
    });
    
    console.log('✅ 用户查询正常');
    console.log('用户数量:', users.length);
    
    // 测试特定用户查询
    const demoUser = await prisma.company.findUnique({
      where: { email: 'demo@usde.com' }
    });
    
    if (demoUser) {
      console.log('✅ Demo用户查询正常');
      console.log('Demo用户信息:', {
        id: demoUser.id,
        name: demoUser.name,
        email: demoUser.email,
        role: demoUser.role,
        isEnterpriseAdmin: demoUser.isEnterpriseAdmin
      });
      
      // 测试企业用户查询
      const enterpriseUsers = await prisma.company.findMany({
        where: {
          OR: [
            { id: demoUser.id },
            { parentCompanyId: demoUser.id }
          ]
        }
      });
      
      console.log('✅ 企业用户查询正常');
      console.log('企业用户数量:', enterpriseUsers.length);
      
    } else {
      console.log('❌ Demo用户不存在');
    }
    
  } catch (error) {
    console.error('❌ 数据库测试失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testDatabase();

