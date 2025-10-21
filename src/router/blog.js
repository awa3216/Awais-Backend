import express from 'express';
import blogController from '../controllers/blogController.js';
import upload from '../middleware/upload.middleware.js';
import { verifyToken } from '../middleware/Auth.middleware.js';
import { yachtRateLimiter } from '../middleware/rateLimiter.js';
import { cacheBlogList, cacheBlogById, clearBlogCache } from '../utils/cache.js';

const router = express.Router();

// Rate limiting for all blog routes
router.use(yachtRateLimiter);

// Add blog with image upload
router.post('/add-blog', 
  verifyToken,
  upload.fields([
    { name: 'image', maxCount: 1 }
  ]),
  blogController.addBlog
);

// Cached route for getting all blogs
router.get('/all-blogs', cacheBlogList, blogController.getAllBlogs);

// Cached route for getting individual blog
router.get('/blogByID', cacheBlogById, blogController.getBlogById);

// Get blog by slug


// Edit blog with optional image upload
router.put('/edit-blog', 
  verifyToken,
  upload.fields([
    { name: 'image', maxCount: 1 }
  ]),
  blogController.editBlog
);

// Delete blog
router.delete('/delete-blog', verifyToken, blogController.deleteBlog);

// Update blog status (publish/unpublish)
router.patch('/update-status', verifyToken, blogController.updateBlogStatus);

export default router;