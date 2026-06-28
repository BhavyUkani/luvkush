import { db } from '../utils/database';
import { AppError } from '../middleware/error.middleware';

export class CouponService {
  async validate(code: string, userId: number, subtotal: number) {
    const coupon = await db.queryOne<any>(`
      SELECT * FROM coupons
      WHERE code = ? AND is_active = 1
        AND (valid_from IS NULL OR valid_from <= NOW())
        AND (valid_until IS NULL OR valid_until >= NOW())
        AND (usage_limit IS NULL OR usage_count < usage_limit)
    `, [code]);

    if (!coupon) throw new AppError('Invalid or expired coupon code', 400);

    if (coupon.min_order_amount && subtotal < coupon.min_order_amount) {
      throw new AppError(`Minimum order of ₹${coupon.min_order_amount} required for this coupon`, 400);
    }

    const userUsage = await db.queryOne<any>(
      'SELECT COUNT(*) as cnt FROM orders WHERE user_id = ? AND coupon_code = ? AND status != "cancelled"',
      [userId, code]
    );
    if (coupon.usage_per_user && userUsage?.cnt >= coupon.usage_per_user) {
      throw new AppError('You have already used this coupon', 400);
    }

    const discount = this.calculateDiscount(coupon, subtotal);
    return { coupon, discount };
  }

  async getAll(page = 1, limit = 20) {
    const sql = 'SELECT * FROM coupons ORDER BY created_at DESC';
    return db.paginate(sql, [], page, limit);
  }

  async getById(id: number) {
    return db.queryOne('SELECT * FROM coupons WHERE id = ?', [id]);
  }

  async create(data: any) {
    if (!data.code?.trim()) throw new AppError('Coupon code is required', 400);
    if (!data.discount_type || !['percentage', 'fixed', 'free_shipping'].includes(data.discount_type)) {
      throw new AppError('Invalid discount type', 400);
    }

    const code = data.code.trim().toUpperCase();
    const existing = await db.queryOne('SELECT id FROM coupons WHERE code = ?', [code]);
    if (existing) throw new AppError('Coupon code already exists', 400);

    const result = await db.query<any>(`
      INSERT INTO coupons (code, description, discount_type, discount_value, min_order_amount, max_discount_amount, usage_limit, usage_per_user, valid_from, valid_until, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      code, data.description || null, data.discount_type, data.discount_value,
      data.min_order_amount || null, data.max_discount_amount || null,
      data.usage_limit || null, data.usage_per_user || 1,
      data.valid_from || null, data.valid_until || null, 1
    ]);

    return this.getById(result.insertId);
  }

  async update(id: number, data: any) {
    const coupon = await this.getById(id);
    if (!coupon) throw new AppError('Coupon not found', 404);

    await db.query(`
      UPDATE coupons SET
        description = ?, discount_type = ?, discount_value = ?,
        min_order_amount = ?, max_discount_amount = ?, usage_limit = ?,
        usage_per_user = ?, valid_from = ?, valid_until = ?, is_active = ?,
        updated_at = NOW()
      WHERE id = ?
    `, [
      data.description || null, data.discount_type, data.discount_value,
      data.min_order_amount || null, data.max_discount_amount || null,
      data.usage_limit || null, data.usage_per_user || 1,
      data.valid_from || null, data.valid_until || null,
      data.is_active !== undefined ? data.is_active : 1, id
    ]);

    return this.getById(id);
  }

  async delete(id: number) {
    await db.query('DELETE FROM coupons WHERE id = ?', [id]);
  }

  private calculateDiscount(coupon: any, subtotal: number): number {
    if (coupon.discount_type === 'free_shipping') return 0;
    if (coupon.discount_type === 'fixed') {
      return Math.min(coupon.discount_value, subtotal);
    }
    // percentage
    const discount = Math.floor(subtotal * coupon.discount_value / 100);
    return coupon.max_discount_amount
      ? Math.min(discount, coupon.max_discount_amount)
      : discount;
  }
}
