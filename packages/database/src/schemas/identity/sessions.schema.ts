import { users } from './users.schema.js';
import {
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

/**
 * Sessions table definition
 *
 * Represents an active session for a user. Supports tracking of hashed refresh tokens, expiration, and device info.
 * Follows Better Auth conventions for future migration compatibility.
 *
 * Better Auth compatible fields:
 *   userId, refreshTokenHash, expiresAt, ipAddress, userAgent
 *
 * Extended fields (business-specific, compatible with Better Auth additionalFields):
 *   impersonatedBy (tracks if the session was created via impersonation by an admin)
 */
export const sessions = pgTable(
  'sessions',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, {
        onDelete: 'cascade',
      }),

    // TODO: Better auth compatibility: rename to refreshTokenHash to token (session_token)
    refreshTokenHash: text('refresh_token_hash').notNull().unique(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),

    // This field is used to track if the session was created via impersonation (admin acting as user)
    impersonatedBy: text('impersonated_by'),

    // Device info (Better Auth compatible)
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),

    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index('session_user_id_idx').on(table.userId),
    uniqueIndex('session_refresh_token_hash_idx').on(table.refreshTokenHash),
    index('session_expires_at_idx').on(table.expiresAt),
  ],
);

/**
 * Session database type (inferred from the sessions table schema select)
 */
export type SessionDatabase = typeof sessions.$inferSelect;

/**
 * New session database type (inferred from the sessions table schema insert)
 */
export type NewSessionDatabase = typeof sessions.$inferInsert;
