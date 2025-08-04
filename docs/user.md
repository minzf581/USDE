下面是一个完整的系统用户控制和权限管理设计方案，适用于你的 USDE 平台，在支持 Admin 审批与统计的同时，也支持普通用户完成核心功能。

⸻

🎯 目标
	•	区分不同类型用户：Admin 用户 和 普通用户
	•	控制各类功能访问权限（如审批、提现、支付、质押等）
	•	默认内置：
	•	admin@usde.com / admin123 作为管理员用户
	•	demo@usde.com / demo123 作为已通过 KYC 的演示用户

⸻

🧩 模块组成
	1.	用户角色系统
	2.	身份验证与登录机制
	3.	基于角色的访问控制（RBAC）
	4.	Admin 后台面板功能
	5.	普通用户功能访问限制
	6.	种子用户初始化脚本

⸻

1. 👥 用户角色设计

字段	类型	描述
user_id	UUID	唯一标识
email	String	登录邮箱
password_hash	String	密码哈希
role	ENUM	admin, user, demo
kyc_status	ENUM	pending, approved, rejected
is_active	Boolean	是否启用账号
created_at	Timestamp	创建时间


⸻

2. 🔐 登录与认证系统
	•	使用 JWT（或 Session）进行登录认证
	•	登录成功后，返回带有角色的 access token（token 中包含 role 字段）
	•	所有后台接口通过中间件校验角色权限

⸻

3. 🧱 权限控制设计（RBAC）

模块	admin 用户	普通 / demo 用户
登录系统	✅ 登录	✅ 登录
查看系统用户	✅ 可查看全部用户	❌
审批用户 KYC	✅ 可以审核	❌
审批提现请求	✅ 可以审核提现	❌
查看平台统计	✅ 可见资产/收入等	❌
发起 KYC 申请	❌	✅ 可发起
使用支付、提现等功能	❌	✅ KYC 后可用
查看个人资产	❌	✅


⸻

4. 🖥️ Admin 后台面板功能
	•	用户管理
	•	用户列表
	•	查看每个用户的状态 / KYC / 余额
	•	批准或拒绝 KYC
	•	提现管理
	•	提现申请列表
	•	点击按钮审核通过 / 拒绝提现请求
	•	平台统计
	•	用户总数、已认证用户数
	•	总支付额、总质押金额
	•	提现记录、失败率
	•	操作审计日志（可选）

⸻

5. 🧾 普通用户前端行为控制

功能区域	KYC前展示	KYC后解锁行为
Dashboard	显示账户初始化状态	展示资产、收益等
Payments	显示支付逻辑/示例	启用实际付款操作
Stake	显示质押说明	启用质押操作
Withdraw	按钮禁用+提示需先KYC	启用提现表单


⸻

6. 🧪 默认账户种子初始化

👤 Admin 用户

{
  "email": "admin@usde.com",
  "password": "admin123",
  "role": "admin",
  "kyc_status": "approved",
  "is_active": true
}

🧪 Demo 用户

{
  "email": "demo@usde.com",
  "password": "demo123",
  "role": "demo",
  "kyc_status": "approved",
  "is_active": true
}

初始化建议在部署时插入数据库或通过种子脚本（如 seed.js 或 init.sql）完成。

⸻

📦 示例数据库表结构（简化）

CREATE TABLE users (
    id UUID PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role VARCHAR(10) CHECK (role IN ('admin', 'user', 'demo')),
    kyc_status VARCHAR(10) CHECK (kyc_status IN ('pending', 'approved', 'rejected')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);


⸻

🔐 中间件权限控制（伪代码）

function requireRole(role: 'admin' | 'user') {
  return function(req, res, next) {
    const user = getUserFromToken(req.headers.authorization)
    if (user.role !== role) {
      return res.status(403).send("Forbidden")
    }
    next()
  }
}


⸻

✅ 后续可扩展方向
	•	添加用户分组（子账户、企业账户）
	•	多角色权限细化（比如：财务审核员 vs 超管）
	•	KYC 审批自动化 + 审核日志记录
	•	更复杂的操作记录 / 审计追踪

⸻