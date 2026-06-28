import { db } from '../utils/database';
import { AppError } from '../middleware/error.middleware';
import bcrypt from 'bcryptjs';

export class UserService {
  async getProfile(userId: number) {
    return db.queryOne(`
      SELECT id, first_name, last_name, email, phone, avatar_url, role, status, email_verified_at, created_at
      FROM users WHERE id = ?
    `, [userId]);
  }

  async updateProfile(userId: number, data: {
    first_name?: string;
    last_name?: string;
    phone?: string;
    avatar_url?: string;
  }) {
    const updates: string[] = [];
    const params: any[] = [];

    if (data.first_name) { updates.push('first_name = ?'); params.push(data.first_name.trim()); }
    if (data.last_name) { updates.push('last_name = ?'); params.push(data.last_name.trim()); }
    if (data.phone) { updates.push('phone = ?'); params.push(data.phone.trim()); }
    if (data.avatar_url) { updates.push('avatar_url = ?'); params.push(data.avatar_url); }

    if (updates.length === 0) throw new AppError('No fields to update', 400);

    updates.push('updated_at = NOW()');
    params.push(userId);

    await db.query(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, params);
    return this.getProfile(userId);
  }

  async changePassword(userId: number, currentPassword: string, newPassword: string) {
    const user = await db.queryOne<any>('SELECT password_hash FROM users WHERE id = ?', [userId]);
    if (!user) throw new AppError('User not found', 404);

    const valid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!valid) throw new AppError('Current password is incorrect', 400);

    if (newPassword.length < 8) throw new AppError('New password must be at least 8 characters', 400);

    const hash = await bcrypt.hash(newPassword, 12);
    await db.query('UPDATE users SET password_hash = ?, updated_at = NOW() WHERE id = ?', [hash, userId]);
  }

  async getAddresses(userId: number) {
    return db.query(
      'SELECT id, label, recipient_name as full_name, phone, address_line1, address_line2, city, state, pincode, country, is_default, created_at FROM addresses WHERE user_id = ? ORDER BY is_default DESC, created_at DESC',
      [userId]
    );
  }

  async addAddress(userId: number, data: {
    label?: string;
    full_name?: string;
    recipient_name?: string;
    phone: string;
    address_line1: string;
    address_line2?: string;
    city: string;
    state: string;
    pincode: string;
    country?: string;
    is_default?: boolean;
  }) {
    const recipientName = data.full_name || data.recipient_name || '';

    if (data.is_default) {
      await db.query('UPDATE addresses SET is_default = 0 WHERE user_id = ?', [userId]);
    }

    const result = await db.query<any>(`
      INSERT INTO addresses (user_id, label, recipient_name, phone, address_line1, address_line2, city, state, pincode, country, is_default)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      userId, data.label || 'Home', recipientName, data.phone,
      data.address_line1, data.address_line2 || null,
      data.city, data.state, data.pincode, data.country || 'India',
      data.is_default ? 1 : 0
    ]);

    return db.queryOne(
      'SELECT id, label, recipient_name as full_name, phone, address_line1, address_line2, city, state, pincode, country, is_default FROM addresses WHERE id = ?',
      [result.insertId]
    );
  }

  async updateAddress(userId: number, addressId: number, data: any) {
    const address = await db.queryOne('SELECT id FROM addresses WHERE id = ? AND user_id = ?', [addressId, userId]);
    if (!address) throw new AppError('Address not found', 404);

    const recipientName = data.full_name || data.recipient_name || '';

    if (data.is_default) {
      await db.query('UPDATE addresses SET is_default = 0 WHERE user_id = ?', [userId]);
    }

    await db.query(`
      UPDATE addresses SET
        label = ?, recipient_name = ?, phone = ?,
        address_line1 = ?, address_line2 = ?,
        city = ?, state = ?, pincode = ?, country = ?,
        is_default = ?, updated_at = NOW()
      WHERE id = ? AND user_id = ?
    `, [
      data.label || 'Home', recipientName, data.phone,
      data.address_line1, data.address_line2 || null,
      data.city, data.state, data.pincode, data.country || 'India',
      data.is_default ? 1 : 0, addressId, userId
    ]);

    return db.queryOne(
      'SELECT id, label, recipient_name as full_name, phone, address_line1, address_line2, city, state, pincode, country, is_default FROM addresses WHERE id = ?',
      [addressId]
    );
  }

  async setDefaultAddress(userId: number, addressId: number) {
    const address = await db.queryOne('SELECT id FROM addresses WHERE id = ? AND user_id = ?', [addressId, userId]);
    if (!address) throw new AppError('Address not found', 404);
    await db.query('UPDATE addresses SET is_default = 0 WHERE user_id = ?', [userId]);
    await db.query('UPDATE addresses SET is_default = 1 WHERE id = ?', [addressId]);
  }

  async deleteAddress(userId: number, addressId: number) {
    const address = await db.queryOne('SELECT id FROM addresses WHERE id = ? AND user_id = ?', [addressId, userId]);
    if (!address) throw new AppError('Address not found', 404);
    await db.query('DELETE FROM addresses WHERE id = ?', [addressId]);
  }
}
