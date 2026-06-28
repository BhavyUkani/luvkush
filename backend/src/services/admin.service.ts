import { db } from '../utils/database';

export class AdminService {
  async getDashboardStats() {
    const [orders, revenue, customers, products] = await Promise.all([
      db.queryOne<any>(`
        SELECT
          COUNT(*) as total,
          SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
          SUM(CASE WHEN status = 'processing' THEN 1 ELSE 0 END) as processing,
          SUM(CASE WHEN status = 'shipped' THEN 1 ELSE 0 END) as shipped,
          SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) as delivered,
          SUM(CASE WHEN DATE(created_at) = CURDATE() THEN 1 ELSE 0 END) as today,
          SUM(CASE WHEN YEARWEEK(created_at, 1) = YEARWEEK(CURDATE(), 1) THEN 1 ELSE 0 END) as this_week
        FROM orders WHERE status != 'cancelled'
      `),
      db.queryOne<any>(`
        SELECT
          SUM(total_amount) as total,
          SUM(CASE WHEN DATE(created_at) = CURDATE() THEN total_amount ELSE 0 END) as today,
          SUM(CASE WHEN YEARWEEK(created_at, 1) = YEARWEEK(CURDATE(), 1) THEN total_amount ELSE 0 END) as this_week,
          SUM(CASE WHEN MONTH(created_at) = MONTH(CURDATE()) AND YEAR(created_at) = YEAR(CURDATE()) THEN total_amount ELSE 0 END) as this_month
        FROM orders WHERE payment_status = 'paid'
      `),
      db.queryOne<any>(`
        SELECT
          COUNT(*) as total,
          SUM(CASE WHEN DATE(created_at) = CURDATE() THEN 1 ELSE 0 END) as today,
          SUM(CASE WHEN YEARWEEK(created_at, 1) = YEARWEEK(CURDATE(), 1) THEN 1 ELSE 0 END) as this_week
        FROM users WHERE role = 'customer'
      `),
      db.queryOne<any>(`
        SELECT
          COUNT(*) as total,
          SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active,
          SUM(CASE WHEN stock_quantity = 0 THEN 1 ELSE 0 END) as out_of_stock,
          SUM(CASE WHEN stock_quantity > 0 AND stock_quantity <= 10 THEN 1 ELSE 0 END) as low_stock
        FROM products
      `)
    ]);

    const recentOrders = await db.query(`
      SELECT o.id, o.order_number, o.status, o.total_amount, o.created_at,
        u.first_name, u.last_name
      FROM orders o JOIN users u ON o.user_id = u.id
      ORDER BY o.created_at DESC LIMIT 10
    `);

    const topProducts = await db.query(`
      SELECT p.id, p.name, p.slug, p.primary_image, p.price, p.sales_count, p.stock_quantity
      FROM products p WHERE p.status = 'active'
      ORDER BY p.sales_count DESC LIMIT 10
    `);

    const revenueChart = await db.query(`
      SELECT
        DATE(created_at) as date,
        SUM(total_amount) as revenue,
        COUNT(*) as orders
      FROM orders
      WHERE payment_status = 'paid'
        AND created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `);

    return { orders, revenue, customers, products, recentOrders, topProducts, revenueChart };
  }

  async getCustomers(page = 1, limit = 20, search?: string) {
    const conditions: string[] = ["role = 'customer'"];
    const params: any[] = [];

    if (search) {
      conditions.push('(first_name LIKE ? OR last_name LIKE ? OR email LIKE ?)');
      const t = `%${search}%`;
      params.push(t, t, t);
    }

    const sql = `
      SELECT u.id, u.first_name, u.last_name, u.email, u.phone, u.status, u.created_at,
        COUNT(DISTINCT o.id) as order_count,
        COALESCE(SUM(o.total_amount), 0) as total_spent
      FROM users u
      LEFT JOIN orders o ON o.user_id = u.id AND o.payment_status = 'paid'
      WHERE ${conditions.join(' AND ')}
      GROUP BY u.id
      ORDER BY u.created_at DESC
    `;
    return db.paginate(sql, params, page, limit);
  }

  async getInventoryAlerts() {
    const [outOfStock, lowStock] = await Promise.all([
      db.query(`
        SELECT id, name, slug, sku, stock_quantity, primary_image
        FROM products WHERE status = 'active' AND stock_quantity = 0
        ORDER BY sales_count DESC
      `),
      db.query(`
        SELECT id, name, slug, sku, stock_quantity, primary_image
        FROM products WHERE status = 'active' AND stock_quantity > 0 AND stock_quantity <= 10
        ORDER BY stock_quantity ASC
      `)
    ]);
    return { out_of_stock: outOfStock, low_stock: lowStock };
  }

  async updateInventory(productId: number, quantity: number) {
    await db.query(
      'UPDATE products SET stock_quantity = ?, updated_at = NOW() WHERE id = ?',
      [quantity, productId]
    );
  }

  async getRevenueReport(period: 'daily' | 'weekly' | 'monthly') {
    const groupBy = period === 'daily'
      ? 'DATE(created_at)'
      : period === 'weekly'
        ? 'YEARWEEK(created_at, 1)'
        : 'DATE_FORMAT(created_at, "%Y-%m")';

    return db.query(`
      SELECT
        ${groupBy} as period,
        COUNT(*) as orders,
        SUM(total_amount) as revenue,
        SUM(discount_amount) as discounts,
        AVG(total_amount) as avg_order_value
      FROM orders
      WHERE payment_status = 'paid'
        AND created_at >= DATE_SUB(CURDATE(), INTERVAL ${period === 'daily' ? 30 : period === 'weekly' ? 12 : 12} ${period === 'daily' ? 'DAY' : period === 'weekly' ? 'WEEK' : 'MONTH'})
      GROUP BY ${groupBy}
      ORDER BY period ASC
    `);
  }
}
