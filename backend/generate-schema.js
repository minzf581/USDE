#!/usr/bin/env node

/**
 * 动态生成Prisma Schema文件
 * 根据环境自动选择数据库提供者
 */

const fs = require('fs');
const path = require('path');

function generateSchema() {
  console.log('🔧 动态生成Prisma Schema...');
  
  // 检测环境
  const isRailway = process.env.RAILWAY_ENVIRONMENT || process.env.RAILWAY_SERVICE_NAME;
  const isProduction = process.env.NODE_ENV === 'production';
  
  let targetSchema;
  let provider;
  
  if (isRailway || isProduction) {
    console.log('🚂 检测到Railway/生产环境，使用PostgreSQL');
    targetSchema = 'schema.postgresql.prisma';
    provider = 'postgresql';
  } else {
    console.log('💻 检测到本地开发环境，使用SQLite');
    targetSchema = 'schema.sqlite.prisma';
    provider = 'sqlite';
  }
  
  // 检查目标schema文件是否存在
  const targetPath = path.join(__dirname, 'prisma', targetSchema);
  if (!fs.existsSync(targetPath)) {
    console.error(`❌ 目标schema文件不存在: ${targetPath}`);
    process.exit(1);
  }
  
  // 读取目标schema文件
  const schemaContent = fs.readFileSync(targetPath, 'utf8');
  
  // 写入主schema文件
  const mainSchemaPath = path.join(__dirname, 'prisma', 'schema.prisma');
  fs.writeFileSync(mainSchemaPath, schemaContent);
  
  console.log(`✅ Schema已生成: ${provider}`);
  console.log(`   文件: ${mainSchemaPath}`);
  console.log(`   提供者: ${provider}`);
  console.log(`   环境: ${isRailway ? 'Railway' : isProduction ? 'Production' : 'Local'}`);
}

// 如果直接运行此脚本
if (require.main === module) {
  generateSchema();
}

module.exports = { generateSchema };
