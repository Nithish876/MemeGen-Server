import { Router } from 'express';
import { draftController } from '../controllers/draftController.js';
import { optionalAuth } from '../middleware/auth.js';

const router = Router();

router.use(optionalAuth);

router.post('/', draftController.saveDraft);
router.get('/latest', draftController.getLatestDraft);
router.get('/', draftController.getUserDrafts);
router.get('/:id', draftController.getDraftById);
router.delete('/:id', draftController.deleteDraft);

export default router;
