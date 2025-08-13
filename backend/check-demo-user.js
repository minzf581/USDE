const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkDemoUser() {
  try {
    console.log('🔍 Checking demo user details...\n');
    
    // Find demo user
    const demoUser = await prisma.company.findUnique({
      where: { email: 'demo@usde.com' }
    });
    
    if (!demoUser) {
      console.log('❌ Demo user not found');
      return;
    }
    
    console.log('✅ Demo user found:');
    console.log('ID:', demoUser.id);
    console.log('Name:', demoUser.name);
    console.log('Email:', demoUser.email);
    console.log('Role:', demoUser.role);
    console.log('Type:', demoUser.type);
    console.log('KYC Status:', demoUser.kycStatus);
    console.log('Is Enterprise Admin:', demoUser.isEnterpriseAdmin);
    console.log('Is Enterprise User:', demoUser.isEnterpriseUser);
    console.log('Enterprise Role:', demoUser.enterpriseRole);
    console.log('Is Parent Company:', demoUser.isParentCompany);
    console.log('Company Type:', demoUser.companyType);
    console.log('Balance:', demoUser.balance);
    console.log('USDE Balance:', demoUser.usdeBalance);
    console.log('Created At:', demoUser.createdAt);
    console.log('Updated At:', demoUser.updatedAt);
    
    // Note: parentCompanyId field doesn't exist in current schema
    console.log('\n📊 Subsidiaries: Not supported in current schema');
    
    // Check treasury settings
    const treasurySettings = await prisma.treasurySettings.findUnique({
      where: { companyId: demoUser.id }
    });
    
    if (treasurySettings) {
      console.log('\n💰 Treasury Settings found');
    } else {
      console.log('\n❌ No Treasury Settings found');
    }
    
  } catch (error) {
    console.error('❌ Error checking demo user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDemoUser();
