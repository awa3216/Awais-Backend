import Joi from 'joi';

// Shared ObjectId validation
const objectIdSchema = Joi.string()
  .length(24)
  .hex()
  .required()
  .messages({
    'any.required': 'Blog ID is required',
    'string.length': 'ID must be a valid MongoDB ObjectId',
    'string.hex': 'ID must be a valid MongoDB ObjectId',
  });

const addBlogSchema = Joi.object({
  slug: Joi.string()
    .required()
    .trim()
    .lowercase()
    .pattern(/^[a-z0-9-]+$/)
    .messages({
      'string.base': 'Slug must be a string',
      'any.required': 'Slug is required',
      'string.pattern.base': 'Slug can only contain lowercase letters, numbers, and hyphens',
    }),
  title: Joi.string()
    .required()
    .trim()
    .min(3)
    .max(200)
    .messages({
      'string.base': 'Title must be a string',
      'any.required': 'Title is required',
      'string.min': 'Title must be at least 3 characters long',
      'string.max': 'Title must not exceed 200 characters',
    }),
  image: Joi.any()
    .required()
    .messages({
      'any.required': 'Blog image is required',
    }),
  shortDescription: Joi.string()
    .required()
    .trim()
    .min(10)
    .max(600)
    .messages({
      'string.base': 'Short description must be a string',
      'any.required': 'Short description is required',
      'string.min': 'Short description must be at least 10 characters long',
      'string.max': 'Short description must not exceed 500 characters',
    }),
  detailDescription: Joi.string()
    .required()
    .trim()
    .min(10)
    .messages({
      'string.base': 'Detail description must be a string',
      'any.required': 'Detail description is required',
      'string.min': 'Detail description must be at least 10 characters long',
    }),
  status: Joi.string()
    .valid('draft', 'published')
    .default('draft')
    .messages({
      'any.only': 'Status must be either draft or published',
    }),
});

const editBlogSchema = Joi.object({
  slug: Joi.string()
    .trim()
    .lowercase()
    .pattern(/^[a-z0-9-]+$/)
    .optional()
    .messages({
      'string.base': 'Slug must be a string',
      'string.pattern.base': 'Slug can only contain lowercase letters, numbers, and hyphens',
    }),
  title: Joi.string()
    .trim()
    .min(3)
    .max(200)
    .optional()
    .messages({
      'string.base': 'Title must be a string',
      'string.min': 'Title must be at least 3 characters long',
      'string.max': 'Title must not exceed 200 characters',
    }),
  image: Joi.string()
    .optional()
    .messages({
      'string.base': 'Image must be a string',
    }),
  shortDescription: Joi.string()
    .trim()
    .min(10)
    .max(600)
    .optional()
    .messages({
      'string.base': 'Short description must be a string',
      'string.min': 'Short description must be at least 10 characters long',
      'string.max': 'Short description must not exceed 600 characters',
    }),
  detailDescription: Joi.string()
    .trim()
    .min(10)
    .optional()
    .messages({
      'string.base': 'Detail description must be a string',
      'string.min': 'Detail description must be at least 10 characters long',
    }),
  status: Joi.string()
    .valid('draft', 'published')
    .optional()
    .messages({
      'any.only': 'Status must be either draft or published',
    }),
});

const getAllBlogsSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  status: Joi.string().valid('draft', 'published').optional().messages({
    'any.only': 'Status must be either draft or published',
  }),
});

const getBlogByIdSchema = Joi.object({
  id: objectIdSchema,
});

const deleteBlogSchema = Joi.object({
  id: objectIdSchema,
});

const updateBlogStatusSchema = Joi.object({
  status: Joi.string()
    .valid('draft', 'published')
    .required()
    .messages({
      'any.required': 'Status is required',
      'any.only': 'Status must be either draft or published',
    }),
});

export {
  addBlogSchema,
  editBlogSchema,
  getAllBlogsSchema,
  getBlogByIdSchema,
  deleteBlogSchema,
  updateBlogStatusSchema,
};
