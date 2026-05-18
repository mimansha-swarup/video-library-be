import { Router } from 'express';
import { courseController } from '../../controllers';
import { adminMiddleware } from '../../middleware/auth';

const router = Router();

router.use(adminMiddleware);

// Admin course write routes
router.post('/', (req, res, next) => courseController.createCourse(req, res, next));
router.put('/:id', (req, res, next) => courseController.updateCourse(req, res, next));
router.delete('/:id', (req, res, next) => courseController.deleteCourse(req, res, next));

export default router;
