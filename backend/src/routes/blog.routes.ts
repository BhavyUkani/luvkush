import { Router } from 'express';
import { db } from '../utils/database';
import { AppError } from '../middleware/error.middleware';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const { page = 1, limit = 9, tag } = req.query;
    const conditions = ["b.status = 'published'"];
    const params: any[] = [];

    if (tag) { conditions.push('b.tags LIKE ?'); params.push(`%${tag}%`); }

    const sql = `
      SELECT b.id, b.title, b.slug, b.excerpt, b.cover_image, b.tags,
        u.first_name as author_name, b.published_at, b.reading_time_mins
      FROM blog_posts b
      LEFT JOIN users u ON b.author_id = u.id
      WHERE ${conditions.join(' AND ')} ORDER BY b.published_at DESC
    `;
    const result = await db.paginate(sql, params, Number(page), Number(limit));
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
});

router.get('/:slug', async (req, res, next) => {
  try {
    const post = await db.queryOne(`
      SELECT b.*, u.first_name as author_name
      FROM blog_posts b
      LEFT JOIN users u ON b.author_id = u.id
      WHERE b.slug = ? AND b.status = 'published'
    `, [req.params['slug']]);
    if (!post) throw new AppError('Post not found', 404);
    await db.query('UPDATE blog_posts SET view_count = view_count + 1 WHERE slug = ?', [req.params['slug']]);
    res.json({ success: true, data: post });
  } catch (err) { next(err); }
});

// Admin CRUD
router.post('/', authenticate, authorize('super_admin', 'admin'), async (req, res, next) => {
  try {
    const { title, slug, content, excerpt, cover_image, tags, status = 'draft', reading_time_mins = 5 } = req.body;
    if (!title?.trim() || !slug?.trim()) throw new AppError('Title and slug are required', 400);

    const result = await db.query<any>(`
      INSERT INTO blog_posts (title, slug, content, excerpt, cover_image, tags, author_id, status, reading_time_mins, published_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ${status === 'published' ? 'NOW()' : 'NULL'})
    `, [title.trim(), slug.trim(), content, excerpt, cover_image, tags, req.user!.userId, status, reading_time_mins]);

    res.status(201).json({ success: true, data: { id: result.insertId } });
  } catch (err) { next(err); }
});

router.put('/:id', authenticate, authorize('super_admin', 'admin'), async (req, res, next) => {
  try {
    const { title, content, excerpt, cover_image, tags, status, reading_time_mins = 5 } = req.body;
    await db.query(`
      UPDATE blog_posts SET title = ?, content = ?, excerpt = ?, cover_image = ?,
        tags = ?, status = ?, reading_time_mins = ?,
        ${status === 'published' ? 'published_at = COALESCE(published_at, NOW()),' : ''}
        updated_at = NOW()
      WHERE id = ?
    `, [title, content, excerpt, cover_image, tags, status, reading_time_mins, req.params['id']]);
    res.json({ success: true, message: 'Post updated' });
  } catch (err) { next(err); }
});

router.delete('/:id', authenticate, authorize('super_admin', 'admin'), async (req, res, next) => {
  try {
    await db.query('DELETE FROM blog_posts WHERE id = ?', [req.params['id']]);
    res.json({ success: true, message: 'Post deleted' });
  } catch (err) { next(err); }
});

export default router;
