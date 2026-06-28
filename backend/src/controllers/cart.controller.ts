import { Request, Response, NextFunction } from 'express';
import { CartService } from '../services/cart.service';
import { AppError } from '../middleware/error.middleware';

export class CartController {
  private service = new CartService();

  async getCart(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const cart = await this.service.getCart(req.user!.userId);
      res.json({ success: true, data: cart });
    } catch (err) { next(err); }
  }

  async addItem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { product_id, quantity = 1, variant_id } = req.body;
      if (!product_id) throw new AppError('product_id is required', 400);
      const cart = await this.service.addItem(req.user!.userId, Number(product_id), Number(quantity), variant_id ? Number(variant_id) : undefined);
      res.json({ success: true, data: cart, message: 'Item added to cart' });
    } catch (err) { next(err); }
  }

  async updateItem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { quantity } = req.body;
      if (quantity === undefined) throw new AppError('quantity is required', 400);
      const cart = await this.service.updateItem(req.user!.userId, Number(req.params['itemId']), Number(quantity));
      res.json({ success: true, data: cart });
    } catch (err) { next(err); }
  }

  async removeItem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const cart = await this.service.removeItem(req.user!.userId, Number(req.params['itemId']));
      res.json({ success: true, data: cart, message: 'Item removed' });
    } catch (err) { next(err); }
  }

  async clearCart(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await this.service.clearCart(req.user!.userId);
      res.json({ success: true, message: 'Cart cleared' });
    } catch (err) { next(err); }
  }

  async applyCoupon(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { code } = req.body;
      if (!code?.trim()) throw new AppError('Coupon code is required', 400);
      const result = await this.service.applyCoupon(req.user!.userId, code.trim().toUpperCase());
      res.json({ success: true, data: result, message: 'Coupon applied' });
    } catch (err) { next(err); }
  }
}
