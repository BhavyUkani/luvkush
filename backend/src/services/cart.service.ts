import { db } from '../utils/database';
import { AppError } from '../middleware/error.middleware';

export class CartService {
  async getOrCreate(userId: number) {
    let cart = await db.queryOne<any>('SELECT * FROM carts WHERE user_id = ?', [userId]);
    if (!cart) {
      const result = await db.query<any>('INSERT INTO carts (user_id) VALUES (?)', [userId]);
      cart = { id: result.insertId, user_id: userId };
    }
    return cart;
  }

  async getCart(userId: number) {
    const cart = await this.getOrCreate(userId);

    const items = await db.query(`
      SELECT
        ci.id, ci.product_id, ci.variant_id, ci.quantity,
        p.name, p.slug, p.price, p.mrp, p.primary_image, p.stock_quantity,
        p.status as product_status, p.payment_mode, p.advance_amount,
        pv.name as variant_name, pv.value as variant_value,
        pv.price_modifier, pv.stock_quantity as variant_stock
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.id
      LEFT JOIN product_variants pv ON ci.variant_id = pv.id
      WHERE ci.cart_id = ?
      ORDER BY ci.added_at DESC
    `, [cart.id]);

    const summary = this.computeSummary(items as any[]);
    return { cart_id: cart.id, items, ...summary };
  }

  async addItem(userId: number, productId: number, quantity: number, variantId?: number) {
    const product = await db.queryOne<any>(
      'SELECT id, price, stock_quantity, status FROM products WHERE id = ? AND status = "active"',
      [productId]
    );
    if (!product) throw new AppError('Product not found or unavailable', 404);

    let availableStock = product.stock_quantity;
    let priceModifier = 0;

    if (variantId) {
      const variant = await db.queryOne<any>(
        'SELECT id, price_modifier, stock_quantity, status FROM product_variants WHERE id = ? AND product_id = ? AND status = "active"',
        [variantId, productId]
      );
      if (!variant) throw new AppError('Product variant not found', 404);
      availableStock = variant.stock_quantity;
      priceModifier = variant.price_modifier || 0;
    }

    if (availableStock < quantity) {
      throw new AppError(`Only ${availableStock} units available`, 400);
    }

    const cart = await this.getOrCreate(userId);

    const existing = await db.queryOne<any>(`
      SELECT id, quantity FROM cart_items
      WHERE cart_id = ? AND product_id = ? AND ${variantId ? 'variant_id = ?' : 'variant_id IS NULL'}
    `, variantId ? [cart.id, productId, variantId] : [cart.id, productId]);

    if (existing) {
      const newQty = existing.quantity + quantity;
      if (newQty > availableStock) throw new AppError(`Only ${availableStock} units available`, 400);
      await db.query('UPDATE cart_items SET quantity = ? WHERE id = ?', [newQty, existing.id]);
    } else {
      const unitPrice = product.price + priceModifier;
      await db.query(`
        INSERT INTO cart_items (cart_id, product_id, variant_id, quantity, unit_price)
        VALUES (?, ?, ?, ?, ?)
      `, [cart.id, productId, variantId || null, quantity, unitPrice]);
    }

    return this.getCart(userId);
  }

  async updateItem(userId: number, itemId: number, quantity: number) {
    const cart = await this.getOrCreate(userId);
    const item = await db.queryOne<any>(
      'SELECT ci.*, p.stock_quantity, pv.stock_quantity as var_stock FROM cart_items ci JOIN products p ON ci.product_id = p.id LEFT JOIN product_variants pv ON ci.variant_id = pv.id WHERE ci.id = ? AND ci.cart_id = ?',
      [itemId, cart.id]
    );
    if (!item) throw new AppError('Cart item not found', 404);

    if (quantity <= 0) {
      await db.query('DELETE FROM cart_items WHERE id = ?', [itemId]);
    } else {
      const stock = item.variant_id ? item.var_stock : item.stock_quantity;
      if (quantity > stock) throw new AppError(`Only ${stock} units available`, 400);
      await db.query('UPDATE cart_items SET quantity = ? WHERE id = ?', [quantity, itemId]);
    }

    return this.getCart(userId);
  }

  async removeItem(userId: number, itemId: number) {
    const cart = await this.getOrCreate(userId);
    const item = await db.queryOne('SELECT id FROM cart_items WHERE id = ? AND cart_id = ?', [itemId, cart.id]);
    if (!item) throw new AppError('Cart item not found', 404);
    await db.query('DELETE FROM cart_items WHERE id = ?', [itemId]);
    return this.getCart(userId);
  }

  async clearCart(userId: number) {
    const cart = await this.getOrCreate(userId);
    await db.query('DELETE FROM cart_items WHERE cart_id = ?', [cart.id]);
  }

  async applyCoupon(userId: number, code: string) {
    const coupon = await db.queryOne<any>(`
      SELECT * FROM coupons
      WHERE code = ? AND is_active = 1
        AND (valid_from IS NULL OR valid_from <= NOW())
        AND (valid_until IS NULL OR valid_until >= NOW())
        AND (usage_limit IS NULL OR usage_count < usage_limit)
    `, [code]);

    if (!coupon) throw new AppError('Invalid or expired coupon code', 400);

    // Check per-user usage
    const userUsage = await db.queryOne<any>(
      'SELECT COUNT(*) as cnt FROM orders WHERE user_id = ? AND coupon_code = ? AND status != "cancelled"',
      [userId, code]
    );
    if (coupon.usage_per_user && userUsage?.cnt >= coupon.usage_per_user) {
      throw new AppError('You have already used this coupon', 400);
    }

    return { coupon };
  }

  private computeSummary(items: any[]) {
    const subtotal = items.reduce((sum, item) => {
      const price = item.variant_id ? item.price + (item.price_modifier || 0) : item.price;
      return sum + price * item.quantity;
    }, 0);
    const shipping = subtotal >= 999 ? 0 : 99;
    const tax = Math.round(subtotal * 0.18);
    const total = subtotal + shipping + tax;
    return { subtotal, shipping, tax, total, item_count: items.length };
  }
}
