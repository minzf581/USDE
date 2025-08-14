const axios = require('axios');

async function testCreateSessionAPI() {
  try {
    console.log('🧪 Testing /api/deposit/create-session API with real login...\n');
    
    // 第一步：登录获取token
    console.log('🔐 Step 1: Logging in to get valid token...');
    const loginResponse = await axios.post('http://localhost:5001/api/auth/login', {
      email: 'demo@usde.com',
      password: 'demo123'
    });
    
    if (loginResponse.data.token) {
      const token = loginResponse.data.token;
      console.log('✅ Login successful! Token received.');
      console.log('👤 Company ID:', loginResponse.data.company.id);
      
      // 第二步：使用有效token测试create-session API
      console.log('\n🔍 Step 2: Testing create-session API with valid token...');
      const sessionResponse = await axios.post('http://localhost:5001/api/deposit/create-session', 
        {
          amount: 100,
          paymentMethod: 'card'
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      console.log('✅ API Response Status:', sessionResponse.status);
      console.log('✅ API Response Data:', JSON.stringify(sessionResponse.data, null, 2));
      
      console.log('\n🎉 SUCCESS: The create-session API is now working correctly!');
      console.log('💡 The 500 error has been completely fixed.');
      
    } else {
      console.log('❌ Login failed:', loginResponse.data);
    }
    
  } catch (error) {
    if (error.response) {
      console.log('❌ API Error Status:', error.response.status);
      console.log('❌ API Error Data:', error.response.data);
      
      if (error.response.status === 500) {
        console.log('\n❌ The API is still returning 500 errors. More fixes needed.');
      } else if (error.response.status === 401) {
        console.log('\n❌ Authentication failed. Check login credentials.');
      } else {
        console.log('\n❌ Unexpected error occurred.');
      }
    } else {
      console.log('❌ Network Error:', error.message);
    }
  }
}

// 运行测试
testCreateSessionAPI();
