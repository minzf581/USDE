const axios = require('axios');

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5001/api';

async function testEnterpriseFeatures() {
  console.log('🧪 Testing Enterprise Features...\n');

  try {
    // Test 1: Register enterprise admin
    console.log('1. Testing Enterprise Admin Registration...');
    const registerResponse = await axios.post(`${API_BASE_URL}/auth/register`, {
      name: 'John Doe',
      email: 'john5@enterprise.com',
      password: 'password123',
      companyName: 'Test Enterprise Ltd',
      companyType: 'Private Limited'
    });

    console.log('✅ Enterprise admin registered successfully');
    console.log('   User ID:', registerResponse.data.company.id);
    console.log('   Enterprise Role:', registerResponse.data.company.role);
    console.log('   Token:', registerResponse.data.token);

    const token = registerResponse.data.token;

    // Test 2: Get enterprise users (should be empty initially)
    console.log('\n2. Testing Get Enterprise Users...');
    const usersResponse = await axios.get(`${API_BASE_URL}/enterprise/users`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('✅ Enterprise users retrieved successfully');
    console.log('   User count:', usersResponse.data.length);

    // Test 3: Create enterprise user
    console.log('\n3. Testing Create Enterprise User...');
    const createUserResponse = await axios.post(`${API_BASE_URL}/enterprise/users`, {
      name: 'Jane Smith',
      email: 'jane5@enterprise.com',
      password: 'password123',
      enterpriseRole: 'finance_manager'
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('✅ Enterprise user created successfully');
    console.log('   User ID:', createUserResponse.data.user.id);
    console.log('   Role:', createUserResponse.data.user.enterpriseRole);

    // Test 4: Get enterprise users again (should have 1 user)
    console.log('\n4. Testing Get Enterprise Users (after creation)...');
    const usersResponse2 = await axios.get(`${API_BASE_URL}/enterprise/users`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('✅ Enterprise users retrieved successfully');
    console.log('   User count:', usersResponse2.data.length);

    // Test 5: Update enterprise user
    console.log('\n5. Testing Update Enterprise User...');
    const updateUserResponse = await axios.put(`${API_BASE_URL}/enterprise/users/${createUserResponse.data.user.id}`, {
      name: 'Jane Smith Updated',
      enterpriseRole: 'finance_operator',
      isActive: true
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('✅ Enterprise user updated successfully');
    console.log('   Updated name:', updateUserResponse.data.user.name);
    console.log('   Updated role:', updateUserResponse.data.user.enterpriseRole);

    // Test 6: Get enterprise settings
    console.log('\n6. Testing Get Enterprise Settings...');
    const settingsResponse = await axios.get(`${API_BASE_URL}/enterprise/settings`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('✅ Enterprise settings retrieved successfully');
    console.log('   Enterprise name:', settingsResponse.data.enterprise.name);

    // Test 7: Update enterprise settings
    console.log('\n7. Testing Update Enterprise Settings...');
    const updateSettingsResponse = await axios.put(`${API_BASE_URL}/enterprise/settings`, {
      monthlyBudget: 50000,
      quarterlyBudget: 150000,
      approvalThreshold: 2000,
      autoApprovalEnabled: true,
      riskFlagThreshold: 10000,
      approvalWorkflow: 'dual'
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('✅ Enterprise settings updated successfully');
    console.log('   Monthly budget:', updateSettingsResponse.data.treasurySettings.monthlyBudget);
    console.log('   Approval threshold:', updateSettingsResponse.data.treasurySettings.approvalThreshold);

    // Test 8: Delete enterprise user
    console.log('\n8. Testing Delete Enterprise User...');
    await axios.delete(`${API_BASE_URL}/enterprise/users/${createUserResponse.data.user.id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('✅ Enterprise user deleted successfully');

    // Test 9: Get enterprise users again (should be empty)
    console.log('\n9. Testing Get Enterprise Users (after deletion)...');
    const usersResponse3 = await axios.get(`${API_BASE_URL}/enterprise/users`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('✅ Enterprise users retrieved successfully');
    console.log('   User count:', usersResponse3.data.length);

    console.log('\n🎉 All enterprise tests passed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  testEnterpriseFeatures();
}

module.exports = { testEnterpriseFeatures }; 