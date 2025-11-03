import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

const DEV_MONGO_URI = 'mongodb+srv://info_db_user:d4jCpYr1NlbtvbS9@cluster0.umwzewn.mongodb.net/test?appName=Cluster0';

async function fixCloudName() {
  await mongoose.connect(DEV_MONGO_URI);
  const db = mongoose.connection.db;
  const collection = db.collection('yachts');
  
  const yachts = await collection.find({}).toArray();
  console.log(`🔍 Found ${yachts.length} yachts\n`);
  
  let fixed = 0;
  
  for (const yacht of yachts) {
    const updates = {};
    let needsUpdate = false;
    
    if (yacht.primaryImage && yacht.primaryImage.includes('ddwu6s15x')) {
      updates.primaryImage = yacht.primaryImage.replace(/ddwu6s15x/g, 'ddwu6sl5x');
      needsUpdate = true;
    }
    
    if (yacht.galleryImages && Array.isArray(yacht.galleryImages)) {
      const newGallery = yacht.galleryImages.map(img => {
        if (img && typeof img === 'string' && img.includes('ddwu6s15x')) {
          needsUpdate = true;
          return img.replace(/ddwu6s15x/g, 'ddwu6sl5x');
        }
        return img;
      });
      if (needsUpdate) {
        updates.galleryImages = newGallery;
      }
    }
    
    if (Object.keys(updates).length > 0) {
      await collection.updateOne({ _id: yacht._id }, { $set: updates });
      fixed++;
      if (fixed % 10 === 0) {
        console.log(`   Fixed ${fixed} yachts...`);
      }
    }
  }
  
  console.log(`\n✅ Fixed cloud name typo in ${fixed} yachts`);
  
  await mongoose.connection.close();
  process.exit(0);
}

fixCloudName();

