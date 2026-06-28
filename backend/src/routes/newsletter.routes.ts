import { Router } from 'express';
import { db } from '../utils/database';
import { AppError } from '../middleware/error.middleware';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

router.post('/subscribe', async (req, res, next) => {
  try {
    const { email, name } = req.body;
    if (!email?.trim()) throw new AppError('Email is required', 400);

    const existing = await db.queryOne<any>('SELECT id, status FROM newsletter_subscribers WHERE email = ?', [email.toLowerCase()]);
    if (existing) {
      if (existing.status !== 'active') {
        await db.query("UPDATE newsletter_subscribers SET status = 'active', subscribed_at = NOW() WHERE email = ?", [email.toLowerCase()]);
      }
      return res.json({ success: true, message: 'You are now subscribed!' });
    }

    await db.query(
      "INSERT INTO newsletter_subscribers (email, name, status, source) VALUES (?, ?, 'active', 'website')",
      [email.toLowerCase().trim(), name?.trim() || null]
    );
    res.status(201).json({ success: true, message: 'Successfully subscribed to our newsletter!' });
  } catch (err) { next(err); }
});

router.post('/unsubscribe', async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email?.trim()) throw new AppError('Email is required', 400);
    await db.query("UPDATE newsletter_subscribers SET status = 'unsubscribed', unsubscribed_at = NOW() WHERE email = ?", [email.toLowerCase()]);
    res.json({ success: true, message: 'Successfully unsubscribed.' });
  } catch (err) { next(err); }
});

router.get('/', authenticate, authorize('super_admin', 'admin'), async (req, res, next) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const sql = "SELECT id, email, name, status, subscribed_at FROM newsletter_subscribers ORDER BY subscribed_at DESC";
    const result = await db.paginate(sql, [], Number(page), Number(limit));
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
});

export default router;
