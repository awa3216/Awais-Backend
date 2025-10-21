import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();
const generateAndSetJwtCookie = (user, res) => {
  // Generate JWT

  const token = jwt.sign(
    { userId: user._id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '7d' } // Token expires in 1 hour
  );
  // Set cookie with JWT
  res.cookie('jwt', token, {
    httpOnly: true, // Prevents client-side JavaScript access
    secure: process.env.NODE_ENV === 'production', // Use secure in production
    sameSite: 'strict', // Protects against CSRF
    maxAge: 7 * 24 * 60 * 60 * 1000, // 1 hour in milliseconds
  });

  return token; // Optional: return token if needed elsewhere
};

export default generateAndSetJwtCookie;
