const express = require('express');

async function testHealthEndpoints() {
  console.log('🔍 Testing health check endpoints (simple version)...');
  
  // 创建测试服务器
  console.log('\n1️⃣ Creating test server...');
  const app = express();
  
  // 添加简化的健康检查路由
  app.get('/api/health', async (req, res) => {
    const checks = {};
    let overall = 'healthy';
    
    // 基本系统检查
    checks.system = {
      nodeVersion: process.version,
      platform: process.platform,
      uptime: Math.round(process.uptime()),
      memory: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB'
    };
    
    // 环境检查
    checks.environment = {
      nodeEnv: process.env.NODE_ENV || 'development',
      port: process.env.PORT || 'not_set',
      databaseUrl: process.env.DATABASE_URL ? 'configured' : 'not_set'
    };
    
    // 模拟数据库检查（不实际连接）
    checks.database = 'simulated_healthy';
    
    const statusCode = overall === 'healthy' ? 200 : 503;
    console.log(`🏥 Health check: ${overall} (${statusCode})`);
    
    res.status(statusCode).json({
      status: overall,
      timestamp: new Date().toISOString(),
      service: 'usde-api',
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
    console.log('\n2️⃣ Testing health check endpoints...');
    
    const testEndpoint = async (path, description) => {
      try {
        const response = await fetch(`http://localhost:${testPort}${path}`);
        const data = await response.json();
        console.log(`✅ ${description}: ${response.status} - ${JSON.stringify(data, null, 2)}`);
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
