import { Request, Response } from 'express';
import { uploadService } from '../services/uploads';
import { asyncHandler } from '../middleware/error-handler';
import { AuthRequest } from '../middleware/auth';

class UploadController {
  getSignedUploadParams = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { folder = 'sparesx' } = req.body;
    
    const params = await uploadService.getSignedUploadParams(folder);

    res.json({
      success: true,
      data: params,
    });
  });
}

export const uploadController = new UploadController();





