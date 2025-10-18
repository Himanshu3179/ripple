const jwt = require('jsonwebtoken');
const User = require('../models/User');

const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.split(' ')[1];
    const secret = process.env.JWT_SECRET;

    if (!secret) {
      throw new Error('JWT_SECRET environment variable is not set');
    }

    const decoded = jwt.verify(token, secret);
    const user = await User.findById(decoded.userId).select('-password');

    if (user) {
      req.user = user;
    }

    return next();
  } catch (error) {
    const isTokenError = ['JsonWebTokenError', 'TokenExpiredError'].includes(error.name);
    if (isTokenError) {
      return res.status(401).json({ message: 'Token invalid or expired' });
    }
    return next(error);
  }
};

module.exports = optionalAuth;
