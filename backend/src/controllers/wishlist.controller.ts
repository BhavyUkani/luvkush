import { Request, Response, NextFunction } from 'express';
import { WishlistService } from '../services/wishlist.service';
import { AppError } from '../middleware/error.middleware';

export class WishlistController {
  private service = new WishlistService();

  async getWishlist(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const items = await this.service.getWishlist(req.user!.userId);
      res.json({ success: true, data: items });
    } catch (err) { next(err); }
  }

  async toggle(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const productId = Number(req.params['productId']);
      if (!productId) throw new AppError('Product ID required', 400);
      const result = await this.service.toggle(req.user!.userId, productId);
      res.json({ success: true, data: result });
    } catch (err) { next(err); }
  }

  async remove(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await this.service.remove(req.user!.userId, Number(req.params['productId']));
      res.json({ success: true, message: 'Removed from wishlist' });
    } catch (err) { next(err); }
  }

  async clear(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await this.service.clear(req.user!.userId);
      res.json({ success: true, message: 'Wishlist cleared' });
    } catch (err) { next(err); }
  }
}
