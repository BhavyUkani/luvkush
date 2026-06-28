import { Request, Response, NextFunction } from 'express';
import { CategoryService } from '../services/category.service';
import { AppError } from '../middleware/error.middleware';
import { logActivity } from '../utils/activity-logger';
import sharp from 'sharp';
import path from 'path';
import { config } from '../utils/config';
import fs from 'fs';

export class CategoryController {
  private service = new CategoryService();

  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const includeInactive = req.user?.role === 'super_admin' || req.user?.role === 'admin';
      const categories = await this.service.getAll(includeInactive);
      res.json({ success: true, data: categories });
    } catch (err) { next(err); }
  }

  async getBySlug(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const category = await this.service.getBySlug(req.params['slug']);
      if (!category) throw new AppError('Category not found', 404);
      res.json({ success: true, data: category });
    } catch (err) { next(err); }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name } = req.body;
      if (!name?.trim()) throw new AppError('Category name is required', 400);
      const category = await this.service.create(req.body);
      logActivity({ action: 'category_created', userId: req.user?.userId, module: 'categories', referenceType: 'category', referenceId: (category as any)?.id, newValues: { name } });
      res.status(201).json({ success: true, data: category, message: 'Category created' });
    } catch (err) { next(err); }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params['id']);
      if (!req.body.name?.trim()) throw new AppError('Category name is required', 400);
      const category = await this.service.update(id, req.body);
      logActivity({ action: 'category_updated', userId: req.user?.userId, module: 'categories', referenceType: 'category', referenceId: id, newValues: { name: req.body.name } });
      res.json({ success: true, data: category, message: 'Category updated' });
    } catch (err) { next(err); }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await this.service.delete(Number(req.params['id']));
      logActivity({ action: 'category_deleted', userId: req.user?.userId, module: 'categories', referenceType: 'category', referenceId: Number(req.params['id']) });
      res.json({ success: true, message: 'Category deactivated' });
    } catch (err) { next(err); }
  }

  async uploadImage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params['id']);
      if (!req.file) throw new AppError('No image uploaded', 400);

      const dir = path.join(config.upload.dir, 'categories');
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

      const filename = `cat-${id}-${Date.now()}.webp`;
      const outputPath = path.join(dir, filename);

      await sharp(req.file.buffer)
        .resize(600, 600, { fit: 'cover', position: 'center' })
        .webp({ quality: 85 })
        .toFile(outputPath);

      const imageUrl = `/uploads/categories/${filename}`;
      const category = await this.service.update(id, { image_url: imageUrl });
      res.json({ success: true, data: category, image_url: imageUrl });
    } catch (err) { next(err); }
  }
}
