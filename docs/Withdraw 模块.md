下面是 Withdraw 模块（提现模块） 的完整设计方案，覆盖用户将 USDE 代币销毁并提现到银行账户的全过程。

⸻

🎯 模块目标

功能	描述
Token 销毁	用户将 USDE 销毁，表示希望提现对应的现金金额
银行账户提现	将等值 USD 打款到用户预留的银行账户
状态跟踪	提现状态追踪（处理中、成功、失败）
安全风控机制	限额、KYC 验证、双因子确认等


⸻

✅ 功能流程概览

graph TD
A[用户发起提现请求] --> B[检查可用余额]
B --> C[选择提现金额]
C --> D[显示预留银行账户]
D --> E[确认提现操作]
E --> F[销毁 Token (Burn)]
F --> G[记录提现订单]
G --> H[银行打款 / 转账系统处理]
H --> I[提现成功 -> 通知用户]


⸻

🖼️ 前端 UI 设计要素

字段	描述
💰 当前可提现余额	显示可提现的 USDE 余额（不包括锁仓部分）
🔢 提现金额	输入用户希望提现的金额
🏦 银行账户信息	显示用户已绑定的银行账户（只读）
🔐 二次验证（可选）	发送验证码或密码确认
🔘 提现按钮	提交提现请求
📊 提现记录	展示提现状态和历史


⸻

📦 后端系统设计

✅ 表结构（链下账本）

1. withdrawals

字段	类型	描述
id	UUID	唯一标识
user_id	UUID	用户 ID
amount	DECIMAL	提现金额（USDE）
status	ENUM	pending / success / failed
created_at	TIMESTAMP	提现申请时间
processed_at	TIMESTAMP	完成时间
bank_account_id	UUID	提现银行账户标识
burn_tx_hash	STRING	代币销毁的交易记录（链上或模拟）

2. bank_accounts

字段	类型	描述
id	UUID	唯一 ID
user_id	UUID	所属用户
bank_name	STRING	银行名称
account_num	STRING	银行账号
currency	STRING	账户货币类型（USD）
is_verified	BOOLEAN	是否已验证


⸻

🔁 后端流程步骤
	1.	验证余额充足：确保用户可提现余额 ≥ 提现金额
	2.	记录提现请求：在数据库中记录 withdrawal 请求（status: pending）
	3.	执行代币销毁操作：
	•	如果使用链上系统：调用合约执行 burn() 函数，并记录 Tx Hash
	•	如果是链下账本：扣除可用余额并标记为“销毁”
	4.	银行转账：
	•	通过集成支付 API（如 Stripe Connect Payouts, Wise, 银行 ACH 通道等）打款
	5.	回写结果：
	•	成功：更新 status = success，记录时间
	•	失败：status = failed 并显示失败原因
	6.	通知用户（邮件、站内通知）

⸻

⛓️ 示例链上销毁合约（Solidity）

function burn(uint256 amount) public {
    require(balanceOf(msg.sender) >= amount, "Insufficient balance");
    _burn(msg.sender, amount);
    emit Burned(msg.sender, amount);
}


⸻

⏳ 提现状态字段说明

状态	描述
pending	用户已提交申请，待处理
processing	正在打款或等待银行确认
success	已成功转账
failed	因账户问题或资金问题失败


⸻

🔐 安全限制与风控建议

策略	描述
✅ KYC 已完成	未完成 KYC 不可提现
✅ 绑定银行账户	银行账户需先验证通过
⏳ 提现冷却期	注册或首次充值后 24 小时内不允许提现
💸 每日/每月限额	限制提现频率与额度
🔒 两步验证	提现时短信 / 邮件验证码确认
🧠 手动审核阈值	大额提现自动触发人工审核流程


⸻

📊 提现记录示例

日期	金额	状态	银行账户	TX Hash
2025-08-01	$5,000	Success	JPMorgan ***9931	0xabc…1234
2025-08-02	$1,000	Pending	Chase ***1122	-


⸻

🔌 外部支付通道建议（MVP / 正式版）

场景	推荐服务商
MVP 模拟提现	邮件通知 + 后台标记
小额 USD 付款	Stripe Payouts / Wise
大额或本地化付款	银行 API / Mercury / PrimeTrust

