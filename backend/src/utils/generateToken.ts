import jwt from 'jsonwebtoken';

const generateToken = (userId: string) => {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not set');
  }

  return jwt.sign({ userId }, secret, {
    expiresIn: '7d',
  });
};

export default generateToken;
