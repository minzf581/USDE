const axios = require('axios');

const API_BASE_URL = 'http://localhost:5001/api';

// 测试配置
const testConfig = {
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
};

// 模拟登录获取token
async function login() {
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: 'test@company.com',
      password: 'password123'
    });
    return response.data.token;
  } catch (error) {
    console.log('Login failed, creating test company...');
    // 创建测试公司
    const registerResponse = await axios.post(`${API_BASE_URL}/auth/register`, {
      name: 'Test Company',
      email: 'test@company.com',
      password: 'password123'
    });
    return registerResponse.data.token;
  }
}

// 测试USDE余额API
async function testUSDEBalance(token) {
  try {
    const response = await axios.get(`${API_BASE_URL}/deposit/usde-balance`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ USDE Balance API:', response.data);
    return response.data;
  } catch (error) {
    console.log('❌ USDE Balance API failed:', error.response?.data || error.message);
  }
}

// 测试创建Stripe会话
async function testCreateStripeSession(token) {
  try {
    const response = await axios.post(`${API_BASE_URL}/deposit/create-session`, {
      amount: 100
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Create Stripe Session API:', response.data);
    return response.data;
  } catch (error) {
    console.log('❌ Create Stripe Session API failed:', error.response?.data || error.message);
  }
}

// 测试提现API
async function testWithdraw(token) {
  try {
    const response = await axios.post(`${API_BASE_URL}/deposit/withdraw`, {
      amount: 10,
      walletAddress: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6'
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Withdraw API:', response.data);
    return response.data;
  } catch (error) {
    console.log('❌ Withdraw API failed:', error.response?.data || error.message);
  }
}

// 测试统计API
async function testStats(token) {
  try {
    const response = await axios.get(`${API_BASE_URL}/deposit/stats/summary`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Stats API:', response.data);
    return response.data;
  } catch (error) {
    console.log('❌ Stats API failed:', error.response?.data || error.message);
  }
}

// 主测试函数
async function runTests() {
  console.log('🚀 Starting Deposit Module Tests...\n');
  
  try {
    // 登录获取token
    const token = await login();
    console.log('✅ Login successful\n');
    
    // 测试各个API
    await testUSDEBalance(token);
    await testStats(token);
    await testCreateStripeSession(token);
    await testWithdraw(token);
    
    console.log('\n✅ All tests completed!');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// 运行测试
runTests(); 