import { Router } from 'express';
import { analyticsController } from '../controllers/analyticsController.js';
import { optionalAuth } from '../middleware/auth.js';

const router = Router();

router.post('/track', optionalAuth, analyticsController.trackEvent);
router.get('/summary', analyticsController.getSummary);

export default router;

