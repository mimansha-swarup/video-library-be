import { Router } from 'express';
import { videoController } from '../controllers';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Video streaming routes (client)
router.get('/stream', (req, res, next) => videoController.getStreamUrl(req, res, next));
router.get('/lesson/:lessonId/stream', (req, res, next) => videoController.getStreamUrlByLesson(req, res, next));

export default router;
