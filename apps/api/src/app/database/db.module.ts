import { DynamicModule, Global, Module } from '@nestjs/common';
import { DB_TOKEN, DrizzleAsyncOptions, DrizzleModuleOptions } from './types';
import databaseConfig, { DatabaseConfig } from '../config/database.config';
import { createDrizzleInstance } from './db.provider';

@Global()
@Module({})
export class DrizzleModule {
  static forRoot(options?: DrizzleModuleOptions): DynamicModule {
    return {
      module: DrizzleModule,
      providers: [
        {
          provide: DB_TOKEN,
          inject: [databaseConfig.KEY],
          useFactory: (databaseConfigValue: DatabaseConfig) => {
            return createDrizzleInstance({
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
      ],
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
          provide: DB_TOKEN,
          inject: options.inject ?? [],
          useFactory: async (...args: unknown[]) => {
            const moduleOptions = await options.useFactory(...args);
            return createDrizzleInstance(moduleOptions);
          },
        },
      ],
      exports: [DB_TOKEN],
    };
  }
}
