import { Router } from 'express';
import { moduleController } from '../../controllers';
import { adminMiddleware } from '../../middleware/auth';

const router = Router();

router.use(adminMiddleware);

// Admin module write routes
router.post('/', (req, res, next) => moduleController.createModule(req, res, next));
router.put('/:id', (req, res, next) => moduleController.updateModule(req, res, next));
router.delete('/:id', (req, res, next) => moduleController.deleteModule(req, res, next));

export default router;
