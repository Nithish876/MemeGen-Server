import { Router } from 'express';
import { memeController } from '../controllers/memeController.js';
import { authenticateToken, optionalAuth } from '../middleware/auth.js';

const router = Router();

router.post('/', optionalAuth, memeController.saveMeme);
router.get('/user', authenticateToken, memeController.getUserMemes);
router.get('/', memeController.getCommunityMemes);
router.get('/:id', memeController.getMemeById);
router.put('/:id', optionalAuth, memeController.updateMeme);
router.delete('/:id', optionalAuth, memeController.deleteMeme);
router.post('/:id/like', memeController.likeMeme);
router.post('/:id/publish', optionalAuth, memeController.publishMeme);

export default router;
