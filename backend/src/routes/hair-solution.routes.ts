import { Router } from 'express';
import { db } from '../utils/database';

const router = Router();

router.get('/', async (_req, res, next) => {
  try {
    const solutions = await db.query(`
      SELECT p.id, p.name, p.slug, p.subtitle, p.short_description,
        p.price, p.mrp, p.primary_image, p.rating_avg, p.rating_count,
        p.is_bestseller, p.badges,
        c.name as category_name, c.slug as category_slug
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.status = 'active'
        AND (c.slug IN ('hair-wigs', 'hair-patches', 'hair-extensions') OR p.tags LIKE '%hair-solution%')
      ORDER BY p.sales_count DESC
      LIMIT 20
    `);
    res.json({ success: true, data: solutions });
  } catch (err) { next(err); }
});

router.get('/wigs', async (req, res, next) => {
  try {
    const gender = req.query['gender'] as string;
    const conditions: string[] = ["hs.type = 'wig'", "hs.status = 'active'"];
    const params: any[] = [];
    if (gender) { conditions.push('hs.gender = ?'); params.push(gender); }
    const wigs = await db.query(`
      SELECT hs.id, hs.name, hs.slug, hs.short_description, hs.base_price as price, hs.mrp,
        hs.primary_image, hs.gender, hs.size_info, hs.colour_info, hs.status
      FROM hair_solutions hs
      WHERE ${conditions.join(' AND ')}
      ORDER BY hs.created_at DESC
    `, params);
    res.json({ success: true, data: wigs });
  } catch (err) { next(err); }
});

router.get('/patches', async (_req, res, next) => {
  try {
    const patches = await db.query(`
      SELECT hs.id, hs.name, hs.slug, hs.short_description, hs.base_price as price, hs.mrp,
        hs.primary_image, hs.size_info, hs.colour_info, hs.status
      FROM hair_solutions hs
      WHERE hs.type = 'patch' AND hs.status = 'active'
      ORDER BY hs.created_at DESC
    `);
    res.json({ success: true, data: patches });
  } catch (err) { next(err); }
});

router.get('/:slug', async (req, res, next) => {
  try {
    const item = await db.queryOne<any>('SELECT * FROM hair_solutions WHERE slug = ?', [req.params['slug']]);
    if (!item) { res.status(404).json({ success: false, message: 'Not found' }); return; }
    res.json({ success: true, data: item });
  } catch (err) { next(err); }
});

export default router;
