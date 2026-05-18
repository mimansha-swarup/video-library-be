import { Router } from 'express';
import { moduleController } from '../controllers';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Read-only module routes (client)
router.get('/course/:courseId', (req, res, next) => moduleController.getModulesByCourse(req, res, next));
router.get('/:id', (req, res, next) => moduleController.getModuleById(req, res, next));

export default router;
