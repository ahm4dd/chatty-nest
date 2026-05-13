import { z } from 'zod';
import { NODE_ENV } from './config.type';
import { registerAs } from '@nestjs/config';
import validateConfig from '../../utilities/env-validator';

export const appConfigSchema = z.object({
  NODE_ENV: z.enum(NODE_ENV).default('development'),
  PORT: z.coerce.number().default(3000),
});

export type AppConfig = z.infer<typeof appConfigSchema>;

export default registerAs('app', (): AppConfig => {
  const objectToValidate = {
    NODE_ENV: process.env.NODE_ENV,
    PORT: process.env.PORT,
  };

  return validateConfig(appConfigSchema, objectToValidate);
});
