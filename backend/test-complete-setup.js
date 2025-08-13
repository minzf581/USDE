#!/usr/bin/env node

/**
 * 完整设置测试脚本
 * 测试所有关键功能是否正常工作
 */

const { generateSchema } = require('./generate-schema');
const { validateSchema } = require('./validate-schema');

async function testCompleteSetup() {
  console.log('🧪 完整设置测试');
  console.log('================');
  
  let allTestsPassed = true;
  
  // 测试1: SQLite Schema生成
  console.log('\n1️⃣ 测试SQLite Schema生成...');
  try {
    // 重置环境变量
    delete process.env.RAILWAY_ENVIRONMENT;
    delete process.env.RAILWAY_SERVICE_NAME;
    process.env.NODE_ENV = 'development';
    
    generateSchema();
    
    // 验证生成的schema
    if (validateSchema()) {
      console.log('✅ SQLite Schema测试通过');
    } else {
      console.log('❌ SQLite Schema测试失败');
      allTestsPassed = false;
    }
  } catch (error) {
    console.log('❌ SQLite Schema测试失败:', error.message);
    allTestsPassed = false;
  }
  
  // 测试2: PostgreSQL Schema生成
  console.log('\n2️⃣ 测试PostgreSQL Schema生成...');
  try {
    // 设置Railway环境
    process.env.RAILWAY_ENVIRONMENT = 'production';
    process.env.NODE_ENV = 'production';
    
    generateSchema();
    
    // 验证生成的schema
    if (validateSchema()) {
      console.log('✅ PostgreSQL Schema测试通过');
    } else {
      console.log('❌ PostgreSQL Schema测试失败');
      allTestsPassed = false;
    }
  } catch (error) {
    console.log('❌ PostgreSQL Schema测试失败:', error.message);
    allTestsPassed = false;
  }
  
  // 测试3: Prisma客户端生成
  console.log('\n3️⃣ 测试Prisma客户端生成...');
  try {
    const { execSync } = require('child_process');
    execSync('npx prisma generate', { stdio: 'pipe' });
    console.log('✅ Prisma客户端生成测试通过');
  } catch (error) {
    console.log('❌ Prisma客户端生成测试失败:', error.message);
    allTestsPassed = false;
  }
  
  // 测试4: 环境检测
  console.log('\n4️⃣ 测试环境检测...');
  try {
    // 测试本地环境
    delete process.env.RAILWAY_ENVIRONMENT;
    process.env.NODE_ENV = 'development';
    generateSchema();
    console.log('✅ 本地环境检测测试通过');
    
    // 测试Railway环境
    process.env.RAILWAY_ENVIRONMENT = 'production';
    process.env.NODE_ENV = 'production';
    generateSchema();
    console.log('✅ Railway环境检测测试通过');
  } catch (error) {
    console.log('❌ 环境检测测试失败:', error.message);
    allTestsPassed = false;
  }
  
  // 最终结果
  console.log('\n📊 测试结果汇总:');
  if (allTestsPassed) {
    console.log('🎉 所有测试都通过了！');
    console.log('✅ 你的设置已经完全准备好部署到Railway了');
  } else {
    console.log('❌ 部分测试失败，请检查错误信息');
  }
  
  return allTestsPassed;
}

// 如果直接运行此脚本
if (require.main === module) {
  testCompleteSetup()
    .then((success) => {
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error('测试过程中发生错误:', error);
      process.exit(1);
    });
}

module.exports = { testCompleteSetup };
