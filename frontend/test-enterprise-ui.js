const axios = require('axios');

const API_BASE_URL = 'http://localhost:5001/api';

async function testEnterpriseUI() {
  console.log('🧪 Testing Enterprise UI...\n');

  try {
    // 1. 注册企业管理员
    console.log('1. Registering enterprise admin...');
    const registerResponse = await axios.post(`${API_BASE_URL}/auth/register`, {
      name: 'UI Test Admin',
      email: 'uitest@enterprise.com',
      password: 'password123',
      companyName: 'UI Test Enterprise',
      companyType: 'Private Limited'
    });

    console.log('✅ Enterprise admin registered');
    console.log('   User data:', registerResponse.data.company);
    console.log('   isEnterpriseAdmin:', registerResponse.data.company.isEnterpriseAdmin);
    console.log('   role:', registerResponse.data.company.role);

    const token = registerResponse.data.token;

    // 2. 测试登录
    console.log('\n2. Testing login...');
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: 'uitest@enterprise.com',
      password: 'password123'
    });

    console.log('✅ Login successful');
    console.log('   User data:', loginResponse.data.company);
    console.log('   isEnterpriseAdmin:', loginResponse.data.company.isEnterpriseAdmin);

    // 3. 测试profile端点
    console.log('\n3. Testing profile endpoint...');
    const profileResponse = await axios.get(`${API_BASE_URL}/auth/profile`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('✅ Profile fetched');
    console.log('   User data:', profileResponse.data.company);
    console.log('   isEnterpriseAdmin:', profileResponse.data.company.isEnterpriseAdmin);

    // 4. 测试企业用户API
    console.log('\n4. Testing enterprise users API...');
    const usersResponse = await axios.get(`${API_BASE_URL}/enterprise/users`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('✅ Enterprise users API working');
    console.log('   Users count:', usersResponse.data.length);

    // 5. 测试企业设置API
    console.log('\n5. Testing enterprise settings API...');
    const settingsResponse = await axios.get(`${API_BASE_URL}/enterprise/settings`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('✅ Enterprise settings API working');
    console.log('   Enterprise:', settingsResponse.data.enterprise);

    console.log('\n🎉 All API tests passed!');
    console.log('\n📋 Expected Frontend Menu Items for Enterprise Admin:');
    console.log('   - Dashboard');
    console.log('   - Profile');
    console.log('   - Payments');
    console.log('   - Stakes');
    console.log('   - Deposits');
    console.log('   - Withdrawals');
    console.log('   - KYC');
    console.log('   - Enterprise Users');
    console.log('   - Enterprise Settings');
    console.log('   - Treasury Control');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testEnterpriseUI(); 