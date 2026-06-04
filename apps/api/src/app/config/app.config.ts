import { z } from 'zod';
import { NODE_ENV } from './config.type';
import { registerAs } from '@nestjs/config';
import { validateConfig } from '@chatty-nest/shared-utils';

export const appConfigSchema = z.object({
  NODE_ENV: z.enum(NODE_ENV).default('development'),
  PORT: z.coerce.number().default(3000),
  JWT_PUBLIC_KEY: z.string(),
  JWT_PRIVATE_KEY: z.string(),
  JWT_EXPIRATION: z.coerce.number().default(3600),
});

export type AppConfig = z.infer<typeof appConfigSchema>;

export default registerAs('app', (): AppConfig => {
  const objectToValidate = {
    NODE_ENV: process.env.NODE_ENV,
    PORT: process.env.PORT,
    JWT_PUBLIC_KEY: process.env.JWT_PUBLIC_KEY,
    JWT_PRIVATE_KEY: process.env.JWT_PRIVATE_KEY,
    JWT_EXPIRATION: process.env.JWT_EXPIRATION,
  } as const satisfies Record<keyof AppConfig, unknown>;

  return validateConfig(appConfigSchema, objectToValidate);
});
