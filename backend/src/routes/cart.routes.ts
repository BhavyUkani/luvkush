import { Router } from 'express';
import { CartController } from '../controllers/cart.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();
const ctrl = new CartController();

router.use(authenticate);

router.get('/', ctrl.getCart.bind(ctrl));
router.post('/items', ctrl.addItem.bind(ctrl));
router.put('/items/:itemId', ctrl.updateItem.bind(ctrl));
router.delete('/items/:itemId', ctrl.removeItem.bind(ctrl));
router.delete('/', ctrl.clearCart.bind(ctrl));
router.post('/coupon', ctrl.applyCoupon.bind(ctrl));

export default router;
