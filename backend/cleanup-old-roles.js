const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanupOldRoles() {
  try {
    console.log('🧹 开始清理旧角色...');

    // 更新 demo 角色为 enterprise_admin
    const demoUpdate = await prisma.company.updateMany({
      where: { role: 'demo' },
      data: { role: 'enterprise_admin' }
    });
    console.log(`✅ 更新了 ${demoUpdate.count} 个 demo 角色为 enterprise_admin`);

    // 更新 user 角色为 enterprise_finance_operator
    const userUpdate = await prisma.company.updateMany({
      where: { role: 'user' },
      data: { role: 'enterprise_finance_operator' }
    });
    console.log(`✅ 更新了 ${userUpdate.count} 个 user 角色为 enterprise_finance_operator`);

    // 显示最终角色分布
    const roleStats = await prisma.company.groupBy({
      by: ['role'],
      _count: true
    });

    console.log('\n📊 最终角色分布:');
    roleStats.forEach(stat => {
      console.log(`   ${stat.role}: ${stat._count} 个用户`);
    });

    console.log('\n🎉 角色清理完成！');

  } catch (error) {
    console.error('❌ 清理角色时出错:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  cleanupOldRoles()
    .then(() => {
      console.log('✅ 脚本执行完成');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ 脚本执行失败:', error);
      process.exit(1);
    });
}

module.exports = { cleanupOldRoles };



