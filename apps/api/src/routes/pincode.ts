import { Router } from 'express';
import { pincodeController } from '../controllers/pincode';

const router = Router();

// GET /api/v1/pincode/:pincode - Lookup location by pincode
router.get('/:pincode', pincodeController.lookup);

// POST /api/v1/pincode/validate - Validate pincode format
router.post('/validate', pincodeController.validate);

export { router as pincodeRoutes };
