const axios = require('axios');

async function testAPIConnection() {
  const baseURL = 'https://optimistic-fulfillment-production.up.railway.app/api';
  
  console.log('🔍 Testing API connection...');
  console.log(`🌐 Base URL: ${baseURL}`);
  
  try {
    // Test health endpoint
    console.log('\n1. Testing health endpoint...');
    const healthResponse = await axios.get(`${baseURL}/health`);
    console.log('✅ Health check successful:', healthResponse.data);
    
    // Test login endpoint with admin user
    console.log('\n2. Testing login endpoint...');
    const loginData = {
      email: 'admin@usde.com',
      password: 'admin123'
    };
    
    const loginResponse = await axios.post(`${baseURL}/auth/login`, loginData);
    console.log('✅ Login successful:', {
      token: loginResponse.data.token ? 'Present' : 'Missing',
      user: loginResponse.data.company ? 'Present' : 'Missing'
    });
    
    // Test with demo user
    console.log('\n3. Testing demo user login...');
    const demoLoginData = {
      email: 'demo@usde.com',
      password: 'demo123'
    };
    
    const demoLoginResponse = await axios.post(`${baseURL}/auth/login`, demoLoginData);
    console.log('✅ Demo login successful:', {
      token: demoLoginResponse.data.token ? 'Present' : 'Missing',
      user: demoLoginResponse.data.company ? 'Present' : 'Missing'
    });
    
    console.log('\n🎉 All API tests passed!');
    
  } catch (error) {
    console.error('❌ API test failed:', error.message);
    
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    } else if (error.request) {
      console.error('No response received');
      console.error('Request error:', error.request);
    } else {
      console.error('Error setting up request:', error.message);
    }
  }
}

if (require.main === module) {
  testAPIConnection();
}

module.exports = { testAPIConnection }; 