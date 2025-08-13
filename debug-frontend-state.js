const axios = require('axios');

const API_BASE = 'http://localhost:5001/api';

async function debugFrontendState() {
  console.log('🔍 调试前端状态...\n');

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
    
    // 3. 模拟前端状态检查
    console.log('\n3. 模拟前端状态检查...');
    const usdeData = usdeResponse.data;
    
    // 检查所有可能的数据路径
    console.log('数据路径检查:');
    console.log('- usdeData.kycStatus:', usdeData.kycStatus);
    console.log('- usdeData.data.kycStatus:', usdeData.data?.kycStatus);
    console.log('- usdeData.data?.kycStatus:', usdeData.data?.kycStatus);
    console.log('- usdeData?.kycStatus:', usdeData?.kycStatus);
    console.log('- usdeData?.data?.kycStatus:', usdeData?.data?.kycStatus);
    
    // 检查限额数据
    console.log('\n限额数据检查:');
    console.log('- usdeData.limits:', usdeData.limits);
    console.log('- usdeData.data.limits:', usdeData.data?.limits);
    console.log('- usdeData.data?.limits?.daily?.remaining:', usdeData.data?.limits?.daily?.remaining);
    
    // 检查余额数据
    console.log('\n余额数据检查:');
    console.log('- usdeData.balance:', usdeData.balance);
    console.log('- usdeData.data.balance:', usdeData.data?.balance);
    console.log('- usdeData.data?.balance?.available:', usdeData.data?.balance?.available);
    
    // 4. 模拟前端逻辑
    console.log('\n4. 模拟前端逻辑...');
    
    // KYC状态检查
    const kycStatus = usdeData?.data?.kycStatus || usdeData?.kycStatus;
    const isKycApproved = kycStatus === 'approved';
    
    // 按钮禁用逻辑
    const loading = false;
    const isButtonDisabled = loading || (usdeData?.data?.kycStatus !== 'approved' && usdeData?.kycStatus !== 'approved');
    
    // 限额检查逻辑
    const dailyRemaining = usdeData?.data?.limits?.daily?.remaining;
    const testAmount = 100;
    const isWithinLimit = !dailyRemaining || testAmount <= dailyRemaining;
    
    console.log('\n逻辑检查结果:');
    console.log('- kycStatus:', kycStatus);
    console.log('- isKycApproved:', isKycApproved);
    console.log('- loading:', loading);
    console.log('- isButtonDisabled:', isButtonDisabled);
    console.log('- dailyRemaining:', dailyRemaining);
    console.log('- testAmount:', testAmount);
    console.log('- isWithinLimit:', isWithinLimit);
    
    // 5. 测试表单提交
    console.log('\n5. 测试表单提交...');
    try {
      const sessionResponse = await axios.post(`${API_BASE}/deposit/create-session`, {
        amount: testAmount,
        paymentMethod: 'card'
      }, authConfig);
      console.log('✅ 表单提交成功');
      console.log('响应:', JSON.stringify(sessionResponse.data, null, 2));
    } catch (error) {
      console.log('❌ 表单提交失败:', error.response?.status, error.response?.data?.error);
    }
    
    console.log('\n🎯 调试完成！');
    console.log('\n结论:');
    console.log('- KYC状态:', isKycApproved ? '✅ 已批准' : '❌ 未批准');
    console.log('- 按钮状态:', isButtonDisabled ? '❌ 禁用' : '✅ 可用');
    console.log('- 限额检查:', isWithinLimit ? '✅ 在限额内' : '❌ 超出限额');
    console.log('- API调用:', '✅ 成功');
    console.log('- 如果前端按钮仍然无法点击，请检查浏览器控制台的调试信息');

  } catch (error) {
    console.error('❌ 调试失败:', error.message);
  }
}

debugFrontendState();

