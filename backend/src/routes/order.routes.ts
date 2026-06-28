import { Router } from 'express';
import { OrderController } from '../controllers/order.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();
const ctrl = new OrderController();

// Customer routes
router.post('/', authenticate, ctrl.create.bind(ctrl));
router.get('/my', authenticate, ctrl.getMyOrders.bind(ctrl));
router.get('/my/:id', authenticate, ctrl.getMyOrder.bind(ctrl));
router.get('/track/:orderNumber', authenticate, ctrl.getByOrderNumber.bind(ctrl));
router.post('/my/:id/cancel', authenticate, ctrl.cancelOrder.bind(ctrl));
router.delete('/my/:id/abort-payment', authenticate, ctrl.abortPayment.bind(ctrl));

// Admin routes
router.get('/', authenticate, authorize('super_admin', 'admin'), ctrl.adminGetAll.bind(ctrl));
router.get('/:id', authenticate, authorize('super_admin', 'admin'), ctrl.adminGetOrder.bind(ctrl));
router.get('/:id/couriers', authenticate, authorize('super_admin', 'admin'), ctrl.getCourierRates.bind(ctrl));
router.get('/:id/shipment-tracking', authenticate, authorize('super_admin', 'admin'), ctrl.getShipmentTracking.bind(ctrl));
router.post('/:id/book-shipment', authenticate, authorize('super_admin', 'admin'), ctrl.bookShipment.bind(ctrl));
router.patch('/:id/status', authenticate, authorize('super_admin', 'admin'), ctrl.updateStatus.bind(ctrl));
router.patch('/:id/tracking', authenticate, authorize('super_admin', 'admin'), ctrl.updateTracking.bind(ctrl));

export default router;
