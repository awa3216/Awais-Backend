import Joi from 'joi';

const objectIdSchema = Joi.string()
  .length(24)
  .hex()
  .required();

export const addTagSchema = Joi.object({
  name: Joi.string().required().trim().min(2).max(50),
  slug: Joi.string()
    .required()
    .trim()
    .lowercase()
    .pattern(/^[a-z0-9-]+$/),
  description: Joi.string().allow('').trim(),
});

export const editTagSchema = Joi.object({
  name: Joi.string().trim().min(2).max(50).optional(),
  slug: Joi.string().trim().lowercase().pattern(/^[a-z0-9-]+$/).optional(),
  description: Joi.string().allow('').trim().optional(),
});

export const getAllTagsSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
});

export const getTagByIdSchema = Joi.object({
  id: objectIdSchema,
});

export const deleteTagSchema = Joi.object({
  id: objectIdSchema,
});


