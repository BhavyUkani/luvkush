import { db } from '../utils/database';
import { AppError } from '../middleware/error.middleware';
import { CouponService } from './coupon.service';
import { CartService } from './cart.service';

const couponService = new CouponService();
const cartService = new CartService();

interface CreateOrderData {
  shipping_address: Record<string, any>;
  coupon_code?: string;
  notes?: string;
  payment_method: string;
}

export class OrderService {
  async createFromCart(userId: number, data: CreateOrderData) {
    const cart = await cartService.getCart(userId);
    if (!cart.items || cart.items.length === 0) throw new AppError('Cart is empty', 400);

    // Verify all items still available
    for (const item of cart.items as any[]) {
      if (item.product_status !== 'active') {
        throw new AppError(`"${item.name}" is no longer available`, 400);
      }
      const currentStock = item.variant_id ? item.variant_stock : item.stock_quantity;
      if (currentStock < item.quantity) {
        throw new AppError(`Insufficient stock for "${item.name}"`, 400);
      }
    }

    let subtotal = (cart as any).subtotal;
    let discount = 0;
    let couponCode: string | null = null;

    if (data.coupon_code) {
      try {
        const { coupon, discount: d } = await couponService.validate(data.coupon_code, userId, subtotal);
        discount = d;
        couponCode = coupon.code;
      } catch {
        // Coupon invalid — proceed without
      }
    }

    const shippingCost = (subtotal - discount) >= 999 ? 0 : 99;
    const taxAmount = Math.round((subtotal - discount) * 0.18);
    const totalAmount = subtotal - discount + shippingCost + taxAmount;

    const orderNumber = this.generateOrderNumber();

    const shippingAddressJson = JSON.stringify(data.shipping_address);

    const createdOrderId = await db.transaction(async (conn) => {
      // Create order
      const [orderResult] = await conn.execute<any>(`
        INSERT INTO orders (
          user_id, order_number, status, payment_status, payment_method,
          subtotal, discount_amount, shipping_amount, tax_amount, total_amount,
          coupon_code, coupon_discount,
          shipping_address,
          special_instructions, created_at, updated_at
        ) VALUES (?, ?, 'pending', 'pending', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `, [
        userId, orderNumber, data.payment_method,
        subtotal, discount, shippingCost, taxAmount, totalAmount,
        couponCode, discount,
        shippingAddressJson,
        data.notes || null
      ]);

      const orderId = orderResult.insertId;

      // Insert order items
      for (const item of cart.items as any[]) {
        const unitPrice = item.variant_id
          ? item.price + (item.price_modifier || 0)
          : item.price;
        const totalAmount = unitPrice * item.quantity;

        await conn.execute(`
          INSERT INTO order_items (order_id, product_id, variant_id, product_name, variant_name, quantity, unit_price, mrp, total_amount, primary_image)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [orderId, item.product_id, item.variant_id || null, item.name, item.variant_name || null, item.quantity, unitPrice, item.mrp || unitPrice, totalAmount, item.primary_image || null]);

        // Reduce stock
        if (item.variant_id) {
          await conn.execute(
            'UPDATE product_variants SET stock_quantity = stock_quantity - ? WHERE id = ?',
            [item.quantity, item.variant_id]
          );
        } else {
          await conn.execute(
            'UPDATE products SET stock_quantity = stock_quantity - ?, sales_count = sales_count + ? WHERE id = ?',
            [item.quantity, item.quantity, item.product_id]
          );
        }
      }

      // Increment coupon usage
      if (couponCode) {
        await conn.execute(
          'UPDATE coupons SET usage_count = usage_count + 1 WHERE code = ?',
          [couponCode]
        );
      }

      // Clear cart only for COD — for Razorpay, cart is cleared after payment verification
      if (data.payment_method !== 'razorpay') {
        await conn.execute('DELETE FROM cart_items WHERE cart_id = ?', [(cart as any).cart_id]);
      }

      return orderId;
    });

    return this.getById(createdOrderId, userId);
  }

  async getById(orderId: number, userId?: number) {
    const whereExtra = userId ? 'AND o.user_id = ?' : '';
    const params = userId ? [orderId, userId] : [orderId];

    const order = await db.queryOne<any>(`
      SELECT o.*,
        u.first_name, u.last_name, u.email, u.phone as user_phone
      FROM orders o
      JOIN users u ON o.user_id = u.id
      WHERE o.id = ? ${whereExtra}
    `, params);

    if (!order) return null;

    order.items = await db.query(`
      SELECT oi.*, p.slug as product_slug
      FROM order_items oi
      LEFT JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = ?
    `, [orderId]);

    return order;
  }

  async getByOrderNumber(orderNumber: string, userId?: number) {
    const whereExtra = userId ? 'AND o.user_id = ?' : '';
    const params = userId ? [orderNumber, userId] : [orderNumber];

    const order = await db.queryOne<any>(
      `SELECT * FROM orders o WHERE o.order_number = ? ${whereExtra}`,
      params
    );
    if (!order) return null;
    return this.getById(order.id);
  }

  async getUserOrders(userId: number, page = 1, limit = 10) {
    const sql = `
      SELECT o.id, o.order_number, o.status, o.payment_status, o.total_amount,
        o.created_at, COUNT(oi.id) as item_count,
        GROUP_CONCAT(oi.product_name SEPARATOR ', ') as product_names
      FROM orders o
      LEFT JOIN order_items oi ON oi.order_id = o.id
      WHERE o.user_id = ?
      GROUP BY o.id
      ORDER BY o.created_at DESC
    `;
    return db.paginate(sql, [userId], page, limit);
  }

  async adminGetAll(page = 1, limit = 20, filters: { status?: string; payment_status?: string; search?: string }) {
    const conditions: string[] = [];
    const params: any[] = [];

    if (filters.status) { conditions.push('o.status = ?'); params.push(filters.status); }
    if (filters.payment_status) { conditions.push('o.payment_status = ?'); params.push(filters.payment_status); }
    if (filters.search) {
      conditions.push('(o.order_number LIKE ? OR u.email LIKE ? OR u.first_name LIKE ?)');
      const t = `%${filters.search}%`;
      params.push(t, t, t);
    }

    const sql = `
      SELECT o.id, o.order_number, o.status, o.payment_status, o.payment_method,
        o.total_amount, o.tracking_number, o.tracking_url, o.created_at,
        u.first_name, u.last_name, u.email, u.phone,
        COUNT(oi.id) as item_count
      FROM orders o
      JOIN users u ON o.user_id = u.id
      LEFT JOIN order_items oi ON oi.order_id = o.id
      ${conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''}
      GROUP BY o.id
      ORDER BY o.created_at DESC
    `;
    return db.paginate(sql, params, page, limit);
  }

  async updateStatus(orderId: number, status: string, _adminNote?: string) {
    const validStatuses = ['pending', 'confirmed', 'processing', 'quality_check', 'shipped', 'out_for_delivery', 'delivered', 'cancelled', 'refund_requested', 'refunded', 'returned'];
    if (!validStatuses.includes(status)) throw new AppError('Invalid order status', 400);

    const order = await db.queryOne('SELECT id, status FROM orders WHERE id = ?', [orderId]);
    if (!order) throw new AppError('Order not found', 404);

    await db.query('UPDATE orders SET status = ?, updated_at = NOW() WHERE id = ?', [status, orderId]);

    // If cancelled — restore stock
    if (status === 'cancelled') {
      const items = await db.query<any[]>('SELECT * FROM order_items WHERE order_id = ?', [orderId]);
      for (const item of items) {
        if (item.variant_id) {
          await db.query('UPDATE product_variants SET stock_quantity = stock_quantity + ? WHERE id = ?', [item.quantity, item.variant_id]);
        } else {
          await db.query('UPDATE products SET stock_quantity = stock_quantity + ?, sales_count = GREATEST(0, sales_count - ?) WHERE id = ?', [item.quantity, item.quantity, item.product_id]);
        }
      }
    }
  }

  async updateTracking(orderId: number, data: { tracking_number: string; courier_name?: string; tracking_url?: string }) {
    await db.query(
      'UPDATE orders SET tracking_number = ?, tracking_url = ?, status = ?, updated_at = NOW() WHERE id = ?',
      [data.tracking_number, data.tracking_url || null, 'shipped', orderId]
    );
  }

  async cancelOrder(orderId: number, userId: number, reason: string) {
    const order = await db.queryOne<any>(
      'SELECT id, status, user_id FROM orders WHERE id = ? AND user_id = ?',
      [orderId, userId]
    );
    if (!order) throw new AppError('Order not found', 404);

    const cancellable = ['pending', 'confirmed'];
    if (!cancellable.includes(order.status)) {
      throw new AppError('Order cannot be cancelled at this stage', 400);
    }

    await this.updateStatus(orderId, 'cancelled', `Customer cancellation: ${reason}`);
  }

  async abortOnlineOrder(orderId: number, userId: number) {
    const order = await db.queryOne<any>(
      'SELECT id, status, payment_status FROM orders WHERE id = ? AND user_id = ?',
      [orderId, userId]
    );
    if (!order) throw new AppError('Order not found', 404);
    if (order.payment_status === 'paid') throw new AppError('Cannot abort a paid order', 400);

    const items = await db.query<any[]>('SELECT * FROM order_items WHERE order_id = ?', [orderId]);
    for (const item of items) {
      if (item.variant_id) {
        await db.query('UPDATE product_variants SET stock_quantity = stock_quantity + ? WHERE id = ?', [item.quantity, item.variant_id]);
      } else if (item.product_id) {
        await db.query(
          'UPDATE products SET stock_quantity = stock_quantity + ?, sales_count = GREATEST(0, sales_count - ?) WHERE id = ?',
          [item.quantity, item.quantity, item.product_id]
        );
      }
    }

    await db.query('DELETE FROM order_items WHERE order_id = ?', [orderId]);
    await db.query('DELETE FROM orders WHERE id = ?', [orderId]);
  }

  private generateOrderNumber(): string {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.random().toString(36).substring(2, 7).toUpperCase();
    return `LKN${year}${month}${day}${random}`;
  }
}
