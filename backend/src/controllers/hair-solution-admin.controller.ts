import { Request, Response, NextFunction } from 'express';
import { HairSolutionAdminService } from '../services/hair-solution-admin.service';
import { AppError } from '../middleware/error.middleware';
import sharp from 'sharp';
import path from 'path';
import { config } from '../utils/config';
import fs from 'fs';

export class HairSolutionAdminController {
  private service = new HairSolutionAdminService();

  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const type = req.query['type'] as 'wig' | 'patch' | undefined;
      const data = await this.service.getAll(type);
      res.json({ success: true, data });
    } catch (err) { next(err); }
  }

  async getOne(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const item = await this.service.getById(Number(req.params['id']));
      if (!item) throw new AppError('Not found', 404);
      res.json({ success: true, data: item });
    } catch (err) { next(err); }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.body.name?.trim()) throw new AppError('Name is required', 400);
      if (!req.body.base_price) throw new AppError('Price is required', 400);
      const item = await this.service.create(req.body);
      res.status(201).json({ success: true, data: item });
    } catch (err) { next(err); }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const item = await this.service.update(Number(req.params['id']), req.body);
      res.json({ success: true, data: item });
    } catch (err) { next(err); }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await this.service.delete(Number(req.params['id']));
      res.json({ success: true, message: 'Deleted' });
    } catch (err) { next(err); }
  }

  async uploadImage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params['id']);
      if (!req.file) throw new AppError('No image uploaded', 400);

      const item = await this.service.getById(id);
      if (!item) throw new AppError('Not found', 404);

      const dir = path.join(config.upload.dir, 'hair-solutions');
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

      const filename = `hs-${id}-${Date.now()}.webp`;
      const outputPath = path.join(dir, filename);

      await sharp(req.file.buffer)
        .resize(800, 800, { fit: 'cover', position: 'center' })
        .webp({ quality: 85 })
        .toFile(outputPath);

      const imageUrl = `/uploads/hair-solutions/${filename}`;

      // Update images array and primary_image
      let images: string[] = [];
      try { images = JSON.parse(item.images || '[]'); } catch { images = []; }
      images.unshift(imageUrl);
      const primary = images[0];

      await this.service.updateImages(id, primary, JSON.stringify(images));
      res.json({ success: true, data: { image_url: imageUrl, primary_image: primary, images } });
    } catch (err) { next(err); }
  }
}
