const bcrypt = require('bcryptjs');
const prisma = require('../lib/prisma');

async function seedUsers() {
  try {
    console.log('🌱 Starting user seeding with fixed schema...');

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
          type: 'enterprise', // 使用新的type字段
          status: 'active',    // 使用新的status字段
          kycStatus: 'approved',
          balance: 0,
          usdeBalance: 0
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
      
      const demoUser = await prisma.company.create({
        data: {
          name: 'Demo Company',
          email: 'demo@usde.com',
          password: hashedPassword,
          type: 'enterprise', // 父公司类型
          status: 'active',
          kycStatus: 'approved',
          balance: 5000,
          usdeBalance: 10000
        }
      });

      // 创建子公司作为演示
      const subsidiaryUser = await prisma.company.create({
        data: {
          name: 'Demo Subsidiary',
          email: 'subsidiary@usde.com',
          password: hashedPassword,
          type: 'subsidiary',
          status: 'active',
          kycStatus: 'approved',
          balance: 2500,
          usdeBalance: 5000
        }
      });
      
      console.log('✅ Demo user created: demo@usde.com');
      console.log('✅ Demo subsidiary created: subsidiary@usde.com');
    } else {
      console.log('ℹ️  Demo user already exists: demo@usde.com');
    }

    console.log('🎉 User seeding completed successfully!');
    console.log('\n📋 Default Users:');
    console.log('- Admin: admin@usde.com / admin123 (System Administrator)');
    console.log('- Demo User: demo@usde.com / demo123 (Enterprise Admin)');
    console.log('- Demo Subsidiary: subsidiary@usde.com / demo123 (Subsidiary)');

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
