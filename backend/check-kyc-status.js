const prisma = require('./lib/prisma');

async function checkKYCStatus() {
  try {
    console.log('🔍 检查demo用户的KYC状态...\n');
    
    // 查找demo用户
    const demoUser = await prisma.company.findUnique({
      where: { email: 'demo@usde.com' },
      select: {
        id: true,
        name: true,
        email: true,
        kycStatus: true,
        role: true,
        isEnterpriseAdmin: true,
        enterpriseRole: true
      }
    });
    
    if (demoUser) {
      console.log('Demo用户信息:');
      console.log('- ID:', demoUser.id);
      console.log('- 姓名:', demoUser.name);
      console.log('- 邮箱:', demoUser.email);
      console.log('- KYC状态:', demoUser.kycStatus);
      console.log('- 角色:', demoUser.role);
      console.log('- 企业管理员:', demoUser.isEnterpriseAdmin);
      console.log('- 企业角色:', demoUser.enterpriseRole);
      
      if (demoUser.kycStatus === 'approved') {
        console.log('\n✅ KYC状态正常');
      } else {
        console.log('\n❌ KYC状态异常，需要修复');
        
        // 修复KYC状态
        await prisma.company.update({
          where: { email: 'demo@usde.com' },
          data: { kycStatus: 'approved' }
        });
        
        console.log('✅ 已修复KYC状态为approved');
      }
    } else {
      console.log('❌ Demo用户不存在');
    }
    
  } catch (error) {
    console.error('❌ 检查失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkKYCStatus();

