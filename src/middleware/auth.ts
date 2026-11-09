import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../config/db.js';
import type { UserProfile } from '../types/index.js';

const JWT_SECRET = process.env.JWT_SECRET || 'memegen-dev-secret-jwt-key-2026-safe-default';

export interface AuthenticatedRequest extends Request {
  user?: UserProfile;
}

export async function authenticateToken(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication token is required to access this resource.',
      },
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string };
    const user = await db.users.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'The account associated with this session no longer exists.',
        },
      });
    }

    req.user = {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      avatarUrl: user.avatarUrl,
      role: user.role,
      createdAt: user.createdAt,
    };

    next();
  } catch (err: unknown) {
    const isExpired = err instanceof Error && err.name === 'TokenExpiredError';
    return res.status(403).json({
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: isExpired
          ? 'Session expired. Please log in again.'
          : 'Invalid authentication token.',
      },
    });
  }
}

export async function optionalAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
    const user = await db.users.findById(decoded.id);
    if (user) {
      req.user = {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        avatarUrl: user.avatarUrl,
        role: user.role,
      };
    }
  } catch {
    // Ignore invalid optional token
  }

  next();
}

export function requireAdmin(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'owner')) {
    return res.status(403).json({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'Administrator privileges are required to access this resource.',
      },
    });
  }
  next();
}
