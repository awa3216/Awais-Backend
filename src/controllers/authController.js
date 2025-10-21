import User from '../models/user.js';
import SuccessHandler from '../utils/SuccessHandler.js';
import errorConstants from '../utils/errors.js';
import ApiError from '../utils/ApiError.js';
import sendEmail from '../utils/sendEmail.js';
import {
    generateOTP,
    hashOTP,
    storeOTP,
    verifyOTP,
    getStoredOTP,
    clearOTP,
} from '../utils/otp.js';
import generateAndSetJwtCookie from '../utils/Jwt.js';

// -------------------- Admin Login --------------------
const adminLogin = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return next(new ApiError(errorConstants.AUTHENTICATION.CREDENTIALS_REQUIRED, 400));
        }

        let admin = await User.findOne({ email });
        if (!admin) {
            // First time: create the admin user in DB
            const allowedAdminEmail = process.env.ADMIN_EMAIL;
            if (email !== allowedAdminEmail) {
                return next(new ApiError(errorConstants.AUTHENTICATION.INVALID_CREDENTIALS, 401));
            }
            admin = await User.create({ email, password });
        }

        const isMatch = await admin.comparePassword(password);
        if (!isMatch) {
            return next(new ApiError(errorConstants.AUTHENTICATION.INVALID_CREDENTIALS, 401));
        }
        const token = generateAndSetJwtCookie(admin, res);
        return SuccessHandler({ email ,token}, 200, 'Login successful', res);
    } catch (err) {
        next(err);
    }
};

// -------------------- Admin Forgot Password --------------------
const adminForgotPassword = async (req, res, next) => {
    try {
        const { email } = req.body;
        const adminEmail = process.env.ADMIN_EMAIL;

        if (!email) {
            return next(new ApiError( errorConstants.AUTHENTICATION.CREDENTIALS_REQUIRED,400));
        }

        if (email !== adminEmail) {
            return next(new ApiError( errorConstants.AUTHENTICATION.USER_NOT_FOUND,404));
        }

        // Generate OTP
        const otp = generateOTP(4);
        const otpHash = hashOTP(otp);
        await storeOTP(email, otpHash, 120); // 2 minutes TTL

        // Send OTP email
        await sendEmail({
            to: adminEmail,
            subject: 'Your FARAWAY Admin Password Reset OTP',
            templateName: 'forgetPassword',
            replacements: { otp },
        });

        return SuccessHandler({ email }, 200, 'Password reset OTP sent to admin email', res);
    } catch (err) {
        next(err);
    }
};

// -------------------- Admin Verify OTP --------------------
const adminVerifyOtp = async (req, res, next) => {
    try {
        const { email, otp } = req.body;
        if (!email || !otp) {
            return next(new ApiError(errorConstants.AUTHENTICATION.OTP_REQUIRED, 400));
        }
        if (typeof otp !== 'string' || otp.length !== 4 || !/^[0-9]{4}$/.test(otp)) {
            return next(new ApiError(errorConstants.AUTHENTICATION.OTP_INVALID_FORMAT, 400));
        }
        const stored = await getStoredOTP(email);
        if (!stored || !stored.hash || !stored.expiresAt) {
            return next(new ApiError(errorConstants.AUTHENTICATION.INVALID_OTP, 400));
        }
        if (Date.now() > new Date(stored.expiresAt).getTime()) {
            await clearOTP(email);
            return next(new ApiError(errorConstants.AUTHENTICATION.INVALID_OTP, 400));
        }
        if (!verifyOTP(otp, stored.hash)) {
            return next(new ApiError(errorConstants.AUTHENTICATION.INVALID_OTP, 400));
        }
        await clearOTP(email);
        // Set otpVerified flag
        await User.updateOne({ email }, { otpVerified: true });
        return SuccessHandler(null, 200, 'OTP verified successfully', res);
    } catch (err) {
        next(err);
    }
};

// -------------------- Admin Reset Password --------------------
const adminResetPassword = async (req, res, next) => {
    try {
        const { email, newPassword } = req.body;
        const admin = await User.findOne({ email });
        if (!admin) {
            return next(new ApiError(errorConstants.AUTHENTICATION.USER_NOT_FOUND, 404));
        }
        if (!admin.otpVerified) {
            return next(new ApiError(errorConstants.AUTHENTICATION.OTP_NOT_VERIFIED, 403));
        }
        if (!newPassword) {
            return next(new ApiError(errorConstants.AUTHENTICATION.MISSING_CREDENTIALS, 400));
        }
        if (typeof newPassword !== 'string') {
            return next(new ApiError(errorConstants.AUTHENTICATION.PASSWORD_MUST_BE_STRING, 400));
        }
        if (newPassword.length < 6) {
            return next(new ApiError(errorConstants.AUTHENTICATION.PASSWORD_MIN_LENGTH, 400));
        }
        admin.password = newPassword;
        admin.otpVerified = false; // Clear the flag after reset
        await admin.save();
        return SuccessHandler(null, 200, 'Admin password reset successfully', res);
    } catch (err) {
        next(err);
    }
};

// -------------------- Admin Resend OTP --------------------
const adminResendOtp = async (req, res, next) => {
    try {
        const { email } = req.body;
        const adminEmail = process.env.ADMIN_EMAIL;

        if (!email) {
            return next(new ApiError(errorConstants.AUTHENTICATION.CREDENTIALS_REQUIRED,400));
        }

        if (email !== adminEmail) {
            return next(new ApiError(errorConstants.AUTHENTICATION.USER_NOT_FOUND,404));
        }

        // Generate OTP
        const otp = generateOTP(4);
        const otpHash = hashOTP(otp);
        await storeOTP(email, otpHash, 120); // 2 minutes TTL

        // Send OTP email
        await sendEmail({
            to: adminEmail,
            subject: 'Your FARAWAY Admin Password Reset OTP (Resent)',
            templateName: 'forgetPassword',
            replacements: { otp },
        });

        return SuccessHandler({ email }, 200, 'OTP resent to admin email', res);
    } catch (err) {
        next(err);
    }
};
export default {

    adminLogin,
    adminForgotPassword,
    adminVerifyOtp,
    adminResetPassword,
    adminResendOtp,
};
