const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function setDemoRole() {
  try {
    console.log('🔧 Setting demo user role...\n');
    
    // Update demo user role
    const updatedUser = await prisma.company.update({
      where: { email: 'demo@usde.com' },
      data: {
        role: 'enterprise_admin',
        type: 'enterprise'
      }
    });
    
    console.log('✅ Demo user role updated successfully');
    console.log('Email:', updatedUser.email);
    console.log('Role:', updatedUser.role);
    console.log('Type:', updatedUser.type);
    
    // Verify the update
    const verifyUser = await prisma.company.findUnique({
      where: { email: 'demo@usde.com' }
    });
    
    console.log('\n🔍 Verification:');
    console.log('Role:', verifyUser.role);
    console.log('Type:', verifyUser.type);
    
  } catch (error) {
    console.error('❌ Error setting demo user role:', error);
  } finally {
    await prisma.$disconnect();
  }
}

setDemoRole();
