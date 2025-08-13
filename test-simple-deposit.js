const axios = require('axios');

const API_BASE = 'http://localhost:5001/api';

async function testSimpleDeposit() {
  console.log('🧪 简化测试Deposit API...\n');

  try {
    // 1. 登录
    console.log('1. 登录...');
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: 'demo@usde.com',
      password: 'demo123'
    });

    const token = loginResponse.data.token;
    const authConfig = {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    };

    console.log('✅ 登录成功');

    // 2. 测试USDE余额API
    console.log('\n2. 测试USDE余额API...');
    try {
      const usdeResponse = await axios.get(`${API_BASE}/deposit/usde-balance`, authConfig);
      console.log('✅ USDE余额API正常');
      console.log('KYC状态:', usdeResponse.data.data?.kycStatus);
      console.log('余额:', usdeResponse.data.data?.balance?.available);
    } catch (error) {
      console.log('❌ USDE余额API错误:', error.response?.status, error.response?.data?.error);
    }

    // 3. 测试创建支付会话API（简化）
    console.log('\n3. 测试创建支付会话API...');
    try {
      const sessionResponse = await axios.post(`${API_BASE}/deposit/create-session`, {
        amount: 100,
        paymentMethod: 'card'
      }, authConfig);
      console.log('✅ 创建支付会话API正常');
    } catch (error) {
      console.log('❌ 创建支付会话API错误:', error.response?.status);
      console.log('错误详情:', error.response?.data);
      if (error.response?.data?.details) {
        console.log('开发模式错误详情:', error.response.data.details);
      }
    }

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
}

testSimpleDeposit();

