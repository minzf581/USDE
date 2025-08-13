const axios = require('axios');

const API_BASE = 'http://localhost:5001/api';

async function testButtonState() {
  console.log('🧪 测试按钮状态...\n');

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

    // 2. 获取USDE余额数据
    console.log('\n2. 获取USDE余额数据...');
    const usdeResponse = await axios.get(`${API_BASE}/deposit/usde-balance`, authConfig);
    
    console.log('✅ USDE余额API响应:');
    console.log('完整响应:', JSON.stringify(usdeResponse.data, null, 2));
    
    // 3. 模拟前端状态
    console.log('\n3. 模拟前端状态...');
    const usdeData = usdeResponse.data;
    
    // 检查KYC状态
    const kycStatus = usdeData?.data?.kycStatus || usdeData?.kycStatus;
    console.log('KYC状态:', kycStatus);
    
    // 检查按钮禁用条件
    const loading = false; // 模拟非加载状态
    const isKycApproved = kycStatus === 'approved';
    const isButtonDisabled = loading || !isKycApproved;
    
    console.log('\n按钮状态检查:');
    console.log('- loading:', loading);
    console.log('- isKycApproved:', isKycApproved);
    console.log('- isButtonDisabled:', isButtonDisabled);
    
    // 4. 测试创建支付会话
    console.log('\n4. 测试创建支付会话...');
    try {
      const sessionResponse = await axios.post(`${API_BASE}/deposit/create-session`, {
        amount: 100,
        paymentMethod: 'card'
      }, authConfig);
      console.log('✅ 创建支付会话成功');
      console.log('响应:', JSON.stringify(sessionResponse.data, null, 2));
    } catch (error) {
      console.log('❌ 创建支付会话失败:', error.response?.status, error.response?.data?.error);
    }
    
    console.log('\n🎯 测试完成！');
    console.log('\n结论:');
    console.log('- KYC状态:', isKycApproved ? '✅ 已批准' : '❌ 未批准');
    console.log('- 按钮状态:', isButtonDisabled ? '❌ 禁用' : '✅ 可用');
    console.log('- 如果按钮仍然无法点击，可能是前端渲染问题');

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
}

testButtonState();

