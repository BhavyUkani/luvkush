import multer, { FileFilterCallback } from 'multer';
import { Request, RequestHandler } from 'express';
import { config } from '../utils/config';
import { AppError } from './error.middleware';

const storage = multer.memoryStorage();

const fileFilter = (_req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
  if (config.upload.allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError(`Invalid file type. Allowed: ${config.upload.allowedTypes.join(', ')}`, 400));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: config.upload.maxSize }
});

export const uploadMiddleware = (fieldName: string, maxCount: number = 1): RequestHandler => {
  return upload.array(fieldName, maxCount);
};

export const uploadSingleMiddleware = (fieldName: string): RequestHandler => {
  return upload.single(fieldName);
};
