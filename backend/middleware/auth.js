const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');

// 验证JWT token
const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // 获取用户信息
    const user = await prisma.company.findUnique({
      where: { id: decoded.companyId }
    });

    if (!user || user.status !== 'active') {
      return res.status(401).json({ error: 'Invalid or inactive user' });
    }

    req.company = {
      companyId: user.id,
      email: user.email,
      type: user.type,
      role: user.role,
      kycStatus: user.kycStatus,
      status: user.status
    };

    next();
  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// 要求特定角色
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.company) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const userRole = req.company.type;
    const allowedRoles = Array.isArray(roles) ? roles : [roles];

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        required: allowedRoles,
        current: userRole
      });
    }

    next();
  };
};

// 要求系统管理员权限
const requireSystemAdmin = requireRole('system_admin');

// 要求企业管理员权限
const requireEnterpriseAdmin = (req, res, next) => {
  if (!req.company) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  if (req.company.type === 'enterprise' || req.company.type === 'company') {
    return next();
  }

  return res.status(403).json({ error: 'Enterprise admin access required' });
};

// 要求企业用户权限
const requireEnterpriseUser = (req, res, next) => {
  if (!req.company) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  if (req.company.type === 'enterprise' || req.company.type === 'company' || req.company.type === 'subsidiary') {
    return next();
  }

  return res.status(403).json({ error: 'Enterprise user access required' });
};

// 要求管理员权限（系统管理员或企业管理员）
const requireAdmin = (req, res, next) => {
  if (!req.company) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  if (req.company.type === 'enterprise' || req.company.type === 'company') {
    return next();
  }

  return res.status(403).json({ error: 'Admin access required' });
};

// 要求用户权限（非管理员）
const requireUser = (req, res, next) => {
  if (!req.company) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  if (req.company.role === 'system_admin' || req.company.isEnterpriseAdmin) {
    return res.status(403).json({ error: 'Admin cannot access user features' });
  }

  next();
};

// 要求KYC已批准
const requireKYCApproved = (req, res, next) => {
  if (!req.company) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  if (req.company.role === 'system_admin' || req.company.isEnterpriseAdmin) {
    return next(); // Admin bypass KYC requirement
  }

  if (req.company.kycStatus !== 'approved') {
    return res.status(403).json({ 
      error: 'KYC approval required',
      kycStatus: req.company.kycStatus
    });
  }

  next();
};

// 审计日志记录
const logAudit = async (adminId, action, targetId = null, details = null, req = null) => {
  try {
    await prisma.auditLog.create({
      data: {
        adminId,
        action,
        targetId,
        details: details ? JSON.stringify(details) : null,
        ipAddress: req?.ip || req?.connection?.remoteAddress,
        userAgent: req?.headers?.['user-agent']
      }
    });
  } catch (error) {
    console.error('Audit log error:', error);
  }
};

module.exports = {
  verifyToken,
  requireRole,
  requireSystemAdmin,
  requireEnterpriseAdmin,
  requireEnterpriseUser,
  requireAdmin,
  requireUser,
  requireKYCApproved,
  logAudit
}; 