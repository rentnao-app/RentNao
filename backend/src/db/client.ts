/**
 * PostgreSQL database client configuration
 */

import { Pool } from 'pg';
import { env } from '@/config/env';

// Prevent multiple pool instances in development
const globalForDb = globalThis as unknown as {
  pool: Pool | undefined;
  isDbShuttingDown: boolean | undefined;
};

export const db = globalForDb.pool ??
  new Pool({
    connectionString: env.DATABASE_URL,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });

if (env.NODE_ENV !== 'production') {
  globalForDb.pool = db;
}

// Log pool errors (for idle connections)
db.on('error', (err: any) => {
  console.error('[Database] Pool error:', {
    message: err.message,
    code: err.code,
    severity: err.severity,
  });
});

/**
 * Check if database is connected and healthy
 */
export async function checkDbHealth(): Promise<boolean> {
  try {
    await db.query('SELECT 1');
    return true;
  } catch (error: any) {
    console.error('[Database] Health check failed:', {
      message: error.message,
      code: error.code,
    });
    return false;
  }
}

/**
 * Close database pool gracefully
 */
export async function closeDbConnection(): Promise<void> {
  if (globalForDb.isDbShuttingDown) {
    return;
  }

  globalForDb.isDbShuttingDown = true;
  console.log('[Database] Closing pool...');
  try {
    await db.end();
    console.log('[Database] Pool closed');
  } catch (error: any) {
    if (!error?.message?.includes('Called end on pool more than once')) {
      console.error('[Database] Error while closing pool:', {
        message: error?.message,
      });
    }
  }
}