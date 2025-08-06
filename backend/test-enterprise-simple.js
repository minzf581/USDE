const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testEnterpriseSimple() {
  try {
    console.log('🧪 Simple Enterprise Test...\n');

    // Get the latest enterprise admin
    const latestAdmin = await prisma.company.findFirst({
      where: {
        email: 'john4@enterprise.com'
      }
    });

    console.log('Latest Admin:', latestAdmin);

    if (!latestAdmin) {
      console.log('❌ No admin found');
      return;
    }

    // Get enterprise
    const enterprise = await prisma.enterprise.findUnique({
      where: { adminId: latestAdmin.id }
    });

    console.log('Enterprise:', enterprise);

    if (!enterprise) {
      console.log('❌ No enterprise found');
      return;
    }

    // Test the query that's failing
    const users = await prisma.company.findMany({
      where: {
        OR: [
          { id: latestAdmin.id }, // Enterprise admin
          { enterpriseId: enterprise.id } // Enterprise users
        ]
      },
      select: {
        id: true,
        name: true,
        email: true,
        kycStatus: true,
        isActive: true,
        enterpriseRole: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: { createdAt: 'desc' }
    });

    console.log('Users found:', users.length);
    console.log('Users:', users);

  } catch (error) {
    console.error('❌ Test error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testEnterpriseSimple(); 