const axios = require('axios');

const API_BASE_URL = 'http://localhost:5001/api';

async function testAuthToken() {
  console.log('🔍 测试认证token...\n');

  // 测试登录
  try {
    console.log('📡 测试登录...');
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: 'demo@usde.com',
      password: 'demo123'
    });
    
    if (loginResponse.data.token) {
      console.log('✅ 登录成功，获取到token');
      const token = loginResponse.data.token;
      
      // 测试使用token访问受保护的端点
      console.log('\n📡 使用token测试受保护的端点...');
      
      const authHeaders = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      const protectedEndpoints = [
        '/stake/stats/summary',
        '/stake',
        '/deposit/stats/summary',
        '/deposit/transactions?page=1&limit=20',
        '/withdrawal',
        '/withdrawal/stats/summary',
        '/bank-account'
      ];

      for (const endpoint of protectedEndpoints) {
        try {
          console.log(`\n📡 测试端点: ${endpoint}`);
          const response = await axios.get(`${API_BASE_URL}${endpoint}`, { headers: authHeaders });
          console.log(`✅ ${endpoint} 成功: ${response.status}`);
          console.log(`   响应数据:`, response.data);
        } catch (error) {
          if (error.response?.status === 500) {
            console.error(`❌ ${endpoint} 返回500错误: ${error.response.data?.error || 'Unknown error'}`);
            console.error(`   错误详情:`, error.response.data);
          } else {
            console.error(`❌ ${endpoint} 失败: ${error.message}`);
          }
        }
      }
      
    } else {
      console.error('❌ 登录成功但没有获取到token');
    }
    
  } catch (error) {
    console.error('❌ 登录失败:', error.response?.data || error.message);
  }
}

// 运行测试
testAuthToken();
