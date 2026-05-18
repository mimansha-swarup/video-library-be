import { Router } from 'express';
import { videoController, upload } from '../../controllers';
import { adminMiddleware } from '../../middleware/auth';

const router = Router();

router.use(adminMiddleware);

// Admin video write routes
router.post('/upload', upload.single('video'), (req, res, next) => videoController.uploadVideo(req, res, next));
router.delete('/:videoKey', (req, res, next) => videoController.deleteVideo(req, res, next));

export default router;
