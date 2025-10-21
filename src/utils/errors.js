const errorConstants = {
    // 🔹 General Errors
    GENERAL: {
        INTERNAL_SERVER_ERROR:
            'An unexpected error occurred. Please try again later.',
        UNAUTHORIZED: 'Access denied. Valid authentication is required.',
        INVALID_TOKEN: 'Invalid or expired token. Please log in again.',
        VALIDATION_ERROR:
            'Invalid input data. Please check your request and try again.',
    },

    // 🔹 Route & Method Errors
    ROUTE_ERRORS: {
        INVALID_ROUTE: 'The requested route does not exist.',
        INVALID_METHOD: 'The requested method is not allowed for this route.',
    },
    // 🔹 Auth Errors
    AUTHENTICATION: {
        NAME_REQUIRED: 'Full name is required.',
NAME_MUST_BE_STRING: 'Full name must be a string.',
NAME_MIN_LENGTH: 'Full name must be at least 2 characters.',
NAME_MAX_LENGTH: 'Full name must not exceed 50 characters.',
        EMAIL_REQUIRED: 'Email is required.',
        MISSING_CREDENTIALS: 'Missing credentials.',
        INVALID_CREDENTIALS: 'Invalid email or password.',
        OTP_NOT_VERIFIED: 'Please verify your OTP before proceeding.',
        INVALID_OTP: 'Invalid OTP.',
        TOKEN_INVALID: 'Invalid token. Please log in again.',
        TOKEN_MISSING: 'Token missing. Please log in again.',
        USER_ALREADY_EXISTS: 'User already exists.',
        DATA_NOT_FOUND: 'Data not found.',
        OTP_MUST_BE_STRING: 'OTP must be a string',
        OTP_INVALID_LENGTH: 'OTP must be 4 digits',
        OTP_INVALID_FORMAT: 'OTP must contain only digits',
        OTP_REQUIRED: 'OTP is required',
        USER_NOT_FOUND: 'User not found.',
        EMAIL_MUST_BE_STRING: 'The email must be a string.',
        EMAIL_INVALID: 'The email format is invalid.',
        CREDENTIALS_REQUIRED: 'All fields are required.',
        PASSWORD_MUST_BE_STRING: 'The password must be a string.',
        PASSWORD_REQUIRED: 'The password is required.',
        PASSWORD_MIN_LENGTH: 'The password must have a minimum length.',
        PASSWORD_MAX_LENGTH: 'The password must not exceed the maximum length.',
        PASSWORD_CREATE_MUST_BE_STRING: 'The new password must be a string.',
        PASSWORD_CREATE_REQUIRED: 'The new password is required.',
        PASSWORD_MISMATCHED: 'The new password and confirm password do not match.',
        PASSWORD_CREATE_MIN_LENGTH:
            'The new password must have a minimum length of 8 characters.',
        PASSWORD_CREATE_MAX_LENGTH:
            'The new password must not exceed 50 characters.',
        PASSWORD_CREATE_INVALID:
            'The new password must include at least one uppercase letter, one lowercase letter, one digit, and one special character.',
        PASSWORD_RESET_TOKEN_MUST_BE_STRING:
            'The password reset token must be a string.',
        PASSWORD_RESET_TOKEN_REQUIRED: 'The password reset token is required.',
        PASSWORD_COMPLEXITY:
            'Password must contain at least one uppercase letter, one lowercase letter, and one special character',
    },
}
export default errorConstants;
