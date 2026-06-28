import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();
const ctrl = new UserController();

router.use(authenticate);

router.get('/profile', ctrl.getProfile.bind(ctrl));
router.put('/profile', ctrl.updateProfile.bind(ctrl));
router.post('/change-password', ctrl.changePassword.bind(ctrl));

router.get('/addresses', ctrl.getAddresses.bind(ctrl));
router.post('/addresses', ctrl.addAddress.bind(ctrl));
router.put('/addresses/:id', ctrl.updateAddress.bind(ctrl));
router.put('/addresses/:id/default', ctrl.setDefaultAddress.bind(ctrl));
router.delete('/addresses/:id', ctrl.deleteAddress.bind(ctrl));

export default router;
