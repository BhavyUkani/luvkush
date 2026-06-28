import { Router } from 'express';
import { PaymentController } from '../controllers/payment.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import express from 'express';

const router = Router();
const ctrl = new PaymentController();

// Razorpay webhook — raw body needed for signature verification
router.post('/webhook', express.raw({ type: 'application/json' }), ctrl.webhook.bind(ctrl));

// Authenticated routes
router.post('/create-order', authenticate, ctrl.createOrder.bind(ctrl));
router.post('/verify', authenticate, ctrl.verify.bind(ctrl));
router.post('/refund', authenticate, authorize('super_admin', 'admin'), ctrl.refund.bind(ctrl));

export default router;
