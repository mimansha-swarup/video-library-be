import { Router } from 'express';
import courseRoutes from './courseRoutes';
import moduleRoutes from './moduleRoutes';
import lessonRoutes from './lessonRoutes';
import videoRoutes from './videoRoutes';

const router = Router();

router.use('/courses', courseRoutes);
router.use('/modules', moduleRoutes);
router.use('/lessons', lessonRoutes);
router.use('/video', videoRoutes);

export default router;
