const axios = require('axios');

const API_BASE_URL = 'http://localhost:5001/api';

async function testAPIEndpoints() {
  console.log('🔍 测试API端点...\n');

  // 测试健康检查端点
  try {
    console.log('📡 测试健康检查端点...');
    const healthResponse = await axios.get(`${API_BASE_URL}/health`);
    console.log(`✅ 健康检查成功: ${healthResponse.status}`);
  } catch (error) {
    console.error(`❌ 健康检查失败: ${error.message}`);
  }

  // 测试需要认证的端点（应该返回401）
  const endpoints = [
    '/stake/stats/summary',
    '/stake',
    '/deposit/stats/summary',
    '/deposit/transactions?page=1&limit=20',
    '/withdrawal',
    '/withdrawal/stats/summary',
    '/bank-account'
  ];

  for (const endpoint of endpoints) {
    try {
      console.log(`\n📡 测试端点: ${endpoint}`);
      const response = await axios.get(`${API_BASE_URL}${endpoint}`);
      console.log(`✅ ${endpoint} 成功: ${response.status}`);
    } catch (error) {
      if (error.response?.status === 401) {
        console.log(`✅ ${endpoint} 正确返回401 (需要认证)`);
      } else if (error.response?.status === 500) {
        console.error(`❌ ${endpoint} 返回500错误: ${error.response.data?.error || 'Unknown error'}`);
      } else {
        console.error(`❌ ${endpoint} 失败: ${error.message}`);
      }
    }
  }

  // 测试根端点
  try {
    console.log('\n📡 测试根端点...');
    const rootResponse = await axios.get('http://localhost:5001/');
    console.log(`✅ 根端点成功: ${rootResponse.status}`);
  } catch (error) {
    console.error(`❌ 根端点失败: ${error.message}`);
  }
}

// 运行测试
testAPIEndpoints();
