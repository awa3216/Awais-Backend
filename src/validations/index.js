import {
    adminLoginSchema,
    adminForgotPasswordSchema,
    adminVerifyOtpSchema,
    adminResetPasswordSchema,
    adminResendOtpSchema,
} from './auth.validation.js';
import { addyachtSchema, deleteYachtSchema, editYachtSchema, getAllYachtsSchema, getYachtByIdSchema, updateStatusSchema } from './yacht.validation.js';
import {
    addBlogSchema,
    getAllBlogsSchema,
    getBlogByIdSchema,
    editBlogSchema,
    deleteBlogSchema,
    updateBlogStatusSchema
  } from './blog.validation.js'; 
import { addTagSchema, editTagSchema, getAllTagsSchema, getTagByIdSchema, deleteTagSchema } from './tags.validation.js';

const validationSchemas = {
    // Authentication
    '/auth/admin/login': { POST: adminLoginSchema },
    '/auth/admin/forgot-password': { POST: adminForgotPasswordSchema },
    '/auth/admin/verify-otp': { POST: adminVerifyOtpSchema },
    '/auth/admin/reset-password': { POST: adminResetPasswordSchema },
    '/auth/admin/resend-otp': { POST: adminResendOtpSchema },
    
    // Yacht
    '/yacht/add-yacht': { POST: addyachtSchema },
    '/yacht/all-yachts': { GET: getAllYachtsSchema },
    '/yacht': { GET: getYachtByIdSchema },
    '/yacht/delete-yacht': { DELETE: deleteYachtSchema},
    '/yacht/edit-yacht': { PUT: editYachtSchema},
    '/yacht/update-status': { PATCH: updateStatusSchema},
    
    // Blog
    '/blog/add-blog': { POST: addBlogSchema },
    '/blog/all-blogs': { GET: getAllBlogsSchema },
    '/blog/blogByID': { GET: getBlogByIdSchema },
    '/blog/edit-blog': { PUT: editBlogSchema },
    '/blog/delete-blog': { DELETE: deleteBlogSchema },
    '/blog/update-status': { PATCH: updateBlogStatusSchema },

    // Tags
    '/tags/add-tag': { POST: addTagSchema },
    '/tags/all-tags': { GET: getAllTagsSchema },
    '/tags/tagByID': { GET: getTagByIdSchema },
    '/tags/edit-tag': { PUT: editTagSchema },
    '/tags/delete-tag': { DELETE: deleteTagSchema },
    
    // Health check endpoints (no validation needed)
    '/health': { GET: null },
};

export { validationSchemas };
  