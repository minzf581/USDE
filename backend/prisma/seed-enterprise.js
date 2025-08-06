const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function seedEnterprise() {
  try {
    console.log('🌱 Seeding enterprise data...');

    // Create roles
    const roles = [
      { name: 'enterprise_admin', description: 'Enterprise Administrator' },
      { name: 'finance_manager', description: 'Finance Manager' },
      { name: 'finance_operator', description: 'Finance Operator' },
      { name: 'observer', description: 'Observer' }
    ];

    for (const role of roles) {
      await prisma.role.upsert({
        where: { name: role.name },
        update: {},
        create: role
      });
    }

    // Create permissions
    const permissions = [
      { name: 'view_balance', description: 'View account balance' },
      { name: 'initiate_payment', description: 'Initiate payments' },
      { name: 'approve_payment', description: 'Approve payments' },
      { name: 'view_reports', description: 'View financial reports' },
      { name: 'manage_users', description: 'Manage enterprise users' },
      { name: 'manage_settings', description: 'Manage enterprise settings' },
      { name: 'view_audit_logs', description: 'View audit logs' }
    ];

    for (const permission of permissions) {
      await prisma.permission.upsert({
        where: { name: permission.name },
        update: {},
        create: permission
      });
    }

    // Assign permissions to roles
    const rolePermissions = {
      'enterprise_admin': [
        'view_balance',
        'initiate_payment',
        'approve_payment',
        'view_reports',
        'manage_users',
        'manage_settings',
        'view_audit_logs'
      ],
      'finance_manager': [
        'view_balance',
        'initiate_payment',
        'approve_payment',
        'view_reports',
        'view_audit_logs'
      ],
      'finance_operator': [
        'view_balance',
        'initiate_payment',
        'view_reports'
      ],
      'observer': [
        'view_balance',
        'view_reports'
      ]
    };

    for (const [roleName, permissionNames] of Object.entries(rolePermissions)) {
      const role = await prisma.role.findUnique({
        where: { name: roleName }
      });

      if (role) {
        for (const permissionName of permissionNames) {
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
    }

    console.log('✅ Enterprise data seeded successfully');
  } catch (error) {
    console.error('❌ Error seeding enterprise data:', error);
    throw error;
  }
}

async function main() {
  try {
    await seedEnterprise();
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main();
}

module.exports = { seedEnterprise }; 