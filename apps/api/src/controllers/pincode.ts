import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/error-handler';
import { PincodeLookup } from '../utils/pincode-lookup';

class PincodeController {
  lookup = asyncHandler(async (req: Request, res: Response) => {
    const { pincode } = req.params;
    
    if (!pincode) {
      return res.status(400).json({
        success: false,
        error: 'Pincode is required',
      });
    }

    // Validate pincode format
    if (!PincodeLookup.validatePincode(pincode)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid pincode format. Pincode must be a 6-digit number.',
      });
    }
    
    try {
      const locationData = await PincodeLookup.getLocationByPincodeWithCache(pincode);
      
      if (!locationData) {
        return res.status(404).json({
          success: false,
          error: 'Pincode not found or no data available for this pincode.',
        });
      }
      
      res.json({
        success: true,
        data: locationData,
        message: 'Pincode data fetched successfully.',
      });
    } catch (error) {
      console.error('Pincode lookup error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch pincode data. Please try again later.',
      });
    }
  });
  
  validate = asyncHandler(async (req: Request, res: Response) => {
    const { pincode } = req.body;
    
    if (!pincode) {
      return res.status(400).json({
        success: false,
        error: 'Pincode is required',
      });
    }
    
    const isValid = PincodeLookup.validatePincode(pincode);
    
    res.json({
      success: true,
      data: {
        pincode,
        isValid,
      },
    });
  });
}

export const pincodeController = new PincodeController();
