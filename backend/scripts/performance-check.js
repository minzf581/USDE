// scripts/performance-check.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function performanceCheck() {
  console.log('🔍 Running performance checks...\n');
  
  try {
    // 检查表大小
    const tableSizes = await prisma.$queryRaw`
      SELECT 
        name as table_name,
        sqlite_compileoption_used('ENABLE_JSON1') as json_support
      FROM sqlite_master 
      WHERE type='table' AND name NOT LIKE 'sqlite_%'
      ORDER BY name;
    `;
    
    console.log('📏 Database tables:');
    console.table(tableSizes);
    
    // 检查索引
    const indexes = await prisma.$queryRaw`
      SELECT 
        name as index_name,
        tbl_name as table_name,
        sql as index_sql
      FROM sqlite_master 
      WHERE type='index' AND name NOT LIKE 'sqlite_%'
      ORDER BY tbl_name, name;
    `;
    
    console.log('\n📈 Indexes:');
    console.table(indexes);
    
    // 检查数据统计
    const [companyCount, depositCount, transactionCount] = await Promise.all([
      prisma.company.count(),
      prisma.deposit.count(),
      prisma.uSDETransaction.count()
    ]);
    
    console.log('\n📊 Data statistics:');
    console.table({
      companies: companyCount,
      deposits: depositCount,
      transactions: transactionCount
    });
    
    // 检查最近的交易
    const recentTransactions = await prisma.uSDETransaction.findMany({
      take: 5,
      orderBy: { timestamp: 'desc' },
      select: {
        id: true,
        type: true,
        amount: true,
        timestamp: true
      }
    });
    
    console.log('\n🕒 Recent transactions:');
    console.table(recentTransactions);
    
  } catch (error) {
    console.error('❌ Performance check failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  performanceCheck().catch(console.error);
}

module.exports = performanceCheck;



