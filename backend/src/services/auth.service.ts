import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { db } from '../utils/database';
import { config } from '../utils/config';
import { AppError } from '../middleware/error.middleware';
import { EmailService } from './email.service';

export class AuthService {
  private emailService = new EmailService();

  async register(data: {
    first_name: string;
    last_name?: string;
    email: string;
    password: string;
    phone?: string;
  }) {
    const existing = await db.queryOne('SELECT id FROM users WHERE email = ?', [data.email]);
    if (existing) throw new AppError('An account with this email already exists', 409);

    const hashedPassword = await bcrypt.hash(data.password, 12);
    const verificationToken = crypto.randomBytes(32).toString('hex');

    const result = await db.query<any>(`
      INSERT INTO users (
        first_name, last_name, email, password_hash, phone,
        role, status, email_verification_token, created_at
      ) VALUES (?, ?, ?, ?, ?, 'customer', 'active', ?, NOW())
    `, [
      data.first_name, data.last_name || null, data.email,
      hashedPassword, data.phone || null, verificationToken
    ]);

    const userId = result.insertId;
    const tokens = this.generateTokens(userId, data.email, 'customer');

    // Store refresh token
    await this.storeRefreshToken(userId, tokens.refreshToken);

    // Send verification email (fire and forget)
    this.emailService.sendVerificationEmail(data.email, data.first_name, verificationToken)
      .catch(err => console.error('Email error:', err));

    return {
      user: { id: userId, email: data.email, first_name: data.first_name, role: 'customer' },
      ...tokens
    };
  }

  async login(email: string, password: string) {
    const user = await db.queryOne<any>(
      'SELECT id, first_name, last_name, email, password_hash, role, status FROM users WHERE email = ?',
      [email]
    );

    if (!user) throw new AppError('Invalid email or password', 401);
    if (user.status === 'suspended') throw new AppError('Your account has been suspended. Contact support.', 403);

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) throw new AppError('Invalid email or password', 401);

    const tokens = this.generateTokens(user.id, user.email, user.role);
    await this.storeRefreshToken(user.id, tokens.refreshToken);

    // Update last login
    await db.query('UPDATE users SET last_login_at = NOW() WHERE id = ?', [user.id]);

    return {
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role
      },
      ...tokens
    };
  }

  async refreshToken(token: string) {
    try {
      const payload = jwt.verify(token, config.jwt.refreshSecret) as any;

      const stored = await db.queryOne(
        'SELECT * FROM refresh_tokens WHERE token = ? AND user_id = ? AND expires_at > NOW()',
        [token, payload.userId]
      );

      if (!stored) throw new AppError('Invalid or expired refresh token', 401);

      const user = await db.queryOne<any>(
        'SELECT id, email, role FROM users WHERE id = ?',
        [payload.userId]
      );

      if (!user) throw new AppError('User not found', 401);

      const tokens = this.generateTokens(user.id, user.email, user.role);

      // Rotate refresh token
      await db.query('DELETE FROM refresh_tokens WHERE token = ?', [token]);
      await this.storeRefreshToken(user.id, tokens.refreshToken);

      return tokens;
    } catch {
      throw new AppError('Invalid or expired refresh token', 401);
    }
  }

  async logout(userId: number) {
    await db.query('DELETE FROM refresh_tokens WHERE user_id = ?', [userId]);
  }

  async forgotPassword(email: string) {
    const user = await db.queryOne<any>(
      'SELECT id, first_name FROM users WHERE email = ? AND status != "suspended"',
      [email]
    );
    if (!user) return; // Don't reveal if email exists

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await db.query(
      'UPDATE users SET reset_password_token = ?, reset_password_expires = ? WHERE id = ?',
      [token, expiresAt, user.id]
    );

    this.emailService.sendPasswordResetEmail(email, user.first_name, token)
      .catch(err => console.error('Email error:', err));
  }

  async resetPassword(token: string, newPassword: string) {
    const user = await db.queryOne<any>(
      'SELECT id FROM users WHERE reset_password_token = ? AND reset_password_expires > NOW()',
      [token]
    );

    if (!user) throw new AppError('Invalid or expired reset token', 400);

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await db.query(
      'UPDATE users SET password_hash = ?, reset_password_token = NULL, reset_password_expires = NULL WHERE id = ?',
      [hashedPassword, user.id]
    );

    // Invalidate all refresh tokens
    await db.query('DELETE FROM refresh_tokens WHERE user_id = ?', [user.id]);
  }

  async verifyEmail(token: string) {
    const user = await db.queryOne<any>(
      'SELECT id FROM users WHERE email_verification_token = ?',
      [token]
    );
    if (!user) throw new AppError('Invalid verification token', 400);

    await db.query(
      'UPDATE users SET status = "active", email_verified_at = NOW(), email_verification_token = NULL WHERE id = ?',
      [user.id]
    );
  }

  async getUserById(userId: number) {
    return db.queryOne<any>(
      'SELECT id, first_name, last_name, email, phone, role, status, email_verified_at, created_at, last_login_at FROM users WHERE id = ?',
      [userId]
    );
  }

  private generateTokens(userId: number, email: string, role: string) {
    const accessToken = jwt.sign(
      { userId, email, role },
      config.jwt.accessSecret,
      { expiresIn: config.jwt.accessExpiresIn } as any
    );

    const refreshToken = jwt.sign(
      { userId, email, role },
      config.jwt.refreshSecret,
      { expiresIn: config.jwt.refreshExpiresIn } as any
    );

    return { accessToken, refreshToken };
  }

  private async storeRefreshToken(userId: number, token: string) {
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    await db.query(
      'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (?, ?, ?)',
      [userId, token, expiresAt]
    );
  }
}
