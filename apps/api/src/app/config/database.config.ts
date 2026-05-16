import { registerAs } from '@nestjs/config';
import { z } from 'zod';
import { validateConfig } from '@chatty-nest/shared-utils';

export const databaseConfigSchema = z
  .object({
    DATABASE_URL: z.url({ message: 'DATABASE_URL must be a valid URL' }),
    DATABASE_POOL_MIN: z.coerce.number().default(2),
    DATABASE_POOL_MAX: z.coerce.number().default(10),
    DATABASE_POOL_IDLE_TIMEOUT: z.coerce.number().default(10000),
    DATABASE_POOL_CONNECTION_TIMEOUT: z.coerce.number().default(5000),
  })
  .refine((data) => data.DATABASE_POOL_MIN < data.DATABASE_POOL_MAX, {
    message: 'DATABASE_POOL_MIN must be less than DATABASE_POOL_MAX',
    path: ['DATABASE_POOL_MIN'],
  });

export type DatabaseConfig = z.infer<typeof databaseConfigSchema>;

export default registerAs('database', (): DatabaseConfig => {
  const objectToValidate = {
    DATABASE_URL: process.env.DATABASE_URL,
    DATABASE_POOL_MIN: process.env.DATABASE_POOL_MIN,
    DATABASE_POOL_MAX: process.env.DATABASE_POOL_MAX,
    DATABASE_POOL_IDLE_TIMEOUT: process.env.DATABASE_POOL_IDLE_TIMEOUT,
    DATABASE_POOL_CONNECTION_TIMEOUT:
      process.env.DATABASE_POOL_CONNECTION_TIMEOUT,
  };

  return validateConfig(databaseConfigSchema, objectToValidate);
});
