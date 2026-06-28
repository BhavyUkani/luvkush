import { Router } from 'express';
import { db } from '../utils/database';
import { AppError } from '../middleware/error.middleware';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { EmailService } from '../services/email.service';

const router = Router();
const emailService = new EmailService();

router.post('/', async (req, res, next) => {
  try {
    const { name, email, phone, subject, message, query_type } = req.body;
    if (!name?.trim() || !email?.trim() || !message?.trim()) {
      throw new AppError('Name, email, and message are required', 400);
    }

    await db.query(`
      INSERT INTO contact_queries (name, email, phone, subject, message, query_type, status, source)
      VALUES (?, ?, ?, ?, ?, ?, 'open', 'website')
    `, [
      name.trim(), email.toLowerCase().trim(), phone?.trim() || null,
      subject?.trim() || null, message.trim(), query_type || 'general'
    ]);

    // Send acknowledgement email (fire and forget)
    emailService.sendContactAcknowledgement(email, name).catch(() => {});

    res.status(201).json({ success: true, message: 'Your message has been received. We will get back to you within 24 hours.' });
  } catch (err) { next(err); }
});

router.get('/', authenticate, authorize('super_admin', 'admin'), async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const conditions = status ? ['status = ?'] : [];
    const params = status ? [status] : [];
    const sql = `SELECT * FROM contact_queries ${conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''} ORDER BY created_at DESC`;
    const result = await db.paginate(sql, params, Number(page), Number(limit));
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
});

router.patch('/:id/status', authenticate, authorize('super_admin', 'admin'), async (req, res, next) => {
  try {
    const { status } = req.body;
    await db.query('UPDATE contact_queries SET status = ?, updated_at = NOW() WHERE id = ?', [status, req.params['id']]);
    res.json({ success: true, message: 'Status updated' });
  } catch (err) { next(err); }
});

export default router;
