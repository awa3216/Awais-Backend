import crypto from 'crypto';
import Otp from '../models/otp.js';

// Generate a 6-digit numeric OTP
export function generateOTP(length = 4) {
  let otp = '';
  for (let i = 0; i < length; i++) {
    otp += Math.floor(Math.random() * 10);
  }
  return otp;
}

// Hash the OTP using SHA256
export function hashOTP(otp) {
  return crypto.createHash('sha256').update(otp).digest('hex');
}

// Verify the OTP by comparing hashes
export function verifyOTP(plainOtp, storedHash) {
  return hashOTP(plainOtp) === storedHash;
}

// Store OTP hash and expiry in MongoDB
export async function storeOTP(email, hash, ttlSeconds = 120) {
  const expiresAt = new Date(Date.now() + ttlSeconds * 1000);
  await Otp.deleteMany({ email }); // Remove any existing OTPs for this email
  await Otp.create({ email, otpHash: hash, expiresAt });
}

// Get stored OTP hash and expiry
export async function getStoredOTP(email) {
  const otp = await Otp.findOne({ email });
  return otp ? { hash: otp.otpHash, expiresAt: otp.expiresAt } : null;
}

// Clear stored OTP
export async function clearOTP(email) {
  await Otp.deleteMany({ email });
}

export default {
  generateOTP,
  hashOTP,
  verifyOTP,
  storeOTP,
  getStoredOTP,
  clearOTP,
}; 