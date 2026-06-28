import { Request, Response, NextFunction } from 'express';
import { ReviewService } from '../services/review.service';
import { AppError } from '../middleware/error.middleware';

export class ReviewController {
  private service = new ReviewService();

  async getProductReviews(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page = 1, limit = 10 } = req.query;
      const result = await this.service.getProductReviews(
        Number(req.params['productId']), Number(page), Number(limit)
      );
      res.json({ success: true, ...result });
    } catch (err) { next(err); }
  }

  async getRatingSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const summary = await this.service.getRatingSummary(Number(req.params['productId']));
      res.json({ success: true, data: summary });
    } catch (err) { next(err); }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { product_id, rating, title, body } = req.body;
      if (!product_id || !rating || !body) throw new AppError('product_id, rating, and body are required', 400);
      const review = await this.service.create(req.user!.userId, { product_id: Number(product_id), rating: Number(rating), title, body });
      res.status(201).json({ success: true, data: review, message: 'Review submitted' });
    } catch (err) { next(err); }
  }

  async markHelpful(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await this.service.markHelpful(Number(req.params['id']), req.user!.userId);
      res.json({ success: true, message: 'Marked as helpful' });
    } catch (err) { next(err); }
  }

  async adminGetAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page = 1, limit = 20, status } = req.query;
      const result = await this.service.adminGetAll(Number(page), Number(limit), status as string);
      res.json({ success: true, ...result });
    } catch (err) { next(err); }
  }

  async updateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await this.service.updateStatus(Number(req.params['id']), req.body['status']);
      res.json({ success: true, message: 'Review status updated' });
    } catch (err) { next(err); }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await this.service.delete(Number(req.params['id']));
      res.json({ success: true, message: 'Review deleted' });
    } catch (err) { next(err); }
  }
}
