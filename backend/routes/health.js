const express = require('express');
const router = express.Router();

// 简化的健康检查端点 - 专门用于Railway部署
router.get('/', async (req, res) => {
  const startTime = Date.now();
  const checks = {};
  let overall = 'healthy';
  
  try {
    // 基本数据库连接检查
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    try {
      // 简单的数据库查询测试
      await prisma.$queryRaw`SELECT 1 as test`;
      checks.database = 'healthy';
      console.log('✅ Health check: Database OK');
    } catch (dbError) {
      console.error('❌ Health check: Database failed:', dbError.message);
      checks.database = 'unhealthy';
      overall = 'unhealthy';
    } finally {
      await prisma.$disconnect();
    }
    
    // 基本系统检查
    checks.system = {
      nodeVersion: process.version,
      platform: process.platform,
      memory: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB',
      uptime: Math.round(process.uptime()) + 's'
    };
    
    // 环境检查
    checks.environment = {
      nodeEnv: process.env.NODE_ENV || 'development',
      port: process.env.PORT || 'not_set',
      databaseUrl: process.env.DATABASE_URL ? 'configured' : 'not_set'
    };
    
    const responseTime = Date.now() - startTime;
    
    // 返回状态
    const statusCode = overall === 'healthy' ? 200 : 503;
    console.log(`🏥 Health check: ${overall} (${statusCode}) - ${responseTime}ms`);
    
    res.status(statusCode).json({
      status: overall,
      timestamp: new Date().toISOString(),
      service: 'usde-api',
      responseTime: `${responseTime}ms`,
      checks
    });
    
  } catch (error) {
    console.error('❌ Health check failed:', error.message);
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check failed',
      message: error.message
    });
  }
});

// 轻量级ping端点
router.get('/ping', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    message: 'pong'
  });
});

module.exports = router;
