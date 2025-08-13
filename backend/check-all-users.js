const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkAllUsers() {
  try {
    console.log('🔍 Checking all users in database...\n');
    
    // Find all users
    const users = await prisma.company.findMany();
    
    if (users.length === 0) {
      console.log('❌ No users found in database');
      return;
    }
    
    console.log(`✅ Found ${users.length} user(s):\n`);
    
    users.forEach((user, index) => {
      console.log(`${index + 1}. User Details:`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Name: ${user.name}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Role: ${user.role || 'undefined'}`);
      console.log(`   Type: ${user.type || 'undefined'}`);
      console.log(`   KYC Status: ${user.kycStatus || 'undefined'}`);
      console.log(`   Balance: ${user.balance || 0}`);
      console.log(`   USDE Balance: ${user.usdeBalance || 0}`);
      console.log(`   Created At: ${user.createdAt}`);
      console.log(`   Updated At: ${user.updatedAt}`);
      console.log('---');
    });
    
  } catch (error) {
    console.error('❌ Error checking users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAllUsers();
