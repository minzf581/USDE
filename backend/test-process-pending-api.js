const axios = require('axios');

async function testProcessPendingAPI() {
  try {
    console.log('🧪 Testing /api/deposit/process-pending API with real login...\n');
    
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
      
      // 第二步：先获取deposit-stats来查看是否有pending的deposits
      console.log('\n🔍 Step 2: Getting deposit stats to check for pending deposits...');
      const statsResponse = await axios.get('http://localhost:5001/api/deposit/deposit-stats', {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('✅ Deposit Stats Response:', JSON.stringify(statsResponse.data, null, 2));
      
      // 检查是否有pending状态的deposits
      const pendingDeposits = statsResponse.data.data?.recentDeposits?.filter(d => d.status === 'PENDING') || [];
      
      if (pendingDeposits.length > 0) {
        console.log(`\n🔍 Found ${pendingDeposits.length} pending deposits. Testing process-pending API...`);
        
        // 测试处理第一个pending deposit
        const firstPending = pendingDeposits[0];
        console.log(`\n🔍 Step 3: Testing process-pending API for deposit ID: ${firstPending.id}`);
        
        const processResponse = await axios.post(
          `http://localhost:5001/api/deposit/process-pending/${firstPending.id}`,
          {},
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            }
          }
        );
        
        console.log('✅ Process Pending Response Status:', processResponse.status);
        console.log('✅ Process Pending Response Data:', JSON.stringify(processResponse.data, null, 2));
        
        console.log('\n🎉 SUCCESS: The process-pending API is now working correctly!');
        console.log('💡 The 500 error has been completely fixed.');
      } else {
        console.log('\n💡 No pending deposits found. The API should work when there are pending deposits.');
        console.log('💡 You can create a deposit first to test this API.');
      }
      
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
testProcessPendingAPI();
