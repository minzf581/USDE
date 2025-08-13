const axios = require('axios');

const API_BASE = 'http://localhost:5001/api';

async function debugEnterpriseAPI() {
  console.log('🔍 调试企业用户API...\n');

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

    // 2. 检查用户信息
    console.log('\n2. 检查用户信息...');
    try {
      const profileResponse = await axios.get(`${API_BASE}/auth/profile`, authConfig);
      console.log('用户信息:', {
        id: profileResponse.data.company.id,
        name: profileResponse.data.company.name,
        email: profileResponse.data.company.email,
        role: profileResponse.data.company.role,
        isEnterpriseAdmin: profileResponse.data.company.isEnterpriseAdmin
      });
    } catch (error) {
      console.log('❌ 获取用户信息失败:', error.response?.status, error.response?.data?.error);
    }

    // 3. 测试企业用户API
    console.log('\n3. 测试企业用户API...');
    try {
      const enterpriseUsersResponse = await axios.get(`${API_BASE}/enterprise/users`, authConfig);
      console.log('✅ 企业用户API正常');
      console.log('用户数量:', enterpriseUsersResponse.data.length);
    } catch (error) {
      console.log('❌ 企业用户API错误:', error.response?.status, error.response?.data?.error);
      console.log('错误详情:', error.response?.data);
    }

    // 4. 检查数据库中的用户
    console.log('\n4. 检查数据库中的用户...');
    try {
      const usersResponse = await axios.get(`${API_BASE}/admin/users`, authConfig);
      console.log('所有用户数量:', usersResponse.data.length);
      usersResponse.data.forEach(user => {
        console.log(`- ${user.name} (${user.email}): role=${user.role}, isEnterpriseAdmin=${user.isEnterpriseAdmin}`);
      });
    } catch (error) {
      console.log('❌ 获取所有用户失败:', error.response?.status, error.response?.data?.error);
    }

  } catch (error) {
    console.error('❌ 调试失败:', error.message);
  }
}

debugEnterpriseAPI();

