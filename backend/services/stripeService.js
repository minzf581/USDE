const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const prisma = require('../lib/prisma');



class StripeService {
  // Create checkout session for deposit
  static async createCheckoutSession(amount, companyId, successUrl, cancelUrl) {
    try {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: 'USDE Stablecoin Deposit',
                description: `Deposit $${amount} to mint ${amount} USDE tokens`,
              },
              unit_amount: Math.round(amount * 100), // Convert to cents
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: {
          companyId,
          amount: amount.toString(),
        },
      });

      // Create deposit record
      await prisma.deposit.create({
        data: {
          companyId,
          amount,
          stripeSessionId: session.id,
          status: 'pending',
        },
      });

      return session;
    } catch (error) {
      console.error('Stripe session creation error:', error);
      throw error;
    }
  }

  // Verify webhook signature
  static verifyWebhook(payload, signature) {
    try {
      return stripe.webhooks.constructEvent(
        payload,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (error) {
      console.error('Webhook signature verification failed:', error);
      throw error;
    }
  }

  // Handle successful payment
  static async handlePaymentSuccess(sessionId) {
    try {
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      const { companyId, amount } = session.metadata;

      // Find the deposit record
      const deposit = await prisma.deposit.findFirst({
        where: {
          stripeSessionId: sessionId,
          companyId,
        },
      });

      if (!deposit) {
        throw new Error('Deposit record not found');
      }

      // Update deposit status and mint USDE
      const result = await prisma.$transaction(async (tx) => {
        // Update deposit status
        const updatedDeposit = await tx.deposit.update({
          where: { id: deposit.id },
          data: {
            status: 'completed',
            stripePaymentId: session.payment_intent,
          },
        });

        // Get current company balance
        const company = await tx.company.findUnique({
          where: { id: companyId },
        });

        const balanceBefore = company.usdeBalance;
        const balanceAfter = balanceBefore + parseFloat(amount);

        // Mint USDE tokens (1:1 ratio with USD)
        const updatedCompany = await tx.company.update({
          where: { id: companyId },
          data: { usdeBalance: balanceAfter },
        });

        // Record USDE transaction
        await tx.uSDETransaction.create({
          data: {
            companyId,
            type: 'mint',
            amount: parseFloat(amount),
            balanceBefore,
            balanceAfter,
            description: `Minted ${amount} USDE from $${amount} deposit`,
            metadata: JSON.stringify({
              depositId: deposit.id,
              stripeSessionId: sessionId,
              stripePaymentId: session.payment_intent,
            }),
          },
        });

        return { updatedDeposit, updatedCompany, balanceBefore, balanceAfter };
      });

      return result;
    } catch (error) {
      console.error('Payment success handling error:', error);
      throw error;
    }
  }

  // Create payout to wallet
  static async createPayout(amount, companyId, walletAddress) {
    try {
      // For MVP, we'll simulate the payout
      // In production, this would integrate with blockchain
      const payout = await stripe.transfers.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: 'usd',
        destination: 'acct_1234567890', // This would be the connected account
        metadata: {
          companyId,
          walletAddress,
        },
      });

      // Create withdrawal record
      const withdrawal = await prisma.withdrawal.create({
        data: {
          companyId,
          amount,
          walletAddress,
          status: 'pending',
        },
      });

      return { payout, withdrawal };
    } catch (error) {
      console.error('Payout creation error:', error);
      throw error;
    }
  }

  // Get payment session status
  static async getSessionStatus(sessionId) {
    try {
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      return {
        id: session.id,
        status: session.payment_status,
        amount: session.amount_total / 100, // Convert from cents
        metadata: session.metadata,
      };
    } catch (error) {
      console.error('Session status error:', error);
      throw error;
    }
  }
}

module.exports = StripeService; 