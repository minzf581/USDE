const axios = require('axios');

const testCORS = async () => {
  const baseURL = 'https://optimistic-fulfillment-usde.up.railway.app';
  
  console.log('🧪 Testing CORS configuration...');
  
  try {
    // Test 1: Simple GET request
    console.log('\n1. Testing GET request...');
    const response1 = await axios.get(`${baseURL}/api/debug-cors`, {
      headers: {
        'Origin': 'https://usde-frontend-usde.up.railway.app'
      }
    });
    console.log('✅ GET request successful:', response1.data);
    
    // Test 2: OPTIONS preflight request
    console.log('\n2. Testing OPTIONS preflight...');
    const response2 = await axios.options(`${baseURL}/api/auth/login`, {
      headers: {
        'Origin': 'https://usde-frontend-usde.up.railway.app',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type,Authorization'
      }
    });
    console.log('✅ OPTIONS request successful');
    console.log('CORS Headers:', {
      'Access-Control-Allow-Origin': response2.headers['access-control-allow-origin'],
      'Access-Control-Allow-Methods': response2.headers['access-control-allow-methods'],
      'Access-Control-Allow-Headers': response2.headers['access-control-allow-headers']
    });
    
    // Test 3: POST request simulation
    console.log('\n3. Testing POST request...');
    const response3 = await axios.post(`${baseURL}/api/auth/login`, {
      email: 'test@example.com',
      password: 'test123'
    }, {
      headers: {
        'Origin': 'https://usde-frontend-usde.up.railway.app',
        'Content-Type': 'application/json'
      }
    });
    console.log('✅ POST request successful (expected to fail with auth error)');
    
  } catch (error) {
    if (error.response) {
      console.log('❌ Request failed with status:', error.response.status);
      console.log('Response headers:', error.response.headers);
      console.log('Response data:', error.response.data);
    } else {
      console.log('❌ Network error:', error.message);
    }
  }
};

testCORS(); 