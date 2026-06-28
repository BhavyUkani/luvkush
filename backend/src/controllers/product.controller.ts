import { Request, Response, NextFunction } from 'express';
import { ProductService } from '../services/product.service';
import { AppError } from '../middleware/error.middleware';
import { logActivity } from '../utils/activity-logger';

export class ProductController {
  private service = new ProductService();

  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const {
        page = 1,
        limit = 12,
        category,
        sort = 'created_at',
        order = 'DESC',
        minPrice,
        maxPrice,
        search,
        inStock,
        featured
      } = req.query;

      const result = await this.service.getAll({
        page: Number(page),
        limit: Math.min(Number(limit), 50),
        category: category as string,
        sort: sort as string,
        order: order as 'ASC' | 'DESC',
        minPrice: minPrice ? Number(minPrice) : undefined,
        maxPrice: maxPrice ? Number(maxPrice) : undefined,
        search: search as string,
        inStock: inStock === 'true',
        featured: featured === 'true',
        userId: req.user?.userId
      });

      res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  async getFeatured(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const limit = Math.min(Number(req.query['limit'] || 8), 20);
      const products = await this.service.getFeatured(limit);
      res.json({ success: true, data: products });
    } catch (err) {
      next(err);
    }
  }

  async getBySlug(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const product = await this.service.getBySlug(req.params['slug'], req.user?.userId);
      if (!product) throw new AppError('Product not found', 404);
      res.json({ success: true, data: product });
    } catch (err) {
      next(err);
    }
  }

  async search(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { q, limit = 10 } = req.query;
      if (!q) throw new AppError('Search query required', 400);

      const results = await this.service.search(q as string, Number(limit));
      res.json({ success: true, data: results });
    } catch (err) {
      next(err);
    }
  }

  async getRelated(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const products = await this.service.getRelated(Number(req.params['id']));
      res.json({ success: true, data: products });
    } catch (err) {
      next(err);
    }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const files = req.files as Express.Multer.File[];
      const product = await this.service.create(req.body, files);
      logActivity({ action: 'product_created', userId: req.user?.userId, module: 'products', referenceType: 'product', referenceId: (product as any)?.id, newValues: { name: req.body.name } });
      res.status(201).json({ success: true, data: product, message: 'Product created successfully' });
    } catch (err) {
      next(err);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const files = req.files as Express.Multer.File[];
      const product = await this.service.update(Number(req.params['id']), req.body, files);
      if (!product) throw new AppError('Product not found', 404);
      logActivity({ action: 'product_updated', userId: req.user?.userId, module: 'products', referenceType: 'product', referenceId: Number(req.params['id']), newValues: { name: req.body.name, status: req.body.status } });
      res.json({ success: true, data: product, message: 'Product updated successfully' });
    } catch (err) {
      next(err);
    }
  }

  async updateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await this.service.updateStatus(Number(req.params['id']), req.body['status']);
      logActivity({ action: 'product_updated', userId: req.user?.userId, module: 'products', referenceType: 'product', referenceId: Number(req.params['id']), newValues: { status: req.body['status'] } });
      res.json({ success: true, message: 'Status updated successfully' });
    } catch (err) {
      next(err);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await this.service.delete(Number(req.params['id']));
      logActivity({ action: 'product_deleted', userId: req.user?.userId, module: 'products', referenceType: 'product', referenceId: Number(req.params['id']) });
      res.json({ success: true, message: 'Product deleted successfully' });
    } catch (err) {
      next(err);
    }
  }
}
