import { db } from '../utils/database';

function slug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export class HairSolutionAdminService {

  async getAll(type?: 'wig' | 'patch') {
    const where = type ? `WHERE hs.type = ?` : '';
    const params = type ? [type] : [];
    return db.query(`
      SELECT hs.*, c.name as category_name
      FROM hair_solutions hs
      LEFT JOIN categories c ON hs.category_id = c.id
      ${where}
      ORDER BY hs.created_at DESC
    `, params);
  }

  async getById(id: number) {
    return db.queryOne<any>('SELECT * FROM hair_solutions WHERE id = ?', [id]);
  }

  async syncVariants(productId: number, sizeInfo: string | null) {
    await db.query('DELETE FROM product_variants WHERE product_id = ?', [productId]);
    if (!sizeInfo) return;
    const sizes = sizeInfo.split(',').map(s => s.trim()).filter(Boolean);
    for (let i = 0; i < sizes.length; i++) {
      const sizeVal = sizes[i];
      await db.query(`
        INSERT INTO product_variants
          (product_id, name, value, sku, price_modifier, stock_quantity, status, display_order)
        VALUES (?, 'Size', ?, ?, 0.00, 99, 'active', ?)
      `, [productId, sizeVal, `LKN-HSVAR-${productId}-${i}`, i + 1]);
    }
  }

  async create(data: any) {
    const s = data.slug || slug(data.name);

    // 1. Create matching entry in products table
    const productResult = await db.query<any>(`
      INSERT INTO products
        (category_id, name, slug, sku, subtitle, description, short_description, how_to_use, price, mrp, stock_quantity, status, payment_mode, advance_amount, tags)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      data.category_id || 4,
      data.name,
      s,
      `LKN-HS-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      data.type === 'wig' ? 'Hair Wig' : 'Hair Patch',
      data.description || null,
      data.short_description || null,
      data.how_to_use || null,
      Number(data.base_price) || 0,
      data.mrp ? Number(data.mrp) : null,
      99,
      data.status || 'active',
      data.payment_mode || 'full_cod',
      data.advance_amount ? Number(data.advance_amount) : null,
      'hair-solution'
    ]);
    const productId = productResult.insertId;

    // 2. Create size variants
    await this.syncVariants(productId, data.size_info);

    // 3. Create hair solution with product_id link
    const result = await db.query<any>(`
      INSERT INTO hair_solutions
        (category_id, name, slug, description, short_description, base_price, mrp,
         gender, size_info, colour_info, how_to_use, type, status, product_id, payment_mode, advance_amount)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      data.category_id || 4,
      data.name,
      s,
      data.description || null,
      data.short_description || null,
      Number(data.base_price) || 0,
      data.mrp ? Number(data.mrp) : null,
      data.gender || null,
      data.size_info || null,
      data.colour_info || null,
      data.how_to_use || null,
      data.type || 'wig',
      data.status || 'active',
      productId,
      data.payment_mode || 'full_cod',
      data.advance_amount ? Number(data.advance_amount) : null
    ]);

    return this.getById(result.insertId);
  }

  async update(id: number, data: any) {
    const item = await this.getById(id);
    if (!item) return null;

    let productId = item.product_id;

    // 1. Sync / Create product if not exists
    if (!productId) {
      const s = data.slug || item.slug || slug(data.name || item.name);
      const productResult = await db.query<any>(`
        INSERT INTO products
          (category_id, name, slug, sku, subtitle, description, short_description, how_to_use, price, mrp, stock_quantity, status, payment_mode, advance_amount, tags)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        data.category_id || item.category_id || 4,
        data.name || item.name,
        s,
        `LKN-HS-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        (data.type || item.type) === 'wig' ? 'Hair Wig' : 'Hair Patch',
        data.description || item.description || null,
        data.short_description || item.short_description || null,
        data.how_to_use || item.how_to_use || null,
        Number(data.base_price !== undefined ? data.base_price : item.base_price) || 0,
        data.mrp !== undefined ? (data.mrp ? Number(data.mrp) : null) : (item.mrp ? Number(item.mrp) : null),
        99,
        data.status || item.status || 'active',
        data.payment_mode || item.payment_mode || 'full_cod',
        data.advance_amount !== undefined ? (data.advance_amount ? Number(data.advance_amount) : null) : (item.advance_amount ? Number(item.advance_amount) : null),
        'hair-solution'
      ]);
      productId = productResult.insertId;
      await db.query('UPDATE hair_solutions SET product_id = ? WHERE id = ?', [productId, id]);
    } else {
      // Update existing product
      const pFields: string[] = [];
      const pParams: any[] = [];
      const pMap: Record<string, any> = {
        name: data.name,
        slug: data.slug || (data.name ? slug(data.name) : undefined),
        description: data.description,
        short_description: data.short_description,
        how_to_use: data.how_to_use,
        price: data.base_price != null ? Number(data.base_price) : undefined,
        mrp: data.mrp !== undefined ? (data.mrp ? Number(data.mrp) : null) : undefined,
        status: data.status,
        payment_mode: data.payment_mode,
        advance_amount: data.advance_amount !== undefined ? (data.advance_amount ? Number(data.advance_amount) : null) : undefined,
        category_id: data.category_id || item.category_id || 4
      };

      for (const [k, v] of Object.entries(pMap)) {
        if (v !== undefined) { pFields.push(`${k} = ?`); pParams.push(v ?? null); }
      }

      if (pFields.length > 0) {
        pParams.push(productId);
        await db.query(`UPDATE products SET ${pFields.join(', ')}, updated_at = NOW() WHERE id = ?`, pParams);
      }
    }

    // 2. Update hair solutions table
    const fields: string[] = [];
    const params: any[] = [];

    const map: Record<string, any> = {
      name: data.name, slug: data.slug || (data.name ? slug(data.name) : undefined), description: data.description, short_description: data.short_description,
      base_price: data.base_price != null ? Number(data.base_price) : undefined,
      mrp: data.mrp !== undefined ? (data.mrp ? Number(data.mrp) : null) : undefined,
      gender: data.gender, size_info: data.size_info, colour_info: data.colour_info,
      how_to_use: data.how_to_use, status: data.status, category_id: data.category_id || item.category_id || 4,
      payment_mode: data.payment_mode,
      advance_amount: data.advance_amount !== undefined ? (data.advance_amount ? Number(data.advance_amount) : null) : undefined
    };

    for (const [k, v] of Object.entries(map)) {
      if (v !== undefined) { fields.push(`${k} = ?`); params.push(v ?? null); }
    }

    if (fields.length > 0) {
      params.push(id);
      await db.query(`UPDATE hair_solutions SET ${fields.join(', ')}, updated_at = NOW() WHERE id = ?`, params);
    }

    // 3. Sync size variants if updated
    if (data.size_info !== undefined) {
      await this.syncVariants(productId, data.size_info);
    }

    return this.getById(id);
  }

  async updateImages(id: number, primaryImage: string, imagesJson: string) {
    await db.query(
      'UPDATE hair_solutions SET primary_image = ?, images = ?, updated_at = NOW() WHERE id = ?',
      [primaryImage, imagesJson, id]
    );
    const item = await this.getById(id);
    if (item && item.product_id) {
      await db.query(
        'UPDATE products SET primary_image = ?, images = ?, updated_at = NOW() WHERE id = ?',
        [primaryImage, imagesJson, item.product_id]
      );
    }
    return item;
  }

  async delete(id: number) {
    const item = await this.getById(id);
    if (item && item.product_id) {
      await db.query('DELETE FROM products WHERE id = ?', [item.product_id]);
    }
    await db.query('DELETE FROM hair_solutions WHERE id = ?', [id]);
  }
}
