import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface NavigationConfigData {
  showInNav: boolean;
  maxVisibleCategories: number;
  showSubcategories: boolean;
  showMoreButton: boolean;
  customOrder: string[];
}

export class NavigationService {
  async getNavigationConfig(): Promise<NavigationConfigData | null> {
    try {
      const config = await prisma.navigationConfig.findFirst({
        orderBy: { createdAt: 'desc' }
      });

      if (!config) {
        // Return default configuration if none exists
        return {
          showInNav: true,
          maxVisibleCategories: 6,
          showSubcategories: true,
          showMoreButton: true,
          customOrder: []
        };
      }

      return {
        showInNav: config.showInNav,
        maxVisibleCategories: config.maxVisibleCategories,
        showSubcategories: config.showSubcategories,
        showMoreButton: config.showMoreButton,
        customOrder: config.customOrder
      };
    } catch (error) {
      console.error('Error getting navigation config:', error);
      throw error;
    }
  }

  async updateNavigationConfig(configData: NavigationConfigData): Promise<NavigationConfigData> {
    try {
      // Get existing config
      const existingConfig = await prisma.navigationConfig.findFirst({
        orderBy: { createdAt: 'desc' }
      });

      let config;
      if (existingConfig) {
        // Update existing config
        config = await prisma.navigationConfig.update({
          where: { id: existingConfig.id },
          data: {
            showInNav: configData.showInNav,
            maxVisibleCategories: configData.maxVisibleCategories,
            showSubcategories: configData.showSubcategories,
            showMoreButton: configData.showMoreButton,
            customOrder: configData.customOrder,
            updatedAt: new Date()
          }
        });
      } else {
        // Create new config
        config = await prisma.navigationConfig.create({
          data: {
            showInNav: configData.showInNav,
            maxVisibleCategories: configData.maxVisibleCategories,
            showSubcategories: configData.showSubcategories,
            showMoreButton: configData.showMoreButton,
            customOrder: configData.customOrder
          }
        });
      }

      return {
        showInNav: config.showInNav,
        maxVisibleCategories: config.maxVisibleCategories,
        showSubcategories: config.showSubcategories,
        showMoreButton: config.showMoreButton,
        customOrder: config.customOrder
      };
    } catch (error) {
      console.error('Error updating navigation config:', error);
      throw error;
    }
  }

  async resetNavigationConfig(): Promise<NavigationConfigData> {
    try {
      // Delete all existing configs
      await prisma.navigationConfig.deleteMany({});

      // Create default config
      const config = await prisma.navigationConfig.create({
        data: {
          showInNav: true,
          maxVisibleCategories: 6,
          showSubcategories: true,
          showMoreButton: true,
          customOrder: []
        }
      });

      return {
        showInNav: config.showInNav,
        maxVisibleCategories: config.maxVisibleCategories,
        showSubcategories: config.showSubcategories,
        showMoreButton: config.showMoreButton,
        customOrder: config.customOrder
      };
    } catch (error) {
      console.error('Error resetting navigation config:', error);
      throw error;
    }
  }
}

export const navigationService = new NavigationService();
