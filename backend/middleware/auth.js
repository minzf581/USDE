const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

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

    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Invalid or inactive user' });
    }

    req.company = {
      companyId: user.id,
      email: user.email,
      role: user.role,
      kycStatus: user.kycStatus
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

    const userRole = req.company.role;
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

// 要求管理员权限
const requireAdmin = requireRole('admin');

// 要求用户权限（非管理员）
const requireUser = (req, res, next) => {
  if (!req.company) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  if (req.company.role === 'admin') {
    return res.status(403).json({ error: 'Admin cannot access user features' });
  }

  next();
};

// 要求KYC已批准
const requireKYCApproved = (req, res, next) => {
  if (!req.company) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  if (req.company.role === 'admin') {
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

// 记录审计日志
const logAudit = async (adminId, action, targetId = null, details = null, req = null) => {
  try {
    await prisma.auditLog.create({
      data: {
        adminId,
        action,
        targetId,
        details: details ? JSON.stringify(details) : null,
        ipAddress: req?.ip,
        userAgent: req?.headers['user-agent']
      }
    });
  } catch (error) {
    console.error('Audit log error:', error);
  }
};

module.exports = {
  verifyToken,
  requireRole,
  requireAdmin,
  requireUser,
  requireKYCApproved,
  logAudit
}; 