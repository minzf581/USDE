const { PrismaClient } = require('@prisma/client');
const path = require('path');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: `file:${path.join(__dirname, 'prisma', 'data', 'app.db')}`
    }
  }
});

async function upgradeDemoAccount() {
  try {
    // 更新demo账户
    const updatedCompany = await prisma.company.update({
      where: {
        email: 'demo@usde.com'
      },
      data: {
        kycStatus: 'approved',
        isParentCompany: true,
        companyType: 'parent',
        companyCode: 'DEMO001',
        companyAddress: '0x1234567890abcdef',
        companyNameEn: 'Demo Company Ltd',
        companyRegNumber: 'REG123456',
        countryOfReg: 'Singapore',
        regAddress: '1 Demo Street, Singapore',
        incorporationDate: new Date('2020-01-01'),
        kycCompanyType: 'Private Limited',
        isPEP: false,
        isSanctioned: false,
        complianceAgreed: true,
        role: 'enterprise_admin',
        isEnterpriseAdmin: true
      }
    });

    // 确保有TreasurySettings
    const existingSettings = await prisma.treasurySettings.findUnique({
      where: { companyId: updatedCompany.id }
    });

    if (!existingSettings) {
      await prisma.treasurySettings.create({
        data: {
          companyId: updatedCompany.id,
          monthlyBudget: 1000000,
          quarterlyBudget: 3000000,
          approvalThreshold: 10000,
          autoApprovalEnabled: true,
          riskFlagThreshold: 50000,
          approvalWorkflow: 'single'
        }
      });
    }

    // 添加KYC审核记录
    await prisma.kYCReview.create({
      data: {
        companyId: updatedCompany.id,
        status: 'approved',
        notes: 'KYC approved for demo account',
        reviewedAt: new Date()
      }
    });

    // 添加UBO信息
    await prisma.uBO.create({
      data: {
        companyId: updatedCompany.id,
        name: 'John Demo',
        idNumber: 'ID123456',
        nationality: 'Singapore',
        address: '1 Demo Street, Singapore',
        ownershipPercentage: 100,
        addressProof: 'demo_address_proof.pdf'
      }
    });

    console.log('✅ Demo account upgraded successfully');
    console.log('Account details:', updatedCompany);

  } catch (error) {
    console.error('❌ Failed to upgrade demo account:', error);
  } finally {
    await prisma.$disconnect();
  }
}

upgradeDemoAccount();
