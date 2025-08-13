#!/usr/bin/env node

/**
 * 测试登录API
 */

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

async function testLoginAPI() {
  console.log('🧪 测试登录API...');
  
  try {
    // 创建测试服务器
    const app = express();
    app.use(express.json());
    
    // 模拟登录路由
    app.post('/api/auth/login', async (req, res) => {
      try {
        const { email, password } = req.body;
        
        console.log(`📧 登录尝试: ${email}`);
        
        // 这里应该查询数据库，但为了测试我们模拟
        if (email === 'admin@usde.com' && password === 'admin123') {
          const token = jwt.sign(
            { companyId: 'admin-company-id', email: 'admin@usde.com' },
            process.env.JWT_SECRET || 'fallback-secret',
            { expiresIn: '24h' }
          );
          
          res.json({
            success: true,
            message: 'Login successful',
            data: {
              token: token,
              user: {
                id: 'admin-company-id',
                email: 'admin@usde.com',
                name: 'System Administrator',
                type: 'enterprise'
              }
            }
          });
        } else if (email === 'demo@usde.com' && password === 'demo123') {
          const token = jwt.sign(
            { companyId: 'demo-company-id', email: 'demo@usde.com' },
            process.env.JWT_SECRET || 'fallback-secret',
            { expiresIn: '24h' }
          );
          
          res.json({
            success: true,
            message: 'Login successful',
            data: {
              token: token,
              user: {
                id: 'demo-company-id',
                email: 'demo@usde.com',
                name: 'Demo Company',
                type: 'enterprise'
              }
            }
          });
        } else {
          res.status(401).json({
            success: false,
            message: 'Invalid credentials'
          });
        }
      } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
          success: false,
          message: 'Internal server error'
        });
      }
    });
    
    // 启动测试服务器
    const testPort = 3003;
    const server = app.listen(testPort, () => {
      console.log(`✅ 测试服务器运行在端口 ${testPort}`);
      
      // 测试登录
      testLogin();
    });
    
    async function testLogin() {
      try {
        console.log('\n🔐 测试管理员登录...');
        const adminResponse = await fetch(`http://localhost:${testPort}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: 'admin@usde.com',
            password: 'admin123'
          })
        });
        
        const adminData = await adminResponse.json();
        console.log('📊 管理员登录结果:');
        console.log(`   状态码: ${adminResponse.status}`);
        console.log(`   响应:`, JSON.stringify(adminData, null, 2));
        
        if (adminResponse.status === 200 && adminData.success && adminData.data.token) {
          console.log('✅ 管理员登录测试通过！');
        } else {
          console.log('❌ 管理员登录测试失败');
        }
        
        console.log('\n🔐 测试演示用户登录...');
        const demoResponse = await fetch(`http://localhost:${testPort}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: 'demo@usde.com',
            password: 'demo123'
          })
        });
        
        const demoData = await demoResponse.json();
        console.log('📊 演示用户登录结果:');
        console.log(`   状态码: ${demoResponse.status}`);
        console.log(`   响应:`, JSON.stringify(demoData, null, 2));
        
        if (demoResponse.status === 200 && demoData.success && demoData.data.token) {
          console.log('✅ 演示用户登录测试通过！');
        } else {
          console.log('❌ 演示用户登录测试失败');
        }
        
        console.log('\n🔐 测试无效凭据...');
        const invalidResponse = await fetch(`http://localhost:${testPort}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: 'invalid@example.com',
            password: 'wrongpassword'
          })
        });
        
        const invalidData = await invalidResponse.json();
        console.log('📊 无效凭据测试结果:');
        console.log(`   状态码: ${invalidResponse.status}`);
        console.log(`   响应:`, JSON.stringify(invalidData, null, 2));
        
        if (invalidResponse.status === 401 && !invalidData.success) {
          console.log('✅ 无效凭据测试通过！');
        } else {
          console.log('❌ 无效凭据测试失败');
        }
        
      } catch (error) {
        console.error('❌ 测试失败:', error.message);
      } finally {
        // 关闭测试服务器
        server.close();
        console.log('\n🔒 测试服务器已关闭');
      }
    }
    
  } catch (error) {
    console.error('❌ 测试设置失败:', error.message);
  }
}

// 运行测试
testLoginAPI().catch(console.error);
