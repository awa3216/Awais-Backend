import jwt from 'jsonwebtoken';
import ApiError from '../utils/ApiError.js';
import errorConstants from '../utils/errors.js';

export const verifyToken = (req, res, next) => {
  try {
    const token = req.headers?.authorization?.replace('Bearer ', '');

    if (!token) {
      return next(
        new ApiError(errorConstants.AUTHENTICATION.TOKEN_MISSING, 401)
      );
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decoded; // e.g. { _id: ..., email: ..., etc }
    next();
  } catch (err) {
    return next(
      new ApiError(
        errorConstants.AUTHENTICATION.TOKEN_INVALID || err.message,
        403
      )
    );
  }
};
