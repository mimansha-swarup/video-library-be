import { Router } from 'express';
import { courseController } from '../controllers';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.use(authMiddleware);

// Read-only course routes (client)
router.get('/', (req, res, next) => courseController.getAllCourses(req, res, next));
router.get('/:id', (req, res, next) => courseController.getCourseById(req, res, next));
router.get('/:id/content', (req, res, next) => courseController.getCourseWithContent(req, res, next));

export default router;
