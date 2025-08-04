const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Check if admin user already exists
  const existingAdmin = await prisma.company.findUnique({
    where: { email: 'admin@usde.com' }
  });

  if (existingAdmin) {
    console.log('✅ Admin user already exists');
    return;
  }

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 12);
  
  const adminUser = await prisma.company.create({
    data: {
      name: 'USDE Admin',
      email: 'admin@usde.com',
      password: hashedPassword,
      kycStatus: 'approved',
      ucBalance: 10000, // Starting balance for admin
      totalEarnings: 0
    }
  });

  console.log('✅ Admin user created successfully');
  console.log('📧 Email: admin@usde.com');
  console.log('🔑 Password: admin123');
  console.log('💰 Starting Balance: 10,000 UC');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 