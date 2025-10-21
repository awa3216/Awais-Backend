import Tag from '../models/tags.js';
import SuccessHandler from '../utils/SuccessHandler.js';
import ApiError from '../utils/ApiError.js';
import paginate from '../utils/paginate.js';

// Add a new tag
export const addTag = async (req, res, next) => {
  try {
    const tagData = req.body;

    // Expect lowercase fields from API and map to model fields
    const { name, slug, description } = tagData;

    // Ensure slug uniqueness
    const existing = await Tag.findOne({ Slug: slug }).lean().exec();
    if (existing) {
      return next(new ApiError('Tag with this slug already exists', 409));
    }

    const created = await Tag.create({
      Name: name,
      Slug: slug,
      Description: description,
    });

    return SuccessHandler(created, 201, 'Tag created successfully', res);
  } catch (err) {
    next(new ApiError(err.message || 'Failed to create tag', 400));
  }
};

// Get all tags (paginated)
export const getAllTags = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const { skip, limit: parsedLimit } = paginate(page, limit);

    const [tags, total] = await Promise.all([
      Tag.find({})
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parsedLimit)
        .lean()
        .exec(),
      Tag.countDocuments({}).exec(),
    ]);

    const response = {
      tags,
      page: Number(page),
      limit: parsedLimit,
      total,
      totalPages: Math.ceil(total / parsedLimit),
    };

    return SuccessHandler(response, 200, 'Tags fetched successfully', res);
  } catch (err) {
    next(new ApiError(err.message || 'Failed to fetch tags', 400));
  }
};

// Get tag by ID
export const getTagById = async (req, res, next) => {
  try {
    const { id } = req.query;
    const tag = await Tag.findById(id).lean().exec();
    if (!tag) {
      return next(new ApiError('Tag not found', 404));
    }
    return SuccessHandler(tag, 200, 'Tag fetched successfully', res);
  } catch (err) {
    next(new ApiError(err.message || 'Failed to fetch tag', 400));
  }
};

// Edit tag
export const editTag = async (req, res, next) => {
  try {
    const { id } = req.query;
    const { name, slug, description } = req.body;

    const existingTag = await Tag.findById(id);
    if (!existingTag) {
      return next(new ApiError('Tag not found', 404));
    }

    // Check slug uniqueness if changed
    if (slug && slug !== existingTag.Slug) {
      const slugExists = await Tag.findOne({ Slug: slug, _id: { $ne: id } }).lean().exec();
      if (slugExists) {
        return next(new ApiError('Tag with this slug already exists', 409));
      }
    }

    const update = {};
    if (name !== undefined) update.Name = name;
    if (slug !== undefined) update.Slug = slug;
    if (description !== undefined) update.Description = description;

    const updated = await Tag.findByIdAndUpdate(
      id,
      update,
      { new: true, runValidators: true }
    );

    return SuccessHandler(updated, 200, 'Tag updated successfully', res);
  } catch (err) {
    next(new ApiError(err.message || 'Failed to update tag', 400));
  }
};

// Delete tag
export const deleteTag = async (req, res, next) => {
  try {
    const { id } = req.query;
    const deleted = await Tag.findByIdAndDelete(id);
    if (!deleted) {
      return next(new ApiError('Tag not found', 404));
    }
    return SuccessHandler(null, 200, 'Tag deleted successfully', res);
  } catch (err) {
    next(new ApiError(err.message || 'Failed to delete tag', 400));
  }
};

export default {
  addTag,
  getAllTags,
  getTagById,
  editTag,
  deleteTag,
};


