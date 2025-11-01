import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { v2 as cloudinary } from 'cloudinary';

dotenv.config();

const PROD_CLOUD_NAME = 'da3vjzkwn';
const DEV_CLOUD_NAME = 'ddwu6sl5x';
const DEV_BASE_FOLDER = 'Faraway-dev';

const DEV_MONGO_URI = 'mongodb+srv://info_db_user:d4jCpYr1NlbtvbS9@cluster0.umwzewn.mongodb.net/?appName=Cluster0';

cloudinary.config({
  cloud_name: DEV_CLOUD_NAME,
  api_key: '572974367662749',
  api_secret: '_eGFypbZ3MOj9YJDPH0aFq9wigQ',
});

if (cloudinary.config().cloud_name !== DEV_CLOUD_NAME) {
  console.error('❌ ERROR: Script configured for DEV Cloudinary only!');
  process.exit(1);
}

function extractFilenameFromUrl(url) {
  if (!url || typeof url !== 'string') return null;
  
  try {
    const parts = url.split('/');
    const filenameWithExt = parts[parts.length - 1];
    return filenameWithExt.split('?')[0];
  } catch (error) {
    return null;
  }
}

function extractVersionFromUrl(url) {
  if (!url || typeof url !== 'string') return '';
  
  const versionMatch = url.match(/\/v(\d+)\//);
  return versionMatch ? versionMatch[1] : '';
}

async function findImageInDevCloudinary(filename) {
  if (!filename) return null;
  
  const publicIdWithoutExt = filename.replace(/\.[^/.]+$/, '');
  const searchFolder = `${DEV_BASE_FOLDER}/yachts/images`;
  
  try {
    const publicId = `${searchFolder}/${publicIdWithoutExt}`;
    const result = await cloudinary.api.resource(publicId, {
      resource_type: 'image',
    });
    if (result && result.secure_url && result.secure_url.includes(DEV_CLOUD_NAME)) {
      return result.secure_url;
    }
  } catch (error) {
  }
  
  try {
    const results = await cloudinary.api.resources({
      type: 'upload',
      prefix: searchFolder,
      max_results: 500,
    });
    
    if (results.resources && results.resources.length > 0) {
      const matchingResource = results.resources.find(resource => {
        const resourcePublicId = resource.public_id || '';
        const resourceFilename = resource.filename || resourcePublicId.split('/').pop();
        const resourceNameWithoutExt = resourceFilename ? resourceFilename.replace(/\.[^/.]+$/, '') : '';
        
        return resourceFilename === filename || 
               resourceFilename === publicIdWithoutExt ||
               resourceNameWithoutExt === publicIdWithoutExt ||
               resourcePublicId.includes(publicIdWithoutExt) ||
               resourcePublicId.endsWith(`/${publicIdWithoutExt}`);
      });
      
      if (matchingResource && matchingResource.secure_url && matchingResource.secure_url.includes(DEV_CLOUD_NAME)) {
        return matchingResource.secure_url;
      }
    }
  } catch (apiError) {
    console.log(`    ⚠️  API error: ${apiError.message}`);
  }
  
  return null;
}

async function convertUrlToDev(url) {
  if (!url || typeof url !== 'string') return url;
  
  if (url.includes(DEV_CLOUD_NAME)) {
    if (url.includes('/yachts/primaryImage/') || url.includes('/yachts/galleryImages/')) {
      const filename = extractFilenameFromUrl(url);
      if (filename) {
        const version = extractVersionFromUrl(url);
        const versionPart = version ? `/v${version}` : '';
        return `https://res.cloudinary.com/${DEV_CLOUD_NAME}/image/upload${versionPart}/${DEV_BASE_FOLDER}/yachts/images/${filename}`;
      }
    }
    return url;
  }
  
  if (!url.includes(PROD_CLOUD_NAME) || !url.includes('cloudinary.com')) {
    return url;
  }
  
  const filename = extractFilenameFromUrl(url);
  if (!filename) {
    console.log(`    ⚠️  Could not extract filename from: ${url}`);
    return url;
  }
  
  console.log(`    🔍 Searching for filename: ${filename}`);
  const devUrl = await findImageInDevCloudinary(filename);
  if (devUrl && devUrl.includes(DEV_CLOUD_NAME) && devUrl.includes('/yachts/images/')) {
    console.log(`    ✅ Found in dev Cloudinary`);
    return devUrl;
  }
  
  console.log(`    🔧 Constructing URL with correct folder structure`);
  const version = extractVersionFromUrl(url);
  const versionPart = version ? `/v${version}` : '';
  const constructedUrl = `https://res.cloudinary.com/${DEV_CLOUD_NAME}/image/upload${versionPart}/${DEV_BASE_FOLDER}/yachts/images/${filename}`;
  return constructedUrl;
}

async function fixYachtUrls() {
  const YachtSchema = new mongoose.Schema({}, { strict: false, collection: 'yachts' });
  const Yacht = mongoose.models.Yacht || mongoose.model('Yacht', YachtSchema);
  
  const yachts = await Yacht.find({});
  console.log(`\n🚤 Found ${yachts.length} yachts to fix\n`);

  let updated = 0;
  let skipped = 0;

  for (const yacht of yachts) {
    let needsUpdate = false;

    if (yacht.primaryImage) {
      const needsFix = yacht.primaryImage.includes(PROD_CLOUD_NAME) || 
                       (yacht.primaryImage.includes(DEV_CLOUD_NAME) && 
                        (yacht.primaryImage.includes('/yachts/primaryImage/') || 
                         yacht.primaryImage.includes('/yachts/galleryImages/')));
      
      if (needsFix) {
        console.log(`  📷 Fixing primary image for: ${yacht.title || yacht._id}`);
        const newUrl = await convertUrlToDev(yacht.primaryImage);
        if (newUrl !== yacht.primaryImage && newUrl.includes(DEV_CLOUD_NAME) && newUrl.includes('/yachts/images/')) {
          yacht.primaryImage = newUrl;
          needsUpdate = true;
          console.log(`    ✅ Updated`);
        } else {
          console.log(`    ⚠️  Could not fix URL`);
        }
      }
    }

    if (yacht.galleryImages && Array.isArray(yacht.galleryImages)) {
      const newGalleryImages = [];
      let galleryUpdated = false;
      
      for (let i = 0; i < yacht.galleryImages.length; i++) {
        const img = yacht.galleryImages[i];
        const needsFix = img && (img.includes(PROD_CLOUD_NAME) || 
                                 (img.includes(DEV_CLOUD_NAME) && 
                                  (img.includes('/yachts/primaryImage/') || 
                                   img.includes('/yachts/galleryImages/'))));
        
        if (needsFix) {
          console.log(`  🖼️  Fixing gallery image ${i + 1}/${yacht.galleryImages.length}`);
          const newUrl = await convertUrlToDev(img);
          if (newUrl !== img && newUrl.includes(DEV_CLOUD_NAME) && newUrl.includes('/yachts/images/')) {
            newGalleryImages.push(newUrl);
            galleryUpdated = true;
            console.log(`    ✅ Updated`);
          } else {
            newGalleryImages.push(img);
            console.log(`    ⚠️  Could not fix URL`);
          }
        } else {
          newGalleryImages.push(img);
        }
      }
      
      if (galleryUpdated) {
        yacht.galleryImages = newGalleryImages;
        needsUpdate = true;
      }
    }

    if (needsUpdate) {
      await yacht.save();
      updated++;
      console.log(`✅ Updated yacht: ${yacht.title || yacht._id}\n`);
    } else {
      skipped++;
      console.log(`⏭️  Skipped yacht: ${yacht.title || yacht._id} (already using dev)\n`);
    }
  }

  console.log(`\n✅ Yachts URLs fixed: ${updated} updated, ${skipped} skipped out of ${yachts.length} total\n`);
}

async function main() {
  console.log('🔧 Starting Yacht URL Fix Script\n');
  console.log('📋 Configuration:');
  console.log(`   - Dev Cloudinary: ${DEV_CLOUD_NAME}`);
  console.log(`   - Dev Folder: ${DEV_BASE_FOLDER}/yachts/images`);
  console.log(`   - Converting from: ${PROD_CLOUD_NAME} → ${DEV_CLOUD_NAME}`);
  console.log(`\n🔒 SAFETY: This script ONLY modifies DEV MongoDB and searches DEV Cloudinary.`);
  console.log(`   Production Cloudinary is NEVER touched.\n`);

  try {
    console.log('🔌 Connecting to Dev MongoDB...');
    await mongoose.connect(DEV_MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log('✅ Connected to Dev MongoDB\n');

    await fixYachtUrls();

    console.log('\n🎉 URL fix completed successfully!\n');

  } catch (error) {
    console.error('\n❌ Fix failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 MongoDB connection closed');
  }
}

main();

