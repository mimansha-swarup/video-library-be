import { Router } from 'express';
import { lessonController } from '../controllers';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Read-only lesson routes (client)
router.get('/module/:moduleId', (req, res, next) => lessonController.getLessonsByModule(req, res, next));
router.get('/:id', (req, res, next) => lessonController.getLessonById(req, res, next));

export default router;
