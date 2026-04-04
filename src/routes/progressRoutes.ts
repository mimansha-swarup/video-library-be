import { Router } from 'express';
import { progressController } from '../controllers';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Progress routes
router.post('/', (req, res, next) => progressController.updateProgress(req, res, next));
router.patch('/:lessonId', (req, res, next) => progressController.updateProgressByLessonId(req, res, next));
router.get('/summary', (req, res, next) => progressController.getProgressSummary(req, res, next));
router.get('/', (req, res, next) => progressController.getUserProgress(req, res, next));
router.get('/lesson/:lessonId', (req, res, next) => progressController.getLessonProgress(req, res, next));

export default router;
