import { Router } from 'express';
import { CouponController } from '../controllers/coupon.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();
const ctrl = new CouponController();

router.post('/validate', authenticate, ctrl.validate.bind(ctrl));
router.get('/', authenticate, authorize('super_admin', 'admin'), ctrl.getAll.bind(ctrl));
router.post('/', authenticate, authorize('super_admin', 'admin'), ctrl.create.bind(ctrl));
router.put('/:id', authenticate, authorize('super_admin', 'admin'), ctrl.update.bind(ctrl));
router.delete('/:id', authenticate, authorize('super_admin', 'admin'), ctrl.delete.bind(ctrl));

export default router;
