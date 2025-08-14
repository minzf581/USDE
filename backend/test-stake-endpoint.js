const axios = require('axios');

const API_BASE_URL = 'http://localhost:5001/api';

async function testStakeEndpoint() {
  console.log('🔍 测试stake端点...\n');

  try {
    // 测试登录
    console.log('📡 测试登录...');
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: 'demo@usde.com',
      password: 'demo123'
    });
    
    if (loginResponse.data.token) {
      console.log('✅ 登录成功，获取到token');
      const token = loginResponse.data.token;
      
      const authHeaders = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      // 测试stake端点
      console.log('\n📡 测试 /stake 端点...');
      try {
        const stakeResponse = await axios.get(`${API_BASE_URL}/stake`, { headers: authHeaders });
        console.log(`✅ /stake 成功: ${stakeResponse.status}`);
        console.log('   响应数据:', stakeResponse.data);
      } catch (error) {
        console.error(`❌ /stake 失败: ${error.response?.status || error.message}`);
        if (error.response?.data) {
          console.error('   错误详情:', error.response.data);
        }
        if (error.response?.status === 500) {
          console.error('   服务器错误，检查后端日志');
        }
      }

      // 测试stake stats端点
      console.log('\n📡 测试 /stake/stats/summary 端点...');
      try {
        const statsResponse = await axios.get(`${API_BASE_URL}/stake/stats/summary`, { headers: authHeaders });
        console.log(`✅ /stake/stats/summary 成功: ${statsResponse.status}`);
        console.log('   响应数据:', statsResponse.data);
      } catch (error) {
        console.error(`❌ /stake/stats/summary 失败: ${error.response?.status || error.message}`);
        if (error.response?.data) {
          console.error('   错误详情:', error.response.data);
        }
        if (error.response?.status === 500) {
          console.error('   服务器错误，检查后端日志');
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
testStakeEndpoint();
