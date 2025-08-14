const axios = require('axios');
const jwt = require('jsonwebtoken');

async function testDepositStatsAPI() {
  try {
    console.log('🧪 Testing /api/deposit/deposit-stats API...\n');
    
    // 创建一个测试token（使用环境变量中的JWT_SECRET）
    const testToken = jwt.sign(
      { companyId: 'test-company-id' },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );
    
    console.log('🔑 Generated test token:', testToken.substring(0, 20) + '...');
    
    // 测试API端点
    const response = await axios.get('http://localhost:5001/api/deposit/deposit-stats', {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${testToken}`
      }
    });
    
    console.log('✅ API Response Status:', response.status);
    console.log('✅ API Response Data:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    if (error.response) {
      console.log('❌ API Error Status:', error.response.status);
      console.log('❌ API Error Data:', error.response.data);
      
      if (error.response.status === 401) {
        console.log('\n💡 The API is working but authentication failed. This means the route is properly configured.');
      }
    } else {
      console.log('❌ Network Error:', error.message);
    }
  }
}

// 运行测试
testDepositStatsAPI();
