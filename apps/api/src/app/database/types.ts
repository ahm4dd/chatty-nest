import { InjectionToken, ModuleMetadata } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type { Schema } from '@chatty-nest/database';
import { Pool } from 'pg';

export const DB_TOKEN = Symbol('DB_TOKEN');

export type DrizzleDb = NodePgDatabase<Schema> & {
  $client: Pool;
};

export interface DrizzleModuleOptions {
  connectionString: string;
  min?: number;
  max?: number;
  idleTimeoutMillis?: number;
  connectionTimeoutMillis?: number;
}

export interface DrizzleAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
  inject?: InjectionToken[];
  useFactory: (
    ...args: unknown[]
  ) => DrizzleModuleOptions | Promise<DrizzleModuleOptions>;
}
