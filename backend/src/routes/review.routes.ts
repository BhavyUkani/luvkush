import { Router } from 'express';
import { ReviewController } from '../controllers/review.controller';
import { authenticate, authorize, optionalAuth } from '../middleware/auth.middleware';

const router = Router();
const ctrl = new ReviewController();

// Public / product reviews
router.get('/product/:productId', ctrl.getProductReviews.bind(ctrl));
router.get('/product/:productId/summary', ctrl.getRatingSummary.bind(ctrl));

// Authenticated user actions
router.post('/', authenticate, ctrl.create.bind(ctrl));
router.post('/:id/helpful', authenticate, ctrl.markHelpful.bind(ctrl));

// Admin
router.get('/admin', authenticate, authorize('super_admin', 'admin'), ctrl.adminGetAll.bind(ctrl));
router.patch('/:id/status', authenticate, authorize('super_admin', 'admin'), ctrl.updateStatus.bind(ctrl));
router.delete('/:id', authenticate, authorize('super_admin', 'admin'), ctrl.delete.bind(ctrl));

export default router;
