import express from 'express';
import tagsController from '../controllers/tagsController.js';
import { verifyToken } from '../middleware/Auth.middleware.js';

const router = express.Router();

// Create tag
router.post('/add-tag', verifyToken, tagsController.addTag);

// Get all tags
router.get('/all-tags', tagsController.getAllTags);

// Get tag by ID
router.get('/tagByID', tagsController.getTagById);

// Edit tag
router.put('/edit-tag', verifyToken, tagsController.editTag);

// Delete tag
router.delete('/delete-tag', verifyToken, tagsController.deleteTag);

export default router;


