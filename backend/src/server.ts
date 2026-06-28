import 'dotenv/config';
import app from './app';
import { config } from './utils/config';
import { logger } from './utils/logger';
import { db } from './utils/database';

async function bootstrap(): Promise<void> {
  try {
    // Test database connection
    await db.getConnection().then(conn => {
      logger.info('✓ MySQL connected successfully');
      conn.release();
    });

    const server = app.listen(config.port, () => {
      logger.info(`

         
  Port:    ${config.port}               
  Mode:    ${config.nodeEnv.padEnd(10)} 
  Prefix: ${config.apiPrefix.padEnd(15)}

      `);
    });

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      logger.info(`Received ${signal}. Shutting down gracefully...`);
      server.close(() => {
        logger.info('HTTP server closed.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT',  () => shutdown('SIGINT'));

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

bootstrap();
