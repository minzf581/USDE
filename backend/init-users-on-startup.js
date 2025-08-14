const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function initUsersOnStartup() {
  console.log('🚀 系统启动 - 检查并初始化用户...\n');
  
  try {
    // 检查是否有管理员用户
    const adminUser = await prisma.company.findUnique({
      where: { email: 'admin@usde.com' }
    });
    
    if (!adminUser) {
      console.log('👤 创建管理员用户 admin@usde.com...');
      const adminPasswordHash = await bcrypt.hash('admin123', 12);
      
      await prisma.company.create({
        data: {
          name: 'System Administrator',
          email: 'admin@usde.com',
          password: adminPasswordHash,
          type: 'enterprise',
          role: 'admin',
          status: 'active',
          kycStatus: 'approved',
          balance: 0,
          usdeBalance: 0
        }
      });
      console.log('✅ 管理员用户创建成功');
    } else {
      console.log('✅ 管理员用户已存在');
      
      // 检查并更新角色（如果需要）
      if (adminUser.role !== 'admin') {
        console.log('🔄 更新管理员用户角色...');
        await prisma.company.update({
          where: { email: 'admin@usde.com' },
          data: { role: 'admin' }
        });
        console.log('✅ 管理员用户角色更新成功');
      }
    }
    
    // 检查是否有demo企业用户
    const demoUser = await prisma.company.findUnique({
      where: { email: 'demo@usde.com' }
    });
    
    if (!demoUser) {
      console.log('👤 创建demo企业用户 demo@usde.com...');
      const demoPasswordHash = await bcrypt.hash('demo123', 12);
      
      const demoCompany = await prisma.company.create({
        data: {
          name: 'Demo Company',
          email: 'demo@usde.com',
          password: demoPasswordHash,
          type: 'enterprise',
          role: 'enterprise_admin',
          status: 'active',
          kycStatus: 'approved',
          balance: 5000,
          usdeBalance: 10000
        }
      });
      
      // 创建企业实体
      await prisma.enterprise.create({
        data: {
          name: 'Demo Enterprise',
          adminId: demoCompany.id
        }
      });
      
      // 创建Treasury设置
      await prisma.treasurySettings.create({
        data: {
          companyId: demoCompany.id,
          monthlyBudget: 1000000,
          quarterlyBudget: 3000000,
          approvalThreshold: 10000,
          autoApprovalEnabled: true,
          riskFlagThreshold: 50000,
          approvalWorkflow: 'single'
        }
      });
      
      console.log('✅ Demo企业用户创建成功');
    } else {
      console.log('✅ Demo企业用户已存在');
      
      // 检查并更新角色（如果需要）
      if (demoUser.role !== 'enterprise_admin') {
        console.log('🔄 更新demo用户角色...');
        await prisma.company.update({
          where: { email: 'demo@usde.com' },
          data: { role: 'enterprise_admin' }
        });
        console.log('✅ Demo用户角色更新成功');
      }
    }
    
    // 检查基础角色
    console.log('📝 检查基础角色...');
    const roles = [
      { id: 'role_admin', name: 'ADMIN', description: 'Administrator with full access' },
      { id: 'role_enterprise_admin', name: 'ENTERPRISE_ADMIN', description: 'Enterprise administrator' },
      { id: 'role_enterprise_user', name: 'ENTERPRISE_USER', description: 'Enterprise user' },
      { id: 'role_supervisor', name: 'SUPERVISOR', description: 'Supervisor with approval access' },
      { id: 'role_operator', name: 'OPERATOR', description: 'Operator with basic access' },
      { id: 'role_observer', name: 'OBSERVER', description: 'Observer with read-only access' }
    ];
    
    for (const role of roles) {
      try {
        await prisma.role.create({
          data: role
        });
        console.log(`✅ 创建角色: ${role.name}`);
      } catch (error) {
        if (error.code === 'P2002') {
          console.log(`ℹ️  角色已存在: ${role.name}`);
        } else {
          console.error(`❌ 创建角色失败 ${role.name}:`, error.message);
        }
      }
    }
    console.log('✅ 基础角色检查完成');
    
    // 验证用户状态
    console.log('\n🔍 验证用户状态...');
    const users = await prisma.company.findMany({
      where: { email: { in: ['admin@usde.com', 'demo@usde.com'] } },
      select: { email: true, name: true, role: true, type: true, kycStatus: true }
    });
    
    for (const user of users) {
      console.log(`✅ ${user.name} (${user.email}) - Role: ${user.role}, Type: ${user.type}, KYC: ${user.kycStatus}`);
    }
    
    console.log('\n🎉 系统启动用户初始化完成！');
    
  } catch (error) {
    console.error('❌ 用户初始化失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  initUsersOnStartup();
}

module.exports = { initUsersOnStartup };
