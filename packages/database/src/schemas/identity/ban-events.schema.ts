import { sql } from 'drizzle-orm';
import { check, index, pgEnum, pgTable, text, timestamp, varchar } from 'drizzle-orm/pg-core';
import { users } from './users.schema.js';

/**
 * Ban action enum
 *
 * Defines the possible actions for ban events: BANNED or UNBANNED
 */
export const banActionEnum = pgEnum('ban_action', ['BANNED', 'UNBANNED']);

/**
 * Ban events table definition
 *
 * Append-only audit log for user ban/unban actions. Each entry records
 * the action, reason, optional expiration, and who performed it.
 */
export const banEvents = pgTable(
  'ban_events',
  {
    id: text('id').primaryKey(),

    // The user who was banned/unbanned
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    // Whether this event banned or unbanned the user
    action: banActionEnum('action').notNull(),

    // Reason for the ban (optional)
    reason: varchar('reason', { length: 1000 }),

    // When the ban expires (only meaningful for BANNED actions)
    expiresAt: timestamp('expires_at', { withTimezone: true }),

    // Who performed the action (nullable if the user is deleted)
    createdBy: text('created_by').references(() => users.id, { onDelete: 'set null' }),

    // When this event was recorded
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index('ban_events_user_created_idx').on(table.userId, table.createdAt),

    // Only allow expiresAt to be set for BANNED actions
    check(
      'chk_expires_at_only_for_bans',
      sql`${table.action} = 'BANNED' OR ${table.expiresAt} IS NULL`,
    ),
  ],
);
