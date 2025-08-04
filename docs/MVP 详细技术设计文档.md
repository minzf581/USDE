 MVP 详细技术设计文档

✅ 一、项目目标（MVP 目标）

构建一个部署在 Railway 上的稳定币企业服务平台原型，支持企业完成注册、充值、理财、支付供应商、质押锁仓、赎回提现、后台查看记录等基本操作，本项目是面向英文客户，所有界面，提示用户可见部分都用英文。

⸻

📦 二、功能模块拆解（按产品流程）

模块编号	模块名称	核心功能描述
M1	企业注册 + KYC	企业邮箱注册、认证状态管理、提交基础资料，人工/自动审核
M2	美金充值 / USDE铸造	支持企业用 STRIPE充值，等值铸造 USDE 稳定币
M3	企业理财配置	选择美债策略（伪后台配置利率），按 USDE 持仓计算收益
M4	UCorp支付 + 锁仓设定	企业向供应商地址转账 USDE
M5	到期赎回/提现	供应商到期后赎回 USDE,将资金通过stripe返回，生成资金流记录
M6	后台资产收益视图	展示企业余额、收益、付款记录、锁仓记录


⸻

🏗️ 三、系统架构设计（部署在 Railway）

┌────────────────────────────┐
│        Frontend (React)    │
│   - 企业端仪表盘 / 支付页   │
│   - 注册/KYC/理财界面      │
└────────────▲─────────────┘
             │ REST API
┌────────────┴─────────────┐
│          Backend (Node.js + Express)       │
│  - 身份认证 / Token 控制                    │
│  - 铸造/赎回 / 支付记录逻辑                │
│  - 利息计算引擎（模拟美债收益）            │
│  - 邮件通知/状态管理                        │
└────────────▲─────────────┘
             │ Prisma ORM
┌────────────┴─────────────┐
│        PostgreSQL (Railway DB)             │
│  - 企业用户表 / 代币表 / 支付记录表         │
│  - 质押锁仓表 / 收益记录 / 理财配置表       │
└────────────────────────────┘


⸻

🧪 四、核心技术选型

组件	技术栈	说明
前端	React + Tailwind + Axios	简洁仪表盘 UI + 与后端通信
后端	Node.js + Express / Fastify	简单 RESTful 服务，Railway 上部署快速
数据库	PostgreSQL（内置于 Railway）	使用 Prisma 管理 schema
身份验证	JWT + 企业邮箱验证码	可扩展对接 OAuth / 企业邮箱
区块链接口	Mock合约 or Polygon Testnet	初期用模拟逻辑，后期可连接真实链 / 合约
收益计算	后端定时任务（Node-Cron）	每日更新利息收益，计算账面余额
部署平台	Railway (GitHub CI 自动部署)	前后端 + DB 全托管部署


⸻

🧰 五、数据库设计（Prisma schema 建议）

model Company {
  id            String   @id @default(cuid())
  name          String
  email         String   @unique
  kycStatus     String   // pending, approved, rejected
  ucBalance     Float    @default(0)
  createdAt     DateTime @default(now())
  payments      Payment[]
  stakes        Stake[]
  earnings      Earning[]
}

model Payment {
  id          String   @id @default(cuid())
  fromId      String
  toId        String
  amount      Float
  stakeDays   Int      // 锁仓天数
  released    Boolean  @default(false)
  timestamp   DateTime @default(now())
}

model Stake {
  id          String   @id @default(cuid())
  companyId   String
  amount      Float
  startDate   DateTime
  endDate     DateTime
  unlocked    Boolean  @default(false)
}

model Earning {
  id          String   @id @default(cuid())
  companyId   String
  amount      Float
  date        DateTime
  strategy    String   // e.g., "us_treasury"
}


⸻

📡 六、API 接口设计简要

Endpoint	方法	描述
/api/register	POST	注册企业账户
/api/kyc/upload	POST	上传企业资料
/api/deposit	POST	模拟 USDC 充值 & 铸造代币
/api/invest	POST	配置理财策略（美债）
/api/pay	POST	向供应商支付 USDE 并锁仓
/api/redeem	POST	到期代币赎回 / 提现
/api/dashboard	GET	查询企业资产收益与记录


⸻

⏰ 七、收益计算机制（M3）
	•	初期利率可固定设为年化 4%（模拟美债）
	•	每日后端任务遍历所有锁仓中的代币余额，按日计算收益（复利或单利）
	•	将收益记录入 Earning 表，展示给企业

⸻

🔐 八、安全注意事项

项目	措施建议
API 鉴权	JWT + 验证邮箱绑定
企业账户风控	每日操作限额、审计日志
铸造 / 赎回 / 支付	初期模拟账本逻辑，后期迁移到链上执行合约
数据加密存储（KYC材料）	Railway 加密存储 + KYC 状态机
管理后台只读	默认只读，控制敏感操作需加密权限


⸻
九，部署说明
系统本地启动请使用start-services.sh完成，功能主要是: 杀掉上一次启动系统的各个进程，重新启动系统前后端。生产环境部署在railway上。
本地使用sqlite数据库，文件放到data/app.data，生产环境数据库url为：DATABASE_PUBLIC_URL：postgresql://postgres:SOzxfxdDXTsVjKQJLTyeGHeKnxlQHQLR@yamabiko.proxy.rlwy.net:58370/railway

DATABASE_URL：postgresql://postgres:SOzxfxdDXTsVjKQJLTyeGHeKnxlQHQLR@postgres-t2yy.railway.internal:5432/railway




✅ 十、阶段完成标准（MVP交付）
	•	企业可以注册并通过审核
	•	企业账户支持模拟充值、铸造稳定币
	•	企业可以选择理财方式（固定收益模拟）
	•	企业可以支付供应商并设定质押时间
	•	质押到期后代币可赎回
	•	后台有资产 + 收益 + 质押的可视化界面
