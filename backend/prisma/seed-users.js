const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function seedUsers() {
  try {
    console.log('🌱 Seeding users...');

    // 检查是否已存在种子用户
    const existingAdmin = await prisma.company.findUnique({
      where: { email: 'admin@usde.com' }
    });

    const existingDemo = await prisma.company.findUnique({
      where: { email: 'demo@usde.com' }
    });

    // 创建管理员用户
    if (!existingAdmin) {
      const adminPassword = await bcrypt.hash('admin123', 12);
      const admin = await prisma.company.create({
        data: {
          name: 'USDE Admin',
          email: 'admin@usde.com',
          password: adminPassword,
          role: 'admin',
          kycStatus: 'approved',
          isActive: true,
          usdeBalance: 100000,
          ucBalance: 100000,
          totalEarnings: 5000
        }
      });
      console.log('✅ Admin user created:', admin.email);
    } else {
      console.log('ℹ️  Admin user already exists');
    }

    // 创建演示用户
    if (!existingDemo) {
      const demoPassword = await bcrypt.hash('demo123', 12);
      const demo = await prisma.company.create({
        data: {
          name: 'Demo Company',
          email: 'demo@usde.com',
          password: demoPassword,
          role: 'demo',
          kycStatus: 'approved',
          isActive: true,
          usdeBalance: 50000,
          ucBalance: 50000,
          totalEarnings: 2500
        }
      });
      console.log('✅ Demo user created:', demo.email);
    } else {
      console.log('ℹ️  Demo user already exists');
    }

    console.log('🎉 User seeding completed!');
    console.log('\n📋 Default Users:');
    console.log('Admin: admin@usde.com / admin123');
    console.log('Demo:  demo@usde.com / demo123');

  } catch (error) {
    console.error('❌ Seeding error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// 运行种子脚本
seedUsers(); 