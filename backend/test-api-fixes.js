const axios = require('axios');

const BASE_URL = 'http://localhost:5001';
let authToken = '';

async function testAPIs() {
  console.log('🚀 开始测试修复后的API...\n');

  try {
    // 1. 测试登录
    console.log('1️⃣ 测试登录API...');
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'demo@usde.com',
      password: 'demo123'
    });
    
    if (loginResponse.data.token) {
      authToken = loginResponse.data.token;
      console.log('✅ 登录成功');
      console.log(`   用户: ${loginResponse.data.company.name} (${loginResponse.data.company.email})`);
      console.log(`   角色: ${loginResponse.data.company.role}`);
    } else {
      throw new Error('登录失败：未获取到token');
    }

    // 设置请求头
    const headers = {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    };

    console.log('\n2️⃣ 测试Treasury Approvals API...');
    try {
      const approvalsResponse = await axios.get(`${BASE_URL}/api/treasury/approvals`, { headers });
      console.log('✅ Treasury Approvals API 成功');
      console.log(`   返回数据: ${JSON.stringify(approvalsResponse.data)}`);
    } catch (error) {
      console.log('❌ Treasury Approvals API 失败:', error.response?.data?.error || error.message);
    }

    console.log('\n3️⃣ 测试Consolidated Balance API...');
    try {
      const balanceResponse = await axios.get(`${BASE_URL}/api/company/${loginResponse.data.company.id}/consolidated-balance`, { headers });
      console.log('✅ Consolidated Balance API 成功');
      console.log(`   父公司余额: ${balanceResponse.data.consolidatedBalance.parentCompany.balance} USD`);
      console.log(`   子公司数量: ${balanceResponse.data.consolidatedBalance.subsidiaries.count}`);
      console.log(`   总余额: ${balanceResponse.data.consolidatedBalance.consolidated.totalBalance} USD`);
    } catch (error) {
      console.log('❌ Consolidated Balance API 失败:', error.response?.data?.error || error.message);
    }

    console.log('\n4️⃣ 测试Subsidiaries API...');
    try {
      const subsidiariesResponse = await axios.get(`${BASE_URL}/api/company/${loginResponse.data.company.id}/subsidiaries`, { headers });
      console.log('✅ Subsidiaries API 成功');
      console.log(`   子公司数量: ${subsidiariesResponse.data.count}`);
      subsidiariesResponse.data.subsidiaries.forEach((sub, index) => {
        console.log(`   子公司 ${index + 1}: ${sub.name} (${sub.companyCode})`);
      });
    } catch (error) {
      console.log('❌ Subsidiaries API 失败:', error.response?.data?.error || error.message);
    }

    console.log('\n5️⃣ 测试Settings API...');
    try {
      const settingsResponse = await axios.get(`${BASE_URL}/api/settings`, { headers });
      console.log('✅ Settings API 成功');
      console.log(`   区块链网络: ${settingsResponse.data.settings.blockchain.currentChain}`);
      console.log(`   维护模式: ${settingsResponse.data.settings.system.maintenanceMode}`);
    } catch (error) {
      console.log('❌ Settings API 失败:', error.response?.data?.error || error.message);
    }

    console.log('\n🎉 所有API测试完成！');

  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error.message);
    if (error.response) {
      console.error('   响应状态:', error.response.status);
      console.error('   响应数据:', error.response.data);
    }
  }
}

// 运行测试
testAPIs();
