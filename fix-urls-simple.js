import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

const PROD_CLOUD_NAME = 'da3vjzkwn';
const DEV_CLOUD_NAME = 'ddwu6sl5x';
const DEV_BASE_FOLDER = 'Faraway-dev';

const DEV_MONGO_URI = 'mongodb+srv://info_db_user:d4jCpYr1NlbtvbS9@cluster0.umwzewn.mongodb.net/?appName=Cluster0';

function extractFilenameFromUrl(url) {
  if (!url || typeof url !== 'string') return null;
  try {
    const parts = url.split('/');
    const filename = parts[parts.length - 1].split('?')[0];
    return filename;
  } catch (error) {
    return null;
  }
}

function extractVersionFromUrl(url) {
  if (!url || typeof url !== 'string') return '';
  const versionMatch = url.match(/\/v(\d+)\//);
  return versionMatch ? versionMatch[1] : '';
}

function fixUrl(url) {
  if (!url || typeof url !== 'string') return url;
  
  if (url.includes(DEV_CLOUD_NAME)) {
    if (url.includes('/yachts/primaryImage/') || url.includes('/yachts/galleryImages/')) {
      const filename = extractFilenameFromUrl(url);
      const version = extractVersionFromUrl(url);
      if (filename) {
        const versionPart = version ? `/v${version}` : '';
        return `https://res.cloudinary.com/${DEV_CLOUD_NAME}/image/upload${versionPart}/${DEV_BASE_FOLDER}/yachts/images/${filename}`;
      }
    }
    if (url.includes('/yachts/images/')) {
      return url;
    }
  }
  
  if (url.includes(PROD_CLOUD_NAME) && url.includes('cloudinary.com')) {
    const filename = extractFilenameFromUrl(url);
    const version = extractVersionFromUrl(url);
    if (filename) {
      const versionPart = version ? `/v${version}` : '';
      return `https://res.cloudinary.com/${DEV_CLOUD_NAME}/image/upload${versionPart}/${DEV_BASE_FOLDER}/yachts/images/${filename}`;
    }
  }
  
  return url;
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
      const newUrl = fixUrl(yacht.primaryImage);
      if (newUrl !== yacht.primaryImage && newUrl.includes(DEV_CLOUD_NAME) && newUrl.includes('/yachts/images/')) {
        yacht.primaryImage = newUrl;
        needsUpdate = true;
      }
    }

    if (yacht.galleryImages && Array.isArray(yacht.galleryImages)) {
      const newGalleryImages = [];
      let galleryUpdated = false;
      
      for (const img of yacht.galleryImages) {
        if (img) {
          const newUrl = fixUrl(img);
          if (newUrl !== img && newUrl.includes(DEV_CLOUD_NAME) && newUrl.includes('/yachts/images/')) {
            newGalleryImages.push(newUrl);
            galleryUpdated = true;
          } else {
            newGalleryImages.push(img);
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
      console.log(`✅ Updated yacht: ${yacht.title || yacht._id}`);
    } else {
      skipped++;
    }
  }

  console.log(`\n✅ Yachts URLs fixed: ${updated} updated, ${skipped} skipped out of ${yachts.length} total\n`);
}

async function fixBlogUrls() {
  const BlogSchema = new mongoose.Schema({}, { strict: false, collection: 'blogs' });
  const Blog = mongoose.models.Blog || mongoose.model('Blog', BlogSchema);
  
  const blogs = await Blog.find({});
  console.log(`\n📝 Found ${blogs.length} blogs to fix\n`);

  let updated = 0;

  for (const blog of blogs) {
    if (blog.image) {
      const filename = extractFilenameFromUrl(blog.image);
      const version = extractVersionFromUrl(blog.image);
      
      if (blog.image.includes(PROD_CLOUD_NAME) || 
          (blog.image.includes(DEV_CLOUD_NAME) && !blog.image.includes('/blogs/images/'))) {
        if (filename) {
          const versionPart = version ? `/v${version}` : '';
          const newUrl = `https://res.cloudinary.com/${DEV_CLOUD_NAME}/image/upload${versionPart}/${DEV_BASE_FOLDER}/blogs/images/${filename}`;
          if (newUrl !== blog.image) {
            blog.image = newUrl;
            await blog.save();
            updated++;
            console.log(`✅ Updated blog: ${blog.title || blog._id}`);
          }
        }
      }
    }
  }

  console.log(`\n✅ Blogs URLs fixed: ${updated}/${blogs.length} updated\n`);
}

async function main() {
  console.log('🔧 Starting Simple URL Fix Script\n');
  console.log('📋 Configuration:');
  console.log(`   - Dev Cloudinary: ${DEV_CLOUD_NAME}`);
  console.log(`   - Dev Folder: ${DEV_BASE_FOLDER}/yachts/images`);
  console.log(`   - Converting from: ${PROD_CLOUD_NAME} → ${DEV_CLOUD_NAME}`);
  console.log(`   - Fixing folder structure: primaryImage/galleryImages → images\n`);
  console.log(`🔒 SAFETY: Only modifies DEV MongoDB. Production is untouched.\n`);

  try {
    console.log('🔌 Connecting to Dev MongoDB...');
    await mongoose.connect(DEV_MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log('✅ Connected to Dev MongoDB\n');

    await fixYachtUrls();
    await fixBlogUrls();

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

