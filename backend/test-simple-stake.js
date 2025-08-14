const express = require('express');
const { PrismaClient } = require('@prisma/client');

// 创建一个简单的测试服务器
const app = express();
const prisma = new PrismaClient();

app.use(express.json());

// 简单的stake路由
app.get('/test-stake', async (req, res) => {
  try {
    console.log('🔍 测试stake路由...');
    
    // 模拟companyId
    const companyId = 'cmebgen2l0000d7afipz0sx7e';
    console.log(`Company ID: ${companyId}`);
    
    // 查询stakes
    const stakes = await prisma.stake.findMany({
      where: { companyId: companyId },
      take: 5
    });
    
    console.log(`✅ 查询成功: ${stakes.length} 条记录`);
    
    res.json({
      success: true,
      stakes: stakes,
      count: stakes.length
    });
    
  } catch (error) {
    console.error('❌ 错误:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
});

// 启动测试服务器
const PORT = 5002;
app.listen(PORT, () => {
  console.log(`🧪 测试服务器运行在端口 ${PORT}`);
  console.log(`📡 测试端点: http://localhost:${PORT}/test-stake`);
});

// 优雅关闭
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
