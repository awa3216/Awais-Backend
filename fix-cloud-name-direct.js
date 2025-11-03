import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

const DEV_MONGO_URI = 'mongodb+srv://info_db_user:d4jCpYr1NlbtvbS9@cluster0.umwzewn.mongodb.net/test?appName=Cluster0';

async function fixCloudName() {
  await mongoose.connect(DEV_MONGO_URI);
  const db = mongoose.connection.db;
  const collection = db.collection('yachts');
  
  console.log('🔧 Replacing ddwu6s15x → ddwu6sl5x in all URLs...\n');
  
  let fixed = 0;
  const yachts = await collection.find({}).toArray();
  
  for (const yacht of yachts) {
    let needsUpdate = false;
    const updates = {};
    
    if (yacht.primaryImage && typeof yacht.primaryImage === 'string') {
      const newUrl = yacht.primaryImage.replace(/ddwu6s15x/g, 'ddwu6sl5x');
      if (newUrl !== yacht.primaryImage) {
        updates.primaryImage = newUrl;
        needsUpdate = true;
      }
    }
    
    if (yacht.galleryImages && Array.isArray(yacht.galleryImages)) {
      const newGallery = yacht.galleryImages.map(img => {
        if (img && typeof img === 'string') {
          return img.replace(/ddwu6s15x/g, 'ddwu6sl5x');
        }
        return img;
      });
      
      if (JSON.stringify(newGallery) !== JSON.stringify(yacht.galleryImages)) {
        updates.galleryImages = newGallery;
        needsUpdate = true;
      }
    }
    
    if (needsUpdate) {
      await collection.updateOne({ _id: yacht._id }, { $set: updates });
      fixed++;
      if (fixed % 10 === 0) {
        console.log(`   Fixed ${fixed} yachts...`);
      }
    }
  }
  
  console.log(`\n✅ Fixed ${fixed} yachts`);
  
  await mongoose.connection.close();
  process.exit(0);
}

fixCloudName();

