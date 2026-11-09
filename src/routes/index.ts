import { Router } from 'express';
import authRoutes from './authRoutes.js';
import templateRoutes from './templateRoutes.js';
import draftRoutes from './draftRoutes.js';
import memeRoutes from './memeRoutes.js';
import aiRoutes from './aiRoutes.js';
import subscriptionRoutes from './subscriptionRoutes.js';
import analyticsRoutes from './analyticsRoutes.js';
import adminRoutes from './adminRoutes.js';
import { swaggerDocument } from '../config/swagger.js';

const router = Router();

// Health check endpoint
router.get('/health', (_req, res) => {
  res.status(200).json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'MemeHub API Server',
    },
  });
});

// Raw OpenAPI JSON spec endpoint
router.get('/docs.json', (_req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerDocument);
});

router.use('/auth', authRoutes);
router.use('/templates', templateRoutes);
router.use('/drafts', draftRoutes);
router.use('/memes', memeRoutes);
router.use('/ai', aiRoutes);
router.use('/subscriptions', subscriptionRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/admin', adminRoutes);

export default router;
