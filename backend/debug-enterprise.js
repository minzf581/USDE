const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugEnterprise() {
  try {
    console.log('🔍 Debugging Enterprise Data...\n');

    // Check all companies
    const companies = await prisma.company.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isEnterpriseAdmin: true,
        isEnterpriseUser: true,
        enterpriseRole: true,
        companyName: true,
        enterpriseCompanyType: true
      }
    });

    console.log('📋 All Companies:');
    companies.forEach(company => {
      console.log(`  - ${company.name} (${company.email})`);
      console.log(`    Role: ${company.role}`);
      console.log(`    Is Enterprise Admin: ${company.isEnterpriseAdmin}`);
      console.log(`    Is Enterprise User: ${company.isEnterpriseUser}`);
      console.log(`    Enterprise Role: ${company.enterpriseRole}`);
      console.log(`    Company Name: ${company.companyName}`);
      console.log(`    Company Type: ${company.enterpriseCompanyType}`);
      console.log('');
    });

    // Check all enterprises
    const enterprises = await prisma.enterprise.findMany({
      include: {
        admin: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            enterpriseRole: true
          }
        }
      }
    });

    console.log('🏢 All Enterprises:');
    enterprises.forEach(enterprise => {
      console.log(`  - ${enterprise.name} (ID: ${enterprise.id})`);
      console.log(`    Admin: ${enterprise.admin.name} (${enterprise.admin.email})`);
      console.log(`    Users: ${enterprise.users.length}`);
      enterprise.users.forEach(user => {
        console.log(`      - ${user.name} (${user.email}) - ${user.enterpriseRole}`);
      });
      console.log('');
    });

    // Check roles
    const roles = await prisma.role.findMany({
      include: {
        permissions: true
      }
    });

    console.log('👥 All Roles:');
    roles.forEach(role => {
      console.log(`  - ${role.name}: ${role.description}`);
      console.log(`    Permissions: ${role.permissions.map(p => p.name).join(', ')}`);
    });

  } catch (error) {
    console.error('❌ Debug error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugEnterprise(); 