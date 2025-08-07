const axios = require('axios');

const API_BASE_URL = 'http://localhost:5001/api';

async function testCompleteEnterpriseFlow() {
  console.log('🧪 Testing Complete Enterprise Flow...\n');

  try {
    // 1. 注册企业管理员
    console.log('1. Registering enterprise admin...');
    const registerResponse = await axios.post(`${API_BASE_URL}/auth/register`, {
      name: 'Complete Test Admin',
      email: 'complete@enterprise.com',
      password: 'password123',
      companyName: 'Complete Test Enterprise',
      companyType: 'Private Limited'
    });

    console.log('✅ Enterprise admin registered');
    console.log('   User ID:', registerResponse.data.company.id);
    console.log('   isEnterpriseAdmin:', registerResponse.data.company.isEnterpriseAdmin);
    console.log('   role:', registerResponse.data.company.role);

    const token = registerResponse.data.token;

    // 2. 创建企业用户
    console.log('\n2. Creating enterprise user...');
    const createUserResponse = await axios.post(`${API_BASE_URL}/enterprise/users`, {
      name: 'Test Finance Manager',
      email: 'finance@enterprise.com',
      password: 'password123',
      enterpriseRole: 'finance_manager'
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('✅ Enterprise user created');
    console.log('   User ID:', createUserResponse.data.user.id);
    console.log('   Role:', createUserResponse.data.user.enterpriseRole);

    // 3. 更新企业设置
    console.log('\n3. Updating enterprise settings...');
    const updateSettingsResponse = await axios.put(`${API_BASE_URL}/enterprise/settings`, {
      monthlyBudget: 100000,
      quarterlyBudget: 300000,
      approvalThreshold: 5000,
      autoApprovalEnabled: false,
      riskFlagThreshold: 15000,
      approvalWorkflow: 'dual'
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('✅ Enterprise settings updated');
    console.log('   Monthly budget:', updateSettingsResponse.data.treasurySettings.monthlyBudget);
    console.log('   Approval threshold:', updateSettingsResponse.data.treasurySettings.approvalThreshold);

    // 4. 获取企业用户列表
    console.log('\n4. Getting enterprise users...');
    const usersResponse = await axios.get(`${API_BASE_URL}/enterprise/users`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('✅ Enterprise users retrieved');
    console.log('   Users count:', usersResponse.data.length);
    console.log('   Users:', usersResponse.data.map(u => ({ name: u.name, role: u.enterpriseRole })));

    // 5. 获取企业设置
    console.log('\n5. Getting enterprise settings...');
    const settingsResponse = await axios.get(`${API_BASE_URL}/enterprise/settings`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('✅ Enterprise settings retrieved');
    console.log('   Enterprise name:', settingsResponse.data.enterprise.name);
    console.log('   Treasury settings:', settingsResponse.data.treasurySettings);

    console.log('\n🎉 Complete enterprise flow test passed!');
    console.log('\n📋 Frontend Expected Behavior:');
    console.log('   ✅ Enterprise admin should see all base menu items');
    console.log('   ✅ Enterprise admin should see "Enterprise Users" menu');
    console.log('   ✅ Enterprise admin should see "Enterprise Settings" menu');
    console.log('   ✅ Enterprise admin should see "Treasury Control" menu');
    console.log('   ✅ All enterprise functionality should be accessible');

    console.log('\n🔗 Test URLs:');
    console.log('   Frontend: http://localhost:3000');
    console.log('   Debug page: http://localhost:3000/debug');
    console.log('   Test menu: http://localhost:3000/test-menu');
    console.log('   Enterprise users: http://localhost:3000/enterprise/users');
    console.log('   Enterprise settings: http://localhost:3000/enterprise/settings');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testCompleteEnterpriseFlow(); 