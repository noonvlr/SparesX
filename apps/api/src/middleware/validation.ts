import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';

export function validateRequest(req: Request, res: Response, next: NextFunction) {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    console.log('Validation errors:', errors.array());
    console.log('Request body:', req.body);
    
    // Create user-friendly error messages
    const errorMessages = errors.array().map(error => {
      if (error.type === 'field') {
        return error.msg || `${error.path} is invalid`;
      }
      return error.msg || 'Invalid input';
    });
    
    const primaryError = errorMessages[0] || 'Please check your input and try again';
    
    return res.status(400).json({
      success: false,
      error: primaryError,
      details: errorMessages,
      field: errors.array()[0]?.path || 'unknown'
    });
  }
  
  next();
}





