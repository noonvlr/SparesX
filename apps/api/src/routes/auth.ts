import { Router } from 'express';
import { authController } from '../controllers/auth';
import { validateRequest } from '../middleware/validation';
import { body } from 'express-validator';

const router = Router();

// Validation rules
const signupValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please enter a valid email address'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('name')
    .trim()
    .isLength({ min: 1 })
    .withMessage('Name is required'),
  body('phone')
    .notEmpty()
    .withMessage('Phone number is required')
    .isMobilePhone('en-IN')
    .withMessage('Please enter a valid 10-digit Indian mobile number'),
  body('role')
    .optional()
    .isIn(['BUYER', 'SELLER', 'DEALER'])
    .withMessage('Role must be BUYER, SELLER, or DEALER'),
];

const loginValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
];

// Routes
router.post('/signup', signupValidation, validateRequest, authController.signup);
router.post('/login', loginValidation, validateRequest, authController.login);
router.post('/refresh', authController.refreshToken);
router.post('/logout', authController.logout);

export { router as authRoutes };





