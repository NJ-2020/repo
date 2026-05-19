import { Response } from 'express';
import bcrypt from 'bcrypt';
import pool from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { success, error } from '../utils/response';

// PUT /api/account/profile — update name and/or email
export async function updateProfile(req: AuthRequest, res: Response) {
  const { name, email } = req.body;

  if (!name && !email) {
    return error(res, 'At least one of name or email is required');
  }

  try {
    const userId = req.userId;

    // If email is being changed, check it's not already taken
    if (email) {
      const existing = await pool.query(
        'SELECT id FROM users WHERE email = $1 AND id != $2',
        [email, userId]
      );
      if (existing.rows.length > 0) {
        return error(res, 'Email is already taken', 409);
      }
    }

    // Build dynamic UPDATE query
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (name) {
      fields.push(`name = $${paramIndex++}`);
      values.push(name);
    }
    if (email) {
      fields.push(`email = $${paramIndex++}`);
      values.push(email);
    }

    values.push(userId);

    const result = await pool.query(
      `UPDATE users SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING id, name, email`,
      values
    );

    if (result.rows.length === 0) {
      return error(res, 'User not found', 404);
    }

    const user = result.rows[0];
    return success(res, { id: user.id, name: user.name, email: user.email });
  } catch (err) {
    console.error('UpdateProfile error:', err);
    return error(res, 'Server error', 500);
  }
}

// PUT /api/account/password — change password
export async function changePassword(req: AuthRequest, res: Response) {
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    return error(res, 'Old password and new password are required');
  }

  try {
    const userId = req.userId;

    const result = await pool.query(
      'SELECT password_hash FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return error(res, 'User not found', 404);
    }

    const isMatch = await bcrypt.compare(oldPassword, result.rows[0].password_hash);
    if (!isMatch) {
      return error(res, 'Old password is incorrect', 401);
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    await pool.query(
      'UPDATE users SET password_hash = $1 WHERE id = $2',
      [newHash, userId]
    );

    return success(res, { message: 'Password changed successfully' });
  } catch (err) {
    console.error('ChangePassword error:', err);
    return error(res, 'Server error', 500);
  }
}

// DELETE /api/account — delete user account and related data
export async function deleteAccount(req: AuthRequest, res: Response) {
  try {
    const userId = req.userId;

    // Check user exists
    const userResult = await pool.query('SELECT id FROM users WHERE id = $1', [userId]);
    if (userResult.rows.length === 0) {
      return error(res, 'User not found', 404);
    }

    // Delete cart items (handled by CASCADE, but explicit for clarity)
    await pool.query('DELETE FROM cart_items WHERE user_id = $1', [userId]);

    // Delete user's review images first
    await pool.query(
      `DELETE FROM review_images WHERE review_id IN (
        SELECT id FROM reviews WHERE user_id = $1
      )`,
      [userId]
    );

    // Delete user's reviews
    await pool.query('DELETE FROM reviews WHERE user_id = $1', [userId]);

    // Delete the user
    await pool.query('DELETE FROM users WHERE id = $1', [userId]);

    return success(res, { message: 'Account deleted successfully' });
  } catch (err) {
    console.error('DeleteAccount error:', err);
    return error(res, 'Server error', 500);
  }
}
