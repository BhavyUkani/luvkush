import { Request, Response, NextFunction } from 'express';
import { PaymentService } from '../services/payment.service';
import { AppError } from '../middleware/error.middleware';

export class PaymentController {
  private service = new PaymentService();

  async createOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { order_id, advance_amount } = req.body;
      if (!order_id) throw new AppError('order_id is required', 400);
      const data = await this.service.createRazorpayOrder(
        Number(order_id), req.user!.userId,
        advance_amount ? Number(advance_amount) : undefined
      );
      res.json({ success: true, data });
    } catch (err) { next(err); }
  }

  async verify(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature, order_id, advance_amount } = req.body;
      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !order_id) {
        throw new AppError('Payment verification data incomplete', 400);
      }
      const order = await this.service.verifyAndCapture({
        razorpay_order_id, razorpay_payment_id, razorpay_signature,
        order_id: Number(order_id), user_id: req.user!.userId,
        advance_amount: advance_amount ? Number(advance_amount) : undefined
      });
      res.json({ success: true, data: order, message: 'Payment verified successfully' });
    } catch (err) { next(err); }
  }

  async webhook(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const signature = req.headers['x-razorpay-signature'] as string;
      await this.service.handleWebhook(req.body, signature);
      res.json({ success: true });
    } catch (err) { next(err); }
  }

  async refund(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { order_id, amount } = req.body;
      if (!order_id) throw new AppError('order_id is required', 400);
      const refund = await this.service.initiateRefund(Number(order_id), amount ? Number(amount) : undefined);
      res.json({ success: true, data: refund, message: 'Refund initiated' });
    } catch (err) { next(err); }
  }
}
