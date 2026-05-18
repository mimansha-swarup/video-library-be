import { Router } from 'express';
import { lessonController } from '../../controllers';
import { adminMiddleware } from '../../middleware/auth';

const router = Router();

router.use(adminMiddleware);

// Admin lesson write routes
router.post('/', (req, res, next) => lessonController.createLesson(req, res, next));
router.put('/:id', (req, res, next) => lessonController.updateLesson(req, res, next));
router.delete('/:id', (req, res, next) => lessonController.deleteLesson(req, res, next));

export default router;
