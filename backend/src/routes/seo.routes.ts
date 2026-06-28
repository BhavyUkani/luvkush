import { Router } from 'express';
import { db } from '../utils/database';

const router = Router();

// Returns SEO metadata for a given path (used by SSR)
router.get('/meta', async (req, res, next) => {
  try {
    const { path: urlPath } = req.query;
    if (!urlPath) return res.json({ success: true, data: null });

    // Try product first
    if (String(urlPath).startsWith('/products/')) {
      const slug = String(urlPath).replace('/products/', '');
      const product = await db.queryOne<any>(
        'SELECT name, seo_title, seo_description, seo_keywords, primary_image FROM products WHERE slug = ? AND status = "active"',
        [slug]
      );
      if (product) {
        return res.json({ success: true, data: {
          title: product.seo_title || product.name,
          description: product.seo_description,
          keywords: product.seo_keywords,
          image: product.primary_image,
        }});
      }
    }

    // Try category
    if (String(urlPath).startsWith('/collections/')) {
      const slug = String(urlPath).replace('/collections/', '');
      const category = await db.queryOne<any>(
        'SELECT name, meta_title, meta_description FROM categories WHERE slug = ? AND is_active = 1',
        [slug]
      );
      if (category) {
        return res.json({ success: true, data: {
          title: category.meta_title || category.name,
          description: category.meta_description,
        }});
      }
    }

    res.json({ success: true, data: null });
  } catch (err) { next(err); }
});

export default router;
