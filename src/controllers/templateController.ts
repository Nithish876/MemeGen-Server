import type { Request, Response } from 'express';
import { db } from '../config/db.js';

export const templateController = {
  /**
   * List paginated templates with category, search and sort filters
   * GET /api/v1/templates
   */
  async getTemplates(req: Request, res: Response) {
    try {
      const { category, search, page = 1, limit = 50, sortBy = 'popular' } = req.query;

      const result = await db.templates.getAll({
        category: category ? String(category) : undefined,
        search: search ? String(search) : undefined,
        page: Number(page) || 1,
        limit: Number(limit) || 50,
        sortBy: String(sortBy),
      });

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err) {
      console.error('Error fetching templates:', err);
      return res.status(500).json({
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: 'Failed to retrieve meme templates.',
        },
      });
    }
  },

  /**
   * Get single template details
   * GET /api/v1/templates/:id
   */
  async getTemplateById(req: Request, res: Response) {
    try {
      const id = String(req.params.id);
      const template = await db.templates.getById(id);

      if (!template) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'TEMPLATE_NOT_FOUND',
            message: `Template with ID '${id}' was not found.`,
          },
        });
      }

      return res.status(200).json({
        success: true,
        data: template,
      });
    } catch (err) {
      console.error('Error fetching template by ID:', err);
      return res.status(500).json({
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: 'Failed to retrieve template details.',
        },
      });
    }
  },
};
