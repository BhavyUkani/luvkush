import { db } from '../utils/database';
import { AppError } from '../middleware/error.middleware';
import { generateSlug, generateSku } from '../utils/helpers';
import sharp from 'sharp';
import path from 'path';
import { config } from '../utils/config';

interface ProductFilters {
  page: number;
  limit: number;
  category?: string;
  sort: string;
  order: 'ASC' | 'DESC';
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  inStock?: boolean;
  featured?: boolean;
  userId?: number;
}

export class ProductService {
  private readonly ALLOWED_SORT = ['created_at', 'price', 'name', 'rating_avg', 'sales_count'];

  async getAdminAll(filters: { page: number; limit: number; search?: string; status?: string; category?: string }) {
    const { page, limit, search, status, category } = filters;
    const conditions: string[] = [];
    const params: any[] = [];

    if (status) {
      conditions.push('p.status = ?');
      params.push(status);
    }
    if (category) {
      conditions.push('(c.slug = ? OR c.id = ?)');
      params.push(category, category);
    }
    if (search) {
      conditions.push('(p.name LIKE ? OR p.sku LIKE ?)');
      const t = `%${search}%`;
      params.push(t, t);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const sql = `
      SELECT p.id, p.name, p.slug, p.sku, p.price, p.mrp, p.stock_quantity,
        p.status, p.is_featured, p.is_bestseller, p.is_new, p.primary_image,
        p.created_at, p.updated_at, c.name as category_name, c.id as category_id
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      ${where}
      ORDER BY p.created_at DESC
    `;
    return db.paginate(sql, params, page, limit);
  }

  async patch(id: number, data: { is_featured?: boolean; is_bestseller?: boolean; is_new?: boolean; status?: string; stock_quantity?: number }) {
    const updates: string[] = [];
    const params: any[] = [];

    if (data.is_featured !== undefined) { updates.push('is_featured = ?'); params.push(data.is_featured ? 1 : 0); }
    if (data.is_bestseller !== undefined) { updates.push('is_bestseller = ?'); params.push(data.is_bestseller ? 1 : 0); }
    if (data.is_new !== undefined) { updates.push('is_new = ?'); params.push(data.is_new ? 1 : 0); }
    if (data.status !== undefined) { updates.push('status = ?'); params.push(data.status); }
    if (data.stock_quantity !== undefined) { updates.push('stock_quantity = ?'); params.push(data.stock_quantity); }

    if (!updates.length) return;
    updates.push('updated_at = NOW()');
    params.push(id);
    await db.query(`UPDATE products SET ${updates.join(', ')} WHERE id = ?`, params);
  }

  async getAll(filters: ProductFilters) {
    const {
      page, limit, category, sort, order,
      minPrice, maxPrice, search, inStock, featured
    } = filters;

    const safeSort = this.ALLOWED_SORT.includes(sort) ? `p.${sort}` : 'p.created_at';
    const safeOrder = order === 'ASC' ? 'ASC' : 'DESC';

    const conditions: string[] = ['p.status = "active"'];
    const params: any[] = [];

    if (category) {
      conditions.push('(c.slug = ? OR c.id = ?)');
      params.push(category, category);
    }
    if (minPrice !== undefined) {
      conditions.push('p.price >= ?');
      params.push(minPrice);
    }
    if (maxPrice !== undefined) {
      conditions.push('p.price <= ?');
      params.push(maxPrice);
    }
    if (search) {
      conditions.push('(p.name LIKE ? OR p.description LIKE ? OR p.tags LIKE ?)');
      const term = `%${search}%`;
      params.push(term, term, term);
    }
    if (inStock) {
      conditions.push('p.stock_quantity > 0');
    }
    if (featured) {
      conditions.push('p.is_featured = 1');
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const sql = `
      SELECT
        p.id, p.name, p.slug, p.subtitle, p.price, p.mrp,
        p.stock_quantity, p.is_featured, p.is_bestseller, p.is_new,
        p.rating_avg, p.rating_count, p.sales_count,
        p.primary_image, p.images,
        p.short_description, p.badges, p.ingredients_list,
        c.name as category_name, c.slug as category_slug
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      ${where}
      ORDER BY ${safeSort} ${safeOrder}
    `;

    return db.paginate(sql, params, page, limit);
  }

  async getFeatured(limit: number) {
    return db.query(`
      SELECT p.id, p.name, p.slug, p.subtitle, p.price, p.mrp,
        p.rating_avg, p.rating_count, p.primary_image, p.images,
        p.is_bestseller, p.is_new, p.badges, p.ingredients_list,
        c.name as category_name, c.slug as category_slug
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.status = 'active' AND p.is_featured = 1
      ORDER BY p.sales_count DESC
      LIMIT ?
    `, [limit]);
  }

  async getBySlug(slug: string, userId?: number) {
    const product = await db.queryOne(`
      SELECT
        p.*,
        c.name as category_name, c.slug as category_slug
        ${userId ? ', (SELECT 1 FROM wishlists WHERE user_id = ? AND product_id = p.id LIMIT 1) as is_wishlisted' : ''}
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.slug = ? AND p.status = 'active'
    `, userId ? [userId, slug] : [slug]);

    if (!product) return null;

    // Fetch variants and reviews in separate queries (MariaDB 10.4 compatible)
    const [variants, recent_reviews] = await Promise.all([
      db.query(`
        SELECT id, name, value, price_modifier, stock_quantity as stock
        FROM product_variants
        WHERE product_id = ? AND status = 'active'
      `, [product.id]),
      db.query(`
        SELECT r.id, r.rating, r.title, r.body, r.created_at, u.first_name as user_name
        FROM reviews r
        JOIN users u ON r.user_id = u.id
        WHERE r.product_id = ? AND r.status = 'approved'
        ORDER BY r.created_at DESC
        LIMIT 5
      `, [product.id])
    ]);

    product.variants = variants;
    product.recent_reviews = recent_reviews;

    // Increment view count
    await db.query('UPDATE products SET view_count = view_count + 1 WHERE id = ?', [product.id]);

    return product;
  }

  async search(q: string, limit: number) {
    const term = `%${q}%`;
    return db.query(`
      SELECT id, name, slug, price, primary_image, category_id
      FROM products
      WHERE status = 'active' AND (name LIKE ? OR tags LIKE ? OR ingredients_list LIKE ?)
      ORDER BY sales_count DESC
      LIMIT ?
    `, [term, term, term, limit]);
  }

  async getRelated(productId: number) {
    return db.query(`
      SELECT p.id, p.name, p.slug, p.price, p.mrp, p.primary_image,
        p.rating_avg, p.rating_count
      FROM products p
      WHERE p.id != ?
        AND p.status = 'active'
        AND p.category_id = (SELECT category_id FROM products WHERE id = ?)
      ORDER BY p.sales_count DESC
      LIMIT 8
    `, [productId, productId]);
  }

  async create(data: any, files: Express.Multer.File[]) {
    const slug = await this.generateUniqueSlug(data.name);
    const sku = generateSku(data.name, data.category_id);

    // Process images
    const images: string[] = [];
    for (const file of files || []) {
      const imageName = await this.processImage(file);
      images.push(imageName);
    }

    const n = (v: any) => (v === undefined || v === '') ? null : v;

    const result = await db.query<any>(`
      INSERT INTO products (
        name, slug, sku, subtitle, description, short_description,
        how_to_use, benefits,
        price, mrp, cost_price, category_id, stock_quantity,
        is_featured, is_bestseller, is_new, status,
        primary_image, images, tags, ingredients_list, badges,
        seo_title, seo_description, seo_keywords,
        weight, length_cm, width_cm, height_cm,
        payment_mode, advance_amount, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      data.name, slug, sku, n(data.subtitle), n(data.description), n(data.short_description),
      n(data.how_to_use), n(data.benefits),
      Number(data.price), Number(data.mrp) || Number(data.price), n(data.cost_price) ? Number(data.cost_price) : null,
      data.category_id, data.stock_quantity || 0,
      data.is_featured || 0, data.is_bestseller || 0, data.is_new || 0, data.status || 'draft',
      images[0] || n(data.primary_image), images.length ? JSON.stringify(images) : (n(data.primary_image) ? JSON.stringify([data.primary_image]) : null),
      n(data.tags), n(data.ingredients_list), n(data.badges),
      n(data.seo_title), n(data.seo_description), n(data.seo_keywords),
      n(data.weight) ? Number(data.weight) : null,
      n(data.length_cm) ? Number(data.length_cm) : null,
      n(data.width_cm) ? Number(data.width_cm) : null,
      n(data.height_cm) ? Number(data.height_cm) : null,
      data.payment_mode || 'full_cod',
      n(data.advance_amount) ? Number(data.advance_amount) : null,
      null
    ]);

    return this.getById(result.insertId);
  }

  async update(id: number, data: any, files?: Express.Multer.File[]) {
    const product = await this.getById(id);
    if (!product) return null;

    // Process newly uploaded files
    const uploadedUrls: string[] = [];
    for (const file of files || []) {
      const imageName = await this.processImage(file);
      uploadedUrls.push(imageName);
    }

    // Parse existing image URLs the admin chose to keep (sent as JSON)
    let keptUrls: string[] = [];
    try {
      if (data.existing_images) keptUrls = JSON.parse(data.existing_images);
    } catch { /* ignore */ }

    const n = (v: any) => (v === undefined || v === '') ? null : v;

    // Merge: kept URLs (admin-ordered) + newly uploaded appended
    const allImages = [...keptUrls, ...uploadedUrls];
    const newPrimary = allImages.length ? allImages[0] : (n(data.primary_image) || product.primary_image);
    const newImages = allImages.length ? JSON.stringify(allImages) : product.images;

    await db.query(`
      UPDATE products SET
        name = ?, subtitle = ?, description = ?, short_description = ?,
        how_to_use = ?, benefits = ?,
        price = ?, mrp = ?, cost_price = ?, category_id = ?,
        stock_quantity = ?, is_featured = ?, is_bestseller = ?, is_new = ?,
        status = ?,
        tags = ?, ingredients_list = ?, badges = ?,
        seo_title = ?, seo_description = ?, seo_keywords = ?,
        weight = ?, length_cm = ?, width_cm = ?, height_cm = ?,
        payment_mode = ?, advance_amount = ?,
        primary_image = ?, images = ?,
        updated_at = NOW()
      WHERE id = ?
    `, [
      data.name, n(data.subtitle), n(data.description), n(data.short_description),
      n(data.how_to_use), n(data.benefits),
      Number(data.price), Number(data.mrp) || Number(data.price), n(data.cost_price) ? Number(data.cost_price) : null,
      data.category_id, data.stock_quantity ?? (product as any).stock_quantity,
      data.is_featured || 0, data.is_bestseller || 0, data.is_new || 0,
      data.status || (product as any).status || 'draft',
      n(data.tags), n(data.ingredients_list), n(data.badges),
      n(data.seo_title), n(data.seo_description), n(data.seo_keywords),
      n(data.weight) ? Number(data.weight) : null,
      n(data.length_cm) ? Number(data.length_cm) : null,
      n(data.width_cm) ? Number(data.width_cm) : null,
      n(data.height_cm) ? Number(data.height_cm) : null,
      data.payment_mode || 'full_cod',
      n(data.advance_amount) ? Number(data.advance_amount) : null,
      newPrimary, newImages,
      id
    ]);

    return this.getById(id);
  }

  async updateStatus(id: number, status: string) {
    const valid = ['active', 'draft', 'archived'];
    if (!valid.includes(status)) throw new AppError('Invalid status', 400);
    await db.query('UPDATE products SET status = ?, updated_at = NOW() WHERE id = ?', [status, id]);
  }

  async delete(id: number) {
    const product = await this.getById(id);
    if (!product) throw new AppError('Product not found', 404);

    await db.query('DELETE FROM products WHERE id = ?', [id]);

    // Non-fatal image file cleanup
    try {
      const fs = await import('fs');
      const imgPaths: string[] = [];
      if (product.primary_image) imgPaths.push(product.primary_image);
      try { imgPaths.push(...JSON.parse(product.images || '[]')); } catch { /* ignore */ }
      const seen = new Set<string>();
      for (const rel of imgPaths) {
        if (!rel || !rel.startsWith('/uploads/')) continue;
        const filename = path.basename(rel);
        const full = path.join(config.upload.dir, 'products', filename);
        if (!seen.has(full) && fs.existsSync(full)) { fs.unlinkSync(full); seen.add(full); }
      }
    } catch { /* non-fatal */ }
  }

  private async getById(id: number) {
    return db.queryOne('SELECT * FROM products WHERE id = ?', [id]);
  }

  private async generateUniqueSlug(name: string): Promise<string> {
    let slug = generateSlug(name);
    let counter = 0;
    while (true) {
      const existing = await db.queryOne(
        'SELECT id FROM products WHERE slug = ?',
        [counter ? `${slug}-${counter}` : slug]
      );
      if (!existing) return counter ? `${slug}-${counter}` : slug;
      counter++;
    }
  }

  private async processImage(file: Express.Multer.File): Promise<string> {
    const filename = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.webp`;
    const outputPath = path.join(config.upload.dir, 'products', filename);

    await sharp(file.buffer)
      .resize(800, 1000, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
      .webp({ quality: 85 })
      .toFile(outputPath);

    return `/uploads/products/${filename}`;
  }
}
