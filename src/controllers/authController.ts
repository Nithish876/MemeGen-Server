import type { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../config/db.js';
import type { AuthenticatedRequest } from '../middleware/auth.js';

const JWT_SECRET = process.env.JWT_SECRET || 'memegen-dev-secret-jwt-key-2026-safe-default';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export const authController = {
  /**
   * Register a new user
   * POST /api/v1/auth/register
   */
  async register(req: Request, res: Response) {
    try {
      const { fullName, email, password } = req.body;

      // Validation
      const errors: Record<string, string[]> = {};
      if (!fullName || typeof fullName !== 'string' || !fullName.trim()) {
        errors.fullName = ['Full name is required.'];
      }
      if (!email || typeof email !== 'string' || !email.includes('@')) {
        errors.email = ['Valid email is required.'];
      }
      if (!password || typeof password !== 'string' || password.length < 8) {
        errors.password = ['Password must be at least 8 characters.'];
      }

      if (Object.keys(errors).length > 0) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_FAILED',
            message: 'Invalid registration parameters provided.',
            details: errors,
          },
        });
      }

      // Check existing email
      const existingUser = await db.users.findByEmail(email);
      if (existingUser) {
        return res.status(409).json({
          success: false,
          error: {
            code: 'EMAIL_ALREADY_EXISTS',
            message: 'An account with this email address already exists. Please log in.',
          },
        });
      }

      // Hash password & create profile
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      const user = await db.users.create({
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        passwordHash,
        avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(fullName.trim())}`,
        role: 'creator',
      });

      // Generate JWT
      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN as any }
      );

      return res.status(201).json({
        success: true,
        data: {
          user: {
            id: user.id,
            fullName: user.fullName,
            email: user.email,
            avatarUrl: user.avatarUrl,
            role: user.role,
            createdAt: user.createdAt,
          },
          token,
        },
        message: 'Account created successfully!',
      });
    } catch (err) {
      console.error('Registration error:', err);
      return res.status(500).json({
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: 'An unexpected error occurred during registration. Please try again.',
        },
      });
    }
  },

  /**
   * Login user
   * POST /api/v1/auth/login
   */
  async login(req: Request, res: Response) {
    try {
      const { email, password, rememberMe } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_FAILED',
            message: 'Email and password are required.',
          },
        });
      }

      const user = await db.users.findByEmail(email);
      if (!user) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'Invalid email or password. Please check your credentials.',
          },
        });
      }

      const isMatch = await bcrypt.compare(password, user.passwordHash);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'Invalid email or password. Please check your credentials.',
          },
        });
      }

      const expiresIn = rememberMe ? '30d' : JWT_EXPIRES_IN;
      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: expiresIn as any }
      );

      return res.status(200).json({
        success: true,
        data: {
          user: {
            id: user.id,
            fullName: user.fullName,
            email: user.email,
            avatarUrl: user.avatarUrl,
            role: user.role,
            createdAt: user.createdAt,
          },
          token,
        },
        message: 'Welcome back!',
      });
    } catch (err) {
      console.error('Login error:', err);
      return res.status(500).json({
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: 'An unexpected error occurred during login. Please try again.',
        },
      });
    }
  },

  /**
   * Get current authenticated user profile
   * GET /api/v1/auth/me
   */
  async me(req: AuthenticatedRequest, res: Response) {
    try {
      return res.status(200).json({
        success: true,
        data: req.user,
      });
    } catch {
      return res.status(500).json({
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: 'Failed to retrieve profile.',
        },
      });
    }
  },

  /**
   * Logout user
   * POST /api/v1/auth/logout
   */
  async logout(_req: Request, res: Response) {
    return res.status(200).json({
      success: true,
      message: 'Logged out successfully.',
    });
  },

  /**
   * Reset user password with secure bcrypt hashing
   * POST /api/v1/auth/reset-password
   */
  async resetPassword(req: Request, res: Response) {
    try {
      const { email, newPassword } = req.body;

      if (!email || typeof email !== 'string') {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_FAILED',
            message: 'Email address is required.',
          },
        });
      }

      if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 8) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_FAILED',
            message: 'New password must be at least 8 characters long.',
          },
        });
      }

      const user = await db.users.findByEmail(email);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: 'No account with this email address was found.',
          },
        });
      }

      // Encrypt the new password with bcrypt
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(newPassword, salt);

      await db.users.updatePassword(user.id, passwordHash);

      return res.status(200).json({
        success: true,
        message: 'Password has been securely reset. You can now log in.',
      });
    } catch (err) {
      console.error('Password reset error:', err);
      return res.status(500).json({
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: 'Failed to reset password. Please try again.',
        },
      });
    }
  },

  /**
   * Optional Google OAuth exchange
   * POST /api/v1/auth/google
   */
  async googleAuth(req: Request, res: Response) {
    try {
      const { email, fullName, avatarUrl } = req.body;

      if (!email) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_FAILED',
            message: 'Google email is required.',
          },
        });
      }

      let user = await db.users.findByEmail(email);
      if (!user) {
        const dummyPassword = await bcrypt.hash(Math.random().toString(36) + 'GoogleAuthSecret1!', 10);
        user = await db.users.create({
          email: email.trim().toLowerCase(),
          fullName: fullName || email.split('@')[0],
          avatarUrl: avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(email)}`,
          passwordHash: dummyPassword,
          role: 'creator',
        });
      }

      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN as any }
      );

      return res.status(200).json({
        success: true,
        data: {
          user: {
            id: user.id,
            fullName: user.fullName,
            email: user.email,
            avatarUrl: user.avatarUrl,
            role: user.role,
            createdAt: user.createdAt,
          },
          token,
        },
        message: 'Google authentication successful.',
      });
    } catch (err) {
      console.error('Google auth error:', err);
      return res.status(500).json({
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: 'Google authentication failed.',
        },
      });
    }
  },
};
