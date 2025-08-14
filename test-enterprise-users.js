const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testEnterpriseUsers() {
  try {
    console.log('🧪 测试企业用户管理功能...');
    
    // 1. 检查数据库中的企业用户
    console.log('\n1. 检查企业用户数据...');
    const enterpriseUsers = await prisma.company.findMany({
      where: {
        OR: [
          { role: 'enterprise_admin' },
          { role: 'enterprise_finance_manager' },
          { role: 'enterprise_finance_operator' }
        ]
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        enterpriseRole: true,
        isActive: true,
        kycStatus: true,
        createdAt: true
      }
    });
    
    console.log('找到的企业用户:', enterpriseUsers);
    
    // 2. 检查企业管理员
    console.log('\n2. 检查企业管理员...');
    const enterpriseAdmins = await prisma.company.findMany({
      where: { role: 'enterprise_admin' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true
      }
    });
    
    console.log('企业管理员:', enterpriseAdmins);
    
    // 3. 检查企业结构
    console.log('\n3. 检查企业结构...');
    if (enterpriseAdmins.length > 0) {
      const admin = enterpriseAdmins[0];
      const enterpriseUsers = await prisma.company.findMany({
        where: {
          OR: [
            { id: admin.id },
            { enterpriseId: admin.id }
          ]
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          enterpriseRole: true,
          enterpriseId: true,
          isActive: true,
          kycStatus: true,
          createdAt: true
        }
      });
      
      console.log(`企业 ${admin.name} 的用户:`, enterpriseUsers);
    }
    
  } catch (error) {
    console.error('测试失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testEnterpriseUsers();
