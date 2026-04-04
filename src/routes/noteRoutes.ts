import { Router } from 'express';
import { noteController } from '../controllers/noteController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.use(authMiddleware);

router.get('/:lessonId', (req, res, next) => noteController.getNote(req, res, next));
router.put('/:lessonId', (req, res, next) => noteController.upsertNote(req, res, next));

export default router;
