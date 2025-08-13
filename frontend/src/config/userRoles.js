// User Role Configuration
// This file defines the roles and permissions for different user types

export const USER_ROLES = {
  // System-level roles
  SYSTEM_ADMIN: 'system_admin',
  ENTERPRISE_ADMIN: 'enterprise_admin',
  ENTERPRISE_USER: 'enterprise_user',
  
  // Company-specific roles
  PARENT_COMPANY_ADMIN: 'parent_company_admin',
  SUBSIDIARY_ADMIN: 'subsidiary_admin',
  SUBSIDIARY_USER: 'subsidiary_user',
  
  // Financial roles
  TREASURY_SUPERVISOR: 'treasury_supervisor',
  TREASURY_OPERATOR: 'treasury_operator',
  FINANCE_MANAGER: 'finance_manager',
  
  // Observer role
  OBSERVER: 'observer'
};

export const ROLE_PERMISSIONS = {
  [USER_ROLES.SYSTEM_ADMIN]: {
    name: 'System Administrator',
    description: 'Full system access and control',
    permissions: [
      'manage_all_companies',
      'manage_all_users',
      'system_configuration',
      'audit_logs',
      'global_settings'
    ]
  },
  
  [USER_ROLES.ENTERPRISE_ADMIN]: {
    name: 'Enterprise Administrator',
    description: 'Full enterprise access and control',
    permissions: [
      'manage_enterprise',
      'manage_subsidiaries',
      'manage_enterprise_users',
      'financial_operations',
      'approval_workflows'
    ]
  },
  
  [USER_ROLES.PARENT_COMPANY_ADMIN]: {
    name: 'Parent Company Administrator',
    description: 'Full parent company and subsidiary management',
    permissions: [
      'manage_parent_company',
      'manage_subsidiaries',
      'create_subsidiaries',
      'delete_subsidiaries',
      'cross_company_transfers',
      'consolidated_reporting',
      'subsidiary_user_management',
      'financial_configuration'
    ]
  },
  
  [USER_ROLES.SUBSIDIARY_ADMIN]: {
    name: 'Subsidiary Administrator',
    description: 'Subsidiary company management',
    permissions: [
      'manage_subsidiary',
      'manage_subsidiary_users',
      'financial_operations',
      'internal_transfers',
      'external_payments'
    ]
  },
  
  [USER_ROLES.TREASURY_SUPERVISOR]: {
    name: 'Treasury Supervisor',
    description: 'Treasury operations and approvals',
    permissions: [
      'approve_payments',
      'approve_transfers',
      'financial_reports',
      'budget_management'
    ]
  },
  
  [USER_ROLES.TREASURY_OPERATOR]: {
    name: 'Treasury Operator',
    description: 'Basic treasury operations',
    permissions: [
      'create_payments',
      'create_transfers',
      'view_reports',
      'basic_operations'
    ]
  },
  
  [USER_ROLES.OBSERVER]: {
    name: 'Observer',
    description: 'Read-only access',
    permissions: [
      'view_reports',
      'view_transactions',
      'read_only_access'
    ]
  }
};

// Special user configurations
export const SPECIAL_USERS = {
  'demo@usde.com': {
    role: USER_ROLES.PARENT_COMPANY_ADMIN,
    companyType: 'parent',
    permissions: [
      'manage_parent_company',
      'manage_subsidiaries',
      'create_subsidiaries',
      'delete_subsidiaries',
      'cross_company_transfers',
      'consolidated_reporting',
      'subsidiary_user_management',
      'financial_configuration',
      'full_access'
    ],
    description: 'Demo account with full parent company administrator privileges'
  }
};

// Helper function to check if user has specific permission
export const hasPermission = (userRole, permission) => {
  const rolePermissions = ROLE_PERMISSIONS[userRole];
  if (!rolePermissions) return false;
  
  return rolePermissions.permissions.includes(permission);
};

// Helper function to check if user is parent company admin
export const isParentCompanyAdmin = (userEmail, userRole) => {
  // Check special users first
  if (SPECIAL_USERS[userEmail]) {
    return SPECIAL_USERS[userEmail].role === USER_ROLES.PARENT_COMPANY_ADMIN;
  }
  
  // Check role-based permissions
  return userRole === USER_ROLES.PARENT_COMPANY_ADMIN || 
         userRole === USER_ROLES.ENTERPRISE_ADMIN ||
         userRole === USER_ROLES.SYSTEM_ADMIN;
};

// Helper function to get user permissions
export const getUserPermissions = (userEmail, userRole) => {
  // Check special users first
  if (SPECIAL_USERS[userEmail]) {
    return SPECIAL_USERS[userEmail].permissions;
  }
  
  // Return role-based permissions
  const rolePermissions = ROLE_PERMISSIONS[userRole];
  return rolePermissions ? rolePermissions.permissions : [];
};

const userRolesConfig = {
  USER_ROLES,
  ROLE_PERMISSIONS,
  SPECIAL_USERS,
  hasPermission,
  isParentCompanyAdmin,
  getUserPermissions
};

export default userRolesConfig;
