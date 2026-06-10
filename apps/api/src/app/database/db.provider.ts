import { Logger, OnApplicationShutdown, OnModuleDestroy } from '@nestjs/common';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { DrizzleDb, DrizzleModuleOptions } from './types';
import { schema } from '@chatty-nest/database';

const logger = new Logger('Database');

export class DrizzleConnection
  implements OnModuleDestroy, OnApplicationShutdown
{
  #isClosed = false;

  constructor(readonly db: DrizzleDb) {}

  async onModuleDestroy(): Promise<void> {
    await this.close();
  }

  async onApplicationShutdown(): Promise<void> {
    await this.close();
  }

  async close(): Promise<void> {
    if (this.#isClosed) return;
    this.#isClosed = true;
    await this.db.$client.end();
    logger.log('Database connection pool closed');
  }
}

export async function createDrizzleConnection(
  options: DrizzleModuleOptions,
): Promise<DrizzleConnection> {
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
      logger.log('Database connection established successfully');
      return new DrizzleConnection(drizzleInstance);
    })
    .catch((error) => {
      logger.error('Failed to establish database connection', error);
      // Clean up the pool if the connection test fails
      pool.end().catch((endError) => {
        logger.error(
          'Failed to close database pool after connection failure:',
          endError,
        );
      });
      throw error; // Rethrow the original connection error
    });
}

export async function createDrizzleInstance(
  options: DrizzleModuleOptions,
): Promise<DrizzleDb> {
  const connection = await createDrizzleConnection(options);
  return connection.db;
}

async function testDatabaseConnection(nodePgDb: DrizzleDb) {
  await nodePgDb.$client.query('SELECT 1');
}
