const prisma = require('../lib/prisma');
const cron = require('node-cron');



class PaymentService {
  constructor() {
    this.initScheduledTasks();
  }

  // Initialize scheduled tasks
  initScheduledTasks() {
    // Run every hour to check for expired locked balances
    cron.schedule('0 * * * *', () => {
      this.releaseExpiredLocks();
    });

    console.log('Payment service scheduled tasks initialized');
  }

  // Release expired locked balances
  async releaseExpiredLocks() {
    try {
      const now = new Date();
      
      // Find all expired locked balances
      const expiredLocks = await prisma.lockedBalance.findMany({
        where: {
          releaseAt: {
            lte: now
          }
        },
        include: {
          user: true
        }
      });

      console.log(`Found ${expiredLocks.length} expired locked balances`);

      for (const lock of expiredLocks) {
        await this.releaseLock(lock);
      }
    } catch (error) {
      console.error('Error releasing expired locks:', error);
    }
  }

  // Release a specific locked balance
  async releaseLock(lock) {
    try {
      await prisma.$transaction(async (tx) => {
        // Update payment status
        await tx.payment.update({
          where: { id: lock.sourceId },
          data: {
            status: 'released',
            releasedAt: new Date()
          }
        });

        // Delete the locked balance
        await tx.lockedBalance.delete({
          where: { id: lock.id }
        });

        console.log(`Released lock ${lock.id} for user ${lock.userId}, amount: ${lock.amount}`);
      });
    } catch (error) {
      console.error(`Error releasing lock ${lock.id}:`, error);
    }
  }

  // Get available balance (total balance minus locked amounts)
  async getAvailableBalance(userId) {
    const user = await prisma.company.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new Error('User not found');
    }

    const lockedAmount = await prisma.lockedBalance.aggregate({
      where: { userId },
      _sum: { amount: true }
    });

    return user.usdeBalance - (lockedAmount._sum.amount || 0);
  }

  // Get locked balance details
  async getLockedBalances(userId) {
    // Since lockedBalance table doesn't exist in current schema, return empty array
    return [];
  }

  // Create payment with lock
  async createPayment(fromId, toId, amount, lockDays) {
    const releaseAt = new Date();
    releaseAt.setDate(releaseAt.getDate() + lockDays);

    return await prisma.$transaction(async (tx) => {
      // Deduct from sender
      const updatedSender = await tx.company.update({
        where: { id: fromId },
        data: { usdeBalance: { decrement: amount } }
      });

      // Add to recipient
      const updatedRecipient = await tx.company.update({
        where: { id: toId },
        data: { usdeBalance: { increment: amount } }
      });

      // Create payment record
      const payment = await tx.payment.create({
        data: {
          fromId,
          toId,
          amount,
          lockDays,
          releaseAt,
          status: 'pending'
        }
      });

      // Create locked balance record
      const lockedBalance = await tx.lockedBalance.create({
        data: {
          userId: toId,
          amount,
          releaseAt,
          sourceId: payment.id
        }
      });

      return { payment, lockedBalance, updatedSender, updatedRecipient };
    });
  }
}

module.exports = new PaymentService(); 