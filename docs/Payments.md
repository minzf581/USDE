以下是**Payments 模块（企业支付功能）**的完整设计，支持：
	•	企业用户使用 USDE Token 支付给供应商
	•	选择承兑期限（30/90/180 天锁仓期）
	•	锁仓期内供应商无法将 Token 提现或转账
	•	系统记录每笔支付与锁仓状态
	•	支持链下账本或链上合约实现（根据阶段）

⸻

✅ 功能目标

功能	描述
Token 支付	企业用户向供应商转账 USDE 代币
承兑选择	支付时选择 30 / 90 / 180 天承兑期
锁仓机制	收款方 Token 锁定到期前无法动用
支付记录	发送方 & 接收方都能查看支付历史
到期释放	承兑期满后自动释放 Token 至供应商可用余额


⸻

🧱 功能模块结构

Payments Module
├── UI 层
│   ├── 付款表单（输入地址、金额、承兑期）
│   ├── 支付历史（状态视图）
│   └── 锁仓倒计时展示
├── 后端服务
│   ├── Token 余额检查 & 扣减
│   ├── 创建支付订单（附锁仓期）
│   ├── 定时任务解锁 Token
│   └── 查询支付记录
├── 数据库模型
│   ├── Payment Table（付款记录）
│   ├── LockedBalance Table（锁仓管理）
│   └── UserBalance Table（余额）


⸻

🖼️ 前端 UI 示例

字段	描述
📮 收款方地址	输入供应商钱包地址（或系统内选择）
💰 支付金额	输入要转账的 USDE 数量
🕒 承兑期选择	下拉菜单：30天、90天、180天
🔘 支付按钮	Pay with USDE
📊 支付记录	显示状态（锁定中、已释放）与释放日期


⸻

📦 数据库设计（链下实现）

1. payments

字段	类型	描述
id	UUID	唯一 ID
sender_id	UUID	支付方用户 ID
receiver_id	UUID	收款方用户 ID
amount	DECIMAL(18,6)	支付金额（USDE）
lock_days	INT	锁仓期（天数）
release_at	TIMESTAMP	解锁日期
status	ENUM	pending / released
created_at	TIMESTAMP	创建时间


⸻

2. locked_balances

字段	类型	描述
user_id	UUID	拥有者用户 ID
amount	DECIMAL	锁仓金额
release_at	TIMESTAMP	到期时间
source_id	UUID	来源 payment_id


⸻

🔁 支付流程
	1.	用户在 UI 中输入供应商地址、金额和承兑期
	2.	系统检查用户 Token 可用余额（排除其锁仓部分）
	3.	扣除金额 & 创建 payments 和 locked_balances 记录
	4.	更新供应商总余额（不可提现部分）
	5.	系统定时任务（或事件触发）在到期时释放锁仓余额

⸻

🔐 供应商视角限制

时间状态	功能限制
锁仓期间	无法提取、转账、兑换 Token
解锁后	可完全支配 Token


⸻

⏱️ 解锁机制
	•	使用定时任务（cron job）每日检查 locked_balances.release_at < now() 条件
	•	解锁后：
	•	更新用户余额表（增加可用余额）
	•	更新 payments.status = released
	•	删除或归档 locked_balances 条目

⸻

🔗 链上合约实现（升级阶段）

如使用链上合约锁仓支付，可用如下逻辑：

合约伪代码：

function payWithAcceptance(address supplier, uint256 amount, uint lockDays) public {
    require(balance[msg.sender] >= amount, "Insufficient balance");
    balance[msg.sender] -= amount;
    locked[supplier].push(Lock({
        amount: amount,
        unlockTime: block.timestamp + lockDays * 1 days
    }));
}

用户可使用前端选择 30/90/180天，合约执行锁仓逻辑，链上释放后才能提取或转账。

⸻

📊 支付记录页面字段

项目	示例值
收款方	0xAbc…123
金额	1,000 USDE
承兑期	90 天
状态	Locked (55天后解锁)
创建时间	2025-08-01 10:00
解锁时间	2025-10-30 10:00


⸻

🧩 扩展功能（后续）

功能	描述
⛓ 链上支付	支持链上合约直接锁仓转账
🏷 支付标签	备注用途（订单号、合同等）
📄 发票关联	可上传或生成企业支付发票 PDF
🧮 利息计算	若企业端可设置锁仓支付的奖励
🔁 定期支付	预设支付频率自动执行付款


