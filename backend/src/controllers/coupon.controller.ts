import { Request, Response, NextFunction } from 'express';
import { CouponService } from '../services/coupon.service';
import { AppError } from '../middleware/error.middleware';

export class CouponController {
  private service = new CouponService();

  async validate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { code, subtotal } = req.body;
      if (!code || subtotal === undefined) throw new AppError('code and subtotal are required', 400);
      const result = await this.service.validate(code.toUpperCase(), req.user!.userId, Number(subtotal));
      res.json({ success: true, data: result });
    } catch (err) { next(err); }
  }

  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page = 1, limit = 20 } = req.query;
      const result = await this.service.getAll(Number(page), Number(limit));
      res.json({ success: true, ...result });
    } catch (err) { next(err); }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const coupon = await this.service.create(req.body);
      res.status(201).json({ success: true, data: coupon, message: 'Coupon created' });
    } catch (err) { next(err); }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const coupon = await this.service.update(Number(req.params['id']), req.body);
      res.json({ success: true, data: coupon, message: 'Coupon updated' });
    } catch (err) { next(err); }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await this.service.delete(Number(req.params['id']));
      res.json({ success: true, message: 'Coupon deleted' });
    } catch (err) { next(err); }
  }
}
