import mongoose from 'mongoose';

const blogSchema = new mongoose.Schema({
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true, // This creates the index automatically
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  image: {
    type: String,
    required: true,
  },
  shortDescription: {
    type: String,
    required: true,
    trim: true,
  },
  detailDescription: {
    type: String,
    required: true,
    trim: true,
  },
  status: {
    type: String,
    enum: ['draft', 'published'],
    default: 'draft',
  },
}, {
  timestamps: true // Replacing createdAt and updatedAt
});

// Add indexes for better query performance
blogSchema.index({ status: 1, createdAt: -1 }); // For getAllBlogs with status filter
blogSchema.index({ title: 1 }); // For title-based searches

export default mongoose.model('Blog', blogSchema);