import { pgTable, text } from 'drizzle-orm/pg-core';
import { users } from './users.schema.js';
import { timestamp } from 'drizzle-orm/pg-core';
import { uniqueIndex } from 'drizzle-orm/pg-core';
import { index } from 'drizzle-orm/pg-core';

/**
 * Authentication provider types
 *
 * Defines the supported providers for user authentication. This is used in the account.providerId field
 */
export type AuthProvider =
  | 'google'
  | 'github'
  | 'email'
  | 'phone'
  | 'saml'
  | 'oidc';

/**
 * Account table definition
 *
 * Represents an authentication account linked to a user. Supports multiple providers (OAuth, email/password, etc.)
 * Follows Better Auth conventions for future migration compatibility.
 *
 * Better Auth compatible fields:
 *   userId, providerId, accountId, accessToken, refreshToken, idToken, accessTokenExpiresAt, refreshTokenExpiresAt
 *
 * Extended fields (business-specific, compatible with Better Auth additionalFields):
 *   passwordHash (for email/password provider)
 */
export const accounts = pgTable(
  'accounts',
  {
    // Primary key (text, generated using nanoid)
    id: text('id').primaryKey(),

    // Associated user
    userId: text('user_id')
      .notNull()
      .references(() => users.id, {
        onDelete: 'cascade',
      }),

    // Required by Better Auth
    accountId: text('account_id').notNull(), // SSO provided account ID, or equaivalent to userId for credential accounts
    providerId: text('provider_id').notNull(), // e.g., 'google', 'github', 'email', 'credential', etc.

    // Required for OAuth
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),

    accessTokenExpiresAt: timestamp('access_token_expires_at', {
      withTimezone: true,
    }),
    refreshTokenExpiresAt: timestamp('refresh_token_expires_at', {
      withTimezone: true,
    }),

    // ID token returned to contain basic user info (e.g., for Google provider)
    idToken: text('id_token'),
    scope: text('scope'), // e.g., 'read:user repo', etc.

    // For email/password provider (local, only when providerId = 'email' or 'credential')
    passwordHash: text('password_hash'),

    // Timestamps
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex('account_provider_id_idx').on(
      table.providerId,
      table.accountId,
    ),
    index('account_user_id_idx').on(table.userId),
  ],
);

/**
 * Account database type (inferred from the accounts table schema select)
 */
export type AccountDatabase = typeof accounts.$inferSelect;

/**
 * New account database type (inferred from the accounts table schema insert)
 */
export type NewAccountDatabase = typeof accounts.$inferInsert;
