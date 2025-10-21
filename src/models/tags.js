import mongoose from 'mongoose';

const tagsSchema = new mongoose.Schema({
  Name: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
    },
  Slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true, 
    trim: true,
    index: true, // This creates the index automatically
  },  
  Description: {
    type: String,
    trim: true,
  },
  
}, {
  timestamps: true // Replacing createdAt and updatedAt
});

export default mongoose.model('Tag', tagsSchema);