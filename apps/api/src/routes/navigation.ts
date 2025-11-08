import { Router } from 'express';
import { body } from 'express-validator';
import { getNavigationConfig, updateNavigationConfig, resetNavigationConfig } from '../controllers/navigation';
import { authenticateToken } from '../middleware/auth';
import { requireAdmin } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';

const router = Router();

// Get navigation configuration (public endpoint)
router.get('/', getNavigationConfig);

// Update navigation configuration (admin only)
router.put('/', 
  authenticateToken,
  requireAdmin,
  [
    body('showInNav').isBoolean().withMessage('showInNav must be a boolean'),
    body('maxVisibleCategories').isInt({ min: 1, max: 20 }).withMessage('maxVisibleCategories must be an integer between 1 and 20'),
    body('showSubcategories').isBoolean().withMessage('showSubcategories must be a boolean'),
    body('showMoreButton').isBoolean().withMessage('showMoreButton must be a boolean'),
    body('customOrder').isArray().withMessage('customOrder must be an array'),
    body('customOrder.*').isString().withMessage('Each item in customOrder must be a string')
  ],
  validateRequest,
  updateNavigationConfig
);

// Reset navigation configuration to defaults (admin only)
router.post('/reset',
  authenticateToken,
  requireAdmin,
  resetNavigationConfig
);

export default router;
