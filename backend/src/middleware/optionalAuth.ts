import { NextFunction, Request, Response } from 'express';
import jwt, { JwtPayload as DefaultJwtPayload } from 'jsonwebtoken';
import User from '../models/User';

interface AuthPayload extends DefaultJwtPayload {
  userId: string;
}

const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      next();
      return;
    }

    const token = authHeader.split(' ')[1];
    const secret = process.env.JWT_SECRET;

    if (!secret) {
      throw new Error('JWT_SECRET environment variable is not set');
    }

    const decoded = jwt.verify(token, secret) as AuthPayload;
    const user = await User.findById(decoded.userId).select('-password');

    if (user) {
      req.user = user;
    }

    next();
  } catch (error) {
    const isTokenError =
      error instanceof jwt.JsonWebTokenError || error instanceof jwt.TokenExpiredError;

    if (isTokenError) {
      res.status(401).json({ message: 'Token invalid or expired' });
      return;
    }

    next(error as Error);
  }
};

export default optionalAuth;
