const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createDemoUser() {
  try {
    console.log('🔧 Creating demo user...\n');
    
    // Hash password
    const hashedPassword = await bcrypt.hash('demo123', 12);
    
    // Create demo user
    const demoUser = await prisma.company.create({
      data: {
        name: 'Demo Company',
        email: 'demo@usde.com',
        password: hashedPassword,
        type: 'enterprise',
        role: 'enterprise_admin',
        status: 'active',
        kycStatus: 'approved',
        balance: 5000,
        usdeBalance: 10000
      }
    });
    
    console.log('✅ Demo user created successfully');
    console.log('Email:', demoUser.email);
    console.log('Role:', demoUser.role);
    console.log('Type:', demoUser.type);
    console.log('KYC Status:', demoUser.kycStatus);
    console.log('Balance:', demoUser.balance);
    console.log('USDE Balance:', demoUser.usdeBalance);
    
    // Verify the user
    const verifyUser = await prisma.company.findUnique({
      where: { email: 'demo@usde.com' }
    });
    
    console.log('\n🔍 Verification:');
    console.log('Role:', verifyUser.role);
    console.log('Type:', verifyUser.type);
    
  } catch (error) {
    console.error('❌ Error creating demo user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createDemoUser();
