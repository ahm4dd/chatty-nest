import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { DrizzleModuleOptions } from './types';
import * as schema from '@chatty-nest/database';

export function createDrizzleInstance(options: DrizzleModuleOptions) {
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

function testDatabaseConnection(
  nodePgDb: NodePgDatabase<typeof schema> & {
    $client: Pool;
  },
) {
  return nodePgDb.$client.connect();
}
