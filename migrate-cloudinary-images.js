import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { v2 as cloudinary } from 'cloudinary';
import axios from 'axios';
import fs from 'fs';
import fsPromises from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROD_CLOUDINARY = {
  cloud_name: 'da3vjzkwn',
  api_key: '731389876179141',
  api_secret: 'ZJXDT_8kwjsJt-tX0Fv0IgC9O3A',
};

const DEV_CLOUDINARY = {
  cloud_name: 'ddwu6sl5x',
  api_key: '572974367662749',
  api_secret: '_eGFypbZ3MOj9YJDPH0aFq9wigQ',
};

const DEV_MONGO_URI = 'mongodb+srv://info_db_user:d4jCpYr1NlbtvbS9@cluster0.umwzewn.mongodb.net/?appName=Cluster0';

const DEV_BASE_FOLDER = 'Faraway-dev';
const PROD_BASE_FOLDER = 'Faraway-Prod';

cloudinary.config({
  cloud_name: DEV_CLOUDINARY.cloud_name,
  api_key: DEV_CLOUDINARY.api_key,
  api_secret: DEV_CLOUDINARY.api_secret,
});

if (cloudinary.config().cloud_name !== DEV_CLOUDINARY.cloud_name) {
  console.error('❌ ERROR: Script configured for DEV Cloudinary only!');
  console.error('   Production Cloudinary is NEVER modified.');
  process.exit(1);
}

function extractPublicIdFromUrl(url) {
  if (!url || typeof url !== 'string') return null;
  
  try {
    if (url.includes('cloudinary.com')) {
      const parts = url.split('/');
      const uploadIndex = parts.findIndex(part => part === 'upload');
      if (uploadIndex !== -1 && parts[uploadIndex + 1]) {
        const versionAndPublicId = parts.slice(uploadIndex + 2).join('/');
        const publicId = versionAndPublicId.split('.')[0];
        return publicId.replace(/^v\d+\//, '');
      }
    }
    
    if (url.includes('res.cloudinary.com')) {
      const match = url.match(/\/v\d+\/(.+?)(?:\.[^.]+)?$/);
      if (match) {
        return match[1];
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error extracting public ID:', error);
    return null;
  }
}

async function downloadImageFromUrl(imageUrl) {
  try {
    const response = await axios({
      url: imageUrl,
      method: 'GET',
      responseType: 'stream',
      timeout: 30000,
    });

    const tempFilePath = path.join(__dirname, 'temp_image_' + Date.now() + '.tmp');
    const writer = fs.createWriteStream(tempFilePath);
    
    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on('finish', () => resolve(tempFilePath));
      writer.on('error', reject);
    });
  } catch (error) {
    throw new Error(`Failed to download image: ${error.message}`);
  }
}

async function uploadToDevCloudinary(imagePath, folderPath) {
  const fullFolderPath = folderPath ? `${DEV_BASE_FOLDER}/${folderPath}` : DEV_BASE_FOLDER;

  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload(
      imagePath,
      {
        folder: fullFolderPath,
        resource_type: 'auto',
        timeout: 60000,
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          if (result.secure_url && result.secure_url.includes(DEV_CLOUDINARY.cloud_name)) {
            resolve(result.secure_url);
          } else {
            reject(new Error('Uploaded to wrong Cloudinary account'));
          }
        }
      }
    );
  });
}

async function migrateImage(imageUrl, folderPath) {
  if (!imageUrl || typeof imageUrl !== 'string') {
    return null;
  }

  if (imageUrl.includes(DEV_CLOUDINARY.cloud_name)) {
    console.log('  ⏭️  Already migrated (dev URL)');
    return imageUrl;
  }

  if (!imageUrl.includes('cloudinary.com')) {
    console.log('  ⚠️  Not a Cloudinary URL, skipping');
    return imageUrl;
  }

  let tempFilePath = null;
  try {
    console.log(`  📥 Downloading from prod Cloudinary...`);
    tempFilePath = await downloadImageFromUrl(imageUrl);

    console.log(`  📤 Uploading to dev Cloudinary...`);
    const newUrl = await uploadToDevCloudinary(tempFilePath, folderPath);
    console.log(`  ✅ Migrated successfully`);
    
    return newUrl;
  } catch (error) {
    console.error(`  ❌ Migration failed: ${error.message}`);
    return imageUrl;
  } finally {
    if (tempFilePath) {
      try {
        await fsPromises.unlink(tempFilePath);
      } catch (err) {
        console.warn('  ⚠️  Failed to delete temp file');
      }
    }
  }
}

