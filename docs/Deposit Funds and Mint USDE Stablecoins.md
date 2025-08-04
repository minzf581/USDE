Deposit Funds and Mint USDE Stablecoins 模块设计方案：
	•	用户需完成 KYC 后才能实际操作
	•	使用 Stripe 进行充值
	•	完成充值后自动铸造 USDE 稳定币
	•	显示用户余额并支持提取到链上钱包
	•	KYC 前用户可见功能但无法操作

⸻

✅ 功能目标总结

功能	说明
🔐 KYC 检查	只有通过 KYC 的用户可执行充值与铸造
💳 Stripe 支付	接收用户通过信用卡/银行账户的充值
🪙 USDE 铸造	每充值 1 美元，铸造 1 个 USDE Token
👛 提币到钱包	支持用户将 USDE 提取到链上地址
👁️ KYC 前功能预览	未认证用户可浏览功能模块但无法执行操作


⸻

🧱 功能模块结构

Deposit and Mint USDE
├── UI 展示层
│   ├── 功能预览模式（未KYC）
│   ├── 实时 USDE 余额（已KYC）
│   ├── Stripe 充值输入框
│   └── 提现地址输入 & 提币按钮
├── Stripe 集成服务
│   ├── 创建支付 Session
│   └── 回调监听确认支付成功
├── Token 服务
│   ├── 映射充值金额 -> 铸造 USDE
│   ├── 存储用户余额
│   └── 发起链上转账（可选）
├── 用户权限逻辑
│   ├── 检查 KYC 状态
│   └── 禁用操作按钮 & 弹窗提示


⸻

🖼️ 前端 UI 示例结构（建议）

区块	内容
🧾 当前余额展示	You currently hold: 1,200 USDE
💳 Stripe 充值输入	Enter amount to deposit (USD)
🔘 提交按钮	Deposit and Mint
🧠 KYC 提示（未认证）	弹窗 Please complete KYC to use this feature.
🪙 链上钱包输入框	Enter your wallet address
⬆️ Transfer 按钮	Withdraw to Wallet


⸻

🔐 权限逻辑示例（前端 + 后端）

前端权限控制：

if (user.kycStatus !== 'approved') {
  disableMintButton();
  showKycModal();
}

后端 API 校验：

POST /mint-usde
Body: { amount: 500 }
Auth: Bearer JWT

Check:
- Is user authenticated?
- Is user.kycStatus === 'approved'?
- Is payment verified from Stripe?


⸻

💳 Stripe 支付集成流程
	1.	用户输入金额 → 前端请求 /api/create-checkout-session
	2.	后端生成 Stripe Checkout Session ID，返回给前端
	3.	前端重定向用户到 Stripe 支付页面
	4.	支付完成后，Stripe 回调 /api/stripe-webhook
	5.	后端校验成功 → 为该用户铸造相同金额的 USDE → 存储余额

⸻

🔗 铸造 USDE 的方式

MVP 阶段（Off-chain Ledger）
	•	铸造记录保存在数据库中（PostgreSQL）
	•	格式：{user_id, usde_balance, history_log}

升级阶段（On-chain Mint）
	•	后端通过合约 mint USDE
	•	用户提供链上地址（EVM）
	•	调用合约 mint(address recipient, uint amount) 方法

⸻

📤 提币到链上钱包流程
	1.	用户填写链上地址 → 点击 Withdraw to Wallet
	2.	后端检查用户余额，签名并发送交易
	3.	扣除数据库中余额，记录交易哈希
	4.	前端显示状态 & 链上链接（Polygon Scan）

⸻

🔐 安全和验证建议

项目	建议
支付验证	严格监听 Stripe Webhook，防止伪造
铸币操作	必须绑定在付款验证成功后执行
钱包地址	验证地址格式，防止空地址、恶意地址
日志记录	所有资金动作保留 audit trail


⸻

🧪 示例 API 接口

1. 创建 Stripe Session

POST /api/stripe-session
{
  "amount": 1000
}
→ Returns: { "sessionId": "cs_test_1234" }


⸻

2. Stripe Webhook 监听支付成功

app.post('/api/stripe-webhook', async (req, res) => {
  const event = verifyStripeEvent(req);
  if (event.type === 'checkout.session.completed') {
    const { userId, amount } = event.data;
    mintUSDEForUser(userId, amount);
  }
});


⸻

3. 铸造记录查询

GET /api/usde-balance
Auth: Bearer Token

→ Response:
{
  "balance": 1200,
  "transactions": [{type: 'mint', amount: 500, date: ...}]
}


⸻

⏭️ 后续可扩展功能

功能	描述
🔄 自动转账	用户充值后，自动转入链上钱包
💰 多资产充值	支持 USDC / USDT 等稳定币支付渠道
📈 收益配置	铸造时配置“理财偏好”（如美债、比特币 ETF）
🏦 银行 ACH 接入	Stripe 之外的本地银行转账（Plaid、Wise）

