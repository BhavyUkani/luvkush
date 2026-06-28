import { db } from '../utils/database';
import { AppError } from '../middleware/error.middleware';

export class ReviewService {
  async getProductReviews(productId: number, page = 1, limit = 10) {
    const sql = `
      SELECT r.id, r.rating, r.title, r.body, r.is_verified_purchase,
        r.helpful_votes as helpful_count, r.created_at,
        u.first_name as user_name, u.last_name,
        SUBSTRING(u.email, 1, 3) as email_prefix
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      WHERE r.product_id = ? AND r.status = 'approved'
      ORDER BY r.helpful_votes DESC, r.created_at DESC
    `;
    return db.paginate(sql, [productId], page, limit);
  }

  async getRatingSummary(productId: number) {
    return db.queryOne<any>(`
      SELECT
        COUNT(*) as total,
        ROUND(AVG(rating), 1) as average,
        SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END) as five_star,
        SUM(CASE WHEN rating = 4 THEN 1 ELSE 0 END) as four_star,
        SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END) as three_star,
        SUM(CASE WHEN rating = 2 THEN 1 ELSE 0 END) as two_star,
        SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END) as one_star
      FROM reviews
      WHERE product_id = ? AND status = 'approved'
    `, [productId]);
  }

  async create(userId: number, data: {
    product_id: number;
    rating: number;
    title?: string;
    body: string;
  }) {
    // One review per user per product
    const existing = await db.queryOne(
      'SELECT id FROM reviews WHERE user_id = ? AND product_id = ?',
      [userId, data.product_id]
    );
    if (existing) throw new AppError('You have already reviewed this product', 400);

    if (data.rating < 1 || data.rating > 5) throw new AppError('Rating must be between 1 and 5', 400);
    if (!data.body?.trim()) throw new AppError('Review body is required', 400);

    // Check if user has purchased this product
    const hasPurchased = await db.queryOne<any>(`
      SELECT oi.id FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      WHERE o.user_id = ? AND oi.product_id = ? AND o.status IN ('delivered', 'completed')
      LIMIT 1
    `, [userId, data.product_id]);

    const result = await db.query<any>(`
      INSERT INTO reviews (user_id, product_id, rating, title, body, is_verified_purchase, status)
      VALUES (?, ?, ?, ?, ?, ?, 'approved')
    `, [
      userId, data.product_id, data.rating,
      data.title?.trim() || null, data.body.trim(),
      hasPurchased ? 1 : 0
    ]);

    await this.updateProductRating(data.product_id);
    return db.queryOne('SELECT * FROM reviews WHERE id = ?', [result.insertId]);
  }

  async markHelpful(reviewId: number, userId: number) {
    await db.query(
      'UPDATE reviews SET helpful_count = helpful_count + 1 WHERE id = ?',
      [reviewId]
    );
  }

  async adminGetAll(page = 1, limit = 20, status?: string) {
    const conditions = status ? ['r.status = ?'] : [];
    const params = status ? [status] : [];

    const sql = `
      SELECT r.*, u.first_name, u.last_name, u.email, p.name as product_name
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      JOIN products p ON r.product_id = p.id
      ${conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''}
      ORDER BY r.created_at DESC
    `;
    return db.paginate(sql, params, page, limit);
  }

  async updateStatus(id: number, status: string) {
    const valid = ['pending', 'approved', 'rejected'];
    if (!valid.includes(status)) throw new AppError('Invalid status', 400);

    const review = await db.queryOne<any>('SELECT product_id FROM reviews WHERE id = ?', [id]);
    if (!review) throw new AppError('Review not found', 404);

    await db.query('UPDATE reviews SET status = ?, updated_at = NOW() WHERE id = ?', [status, id]);
    await this.updateProductRating(review.product_id);
  }

  async delete(id: number) {
    const review = await db.queryOne<any>('SELECT product_id FROM reviews WHERE id = ?', [id]);
    if (!review) throw new AppError('Review not found', 404);
    await db.query('DELETE FROM reviews WHERE id = ?', [id]);
    await this.updateProductRating(review.product_id);
  }

  private async updateProductRating(productId: number) {
    await db.query(`
      UPDATE products SET
        rating_avg = (SELECT ROUND(AVG(rating), 2) FROM reviews WHERE product_id = ? AND status = 'approved'),
        rating_count = (SELECT COUNT(*) FROM reviews WHERE product_id = ? AND status = 'approved'),
        updated_at = NOW()
      WHERE id = ?
    `, [productId, productId, productId]);
  }
}
