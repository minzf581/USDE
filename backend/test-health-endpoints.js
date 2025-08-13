const express = require('express');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

async function testHealthEndpoints() {
  console.log('🔍 Testing health check endpoints...');
  
  // 测试数据库连接
  console.log('\n1️⃣ Testing database connection...');
  try {
    const prisma = new PrismaClient();
    await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Database connection successful');
    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return;
  }
  
  // 测试环境变量
  console.log('\n2️⃣ Checking environment variables...');
  console.log('   NODE_ENV:', process.env.NODE_ENV);
  console.log('   PORT:', process.env.PORT);
  console.log('   DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'Not set');
  
  // 创建测试服务器
  console.log('\n3️⃣ Creating test server...');
  const app = express();
  
  // 添加健康检查路由
  app.get('/api/health', async (req, res) => {
    const checks = {};
    let overall = 'healthy';
    
    try {
      const prisma = new PrismaClient();
      await prisma.$queryRaw`SELECT 1 as test`;
      checks.database = 'healthy';
      await prisma.$disconnect();
    } catch (error) {
      checks.database = 'unhealthy';
      overall = 'unhealthy';
    }
    
    checks.system = {
      nodeVersion: process.version,
      platform: process.platform,
      uptime: Math.round(process.uptime())
    };
    
    const statusCode = overall === 'healthy' ? 200 : 503;
    res.status(statusCode).json({
      status: overall,
      timestamp: new Date().toISOString(),
      checks
    });
  });
  
  app.get('/api/health/ping', (req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      message: 'pong'
    });
  });
  
  // 启动测试服务器
  const testPort = 3001;
  const server = app.listen(testPort, () => {
    console.log(`✅ Test server running on port ${testPort}`);
    
    // 测试健康检查端点
    console.log('\n4️⃣ Testing health check endpoints...');
    
    const testEndpoint = async (path, description) => {
      try {
        const response = await fetch(`http://localhost:${testPort}${path}`);
        const data = await response.json();
        console.log(`✅ ${description}: ${response.status} - ${JSON.stringify(data)}`);
      } catch (error) {
        console.error(`❌ ${description} failed:`, error.message);
      }
    };
    
    // 测试端点
    testEndpoint('/api/health', 'Full health check');
    testEndpoint('/api/health/ping', 'Ping endpoint');
    
    // 关闭测试服务器
    setTimeout(() => {
      server.close();
      console.log('\n✅ Health check test completed');
      process.exit(0);
    }, 1000);
  });
}

// 运行测试
testHealthEndpoints().catch(console.error);
