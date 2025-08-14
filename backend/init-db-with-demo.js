const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('开始初始化数据库...');

  try {
    // 创建权限
    const permissions = [
      { name: 'view_balance', description: 'View account balance' },
      { name: 'initiate_payment', description: 'Initiate payments' },
      { name: 'approve_payment', description: 'Approve payments' },
      { name: 'view_reports', description: 'View financial reports' },
      { name: 'manage_users', description: 'Manage enterprise users' },
      { name: 'manage_settings', description: 'Manage enterprise settings' },
      { name: 'view_audit_logs', description: 'View audit logs' },
      { name: 'view_approvals', description: 'View approval workflows' },
      { name: 'approve_payment', description: 'Approve payment requests' }
    ];

    for (const perm of permissions) {
      await prisma.permission.upsert({
        where: { name: perm.name },
        update: {},
        create: perm
      });
    }

    // 创建角色
    const roles = [
      { name: 'ADMIN', description: 'Administrator with full access' },
      { name: 'ENTERPRISE_ADMIN', description: 'Enterprise administrator' },
      { name: 'ENTERPRISE_USER', description: 'Enterprise user' },
      { name: 'SUPERVISOR', description: 'Supervisor with approval access' },
      { name: 'OPERATOR', description: 'Operator with basic access' },
      { name: 'OBSERVER', description: 'Observer with read-only access' }
    ];

    for (const role of roles) {
      await prisma.role.upsert({
        where: { name: role.name },
        update: {},
        create: role
      });
    }

    // 为角色分配权限
    const adminRole = await prisma.role.findUnique({ where: { name: 'ADMIN' } });
    const enterpriseAdminRole = await prisma.role.findUnique({ where: { name: 'ENTERPRISE_ADMIN' } });
    const supervisorRole = await prisma.role.findUnique({ where: { name: 'SUPERVISOR' } });

    // 管理员拥有所有权限
    for (const perm of permissions) {
      const permission = await prisma.permission.findUnique({ where: { name: perm.name } });
      await prisma.$executeRaw`
        INSERT OR IGNORE INTO _PermissionToRole (A, B) VALUES (${permission.id}, ${adminRole.id})
      `;
    }

    // 企业管理员拥有大部分权限
    const enterpriseAdminPerms = ['view_balance', 'initiate_payment', 'approve_payment', 'view_reports', 'manage_users', 'manage_settings', 'view_approvals'];
    for (const permName of enterpriseAdminPerms) {
      const permission = await prisma.permission.findUnique({ where: { name: permName } });
      await prisma.$executeRaw`
        INSERT OR IGNORE INTO _PermissionToRole (A, B) VALUES (${permission.id}, ${enterpriseAdminRole.id})
      `;
    }

    // 主管拥有审批权限
    const supervisorPerms = ['view_balance', 'view_reports', 'view_approvals', 'approve_payment'];
    for (const permName of supervisorPerms) {
      const permission = await prisma.permission.findUnique({ where: { name: permName } });
      await prisma.$executeRaw`
        INSERT OR IGNORE INTO _PermissionToRole (A, B) VALUES (${permission.id}, ${supervisorRole.id})
      `;
    }

    // 创建demo企业
    const hashedPassword = await bcrypt.hash('demo123', 10);
    const demoCompany = await prisma.company.upsert({
      where: { email: 'demo@usde.com' },
      update: {},
      create: {
        name: 'Demo Company',
        email: 'demo@usde.com',
        password: hashedPassword,
        type: 'enterprise',
        role: 'enterprise_admin',
        status: 'active',
        kycStatus: 'approved',
        balance: 10000,
        usdeBalance: 5000,
        companyType: 'enterprise',
        isEnterprise: true,
        isEnterpriseAdmin: true,
        companyCode: 'DEMO001'
      }
    });

    // 创建企业记录
    const enterprise = await prisma.enterprise.upsert({
      where: { adminId: demoCompany.id },
      update: {},
      create: {
        name: 'Demo Enterprise',
        adminId: demoCompany.id
      }
    });

    // 为demo用户分配角色
    await prisma.userRole.create({
      data: {
        userId: demoCompany.id,
        roleId: enterpriseAdminRole.id,
        companyId: demoCompany.id
      }
    });

    // 创建一些子公司用于测试
    const subsidiaries = [
      {
        name: 'Demo Subsidiary 1',
        email: 'sub1@demo.com',
        password: hashedPassword,
        type: 'subsidiary',
        role: 'enterprise_user',
        status: 'active',
        kycStatus: 'approved',
        balance: 5000,
        usdeBalance: 2000,
        companyType: 'subsidiary',
        isEnterprise: false,
        parentCompanyId: demoCompany.id,
        companyCode: 'SUB001'
      },
      {
        name: 'Demo Subsidiary 2',
        email: 'sub2@demo.com',
        password: hashedPassword,
        type: 'subsidiary',
        role: 'enterprise_user',
        status: 'active',
        kycStatus: 'approved',
        balance: 3000,
        usdeBalance: 1500,
        companyType: 'subsidiary',
        isEnterprise: false,
        parentCompanyId: demoCompany.id,
        companyCode: 'SUB002'
      }
    ];

    for (const sub of subsidiaries) {
      const subsidiary = await prisma.company.create({
        data: sub
      });

      // 为子公司分配角色
      const userRole = await prisma.role.findUnique({ where: { name: 'ENTERPRISE_USER' } });
      await prisma.userRole.create({
        data: {
          userId: subsidiary.id,
          roleId: userRole.id,
          companyId: demoCompany.id
        }
      });
    }

    console.log('数据库初始化完成！');
    console.log('Demo用户:', demoCompany.email);
    console.log('密码: demo123');

  } catch (error) {
    console.error('初始化失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
