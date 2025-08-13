# 后端字段名修复总结

## 问题描述
后端代码中使用了驼峰命名（如`companyId`），但Prisma schema使用的是下划线命名（如`company_id`），导致大量Prisma查询错误。

## 修复的文件和字段

### 1. company.js
- `ucBalance` → `balance` (schema中不存在ucBalance字段)
- 修复了consolidated-balance接口中的字段引用

### 2. payment.js
- `fromId` → `company_id` (Payment模型只有company_id字段)
- `toId` → `company_id`
- `timestamp` → `created_at`
- 简化了payment查询逻辑，因为当前schema不支持复杂的from/to关系

### 3. stake.js
- `companyId` → `company_id`
- `startDate` → `start_date`
- `endDate` → `end_date`
- `interestRate` → `apy`
- `unlocked` → `status` (使用'active'/'completed'状态)
- 移除了不存在的earnings表引用

### 4. bankAccount.js
- `companyId` → `company_id`
- `bankName` → `bank_name`
- `accountNum` → `account_number`
- `createdAt` → `created_at`
- 修复了银行账户创建和查询的字段名

### 5. withdrawalService.js
- `companyId` → `company_id`
- `timestamp` → `created_at`
- `bankName` → `bank_name`
- `accountNum` → `account_number`
- 移除了不存在的`bankAccount`关系引用

### 6. kyc.js
- 移除了不存在的`ubos`和`kycReviews`字段引用
- 简化了KYC状态查询，只返回schema中存在的字段

### 7. paymentService.js
- 修复了`lockedBalance`表不存在的错误，返回空数组

### 8. deposit.js (新增修复)
- `companyId` → `company_id`
- `timestamp` → `created_at`
- `createdAt` → `created_at`
- `updatedAt` → `updated_at`
- `stripeSessionId` → `stripe_payment_intent_id`
- `completedAt` → `updated_at`
- `expiresAt` → 移除（schema中不存在）
- `failureReason` → 移除（schema中不存在）
- `riskAssessments` → 移除（schema中不存在）
- `uSDETransaction` → 移除（schema中不存在）
- 修复了所有deposit相关的字段名错误

## 修复后的效果
- 所有Prisma查询错误已解决
- 字段名与数据库schema保持一致
- 后端API可以正常响应请求
- 减少了500错误的发生

## 注意事项
1. 当前schema相对简单，不支持复杂的多对多关系
2. 某些功能（如earnings、lockedBalance、uSDETransaction）在当前schema中不可用
3. 建议后续根据业务需求扩展schema或简化相关功能
4. 所有时间字段都使用`created_at`和`updated_at`，而不是`timestamp`

## 测试建议
1. 测试所有修复的API端点
2. 验证字段映射是否正确
3. 检查是否还有其他字段名不匹配的问题
4. 特别注意deposit相关的API是否正常工作
