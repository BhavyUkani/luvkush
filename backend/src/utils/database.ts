import mysql, { Pool, PoolConnection } from 'mysql2/promise';
import { config } from './config';
import { logger } from './logger';

class Database {
  private pool: Pool;

  constructor() {
    this.pool = mysql.createPool({
      host:     config.db.host,
      port:     config.db.port,
      database: config.db.name,
      user:     config.db.user,
      password: config.db.password,
      waitForConnections: true,
      connectionLimit:    config.db.poolMax,
      queueLimit:         0,
      enableKeepAlive:    true,
      keepAliveInitialDelay: 0,
      timezone: '+05:30',
      charset: 'utf8mb4',
    });

    this.pool.on('connection', () => {
      logger.debug('New MySQL connection established');
    });
  }

  async getConnection(): Promise<PoolConnection> {
    return this.pool.getConnection();
  }

  async query<T = any>(sql: string, params?: any[]): Promise<T> {
    const [rows] = await this.pool.execute(sql, params);
    return rows as T;
  }

  async queryOne<T = any>(sql: string, params?: any[]): Promise<T | null> {
    const rows = await this.query<T[]>(sql, params);
    return rows[0] || null;
  }

  async transaction<T>(callback: (conn: PoolConnection) => Promise<T>): Promise<T> {
    const conn = await this.getConnection();
    await conn.beginTransaction();
    try {
      const result = await callback(conn);
      await conn.commit();
      return result;
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  }

  async paginate<T>(
    sql: string,
    params: any[],
    page: number,
    limit: number
  ): Promise<{ data: T[]; total: number; page: number; pages: number; limit: number }> {
    const offset = (page - 1) * limit;
    const countSql = `SELECT COUNT(*) as total FROM (${sql}) as count_query`;
    const [countResult] = await this.pool.execute<any>(countSql, params);
    const total = countResult[0]?.total || 0;

    const paginatedSql = `${sql} LIMIT ? OFFSET ?`;
    const data = await this.query<T[]>(paginatedSql, [...params, limit, offset]);

    return {
      data,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit)
    };
  }
}

export const db = new Database();
