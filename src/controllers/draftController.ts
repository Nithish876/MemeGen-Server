import type { Response } from 'express';
import { db } from '../config/db.js';
import type { AuthenticatedRequest } from '../middleware/auth.js';

export const draftController = {
  /**
   * Save or update an in-progress meme editing draft
   * POST /api/v1/drafts
   */
  async saveDraft(req: AuthenticatedRequest, res: Response) {
    try {
      const userId =
        req.user?.id ||
        req.body.userId ||
        (req.headers['x-guest-id'] as string) ||
        'guest';

      const {
        id,
        templateId,
        template,
        memeTitle,
        title,
        textLayers,
        canvasSettings,
        previewImageUrl,
        previewUrl,
      } = req.body;

      const actualTemplateId = templateId || template?.id;
      if (!actualTemplateId) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_FAILED',
            message: 'Template or Template ID is required to save a draft.',
          },
        });
      }

      const draft = await db.drafts.saveDraft({
        id,
        userId,
        templateId: actualTemplateId,
        template,
        memeTitle: memeTitle || title || 'Untitled Meme',
        title: title || memeTitle || 'Untitled Meme',
        textLayers: textLayers || [],
        canvasSettings: canvasSettings || {},
        previewImageUrl: previewImageUrl || previewUrl || null,
        previewUrl: previewUrl || previewImageUrl || null,
      });

      return res.status(200).json({
        success: true,
        data: draft,
        message: 'Draft synced successfully.',
      });
    } catch (err) {
      console.error('Error saving draft:', err);
      return res.status(500).json({
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: 'Failed to save meme draft.',
        },
      });
    }
  },

  /**
   * Retrieve the most recent active draft for current user
   * GET /api/v1/drafts/latest
   */
  async getLatestDraft(req: AuthenticatedRequest, res: Response) {
    try {
      const userId =
        req.user?.id ||
        (req.headers['x-guest-id'] as string) ||
        (req.query.userId as string) ||
        'guest';

      const draft = await db.drafts.getLatest(userId);

      return res.status(200).json({
        success: true,
        data: draft,
      });
    } catch (err) {
      console.error('Error fetching latest draft:', err);
      return res.status(500).json({
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: 'Failed to retrieve latest draft.',
        },
      });
    }
  },

  /**
   * List all drafts for current user
   * GET /api/v1/drafts
   */
  async getUserDrafts(req: AuthenticatedRequest, res: Response) {
    try {
      const userId =
        req.user?.id ||
        (req.headers['x-guest-id'] as string) ||
        (req.query.userId as string) ||
        'guest';

      const drafts = await db.drafts.getAllByUser(userId);

      return res.status(200).json({
        success: true,
        data: drafts,
      });
    } catch (err) {
      console.error('Error fetching user drafts:', err);
      return res.status(500).json({
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: 'Failed to retrieve drafts.',
        },
      });
    }
  },

  /**
   * Get draft by ID
   * GET /api/v1/drafts/:id
   */
  async getDraftById(req: AuthenticatedRequest, res: Response) {
    try {
      const userId =
        req.user?.id ||
        (req.headers['x-guest-id'] as string) ||
        (req.query.userId as string);

      const id = String(req.params.id);
      const draft = await db.drafts.getById(id, userId);

      if (!draft) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'DRAFT_NOT_FOUND',
            message: 'Draft not found or you do not have permission to view it.',
          },
        });
      }

      return res.status(200).json({
        success: true,
        data: draft,
      });
    } catch (err) {
      console.error('Error fetching draft by ID:', err);
      return res.status(500).json({
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: 'Failed to retrieve draft details.',
        },
      });
    }
  },

  /**
   * Delete draft
   * DELETE /api/v1/drafts/:id
   */
  async deleteDraft(req: AuthenticatedRequest, res: Response) {
    try {
      const userId =
        req.user?.id ||
        (req.headers['x-guest-id'] as string) ||
        (req.query.userId as string);

      const id = String(req.params.id);
      const success = await db.drafts.delete(id, userId);

      return res.status(200).json({
        success: true,
        message: success ? 'Draft deleted.' : 'Draft not found or already deleted.',
      });
    } catch (err) {
      console.error('Error deleting draft:', err);
      return res.status(500).json({
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: 'Failed to delete draft.',
        },
      });
    }
  },
};
