import { v2 as cloudinary } from 'cloudinary';
import crypto from 'crypto';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

class UploadService {
  async getSignedUploadParams(folder: string = 'sparesx') {
    const timestamp = Math.round(new Date().getTime() / 1000);
    const publicId = `sparesx_${crypto.randomBytes(16).toString('hex')}`;

    const signature = cloudinary.utils.api_sign_request(
      {
        timestamp,
        folder,
        public_id: publicId,
        transformation: 'q_auto,f_auto',
      },
      process.env.CLOUDINARY_API_SECRET!
    );

    return {
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY,
      timestamp,
      signature,
      folder,
      publicId,
    };
  }

  async deleteImage(publicId: string) {
    try {
      const result = await cloudinary.uploader.destroy(publicId);
      return result;
    } catch (error) {
      console.error('Error deleting image:', error);
      throw error;
    }
  }

  async uploadImage(file: Buffer, folder: string = 'sparesx') {
    try {
      const result = await cloudinary.uploader.upload(
        `data:image/jpeg;base64,${file.toString('base64')}`,
        {
          folder,
          transformation: 'q_auto,f_auto',
        }
      );
      return result;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  }
}

export const uploadService = new UploadService();





