const axios = require('axios');

// 测试webhook处理
async function testWebhook() {
  try {
    console.log('🧪 Testing webhook processing...');
    
    // 模拟Stripe webhook事件
    const webhookEvent = {
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_test_webhook_123',
          payment_intent: 'pi_test_webhook_123',
          metadata: {
            companyId: 'cmea5njqj0001cgim0dqzrx63', // Demo Company ID
            orderId: 'cmear3r62000fbpjr3jnq5q3s', // 从日志中获取的订单ID
            usdeAmount: '2216.45',
            amount: '2222',
            paymentMethod: 'card'
          }
        }
      }
    };
    
    console.log('📤 Sending webhook event:', JSON.stringify(webhookEvent, null, 2));
    
    // 发送webhook到本地端点
    const response = await axios.post('http://localhost:5001/api/deposit/webhook', 
      JSON.stringify(webhookEvent),
      {
        headers: {
          'Content-Type': 'application/json',
          'Stripe-Signature': 'test_signature'
        }
      }
    );
    
    console.log('✅ Webhook response:', response.status, response.data);
    
    // 等待一下让数据库更新
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 检查余额是否更新
    console.log('\n🔍 Checking updated balance...');
    const balanceResponse = await axios.get('http://localhost:5001/api/deposit/usde-balance', {
      headers: {
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjb21wYW55SWQiOiJjbWVhNW5qcWowMDAxY2dpbTBkcXpyeDYzIiwiZW1haWwiOiJkZW1vQHVzZGUuY29tIiwiaWF0IjoxNzU1MTM2MDAwLCJleHAiOjE3NTUyMjI0MDB9.ZIWU6yyqgSZiV2dGcMuBYeM29yECBbg3lb-rQj6jDf8'
      }
    });
    
    console.log('💰 Balance response:', balanceResponse.status, balanceResponse.data);
    
    // 检查交易记录
    console.log('\n📊 Checking transaction records...');
    const transactionResponse = await axios.get('http://localhost:5001/api/deposit/transactions', {
      headers: {
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjb21wYW55SWQiOiJjbWVhNW5qcWowMDAxY2dpbTBkcXpyeDYzIiwiZW1haWwiOiJkZW1vQHVzZGUuY29tIiwiaWF0IjoxNzU1MTM2MDAwLCJleHAiOjE3NTUyMjI0MDB9.ZIWU6yyqgSZiV2dGcMuBYeM29yECBbg3lb-rQj6jDf8'
      }
    });
    
    console.log('📈 Transaction response:', transactionResponse.status, transactionResponse.data);
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// 运行测试
testWebhook();
