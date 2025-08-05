const prisma = require('./lib/prisma');

async function checkDatabaseUsers() {
  try {
    console.log('🔍 Checking database users...');
    
    // Connect to database
    await prisma.$connect();
    console.log('✅ Database connection successful');
    
    // Check all users
    const users = await prisma.company.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        kycStatus: true,
        isActive: true,
        usdeBalance: true,
        ucBalance: true
      }
    });
    
    console.log(`📊 Found ${users.length} users in database:`);
    
    users.forEach(user => {
      console.log(`  - ${user.email} (${user.role}) - Status: ${user.kycStatus} - Active: ${user.isActive}`);
    });
    
    // Check specific admin user
    const adminUser = await prisma.company.findUnique({
      where: { email: 'admin@usde.com' }
    });
    
    if (adminUser) {
      console.log('\n✅ Admin user found:');
      console.log(`  - Email: ${adminUser.email}`);
      console.log(`  - Role: ${adminUser.role}`);
      console.log(`  - Status: ${adminUser.kycStatus}`);
      console.log(`  - Active: ${adminUser.isActive}`);
      console.log(`  - USDE Balance: ${adminUser.usdeBalance}`);
      console.log(`  - UC Balance: ${adminUser.ucBalance}`);
    } else {
      console.log('\n❌ Admin user not found!');
    }
    
    // Check demo user
    const demoUser = await prisma.company.findUnique({
      where: { email: 'demo@usde.com' }
    });
    
    if (demoUser) {
      console.log('\n✅ Demo user found:');
      console.log(`  - Email: ${demoUser.email}`);
      console.log(`  - Role: ${demoUser.role}`);
      console.log(`  - Status: ${demoUser.kycStatus}`);
      console.log(`  - Active: ${demoUser.isActive}`);
      console.log(`  - USDE Balance: ${demoUser.usdeBalance}`);
      console.log(`  - UC Balance: ${demoUser.ucBalance}`);
    } else {
      console.log('\n❌ Demo user not found!');
    }
    
    console.log('\n🎉 Database check completed!');
    
  } catch (error) {
    console.error('❌ Database check failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  checkDatabaseUsers();
}

module.exports = { checkDatabaseUsers }; 