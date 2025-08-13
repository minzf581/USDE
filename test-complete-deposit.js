const axios = require('axios');

const API_BASE = 'http://localhost:5001/api';

async function testCompleteDeposit() {
  console.log('🧪 完整测试Deposit功能...\n');

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
      console.log('每日限额剩余:', usdeResponse.data.data?.limits?.daily?.remaining);
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
      console.log('订单ID:', sessionResponse.data.data?.orderId);
      console.log('会话ID:', sessionResponse.data.data?.sessionId);
      console.log('金额:', sessionResponse.data.data?.amount);
      console.log('USDE金额:', sessionResponse.data.data?.usdeAmount);
      console.log('手续费:', sessionResponse.data.data?.fee);
    } catch (error) {
      console.log('❌ 创建支付会话API错误:', error.response?.status, error.response?.data?.error);
    }

    // 4. 测试获取统计信息API
    console.log('\n4. 测试获取统计信息API...');
    try {
      const statsResponse = await axios.get(`${API_BASE}/deposit/stats/summary`, authConfig);
      console.log('✅ 统计信息API正常');
      console.log('统计信息:', statsResponse.data);
    } catch (error) {
      console.log('❌ 统计信息API错误:', error.response?.status, error.response?.data?.error);
    }

    // 5. 测试获取历史记录API
    console.log('\n5. 测试获取历史记录API...');
    try {
      const historyResponse = await axios.get(`${API_BASE}/deposit`, authConfig);
      console.log('✅ 历史记录API正常');
      console.log('历史记录数量:', historyResponse.data?.data?.length || 0);
    } catch (error) {
      console.log('❌ 历史记录API错误:', error.response?.status, error.response?.data?.error);
    }

    console.log('\n🎉 所有Deposit API测试完成！');

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
}

testCompleteDeposit();

