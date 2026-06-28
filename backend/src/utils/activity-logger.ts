import { db } from './database';

type Action =
  | 'product_created' | 'product_updated' | 'product_deleted'
  | 'category_created' | 'category_updated' | 'category_deleted'
  | 'order_status_changed' | 'order_shipment_booked'
  | 'admin_login';

interface LogParams {
  action: Action;
  userId?: number | null;
  module?: string;
  referenceType?: string;
  referenceId?: number;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
}

export async function logActivity(params: LogParams): Promise<void> {
  try {
    await db.query(
      `INSERT INTO activity_logs
         (user_id, action, module, reference_type, reference_id, old_values, new_values, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        params.userId ?? null,
        params.action,
        params.module ?? null,
        params.referenceType ?? null,
        params.referenceId ?? null,
        params.oldValues ? JSON.stringify(params.oldValues) : null,
        params.newValues ? JSON.stringify(params.newValues) : null,
      ]
    );
  } catch {
    // Never let logging failures crash the calling operation
  }
}
