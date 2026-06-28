import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { AppError } from '../middleware/error.middleware';
import { logActivity } from '../utils/activity-logger';

export class AuthController {
  private service = new AuthService();

  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { first_name, last_name, email, password, phone } = req.body;
      if (!first_name || !email || !password) throw new AppError('Name, email, and password are required', 400);

      const { user, accessToken, refreshToken } = await this.service.register({ first_name, last_name, email, password, phone });
      res.status(201).json({ success: true, data: { user, token: accessToken, refreshToken }, message: 'Account created.' });
    } catch (err) { next(err); }
  }

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body;
      if (!email || !password) throw new AppError('Email and password required', 400);

      const { user, accessToken, refreshToken } = await this.service.login(email, password);
      if (user.role === 'admin' || user.role === 'super_admin') {
        logActivity({ action: 'admin_login', userId: user.id, module: 'auth', newValues: { email: user.email, role: user.role } });
      }
      res.json({ success: true, data: { user, token: accessToken, refreshToken } });
    } catch (err) { next(err); }
  }

  async refreshToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) throw new AppError('Refresh token required', 400);

      const { accessToken, refreshToken: newRefresh } = await this.service.refreshToken(refreshToken);
      res.json({ success: true, data: { token: accessToken, refreshToken: newRefresh } });
    } catch (err) { next(err); }
  }

  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await this.service.logout(req.user!.userId);
      res.json({ success: true, message: 'Logged out successfully' });
    } catch (err) {
      next(err);
    }
  }

  async forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email } = req.body;
      if (!email) throw new AppError('Email is required', 400);

      await this.service.forgotPassword(email);
      res.json({ success: true, message: 'If that email exists, a reset link has been sent.' });
    } catch (err) {
      next(err);
    }
  }

  async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { token, password } = req.body;
      if (!token || !password) throw new AppError('Token and new password required', 400);

      await this.service.resetPassword(token, password);
      res.json({ success: true, message: 'Password reset successfully. Please login.' });
    } catch (err) {
      next(err);
    }
  }

  async verifyEmail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { token } = req.body;
      if (!token) throw new AppError('Verification token required', 400);

      await this.service.verifyEmail(token);
      res.json({ success: true, message: 'Email verified successfully!' });
    } catch (err) {
      next(err);
    }
  }

  async getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await this.service.getUserById(req.user!.userId);
      if (!user) throw new AppError('User not found', 404);
      res.json({ success: true, data: user });
    } catch (err) {
      next(err);
    }
  }
}
