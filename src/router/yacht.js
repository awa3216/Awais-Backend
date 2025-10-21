import express from 'express';
import yachtController, {
  deleteYacht,
  editYacht,
  updateYachtStatus,
} from '../controllers/yachtController.js';
import { verifyToken } from '../middleware/Auth.middleware.js';
import upload from '../middleware/upload.middleware.js';
import { cacheYachtById, cacheYachtList } from '../utils/cache.js';

const router = express.Router();

// Rate limiting is now handled globally by security middleware
// router.use(yachtRateLimiter); // Removed duplicate

router.post(
  '/add-yacht',
  verifyToken,
  upload.fields([
    { name: 'primaryImage', maxCount: 1 },
    { name: 'galleryImages', maxCount: 15 },
    { name: 'galleryImages[]', maxCount: 15 },
  ]),
  yachtController.addYacht
);

// Cached route for getting all yachts
router.get('/all-yachts', cacheYachtList, yachtController.getAllYachts);

// Cached route for getting individual yacht
router.get('/', cacheYachtById, yachtController.getYachtById);

// Cached route for getting yacht by slug
router.get('/by-slug', cacheYachtById, yachtController.getYachtBySlug);

router.put(
  '/edit-yacht',
  verifyToken,
  upload.fields([
    { name: 'primaryImage', maxCount: 1 },
    { name: 'galleryImages', maxCount: 15 },
    { name: 'galleryImages[]', maxCount: 15 },
  ]),
  editYacht
);

router.delete('/delete-yacht', verifyToken, deleteYacht);

router.patch('/update-status', verifyToken, updateYachtStatus);

export default router;
