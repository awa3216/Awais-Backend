import { v2 as cloudinary } from 'cloudinary';

// Parse Cloudinary URL if provided
let cloudName = process.env.CLOUDINARY_CLOUD_NAME;
let apiKey = process.env.CLOUDINARY_API_KEY;
let apiSecret = process.env.CLOUDINARY_API_SECRET;

// If CLOUDINARY_API_KEY contains a full URL, extract the components
if (process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_KEY.includes('cloudinary://')) {
  const url = process.env.CLOUDINARY_API_KEY;
  const match = url.match(/cloudinary:\/\/(\d+):([^@]+)@(.+)/);
  if (match) {
    apiKey = match[1];
    apiSecret = match[2];
    cloudName = match[3];
  }
}

cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
  timeout: 60000, // 60 seconds timeout
});

export default cloudinary;
