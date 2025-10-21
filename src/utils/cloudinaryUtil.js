import cloudinary from '../config/cloudinary.js'; // or '../utils/cloudinary.js'
import fs from 'fs/promises';

export async function uploadToCloudinary(filePath, folder, retries = 3) {
  const baseFolder = process.env.CLOUDINARY_BASE_FOLDER;
  const targetFolder = folder ? `${baseFolder}/${folder}` : baseFolder;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`📤 Uploading to Cloudinary (attempt ${attempt}/${retries})`);
      
      const url = await new Promise((resolve, reject) => {
        // Set timeout for the upload
        const timeout = setTimeout(() => {
          reject(new Error('Upload timeout - request took too long'));
        }, 60000); // 60 seconds timeout
        
        cloudinary.uploader.upload(
          filePath,
          { 
            folder: targetFolder,
            timeout: 60000, // 60 seconds timeout
            resource_type: 'auto' // Auto-detect resource type
          },
          (error, result) => {
            clearTimeout(timeout);
            if (error) {
              console.error(`❌ Cloudinary upload error (attempt ${attempt}):`, error);
              reject(error);
            } else {
              console.log(`✅ Cloudinary upload successful (attempt ${attempt})`);
              resolve(result.secure_url);
            }
          }
        );
      });
      
      // Clean up temp file after successful upload
      try {
        await fs.unlink(filePath);
        console.log('🗑️ Temp file cleaned up');
      } catch (unlinkError) {
        console.warn('⚠️ Failed to delete temp file');
      }
      
      return url;
    } catch (error) {
      console.error(`❌ Upload attempt ${attempt} failed:`, error.message);
      
      // Clean up temp file even if upload fails
      try {
        await fs.unlink(filePath);
      } catch (unlinkError) {
        console.warn('⚠️ Failed to delete temp file');
      }
      
      // If this is the last attempt, throw the error
      if (attempt === retries) {
        throw new Error(`Upload failed after ${retries} attempts. Last error: ${error.message}`);
      }
      
      // Wait before retrying (exponential backoff)
      const waitTime = Math.min(1000 * Math.pow(2, attempt - 1), 10000); // Max 10 seconds
      console.log(`⏳ Waiting ${waitTime}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
}

export function deleteFromCloudinary(publicId) {
  return cloudinary.uploader.destroy(publicId);
}