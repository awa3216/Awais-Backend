import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

const PROD_CLOUD_NAME = 'da3vjzkwn';
const DEV_CLOUD_NAME = 'ddwu6sl5x';
const DEV_BASE_FOLDER = 'Faraway-dev';

const DEV_MONGO_URI = 'mongodb+srv://info_db_user:d4jCpYr1NlbtvbS9@cluster0.umwzewn.mongodb.net/test?appName=Cluster0';

function extractFilename(url) {
  if (!url || typeof url !== 'string') return null;
  const parts = url.split('/');
  return parts[parts.length - 1].split('?')[0];
}

function extractVersion(url) {
  if (!url || typeof url !== 'string') return '';
  const match = url.match(/\/v(\d+)\//);
  return match ? match[1] : '';
}

function convertToDevUrl(url) {
  if (!url || typeof url !== 'string') return url;
  
  if (url.includes(DEV_CLOUD_NAME) && url.includes('/yachts/images/')) {
    return url;
  }
  
  if (url.includes(DEV_CLOUD_NAME) && (url.includes('/yachts/primaryImage/') || url.includes('/yachts/galleryImages/'))) {
    const filename = extractFilename(url);
    const version = extractVersion(url);
    if (filename) {
      const versionPart = version ? `/v${version}` : '';
      return `https://res.cloudinary.com/${DEV_CLOUD_NAME}/image/upload${versionPart}/${DEV_BASE_FOLDER}/yachts/images/${filename}`;
    }
  }
  
  if (url.includes(PROD_CLOUD_NAME)) {
    const filename = extractFilename(url);
    const version = extractVersion(url);
    if (filename) {
      const versionPart = version ? `/v${version}` : '';
      return `https://res.cloudinary.com/${DEV_CLOUD_NAME}/image/upload${versionPart}/${DEV_BASE_FOLDER}/yachts/images/${filename}`;
    }
  }
  
  return url;
}

async function updateYachts() {
  const db = mongoose.connection.db;
  const collection = db.collection('yachts');
  
  const yachts = await collection.find({}).toArray();
  console.log(`\n🚤 Found ${yachts.length} yachts in 'test' database\n`);
  
  let updated = 0;
  
  for (const yacht of yachts) {
    const updates = {};
    let needsUpdate = false;
    
    if (yacht.primaryImage) {
      const newUrl = convertToDevUrl(yacht.primaryImage);
      if (newUrl !== yacht.primaryImage && newUrl.includes(DEV_CLOUD_NAME)) {
        updates.primaryImage = newUrl;
        needsUpdate = true;
      }
    }
    
    if (yacht.galleryImages && Array.isArray(yacht.galleryImages)) {
      const newGallery = yacht.galleryImages.map(img => {
        if (!img) return img;
        const newUrl = convertToDevUrl(img);
        if (newUrl !== img && newUrl.includes(DEV_CLOUD_NAME)) {
          needsUpdate = true;
          return newUrl;
        }
        return img;
      });
      
      if (needsUpdate || JSON.stringify(newGallery) !== JSON.stringify(yacht.galleryImages)) {
        updates.galleryImages = newGallery;
      }
    }
    
    if (Object.keys(updates).length > 0) {
      await collection.updateOne(
        { _id: yacht._id },
        { $set: updates }
      );
      updated++;
      console.log(`✅ Updated: ${yacht.title || yacht._id}`);
    }
  }
  
  console.log(`\n✅ Updated ${updated}/${yachts.length} yachts\n`);
}

async function updateBlogs() {
  const db = mongoose.connection.db;
  const collection = db.collection('blogs');
  
  const blogs = await collection.find({}).toArray();
  console.log(`\n📝 Found ${blogs.length} blogs in 'test' database\n`);
  
  let updated = 0;
  
  for (const blog of blogs) {
    if (blog.image) {
      const filename = extractFilename(blog.image);
      const version = extractVersion(blog.image);
      
      if (blog.image.includes(PROD_CLOUD_NAME) || 
          (blog.image.includes(DEV_CLOUD_NAME) && !blog.image.includes('/blogs/images/'))) {
        if (filename) {
          const versionPart = version ? `/v${version}` : '';
          const newUrl = `https://res.cloudinary.com/${DEV_CLOUD_NAME}/image/upload${versionPart}/${DEV_BASE_FOLDER}/blogs/images/${filename}`;
          
          await collection.updateOne(
            { _id: blog._id },
            { $set: { image: newUrl } }
          );
          updated++;
          console.log(`✅ Updated: ${blog.title || blog._id}`);
        }
      }
    }
  }
  
  console.log(`\n✅ Updated ${updated}/${blogs.length} blogs\n`);
}

async function main() {
  console.log('🔧 URL Update Script for DEV MongoDB\n');
  console.log('📋 Configuration:');
  console.log(`   - Database: test`);
  console.log(`   - Converting: ${PROD_CLOUD_NAME} → ${DEV_CLOUD_NAME}`);
  console.log(`   - Folder: primaryImage/galleryImages → images`);
  console.log(`\n🔒 SAFETY: Only updates 'test' database. Production is untouched.\n`);
  
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(DEV_MONGO_URI);
    
    const dbName = mongoose.connection.db.databaseName;
    console.log(`✅ Connected to database: ${dbName}\n`);
    
    if (dbName !== 'test') {
      console.error('❌ ERROR: Expected "test" database but connected to:', dbName);
      process.exit(1);
    }
    
    await updateYachts();
    await updateBlogs();
    
    console.log('\n🎉 All URLs updated successfully!\n');
    console.log('💡 Refresh MongoDB Compass to see changes\n');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Connection closed');
  }
}

main();

