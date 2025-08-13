const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateUserRoles() {
  try {
    console.log('🔄 开始更新用户角色...');

    // 更新 system_admin 为 admin
    const systemAdminUpdate = await prisma.company.updateMany({
      where: { role: 'system_admin' },
      data: { role: 'admin' }
    });
    console.log(`✅ 更新了 ${systemAdminUpdate.count} 个系统管理员角色`);

    // 更新 enterprise_user 为 enterprise_finance_operator
    const enterpriseUserUpdate = await prisma.company.updateMany({
      where: { role: 'enterprise_user' },
      data: { role: 'enterprise_finance_operator' }
    });
    console.log(`✅ 更新了 ${enterpriseUserUpdate.count} 个企业用户角色`);

    // 更新 enterpriseRole 字段
    const financeManagerUpdate = await prisma.company.updateMany({
      where: { enterpriseRole: 'finance_manager' },
      data: { enterpriseRole: 'enterprise_finance_manager' }
    });
    console.log(`✅ 更新了 ${financeManagerUpdate.count} 个财务管理员企业角色`);

    const financeOperatorUpdate = await prisma.company.updateMany({
      where: { enterpriseRole: 'finance_operator' },
      data: { enterpriseRole: 'enterprise_finance_operator' }
    });
    console.log(`✅ 更新了 ${financeOperatorUpdate.count} 个财务操作员企业角色`);

    // 删除 observer 角色（如果有的话）
    const observerUpdate = await prisma.company.updateMany({
      where: { enterpriseRole: 'observer' },
      data: { enterpriseRole: 'enterprise_finance_operator' }
    });
    console.log(`✅ 更新了 ${observerUpdate.count} 个观察者角色为财务操作员`);

    // 显示当前角色分布
    const roleStats = await prisma.company.groupBy({
      by: ['role'],
      _count: true
    });

    console.log('\n📊 当前角色分布:');
    roleStats.forEach(stat => {
      console.log(`   ${stat.role}: ${stat._count} 个用户`);
    });

    const enterpriseRoleStats = await prisma.company.groupBy({
      by: ['enterpriseRole'],
      _count: true,
      where: {
        enterpriseRole: { not: null }
      }
    });

    console.log('\n📊 当前企业角色分布:');
    enterpriseRoleStats.forEach(stat => {
      console.log(`   ${stat.enterpriseRole}: ${stat._count} 个用户`);
    });

    console.log('\n🎉 用户角色更新完成！');

  } catch (error) {
    console.error('❌ 更新用户角色时出错:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  updateUserRoles()
    .then(() => {
      console.log('✅ 脚本执行完成');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ 脚本执行失败:', error);
      process.exit(1);
    });
}

module.exports = { updateUserRoles };



