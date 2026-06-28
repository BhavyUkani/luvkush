import { Router } from 'express';
import { ProductController } from '../controllers/product.controller';
import { authenticate, authorize, optionalAuth } from '../middleware/auth.middleware';
import { uploadMiddleware } from '../middleware/upload.middleware';

const router = Router();
const ctrl = new ProductController();

// Public routes
router.get('/',           optionalAuth, ctrl.getAll.bind(ctrl));
router.get('/featured',   ctrl.getFeatured.bind(ctrl));
router.get('/search',     ctrl.search.bind(ctrl));
router.get('/:slug',      optionalAuth, ctrl.getBySlug.bind(ctrl));
router.get('/:id/related', ctrl.getRelated.bind(ctrl));

// Protected — Admin only
router.post('/',
  authenticate, authorize('admin', 'super_admin'),
  uploadMiddleware('images', 5),
  ctrl.create.bind(ctrl)
);

router.put('/:id',
  authenticate, authorize('admin', 'super_admin'),
  uploadMiddleware('images', 5),
  ctrl.update.bind(ctrl)
);

router.patch('/:id/status',
  authenticate, authorize('admin', 'super_admin'),
  ctrl.updateStatus.bind(ctrl)
);

router.delete('/:id',
  authenticate, authorize('admin', 'super_admin'),
  ctrl.delete.bind(ctrl)
);

export default router;
