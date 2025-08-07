const bcrypt = require('bcryptjs');
const prisma = require('../lib/prisma');

async function seedUsers() {
  try {
    console.log('🌱 Starting user seeding...');

    // 检查是否已存在系统管理员
    const existingAdmin = await prisma.company.findUnique({
      where: { email: 'admin@usde.com' }
    });

    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      await prisma.company.create({
        data: {
          name: 'System Administrator',
          email: 'admin@usde.com',
          password: hashedPassword,
          role: 'system_admin',
          kycStatus: 'approved',
          isActive: true,
          isEnterpriseAdmin: false,
          isEnterpriseUser: false,
          usdeBalance: 0,
          ucBalance: 0,
          totalEarnings: 0
        }
      });
      
      console.log('✅ System admin created: admin@usde.com');
    } else {
      console.log('ℹ️  System admin already exists: admin@usde.com');
    }

    // 检查是否已存在演示用户
    const existingDemo = await prisma.company.findUnique({
      where: { email: 'demo@usde.com' }
    });

    if (!existingDemo) {
      const hashedPassword = await bcrypt.hash('demo123', 10);
      
      await prisma.company.create({
        data: {
          name: 'Demo Company',
          email: 'demo@usde.com',
          password: hashedPassword,
          role: 'enterprise_admin',
          kycStatus: 'approved',
          isActive: true,
          isEnterpriseAdmin: true,
          isEnterpriseUser: false,
          enterpriseRole: 'enterprise_admin',
          companyName: 'Demo Company Ltd',
          enterpriseCompanyType: 'Private Limited',
          usdeBalance: 10000,
          ucBalance: 5000,
          totalEarnings: 2000
        }
      });
      
      console.log('✅ Demo user created: demo@usde.com');
    } else {
      console.log('ℹ️  Demo user already exists: demo@usde.com');
    }

    // 创建示例企业管理员
    const existingEnterpriseAdmin = await prisma.company.findUnique({
      where: { email: 'enterprise@usde.com' }
    });

    if (!existingEnterpriseAdmin) {
      const hashedPassword = await bcrypt.hash('enterprise123', 10);
      
      await prisma.company.create({
        data: {
          name: 'Enterprise Admin',
          email: 'enterprise@usde.com',
          password: hashedPassword,
          role: 'enterprise_admin',
          kycStatus: 'approved',
          isActive: true,
          isEnterpriseAdmin: true,
          isEnterpriseUser: false,
          enterpriseRole: 'enterprise_admin',
          companyName: 'Enterprise Solutions Ltd',
          enterpriseCompanyType: 'Private Limited',
          usdeBalance: 50000,
          ucBalance: 25000,
          totalEarnings: 10000
        }
      });
      
      console.log('✅ Enterprise admin created: enterprise@usde.com');
    } else {
      console.log('ℹ️  Enterprise admin already exists: enterprise@usde.com');
    }

    // 创建示例企业用户
    const existingEnterpriseUser = await prisma.company.findUnique({
      where: { email: 'user@usde.com' }
    });

    if (!existingEnterpriseUser) {
      const hashedPassword = await bcrypt.hash('user123', 10);
      
      await prisma.company.create({
        data: {
          name: 'Enterprise User',
          email: 'user@usde.com',
          password: hashedPassword,
          role: 'enterprise_user',
          kycStatus: 'approved',
          isActive: true,
          isEnterpriseAdmin: false,
          isEnterpriseUser: true,
          enterpriseRole: 'finance_operator',
          companyName: 'Enterprise Solutions Ltd',
          enterpriseCompanyType: 'Private Limited',
          usdeBalance: 5000,
          ucBalance: 2500,
          totalEarnings: 500
        }
      });
      
      console.log('✅ Enterprise user created: user@usde.com');
    } else {
      console.log('ℹ️  Enterprise user already exists: user@usde.com');
    }

    console.log('🎉 User seeding completed successfully!');
    console.log('\n📋 Default Users:');
    console.log('- System Admin: admin@usde.com / admin123');
    console.log('- Demo User: demo@usde.com / demo123');
    console.log('- Enterprise Admin: enterprise@usde.com / enterprise123');
    console.log('- Enterprise User: user@usde.com / user123');

  } catch (error) {
    console.error('❌ Error seeding users:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  seedUsers();
}

module.exports = { seedUsers }; 