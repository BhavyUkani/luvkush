import { Router } from 'express';
import { WishlistController } from '../controllers/wishlist.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();
const ctrl = new WishlistController();

router.use(authenticate);

router.get('/', ctrl.getWishlist.bind(ctrl));
router.post('/:productId', ctrl.toggle.bind(ctrl));
router.delete('/:productId', ctrl.remove.bind(ctrl));
router.delete('/', ctrl.clear.bind(ctrl));

export default router;
