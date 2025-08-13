const axios = require('axios');

const API_BASE = 'http://localhost:5001/api';

async function testFrontendKYC() {
  console.log('🧪 测试前端KYC状态处理...\n');

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

    // 2. 模拟前端API调用
    console.log('\n2. 模拟前端API调用...');
    const usdeResponse = await axios.get(`${API_BASE}/deposit/usde-balance`, authConfig);
    
    console.log('✅ USDE余额API响应:');
    console.log('完整响应:', JSON.stringify(usdeResponse.data, null, 2));
    
    // 3. 模拟前端数据处理逻辑
    console.log('\n3. 模拟前端数据处理逻辑...');
    const usdeData = usdeResponse.data;
    
    // 检查不同的KYC状态访问方式
    console.log('KYC状态检查:');
    console.log('- usdeData.kycStatus:', usdeData.kycStatus);
    console.log('- usdeData.data.kycStatus:', usdeData.data?.kycStatus);
    console.log('- usdeData.data?.kycStatus:', usdeData.data?.kycStatus);
    console.log('- usdeData?.kycStatus:', usdeData?.kycStatus);
    
    // 模拟前端的KYC检查逻辑
    const kycStatus1 = usdeData?.data?.kycStatus || usdeData?.kycStatus;
    const kycStatus2 = usdeData.data?.kycStatus === 'approved' || usdeData.kycStatus === 'approved';
    const kycStatus3 = usdeData?.kycStatus !== 'approved';
    const kycStatus4 = usdeData?.data?.kycStatus !== 'approved' && usdeData?.kycStatus !== 'approved';
    
    console.log('\n前端KYC检查结果:');
    console.log('- kycStatus1 (推荐方式):', kycStatus1);
    console.log('- kycStatus2 (OR检查):', kycStatus2);
    console.log('- kycStatus3 (简单检查):', kycStatus3);
    console.log('- kycStatus4 (AND检查):', kycStatus4);
    
    // 4. 检查余额数据
    console.log('\n4. 检查余额数据...');
    console.log('- usdeData.balance:', usdeData.balance);
    console.log('- usdeData.data.balance:', usdeData.data?.balance);
    console.log('- usdeData.data?.balance?.available:', usdeData.data?.balance?.available);
    
    // 5. 模拟前端显示逻辑
    console.log('\n5. 模拟前端显示逻辑...');
    const displayKycStatus = (usdeData?.data?.kycStatus === 'approved' || usdeData?.kycStatus === 'approved') ? 'Ready to trade' : 'Complete KYC to start trading';
    const showKycWarning = usdeData && (usdeData?.data?.kycStatus !== 'approved' && usdeData?.kycStatus !== 'approved');
    const isButtonDisabled = (usdeData?.data?.kycStatus !== 'approved' && usdeData?.kycStatus !== 'approved');
    
    console.log('- 显示状态:', displayKycStatus);
    console.log('- 显示KYC警告:', showKycWarning);
    console.log('- 按钮禁用:', isButtonDisabled);
    
    console.log('\n🎯 测试完成！');

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
}

testFrontendKYC();

