import type { Request, Response } from 'express';
import { db } from '../config/db.js';
import type { AuthenticatedRequest } from '../middleware/auth.js';

export const memeController = {
  /**
   * Save a newly created, exported, or published meme
   * POST /api/v1/memes
   */
  async saveMeme(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id || 'guest';
      const {
        templateId,
        title,
        imageUrl,
        textLayers,
        canvasSettings,
        width,
        height,
        isPublic = true,
      } = req.body;

      if (!imageUrl) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_FAILED',
            message: 'Image URL or export data is required.',
          },
        });
      }

      const meme = await db.memes.create({
        userId,
        templateId: templateId || 'custom',
        title: title || 'Untitled Meme',
        imageUrl,
        textLayers: textLayers || [],
        canvasSettings: canvasSettings || {},
        width: Number(width) || 600,
        height: Number(height) || 600,
        isPublic: Boolean(isPublic),
      });

      return res.status(201).json({
        success: true,
        data: meme,
        message: 'Meme saved to library successfully.',
      });
    } catch (err) {
      console.error('Error saving meme:', err);
      return res.status(500).json({
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: 'Failed to record meme.',
        },
      });
    }
  },

  /**
   * Get all memes worked on / created by the current user
   * GET /api/v1/memes/user
   */
  async getUserMemes(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const memes = await db.memes.getByUser(userId);

      return res.status(200).json({
        success: true,
        data: memes,
      });
    } catch (err) {
      console.error('Error fetching user memes:', err);
      return res.status(500).json({
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: 'Failed to retrieve your memes.',
        },
      });
    }
  },

  /**
   * Browse community memes
   * GET /api/v1/memes
   */
  async getCommunityMemes(req: Request, res: Response) {
    try {
      const { page = 1, limit = 20, sortBy = 'latest' } = req.query;

      const result = await db.memes.getPublic({
        page: Number(page) || 1,
        limit: Number(limit) || 20,
        sortBy: String(sortBy),
      });

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err) {
      console.error('Error fetching community memes:', err);
      return res.status(500).json({
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: 'Failed to retrieve community memes.',
        },
      });
    }
  },

  /**
   * Get single meme by ID
   * GET /api/v1/memes/:id
   */
  async getMemeById(req: Request, res: Response) {
    try {
      const id = String(req.params.id);
      const meme = await db.memes.getById(id);

      if (!meme) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'MEME_NOT_FOUND',
            message: `Meme with ID '${id}' was not found.`,
          },
        });
      }

      return res.status(200).json({
        success: true,
        data: meme,
      });
    } catch (err) {
      console.error('Error fetching meme by ID:', err);
      return res.status(500).json({
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: 'Failed to retrieve meme details.',
        },
      });
    }
  },

  /**
   * Like a meme
   * POST /api/v1/memes/:id/like
   */
  async likeMeme(req: Request, res: Response) {
    try {
      const id = String(req.params.id);
      const likes = await db.memes.like(id);

      return res.status(200).json({
        success: true,
        data: { id, likes },
      });
    } catch (err) {
      console.error('Error liking meme:', err);
      return res.status(500).json({
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: 'Failed to update like status.',
        },
      });
    }
  },

  /**
   * Update/Edit existing meme
   * PUT /api/v1/memes/:id
   */
  async updateMeme(req: AuthenticatedRequest, res: Response) {
    try {
      const id = String(req.params.id);
      const updates = req.body;
      const updated = await db.memes.update(id, updates);
      if (!updated) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Meme not found' },
        });
      }
      return res.status(200).json({
        success: true,
        data: updated,
        message: 'Meme updated successfully',
      });
    } catch (err) {
      console.error('Error updating meme:', err);
      return res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to update meme' },
      });
    }
  },

  /**
   * Delete meme
   * DELETE /api/v1/memes/:id
   */
  async deleteMeme(req: AuthenticatedRequest, res: Response) {
    try {
      const id = String(req.params.id);
      const userId = req.user?.id;
      const success = await db.memes.delete(id, req.user?.role === 'admin' ? undefined : userId);
      return res.status(200).json({
        success,
        message: success ? 'Meme deleted successfully' : 'Meme not found or unauthorized',
      });
    } catch (err) {
      console.error('Error deleting meme:', err);
      return res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to delete meme' },
      });
    }
  },

  /**
   * Toggle publish / public status
   * POST /api/v1/memes/:id/publish
   */
  async publishMeme(req: AuthenticatedRequest, res: Response) {
    try {
      const id = String(req.params.id);
      const { isPublic = true } = req.body;
      const updated = await db.memes.update(id, { is_public: Boolean(isPublic) });
      return res.status(200).json({
        success: true,
        data: updated,
        message: isPublic ? 'Meme published to community.' : 'Meme set to private.',
      });
    } catch (err) {
      console.error('Error publishing meme:', err);
      return res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to update visibility' },
      });
    }
  },
};
