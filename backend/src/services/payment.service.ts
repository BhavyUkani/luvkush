import Razorpay from 'razorpay';
import crypto from 'crypto';
import { db } from '../utils/database';
import { AppError } from '../middleware/error.middleware';
import { config } from '../utils/config';
import { OrderService } from './order.service';

const orderService = new OrderService();

export class PaymentService {
  private _razorpay: Razorpay | null = null;

  private get razorpay(): Razorpay {
    if (!this._razorpay) {
      if (!config.razorpay.keyId || !config.razorpay.keySecret) {
        throw new AppError('Payment gateway not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.', 503);
      }
      this._razorpay = new Razorpay({
        key_id: config.razorpay.keyId,
        key_secret: config.razorpay.keySecret,
      });
    }
    return this._razorpay;
  }

  async createRazorpayOrder(orderId: number, userId: number, advanceAmountOverride?: number) {
    const order = await orderService.getById(orderId, userId);
    if (!order) throw new AppError('Order not found', 404);

    if (order.payment_status === 'paid') throw new AppError('Order already paid', 400);

    const chargeAmount = advanceAmountOverride ?? order.total_amount;
    const amountInPaise = Math.round(chargeAmount * 100);

    const rzpOrder = await this.razorpay.orders.create({
      amount: amountInPaise,
      currency: 'INR',
      receipt: order.order_number,
      notes: {
        order_id: String(orderId),
        user_id: String(userId),
      }
    });

    // Store Razorpay order ID
    await db.query(
      'UPDATE orders SET razorpay_order_id = ?, updated_at = NOW() WHERE id = ?',
      [rzpOrder.id, orderId]
    );

    return {
      razorpay_order_id: rzpOrder.id,
      amount: amountInPaise,
      currency: 'INR',
      order_number: order.order_number,
      key_id: config.razorpay.keyId,
    };
  }

  async verifyAndCapture(data: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
    order_id: number;
    user_id: number;
    advance_amount?: number;
  }) {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, order_id, user_id } = data;

    // Verify signature
    const expectedSig = crypto
      .createHmac('sha256', config.razorpay.keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expectedSig !== razorpay_signature) {
      throw new AppError('Payment verification failed', 400);
    }

    // Update order payment
    const isPartial = data.advance_amount != null;
    await db.query(`
      UPDATE orders SET
        payment_status = 'paid',
        razorpay_payment_id = ?,
        razorpay_signature = ?,
        status = 'confirmed',
        advance_paid_amount = ?,
        paid_at = NOW(),
        updated_at = NOW()
      WHERE id = ? AND user_id = ?
    `, [razorpay_payment_id, razorpay_signature, isPartial ? data.advance_amount : null, order_id, user_id]);

    // Log transaction
    await db.query(`
      INSERT INTO payment_transactions (order_id, gateway, gateway_order_id, gateway_payment_id, amount, status, created_at)
      SELECT id, 'razorpay', ?, ?, total_amount, 'success', NOW()
      FROM orders WHERE id = ?
    `, [razorpay_order_id, razorpay_payment_id, order_id]);

    // Clear the user's cart now that payment is confirmed
    await db.query(
      'DELETE ci FROM cart_items ci JOIN carts c ON ci.cart_id = c.id WHERE c.user_id = ?',
      [user_id]
    );

    return orderService.getById(order_id, user_id);
  }

  async handleWebhook(payload: any, signature: string) {
    const webhookSecret = process.env['RAZORPAY_WEBHOOK_SECRET'] || '';

    const expectedSig = crypto
      .createHmac('sha256', webhookSecret)
      .update(JSON.stringify(payload))
      .digest('hex');

    if (webhookSecret && expectedSig !== signature) {
      throw new AppError('Invalid webhook signature', 400);
    }

    const event = payload.event;
    const paymentEntity = payload.payload?.payment?.entity;

    if (event === 'payment.captured' && paymentEntity) {
      const rzpOrderId = paymentEntity.order_id;
      const order = await db.queryOne<any>(
        'SELECT id, user_id FROM orders WHERE razorpay_order_id = ?', [rzpOrderId]
      );
      if (order) {
        await db.query(`
          UPDATE orders SET payment_status = 'paid', status = 'confirmed',
            razorpay_payment_id = ?, paid_at = NOW(), updated_at = NOW()
          WHERE id = ?
        `, [paymentEntity.id, order.id]);
      }
    }

    if (event === 'payment.failed' && paymentEntity) {
      const rzpOrderId = paymentEntity.order_id;
      await db.query(
        'UPDATE orders SET payment_status = "failed", updated_at = NOW() WHERE razorpay_order_id = ?',
        [rzpOrderId]
      );
    }
  }

  async initiateRefund(orderId: number, amount?: number) {
    const order = await db.queryOne<any>(
      'SELECT razorpay_payment_id, total_amount FROM orders WHERE id = ?', [orderId]
    );
    if (!order?.razorpay_payment_id) throw new AppError('No payment found for this order', 400);

    const refundAmount = amount ? Math.round(amount * 100) : Math.round(order.total_amount * 100);

    const refund = await this.razorpay.payments.refund(order.razorpay_payment_id, {
      amount: refundAmount,
      speed: 'normal',
      notes: { order_id: String(orderId) }
    });

    await db.query(
      'UPDATE orders SET payment_status = "refunded", status = "refunded", updated_at = NOW() WHERE id = ?',
      [orderId]
    );

    return refund;
  }
}
