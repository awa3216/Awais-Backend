import Joi from 'joi';
import errorConstants from '../utils/errors.js';

const emailSchema = Joi.string().email().required().messages({
  'string.base': errorConstants.AUTHENTICATION.EMAIL_MUST_BE_STRING,
  'string.email': errorConstants.AUTHENTICATION.EMAIL_INVALID,
  'any.required': errorConstants.AUTHENTICATION.EMAIL_REQUIRED,
});

const passwordSchema = Joi.string()
  .required()
  .messages({
    'string.base': errorConstants.AUTHENTICATION.PASSWORD_MUST_BE_STRING,
    'string.empty': errorConstants.AUTHENTICATION.PASSWORD_REQUIRED,
    'any.required': errorConstants.AUTHENTICATION.PASSWORD_REQUIRED,
  });

const otpSchema = Joi.string()
  .trim()
  .length(4)
  .pattern(/^[0-9]+$/)
  .required()
  .messages({
    'string.base':
      errorConstants.AUTHENTICATION.OTP_MUST_BE_STRING ||
      'OTP must be a string',
    'string.length':
      errorConstants.AUTHENTICATION.OTP_INVALID_LENGTH ||
      'OTP must be 4 digits',
    'string.pattern.base':
      errorConstants.AUTHENTICATION.OTP_INVALID_FORMAT ||
      'OTP must contain only digits',
    'string.empty':
      errorConstants.AUTHENTICATION.OTP_REQUIRED || 'OTP is required',
    'any.required':
      errorConstants.AUTHENTICATION.OTP_REQUIRED || 'OTP is required',
  });

const adminLoginSchema = Joi.object({
  email: emailSchema,
  password: passwordSchema,
});

const adminForgotPasswordSchema = Joi.object({
  email: emailSchema,
});

const adminVerifyOtpSchema = Joi.object({
  email: emailSchema,
  otp: otpSchema,
});

const adminResetPasswordSchema = Joi.object({
  email: emailSchema,
  newPassword: passwordSchema,
});

const adminResendOtpSchema = Joi.object({
  email: emailSchema,
});

export {
  adminLoginSchema,
  adminForgotPasswordSchema,
  adminVerifyOtpSchema,
  adminResetPasswordSchema,
  adminResendOtpSchema,
};
