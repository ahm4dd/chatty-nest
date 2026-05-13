import { InjectionToken, ModuleMetadata } from '@nestjs/common';

export const DB_TOKEN = Symbol('DB_TOKEN');

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
