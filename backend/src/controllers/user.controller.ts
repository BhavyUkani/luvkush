import { Request, Response, NextFunction } from 'express';
import { UserService } from '../services/user.service';
import { AppError } from '../middleware/error.middleware';

export class UserController {
  private service = new UserService();

  async getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const profile = await this.service.getProfile(req.user!.userId);
      res.json({ success: true, data: profile });
    } catch (err) { next(err); }
  }

  async updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const profile = await this.service.updateProfile(req.user!.userId, req.body);
      res.json({ success: true, data: profile, message: 'Profile updated' });
    } catch (err) { next(err); }
  }

  async changePassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { current_password, new_password } = req.body;
      if (!current_password || !new_password) throw new AppError('Both passwords are required', 400);
      await this.service.changePassword(req.user!.userId, current_password, new_password);
      res.json({ success: true, message: 'Password changed successfully' });
    } catch (err) { next(err); }
  }

  async getAddresses(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const addresses = await this.service.getAddresses(req.user!.userId);
      res.json({ success: true, data: addresses });
    } catch (err) { next(err); }
  }

  async addAddress(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { full_name, recipient_name, phone, address_line1, city, state, pincode } = req.body;
      if ((!full_name && !recipient_name) || !phone || !address_line1 || !city || !state || !pincode) {
        throw new AppError('Required address fields are missing', 400);
      }
      const address = await this.service.addAddress(req.user!.userId, req.body);
      res.status(201).json({ success: true, data: address, message: 'Address added' });
    } catch (err) { next(err); }
  }

  async setDefaultAddress(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await this.service.setDefaultAddress(req.user!.userId, Number(req.params['id']));
      res.json({ success: true, message: 'Default address updated' });
    } catch (err) { next(err); }
  }

  async updateAddress(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const address = await this.service.updateAddress(req.user!.userId, Number(req.params['id']), req.body);
      res.json({ success: true, data: address, message: 'Address updated' });
    } catch (err) { next(err); }
  }

  async deleteAddress(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await this.service.deleteAddress(req.user!.userId, Number(req.params['id']));
      res.json({ success: true, message: 'Address deleted' });
    } catch (err) { next(err); }
  }
}
