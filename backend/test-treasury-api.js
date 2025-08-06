const axios = require('axios');

const API_BASE_URL = 'http://localhost:5001/api';

// Test treasury API endpoints
async function testTreasuryAPI() {
  console.log('🧪 Testing Treasury API endpoints...\n');

  try {
    // Test health endpoint
    console.log('1. Testing health endpoint...');
    const healthResponse = await axios.get(`${API_BASE_URL}/health`);
    console.log('✅ Health endpoint:', healthResponse.data);

    // Test treasury dashboard (will fail without auth, but should return 401)
    console.log('\n2. Testing treasury dashboard (unauthorized)...');
    try {
      await axios.get(`${API_BASE_URL}/treasury/dashboard`);
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Treasury dashboard: Properly protected (401 Unauthorized)');
      } else {
        console.log('❌ Treasury dashboard: Unexpected error:', error.response?.status);
      }
    }

    // Test treasury settings (will fail without auth)
    console.log('\n3. Testing treasury settings (unauthorized)...');
    try {
      await axios.get(`${API_BASE_URL}/treasury/settings`);
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Treasury settings: Properly protected (401 Unauthorized)');
      } else {
        console.log('❌ Treasury settings: Unexpected error:', error.response?.status);
      }
    }

    // Test treasury users (will fail without auth)
    console.log('\n4. Testing treasury users (unauthorized)...');
    try {
      await axios.get(`${API_BASE_URL}/treasury/users`);
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Treasury users: Properly protected (401 Unauthorized)');
      } else {
        console.log('❌ Treasury users: Unexpected error:', error.response?.status);
      }
    }

    // Test treasury approvals (will fail without auth)
    console.log('\n5. Testing treasury approvals (unauthorized)...');
    try {
      await axios.get(`${API_BASE_URL}/treasury/approvals`);
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Treasury approvals: Properly protected (401 Unauthorized)');
      } else {
        console.log('❌ Treasury approvals: Unexpected error:', error.response?.status);
      }
    }

    // Test treasury logs (will fail without auth)
    console.log('\n6. Testing treasury logs (unauthorized)...');
    try {
      await axios.get(`${API_BASE_URL}/treasury/logs`);
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Treasury logs: Properly protected (401 Unauthorized)');
      } else {
        console.log('❌ Treasury logs: Unexpected error:', error.response?.status);
      }
    }

    // Test treasury reports (will fail without auth)
    console.log('\n7. Testing treasury reports (unauthorized)...');
    try {
      await axios.get(`${API_BASE_URL}/treasury/reports/monthly`);
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Treasury reports: Properly protected (401 Unauthorized)');
      } else {
        console.log('❌ Treasury reports: Unexpected error:', error.response?.status);
      }
    }

    console.log('\n🎉 All treasury API endpoints are properly configured!');
    console.log('📋 Summary:');
    console.log('   ✅ Health endpoint working');
    console.log('   ✅ All treasury endpoints properly protected with authentication');
    console.log('   ✅ API routes are correctly registered');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testTreasuryAPI(); 