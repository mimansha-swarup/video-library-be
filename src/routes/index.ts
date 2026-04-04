import { Router } from 'express';
import courseRoutes from './courseRoutes';
import moduleRoutes from './moduleRoutes';
import lessonRoutes from './lessonRoutes';
import videoRoutes from './videoRoutes';
import progressRoutes from './progressRoutes';
import noteRoutes from './noteRoutes';

const router = Router();

// Health check
router.get('/health', (_req, res) => {
  res.json({
    success: true,
    message: 'Video Streaming Backend is running',
    timestamp: new Date().toISOString(),
  });
});

// API routes
router.use('/courses', courseRoutes);
router.use('/modules', moduleRoutes);
router.use('/lessons', lessonRoutes);
router.use('/video', videoRoutes);
router.use('/progress', progressRoutes);
router.use('/notes', noteRoutes);

export default router;
