import { Router } from 'express';
import { CategoryController } from '../controllers/category.controller';
import { authenticate, authorize, optionalAuth } from '../middleware/auth.middleware';
import { uploadSingleMiddleware } from '../middleware/upload.middleware';

const router = Router();
const ctrl = new CategoryController();

router.get('/', optionalAuth, ctrl.getAll.bind(ctrl));
router.get('/:slug', ctrl.getBySlug.bind(ctrl));
router.post('/', authenticate, authorize('super_admin', 'admin'), ctrl.create.bind(ctrl));
router.put('/:id', authenticate, authorize('super_admin', 'admin'), ctrl.update.bind(ctrl));
router.delete('/:id', authenticate, authorize('super_admin', 'admin'), ctrl.delete.bind(ctrl));
router.post('/:id/upload-image', authenticate, authorize('super_admin', 'admin'), uploadSingleMiddleware('image'), ctrl.uploadImage.bind(ctrl));

export default router;
