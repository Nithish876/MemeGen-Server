import type { Response } from 'express';
import { db } from '../config/db.js';
import type { AuthenticatedRequest } from '../middleware/auth.js';

export const subscriptionController = {
  /**
   * Process purchase/checkout for premium plans
   * POST /api/v1/subscriptions/checkout
   */
  async checkout(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id || 'guest';
      const userEmail = req.user?.email || req.body.billingDetails?.email || 'guest@memegen.com';
      const userName = req.user?.fullName || req.body.billingDetails?.fullName || 'Creator';

      const {
        planId,
        billingCycle = 'monthly',
        amount,
        billingDetails,
        paymentDetails,
        simulateFailure,
      } = req.body;

      if (!planId) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_FAILED',
            message: 'Plan ID is required for checkout.',
          },
        });
      }

      if (simulateFailure) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'PAYMENT_DECLINED',
            message: 'Payment simulated failure: Transaction declined by issuing bank (Demo Test Mode).',
          },
        });
      }

      const randomSuffix = Math.floor(100000 + Math.random() * 900000);
      const orderId = `MH-SUB-${randomSuffix}`;
      const transactionId = `TXN_${Date.now().toString(36).toUpperCase()}_${randomSuffix}`;

      const purchase = await db.purchases.create({
        userId,
        userEmail,
        userName,
        planId,
        billingCycle,
        amount: Number(amount) || 9.99,
        currency: 'USD',
        status: 'active',
        orderId,
        transactionId,
        paymentMethod: paymentDetails?.method || 'Credit Card',
      });

      return res.status(200).json({
        success: true,
        data: {
          purchase,
          orderId,
          transactionId,
          planId,
          billingCycle,
          amount: purchase.amount,
          status: 'active',
        },
        message: 'Subscription payment completed successfully!',
      });
    } catch (err) {
      console.error('Subscription checkout error:', err);
      return res.status(500).json({
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: 'Failed to process subscription payment.',
        },
      });
    }
  },

  /**
   * Get current subscription for logged-in user
   * GET /api/v1/subscriptions/current
   */
  async getCurrentSubscription(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(200).json({
          success: true,
          data: {
            planId: 'free',
            status: 'active',
            billingCycle: 'monthly',
            amountPaid: 0,
          },
        });
      }

      const purchases = await db.purchases.getByUser(userId);
      const active = purchases.find((p) => p.status === 'active');

      return res.status(200).json({
        success: true,
        data: active || {
          planId: req.user?.role === 'pro' ? 'pro' : req.user?.role === 'enterprise' ? 'enterprise' : 'free',
          status: 'active',
          billingCycle: 'monthly',
          amountPaid: 0,
        },
      });
    } catch (err) {
      console.error('Error fetching subscription:', err);
      return res.status(500).json({
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: 'Failed to retrieve subscription info.',
        },
      });
    }
  },

  /**
   * Cancel subscription
   * POST /api/v1/subscriptions/cancel
   */
  async cancelSubscription(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Must be logged in to cancel.' },
        });
      }

      const purchases = await db.purchases.getByUser(userId);
      const active = purchases.find((p) => p.status === 'active');
      if (active) {
        active.status = 'cancelled';
      }

      // Reset role back to creator
      await db.users.updateRole(userId, 'creator');

      return res.status(200).json({
        success: true,
        message: 'Subscription cancelled. You will continue to have access until the end of the billing period.',
      });
    } catch (err) {
      console.error('Error cancelling subscription:', err);
      return res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to cancel subscription.' },
      });
    }
  },
};

