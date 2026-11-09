import { Router } from 'express';
import { subscriptionController } from '../controllers/subscriptionController.js';
import { optionalAuth, authenticateToken } from '../middleware/auth.js';

const router = Router();

router.post('/checkout', optionalAuth, subscriptionController.checkout);
router.get('/current', optionalAuth, subscriptionController.getCurrentSubscription);
router.post('/cancel', authenticateToken, subscriptionController.cancelSubscription);

export default router;

