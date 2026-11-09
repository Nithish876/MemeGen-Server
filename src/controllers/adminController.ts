import type { Request, Response } from 'express';
import { db } from '../config/db.js';

export const adminController = {
  /**
   * Main Admin Dashboard KPI & Aggregated Analytics
   * GET /api/v1/admin/dashboard
   */
  async getDashboard(_req: Request, res: Response) {
    try {
      const stats = await db.admin.getDashboardStats();
      return res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (err) {
      console.error('Error fetching admin dashboard:', err);
      return res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to load dashboard metrics' },
      });
    }
  },

  /**
   * Track & manage registered users
   * GET /api/v1/admin/users
   */
  async getUsers(req: Request, res: Response) {
    try {
      const { page = 1, limit = 50, search = '', role } = req.query;
      const result = await db.users.getAll({
        page: Number(page) || 1,
        limit: Number(limit) || 50,
        search: String(search),
        role: role ? String(role) : undefined,
      });

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err) {
      console.error('Error fetching admin users:', err);
      return res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to load users' },
      });
    }
  },

  /**
   * Update user role (e.g. promote to admin, pro, creator)
   * PUT /api/v1/admin/users/:id/role
   */
  async updateUserRole(req: Request, res: Response) {
    try {
      const id = String(req.params.id);
      const { role } = req.body;

      if (!role) {
        return res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_FAILED', message: 'Role is required' },
        });
      }

      const updated = await db.users.updateRole(id, String(role));
      if (!updated) {
        return res.status(404).json({
          success: false,
          error: { code: 'USER_NOT_FOUND', message: 'User not found' },
        });
      }

      return res.status(200).json({
        success: true,
        data: updated,
        message: `User role updated to ${role}`,
      });
    } catch (err) {
      console.error('Error updating user role:', err);
      return res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to update user role' },
      });
    }
  },

  /**
   * Track purchases & subscription transactions
   * GET /api/v1/admin/purchases
   */
  async getPurchases(req: Request, res: Response) {
    try {
      const { page = 1, limit = 50, plan, status, search = '' } = req.query;
      const result = await db.purchases.getAll({
        page: Number(page) || 1,
        limit: Number(limit) || 50,
        plan: plan ? String(plan) : undefined,
        status: status ? String(status) : undefined,
        search: String(search),
      });

      const summary = await db.purchases.getSummary();

      return res.status(200).json({
        success: true,
        data: {
          ...result,
          summary,
        },
      });
    } catch (err) {
      console.error('Error fetching purchases:', err);
      return res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to load purchase records' },
      });
    }
  },

  /**
   * Track platform traffic & visitor engagement
   * GET /api/v1/admin/traffic
   */
  async getTraffic(req: Request, res: Response) {
    try {
      const days = Number(req.query.days) || 7;
      const summary = await db.traffic.getSummary();
      const dailyStats = await db.traffic.getDailyStats(days);

      return res.status(200).json({
        success: true,
        data: {
          summary,
          dailyStats,
        },
      });
    } catch (err) {
      console.error('Error fetching traffic analytics:', err);
      return res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to load traffic stats' },
      });
    }
  },

  /**
   * Browse and moderate all created memes
   * GET /api/v1/admin/memes
   */
  async getMemes(req: Request, res: Response) {
    try {
      const { page = 1, limit = 50, search = '' } = req.query;
      const result = await db.memes.getAllAdmin({
        page: Number(page) || 1,
        limit: Number(limit) || 50,
        search: String(search),
      });

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err) {
      console.error('Error fetching memes for moderation:', err);
      return res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to load memes' },
      });
    }
  },

  /**
   * Delete inappropriate meme
   * DELETE /api/v1/admin/memes/:id
   */
  async deleteMeme(req: Request, res: Response) {
    try {
      const id = String(req.params.id);
      const success = await db.memes.delete(id);

      return res.status(200).json({
        success,
        message: success ? 'Meme removed by admin.' : 'Meme not found.',
      });
    } catch (err) {
      console.error('Error deleting meme:', err);
      return res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to delete meme' },
      });
    }
  },
};

