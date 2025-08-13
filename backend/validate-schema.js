#!/usr/bin/env node

/**
 * 验证Prisma Schema文件
 * 检查关系字段是否正确定义
 */

const fs = require('fs');
const path = require('path');

function validateSchema() {
  console.log('🔍 验证Prisma Schema...');
  
  const schemaPath = path.join(__dirname, 'prisma', 'schema.prisma');
  
  if (!fs.existsSync(schemaPath)) {
    console.error('❌ Schema文件不存在:', schemaPath);
    return false;
  }
  
  const schemaContent = fs.readFileSync(schemaPath, 'utf8');
  
  // 检查基本结构
  const hasGenerator = schemaContent.includes('generator client');
  const hasDatasource = schemaContent.includes('datasource db');
  
  if (!hasGenerator || !hasDatasource) {
    console.error('❌ Schema缺少基本结构');
    return false;
  }
  
  // 检查关系字段
  const relationErrors = [];
  
  // 检查Approval模型的关系
  if (schemaContent.includes('model Approval')) {
    const approvalSection = schemaContent.split('model Approval')[1].split('}')[0];
    
    // 检查workflow关系
    if (approvalSection.includes('workflowId') && !approvalSection.includes('workflow')) {
      relationErrors.push('Approval.workflowId 缺少对应的 workflow 关系字段');
    }
    
    // 检查approver关系
    if (approvalSection.includes('approverId') && !approvalSection.includes('approver')) {
      relationErrors.push('Approval.approverId 缺少对应的 approver 关系字段');
    }
  }
  
  // 检查Company模型的反向关系
  if (schemaContent.includes('model Company')) {
    const companySection = schemaContent.split('model Company')[1].split('}')[0];
    
    // 检查approvals反向关系
    if (companySection.includes('approvals Approval[]')) {
      console.log('✅ Company.approvals 关系已正确定义');
    } else {
      relationErrors.push('Company 模型缺少 approvals 反向关系字段');
    }
  }
  
  if (relationErrors.length > 0) {
    console.error('❌ 发现关系字段错误:');
    relationErrors.forEach(error => console.error(`   - ${error}`));
    return false;
  }
  
  console.log('✅ Schema验证通过');
  console.log('   所有关系字段都正确定义');
  
  return true;
}

// 如果直接运行此脚本
if (require.main === module) {
  const isValid = validateSchema();
  process.exit(isValid ? 0 : 1);
}

module.exports = { validateSchema };
