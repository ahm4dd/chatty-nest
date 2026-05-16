import { pgTable, text, timestamp, index } from 'drizzle-orm/pg-core';

/**
 * Verifications table definition
 *
 * Stores pending verifications for user identifiers (e.g., email, phone, password reset, 2FA) with expiration.
 */
export const verifications = pgTable(
  'verifications',
  {
    id: text('id').primaryKey(),

    userId: text('user_id').notNull(),

    // The type of verification (e.g., 'email', 'phone')
    identifier: text('identifier').notNull(),

    // The value to be verified (e.g., email address, phone number)
    value: text('value').notNull(),

    // When the verification expires
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),

    createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
  },
  (table) => [index('verifications_identifier_idx').on(table.identifier)],
);

/**
 * Verification database type (inferred from the verifications table schema select)
 */
export type VerificationDatabase = typeof verifications.$inferSelect;

/**
 * Verification insert type (inferred from the verifications table schema insert)
 */
export type InsertVerificationDatabase = typeof verifications.$inferInsert;
