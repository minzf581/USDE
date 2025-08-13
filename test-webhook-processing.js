const axios = require('axios');

const API_BASE = 'http://localhost:5001/api';

async function testWebhookProcessing() {
  console.log('🧪 测试Webhook处理...\n');

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

    // 2. 获取初始余额
    console.log('\n2. 获取初始余额...');
    const initialBalanceResponse = await axios.get(`${API_BASE}/deposit/usde-balance`, authConfig);
    const initialBalance = initialBalanceResponse.data.data.balance.available;
    console.log('初始余额:', initialBalance);

    // 3. 创建支付会话
    console.log('\n3. 创建支付会话...');
    const sessionResponse = await axios.post(`${API_BASE}/deposit/create-session`, {
      amount: 100,
      paymentMethod: 'card'
    }, authConfig);
    
    console.log('✅ 支付会话创建成功');
    console.log('订单ID:', sessionResponse.data.data.orderId);
    console.log('会话ID:', sessionResponse.data.data.sessionId);
    console.log('USDE金额:', sessionResponse.data.data.usdeAmount);

    // 4. 模拟webhook事件
    console.log('\n4. 模拟webhook事件...');
    const webhookData = {
      id: 'evt_test_webhook',
      object: 'event',
      type: 'checkout.session.completed',
      data: {
        object: {
          id: sessionResponse.data.data.sessionId,
          payment_intent: 'pi_test_payment_intent',
          metadata: {
            companyId: 'cme2y4p830001jd0pxh21bnj3', // demo用户的ID
            orderId: sessionResponse.data.data.orderId,
            usdeAmount: sessionResponse.data.data.usdeAmount.toString(),
            paymentMethod: 'card'
          }
        }
      }
    };

    // 注意：这里只是模拟，实际的webhook需要Stripe签名
    console.log('Webhook数据:', JSON.stringify(webhookData, null, 2));

    // 5. 检查数据库中的订单状态
    console.log('\n5. 检查订单状态...');
    try {
      const orderResponse = await axios.get(`${API_BASE}/deposit/${sessionResponse.data.data.orderId}`, authConfig);
      console.log('订单状态:', orderResponse.data);
    } catch (error) {
      console.log('❌ 无法获取订单状态:', error.response?.status);
    }

    // 6. 检查最终余额
    console.log('\n6. 检查最终余额...');
    const finalBalanceResponse = await axios.get(`${API_BASE}/deposit/usde-balance`, authConfig);
    const finalBalance = finalBalanceResponse.data.data.balance.available;
    console.log('最终余额:', finalBalance);
    console.log('余额变化:', finalBalance - initialBalance);

    console.log('\n🎯 测试完成！');
    console.log('\n注意: 实际的webhook处理需要Stripe发送真实的webhook事件');
    console.log('当前余额变化为0是正常的，因为webhook还没有被触发');

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
}

testWebhookProcessing();

