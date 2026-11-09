import { Router } from 'express';
import { aiController } from '../controllers/aiController.js';

const router = Router();

router.post('/generate-captions', aiController.generateCaptions);

export default router;

