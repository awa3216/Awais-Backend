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
  let checked = 0;
  
  for (const yacht of yachts) {
    checked++;
    const updates = {};
    
    if (yacht.primaryImage) {
      const original = yacht.primaryImage;
      const fixed = original.replace(/ddwu6s15x/g, 'ddwu6sl5x');
      if (fixed !== original) {
        updates.primaryImage = fixed;
      }
    }
    
    if (yacht.galleryImages && Array.isArray(yacht.galleryImages)) {
      const newGallery = yacht.galleryImages.map(img => {
        if (img && typeof img === 'string') {
          return img.replace(/ddwu6s15x/g, 'ddwu6sl5x');
        }
        return img;
      });
      const galleryChanged = JSON.stringify(newGallery) !== JSON.stringify(yacht.galleryImages);
      if (galleryChanged) {
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
  
  console.log(`\n📊 Summary:`);
  console.log(`   - Checked: ${checked} yachts`);
  console.log(`   - Fixed: ${fixed} yachts`);
  
  if (fixed === 0 && checked > 0) {
    console.log(`\n🔍 Debugging: Checking first yacht's URL...`);
    const firstYacht = yachts[0];
    if (firstYacht.primaryImage) {
      console.log(`   Primary Image: ${firstYacht.primaryImage}`);
      console.log(`   Contains 'ddwu6s15x': ${firstYacht.primaryImage.includes('ddwu6s15x')}`);
      console.log(`   Contains 'ddwu6sl5x': ${firstYacht.primaryImage.includes('ddwu6sl5x')}`);
    }
  }
  
  await mongoose.connection.close();
  process.exit(0);
}

fixCloudName();

