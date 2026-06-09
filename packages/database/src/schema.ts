/**
 * Explicit schema object for Drizzle ORM
 *
 * This file consolidates all database tables into a single object for consistent
 * type resolution across the monorepo. Importing this avoids module resolution
 * conflicts that arise from namespace imports and typeof inference.
 */

import { users, accounts, sessions, verifications } from './schemas/index.js';

export const schema = {
  users,
  accounts,
  sessions,
  verifications,
} as const;

export type Schema = typeof schema;
