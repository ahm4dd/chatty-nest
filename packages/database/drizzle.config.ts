import { defineConfig } from 'drizzle-kit';
import { z } from 'zod';
import { validateConfig } from '@chatty-nest/shared-utils';

const env = validateConfig(
  z.object({
    DATABASE_URL: z.url(),
  }),
  process.env.DATABASE_URL ? { DATABASE_URL: process.env.DATABASE_URL } : {},
);

export default defineConfig({
  schema: ['./src/schemas'],
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: env.DATABASE_URL,
  },
});
