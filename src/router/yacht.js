import express from 'express';
import yachtController from '../controllers/yachtController.js';
import upload from '../middleware/upload.middleware.js';
import { verifyToken } from '../middleware/Auth.middleware.js';
import { deleteYacht, editYacht, updateYachtStatus } from '../controllers/yachtController.js';
import { cacheYachtList, cacheYachtById, clearYachtCache } from '../utils/cache.js';

const router = express.Router();

// Rate limiting is now handled globally by security middleware
// router.use(yachtRateLimiter); // Removed duplicate

router.post('/add-yacht', verifyToken,
    upload.fields([
    { name: 'primaryImage', maxCount: 1 },
    { name: 'galleryImages', maxCount: 15 },
    { name: 'galleryImages[]', maxCount: 15 }
  ])
  , yachtController.addYacht);

// Cached route for getting all yachts
router.get('/all-yachts', cacheYachtList, yachtController.getAllYachts);

// Cached route for getting individual yacht
router.get('/', cacheYachtById, yachtController.getYachtById);

router.put('/edit-yacht', verifyToken, 
    upload.fields([
    { name: 'primaryImage', maxCount: 1 },
    { name: 'galleryImages', maxCount: 15 },
    { name: 'galleryImages[]', maxCount: 15 }
  ])
  , editYacht);

router.delete('/delete-yacht', verifyToken, deleteYacht);

router.patch('/update-status', verifyToken, updateYachtStatus);

export default router;
