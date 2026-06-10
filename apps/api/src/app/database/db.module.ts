import { DynamicModule, Global, Module } from '@nestjs/common';
import {
  DB_TOKEN,
  DRIZZLE_CONNECTION_TOKEN,
  DrizzleAsyncOptions,
  DrizzleModuleOptions,
} from './types';
import databaseConfig, { DatabaseConfig } from '../config/database.config';
import { createDrizzleConnection, DrizzleConnection } from './db.provider';

@Global()
@Module({})
export class DrizzleModule {
  static forRoot(options?: DrizzleModuleOptions): DynamicModule {
    return {
      module: DrizzleModule,
      providers: [
        {
          provide: DRIZZLE_CONNECTION_TOKEN,
          inject: [databaseConfig.KEY],
          useFactory: async (databaseConfigValue: DatabaseConfig) => {
            return await createDrizzleConnection({
              connectionString:
                options?.connectionString ?? databaseConfigValue.DATABASE_URL,
              connectionTimeoutMillis:
                options?.connectionTimeoutMillis ??
                databaseConfigValue.DATABASE_POOL_CONNECTION_TIMEOUT,
              idleTimeoutMillis:
                options?.idleTimeoutMillis ??
                databaseConfigValue.DATABASE_POOL_IDLE_TIMEOUT,
              max: options?.max ?? databaseConfigValue.DATABASE_POOL_MAX,
              min: options?.min ?? databaseConfigValue.DATABASE_POOL_MIN,
            });
          },
        },
        {
          provide: DB_TOKEN,
          inject: [DRIZZLE_CONNECTION_TOKEN],
          useFactory: (connection: DrizzleConnection) => connection.db,
        },
      ],
      exports: [DB_TOKEN],
    };
  }

  static async forRootAsync(
    options: DrizzleAsyncOptions,
  ): Promise<DynamicModule> {
    return {
      module: DrizzleModule,
      imports: options.imports ?? [],
      providers: [
        {
          provide: DRIZZLE_CONNECTION_TOKEN,
          inject: options.inject ?? [],
          useFactory: async (...args: unknown[]) => {
            const moduleOptions = await options.useFactory(...args);
            return await createDrizzleConnection(moduleOptions);
          },
        },
        {
          provide: DB_TOKEN,
          inject: [DRIZZLE_CONNECTION_TOKEN],
          useFactory: (connection: DrizzleConnection) => connection.db,
        },
      ],
      exports: [DB_TOKEN],
    };
  }
}
