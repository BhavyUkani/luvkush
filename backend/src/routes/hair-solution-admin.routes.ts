import { Router } from 'express';
import { HairSolutionAdminController } from '../controllers/hair-solution-admin.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { uploadSingleMiddleware } from '../middleware/upload.middleware';

const router = Router();
const ctrl = new HairSolutionAdminController();

router.use(authenticate, authorize('super_admin', 'admin'));

router.get('/',         ctrl.getAll.bind(ctrl));
router.get('/:id',      ctrl.getOne.bind(ctrl));
router.post('/',        ctrl.create.bind(ctrl));
router.put('/:id',      ctrl.update.bind(ctrl));
router.delete('/:id',   ctrl.delete.bind(ctrl));
router.post('/:id/upload-image', uploadSingleMiddleware('image'), ctrl.uploadImage.bind(ctrl));

export default router;