async function migrateYachts() {
  const YachtSchema = new mongoose.Schema({}, { strict: false, collection: 'yachts' });
  const Yacht = mongoose.models.Yacht || mongoose.model('Yacht', YachtSchema);
  
  const yachts = await Yacht.find({});
  console.log(`\n🚤 Found ${yachts.length} yachts to process\n`);

  let processed = 0;
  let updated = 0;

  for (const yacht of yachts) {
    processed++;
    console.log(`\n[${processed}/${yachts.length}] Processing Yacht: ${yacht.title || yacht._id}`);

    let needsUpdate = false;

    if (yacht.primaryImage) {
      console.log('  📷 Migrating primary image...');
      const newUrl = await migrateImage(yacht.primaryImage, 'yachts/images');
      if (newUrl && newUrl !== yacht.primaryImage && newUrl.includes(DEV_CLOUDINARY.cloud_name)) {
        yacht.primaryImage = newUrl;
        needsUpdate = true;
      }
    }

    if (yacht.galleryImages && Array.isArray(yacht.galleryImages) && yacht.galleryImages.length > 0) {
      console.log(`  🖼️  Migrating ${yacht.galleryImages.length} gallery images...`);
      const newGalleryImages = [];
      
      for (let i = 0; i < yacht.galleryImages.length; i++) {
        console.log(`    Image ${i + 1}/${yacht.galleryImages.length}`);
        const newUrl = await migrateImage(yacht.galleryImages[i], 'yachts/images');
        if (newUrl && newUrl.includes(DEV_CLOUDINARY.cloud_name)) {
          newGalleryImages.push(newUrl);
          if (newUrl !== yacht.galleryImages[i]) {
            needsUpdate = true;
          }
        } else {
          newGalleryImages.push(yacht.galleryImages[i]);
        }
      }
      
      yacht.galleryImages = newGalleryImages;
    }

    if (needsUpdate) {
      await yacht.save();
      updated++;
      console.log('  ✅ Yacht record updated in MongoDB');
    } else {
      console.log('  ℹ️  No updates needed');
    }
  }

  console.log(`\n✅ Yachts migration complete: ${updated}/${processed} updated\n`);
}

async function migrateBlogs() {
  const BlogSchema = new mongoose.Schema({}, { strict: false, collection: 'blogs' });
  const Blog = mongoose.models.Blog || mongoose.model('Blog', BlogSchema);
  
  const blogs = await Blog.find({});
  console.log(`\n📝 Found ${blogs.length} blogs to process\n`);

  let processed = 0;
  let updated = 0;

  for (const blog of blogs) {
    processed++;
    console.log(`\n[${processed}/${blogs.length}] Processing Blog: ${blog.title || blog._id}`);

    if (blog.image) {
      console.log('  📷 Migrating blog image...');
      const newUrl = await migrateImage(blog.image, 'blogs/images');
      
      if (newUrl && newUrl !== blog.image && newUrl.includes(DEV_CLOUDINARY.cloud_name)) {
        blog.image = newUrl;
        await blog.save();
        updated++;
        console.log('  ✅ Blog record updated in MongoDB');
      } else {
        console.log('  ℹ️  No update needed');
      }
    } else {
      console.log('  ⚠️  No image found');
    }
  }

  console.log(`\n✅ Blogs migration complete: ${updated}/${processed} updated\n`);
}

async function main() {
  console.log('🚀 Starting Cloudinary Image Migration\n');
  console.log('📋 Configuration:');
  console.log(`   - Prod Cloudinary: ${PROD_CLOUDINARY.cloud_name} (READ ONLY - never modified)`);
  console.log(`   - Dev Cloudinary: ${DEV_CLOUDINARY.cloud_name}`);
  console.log(`   - Dev MongoDB: Connected`);
  console.log(`   - Dev Folder Structure:`);
  console.log(`     • Yachts: ${DEV_BASE_FOLDER}/yachts/images/ (primary + gallery)`);
  console.log(`     • Blogs: ${DEV_BASE_FOLDER}/blogs/images/`);
  console.log(`\n🔒 SAFETY: Production Cloudinary is ONLY read (downloads). Never modified.\n`);

  try {
    console.log('🔌 Connecting to Dev MongoDB...');
    await mongoose.connect(DEV_MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log('✅ Connected to Dev MongoDB\n');

    await migrateYachts();
    await migrateBlogs();

    console.log('\n🎉 Migration completed successfully!');
    console.log('\n⚠️  IMPORTANT:');
    console.log('   - Production Cloudinary was ONLY READ (no changes made)');
    console.log('   - Only Dev MongoDB records were updated');
    console.log('   - Your live website is completely unaffected\n');

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 MongoDB connection closed');
  }
}

main();

