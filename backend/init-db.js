const { execSync } = require('child_process');
const prisma = require('./lib/prisma');

async function initializeDatabase() {
  try {
    console.log('🗄️ Initializing database...');
    
    // Push schema to create tables
    console.log('📋 Creating database tables...');
    execSync('npx prisma db push', { stdio: 'inherit' });
    
    // Test connection
    console.log('🔍 Testing database connection...');
    await prisma.$connect();
    
    // Check if tables exist
    const tableCount = await prisma.$queryRaw`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'Company'
    `;
    
    console.log(`📊 Found ${tableCount[0].count} Company table(s)`);
    
    if (tableCount[0].count === 0) {
      console.error('❌ Company table not found after schema push');
      process.exit(1);
    }
    
    console.log('✅ Database initialization completed successfully!');
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  initializeDatabase();
}

module.exports = { initializeDatabase }; 