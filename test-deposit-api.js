const axios = require('axios');

const API_BASE = 'http://localhost:5001/api';

async function testDepositAPI() {
  console.log('🧪 测试Deposit API...\n');

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
      console.log('响应数据:', {
        kycStatus: usdeResponse.data.data?.kycStatus,
        balance: usdeResponse.data.data?.balance?.available,
        dailyRemaining: usdeResponse.data.data?.limits?.daily?.remaining
      });
    } catch (error) {
      console.log('❌ USDE余额API错误:', error.response?.status, error.response?.data?.error);
    }

    // 3. 测试创建支付会话API
    console.log('\n3. 测试创建支付会话API...');
    try {
      const sessionResponse = await axios.post(`${API_BASE}/deposit/create-session`, {
        amount: 100,
        paymentMethod: 'card'
      }, authConfig);
      console.log('✅ 创建支付会话API正常');
      console.log('响应数据:', {
        orderId: sessionResponse.data.data?.orderId,
        sessionId: sessionResponse.data.data?.sessionId,
        amount: sessionResponse.data.data?.amount,
        usdeAmount: sessionResponse.data.data?.usdeAmount
      });
    } catch (error) {
      console.log('❌ 创建支付会话API错误:', error.response?.status, error.response?.data?.error);
    }

    // 4. 测试获取统计信息API
    console.log('\n4. 测试获取统计信息API...');
    try {
      const statsResponse = await axios.get(`${API_BASE}/deposit/stats/summary`, authConfig);
      console.log('✅ 统计信息API正常');
      console.log('响应数据:', statsResponse.data);
    } catch (error) {
      console.log('❌ 统计信息API错误:', error.response?.status, error.response?.data?.error);
    }

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
}

testDepositAPI();

