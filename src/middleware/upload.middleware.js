import multer from 'multer';
import path from 'path';
import os from 'os';
import fs from 'fs';

const tempRoot = path.join(os.tmpdir(), 'uploads', 'Faraway');
// Temp directory logging removed for security

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // File processing logging removed for security
    let subfolder = '';
    
    // Handle yacht images
    if (file.fieldname === 'primaryImage') {
      subfolder = path.join('yachts', 'primaryImage');
    } else if (file.fieldname === 'galleryImages' || file.fieldname === 'galleryImages[]') {
      subfolder = path.join('yachts', 'galleryImages');
    } 
    // Handle blog images
    else if (file.fieldname === 'image') {
      subfolder = path.join('blogs', 'images');
    } else {
      // Unexpected field logging removed for security
      return cb(new Error('Unexpected upload field: ' + file.fieldname), null);
    }
    
    const dest = path.join(tempRoot, subfolder);
    fs.mkdirSync(dest, { recursive: true }); // Ensure the folder exists
    cb(null, dest);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    // Remove brackets from fieldname for filename
    const cleanFieldName = file.fieldname.replace(/[\[\]]/g, '');
    // Add unique identifier to prevent filename collisions
    const uniqueId = Math.random().toString(36).substring(2, 15);
    const finalName = Date.now() + '-' + cleanFieldName + '-' + uniqueId + ext;
    
    // Filename generation logging removed for security
    cb(null, finalName);
  },
});

const fileFilter = (req, file, cb) => {
  const field = file.fieldname;

  // Accept yacht image fields
  if (field === 'primaryImage' || field === 'galleryImages' || field === 'galleryImages[]') {
    cb(null, true);
  } 
  // Accept blog image field
  else if (field === 'image') {
    cb(null, true);
  } else {
    cb(new Error(`Unexpected upload field: ${field}`), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 12 * 1024 * 1024 }, // 10MB max
});

export default upload;