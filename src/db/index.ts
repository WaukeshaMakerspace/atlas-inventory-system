import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from './schema';

const globalForDb = globalThis as unknown as {
  pool: mysql.Pool | undefined;
};

const pool = globalForDb.pool ?? mysql.createPool({
  uri: process.env.DATABASE_URL,
});

if (process.env.NODE_ENV !== 'production') globalForDb.pool = pool;

export const db = drizzle(pool, { schema, mode: 'default' });
