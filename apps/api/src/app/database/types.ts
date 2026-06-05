import { InjectionToken, ModuleMetadata } from '@nestjs/common';
import { NodePgDatabase, type NodePgQueryResultHKT } from 'drizzle-orm/node-postgres';
import type { PgDatabase } from 'drizzle-orm/pg-core';
import type { Schema } from '@chatty-nest/database';
import { Pool } from 'pg';

export const DB_TOKEN = Symbol('DB_TOKEN');

export type DrizzleDb = NodePgDatabase<Schema> & {
  $client: Pool;
};

export type Tx = PgDatabase<NodePgQueryResultHKT, Schema>;

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
