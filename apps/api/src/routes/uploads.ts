import { Router } from 'express';
import { uploadController } from '../controllers/uploads';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Routes
router.post('/sign', authenticateToken, uploadController.getSignedUploadParams);

export { router as uploadRoutes };





