import { Request, Response } from 'express';
import { navigationService } from '../services/navigation';
import { asyncHandler } from '../middleware/error-handler';
import { createError } from '../middleware/error-handler';

export const getNavigationConfig = asyncHandler(async (req: Request, res: Response) => {
  try {
    const config = await navigationService.getNavigationConfig();
    
    res.status(200).json({
      success: true,
      data: config
    });
  } catch (error) {
    console.error('Error getting navigation config:', error);
    throw createError(500, 'Failed to get navigation configuration');
  }
});

export const updateNavigationConfig = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { showInNav, maxVisibleCategories, showSubcategories, showMoreButton, customOrder } = req.body;

    // Validate required fields
    if (typeof showInNav !== 'boolean') {
      throw createError(400, 'showInNav must be a boolean');
    }
    if (typeof maxVisibleCategories !== 'number' || maxVisibleCategories < 1 || maxVisibleCategories > 20) {
      throw createError(400, 'maxVisibleCategories must be a number between 1 and 20');
    }
    if (typeof showSubcategories !== 'boolean') {
      throw createError(400, 'showSubcategories must be a boolean');
    }
    if (typeof showMoreButton !== 'boolean') {
      throw createError(400, 'showMoreButton must be a boolean');
    }
    if (!Array.isArray(customOrder)) {
      throw createError(400, 'customOrder must be an array');
    }

    const configData = {
      showInNav,
      maxVisibleCategories,
      showSubcategories,
      showMoreButton,
      customOrder
    };

    const updatedConfig = await navigationService.updateNavigationConfig(configData);
    
    res.status(200).json({
      success: true,
      data: updatedConfig,
      message: 'Navigation configuration updated successfully'
    });
  } catch (error) {
    console.error('Error updating navigation config:', error);
    if (error.statusCode) {
      throw error;
    }
    throw createError(500, 'Failed to update navigation configuration');
  }
});

export const resetNavigationConfig = asyncHandler(async (req: Request, res: Response) => {
  try {
    const config = await navigationService.resetNavigationConfig();
    
    res.status(200).json({
      success: true,
      data: config,
      message: 'Navigation configuration reset to defaults'
    });
  } catch (error) {
    console.error('Error resetting navigation config:', error);
    throw createError(500, 'Failed to reset navigation configuration');
  }
});
