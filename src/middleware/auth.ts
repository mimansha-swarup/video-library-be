import { Request, Response, NextFunction } from 'express';
import { auth } from '../config/firebase';
import { AuthUser } from '../types';

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}

export const authMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: 'No token provided',
      });
      return;
    }

    const token = authHeader.split('Bearer ')[1];

    if (!token) {
      res.status(401).json({
        success: false,
        error: 'Invalid token format',
      });
      return;
    }

    const decodedToken = await auth.verifyIdToken(token);

    if (!decodedToken.approved) {
      res.status(403).json({
        success: false,
        error: 'Access not granted',
      });
      return;
    }

    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email || '',
      name: decodedToken.name,
    };

    next();
  } catch (error) {
    console.error('Auth error:', error);
    res.status(401).json({
      success: false,
      error: 'Invalid or expired token',
    });
  }
};
