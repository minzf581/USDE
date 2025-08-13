const axios = require('axios');

const API_BASE = 'http://localhost:5001/api';

async function debugKYCAndLogs() {
  console.log('🔍 调试KYC状态和API日志...\n');

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
    console.log('Token:', token.substring(0, 20) + '...');

    // 2. 测试用户资料API
    console.log('\n2. 测试用户资料API...');
    try {
      const profileResponse = await axios.get(`${API_BASE}/auth/profile`, authConfig);
      console.log('✅ 用户资料API正常');
      console.log('用户信息:', {
        id: profileResponse.data.id,
        email: profileResponse.data.email,
        role: profileResponse.data.role,
        kycStatus: profileResponse.data.kycStatus,
        isEnterpriseAdmin: profileResponse.data.isEnterpriseAdmin
      });
    } catch (error) {
      console.log('❌ 用户资料API错误:', error.response?.status, error.response?.data?.error);
    }

    // 3. 测试USDE余额API（带详细日志）
    console.log('\n3. 测试USDE余额API...');
    try {
      console.log('发送请求到:', `${API_BASE}/deposit/usde-balance`);
      const usdeResponse = await axios.get(`${API_BASE}/deposit/usde-balance`, authConfig);
      console.log('✅ USDE余额API正常');
      console.log('响应数据:', JSON.stringify(usdeResponse.data, null, 2));
    } catch (error) {
      console.log('❌ USDE余额API错误:', error.response?.status, error.response?.data?.error);
      console.log('错误详情:', error.response?.data);
    }

    // 4. 测试创建支付会话API（带详细日志）
    console.log('\n4. 测试创建支付会话API...');
    try {
      console.log('发送请求到:', `${API_BASE}/deposit/create-session`);
      const sessionResponse = await axios.post(`${API_BASE}/deposit/create-session`, {
        amount: 100,
        paymentMethod: 'card'
      }, authConfig);
      console.log('✅ 创建支付会话API正常');
      console.log('响应数据:', JSON.stringify(sessionResponse.data, null, 2));
    } catch (error) {
      console.log('❌ 创建支付会话API错误:', error.response?.status, error.response?.data?.error);
      console.log('错误详情:', error.response?.data);
    }

    // 5. 检查数据库中的KYC状态
    console.log('\n5. 检查数据库中的KYC状态...');
    try {
      const dbCheckResponse = await axios.get(`${API_BASE}/admin/companies`, authConfig);
      console.log('✅ 数据库检查API正常');
      const demoUser = dbCheckResponse.data.find(user => user.email === 'demo@usde.com');
      if (demoUser) {
        console.log('Demo用户数据库状态:', {
          id: demoUser.id,
          email: demoUser.email,
          kycStatus: demoUser.kycStatus,
          role: demoUser.role,
          isEnterpriseAdmin: demoUser.isEnterpriseAdmin
        });
      } else {
        console.log('❌ 未找到demo用户');
      }
    } catch (error) {
      console.log('❌ 数据库检查API错误:', error.response?.status, error.response?.data?.error);
    }

    console.log('\n🎯 调试完成！');

  } catch (error) {
    console.error('❌ 调试失败:', error.message);
  }
}

debugKYCAndLogs();

