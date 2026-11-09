import type { Request, Response } from 'express';
import { db } from '../config/db.js';
import type { AuthenticatedRequest } from '../middleware/auth.js';

export const analyticsController = {
  /**
   * Track traffic page view or action
   * POST /api/v1/analytics/track
   */
  async trackEvent(req: AuthenticatedRequest, res: Response) {
    try {
      const { path = '/', referrer, device, browser } = req.body;
      const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
      const userId = req.user?.id;

      await db.traffic.record({
        path,
        referrer: referrer || 'direct',
        device: device || (req.headers['user-agent']?.includes('Mobile') ? 'mobile' : 'desktop'),
        browser: browser || 'Browser',
        ip: String(ip).split(',')[0].trim(),
        userId,
      });

      return res.status(200).json({
        success: true,
        message: 'Event logged',
      });
    } catch (err) {
      console.error('Analytics tracking error:', err);
      return res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to record event' },
      });
    }
  },

  /**
   * Get public analytics summary
   * GET /api/v1/analytics/summary
   */
  async getSummary(_req: Request, res: Response) {
    try {
      const summary = await db.traffic.getSummary();
      return res.status(200).json({
        success: true,
        data: summary,
      });
    } catch (err) {
      console.error('Analytics summary error:', err);
      return res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to retrieve stats' },
      });
    }
  },
};

