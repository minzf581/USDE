const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedRBAC() {
  try {
    console.log('Seeding RBAC system...');

    // Create permissions
    const permissions = [
      { name: 'view_balance', description: 'View account balance' },
      { name: 'initiate_payment', description: 'Initiate payments' },
      { name: 'approve_payment', description: 'Approve payment requests' },
      { name: 'view_reports', description: 'View financial reports' },
      { name: 'manage_settings', description: 'Manage treasury settings' },
      { name: 'manage_users', description: 'Manage enterprise users' },
      { name: 'view_approvals', description: 'View approval requests' },
      { name: 'view_logs', description: 'View audit logs' },
      { name: 'download_logs', description: 'Download audit logs' },
      { name: 'initiate_withdrawal', description: 'Initiate withdrawals' },
      { name: 'approve_withdrawal', description: 'Approve withdrawal requests' },
      { name: 'view_kyc', description: 'View KYC information' },
      { name: 'approve_kyc', description: 'Approve KYC requests' }
    ];

    for (const permission of permissions) {
      await prisma.permission.upsert({
        where: { name: permission.name },
        update: permission,
        create: permission
      });
    }

    // Create roles with permissions
    const roles = [
      {
        name: 'admin',
        description: 'System Administrator',
        permissions: [
          'view_balance', 'initiate_payment', 'approve_payment', 'view_reports',
          'manage_settings', 'manage_users', 'view_approvals', 'view_logs',
          'download_logs', 'initiate_withdrawal', 'approve_withdrawal',
          'view_kyc', 'approve_kyc'
        ]
      },
      {
        name: 'enterprise_admin',
        description: 'Enterprise Administrator',
        permissions: [
          'view_balance', 'initiate_payment', 'approve_payment', 'view_reports',
          'manage_settings', 'manage_users', 'view_approvals', 'view_logs',
          'download_logs', 'initiate_withdrawal', 'approve_withdrawal',
          'view_kyc', 'approve_kyc'
        ]
      },
      {
        name: 'enterprise_finance_manager',
        description: 'Enterprise Finance Manager',
        permissions: [
          'view_balance', 'initiate_payment', 'approve_payment', 'view_reports',
          'view_approvals', 'view_logs', 'download_logs', 'initiate_withdrawal',
          'approve_withdrawal', 'view_kyc', 'approve_kyc'
        ]
      },
      {
        name: 'enterprise_finance_operator',
        description: 'Enterprise Finance Operator',
        permissions: [
          'view_balance', 'initiate_payment', 'view_reports', 'view_approvals',
          'initiate_withdrawal', 'view_kyc'
        ]
      }
    ];

    for (const roleData of roles) {
      const role = await prisma.role.upsert({
        where: { name: roleData.name },
        update: {
          description: roleData.description
        },
        create: {
          name: roleData.name,
          description: roleData.description
        }
      });

      // Assign permissions to role
      for (const permissionName of roleData.permissions) {
        const permission = await prisma.permission.findUnique({
          where: { name: permissionName }
        });

        if (permission) {
          await prisma.role.update({
            where: { id: role.id },
            data: {
              permissions: {
                connect: { id: permission.id }
              }
            }
          });
        }
      }
    }

    console.log('RBAC system seeded successfully!');
  } catch (error) {
    console.error('Error seeding RBAC:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedRBAC(); 