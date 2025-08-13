const axios = require('axios');

const API_BASE = 'http://localhost:5001/api';

// 测试配置
const testConfig = {
  headers: {
    'Content-Type': 'application/json'
  }
};

async function testAPI() {
  console.log('🧪 开始API测试...\n');

  try {
    // 1. 测试登录
    console.log('1. 测试登录...');
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: 'demo@usde.com',
      password: 'demo123'
    }, testConfig);

    const token = loginResponse.data.token;
    const authConfig = {
      ...testConfig,
      headers: {
        ...testConfig.headers,
        'Authorization': `Bearer ${token}`
      }
    };

    console.log('✅ 登录成功');

    // 2. 测试银行账户API
    console.log('\n2. 测试银行账户API...');
    try {
      const bankAccountsResponse = await axios.get(`${API_BASE}/bank-account`, authConfig);
      console.log('✅ 银行账户API正常');
    } catch (error) {
      console.log('❌ 银行账户API错误:', error.response?.status, error.response?.data?.error);
    }

    // 3. 测试企业用户API
    console.log('\n3. 测试企业用户API...');
    try {
      const enterpriseUsersResponse = await axios.get(`${API_BASE}/enterprise/users`, authConfig);
      console.log('✅ 企业用户API正常');
    } catch (error) {
      console.log('❌ 企业用户API错误:', error.response?.status, error.response?.data?.error);
    }

    // 4. 测试Treasury API
    console.log('\n4. 测试Treasury API...');
    try {
      const treasuryResponse = await axios.get(`${API_BASE}/treasury/approvals`, authConfig);
      console.log('✅ Treasury API正常');
    } catch (error) {
      console.log('❌ Treasury API错误:', error.response?.status, error.response?.data?.error);
    }

    // 5. 测试Settings API
    console.log('\n5. 测试Settings API...');
    try {
      const settingsResponse = await axios.get(`${API_BASE}/settings`, authConfig);
      console.log('✅ Settings API正常');
    } catch (error) {
      console.log('❌ Settings API错误:', error.response?.status, error.response?.data?.error);
    }

    // 6. 测试Dashboard API
    console.log('\n6. 测试Dashboard API...');
    try {
      const dashboardResponse = await axios.get(`${API_BASE}/dashboard`, authConfig);
      console.log('✅ Dashboard API正常');
    } catch (error) {
      console.log('❌ Dashboard API错误:', error.response?.status, error.response?.data?.error);
    }

    console.log('\n🎉 API测试完成！');

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
}

testAPI();

