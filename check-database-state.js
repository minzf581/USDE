const axios = require('axios');

const API_BASE = 'http://localhost:5001/api';

async function checkDatabaseState() {
  console.log('🔍 检查数据库状态...\n');

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

    // 2. 检查用户余额
    console.log('\n2. 检查用户余额...');
    const balanceResponse = await axios.get(`${API_BASE}/deposit/usde-balance`, authConfig);
    console.log('当前余额:', balanceResponse.data.data.balance.available);

    // 3. 检查deposit记录
    console.log('\n3. 检查deposit记录...');
    try {
      const depositsResponse = await axios.get(`${API_BASE}/deposit`, authConfig);
      console.log('Deposit记录数量:', depositsResponse.data?.data?.length || 0);
      if (depositsResponse.data?.data?.length > 0) {
        console.log('最新的deposit记录:');
        depositsResponse.data.data.slice(0, 3).forEach((deposit, index) => {
          console.log(`  ${index + 1}. ID: ${deposit.id}, 金额: ${deposit.amount}, 状态: ${deposit.status}, 时间: ${deposit.timestamp}`);
        });
      }
    } catch (error) {
      console.log('❌ 无法获取deposit记录:', error.response?.status);
    }

    // 4. 检查交易历史
    console.log('\n4. 检查交易历史...');
    try {
      const transactionsResponse = await axios.get(`${API_BASE}/deposit/transactions`, authConfig);
      console.log('交易记录数量:', transactionsResponse.data?.data?.length || 0);
      if (transactionsResponse.data?.data?.length > 0) {
        console.log('最新的交易记录:');
        transactionsResponse.data.data.slice(0, 3).forEach((tx, index) => {
          console.log(`  ${index + 1}. 类型: ${tx.type}, 金额: ${tx.amount}, 余额前: ${tx.balanceBefore}, 余额后: ${tx.balanceAfter}`);
        });
      }
    } catch (error) {
      console.log('❌ 无法获取交易历史:', error.response?.status);
    }

    // 5. 检查用户资料
    console.log('\n5. 检查用户资料...');
    try {
      const profileResponse = await axios.get(`${API_BASE}/auth/profile`, authConfig);
      console.log('用户资料:', {
        id: profileResponse.data.id,
        email: profileResponse.data.email,
        usdeBalance: profileResponse.data.usdeBalance,
        kycStatus: profileResponse.data.kycStatus
      });
    } catch (error) {
      console.log('❌ 无法获取用户资料:', error.response?.status);
    }

    console.log('\n🎯 数据库状态检查完成！');

  } catch (error) {
    console.error('❌ 检查失败:', error.message);
  }
}

checkDatabaseState();

