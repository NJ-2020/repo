import { Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { success, error } from '../utils/response';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

function signToken(userId: number): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN as any });
}

export async function register(req: AuthRequest, res: Response) {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return error(res, 'Name, email, and password are required');
  }

  try {
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return error(res, 'Email already registered', 409);
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const result = await pool.query(
      'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email',
      [name, email, passwordHash]
    );

    const user = result.rows[0];
    const token = signToken(user.id);

    return success(res, { user: { id: user.id, name: user.name, email: user.email }, token }, 201);
  } catch (err) {
    console.error('Register error:', err);
    return error(res, 'Server error', 500);
  }
}

export async function login(req: AuthRequest, res: Response) {
  const { email, password } = req.body;

  if (!email || !password) {
    return error(res, 'Email and password are required');
  }

  try {
    const result = await pool.query(
      'SELECT id, name, email, password_hash FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return error(res, 'Invalid email or password', 401);
    }

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return error(res, 'Invalid email or password', 401);
    }

    const token = signToken(user.id);

    return success(res, {
      user: { id: user.id, name: user.name, email: user.email },
      token,
    });
  } catch (err) {
    console.error('Login error:', err);
    return error(res, 'Server error', 500);
  }
}

// POST /api/auth/forgot-password — generate reset token
export async function forgotPassword(req: AuthRequest, res: Response) {
  const { email } = req.body;

  if (!email) {
    return error(res, 'Email is required');
  }

  try {
    const result = await pool.query(
      'SELECT id, name FROM users WHERE email = $1',
      [email],
    );

    // Always return success to prevent email enumeration
    if (result.rows.length === 0) {
      return success(res, { message: 'If the email exists, a reset token has been generated' });
    }

    const user = result.rows[0];

    // Sign a reset token valid for 15 minutes
    const resetToken = jwt.sign(
      { userId: user.id, purpose: 'reset' },
      JWT_SECRET,
      { expiresIn: '15m' },
    );

    return success(res, {
      message: 'Reset token generated',
      resetToken,
    });
  } catch (err) {
    console.error('ForgotPassword error:', err);
    return error(res, 'Server error', 500);
  }
}

// POST /api/auth/reset-password — reset password using token
export async function resetPassword(req: AuthRequest, res: Response) {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return error(res, 'Token and new password are required');
  }

  if (newPassword.length < 6) {
    return error(res, 'Password must be at least 6 characters');
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number; purpose: string };

    if (decoded.purpose !== 'reset') {
      return error(res, 'Invalid reset token', 401);
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await pool.query(
      'UPDATE users SET password_hash = $1 WHERE id = $2',
      [passwordHash, decoded.userId],
    );

    return success(res, { message: 'Password reset successfully' });
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      return error(res, 'Reset token has expired. Please request a new one.', 401);
    }
    console.error('ResetPassword error:', err);
    return error(res, 'Invalid or expired reset token', 401);
  }
}

export async function getMe(req: AuthRequest, res: Response) {
  try {
    const result = await pool.query(
      'SELECT id, name, email, created_at FROM users WHERE id = $1',
      [req.userId]
    );

    if (result.rows.length === 0) {
      return error(res, 'User not found', 404);
    }

    const user = result.rows[0];
    return success(res, {
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.created_at,
    });
  } catch (err) {
    console.error('GetMe error:', err);
    return error(res, 'Server error', 500);
  }
}
