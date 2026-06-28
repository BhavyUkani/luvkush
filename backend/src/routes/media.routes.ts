import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { uploadMiddleware } from '../middleware/upload.middleware';
import { config } from '../utils/config';
import path from 'path';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';

const router = Router();

router.post('/upload', authenticate, authorize('super_admin', 'admin'), uploadMiddleware('files', 10), async (req, res, next) => {
  try {
    const files = req.files as Express.Multer.File[];
    if (!files?.length) {
      return res.status(400).json({ success: false, message: 'No files uploaded' });
    }

    const folder = (req.body['folder'] || 'general') as string;
    const uploadDir = path.join(config.upload.dir, folder);

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const uploaded: string[] = [];
    for (const file of files) {
      const filename = `${uuidv4()}.webp`;
      const outputPath = path.join(uploadDir, filename);

      await sharp(file.buffer)
        .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 85 })
        .toFile(outputPath);

      uploaded.push(`/uploads/${folder}/${filename}`);
    }

    res.json({ success: true, data: { urls: uploaded } });
  } catch (err) { next(err); }
});

export default router;
