import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { v2 as cloudinary } from 'cloudinary';
import axios from 'axios';

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

function convertUrlToDev(url) {
  if (!url || typeof url !== 'string') return url;
  
  if (url.includes(DEV_CLOUD_NAME)) {
    return url;
  }
  
  if (url.includes(PROD_CLOUD_NAME) && url.includes('cloudinary.com')) {
    return url.replace(PROD_CLOUD_NAME, DEV_CLOUD_NAME);
  }
  
  return url;
}

async function fixYachtUrls() {
  const YachtSchema = new mongoose.Schema({}, { strict: false, collection: 'yachts' });
  const Yacht = mongoose.models.Yacht || mongoose.model('Yacht', YachtSchema);
  
  const yachts = await Yacht.find({});
  console.log(`\n🚤 Found ${yachts.length} yachts to check\n`);

  let updated = 0;

  for (const yacht of yachts) {
    let needsUpdate = false;

    if (yacht.primaryImage && yacht.primaryImage.includes(PROD_CLOUD_NAME)) {
      const newUrl = convertUrlToDev(yacht.primaryImage);
      if (newUrl !== yacht.primaryImage) {
        yacht.primaryImage = newUrl;
        needsUpdate = true;
      }
    }

    if (yacht.galleryImages && Array.isArray(yacht.galleryImages)) {
      const newGalleryImages = yacht.galleryImages.map(img => {
        if (img && img.includes(PROD_CLOUD_NAME)) {
          needsUpdate = true;
          return convertUrlToDev(img);
        }
        return img;
      });
      
      if (needsUpdate) {
        yacht.galleryImages = newGalleryImages;
      }
    }

    if (needsUpdate) {
      await yacht.save();
      updated++;
      console.log(`✅ Updated yacht: ${yacht.title || yacht._id}`);
    }
  }

  console.log(`\n✅ Yachts URLs fixed: ${updated}/${yachts.length} updated\n`);
}

async function fixBlogUrls() {
  const BlogSchema = new mongoose.Schema({}, { strict: false, collection: 'blogs' });
  const Blog = mongoose.models.Blog || mongoose.model('Blog', BlogSchema);
  
  const blogs = await Blog.find({});
  console.log(`\n📝 Found ${blogs.length} blogs to check\n`);

  let updated = 0;

  for (const blog of blogs) {
    if (blog.image && blog.image.includes(PROD_CLOUD_NAME)) {
      const newUrl = convertUrlToDev(blog.image);
      if (newUrl !== blog.image) {
        blog.image = newUrl;
        await blog.save();
        updated++;
        console.log(`✅ Updated blog: ${blog.title || blog._id}`);
      }
    }
  }

  console.log(`\n✅ Blogs URLs fixed: ${updated}/${blogs.length} updated\n`);
}

async function main() {
  console.log('🔧 Starting URL Fix Script\n');
  console.log('📋 Converting URLs:');
  console.log(`   - From: ${PROD_CLOUD_NAME}`);
  console.log(`   - To: ${DEV_CLOUD_NAME}\n`);

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

