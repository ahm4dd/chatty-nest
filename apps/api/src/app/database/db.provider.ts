import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { DrizzleDb, DrizzleModuleOptions } from './types';
import { schema } from '@chatty-nest/database';

export async function createDrizzleInstance(options: DrizzleModuleOptions) {
  const pool = new Pool({
    connectionString: options.connectionString,
    max: options.max ?? 10,
    min: options.min ?? 2,
    idleTimeoutMillis: options.idleTimeoutMillis ?? 30_000,
    connectionTimeoutMillis: options.connectionTimeoutMillis ?? 5_000,
  });

  const drizzleInstance = drizzle({ client: pool, schema });
  // Test the connection immediately
  return testDatabaseConnection(drizzleInstance)
    .then(() => {
      console.log('Database connection established successfully');
      return drizzleInstance;
    })
    .catch((error) => {
      console.error('Failed to establish database connection:', error);
      // Clean up the pool if the connection test fails
      pool.end().catch((endError) => {
        console.error(
          'Failed to close database pool after connection failure:',
          endError,
        );
      });
      throw error; // Rethrow the original connection error
    });
}

async function testDatabaseConnection(nodePgDb: DrizzleDb) {
  return await nodePgDb.$client.connect();
}
